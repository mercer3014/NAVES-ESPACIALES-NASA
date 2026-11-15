// Cap. 7.1 · «Rumbo a casa» (22 jul 1969, ~04:55 UTC): detrás de la Luna, sin radio, el motor SPS enciende la inyección
// transterrestre (TEI). Silencio, la Tierra asoma sobre el limbo y vuelve la señal (AOS) con el audio real:
// Duke «Apolo 11, Houston, ¿cómo fue?» / Collins «Hora de abrir las puertas del LRL, Charlie» (frase real, corrección v2).
// Mundo propio: CSM Columbia del artista (csm-columbia.glb) sobre una Luna grande; la nave queda fija y la Luna gira debajo.
import { Howl } from 'howler';
import { THREE, model } from '../../core/engine.js';
import { store } from '../../core/store.js';
import { skySphere, twinkleStars, earth, moon, glowSprite, tickAll } from '../../scenes/space.js';
import { envMap } from '../../scenes/cine-kit.js';
import { playA11 } from '../../audio/a11-voice.js';
import { a11sfx } from '../../audio/a11-score.js';
import { runCine } from './cine.js';

const TITLE = ['CAP. 7 · RUMBO A CASA', 'CH. 7 · HOMEWARD BOUND'];
const R = 3000, ALT = 190; // Luna y altura de la órbita a escala visual (110 km sobre 1737 km ≈ 6 %)
const deg = THREE.MathUtils.degToRad;

// cono de llama con el ápice en el origen y abierto hacia +Z local (convención de los empties *-thrust-point del artista)
function flameCone(color, r, len) {
  const g = new THREE.ConeGeometry(r, len, 24, 1, true); g.translate(0, -len / 2, 0); g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
}

