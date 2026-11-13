// Efectos compartidos: humo/vapor/polvo por GPU (sprites suaves instanciados), penacho de escape por capas,
// destellos y post-proceso (bloom + calor) solo en calidad alta. Todo pensado para que en móvil cueste poco.
import { THREE, renderer, Q } from '../core/engine.js';
import { plumeBloom } from '../render/grade.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const TAIL = `#include <tonemapping_fragment>
#include <colorspace_fragment>`;
const NOISE = `float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=.5; } return s; }`;

// ---- Atlas 2×2 de bocanadas: nubes suaves con detalle (alfa = densidad, rojo = relieve para sombrear) ----
let _puff;
export function puffTex() {
  if (_puff) return _puff;
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S * 2; const x = c.getContext('2d');
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 4; k++) {
    const ox = (k % 2) * S, oy = (k >> 1) * S;
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7) * S * 0.27, rr = S * (0.07 + r() * 0.15);
      const cx = ox + S / 2 + Math.cos(a) * d, cy = oy + S / 2 + Math.sin(a) * d * 0.9;
      const v = 150 + r() * 105 | 0, g = x.createRadialGradient(cx, cy - rr * 0.2, 0, cx, cy, rr);
      g.addColorStop(0, `rgba(${v},${v},${v},0.55)`); g.addColorStop(0.6, `rgba(${v},${v},${v},0.25)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = g; x.fillRect(ox, oy, S, S);
    }
  }
  // recorte radial suave para que nunca se vea el borde del sprite
  const id = x.getImageData(0, 0, S * 2, S * 2), d = id.data;
  for (let y = 0; y < S * 2; y++) for (let xx = 0; xx < S * 2; xx++) {
    const u = ((xx % S) + 0.5) / S - 0.5, v = ((y % S) + 0.5) / S - 0.5, rr = Math.hypot(u, v) * 2; const f = Math.max(0, 1 - rr); const i = (y * S * 2 + xx) * 4;
    d[i + 3] = Math.min(255, d[i + 3] * 1.5 * f * f * (3 - 2 * f));
  }
  x.putImageData(id, 0, 0);
  _puff = new THREE.CanvasTexture(c); _puff.colorSpace = THREE.NoColorSpace; return _puff;
}

// ---- Partículas GPU: la CPU solo escribe la ranura al nacer; la posición se integra en el vertex shader ----
// emit(p, v, size, {grow, life, buoy, col:[r,g,b], a, spin})
export function makePuffs({ n = 600, additive = false, drag = 0.5, lit = true, fadeIn = 0.08, fadeOut = 0.45, near = 4, nearK = 0, glow = null, stretch = 0, soft = false, radial = false } = {}) {
  const g = new THREE.InstancedBufferGeometry(); const base = new THREE.PlaneGeometry(1, 1);
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const mk = (sz) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * sz), sz); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const A0 = mk(4), A1 = mk(4), A2 = mk(4), A3 = mk(4);
  for (let i = 0; i < n; i++) A0.array[i * 4 + 3] = -1e6; // nunca nacidas
  g.setAttribute('a0', A0); g.setAttribute('a1', A1); g.setAttribute('a2', A2); g.setAttribute('a3', A3); g.instanceCount = n;
  const U = {
    uT: { value: 0 }, uDrag: { value: drag }, uTex: { value: puffTex() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color(1, 0.95, 0.85) }, uAmb: { value: new THREE.Color(0.4, 0.44, 0.52) },
    uGlowP: { value: new THREE.Vector3() }, uGlowC: { value: new THREE.Color(1.6, 0.7, 0.25) }, uGlowK: { value: 0 }, uGlowR: { value: 60 },
    uFogC: { value: new THREE.Color(0x9fb4c8) }, uFogN: { value: 600 }, uFogF: { value: 9000 }, uFade: { value: new THREE.Vector3(fadeIn, fadeOut, near) }, uNearK: { value: nearK }, uStretch: { value: stretch }, uRad: { value: new THREE.Vector4(0, 0, 0, 1e9) },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    defines: { LIT: lit ? 1 : 0, STRETCH: stretch ? 1 : 0, SOFT: soft ? 1 : 0, RADF: radial ? 1 : 0 },
    vertexShader: `attribute vec4 a0,a1,a2,a3; uniform float uT,uDrag,uStretch; uniform vec4 uRad; uniform vec3 uSun,uGlowP; uniform float uGlowK,uGlowR;
      varying vec2 vUv,vC; varying float vAge,vDist,vGlow,vSz; varying vec4 vCol; varying vec3 vSunV; varying float vCell; varying float vRad;
      void main(){ float age=uT-a0.w, life=a2.y; if(age<0.||age>life){ gl_Position=vec4(2.,2.,2.,1.); return; }
        vec3 wp=a0.xyz+a1.xyz*(1.-exp(-uDrag*age))/uDrag; wp.y+=.5*a2.z*age*age;
        float sz=a1.w*(1.+a2.x*pow(age,.75)); vec4 mv=viewMatrix*vec4(wp,1.);
        float sd=a2.w; float rot=fract(sd*3.17)*6.283+age*(fract(sd*7.31)-.5)*.6; float c=cos(rot), s=sin(rot);
        vec2 q=vec2(c*position.x-s*position.y, s*position.x+c*position.y);
        #if STRETCH==1
          // estela: el quad se alarga en pantalla a lo largo de la velocidad (láminas radiales en vez de bolas)
          vec3 vel=a1.xyz*exp(-uDrag*age); vel.y+=a2.z*age; vec2 vv=(viewMatrix*vec4(vel,0.)).xy; float vl=length(vv);
          vec2 dir=vl>1e-3?vv/vl:vec2(1.,0.); float st=1.+uStretch*vl/max(sz,.05)*.12; q=vec2(position.x*st, position.y*(.55+.45/st)); q=vec2(dir.x*q.x-dir.y*q.y, dir.y*q.x+dir.x*q.y); rot=0.;
        #endif
        mv.xy+=q*sz; gl_Position=projectionMatrix*mv;
        vUv=uv; vC=q; vAge=age/life; vDist=-mv.z; vSz=sz; vCol=a3;
        vGlow=uGlowK*exp(-distance(wp,uGlowP)/uGlowR); vSunV=normalize((viewMatrix*vec4(uSun,0.)).xyz); vCell=floor(fract(sd*13.7)*4.); vRad=1.;
        #if RADF==1
          vRad=1.-smoothstep(uRad.w*.3,uRad.w,distance(wp.xz,uRad.xz));
        #endif
      }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uSunC,uAmb,uGlowC,uFogC; uniform float uFogN,uFogF; uniform vec3 uFade; uniform float uNearK;
      varying vec2 vUv,vC; varying float vAge,vDist,vGlow,vSz; varying vec4 vCol; varying vec3 vSunV; varying float vCell; varying float vRad;
      void main(){ vec2 uv=(vUv+vec2(mod(vCell,2.),floor(vCell/2.)))*.5; vec4 tx=texture2D(uTex,uv);
        float a=tx.a*vCol.a*smoothstep(0.,uFade.x,vAge)*(1.-smoothstep(1.-uFade.y,1.,vAge))*smoothstep(max(uFade.z,vSz*uNearK)*.5,max(uFade.z,vSz*uNearK)*2.,vDist);
        a*=vRad;
        #if SOFT==1
          // láminas suaves: ruido continuo a lo largo del ancho, bordes gaussianos (nada de bandas duras)
          float yy=vUv.y*6.+vCell*1.7; float i0=floor(yy), fy=fract(yy); float h0=fract(sin(i0*12.9898+vCell*7.31)*43758.5453), h1=fract(sin((i0+1.)*12.9898+vCell*7.31)*43758.5453);
          float e=abs(vUv.y*2.-1.); a*=(.62+.5*mix(h0,h1,fy*fy*(3.-2.*fy)))*exp(-e*e*2.2)*(1.-smoothstep(.55,1.,abs(vUv.x*2.-1.)));
        #elif STRETCH==1
          float sl=fract(sin(floor(vUv.y*11.)*12.9898+vCell*7.31)*43758.5453); a*=(.35+1.1*sl)*(1.-abs(vUv.y*2.-1.)*.6);
        #endif
        if(a<.003) discard;
        vec3 col=vCol.rgb;
        #if LIT==1
          vec2 p=vC*2.; vec3 nn=vec3(p, sqrt(max(0.,1.-dot(p,p)))); float dif=clamp(dot(nn,vSunV)*.75+.3,0.,1.); float under=.78+.22*clamp(vC.y*1.4+.5,0.,1.); // panza de la nube más oscura
          col*= (uAmb*under+uSunC*dif*.85)*(.5+.6*tx.r);
        #else
          col*=(.7+.5*tx.r);
        #endif
        col+=uGlowC*vGlow*(1.-vAge*.7); float f=smoothstep(uFogN,uFogF,vDist); col=mix(col,uFogC,f);
        gl_FragColor=vec4(col,a);
        ${TAIL} }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = additive ? 3 : 2;
  let i = 0, T = 0, lo = n, hi = -1, wrapped = false;
  const api = {
    mesh, U, n,
    emit(p, v, size, { grow = 1, life = 8, buoy = 0, col = [1, 1, 1], a = 1 } = {}) {
      const k = i; i = (i + 1) % n; if (i === 0) wrapped = true; lo = Math.min(lo, k); hi = Math.max(hi, k);
      A0.array.set([p.x, p.y, p.z, T], k * 4); A1.array.set([v.x, v.y, v.z, size], k * 4);
      A2.array.set([grow, life, buoy, Math.random() * 100], k * 4); A3.array.set([col[0], col[1], col[2], a], k * 4);
    },
    update(dt, cam, scene) {
      T += dt; U.uT.value = T;
      if (hi >= 0) { for (const A of [A0, A1, A2, A3]) { A.clearUpdateRanges(); if (wrapped) A.addUpdateRange(0, n * 4); else A.addUpdateRange(lo * 4, (hi - lo + 1) * 4); A.needsUpdate = true; } lo = n; hi = -1; wrapped = false; }
      if (scene?.fog) { U.uFogC.value.copy(scene.fog.color); U.uFogN.value = scene.fog.near; U.uFogF.value = scene.fog.far; }
    },
    dirtyAll() { wrapped = true; hi = Math.max(hi, 0); },
    clear() { for (let k = 0; k < n; k++) A0.array[k * 4 + 3] = -1e6; wrapped = true; hi = 0; },
  };
  return api;
}

