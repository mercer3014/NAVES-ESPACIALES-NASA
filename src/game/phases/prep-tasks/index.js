// Tareas de la Fase 1 «La mañana del lanzamiento».
// Contrato: cada tarea es un módulo  export default function mountTask(el, opts) -> Promise<{ ok, time, mistakes }>
//   el   = contenedor DOM vacío de la ventana de tarea
//   opts = { diff, diffName, hint(msg), sfx(name), signal: AbortSignal, share?(obj) }
// La tarea pinta su UI en `el` (solo Pointer Events), se resuelve al completarse y limpia sus listeners al terminar o abortar.

const svg = (body) => `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const TASKS = [
  {
    id: 'cables', short: ['Cables', 'Cables'], title: ['Conecta el traje', 'Connect the suit'],
    icon: svg('<circle cx="9" cy="11" r="4"/><circle cx="9" cy="24" r="4"/><circle cx="9" cy="37" r="4"/><circle cx="39" cy="11" r="4"/><circle cx="39" cy="24" r="4"/><circle cx="39" cy="37" r="4"/><path d="M13 11 C26 11 22 37 35 37 M13 24 H35 M13 37 C26 37 22 11 35 11"/>'),
    brief: ['Une cada manguera con el conector de su mismo color. Azul: entra el oxígeno. Rojo: sale. Negro: la radio.', 'Join each hose to the connector of the same color. Blue: oxygen in. Red: out. Black: the radio.'],
    fact: ['En la Sala Blanca, los técnicos conectaban cada traje A7L al oxígeno de la nave. En el torso hay un conector azul y uno rojo.', 'In the White Room, technicians plugged each A7L suit into the ship\'s oxygen. The torso has one blue and one red connector.'],
    hint: ['Arrastra el extremo de la manguera hasta el conector de su mismo color.', 'Drag the end of the hose to the connector of the same color.'],
    load: () => import('./cables.js'),
  },
  {
    id: 'tanks', short: ['Tanques', 'Tanks'], title: ['Llena los tanques', 'Fill the tanks'],
    icon: svg('<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M14 26 H34 M14 33 H34" stroke-dasharray="2 5"/><path d="M19 17 H29"/>'),
    brief: ['Mantén pulsado LLENAR hasta la franja verde. El líquido hierve y baja solo: deja los 3 tanques en verde durante 2 segundos.', 'Hold FILL up to the green band. The liquid boils off by itself: keep all 3 tanks in green for 2 seconds.'],
    fact: ['El oxígeno líquido está a -183 °C y el hidrógeno líquido a -253 °C. Hervían y había que reponerlos hasta poco antes del despegue: por eso el vapor blanco.', 'Liquid oxygen is at -183 °C and liquid hydrogen at -253 °C. They boiled off and had to be topped up until just before launch: that is the white vapor.'],
    hint: ['Pulsa LLENAR y suelta al llegar a la franja verde. Un toque corto da un empujón.', 'Press FILL and let go at the green band. A short tap gives a nudge.'],
    load: () => import('./tanks.js'),
  },
  {
    id: 'leak', short: ['Fuga', 'Leak'], title: ['Repara la fuga', 'Fix the leak'],
    icon: svg('<path d="M24 4 C24 4 12 18 12 28 a12 12 0 0 0 24 0 C36 18 24 4 24 4 Z"/><path d="M19 29 a5 5 0 0 0 5 5"/>'),
    brief: ['Algo silba: ¡sale vapor! Encuentra la válvula que fuga, ciérrala y completa el circuito de tuberías.', 'Something hisses: steam! Find the leaking valve, shut it and finish the pipe circuit.'],
    fact: ['El 16 de julio de 1969, hacia las 2:30, se halló una fuga en la válvula de reposición de hidrógeno líquido, a unos 60 m de altura en la torre. Un equipo subió a apretar los pernos.', 'On July 16, 1969, around 2:30 a.m., a leak was found in the liquid hydrogen replenish valve, about 60 m up the tower. A crew climbed up to tighten the bolts.'],
    hint: ['Busca el vapor blanco: toca la válvula que silba y gira la llave.', 'Look for the white steam: tap the hissing valve and turn the wrench.'],
    load: () => import('./leak.js'),
  },
  {
    id: 'align', short: ['Alinear', 'Align'], title: ['Alinea la plataforma', 'Align the platform'],
    icon: svg('<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="11"/><path d="M24 2 V14 M24 34 V46 M2 24 H14 M34 24 H46"/>'),
    brief: ['Gira los tres anillos hasta que la cruz quede centrada y en verde.', 'Turn the three rings until the cross sits centered and green.'],
    fact: ['La computadora de guiado (AGC) necesitaba su plataforma inercial alineada antes del despegue para saber dónde es «arriba».', 'The guidance computer (AGC) needed its inertial platform aligned before liftoff to know which way is "up".'],
    hint: ['Arrastra un anillo hasta dejar la cruz en el centro.', 'Drag a ring until the cross is in the center.'],
    load: () => import('./align.js'),
  },
  {
    id: 'hatch', short: ['Escotilla', 'Hatch'], title: ['Cierra la escotilla', 'Close the hatch'],
    icon: svg('<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="4"/><path d="M24 20 V8 M27.5 26 L38 32 M20.5 26 L10 32"/>'),
    brief: ['Dale a Neil la llave de la Luna y gira la manivela para cerrar la escotilla.', 'Give Neil the Moon key and turn the handle to close the hatch.'],
    fact: ['Guenter Wendt, jefe de la Sala Blanca, le regaló a Armstrong una llave de espuma en forma de media luna antes de cerrar la escotilla.', 'Guenter Wendt, White Room chief, gave Armstrong a crescent-moon foam key before closing the hatch.'],
    hint: ['Arrastra la media luna hasta Neil. Luego gira la manivela en círculo.', 'Drag the crescent to Neil. Then turn the handle in a circle.'],
    load: () => import('./hatch.js'),
  },
];
