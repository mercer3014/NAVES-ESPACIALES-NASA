# PLAN-RPG · «Apolo 11: Un gran salto» → RPG narrativo jugable
Redactado el domingo 15 nov 2026 a las 03:00 (hora de Bolivia). Base de código: rama `mejoras-wip` (commit `7711507`, encima de `mejoras`).
Fuente de verdad: guion del equipo `claude/diseno-usuario.txt` (1.045 líneas; abajo se cita como `G:línea`).
Entrega a las 23:59. **18:00 = lo imprescindible terminado · 21:00 = congelación de funciones · 22:30 = build final.**

---------------------------------------------------------------------------------------------------
## 0. Diagnóstico en 10 líneas (por qué Alex tiene razón)

1. **El juego no tiene ni una escena de exploración en la Tierra.** Todo lo marcado 🎮 en el guion entre el Prólogo y el Cap. 4 se reproduce como cinemática (`runCine` en `src/game/story/cine.js:30`) y las decisiones salen como botones sobre fondo negro (`flow.js:20-23`, `decide()`).
2. **Solo hay un personaje que se camina:** el astronauta de la EVA (`src/game/phases/eva.js:235-275`), con WASD, salto, cámara orbital y «E acción». Ese controlador es la base que se reutiliza.
3. **No se habla con ningún NPC.** Los diálogos son subtítulos automáticos. Las «charlas» del guion (Deke, fogata, noche en Columbia, Laika) son `S.choice()` con botones.
4. **Los 🔍 OBJETOS no se inspeccionan.** Sus tarjetas de la Bitácora se regalan por *ver* la escena (`flow.js:103-128`, `SCENE_CARDS`) o por terminar una fase (`story/phase-cards.js`). Por eso «no aprendemos»: el dato aparece en una notificación que nadie abre.
5. **La Fase 1 (`phases/prep.js` + `prep-tasks/*.js`) son 4 ventanas de minijuego de ratón** (cables, tanques, fuga, anillos) sin lugar, sin personas y sin el «por qué» antes de actuar. El dato real sale *después*, en una ficha (`prep.js:71,82`). Además es históricamente falso: la tripulación no llenaba tanques ni reparaba la válvula (lo hizo el «red crew»).
6. **La Bitácora existe y está bien hecha** (`ui/bitacora.js`, 88 tarjetas en `story/cards.js`, rarezas, [B], aviso). Lo que falta: que las entradas se ganen interactuando, insignias, galería, pistas de eventos ocultos y el diagrama por capítulo.
7. **Los 8 eventos ocultos están programados** (`phase-cards.js`, `eva.js:118,299`, `descent.js:234`, `collins-solo.js:103`, `reentry.js:170`, `epilogue.js:188`), pero **ningún NPC los insinúa** (G:986 lo exige). Así que nadie los descubre.
8. **Audio: hay 83 clips en `public/audio/a11/` que el código nunca reproduce** (36 reales de la NASA y 47 de voz recreada). Entre ellos están el descenso completo, «60/30 segundos», «Luz de contacto», la placa, la llamada de Nixon y «Magnífica desolación». La Fase 1 no tiene ni una voz.
9. **Reto:** la sala de diseño (`src/game/design/*`, WIP) ya afecta al alunizaje (`descent.js:45-46`), a la EVA (`eva.js:61,112`) y al informe con «rediseñar y repetir» (`debrief.js:71-83`). Le faltan presupuesto, energía, comunicaciones y ventana de lanzamiento, y que se juegue *hablando con expertos* en vez de en un formulario.
10. **Modelos:** `public/models/armstrong-house.glb`, `mocr-room.glb`, `hotel-room-1967.glb` y `lrl-room.glb` son versiones viejas **sin nodos `npc-spot-*`**. Las finales con spots están en `Modelado_Apolo11/P3_Tierra/glb/` y hay que copiarlas, revisando que las cámaras de `cutscenes/cine-*.js` sigan encuadrando.

---------------------------------------------------------------------------------------------------
## 1. Brecha guion ↔ juego, capítulo por capítulo

Leyenda: ✅ existe · 🟡 a medias · ❌ falta. «Cine» = se ve como cinemática aunque el guion pida control.

### Prólogo · 1967 (G:137-180)
| Guion | Estado | Dónde está hoy | Qué falta |
|---|---|---|---|
| 0.1 Casa Blanca 🎬 (G:144) | 🟡 | Dentro de `cutscenes/cine-hotel.js:9` | Los clips `p_01_*` (diplomático, asistente, «cuando estemos listos») **no suenan** |
| 0.2 Hotel 🎮 (G:156) | ❌ cine | `cine-hotel.js` | Cuarto caminable: contestar el teléfono, mirar por la ventana |
| 🔍 Foto de Karen (G:164) | ❌ | Tarjeta `foto-karen` regalada (`flow.js:104`) | Inspeccionar la cartera: desenfoque y música baja, **sin texto** |
| 🔍 Libreta Ed White (G:167) | ❌ | Tarjeta regalada; el clip `p_obj_armstrong_recuerdo_ed_white_en` existe | Inspeccionar → voz en off |
| 📘 Apolo 1 (G:170) | ✅ | `cards.js:36` | Se gana al colgar el teléfono, no al ver la escena |
| 0.3 «Duros y competentes» 🎬 | ✅ | `cine-mocr.js` (`mocr-tough`) + voz | — |

### Cap. 1 · «La última cena en la Tierra» (G:182-263)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 1.1 Casa 🎮 exploración (G:189) | ❌ cine | `cine-house.js:9-31` | Casa caminable con Jan, Rick y Mark (spots en la versión P3 del glb) |
| ⚖️ Hijos (G:203) | 🟡 | `decisions.js:13` sobre fondo negro (`flow.js:132`, `kids`) | Elegir **hablando con Rick en el sofá**. Los clips `c1_dec_armstrong_verdad_en` y `…restar_importancia_en` no se usan |
| 🔍 Cohete de Mark (G:217) | 🟡 | Plano final de la cine (`cine-house.js:30`) | Recogerlo y girarlo (separar etapas: la animación `stages-separate` está en `earth-props.glb`) |
| 1.2 KSC «mundo abierto», NPC con «!» (G:222) | ❌ cine | `story/ksc.js` (runCine) | Zona caminable alrededor del pad. Deke con «!». Cambio Aldrin/Collins |
| ⚖️ Primer paso (G:235) | 🟡 | `ksc.js:77` (`ask`) | Dentro del diálogo con Deke; la opción «hablar con Neil» abre la charla en la playa |
| 1.3 Playa «fogata» 🎮 (G:242) | ❌ cine | `story/beach.js` | Sentarse junto a los dos (E) → charla por temas, al estilo del campamento de RDR2 |
| 🔍 Parche, 🔍 Sobres firmados (G:259-262) | ❌ | Tarjetas regaladas (`flow.js:108`) | Objetos en la arena o la mochila de Collins |

### Cap. 2 · «Fuego y trueno» (G:265-315)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 2.1 Cuarteles 🎬 | 🟡 | `bridge:launch-morning` (tarjeta puente) | Base de la nueva Fase 1 (sección 5) |
| 2.2 Panel + 🔍 checklist del muslo (G:275-279) | 🟡 | `prep-tasks/*` (minijuegos), tarjeta `checklist-muslo` sin dueño | La Fase 1 caminable (Sala Blanca) y la checklist como interacción real |
| Despegue «QTE estabilizar mirada» | ✅ | `phases/launch.js` | Los clips `cap2_cuenta_regresiva_*` y `cap2_go_para_orbita` sin usar |
| 2.3 Separación de etapas 🎮 | ✅ | `launch.js:146` | — |
| 2.4 TLI 🎬 | 🟡 | `bridge:tli` | `nasa_real/cap2_go_tli` sin usar |
| 2.5 Acople 🎮 + ⚖️ | ✅ | `cruise.js:139-157` + `whatIf` (`cruise.js:152`) | — |

