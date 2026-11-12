// Radio del traje: intercomunicador de micrófono abierto entre los 2 jugadores.
// WebRTC P2P (audio) con señalización por el servidor de salas (mensajes 't:rtc' reenviados tal cual)
// + cadena Web Audio estilo radio Apollo: banda 300–3400 Hz, saturación suave, reverb de casco corta,
// estática/respiración mientras hay voz y tonos Quindar (2525 Hz al abrir, 2475 Hz al cerrar) por VAD.
// Nota: solo STUN público. En redes con NAT simétrico/corporativas haría falta un servidor TURN.
import { Howler } from 'howler';
import { net, tx, peerOnline } from './room.js';
import { on, emit, store, DEBUG } from '../core/store.js';

let ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
// El servidor puede añadir TURN (redes con NAT simétrico o UDP bloqueado lo necesitan)
fetch('/rtc.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.iceServers?.length) ICE = j.iceServers; }).catch(() => {});
export const radio = {
  state: 'off', // off | asking | on | denied | unsupported
  muted: false, mode: store.get('radioMode') || 'open', ptt: false,
  me: false, peer: false, link: 'idle', // idle | connecting | connected | failed
  stats: { inBytes: 0, outBytes: 0 }, vadOpen: 0,
};
if (DEBUG) { window.__radio = radio; radio._pc = () => pc; }
const set = (k, v) => { if (radio[k] !== v) { radio[k] = v; emit('radio:state', radio); } };

// ---------------- Cadena de audio ----------------
let fx = null;
const ctx = () => { const c = Howler.ctx; if (c && c.state === 'suspended') c.resume().catch(() => {}); return c; };
function bq(c, type, f, Q = 0.707, g = 0) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q; b.gain.value = g; return b; }
function noiseBuf(c, secs = 2) { const b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate), d = b.getChannelData(0); let p = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; p = 0.97 * p + 0.03 * w; d[i] = w * 0.6 + p * 2.2 + (Math.random() < 0.0009 ? (Math.random() - 0.5) * 3 : 0); } return b; }
function helmetIR(c) { const n = Math.floor(c.sampleRate * 0.14), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) { const tt = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - tt, 3.2) * (i < 40 ? 0.2 : 1); } d[Math.floor(n * 0.07)] += 0.5; d[Math.floor(n * 0.16)] += 0.3; } return b; }
function softClip(k = 4) { const n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; cv[i] = Math.tanh(k * x) / Math.tanh(k); } return cv; }
export function radioFx() {
  if (fx) return fx;
  const c = ctx(); if (!c) return null;
  const out = c.createGain(); out.gain.value = 1.15 * store.get('vol').voice; out.connect(Howler.masterGain || c.destination);
  const inp = c.createGain(); inp.gain.value = 1.6;
  const hp1 = bq(c, 'highpass', 300), hp2 = bq(c, 'highpass', 300), lp1 = bq(c, 'lowpass', 3400), lp2 = bq(c, 'lowpass', 3400), pk = bq(c, 'peaking', 1800, 1.1, 6);
  const ws = c.createWaveShaper(); ws.curve = softClip(3.2); ws.oversample = '2x';
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -26; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.12;
  const dry = c.createGain(); dry.gain.value = 0.9; const wet = c.createGain(); wet.gain.value = 0.2; const conv = c.createConvolver(); conv.buffer = helmetIR(c);
  inp.connect(hp1).connect(hp2).connect(pk).connect(ws).connect(lp1).connect(lp2).connect(comp);
  comp.connect(dry).connect(out); comp.connect(conv).connect(wet).connect(out);
  // estática + respiración (solo mientras la VAD está abierta)
  const ns = c.createBufferSource(); ns.buffer = noiseBuf(c); ns.loop = true;
  const nbp = bq(c, 'bandpass', 2100, 0.6), nG = c.createGain(); nG.gain.value = 0;
  ns.connect(nbp).connect(nG).connect(out);
  const br = c.createBufferSource(); br.buffer = noiseBuf(c, 3); br.loop = true; br.playbackRate.value = 0.5;
  const blp = bq(c, 'bandpass', 700, 0.9), bG = c.createGain(); bG.gain.value = 0; const lfo = c.createOscillator(); lfo.frequency.value = 0.28; const lfoG = c.createGain(); lfoG.gain.value = 0;
  lfo.connect(lfoG).connect(bG.gain); br.connect(blp).connect(bG).connect(out);
  ns.start(); br.start(); lfo.start();
  fx = { c, inp, out, nG, bG, lfoG };
  return fx;
}
export function quindar(open = true, vol = 0.11) {
  const f = radioFx(); if (!f) return; const c = f.c, t0 = c.currentTime + 0.01;
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = open ? 2525 : 2475;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.008); g.gain.setValueAtTime(vol, t0 + 0.24); g.gain.linearRampToValueAtTime(0, t0 + 0.25);
  o.connect(g).connect(f.out); o.start(t0); o.stop(t0 + 0.27);
}
// estática de canal abierto (también la usa Pancho y las llamadas rápidas)
export function carrier(on, lvl = 0.022) {
  const f = radioFx(); if (!f) return; const t0 = f.c.currentTime;
  f.nG.gain.cancelScheduledValues(t0); f.nG.gain.setTargetAtTime(on ? lvl : 0, t0, on ? 0.03 : 0.08);
  f.bG.gain.cancelScheduledValues(t0); f.bG.gain.setTargetAtTime(on ? 0.016 : 0, t0, 0.1); f.lfoG.gain.setTargetAtTime(on ? 0.012 : 0, t0, 0.1);
}
export function radioBurst(ms = 700) { quindar(true); carrier(true); setTimeout(() => { carrier(false); quindar(false); }, ms); }
// Reproduce un buffer/elemento a través de la cadena (p. ej. voces grabadas de Pancho)
export function throughRadio(mediaEl) { const f = radioFx(); if (!f) return; try { f.c.createMediaElementSource(mediaEl).connect(f.inp); } catch {} }

