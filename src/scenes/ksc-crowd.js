// Exterior del KSC (cap. 2): público en la playa de Cabo Kennedy, autos de 1969 y la furgoneta de la tripulación (ksc-crowd.glb).
// Coordenadas relativas al grupo del entorno LC-39A (origen = cubierta del ML, y = BASE_Y): la arena está en y −27.01 (mundo −0.48).
// Solo se mueven los nodos con nombre (crowd-a/b/c, car-1..4, astrovan); nunca sus hijos '-geo', que llevan la cuantización.
import { THREE, model } from '../core/engine.js';
import { rng } from '../core/util.js';

export const BEACH = { y: -27.01, z: -1278, x0: -450, x1: 450 }; // fila de público frente al Atlántico (unos 1,3 km al este de la plataforma)
export const ASTROVAN = { x: -35, y: -14.34, z: 25, yaw: Math.PI / 2 }; // en la explanada, junto a la rampa del ML
// ~130 grupos de 3–4 personas (~200 triángulos cada uno, geometría compartida entre clones)

export function loadKscCrowd({ seed = 1969 } = {}) {
  return model('ksc-crowd').then((src) => {
    const g = new THREE.Group(); g.name = 'ksc-crowd';
    const node = (n) => src.getObjectByName(n);
    const R = rng(seed); const kinds = ['crowd-a', 'crowd-b', 'crowd-c'].map(node).filter(Boolean);
    const crowd = new THREE.Group(); crowd.name = 'beach-crowd'; g.add(crowd);
    if (kinds.length) {
      // tramo frente a la cámara (|x| < 120): tres filas densas; resto de la playa: un grupo cada 30 m
      const spots = [];
      for (let x = -120; x <= 120; x += 7) for (const dz of [-8, 0, 8]) spots.push([x + (dz / 8) * 3.5, dz]);
      for (let x = BEACH.x0; x <= BEACH.x1; x += 30) if (Math.abs(x) > 124) spots.push([x, 0]);
      spots.forEach(([x, dz], i) => {
        const c = kinds[i % kinds.length].clone(true); // nodo con nombre: pivote limpio, la malla va en el hijo -geo
        c.position.set(x + (R() - 0.5) * 4, BEACH.y, BEACH.z + dz + (R() - 0.5) * 3);
        c.rotation.set(0, (R() - 0.5) * 0.5, 0); // frente glTF = +Z → miran hacia la plataforma, de espaldas al mar
        crowd.add(c);
      });
    }
    // autos de 1969 estacionados detrás del público, en la arena firme
    ['car-1', 'car-2', 'car-3', 'car-4'].forEach((n, k) => { const o = node(n); if (!o) return; const c = o.clone(true);
      c.position.set(-60 + k * 38 + (R() - 0.5) * 6, BEACH.y, BEACH.z - 14 + (R() - 0.5) * 4); c.rotation.set(0, (R() - 0.5) * 0.6 + (k % 2 ? Math.PI : 0), 0); g.add(c); });
    const van = node('astrovan'); if (van) { const v = van.clone(true); v.name = 'astrovan'; v.position.set(ASTROVAN.x, ASTROVAN.y, ASTROVAN.z); v.rotation.set(0, ASTROVAN.yaw, 0); g.add(v); }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
    return g;
  });
}
