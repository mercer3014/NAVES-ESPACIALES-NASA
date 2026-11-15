// Disk-gap-band parachute, aeroshell and thruster dust. Lines meet a bridle on the backshell.
import { BRIDLE_DROP } from '../game/expeditions/mars-present.js';
import { MARS_SUN } from './mars-terrain.js';

const GORES = 28;

const CHUTE_VERT = /* glsl */`uniform float uTime;
uniform float uAmp;
attribute float aGore;
varying float vGore;
varying vec3 vW;
void main(){
  vGore=aGore;
  vec3 p=position;
  float ang=atan(p.x,p.z);
  float edge=smoothstep(0.15,1.0,length(p.xz)/6.8);
  float flutter=sin(ang*5.0+uTime*2.3)*0.55+sin(ang*11.0-uTime*3.4+p.y)*0.28;
  float rip=sin(length(p.xz)*1.5-uTime*2.1);
  vec3 n=normalize(vec3(p.x,0.45,p.z));
  p+=n*flutter*uAmp*edge*(0.7+0.3*rip);
  vec4 w=modelMatrix*vec4(p,1.0);
  vW=w.xyz;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

const CHUTE_FRAG = /* glsl */`uniform vec3 uSun;
varying float vGore;
varying vec3 vW;
void main(){
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
  float ndl=clamp(abs(dot(normalize(n),uSun)),0.0,1.0);
  vec3 orange=vec3(0.93,0.32,0.08);
  vec3 white=vec3(0.97,0.95,0.90);
  vec3 c=mix(white,orange,step(0.5,vGore));
  c*=0.78+0.22*ndl;
  gl_FragColor=vec4(c,1.0);
}`;

function goreColor(i) { return (Math.floor(i) % 2) ? 1 : 0; }

function pushTri(pos, gore, idx, a, b, c, g) {
  const base = pos.length / 3;
  pos.push(...a, ...b, ...c);
  gore.push(g, g, g);
  idx.push(base, base + 1, base + 2);
}

function buildCanopy(THREE) {
  const pos = [], gore = [], idx = [];
  const diskR = 6.4;
  const rings = 7;
  for (let i = 0; i < GORES; i++) {
    const g = goreColor(i);
    const a0 = (i / GORES) * Math.PI * 2;
    const a1 = ((i + 1) / GORES) * Math.PI * 2;
    for (let y = 0; y < rings; y++) {
      const v0 = y / rings, v1 = (y + 1) / rings;
      const phi0 = v0 * 1.02, phi1 = v1 * 1.02;
      const y0 = Math.cos(phi0) * 2.35 + 0.2;
      const y1 = Math.cos(phi1) * 2.35 + 0.2;
      const r0 = Math.sin(phi0) * diskR;
      const r1 = Math.sin(phi1) * diskR;
      const p00 = [Math.cos(a0) * r0, y0, Math.sin(a0) * r0];
      const p10 = [Math.cos(a1) * r0, y0, Math.sin(a1) * r0];
      const p01 = [Math.cos(a0) * r1, y1, Math.sin(a0) * r1];
      const p11 = [Math.cos(a1) * r1, y1, Math.sin(a1) * r1];
      pushTri(pos, gore, idx, p00, p01, p11, g);
      pushTri(pos, gore, idx, p00, p11, p10, g);
    }
    const bandTop = 0.05, bandBot = -1.25;
    const rt = 6.7, rb = 6.25;
    const rows = 3;
    for (let y = 0; y < rows; y++) {
      const t0 = y / rows, t1 = (y + 1) / rows;
      const y0 = bandTop + (bandBot - bandTop) * t0;
      const y1 = bandTop + (bandBot - bandTop) * t1;
      const r0 = rt + (rb - rt) * t0;
      const r1 = rt + (rb - rt) * t1;
      const p00 = [Math.cos(a0) * r0, y0, Math.sin(a0) * r0];
      const p10 = [Math.cos(a1) * r0, y0, Math.sin(a1) * r0];
      const p01 = [Math.cos(a0) * r1, y1, Math.sin(a0) * r1];
      const p11 = [Math.cos(a1) * r1, y1, Math.sin(a1) * r1];
      pushTri(pos, gore, idx, p00, p11, p01, g);
      pushTri(pos, gore, idx, p00, p10, p11, g);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aGore', new THREE.Float32BufferAttribute(gore, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const anchors = [];
  for (let i = 0; i < GORES; i++) {
    const a = ((i + 0.5) / GORES) * Math.PI * 2;
    anchors.push(new THREE.Vector3(Math.cos(a) * 6.25, -1.25, Math.sin(a) * 6.25));
  }
  return { geo, anchors };
}

function flutterAnchor(THREE, rest, time, amp) {
  const ang = Math.atan2(rest.x, rest.z);
  const edge = Math.min(1, rest.length() / 6.6);
  const flutter = Math.sin(ang * 5 + time * 2.3) * 0.55 + Math.sin(ang * 11 - time * 3.4 + rest.y) * 0.28;
  const n = new THREE.Vector3(rest.x, 0.45, rest.z).normalize();
  return rest.clone().addScaledVector(n, flutter * amp * edge);
}

function buildRibbons(THREE, anchors) {
  const n = anchors.length;
  const pos = new Float32Array(n * 4 * 3);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

function writeRibbon(THREE, pos, i, a, b, width) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  side.normalize().multiplyScalar(width);
  const o = i * 12;
  pos[o] = a.x + side.x; pos[o + 1] = a.y; pos[o + 2] = a.z + side.z;
  pos[o + 3] = a.x - side.x; pos[o + 4] = a.y; pos[o + 5] = a.z - side.z;
  pos[o + 6] = b.x - side.x; pos[o + 7] = b.y; pos[o + 8] = b.z - side.z;
  pos[o + 9] = b.x + side.x; pos[o + 10] = b.y; pos[o + 11] = b.z + side.z;
}

function softDust(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(c);
  return map;
}

export function buildEdl(THREE) {
  const root = new THREE.Group();
  const { geo, anchors } = buildCanopy(THREE);
  const cloth = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.22 },
      uSun: { value: new THREE.Vector3(MARS_SUN.x, MARS_SUN.y, MARS_SUN.z).normalize() },
    },
    vertexShader: CHUTE_VERT,
    fragmentShader: CHUTE_FRAG,
    side: THREE.DoubleSide,
    toneMapped: true,
  });
  const canopy = new THREE.Mesh(geo, cloth);
  canopy.castShadow = true;
  canopy.frustumCulled = false;
  const ribbons = buildRibbons(THREE, anchors);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xe7e2d8, side: THREE.DoubleSide });
  const lines = new THREE.Mesh(ribbons, lineMat);
  lines.frustumCulled = false;
  const bridle = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.035, 8, 18),
    new THREE.MeshStandardMaterial({ color: 0x8d9498, metalness: 0.7, roughness: 0.35 }),
  );
  bridle.rotation.x = Math.PI / 2;
  bridle.position.y = -BRIDLE_DROP;
  const chute = new THREE.Group();
  chute.add(canopy, lines, bridle);
  chute.userData.anchors = anchors;

  const shellMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d4, roughness: 0.48, metalness: 0.08 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x6e4a32, roughness: 0.6, metalness: 0.15 });
  const backshell = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.2, 1.62),
    new THREE.Vector2(0.55, 1.4),
    new THREE.Vector2(1.55, 0.95),
    new THREE.Vector2(2.15, 0.28),
    new THREE.Vector2(2.05, 0),
  ], 28), shellMat);
  cone.castShadow = true;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.16, 0.16, 28), bandMat);
  band.position.y = 0.22;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), bandMat);
  cap.position.y = 1.62;
  backshell.add(cone, band, cap);
  // Chute hangs from the backshell mouth so the bridle, not the rover, takes the lines.
  chute.position.y = 1.62 + BRIDLE_DROP;
  backshell.add(chute);

  const heatMat = new THREE.MeshStandardMaterial({ color: 0x3a241c, roughness: 0.82, metalness: 0.12 });
  const heatshield = new THREE.Mesh(new THREE.SphereGeometry(2.25, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), heatMat);
  heatshield.rotation.x = Math.PI;
  heatshield.scale.set(1.2, 0.5, 1.2);
  heatshield.castShadow = true;
  const heat = new THREE.Group();
  heat.add(heatshield);

  const N = 120;
  const dustPos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) dustPos[i * 3 + 1] = -80;
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMap = softDust(THREE);
  const dustMat = new THREE.PointsMaterial({
    color: 0xc47a48, size: 4.5, map: dustMap, transparent: true, opacity: 0.7,
    depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.userData.noShadow = true;
  const motes = Array.from({ length: N }, () => ({ life: 0, vx: 0, vy: 0, vz: 0 }));

  root.add(backshell, heat, dust);

  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  function update(t, dt, pose, rover, groundY) {
    cloth.uniforms.uTime.value = t;
    const amp = 0.16 + Math.sin(t * 1.7) * 0.04;
    cloth.uniforms.uAmp.value = amp;
    if (pose) {
      const sep = pose.backshellSep || 0;
      backshell.position.set(rover.x - sep * 7, rover.y + 1.35 + sep * 26, rover.z + sep * 5);
      backshell.rotation.set(sep * 0.4, t * 0.15 * sep, sep * 0.8);
      backshell.visible = sep < 0.985 && (pose.mode === 'chute' || sep > 0 || pose.chuteOpen);
      chute.visible = !!pose.chuteOpen && backshell.visible;
      const drop = 1 - (pose.heatshield || 0);
      heat.visible = drop < 0.98 && pose.mode === 'chute';
      heat.position.set(rover.x + drop * 9, rover.y - 0.35 - drop * drop * 22, rover.z + drop * 4);
      heat.rotation.set(drop * 2.4, drop * 1.2, drop * 0.5);
    } else {
      backshell.visible = false;
      heat.visible = false;
    }
    if (chute.visible) {
      const attr = ribbons.attributes.position;
      const arr = attr.array;
      const bridleY = -BRIDLE_DROP;
      for (let i = 0; i < anchors.length; i++) {
        const a = flutterAnchor(THREE, anchors[i], t, amp);
        const ang = ((i + 0.5) / GORES) * Math.PI * 2;
        tmpA.copy(a);
        tmpB.set(Math.cos(ang) * 0.32, bridleY, Math.sin(ang) * 0.32);
        writeRibbon(THREE, arr, i, tmpA, tmpB, 0.045);
      }
      attr.needsUpdate = true;
    }
    let alive = 0;
    const kick = pose && pose.mode !== 'chute' ? pose.dust || 0 : 0;
    dustMat.opacity = 0.15 + kick * 0.55;
    dust.visible = kick > 0.02 || motes.some((m) => m.life > 0);
    if (dust.visible) {
      const jets = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
      for (let i = 0; i < N; i++) {
        const m = motes[i];
        if (m.life <= 0 && kick > 0.02 && Math.random() < kick * 0.35) {
          const j = jets[i % 4];
          m.life = 0.6 + Math.random() * 0.8;
          m.vx = (Math.random() - 0.5) * 1.4;
          m.vz = (Math.random() - 0.5) * 1.4;
          m.vy = 1.2 + Math.random() * 2.2 * kick;
          dustPos[i * 3] = rover.x + j[0] + (Math.random() - 0.5) * 0.4;
          dustPos[i * 3 + 1] = groundY + 0.15;
          dustPos[i * 3 + 2] = rover.z + j[1] + (Math.random() - 0.5) * 0.4;
        }
        if (m.life > 0) {
          m.life -= dt;
          dustPos[i * 3] += m.vx * dt;
          dustPos[i * 3 + 1] += m.vy * dt;
          dustPos[i * 3 + 2] += m.vz * dt;
          alive++;
        } else {
          dustPos[i * 3 + 1] = -80;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustGeo.computeBoundingSphere();
    }
    return alive;
  }

  return {
    root, backshell, chute, heat, dust, cloth,
    update,
    dispose() {
      geo.dispose(); ribbons.dispose(); cloth.dispose(); lineMat.dispose();
      shellMat.dispose(); bandMat.dispose(); heatMat.dispose();
      dustGeo.dispose(); dustMat.dispose(); dustMap.dispose();
      cone.geometry.dispose(); band.geometry.dispose(); cap.geometry.dispose();
      heatshield.geometry.dispose(); bridle.geometry.dispose();
    },
  };
}

export function bindWheels(rover) {
  const folds = [];
  rover.traverse((o) => {
    if (o.name === 'Wheels_objs' || o.name === 'suspension') {
      o.rotation.setFromQuaternion(o.quaternion);
      folds.push({ node: o, y: o.position.y, sy: o.scale.y, rx: o.rotation.x, wheel: o.name === 'Wheels_objs' });
    }
  });
  return function setWheels(k) {
    const t = k * k * (3 - 2 * k);
    for (const f of folds) {
      f.node.position.y = f.y + (1 - t) * (f.wheel ? 0.45 : 0.05);
      f.node.scale.y = f.sy * (0.32 + 0.68 * t);
      f.node.rotation.x = f.rx + (1 - t) * (f.wheel ? 1.05 : 0.35);
    }
  };
}
