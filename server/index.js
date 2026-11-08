// Servidor de juego: estáticos (dist/) con Range + gzip, salas WebSocket con roles y reconexión, QR de unión.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', process.env.STATIC_DIR || 'dist');
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.vtt': 'text/vtt', '.ico': 'image/x-icon', '.wasm': 'application/wasm' };
const GZ = new Set(['.html', '.js', '.css', '.json', '.svg', '.vtt']);
const rooms = new Map(); // code -> {code, hostRole, members: Map<id,{ws,role,name,flag,alive}>, created}

export function lanIP() {
  for (const ifs of Object.values(os.networkInterfaces())) for (const i of ifs || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  return 'localhost';
}
function newCode() { let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (rooms.has(c)); return c; }
function joinBase(req) {
  if (PUBLIC_URL) return PUBLIC_URL.replace(/\/$/, '');
  const host = req.headers.host || `localhost:${PORT}`;
  if (/^(localhost|127\.)/.test(host)) return HOST === '0.0.0.0' ? `http://${lanIP()}:${host.split(':')[1] || PORT}` : `http://${host}`;
  return `${String(req.headers['x-forwarded-proto']).split(',')[0] === 'https' ? 'https' : 'http'}://${host}`;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('permissions-policy', 'microphone=(self), camera=(), geolocation=()');
  const wsHost = /^[a-zA-Z0-9.\-:\[\]]+$/.test(req.headers.host || '') ? req.headers.host : 'localhost';
  res.setHeader('content-security-policy', `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob: ws://${wsHost} wss://${wsHost}; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end(); }
  try {
    const url = new URL(req.url, 'http://x');
    const rel = decodeURIComponent(url.pathname);
    if (url.pathname === '/qr') {
      const code = (url.searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6);
      const target = `${joinBase(req)}/?room=${code}`;
      const svg = await QRCode.toString(target, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#e8f1ff', light: '#0000' } });
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'x-join-url': target, 'cache-control': 'no-store' }); return res.end(req.method === 'HEAD' ? undefined : svg);
    }
    if (url.pathname === '/rtc.json') {
      // Preview never inherits credentials accidentally. TURN is explicitly opt-in.
      const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
      if (process.env.ENABLE_TURN === '1' && process.env.TURN_URLS) ice.push({ urls: process.env.TURN_URLS.split(','), username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' });
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ iceServers: ice }));
    }
    if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok: true })); }
    // Only built game resources. No SPA fallback for arbitrary paths, source maps, dotfiles or directories.
    const allowed = rel === '/' || rel === '/index.html' || rel === '/licenses.txt' || /^\/(assets|audio|video|models|img|tex|fonts)\//.test(rel);
    if (!allowed || rel.split('/').some(x => x.startsWith('.') || x.includes('\\')) || rel.includes('\0') || rel.endsWith('.map')) { res.writeHead(404); return res.end(); }
    const p = path.resolve(ROOT, '.' + (rel === '/' ? '/index.html' : rel));
    if (!p.startsWith(ROOT + path.sep)) { res.writeHead(404); return res.end(); }
    let stat; try { stat = fs.statSync(p); } catch { res.writeHead(404); return res.end(); }
    if (!stat.isFile() || !fs.realpathSync(p).startsWith(fs.realpathSync(ROOT) + path.sep)) { res.writeHead(404); return res.end(); }
    const ext = path.extname(p), type = MIME[ext]; if (!type) { res.writeHead(404); return res.end(); }
    const cache = p.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=86400';
    const headers = { 'content-type': type, 'cache-control': cache, 'accept-ranges': 'bytes' };
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      let start = m?.[1] ? Number(m[1]) : 0, end = m?.[2] ? Number(m[2]) : stat.size - 1;
      if (m && !m[1] && m[2]) { start = Math.max(0, stat.size - Number(m[2])); end = stat.size - 1; }
      if (!m || (!m[1] && !m[2]) || start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) { res.writeHead(416, { ...headers, 'content-range': `bytes */${stat.size}` }); return res.end(); }
      end = Math.min(end, stat.size - 1);
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': end - start + 1 });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(p, { start, end }).on('error', () => res.destroy()).pipe(res);
    }
    if (GZ.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(p).on('error', () => res.destroy()).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    }
    res.writeHead(200, { ...headers, 'content-length': stat.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(p).on('error', () => res.destroy()).pipe(res);
  } catch { if (!res.headersSent) res.writeHead(400); res.end(); }
});

const send = (ws, m) => { try { ws.readyState === 1 && ws.send(JSON.stringify(m)); } catch {} };
function roster(room) { return [...room.members.entries()].map(([id, m]) => ({ id, role: m.role, name: m.name, flag: m.flag, online: !!m.ws })); }
function broadcast(room, m, except) { for (const mem of room.members.values()) if (mem.ws && mem.ws !== except) send(mem.ws, m); }
function update(room) { broadcast(room, { t: 'roster', code: room.code, mission: room.mission || 'apollo', members: roster(room) }); }
const missionName = x => ['mars','horizon'].includes(x) ? x : 'apollo';
const sessionFor = r => r.start ? { ...r.start, resume: { phase: r.phase?.ph || 'prep', results: r.phase?.results || {}, ...(r.start.mission && r.start.mission !== 'apollo' ? { aux: r.snap?.d || null } : {}) } } : null;

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });
wss.on('connection', (ws, req) => {
  if (req.headers.origin) { try { if (new URL(req.headers.origin).host !== req.headers.host) { ws.close(1008, 'Origin'); return; } } catch { ws.close(1008, 'Origin'); return; } }
  ws.isAlive = true; ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (['create','join'].includes(m.t) && (!/^[a-zA-Z0-9_-]{6,64}$/.test(m.id || '') || ws.room)) return send(ws, { t: 'error', msg: 'INVALID' });
    const room = ws.room && rooms.get(ws.room);
    switch (m.t) {
      case 'create': {
        const code = newCode(); const role = m.role === 'capcom' ? 'capcom' : 'pilot';
        if (rooms.size >= 100) return send(ws, { t: 'error', msg: 'FULL' });
        const r = { code, mission: missionName(m.mission), members: new Map(), created: Date.now(), requests: new Map(), logs: [] }; rooms.set(code, r);
        r.members.set(m.id, { ws, role, name: String(m.name || '').slice(0, 16), flag: m.flag || null }); ws.room = code; ws.pid = m.id;
        send(ws, { t: 'joined', code, role, host: true, mission:r.mission }); update(r); break;
      }
      case 'join': {
        const r = rooms.get(String(m.code));
        if (!r) return send(ws, { t: 'error', msg: 'NO_ROOM' });
        const existing = r.members.get(m.id);
        if (existing) { const old = existing.ws; existing.ws = ws; if (old && old !== ws) old.close(1000, 'Rejoined'); ws.room = r.code; ws.pid = m.id; clearTimeout(existing.timer); send(ws, { t: 'joined', code: r.code, role: existing.role, host: [...r.members.keys()][0] === m.id, rejoin: true, mission:r.mission, session: sessionFor(r) }); broadcast(r, { t: 'peer', ev: 'back', id: m.id }, ws); update(r); break; }
        if (r.members.size >= 2) return send(ws, { t: 'error', msg: 'FULL' });
        const taken = [...r.members.values()][0]?.role; const role = taken === 'pilot' ? 'capcom' : 'pilot';
        r.members.set(m.id, { ws, role, name: String(m.name || '').slice(0, 16), flag: m.flag || null }); ws.room = r.code; ws.pid = m.id;
        send(ws, { t: 'joined', code: r.code, role, host: false, mission:r.mission, session:sessionFor(r) }); update(r); break;
      }
      case 'selection': {
        if (!room || [...room.members.keys()][0] !== ws.pid || room.start || !['apollo','mars','horizon'].includes(m.mission)) break;
        room.mission=m.mission; update(room); break;
      }
      case 'swap': { // el host intercambia roles
        if (!room || [...room.members.keys()][0] !== ws.pid || room.start) break; for (const mem of room.members.values()) mem.role = mem.role === 'pilot' ? 'capcom' : 'pilot';
        for (const mem of room.members.values()) mem.ws && send(mem.ws, { t: 'role', role: mem.role }); update(room); break;
      }
      case 'sync': {
        if (!room || room.members.get(ws.pid)?.role !== 'capcom') break;
        if (room.phase) send(ws, room.phase);
        if (room.snap) send(ws, room.snap);
        for (const log of room.logs || []) send(ws, log);
        for (const req of room.requests?.values() || []) send(ws, req);
        if (room.debrief) send(ws, room.debrief);
        break;
      }
      case 'profile': { if (!room) break; const mem = room.members.get(ws.pid); if (mem) { mem.name = String(m.name || '').slice(0, 16); mem.flag = m.flag || null; } update(room); break; }
      case 'leave': { if (room) drop(ws, true); break; }
      case 'ping': send(ws, { t: 'pong', ts: m.ts }); break;
      default: {
        if (!room) break;
        const role = room.members.get(ws.pid)?.role;
        const pilotOnly = ['phase','snap','log','req','reqdone','debrief','practice'];
        if (pilotOnly.includes(m.t) && role !== 'pilot') break;
        if (m.t === 'start' && [...room.members.keys()][0] !== ws.pid) break;
        if (!['start','phase','snap','log','req','reqdone','debrief','practice','restart','quit','ev','rtc'].includes(m.t)) break;
        if (m.t === 'start' && room.start) break;
        if (m.t === 'restart') { room.debrief = null; room.snap = null; room.requests.clear(); room.logs = []; room.phase = { t: 'phase', ph: m.ph, results: m.ph === 'prep' ? {} : room.phase?.results || {} }; }
        if (m.t === 'start') { m.mission = room.mission || 'apollo'; room.start = m; room.debrief = null; }
        if (m.t === 'phase') { room.phase = m; room.snap = null; room.requests.clear(); room.logs = []; }
        if (m.t === 'snap') room.snap = m;
        if (m.t === 'log') { room.logs.push(m); if (room.logs.length > 60) room.logs.shift(); }
        if (m.t === 'req' && room.requests.size < 16) room.requests.set(m.id, m);
        if (m.t === 'reqdone') room.requests.delete(m.id);
        if (m.t === 'debrief') { room.debrief = m; room.requests.clear(); }
        broadcast(room, { ...m, from: ws.pid }, ws); break;
      }
    }
  });
  ws.on('close', () => drop(ws, false));
});
function drop(ws, explicit) {
  const room = ws.room && rooms.get(ws.room); if (!room) return;
  const mem = room.members.get(ws.pid); if (!mem || mem.ws !== ws) return;
  mem.ws = null; ws.room = null;
  broadcast(room, { t: 'peer', ev: 'away', id: ws.pid });
  const kill = () => { room.members.delete(ws.pid); broadcast(room, { t: 'peer', ev: 'left', id: ws.pid }); update(room); if (![...room.members.values()].some((x) => x.ws)) rooms.delete(room.code); };
  if (explicit) kill(); else { mem.timer = setTimeout(kill, 45000); update(room); }
}
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
setInterval(() => { for (const [c, r] of rooms) if (Date.now() - r.created > 6 * 3600e3) rooms.delete(c); }, 600000);

server.listen(PORT, HOST, () => console.log(`Planta la bandera → http://localhost:${PORT}  static: ${ROOT}`));