### Cap. 3 · «Tres hombres en una lata» (G:317-382)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 3.1 Columbia flotando 🎮 (G:324) | ❌ | — | Cabina explorable sin gravedad (P1) |
| 🔍 Sextante (G:328) | 🟡 | Alineación con estrellas en `cruise.js` (la tarjeta `sextante` solo si `wrong===0`) | Objeto del interior → abre el minijuego que ya existe |
| 🔍 AGC/DSKY (G:331) | ❌ | Tarjeta `agc-dsky` regalada en la Fase 1 | Teclear V16 N68 (o similar) en el DSKY de la cabina |
| 🔍 Comida (G:334) | 🟡 | `night.js:125` (botón «Mirar la bolsa») | Objeto inspeccionable; el clip `c3_obj_collins_coctel_camarones_en` existe |
| 3.2 Noche, «elige con quién hablar» (G:336) | 🟡 | `story/night.js:108-150` (cine + `S.choice`) | Acercarse a cada tripulante y hablar (E) |
| ⚖️ Respuesta de Aldrin (G:350) | ✅ | `decisions.js:27` | Dentro del diálogo |
| 3.3 Inspección del Eagle 🎮 (G:357) | ❌ | Tarjeta `eagle-lm5` regalada | P2: `lm-interior.glb` (modelos-grok) con 3 puntos de checklist |
| 3.4 LOI sin radio 🎮 (G:363) | 🟡 | `cruise.js` | Clips `c3_34_*`, `cap3_go_loi_nos_vemos_otro_lado` y `cap3_perdida_senal_detras_luna` sin usar |
| 🔀 Diagrama del cap. 3 (G:382) | ❌ | Solo el diagrama final (`epilogue.js:184`) | Diagrama corto al cerrar cada capítulo |

### Cap. 4 · «Doce minutos» (G:384-528)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 4.1 Desacople 🎬 | 🟡 | `bridge:undock` | Clips `cap4_eagle_tiene_alas`, `c4_41_*` sin usar |
| 4.2 MOCR + 🔍 hoja de Garman «CLAVE» (G:411) | ❌ cine | `cine-mocr.js:37`; la tarjeta `hoja-garman` se regala (`flow.js:109`) | **Bales caminando por el MOCR**: hablar con Kranz, Duke y Garman y recoger la hoja |
| 4.3 PDI plano secuencia | ✅ | `descent.js` | Clips `c4_42_collins_relevo…`, `cap4_go_pdi`, `c4_43_armstrong_vamos_largos` sin usar |
| ⚖️ 1202 en 10 s (G:447) | ✅ | `descent.js:225`, `decisions.js:32` | **Que dependa de la hoja**: con hoja → voz firme; sin hoja → `c4_dec_bales_seguimos_go_tembloroso_en` (existe, sin usar) |
| 4.6 Campo de rocas ⚖️ (G:492) | 🟡 | `descent.js:190-200`: estrellarse = reintentar | Faltan las pantallas «¿Y si…? Pata en una roca» y «Combustible cero» (con `whatIf`, `decisions.js:141`). Faltan los clips `cap4_60_segundos`, `cap4_30_segundos` y `cap4_luz_de_contacto_apagado` (el banner de `descent.js:162` es mudo) |
| 4.7 Casa por la squawk box 🎬 | ✅ | `cine-house.js:34` | Clip `c4_47_rick_papa_confiaba_en` sin usar (variante si `c1-kids=truth`) |

### Cap. 5 · «Magnífica desolación» (G:530-643)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| ⚖️ Descansar o salir (G:541) | ✅ | `decisions.js:37` | Clip `c5_dec_aldrin_como_si_alguien_en` sin usar |
| 5.2 Traje en orden + escalera + primer paso | 🟡 | `eva.js` (escalera de 9 peldaños, E primer paso) | Falta la secuencia del traje. Usa `voice/a11_one_small_step` en vez del pack `nasa_real/cap5_*` |
| 🔍 Huella (G:570) | 🟡 | Tarjeta regalada al terminar la fase | Inspeccionar la propia huella (`boot-print.glb`) |
| 5.3 «Magnífica desolación» + ⚖️ momento a solas | 🟡 | `decisions.js:41` | **Aldrin no está en la EVA** (no hay compañero). El clip real `cap5_magnifica_desolacion` sin usar |
| 🔍 Placa (G:593) | ❌ | Tarjeta regalada | Leerla en la pata: clips `nasa_real/cap5_placa_lectura_armstrong` + `c5_obj_armstrong_lee_placa_en` |
| Bandera (minijuego) | ✅ | `eva.js:176-414` | — |
| 5.5 Llamada de Nixon 🎬 (G:596) | ❌ | Solo la tarjeta | Los 3 clips reales `cap5_nixon_*` y `cap5_armstrong_respuesta_nixon` existen y no se usan |
| 5.6 Ciencia: PSEP, LRRR, SWC | ✅ | `eva.js:289-306` (F) + plan de diseño | — |
| 🔍 Muestras «describir por radio» / 🔍 Hasselblad | 🟡 | Muestra de contingencia + foto | Opcional |
| 🔍 Paquete de recuerdos + evento oculto 2 | ✅ | `eva.js:118` | Pista en un diálogo |
| ⚖️ Parche Apolo 1 (G:626) | ✅ | `decisions.js:45` | Clips `c5_dec_*` de eco sin usar |
| 5.7 Disyuntor roto descubierto | 🟡 | `breaker.js` | Clips `c5_57_aldrin_mira_esto_en` (usado) y `c5_57_armstrong_motor_ascenso_en` (sin usar) |

### Cap. 6 · «El lado silencioso» (G:645-840)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 6.1 Collins solo 🎮 flotar/mirar | 🟡 | `collins-solo.js` (cine + elecciones + fotos con F) | P2: flotar y linterna (luz como mecánica, Plague Tale) |
| 🔍 Ventana, libreta, sextante | 🟡 | `collins-solo.js:77-78` (botones) | Objetos |
| 6.1B «Polvo y fuego» (micrometeoritos, grieta) | ❌ | — | Fuera de alcance hoy: queda como fase 1 del jefe |
| 6.1C Guardián | ✅ | `boss/*` (3 fases, WP8) | 10 clips del sueño sin usar (`c6_61c_*`, `c6_61b_*`): «¿qué ves?», «polvo que se mueve», ecos de Duke, susurro, despertar |
| 6.2 Disyuntor 🎮 «revisa los objetos de la cabina» | 🟡 | `breaker.js:39-48` (`S.choice` con 2 botones) | Mirar y señalar en primera persona: rotulador ✔ / lápiz ✖ / dedo ✖ |
| 6.3 Despegue lunar + Safire | ✅ | `liftoff.js:77-111` | — |
| 6.4 Reencuentro | ✅ | `reunion.js` | — |

### Cap. 7 y Epílogo (G:842-983)
| Guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| 7.1 TEI | ✅ | `tei.js` | `c7_71_collins_vuelve_a_casa_a_todo_trapo_en` sin usar |
| 7.1B Laika + ⚖️ | 🟡 | `cine-laika.js` + `decisions.js:62` | 8 clips del diálogo extra sin usar (Belka y Strelka, Pushinka, «pelos en los filtros»…) |
| 7.2 TV · 7.3 Reentrada · 7.4 Amerizaje | ✅ | `tv.js`, `reentry.js`, `cine-recovery.js` | `cap7_estable_dos` sin usar |
| 7.5 MQF 🎮 + 🔍 ventana | ❌ cine | `cine-lrl.js` / `cine-recovery.js` | P2 |
| 7.6 LRL 🎮 mano en el vidrio | ❌ cine | `cine-lrl.js` | P2: caminar hasta el vidrio, E = mano |
| E.1-E.3 + 🔀 diagrama final | ✅ | `cine-parade.js`, `epilogue.js:184-202` | `e_e2_bales_me_quede_congelado_en` sin usar (rama `timeout`) |

