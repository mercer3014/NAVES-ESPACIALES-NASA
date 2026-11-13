// Vista de depuración (?debug&cue=) para revisar un riel sin recorrer toda la misión.
import { THREE, setWorld } from '../../core/engine.js';
import { CUE_IDS } from './rails.js';
import { playCue } from './play.js';

export function previewCue(id) {
  const cue = CUE_IDS.includes(id) ? id : 'liftoff';
  const horizon = cue === 'horizon';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(horizon ? 0x05060c : 0x141820);
  const camera = horizon
    ? new THREE.OrthographicCamera(-90, 90, 90, -90, 0.1, 900)
    : new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 800);
  if (horizon) { camera.position.set(0, 0, 300); camera.lookAt(0, 0, 0); }
  else { camera.position.set(12, 6, 16); camera.lookAt(0, 2, 0); }
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1dd, 2.2);
  sun.position.set(20, 30, 12);
  scene.add(sun);
  const subject = new THREE.Mesh(
    horizon ? new THREE.SphereGeometry(6, 32, 24) : new THREE.CapsuleGeometry(cue === 'firststep' ? 0.35 : 1.1, cue === 'firststep' ? 1.1 : 6, 6, 16),
    new THREE.MeshStandardMaterial({ color: horizon ? 0x07080d : 0xe4dcc8, roughness: 0.42, metalness: 0.25 }),
  );
  if (!horizon && cue !== 'firststep') subject.position.y = 4;
  scene.add(subject);
  if (horizon) {
    const disk = new THREE.Mesh(new THREE.RingGeometry(12, 20, 80), new THREE.MeshBasicMaterial({ color: 0xff6a1a, side: THREE.DoubleSide }));
    scene.add(disk);
  } else {
    const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 40), new THREE.MeshStandardMaterial({ color: cue === 'skycrane' ? 0x8d4e34 : 0x6a675f, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
  }
  const anchor = horizon ? { position: { x: 0, y: 0, z: 0 } } : subject;
  setWorld({ scene, camera, update() {} });
  const run = () => playCue(cue, { anchor: () => anchor }).then(run);
  run();
}