// ---- Penacho de escape por capas: núcleo caliente por tobera (instanciado) + envolvente común con ruido ----
// layout: [[x,z],...] posiciones de las toberas; r0 radio de salida; cfg de color y largo
export function makePlume({ layout, r0, len = 30, outerR = 6, outerLen = 70, hot = [1, 0.92, 0.75], warm = [1, 0.5, 0.12], intensity = 5, sheath = 0.0, vacBoost = 0, seg = Q.high ? 24 : 14 } = {}) {
  const grp = new THREE.Group();
  const cyl = new THREE.CylinderGeometry(1, 1, 1, seg, Q.high ? 24 : 12, true); cyl.translate(0, -0.5, 0);
  const mkMat = (layer) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, // premultiplicado: añade luz y además tapa el cielo claro (si no, el naranja se pierde de día)
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { t: { value: 0 }, k: { value: 0 }, r0: { value: layer ? outerR : r0 }, r1: { value: layer ? outerR * 1.6 : r0 * 1.4 }, L: { value: layer ? outerLen : len }, I: { value: layer ? intensity * 0.45 : intensity },
      cH: { value: new THREE.Vector3(...hot) }, cW: { value: new THREE.Vector3(...warm) }, vac: { value: 0 }, sheath: { value: sheath }, flick: { value: 1 }, vb: { value: vacBoost } },
    vertexShader: `attribute float aK; uniform float k,r0,r1,L,vac; varying float vS,vA,vK; varying vec3 vN,vV;
      void main(){ float s=-position.y; float kk=k
        #ifdef USE_INSTANCING
          *aK
        #endif
        ; float rr=mix(r0, r1*(1.+vac*3.5), pow(s,.55+vac*.3))*(1.+.1*sin(s*20.)*(1.-vac)); vec3 p=vec3(position.x*rr, -s*L*max(kk,.05)*(1.+vac*.6), position.z*rr);
        vec4 wp=vec4(p,1.);
        #ifdef USE_INSTANCING
          wp=instanceMatrix*wp;
        #endif
        vec4 mv=modelViewMatrix*wp; gl_Position=projectionMatrix*mv; vS=s; vA=atan(position.z,position.x); vK=kk;
        vN=normalize(normalMatrix*vec3(position.x,0.,position.z)); vV=normalize(-mv.xyz); }`,
    fragmentShader: `uniform float t,I,vac,sheath,flick,vb; uniform vec3 cH,cW; varying float vS,vA,vK; varying vec3 vN,vV;
      ${NOISE}
      void main(){ if(vK<.01) discard; float fr=abs(dot(vN,vV)); float s=vS;
        float n=fbm(vec2(vA*2.+s*1.5, s*9.-t*14.)); float n2=vn(vec2(vA*5., s*25.-t*40.));
        float prof=smoothstep(0.,.025,s)*pow(1.-s, ${'1.6'})*(.55+.6*n)*(.85+.3*n2*flick);
        float sh=mix(1., smoothstep(.02,.12,s), sheath); // película oscura rica en combustible a la salida de la F-1
        vec3 c=mix(cH, cW, smoothstep(.0,.55,s+n*.25)); c=mix(c, c*vec3(.55,.75,1.25), vac);
        float x=clamp(s,0.,1.); float frc=fract(x*6.5); float band=exp(-pow(frc-.22,2.)*28.); float gate=smoothstep(.06,.2,x)*(1.-x);
        float mach=band*(1.-clamp(vac,0.,1.))*gate; // discos de Mach: misma curva que machDisk() en render/grade.js
        float core=exp(-pow(1.-fr,2.)*3.2)*(1.-smoothstep(0.,.5,s));
        c=mix(c, vec3(1.,.97,.93), clamp(core*.7,0.,.75)); c+=vec3(1.,.92,.72)*mach*.95;
        float a=prof*pow(fr, 1.4-.7*vb*vac)*vK*sh*(1.+.6*vb*vac); a=clamp(a+mach*.28*(1.-vac),0.,1.); gl_FragColor=vec4(c*I*(1.+vb*vac)*a, clamp(a*1.6,0.,1.)*.85);
        ${TAIL} }`,
  });
  const coreM = mkMat(0), outM = mkMat(1);
  const geo = cyl.clone(); geo.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(layout.length).fill(1), 1));
  const core = new THREE.InstancedMesh(geo, coreM, layout.length); const dm = new THREE.Object3D();
  layout.forEach(([x, z], i) => { dm.position.set(x, 0, z); dm.updateMatrix(); core.setMatrixAt(i, dm.matrix); }); core.frustumCulled = false; core.renderOrder = 4;
  const outer = new THREE.Mesh(cyl, outM); outer.frustumCulled = false; outer.renderOrder = 4;
  grp.add(outer, core);
  const api = {
    group: grp, core, outer, coreM, outM,
    setEngines(ks) { const a = geo.attributes.aK; ks.forEach((v, i) => (a.array[i] = v)); a.needsUpdate = true; },
    set(k, { vac = 0, t = 0 } = {}) { for (const m of [coreM, outM]) { m.uniforms.k.value = k; m.uniforms.vac.value = vac; m.uniforms.t.value = t; } grp.visible = k > 0.005; },
  };
  return api;
}