### Sistemas transversales
| Sistema del guion | Estado | Dónde | Qué falta |
|---|---|---|---|
| **Exploración 3.ª/1.ª persona** | 🟡 solo en la Luna | `eva.js:235-275` + `orbit-camera.js` + `core/look.js` | Sacarlo a un módulo reutilizable (sección 4) |
| **NPC con diálogo** | ❌ | — | `explore/dialog.js` |
| **Objetos que enseñan** | ❌ | — | `explore/inspect.js` |
| **Bitácora/manual con logros** | 🟡 | `ui/bitacora.js`, `cards.js`, `state.js:36-52` | Ganar por interacción, campo «Por qué importa», insignias por capítulo, galería, pistas de ocultos |
| **Confianza / Moral** | 🟡 | `state.js` (`adjust`), se muestran en el epílogo (`epilogue.js:202`) | Indicador discreto en el HUD de exploración (cuerda de 3 nudos, G:382) |
| **Desafíos muy difíciles (8)** | ✅ | ver punto 0.7 | Pistas en diálogos y pestaña «Eventos ocultos» en la Bitácora |
| **Finales ¿Y si…?** | 🟡 | Aborto 1202 (`descent.js:227`), Collins falla (`cruise.js:152`), reentrada (`reentry.js:150`), Safire (`liftoff.js:111`) | «Pata en una roca» y «Combustible cero» (G:1031) |
| **Diagrama por capítulo** | 🟡 | Solo el final | Mini diagrama al cerrar cada capítulo (reutilizar `flowchart()`) |

**Error histórico detectado:** `cruise.js:234` reproduce `voice('christmas')` = `a8_merry_christmas.mp3`, que es del **Apolo 8**. Quitarlo. `night.js:141` dice «Karen habría cumplido **diez**», que es correcto (nació en abril de 1959); el guion (G:347) y el clip `c3_32_armstrong_karen_nueve_en` dicen «nueve». **No usar ese clip**: o se deja la línea sin voz o se re-graba.

---------------------------------------------------------------------------------------------------
## 2. Audio: qué falta y cómo completarlo

### 2.1 Inventario
- `public/audio/a11/voz_en_clonada/`: 100 clips (voz recreada en inglés). **47 sin usar.**
- `public/audio/a11/nasa_real/`: 49 clips reales de la NASA. **36 sin usar.**
- `public/audio/voice/`: 7 clips viejos. `a8_merry_christmas` y `a13_houston_problem` **no son del Apolo 11**.
- Mapa: `src/audio/a11-voice-map.js` (texto EN normalizado → archivo). `cine.js:47` llama a `voiceLine(texto_en)` en cada línea de cinemática. Las escenas propias llaman a `playA11('voz_en_clonada/…')` (`night.js:105`, `collins-solo.js:56`).
- Respaldo de voz sintética **ya existe**: `say(text, lang)` en `src/core/audio.js:52` (Web Speech API, `es-ES`/`en-US`).

### 2.2 Escenas mudas o con huecos → clip que ya está en el repo
| Escena / momento | Clips a conectar (ya en `public/audio/a11/`) | Archivo a tocar |
|---|---|---|
| Prólogo 0.1 | `voz_en_clonada/p_01_diplomatico_sovieticos_en`, `p_01_armstrong_cuando_estemos_listos_en`, `p_01_asistente_llamada_houston_en` | `a11-voice-map.js` (añadir las 3 frases EN tal como están en `cine-hotel.js`) |
| Cap. 1 decisión hijos | `c1_dec_armstrong_verdad_en`, `c1_dec_armstrong_restar_importancia_en` | Diálogo de Rick (nuevo) o `flow.js` `kids` callback |
| Fase 1 (nueva) | `nasa_real/cap2_cuenta_regresiva_corta` como megafonía de fondo; `ui_quindar_houston` en cada línea de radio | `explore/` + escena Fase 1 |
| Lanzamiento | `nasa_real/cap2_go_para_orbita`, `cap2_despegue_ringtone_nasa` | `launch.js` |
| TLI | `nasa_real/cap2_go_tli` | `bridge.js` (`tli`) |
| LOI | `nasa_real/cap3_go_loi_nos_vemos_otro_lado`, `cap3_perdida_senal_detras_luna`, `voz_en_clonada/c3_34_armstrong_estamos_en_orbita_en`, `c3_34_collins_yeso_viejo_en` | `cruise.js` (fase LOI) |
| Desacople | `nasa_real/cap4_eagle_tiene_alas`, `voz_en_clonada/c4_41_collins_tomenselo_con_calma_en`, `c4_41_aldrin_okay_mike_en` | `bridge.js` (`undock`) |
| Descenso | `cap4_go_pdi`, `c4_42_collins_relevo_go_descenso_en`, `c4_43_armstrong_vamos_largos_en`, **`cap4_60_segundos`, `cap4_30_segundos`** (en `descent.js:162`), `cap4_aldrin_polvo_40_pies` (alt < 15 m), `cap4_luz_de_contacto_apagado` (al contacto, antes de `voice('eagle')`) | `descent.js` |
| 1202 sin hoja | `c4_dec_bales_seguimos_go_tembloroso_en`; aborto: `c4_dec_bales_abortar_en` | `cine-mocr.js` / `descent.js:225` |
| Casa 4.7 | `c4_47_rick_papa_confiaba_en` si `chose('c1-kids')==='truth'` | `cine-house.js` |
| EVA | `nasa_real/cap5_bajando_del_lem`, `cap5_armstrong_pie_escalera`, `cap5_un_pequeno_paso` (sustituye a `voice('smallstep')` en `eva.js:335`), `cap5_superficie_fina_polvorienta`, `cap5_magnifica_desolacion`, `cap5_placa_lectura_armstrong`, `cap5_nixon_llamada_completa` (o `hola_neil_buzz` + `momento_invaluable` + `armstrong_respuesta_nixon`), `cap5_aldrin_mensaje_reflexion` (5.1) | `eva.js` |
| Ecos de decisiones cap. 5 | `c5_dec_aldrin_como_si_alguien_en`, `c5_dec_aldrin_lo_hiciste_bien_en`, `c5_dec_armstrong_lo_hicimos_en`, `c5_dec_armstrong_hazlo_tu_en`, `c5_dec_armstrong_gracias_anoche_en` (si `c3-night=hand`) | `decisions.js`: añadir `vo:` por opción y reproducirlo en `ask()` |
| Guardián | `c6_61c_aldrin_no_esta_en_plan_en`, `c6_61c_armstrong_que_ves_en`, `c6_61c_aldrin_polvo_que_se_mueve_en`, `c6_61c_duke_eco_sesenta_en`, `c6_61c_duke_eco_treinta_en`, `c6_61c_susurro_siempre_segundo_en(_invertido)`, `c6_61c_aldrin_ya_se_arreglar_en`, despertar `c6_61c_armstrong_tampoco_dormir_en` / `c6_61c_aldrin_sone_polvo_en` / `c6_61c_armstrong_duerme_buzz_en` | `boss/boss.js`, `boss/story.js` |
| Disyuntor | `c5_57_armstrong_motor_ascenso_en` | `breaker.js` |
| TEI | `c7_71_collins_vuelve_a_casa_a_todo_trapo_en` | `tei.js` |
| Laika | `c7_71b_aldrin_trajiste_mascota_en`, `c7_dec_aldrin_cabo_laika_en`, `c7_dec_collins_sargento_en`, `c7_71b_armstrong_belka_strelka_en`, `c7_71b_aldrin_diplomacia_en`, `c7_71b_collins_parientes_famosos_en`, `c7_71b_aldrin_pelos_filtros_en`, `c7_71b_collins_polvo_lunar_en` | `cine-laika.js` + `a11-voice-map.js` |
| Amerizaje | `nasa_real/cap7_estable_dos`, `cap7_hornet_area_amerizaje` (si no suena ya) | `cine-recovery.js` |
| Epílogo (rama timeout) | `e_e2_bales_me_quede_congelado_en` | `epilogue.js` |
| Toda línea de CAPCOM | `nasa_real/ui_quindar_houston` (tono de entrada) y `ui_quindar_hawaii` (salida) | `ui/radio.js` / `capcom.js` |

