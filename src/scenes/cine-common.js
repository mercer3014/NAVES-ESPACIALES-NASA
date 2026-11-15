// Utilidades de las escenas cinemáticas de la Tierra (MOCR, casa Armstrong, hotel 1967).
// Personajes: esqueleto común de 25 huesos con clips idle/walk/sit/talk/point/wave (modelAnim + un mixer por actor).
// Salas: los nodos con nombre son pivotes (la malla está en '<nombre>-geo'); solo se mueven los pivotes.
import { THREE, model, modelAnim } from '../core/engine.js';

export const deg = THREE.MathUtils.degToRad;
// Ángulo Y para que un personaje (frente +Z en glTF) mire de (x,z) hacia (tx,tz)
export const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

export function makeCineBase({ bg = 0x000000, fov = 40, near = 0.05, far = 120, fog = null } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.FogExp2(fog.color, fog.density);
  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, near, far);
  const actors = {}; const mixers = new Set(); const tickers = new Set(); const pending = [];
  let disposed = false;

  // Carga un personaje y lo deja en su sitio con un clip en bucle. 'seat' = altura de asiento para el clip sit.
  function actor(key, glb, { pos = [0, 0, 0], rotY = 0, clip = 'idle', phase = Math.random() * 2, scale = 1 } = {}) {
    const p = modelAnim(glb).then(({ scene: o, animations }) => {
      if (disposed) return null;
      const root = new THREE.Group(); root.name = 'actor-' + key; root.add(o); root.position.set(...pos); root.rotation.y = rotY; root.scale.setScalar(scale);
      o.traverse((c) => { if (c.isMesh) { c.frustumCulled = false; c.castShadow = false; } });
      scene.add(root);
      const mixer = new THREE.AnimationMixer(o); mixers.add(mixer);
      let cur = null, curName = null;
      const a = {
        key, root, mixer, animations,
        get clip() { return curName; },
        // Cambia de clip con fundido. once = se queda en el último fotograma (sentarse, señalar).
        play(name, { fade = 0.35, once = false, at = null } = {}) {
          const c = THREE.AnimationClip.findByName(animations, name); if (!c) return a;
          if (curName === name && !once) return a;
          const act = mixer.clipAction(c); act.reset(); act.enabled = true;
          act.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); act.clampWhenFinished = once;
          if (at != null) act.time = at;
          if (cur && cur !== act) { act.setEffectiveWeight(1); act.crossFadeFrom(cur, fade, false); }
          act.play(); cur = act; curName = name; return a;
        },
        // Camina en línea recta hasta (x,z) a 'speed' m/s; resuelve al llegar
        walkTo(x, z, { speed = 1.1, then = 'idle' } = {}) {
          return new Promise((res) => {
            a.play('walk'); root.rotation.y = faceTo(root.position.x, root.position.z, x, z);
            const off = tick((dt) => {
              const dx = x - root.position.x, dz = z - root.position.z, d = Math.hypot(dx, dz), st = speed * dt;
              if (d <= st) { root.position.x = x; root.position.z = z; a.play(then); off(); res(); return; }
              root.position.x += (dx / d) * st; root.position.z += (dz / d) * st;
            });
          });
        },
        face(x, z) { root.rotation.y = faceTo(root.position.x, root.position.z, x, z); return a; },
      };
      a.play(clip, { once: clip === 'sit', fade: 0 });
      mixer.update(clip === 'sit' ? 5 : phase); // sentado: directo al último fotograma
      actors[key] = a; return a;
    });
    pending.push(p.catch((e) => { console.warn('cine: personaje no disponible', glb, e); return null; }));
    return p;
  }
  // Sala o utilería estática (un model() por glb); devuelve el clon y un índice de nodos por nombre
  function room(glb, { pos = [0, 0, 0], rotY = 0 } = {}) {
    const p = model(glb).then((o) => {
      if (disposed) return null; o.position.set(...pos); o.rotation.y = rotY; scene.add(o);
      const N = {}; o.traverse((c) => { if (c.name) N[c.name] = c; }); return { root: o, N };
    });
    pending.push(p.catch((e) => { console.warn('cine: sala no disponible', glb, e); return null; }));
    return p;
  }
  function tick(f) { tickers.add(f); return () => tickers.delete(f); }
  const base = {
    scene, camera, actors,
    actor, room, tick,
    act(key, clip, o) { actors[key]?.play(clip, o); },
    // listo cuando todo cargó (o falló); nunca bloquea más de 'ms'
    ready(ms = 12000) { return Promise.race([Promise.all(pending.slice()), new Promise((r) => setTimeout(r, ms))]); },
    update(dt) { for (const m of mixers) m.update(dt); for (const f of [...tickers]) f(dt); },
    dispose() { disposed = true; tickers.clear(); for (const m of mixers) m.stopAllAction(); mixers.clear(); scene.traverse((c) => { if (c.isMesh && c.material?.userData?.cineOwn) { c.material.map?.dispose(); c.material.dispose(); } }); },
  };
  return base;
}

// Pantalla de TV de tubo en blanco y negro (CanvasTexture) para tv-set › tv-screen
export function tvTexture(lines) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  let text = lines; let t = 0;
  function draw() {
    const g = x.createRadialGradient(128, 96, 10, 128, 96, 150); g.addColorStop(0, '#d8d8d0'); g.addColorStop(1, '#3a3a38');
    x.fillStyle = g; x.fillRect(0, 0, 256, 192);
    // silueta del LM sobre la Luna (transmisión en vivo, gris)
    x.fillStyle = '#9a9a94'; x.fillRect(0, 130, 256, 62);
    x.fillStyle = '#2b2b2a'; x.beginPath(); x.moveTo(108, 128); x.lineTo(148, 128); x.lineTo(156, 108); x.lineTo(100, 108); x.closePath(); x.fill(); x.fillRect(112, 86, 32, 22);
    x.fillStyle = '#111'; x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; text.forEach((l, i) => x.fillText(l, 128, 30 + i * 19));
    for (let y = 0; y < 192; y += 3) { x.fillStyle = `rgba(0,0,0,${0.12 + 0.06 * Math.sin(y * 0.7 + t * 9)})`; x.fillRect(0, y, 256, 1); }
    for (let i = 0; i < 220; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'; x.fillRect(Math.random() * 256, Math.random() * 192, 2, 1); }
    tex.needsUpdate = true;
  }
  draw();
  return { tex, set(l) { text = l; draw(); }, update(dt) { t += dt; if ((t * 15 | 0) !== ((t - dt) * 15 | 0)) draw(); } };
}

// Pone una textura emisiva en la malla de un pivote (sin tocar el material compartido del glb)
export function screenMaterial(pivot, tex, intensity = 1.2) {
  const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); m.userData.cineOwn = true;
  m.color.setScalar(intensity);
  pivot?.traverse((c) => { if (c.isMesh) c.material = m; });
  return m;
}

// Copia un nodo de utilería (p. ej. earth-props › alarm-sheet) a otro lugar de la escena, con su malla '-geo'
export function propCopy(N, name, parent, { pos = [0, 0, 0], rotY = 0, rotX = 0, scale = 1 } = {}) {
  const n = N?.[name]; if (!n) return null;
  const c = n.clone(true); c.position.set(...pos); c.rotation.set(rotX, rotY, 0); c.scale.setScalar(scale);
  // la malla hija conserva su desplazamiento relativo al pivote
  parent.add(c); return c;
}
