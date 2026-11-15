# Cómo validar los modelos de Persona 4 (Luna) en tu laptop (Windows)

Necesitas Node.js 20.19 o superior (o 22.12+; Vite 8 no arranca con Node 18) y Chrome o Edge. Compruébalo con `node -v`. Descomprime `entrega-p4-principal.zip` (y, si quieres, `entrega-p4-previews.zip`) en la misma carpeta, por ejemplo en el Escritorio. Queda todo dentro de `entrega-p4`.

## 1. Visor de modelos sueltos (puerto 5190)

En PowerShell:

```powershell
cd ruta\a\entrega-p4\visor
npm i
npm run dev
```

Abre http://localhost:5190

Si ya tienes abierto el visor de la Persona 3, ciérralo antes (Ctrl+C en su ventana), porque usa el mismo puerto.

A la izquierda aparece «Persona 4 · Luna» con 5 archivos. En el centro está el modelo, con una cuadrícula de 1 m y un maniquí de 1,80 m. A la derecha ves las métricas del validador, los clips y los nodos.

Las piezas pequeñas (medallas, disco, martillo) miden centímetros: desmarca «Maniquí 1,80 m» arriba a la derecha y acerca la cámara con la rueda del ratón.

### Qué comprobar en cada modelo

**eva-tools.glb**
- [ ] Nodos `geo-hammer`, `core-tube-1`, `core-tube-2`, `hasselblad` y `lec-pulley` en la lista.
- [ ] Martillo de ~0,41 m, tubos de ~0,42 m con tapa azul y roja, Hasselblad de ~0,21 m, polea con cinta de ~0,65 m.
- [ ] 1.728 tris en total (cada pieza entre 250 y 520), «Sin avisos».

**memorial-kit.glb**
- [ ] Nodos `apollo1-patch`, `medal-gagarin`, `medal-komarov`, `silicon-disc` y `olive-branch`.
- [ ] Parche del Apolo 1 de ~10 cm con textura (diseño propio), medallas de ~3,5 cm, disco de silicio de 3,8 cm y rama de olivo dorada de ~11 cm.
- [ ] Sin avisos.

**o2-hose.glb**
- [ ] 6 huesos (`hose-0` … `hose-5`) y el clip `flex`.
- [ ] Al pulsar Reproducir con `flex`, la manguera de ~2 m se dobla suave y vuelve sin saltos.
- [ ] Pesos >4 = 0 y pesos no normalizados = 0.

**guardian.glb** (el Guardián, No Canon)
- [ ] Coloso de ~15 m que se apoya en 4 puntos (puños y pies), encorvado, de regolito gris beige.
- [ ] La cabeza se ve **por encima de los hombros**, sin rostro, con una cavidad oscura. Esta fue la corrección del QA.
- [ ] Placas de basalto en los hombros y las rodillas, núcleo DSKY verde con «1202» en el pecho, depósito plateado en la espalda y jirones dorados en los brazos.
- [ ] 20 huesos y clips `idle` (3,5 s), `sweep` (2,5 s) y `slam` (2,5 s).
- [ ] En `sweep` barre con el brazo derecho por delante, **bajo** (el puño pasa a ~1 m del suelo, a la altura del pecho del astronauta). En `slam` levanta los dos brazos y golpea el suelo. Los pies no deben resbalar ni hundirse.
- [ ] 5.879 tris (rango del plan: 4–6k), 0,29 MB.
- [ ] La «Caja» del validador dice 13,2 × 16,4 × 9,6 m, pero la real es 13,2 × 15,4 × 12,7 m: el validador no sigue bien las piezas colgadas de huesos. No es un error del modelo.

**boss-arena.glb**
- [ ] Suelo de ~60 m de diámetro, borde de cráter en 8 trozos (`rim-1` … `rim-8`), 5 rocas (`boulder-1` … `boulder-5`), y los vacíos `spawn-player` y `spawn-guardian`.
- [ ] El suelo y el borde se unen sin grietas. La franja oscura que ves junto al borde es sombra, no un hueco: compruébalo en la escena de prueba con las cámaras `borde-*`.
- [ ] Sin avisos.

## 2. Escena de prueba: el Guardián en la arena (puerto 5194)