export default async function teiScene() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 30000);
  const sunDir = new THREE.Vector3(0.75, 0.35, -0.55).normalize();
  scene.add(new THREE.AmbientLight(0x223040, 0.25)); const sun = new THREE.DirectionalLight(0xfff4e6, 3.4); sun.position.copy(sunDir).multiplyScalar(500); scene.add(sun);
  scene.add(skySphere(20000)); scene.add(twinkleStars(undefined, 18000));
  const M = moon(R); M.position.set(0, -R, 0); M.userData.tick = null; scene.add(M);
  const E = earth(150, sunDir); scene.add(E);
  const ship = new THREE.Group(); ship.position.set(0, ALT, 0); ship.rotation.x = -Math.PI / 2; scene.add(ship); // proa (+Y del modelo) hacia −Z
  const flame = flameCone(0xc8dcff, 1.1, 10), glow = glowSprite(0xaaccff, 5, 0);
  const csm = await model('csm-columbia').catch((e) => { console.warn('csm-columbia.glb no disponible', e); return null; });
  if (csm) {
    csm.traverse((c) => { if (c.isMesh && c.material && 'envMap' in c.material) { c.material.envMap = envMap(); c.material.envMapIntensity = 0.6; } });
    ship.add(csm); const tp = csm.getObjectByName('sps-thrust-point');
    if (tp) { tp.add(flame); tp.add(glow); } else { flame.position.y = -11; ship.add(flame); }
  }
  // la Tierra asoma sobre el limbo: el horizonte está ~20° bajo la horizontal (acos(R / (R + ALT)))
  let earthEl = deg(-30);
  const placeEarth = () => E.position.set(0, ALT + Math.sin(earthEl) * 12000, -Math.cos(earthEl) * 12000);
  placeEarth();
  let burn = 0, shake = 0, loop = null;
  const startLoop = () => { loop = new Howl({ src: ['/audio/a11/sfx/c3_34_sps_motor_encendido_loop.mp3'], loop: true, volume: 0.5 * ((store.get('vol') || {}).sfx ?? 0.8) }); loop.play(); };
  const stopLoop = () => { if (!loop) return; const h = loop; loop = null; h.fade(h.volume(), 0, 600); setTimeout(() => h.unload(), 700); };
  const fired = new Set(); const at = (T, k, f) => { if (T >= k && !fired.has(k)) { fired.add(k); f(); } };

  const S0 = ship.position; const P = (x, y, z) => [S0.x + x, S0.y + y, S0.z + z];
  const world = {
    scene, camera,
    update(dt, t) { tickAll(scene, dt, t); M.rotation.x += dt * 0.0035; // la superficie corre bajo la nave
      flame.material.opacity = burn * (0.5 + Math.random() * 0.12); glow.material.opacity = burn; flame.scale.set(1, 1, 0.8 + burn * 0.3 + Math.random() * 0.06);
      if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake; } },
    resize: () => {},
  };
  const step = (dt, T) => {
    at(T, 1, () => a11sfx('c3_34_radio_corte_los', 0.6));
    at(T, 9.5, () => { a11sfx('c3_34_sps_ignicion_golpe', 0.8); startLoop(); });
    if (T >= 9.5 && T < 16.5) { burn = Math.min(1, burn + dt * 3); shake = 0.04; } else { burn = Math.max(0, burn - dt * 1.5); shake = 0; }
    at(T, 16.5, stopLoop);
    if (T > 19) { earthEl = Math.min(deg(-11), earthEl + dt * deg(1.6)); placeEarth(); }
    at(T, 21, () => a11sfx('c3_34_radio_vuelve_aos', 0.6));
    at(T, 22.5, () => playA11('nasa_real/cap7_houston_volviendo_a_casa_lrl'));
  };
  const look = (el) => P(0, Math.sin(el) * 400, -Math.cos(el) * 400);
  try {
    return await runCine({
      id: 'tei', world, title: TITLE, step, minHold: 40,
      shots: [
        { d: 9, pos: P(16, 7, 30), look: P(0, 0, 0), fov: 40, to: { pos: P(12, 6, 24), look: P(0, 0, -2), fov: 38 } },
        { d: 10, pos: P(15, 2.5, -5), look: P(0, 0, 3), fov: 44, to: { pos: P(13, 2, -8), look: P(0, 0, 4), fov: 42 } },
        { d: 12, pos: P(0, 5, 28), look: look(deg(-14)), fov: 46, to: { pos: P(-2, 6, 24), look: look(deg(-12)), fov: 44 } },
        { d: 13, pos: P(-11, 3, -24), look: P(0, 0, 0), fov: 46, to: { pos: P(-14, 4, -28), look: P(0, 1, 0), fov: 44 } },
      ],
      lines: [
        { at: 0.5, who: '', text: ['22 de julio de 1969 · 04:55 UTC · Detrás de la Luna', 'July 22, 1969 · 04:55 UTC · Behind the Moon'] },
        { at: 4, who: '', text: ['Sin radio. Si el motor no enciende, Houston no lo sabrá hasta que vuelvan a aparecer.', 'No radio. If the engine fails, Houston won’t know until they reappear.'] },
        { at: 9.5, who: '', text: ['Inyección transterrestre: el motor SPS enciende unos dos minutos y medio.', 'Trans-Earth injection: the SPS engine burns for about two and a half minutes.'] },
        { at: 16.5, who: '', text: ['(Solo los ventiladores. Esta vez los tres están juntos.)', '(Only the fans. This time all three are together.)'] },
        { at: 21, who: '', text: ['Señal recuperada (AOS).', 'Acquisition of signal (AOS).'] },
        { at: 22.5, who: 'HOUSTON · CHARLIE DUKE', text: ['Apolo 11, Houston. ¿Cómo fue? Cambio.', 'Hello Apollo 11, Houston. How did it go? Over.'] },
        { at: 26.6, who: 'COLLINS', text: ['Hora de abrir las puertas del LRL, Charlie.', 'Time to open up the LRL doors, Charlie.'] },
        { at: 30.3, who: 'HOUSTON · CHARLIE DUKE', text: ['Entendido. Los tenemos volviendo a casa. Se agradece.', 'Roger. We got you coming home. It’s well appreciated.'] },
        { at: 35.5, who: '', text: ['Rumbo a casa. Tres días hasta el Pacífico.', 'Homeward bound. Three days to the Pacific.'] },
      ],
    });
  } catch (e) { console.error('tei', e); return { played: false, skipped: true }; }
  finally { stopLoop(); }
}
