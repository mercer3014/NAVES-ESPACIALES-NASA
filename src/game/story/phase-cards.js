// Tarjetas de la Bitácora que se ganan jugando cada fase (misión completa en solitario) y eventos ocultos medibles.
import { unlock } from './state.js';

export function phaseCards(phase, res = {}) {
  const s = res.stats || {};
  const give = (...ids) => ids.forEach((id) => unlock(id));
  if (phase === 'prep') give('checklist-muslo', 'agc-dsky');
  if (phase === 'launch') give('despegue', 'orbita-estacionamiento', 'bruce-mccandless');
  if (phase === 'cruise') {
    give('tli', 'acoplamiento', 'modo-barbacoa', 'loi', 'eagle-lm5');
    if (s.wrong === 0) give('sextante');
    if (s.loi >= 95) give('h-ciegas'); // «Navegar a ciegas»: LOI detrás de la Luna, sin radio, con precisión ≥ 95 %
  }
  if (phase === 'descent') {
    give('eagle-alas');
    if (s.result === 'good' || s.result === 'hard') give('west-crater');
    // «Cuarenta y cinco segundos»: manual, sobre terreno llano, < 20 s de combustible y < 1 m/s vertical
    if (s.result === 'good' && s.fuel != null && s.fuel < 20 && s.vs != null && s.vs < 1) give('h-45s');
  }
  if (phase === 'eva') {
    give('primer-paso', 'huella', 'placa', 'magnifica-desolacion', 'llamada-nixon');
    if (s.photo > 0) give('hasselblad');
  }
}
