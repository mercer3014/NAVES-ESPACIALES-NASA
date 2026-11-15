# Bloque B (Grok Bot) · civiles, ropa de vuelo, Saturn V y público del KSC

## 1. Copiar modelos
Todo lo de `models/` en este zip ya va **comprimido** (meshopt + webp, el comando seguro, `--resample false`).
Cópialo tal cual a `public/models/`:

| Archivo | Nuevo / reemplaza | Qué es |
|---|---|---|
| `armstrong-civil.glb` | reemplaza | Polo azul claro de manga corta, pantalón gris, cinturón, dedos semicerrados |
| `aldrin-civil.glb` | reemplaza | Polo azul marino de manga corta, pantalón caqui, cinturón, dedos semicerrados |
| `collins-civil.glb` | reemplaza | Camisa a cuadros roja y azul marino de manga larga, pantalón gris azulado, dedos semicerrados |
| `civil-base.glb` | reemplaza | Slayton: camisa blanca de manga corta sin huecos de piel, corbata estrecha, sin muñequeras |
| `armstrong-vuelo.glb` | **nuevo** | Mono de vuelo de una pieza `#E9E4D6` con cremallera, bolsillos, parche del Apolo 11, NASA, bandera y placa con el nombre; dedos semicerrados |
| `aldrin-vuelo.glb` | **nuevo** | Igual, con la placa ALDRIN |
| `collins-vuelo.glb` | **nuevo** | Igual, con la placa COLLINS |
| `saturn-v.glb` | reemplaza | Pintura `#E8E6E0` con más detalle de paneles, menos brillo, anillos entre etapas en gris |
| `ksc-crowd.glb` | reemplaza | Público de siluetas redondeadas con 6 atuendos de 1969 (261–298 triángulos por persona) |

Los 9 modelos tienen el mismo esqueleto (22 huesos), los mismos nombres y posiciones de nodos y los mismos clips (`idle walk sit talk point wave`) que los originales. Lo comprobé por script, y los `*-vuelo` se compararon con `*-civil` originales. El validador no da errores; los únicos avisos son los nombres `Body`, `Armature`, `S1C`, etc., que no están en kebab-case pero ya venían así y el código los usa.

## 2. Aplicar el código
Desde la raíz del proyecto (la carpeta que contiene `src/`):

```
git apply modelos-grok/codigo-bloqueB/vuelo-a-bordo.diff     # o: patch -p1 < .../vuelo-a-bordo.diff
```

Cambia 4 archivos para que la tripulación lleve el mono de vuelo **a bordo**:

| Escena | Archivo | Antes → después | Por qué |
|---|---|---|---|
| 5 · Noche en Columbia | `game/story/night.js` | `*-civil` → `*-vuelo` | Durmiendo en la cápsula, con mono de vuelo |
| 6.4 · El reencuentro | `game/story/reunion.js` | `*-civil` → `*-vuelo` | Dentro del CM tras el acoplamiento. Collins llevaba el mono; Armstrong y Aldrin llegaron con el A7L y se lo quitaron enseguida. El mono es la opción más limpia (también se podría usar `astronaut-a7l` para los dos que vuelven) |
| Collins solo detrás de la Luna | `game/story/collins-solo.js` | `collins-civil` → `collins-vuelo` | A bordo de Columbia |
| 7.2 · La última transmisión de TV | `game/story/tv.js` | `k + '-civil'` → `k + '-vuelo'` | Las fotos de esa emisión los muestran con el mono blanco |

Las escenas que siguen en `*-civil` lo hacen a propósito, porque corresponden a ropa de civil:
- `beach.js` (la playa, días antes)
- `ksc.js` (el KSC con Slayton)
- `cine-house.js` y `cine-hotel.js`
- `cine-lrl.js` (el Laboratorio de Recepción Lunar de Houston, donde vestían de calle)
- `cine-parade.js` (el desfile de Nueva York)
- `epilogue.js` (la foto final)

`docking.js`, `reentry.js` y `cine-recovery.js` (el MQF en el Hornet) **no cargan personajes civiles**, así que no hay nada que cambiar ahí. Si más adelante se añade gente dentro del MQF, conviene usar `*-vuelo`, porque en la cuarentena del Hornet llevaban ropa de vuelo.

El diff se probó con `patch -p1` sobre una copia limpia de `unificado/src`, y `node --check` pasa en los 4 archivos.

## 3. Notas
- El público pasa de ~200 a ~1.000 triángulos por grupo, unos 130.000 en toda la playa. Si la laptop va lenta, en `scenes/ksc-crowd.js` se puede subir el paso de los grupos lejanos de 30 a 60 m o quitar la fila `dz = -8`.
- Saturn V: el "blanco quemado" viene sobre todo de la exposición y del brillo especular, porque la textura ya tenía de media `#DDDDD8`. Si sigue quemado, bajar `toneMappingExposure` o `envMapIntensity` en `pad.js`.
- Saturn V: "UNITED STATES" sigue en el S-II y "USA" con la bandera en el S-IC, como en el AS-506 real. El patrón de *roll* del S-IC ya existía. No añadí una franja negra al S-II, porque en el Apolo 11 era blanco.
- No hay huesos de dedo. La pose semicerrada de las manos está en la malla, así que el clip `point` no extiende el índice.

## 4. Capturas (`capturas/`)
- `trio-vuelo.png`: los tres con el mono de vuelo y un primer plano de la mano.
- `comparar-vuelo.png`: el mono azul original frente al mono de vuelo.
- `trio-civiles-despues.png`: los cuatro civiles.
- `comparar-<nombre>.png`: antes arriba, después abajo, con cuerpo entero, torso, mano, 3/4 hablando y cara.
- `comparar-saturn-v.png`, `comparar-ksc-crowd.png` y `ksc-crowd-cerca.png`.