// ---------------- VAD ----------------
function vad(node, cb, { thr = 0.018, hang = 450 } = {}) {
  const c = node.context, an = c.createAnalyser(); an.fftSize = 1024; node.connect(an);
  const buf = new Float32Array(an.fftSize); let open = false, last = 0, lvl = 0;
  const iv = setInterval(() => {
    an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    lvl = Math.sqrt(s / buf.length); const now = performance.now();
    if (lvl > thr) { last = now; if (!open) { open = true; cb(true, lvl); } } else if (open && now - last > hang) { open = false; cb(false, lvl); }
    cb.level?.(lvl);
  }, 40);
  return { stop() { clearInterval(iv); try { node.disconnect(an); } catch {} }, level: () => lvl };
}

// ---------------- WebRTC ----------------
let pc = null, sid = '', hiT = 0, tr = null, mic = null, micTrack = null, makingOffer = false, ignoreOffer = false, remoteEl = null, rVad = null, lVad = null, gate = null, statT = null;
const polite = () => !net.host;
function sendTrack() { const t = micTrack; if (!t) return; t.enabled = !radio.muted && (radio.mode === 'open' || radio.ptt); }
function ensurePC() {
  if (pc) return pc;
  pc = new RTCPeerConnection({ iceServers: ICE });
  if (net.host) sid = Math.random().toString(36).slice(2, 8);
  set('link', 'connecting');
  pc.onicecandidate = (e) => e.candidate && tx({ t: 'rtc', k: 'ice', c: e.candidate, sid });
  pc.ontrack = (e) => attachRemote(e.streams[0] || new MediaStream([e.track]));
  pc.onconnectionstatechange = () => { const s = pc?.connectionState; if (!s) return; set('link', s === 'connected' ? 'connected' : s === 'failed' ? 'failed' : s === 'disconnected' ? 'connecting' : radio.link); if (s === 'failed' && net.host) pc.restartIce?.(); };
  pc.onnegotiationneeded = async () => { try { makingOffer = true; await pc.setLocalDescription(); tx({ t: 'rtc', k: 'sdp', d: pc.localDescription, sid }); } catch (e) { console.warn('rtc offer', e); } finally { makingOffer = false; } };
  if (net.host) { tr = pc.addTransceiver('audio', { direction: 'sendrecv' }); if (micTrack) tr.sender.replaceTrack(micTrack); }
  clearInterval(statT); statT = setInterval(pollStats, 1000);
  return pc;
}
async function pollStats() {
  if (!pc) return; try { const r = await pc.getStats(); r.forEach((s) => { if (s.type === 'inbound-rtp' && s.kind === 'audio') radio.stats.inBytes = s.bytesReceived; if (s.type === 'outbound-rtp' && s.kind === 'audio') radio.stats.outBytes = s.bytesSent; }); } catch {}
}
function teardown() {
  clearInterval(statT); try { pc?.close(); } catch {} pc = null; tr = null; rVad?.stop(); rVad = null;
  if (remoteEl) { remoteEl.srcObject = null; remoteEl = null; } if (gate) { try { gate.disconnect(); } catch {} gate = null; }
  set('link', 'idle'); if (radio.peer) { radio.peer = false; emit('radio:talk', 'peer', false); } carrier(false);
}
function attachRemote(stream) {
  const f = radioFx(); if (!f) return;
  // Chrome: el stream remoto solo fluye a Web Audio si un <audio> lo está consumiendo (silenciado)
  remoteEl = new Audio(); remoteEl.muted = true; remoteEl.srcObject = stream; remoteEl.play().catch(() => {});
  const src = f.c.createMediaStreamSource(stream);
  gate = f.c.createGain(); gate.gain.value = 0; src.connect(gate).connect(f.inp);
  rVad?.stop();
  rVad = vad(src, (open) => {
    const t0 = f.c.currentTime; gate.gain.setTargetAtTime(open ? 1 : 0, t0, open ? 0.01 : 0.12);
    if (open) { quindar(true); carrier(true); } else { carrier(false); setTimeout(() => quindar(false), 90); }
    radio.peer = open; radio.vadOpen += open ? 1 : 0; emit('radio:talk', 'peer', open);
  }, { thr: 0.012, hang: 480 });
}
on('net:rtc', async (m) => {
  if (m.k === 'talk') { if (!rVad) { radio.peer = !!m.on; emit('radio:talk', 'peer', !!m.on); } return; }
  if (m.k === 'hi') { if (net.host) { teardown(); ensurePC(); } return; }
  if (!net.host && m.sid && m.sid !== sid) { if (pc) teardown(); sid = m.sid; }
  if (net.host && m.sid && m.sid !== sid) return; // mensaje de una sesión vieja
  const p = ensurePC();
  try {
    if (m.k === 'sdp') {
      const d = m.d, collision = d.type === 'offer' && (makingOffer || p.signalingState !== 'stable');
      ignoreOffer = !polite() && collision; if (ignoreOffer) return;
      await p.setRemoteDescription(d);
      if (d.type === 'offer') {
        tr = p.getTransceivers().find((x) => x.receiver.track.kind === 'audio') || tr;
        if (tr) { tr.direction = 'sendrecv'; if (micTrack) await tr.sender.replaceTrack(micTrack); }
        await p.setLocalDescription(); tx({ t: 'rtc', k: 'sdp', d: p.localDescription, sid });
      }
    } else if (m.k === 'ice') { try { await p.addIceCandidate(m.c); } catch (e) { if (!ignoreOffer) console.warn('ice', e); } }
  } catch (e) { console.warn('rtc', e); }
});
// El invitado pide el enlace ('hi'); el anfitrión crea la conexión y hace la oferta.
function maybeLink(force) { if (net.solo || !net.code || net.host || !peerOnline()) return; if (pc && !force) return; const now = performance.now(); if (now - hiT < 2500 && !force) return; hiT = now; if (pc) teardown(); tx({ t: 'rtc', k: 'hi' }); }
on('net:roster', () => maybeLink());
on('net:joined', () => setTimeout(maybeLink, 300));
on('net:back', () => { teardown(); setTimeout(() => maybeLink(true), 600); });
on('net:peer', (m) => { if (m.ev === 'away' || m.ev === 'left') teardown(); else if (m.ev === 'back') { teardown(); setTimeout(() => maybeLink(true), 600); } });
on('net:left', () => { teardown(); });

