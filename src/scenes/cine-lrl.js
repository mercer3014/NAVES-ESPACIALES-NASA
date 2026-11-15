// Cinemática 7.6: Laboratorio de Recepción Lunar (lrl-room.glb). El vidrio (quarantine-glass) separa a la tripulación
// (z < 0: literas, sofá, teléfono wall-phone-crew) de las visitas (z > 0: sillas, teléfono wall-phone).
// Neil se acerca al vidrio; al otro lado, Jan, Rick y Mark. Aldrin y Collins al fondo. Al final, Neil y Rick ponen la mano en el vidrio.
import { THREE } from '../core/engine.js';
import { model, char, node, disposeScene, camera as mkCam, smooth } from './cine-kit.js';

export async function makeCineLrl() {
  const [room, neil, buzz, mike, jan, rick, mark] = await Promise.all([
    model('lrl-room'), char('armstrong-civil', 'walk'), char('aldrin-civil', 'idle', { phase: 0.7 }), char('collins-civil', 'talk', { phase: 0.3 }),
    char('jan', 'idle', { phase: 1.1 }), char('rick', 'idle', { phase: 0.4 }), char('mark', 'idle', { phase: 1.5 }),
  ]);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1014);
  const cam = mkCam(42, 60);
  room.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  scene.add(room);
  scene.add(new THREE.HemisphereLight(0xf2f4ff, 0x4a4a44, 1.1));
  // tubos fluorescentes: luz fría a cada lado del vidrio
  for (const z of [-2.2, 2.2]) for (const x of [-2.6, 0, 2.6]) { const l = new THREE.PointLight(0xeef4ff, 4.5, 7, 1.6); l.position.set(x, 2.55, z); scene.add(l); }
  const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(3, 5, 4); scene.add(key);

  const cast = [neil, buzz, mike, jan, rick, mark];
  // tripulación (miran hacia +z, hacia el vidrio)
  neil.root.position.set(-1.5, 0, -2.6);
  buzz.root.position.set(0.9, 0, -1.7); buzz.root.rotation.y = -0.5;
  mike.root.position.set(1.7, 0, -1.2); mike.root.rotation.y = -0.9;
  // familias (miran hacia -z)
  jan.root.position.set(-2.2, 0, 1.05); jan.root.rotation.y = Math.PI + 0.25;
  rick.root.position.set(-1.35, 0, 0.42); rick.root.rotation.y = Math.PI;
  mark.root.position.set(-1.85, 0, 0.55); mark.root.rotation.y = Math.PI - 0.2;
  cast.forEach((c) => scene.add(c.root));
  // auricular de las visitas en la mano de Jan no: se queda colgado (el guion no lo pide en la cinemática)
  const glass = node(room, 'quarantine-glass');
  const want = new Map();
  const setClip = (c, n, layer = null) => { const k = n + '|' + layer; if (want.get(c) === k) return; want.set(c, k); c.play(n); c.layer(layer); };
  return {
    scene, camera: cam,
    anchors: { glass: glass || { x: 0, y: 0, z: 0 }, neil: neil.root },
    at(T) {
      // Neil camina hasta el vidrio (0,5 → 3,6 s)
      const w = smooth((T - 0.5) / 3.1);
      neil.root.position.z = -2.6 + 2.15 * w;
      setClip(neil, T > 0.5 && T < 3.6 ? 'walk' : T >= 9 && T < 14 ? 'talk' : 'idle', T >= 18.4 ? 'point-arm' : null);
      setClip(mark, T >= 5 && T < 8.5 ? 'talk' : 'idle');
      setClip(rick, T >= 14 && T < 18 ? 'talk' : 'idle', T >= 18.9 ? 'point-arm' : null);
      setClip(jan, T >= 2 && T < 5 ? 'wave' : 'idle');
    },
    update(dt) { cast.forEach((c) => c.update(dt)); },
    act() {},
    dispose() { disposeScene(scene); },
  };
}
