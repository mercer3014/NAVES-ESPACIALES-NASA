// Targeted real renderer checks, not a physical-device or microphone test.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const [lang = 'en', w = '1024', h = '640', mobile = '0', fallback = '0'] = process.argv.slice(2);
const out = '../screenshots', tag = `${lang}_${w}x${h}${fallback === '1' ? '_fallback' : ''}`;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(), errors = [], warnings = [];
p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warnings.push(m.text()); });
try {
  await p.setViewport({ width: +w, height: +h, isMobile: mobile === '1', hasTouch: mobile === '1', deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(lang => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, lang, name: 'Alex', flag: { code: 'BO', mode: 'country' } })), lang);
  if (fallback === '1') { await p.setRequestInterception(true); p.on('request', r => /\/(astronaut-a7l|easep-props)\.glb/.test(r.url()) ? r.abort() : r.continue()); }
  await p.goto('http://localhost:8787/?phase=eva&sub=walk&debug&ts=6', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__evaDbg?.P.mode === 'walk', { timeout: 240000 });
  const info = await p.evaluate(() => { const { ast, science } = __evaDbg; return { model: ast.model, clips: Object.keys(ast.A || {}), sites: science?.sites.map(s => s.name), variants: science?.variants.length,
    lod0: ast.body.getObjectByName('Astronaut_LOD0')?.visible, lod1: ast.body.getObjectByName('Astronaut_LOD1')?.visible, stripes: ast.body.getObjectByName('CommanderStripes')?.visible }; });
  console.log('ASSETS', JSON.stringify(info));
  if (fallback === '1') { assert.equal(info.model, 'fallback'); assert.equal(info.sites, undefined); }
  if (fallback !== '1') { assert.equal(info.model, 'a7l-v2'); assert.equal(info.clips.length, 13); assert.ok(info.clips.includes('run') && info.clips.includes('low-g-jump') && info.clips.includes('walk')); assert.equal(info.variants, 4); assert.equal(info.sites.length, 3); assert.equal(info.stripes, false); if (mobile === '1') { assert.equal(info.lod0, false); assert.equal(info.lod1, true); } }
  await p.evaluate(() => { __evaDbg.P.act = null; __evaDbg.P.yaw = 0; __evaDbg.cam(0.35, 0.15, 3.3); });
  await new Promise(r => setTimeout(r, 2000));
  await p.screenshot({ path: `${out}/${process.env.QA_PREFIX || "70"}_A7L_${tag}.png` });
  if (fallback !== '1') {
    const movement = await p.evaluate(() => {
      const a = __evaDbg.ast;
      a.pose(.1, { speed: .5 }); const walk = a.A.walk.enabled;
      a.pose(.1, { speed: 1.4, air: true }); const hop = a.A['bunny-hop'].enabled;
      const patches = [], visors = []; a.body.traverse(o => { if (o.material?.name === 'FlagPatch') patches.push(o.material); if (o.material?.name === 'GoldVisor') visors.push(o.material); });
      const tex = patches[0]?.map, c = tex?.image, x = c?.getContext('2d');
      const px = y => x ? [...x.getImageData(200, y, 1, 1).data].slice(0, 3) : [];
      return { walk, hop, patch: !!tex && tex.flipY === false, red: px(50), yellow: px(250), green: px(450), visor: !!visors[0]?.envMap };
    });
    assert(movement.walk && movement.hop && movement.patch && movement.visor, 'locomotion, player patch, visor environment');
    assert(movement.red[0] > movement.red[1] && movement.yellow[0] > 150 && movement.yellow[1] > 150 && movement.green[1] > movement.green[0], 'Bolivia patch pixels');
    for (const [act, k] of [['climb', .5], ['step', .4], ['scoop', .55], ['hammer', .8], ['salute', 1], ['wave', .4], ['point', 1], ['fall', .5]]) {
      await p.evaluate((act, k) => __evaDbg.act(act, k), act, k); await new Promise(r => setTimeout(r, 250));
      const ok = await p.evaluate(() => { const a = __evaDbg.ast; return Object.values(a.bones).every(b => [...b.position, ...b.quaternion].every(Number.isFinite)); }); assert(ok, act + ' finite skeleton');
    }
    await p.evaluate(() => { const d = __evaDbg; delete d.P.dbgAct; d.P.act = null; });
    for (const name of ['PSEP', 'SWC', 'LRRR']) {
      await p.evaluate(name => { const d = __evaDbg, s = d.science.sites.find(s => s.name === name); Object.assign(d.P, { x: s.p.x, z: s.p.z + 1.1, y: d.ground(s.p.x, s.p.z + 1.1), act: null, air: false, vx: 0, vz: 0 }); d.cam(.5, .35, 4.5); }, name);
      await p.waitForFunction(() => getComputedStyle(document.querySelector('.sciencebtn')).display !== 'none', { timeout: 30000 });
      await p.click('.sciencebtn');
      await p.waitForFunction(() => __evaDbg.P.mode === 'walk', { timeout: 45000 });
      assert(await p.evaluate(name => __evaDbg.science.sites.find(s => s.name === name).done, name));
      await p.screenshot({ path: `${out}/${process.env.QA_PREFIX || "70"}_EASEP_${name}_${tag}.png` });
    }
    await p.evaluate(() => { const d = __evaDbg; for (let i = 0; i < 12; i++) d.footprint(d.P.x - 1 + i * .15, d.P.z + (i % 2) * .3, .5, i % 4 === 0); d.cam(.6, .7, 4); });
    assert(await p.evaluate(() => __evaDbg.fps.filter(m => m.count > 0).length >= 4), 'varied footprint batches');
    await p.screenshot({ path: `${out}/${process.env.QA_PREFIX || "70"}_footprints_${tag}.png` });
  }
  const realErrors = errors.filter(e => !/net::ERR_FAILED|favicon/.test(e));
  assert.equal(realErrors.length, 0, realErrors.join('\n'));
  console.log('PASS', tag, 'runtime errors:', realErrors.length, 'warnings:', warnings.length);
  if (warnings.length) console.log(warnings.join('\n'));
} catch (e) { console.error('FAIL', tag, e.message, 'runtime:', JSON.stringify(errors), 'warnings:', JSON.stringify(warnings)); throw e; } finally { await b.close(); }
