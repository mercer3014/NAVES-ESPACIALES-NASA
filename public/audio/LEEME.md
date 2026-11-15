# Apolo 11: Un gran salto — Paquete de audio

Paquete de audio para el juego narrativo «Apolo 11: Un gran salto» (NASA Space Apps 2026), armado a partir de los guiones.

**Contenido:** 363 archivos (cada uno en `.wav` 48 kHz/24 bit y en `.ogg` Vorbis q6).

| Carpeta | Archivos | Qué contiene |
|---|---|---|
| `nasa_real/` | 49 | Audio REAL de la misión, recortado de fuentes de dominio público (NASA, Voz de América) |
| `sfx/` | 95 | Efectos de sonido generados en el box (síntesis procedural) |
| `music/` | 19 | Música original (piano mínimo + cuerdas) compuesta y renderizada en el box |
| `voz_en_clonada/` | 100 | **NUEVO:** todas las líneas en INGLÉS con emoción y voces CLONADAS de los protagonistas reales (ver la advertencia de derechos). Muestras en `voz_en_clonada/_muestras/` |
| `voz_placeholder/` | 100 | Voces provisionales en español con TTS neural (Piper). **Son placeholders:** hay que reemplazarlas por actores |

`catalog.csv` (UTF-8, se abre en Excel) tiene una fila por archivo con capítulo/escena, línea del guion, origen, URL de la fuente, timestamp, GET, duración, LUFS, si es loop, y licencia. Al final hay filas `FALTANTE` para las pistas sin audio.

## Notas de uso y mezcla
- **Sonoridad:** diálogos y audio real a −16 LUFS (pico −1 dBFS). La llamada completa de Nixon y el descenso completo están a −18 LUFS. Los ambientes y loops están entre −32 y −20 LUFS, la música en general a −18 LUFS, y las capas de tensión y drones entre −24 y −21 LUFS. Los SFX cortos están normalizados a pico −3 dBFS.
- **Loops:** los archivos con `loop` en el nombre (o `loop=sí` en el catálogo) tienen un crossfade de 1 s y empalman sin clic.
- **Cortes de música que pide el guion:** la música se corta en seco en el primer paso (`nasa_real/cap5_un_pequeno_paso`) y en el despegue lunar (`nasa_real/cap6_despegue_lunar_cuenta`). El tema principal completo (`mus_tema_principal_completo`) suena por primera vez en el reencuentro (6.4). En la fase 3 del Guardián vuelve el piano solo (`mus_tema_principal_piano_solo`).
- **Radio:** para el audio real conviene usar los tonos quindar reales de NASA (`nasa_real/ui_quindar_*`). Las voces placeholder con efecto `radio` ya traen quindar sintético.
- **Bitácora:** las recompensas de audio real son `cap4_alarma_1202_loop_flight` (loop MOCR), `cap4_base_tranquilidad_eagle_aterrizado`, `cap4_descenso_completo` (evento oculto), `cap4_aldrin_polvo_40_pies` (Aldrin describe el polvo lunar) y `cap5_un_pequeno_paso`. Los sonidos de desbloqueo están en `sfx/ui_bitacora_*`.
- **Sputnik:** el objeto radio de la Parte I usa `nasa_real/parte1_sputnik_bip`.

## Voces en inglés clonadas y con emoción (voz_en_clonada/)
- **Qué es:** las 100 líneas de voz del guion, traducidas a un inglés natural y actuadas con emoción según la escena. Las líneas REALES usan sus palabras originales en inglés: el discurso «Tough and Competent» de Kranz, las memorias de Collins, el texto de Safire, «You cats take it easy…», «beaming all the way home», la placa. Se mantienen los efectos de radio con quindar, teléfono, casco, eco y susurro, y la normalización a −16 LUFS. El archivo `_en` corresponde al mismo id de `voz_placeholder/`.
- **Motor:** Chatterbox TTS en inglés, de Resemble AI. Licencia **MIT**, con uso comercial del software permitido. Hace clonación de voz *zero-shot* con control de emoción por «exaggeration» y CFG, y corre en CPU (unas 3 veces más lento que el tiempo real). Cada archivo lleva la marca de agua inaudible PerTh. Se descartaron estas alternativas:
  - XTTS-v2 y F5-TTS: sus pesos tienen licencia no comercial.
  - Zonos: necesita GPU o espeak y es más pesado.
  - OpenVoice y StyleTTS2: su clonación es menos expresiva.
- **Referencias reales:** segmentos limpios extraídos de grabaciones de dominio público (NASA Highlights, loops MOCR de Apollo in Real Time y VOA) y limpiados con **DeepFilterNet** (MIT/Apache-2.0).
- **Personajes de ficción o sin audio libre:** voces elegidas de **LibriTTS-R** (CC-BY 4.0, hay que dar atribución). Los niños usan voces agudas con un ajuste de tono.
- **Control de calidad:** cada línea se transcribió con Whisper y se comparó con el texto. Las que fallaron (repeticiones o palabras cambiadas) se regeneraron con otras semillas y se eligió la mejor. La similitud de hablante con la referencia (embeddings de voz) da en promedio entre 0,88 y 0,90 para Armstrong, Aldrin, Collins y Kranz.
- **⚠️ DERECHOS:** las voces clonadas de personas reales (Armstrong, Aldrin, Collins, Kranz, Duke, Garman, Bales, Nixon y el CAPCOM) imitan su identidad vocal. Que las grabaciones fuente sean de dominio público **no** autoriza a imitar la voz. Para una publicación comercial puede hacer falta **permiso de los herederos o titulares de los derechos de imagen y voz** (derecho de publicidad), y conviene indicar en los créditos que son voces sintéticas recreadas. Para un prototipo educativo o un hackathon, márquenlas como «voz recreada por IA».
- El intento anterior de voces en español con emoción se descartó a pedido del usuario. `voz_placeholder/` (Piper, español) queda como respaldo.

| Personaje | Referencia de voz | Origen |
|---|---|---|
| ARMSTRONG | real_ARMSTRONG | CLONADA de Neil Armstrong (mensaje de TV, 23 jul 1969, NASA Day 8 Highlights 399–411 s) |
| ALDRIN | real_ALDRIN | CLONADA de Buzz Aldrin (mensaje de TV, NASA Day 8 Highlights 241–252 y 267–272 s) |
| COLLINS | real_COLLINS | CLONADA de Michael Collins (mensaje de TV, NASA Day 8 Highlights 147–161 s) |
| KRANZ | real_KRANZ | CLONADA de Gene Kranz (loops MOCR GUIDO/FLIGHT, GET 102:37, Apollo in Real Time) |
| DUKE | real_DUKE | CLONADA de Charlie Duke (CAPCOM: NASA Day 5 438–446 s + loop FLIGHT GET 135:35) |
| CAPCOM | real_CAPCOM | CLONADA del CAPCOM de la LOI (NASA Day 4 Highlights 3–31 s) |
| GARMAN | real_GARMAN | CLONADA (atribución aproximada) de Jack Garman, loop GUIDO GET 102:38:4x |
| BALES | real_BALES | CLONADA (atribución aproximada) de Steve Bales, loop GUIDO GET 102:38:5x |
| NIXON | real_NIXON | CLONADA de Richard Nixon (USS Hornet, VOA 1969) |
| SLAYTON | lib_2803 | Voz elegida (LibriTTS-R, CC-BY 4.0): grave, seca |
| DIPLOMÁTICO | lib_3752 | Voz elegida (LibriTTS-R): grave, irónica |
| ASISTENTE | lib_2086 | Voz elegida (LibriTTS-R): joven |
| VOZ AL TELÉFONO | lib_652 | Voz elegida (LibriTTS-R): grave, sombría |
| VOZ POR RADIO (SUEÑO) | real_DUKE | Voz clonada de Duke, distorsionada (sueño) |
| JAN | lib_1988 | Voz elegida (LibriTTS-R): mujer adulta, firme y contenida (no existe audio libre de Jan Armstrong) |
| RICK | lib_3081 | Voz elegida (LibriTTS-R) aguda + tono: niño de 12 años |
| MARK | lib_2412 | Voz elegida (LibriTTS-R) + tono: niño de 6 años |


## Orígenes y licencias
- **Audio real (`nasa_real/`):** dominio público, como obra del gobierno de EE. UU. Las fuentes son:
  - NASA «Apollo 11 Audio Highlights» (Day 1–9): https://www.nasa.gov/history/apollo-11-audio-highlights/
  - NASA Historical Sounds (sonidos de 2015): https://www.nasa.gov/wp-content/uploads/2015/01/
  - Cintas MOCR de NASA restauradas por **Apollo in Real Time** (Ben Feist, apolloinrealtime.org). Se usaron los loops de FLIGHT para la alarma 1202, el go/no-go de Kranz, el mensaje de Aldrin y el regreso. Se agradece dar crédito a Apollo in Real Time.
  - El discurso de Nixon en el USS Hornet viene del programa de la **Voz de América** «Eagle on the Moon» (1969), una producción del gobierno de EE. UU. La digitalización del LP es del Cold War Radio Museum.
  - Cada fila del catálogo lleva la URL exacta y el timestamp dentro del archivo de origen. Los recortes llevan 0,25 s de margen, filtro paso alto de 70 Hz, fundidos de 50/200 ms y normalización LUFS. **No se fabricó ni se "mejoró" ningún audio real:** solo se recortó, se filtró y se ajustó el nivel.
  - Para usar el nombre o el logo de NASA hay que seguir sus pautas de marca. El audio en sí es libre.
- **SFX (`sfx/`):** síntesis procedural original (numpy/scipy/pedalboard). CC0, libre para el proyecto. La alarma de programa en los auriculares es una **recreación** y no audio real.
- **Música (`music/`):** composición original (MIDI generado en el box) renderizada con fluidsynth. Se usaron **Salamander Grand Piano V3** (Alexander Holm, **CC-BY 3.0**, hay que darle crédito) y **FluidR3_GM** (Frank Wen, licencia MIT) para las cuerdas y las texturas. Los MIDI y los stems quedan en el box en `/workspace/build/mid/`.
- **Voces placeholder (`voz_placeholder/`):** Piper TTS (MIT). Licencias de las voces:
  - es_ES-davefx: CC0
  - es_ES-sharvard: CC-BY 3.0, con atribución
  - es_MX-ald: Unlicense
  - es_MX-claude: Apache-2.0
  - es_AR-daniela: CC-BY-SA 4.0, con atribución y share-alike

  Son solo para el prototipo y para sincronizar subtítulos: **hay que reemplazarlas por actores**. Las líneas REALES traducidas al español tienen además su original en inglés en `nasa_real/`.

  Reparto de voces:

  | Personaje | Voz y ajuste |
  |---|---|
  | Armstrong | davefx, más lento |
  | Aldrin | ald |
  | Collins | sharvard |
  | Kranz | davefx −2 st |
  | Slayton | sharvard −2,5 st |
  | CAPCOM/Duke | ald −1,5 st |
  | Garman | sharvard +1,5 st |
  | Bales | ald +1,5 st |
  | Jan | claude |
  | Rick | daniela +2,5 st |
  | Mark | claude +5 st |
  | Nixon (lectura) | davefx −1,5 st |

## Pistas faltantes (sin audio real disponible)
| Cap. | Escena | Línea | Motivo | Sustituto incluido |
|---|---|---|---|---|
| Cap. 4 | 4.1 Desacople | COLLINS: «Ustedes, tómenselo con calma allá en la superficie lunar» (You cats take it easy…) | Grabación a bordo (DSE, GET 099:46:21), no está en los loops MOCR públicos ni en los Highlights de NASA | voz_placeholder/c4_41_collins_tomenselo_con_calma.wav; recreación en inglés con voz clonada: voz_en_clonada/c4_41_collins_tomenselo_con_calma_en.wav |
| Cap. 4 | 4.1 Desacople | ALDRIN: «Okay, Mike» | Ídem (grabación a bordo) | voz_placeholder/c4_41_aldrin_okay_mike.wav; recreación en inglés con voz clonada: voz_en_clonada/c4_41_aldrin_okay_mike_en.wav |
| Cap. 4 | 4.2 | COLLINS (relevo): «Eagle, aquí Columbia. Acaban de darles GO para el descenso propulsado» | No localizado en los Highlights ni en el loop CAPCOM (canal 14, GET 102:30:50–102:34:00) por ASR | nasa_real/cap4_go_pdi.wav (GO real de CAPCOM) + voz_placeholder/c4_42_collins_relevo_go_descenso.wav; recreación en inglés con voz clonada: voz_en_clonada/c4_42_collins_relevo_go_descenso_en.wav |
| Cap. 7 | 7.1 | COLLINS: «Hey Houston, Apollo 11 is beaming all the way home» | No localizado en el loop FLIGHT (GET 135:28–135:40) ni en los Highlights | nasa_real/cap7_houston_volviendo_a_casa_lrl.wav (intercambio real) + voz_placeholder/c7_71_collins_vuelve_a_casa_a_todo_trapo.wav; recreación en inglés con voz clonada: voz_en_clonada/c7_71_collins_vuelve_a_casa_a_todo_trapo_en.wav |
| Prólogo | 0.3 | KRANZ: discurso «Duros y competentes» (1967) | No existe grabación del discurso | voz_placeholder/p_03_kranz_duros_y_competentes.wav; recreación en inglés con voz clonada: voz_en_clonada/p_03_kranz_duros_y_competentes_en.wav |
| Cap. 6 | 6.1 | COLLINS (VO): memorias «Carrying the Fire» | Es un texto de un libro, no audio de la misión | voz_placeholder/c6_61_collins_solo_vo.wav; recreación en inglés con voz clonada: voz_en_clonada/c6_61_collins_solo_vo_en.wav |
| Cap. 6 | 6.3 ¿Y si…? | NIXON: discurso de Safire «In Event of Moon Disaster» | Nunca se leyó en 1969, así que no hay grabación | voz_placeholder/c6_dec_safire_discurso_desastre.wav; recreación en inglés con voz clonada: voz_en_clonada/c6_dec_safire_discurso_desastre_en.wav |
| Cap. 4 | 4.4 | Tono de la alarma 1202 en los auriculares | El tono del LM no está en las cintas públicas | sfx/ (recreación con el nombre c4_44_alarma_programa_tono_casco, marcada como NO real) |
| Todos | — | Versiones en español de las líneas reales | No hay originales en español: el audio real está en inglés | voz_placeholder/ (TTS en español para subtítulos o doblaje provisional) |


