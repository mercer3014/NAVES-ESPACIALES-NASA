// Each ladder rung used to wait on a key edge, so holding S / ↓ / Space
// only dropped one rung and the player had to tap again.
export function ladderWantsDown({ auto = false, act = false, held = false, tapped = false } = {}) {
  return !!(auto || act || held || tapped);
}
