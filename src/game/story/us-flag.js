// La tela de flag-mast.glb viene en blanco (la EVA le pinta la bandera del jugador). En las escenas históricas
// del Apolo 11 (despegue lunar, epílogo) se pinta la bandera que dejó la tripulación real.
import { THREE } from '../../core/engine.js';
import { renderFlag } from '../../ui/flag.js';

let tex = null;
export function dressUSFlag(root) {
  if (!root) return root;
  if (!tex) { tex = new THREE.CanvasTexture(renderFlag(document.createElement('canvas'), { mode: 'country', code: 'US' }, 512, 320)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; }
  const cloth = root.getObjectByName('flag-cloth');
  (cloth || root).traverse((o) => { if (o.isMesh && (cloth || /cloth|flag/i.test(o.name))) { o.material = o.material.clone(); o.material.map = tex; o.material.color?.set(0xffffff); o.material.side = THREE.DoubleSide; o.material.needsUpdate = true; } });
  return root;
}