### 2.3 Líneas nuevas sin grabación (NPC de exploración: Wendt, técnico, Haise, Jan, Garman…)
1. **Texto primero:** la caja de diálogo con texto que aparece letra a letra y un «blip» por línea (`a11sfx`). Nunca bloquear por audio.
2. **Respaldo Web Speech:** opción en Ajustes «Leer diálogos en voz alta» (por defecto ON para cadete/niños), que usa `say(text, lang)` (`core/audio.js:52`) **en el idioma de la interfaz**. Una voz por personaje con `pitch`/`rate` distintos (tabla en `explore/voices.js`).
3. **Real de la NASA (dominio público) para la ambientación:** loops del MOCR y de la plataforma del archivo Apollo 11 Mission Audio: https://app.exploreapollo.org/ (los 30 canales del MOCR, liberados por NASA/UT Dallas) y https://archive.org/details/Apollo11Audio. Transcripciones: Apollo Flight Journal https://www.nasa.gov/history/afj/ap11fj/ y Apollo Lunar Surface Journal https://www.nasa.gov/history/alsj/a11/. Solo bajar 1-2 fragmentos cortos (≤ 30 s, MP3 de 96 kbps) si sobra tiempo; **lo que ya está en el repo cubre lo imprescindible.**
4. Toda línea nueva lleva la etiqueta ◆/◇ igual que en el guion. Las frases reales en inglés van con subtítulo en español.

**Criterio de aceptación de audio:** `node tools/audio-unused.mjs` (script nuevo de 20 líneas, el mismo bucle de grep de este análisis) lista ≤ 10 clips sin uso, y todos justificados (por ejemplo, el de Karen «nueve»). Jugando el descenso se oyen «60 segundos», «30 segundos», «Luz de contacto» y «The Eagle has landed».

---------------------------------------------------------------------------------------------------
## 3. Qué tomar de cada juego de inspiración (barato en Three.js)

| Juego | Técnica concreta | Cómo la hacemos aquí (coste) | Dónde se usa |
|---|---|---|---|
| **RDR2** | *Campamento:* acercarse a la fogata o a un compañero y pulsar un botón inicia charla ambiental. Saludo/antagonizar contextual con el NPC enfocado. Paseos hablando: el NPC habla mientras caminas a su lado. Honor = medidor oculto que cambia diálogos | Zona «sentarse» (E) que lanza un diálogo por temas: 3 temas, cada uno de 2-4 líneas. Al acercarte a un NPC aparecen 2 tonos: **Saludar / Bromear** → ±Confianza (`adjust`). Indicador de Confianza: icono de cuerda que se engrosa (G:382). ~1 h sobre `dialog.js` | Playa 1.3, noche en Columbia 3.2, KSC con Deke |
| **The Last of Us** | *Conversaciones opcionales:* el aviso aparece solo cerca del NPC y si te alejas te lo pierdes. *Artefactos/notas:* objeto → página de texto legible. Momentos de calma (la jirafa) que se activan por proximidad | `inspect.js` muestra el objeto + nota + «Por qué importa». Diálogos opcionales con marca «…» (no «!»). Triggers de proximidad «momento» (ventana de Columbia, vidrio del LRL) | Hotel 0.2 (cartera, libreta), casa 1.1, LRL 7.6 |
| **God of War (2018)** | *Plano secuencia:* la cámara nunca corta; para dialogar se acerca por encima del hombro. *Codex/diario* de Atreus que se llena con lo que ves. *Mimir cuenta historias mientras viajas* | Al iniciar un diálogo, la cámara orbital **interpola** a un encuadre cercano sobre el hombro (offset y FOV con `damp`), sin cortes ni letterbox. Bitácora = codex. Compañero que comenta al pasar cerca de objetos (Aldrin en la EVA, Wendt en la plataforma) | Todo el sistema de exploración, EVA |
| **Detroit: Become Human** | *Objetivos visibles* arriba a la izquierda que se actualizan («Objetivo actualizado»). *Investigación:* reunir pistas cambia las opciones y la probabilidad de éxito (capítulo «El rehén»). *Diagrama* al final de cada capítulo | `objectives.js`: lista con objetivos ocultos «???» que se revelan al explorar. Pistas = flags (`setFlag`): la hoja de Garman cambia la respuesta de Bales. Mini diagrama por capítulo con `flowchart()` | MOCR 4.2→4.4, sala de diseño, cierres de capítulo |
| **A Plague Tale: Requiem** | *Compañero que te sigue* y al que llevas de la mano. *Luz como mecánica* (antorchas contra ratas) | `companion.js`: el NPC sigue a 1,5 m con el clip `walk` a `walk_speed_mps` (extras del nodo `armature`). Linterna: `SpotLight` atada a la cámara en escenas oscuras; los objetos solo «brillan» si los iluminas | EVA (Aldrin), madrugada en la plataforma 39A, Collins detrás de la Luna |

Regla de diseño que sale de los cinco: **«Primero entiendes, luego actúas».** Cada acción va precedida de una persona u objeto que explica el porqué con un dato real, y deja una entrada en la Bitácora.

---------------------------------------------------------------------------------------------------
## 4. Sistema común de exploración (`src/game/explore/`)

### 4.1 Qué se reutiliza del código actual
| Pieza | Archivo | Uso |
|---|---|---|
| Movimiento, salto, gravedad, giro hacia la dirección, huellas | `phases/eva.js:235-275` | Extraer a `explore/controller.js` con `gravity` parametrizable: 9,81 en la Tierra, 1,62 en la Luna, 0 (flotar) en Columbia |
| Cámara orbital con colisión | `game/orbit-camera.js` (`createOrbitState`, `resolveOrbitPosition`, `stepOrbit`) + `game/orbit-view.js` (`bindOrbitControls`) | Cámara en 3.ª persona por defecto; 1.ª persona en cabinas (distancia 0) |
| Ratón (pointer lock) | `core/look.js` (`attachLook`, `releaseLook`) | Igual que en la EVA |
| Teclado y táctil | `core/input.js` (`axis`, `pressed`, `bindBtn`, `makeStick`) | WASD/flechas, Espacio, E. En táctil: stick + botones SALTO/ACCIÓN |
| Aviso «E · …» | `ui/flight-hud-mount.js` (`paintPrompt`) | Mismo estilo que la EVA |
| Personajes Mixamo con clips | `story/cine.js:15` (`character()`) + modelos P3 (`jan`, `rick`, `mark`, `kranz`, `bales`, `duke`, `garman`, civiles P1) | NPC y jugador. Clip `walk` en el sitio: mover la raíz a `walk_speed_mps` (adultos 1,024 · Jan 0,968 · Rick 0,905 · Mark 0,772) |
| Clip según velocidad | `game/locomotion.js` (`locomotionClip`) | Elegir `idle`/`walk` y su `timeScale` |
| Puntos de NPC | Nodos `npc-spot-*` (miran a +Z, `extras.pose` = sit/stand/sit-floor, `seat_height`) en los glb de `Modelado_Apolo11/P3_Tierra/glb/` | Colocar NPC sin coordenadas a mano |
| Decisiones | `story/decisions.js` (`ask`, catálogo `DECISIONS`) + `state.js` (`record`, `adjust`, `setFlag`) | El diálogo llama a `record()` con el mismo id para no romper epílogo ni diagrama |
| Tarjeta «Cómo jugar» | `ui/mission-card.js` (`missionCard(id)`) | Antes de cada escena explorable |
| Bitácora | `state.js:unlock`, `ui/bitacora.js` | `inspect` desbloquea tarjeta |

