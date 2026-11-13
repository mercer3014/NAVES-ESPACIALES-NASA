// Unlocked Chrome reports movementX/Y only while a button is held.
// Pointer lock uses those deltas. Until the lock is granted, client position
// deltas keep mouse-look working with no button down.
export function lookDelta({ locked = false, movementX = 0, movementY = 0, clientX = 0, clientY = 0, last = null } = {}) {
  if (locked) return { dx: movementX || 0, dy: movementY || 0, last: null };
  if (!last) return { dx: 0, dy: 0, last: { x: clientX, y: clientY } };
  return { dx: clientX - last.x, dy: clientY - last.y, last: { x: clientX, y: clientY } };
}