En otra ventana de PowerShell:

```powershell
cd ruta\a\entrega-p4\prueba-escena
npm i
npm run dev
```

Abre http://localhost:5194

Arriba a la izquierda hay dos escenas:

**«Guardián en la arena»**
- [ ] El Guardián aparece en `spawn-guardian` mirando al astronauta, que está en `spawn-player`, en la entrada sur.
- [ ] Botones `idle`, `sweep` y `slam`: cada uno reproduce su clip. Usa «×0,25» para verlo lento y «ir al impacto» en `slam` (1,2333 s): aparece el letrero IMPACTO y los puños tocan el suelo.
- [ ] Cámaras `jugador`, `frente`, `lado`, `cerca`, `3-4` y `arriba` para revisar el Guardián. Desde `3-4` debe verse la cabeza.
- [ ] Cámaras `borde-n`, `borde-e`, `borde-s`, `borde-o`, `desde-borde` y `borde-rasante`: miran la unión del suelo con el borde. No debe verse el fondo negro del cielo **por debajo** del horizonte ni ninguna grieta.
- [ ] Puedes orbitar con el ratón (clic izquierdo para girar, rueda para zoom, clic derecho para desplazar).

**«Herramientas y recuerdos»**
- [ ] eva-tools, memorial-kit y o2-hose sobre una cuadrícula de 10 cm, con un astronauta de 1,8 m como referencia.
- [ ] Botones para centrar cada modelo o cada nodo. Abajo se ven sus medidas en cm.
- [ ] La manguera se mueve con `flex` (botón para pausar).

Criterio de aprobado: nada en rojo en el recuadro y todos los puntos de arriba cumplidos. Si algo falla, abre la consola del navegador con F12 y mándame el mensaje.

## 3. Cráteres Little West y West Crater (en el juego)

El juego **no** lee `moon-surface-height.json`: el relieve sale de `ground()` en `src/sim/lander.js`. Por eso los cráteres van como un parche de 2 líneas (`parche/lander-craters-a11.patch.js`, o `parche/lander-craters-a11.diff`). Para probarlos:

1. En una **copia** del juego, pega las 2 líneas como indica el `.patch.js`.
2. Corre `npm run dev` y abre directamente la caminata con http://localhost:5173/?phase=eva&sub=walk (el atajo `?phase=` solo funciona con `npm run dev`). Camina unos 60 m hacia el este del LM (en el juego, hacia −x; unos 35 s a paso normal): ahí está la hondonada de Little West, de 33 m de ancho y unos 3,5–4 m de profundidad. Se ve como un cuenco suave porque queda fuera del tile de detalle.
3. Comprueba que el LM, la bandera, la cámara de TV y los experimentos no quedan enterrados ni flotando. El QA midió un cambio de altura de 0,000 m en todos ellos.
4. `node tests/sim.test.mjs` debe seguir pasando (14/14), y `npm run build` debe compilar.

Capturas de referencia en `capturas/16-*.png` y `17-*.png` y en `previews/juego-eva-*-antes-vs-despues.png`.

## 4. Validador por línea de comandos (opcional)

```powershell
cd ruta\a\entrega-p4\_Compartido
npm i
node validar_glb.mjs ..\glb --reglas reglas-p4.json
```

Debe dar 5 archivos y 0 avisos.

## Capturas incluidas (carpeta `capturas/`)

| Archivo | Qué muestra |
|---|---|
| 01-arena-vista-jugador | Lo que ve el jugador al entrar: el Guardián en idle |
| 02-guardian-3-4 / 03-guardian-cerca | La cabeza sin rostro, ahora visible desde 3/4 |
| 04-slam-impacto / 05-slam-brazos-arriba / 06-sweep | Los ataques |
| 07-arena-arriba / 08-arena-borde-rasante / 09-arena-desde-borde | Unión del suelo y el borde, sin grietas |
| 10-props-todo / 11-eva-tools / 12-memorial-kit / 13-o2-hose-flex | Las piezas pequeñas a escala |
| 14-visor-guardian / 15-visor-boss-arena | El visor con las métricas |
| 16 / 17-juego-eva-little-west | El juego real con el parche de cráteres |
