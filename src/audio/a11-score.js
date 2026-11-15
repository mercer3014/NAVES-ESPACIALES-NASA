// Banda sonora del guion (pack Apolo 11 en /audio/a11/): música y ambiente por escena, stingers y efectos sueltos.
// score(id) se aplica solo al reproducir cada escena de la historia (story/flow.js); las fases siguen con su música.
import { Howl } from 'howler';
import { music } from '../core/audio.js';
import { store } from '../core/store.js';

const M = (n) => 'a11/music/' + n;
// id de escena → { music, amb, vol }. music: null = silencio (el guion pide cortes en seco).
export const SCORE = {
  'hotel-prologue': { music: M('mus_prologo_apolo1_duelo'), amb: 'p_02_amb_trafico_noche_ventana' },
  'mocr-tough': { music: M('mus_prologo_apolo1_duelo'), amb: 'c4_amb_mocr_sala_control' },
  'house-farewell': { music: M('mus_c1_familia_hogar'), amb: 'c1_11_amb_casa_tv_1969' },
  ksc: { music: M('mus_c1_familia_hogar'), amb: 'c1_12_amb_ksc_exterior_florida' },
  beach: { music: M('mus_c1_playa_fogata'), amb: 'c1_13_amb_playa_olas_atardecer' },
  night: { music: M('mus_c3_noche_nave_calma'), amb: 'c3_32_amb_columbia_noche_atenuada' },
  'mocr-briefing': { music: M('mus_c4_descenso_tension_pulso_loop'), amb: 'c4_amb_mocr_sala_control', vol: 0.3 },
  'mocr-1202': { music: M('mus_c4_descenso_tension_pulso_loop'), amb: 'c4_amb_mocr_sala_control', vol: 0.35 },
  'mocr-gonogo': { music: M('mus_c4_descenso_tension_pulso_loop'), amb: 'c4_amb_mocr_sala_control', vol: 0.35 },
  'mocr-landed': { music: M('mus_c4_alunizaje_alivio'), amb: 'c4_amb_mocr_sala_control' },
  'house-landed': { music: M('mus_c4_alunizaje_alivio'), amb: 'c4_47_amb_squawk_box_casa' },
  'pre-eva': { music: M('mus_c5_magnifica_desolacion'), amb: 'c5_casco_respiracion_loop', vol: 0.35 },
  'collins-solo': { music: M('mus_c6_soledad_collins'), amb: 'c6_61_amb_columbia_solo_oscuro' },
  boss: { music: null, amb: 'c6_61b_amb_eagle_noche_bombas' },
  breaker: { music: null, amb: 'c6_61b_amb_eagle_noche_bombas' },
  liftoff: { music: null, amb: 'c5_casco_respiracion_loop' },
  reunion: { music: M('mus_c6_soledad_collins'), amb: 'c2_amb_cabina_columbia_ventiladores' },
  tei: { music: M('mus_c3_detras_luna_drone_loop'), amb: 'c2_amb_cabina_columbia_ventiladores' },
  laika: { music: M('mus_c7_volver_a_casa'), amb: 'c2_amb_cabina_columbia_ventiladores' },
  tv: { music: M('mus_c7_volver_a_casa'), amb: 'c2_amb_cabina_columbia_ventiladores', vol: 0.25 },
  reentry: { music: null, amb: 'c7_73_amb_viento_descenso_loop' },
  recovery: { music: M('mus_c7_volver_a_casa'), amb: 'c7_74_amb_oceano_pacifico_loop' },
  lrl: { music: M('mus_tema_principal_piano_solo'), amb: 'c7_75_amb_cuarentena_mqf' },
  parade: { music: M('mus_tema_principal_completo'), amb: 'e_e1_amb_desfile_nueva_york' },
  epilogue: { music: M('mus_epilogo_un_gran_salto_creditos') },
};

let amb = null, ambName = null;
const vol = () => store.get('vol') || { music: 0.6, sfx: 0.8 };

export function ambience(name, v = 0.45) {
  if (name === ambName) return; stopAmbience(); if (!name) return;
  const h = new Howl({ src: [`/audio/a11/sfx/${name}.mp3`], loop: true, volume: 0 });
  const id = h.play(); h.fade(0, v * vol().sfx, 900, id); amb = h; ambName = name;
}
export function stopAmbience(fade = 700) {
  if (!amb) return; const h = amb; amb = null; ambName = null;
  h.fade(h.volume(), 0, fade); setTimeout(() => h.unload(), fade + 60);
}
export function score(id) {
  const s = SCORE[id]; if (!s) return false;
  if (s.music !== undefined) music(s.music, { vol: s.vol ?? 0.45, fade: 1200 });
  ambience(s.amb || null);
  return true;
}
const one = {};
export function a11sfx(name, v = 0.7) {
  if (!one[name]) one[name] = new Howl({ src: [`/audio/a11/sfx/${name}.mp3`], preload: true });
  const id = one[name].play(); one[name].volume(v * vol().sfx, id); return id;
}
export function stinger(name, v = 0.6) {
  const h = new Howl({ src: [`/audio/a11/music/${name}.mp3`], volume: v * vol().music });
  h.once('end', () => h.unload()); h.play();
}
