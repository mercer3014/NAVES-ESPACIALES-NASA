// Plataforma 39A (mañana de julio) + Saturno V con etapas separables, penacho F-1 por capas, humo/vapor GPU,
// hielo que se desprende, destellos de separación, calima y bloom (calidad alta), cielo que pasa a espacio
import { THREE, model, modelAnim, fit, Q, renderer } from '../core/engine.js';
import { twinkleStars, dotTex, earth, tickAll } from './space.js';
import { makePuffs, makePlume, makeFlashes, makePost, puffTex } from './fx.js';
export const H = 110; // altura del Saturno V en m (unidades de escena)
export const CUTS = [0.385, 0.615, 0.93]; // S-IC | S-II | S-IVB+naves | torre de escape (solo modelo antiguo)
export const BASE_Y = 26.53; // cubierta del Mobile Launcher = salida de las toberas F-1 (origen común de saturn-v / launch-tower / lc39a-*.glb); terreno del LC-39A en y = 0
const FB_DY = BASE_Y - 7.62; // el entorno procedural de respaldo se modeló con la cubierta a 7.62
const FLAME_Y = [0, 42.45, 65.05]; // *-thrust-point de S-IC, S-II y S-IVB (m sobre el origen del cohete)
const SEP_Y = [42.06, 69.0]; // planos de separación S-IC/S-II y S-II/S-IVB
const D = 2.56; // F-1 exteriores a 45° (centros medidos en s1c-engines-f1)
export const F1 = [[0, 0], [D, D], [-D, -D], [D, -D], [-D, D]]; // centro, par opuesto A, par opuesto B
const J2 = [[0, 0], [1.9, 1.9], [-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9]];
const SHORE = -1350; // z de la línea de costa (el Atlántico queda al este, aquí −Z)
const VAB = new THREE.Vector3(4300, 0, 2100);
const NOISE = `float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=.5; } return s; }`;

