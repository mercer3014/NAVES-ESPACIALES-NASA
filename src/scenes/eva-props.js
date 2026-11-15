// Props de la EVA (cap. 5): herramientas del artista (eva-tools.glb) junto al MESA y el paquete de recuerdos (memorial-kit.glb)
// del evento oculto «Lo que dejamos atrás»: 5 objetos sueltos cerca del LM; al recogerlos todos se dejan junto a la pata delantera.
// Solo se mueven los nodos con nombre (pivotes); sus hijos '-geo' llevan la cuantización y no se tocan.
import { THREE, model } from '../core/engine.js';
import { dotTex } from './space.js';
import { rng } from '../core/util.js';

export const MEMORIAL = ['apollo1-patch', 'medal-gagarin', 'medal-komarov', 'silicon-disc', 'olive-branch'];

export async function addEvaProps(W, lx, ground, { seed = 11, onFound = () => {}, onComplete = () => {}, skip = [] } = {}) {
  const root = new THREE.Group(); root.name = 'eva-props'; W.scene.add(root);
  const env = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; const m = c.material; if (m && 'envMap' in m && W.env) { m.envMap = W.env; m.envMapIntensity = 0.5; m.needsUpdate = true; } } });
  const place = (o, x, z, yaw = 0, lift = 0) => { o.position.set(x, ground(x, z) + lift, z); o.rotation.set(0, yaw, 0); root.add(o); return o; };
  // 1) herramientas: tubos de muestreo, Hasselblad y polea LEC al pie del MESA (el martillo ya lo trae easep-props)
  const tools = await model('eva-tools').then((src) => {
    const lay = { 'core-tube-1': [-1.55, 4.55, 0.4], 'core-tube-2': [-1.4, 4.7, 0.55], hasselblad: [-0.95, 4.75, -0.6], 'lec-pulley': [-1.85, 4.25, 1.1], 'geo-hammer': [-1.2, 5.0, 0.9] };
    const out = {}; for (const [n, [dx, dz, yaw]] of Object.entries(lay)) { if (skip.includes(n)) continue; const o = src.getObjectByName(n); if (!o) continue; const c = o.clone(true); env(c); out[n] = place(c, lx + dx, dz, yaw); }
    return out;
  }).catch((e) => { console.warn('eva-tools.glb no disponible', e); return {}; });
  // 2) paquete de recuerdos: sin marcadores en el HUD (evento oculto); solo un brillo tenue que titila con el sol
  const R = rng(seed); const items = [];
  await model('memorial-kit').then((src) => {
    MEMORIAL.forEach((n, i) => { const o = src.getObjectByName(n); if (!o) return; const c = o.clone(true); env(c);
      const a = 0.6 + i * 1.15 + (R() - 0.5) * 0.5, r = 6 + R() * 9; const x = lx + Math.cos(a) * r, z = Math.sin(a) * r + 3; // alrededor del LM, fuera del radio de choque
      place(c, x, z, R() * 6.28, 0.01);
      const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xfff4d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      glint.scale.setScalar(0.18); glint.position.set(x, c.position.y + 0.06, z); root.add(glint);
      items.push({ name: n, o: c, glint, found: false, ph: R() * 6.28 }); });
  }).catch((e) => console.warn('memorial-kit.glb no disponible', e));
  let done = false, t = 0;
  return {
    root, tools, items,
    // P: jugador de la EVA ({x, z, mode}). Se recoge al pasar a menos de 0,9 m caminando.
    update(dt, P) {
      t += dt;
      for (const it of items) {
        if (!it.found) { it.glint.material.opacity = 0.25 + 0.55 * Math.max(0, Math.sin(t * 2.3 + it.ph)) ** 6;
          if (P && P.mode === 'walk' && Math.hypot(P.x - it.o.position.x, P.z - it.o.position.z) < 0.9) { it.found = true; it.o.visible = false; it.glint.visible = false; onFound(it.name, items.filter((q) => q.found).length, items.length); } }
      }
      if (!done && items.length === MEMORIAL.length && items.every((q) => q.found)) { done = true;
        // se dejan en fila sobre el regolito, delante de la pata con la escalera (como el paquete real, al final de la caminata)
        items.forEach((q, i) => { const x = lx - 0.5 + i * 0.22, z = 5.2; q.o.position.set(x, ground(x, z) + 0.01, z); q.o.rotation.set(0, 0, 0); q.o.visible = true; });
        onComplete(); }
    },
    get complete() { return done; },
    dispose() { root.removeFromParent(); },
  };
}
