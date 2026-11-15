// Habitación del hotel Georgetown Inn (Washington D. C., 27 de enero de 1967) para el prólogo (escena 0.2).
// hotel-room-1967.glb: cama contra la pared del fondo (z≈−2), teléfono en la mesita derecha (hotel-phone › hotel-phone-handset),
// cartera y libreta de direcciones en la mesita izquierda, ventana con la ciudad de noche a la derecha.
import { THREE } from '../core/engine.js';
import { makeCineBase, faceTo } from './cine-common.js';

export const HOTEL_SPOTS = { bedEdge: [0.62, 0, -0.95], phone: [0.75, 0.58, -1.85], wallet: [-1.3, 0.58, -1.88], book: [-1.15, 0.58, -1.98], window: [2.4, 1.4, 0] };

export function makeHotel() {
  const W = makeCineBase({ bg: 0x07080c, fov: 42, far: 40 });
  const { scene } = W;
  scene.add(new THREE.HemisphereLight(0xc8b8a0, 0x2a1e18, 0.4)); // relleno cálido y suave (sin cara partida en dos colores)
  const l1 = new THREE.PointLight(0xffd29a, 1.5, 4, 1.6); l1.position.set(-1.35, 1.05, -2.0); scene.add(l1);
  const l2 = new THREE.PointLight(0xffd29a, 1.5, 4, 1.6); l2.position.set(0.95, 1.05, -2.0); scene.add(l2);
  const city = new THREE.DirectionalLight(0x8f9cc0, 0.25); city.position.set(4, 2, 1); scene.add(city);
  const fill = new THREE.PointLight(0xffd8b0, 0.8, 5, 1.4); fill.position.set(1.8, 1.5, -0.2); scene.add(fill); // relleno cálido del lado de la cámara
  const room = W.room('hotel-room-1967');
  // Neil (36) sentado en el borde de la cama, de cara a la ventana
  W.actor('neil', 'armstrong-civil', { pos: HOTEL_SPOTS.bedEdge, rotY: faceTo(0.62, -0.95, 2.4, -0.6), clip: 'sit' });

  let handset = null, base = null, ring = false, lifted = false, t = 0;
  room.then((r) => { if (!r) return; handset = r.N['hotel-phone-handset']; if (handset) base = handset.position.clone(); });
  const tmp = new THREE.Vector3();
  W.tick((dt) => {
    t += dt; if (!handset || !base) return;
    if (lifted) {
      // auricular junto a la cabeza de Neil (posición de mundo → espacio del pivote padre)
      const head = W.actors.neil?.root.getObjectByName('Head');
      if (head) { head.getWorldPosition(tmp); tmp.y -= 0.02; tmp.x += 0.02; handset.parent.worldToLocal(tmp); handset.position.lerp(tmp, Math.min(1, dt * 6)); handset.rotation.z = 1.2; }
      return;
    }
    handset.position.copy(base); handset.rotation.z = 0;
    if (ring && (t % 1.2) < 0.6) handset.position.y += Math.abs(Math.sin(t * 60)) * 0.004; // el auricular vibra con el timbre
  });
  return {
    ...W,
    spots: HOTEL_SPOTS,
    ring(on) { ring = on; },
    lift(on = true) { lifted = on; ring = false; },
  };
}