// Material estándar con color procedural por posición de mundo (sin texturas que se repitan)
function procMat(params, colorGLSL, extraUniforms = {}) {
  const m = new THREE.MeshStandardMaterial(params);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, extraUniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP;\n${Object.keys(extraUniforms).map((k) => `uniform ${extraUniforms[k].type || 'float'} ${k};`).join('\n')}\n${NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${colorGLSL}`);
  };
  m.customProgramCacheKey = () => colorGLSL.length + ':' + Object.keys(extraUniforms).join();
  return m;
}

export function makePad() {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 60000);
  scene.fog = new THREE.Fog(0xb9bcc4, 700, 12000);
  const sunDir = new THREE.Vector3(0.8, 0.26, -0.35).normalize();
  // cielo con gradiente controlado por altitud (0 suelo → 1 espacio)
  // Fullscreen sky in clip space. A fixed sphere is left behind above ~30 km and its
  // coarse triangles are clipped away by the ground telephoto (sub-degree FOV), which
  // clears the whole view to black or to an untextured grey.
  // earthRel is the horizon-sphere center minus the camera. A 6371 km mesh is not used:
  // its triangles are hundreds of kilometres wide, and a 60 km far plane clips them into a solid black wall.
  const skyU = { alt: { value: 0 }, sun: { value: sunDir }, invProj: { value: new THREE.Matrix4() }, camRot: { value: new THREE.Matrix3() }, earthRel: { value: new THREE.Vector3() }, earthR: { value: 1800 }, earthK: { value: 0 } };
  const skyGeo = new THREE.BufferGeometry();
  skyGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, fog: false, toneMapped: false, uniforms: skyU,
    vertexShader: `uniform mat4 invProj; uniform mat3 camRot; varying vec3 vD;
      void main(){ gl_Position=vec4(position.xy,0.,1.); vec4 r=invProj*vec4(position.xy,1.,1.); vD=normalize(camRot*r.xyz); }`,
    fragmentShader: `uniform float alt, earthR, earthK; uniform vec3 sun, earthRel; varying vec3 vD;
      void main(){ float h=clamp(vD.y,-.2,1.); vec3 zen=mix(vec3(.2,.38,.68),vec3(.0,.0,.02),smoothstep(.15,.8,alt)); vec3 hor=mix(vec3(.86,.8,.74),vec3(.25,.45,.85),smoothstep(.0,.6,alt));
      hor=mix(hor,vec3(.02,.03,.08),smoothstep(.6,1.,alt)); vec3 c=mix(hor,zen,pow(max(h,0.),.5)); float s=max(dot(vD,sun),0.); c+=vec3(1.,.8,.55)*pow(s,8.)*.45*(1.-alt*.6)+vec3(1.)*pow(s,500.)*3.;
      if(vD.y<0.) c=mix(c,vec3(.6,.62,.66),smoothstep(0.,-.05,vD.y)*(1.-alt));
      if(earthK>0.001){ float b=dot(vD,earthRel); float h2=b*b-(dot(earthRel,earthRel)-earthR*earthR);
        if(h2>0.){ float t=b-sqrt(h2); if(t<0.) t=b+sqrt(h2);
          if(t>0.){ vec3 n=normalize(t*vD-earthRel); float nd=max(dot(n,sun),0.); float fr=pow(1.-max(dot(n,-vD),0.),2.4);
            vec3 g=mix(vec3(.04,.1,.22), vec3(.45,.62,.55), nd); g=mix(g, vec3(.55,.72,.9), smoothstep(.15,.85,fr));
            c=mix(c,g,earthK); } } }
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }` }));
  sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky);
  const stars = twinkleStars(Q.high ? 4000 : 1800, 20000); scene.add(stars); stars.visible = false;
  scene.add(new THREE.HemisphereLight(0xc4dcff, 0x4a4632, 1.15));
  const sunL = new THREE.DirectionalLight(0xfff0dc, 3.1); sunL.target.position.set(0, BASE_Y - 12, 0); sunL.position.copy(sunDir).multiplyScalar(400).add(sunL.target.position); scene.add(sunL, sunL.target);
  if (Q.high) { sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0004; Object.assign(sunL.shadow.camera, { left: -140, right: 140, top: 160, bottom: -60, far: 1200 }); }
  // ---------- entorno: matorral costero, playa, Atlántico, caminos, edificios lejanos, línea de árboles, nubes ----------
  const ground = new THREE.Group(); scene.add(ground); const landU = { uT: { value: 0 } };
  const landG = new THREE.PlaneGeometry(26000, 26000, 1, 1); landG.rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(landG, procMat({ color: 0xffffff, roughness: 1 }, `
    vec2 w=vWP.xz; float shore=${SHORE.toFixed(1)}+60.*sin(w.x/900.)+25.*sin(w.x/260.+1.3);
    if(w.y<shore-4.) discard;
    float n=fbm(w*.004), n2=fbm(w*.03+3.), n3=vn(w*.25);
    vec3 scrub=mix(vec3(.17,.21,.11), vec3(.31,.33,.18), n); scrub=mix(scrub, vec3(.36,.31,.2), smoothstep(.55,.75,n2)*.6); scrub*= .8+.35*n3;
    float marsh=smoothstep(.62,.7,fbm(w*.0012+9.)); scrub=mix(scrub, vec3(.2,.27,.24)*(.8+.3*n2), marsh*.7);
    float beach=1.-smoothstep(shore+6., shore+60.+20.*n2, w.y); vec3 sand=mix(vec3(.74,.69,.58), vec3(.86,.82,.72), n3);
    vec3 c=mix(scrub, sand, beach); c=mix(c, vec3(.93,.95,.96), (1.-smoothstep(shore-4.,shore+5.,w.y))*.85*(.6+.4*vn(vec2(w.x*.05, uT*.4))));
    float r=length(w); float clear=1.-smoothstep(95.,175.+40.*n2,r); vec3 grav=mix(vec3(.62,.6,.55), vec3(.74,.72,.66), n3); c=mix(c, grav, clear*.9);
    vec2 dv=normalize(vec2(${VAB.x.toFixed(1)}, ${VAB.z.toFixed(1)})); float along=dot(w,dv); float side=abs(w.x*dv.y-w.y*dv.x);
    float crawl=step(80.,along)*step(along,${VAB.length().toFixed(1)})*(1.-smoothstep(28.,32.,side))*(.75+.25*step(6.,abs(side-14.)));
    c=mix(c, vec3(.82,.78,.68)*(.85+.2*n3), crawl);
    float road=(1.-smoothstep(4.,5.,abs(w.x+w.y*.2-260.)))*step(-900.,w.y)*step(w.y,2000.); c=mix(c, vec3(.18,.18,.19), road*.9);
    diffuseColor.rgb*=c;`, landU));
  land.receiveShadow = true; ground.add(land);
  // océano: normal procedural animada + brillo especular del sol
  const nc = document.createElement('canvas'); nc.width = nc.height = 256; { const x = nc.getContext('2d'), id = x.createImageData(256, 256), hgt = new Float32Array(256 * 256);
    for (let o = 0; o < 5; o++) { const f = 2 ** (o + 2), ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6]; for (let y = 0; y < 256; y++) for (let xx = 0; xx < 256; xx++) hgt[y * 256 + xx] += (Math.sin((xx / 256) * f * 6.283 + ph[0] + Math.sin((y / 256) * 6.283 * 2 + ph[2])) + Math.sin(((xx + y) / 256) * f * 6.283 * 0.7 + ph[1])) / (o + 1); }
    for (let y = 0; y < 256; y++) for (let xx = 0; xx < 256; xx++) { const i = y * 256 + xx, dx = hgt[y * 256 + ((xx + 1) & 255)] - hgt[i], dy = hgt[((y + 1) & 255) * 256 + xx] - hgt[i]; const v = new THREE.Vector3(-dx * 1.4, -dy * 1.4, 1).normalize(); id.data.set([(v.x * 0.5 + 0.5) * 255, (v.y * 0.5 + 0.5) * 255, (v.z * 0.5 + 0.5) * 255, 255], i * 4); }
    x.putImageData(id, 0, 0); }
  const seaN = new THREE.CanvasTexture(nc); seaN.wrapS = seaN.wrapT = THREE.RepeatWrapping; seaN.repeat.set(220, 110); seaN.colorSpace = THREE.NoColorSpace;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 30000), new THREE.MeshStandardMaterial({ color: 0x1b4a66, roughness: 0.16, metalness: 0.05, normalMap: seaN, normalScale: new THREE.Vector2(0.55, 0.55) }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.6, SHORE - 15000 + 30); ground.add(sea);
  // plataforma octogonal de hormigón con quemaduras y la zanja de llamas (eje X)
  const conc = procMat({ color: 0xffffff, roughness: 0.92 }, `
    vec2 w=vWP.xz; float n=fbm(w*.08), n2=vn(w*.7); vec3 c=mix(vec3(.55,.54,.51), vec3(.68,.67,.63), n)*(.9+.15*n2);
    float sc=exp(-length(w*vec2(.6,1.))/35.); c=mix(c, vec3(.16,.15,.14), sc*.75*(.7+.5*n));
    float tr=(1.-smoothstep(8.,9.5,abs(w.y)))*step(26.,abs(w.x)); c=mix(c, vec3(.08,.075,.07), tr*step(vWP.y,.2)); diffuseColor.rgb*=c;`);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(70, 92, 10, 8), conc); pad.position.y = -5 + 0.01; pad.receiveShadow = true; ground.add(pad);
  const trenchM = new THREE.MeshStandardMaterial({ color: 0x18171a, roughness: 1 });
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(64, 18), trenchM); t.rotation.x = -Math.PI / 2; t.position.set(s * 62, 0.04, 0); ground.add(t); }
  // edificios lejanos: VAB, LCC, depósito de agua, torre del 39B; fachadas con paneles por shader y la niebla hace el resto
  const fac = procMat({ color: 0xffffff, roughness: 0.85 }, `
    vec3 p=vWP; float pan=step(.5,fract(p.y/6.))*.06+step(.92,fract((p.x+p.z)/9.))*.08; float band=step(fract(p.y/40.),.06)*.1;
    vec3 c=vec3(.78,.78,.76)-pan-band; diffuseColor.rgb*=c;`);
  const bld = (w, h, d, x, z, ry = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fac); b.position.set(x, h / 2, z); b.rotation.y = ry; ground.add(b); return b; };
  const ang = Math.atan2(VAB.x, VAB.z);
  bld(218, 160, 158, VAB.x, VAB.z, ang); bld(60, 30, 200, VAB.x + 180, VAB.z - 160, ang); bld(120, 22, 60, VAB.x - 260, VAB.z + 60, ang);
  { const tank = new THREE.Group(); const legM = new THREE.MeshStandardMaterial({ color: 0x9a9890, roughness: 0.7 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 42, 8), legM); c.position.y = 21; const s = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 10), new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.5 })); s.position.y = 48; tank.add(c, s); tank.position.set(-420, 0, 380); ground.add(tank); }
  { const t39b = new THREE.Group(); const rm = new THREE.MeshStandardMaterial({ color: 0x8a3a28, roughness: 0.8 }); const tw = new THREE.Mesh(new THREE.BoxGeometry(12, 120, 12), rm); tw.position.y = 60; const pb = new THREE.Mesh(new THREE.CylinderGeometry(60, 80, 9, 8), new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 1 })); pb.position.y = 4; t39b.add(tw, pb); t39b.position.set(-2400, 0, 2700); ground.add(t39b); }
  // línea de árboles en el horizonte: anillo con silueta recortada por ruido
  const treeM = new THREE.ShaderMaterial({ transparent: false, side: THREE.DoubleSide, uniforms: { fogC: { value: scene.fog.color }, tint: { value: new THREE.Color(0x3d4a35) } },
    vertexShader: `varying vec2 vUv; varying vec3 vWP; void main(){ vUv=uv; vWP=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vWP,1.); }`,
    fragmentShader: `uniform vec3 fogC,tint; varying vec2 vUv; varying vec3 vWP; ${NOISE}
      void main(){ float a=atan(vWP.z,vWP.x); float top=.35+.5*fbm(vec2(a*260.,0.))+.15*vn(vec2(a*1500.,1.)); if(vUv.y>top || vWP.z<${(SHORE + 200).toFixed(1)}) discard;
      float d=length(vWP.xz); vec3 c=mix(tint*(.75+.3*vUv.y), fogC, clamp(.55+d/40000.,0.,.92)); gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }` });
  for (const [r, hgt] of [[3200, 30], [6500, 55]]) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 160, 1, true), treeM); ring.position.y = hgt / 2 - 2; ground.add(ring); }
  // banco de cúmulos lejanos (sprites suaves)
  const clouds = new THREE.Group(); scene.add(clouds); { const cm = new THREE.SpriteMaterial({ map: puffTex(), color: 0xfaf6f0, transparent: true, depthWrite: false, fog: false, opacity: 0.85 });
    for (let i = 0; i < (Q.high ? 46 : 22); i++) { const a = (i / 46) * Math.PI * 2 + Math.random() * 0.2, r = 14000 + Math.random() * 6000; const s = new THREE.Sprite(cm); const w = 2500 + Math.random() * 3500; s.scale.set(w, w * (0.35 + Math.random() * 0.2), 1); s.position.set(Math.cos(a) * r, 500 + Math.random() * 900, Math.sin(a) * r); s.center.set(0.5, 0.3); clouds.add(s); } }
  // entorno LC-39A del artista (origen = cubierta del ML): sustituye todo el entorno procedural de arriba, que queda de respaldo
  const procEnv = [...ground.children]; procEnv.forEach((o) => (o.position.y += FB_DY));
  const lods = []; let envSea = null, envSurf = null; const SHADOW = /^pad-(mound|deflectors|tanks|light-masts)/, RECV = /^(pad-mound|terrain-near)/;
  const envReady = Promise.all(['lc39a-terrain', 'lc39a-pad', 'lc39a-far'].map((n) => model(n))).then((gs) => {
    // las 3 raíces LC39A_* van con la misma transformación que el cohete y la torre; nunca se tocan los nodos de malla (cuantizados)
    const env = new THREE.Group(); env.name = 'lc39a'; env.position.y = BASE_Y;
    for (const g of gs) { g.traverse((o) => {
      if (o.userData?.lodMaxDistance) { const ms = []; o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); ms.push(m.material); } }); lods.push({ o, d: o.userData.lodMaxDistance, ms, f: 1 }); }
      if (!o.isMesh) return; const nm = (o.name || '') + ' ' + (o.parent?.name || ''); const nn = nm.split(' ');
      o.castShadow = nn.some((n) => SHADOW.test(n)); o.receiveShadow = nn.some((n) => RECV.test(n));
      if (o.material?.name === 'Sea') { envSea = o.material.normalMap; o.material.envMapIntensity = 1.6; }
      if (o.material?.name === 'Surf') { o.material.depthWrite = false; envSurf = o.material.map; } }); env.add(g); }
    procEnv.forEach((o) => (o.visible = false)); ground.add(env); api.env = env; return env;
  }).catch((e) => { console.warn('entorno LC-39A no disponible: uso el procedural', e); return null; });
  // placeholders (se quitan cuando llegan los modelos del artista)
  const ml = new THREE.Mesh(new THREE.BoxGeometry(48, 7, 40), new THREE.MeshStandardMaterial({ color: 0x6d6f73, roughness: 0.8 })); ml.position.set(0, 3.5 + FB_DY, 0); ml.castShadow = ml.receiveShadow = true; ground.add(ml);
  const tower = new THREE.Group(); ground.add(tower); tower.position.set(-22, 7 + FB_DY, 0);
  const red = new THREE.MeshStandardMaterial({ color: 0xb8321f, roughness: 0.6, metalness: 0.2 });
  const legG = new THREE.BoxGeometry(1, 125, 1); for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { const l = new THREE.Mesh(legG, red); l.position.set(x, 62.5, z); l.castShadow = true; tower.add(l); }
  const arms = []; for (const y of [38, 62, 80, 98]) { const a = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 3), red); a.geometry.translate(7, 0, 0); a.position.set(6, y - 7, 0); tower.add(a); arms.push(a); }
  // ---------- cohete ----------
  const rocket = new THREE.Group(); rocket.position.y = 7 + FB_DY; scene.add(rocket);
  const parts = []; // [0] S-IC [1] S-II [2] S-IVB+CSM [3] LES
  let mixer = null, retract = null; const sep = []; // piezas sueltas extra (anillo interetapa)
  const loadNew = Promise.all([modelAnim('saturn-v'), modelAnim('launch-tower')]).then(([sv, lt]) => {
    const shadow = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    shadow(sv.scene); shadow(lt.scene);
    ml.removeFromParent(); tower.removeFromParent(); arms.length = 0;
    lt.scene.position.set(0, BASE_Y, 0); ground.add(lt.scene);
    rocket.position.y = BASE_Y; rocket.add(sv.scene);
    mixer = new THREE.AnimationMixer(lt.scene);
    const clip = THREE.AnimationClip.findByName(lt.animations, 'swing-arms-retract');
    if (clip) { retract = mixer.clipAction(clip); retract.setLoop(THREE.LoopOnce); retract.clampWhenFinished = true; }
    const node = (n) => sv.scene.getObjectByName(n);
    for (const n of ['S1C', 'S2', null, 'LES']) parts.push({ g: n ? node(n) : null, pl: [], loc: [], free: false, v: new THREE.Vector3(), w: new THREE.Vector3(), node: true });
    api.newModel = true;
    // Etapa superior detallada del artista (S-IVB/IU/SLA + CSM Columbia). Su origen = nodo Spacecraft (y 85.68 del Saturn V). Si falla, queda la del Saturn V.
    Promise.all([model('s4b-sla'), model('csm-columbia')]).then(([s4, csm]) => {
      const up = new THREE.Group(); up.name = 'upper-detail'; up.position.set(0, 85.68, 0); up.add(s4); shadow(up);
      const dock = s4.getObjectByName('csm-dock-launch'); csm.position.set(0, (dock ? dock.position.y : 8.52) + 6.91, 0); up.add(csm); shadow(csm);
      for (const n of ['S4B', 'IU', 'CSM', 'SLA']) { const o = node(n); if (o) o.visible = false; } sv.scene.add(up); // ocultar antes de añadir (mismos nombres)
    }).catch((e) => console.warn('s4b-sla/csm-columbia no disponibles', e));
    return parts;
  });
  const ready = loadNew.catch((e) => { console.warn('saturn-v.glb no disponible, uso el modelo antiguo', e); return model('saturn_v'); }).then((o) => {
    if (o === parts) return parts;
    const base = fit(o, H); base.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.material = m.material.clone(); } });
    for (let i = 0; i < 4; i++) {
      const c = base.clone(true); const lo = i ? CUTS[i - 1] * H : -1e3, hi = i < 3 ? CUTS[i] * H : 1e3;
      const pl = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -lo), new THREE.Plane(new THREE.Vector3(0, -1, 0), hi)];
      c.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = pl; m.material.clipShadows = true; } });
      const g = new THREE.Group(); g.add(c); rocket.add(g); parts.push({ g, pl, loc: pl.map((q) => q.clone()), lo, hi, free: false, v: new THREE.Vector3(), w: new THREE.Vector3() });
    }
    return parts;
  }).catch((e) => console.error(e));
  // ---------- penachos: F-1 (S-IC), 5×J-2 (S-II), 1×J-2 (S-IVB) ----------
  const plumes = [
    makePlume({ layout: F1, r0: 1.9, len: 50, outerR: 8.5, outerLen: 230, intensity: 6.5, sheath: 1 }),
    makePlume({ layout: J2, r0: 0.95, len: 18, outerR: 3.6, outerLen: 54, hot: [0.95, 0.9, 1], warm: [0.8, 0.62, 1], intensity: 2.4, vacBoost: 0.8 }),
    makePlume({ layout: [[0, 0]], r0: 0.95, len: 16, outerR: 2.4, outerLen: 44, hot: [0.95, 0.9, 1], warm: [0.8, 0.62, 1], intensity: 2.8, vacBoost: 1 }),
  ];
  plumes.forEach((p, i) => { p.group.position.y = FLAME_Y[i]; rocket.add(p.group); p.set(0); });
  let active = 0; // etapa que empuja
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); glow.scale.setScalar(Q.high ? 40 : 60); glow.position.y = -6; rocket.add(glow);
  const flameLight = new THREE.PointLight(0xff9a40, 0, 700, 1.2); flameLight.position.y = -12; rocket.add(flameLight);
  // ---------- partículas ----------
  const smoke = makePuffs({ n: Q.high ? 2400 : 900, drag: 0.42, fadeIn: 0.04, fadeOut: 0.5, near: 6 });
  const steam = makePuffs({ n: Q.high ? 1100 : 450, drag: 0.8, fadeIn: 0.1, fadeOut: 0.6, near: 3 });
  const fire = makePuffs({ n: Q.high ? 500 : 220, drag: 1.2, additive: true, lit: false, fadeIn: 0.05, fadeOut: 0.7, near: 3 });
  for (const P of [smoke, steam]) { P.U.uSun.value.copy(sunDir); P.U.uGlowP.value.set(0, 6, 0); P.U.uGlowR.value = 55; }
  steam.U.uAmb.value.set(0.6, 0.65, 0.75); scene.add(smoke.mesh, steam.mesh, fire.mesh);
  // estela de humo del ascenso: sistema propio (no compite con las nubes del suelo) y emisión continua a lo largo del tramo recorrido
  const trail = makePuffs({ n: Q.high ? 2200 : 800, drag: 0.22, fadeIn: 0.015, fadeOut: 0.55, near: 8 }); trail.U.uSun.value.copy(sunDir); trail.U.uAmb.value.set(0.55, 0.6, 0.7); scene.add(trail.mesh);
  const tailPrev = new THREE.Vector3(), tailNow = new THREE.Vector3(); let tailOk = false;
  // hielo que se desprende de la S-IC con la vibración de la ignición
  const NI = Q.high ? 90 : 40; const iceG = new THREE.IcosahedronGeometry(1, 0); iceG.scale(1, 0.45, 0.8);
  const ice = new THREE.InstancedMesh(iceG, new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: 0.35 }), NI); ice.frustumCulled = false; ice.castShadow = false; scene.add(ice);
  const iceP = Array.from({ length: NI }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: 0, on: false })); let iceI = 0;
  const flashes = makeFlashes(scene);
  // Tierra desde arriba para la parte alta del ascenso
  const E = earth(6371, new THREE.Vector3(0.8, 0.3, -0.3).normalize()); E.visible = false; scene.add(E);
  const post = makePost(scene, camera);
  // estado de efectos
  const fx = { ullage: 0, aps: 0, les: 0, lesPos: new THREE.Vector3(), engines: [0, 0, 0, 0, 0], startT: [0, 0, 0, 0, 0] };
  const v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), up = new THREE.Vector3(), dm = new THREE.Object3D(), R = Math.random;
  const toWorld = (x, y, z, out = v3) => out.set(x, y, z).applyMatrix4(rocket.matrixWorld);
  let lastFrame = -1, shT = 0;
  const api = {
    scene, camera, rocket, parts, ready, envReady, env: null, arms, skyU, plumes, post, smoke, steam, fire, flashes, trail, sunDir,
    thrust: 0, shake: 0, alt: 0, phase: 'count',
    // empuje global de la etapa activa (0..1); las toberas individuales se encienden con setEngines()
    setThrust(k) {
      if (!Number.isFinite(k)) k = 0; k = Math.max(0, Math.min(1, k));
      this.thrust = k; const p = plumes[active];
      // Vacuum growth is real, but uncapped it becomes a screen-filling cone and hides the vehicle.
      const vac = Math.min(0.32, active ? 0.55 : Math.min(1, (this.alt / 32000) ** 0.75));
      p.set(k, { vac, t: shT });
      if (p.I0 == null) { p.I0 = [p.coreM.uniforms.I.value, p.outM.uniforms.I.value]; } p.coreM.uniforms.I.value = p.I0[0] * (1 + vac * 0.35); p.outM.uniforms.I.value = p.I0[1] * (1 + vac * 0.8);
      if (active === 0) p.setEngines(fx.engines.map((e) => (this.phase === 'count' ? e : 1)));
      glow.material.opacity = k * (active ? 0.25 : 0.45); flameLight.intensity = k * (active ? 900 : 3800); glow.position.y = FLAME_Y[active] - 6; flameLight.position.y = FLAME_Y[active] - 12;
    },
    setEngines(ks) { ks.forEach((k, i) => (fx.engines[i] = k)); },
    newModel: false,
    retractArms() { if (retract && !retract.isRunning() && retract.time === 0) retract.reset().play(); },
    stage(i) { // suelta la etapa i (0,1) o la torre de escape (3)
      const p = parts[i]; if (!p || p.free) return;
      rocket.updateWorldMatrix(true, true); up.set(0, 1, 0).applyQuaternion(rocket.quaternion);
      if (i < 2) { flashes.fire(toWorld(0, this.newModel ? SEP_Y[i] : CUTS[i] * H, 0).clone(), i ? 26 : 42, 0.45); plumes[active].set(0); active = i + 1; }
      if (i === 0) { fx.ullage = 3.7; fx.retro = 0.8; } if (i === 1) fx.aps = 3; if (i === 3) fx.les = 1.2;
      const holdNear = () => { p.rel = p.g.getWorldPosition(new THREE.Vector3()).sub(rocket.position); p.v.copy(up).multiplyScalar(i === 3 ? 45 : -40); };
      if (p.node) { // modelo nuevo: se suelta el empty, pero sigue al cohete visual (la altitud comprimida si no lo deja atrás en un frame)
        if (!p.g) return; p.free = true; scene.attach(p.g); holdNear(); p.w.set((R() - 0.5) * 0.4, 0, (R() - 0.5) * 0.4 + 0.2);
        if (i === 3) fx.lesG = p.g;
        if (i === 0) setTimeout(() => { // ~30 s reales en Apollo: aquí 1.5 s después cae el anillo interetapa de la S-II
          const ring = rocket.getObjectByName('s2-aft-interstage'); if (!ring || !parts[1] || parts[1].free) return; rocket.updateWorldMatrix(true, true);
          flashes.fire(toWorld(0, 43, 0).clone(), 16, 0.3, 0xffe0c0); for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.283; steam.emit(toWorld(Math.cos(a) * 5.2, 43, Math.sin(a) * 5.2).clone(), v4.set(Math.cos(a) * 6, -2, Math.sin(a) * 6), 1.6, { grow: 1.6, life: 2.5, col: [0.95, 0.95, 0.95], a: 0.6 }); }
          scene.attach(ring); sep.push({ g: ring, rel: ring.getWorldPosition(new THREE.Vector3()).sub(rocket.position), v: up.clone().multiplyScalar(-24), w: new THREE.Vector3(0.3, 0, -0.2) });
        }, 1500);
        return;
      }
      p.free = true; rocket.remove(p.g); scene.add(p.g); p.g.position.copy(rocket.position); p.g.quaternion.copy(rocket.quaternion);
      holdNear(); p.w.set((R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6 + 0.3);
      if (i < 2) plumes[active].group.position.y = CUTS[i] * H;
      if (i === 3) fx.lesG = p.g;
    },
    // emisión de humo/vapor/fuego/hielo según la fase; k = empuje total (0..1)
    emit(dt, k) {
      rocket.updateWorldMatrix(true, false); const hb = rocket.position.y - BASE_Y; const gi = THREE.MathUtils.clamp(1 - hb / 140, 0, 1);
      const rate = (r) => { let n = r * dt; const w = Math.floor(n); return w + (R() < n - w ? 1 : 0); };
      const Qk = Q.high ? 1 : 0.45;
      if (this.phase === 'count' && k < 0.01) { // ventilación de LOX: vapor frío que baja por el costado
        for (let n = rate(10 * Qk); n--;) { const a = R() * 6.283, y = R() < 0.6 ? 30 + R() * 6 : 60 + R() * 4; const p = toWorld(Math.cos(a) * 5.2, y, Math.sin(a) * 5.2).clone(); steam.emit(p, v4.set(Math.cos(a) * 1.5, -1, Math.sin(a) * 1.5), 0.9, { grow: 1.4, life: 4.5, buoy: -0.25, col: [1, 1, 1], a: 0.45 }); }
      }
      if (k > 0.01 && gi > 0) {
        const tx0 = this.env ? 62 : 26, ty0 = this.env ? 0.6 : 2 + FB_DY; // bocas de la fosa de llamas (entorno del artista: a nivel del terreno, x ±68 m)
        const fr = this.phase === 'count' ? this.fuelRich || 0 : 0; // arranque rico en combustible: humo oscuro
        for (let n = rate(80 * k * gi * Qk); n--;) { const s = R() < 0.5 ? -1 : 1; const g = 0.74 + R() * 0.2; const dk = fr * (0.5 + R() * 0.3);
          smoke.emit(v3.set(s * (tx0 + 8 + R() * 12), ty0 + R() * 6, (R() - 0.5) * 14), v4.set(s * (40 + R() * 60), 3 + R() * 12, (R() - 0.5) * 46), 7 + R() * 6, { grow: 1.5, life: 13 + R() * 9, buoy: 0.22, col: [g - dk * 0.45, g - dk * 0.5, g - dk * 0.55], a: 0.92 }); }
        for (let n = rate(55 * k * gi * Qk); n--;) { const s = R() < 0.5 ? -1 : 1;
          fire.emit(v3.set(s * (tx0 + R() * 14), ty0 + R() * 5, (R() - 0.5) * 12), v4.set(s * (30 + R() * 40), 4 + R() * 10, (R() - 0.5) * 24), 5 + R() * 5, { grow: 1.3, life: 0.8 + R() * 0.9, col: [1.6, 0.75, 0.28], a: 0.55 }); }
        for (let n = rate(45 * k * gi * Qk); n--;) { const e = R() < 0.5; const x = e ? (R() - 0.5) * 48 : (R() < 0.5 ? -24 : 24), z = e ? (R() < 0.5 ? -20 : 20) : (R() - 0.5) * 40; // vapor del diluvio de agua
          steam.emit(v3.set(x, BASE_Y - R() * 4, z), v4.set(x * 0.15 + (R() - 0.5) * 4, 4 + R() * 7, z * 0.15 + (R() - 0.5) * 4), 4 + R() * 4, { grow: 1.7, life: 6 + R() * 5, buoy: 0.5, col: [0.97, 0.97, 0.98], a: 0.55 }); }
        if (hb < 30) for (let n = rate(30 * k * Qk); n--;) { const a = R() * 6.283, r = 8 + R() * 6; // vapor/llama que sube alrededor del ML
          steam.emit(v3.set(Math.cos(a) * r, BASE_Y + R() * 3, Math.sin(a) * r), v4.set(Math.cos(a) * 6, 6 + R() * 8, Math.sin(a) * 6), 3 + R() * 3, { grow: 1.4, life: 4 + R() * 3, buoy: 0.8, col: [0.95, 0.93, 0.9], a: 0.45 }); }
      }
      if (k > 0.01 && this.phase === 'count' || (hb < 25 && k > 0)) { // hielo de la S-IC
        for (let n = rate(16 * k * (Q.high ? 1 : 0.5)); n--;) { const q = iceP[iceI = (iceI + 1) % NI]; const a = R() * 6.283, y = 10 + R() * 30;
          toWorld(Math.cos(a) * 5.15, y, Math.sin(a) * 5.15, q.p); q.v.set(Math.cos(a) * (0.8 + R() * 2.5), -0.5 - R(), Math.sin(a) * (0.8 + R() * 2.5)); q.w.set(R() * 6, R() * 6, R() * 6); q.s = 0.12 + R() * 0.35; q.on = true;
          if (R() < 0.4) steam.emit(q.p.clone(), v4.set(q.v.x * 0.5, -1, q.v.z * 0.5), 0.6, { grow: 1.6, life: 2.2, col: [1, 1, 1], a: 0.5 }); }
      }
      if (hb > 8 && k > 0.05 && active === 0 && this.alt < 30000) { // lenguas de fuego turbulentas en la cola del penacho F-1
        for (let n = rate(50 * k * Qk); n--;) { const d = 30 + R() * 80; const p = toWorld((R() - 0.5) * 9, -d, (R() - 0.5) * 9).clone(); v4.set(0, -1, 0).applyQuaternion(rocket.quaternion).multiplyScalar(10 + R() * 20).add(v3.set((R() - 0.5) * 8, 0, (R() - 0.5) * 8));
          fire.emit(p, v4, 7 + R() * 7 * (1 - d / 140), { grow: 0.8, life: 0.35 + R() * 0.35, col: [1.7, 0.78 + R() * 0.2, 0.26], a: 0.5 * (1 - d / 130) }); }
      }
      if (hb > 12 && k > 0.05 && this.alt < 26000) { // estela gruesa que queda atrás; se adelgaza y se vuelve más tenue con la altura
        const fa = THREE.MathUtils.clamp(1 - this.alt / 26000, 0, 1) ** 0.8; toWorld(0, FLAME_Y[active] - 34 - Math.min(60, this.alt * 0.01), 0, tailNow);
        if (!tailOk) { tailPrev.copy(tailNow); tailOk = true; }
        const seg = tailNow.distanceTo(tailPrev), sz0 = 11 + Math.min(40, this.alt * 0.007); const cnt = Math.min(40, rate(55 * k * Qk) + Math.floor(seg / (sz0 * 0.35)));
        for (let n = 0; n < cnt; n++) { const p = v3.lerpVectors(tailPrev, tailNow, (n + R()) / Math.max(1, cnt)).add(v4.set((R() - 0.5) * 5, (R() - 0.5) * 5, (R() - 0.5) * 5)); if (p.y < 4 + (this.env ? 0 : FB_DY)) continue; const g = 0.86 + R() * 0.1;
          trail.emit(p, v4.set((R() - 0.5) * 7, -3 - R() * 5, (R() - 0.5) * 7), sz0 * (0.7 + R() * 0.6), { grow: 0.55, life: 22 + R() * 10, buoy: 0.03, col: [g, g * 0.985, g * 0.96], a: (active === 0 ? 0.9 : 0.35) * fa }); }
        tailPrev.copy(tailNow);
      } else tailOk = false;
      // separación: retros de la S-IC, ullage de la S-II, APS de la S-IVB, motor de la torre de escape
      if (fx.ullage > 0) { fx.ullage -= dt; for (const a of [0, 1.571, 3.142, 4.712]) for (let n = rate(16 * Qk); n--;) { const p = toWorld(Math.cos(a) * 5.4, 44.5, Math.sin(a) * 5.4).clone(); v4.set(0, -1, 0).applyQuaternion(rocket.quaternion).multiplyScalar(30 + R() * 10);
        fire.emit(p, v4, 0.9, { grow: 1, life: 0.35, col: [1.4, 1, 0.6], a: 0.6 }); steam.emit(p, v4.multiplyScalar(0.5), 1.1, { grow: 2.4, life: 2.5, col: [0.96, 0.95, 0.94], a: 0.5 }); } }
      if (fx.retro > 0 && parts[0]?.g) { fx.retro -= dt; const g = parts[0].g; g.updateWorldMatrix(true, false); for (const a of [0.785, 2.356, 3.927, 5.498]) for (let n = rate(20 * Qk); n--;) { const p = v3.set(Math.cos(a) * 6.3, 9, Math.sin(a) * 6.3).applyMatrix4(g.matrixWorld).clone(); v4.set(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion())).multiplyScalar(40);
        fire.emit(p, v4, 1.6, { grow: 1.5, life: 0.4, col: [1.6, 0.9, 0.4], a: 0.7 }); smoke.emit(p, v4.multiplyScalar(0.4), 2, { grow: 1.5, life: 3, col: [0.7, 0.66, 0.6], a: 0.6 }); } }
      if (fx.aps > 0) { fx.aps -= dt; for (const a of [0, 3.142]) for (let n = rate(10 * Qk); n--;) { const p = toWorld(Math.cos(a) * 3.4, 70.5, Math.sin(a) * 3.4).clone(); v4.set(0, -1, 0).applyQuaternion(rocket.quaternion).multiplyScalar(20);
        steam.emit(p, v4, 0.6, { grow: 2, life: 1.8, col: [0.95, 0.95, 1], a: 0.5 }); } }
      if (fx.les > 0 && fx.lesG) { fx.les -= dt; fx.lesG.updateWorldMatrix(true, false); for (let n = rate(50 * Qk); n--;) { const a = R() * 6.283; const p = v3.set(Math.cos(a) * 0.5, 4, Math.sin(a) * 0.5).applyMatrix4(fx.lesG.matrixWorld).clone(); v4.set(Math.cos(a) * 25, -18, Math.sin(a) * 25);
        fire.emit(p, v4, 1.3, { grow: 1.5, life: 0.35, col: [1.6, 1, 0.5], a: 0.8 }); smoke.emit(p, v4.multiplyScalar(0.3), 1.2, { grow: 2, life: 4, col: [0.88, 0.86, 0.84], a: 0.6 }); } }
      return gi;
    },
    // solo depuración: simula `sec` segundos de emisión sin renderizar (capturas headless)
    warm(sec, k) { for (let i = 0; i < sec / 0.05; i++) { this.setThrust(k); this.emit(0.05, k); lastFrame = NaN; this.update(0.05, 0); } for (const P of [smoke, steam, fire, trail]) P.dirtyAll(); },
    update(dt, t) {
      const fr = renderer.info.render.frame; if (fr === lastFrame) return; lastFrame = fr; shT += dt; // el motor y la fase lo llaman: una vez por frame
      if (mixer) mixer.update(dt);
      for (const q of sep) { if (q.rel) { q.rel.addScaledVector(q.v, dt); q.v.y -= 6 * dt; q.g.position.copy(rocket.position).add(q.rel); } else { q.g.position.addScaledVector(q.v, dt); q.v.y -= 9 * dt; } q.g.rotation.x += q.w.x * dt; q.g.rotation.z += q.w.z * dt; }
      for (const p of parts) { if (!p.g || p.node) continue; p.g.updateWorldMatrix(true, false); p.pl.forEach((q, k) => q.copy(p.loc[k]).applyMatrix4(p.g.matrixWorld)); }
      tickAll(scene, dt, t);
      for (const p of parts) if (p.free && p.g) { if (p.rel) { p.rel.addScaledVector(p.v, dt); p.v.y -= 6 * dt; p.g.position.copy(rocket.position).add(p.rel); } else { p.g.position.addScaledVector(p.v, dt); p.v.y -= 9 * dt; } p.g.rotation.x += p.w.x * dt; p.g.rotation.z += p.w.z * dt; }
      // hielo
      for (let i = 0; i < NI; i++) { const q = iceP[i]; if (q.on) { q.v.y -= 9.8 * dt; q.p.addScaledVector(q.v, dt); q.r.x += q.w.x * dt; q.r.y += q.w.y * dt; const deck = Math.abs(q.p.x) < 24 && Math.abs(q.p.z) < 20 ? BASE_Y : this.env ? 0 : FB_DY; if (q.p.y < deck) q.on = false; }
        dm.position.copy(q.p); dm.rotation.copy(q.r); dm.scale.setScalar(q.on ? q.s : 0); dm.updateMatrix(); ice.setMatrixAt(i, dm.matrix); }
      ice.instanceMatrix.needsUpdate = true;
      for (const P of [smoke, steam, fire, trail]) P.update(dt, camera, scene);
      // LOD del artista (userData.lodMaxDistance): fundido de opacidad en el último 15 % y oculto más allá; distancia de la cámara al pad
      { const cd = camera.position.distanceTo(v3.set(0, BASE_Y, 0)); for (const L of lods) { const f = THREE.MathUtils.clamp((L.d - cd) / (L.d * 0.15), 0, 1); if (f === L.f) continue;
        const tr = f < 1; L.o.visible = f > 0; for (const m of L.ms) { if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = f; m.depthWrite = !tr || f > 0.5; } L.f = f; } }
      if (envSea) envSea.offset.set(shT * 0.004, shT * 0.0025); if (envSurf) envSurf.offset.y = 0.02 * Math.sin(shT * 0.6);
      const k = this.thrust; smoke.U.uGlowK.value = steam.U.uGlowK.value = 0.6 * k * (active === 0 ? 1 : 0) * THREE.MathUtils.clamp(1 - (rocket.position.y - BASE_Y) / 160, 0, 1) * (0.85 + 0.15 * Math.sin(t * 31));
      plumes.forEach((p) => p.coreM.uniforms.t.value = p.outM.uniforms.t.value = shT);
      flashes.update(dt); landU.uT.value = shT;
      const a = this.alt; skyU.alt.value = Math.min(1, a / 60000);
      skyU.invProj.value.copy(camera.projectionMatrixInverse);
      skyU.camRot.value.setFromMatrix4(camera.matrixWorld);
      stars.position.copy(camera.position);
      // Fog starts beyond the craft, so a side view is not a grey wall. The sky shader ignores fog.
      const craftD = Math.max(40, camera.position.distanceTo(rocket.position));
      scene.fog.near = Math.max(2200, craftD * 2.4); scene.fog.far = scene.fog.near + 24000;
      stars.visible = a > 20000;
      ground.visible = a < 40000; clouds.visible = a < 30000;
      if (clouds.visible) for (const s of clouds.children) { if (!s.isSprite) continue; const d = camera.position.distanceTo(s.position); s.visible = d > Math.max(1800, s.scale.x * 0.55); }
      // The mesh stays out of the scene. The sky pass draws a small horizon sphere instead.
      E.visible = false;
      const gap = 30 + a * 0.004, Rearth = 1800;
      skyU.earthR.value = Rearth;
      skyU.earthK.value = THREE.MathUtils.smoothstep(a, 12000, 22000);
      skyU.earthRel.value.set(rocket.position.x, rocket.position.y - gap - Rearth, rocket.position.z - 180).sub(camera.position);
      seaN.offset.x += dt * 0.004; seaN.offset.y += dt * 0.002;
      // temblor de cámara: ruido suave (suma de senos) + un poco de alabeo
      if (this.shake > 0.001) { const s = this.shake, T = shT; camera.position.x += s * (Math.sin(T * 23.1) * 0.5 + Math.sin(T * 41.7 + 1) * 0.3 + (R() - 0.5) * 0.25); camera.position.y += s * (Math.sin(T * 19.3 + 2) * 0.5 + Math.sin(T * 37.9 + 3) * 0.3 + (R() - 0.5) * 0.25); camera.rotateZ(s * 0.0025 * Math.sin(T * 13.7)); }
      // calima sobre la zanja y detrás del penacho (en pantalla)
      if (post) { const hz = post.haze.uniforms; const hb = rocket.position.y - BASE_Y; v3.copy(rocket.position).add(v4.set(0, -14, 0)); if (hb > 50) toWorld(0, FLAME_Y[active] - 30, 0, v3); v3.project(camera);
        const dist = camera.position.distanceTo(rocket.position); const cx = Number.isFinite(v3.x) ? v3.x * 0.5 + 0.5 : 0.5, cy = Number.isFinite(v3.y) ? v3.y * 0.5 + 0.5 : 0.5;
        hz.uC.value.set(cx, cy); const sz = 45 / Math.max(30, dist) / Math.tan((camera.fov * Math.PI) / 360);
        hz.uR.value.set(sz * 0.7 / camera.aspect, sz * 1.1); hz.uK.value = Number.isFinite(v3.z) && v3.z < 1 ? k * (active === 0 ? 1 : 0.2) * (0.5 + 0.5 * THREE.MathUtils.clamp(1 - hb / 300, 0, 1)) : 0; }
    },
    // Plume meshes and the heat-haze pass stay hidden until ignition. Compiling them on that
    // first draw is what blanks the framebuffer on a real GPU. Draw them once offscreen now.
    warmShaders() {
      for (const p of plumes) { p.group.visible = true; p.set(1, { vac: 0.15, t: 1 }); }
      const haze = post?.haze; if (haze) { haze.uniforms.uK.value = 0.25; haze.enabled = true; }
      const screen = post ? post.comp.renderToScreen : true;
      const scratch = new THREE.WebGLRenderTarget(16, 16);
      try {
        renderer.compile(scene, camera);
        renderer.setRenderTarget(scratch);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        if (post) { post.comp.renderToScreen = false; post.render(1 / 60); }
      } finally {
        renderer.setRenderTarget(null);
        scratch.dispose();
        if (post) post.comp.renderToScreen = screen !== false;
        if (haze) { haze.uniforms.uK.value = 0; haze.enabled = false; }
        for (const p of plumes) p.set(0);
      }
      if (![camera.position.x, camera.position.y, camera.position.z].every(Number.isFinite)) {
        camera.position.set(75, BASE_Y + 8, 262); camera.lookAt(0, BASE_Y + 40, 0); camera.updateProjectionMatrix();
      }
      return renderer.compileAsync(scene, camera);
    },
    render(dt) {
      if (![camera.position.x, camera.position.y, camera.position.z, camera.quaternion.x].every(Number.isFinite)) {
        camera.position.set(75, (this.env ? BASE_Y + 8 : 8 + FB_DY), 262); camera.up.set(0, 1, 0); camera.lookAt(0, BASE_Y + 40, 0);
        camera.near = 1; camera.far = 60000; camera.fov = 50; camera.updateProjectionMatrix();
      }
      if (post) post.render(dt); else renderer.render(scene, camera);
    },
    resize(w, h) { post?.setSize(w, h); },
    dispose() { post?.dispose(); },
  };
  return api;
}
