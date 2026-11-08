// Eventos del cielo compartidos: meteoro, estrella fugaz, cometa y (misión 3) agujero negro.
// El anfitrión (o el jugador solo) los programa y los envía por la sala para que ambos vean lo mismo.
import { THREE, getWorld, onTick } from '../core/engine.js';
import { net, tx } from '../net/room.js';
import { on, dbg } from '../core/store.js';
import { extend } from '../core/i18n.js';
import { sfx } from '../core/audio.js';

extend({
  'sky.meteor': ['¡Mira arriba! Un meteoro cruzó el cielo.', 'Look up! A meteor just crossed the sky.'],
  'sky.star': ['¡Una estrella fugaz! Pide un deseo, astronauta.', 'A shooting star! Make a wish, astronaut.'],
  'sky.comet': ['Cometa a la vista. Su cola siempre apunta lejos del Sol.', 'Comet in sight. Its tail always points away from the Sun.'],
  'sky.bh': ['¡Alerta! Se formó un agujero negro… mira cómo curva la luz.', 'Alert! A black hole formed… look how it bends the light.'],
});
const rng = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const live = new Set();
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false };

const streakMat = (col, head) => new THREE.ShaderMaterial({
  ...ADD, uniforms: { uC: { value: new THREE.Color(...col) }, uH: { value: new THREE.Color(...head) }, uA: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform vec3 uC; uniform vec3 uH; uniform float uA; varying vec2 vUv;
    void main(){ float x=vUv.x, y=abs(vUv.y-.5)*2.; float w=mix(.12,1.,pow(x,1.5)); float core=exp(-pow(y/(w*.45+.02),2.)*3.);
      float body=pow(x,2.2)*core; float hd=exp(-pow((1.-x)*14.,2.))*exp(-y*y*6.);
      vec3 c=mix(uC,uH,smoothstep(.75,1.,x))*body*1.6+uH*hd*2.2; gl_FragColor=vec4(c*uA,1.); }`,
});
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.15, 'rgba(255,255,255,.75)'); r.addColorStop(0.4, 'rgba(255,255,255,.18)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const glow = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(...col), ...ADD })); m.scale.setScalar(s); return m; };

// Orienta un quad (eje X = dirección) de cara a la cámara
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
function faceAlong(mesh, from, dir, len, wid, camPos) {
  _x.copy(dir).normalize(); _z.copy(camPos).sub(from).normalize(); _y.crossVectors(_z, _x).normalize(); _z.crossVectors(_x, _y);
  _m.makeBasis(_x.clone().multiplyScalar(len), _y.clone().multiplyScalar(wid), _z); mesh.matrixAutoUpdate = false;
  mesh.matrix.copy(_m).setPosition(from.clone().addScaledVector(_x, -len / 2)); mesh.matrixWorldNeedsUpdate = true;
}
// Dirección hacia un punto de la parte alta de la pantalla (donde casi siempre hay cielo)
function skyDir(W, R, ny = [0.25, 0.8], nx = 0.75) {
  const c = W.camera; c.updateMatrixWorld();
  const v = new THREE.Vector3((R() * 2 - 1) * nx, ny[0] + R() * (ny[1] - ny[0]), 0.5).unproject(c);
  return v.sub(c.position).normalize();
}
function spawn(k, seed) {
  const W = getWorld(); if (!W?.scene || !W.camera) return null;
  const fogL = W.scene.fog?.color ? W.scene.fog.color.r + W.scene.fog.color.g + W.scene.fog.color.b : 0; if (fogL > 0.6) return null; // cielo de día (rampa)
  const R = rng(seed), D = THREE.MathUtils.clamp(W.camera.far * 0.45, 200, 1600), cam = W.camera.position;
  const g = new THREE.Group(); g.renderOrder = -1; g.position.copy(cam); W.scene.add(g);
  const ev = { g, W, t: 0, k, update: null, dur: 1 };
  if (k === 'meteor' || k === 'star') {
    const star = k === 'star', dir0 = skyDir(W, R, star ? [0.4, 0.85] : [0.3, 0.75]);
    const P0 = dir0.clone().multiplyScalar(D); const side = new THREE.Vector3().crossVectors(dir0, new THREE.Vector3(0, 1, 0)).normalize();
    const mv = side.multiplyScalar(R() < 0.5 ? 1 : -1).addScaledVector(new THREE.Vector3(0, -1, 0), 0.35 + R() * 0.5).normalize();
    const travel = D * (star ? 0.45 : 0.32), len = D * (star ? 0.16 : 0.2), wid = D * (star ? 0.003 : 0.006);
    const mat = streakMat(star ? [0.55, 0.7, 1] : [1, 0.55, 0.25], star ? [1, 1, 1] : [0.85, 1, 0.8]);
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0).translate(-0.5, 0, 0), mat); q.frustumCulled = false; g.add(q);
    const head = glow(star ? [0.9, 0.95, 1] : [1, 0.9, 0.7], wid * 9); g.add(head);
    ev.dur = star ? 0.75 + R() * 0.3 : 1.3 + R() * 0.5; const flare = !star && R() < 0.7;
    ev.update = (p) => {
      const pos = P0.clone().addScaledVector(mv, travel * p); const a = Math.sin(Math.min(1, p * 1.15) * Math.PI) ** 0.6;
      const fl = flare ? Math.exp(-Math.pow((p - 0.78) * 9, 2)) * 2.5 : 0;
      faceAlong(q, pos, mv, len * (0.4 + 0.6 * Math.min(1, p * 3)), wid * (1 + fl * 0.6), new THREE.Vector3()); mat.uniforms.uA.value = a;
      head.position.copy(pos); head.material.opacity = a; head.scale.setScalar(wid * (9 + fl * 14));
    };
    sfx('hover', { vol: 0.05 });
  } else if (k === 'comet') {
    const dir0 = skyDir(W, R, [0.35, 0.7], 0.6), P0 = dir0.clone().multiplyScalar(D);
    const sun = new THREE.Vector3(-0.94, 0.3, 0.18).normalize(), away = sun.clone().negate();
    const tail = away.clone().addScaledVector(dir0, -away.dot(dir0)).normalize(); // proyectada en el plano del cielo
    const dust = streakMat([1, 0.9, 0.7], [1, 1, 0.95]), ion = streakMat([0.35, 0.6, 1], [0.8, 0.9, 1]);
    const qd = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dust), qi = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ion); qd.frustumCulled = qi.frustumCulled = false;
    const coma = glow([0.7, 1, 0.85], D * 0.055), nuc = glow([1, 1, 1], D * 0.014); g.add(qd, qi, coma, nuc);
    const drift = new THREE.Vector3().crossVectors(dir0, tail).normalize();
    ev.dur = 24;
    ev.update = (p) => {
      const a = Math.min(1, p * 6, (1 - p) * 5) * 0.8; const pos = P0.clone().addScaledVector(drift, D * 0.04 * (p - 0.5));
      const tdir = tail.clone().negate(); // el quad crece hacia +X = cabeza, así que la cola va detrás
      const bend = drift.clone().multiplyScalar(0.18); const dd = tdir.clone().add(bend).normalize();
      faceAlong(qd, pos, dd, D * 0.26, D * 0.045, new THREE.Vector3()); faceAlong(qi, pos, tdir, D * 0.36, D * 0.016, new THREE.Vector3());
      dust.uniforms.uA.value = a * 0.9; ion.uniforms.uA.value = a * 0.8; coma.position.copy(pos); nuc.position.copy(pos); coma.material.opacity = a * 0.7; nuc.material.opacity = a;
    };
  } else if (k === 'bh') {
    const dir0 = skyDir(W, R, [0.4, 0.6], 0.45), P = dir0.clone().multiplyScalar(D * 0.9), r = D * 0.035;
    const hole = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false })); hole.renderOrder = 2;
    const diskMat = new THREE.ShaderMaterial({ ...ADD, side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'uniform float uR; varying vec2 vP; void main(){ vP=position.xy/uR; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform float uT; uniform float uA; uniform float uR; varying vec2 vP;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }
        float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        void main(){ float rr=length(vP); float a=atan(vP.y,vP.x); float x=(rr-1.4)/2.6; if(x<0.||x>1.) discard;
          float sw=n(vec2(a*6.+uT*2.5/(rr*rr*.3+.3), rr*3.))*.6+n(vec2(a*14.-uT*3., rr*9.))*.4;
          float prof=pow(1.-x,1.6)*smoothstep(0.,.06,x); float dop=1.+.75*sin(a); // lado que se acerca más brillante
          vec3 hot=mix(vec3(1.,.42,.12),vec3(1.,.93,.8),pow(1.-x,3.)); gl_FragColor=vec4(hot*prof*(.55+sw*.9)*dop*uA*1.6,1.); }` });
    diskMat.uniforms.uR = { value: r };
    const disk = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 4, 128, 1), diskMat);
    const ringMat = new THREE.ShaderMaterial({ ...ADD, uniforms: { uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vU; void main(){ vU=uv*2.-1.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform float uA; uniform float uT; varying vec2 vU; void main(){ float rr=length(vU)*3.; float a=atan(vU.y,vU.x);
        float ph=exp(-pow((rr-1.08)*9.,2.))*1.8; // anillo de fotones
        float arc=exp(-pow((rr-1.55-.25*abs(sin(a)))*5.,2.))*pow(abs(sin(a)),3.)*.9; // disco trasero lenteado (arriba y abajo)
        float halo=exp(-max(rr-1.,0.)*1.6)*.12*step(1.,rr);
        vec3 c=vec3(1.,.8,.55)*(ph+arc)+vec3(.4,.5,.9)*halo; gl_FragColor=vec4(c*uA*step(1.0,rr+.04),1.); }` });
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(r * 6, r * 6), ringMat);
    const shock = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: 0x9fc4ff, ...ADD, opacity: 0, side: THREE.DoubleSide }));
    const bh = new THREE.Group(); bh.position.copy(P); bh.add(hole, disk, ring, shock); g.add(bh);
    disk.rotation.x = -Math.PI / 2 + 0.22; ev.dur = 20;
    ev.update = (p, dt) => {
      const tt = p * ev.dur, grow = THREE.MathUtils.smoothstep(tt, 0, 3) * (1 - THREE.MathUtils.smoothstep(tt, ev.dur - 2.2, ev.dur));
      bh.scale.setScalar(Math.max(0.001, grow)); bh.lookAt(g.worldToLocal(W.camera.position.clone())); // el plano del anillo mira a la cámara
      diskMat.uniforms.uT.value += dt; diskMat.uniforms.uA.value = grow; ringMat.uniforms.uA.value = grow;
      const s = THREE.MathUtils.clamp((tt - 0.4) / 2.2, 0, 1); shock.scale.setScalar(r * (1.2 + s * 6)); shock.material.opacity = s > 0 && s < 1 ? (1 - s) * 0.35 : 0;
    };
    sfx('lowdown', { vol: 0.35 });
  }
  live.add(ev); return ev;
}
onTick((dt) => {
  for (const ev of live) {
    ev.t += dt; const p = Math.min(1, ev.t / ev.dur);
    if (getWorld() !== ev.W || p >= 1) { ev.g.removeFromParent(); ev.g.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); live.delete(ev); continue; }
    ev.g.position.copy(ev.W.camera.position); ev.update(p, dt);
  }
});

// Programación sincronizada
export function skyEvent(k, seed = (Math.random() * 1e9) | 0, { send = true } = {}) {
  if (send && net.code && !net.solo) tx({ t: 'sky', k, s: seed });
  const ev = spawn(k, seed);
  if (ev && net.solo) import('../ui/pancho.js').then(({ pancho }) => { if (pancho.el.classList.contains('hidden') && Math.random() < 0.6) setTimeout(() => pancho.say('sky.' + k, { ms: 3200 }), k === 'bh' ? 2500 : 900); });
  dbg('lastSky', { k, seed, shown: !!ev, at: Date.now() });
  return ev;
}
on('net:sky', (m) => skyEvent(m.k, m.s, { send: false }));
let nextAt = performance.now() + 35000 + Math.random() * 30000;
setInterval(() => {
  if (new URLSearchParams(location.search).has('nosky')) return;
  if (!net.solo && !net.host) return; // solo el anfitrión decide, así ambos ven el mismo evento
  if (performance.now() < nextAt || document.hidden) return;
  const r = Math.random();
  const k = r < 0.06 ? 'bh' : r < 0.5 ? 'star' : r < 0.85 ? 'meteor' : 'comet';
  skyEvent(k); nextAt = performance.now() + (k === 'comet' || k === 'bh' ? 90000 : 45000) + Math.random() * 60000;
}, 2000);
dbg('sky', (k = 'meteor', s) => skyEvent(k, s));