// ---- Destellos (separación de etapas, encendidos) ----
let _flareT;
function flareTex() {
  if (_flareT) return _flareT; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(0.12, '#fff8e0'); g.addColorStop(0.35, 'rgba(255,190,110,.45)'); g.addColorStop(1, 'rgba(255,140,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return (_flareT = new THREE.CanvasTexture(c));
}
export function makeFlashes(scene, n = 4) {
  const pool = Array.from({ length: n }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
    s.visible = false; s.renderOrder = 5; scene.add(s);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5; scene.add(ring);
    return { s, ring, t: 9, d: 1, size: 1 };
  });
  const light = new THREE.PointLight(0xffd8a0, 0, 400, 1.5); scene.add(light); let k = 0;
  return {
    fire(pos, size = 30, dur = 0.5, color = 0xffffff) {
      const f = pool[k = (k + 1) % n]; f.s.position.copy(pos); f.ring.position.copy(pos); f.t = 0; f.d = dur; f.size = size;
      f.s.material.color.set(color); f.ring.material.color.set(color); f.s.visible = f.ring.visible = true; light.position.copy(pos); light.intensity = 9000 * (size / 30);
    },
    update(dt) {
      let any = false;
      for (const f of pool) {
        if (!f.s.visible && !f.ring.visible) continue;
        f.t += dt; const u = f.t / f.d; const ur = f.t / (f.d * 1.35);
        if (u >= 1) f.s.visible = false; else { any = true; f.s.material.opacity = Math.pow(1 - u, 1.6); f.s.scale.setScalar(f.size * (0.6 + u * 0.8)); }
        if (ur >= 1) f.ring.visible = false; else { any = true; f.ring.material.opacity = Math.pow(1 - ur, 1.5) * 0.9; f.ring.scale.setScalar(f.size * (0.28 + ur * 1.7)); }
      }
      light.intensity *= Math.exp(-dt * 9); if (!any && light.intensity < 1) light.intensity = 0;
    },
  };
}