## Herramientas usadas e instaladas en el box
- ffmpeg 7.1 (con libvorbis): recortes, conversión a OGG y verificación con ffprobe
- SoX y FluidSynth (entorno conda-forge en `/opt/audiotools`, porque apt no funcionaba a través del proxy)
- Soundfonts: Salamander Grand Piano V3 (SF2) y FluidR3_GM
- Python: numpy, scipy, pedalboard (Spotify; reverb, EQ, compresión, pitch), librosa, pyloudnorm (LUFS), soundfile, mido (MIDI), yt-dlp, python-docx
- faster-whisper (modelos base.en y small.en), para ubicar los momentos exactos en las grabaciones NASA
- Chatterbox TTS (inglés, clonación de voz) en un entorno Python 3.11 (`/home/box/cbx`), con PyTorch CPU 2.6, DeepFilterNet y referencias de LibriTTS-R
- Piper TTS con 5 voces en español (es_ES davefx y sharvard, es_MX ald y claude, es_AR daniela)
- No se instalaron Coqui XTTS (demasiado pesado para CPU y con licencia no comercial) ni espeak-ng (apt roto; no hacía falta)

## Catálogo por carpeta
### nasa_real/
| Archivo | Cap./escena | Línea / uso | Origen | Dur. (s) |
|---|---|---|---|---|
| `cap7_ultima_tv_collins` | Cap 7 · Última transmisión de TV | Collins: …All you see is the three of us, but beneath the surface are thousands and thousands of others … thank you very much | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-08-Highlights.mp3) · 01:02.40–03:19.20 del MP3 · GET 177:2x | 137.3 |
| `cap7_nixon_hornet_semana_mas_grande` | Cap 7 · Recibimiento en el USS Hornet (24 jul 1969) | Neil, Buzz and Mike … this is the greatest week in the history of the world since the Creation | [fuente](https://www.coldwarradiomuseum.com/wp-content/uploads/2019/07/Eagle-on-the-Moon-Voice-of-America-1969-Edited.mp3) · 29:19.00–30:02.40 del MP3 · GET n/a (24 jul 1969, 08:55 hora local) | 43.9 |
| `cap7_nixon_hornet_desde_la_creacion` | Cap 7 · Recibimiento en el USS Hornet | …this is the greatest week in the history of the world since the Creation… | [fuente](https://www.coldwarradiomuseum.com/wp-content/uploads/2019/07/Eagle-on-the-Moon-Voice-of-America-1969-Edited.mp3) · 29:39.60–30:02.40 del MP3 · GET n/a | 23.3 |
| `cap2_cuenta_regresiva_despegue` | Cap 2 · Despegue (16 jul 1969) | T-minus 25 s … ignition sequence starts … Liftoff on Apollo 11 | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-01-Highlights.mp3) · 01:40.00–02:14.30 del MP3 · GET T−00:00:25 a T+00:00:10 | 34.8 |
| `cap2_cuenta_regresiva_corta` | Cap 2 · Despegue | 12, 11, 10, 9, ignition sequence starts … Liftoff | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-01-Highlights.mp3) · 01:51.60–02:14.30 del MP3 · GET T−00:00:12 | 23.2 |
| `cap2_go_para_orbita` | Cap 2 · Órbita terrestre | Apollo 11, this is Houston. You are confirmed go for orbit | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-01-Highlights.mp3) · 03:07.70–03:11.90 del MP3 · GET 000:11:xx | 4.7 |
| `cap2_go_tli` | Cap 2 · Inyección translunar (TLI) | …you are go for TLI, over / Apollo 11, thank you | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-01-Highlights.mp3) · 03:22.70–03:31.50 del MP3 · GET 002:27:xx | 9.3 |
| `cap3_go_loi_nos_vemos_otro_lado` | Cap 3 · Inserción en órbita lunar / lado oculto | Apollo 11, Houston, you are go for LOI … we'll see you on the other side, over | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-04-Highlights.mp3) · 00:02.90–00:43.30 del MP3 · GET 075:41:xx | 40.9 |
| `cap3_perdida_senal_detras_luna` | Cap 3 · Lado oculto (LOS) | And we've had loss of signal as Apollo 11 goes behind the Moon | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-04-Highlights.mp3) · 00:45.60–00:51.20 del MP3 · GET 075:41:xx | 6.1 |
| `cap4_eagle_tiene_alas` | Cap 4 · Desacople | The Eagle has wings | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 00:02.70–00:07.70 del MP3 · GET 100:12:xx | 5.5 |
| `cap4_collins_todo_va_de_maravilla` | Cap 4 · Desacople / Collins solo | Everything's going just swimmingly. Beautiful | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 00:44.90–00:47.50 del MP3 · GET 100:xx | 3.1 |
| `cap4_go_pdi` | Cap 4 · Descenso motorizado (PDI) | Eagle, Houston. If you read, you're go for powered descent, over / Roger, understand | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 01:29.50–01:36.10 del MP3 · GET 102:33:xx | 7.1 |
| `cap4_descenso_completo` | Cap 4 · Evento oculto Bitácora: audio completo del descenso | Descenso completo hasta "The Eagle has landed" y respuesta de Duke | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 03:20.00–07:26.00 del MP3 · GET 102:3x–102:45:58 | 246.5 |
| `cap4_60_segundos` | Cap 4 · Descenso: combustible | Sixty seconds | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 06:11.50–06:15.20 del MP3 · GET 102:44:31 | 4.2 |
| `cap4_aldrin_polvo_40_pies` | Cap 4 · Descenso final | Forward, forward … 40 feet, down 2½, picking up some dust | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 06:16.00–06:32.20 del MP3 · GET 102:44:4x | 16.7 |
| `cap4_30_segundos` | Cap 4 · Descenso: combustible | Thirty seconds | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 06:42.60–06:44.30 del MP3 · GET 102:45:08 | 2.2 |
| `cap4_luz_de_contacto_apagado` | Cap 4 · Contacto | Contact light … Okay, engine stop | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 06:52.10–06:58.40 del MP3 · GET 102:45:40 | 6.8 |
| `cap4_base_tranquilidad_eagle_aterrizado` | Cap 4 · Alunizaje | Houston, Tranquility Base here. The Eagle has landed | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 07:15.60–07:18.40 del MP3 · GET 102:45:58 | 3.3 |
| `cap4_duke_respuesta_tipos_azules` | Cap 4 · Alunizaje | Roger, Tranquility, we copy you on the ground. You got a bunch of guys about to turn blue… | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 07:18.70–07:25.60 del MP3 · GET 102:46:06 | 7.4 |
| `cap4_base_tranquilidad_completo` | Cap 4 · Alunizaje | The Eagle has landed + respuesta de Duke | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 07:15.60–07:25.60 del MP3 · GET 102:45:58 | 10.5 |
| `cap4_alarma_1202_loop_flight` | Cap 4 · Alarma 1202 (decisión de Bales/Garman) | Program alarm … 1202 … same type we had … we're go on that alarm | [fuente](https://media.apolloinrealtime.org/A11/MOCR_audio/T884b_defluttered_mp3_16/defluttered_A11_T884b_HR1U_CH7.mp3) · GET 102:38:26–102:38:59 aprox. (canal 7, inicio extracto GET 102:37:00) · GET 102:38:2x | 34.1 |
| `cap4_go_nogo_aterrizaje_kranz` | Cap 4 · Go/No-Go para aterrizar | Okay all flight controllers, go/no go for landing. Retro … CAPCOM, we're go for landing / Eagle, Houston, you're go for landing / 1201 | [fuente](https://media.apolloinrealtime.org/A11/MOCR_audio/T884b_defluttered_mp3_16/defluttered_A11_T884b_HR1U_CH7.mp3) · GET 102:42:01–102:42:29 aprox. (canal 7, inicio extracto GET 102:37:00) · GET 102:42:0x | 28.6 |
| `cap5_armstrong_pie_escalera` | Cap 5 · Primer paso | I'm at the foot of the ladder … surface appears very fine grained | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 11:33.40–11:59.70 del MP3 · GET 109:23:xx | 26.8 |
| `cap5_bajando_del_lem` | Cap 5 · Primer paso | I'm going to step off the LM now | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 12:11.50–12:13.50 del MP3 · GET 109:24:13 | 2.5 |
| `cap5_un_pequeno_paso` | Cap 5 · Primer paso (la música se corta) | That's one small step for (a) man, one giant leap for mankind | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 12:22.60–12:30.60 del MP3 · GET 109:24:23 | 8.5 |
| `cap5_superficie_fina_polvorienta` | Cap 5 · Superficie | The surface is fine and powdery … like powdered charcoal | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 12:38.70–12:57.90 del MP3 · GET 109:24:4x | 19.7 |
| `cap5_magnifica_desolacion` | Cap 5 · Aldrin baja | Beautiful view / Isn't that something / Magnificent sight … Magnificent desolation | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 14:32.90–14:44.20 del MP3 · GET 109:43:1x | 11.8 |
| `cap5_placa_lectura_armstrong` | Cap 5 · Placa | Here men from the planet Earth first set foot upon the Moon, July 1969 A.D. We came in peace for all mankind | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 14:48.00–15:28.00 del MP3 · GET 109:52:xx | 40.5 |
| `cap5_nixon_llamada_completa` | Cap 5 · Llamada de Nixon | Llamada completa desde el Despacho Oval y respuesta de Armstrong | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 15:55.90–18:03.90 del MP3 · GET 110:16:xx | 128.5 |
| `cap5_nixon_hola_neil_buzz` | Cap 5 · Llamada de Nixon | Hello Neil and Buzz, I'm talking to you by telephone from the Oval Room | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 16:13.50–16:19.30 del MP3 · GET 110:16:xx | 6.3 |
| `cap5_nixon_momento_invaluable` | Cap 5 · Llamada de Nixon | For one priceless moment in the whole history of man … return safely to Earth | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 16:59.90–17:21.80 del MP3 · GET 110:17:xx | 22.4 |
| `cap5_armstrong_respuesta_nixon` | Cap 5 · Llamada de Nixon | Thank you, Mr. President. It's a great honor and privilege… | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-05-Highlights.mp3) · 17:22.50–17:46.50 del MP3 · GET 110:17:xx | 24.5 |
| `cap5_aldrin_mensaje_reflexion` | Cap 5 · Antes del EVA (comunión) | This is the LM pilot. I'd like to take this opportunity to ask every person listening … to give thanks in his or her own way | [fuente](https://media.apolloinrealtime.org/A11/MOCR_audio/T884b_defluttered_mp3_16/defluttered_A11_T884b_HR1U_CH7.mp3) · GET 105:25:39–105:26:06 aprox. (canal 7, inicio extracto GET 105:18:00) · GET 105:25:4x | 26.8 |
| `cap6_despegue_lunar_cuenta` | Cap 6 · Despegue lunar (la música se corta) | 9, 8, 7, 6, 5, abort stage, engine arm, ascent, proceed | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-06-Highlights.mp3) · 01:40.90–01:48.90 del MP3 · GET 124:22:00 | 8.5 |
| `cap6_despegue_lunar_bonito` | Cap 6 · Despegue lunar | That was beautiful. 26, 36 feet per second up | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-06-Highlights.mp3) · 01:54.50–01:58.30 del MP3 · GET 124:22:1x | 4.3 |
| `cap7_houston_volviendo_a_casa_lrl` | Cap 7 · Tras TEI (regreso) | Apollo 11, Houston, how did it go? / Time to open up the LRL doors, Charlie / Roger, we got you coming home | [fuente](https://media.apolloinrealtime.org/A11/MOCR_audio/T888_defluttered_mp3_16/defluttered_A11_T888_HR1U_CH7.mp3) · GET 135:35:14–135:35:27 aprox. (canal 7, inicio extracto GET 135:28:00) · GET 135:35:xx | 12.9 |
| `cap7_ultima_tv_aldrin` | Cap 7 · Última transmisión de TV | …the insatiable curiosity of all mankind to explore the unknown | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-08-Highlights.mp3) · 04:01.00–04:36.10 del MP3 · GET 177:3x | 35.6 |
| `cap7_ultima_tv_armstrong` | Cap 7 · Última transmisión de TV | …God bless you. Good night from Apollo 11 | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-08-Highlights.mp3) · 07:52.40–08:10.80 del MP3 · GET 177:4x | 18.9 |
| `cap7_hornet_area_amerizaje` | Cap 7 · Amerizaje | Hornet: Apollo 11, what's your splashdown area? / respuesta con coordenadas | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-09-Highlights.mp3) · 88:19.00–88:34.60 del MP3 · GET 195:1x | 16.1 |
| `cap7_estable_dos` | Cap 7 · Amerizaje (cápsula invertida) | …command module is Stable Two, Stable Two, over | [fuente](https://www.nasa.gov/wp-content/uploads/2015/03/Apollo-11_Day-09-Highlights.mp3) · 91:07.20–91:12.80 del MP3 · GET 195:2x | 6.1 |
| `epi_kennedy_rice_elegimos_ir_luna` | Epílogo / Cap 1 · Discurso de Rice (12 sep 1962) | We choose to go to the Moon in this decade … one we intend to win | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/586447main_JFKwechoosemoonspeech.mp3) · 00:00.00–00:27.00 · GET n/a | 27.0 |
| `cap1_kennedy_congreso_1961` | Cap 1 / Prólogo · Discurso ante el Congreso (25 may 1961) | …landing a man on the Moon and returning him safely to the Earth | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/591240main_JFKmoonspeech.mp3) · 00:00.00–00:10.80 · GET n/a | 10.8 |
| `epi_kennedy_y_despegue_montaje` | Epílogo / créditos · Montaje NASA | We choose to go to the Moon … Liftoff on Apollo 11 | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/590325main_ringtone_kennedy_WeChoose.mp3) · 00:00.00–00:20.50 · GET n/a | 20.09 |
| `parte1_sputnik_bip` | Parte I (objeto radio) · Radio: bip-bip del Sputnik (1957) | bip-bip | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/578626main_sputnik-beep.mp3) · archivo completo · GET n/a | 4.39 |
| `ui_quindar_houston` | Cap 2–7 (radio) · Tonos quindar reales (Houston) | tono quindar | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/578628main_hskquindar.mp3) · archivo completo · GET n/a | 24.42 |
| `ui_quindar_hawaii` | Cap 2–7 (radio) · Tonos quindar reales (estación Hawái) | tono quindar | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/578629main_hawquindar.mp3) · archivo completo · GET n/a | 24.24 |
| `cap4_eagle_aterrizado_ringtone_nasa` | Cap 4 · Alunizaje (versión NASA limpia) | The Eagle has landed + Duke | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/590333main_ringtone_eagleHasLanded_extended.mp3) · archivo completo · GET 102:45:58 | 14.81 |
| `cap5_paso_pequeno_ringtone_nasa` | Cap 5 · Primer paso (versión NASA limpia) | I'm going to step off the LM now … one giant leap for mankind | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/590331main_ringtone_smallStep.mp3) · archivo completo · GET 109:24 | 12.98 |
| `cap2_despegue_ringtone_nasa` | Cap 2 · Despegue (versión NASA limpia) | Ignition sequence starts … Liftoff … Tower cleared | [fuente](https://www.nasa.gov/wp-content/uploads/2015/01/590320main_ringtone_apollo11_countdown.mp3) · archivo completo · GET T−00:00:09 | 24.82 |

### music/
| Archivo | Cap./escena | Línea / uso | Origen | Dur. (s) |
|---|---|---|---|---|
| `mus_tema_principal_completo` | Cap. 6 / Epílogo · 6.4 El reencuentro (Confianza > 50) · Menú · Créditos | «Música principal del juego por primera vez completa» — piano + cuerdas. | Generado (composición original: piano + cuerdas) | 117.18 |
| `mus_tema_principal_piano_solo` | No Canon / general · 6.1C «la música vuelve, solo piano»; momentos íntimos | Tema principal en piano solo. | Generado (composición original: piano + cuerdas) | 35.91 |
| `mus_prologo_apolo1_duelo` | Prólogo · 0.2–0.3 Tras la noticia del incendio; discurso de Kranz | Duelo contenido por Gus, Ed y Roger; cuerdas lentas y piano. | Generado (composición original: piano + cuerdas) | 40.25 |
| `mus_c1_familia_hogar` | Cap. 1 · 1.1 Casa de los Armstrong | Calma doméstica cálida (despedida de los niños). | Generado (composición original: piano + cuerdas) | 33.22 |
| `mus_c1_playa_fogata` | Cap. 1 · 1.3 Playa de Cabo Kennedy (conversación de fogata) | Conversación íntima al atardecer. | Generado (composición original: piano + cuerdas) | 39.25 |
| `mus_c2_cuenta_regresiva_tension` | Cap. 2 · 2.2 Revisión del panel antes del despegue | Tensión creciente hasta la ignición; cortar en el «cero» y dejar solo el audio real + rumble. | Generado (composición original: piano + cuerdas) | 46.51 |
| `mus_c3_noche_nave_calma` | Cap. 3 · 3.2 Conversación nocturna («Marion Moon», Karen) | Calma nocturna (estilo TLOU). | Generado (composición original: piano + cuerdas) | 43.91 |
| `mus_c3_detras_luna_drone_loop` | Cap. 3/6/7 · 3.4 LOI; 6.1; 7.1 detrás de la Luna | Dron grave de tensión silenciosa (loop) para «SIN CONTACTO CON LA TIERRA». | Generado (composición original: piano + cuerdas) | 62.0 |
| `mus_c4_descenso_tension_pulso_loop` | Cap. 4 · 4.3–4.6 Descenso (bajo el audio real; bajar en 1202 y cortar en «Apagado») | Pulso de tensión del descenso (loop). | Generado (composición original: piano + cuerdas) | 41.74 |
| `mus_c4_alunizaje_alivio` | Cap. 4 · 4.6–4.7 Tras «El Águila ha aterrizado» / casa de los Armstrong | Alivio: cuerdas que se abren en Fa mayor (entrar después de la respuesta de Duke). | Generado (composición original: piano + cuerdas) | 25.47 |
| `mus_c5_magnifica_desolacion` | Cap. 5 · 5.3–5.6 Superficie lunar (exploración) | Quintas abiertas, notas altas sueltas: inmensidad y vacío. (Nunca bajo el primer paso.) | Generado (composición original: piano + cuerdas) | 45.12 |
| `mus_c6_soledad_collins` | Cap. 6 · 6.1 Collins solo detrás de la Luna («uno más Dios sabe qué») | Violín solo sobre cuerdas: soledad y asombro. | Generado (composición original: piano + cuerdas) | 46.92 |
| `mus_nc_guardian_combate_loop` | No Canon · 6.1B/6.1C combate (fases 1–2; cortar en fase 3: «la música se corta») | Ostinato de cuerdas en Re menor, piano grave y timbales (loop). | Generado (composición original: piano + cuerdas) | 27.43 |
| `mus_c7_volver_a_casa` | Cap. 7 · 7.1B «La perrita» / regreso; 7.6 vidrio de cuarentena | Tema principal en Fa mayor, piano solo, esperanzado. | Generado (composición original: piano + cuerdas) | 32.35 |
| `mus_epilogo_un_gran_salto_creditos` | Epílogo · E.1–E.3 / créditos | Versión lenta del tema completo para el epílogo y créditos (≈400.000 personas). | Generado (composición original: piano + cuerdas) | 127.6 |
| `mus_stinger_decision_tomada` | Todos · Diagrama de flujo / decisión registrada | Stinger musical corto. | Generado (composición original: piano + cuerdas) | 11.04 |
| `mus_stinger_ruta_historica_dorada` | Todos · Línea dorada: ruta histórica confirmada | Stinger musical corto. | Generado (composición original: piano + cuerdas) | 11.02 |
| `mus_stinger_final_y_si_alternativo` | Cap. 4/6 · Pantallas «¿Y si…?» (aborto, pata en roca, combustible cero, discurso de Safire) | Stinger musical corto. | Generado (composición original: piano + cuerdas) | 11.1 |
| `mus_stinger_insignia_capitulo_100` | Todos · Insignia al 100 % («Duros y competentes», «Base Tranquilidad»…) | Stinger musical corto. | Generado (composición original: piano + cuerdas) | 12.76 |

### sfx/
| Archivo | Cap./escena | Línea / uso | Origen | Dur. (s) |
|---|---|---|---|---|
| `p_02_telefono_hotel_timbre` | Prólogo · 0.2 Hotel Georgetown Inn | El teléfono suena (teléfono de disco 1967, campanilla electromecánica). | Generado (síntesis procedural) | 18.0 |
| `p_02_telefono_descolgar` | Prólogo · 0.2 | Neil contesta el teléfono (descolgar auricular). | Generado (síntesis procedural) | 1.2 |
| `p_02_telefono_colgar` | Prólogo · 0.2 | Auricular colgado al terminar la llamada. | Generado (síntesis procedural) | 1.0 |
| `p_02_amb_trafico_noche_ventana` | Prólogo · 0.2 | «Silencio… Solo se escucha el tráfico afuera.» (loop) | Generado (síntesis procedural) | 59.0 |
| `p_01_amb_salon_casa_blanca` | Prólogo · 0.1 Casa Blanca, salón | Copas de champán y diplomáticos murmurando (loop). | Generado (síntesis procedural) | 44.0 |
| `p_03_tiza_pizarra` | Prólogo · 0.3 Control de Misión | Los controladores escriben «TOUGH AND COMPETENT» en sus pizarras. | Generado (síntesis procedural) | 6.0 |
| `c1_11_amb_casa_tv_1969` | Cap. 1 · 1.1 Casa Armstrong | Rick ve televisión: zumbido de TV de tubo (loop). | Generado (síntesis procedural) | 39.0 |
| `c1_11_cohete_juguete_etapas` | Cap. 1 · 1.1 (objeto) | Cohete de plástico de Mark: al girarlo se separan las etapas. | Generado (síntesis procedural) | 1.5 |
| `c1_12_amb_ksc_exterior_florida` | Cap. 1 · 1.2 Centro Espacial Kennedy | Florida húmeda: viento, insectos, pájaros lejanos (loop). | Generado (síntesis procedural) | 59.0 |
| `c1_13_amb_playa_olas_atardecer` | Cap. 1 · 1.3 Playa de Cabo Kennedy | «Silencio. Las olas.» (loop) | Generado (síntesis procedural) | 59.0 |
| `c2_21_despertador` | Cap. 2 · 2.1 Cuarteles 04:15 | Despertador (campanilla mecánica). | Generado (síntesis procedural) | 5.0 |
| `ui_interruptor_toggle_a` | Cap. 2/3/4/6 · 2.2, 3.3, 6.2 paneles | Interruptor de panel (toggle) para checklists; variante a | Generado (síntesis procedural) | 0.35 |
| `ui_interruptor_toggle_b` | Cap. 2/3/4/6 · 2.2, 3.3, 6.2 paneles | Interruptor de panel (toggle) para checklists; variante b | Generado (síntesis procedural) | 0.35 |
| `ui_interruptor_toggle_c` | Cap. 2/3/4/6 · 2.2, 3.3, 6.2 paneles | Interruptor de panel (toggle) para checklists; variante c | Generado (síntesis procedural) | 0.35 |
| `ui_checklist_tachar_lapiz` | Cap. 2 · 2.2 Checklist del muslo | Tachar ítems de la checklist. | Generado (síntesis procedural) | 1.3 |
| `c2_amb_cabina_columbia_ventiladores` | Cap. 2/3/7 · 2.2, 3.1, 3.4, 7.1 | Interior de Columbia: ventiladores y bombas (loop). | Generado (síntesis procedural) | 59.0 |
| `c2_22_despegue_saturnv_cabina` | Cap. 2 · 2.2 Despegue 13:32:00 UTC | «La cabina tiembla. Ruido ensordecedor.» (interior de cabina) | Generado (síntesis procedural) | 40.0 |
| `c2_22_despegue_exterior_rumble_loop` | Cap. 2 · 2.2 Cinemática exterior | El Saturn V asciende sobre una columna de fuego (crujido grave, loop). | Generado (síntesis procedural) | 59.0 |
| `c2_23_separacion_etapas` | Cap. 2 · 2.3 Separación de etapas | Golpe seco de separación y sacudida. | Generado (síntesis procedural) | 4.0 |
| `c2_24_tli_motor_s4b_loop` | Cap. 2 · 2.4 TLI | Encendido de la S-IVB transmitido por la estructura (loop). | Generado (síntesis procedural) | 29.0 |
| `c2_25_rcs_propulsor_pulso` | Cap. 2/6 · 2.5, 6.4 Acoplamiento | Pulso de propulsor RCS oído a través del casco. | Generado (síntesis procedural) | 0.4 |
| `c2_25_acople_captura_pestillos` | Cap. 2/6 · 2.5, 6.4 Acoplamiento | Captura de la sonda y cierre de los pestillos del túnel. | Generado (síntesis procedural) | 2.5 |
| `c3_32_amb_columbia_noche_atenuada` | Cap. 3 · 3.2 «Noche» | Cabina en reposo (loop). | Generado (síntesis procedural) | 59.0 |
| `ui_dsky_tecla_1` | Cap. 3/4 · 3.1 AGC/DSKY | Tecla del DSKY (Verbo + Sustantivo). | Generado (síntesis procedural) | 0.25 |
| `ui_dsky_tecla_2` | Cap. 3/4 · 3.1 AGC/DSKY | Tecla del DSKY (Verbo + Sustantivo). | Generado (síntesis procedural) | 0.25 |
| `ui_dsky_tecla_3` | Cap. 3/4 · 3.1 AGC/DSKY | Tecla del DSKY (Verbo + Sustantivo). | Generado (síntesis procedural) | 0.25 |
| `c3_31_sextante_ajuste` | Cap. 3/6 · 3.1 Sextante; 6.1 | Ajuste del sextante. | Generado (síntesis procedural) | 1.2 |
| `c3_34_radio_corte_los` | Cap. 3/6/7 · 3.4 LOS; 6.1; 7.1 | «La radio se corta: pérdida de señal (LOS).» | Generado (síntesis procedural) | 3.0 |
| `c3_34_radio_vuelve_aos` | Cap. 3/6/7 · 3.4 AOS; 7.1 | Vuelve la señal: estática + tono quindar. | Generado (síntesis procedural) | 2.2 |
| `c3_34_sps_motor_encendido_loop` | Cap. 3/7 · 3.4 LOI (357,5 s); 7.1 TEI | Motor SPS sentido en la cabina (loop). | Generado (síntesis procedural) | 39.0 |
| `c3_34_sps_ignicion_golpe` | Cap. 3/7 · 3.4; 7.1 | Golpe de ignición del SPS. | Generado (síntesis procedural) | 1.5 |
| `c3_34_respiracion_tres_tripulantes` | Cap. 3 · 3.4 Sin contacto | «Solo se oye la respiración de los tres» (loop). | Generado (síntesis procedural) | 59.0 |
| `c4_41_desacople_eagle` | Cap. 4 · 4.1 Desacople 17:44 UTC | Eagle se separa de Columbia. | Generado (síntesis procedural) | 2.5 |
| `c4_42_puertas_mocr_cierre` | Cap. 4 · 4.2 Control de Misión | «Ordena cerrar las puertas de la sala.» | Generado (síntesis procedural) | 2.5 |
| `c4_amb_mocr_sala_control` | Cap. 0/4 · 0.3, 4.2–4.5 MOCR | Sala de control: fluorescentes, consolas, papeles, murmullo (loop). | Generado (síntesis procedural) | 59.0 |
| `c4_44_alarma_programa_tono_casco` | Cap. 4 · 4.4 «Es una 1202» | «Suena un tono en los auriculares.» Recreación (no es audio real). | Generado (síntesis procedural) | 8.0 |
| `c4_43_motor_descenso_dps_loop` | Cap. 4 · 4.3–4.6 PDI | Motor de descenso dentro de la cabina (loop). | Generado (síntesis procedural) | 59.0 |
| `ui_c4_44_temporizador_10s` | Cap. 4 · 4.4 Decisión de Bales | Temporizador de 10 segundos. | Generado (síntesis procedural) | 10.5 |
| `c4_46_contacto_apagado_motor` | Cap. 4 · 4.6 «Luz de contacto… Apagado» | Motor que se corta, contacto, crujidos y silencio absoluto. | Generado (síntesis procedural) | 6.0 |
| `c4_47_amb_squawk_box_casa` | Cap. 4 · 4.7 Casa Armstrong (squawk box) | Siseo del altavoz instalado por la NASA (loop). | Generado (síntesis procedural) | 59.0 |
| `c5_52_escotilla_despresurizar` | Cap. 5 · 5.2 Escotilla 02:39 | Despresurización y escotilla que se abre. | Generado (síntesis procedural) | 4.0 |
| `c5_52_traje_cierre_casco` | Cap. 5 · 5.2 Secuencia de traje | Colocar casco: anillo de bloqueo. | Generado (síntesis procedural) | 1.2 |
| `c5_52_traje_cierre_guantes` | Cap. 5 · 5.2 Secuencia de traje | Colocar guantes: anillo de bloqueo. | Generado (síntesis procedural) | 1.2 |
| `c5_52_traje_cierre_mochila_plss` | Cap. 5 · 5.2 Secuencia de traje | Colocar mochila plss: anillo de bloqueo. | Generado (síntesis procedural) | 1.2 |
| `c5_casco_respiracion_loop` | Cap. 5/6 · 5.2–5.7; 6.1B | Dentro del casco: respiración y ventilador (loop). | Generado (síntesis procedural) | 59.0 |
| `c5_paso_bota_regolito_1` | Cap. 5/6 · 5.2 primer paso; 5.3–5.6; 6.1B | Paso de bota en regolito oído a través del traje. | Generado (síntesis procedural) | 0.5 |
| `c5_paso_bota_regolito_2` | Cap. 5/6 · 5.2 primer paso; 5.3–5.6; 6.1B | Paso de bota en regolito oído a través del traje. | Generado (síntesis procedural) | 0.5 |
| `c5_paso_bota_regolito_3` | Cap. 5/6 · 5.2 primer paso; 5.3–5.6; 6.1B | Paso de bota en regolito oído a través del traje. | Generado (síntesis procedural) | 0.5 |
| `c5_paso_bota_regolito_4` | Cap. 5/6 · 5.2 primer paso; 5.3–5.6; 6.1B | Paso de bota en regolito oído a través del traje. | Generado (síntesis procedural) | 0.5 |
| `c5_54_mastil_golpe_1` | Cap. 5 · 5.4 Clavar el mástil | Golpe sordo sobre el mástil; suelo duro. | Generado (síntesis procedural) | 0.8 |
| `c5_54_mastil_golpe_2` | Cap. 5 · 5.4 Clavar el mástil | Golpe sordo sobre el mástil; suelo duro. | Generado (síntesis procedural) | 0.8 |
| `c5_54_mastil_golpe_3` | Cap. 5 · 5.4 Clavar el mástil | Golpe sordo sobre el mástil; suelo duro. | Generado (síntesis procedural) | 0.8 |
| `c5_56_hasselblad_disparo` | Cap. 5 · 5.6 Hasselblad | Disparo y arrastre de película. | Generado (síntesis procedural) | 0.6 |
| `c5_56_pinzas_muestra` | Cap. 5 · 5.6 Pinzas | Pinzas que toman una roca. | Generado (síntesis procedural) | 0.7 |
| `c5_57_disyuntor_roto_chasquido` | Cap. 5 · 5.7 Disyuntor roto | Chasquido del disyuntor al chocar con la mochila. | Generado (síntesis procedural) | 1.5 |
| `c5_57_polea_cajas_muestras` | Cap. 5 · 5.7 Fin de la caminata | Polea de las cajas de muestras. | Generado (síntesis procedural) | 6.0 |
| `c5_57_fin_capitulo_respiracion` | Cap. 5 · 5.7 FIN DEL CAPÍTULO | «Pantalla en negro con el sonido de una respiración.» | Generado (síntesis procedural) | 10.0 |
| `c6_61_amb_columbia_solo_oscuro` | Cap. 6 · 6.1 Collins solo | Cabina a oscuras sin radio (loop). | Generado (síntesis procedural) | 59.0 |
| `c6_61b_amb_eagle_noche_bombas` | Cap. 6 · 6.1B Eagle, noche lunar | «El zumbido de las bombas.» (loop) | Generado (síntesis procedural) | 59.0 |
| `c6_62_rotulador_disyuntor_clic` | Cap. 6 · 6.2 Puzle del disyuntor | Rotulador empuja el disyuntor. Clic. | Generado (síntesis procedural) | 1.2 |
| `c6_62_chispa_cortocircuito` | Cap. 6 · 6.2 Opción incorrecta | Chispa de cortocircuito (antes de «Negativo, Eagle. Nada conductor»). | Generado (síntesis procedural) | 1.5 |
| `c6_63_despegue_lunar_ascenso` | Cap. 6 · 6.3 Despegue lunar 17:54 UTC | Pirotecnia y motor de ascenso dentro de Eagle. | Generado (síntesis procedural) | 15.0 |
| `nc_61b_micrometeorito_impactos` | No Canon · 6.1B Fase 1 | Impactos sentidos por las botas. | Generado (síntesis procedural) | 4.0 |
| `nc_61b_aviso_circulo_rojo` | No Canon · 6.1B Fase 1 | Aviso de zona de impacto en el HUD. | Generado (síntesis procedural) | 1.2 |
| `nc_61b_grieta_suelo_se_abre` | No Canon · 6.1B Fase 2 | El suelo se abre. | Generado (síntesis procedural) | 6.0 |
| `nc_61c_guardian_vibracion_loop` | No Canon · 6.1C El Guardián | «No hace ruido. Solo se siente: vibración» (loop sub-grave). | Generado (síntesis procedural) | 7.0 |
| `nc_61c_guardian_se_forma` | No Canon · 6.1C Cinemática | El polvo se eleva y se compacta. | Generado (síntesis procedural) | 5.0 |
| `nc_hab_flash_hasselblad` | No Canon · 6.1B/C Habilidad | Flash de la Hasselblad: carga y destello. | Generado (síntesis procedural) | 1.5 |
| `nc_hab_martillo_basalto` | No Canon · 6.1B/C Habilidad | Martillo geológico rompe basalto. | Generado (síntesis procedural) | 1.0 |
| `nc_hab_esquiva_dash` | No Canon · 6.1B Esquiva | Impulso lateral. | Generado (síntesis procedural) | 0.6 |
| `nc_hab_manguera_o2_recarga` | No Canon · 6.1B/C «Respiramos juntos» | Manguera de O2: siseo de recarga. | Generado (síntesis procedural) | 3.0 |
| `nc_61c_pitido_alarma_maestra_lluvia1202` | No Canon · 6.1C Fase 1 | Pitido antes de la «lluvia 1202». | Generado (síntesis procedural) | 2.4 |
| `nc_61c_ondas_calor_fase3_loop` | No Canon · 6.1C Fase 3 | Ondas de calor (loop). | Generado (síntesis procedural) | 5.0 |
| `nc_61c_disyuntor_clic_final` | No Canon · 6.1C Golpe final | «Clic.» El Guardián se detiene. | Generado (síntesis procedural) | 1.0 |
| `nc_61c_polvo_cae_como_nieve` | No Canon · 6.1C final | Polvo que cae como nieve gris. | Generado (síntesis procedural) | 10.0 |
| `nc_61c_despertar_sobresalto` | No Canon · 6.1C Corte a INT. EAGLE | Aldrin despierta de golpe (también al llegar el O2 a 0). | Generado (síntesis procedural) | 2.5 |
| `c7_73_separacion_modulo_servicio` | Cap. 7 · 7.3 Reentrada | El módulo de servicio se separa. | Generado (síntesis procedural) | 3.0 |
| `c7_73_reentrada_plasma` | Cap. 7 · 7.3 Reentrada ~16:35 UTC | Rugido y traqueteo de la reentrada. | Generado (síntesis procedural) | 40.0 |
| `c7_73_radio_apagon_plasma` | Cap. 7 · 7.3 Apagón de comunicaciones | Radio perdida por el plasma. | Generado (síntesis procedural) | 8.0 |
| `c7_73_paracaidas_apertura` | Cap. 7 · 7.3 Paracaídas | Drogue + 3 principales, lona y viento. | Generado (síntesis procedural) | 12.0 |
| `c7_73_amb_viento_descenso_loop` | Cap. 7 · 7.3 «El sonido del viento.» | Viento bajo los paracaídas (loop). | Generado (síntesis procedural) | 59.0 |
| `c7_74_amerizaje_impacto` | Cap. 7 · 7.4 Amerizaje 16:50:35 UTC | Columbia cae al agua. | Generado (síntesis procedural) | 3.5 |
| `c7_74_amb_oceano_pacifico_loop` | Cap. 7 · 7.4 Océano Pacífico | Mar abierto (loop). | Generado (síntesis procedural) | 59.0 |
| `c7_74_helicoptero_uss_hornet` | Cap. 7 · 7.4 Helicóptero del Hornet | Helicóptero acercándose. | Generado (síntesis procedural) | 20.0 |
| `c7_74_escotilla_buzo` | Cap. 7 · 7.4 El buzo abre la escotilla | Escotilla abriéndose en el mar. | Generado (síntesis procedural) | 3.0 |
| `c7_75_amb_cuarentena_mqf` | Cap. 7 · 7.5–7.6 Cuarentena | Casa rodante sellada / laboratorio (loop). | Generado (síntesis procedural) | 59.0 |
| `c7_76_mano_en_vidrio` | Cap. 7 · 7.6 LRL | Neil pone la mano en el vidrio. | Generado (síntesis procedural) | 1.0 |
| `e_e1_amb_desfile_nueva_york` | Epílogo · E.1 Nueva York | Desfile con lluvia de papel (loop). | Generado (síntesis procedural) | 39.0 |
| `e_e3_laser_retrorreflector` | Epílogo · E.3 Tranquilidad hoy | Láser que toca el retrorreflector y vuelve (estilizado). | Generado (síntesis procedural) | 4.0 |
| `ui_bitacora_nueva_entrada_comun` | UI · Bitácora | «Nueva entrada en la Bitácora · Común». | Generado (síntesis procedural) | 2.5 |
| `ui_bitacora_nueva_entrada_rara` | UI · Bitácora | «Nueva entrada en la Bitácora · Rara». | Generado (síntesis procedural) | 2.5 |
| `ui_bitacora_nueva_entrada_epica` | UI · Bitácora | «Nueva entrada en la Bitácora · Épica». | Generado (síntesis procedural) | 2.5 |
| `ui_bitacora_nueva_entrada_legendaria` | UI · Bitácora | «Nueva entrada en la Bitácora · Legendaria». | Generado (síntesis procedural) | 2.5 |
| `ui_bitacora_nueva_entrada_oculta` | UI · Bitácora | «Nueva entrada en la Bitácora · Oculta». | Generado (síntesis procedural) | 2.5 |
| `ui_bitacora_abrir_pagina` | UI · Bitácora [B] | Abrir la Bitácora / pasar página. | Generado (síntesis procedural) | 0.5 |

### voz_en_clonada/
| Archivo | Cap./escena | Línea / uso | Origen | Dur. (s) |
|---|---|---|---|---|
| `p_01_diplomatico_soviéticos_en` | Prólogo · 0.1 | DIPLOMÁTICO: «Mr. Armstrong... do you really think we'll get there before the Soviets?» (guion ES: «Señor Armstrong, ¿usted cree que llegare | Generado (Chatterbox TTS inglés, voz elegida para DIPLOMÁTICO; emoción «ironia»; efecto sala) | 3.38 |
| `p_01_armstrong_cuando_estemos_listos_en` | Prólogo · 0.1 | ARMSTRONG: «I think we'll get there when we're ready. Not one day sooner.» (guion ES: «Creo que llegaremos cuando estemos listos. Ni un día  | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «firme»; efecto sala) | 4.72 |
| `p_01_asistente_llamada_houston_en` | Prólogo · 0.1 | ASISTENTE: «Call from Houston, sir... It's urgent!» (guion ES: «Llamada de Houston, señor. Es urgente.») | Generado (Chatterbox TTS inglés, voz elegida para ASISTENTE; emoción «urgencia»; efecto sala_baja) | 2.49 |
| `p_02_voz_telefono_incendio_en` | Prólogo · 0.2 | VOZ AL TELÉFONO: «There was a fire in the cabin... during the test. Gus, Ed and Roger... they didn't make it out.» (guion ES: «Hubo un incen | Generado (Chatterbox TTS inglés, voz elegida para VOZ AL TELÉFONO; emoción «tristeza»; efecto telefono) | 5.43 |
| `p_obj_armstrong_recuerdo_ed_white_en` | Prólogo · 0.2 Objeto: libreta de direcciones | ARMSTRONG (VOZ EN OFF): «When my house burned down in sixty-four, Ed was over the fence before anyone else. He helped me get my family out.» | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «tristeza»; efecto vo) | 6.94 |
| `p_03_kranz_duros_y_competentes_en` | Prólogo · 0.3 | KRANZ: «Space flight will never tolerate carelessness, incapacity, and neglect. Somewhere, somehow, we screwed up. From this day forward, Fl | Generado (Chatterbox TTS inglés, voz clonada de KRANZ; emoción «enojo»; efecto sala_grande) | 11.87 |
| `c1_11_jan_habla_con_los_ninos_en` | Cap. 1 · 1.1 | JAN: «Neil. Before you go, you have to talk to the boys. Tell them... that you might not come back.» (guion ES: «Neil. Antes de irte tienes  | Generado (Chatterbox TTS inglés, voz elegida para JAN; emoción «tension»; efecto casa) | 6.13 |
| `c1_11_armstrong_probabilidades_en` | Cap. 1 · 1.1 | ARMSTRONG: «Jan... the odds are good.» (guion ES: «Jan, las probabilidades son buenas.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «calma»; efecto casa) | 2.23 |
| `c1_11_jan_no_te_costara_en` | Cap. 1 · 1.1 | JAN: «Then it won't be hard to tell them.» (guion ES: «Entonces no te costará decírselo.») | Generado (Chatterbox TTS inglés, voz elegida para JAN; emoción «enojo»; efecto casa) | 2.4 |
| `c1_11_rick_se_ve_nuestra_casa_en` | Cap. 1 · 1.1 | RICK: «Can you see our house from the Moon?» (guion ES: «¿Desde la Luna se ve nuestra casa?») | Generado (Chatterbox TTS inglés, voz elegida para RICK; emoción «asombro»; efecto casa) | 2.33 |
| `c1_11_armstrong_se_ve_la_tierra_en` | Cap. 1 · 1.1 | ARMSTRONG: «No. But you can see the whole Earth... And you're on it. That's enough for me.» (guion ES: «No. Pero se ve la Tierra entera. Y t | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto casa) | 6.96 |
| `c1_dec_armstrong_verdad_en` | Cap. 1 · 1.1 Decisión | ARMSTRONG: «It's dangerous... but I trust my team.» (guion ES: «Es peligroso, pero confío en mi equipo.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto casa) | 2.57 |
| `c1_dec_armstrong_restar_importancia_en` | Cap. 1 · 1.1 Decisión | ARMSTRONG: «It's just a business trip. I'll be back soon.» (guion ES: «Es un viaje de trabajo, volveré pronto.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «calma»; efecto casa) | 3.34 |
| `c1_12_slayton_neil_sale_primero_en` | Cap. 1 · 1.2 | DEKE SLAYTON: «Buzz, it's decided. Neil goes out first. He's the commander, and the hatch opens on his side.» (guion ES: «Buzz, ya está deci | Generado (Chatterbox TTS inglés, voz elegida para SLAYTON; emoción «firme»; efecto exterior) | 7.11 |
| `c1_12_aldrin_precedente_gemini_en` | Cap. 1 · 1.2 | ALDRIN: «On Gemini the pilot went out, not the commander. I'm just saying there's precedent.» (guion ES: «En Gemini salía el piloto, no el c | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «enojo»; efecto exterior) | 7.64 |
| `c1_12_slayton_esta_decidido_en` | Cap. 1 · 1.2 | DEKE SLAYTON: «And I'm just saying it's decided.» (guion ES: «Y yo solo digo que está decidido.») | Generado (Chatterbox TTS inglés, voz elegida para SLAYTON; emoción «firme»; efecto exterior) | 2.42 |
| `c1_dec_armstrong_gracias_buzz_en` | Cap. 1 · 1.2 Decisión (aceptar) | ARMSTRONG: «Thanks, Buzz... That wasn't easy.» (guion ES: «Gracias, Buzz. No era fácil.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto exterior) | 2.97 |
| `c1_13_collins_entrevistas_en` | Cap. 1 · 1.3 | COLLINS: «You know what the good part of my job is? If something goes wrong down there, I'm the only one who comes back. I'll be giving inte | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto exterior) | 8.09 |
| `c1_13_aldrin_que_consuelo_en` | Cap. 1 · 1.3 | ALDRIN: «What a comfort, Mike.» (guion ES: «Qué consuelo, Mike.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ironia»; efecto exterior) | 1.91 |
| `c1_13_collins_no_es_un_chiste_en` | Cap. 1 · 1.3 | COLLINS: «It's not a joke. If you don't come up... I can't go down and get you. I think about it every night.» (guion ES: «No es un chiste.  | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «tristeza»; efecto exterior) | 7.2 |
| `c1_13_armstrong_vamos_a_subir_en` | Cap. 1 · 1.3 | ARMSTRONG: «We'll come up, Mike.» (guion ES: «Vamos a subir, Mike.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «firme»; efecto exterior) | 1.27 |
| `c2_dec_aldrin_bonito_mike_en` | Cap. 2 · 2.5 Decisión (lento) | ALDRIN: «Beautiful, Mike!» (guion ES: «Bonito, Mike.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «alivio»; efecto cabina) | 1.24 |
| `c3_obj_collins_coctel_camarones_en` | Cap. 3 · 3.1 Objeto: comida espacial | COLLINS: «The shrimp cocktail is the only thing up here that tastes like real food.» (guion ES: «El cóctel de camarones es lo único que se p | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina) | 3.23 |
| `c3_32_aldrin_marion_moon_en` | Cap. 3 · 3.2 | ALDRIN: «You know what my mother's maiden name was? Moon... Marion Moon.» (guion ES: «¿Sabes cuál era el apellido de soltera de mi madre? Mo | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ternura»; efecto cabina_noche) | 4.87 |
| `c3_32_collins_visita_familiar_en` | Cap. 3 · 3.2 | COLLINS: «So this is a family visit.» (guion ES: «Entonces esto es una visita familiar.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina_noche) | 3.46 |
| `c3_32_armstrong_karen_nueve_en` | Cap. 3 · 3.2 (Confianza > 60) | ARMSTRONG: «Karen... would have turned nine this year.» (guion ES: «Karen habría cumplido nueve este año.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «tristeza»; efecto cabina_noche) | 2.42 |
| `c3_32_armstrong_duerman_en` | Cap. 3 · 3.2 (Confianza baja) | ARMSTRONG: «Get some sleep. Tomorrow's a long day.» (guion ES: «Duerman. Mañana es largo.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «calma»; efecto cabina_noche) | 2.91 |
| `c3_34_capcom_go_loi_en` | Cap. 3 · 3.4 | CAPCOM: «Apollo 11, you are go for LOI. We'll see you on the other side.» (guion ES: «Apolo 11, tienen GO para LOI. Nos vemos del otro lado. | Generado (Chatterbox TTS inglés, voz clonada de CAPCOM; emoción «firme»; efecto radio) | 6.6 |
| `c3_34_armstrong_estamos_en_orbita_en` | Cap. 3 · 3.4 | ARMSTRONG: «Houston, Apollo 11. We're in orbit.» (guion ES: «Houston, Apolo 11. Estamos en órbita.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «alivio»; efecto radio) | 3.33 |
| `c3_34_collins_yeso_viejo_en` | Cap. 3 · 3.4 | COLLINS: «Look at that... it's like old plaster of Paris.» (guion ES: «Miren eso… es como yeso viejo.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «asombro»; efecto cabina) | 2.74 |
| `c4_42_kranz_cerrar_puertas_en` | Cap. 4 · 4.2 | KRANZ: «Today we're going to do something nobody has ever done. We're going to land on the Moon. Whatever happens, I walk out of this room w | Generado (Chatterbox TTS inglés, voz clonada de KRANZ; emoción «solemne»; efecto sala_grande) | 8.03 |
| `c4_43_armstrong_vamos_largos_en` | Cap. 4 · 4.3 | ARMSTRONG: «We're going long. Our landmarks are coming up early.» (guion ES: «Vamos largos. Las marcas del terreno pasan antes de lo previst | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «tension»; efecto casco) | 3.1 |
| `c4_44_kranz_guiado_como_estamos_en` | Cap. 4 · 4.4 | KRANZ: «Guidance, how are we looking?» (guion ES: «Guiado, ¿cómo estamos?») | Generado (Chatterbox TTS inglés, voz clonada de KRANZ; emoción «urgencia»; efecto sala_grande) | 1.54 |
| `c4_44_garman_es_go_en` | Cap. 4 · 4.4 | GARMAN: «As long as it doesn't keep recurring, we're fine. It's go.» (guion ES: «Mientras no se repita sin parar, estamos bien. Es GO.») | Generado (Chatterbox TTS inglés, voz clonada de GARMAN; emoción «urgencia»; efecto intercom) | 3.19 |
| `c4_dec_bales_seguimos_go_en` | Cap. 4 · 4.4 Decisión A | BALES: «We're go, Flight! We're go!» (guion ES: «¡Seguimos, Flight! Es GO.») | Generado (Chatterbox TTS inglés, voz clonada de BALES; emoción «urgencia»; efecto intercom) | 3.98 |
| `c4_dec_bales_seguimos_go_tembloroso_en` | Cap. 4 · 4.4 Decisión A (sin la hoja de Garman) | BALES: «We're... we're go, Flight. It's go.» (guion ES: «Se… seguimos, Flight. Es GO.») | Generado (Chatterbox TTS inglés, voz clonada de BALES; emoción «miedo»; efecto intercom) | 2.91 |
| `c4_dec_bales_abortar_en` | Cap. 4 · 4.4 Decisión B | BALES: «Abort... We can't take the risk.» (guion ES: «Abortar. No podemos arriesgarnos.») | Generado (Chatterbox TTS inglés, voz clonada de BALES; emoción «miedo»; efecto intercom) | 4.42 |
| `c4_dec_kranz_seguimos_en` | Cap. 4 · 4.4 Decisión C (tiempo agotado) | KRANZ: «We're go.» (guion ES: «Seguimos.») | Generado (Chatterbox TTS inglés, voz clonada de KRANZ; emoción «firme»; efecto sala_grande) | 2.25 |
| `c4_47_rick_lo_hizo_en` | Cap. 4 · 4.7 | RICK: «Mom... he did it!» (guion ES: «Mamá… lo hizo.») | Generado (Chatterbox TTS inglés, voz elegida para RICK; emoción «euforia»; efecto casa) | 2.48 |
| `c4_47_jan_todavia_no_en` | Cap. 4 · 4.7 | JAN: «Not yet... He still has to come home.» (guion ES: «Todavía no. Todavía tiene que volver.») | Generado (Chatterbox TTS inglés, voz elegida para JAN; emoción «tension»; efecto casa) | 2.72 |
| `c4_47_rick_papa_confiaba_en` | Cap. 4 · 4.7 (decisión «verdad») | RICK: «Dad said he trusted them.» (guion ES: «Papá dijo que confiaba en ellos.») | Generado (Chatterbox TTS inglés, voz elegida para RICK; emoción «ternura»; efecto casa) | 3.08 |
| `c5_dec_aldrin_como_si_alguien_en` | Cap. 5 · 5.1 Decisión (dormir) | ALDRIN: «As if anybody could sleep right now.» (guion ES: «Como si alguien pudiera dormir ahora.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ironia»; efecto cabina) | 3.51 |
| `c5_52_aldrin_un_poco_izquierda_en` | Cap. 5 · 5.2 | ALDRIN: «A little to the left. Good. Your backpack's clear.» (guion ES: «Un poco a la izquierda. Bien. Tu mochila pasa.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «tension»; efecto cabina) | 2.65 |
| `c5_dec_aldrin_lo_hiciste_bien_en` | Cap. 5 · 5.4 Decisión (Confianza > 70) | ALDRIN: «You did good down there.» (guion ES: «Lo hiciste bien ahí abajo.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ternura»; efecto casco) | 1.5 |
| `c5_dec_armstrong_lo_hicimos_en` | Cap. 5 · 5.4 Decisión (Confianza > 70) | ARMSTRONG: «We did it.» (guion ES: «Lo hicimos.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «alivio»; efecto casco) | 1.1 |
| `c5_obj_armstrong_lee_placa_en` | Cap. 5 · 5.4 Objeto: placa | ARMSTRONG: «Here men from the planet Earth first set foot upon the Moon. July 1969, A.D. We came in peace for all mankind.» (guion ES: «Aquí | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «solemne»; efecto casco) | 11.08 |
| `c5_dec_armstrong_hazlo_tu_en` | Cap. 5 · 5.6 Decisión (parche Apolo 1) | ARMSTRONG: «You do it... Ed was your friend too.» (guion ES: «Hazlo tú. Ed era tu amigo también.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto casco) | 2.35 |
| `c5_dec_armstrong_gracias_anoche_en` | Cap. 5 · 5.x (Confianza +15 en Cap. 3) | ARMSTRONG: «Thanks for last night.» (guion ES: «Gracias por lo de anoche.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto casco) | 2.89 |
| `c5_57_aldrin_mira_esto_en` | Cap. 5 · 5.7 | ALDRIN: «Neil... look at this.» (guion ES: «Neil… mira esto.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «miedo»; efecto cabina) | 2.46 |
| `c5_57_armstrong_motor_ascenso_en` | Cap. 5 · 5.7 | ARMSTRONG: «That's the one for the ascent engine.» (guion ES: «Ese es el del motor de ascenso.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «tension»; efecto cabina) | 2.4 |
| `c6_61_collins_solo_vo_en` | Cap. 6 · 6.1 | COLLINS (VOZ EN OFF): «I am alone now, truly alone, and absolutely isolated from any known life. I am it. If a count were taken, the score w | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «asombro»; efecto vo) | 13.04 |
| `c6_obj_collins_libreta_en` | Cap. 6 · 6.1 Objeto: libreta de Collins | COLLINS (VOZ EN OFF): «My secret terror for the last six months has been leaving them on the Moon and returning to Earth alone.» (guion ES:  | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «tristeza»; efecto vo) | 6.22 |
| `c6_61b_radio_buzz_vuelve_en` | No Canon · 6.1B | VOZ POR RADIO (SUEÑO): «Buzz... get back to the LM.» (guion ES: «Buzz… vuelve al módulo.») | Generado (Chatterbox TTS inglés, voz elegida para VOZ POR RADIO (SUEÑO); emoción «miedo»; efecto radio_distorsion) | 1.88 |
| `c6_61b_armstrong_te_tengo_en` | No Canon · 6.1B Fase 2 | ARMSTRONG (SUEÑO): «Buzz! I've got you! Jump!» (guion ES: «Buzz. Te tengo. Salta.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «urgencia»; efecto casco) | 2.72 |
| `c6_61c_aldrin_no_esta_en_plan_en` | No Canon · 6.1C | ALDRIN: «...That's not in the flight plan.» (guion ES: «…Eso no está en el plan de vuelo.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «miedo»; efecto casco) | 2.03 |
| `c6_61c_armstrong_que_ves_en` | No Canon · 6.1C | ARMSTRONG (POR RADIO, LEJOS): «Buzz, what do you see?» (guion ES: «Buzz, ¿qué ves?») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «urgencia»; efecto radio) | 2.22 |
| `c6_61c_aldrin_polvo_que_se_mueve_en` | No Canon · 6.1C | ALDRIN: «Dust, Neil... Dust that moves.» (guion ES: «Polvo, Neil. Polvo que se mueve.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «miedo»; efecto casco) | 2.18 |
| `c6_61c_armstrong_placas_hombros_en` | No Canon · 6.1C Fase 1 | ARMSTRONG: «It's got plates on its shoulders! Break them! I'll draw it off!» (guion ES: «Tiene placas en los hombros. Rómpelas. Yo lo distra | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «urgencia»; efecto radio) | 4.74 |
| `c6_61c_aldrin_sonrie_en` | No Canon · 6.1C Fase 1 (flash) | ALDRIN: «Smile!» (guion ES: «¡Sonríe!») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «grito»; efecto casco) | 1.91 |
| `c6_61c_bales_eco_es_go_en` | No Canon · 6.1C Fase 1 | VOZ DE BALES (ECO): «...It's go. We're go on that alarm...» (guion ES: «…Es GO. Es GO con esa alarma…») | Generado (Chatterbox TTS inglés, voz clonada de BALES; emoción «urgencia»; efecto eco_distorsion) | 2.5 |
| `c6_61c_duke_eco_sesenta_en` | No Canon · 6.1C Fase 2 | VOZ DE DUKE (ECO): «Sixty seconds...» (guion ES: «Sesenta segundos…») | Generado (Chatterbox TTS inglés, voz clonada de DUKE; emoción «tension»; efecto eco_distorsion) | 1.42 |
| `c6_61c_armstrong_mira_sombras_en` | No Canon · 6.1C Fase 2 | ARMSTRONG: «Look at the shadows! The real one has a shadow.» (guion ES: «Mira las sombras. El de verdad tiene sombra.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «urgencia»; efecto radio) | 3.95 |
| `c6_61c_aldrin_lanzame_en` | No Canon · 6.1C Fase 2 | ALDRIN: «Neil, throw me!» (guion ES: «¡Neil, lánzame!») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «grito»; efecto casco) | 1.24 |
| `c6_61c_duke_eco_treinta_en` | No Canon · 6.1C Fase 2 | VOZ DE DUKE (ECO): «Thirty seconds...» (guion ES: «Treinta segundos…») | Generado (Chatterbox TTS inglés, voz clonada de DUKE; emoción «tension»; efecto eco_distorsion) | 1.07 |
| `c6_61c_susurro_siempre_segundo_en` | No Canon · 6.1C Fase 3 | SUSURRO (VOZ DE ALDRIN): «You'll always be second... you'll never go home...» (guion ES: «Siempre serás el segundo… nunca volverás…») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «susurro»; efecto susurro) | 3.23 |
| `c6_61c_susurro_siempre_segundo_en_invertido` | No Canon · 6.1C Fase 3 | SUSURRO (VOZ DE ALDRIN) (INVERTIDA): «You'll always be second... you'll never go home...» | Generado (Chatterbox, invertido) | 3.23 |
| `c6_61c_armstrong_respiramos_juntos_en` | No Canon · 6.1C Fase 3 | ARMSTRONG: «Don't listen to it... Hook up. We breathe together.» (guion ES: «No le hagas caso. Conéctate. Respiramos juntos.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto radio) | 6.3 |
| `c6_61c_aldrin_ya_se_arreglar_en` | No Canon · 6.1C | ALDRIN: «I know how to fix this.» (guion ES: «Ya sé cómo arreglar esto.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «firme»; efecto casco) | 1.54 |
| `c6_61c_aldrin_segundo_pero_juntos_en` | No Canon · 6.1C | ALDRIN: «Second... but together.» (guion ES: «Segundo… pero juntos.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «alivio»; efecto casco) | 2.93 |
| `c6_61c_armstrong_tampoco_dormir_en` | Cap. 6 · 6.1C (despertar) | ARMSTRONG: «Can't sleep either?» (guion ES: «¿Tampoco puedes dormir?») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «calma»; efecto cabina_noche) | 1.35 |
| `c6_61c_aldrin_sone_polvo_en` | Cap. 6 · 6.1C (despertar) | ALDRIN: «I dreamed the dust rose up and took a shape. That it wouldn't let us leave.» (guion ES: «Soñé que el polvo se levantaba y tenía for | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «miedo»; efecto cabina_noche) | 6.45 |
| `c6_61c_armstrong_duerme_buzz_en` | Cap. 6 · 6.1C (despertar) | ARMSTRONG: «We left it behind once already. Sleep, Buzz. Tomorrow we go home. All three of us.» (guion ES: «Ya lo dejamos atrás una vez. Due | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto cabina_noche) | 8.03 |
| `c6_62_houston_nada_conductor_en` | Cap. 6 · 6.2 (opción incorrecta) | CAPCOM: «Negative, Eagle. Nothing conductive.» (guion ES: «Negativo, Eagle. Nada conductor.») | Generado (Chatterbox TTS inglés, voz clonada de CAPCOM; emoción «tension»; efecto radio) | 5.32 |
| `c6_64_collins_ahi_estan_en` | Cap. 6 · 6.4 | COLLINS: «There they are! There they both are!» (guion ES: «Ahí están. Ahí están los dos.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «euforia»; efecto cabina) | 2.97 |
| `c6_64_collins_vengan_aca_en` | Cap. 6 · 6.4 | COLLINS: «Come here, you two.» (guion ES: «Vengan acá.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ternura»; efecto cabina) | 2.8 |
| `c7_71b_aldrin_trajiste_mascota_en` | Cap. 7 · 7.1B | ALDRIN: «You brought a pet? That's not in the flight plan, Mike.» (guion ES: «¿Trajiste una mascota? No está en el plan de vuelo, Mike.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ironia»; efecto cabina) | 3.89 |
| `c7_71b_collins_tripulante_no_oficial_en` | Cap. 7 · 7.1B | COLLINS: «She's an unofficial crew member. Guest of honor. Her name is Laika.» (guion ES: «Es una tripulante no oficial. Pasajera de honor.  | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina) | 4.08 |
| `c7_71b_armstrong_primera_perra_en` | Cap. 7 · 7.1B | ARMSTRONG: «The first dog in orbit.» (guion ES: «La primera perra en órbita.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto cabina) | 2.03 |
| `c7_71b_collins_sputnik2_en` | Cap. 7 · 7.1B | COLLINS: «November fifty-seven. Sputnik Two. A little stray from the streets of Moscow. Before us, before Gagarin, before everything... she  | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «tristeza»; efecto cabina) | 14.09 |
| `c7_71b_aldrin_y_no_volvio_en` | Cap. 7 · 7.1B | ALDRIN: «And she never came back.» (guion ES: «Y no volvió.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «tristeza»; efecto cabina) | 2.35 |
| `c7_71b_collins_por_eso_la_traje_en` | Cap. 7 · 7.1B | COLLINS: «No. They knew she wouldn't. That's why I brought her. So that one of the ones who opened the way gets to make the whole trip, even | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ternura»; efecto cabina) | 7.52 |
| `c7_71b_armstrong_belka_strelka_en` | Cap. 7 · 7.1B (diálogo extra) | ARMSTRONG: «In 1960 the Soviets sent up Belka and Strelka, and they came back alive. And one of Strelka's puppies, Pushinka, ended up in the | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «calma»; efecto cabina) | 12.51 |
| `c7_71b_aldrin_diplomacia_en` | Cap. 7 · 7.1B | ALDRIN: «A Soviet space dog living in the White House? Now that's diplomacy.» (guion ES: «¿Una perra espacial soviética viviendo en la Casa  | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ironia»; efecto cabina) | 4.36 |
| `c7_71b_collins_parientes_famosos_en` | Cap. 7 · 7.1B | COLLINS: «You hear that? You've got famous relatives.» (guion ES: «¿Oíste? Tienes parientes famosos.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina) | 3.16 |
| `c7_71b_aldrin_pelos_filtros_en` | Cap. 7 · 7.1B | ALDRIN: «Mike, if Houston asks why there's hair in the filters...» (guion ES: «Mike, si en Houston preguntan por qué hay pelos en los filtro | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ironia»; efecto cabina) | 3.34 |
| `c7_71b_collins_polvo_lunar_en` | Cap. 7 · 7.1B | COLLINS: «Tell them it's moon dust. Nobody knows what color it is.» (guion ES: «Diles que es polvo lunar. Nadie sabe de qué color es.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina) | 3.12 |
| `c7_dec_aldrin_cabo_laika_en` | Cap. 7 · 7.1B Decisión | ALDRIN: «Welcome aboard, Corporal Laika.» (guion ES: «Bienvenida a bordo, cabo Laika.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «ternura»; efecto cabina) | 2.1 |
| `c7_dec_collins_sargento_en` | Cap. 7 · 7.1B Decisión | COLLINS: «I'll promote her to sergeant if she doesn't bark during reentry.» (guion ES: «La asciendo a sargento si no ladra en la reentrada.» | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto cabina) | 3.76 |
| `c7_74_armstrong_ponganse_traje_en` | Cap. 7 · 7.4 | ARMSTRONG: «Suit up, gentlemen. We're not home yet.» (guion ES: «Póngase el traje, caballeros. Todavía no estamos en casa.») | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «firme»; efecto cabina) | 4.3 |
| `c7_76_mark_trajiste_piedra_en` | Cap. 7 · 7.6 | MARK: «Did you bring a rock?» (guion ES: «¿Trajiste una piedra?») | Generado (Chatterbox TTS inglés, voz elegida para MARK; emoción «euforia»; efecto telefono_lrl) | 1.88 |
| `c7_76_armstrong_veintiun_kilos_en` | Cap. 7 · 7.6 | ARMSTRONG: «We brought back forty-seven pounds. But they're not ours. They belong to everybody.» (guion ES: «Trajimos veintiún kilos. Pero n | Generado (Chatterbox TTS inglés, voz clonada de ARMSTRONG; emoción «ternura»; efecto telefono_lrl) | 7.0 |
| `c7_76_rick_te_escuche_aterrizar_en` | Cap. 7 · 7.6 (ruta A) | RICK: «I heard you land.» (guion ES: «Te escuché aterrizar.») | Generado (Chatterbox TTS inglés, voz elegida para RICK; emoción «ternura»; efecto telefono_lrl) | 1.54 |
| `c7_76_rick_nos_lo_tendrias_en` | Cap. 7 · 7.6 (ruta B) | RICK: «You should have told us, Dad.» (guion ES: «Nos lo tendrías que haber dicho, papá.») | Generado (Chatterbox TTS inglés, voz elegida para RICK; emoción «tristeza»; efecto telefono_lrl) | 1.63 |
| `e_e1_collins_lo_logramos_en` | Epílogo · E.1 | COLLINS (VOZ EN OFF): «Everywhere we went, people didn't say 'you did it.' They said 'we did it.' And that was exactly right.» (guion ES: «E | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «solemne»; efecto vo) | 5.64 |
| `e_e2_bales_me_quede_congelado_en` | Epílogo · E.2 (Bales no respondió) | BALES: «I froze... Gene covered for me.» (guion ES: «Me quedé congelado. Gene me cubrió.») | Generado (Chatterbox TTS inglés, voz clonada de BALES; emoción «tristeza»; efecto vo) | 2.59 |
| `c6_dec_safire_discurso_desastre_en` | Cap. 6 · 6.3 «¿Y si…?» (desbloqueable) | NIXON (LECTURA DRAMATIZADA): «Fate has ordained that the men who went to the Moon to explore in peace will stay on the Moon to rest in peace | Generado (Chatterbox TTS inglés, voz clonada de NIXON; emoción «solemne»; efecto tv_1969) | 8.11 |
| `c4_41_collins_tomenselo_con_calma_en` | Cap. 4 · 4.1 Desacople | COLLINS: «You cats take it easy on the lunar surface. If I hear you huffing and puffing, I'm going to start bitching at you.» (guion ES: «Us | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «ironia»; efecto radio) | 6.43 |
| `c4_41_aldrin_okay_mike_en` | Cap. 4 · 4.1 Desacople | ALDRIN: «Okay, Mike.» (guion ES: «Okay, Mike.») | Generado (Chatterbox TTS inglés, voz clonada de ALDRIN; emoción «calma»; efecto radio) | 3.63 |
| `c4_42_collins_relevo_go_descenso_en` | Cap. 4 · 4.2/4.3 | COLLINS: «Eagle, this is Columbia. They just gave you a go for powered descent.» (guion ES: «Eagle, aquí Columbia. Acaban de darles GO para  | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «urgencia»; efecto radio) | 5.21 |
| `c7_71_collins_vuelve_a_casa_a_todo_trapo_en` | Cap. 7 · 7.1 Tras TEI | COLLINS: «Hey, Houston, Apollo 11 is beaming all the way home!» (guion ES: «Eh, Houston, Apolo 11 vuelve a casa a todo trapo.») | Generado (Chatterbox TTS inglés, voz clonada de COLLINS; emoción «euforia»; efecto radio) | 4.59 |

