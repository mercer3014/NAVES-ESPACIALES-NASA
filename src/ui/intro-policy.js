// El video de apertura se ve una sola vez: la primera visita. Después se entra directo al menú
// (sigue disponible en el botón «Intro» del menú). ?nointro y la reconexión a una sala también lo saltan.
export function shouldPlayIntro({ played = false, seen = false, nointro = false, reconnect = false } = {}) {
  return !played && !seen && !nointro && !reconnect;
}
