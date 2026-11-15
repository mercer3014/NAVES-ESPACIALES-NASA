// Auditoría rápida de la interfaz (solo desarrollo). En la consola del navegador:
//   const { uiAudit } = await import('/tools/ui-audit.js'); uiAudit('nombre')
// Informa de solapes entre controles/paneles, elementos fuera de pantalla, botones < 36 px y textos < 10.5 px.
// Ojo: paneles dentro de una zona con scroll pueden aparecer «fuera» o solapados aunque estén recortados.
export function uiAudit(label = '') {
  const W = innerWidth, H = innerHeight;
  const vis = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !el.closest('[aria-hidden=true]'); };
  const nm = (el) => el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 2).join('.') + (el.textContent.trim() ? ` "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 22)}"` : '');
  const box = (e) => e.getBoundingClientRect();
  const ctr = [...document.querySelectorAll('button,[role=button],input,select,.tc-stick,.tc-throttle,.mhud-card,.pausebox,.cgroup,.panel,.radio,.toast,.plb-letterbox-copy,[class*=gauge],[class*=readout]')].filter(vis);
  const C = ctr.filter((el) => !ctr.some((o) => o !== el && o.contains(el)));
  const solapes = [];
  for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
    const a = box(C[i]), b = box(C[j]); const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (x > 6 && y > 6) solapes.push(`${nm(C[i])} ∩ ${nm(C[j])} ${Math.round(x)}x${Math.round(y)}`);
  }
  const fuera = C.filter((e) => { const r = box(e); return r.right > W + 2 || r.left < -2 || r.bottom > H + 2 || r.top < -2; }).map(nm);
  const chicos = [...document.querySelectorAll('button,[role=button],a')].filter(vis).filter((e) => { const r = box(e); return r.height < 36 || r.width < 36; }).map((e) => `${nm(e)} ${Math.round(box(e).width)}x${Math.round(box(e).height)}`);
  const texto = [...new Set([...document.querySelectorAll('body *')].filter(vis).filter((e) => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 10.5).map((e) => `${nm(e)} ${getComputedStyle(e).fontSize}`))];
  return { label, W, H, solapes: solapes.slice(0, 15), fuera: fuera.slice(0, 10), botonesChicos: chicos.slice(0, 12), textoMenor10px: texto.slice(0, 10) };
}
