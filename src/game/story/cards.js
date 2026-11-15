// Catálogo de la Bitácora del Apolo 11. ch: 0 prólogo, 1–7 capítulos, 8 epílogo, 9 No Canon.
// cat: moment | object | person | place | science | decision. rar: common | rare | epic | legendary | hidden.
// date (UTC), fact y src se muestran en la tarjeta; img describe la fotografía asociada (no se incluye la imagen).
const c = (ch, cat, rar, title, extra = {}) => ({ ch, cat, rar, title, ...extra });

export const CHAPTERS = [
  ['Prólogo · Fuego en la plataforma', 'Prologue · Fire on the pad'],
  ['Cap. 1 · La última cena en la Tierra', 'Ch. 1 · The last supper on Earth'],
  ['Cap. 2 · Fuego y trueno', 'Ch. 2 · Fire and thunder'],
  ['Cap. 3 · Tres hombres en una lata', 'Ch. 3 · Three men in a can'],
  ['Cap. 4 · Doce minutos', 'Ch. 4 · Twelve minutes'],
  ['Cap. 5 · Magnífica desolación', 'Ch. 5 · Magnificent desolation'],
  ['Cap. 6 · El lado silencioso', 'Ch. 6 · The silent side'],
  ['Cap. 7 · Volver a casa', 'Ch. 7 · Coming home'],
  ['Epílogo · Un gran salto', 'Epilogue · One giant leap'],
  ['No Canon · Polvo y fuego', 'Non-canon · Dust and fire'],
];
export const RARITY = {
  common: { label: ['Común', 'Common'], color: '#9aa3b2' },
  rare: { label: ['Rara', 'Rare'], color: '#4ea3ff' },
  epic: { label: ['Épica', 'Epic'], color: '#b07cff' },
  legendary: { label: ['Legendaria', 'Legendary'], color: '#ffc94a' },
  hidden: { label: ['Oculta', 'Hidden'], color: '#e6e6e6' },
};

const AFJ = 'Apollo 11 Flight Journal (NASA)', ALSJ = 'Apollo Lunar Surface Journal (NASA)', MR = 'Apollo 11 Mission Report (MSC-00171)', NH = 'NASA History Office';