### 4.2 API (contrato fijo para que los agentes trabajen en paralelo)
```js
// src/game/explore/run.js
export async function runExplore(def, opts) → Promise<{ id, done:boolean, skipped:boolean, flags }>
// def (datos puros, un archivo por escena en src/game/explore/scenes/<id>.js):
{
  id: 'white-room', title: ['CAP. 2 · LA SALA BLANCA', '…'], card: 'prep',        // tarjeta «Cómo jugar»
  world: async () => ({ scene, camera, update(dt), render(), resize(), dispose(), colliders: [Box3|{x,z,r}], floorY(x,z) }),
  gravity: 9.81, camera: { mode: 'third'|'first', dist: 2.6, height: 1.6 },
  player: { model: 'armstrong-civil'|'astronaut-a7l'|'armstrong-vuelo', spawn: [x,y,z], yaw, speed: 1.6 },
  companion: { model: 'aldrin-civil', follow: 1.5 } | null,
  npcs: [{ id: 'wendt', model: 'civil-base', spot: 'npc-spot-wendt' | at:[x,y,z], yaw, clip: 'idle',
           name: ['GUENTER WENDT','…'], marker: '!'|'…', dialog: 'wendt-1' }],
  objects: [{ id: 'valve', node: 'lh2-valve' | at:[x,y,z], r: 1.2, label: ['Inspeccionar la válvula','…'],
              inspect: { title, text, why, fact, src, card: 'fuga-lh2', model?: 'earth-props#valve' },
              requires?: 'talk:tech', reveals?: ['obj:tighten'] , action?: { kind:'hold'|'press'|'sequence', secs:2 } }],
  dialogs: { 'wendt-1': [ { who:'wendt', text:[es,en], vo?:'voz_en_clonada/…' },
                          { choice: [ { id:'joke', label:[…], trust:+5, next:'wendt-joke' }, { id:'ok', label:[…], next:null } ],
                            decision?: 'c1-firststep' } ] },
  objectives: [{ id:'talk:wendt', text:['Habla con Guenter Wendt','…'], hidden:false },
               { id:'obj:valve', text:['Encuentra de dónde sale el silbido','…'], hidden:true }],
  complete: (st) => st.done.has('enter:hatch'),           // condición de salida
  hints: { 'h-45s': 'wendt-2' },                          // pistas de eventos ocultos dentro de diálogos
}
```
Módulos (cada uno ≤ 200 líneas):
- `controller.js`: jugador, colisión círculo contra caja/círculo, salto (Espacio; desactivado en interiores pequeños), gravedad, `pose()` con `locomotionClip`.
- `camera.js`: 3.ª persona (orbital) o 1.ª. Modo **diálogo**: interpola hacia un encuadre sobre el hombro en 0,6 s (estilo GoW, sin corte) y vuelve al terminar.
- `interact.js`: busca el interactuable más cercano dentro de `r` y del cono frontal (±60°). Muestra «E · Hablar con Wendt» / «E · Inspeccionar». Contorno (halo emisivo) en el objeto enfocado. Marcadores «!» (obligatorio) y «…» (opcional) como sprites sobre el NPC.
- `dialog.js`: caja inferior con nombre, texto letra a letra, avanzar con E/clic/Espacio y 2-3 opciones (teclas 1-3 o clic). Llama a `record/adjust/unlock/setFlag`. Voz: `vo` → `playA11`; si no hay `vo` y está activado «Leer en voz alta» → `say()`.
- `inspect.js`: pausa el movimiento y muestra el objeto en primer plano (clon del nodo, rotar arrastrando o con A/D) y un panel con **Qué es · Por qué importa · DATO REAL · Fuente**. Al cerrarlo: `unlock(card)` y objetivo cumplido.
- `objectives.js`: lista arriba a la izquierda (máximo 4 líneas), «Objetivo actualizado» con sonido, «???» para los ocultos. Tecla **Tab** = mostrar/ocultar.
- `companion.js`: seguir al jugador, mirar lo que mira el jugador y decir una línea al acercarse a objetos (`barks`).
- `hud.css`: estilo 1969 de WP4 (negro, crema, naranja) sin tarjetas redondeadas genéricas.

Controles finales: **WASD/flechas** mover · **ratón** mirar (clic para capturar) · **Espacio** saltar · **E** interactuar/avanzar · **1-3** elegir · **Tab** objetivos · **B** Bitácora · **Esc** pausa. En táctil: stick a la izquierda, botones ACCIÓN y SALTO, arrastrar para mirar. En el modo cadete, una **flecha guía** al objetivo activo.

### 4.3 Integración con el flujo
- `story/flow.js`: nuevo envoltorio `explore(id)` igual que `own()`: `const m = await import('../explore/run.js'); const d = await import('../explore/scenes/'+id+'.js'); return m.runExplore(d.default, o)`. Las entradas de `SLOTS` cambian el id de la cinemática por el explorable (la cinemática queda como intro corta de 5-8 s o como respaldo si falla la carga).
- **Siempre saltable** (Esc mantenido 1 s → «¿Saltar escena?»). Al saltarla se aplica la ruta histórica y se dan las tarjetas «Momento», pero **no** las de objeto (así aprender tiene premio).
- `SCENE_CARDS` (`flow.js:103`): **quitar las tarjetas de objeto y persona** de las escenas convertidas. Se ganan en `inspect`.

---------------------------------------------------------------------------------------------------
## 5. La Fase 1 rehecha como exploración: «La mañana del lanzamiento»

**Lugar:** plataforma 39A, 16 jul 1969, 06:00-09:30 hora de Florida. **Jugador:** Neil Armstrong con el traje A7L (`astronaut-a7l.glb`). Gravedad terrestre, sin salto en la pasarela. **Tiempo de juego:** 4-6 min. **Mundo:** `scenes/pad.js` + `launch-tower.glb` + **`white-room.glb` (nuevo, lo hace Grok en Blender: Sala Blanca de 3 × 4 m, escotilla abierta del CM, pasarela del brazo 9 a 98 m, barandillas, focos)**. Respaldo si el modelo se retrasa: cajas y planos de Three.js con las mismas medidas.

Se elimina la ventana de minijuegos de `prep.js` (los módulos `prep-tasks/*.js` quedan solo para el modo Práctica). Todas las tareas son **caminar → hablar o mirar → entender → una acción simple en el mundo**:

