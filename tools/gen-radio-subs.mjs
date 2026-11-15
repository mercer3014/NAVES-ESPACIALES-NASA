// Genera src/audio/a11-subs.js: subtítulos (quién, inglés, español) de cada línea de radio del pack Apolo 11.
// Fuente: audio-masters/catalog.csv. Las voces recreadas traen el guion ES en la propia línea; las grabaciones reales
// de la NASA solo traen el inglés, y su traducción está aquí (NASA). Uso: node tools/gen-radio-subs.mjs
import fs from 'node:fs';

const csv = fs.readFileSync('audio-masters/catalog.csv', 'utf8').replace(/^﻿/, '');
const rows = []; let cur = '', q = false, row = [];
for (let i = 0; i < csv.length; i++) { const c = csv[i]; if (q) { if (c === '"' && csv[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; } else cur += c; }

// [quién, inglés (null = el del catálogo), español]. null en el registro entero = sin subtítulo (tonos, pitidos).
const NASA = {
  cap1_kennedy_congreso_1961: ['KENNEDY', null, '…llevar a un hombre a la Luna y traerlo de vuelta a salvo a la Tierra'],
  cap2_cuenta_regresiva_corta: ['LAUNCH CONTROL', '12, 11, 10, 9, ignition sequence starts… Liftoff!', '12, 11, 10, 9, inicio de la secuencia de ignición… ¡Despegue!'],
  cap2_cuenta_regresiva_despegue: ['LAUNCH CONTROL', 'T-minus 25 seconds… ignition sequence starts… Liftoff on Apollo 11', 'T menos 25 segundos… inicio de la secuencia de ignición… Despegue del Apolo 11'],
  cap2_despegue_ringtone_nasa: ['LAUNCH CONTROL', 'Ignition sequence starts… Liftoff… Tower cleared', 'Inicio de la secuencia de ignición… Despegue… Torre librada'],
  cap2_go_para_orbita: ['HOUSTON', null, 'Apolo 11, aquí Houston. Confirmado: tienen luz verde para la órbita.'],
  cap2_go_tli: ['HOUSTON', '…you are go for TLI, over. / Apollo 11, thank you.', '…tienen luz verde para la TLI, cambio. / Apolo 11, gracias.'],
  cap3_go_loi_nos_vemos_otro_lado: ['HOUSTON', null, 'Apolo 11, Houston: luz verde para la LOI… nos vemos al otro lado, cambio.'],
  cap3_perdida_senal_detras_luna: ['HOUSTON', null, 'Hemos perdido la señal: el Apolo 11 pasa por detrás de la Luna.'],
  cap4_30_segundos: ['DUKE (CAPCOM)', 'Thirty seconds.', 'Treinta segundos.'],
  cap4_60_segundos: ['DUKE (CAPCOM)', 'Sixty seconds.', 'Sesenta segundos.'],
  cap4_alarma_1202_loop_flight: ['MISSION CONTROL', 'Program alarm… 1202… same type we had… we\'re go on that alarm.', 'Alarma de programa… 1202… la misma que antes… seguimos adelante con esa alarma.'],
  cap4_aldrin_polvo_40_pies: ['ALDRIN', 'Forward, forward… 40 feet, down 2½, picking up some dust.', 'Adelante, adelante… 40 pies, bajando 2,5, levantando algo de polvo.'],
  cap4_base_tranquilidad_completo: ['ARMSTRONG', 'Houston, Tranquility Base here. The Eagle has landed.', 'Houston, aquí Base Tranquilidad. El Eagle ha alunizado.'],
  cap4_base_tranquilidad_eagle_aterrizado: ['ARMSTRONG', 'Houston, Tranquility Base here. The Eagle has landed.', 'Houston, aquí Base Tranquilidad. El Eagle ha alunizado.'],
  cap4_collins_todo_va_de_maravilla: ['COLLINS', 'Everything\'s going just swimmingly. Beautiful.', 'Todo va de maravilla. Precioso.'],
  cap4_descenso_completo: ['ARMSTRONG', '…The Eagle has landed.', '…El Eagle ha alunizado.'],
  cap4_duke_respuesta_tipos_azules: ['DUKE (CAPCOM)', null, 'Recibido, Tranquilidad, los copiamos en tierra. Aquí hay un montón de tipos a punto de ponerse azules…'],
  cap4_eagle_aterrizado_ringtone_nasa: ['ARMSTRONG', 'The Eagle has landed.', 'El Eagle ha alunizado.'],
  cap4_eagle_tiene_alas: ['ARMSTRONG', 'The Eagle has wings.', 'El Eagle tiene alas.'],
  cap4_go_nogo_aterrizaje_kranz: ['KRANZ', 'Okay all flight controllers, go/no go for landing… / Eagle, Houston, you\'re go for landing.', 'Atención, controladores: ¿go o no go para alunizar?… / Eagle, Houston: tienen luz verde para alunizar.'],
  cap4_go_pdi: ['HOUSTON', 'Eagle, Houston. If you read, you\'re go for powered descent, over. / Roger, understand.', 'Eagle, Houston. Si nos reciben, tienen luz verde para el descenso propulsado, cambio. / Recibido, entendido.'],
  cap4_luz_de_contacto_apagado: ['ALDRIN', 'Contact light… Okay, engine stop.', 'Luz de contacto… Bien, motor apagado.'],
  cap5_aldrin_mensaje_reflexion: ['ALDRIN', null, 'Habla el piloto del LM. Quiero aprovechar para pedir a cada persona que nos escucha… que dé gracias a su manera.'],
  cap5_armstrong_pie_escalera: ['ARMSTRONG', 'I\'m at the foot of the ladder… the surface appears very fine grained.', 'Estoy al pie de la escalera… la superficie parece de grano muy fino.'],
  cap5_armstrong_respuesta_nixon: ['ARMSTRONG', null, 'Gracias, señor presidente. Es un gran honor y un privilegio…'],
  cap5_bajando_del_lem: ['ARMSTRONG', 'I\'m going to step off the LM now.', 'Ahora voy a bajar del LM.'],
  cap5_magnifica_desolacion: ['ALDRIN', 'Beautiful view… Isn\'t that something… Magnificent sight… Magnificent desolation.', 'Qué vista… ¿No es increíble?… Una vista magnífica… Magnífica desolación.'],
  cap5_nixon_hola_neil_buzz: ['NIXON', 'Hello Neil and Buzz, I\'m talking to you by telephone from the Oval Room at the White House.', 'Hola, Neil y Buzz. Les hablo por teléfono desde el Despacho Oval de la Casa Blanca.'],
  cap5_nixon_llamada_completa: ['NIXON', 'Hello Neil and Buzz, I\'m talking to you by telephone from the Oval Room…', 'Hola, Neil y Buzz. Les hablo por teléfono desde el Despacho Oval…'],
  cap5_nixon_momento_invaluable: ['NIXON', null, 'Por un momento invaluable en toda la historia del hombre… vuelvan a salvo a la Tierra.'],
  cap5_paso_pequeno_ringtone_nasa: ['ARMSTRONG', 'I\'m going to step off the LM now… one giant leap for mankind.', 'Ahora voy a bajar del LM… un gran salto para la humanidad.'],
  cap5_placa_lectura_armstrong: ['ARMSTRONG', null, 'Aquí, hombres del planeta Tierra pisaron por primera vez la Luna, julio de 1969 d. C. Vinimos en paz en nombre de toda la humanidad.'],
  cap5_superficie_fina_polvorienta: ['ARMSTRONG', 'The surface is fine and powdery… like powdered charcoal.', 'La superficie es fina y polvorienta… como carbón en polvo.'],
  cap5_un_pequeno_paso: ['ARMSTRONG', 'That\'s one small step for (a) man, one giant leap for mankind.', 'Es un pequeño paso para un hombre, un gran salto para la humanidad.'],
  cap6_despegue_lunar_bonito: ['ALDRIN', 'That was beautiful. 26, 36 feet per second up.', 'Eso fue precioso. 26, 36 pies por segundo hacia arriba.'],
  cap6_despegue_lunar_cuenta: ['ALDRIN', '9, 8, 7, 6, 5, abort stage, engine arm, ascent, proceed.', '9, 8, 7, 6, 5, etapa de aborto, motor armado, ascenso, adelante.'],
  cap7_estable_dos: ['RECOVERY', '…command module is Stable Two, Stable Two, over.', '…el módulo de mando está en Estable Dos, Estable Dos, cambio.'],
  cap7_hornet_area_amerizaje: ['HORNET', 'Apollo 11, what\'s your splashdown area?', 'Apolo 11, ¿cuál es su zona de amerizaje?'],
  cap7_houston_volviendo_a_casa_lrl: ['HOUSTON', 'Apollo 11, Houston, how did it go? / Roger, we got you coming home.', 'Apolo 11, Houston, ¿cómo fue? / Recibido, los vemos volviendo a casa.'],
  cap7_nixon_hornet_desde_la_creacion: ['NIXON', null, '…esta es la semana más grande de la historia del mundo desde la Creación…'],
  cap7_nixon_hornet_semana_mas_grande: ['NIXON', null, 'Neil, Buzz y Mike… esta es la semana más grande de la historia del mundo desde la Creación.'],
  cap7_ultima_tv_aldrin: ['ALDRIN', null, '…la curiosidad insaciable de toda la humanidad por explorar lo desconocido.'],
  cap7_ultima_tv_armstrong: ['ARMSTRONG', null, '…Que Dios los bendiga. Buenas noches desde el Apolo 11.'],
  cap7_ultima_tv_collins: ['COLLINS', '…All you see is the three of us, but beneath the surface are thousands and thousands of others… thank you very much.', '…Solo nos ven a los tres, pero bajo la superficie hay miles y miles de personas más… muchas gracias.'],
  epi_kennedy_rice_elegimos_ir_luna: ['KENNEDY', null, 'Elegimos ir a la Luna en esta década… una que pretendemos ganar.'],
  epi_kennedy_y_despegue_montaje: ['KENNEDY', null, 'Elegimos ir a la Luna… Despegue del Apolo 11.'],
  parte1_sputnik_bip: null, ui_quindar_hawaii: null, ui_quindar_houston: null,
};
// Etiquetas de personaje del guion (en español) → inglés
const WHO_EN = [[/\(VOZ EN OFF\)/g, '(V.O.)'], [/\(SUEÑO\)/g, '(DREAM)'], [/\(ECO\)/g, '(ECHO)'], [/\(INVERTIDA\)/g, '(REVERSED)'], [/\(POR RADIO, LEJOS\)/g, '(RADIO, FAR AWAY)'],
  [/\(LECTURA DRAMATIZADA\)/g, '(DRAMATIZED READING)'], [/^VOZ DE ([A-ZÁÉÍÓÚ]+)/, 'VOICE OF $1'], [/^VOZ POR RADIO/, 'RADIO VOICE'], [/^VOZ AL TELÉFONO/, 'VOICE ON THE PHONE'],
  [/^SUSURRO/, 'WHISPER'], [/\(VOZ DE ALDRIN\)/g, "(ALDRIN'S VOICE)"], [/^ASISTENTE/, 'ASSISTANT'], [/^DIPLOMÁTICO/, 'DIPLOMAT']];
const whoEn = (w) => WHO_EN.reduce((s, [re, r]) => s.replace(re, r), w);

const out = {}; let n = 0, miss = [];
for (const r of rows.slice(1)) {
  const file = r[0].replace(/\.wav$/, ''), base = file.split('/').pop(), line = r[4] || '';
  if (!/^(nasa_real|voz_en_clonada)\//.test(file)) continue;
  if (file.startsWith('nasa_real/')) {
    if (!(base in NASA)) { miss.push(base); continue; } const e = NASA[base]; if (!e) continue;
    out[file] = [e[0], e[0], (e[1] ?? line).trim(), e[2]]; n++; continue;
  }
  const m = /^([^:«]+?):\s*«(.+?)»\s*(?:\(guion ES:\s*«(.+?)»\))?\s*$/s.exec(line);
  if (!m) { miss.push(base); continue; }
  const who = m[1].trim(); out[file] = [who, whoEn(who), m[2].trim(), (m[3] || m[2]).trim()]; n++;
}
const js = `// GENERADO por tools/gen-radio-subs.mjs desde audio-masters/catalog.csv. No editar a mano.\n// archivo → [quién ES, quién EN, texto EN (lo que se oye), texto ES]\nexport const SUBS = ${JSON.stringify(out, null, 0).replace(/\],"/g, '],\n"')};\n`;
fs.writeFileSync('src/audio/a11-subs.js', js);
console.log(`a11-subs: ${n} líneas` + (miss.length ? ` · sin subtítulo: ${miss.join(', ')}` : ''));
