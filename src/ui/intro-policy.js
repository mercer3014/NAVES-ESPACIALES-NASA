// Once per document load. A stored "already seen" flag is not an input.
export function shouldPlayIntro({ played = false, nointro = false, reconnect = false } = {}) {
  return !played && !nointro && !reconnect;
}