| # | Objetivo (se revela así) | Qué hace el jugador | Por qué importa (dato real) | Acción simple | Tarjeta |
|---|---|---|---|---|---|
| 1 | «Sal del ascensor y cruza el brazo 9» | Camina por la pasarela; abajo se ve el cohete con vapor | El brazo de acceso 9 unía la torre con la nave a unos 98 m (320 pies) de altura. Fuente: NASA, Apollo 11 Press Kit / AFJ | Caminar | `torre-lanzamiento` (nueva, rara) |
| 2 | «Algo silba: averigua qué es» (oculto hasta oír el silbido) | Sigue el vapor hasta un técnico del «red crew» → diálogo → inspecciona la válvula | En la madrugada del 16 de julio se halló una fuga en la válvula de reposición de hidrógeno líquido y un equipo subió a apretar sus pernos con el cohete ya cargado. El LH₂ está a −253 °C. Fuente: AFJ, día 1 | **Mantener E** mientras el técnico aprieta (barra de 3 s); la tripulación **no** repara: observa y confirma | `propelente-criogenico` (existente) + `red-crew` (nueva) |
| 3 | «Mira el vapor blanco de las etapas» | Inspecciona desde la barandilla (punto de mirador) | El oxígeno y el hidrógeno líquidos hierven sin parar; por eso se reponían hasta minutos antes del despegue y el cohete «humea». Sustituye a «Llenar los tanques» | E en el mirador → cámara apunta a S-II/S-IC | (dentro de `propelente-criogenico`) |
| 4 | «Conecta tu traje al oxígeno portátil» | Habla con Joe Schmitt (técnico de trajes) y luego E sobre el conector azul y el rojo del ventilador portátil | Desde que se ponían el traje respiraban oxígeno puro: el ventilador portátil los acompañaba hasta la nave. Azul = entra, rojo = sale. Fuente: NASA, fotos de la preparación del 16 jul 1969 | 2 pulsaciones E sobre conectores resaltados (orden azul→rojo; si te equivocas, Schmitt explica) | `traje-a7l` (existente) |
| 5 | «Recibe la checklist» | Habla con Fred Haise (piloto de reserva) junto a la escotilla | Haise, de la tripulación de reserva, revisó los interruptores de la cabina antes de que entrara la tripulación. Fuente: AFJ | Diálogo + **inspeccionar la checklist del muslo** (3 casillas que se tachan con E) | `checklist-muslo` (existente) |
| 6 | «Despídete de Guenter Wendt» | Habla con Wendt en la Sala Blanca | Wendt, jefe de la Sala Blanca, le regaló a Armstrong una «llave de la Luna» (una media luna de espuma) y recibió un «billete de taxi espacial» válido entre dos planetas. Fuente: G. Wendt, *The Unbroken Chain*; NASA | Opción de diálogo **Bromear/Agradecer** (±Confianza) → se recibe la llave | `llave-de-la-luna` (existente) |
| 7 | «Entra en Columbia» | E en la escotilla | Orden real: Armstrong (izquierda), Collins (derecha) y Aldrin (centro). Fuente: AFJ | E → transición a la cabina (1.ª persona) → ronda GO/NO-GO actual (`prep.js`, `STATIONS`) | `agc-dsky` pasa a la cabina |

- Objetivos 2-6 en cualquier orden; el 7 se desbloquea con los demás. Si el jugador se pierde 40 s, Wendt o el técnico «llaman» (bark + flecha en cadete).
- Puntaje de la fase (`mission.js`) = tiempo + objetos opcionales inspeccionados + errores de conector, para no romper `debrief.js`.
- **Pistas de eventos ocultos:** Haise: «Dicen que Neil podría posar ese bicho con 20 segundos de combustible…» (h-45s). Wendt: «Si ves a Garman en Houston, pregúntale por su hojita» (h-hamilton).
- Voces: sin grabación → texto + `say()`; fondo con la cuenta regresiva real (`nasa_real/cap2_cuenta_regresiva_corta`, a volumen bajo como megafonía) y viento.

### 5.1 Resto de escenas «solo clic» → caminables (lista priorizada)
| Prioridad | Escena | Base | Interacciones mínimas | Coste |
|---|---|---|---|---|
| **P0** | **Fase 1 Sala Blanca** | ver arriba | 3 NPC, 5 objetos | 4 h |
| **P0** | **MOCR · Bales antes del PDI (4.2)** | `mocr-room.glb` P3 (spots de Kranz, Duke, Garman y 16 extras) | Kranz (cerrar puertas, chaleco = objeto), Duke, **Garman → hoja (flag `garmanSheet`)**, consola de Bales (inspeccionar el CRT). La hoja cambia la voz en la 1202 y desbloquea la explicación en `quiz` (`descent.js:234`, evento «Tres segundos») | 2 h |
| **P0** | **Casa Armstrong (1.1)** | `armstrong-house.glb` P3 (spots jan, rick, mark, neil) | Jan en la cocina (inicia), cajas de la mudanza (incendio de 1964 = Ed White), **cohete de Mark** (inspeccionar, girar = etapas), **Rick en el sofá → decisión `c1-kids` en el diálogo**, foto familiar. La cinemática actual queda como cierre (7 s) | 2,5 h |
| P1 | Hotel 1967 (0.2) | `hotel-room-1967.glb` P3 (npc-spot-bed/window) | Teléfono (suena → E), cartera (Karen, sin texto), libreta (voz `p_obj_…ed_white`), ventana (tráfico). 1.ª persona, sin salto | 1,5 h |
| P1 | KSC + playa (1.2-1.3) | `ksc.js` / `beach.js` (mismo mundo `pad.js`) | Aldrin con Deke «!» (decisión `c1-firststep` en diálogo), Neil en la playa si se eligió «hablar», **fogata**: E en el tronco → 3 temas (Collins «el único que vuelve», sobres firmados, parche) | 2,5 h |
| P1 | EVA con Aldrin compañero (5.3-5.5) | `eva.js` + `companion.js` + `astronaut-a7l` (2.ª instancia) | Aldrin sigue al jugador; placa (E → leer + clip real), huella propia (E), llamada de Nixon al plantar la bandera (clip real) y «Magnífica desolación» al bajar Aldrin | 2 h |
| P1 | Disyuntor (6.2) | `breaker.js` (cabina ya modelada) | 1.ª persona: mirar alrededor y E sobre rotulador / lápiz metálico / dedo (los incorrectos explican el porqué), luego E sobre el disyuntor | 1 h |
| P2 | Columbia flotando (3.1-3.2) | `night.js` (`makeColumbia`) | Flotar (gravedad 0, Q/E sube/baja); sextante → minijuego actual; DSKY; comida; hablar con cada uno | 3 h |
| P2 | Collins detrás de la Luna (6.1) | `collins-solo.js` | Linterna (Plague Tale), libreta, ventana | 1,5 h |
| P2 | LRL (7.6) | `lrl-room.glb` P3 | Caminar al vidrio, E = mano | 1 h |

---------------------------------------------------------------------------------------------------
## 6. Encaje con el reto «Space Mission Design Game»

**Texto oficial** (resumen público idéntico en nasaspaceapps.ae/challenges y edeon.sonoma.edu; la página oficial https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/ da **error 500** con WebFetch y curl no logra conexión segura desde mi máquina, probado el 15 nov a las ~03:00 hora de Bolivia):
> «Designing a space mission requires careful consideration of competing demands, including mission objectives, spacecraft design, scientific instruments, launch vehicles, budgets, power, mass, communications, and orbital constraints. For students who rarely get to experiment with an entire mission from concept to operation, these trade-offs often remain abstract. Your challenge is to create an interactive game that allows participants to design, manage, and simulate a complete space mission while making engineering decisions, managing limited resources, and evaluating how each choice shapes the success of their mission.»
> Nivel: Beginner/Youth, Intermediate · Categoría: Games.