export const CARDS = {
  // ---------- Prólogo ----------
  'tratado-1967': c(0, 'moment', 'common', ['Tratado del Espacio Ultraterrestre', 'Outer Space Treaty'], {
    date: '27 ene 1967',
    fact: ['Firmado en Washington, Londres y Moscú, prohíbe que cualquier nación reclame la Luna u otro cuerpo celeste y que se coloquen armas nucleares en órbita. Neil Armstrong asistió a la ceremonia en la Casa Blanca la misma noche del incendio del Apolo 1.',
      'Signed in Washington, London and Moscow, it forbids any nation from claiming the Moon or any other celestial body and bans nuclear weapons in orbit. Neil Armstrong attended the White House ceremony on the very night of the Apollo 1 fire.'],
    img: ['Ceremonia de firma en el Salón Este de la Casa Blanca, con el presidente Johnson y embajadores.', 'Signing ceremony in the White House East Room, with President Johnson and ambassadors.'],
    src: 'U.S. Department of State · Hansen, First Man' }),
  'apolo-1': c(0, 'moment', 'common', ['Apolo 1', 'Apollo 1'], {
    date: '27 ene 1967 · 23:31 UTC',
    fact: ['Durante una prueba en tierra en la plataforma 34, un incendio en la cabina, con atmósfera de oxígeno puro a presión, mató a Gus Grissom, Ed White y Roger Chaffee. La nave se rediseñó por completo: escotilla de apertura rápida, materiales no inflamables y una mezcla de oxígeno y nitrógeno en tierra.',
      'During a ground test on Pad 34, a fire in the pressurized pure-oxygen cabin killed Gus Grissom, Ed White and Roger Chaffee. The spacecraft was completely redesigned: a quick-opening hatch, non-flammable materials and an oxygen-nitrogen mix on the pad.'],
    img: ['Retrato oficial de la tripulación del Apolo 1 frente al simulador.', 'Official portrait of the Apollo 1 crew in front of the simulator.'],
    src: NH + ' · Apollo 204 Review Board' }),
  'duros-competentes': c(0, 'moment', 'common', ['«Duros y competentes»', '“Tough and competent”'], {
    date: '30 ene 1967',
    fact: ['El lunes siguiente al incendio, Gene Kranz, de 33 años, reunió a su equipo de Control de Vuelo. Les pidió escribir «Tough and Competent» en sus pizarras y no borrarlo nunca: duros, porque siempre serían responsables de lo que hicieran o dejaran de hacer; competentes, porque nunca darían nada por sentado.',
      'The Monday after the fire, 33-year-old Gene Kranz gathered his Flight Control team. He told them to write “Tough and Competent” on their blackboards and never erase it: tough, because they would always be accountable for what they did or failed to do; competent, because they would never take anything for granted.'],
    img: ['Gene Kranz en su consola del Control de Misión, Houston.', 'Gene Kranz at his console in Mission Control, Houston.'],
    src: 'Gene Kranz, Failure Is Not an Option (2000)' }),
  'foto-karen': c(0, 'object', 'rare', ['Una foto en la cartera', 'A photo in the wallet'], {
    date: '1959–1962',
    fact: ['Karen Anne Armstrong, la hija de Neil y Jan, murió en enero de 1962 a causa de un tumor cerebral. Tenía dos años. Neil casi nunca hablaba de ella. Este recuerdo es suyo y el juego no lo describe.',
      'Karen Anne Armstrong, Neil and Jan’s daughter, died in January 1962 of a brain tumor. She was two years old. Neil almost never spoke of her. This memory is his, and the game does not describe it.'],
    img: ['Recuerdo privado. Sin imagen.', 'Private memory. No image.'],
    src: 'James R. Hansen, First Man (2005)' }),
  'libreta-ed-white': c(0, 'object', 'rare', ['La libreta de Neil', 'Neil’s address book'], {
    date: '1964',
    fact: ['Los Armstrong y los White eran vecinos en El Lago, Texas. Cuando la casa de los Armstrong se incendió en 1964, Ed White saltó la cerca y ayudó a Neil a sacar a su familia y a apagar el fuego con una manguera de jardín.',
      'The Armstrongs and the Whites were neighbors in El Lago, Texas. When the Armstrong house caught fire in 1964, Ed White jumped the fence and helped Neil get his family out and fight the fire with a garden hose.'],
    img: ['Ed White durante la primera caminata espacial estadounidense (Gemini 4, 1965).', 'Ed White during the first American spacewalk (Gemini 4, 1965).'],
    src: 'James R. Hansen, First Man (2005)' }),
  'pizarra-kranz': c(0, 'object', 'rare', ['La pizarra de Kranz', 'Kranz’s blackboard'], {
    date: 'ene 1967',
    fact: ['Las pizarras de la sala de Control de Misión se usaban para notas de vuelo, cálculos y listas. Tras el discurso de Kranz, «Tough and Competent» quedó escrito en ellas como un recordatorio permanente de lo que había costado el Apolo 1.',
      'The blackboards in the Mission Control room held flight notes, calculations and lists. After Kranz’s speech, “Tough and Competent” stayed written on them as a permanent reminder of what Apollo 1 had cost.'],
    img: ['Sala de Control de Misión 2 (MOCR 2), Houston, a finales de los años sesenta.', 'Mission Operations Control Room 2 (MOCR 2), Houston, late 1960s.'],
    src: 'Gene Kranz, Failure Is Not an Option (2000)' }),

  // ---------- Cap. 1 ----------
  'la-despedida': c(1, 'moment', 'common', ['La despedida', 'The farewell'], {
    date: 'jul 1969',
    fact: ['Antes de entrar en cuarentena, la tripulación pasó sus últimos días con la familia. Jan Armstrong insistió en que Neil les explicara a sus hijos, Rick (12) y Mark (6), que existía la posibilidad de que no volviera.',
      'Before going into quarantine, the crew spent their last days with family. Jan Armstrong insisted that Neil explain to their sons, Rick (12) and Mark (6), that there was a chance he might not come back.'],
    img: ['Fotos de LIFE Magazine de la familia Armstrong en El Lago, julio de 1969.', 'LIFE Magazine photos of the Armstrong family in El Lago, July 1969.'],
    src: 'James R. Hansen, First Man (2005)' }),
  'decision-hijos': c(1, 'decision', 'epic', ['Lo que Neil les dijo', 'What Neil told them'], {
    date: 'jul 1969',
    fact: ['Según el relato de Jan Armstrong, Neil se sentó con los niños por insistencia de ella y les habló de los riesgos de la misión. En el juego, esa conversación decide cómo vivirá Rick el alunizaje y qué le dirá a su padre a través del vidrio de la cuarentena.',
      'According to Jan Armstrong, Neil sat down with the boys at her insistence and talked to them about the mission’s risks. In the game, that talk decides how Rick lives through the landing and what he says to his father through the quarantine glass.'],
    img: ['Neil Armstrong con sus hijos en casa, 1969.', 'Neil Armstrong with his sons at home, 1969.'],
    src: 'James R. Hansen, First Man (2005)' }),
  'primer-paso-quien': c(1, 'decision', 'common', ['¿Quién sale primero?', 'Who goes out first?'], {
    date: 'abr 1969',
    fact: ['En la primavera de 1969, Deke Slayton, Bob Gilruth, George Low y Chris Kraft decidieron que el comandante saldría primero. Pesaron dos razones prácticas: la escotilla del LM se abría hacia el lado de Armstrong y era difícil intercambiar posiciones con los trajes puestos.',
      'In spring 1969, Deke Slayton, Bob Gilruth, George Low and Chris Kraft decided the commander would go out first. Two practical reasons weighed in: the LM hatch opened on Armstrong’s side, and swapping places in bulky suits was hard.'],
    img: ['Armstrong y Aldrin ensayan la EVA en un simulador lunar, 1969.', 'Armstrong and Aldrin rehearse the EVA in a lunar simulator, 1969.'],
    src: 'James R. Hansen, First Man · Chris Kraft, Flight' }),
  'saturn-v': c(1, 'object', 'rare', ['Saturn V', 'Saturn V'], {
    date: '1967–1973',
    fact: ['Cohete de tres etapas de unos 110 m de altura y unas 2.900 toneladas al despegar. La primera etapa (S-IC) tenía cinco motores F-1; la segunda (S-II), cinco J-2; la tercera (S-IVB), un J-2 reencendible que envió al Apolo 11 hacia la Luna.',
      'A three-stage rocket about 110 m tall and some 2,900 tonnes at liftoff. The first stage (S-IC) had five F-1 engines; the second (S-II), five J-2s; the third (S-IVB), one restartable J-2 that sent Apollo 11 to the Moon.'],
    img: ['El Saturn V del Apolo 11 en la plataforma 39A al amanecer del 16 de julio.', 'Apollo 11’s Saturn V on Pad 39A at dawn on 16 July.'],
    src: 'NASA · Apollo by the Numbers (SP-2000-4029)' }),
  'parche-mision': c(1, 'object', 'rare', ['Emblema del Apolo 11', 'Apollo 11 emblem'], {
    date: '1969',
    fact: ['Michael Collins dibujó el águila que se posa sobre la Luna; la idea de la rama de olivo, símbolo de paz, fue del instructor Tom Wilson. La tripulación decidió no poner sus nombres para que el emblema representara a todos los que trabajaron en el Apolo.',
      'Michael Collins drew the eagle landing on the Moon; the olive branch, a symbol of peace, was instructor Tom Wilson’s idea. The crew chose to leave their names off so the emblem would stand for everyone who worked on Apollo.'],
    img: ['Parche oficial del Apolo 11: el águila con la rama de olivo y la Tierra al fondo.', 'Official Apollo 11 patch: the eagle with the olive branch and Earth behind.'],
    src: NH }),
  'sobres-firmados': c(1, 'object', 'rare', ['Sobres firmados', 'Signed covers'], {
    date: 'jun–jul 1969',
    fact: ['Ningún seguro de vida cubría a los astronautas a un precio razonable. Antes de la cuarentena firmaron cientos de sobres conmemorativos que un amigo hizo matasellar el día del lanzamiento: sus familias podrían venderlos si no regresaban.',
      'No life insurance would cover the astronauts at a reasonable price. Before quarantine they signed hundreds of commemorative covers that a friend had postmarked on launch day: their families could sell them if they did not return.'],
    img: ['Sobre del Apolo 11 con las tres firmas y el matasellos del 16 de julio de 1969.', 'Apollo 11 cover with the three signatures and a 16 July 1969 postmark.'],
    src: 'Smithsonian National Postal Museum' }),
  'deke-slayton': c(1, 'person', 'rare', ['Deke Slayton', 'Deke Slayton'], {
    date: '1924–1993',
    fact: ['Uno de los siete astronautas del Mercury, quedó en tierra por un problema cardíaco y pasó a dirigir la Oficina de Astronautas. Elegía las tripulaciones de cada misión. Volaría por fin en 1975, en el Apolo-Soyuz.',
      'One of the seven Mercury astronauts, he was grounded by a heart condition and went on to run the Astronaut Office. He picked the crew for every mission. He finally flew in 1975, on Apollo-Soyuz.'],
    img: ['Deke Slayton en el Centro de Naves Tripuladas, Houston.', 'Deke Slayton at the Manned Spacecraft Center, Houston.'],
    src: NH }),
  'fogata-playa': c(1, 'moment', 'epic', ['La conversación de la playa', 'The talk on the beach'], {
    date: 'jul 1969',
    fact: ['La rivalidad por el primer paso fue real, pero Armstrong y Aldrin nunca la resolvieron a gritos. En sus memorias, Collins describe una tripulación de «amables desconocidos»: profesionales que se respetaban más de lo que se confiaban.',
      'The rivalry over the first step was real, but Armstrong and Aldrin never settled it in a shouting match. In his memoir, Collins describes the crew as “amiable strangers”: professionals who respected each other more than they confided in each other.'],
    img: ['La playa de Cabo Kennedy al atardecer, con el Saturn V en el horizonte.', 'The Cape Kennedy beach at dusk, with the Saturn V on the horizon.'],
    src: 'Michael Collins, Carrying the Fire (1974)' }),

  // ---------- Cap. 2 ----------
  'despegue': c(2, 'moment', 'common', ['Despegue del Apolo 11', 'Apollo 11 liftoff'], {
    date: '16 jul 1969 · 13:32:00 UTC',
    fact: ['A las 9:32 hora de Florida, los cinco motores F-1 levantaron el Saturn V de la plataforma 39A. Jack King, la voz del control de lanzamiento, contó: «…cero, todos los motores en marcha. Despegue». Cerca de un millón de personas lo vieron desde las playas y carreteras.',
      'At 9:32 a.m. Florida time, five F-1 engines lifted the Saturn V off Pad 39A. Jack King, the launch control voice, counted: “…zero, all engines running. Liftoff.” About a million people watched from the beaches and roads.'],
    img: ['S69-39961: el Saturn V del Apolo 11 dejando la torre.', 'S69-39961: Apollo 11’s Saturn V clearing the tower.'],
    src: AFJ }),
  'orbita-estacionamiento': c(2, 'science', 'common', ['Órbita de estacionamiento', 'Parking orbit'], {
    date: '16 jul 1969 · 13:43 UTC',
    fact: ['Unos 12 minutos después del despegue, el Apolo 11 quedó en una órbita de unos 185 km de altura. Dio vuelta y media a la Tierra mientras la tripulación y Houston comprobaban todos los sistemas antes de partir hacia la Luna.',
      'About 12 minutes after liftoff, Apollo 11 settled into an orbit about 185 km high. It circled the Earth one and a half times while the crew and Houston checked every system before heading for the Moon.'],
    img: ['La Tierra vista desde la órbita de estacionamiento por la ventana del CM.', 'Earth seen from parking orbit through the CM window.'],
    src: MR }),
  'tli': c(2, 'science', 'common', ['Inyección translunar', 'Translunar injection'], {
    date: '16 jul 1969 · 16:22 UTC',
    fact: ['Con el GO de Houston, la tercera etapa S-IVB se reencendió durante 5 minutos y 47 segundos y llevó la nave a unos 39.000 km/h. La trayectoria era de «retorno libre»: si el motor principal fallaba, la gravedad de la Luna los devolvería a la Tierra.',
      'With Houston’s GO, the S-IVB third stage reignited for 5 minutes 47 seconds and pushed the spacecraft to about 39,000 km/h. The path was a “free return”: had the main engine failed, the Moon’s gravity would have swung them back to Earth.'],
    img: ['La Tierra encogiéndose por la ventana tras la TLI.', 'Earth shrinking in the window after TLI.'],
    src: AFJ }),
  'acoplamiento': c(2, 'moment', 'common', ['Transposición y acople', 'Transposition and docking'], {
    date: '16 jul 1969 · ~16:56 UTC',
    fact: ['Collins separó Columbia de la tercera etapa, giró 180° y acopló la sonda en el cono de Eagle, que esperaba dentro del adaptador. Luego extrajo el módulo lunar. Lo hizo despacio y gastando poco combustible de maniobra: lo había ensayado cientos de veces.',
      'Collins separated Columbia from the third stage, turned 180° and docked the probe into Eagle’s drogue, waiting inside the adapter. Then he pulled the lunar module free. He did it slowly and with little maneuvering fuel: he had rehearsed it hundreds of times.'],
    img: ['AS11-36-5293: el LM Eagle dentro del adaptador de la S-IVB, visto desde Columbia.', 'AS11-36-5293: LM Eagle inside the S-IVB adapter, seen from Columbia.'],
    src: AFJ }),
  'checklist-muslo': c(2, 'object', 'rare', ['La checklist del muslo', 'The cuff checklist'], {
    date: '1969',
    fact: ['Los procedimientos críticos iban impresos en pequeñas libretas sujetas al traje o al panel. Cada paso del lanzamiento estaba ensayado y numerado: en el Apolo nada se improvisaba si se podía escribir antes.',
      'Critical procedures were printed in small booklets strapped to the suit or panel. Every launch step was rehearsed and numbered: on Apollo nothing was improvised if it could be written down beforehand.'],
    img: ['Checklist de vuelo del Apolo 11 conservada en el Smithsonian.', 'Apollo 11 flight checklist preserved at the Smithsonian.'],
    src: 'Smithsonian National Air and Space Museum' }),
  'bruce-mccandless': c(2, 'person', 'rare', ['Bruce McCandless, CAPCOM', 'Bruce McCandless, CAPCOM'], {
    date: '16 jul 1969',
    fact: ['El CAPCOM, el único que hablaba por radio con la tripulación, era siempre un astronauta. El día del lanzamiento fue Bruce McCandless quien dio el GO para la TLI. En 1984 haría el primer paseo espacial sin amarras.',
      'The CAPCOM, the only person who spoke to the crew on the radio, was always an astronaut. On launch day it was Bruce McCandless who gave the GO for TLI. In 1984 he would make the first untethered spacewalk.'],
    img: ['McCandless en la consola del CAPCOM, Houston.', 'McCandless at the CAPCOM console, Houston.'],
    src: AFJ }),

  // ---------- Cap. 3 ----------
  'modo-barbacoa': c(3, 'science', 'common', ['Modo barbacoa', 'Barbecue mode'], {
    date: '16–19 jul 1969',
    fact: ['Durante la travesía la nave giraba lentamente, unas tres vueltas por hora, para repartir el calor del Sol. Sin ese giro, un lado se recalentaba y el otro se congelaba. Por la ventana pasaban, alternadas, la Tierra y la Luna.',
      'During the coast the spacecraft rolled slowly, about three turns an hour, to spread the Sun’s heat. Without that roll, one side would overheat and the other freeze. Earth and Moon took turns drifting past the window.'],
    img: ['La Tierra a mitad de camino, fotografiada por la tripulación.', 'Earth from halfway, photographed by the crew.'],
    src: AFJ }),
  'loi': c(3, 'moment', 'common', ['Inserción en órbita lunar', 'Lunar orbit insertion'], {
    date: '19 jul 1969 · 17:21:50 UTC',
    fact: ['Detrás de la Luna, sin contacto con la Tierra, el motor principal frenó la nave durante 357,5 segundos y la dejó en una órbita de 113 × 315 km. Unas cuatro horas después, una segunda maniobra la ajustó a unos 100 × 122 km.',
      'Behind the Moon, out of contact with Earth, the main engine braked the spacecraft for 357.5 seconds into a 113 × 315 km orbit. About four hours later a second burn trimmed it to roughly 100 × 122 km.'],
    img: ['La cara oculta de la Luna desde Columbia.', 'The lunar far side from Columbia.'],
    src: AFJ }),
  'sextante': c(3, 'object', 'rare', ['Navegar con estrellas', 'Navigating by the stars'], {
    date: '1969',
    fact: ['Con el sextante y el telescopio del módulo de mando, el navegante medía el ángulo entre estrellas y el horizonte de la Tierra o la Luna. Esos datos corregían la plataforma inercial, como hacían los marinos hace siglos.',
      'With the command module’s sextant and telescope, the navigator measured angles between stars and the Earth’s or Moon’s horizon. Those readings corrected the inertial platform, as sailors had done for centuries.'],
    img: ['El sextante de navegación del módulo de mando Columbia.', 'The command module Columbia’s navigation sextant.'],
    src: 'Smithsonian National Air and Space Museum' }),
  'agc-dsky': c(3, 'object', 'rare', ['La computadora de guiado Apolo', 'The Apollo Guidance Computer'], {
    date: '1966–1975',
    fact: ['Tenía unos 4 KB de memoria de trabajo y 72 KB de memoria fija, tejida a mano en hilo de cobre. Se le hablaba con «Verbo» y «Sustantivo» desde el teclado DSKY. Su software lo escribió el MIT bajo la dirección de Margaret Hamilton.',
      'It had about 4 KB of working memory and 72 KB of fixed memory, woven by hand from copper wire. You spoke to it with “Verb” and “Noun” on the DSKY keypad. Its software was written at MIT under Margaret Hamilton.'],
    img: ['Teclado DSKY de un módulo Apolo.', 'An Apollo DSKY keypad.'],
    src: 'MIT Instrumentation Laboratory · ' + NH }),
  'comida-espacial': c(3, 'object', 'rare', ['Comida espacial', 'Space food'], {
    date: '1969',
    fact: ['La mayor parte de la comida iba deshidratada en bolsas que se rehidrataban con una pistola de agua. Había bocados en cubos, café, cóctel de camarones y estofados. Los astronautas comían flotando y con cuidado: una miga suelta podía meterse en un filtro.',
      'Most of the food was dehydrated in bags rehydrated with a water gun. There were bite-size cubes, coffee, shrimp cocktail and stews. The astronauts ate floating and carefully: a loose crumb could end up in a filter.'],
    img: ['Bolsas de comida del Apolo 11 en la colección del Smithsonian.', 'Apollo 11 food packets in the Smithsonian collection.'],
    src: 'Smithsonian National Air and Space Museum' }),
  'marion-moon': c(3, 'person', 'epic', ['Marion Moon', 'Marion Moon'], {
    date: '1903–1968',
    fact: ['La madre de Buzz Aldrin se llamaba Marion Moon antes de casarse. Murió en mayo de 1968, poco más de un año antes de que su hijo pisara la Luna. Aldrin lo contó muchas veces como una coincidencia que nunca dejó de sorprenderle.',
      'Buzz Aldrin’s mother was named Marion Moon before she married. She died in May 1968, a little over a year before her son walked on the Moon. Aldrin often told it as a coincidence that never stopped amazing him.'],
    img: ['Buzz Aldrin de niño con su familia en Montclair, Nueva Jersey.', 'Young Buzz Aldrin with his family in Montclair, New Jersey.'],
    src: 'Buzz Aldrin, Magnificent Desolation (2009)' }),
  'karen': c(3, 'person', 'legendary', ['Karen', 'Karen'], {
    date: '13 abr 1959 – 28 ene 1962',
    fact: ['En julio de 1969, Karen Armstrong habría cumplido diez años. Su biógrafo sugiere que Neil pudo llevar a la Luna un recuerdo de ella en su bolsa personal, aunque él nunca lo confirmó. En el juego, es la única vez que Neil dice su nombre.',
      'In July 1969 Karen Armstrong would have been ten. His biographer suggests Neil may have carried a keepsake of hers to the Moon in his personal kit, though he never confirmed it. In the game, it is the only time Neil says her name.'],
    img: ['Recuerdo privado. Sin imagen.', 'Private memory. No image.'],
    src: 'James R. Hansen, First Man (2005)' }),
  'eagle-lm5': c(3, 'object', 'rare', ['Módulo Lunar Eagle (LM-5)', 'Lunar Module Eagle (LM-5)'], {
    date: '1969',
    fact: ['Construido por Grumman, tenía dos etapas: la de descenso, con su motor regulable, las patas y los experimentos, se quedaba en la Luna como plataforma; la de ascenso devolvía a los astronautas a la órbita. Algunas paredes eran tan finas como varias capas de papel de aluminio.',
      'Built by Grumman, it had two stages: the descent stage, with its throttleable engine, legs and experiments, stayed on the Moon as a launch pad; the ascent stage carried the astronauts back to orbit. Some walls were as thin as a few layers of aluminum foil.'],
    img: ['AS11-44-6581: Eagle en órbita lunar, fotografiado desde Columbia.', 'AS11-44-6581: Eagle in lunar orbit, photographed from Columbia.'],
    src: 'Grumman · ' + NH }),

  // ---------- Cap. 4 ----------
  'eagle-alas': c(4, 'moment', 'common', ['«El Águila tiene alas»', '“The Eagle has wings”'], {
    date: '20 jul 1969 · 17:44 UTC',
    fact: ['Unos 25 minutos antes de la separación, Collins les dijo: «You cats take it easy on the lunar surface». Tras el desacople, Armstrong informó: «The Eagle has wings». Collins se quedó solo en Columbia, a unos 110 km de altura.',
      'About 25 minutes before separation, Collins told them: “You cats take it easy on the lunar surface.” After undocking, Armstrong reported: “The Eagle has wings.” Collins stayed alone in Columbia, about 110 km up.'],
    img: ['AS11-44-6574: Eagle con las patas desplegadas tras separarse.', 'AS11-44-6574: Eagle with legs deployed after separating.'],
    src: AFJ }),
  'alarmas-1202': c(4, 'science', 'common', ['Las alarmas 1201/1202', 'The 1201/1202 alarms'], {
    date: '20 jul 1969 · 20:10 UTC',
    fact: ['El radar de encuentro estaba encendido y su alimentación quedó desfasada respecto de la de la computadora: los datos espurios le robaban entre el 13 y el 15 % del tiempo de cálculo. El software del MIT priorizaba las tareas críticas y descartaba el resto, así que el guiado nunca se perdió.',
      'The rendezvous radar was switched on and its power supply was out of phase with the computer’s: the spurious counts stole 13 to 15 % of its computing time. The MIT software prioritized critical tasks and shed the rest, so guidance was never lost.'],
    img: ['Pantalla del DSKY con el código de alarma de programa.', 'DSKY display showing the program alarm code.'],
    src: ALSJ }),
  'go-aterrizar': c(4, 'moment', 'common', ['GO para aterrizar', 'GO for landing'], {
    date: '20 jul 1969 · ~20:14 UTC',
    fact: ['Gene Kranz recorrió una a una las consolas: RETRO, FIDO, GUIDANCE, CONTROL, TELCOM, GNC, EECOM, SURGEON. Todas respondieron GO. Charlie Duke transmitió: «Eagle, Houston. You’re GO for landing». Aldrin contestó: «Roger. Understand. GO for landing. 3000 feet».',
      'Gene Kranz polled each console in turn: RETRO, FIDO, GUIDANCE, CONTROL, TELCOM, GNC, EECOM, SURGEON. All answered GO. Charlie Duke relayed: “Eagle, Houston. You’re GO for landing.” Aldrin replied: “Roger. Understand. GO for landing. 3000 feet.”'],
    img: ['El Control de Misión durante el descenso del Apolo 11.', 'Mission Control during Apollo 11’s descent.'],
    src: ALSJ }),
  'eagle-aterrizo': c(4, 'moment', 'common', ['«El Águila ha aterrizado»', '“The Eagle has landed”'], {
    date: '20 jul 1969 · 20:17:40 UTC',
    fact: ['Eagle se posó en el Mar de la Tranquilidad, unos 6 km más allá del punto previsto. Análisis posteriores estimaron que quedaban unos 45 segundos de combustible utilizable. «Houston, Tranquility Base here. The Eagle has landed».',
      'Eagle touched down in the Sea of Tranquility, about 6 km past the planned point. Later analysis estimated some 45 seconds of usable fuel remained. “Houston, Tranquility Base here. The Eagle has landed.”'],
    img: ['AS11-40-5931: Eagle posado en la Base Tranquilidad.', 'AS11-40-5931: Eagle at rest at Tranquility Base.'],
    src: ALSJ + ' · ' + MR }),
  'hoja-garman': c(4, 'object', 'rare', ['La hoja de Jack Garman', 'Jack Garman’s cheat sheet'], {
    date: 'jul 1969',
    fact: ['Jack Garman, ingeniero de software de 24 años, había anotado a mano qué alarmas de la computadora eran graves y cuáles no. Cuando sonó la 1202, le dijo a Steve Bales que, mientras no se repitiera sin parar, era GO. Esa hoja salvó el alunizaje.',
      'Jack Garman, a 24-year-old software engineer, had handwritten which computer alarms were serious and which were not. When the 1202 rang, he told Steve Bales that, as long as it did not recur continuously, it was GO. That sheet saved the landing.'],
    img: ['Nota manuscrita de alarmas del AGC en la sala de apoyo.', 'Handwritten AGC alarm notes from the back room.'],
    src: ALSJ }),
  'chaleco-kranz': c(4, 'object', 'rare', ['El chaleco blanco', 'The white vest'], {
    date: '20 jul 1969',
    fact: ['Marta Kranz cosía un chaleco nuevo a su marido para cada misión que él dirigía. El del alunizaje era blanco, el color de su «Equipo Blanco». Hoy se conserva en el Smithsonian.',
      'Marta Kranz sewed her husband a new vest for every mission he led. The one for the landing was white, the color of his “White Team.” It is now kept at the Smithsonian.'],
    img: ['El chaleco del Apolo 11 de Gene Kranz, Smithsonian.', 'Gene Kranz’s Apollo 11 vest, Smithsonian.'],
    src: 'Smithsonian National Air and Space Museum' }),
  'squawk-box': c(4, 'object', 'rare', ['La squawk box de Jan', 'Jan’s squawk box'], {
    date: '20 jul 1969',
    fact: ['La NASA instaló altavoces en las casas de las familias para que escucharan el audio de la misión en directo. Jan Armstrong siguió el descenso con un cuaderno en la mano, anotando cada llamada de Houston.',
      'NASA installed speakers in the families’ homes so they could hear the mission audio live. Jan Armstrong followed the descent with a notebook in hand, writing down every call from Houston.'],
    img: ['La familia Armstrong escuchando el alunizaje en El Lago (LIFE).', 'The Armstrong family listening to the landing in El Lago (LIFE).'],
    src: 'LIFE Magazine · Hansen, First Man' }),
  'west-crater': c(4, 'place', 'rare', ['West Crater', 'West Crater'], {
    date: '20 jul 1969',
    fact: ['La computadora llevaba a Eagle hacia un cráter de unos 180 m rodeado de rocas del tamaño de autos. Armstrong tomó el control semimanual, lo sobrevoló y aterrizó unos 400 m al oeste, en terreno llano.',
      'The computer was steering Eagle toward a crater about 180 m wide ringed with car-sized boulders. Armstrong took semi-manual control, flew over it and landed about 400 m west on level ground.'],
    img: ['Mapa del Lunar Reconnaissance Orbiter de la Base Tranquilidad y West Crater.', 'Lunar Reconnaissance Orbiter map of Tranquility Base and West Crater.'],
    src: ALSJ + ' · LRO' }),
  'steve-bales': c(4, 'person', 'epic', ['Steve Bales, 26 años', 'Steve Bales, age 26'], {
    date: '20 jul 1969 · 20:10 UTC',
    fact: ['Oficial de Guiado (GUIDO) con 26 años, tuvo segundos para decidir si la alarma 1202 obligaba a abortar. Con el apoyo de Jack Garman respondió «We’re GO on that alarm». En 1969 recibió la Medalla Presidencial de la Libertad en nombre del equipo de operaciones.',
      'A 26-year-old Guidance Officer (GUIDO), he had seconds to decide whether the 1202 alarm meant an abort. Backed by Jack Garman he answered “We’re GO on that alarm.” In 1969 he received the Presidential Medal of Freedom on behalf of the operations team.'],
    img: ['Steve Bales en su consola del Control de Misión.', 'Steve Bales at his Mission Control console.'],
    src: ALSJ + ' · ' + NH }),

  // ---------- Cap. 5 ----------
  'primer-paso': c(5, 'moment', 'common', ['Un pequeño paso', 'One small step'], {
    date: '21 jul 1969 · 02:56:15 UTC',
    fact: ['Armstrong bajó la escalerilla, puso el pie izquierdo en la superficie y dijo: «That’s one small step for man, one giant leap for mankind». Él sostuvo que dijo «a man», aunque la «a» no se oye. Entre 600 y 650 millones de personas lo vieron en directo.',
      'Armstrong climbed down the ladder, set his left foot on the surface and said: “That’s one small step for man, one giant leap for mankind.” He maintained he said “a man,” though the “a” is not heard. Some 600 to 650 million people watched live.'],
    img: ['Imagen de la televisión en blanco y negro del primer paso.', 'Black-and-white TV frame of the first step.'],
    src: ALSJ }),
  'magnifica-desolacion': c(5, 'moment', 'common', ['Magnífica desolación', 'Magnificent desolation'], {
    date: '21 jul 1969 · ~03:15 UTC',
    fact: ['Al bajar, Aldrin miró alrededor: «Beautiful view». Armstrong: «Isn’t that something? Magnificent sight out here». Aldrin respondió con dos palabras que se volvieron el título de sus memorias: «Magnificent desolation».',
      'Coming down, Aldrin looked around: “Beautiful view.” Armstrong: “Isn’t that something? Magnificent sight out here.” Aldrin answered with two words that became the title of his memoir: “Magnificent desolation.”'],
    img: ['AS11-40-5903: retrato de Aldrin con Armstrong reflejado en el visor.', 'AS11-40-5903: portrait of Aldrin with Armstrong reflected in his visor.'],
    src: ALSJ }),
  'llamada-nixon': c(5, 'moment', 'common', ['La llamada del Despacho Oval', 'The Oval Office call'], {
    date: '21 jul 1969 · ~03:48 UTC',
    fact: ['El presidente Richard Nixon habló con ellos «por teléfono» desde la Casa Blanca, en la llamada de mayor distancia de la historia. «Por un momento invaluable en toda la historia del hombre, todas las personas de esta Tierra son verdaderamente una».',
      'President Richard Nixon spoke to them “by telephone” from the White House, in the longest-distance call in history. “For one priceless moment in the whole history of man, all the people on this Earth are truly one.”'],
    img: ['Nixon al teléfono en el Despacho Oval mirando la transmisión.', 'Nixon on the phone in the Oval Office watching the broadcast.'],
    src: ALSJ }),
  'huella': c(5, 'science', 'rare', ['El regolito lunar', 'Lunar regolith'], {
    date: '21 jul 1969',
    fact: ['El suelo lunar es un polvo fino y abrasivo formado por miles de millones de años de impactos. Sin viento ni agua que lo erosionen, una huella puede durar millones de años. Armstrong lo describió como «carbón en polvo».',
      'Lunar soil is a fine, abrasive dust formed by billions of years of impacts. With no wind or water to erode it, a footprint can last millions of years. Armstrong described it as “powdered charcoal.”'],
    img: ['AS11-40-5878: la huella de la bota de Aldrin en el regolito.', 'AS11-40-5878: Aldrin’s bootprint in the regolith.'],
    src: ALSJ }),
  'placa': c(5, 'object', 'rare', ['La placa de Eagle', 'Eagle’s plaque'], {
    date: '21 jul 1969',
    fact: ['Fijada a una pata de la etapa de descenso, dice: «Aquí hombres del planeta Tierra pusieron por primera vez el pie sobre la Luna. Julio de 1969 d. C. Vinimos en paz en nombre de toda la humanidad». Armstrong la leyó en voz alta. Sigue allí.',
      'Fixed to a leg of the descent stage, it reads: “Here men from the planet Earth first set foot upon the Moon. July 1969 A.D. We came in peace for all mankind.” Armstrong read it aloud. It is still there.'],
    img: ['AS11-40-5899: la placa en la pata delantera de Eagle.', 'AS11-40-5899: the plaque on Eagle’s forward leg.'],
    src: ALSJ }),
  'bandera': c(5, 'object', 'rare', ['La bandera', 'The flag'], {
    date: '21 jul 1969 · ~03:40 UTC',
    fact: ['Bajo unos centímetros de polvo el suelo era muy duro y el mástil apenas entró. Una varilla horizontal mantenía la tela extendida; como no se desplegó del todo, quedó con ondas que parecían viento. El chorro del motor la derribó en el despegue.',
      'Under a few centimeters of dust the ground was very hard and the pole barely went in. A horizontal rod held the cloth out; because it did not fully extend, it kept ripples that looked like wind. The engine blast knocked it over at liftoff.'],
    img: ['AS11-40-5875: Aldrin saluda a la bandera.', 'AS11-40-5875: Aldrin salutes the flag.'],
    src: ALSJ }),
  'sismometro': c(5, 'science', 'rare', ['Sismómetro pasivo (EASEP)', 'Passive seismometer (EASEP)'], {
    date: '21 jul 1969',
    fact: ['El Paquete Experimental Científico Temprano (EASEP) incluía un sismómetro alimentado por paneles solares. Registró «lunamotos» e impactos, entre ellos los pasos de los astronautas, y funcionó tres semanas.',
      'The Early Apollo Scientific Experiments Package (EASEP) included a solar-powered seismometer. It recorded “moonquakes” and impacts, including the astronauts’ own footsteps, and worked for three weeks.'],
    img: ['AS11-40-5948: Aldrin despliega el sismómetro pasivo.', 'AS11-40-5948: Aldrin deploying the passive seismometer.'],
    src: ALSJ }),
  'retrorreflector': c(5, 'science', 'rare', ['Retrorreflector láser', 'Laser retroreflector'], {
    date: '21 jul 1969',
    fact: ['Un panel de 100 prismas de sílice que devuelve la luz en la misma dirección de la que llega. Los observatorios aún le disparan láseres y miden el eco: así se sabe que la Luna se aleja unos 3,8 cm por año.',
      'A panel of 100 fused-silica prisms that sends light straight back the way it came. Observatories still fire lasers at it and time the echo: that is how we know the Moon drifts away about 3.8 cm a year.'],
    img: ['AS11-40-5952: el retrorreflector en la Base Tranquilidad.', 'AS11-40-5952: the retroreflector at Tranquility Base.'],
    src: ALSJ + ' · Lunar Laser Ranging' }),
  'lamina-solar': c(5, 'science', 'rare', ['Lámina de viento solar', 'Solar wind foil'], {
    date: '21 jul 1969',
    fact: ['Una cortina de aluminio en un mástil, diseñada en Suiza, atrapó partículas del viento solar durante 77 minutos. Se recogió y se analizó en la Tierra: fue el único experimento no estadounidense del Apolo 11.',
      'An aluminum curtain on a pole, designed in Switzerland, trapped solar wind particles for 77 minutes. It was rolled up and analyzed on Earth: the only non-American experiment on Apollo 11.'],
    img: ['AS11-40-5873: la lámina de viento solar junto a Eagle.', 'AS11-40-5873: the solar wind foil beside Eagle.'],
    src: ALSJ + ' · Universidad de Berna' }),
  'hasselblad': c(5, 'object', 'rare', ['La Hasselblad', 'The Hasselblad'], {
    date: '21 jul 1969',
    fact: ['La cámara Hasselblad iba casi siempre en el pecho de Armstrong. Por eso casi todas las fotos de un astronauta en la superficie son de Aldrin; de Armstrong apenas hay unas pocas. Las cámaras se quedaron en la Luna; solo volvieron los carretes.',
      'The Hasselblad camera rode on Armstrong’s chest most of the time. That is why nearly every photo of an astronaut on the surface shows Aldrin; there are only a handful of Armstrong. The cameras stayed on the Moon; only the film came back.'],
    img: ['AS11-40-5886: Armstrong junto a Eagle, una de sus pocas fotos en la Luna.', 'AS11-40-5886: Armstrong beside Eagle, one of his few photos on the Moon.'],
    src: ALSJ }),
  'paquete-recuerdos': c(5, 'object', 'epic', ['El paquete de recuerdos', 'The memorial packet'], {
    date: '21 jul 1969 · ~05:00 UTC',
    fact: ['Al final de la caminata, Armstrong le recordó a Aldrin: «¿Qué tal ese paquete de tu manga?». Aldrin lo dejó junto a la escalerilla: un parche del Apolo 1, medallas de Gagarin y Komarov, un disco de silicio con mensajes de 73 países y una rama de olivo dorada.',
      'At the end of the walk, Armstrong reminded Aldrin: “How about that package out of your sleeve?” Aldrin left it by the ladder: an Apollo 1 patch, Gagarin and Komarov medals, a silicon disc with messages from 73 nations and a golden olive branch.'],
    img: ['El disco de silicio del Apolo 11 (copia de respaldo en el Smithsonian).', 'The Apollo 11 silicon disc (backup copy at the Smithsonian).'],
    src: ALSJ }),
  'hermanos-armas': c(5, 'decision', 'epic', ['Hermanos de armas', 'Brothers in arms'], {
    date: '21 jul 1969',
    fact: ['Armstrong y Aldrin pasaron 2 horas y 31 minutos fuera de Eagle. Trabajaron con un plan minuto a minuto y apenas se detuvieron. Este momento a solas es dramatizado: el juego imagina la pausa que la agenda real casi no les dio.',
      'Armstrong and Aldrin spent 2 hours 31 minutes outside Eagle. They worked to a minute-by-minute plan and barely stopped. This moment alone is dramatized: the game imagines the pause the real timeline hardly gave them.'],
    img: ['AS11-40-5903 y la Tierra sobre el horizonte lunar.', 'AS11-40-5903 and Earth above the lunar horizon.'],
    src: ALSJ }),

  // ---------- Cap. 6 ----------
  'collins-solo': c(6, 'moment', 'common', ['Uno más, solo Dios sabe qué', 'One plus God knows what'], {
    date: '20–21 jul 1969',
    fact: ['Mientras sus compañeros caminaban, Collins orbitaba solo. Cada vuelta pasaba unos 48 minutos sin radio detrás de la Luna. Escribió que, en el recuento, serían «tres mil millones más dos» de un lado «y uno más, solo Dios sabe qué» del otro.',
      'While his crewmates walked, Collins orbited alone. Each pass he spent about 48 minutes without radio behind the Moon. He wrote that the count would be “three billion plus two” on one side “and one plus God knows what” on the other.'],
    img: ['AS11-44-6642: la Luna desde Columbia en órbita.', 'AS11-44-6642: the Moon from Columbia in orbit.'],
    src: 'Michael Collins, Carrying the Fire (1974)' }),
  'libreta-collins': c(6, 'object', 'rare', ['La libreta de Collins', 'Collins’s notebook'], {
    date: '21 jul 1969',
    fact: ['En sus memorias, Collins confesó: «Mi miedo secreto de los últimos seis meses ha sido dejarlos en la Luna y volver solo a la Tierra». Si Eagle no despegaba, no había nada que él pudiera hacer.',
      'In his memoir Collins confessed: “My secret terror for the last six months has been leaving them on the Moon and returning to Earth alone.” If Eagle failed to lift off, there was nothing he could do.'],
    img: ['Página del plan de vuelo de Columbia con notas a mano.', 'A page of Columbia’s flight plan with handwritten notes.'],
    src: 'Michael Collins, Carrying the Fire (1974)' }),
  'ventana-trasera': c(6, 'science', 'rare', ['Por qué detrás de la Luna no hay radio', 'Why there is no radio behind the Moon'], {
    date: '1969',
    fact: ['La radio viaja en línea recta, y la Luna es una roca de 3.474 km de diámetro que se interpone entre la nave y la Tierra. En la cara oculta no había satélites repetidores: cada vuelta traía casi una hora de silencio absoluto.',
      'Radio travels in straight lines, and the Moon is a 3,474 km rock standing between the spacecraft and Earth. There were no relay satellites over the far side: each orbit brought nearly an hour of total silence.'],
    img: ['Un cielo cubierto de estrellas visto desde la cara oculta.', 'A star-crowded sky seen from the far side.'],
    src: AFJ }),
  'rotulador-aldrin': c(6, 'object', 'epic', ['El rotulador de Aldrin', 'Aldrin’s felt-tip pen'], {
    date: '21 jul 1969',
    fact: ['Al volver a Eagle, una mochila rompió el disyuntor que armaba el motor de ascenso. Aldrin no quiso tocarlo con el dedo ni con nada metálico y lo empujó con la punta de un rotulador de fieltro. Funcionó.',
      'Back inside Eagle, a backpack had snapped off the circuit breaker that armed the ascent engine. Aldrin did not want to touch it with a finger or anything metal, so he pushed it in with the tip of a felt-tip pen. It worked.'],
    img: ['El panel de disyuntores del LM.', 'The LM circuit breaker panel.'],
    src: ALSJ + ' · Aldrin, Magnificent Desolation' }),
  'motor-ascenso': c(6, 'science', 'rare', ['El motor de ascenso', 'The ascent engine'], {
    date: '1969',
    fact: ['Usaba propelentes hipergólicos, que se encienden solos al tocarse: sin chispas ni bujías. Era muy simple a propósito, porque no tenía respaldo. Si no encendía, no había otra manera de salir de la Luna.',
      'It used hypergolic propellants, which ignite on contact: no spark, no igniter. It was kept deliberately simple because there was no backup. If it failed to fire, there was no other way off the Moon.'],
    img: ['Motor de ascenso del LM en el banco de pruebas de Bell Aerosystems.', 'LM ascent engine on the Bell Aerosystems test stand.'],
    src: NH }),
  'despegue-lunar': c(6, 'moment', 'common', ['Despegue de la Luna', 'Lunar liftoff'], {
    date: '21 jul 1969 · 17:54 UTC',
    fact: ['Tras 21 horas y 36 minutos en la superficie, Aldrin contó: «9, 8, 7, 6, 5, separación de aborto, motor armado, ascenso, proceder». La etapa de ascenso se elevó y la de descenso quedó como plataforma. Por la ventana, Aldrin vio caer la bandera.',
      'After 21 hours 36 minutes on the surface, Aldrin counted: “9, 8, 7, 6, 5, abort stage, engine arm, ascent, proceed.” The ascent stage rose and the descent stage stayed behind as a pad. Through the window, Aldrin saw the flag fall.'],
    img: ['Fotograma de la cámara de 16 mm durante el despegue de Eagle.', 'A 16 mm camera frame during Eagle’s liftoff.'],
    src: ALSJ }),
  'reencuentro': c(6, 'moment', 'common', ['El reencuentro', 'The reunion'], {
    date: '21 jul 1969 · 21:35 UTC',
    fact: ['Collins acopló Columbia con la etapa de ascenso de Eagle. Al abrirse la escotilla llegó el olor del polvo lunar, que los astronautas compararon con pólvora quemada. Collins escribió que tuvo ganas de abrazarlos.',
      'Collins docked Columbia with Eagle’s ascent stage. When the hatch opened, the smell of lunar dust drifted in; the astronauts compared it to spent gunpowder. Collins wrote that he wanted to hug them.'],
    img: ['AS11-44-6642: la etapa de ascenso de Eagle sobre la Tierra.', 'AS11-44-6642: Eagle’s ascent stage above the Earth.'],
    src: AFJ + ' · Collins, Carrying the Fire' }),
  'discurso-safire': c(6, 'object', 'legendary', ['En caso de desastre lunar', 'In Event of Moon Disaster'], {
    date: '18 jul 1969',
    fact: ['El redactor William Safire escribió un discurso por si los astronautas quedaban varados en la Luna: «El destino ha querido que los hombres que fueron a la Luna a explorar en paz se queden en la Luna para descansar en paz». Nunca tuvo que leerse.',
      'Speechwriter William Safire wrote an address in case the astronauts were stranded on the Moon: “Fate has ordained that the men who went to the Moon to explore in peace will stay on the Moon to rest in peace.” It never had to be read.'],
    img: ['El memorándum mecanografiado de Safire, Archivos Nacionales.', 'Safire’s typed memo, National Archives.'],
    src: 'U.S. National Archives' }),

  // ---------- Cap. 7 ----------
  'tei': c(7, 'moment', 'common', ['Rumbo a casa (TEI)', 'Homeward bound (TEI)'], {
    date: '22 jul 1969 · 04:55 UTC',
    fact: ['Detrás de la Luna, otra vez sin radio, el motor principal se encendió dos minutos y medio para romper la órbita lunar. Cuando reaparecieron, Charlie Duke preguntó cómo había ido y Collins respondió: «Time to open up the LRL doors, Charlie».',
      'Behind the Moon, again without radio, the main engine fired for two and a half minutes to break lunar orbit. When they reappeared, Charlie Duke asked how it went and Collins replied: “Time to open up the LRL doors, Charlie.”'],
    img: ['La Luna alejándose por la ventana de Columbia.', 'The Moon receding in Columbia’s window.'],
    src: AFJ }),
  'laika': c(7, 'person', 'legendary', ['Laika', 'Laika'], {
    date: '3 nov 1957',
    fact: ['Una perra callejera de Moscú, viajó en el Sputnik 2 y fue el primer animal en orbitar la Tierra. Murió pocas horas después del lanzamiento por el sobrecalentamiento de la cápsula: la misión no estaba diseñada para su regreso. El perrito de tela de Collins es una licencia del juego.',
      'A stray from the streets of Moscow, she flew on Sputnik 2 and was the first animal to orbit the Earth. She died a few hours after launch when the capsule overheated: the mission was never designed to bring her back. Collins’s toy dog is a game invention.'],
    img: ['Laika en su cápsula de entrenamiento, 1957.', 'Laika in her training capsule, 1957.'],
    src: 'NASA History · Smithsonian' }),
  'belka-strelka': c(7, 'person', 'epic', ['Belka y Strelka', 'Belka and Strelka'], {
    date: '19–20 ago 1960',
    fact: ['A bordo del Sputnik 5, junto a un conejo, ratones y plantas, dieron 17 vueltas a la Tierra y regresaron con vida. Fueron los primeros seres vivos en volver de una órbita y abrieron el camino al vuelo de Gagarin.',
      'Aboard Sputnik 5, with a rabbit, mice and plants, they circled the Earth 17 times and came back alive. They were the first living beings to return from orbit and paved the way for Gagarin’s flight.'],
    img: ['Belka y Strelka tras su regreso, 1960.', 'Belka and Strelka after their return, 1960.'],
    src: 'Smithsonian · NASA History' }),
  'pushinka': c(7, 'person', 'legendary', ['Pushinka, la perrita de la Casa Blanca', 'Pushinka, the White House dog'], {
    date: '1961',
    fact: ['Pushinka, cachorra de Strelka, fue un regalo de Nikita Jruschov a Caroline Kennedy, la hija del presidente. En plena Guerra Fría, una perra espacial soviética vivió en la Casa Blanca y tuvo cachorros con el perro de los Kennedy.',
      'Pushinka, Strelka’s puppy, was a gift from Nikita Khrushchev to Caroline Kennedy, the president’s daughter. In the middle of the Cold War, a Soviet space dog lived in the White House and had puppies with the Kennedys’ dog.'],
    img: ['Caroline Kennedy con Pushinka en la Casa Blanca.', 'Caroline Kennedy with Pushinka at the White House.'],
    src: 'John F. Kennedy Presidential Library · Smithsonian' }),
  'abrieron-camino': c(7, 'moment', 'rare', ['Los que abrieron camino', 'Those who paved the way'], {
    date: '1947–1961',
    fact: ['Antes de los humanos viajaron moscas de la fruta (1947), monos, perros y ratones. Muchos no volvieron. Sus vuelos demostraron que un ser vivo podía sobrevivir al lanzamiento, a la ingravidez y al regreso.',
      'Before humans came fruit flies (1947), monkeys, dogs and mice. Many did not return. Their flights proved a living being could survive launch, weightlessness and reentry.'],
    img: ['La Tierra detrás del perrito de tela, en la ventana de Columbia.', 'Earth behind the toy dog in Columbia’s window.'],
    src: 'NASA History' }),
  'ultima-transmision': c(7, 'moment', 'common', ['La última transmisión', 'The last broadcast'], {
    date: '23 jul 1969',
    fact: ['La víspera del amerizaje, cada tripulante habló ante la cámara. Collins agradeció a los miles de personas que había bajo la superficie del logro; Aldrin habló de la curiosidad insaciable de la humanidad; Armstrong cerró: «Buenas noches desde el Apolo 11».',
      'On the eve of splashdown, each crewman spoke to the camera. Collins thanked the thousands of people beneath the surface of the achievement; Aldrin spoke of humanity’s insatiable curiosity; Armstrong closed: “Good night from Apollo 11.”'],
    img: ['Fotograma de la transmisión de televisión del 23 de julio.', 'A frame from the 23 July TV broadcast.'],
    src: AFJ }),
  'escudo-termico': c(7, 'science', 'rare', ['Escudo térmico', 'Heat shield'], {
    date: '24 jul 1969 · ~16:35 UTC',
    fact: ['El módulo de mando entró a unos 40.000 km/h. Su escudo ablativo, que se quemaba capa a capa, soportó unos 2.700 °C. La reentrada la guió la computadora; el corredor era estrecho: demasiado empinado y el calor sería excesivo, demasiado plano y la cápsula rebotaría.',
      'The command module hit the air at about 40,000 km/h. Its ablative shield, burning away layer by layer, withstood some 2,700 °C. The computer flew the reentry; the corridor was narrow: too steep and the heat would be too much, too shallow and the capsule would skip out.'],
    img: ['El escudo térmico chamuscado de Columbia, Smithsonian.', 'Columbia’s scorched heat shield, Smithsonian.'],
    src: MR }),
  'amerizaje': c(7, 'moment', 'common', ['Amerizaje', 'Splashdown'], {
    date: '24 jul 1969 · 16:50:35 UTC',
    fact: ['Por mal tiempo, la zona de amerizaje se desplazó unos 400 km. Columbia cayó al Pacífico y quedó boca abajo hasta que se inflaron las boyas. El buzo Clancy Hatleberg abrió la escotilla y les lanzó los trajes de aislamiento biológico.',
      'Because of bad weather the landing zone moved about 400 km. Columbia splashed into the Pacific and floated upside down until the balloons inflated. Diver Clancy Hatleberg opened the hatch and handed in the biological isolation garments.'],
    img: ['La tripulación en la balsa junto a Columbia, con trajes grises.', 'The crew in the raft beside Columbia, in grey suits.'],
    src: MR }),
  'cuarentena': c(7, 'moment', 'common', ['Cuarentena', 'Quarantine'], {
    date: '24 jul – 10 ago 1969',
    fact: ['Por precaución ante posibles microbios lunares, la tripulación pasó 21 días aislada: primero en la Instalación Móvil de Cuarentena del USS Hornet y luego en el Laboratorio de Recepción Lunar de Houston. No se encontró ningún organismo.',
      'As a precaution against possible lunar microbes, the crew spent 21 days in isolation: first in the Mobile Quarantine Facility aboard USS Hornet, then in Houston’s Lunar Receiving Laboratory. No organism was ever found.'],
    img: ['Nixon habla con la tripulación a través de la ventana de la MQF.', 'Nixon speaks to the crew through the MQF window.'],
    src: NH }),
  'ventana-cuarentena': c(7, 'object', 'rare', ['La ventana de la cuarentena', 'The quarantine window'], {
    date: 'jul–ago 1969',
    fact: ['A través de un vidrio y por teléfono, los astronautas pudieron ver a sus familias. En el Hornet, Nixon les dijo desde el otro lado: «Esta es la semana más grande en la historia del mundo desde la Creación».',
      'Through glass and by telephone, the astronauts could see their families. On the Hornet, Nixon told them from the other side: “This is the greatest week in the history of the world since the Creation.”'],
    img: ['Los tres astronautas tras la ventana de la Instalación Móvil de Cuarentena.', 'The three astronauts behind the Mobile Quarantine Facility window.'],
    src: NH }),

  // ---------- Epílogo ----------
  'desfile': c(8, 'moment', 'common', ['Desfile en Nueva York', 'New York parade'], {
    date: '13 ago 1969',
    fact: ['Una lluvia de papel cayó sobre la tripulación en Nueva York, Chicago y Los Ángeles el mismo día. Después vino la gira «Giantstep» por 24 países. Collins recordó que la gente no decía «ustedes lo lograron», sino «lo logramos».',
      'Ticker tape rained on the crew in New York, Chicago and Los Angeles the same day. Then came the “Giantstep” tour of 24 countries. Collins remembered people did not say “you did it” but “we did it.”'],
    img: ['El desfile por el Bajo Manhattan, 13 de agosto de 1969.', 'The parade through Lower Manhattan, 13 August 1969.'],
    src: NH + ' · U.S. Department of State' }),
  'legado-lrrr': c(8, 'science', 'rare', ['El retrorreflector hoy', 'The retroreflector today'], {
    date: '1969 – hoy',
    fact: ['El retrorreflector del Apolo 11 es el único experimento de la misión que sigue funcionando. Observatorios como el de McDonald (Texas) o Apache Point (Nuevo México) miden la distancia a la Luna con precisión de milímetros.',
      'Apollo 11’s retroreflector is the mission’s only experiment still working. Observatories such as McDonald (Texas) and Apache Point (New Mexico) measure the distance to the Moon to millimeter precision.'],
    img: ['Un rayo láser verde apuntando a la Luna desde un observatorio.', 'A green laser beam aimed at the Moon from an observatory.'],
    src: 'Lunar Laser Ranging · NASA' }),
  'artemis': c(8, 'moment', 'rare', ['Artemis', 'Artemis'], {
    date: '2022 – hoy',
    fact: ['Seis misiones Apolo alunizaron entre 1969 y 1972 y doce personas caminaron sobre la Luna. Unas 400.000 personas hicieron posible el programa. Artemis, hermana gemela de Apolo en la mitología, prepara el regreso, esta vez para quedarse.',
      'Six Apollo missions landed between 1969 and 1972 and twelve people walked on the Moon. Some 400,000 people made the program possible. Artemis, Apollo’s twin sister in mythology, is preparing the return, this time to stay.'],
    img: ['El cohete SLS de Artemis I en la plataforma 39B.', 'The Artemis I SLS rocket on Pad 39B.'],
    src: 'NASA' }),
  'historiador': c(8, 'moment', 'hidden', ['Historiador del Apolo', 'Apollo Historian'], {
    date: '1969 – hoy',
    fact: ['Completaste la Bitácora entera, incluidos todos los eventos ocultos. Unas 400.000 personas trabajaron en el programa Apolo: ingenieros, costureras, programadoras, controladores. Este título es para ellas.',
      'You completed the whole log, every hidden event included. Some 400,000 people worked on the Apollo program: engineers, seamstresses, programmers, controllers. This title is for them.'],
    img: ['La sala de Control de Misión celebrando tras el amerizaje.', 'Mission Control celebrating after splashdown.'],
    src: 'NASA · Apollo by the Numbers' }),

  // ---------- No Canon ----------
  'guardian': c(9, 'science', 'hidden', ['El Guardián de Tranquilidad', 'The Guardian of Tranquility'], {
    date: 'NO CANON · sueño',
    fact: ['Esta criatura nunca existió; fue un sueño. Lo real: el polvo lunar es un enemigo verdadero. Sus granos son afilados como vidrio porque no hay viento ni agua que los desgasten; se pega a todo por carga electrostática, rayó visores y dañó sellos, y dentro del módulo olía «a pólvora quemada».',
      'This creature never existed; it was a dream. What is real: lunar dust is a true enemy. Its grains are sharp as glass because no wind or water wears them down; it clings to everything by static charge, scratched visors and damaged seals, and inside the module it smelled “like spent gunpowder.”'],
    img: ['Arte conceptual del Guardián: un coloso de regolito con un núcleo DSKY que muestra «1202».', 'Concept art of the Guardian: a regolith colossus with a DSKY core reading “1202”.'],
    src: ALSJ + ' · NASA' }),
  'lo-real-del-sueno': c(9, 'science', 'epic', ['Lo que era real en el sueño', 'What was real in the dream'], {
    date: 'NO CANON · sueño',
    fact: ['La mochila PLSS daba unas 4 horas de oxígeno de diseño; la gravedad lunar es 1/6 de la terrestre; los micrometeoritos existen, pero el riesgo en una caminata de 2,5 h era muy bajo. No hay grietas que se abran ni cráteres que se derrumben. Esa noche, en Eagle, hacía unos 16 °C y casi no durmieron.',
      'The PLSS backpack carried about 4 hours of oxygen by design; lunar gravity is 1/6 of Earth’s; micrometeoroids exist, but the risk during a 2.5 h walk was very low. No cracks open and no craters collapse. That night in Eagle it was about 16 °C and they barely slept.'],
    img: ['El interior de Eagle con la hamaca de Armstrong sobre la tapa del motor.', 'Inside Eagle with Armstrong’s hammock over the engine cover.'],
    src: ALSJ }),

  // ---------- Eventos ocultos ----------
  'h-45s': c(4, 'moment', 'hidden', ['Cuarenta y cinco segundos', 'Forty-five seconds'], {
    date: '20 jul 1969 · 20:17:40 UTC',
    fact: ['Aterrizaste en manual, fuera del campo de rocas, con menos de 20 s de combustible y menos de 1 m/s de velocidad vertical. Armstrong lo hizo con un margen estimado de 45 s: el sensor de combustible se alteraba con el chapoteo del propelente y dio la alarma antes de tiempo.',
      'You landed manually, clear of the boulder field, with under 20 s of fuel and under 1 m/s of vertical speed. Armstrong did it with an estimated 45 s margin: propellant sloshing upset the fuel sensor and triggered the low-level warning early.'],
    img: ['Fotograma de la cámara de 16 mm: el polvo levantado en los últimos metros.', '16 mm frame: dust kicked up in the final meters.'],
    src: ALSJ + ' · ' + MR }),
  'h-dejamos': c(5, 'moment', 'hidden', ['Lo que dejamos atrás', 'What we left behind'], {
    date: '21 jul 1969',
    fact: ['Encontraste y colocaste los 5 recuerdos del paquete. El parche del Apolo 1, las medallas de Gagarin y Komarov, el disco de los 73 países y la rama de olivo siguen en la Luna: honran a los muertos de ambos lados de la carrera espacial.',
      'You found and placed all 5 mementos. The Apollo 1 patch, the Gagarin and Komarov medals, the 73-nation disc and the olive branch are still on the Moon: they honor the fallen on both sides of the space race.'],
    img: ['La rama de olivo dorada (réplica), Smithsonian.', 'The golden olive branch (replica), Smithsonian.'],
    src: ALSJ }),
  'h-laser': c(5, 'science', 'hidden', ['Un láser desde la Tierra', 'A laser from Earth'], {
    date: '1 ago 1969',
    fact: ['Desplegaste el retrorreflector de frente a la Tierra, a la primera. Días después, el Observatorio Lick (California) recibió el primer eco de un láser rebotado en el panel. Hoy sigue funcionando y muestra que la Luna se aleja unos 3,8 cm al año.',
      'You deployed the retroreflector facing the Earth on the first try. Days later, Lick Observatory (California) caught the first echo of a laser bounced off the panel. It still works today and shows the Moon drifting about 3.8 cm a year.'],
    img: ['El telescopio de 3 m del Observatorio Lick.', 'Lick Observatory’s 3 m telescope.'],
    src: 'Lick Observatory · Lunar Laser Ranging' }),
  'h-hamilton': c(4, 'person', 'hidden', ['Margaret Hamilton', 'Margaret Hamilton'], {
    date: '20 jul 1969',
    fact: ['Como Bales, respondiste a la 1202 en menos de 3 s y supiste por qué era seguro seguir. Margaret Hamilton dirigió el software de vuelo en el MIT; su diseño priorizaba las tareas críticas y descartaba las demás. En 2016 recibió la Medalla Presidencial de la Libertad.',
      'As Bales, you answered the 1202 in under 3 s and knew why it was safe to continue. Margaret Hamilton led the flight software at MIT; her design prioritized critical tasks and shed the rest. In 2016 she received the Presidential Medal of Freedom.'],
    img: ['Margaret Hamilton junto a los listados impresos del software del Apolo.', 'Margaret Hamilton beside printed listings of the Apollo software.'],
    src: 'MIT · NASA' }),
  'h-cartografo': c(6, 'moment', 'hidden', ['El cartógrafo solitario', 'The lonely cartographer'], {
    date: '20–21 jul 1969',
    fact: ['Como Collins, fotografiaste los 6 puntos de referencia en una sola órbita. Esos accidentes del terreno servían para navegar y ajustar la órbita. Collins buscó a Eagle con el sextante en varias pasadas y nunca logró verlo.',
      'As Collins, you photographed all 6 landmarks in a single orbit. Those features were used to navigate and refine the orbit. Collins searched for Eagle through the sextant on several passes and never managed to spot it.'],
    img: ['AS11-42-6305: el cráter Maskelyne desde la órbita.', 'AS11-42-6305: Maskelyne crater from orbit.'],
    src: AFJ }),
  'h-ciegas': c(3, 'science', 'hidden', ['Navegar a ciegas', 'Flying blind'], {
    date: '19 jul 1969 · 17:21:50 UTC',
    fact: ['Hiciste la LOI con una precisión de al menos el 95 %. Detrás de la Luna no había contacto con la Tierra: los encendidos clave, LOI y TEI, se hicieron sin que Houston pudiera ver nada. La tripulación solo tenía el DSKY y el reloj.',
      'You flew the LOI with at least 95 % precision. Behind the Moon there was no contact with Earth: the key burns, LOI and TEI, happened with Houston blind. The crew had only the DSKY and the clock.'],
    img: ['El reloj de misión y el DSKY del panel principal de Columbia.', 'The mission clock and DSKY on Columbia’s main panel.'],
    src: AFJ }),
  'h-angulo': c(7, 'science', 'hidden', ['El ángulo perfecto', 'The perfect angle'], {
    date: '24 jul 1969',
    fact: ['Mantuviste la reentrada dentro del corredor todo el tiempo. Era estrecho: demasiado empinado aumentaba el calor y la desaceleración; demasiado plano hacía rebotar la cápsula hacia el espacio. Columbia amerizó a unos 24 km del USS Hornet.',
      'You kept the reentry inside the corridor the whole way. It was narrow: too steep raised the heat and deceleration; too shallow bounced the capsule back into space. Columbia splashed down about 24 km from USS Hornet.'],
    img: ['El USS Hornet recupera a Columbia en el Pacífico.', 'USS Hornet recovers Columbia in the Pacific.'],
    src: MR }),
};