// ---------------- Micrófono ----------------
export const radioSupported = () => !!(navigator.mediaDevices?.getUserMedia && window.RTCPeerConnection);
export async function enableMic() {
  if (mic) { setMuted(false); return true; }
  if (!radioSupported()) { set('state', 'unsupported'); emit('radio:error', 'unsupported'); return false; }
  set('state', 'asking');
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  } catch (e) { mic = null; set('state', 'denied'); emit('radio:error', 'denied'); return false; }
  micTrack = mic.getAudioTracks()[0]; radio.muted = false; sendTrack();
  if (tr) await tr.sender.replaceTrack(micTrack).catch(() => {});
  const c = ctx(); if (c) {
    const src = c.createMediaStreamSource(mic);
    lVad = vad(src, (open) => { const on = open && !radio.muted && (radio.mode === 'open' || radio.ptt); setMe(on); }, { thr: 0.015, hang: 420 });
  }
  store.set('radioOn', true); set('state', 'on'); maybeLink();
  return true;
}
function setMe(on) { if (radio.me === on) return; radio.me = on; emit('radio:talk', 'me', on); tx({ t: 'rtc', k: 'talk', on }); }
export function setMuted(m) { radio.muted = !!m; sendTrack(); if (m) setMe(false); emit('radio:state', radio); }
export function setMode(mode) { radio.mode = mode; store.set('radioMode', mode); sendTrack(); emit('radio:state', radio); }
export function setPTT(down) { if (radio.ptt === down) return; radio.ptt = down; sendTrack(); if (!down) setMe(false); emit('radio:state', radio); }
// Si ya hay permiso concedido, re-encender sin preguntar
export async function autoMic() {
  if (!store.get('radioOn') || mic || !radioSupported()) return;
  try { const p = await navigator.permissions?.query({ name: 'microphone' }); if (p?.state === 'granted') enableMic(); } catch {}
}
export const micLevel = () => (radio.state === 'on' && !radio.muted && (radio.mode === 'open' || radio.ptt) ? lVad?.level() || 0 : 0);

on('store:vol', v => { if (fx) fx.out.gain.setTargetAtTime(1.15 * v.voice, fx.c.currentTime, 0.02); });
if (DEBUG) radio._fx = radioFx;