// ---- Post-proceso: bloom + distorsión de calor (máscara elíptica en pantalla). Solo calidad alta. ----
export function makePost(scene, camera, opts = {}) {
  const tuned = plumeBloom(!!Q.high);
  if (!tuned) return null;
  // The composer owns its buffers. A hand-sized target is treated as CSS pixels and then multiplied by the pixel ratio again.
  const comp = new EffectComposer(renderer);
  if (opts.msaa !== false) { comp.renderTarget1.samples = 4; comp.renderTarget2.samples = 4; }
  comp.setPixelRatio(renderer.getPixelRatio()); comp.setSize(innerWidth, innerHeight);
  comp.addPass(new RenderPass(scene, camera));
  const haze = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uC: { value: new THREE.Vector2(0.5, 0.3) }, uR: { value: new THREE.Vector2(0.1, 0.2) }, uK: { value: 0 }, uAsp: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uK; uniform vec2 uC,uR; varying vec2 vUv; ${NOISE}
      void main(){ vec2 d=(vUv-uC)/uR; float m=uK*exp(-dot(d,d)*1.5); vec2 uv=vUv;
        if(m>.002){ vec2 q=vUv*vec2(60.,30.); uv+=vec2(vn(q+vec2(0.,-uT*9.))-.5, vn(q*1.3+vec2(4.,-uT*11.))-.5)*m*.012; }
        gl_FragColor=texture2D(tDiffuse,uv); }`,
  });
  comp.addPass(haze);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), opts.strength ?? tuned.strength, opts.radius ?? tuned.radius, opts.threshold ?? tuned.threshold); comp.addPass(bloom);
  comp.addPass(new OutputPass());
  return {
    comp, haze, bloom,
    render(dt) { haze.uniforms.uT.value += dt; haze.enabled = haze.uniforms.uK.value > 0.002; comp.render(dt); },
    setSize(w, h) { comp.setPixelRatio(renderer.getPixelRatio()); comp.setSize(w, h); },
    dispose() { comp.dispose(); },
  };
}