### voz_placeholder/
| Archivo | Cap./escena | Línea / uso | Origen | Dur. (s) |
|---|---|---|---|---|
| `p_01_diplomatico_soviéticos` | Prólogo · 0.1 | DIPLOMÁTICO: «Señor Armstrong, ¿usted cree que llegaremos antes que los soviéticos?» | Generado (TTS Piper, voz es_ES-davefx-medium, tono -3.0 st, efecto sala) — PLACEHOLDER | 3.78 |
| `p_01_armstrong_cuando_estemos_listos` | Prólogo · 0.1 | ARMSTRONG: «Creo que llegaremos cuando estemos listos. Ni un día antes.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto sala) — PLACEHOLDER | 4.88 |
| `p_01_asistente_llamada_houston` | Prólogo · 0.1 | ASISTENTE: «Llamada de Houston, señor. Es urgente.» | Generado (TTS Piper, voz es_MX-ald-medium, tono -1.0 st, efecto sala_baja) — PLACEHOLDER | 4.38 |
| `p_02_voz_telefono_incendio` | Prólogo · 0.2 | VOZ AL TELÉFONO: «Hubo un incendio en la cabina. En la prueba. Gus, Ed y Roger… no salieron.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono -1.0 st, efecto telefono) — PLACEHOLDER | 6.4 |
| `p_obj_armstrong_recuerdo_ed_white` | Prólogo · 0.2 Objeto: libreta de direcciones | ARMSTRONG (VOZ EN OFF): «Cuando se quemó mi casa en el sesenta y cuatro, Ed saltó la cerca antes que nadie. Me ayudó a sacar a mi familia.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto vo) — PLACEHOLDER | 7.35 |
| `p_03_kranz_duros_y_competentes` | Prólogo · 0.3 | KRANZ: «El espacio no tolera el descuido, la incapacidad ni la negligencia. En algún lugar, de alguna manera, metimos la pata. A partir de h | Generado (TTS Piper, voz es_ES-davefx-medium, tono -2.0 st, efecto sala_grande) — PLACEHOLDER | 16.79 |
| `c1_11_jan_habla_con_los_ninos` | Cap. 1 · 1.1 | JAN: «Neil. Antes de irte tienes que hablar con los niños. Explícales que puede que no vuelvas.» | Generado (TTS Piper, voz es_MX-claude-high, tono +0 st, efecto casa) — PLACEHOLDER | 6.64 |
| `c1_11_armstrong_probabilidades` | Cap. 1 · 1.1 | ARMSTRONG: «Jan, las probabilidades son buenas.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casa) — PLACEHOLDER | 2.88 |
| `c1_11_jan_no_te_costara` | Cap. 1 · 1.1 | JAN: «Entonces no te costará decírselo.» | Generado (TTS Piper, voz es_MX-claude-high, tono +0 st, efecto casa) — PLACEHOLDER | 2.67 |
| `c1_11_rick_se_ve_nuestra_casa` | Cap. 1 · 1.1 | RICK: «¿Desde la Luna se ve nuestra casa?» | Generado (TTS Piper, voz es_AR-daniela-high, tono +2.5 st, efecto casa) — PLACEHOLDER | 2.05 |
| `c1_11_armstrong_se_ve_la_tierra` | Cap. 1 · 1.1 | ARMSTRONG: «No. Pero se ve la Tierra entera. Y tú estás en ella. Con eso me alcanza.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casa) — PLACEHOLDER | 7.35 |
| `c1_dec_armstrong_verdad` | Cap. 1 · 1.1 Decisión | ARMSTRONG: «Es peligroso, pero confío en mi equipo.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casa) — PLACEHOLDER | 2.92 |
| `c1_dec_armstrong_restar_importancia` | Cap. 1 · 1.1 Decisión | ARMSTRONG: «Es un viaje de trabajo, volveré pronto.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casa) — PLACEHOLDER | 3.04 |
| `c1_12_slayton_neil_sale_primero` | Cap. 1 · 1.2 | DEKE SLAYTON: «Buzz, ya está decidido. Neil sale primero. Es el comandante y la escotilla abre hacia su lado.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono -2.5 st, efecto exterior) — PLACEHOLDER | 6.64 |
| `c1_12_aldrin_precedente_gemini` | Cap. 1 · 1.2 | ALDRIN: «En Gemini salía el piloto, no el comandante. Solo digo que hay precedente.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto exterior) — PLACEHOLDER | 6.63 |
| `c1_12_slayton_esta_decidido` | Cap. 1 · 1.2 | DEKE SLAYTON: «Y yo solo digo que está decidido.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono -2.5 st, efecto exterior) — PLACEHOLDER | 2.15 |
| `c1_dec_armstrong_gracias_buzz` | Cap. 1 · 1.2 Decisión (aceptar) | ARMSTRONG: «Gracias, Buzz. No era fácil.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto exterior) — PLACEHOLDER | 3.46 |
| `c1_13_collins_entrevistas` | Cap. 1 · 1.3 | COLLINS: «Saben qué es lo bueno de mi trabajo, ¿no? Si algo sale mal ahí abajo, el único que vuelve soy yo. Me harán entrevistas el resto de | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto exterior) — PLACEHOLDER | 8.92 |
| `c1_13_aldrin_que_consuelo` | Cap. 1 · 1.3 | ALDRIN: «Qué consuelo, Mike.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto exterior) — PLACEHOLDER | 2.33 |
| `c1_13_collins_no_es_un_chiste` | Cap. 1 · 1.3 | COLLINS: «No es un chiste. Si no suben, no puedo bajar a buscarlos. Lo pienso cada noche.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto exterior) — PLACEHOLDER | 5.98 |
| `c1_13_armstrong_vamos_a_subir` | Cap. 1 · 1.3 | ARMSTRONG: «Vamos a subir, Mike.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto exterior) — PLACEHOLDER | 2.16 |
| `c2_dec_aldrin_bonito_mike` | Cap. 2 · 2.5 Decisión (lento) | ALDRIN: «Bonito, Mike.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 1.8 |
| `c3_obj_collins_coctel_camarones` | Cap. 3 · 3.1 Objeto: comida espacial | COLLINS: «El cóctel de camarones es lo único que se parece a comida de verdad.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 4.39 |
| `c3_32_aldrin_marion_moon` | Cap. 3 · 3.2 | ALDRIN: «¿Sabes cuál era el apellido de soltera de mi madre? Moon. Marion Moon.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 7.21 |
| `c3_32_collins_visita_familiar` | Cap. 3 · 3.2 | COLLINS: «Entonces esto es una visita familiar.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 2.88 |
| `c3_32_armstrong_karen_nueve` | Cap. 3 · 3.2 (Confianza > 60) | ARMSTRONG: «Karen habría cumplido nueve este año.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 2.64 |
| `c3_32_armstrong_duerman` | Cap. 3 · 3.2 (Confianza baja) | ARMSTRONG: «Duerman. Mañana es largo.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 3.67 |
| `c3_34_capcom_go_loi` | Cap. 3 · 3.4 | CAPCOM: «Apolo 11, tienen GO para LOI. Nos vemos del otro lado.» | Generado (TTS Piper, voz es_MX-ald-medium, tono -1.5 st, efecto radio) — PLACEHOLDER | 6.04 |
| `c3_34_armstrong_estamos_en_orbita` | Cap. 3 · 3.4 | ARMSTRONG: «Houston, Apolo 11. Estamos en órbita.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio) — PLACEHOLDER | 4.81 |
| `c3_34_collins_yeso_viejo` | Cap. 3 · 3.4 | COLLINS: «Miren eso… es como yeso viejo.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 2.19 |
| `c4_42_kranz_cerrar_puertas` | Cap. 4 · 4.2 | KRANZ: «Hoy vamos a hacer algo que nadie ha hecho. Vamos a aterrizar en la Luna. Pase lo que pase, salgo de esta sala con ustedes. Confío en | Generado (TTS Piper, voz es_ES-davefx-medium, tono -2.0 st, efecto sala_grande) — PLACEHOLDER | 10.58 |
| `c4_43_armstrong_vamos_largos` | Cap. 4 · 4.3 | ARMSTRONG: «Vamos largos. Las marcas del terreno pasan antes de lo previsto.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 5.55 |
| `c4_44_kranz_guiado_como_estamos` | Cap. 4 · 4.4 | KRANZ: «Guiado, ¿cómo estamos?» | Generado (TTS Piper, voz es_ES-davefx-medium, tono -2.0 st, efecto sala_grande) — PLACEHOLDER | 1.82 |
| `c4_44_garman_es_go` | Cap. 4 · 4.4 | GARMAN: «Mientras no se repita sin parar, estamos bien. Es GO.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +1.5 st, efecto intercom) — PLACEHOLDER | 4.09 |
| `c4_dec_bales_seguimos_go` | Cap. 4 · 4.4 Decisión A | BALES: «¡Seguimos, Flight! Es GO.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +1.5 st, efecto intercom) — PLACEHOLDER | 3.52 |
| `c4_dec_bales_seguimos_go_tembloroso` | Cap. 4 · 4.4 Decisión A (sin la hoja de Garman) | BALES: «Se… seguimos, Flight. Es GO.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +1.5 st, efecto intercom) — PLACEHOLDER | 3.55 |
| `c4_dec_bales_abortar` | Cap. 4 · 4.4 Decisión B | BALES: «Abortar. No podemos arriesgarnos.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +1.5 st, efecto intercom) — PLACEHOLDER | 3.57 |
| `c4_dec_kranz_seguimos` | Cap. 4 · 4.4 Decisión C (tiempo agotado) | KRANZ: «Seguimos.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono -2.0 st, efecto sala_grande) — PLACEHOLDER | 1.54 |
| `c4_47_rick_lo_hizo` | Cap. 4 · 4.7 | RICK: «Mamá… lo hizo.» | Generado (TTS Piper, voz es_AR-daniela-high, tono +2.5 st, efecto casa) — PLACEHOLDER | 1.2 |
| `c4_47_jan_todavia_no` | Cap. 4 · 4.7 | JAN: «Todavía no. Todavía tiene que volver.» | Generado (TTS Piper, voz es_MX-claude-high, tono +0 st, efecto casa) — PLACEHOLDER | 3.56 |
| `c4_47_rick_papa_confiaba` | Cap. 4 · 4.7 (decisión «verdad») | RICK: «Papá dijo que confiaba en ellos.» | Generado (TTS Piper, voz es_AR-daniela-high, tono +2.5 st, efecto casa) — PLACEHOLDER | 2.15 |
| `c5_dec_aldrin_como_si_alguien` | Cap. 5 · 5.1 Decisión (dormir) | ALDRIN: «Como si alguien pudiera dormir ahora.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 2.88 |
| `c5_52_aldrin_un_poco_izquierda` | Cap. 5 · 5.2 | ALDRIN: «Un poco a la izquierda. Bien. Tu mochila pasa.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 5.69 |
| `c5_dec_aldrin_lo_hiciste_bien` | Cap. 5 · 5.4 Decisión (Confianza > 70) | ALDRIN: «Lo hiciste bien ahí abajo.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 2.7 |
| `c5_dec_armstrong_lo_hicimos` | Cap. 5 · 5.4 Decisión (Confianza > 70) | ARMSTRONG: «Lo hicimos.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 1.72 |
| `c5_obj_armstrong_lee_placa` | Cap. 5 · 5.4 Objeto: placa | ARMSTRONG: «Aquí hombres del planeta Tierra pusieron por primera vez el pie sobre la Luna. Julio de 1969 después de Cristo. Vinimos en paz e | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 11.19 |
| `c5_dec_armstrong_hazlo_tu` | Cap. 5 · 5.6 Decisión (parche Apolo 1) | ARMSTRONG: «Hazlo tú. Ed era tu amigo también.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 3.61 |
| `c5_dec_armstrong_gracias_anoche` | Cap. 5 · 5.x (Confianza +15 en Cap. 3) | ARMSTRONG: «Gracias por lo de anoche.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 2.15 |
| `c5_57_aldrin_mira_esto` | Cap. 5 · 5.7 | ALDRIN: «Neil… mira esto.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 2.11 |
| `c5_57_armstrong_motor_ascenso` | Cap. 5 · 5.7 | ARMSTRONG: «Ese es el del motor de ascenso.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 2.57 |
| `c6_61_collins_solo_vo` | Cap. 6 · 6.1 | COLLINS (VOZ EN OFF): «Ahora estoy solo, verdaderamente solo, y absolutamente aislado de cualquier vida conocida. Lo soy. Si se hiciera un r | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto vo) — PLACEHOLDER | 14.91 |
| `c6_obj_collins_libreta` | Cap. 6 · 6.1 Objeto: libreta de Collins | COLLINS (VOZ EN OFF): «Mi miedo secreto de los últimos seis meses ha sido dejarlos en la Luna y volver solo a la Tierra.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto vo) — PLACEHOLDER | 6.02 |
| `c6_61b_radio_buzz_vuelve` | No Canon · 6.1B | VOZ POR RADIO (SUEÑO): «Buzz… vuelve al módulo.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio_distorsion) — PLACEHOLDER | 2.42 |
| `c6_61b_armstrong_te_tengo` | No Canon · 6.1B Fase 2 | ARMSTRONG (SUEÑO): «Buzz. Te tengo. Salta.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto casco) — PLACEHOLDER | 4.13 |
| `c6_61c_aldrin_no_esta_en_plan` | No Canon · 6.1C | ALDRIN: «…Eso no está en el plan de vuelo.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 2.57 |
| `c6_61c_armstrong_que_ves` | No Canon · 6.1C | ARMSTRONG (POR RADIO, LEJOS): «Buzz, ¿qué ves?» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio) — PLACEHOLDER | 2.63 |
| `c6_61c_aldrin_polvo_que_se_mueve` | No Canon · 6.1C | ALDRIN: «Polvo, Neil. Polvo que se mueve.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 3.34 |
| `c6_61c_armstrong_placas_hombros` | No Canon · 6.1C Fase 1 | ARMSTRONG: «Tiene placas en los hombros. Rómpelas. Yo lo distraigo.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio) — PLACEHOLDER | 6.4 |
| `c6_61c_aldrin_sonrie` | No Canon · 6.1C Fase 1 (flash) | ALDRIN: «¡Sonríe!» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 1.32 |
| `c6_61c_bales_eco_es_go` | No Canon · 6.1C Fase 1 | VOZ DE BALES (ECO): «…Es GO. Es GO con esa alarma…» | Generado (TTS Piper, voz es_MX-ald-medium, tono +1.5 st, efecto eco_distorsion) — PLACEHOLDER | 3.68 |
| `c6_61c_duke_eco_sesenta` | No Canon · 6.1C Fase 2 | VOZ DE DUKE (ECO): «Sesenta segundos…» | Generado (TTS Piper, voz es_MX-ald-medium, tono -1.5 st, efecto eco_distorsion) — PLACEHOLDER | 2.2 |
| `c6_61c_armstrong_mira_sombras` | No Canon · 6.1C Fase 2 | ARMSTRONG: «Mira las sombras. El de verdad tiene sombra.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio) — PLACEHOLDER | 4.75 |
| `c6_61c_aldrin_lanzame` | No Canon · 6.1C Fase 2 | ALDRIN: «¡Neil, lánzame!» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 1.94 |
| `c6_61c_duke_eco_treinta` | No Canon · 6.1C Fase 2 | VOZ DE DUKE (ECO): «Treinta segundos…» | Generado (TTS Piper, voz es_MX-ald-medium, tono -1.5 st, efecto eco_distorsion) — PLACEHOLDER | 1.74 |
| `c6_61c_susurro_siempre_segundo` | No Canon · 6.1C Fase 3 | SUSURRO (VOZ DE ALDRIN): «Siempre serás el segundo… nunca volverás…» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto susurro) — PLACEHOLDER | 3.13 |
| `c6_61c_susurro_siempre_segundo_invertido` | No Canon · 6.1C Fase 3 | SUSURRO (VOZ DE ALDRIN) (INVERTIDA): «Siempre serás el segundo… nunca volverás…» | Generado (TTS Piper invertido) — PLACEHOLDER | 3.13 |
| `c6_61c_armstrong_respiramos_juntos` | No Canon · 6.1C Fase 3 | ARMSTRONG: «No le hagas caso. Conéctate. Respiramos juntos.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto radio) — PLACEHOLDER | 6.32 |
| `c6_61c_aldrin_ya_se_arreglar` | No Canon · 6.1C | ALDRIN: «Ya sé cómo arreglar esto.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 2.55 |
| `c6_61c_aldrin_segundo_pero_juntos` | No Canon · 6.1C | ALDRIN: «Segundo… pero juntos.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto casco) — PLACEHOLDER | 2.13 |
| `c6_61c_armstrong_tampoco_dormir` | Cap. 6 · 6.1C (despertar) | ARMSTRONG: «¿Tampoco puedes dormir?» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 2.15 |
| `c6_61c_aldrin_sone_polvo` | Cap. 6 · 6.1C (despertar) | ALDRIN: «Soñé que el polvo se levantaba y tenía forma. Que no nos dejaba volver.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 5.59 |
| `c6_61c_armstrong_duerme_buzz` | Cap. 6 · 6.1C (despertar) | ARMSTRONG: «Ya lo dejamos atrás una vez. Duerme, Buzz. Mañana volvemos a casa. Los tres.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina_noche) — PLACEHOLDER | 7.87 |
| `c6_62_houston_nada_conductor` | Cap. 6 · 6.2 (opción incorrecta) | CAPCOM: «Negativo, Eagle. Nada conductor.» | Generado (TTS Piper, voz es_MX-ald-medium, tono -1.5 st, efecto radio) — PLACEHOLDER | 4.7 |
| `c6_64_collins_ahi_estan` | Cap. 6 · 6.4 | COLLINS: «Ahí están. Ahí están los dos.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 2.61 |
| `c6_64_collins_vengan_aca` | Cap. 6 · 6.4 | COLLINS: «Vengan acá.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 1.23 |
| `c7_71b_aldrin_trajiste_mascota` | Cap. 7 · 7.1B | ALDRIN: «¿Trajiste una mascota? No está en el plan de vuelo, Mike.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 5.19 |
| `c7_71b_collins_tripulante_no_oficial` | Cap. 7 · 7.1B | COLLINS: «Es una tripulante no oficial. Pasajera de honor. Se llama Laika.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 4.75 |
| `c7_71b_armstrong_primera_perra` | Cap. 7 · 7.1B | ARMSTRONG: «La primera perra en órbita.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 2.34 |
| `c7_71b_collins_sputnik2` | Cap. 7 · 7.1B | COLLINS: «Noviembre del cincuenta y siete. Sputnik 2. Una perrita callejera de Moscú. Antes de nosotros, antes de Gagarin, antes de todo… el | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 10.73 |
| `c7_71b_aldrin_y_no_volvio` | Cap. 7 · 7.1B | ALDRIN: «Y no volvió.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 1.52 |
| `c7_71b_collins_por_eso_la_traje` | Cap. 7 · 7.1B | COLLINS: «No. Sabían que no volvería. Por eso la traje. Para que alguien de los que abrieron el camino haga el viaje completo, aunque sea de | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 8.64 |
| `c7_71b_armstrong_belka_strelka` | Cap. 7 · 7.1B (diálogo extra) | ARMSTRONG: «En 1960 los soviéticos mandaron a Belka y Strelka y volvieron vivas. Y una cachorra de Strelka, Pushinka, terminó en la Casa Bla | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 12.38 |
| `c7_71b_aldrin_diplomacia` | Cap. 7 · 7.1B | ALDRIN: «¿Una perra espacial soviética viviendo en la Casa Blanca? Eso sí que es diplomacia.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 6.9 |
| `c7_71b_collins_parientes_famosos` | Cap. 7 · 7.1B | COLLINS: «¿Oíste? Tienes parientes famosos.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 2.79 |
| `c7_71b_aldrin_pelos_filtros` | Cap. 7 · 7.1B | ALDRIN: «Mike, si en Houston preguntan por qué hay pelos en los filtros…» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 4.53 |
| `c7_71b_collins_polvo_lunar` | Cap. 7 · 7.1B | COLLINS: «Diles que es polvo lunar. Nadie sabe de qué color es.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 3.93 |
| `c7_dec_aldrin_cabo_laika` | Cap. 7 · 7.1B Decisión | ALDRIN: «Bienvenida a bordo, cabo Laika.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 2.81 |
| `c7_dec_collins_sargento` | Cap. 7 · 7.1B Decisión | COLLINS: «La asciendo a sargento si no ladra en la reentrada.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto cabina) — PLACEHOLDER | 3.33 |
| `c7_74_armstrong_ponganse_traje` | Cap. 7 · 7.4 | ARMSTRONG: «Póngase el traje, caballeros. Todavía no estamos en casa.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto cabina) — PLACEHOLDER | 4.72 |
| `c7_76_mark_trajiste_piedra` | Cap. 7 · 7.6 | MARK: «¿Trajiste una piedra?» | Generado (TTS Piper, voz es_MX-claude-high, tono +5.0 st, efecto telefono_lrl) — PLACEHOLDER | 2.03 |
| `c7_76_armstrong_veintiun_kilos` | Cap. 7 · 7.6 | ARMSTRONG: «Trajimos veintiún kilos. Pero no son nuestras. Son de todos.» | Generado (TTS Piper, voz es_ES-davefx-medium, tono +0 st, efecto telefono_lrl) — PLACEHOLDER | 6.14 |
| `c7_76_rick_te_escuche_aterrizar` | Cap. 7 · 7.6 (ruta A) | RICK: «Te escuché aterrizar.» | Generado (TTS Piper, voz es_AR-daniela-high, tono +2.5 st, efecto telefono_lrl) — PLACEHOLDER | 1.54 |
| `c7_76_rick_nos_lo_tendrias` | Cap. 7 · 7.6 (ruta B) | RICK: «Nos lo tendrías que haber dicho, papá.» | Generado (TTS Piper, voz es_AR-daniela-high, tono +2.5 st, efecto telefono_lrl) — PLACEHOLDER | 2.39 |
| `e_e1_collins_lo_logramos` | Epílogo · E.1 | COLLINS (VOZ EN OFF): «En todas partes la gente no decía «ustedes lo lograron». Decía «lo logramos». Eso era lo correcto.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto vo) — PLACEHOLDER | 6.93 |
| `e_e2_bales_me_quede_congelado` | Epílogo · E.2 (Bales no respondió) | BALES: «Me quedé congelado. Gene me cubrió.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +1.5 st, efecto vo) — PLACEHOLDER | 3.28 |
| `c6_dec_safire_discurso_desastre` | Cap. 6 · 6.3 «¿Y si…?» (desbloqueable) | NIXON (LECTURA DRAMATIZADA): «El destino ha querido que los hombres que fueron a la Luna a explorar en paz se queden en la Luna para descans | Generado (TTS Piper, voz es_ES-davefx-medium, tono -1.5 st, efecto tv_1969) — PLACEHOLDER | 6.39 |
| `c4_41_collins_tomenselo_con_calma` | Cap. 4 · 4.1 Desacople | COLLINS: «Ustedes, tómenselo con calma allá en la superficie lunar.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto radio) — PLACEHOLDER | 4.39 |
| `c4_41_aldrin_okay_mike` | Cap. 4 · 4.1 Desacople | ALDRIN: «Okay, Mike.» | Generado (TTS Piper, voz es_MX-ald-medium, tono +0 st, efecto radio) — PLACEHOLDER | 2.8 |
| `c4_42_collins_relevo_go_descenso` | Cap. 4 · 4.2/4.3 | COLLINS: «Eagle, aquí Columbia. Acaban de darles GO para el descenso propulsado.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto radio) — PLACEHOLDER | 5.65 |
| `c7_71_collins_vuelve_a_casa_a_todo_trapo` | Cap. 7 · 7.1 Tras TEI | COLLINS: «Eh, Houston, Apolo 11 vuelve a casa a todo trapo.» | Generado (TTS Piper, voz es_ES-sharvard-medium spk0, tono +0 st, efecto radio) — PLACEHOLDER | 3.93 |

