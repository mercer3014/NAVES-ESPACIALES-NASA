// Presentación del HUD de vuelo. Sin DOM: las misiones y los tests comparten las mismas decisiones.
import { BASE, SITES } from '../sim/mars.js';

const SVG = {
  pause: '<path d="M7 4h3.2v16H7zm6.8 0H17v16h-3.2z"/>',
  chevron: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  radio: '<path d="M5 10a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="14" r="2" fill="currentColor"/><path d="M12 16v4" stroke="currentColor" stroke-width="1.6"/>',
};

export function icon(name) {
  return `<svg class="mhud-svg" viewBox="0 0 24 24" aria-hidden="true">${SVG[name] || SVG.pause}</svg>`;
}

export function objectiveCardHtml({ kicker = '', kickerClass = 'mhud-kicker', titleHtml = '', bodyHtml = '', asideClass = 'mhud-card' } = {}) {
  return `<aside class="${asideClass}" data-obj data-open="1">
    <button type="button" class="mhud-card-h" data-obj-toggle aria-expanded="true" aria-keyshortcuts="Tab">
      <span class="${kickerClass}">${kicker}</span>${icon('chevron')}
    </button>
    <div class="mhud-card-b"><div class="mhud-clip">${titleHtml}${bodyHtml}</div></div>
  </aside>`;
}

export function objectiveOpenFromKey(open) {
  return !open;
}

/** Joystick y botones de acción solo en dispositivos táctiles. */
export function showTouchChrome(touch) {
  return !!touch;
}

export function promptVisible(model, label) {
  return !!(model && String(model.key || '').trim() && String(label || '').trim());
}

export function launchPrompt({ waiting = false, les = false, blocked = false } = {}) {
  if (waiting) return blocked ? null : { key: 'ESPACIO', labelKey: 'hud.stage' };
  if (les) return { key: 'ESPACIO', labelKey: 'hud.les' };
  return null;
}

export function burnPrompt(active) {
  return active ? { key: 'ESPACIO', labelKey: 'hud.burn' } : null;
}

function near(s, x, z, r = 3.5) {
  return Math.hypot((s.rover?.x || 0) - x, (s.rover?.z || 0) - z) < r;
}

export function marsPrompt(s) {
  if (!s || s.stage === 'done' || s.stage === 'failed' || s.stage === 'build') return null;
  if (s.stage === 'landing') {
    const l = s.land || {};
    if (l.mode === 'chute' && l.alt < 260 && l.alt > 20) return { key: 'E', labelKey: 'hud.chute' };
    if (l.mode === 'powered' && l.alt < 22 && l.alt > 4 && Math.abs(l.vy) < 3 && Math.abs(l.x) < 16 && Math.abs(l.vx) < 3) return { key: 'E', labelKey: 'hud.crane' };
    return null;
  }
  if (s.stage === 'gather' || s.stage === 'grow') {
    const site = SITES.find((p, i) => !(s.collected || []).includes(i) && near(s, p.x, p.z));
    if (site) return { key: 'E', labelKey: site.k === 'ice' ? 'hud.ice' : 'hud.soil' };
    if (near(s, BASE.x, BASE.z)) {
      if (s.stage === 'gather' && s.water >= 4 && s.regolith >= 3) return { key: 'E', labelKey: 'hud.build' };
      if (s.stage === 'grow' && !s.eventFixed && ['leak', 'panel', 'fungus'].includes(s.event) && s.regolith >= 1) return { key: 'E', labelKey: 'hud.repair' };
    }
  }
  return null;
}

export function horizonPrompt(s) {
  if (!s || s.stage === 'done' || s.stage === 'failed') return null;
  const r = Math.hypot(s.x || 0, s.y || 0);
  const d = Math.hypot((s.x || 0) - (s.probe?.x || 0), (s.y || 0) - (s.probe?.y || 0));
  const dv = Math.hypot((s.vx || 0) - (s.probe?.vx || 0), (s.vy || 0) - (s.probe?.vy || 0));
  if (s.stage === 'intercept' && d < 1.15 && dv < 1.15 && r > 1.3) return { key: 'E', labelKey: 'hud.dock' };
  if (s.stage === 'escape' && s.assist && r >= 10) return { key: 'E', labelKey: 'hud.depart' };
  return null;
}
