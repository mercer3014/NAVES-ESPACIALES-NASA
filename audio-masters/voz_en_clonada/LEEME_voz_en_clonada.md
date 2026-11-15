# Apolo 11: Un gran salto — Voces en inglés clonadas

## Voces en inglés clonadas y con emoción (voz_en_clonada/)
- **Qué es:** las 100 líneas de voz del guion, traducidas a un inglés natural y actuadas con emoción según la escena. Las líneas REALES usan sus palabras originales en inglés: el discurso «Tough and Competent» de Kranz, las memorias de Collins, el texto de Safire, «You cats take it easy…», «beaming all the way home», la placa. Se mantienen los efectos de radio con quindar, teléfono, casco, eco y susurro, y la normalización a −16 LUFS.
- **Motor:** Chatterbox TTS en inglés, de Resemble AI. Licencia **MIT**, con uso comercial del software permitido. Hace clonación de voz *zero-shot* con control de emoción por «exaggeration» y CFG, y corre en CPU (unas 3 veces más lento que el tiempo real). Cada archivo lleva la marca de agua inaudible PerTh. Se descartaron estas alternativas:
  - XTTS-v2 y F5-TTS: sus pesos tienen licencia no comercial.
  - Zonos: necesita GPU o espeak y es más pesado.
  - OpenVoice y StyleTTS2: su clonación es menos expresiva.
- **Referencias reales:** segmentos limpios extraídos de grabaciones de dominio público (NASA Highlights, loops MOCR de Apollo in Real Time y VOA) y limpiados con **DeepFilterNet** (MIT/Apache-2.0).
- **Personajes de ficción o sin audio libre:** voces elegidas de **LibriTTS-R** (CC-BY 4.0, hay que dar atribución). Los niños usan voces agudas con un ajuste de tono.
- **Control de calidad:** cada línea se transcribió con Whisper y se comparó con el texto. Las que fallaron (repeticiones o palabras cambiadas) se regeneraron con otras semillas y se eligió la mejor. La similitud de hablante con la referencia (embeddings de voz) da en promedio entre 0,88 y 0,90 para Armstrong, Aldrin, Collins y Kranz.
- **⚠️ DERECHOS:** las voces clonadas de personas reales (Armstrong, Aldrin, Collins, Kranz, Duke, Garman, Bales, Nixon y el CAPCOM) imitan su identidad vocal. Que las grabaciones fuente sean de dominio público **no** autoriza a imitar la voz. Para una publicación comercial puede hacer falta **permiso de los herederos o titulares de los derechos de imagen y voz** (derecho de publicidad), y conviene indicar en los créditos que son voces sintéticas recreadas. Para un prototipo educativo o un hackathon, márquenlas como «voz recreada por IA».

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



El catálogo completo está en `catalogo_voz_en_clonada.csv`. Las muestras recomendadas están en `_muestras/`.