**Objetivos y consideraciones** (no hay copia literal accesible de la ficha; dos fuentes secundarias coinciden):
- Space Data Atlas (https://spacedata.swapniltamse.com/challenges/space-mission-design-game/): «Create a game where players design, run and simulate a full space mission, trading off objectives, instruments, launch vehicle, budget, power, mass and communications… Define the trade-offs your game scores (mass, power, budget, data return) and keep the first version small… cite the NTRS sources you use.»
- Adaptación del enunciado de otro equipo (https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game, `documentation/challenge.md`; avisa que **no está verificada** contra la página oficial): recorrido «1. Definir objetivos y requisitos · 2. Diseñar nave y carga científica · 3. Elegir lanzador, destino y órbita · 4. Comprobar masa, energía, presupuesto, datos, comunicaciones y vida útil · 5. Simular y evaluar · 6. Revisar el diseño con el informe final»; «no debe haber una única respuesta perfecta»; «el feedback debe explicar las consecuencias»; consideraciones: tutoriales y dificultad progresiva, indicadores comprensibles de masa/energía/dinero/datos/tiempo, evaluación con explicaciones y cooperación de hasta 4 personas con roles.

### 6.1 Cómo se juega (sala de diseño como escena RPG, no como formulario)
- **Lugar:** «Sala de planificación de vuelo, Houston, enero de 1969», reutilizando `mocr-room.glb` con luz de día. Va después del Prólogo (`SLOTS['before:prep']`, entrada `design`).
- **Cuatro expertos = cuatro recursos.** El jugador habla con cada uno; cada charla explica el compromiso con un dato real y **abre la pestaña correspondiente** del panel `design-screen.js`:
  | Experto (NPC) | Pregunta que plantea | Parámetro | Efecto jugable visible |
  |---|---|---|---|
  | Geólogo (Farouk El-Baz, formó a las tripulaciones en geología lunar; modelo `civil-base`) | «¿Ciencia o seguridad?» | **Sitio** (`SITES` en `plan.js`) + **ventana de lanzamiento** (nuevo: 16 jul → Tranquilidad, 18 jul → Sinus Medii, 21 jul → sitio 5; el Sol debe estar bajo, entre ~5° y 14°, para ver las rocas) | Campo de rocas y zona segura en el alunizaje (`descent.js:45`). **Ángulo del sol** en el descenso y la EVA (sombras más largas = rocas más visibles) |
  | Ingeniero del LM (Grumman; `extra-man-1`) | «Cada kilo de ciencia es un kilo menos de combustible» | **Combustible vs. carga** (`fuel`, `payload`, `LIMIT_KG`) | Segundos de margen en el HUD del descenso (`marginSec`); instrumentos que aparecen en la EVA (`eva.js:112`) |
  | Jefe de comunicaciones (`duke`) | «¿Quién ve la caminata?» | **Comunicaciones (nuevo):** solo Goldstone / Goldstone + Honeysuckle Creek / + radiotelescopio de Parkes. Más antenas = más costo; menos = huecos de señal | Calidad de la TV en la EVA (filtro de ruido en la cámara TV de `eva.js:181`) y tarjeta «650 millones lo vieron» solo con buena cobertura. Con poca cobertura, CAPCOM se corta en la EVA |
  | Director de vuelo (`kranz`) | «El presupuesto no es infinito» | **Presupuesto (nuevo):** cada instrumento, antena y kilo de combustible extra cuesta créditos. **Energía (nueva):** baterías del LM (más = más masa, más margen) | Con baterías justas, el disyuntor del cap. 6 tiene **cuenta atrás de energía** (más tensión). Con la EVA larga (`EVA_TIMES.long`) baja el margen de O₂ |
- **Lanzador:** fijo (Saturn V), pero el panel muestra su capacidad hacia la Luna (~45-48 t de carga útil translunar) y la barra de masa del plan contra ese límite. Un dato real por barra.
- **Sin solución perfecta:** los tres perfiles existentes (`PROFILES`: Seguridad, Equilibrio, Ciencia) dan resultados distintos; la NASA de 1969 es una cuarta referencia, no «la correcta».

### 6.2 Cómo se evalúa y se ve el efecto
1. **Durante la misión:** chip «TU PLAN» en el HUD del descenso (margen de combustible en s) y en la EVA (tareas e instrumentos elegidos). Al ocurrir una consecuencia, aviso «Por tu plan: …» (por ejemplo, «Elegiste Tierras altas: el doble de rocas»).
2. **Informe** (`debrief.js:55-83`, ya existe «Tu plan vs. NASA 1969» y «Rediseñar y repetir fase»): añadir las filas presupuesto, energía y comunicaciones, y una frase causa→efecto por decisión. Puntuación en 4 ejes: **Éxito**, **Ciencia** (`sciPct`), **Seguridad** (`riskPct` invertido) y **Eficiencia** (presupuesto sobrante).
3. **Cooperativo** (ya hay modo con CAPCOM remoto): en la sala de diseño, cada jugador (hasta 4) puede «ser» un experto. Opcional, solo si sobra tiempo.

**Criterio de aceptación del reto:** un jugador nuevo, en ≤ 3 min, habla con los 4 expertos, cambia al menos sitio y combustible, ve en el descenso un margen distinto al de la NASA y en el informe lee por qué su resultado fue mejor o peor. Con «Rediseñar» vuelve a jugar solo esa fase.

---------------------------------------------------------------------------------------------------
## 7. Paquetes de trabajo (4 agentes en paralelo + Grok)

Reglas comunes:
- Rama `rpg` desde `mejoras-wip`; antes, **probar y estabilizar el WIP** (30 min, agente D): `npm test`, `npx vite build`, abrir `?debug&phase=prep` y la sala de diseño.
- Cada agente toca **solo sus archivos** y hace commit al terminar cada sub-entrega. Contrato de la sección 4.2 congelado a las 04:00.
- Modelos de Claude: **Sonnet** para lógica e interfaz, **Haiku** para textos, datos y tests; Opus solo si algo se atasca. Claude vuelve a tener cuota a las **06:20**. Hasta entonces avanza Grok en su máquina (motor `explore/` + modelos).
- Verificación: el agente QA de Grok juega cada entrega en Chromium headless (`auditoria-claude/tools/play-full.mjs` adaptado) con capturas y FPS.

### WP-A · Motor de exploración (crítico, desbloquea a todos) — **Grok, de inmediato**
Archivos: `src/game/explore/{run,controller,camera,interact,dialog,inspect,objectives,companion,voices}.js`, `explore/hud.css`, `explore/scenes/_demo.js`, `tests/explore.test.mjs`. Toca `flow.js` solo para añadir `explore()`.
Pasos: 1) extraer controlador y cámara de `eva.js` sin cambiar la EVA (la EVA se migra en WP-C P1); 2) prompt e interact; 3) dialog con ramas + `record/adjust/unlock`; 4) inspect con panel «Qué es · Por qué importa · Dato · Fuente»; 5) objectives; 6) companion; 7) táctil.
**Hecho cuando (09:30):** en `?debug&explore=_demo` el jugador camina con WASD/stick, salta, gira la cámara con el ratón y no atraviesa paredes. Ve «E · Hablar» al acercarse a un NPC y elige 1 de 2 respuestas (la Confianza cambia en `run.trust`). Inspecciona un objeto, ve el panel con fuente, y al cerrarlo aparece «+1 entrada en la Bitácora». Un objetivo oculto se revela al acercarse. Va a ≥ 50 fps en la laptop de Alex.

### WP-B · Fase 1 «La mañana del lanzamiento» caminable — **Claude agente 1 (Sonnet)**, desde las 06:30
Archivos: `src/game/explore/scenes/white-room.js`, `src/game/phases/prep.js` (reescritura: carga la escena explorable y luego la ronda GO/NO-GO existente), tarjetas nuevas en `story/cards.js` (`torre-lanzamiento`, `red-crew`; **solo añadir claves**), textos en `ui/mission-card.js` (tarjeta `prep`). Modelo `public/models/white-room.glb` (lo entrega Grok a las 08:00; hasta entonces, cajas).
**Hecho cuando (13:00):** el jugador sale del ascensor, cruza la pasarela, sigue el silbido, habla con el técnico y ve apretar la válvula, conecta azul→rojo con Schmitt, tacha la checklist con Haise, recibe la llave de Wendt y entra por la escotilla. Ninguna ventana de minijuego de ratón. Cada acción va precedida de su explicación con fuente. La Bitácora suma 5 entradas. Se completa en 4-6 min. La ronda GO/NO-GO y el lanzamiento siguen igual.

