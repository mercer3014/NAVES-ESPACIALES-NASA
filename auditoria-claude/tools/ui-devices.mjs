// Auditoría de controles por dispositivo: teléfono (horizontal y vertical), tableta y portátil, en menú y fases jugables.
// Usa tools/ui-audit.js (solapes, fuera de pantalla, botones < 36 px, texto < 10.5 px) y guarda una captura por caso.
// Uso: node auditoria-claude/tools/ui-devices.mjs   (CASES y DEVS se pueden acotar por variable de entorno)
import { open, sleep, BASE } from './lib.mjs';
const DEVS = { 'tel-h': [844, 390, 1], 'tel-v': [390, 844, 1], 'tel-chico-h': [667, 375, 1], tablet: [1024, 768, 1], portatil: [1366, 768, 0] };
const CASES = { menu: '/?nointro', launch: '/?nointro&phase=launch', descent: '/?nointro&phase=descent', eva: '/?nointro&phase=eva', boss: '/?debug&boss=1&skip', cruise: '/?nointro&phase=cruise' };
const devs = (process.env.DEVS || Object.keys(DEVS).join(',')).split(','), cases = (process.env.CASES || Object.keys(CASES).join(',')).split(',');
for (const d of devs) {
  const [w, h, mob] = DEVS[d];
  const S = await open({ prefix: `ui-${d}`, mobile: !!mob, w, h });
  await S.p.evaluateOnNewDocument(() => { window.__auto = 1; });
  for (const c of cases) {
    try {
      await S.p.goto(BASE + CASES[c], { waitUntil: 'domcontentloaded' }); await sleep(c === 'menu' ? 5000 : c === 'eva' ? 26000 : 13000);
      const r = await S.p.evaluate(async (label) => { const { uiAudit } = await import('/tools/ui-audit.js'); const a = uiAudit(label);
        const tc = [...document.querySelectorAll('.tc-stick,.tc-throttle,.tc-btn,.bd-tc-stick,.bd-tcb,.actbtn,.jumpbtn')].filter((e) => e.offsetWidth > 0).map((e) => { const b = e.getBoundingClientRect(); return `${e.className.split(' ').slice(0, 3).join('.')} ${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`; });
        return { ...a, tactiles: tc, scr: document.body.dataset.screen, touch: document.body.classList.contains('touch') }; }, `${d}/${c}`);
      S.log('AUDIT', JSON.stringify(r)); await S.shot(c);
    } catch (e) { S.log('ERR', c, e.message.slice(0, 200)); }
  }
  await S.b.close();
}
