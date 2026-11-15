// Compañero: sigue al jugador a una distancia fija y mira hacia donde mira él.
// El clip `walk` lo elige quien tiene el actor; aquí solo va la posición.

export function createCompanion(opts = {}) {
  const at = opts.at || [0, 0, 0];
  return { x: at[0] || 0, y: at[1] || 0, z: at[2] || 0, yaw: opts.yaw || 0, follow: opts.follow ?? 1.5, speed: 0 };
}

export function stepCompanion(c, player, dt) {
  const step = Math.max(0, dt || 0);
  const dx = player.x - c.x, dz = player.z - c.z;
  const d = Math.hypot(dx, dz);
  if (d > c.follow + 0.05 && d > 1e-4) {
    const move = Math.min(d - c.follow, Math.max(player.speed || 0, 1.15) * step);
    c.x += (dx / d) * move; c.z += (dz / d) * move;
    c.speed = step ? move / step : 0;
    c.yaw = Math.atan2(dx, dz);
  } else {
    c.speed = 0;
    c.yaw = player.yaw;
  }
  c.y = typeof player.floorY === 'number' ? player.floorY : player.y;
  return c;
}

// Línea corta al pasar junto a un objeto. `said` es un Set de ids ya dichos.
export function companionBark(barks, player, said) {
  for (const b of barks || []) {
    if (!b || said.has(b.id)) continue;
    const d = Math.hypot((b.x ?? 0) - player.x, (b.z ?? 0) - player.z);
    if (d <= (b.r ?? 1.8)) { said.add(b.id); return b; }
  }
  return null;
}
