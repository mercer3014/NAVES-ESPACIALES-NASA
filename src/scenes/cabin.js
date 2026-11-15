// Cabina del CM (Fase 1): cabin-panels.glb del artista. Origen = ojo del piloto; la cámara va en (0,0,0) mirando −Z.
// Los nodos con nombre son pivotes (malla en '<nombre>-geo'); userData trae etiquetas, ángulos y acciones.
import { THREE, model, modelAnim, Q, renderer } from '../core/engine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const deg = THREE.MathUtils.degToRad;
// interruptor del HTML → nodo del panel (según userData.action)
export const SW_MAP = { fc1: 'switch-01', fc2: 'switch-02', fc3: 'switch-03', batA: 'switch-06', batB: 'switch-07', batC: 'switch-09', gnc: 'switch-11', abort: 'switch-12', o2: 'switch-18', sband: 'switch-23' };
// props: añade cabin-props.glb (checklist, sextante, bolsas de comida, rotulador, cinta) en la repisa derecha bajo el panel
// clock: false oculta el reloj de misión (mission-timer-display): en el Eagle la cuenta atrás del lanzamiento no tiene sentido (G9)
export function makeCabin({ props = false, clock = true } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070b);
  const camera = new THREE.PerspectiveCamera(74, innerWidth / innerHeight, 0.02, 50);
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  scene.environment = env; scene.environmentIntensity = 0.45;
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x2a2622, 0.55));
  const key = new THREE.PointLight(0xfff1dc, 2.2, 3, 1.6); key.position.set(0.1, 0.45, 0.15); scene.add(key);
  const fill = new THREE.PointLight(0x9fc4ff, 1.1, 3, 1.8); fill.position.set(-0.5, 0.2, -0.2); scene.add(fill);
  const win = new THREE.DirectionalLight(0xdfeaff, 0.9); win.position.set(0.3, 1, 0.6); scene.add(win); // luz diurna por las ventanas
  // Cielo tras las ventanas: el CM está en vertical sobre la plataforma, así que −Z de la cabina (hacia el panel y las ventanas de encuentro) apunta al cénit.
  // El vidrio se pinta con un degradado de cielo según la dirección de vista (como un env map), con reflejo tenue y el sol; 'space' da negro con estrellas.
  const skyU = { uSpace: { value: 0 }, uSun: { value: new THREE.Vector3(0.45, 0.35, -0.82).normalize() }, uT: { value: 0 } };
  const winMat = new THREE.ShaderMaterial({ uniforms: skyU,
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uSpace,uT; uniform vec3 uSun; varying vec3 vW; varying vec3 vN;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ vec3 d=normalize(vW-cameraPosition); float el=clamp(-d.z,-1.,1.); // elevación respecto al cénit (−Z)
        vec3 zen=vec3(.16,.36,.72), hor=vec3(.72,.82,.92); vec3 sky=mix(hor,zen,pow(clamp(el,0.,1.),.55));
        float sd=max(dot(d,uSun),0.); sky+=vec3(1.,.93,.8)*(pow(sd,900.)*6.+pow(sd,12.)*.25);
        vec3 c3=floor(d*420.); float st=step(.9975,h(c3))*(.6+.4*sin(uT*3.+h(c3+1.)*40.)); vec3 spc=vec3(st)+vec3(1.,.95,.85)*pow(sd,1500.)*8.;
        vec3 c=mix(sky,spc,uSpace);
        float fr=pow(1.-abs(dot(d,vN)),3.); c=mix(c*.82,vec3(.06,.07,.09),fr*.6); // vidrio grueso: algo de tinte y reflejo oscuro en el borde
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }` });
  const N = {}; let root = null, mixer = null, clips = [];
  const tgt = {}; // rotaciones objetivo (animadas suavemente)
  const ready = modelAnim('cabin-panels').then(({ scene: o, animations }) => {
    root = o; clips = animations; scene.add(o); mixer = new THREE.AnimationMixer(o);
    o.traverse((c) => { if (c.name) N[c.name] = c; if (c.isMesh) { const m = c.material; if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.45; } });
    for (const [n, c] of Object.entries(N)) if (/^switch-\d+$/.test(n) && c.userData.angles_deg) { const u = c.userData; c.rotation.x = deg(u.angles_deg[u.default ?? 0]); tgt[n] = c.rotation.x; }
    for (let i = 1; i <= 3; i++) { const c = N['talkback-fc-' + i]; if (c) { c.rotation.x = 0; tgt[c.name] = 0; } } // tambores: gris al empezar
    if (!clock && N['mission-timer-display']) N['mission-timer-display'].visible = false;
    o.traverse((c) => { if (c.isMesh && c.material?.name === 'WindowGlass') c.material = winMat; }); // ventanas: cielo por dirección de vista
    return o;
  });
  if (props) ready.then(() => model('cabin-props')).then((p) => { p.position.set(0.5, -0.3, -0.42); p.rotation.y = -0.9; p.traverse((c) => { if (c.isMesh && c.material && 'envMapIntensity' in c.material) c.material.envMapIntensity = 0.45; }); scene.add(p); }).catch((e) => console.warn('cabin-props.glb no disponible', e));
  const swNode = (id) => N[SW_MAP[id] || id];
  function setSwitch(id, on) { const n = swNode(id); if (!n) return; if (on && n.userData.guard) openGuard(n.name); const a = n.userData.angles_deg; tgt[n.name] = deg(on ? a[0] : a[a.length - 1]);
    const fc = /^fc([123])$/.exec(id); if (fc) talkback(+fc[1], on ? 'green' : 'gray'); }
  // indicadores talkback (tambor de 3 caras): al conmutar pasan por la barber pole y luego quedan en gris/verde; 'barber' fijo = fallo
  const TB = { gray: 0, barber: 1, green: 2 }, tbT = {};
  function talkback(i, state) { const n = N['talkback-fc-' + i]; if (!n) return; const a = n.userData.angles_deg || [0, -120, -240]; clearTimeout(tbT[i]);
    if (state === 'barber') { tgt[n.name] = deg(a[1]); return; }
    tgt[n.name] = deg(a[1]); tbT[i] = setTimeout(() => (tgt[n.name] = deg(a[TB[state]])), 380 + i * 90); }
  function openGuard(id) { const n = swNode(id); const g = n && N[n.userData.guard]; if (!g || g.userData.opened) return; g.userData.opened = true;
    const clip = THREE.AnimationClip.findByName(clips, g.name + '-open'); if (clip && mixer) { const a = mixer.clipAction(clip); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.reset().play(); } else g.rotation.x = deg(g.userData.open_rotation_x_deg ?? -100); }
  const ndl = {}; function setNeedle(name, frac) { const n = N[name]; if (!n) return; ndl[name] = deg(135 - 270 * Math.min(1, Math.max(0, frac))); }
  function lamp(name, on, k = 2.5) { const n = N[name]; const g = n && (N[name + '-geo'] || n.getObjectByProperty('isMesh', true)); if (!g?.material) return; if (!g.userData.own) { g.material = g.material.clone(); g.userData.own = true; }
    const c = n.userData.emissive_color || [1, 0.2, 0.1]; g.material.emissive.setRGB(on ? c[0] : 0, on ? c[1] : 0, on ? c[2] : 0); g.material.emissiveIntensity = on ? k : 0; }
  function press(legend) { const n = N['dsky-key-' + legend]; if (!n) return; n.userData.y0 ??= n.position.y; n.position.y = n.userData.y0 - 0.003; setTimeout(() => (n.position.y = n.userData.y0), 120); }
  // raycast: pivote con nombre (switch-##, guard-##, dsky-key-*) bajo el puntero
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function pick(cx, cy) { if (!root) return null; v2.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(v2, camera);
    for (const h of ray.intersectObject(root, true)) { let o = h.object; while (o && !/^(switch-\d+|guard-\d+|dsky-key-.+)$/.test(o.name)) o = o.parent; if (o) return o.name; } return null; }
  let t = 0, alarmOn = false, look = { x: 0, y: 0 };
  function update(dt) { t += dt; mixer?.update(dt);
    for (const [n, a] of Object.entries(tgt)) { const c = N[n]; if (c) c.rotation.x += (a - c.rotation.x) * Math.min(1, dt * 22); }
    for (const [n, a] of Object.entries(ndl)) { const c = N[n]; if (c) c.rotation.y += (a - c.rotation.y) * Math.min(1, dt * 5); }
    if (alarmOn) lamp('master-alarm', Math.sin(t * 9) > -0.2, 3); skyU.uT.value = t;
    camera.position.set(Math.sin(t * 0.31) * 0.006, Math.sin(t * 0.23) * 0.004, 0); // respiración leve
    camera.rotation.set(-0.12 + look.y + Math.sin(t * 0.2) * 0.004, look.x, 0, 'YXZ'); }
  return { scene, camera, ready, N, update, setSwitch, talkback, sky: (mode) => (skyU.uSpace.value = mode === 'space' ? 1 : 0), openGuard, setNeedle, lamp, press, pick,
    alarm: (on) => { alarmOn = on; if (!on) lamp('master-alarm', false); }, look: (x, y) => { look.x = x; look.y = y; }, dispose: () => env.dispose(), quality: Q };
}
