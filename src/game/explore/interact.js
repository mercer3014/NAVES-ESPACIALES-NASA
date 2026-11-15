// Interactuable más cercano dentro del radio y del cono frontal (±60°).
// El aviso es «E · Hablar con …» o «E · Inspeccionar …». El halo y el marcador los pinta quien tiene la escena.

const CONE = Math.PI / 3;

const tx = (p, lang) => (Array.isArray(p) ? p[lang] ?? p[0] : p || '');

export function angleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function pickInteractable(player, items) {
  let best = null, bestD = Infinity;
  const yaws = [player.yaw || 0];
  if (player.lookYaw != null) yaws.push(player.lookYaw);
  for (const it of items || []) {
    if (!it || it.disabled) continue;
    const dx = it.x - player.x, dz = it.z - player.z;
    const d = Math.hypot(dx, dz);
    const r = it.r ?? 1.2;
    if (d > r || d >= bestD) continue;
    const face = Math.atan2(dx, dz);
    if (!yaws.some((yaw) => Math.abs(angleDelta(face, yaw)) <= CONE)) continue;
    best = it; bestD = d;
  }
  return best;
}

export function interactPrompt(item, lang = 0) {
  if (!item) return '';
  if (item.kind === 'talk') {
    const name = tx(item.name, lang);
    return lang ? `E · Talk to ${name}` : `E · Hablar con ${name}`;
  }
  const label = tx(item.label, lang) || (lang ? 'Inspect' : 'Inspeccionar');
  return `E · ${label}`;
}

// Contorno naranja en el objeto enfocado. No importa Three: recorre materiales emisivos.
export function setHalo(root, on) {
  root?.traverse?.((m) => {
    if (m.isSkinnedMesh) return;
    const mats = m.material ? [].concat(m.material) : [];
    for (const mat of mats) {
      if (!mat?.emissive?.setHex) continue;
      if (mat.userData._e0 == null) mat.userData._e0 = mat.emissive.getHex();
      if (mat.userData._i0 == null) mat.userData._i0 = mat.emissiveIntensity ?? 1;
      if ((mat.metalness ?? 0) < 0.25) continue;
      if (on) { mat.emissive.setHex(0xff4f00); mat.emissiveIntensity = 0.35; }
      else { mat.emissive.setHex(mat.userData._e0); mat.emissiveIntensity = mat.userData._i0; }
    }
  });
}

// Marcador «!» (obligatorio) o «…» (opcional) sobre la cabeza. `THREE` lo pasa run.js.
export function makeMarker(THREE, kind = '!') {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#FF4F00'; g.fillRect(6, 6, 52, 52);
  g.fillStyle = '#0B0C0E'; g.font = '700 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(kind === '!' ? '!' : '…', 32, kind === '!' ? 34 : 30);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  s.scale.set(0.2, 0.2, 1); s.position.y = 2.05; s.name = 'xp-marker';
  return s;
}