### WP-C · Escenas de la Tierra caminables + MOCR — **Claude agente 2 (Sonnet)**, desde las 06:30
Archivos: `explore/scenes/{house,mocr-bales,hotel,ksc-beach}.js`, `story/flow.js` (`SLOTS` y `SCENE_CARDS` de estas escenas), copia de `Modelado_Apolo11/P3_Tierra/glb/{armstrong-house,mocr-room,hotel-room-1967,lrl-room}.glb` a `public/models/` (revisar que `cine-house.js` y `cine-mocr.js` sigan encuadrando, ajustando las coordenadas si cambian), `descent.js` solo en la línea de la 1202 (leer `flagOf('garmanSheet')`).
Orden: **casa (P0) → MOCR (P0) →** hotel (P1) → KSC+playa (P1).
**Hecho cuando:** (14:00, P0) en la casa el jugador habla con Jan, mira las cajas y el cohete (las etapas se separan) y decide qué decir **hablando con Rick en el sofá**; la decisión aparece en el diagrama final. En el MOCR, como Bales, habla con Kranz, Duke y Garman; si recoge la hoja, en la 1202 suena la voz firme y si no, la temblorosa (`c4_dec_bales_seguimos_go_tembloroso_en`). (18:00, P1) hotel con teléfono, cartera y libreta; KSC con Deke «!» y fogata con 3 temas.

### WP-D · Bitácora 2.0 + audio + sala de diseño ampliada — **Claude agente 3 (Sonnet + Haiku)**
Archivos: `ui/bitacora.js/.css`, `story/cards.js` (campo `why` en las tarjetas de objeto; Haiku), `story/state.js` (insignias), `audio/a11-voice-map.js`, `story/decisions.js` (campo `vo` por opción), `phases/descent.js` (callouts de audio y `whatIf` de roca y combustible cero), `phases/eva.js` (clips reales: placa, Nixon, «Magnífica desolación», paso), `phases/cruise.js` (quitar el clip del Apolo 8 y añadir el audio de la LOI), `boss/*` (clips del sueño), `cine-laika.js`, `design/{plan,design-screen}.js`, `phases/debrief.js`, `tools/audio-unused.mjs`.
Sub-entregas:
1. (09:00) Estabilizar `mejoras-wip`: tests y build en verde.
2. (12:00) **Audio:** conectar la tabla 2.2 completa y añadir los quindar.
3. (14:00) **Bitácora:** pestañas Capítulos · **Insignias** (una por capítulo al 100 %, con el `mus_stinger_insignia_capitulo_100` que ya existe) · **Eventos ocultos** (8 tarjetas negras con su pista en cuanto un NPC la dice) · **Galería** (6 fotos de la NASA de dominio público, enlazadas desde images.nasa.gov y descargadas a `public/img/gallery/`; por ejemplo AS11-40-5903, el retrato de Aldrin). En cada tarjeta, la línea «Por qué importa».
4. (17:00) **Sala de diseño:** presupuesto, energía, comunicaciones y ventana en `plan.js` (con tests en `tests/design.test.mjs`), efectos de la sección 6.1 en descenso, EVA y disyuntor, y las filas del informe.
**Hecho cuando:** `tools/audio-unused.mjs` ≤ 10. En el descenso se oyen 60 s, 30 s, «Luz de contacto» y «Eagle has landed». Al pulsar B se ven las insignias y los ocultos con pista. Cambiar las comunicaciones cambia la TV de la EVA, y el informe lo explica.

### WP-E · Modelos y QA — **Grok (Blender + agentes de verificación)**
1. (08:00) `white-room.glb`: Sala Blanca + pasarela del brazo 9 + escotilla, con nodos `npc-spot-wendt`, `npc-spot-schmitt`, `npc-spot-haise`, `npc-spot-tech`, `obj-lh2-valve`, `obj-vent-connector-blue/red`, `obj-hatch`, `spawn-player`. Menos de 25 k triángulos, meshopt + webp, validado con `_Compartido/validar_glb.mjs`.
2. (10:00) Props de inspección en `explore-props.glb`: ventilador portátil, cartera con foto (sin rostro reconocible), libreta, teléfono de disco, hoja de Garman, sobres firmados, checklist del muslo y llave de la Luna.
3. QA continuo: tras cada commit, juego automático + capturas + FPS. Informe en `auditoria-claude/QA-RPG.md`.

### WP-F · EVA, disyuntor y cierres (P1, tarde) — **Claude agente 4** (o el agente 2 al terminar)
Archivos: `phases/eva.js` (migrar a `explore/controller.js` y añadir Aldrin compañero + 3 inspecciones), `story/breaker.js` (1.ª persona con objetos), mini diagrama por capítulo (`epilogue.js:flowchart` exportado y llamado desde `bridge.js`).
**Hecho cuando (20:00):** en la EVA, Aldrin sigue al jugador y dice «Magnífica desolación»; la placa se lee con la voz real; al plantar la bandera suena la llamada de Nixon. En el disyuntor, el jugador mira la cabina y elige el rotulador con E; el lápiz provoca «Negativo, Eagle. Nada conductor».

### Calendario (hora de Bolivia)
| Hora | A (Grok) | B | C | D | E (Grok) |
|---|---|---|---|---|---|
| 03:00-06:20 | Motor explore 1-4 | — (sin cuota) | — | — | white-room.glb |
| 06:30-09:30 | Motor 5-7 + demo | Escena con cajas | Copia de glb + casa | Estabilizar WIP | Props + QA del demo |
| 09:30-13:00 | Soporte y arreglos | **Fase 1** completa | Casa + MOCR | Audio | QA |
| 13:00-18:00 | WP-F EVA | Pulido + táctil | Hotel + KSC/playa | Bitácora + diseño | QA completo de punta a punta |
| 18:00-21:00 | Arreglos | Arreglos | Arreglos | Informe | QA + FPS |
| 21:00 | **Congelación** | | | | |
| 22:30 | Build final, `npm test`, prueba en la laptop de Alex | | | | |

### Lo imprescindible a las 18:00 (si algo se cae, se recorta lo de abajo)
1. Motor de exploración (WP-A).
2. Fase 1 caminable (WP-B).
3. Casa Armstrong + MOCR con hoja de Garman (WP-C P0).
4. Audio conectado (WP-D 2).
5. Bitácora con «Por qué importa», insignias y pistas (WP-D 3).
6. Sala de diseño con efectos visibles y un informe que los explica (WP-D 4).

Recortables, en este orden: Columbia flotando → Collins con linterna → LRL → KSC/playa → hotel → compañero en la EVA.

### Riesgos
- **Cuota de Claude:** si se agota otra vez, Grok sigue con el paquete abierto desde su máquina; todo se commitea por sub-entrega.
- **glb P3 vs. cinemáticas:** si las coordenadas cambian, se mantiene el glb viejo para la cinemática y el P3 solo para la escena explorable (los dos caben: ~0,1 MB cada uno).
- **Rendimiento:** escenas interiores pequeñas, sombras solo del sol o foco principal, `renderer.setPixelRatio(min(1.5, dpr))`. Objetivo: ≥ 50 fps.
- **Precisión histórica:** cada dato nuevo lleva fuente (AFJ, ALSJ, NASA). Lo dramatizado va marcado ◇, como en el guion.
