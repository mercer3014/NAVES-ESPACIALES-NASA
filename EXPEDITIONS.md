# Expediciones 2–3: guía de juego e integración

Misión 1 conserva su arquitectura Apollo; las expediciones añaden Huerto rojo y Horizonte.

## Cómo jugar
Desde **Misiones**, elige Huerto rojo u Horizonte. Cada briefing ofrece solo con Pancho o crear sala. También puede elegirse destino en la sala; solo el host lo cambia. El código escrito o QR une al segundo dispositivo. Ambos roles pueden ser host.

### Huerto rojo
1. Centra el rover con A/D o stick; libera paracaídas con E por debajo de 260 m (objetivo 180).
2. W/S cambia empuje; usa E a 4–22 m, |v|<3 m/s, |x|<16 m y deriva<3 m/s para la grúa.
3. Conduce a ○ hielo y ◇ regolito. E recoge a menos de 3 m. Reúne 4 agua/3 regolito y vuelve a la base (+), fuera del invernadero.
4. E monta el recinto. Cinco soles de 90 s: reúne hielo adicional y repara fugas, hongos y paneles en base por 1 regolito. Las tormentas reducen producción solar al 23%.
5. CAPCOM ajusta agua/luz/temperatura/CO₂. Pancho hace esto en solitario o al perder CAPCOM; no conduce el rover por ti.
6. Debrief muestra kg por cultivo, eficiencia, reparaciones, eventos y score. Si se pierden todos los cultivos, se puede reiniciar desde el huerto construido.

### Horizonte — ciencia ficción explícita
- WASD/stick aplica empuje orbital. E acopla o confirma retorno. P/botón envía un estado de texto simulado.
- Iguala posición y velocidad de la sonda cyan: distancia<0,65 y velocidad relativa<0,65 unidades de juego/s. CAPCOM autoriza acople durante 45 s externos.
- Remolca la sonda, completa un giro/periapsis fuera del límite y vuelve a radio≥10 con GO de retorno. Nunca se puede completar cruzando el límite rojo; también falla si la sonda remolcada lo cruza.
- CAPCOM compara reloj externo y propio y recibe texto entregado más lento. **Esto no estira ni modifica el micrófono real.**
- La física, trayectoria de sonda, lente y discos son aproximaciones de juego, no un cálculo relativista. Desde dentro de un horizonte real no se puede regresar ni enviar señales al exterior. La pérdida de misión al cruzar es una regla de juego, no una afirmación de muerte instantánea al cruzar un horizonte supermasivo.
- Un «año» de relato representa 20 s de diferencia acumulada entre relojes. Se etiqueta siempre como escala ficticia.
- La misión falla por horizonte, sonda perdida, deriva excesiva o ventana de 240 s. Hay reintento claro. Resultado: rescate, fuel, costo temporal y bandera proyectada.

## Red y estado
- Mensaje `selection {mission}`: solo host, antes del inicio, destinos `apollo|mars|horizon`.
- `joined` y `roster` incluyen misión. `start` se normaliza al destino de la sala por el servidor.
- Piloto autoritativo envía `phase` y `snap {ph:mission,d:state}`; CAPCOM manda `ev {k:'exp-control',mission,key,value}`. Piloto valida que venga del otro rol.
- `resume.aux` conserva el snapshot íntegro de estas expediciones; no modifica el esquema de progreso Apollo. URL `room` se conserva al unirse y se retira al salir.
- CAPCOM ausente: Pancho gestiona clima/GO. Piloto ausente: CAPCOM espera la reconexión sin fingir un piloto autónomo. Piloto sin WebSocket: simulación pausada.
- Salas en memoria, no cuentas ni almacenamiento permanente; reiniciar el servidor no garantiza conservarlas.

## Pruebas y límites

`npm test` y `npm run test:expeditions` comprueban simulaciones y contratos de recursos. Ver `README.md` para pruebas de navegador y requisitos.

Las pruebas automatizadas o emuladas no acreditan teléfono físico, micrófono real ni HTTPS/WSS público. Invernadero/carrier y nave/sonda son geometría original de runtime, no nuevos GLB cinematográficos de artista. El rover sí es el modelo NASA detallado existente. Licencias en `public/licenses.txt`.
