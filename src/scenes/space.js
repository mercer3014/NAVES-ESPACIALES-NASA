// Entorno espacial reutilizable: cielo, estrellas que titilan, galaxias procedurales, Tierra con día/noche, Luna, Sol
import { THREE, tex, Q } from '../core/engine.js';
export function skySphere(r = 900) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), new THREE.MeshBasicMaterial({ map: tex(`/tex/stars_${Q.high ? '4k' : '2k'}.jpg`), side: THREE.BackSide, depthWrite: false, color: 0x8899aa }));
  m.renderOrder = -10; return m;
}
export function twinkleStars(n = Q.high ? 6000 : 2500, r = 800) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, q = Math.sqrt(1 - u * u);
    p.set([r * q * Math.cos(th), r * u, r * q * Math.sin(th)], i * 3); s[i] = Math.random();
    const tint = Math.random(); c.set(tint < 0.15 ? [1, 0.8, 0.6] : tint < 0.3 ? [0.7, 0.8, 1] : [1, 1, 1], i * 3);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(s, 1)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, px: { value: Math.min(devicePixelRatio, 2) }, warp: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `attribute float seed; uniform float t,px; varying float a; varying vec3 vc;
      void main(){ vc=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
      float tw=.55+.45*sin(t*(1.+seed*3.)+seed*40.); a=tw*(.35+.65*seed); gl_PointSize=(1.+2.6*seed*seed)*px; }`,
    fragmentShader: `varying float a; varying vec3 vc; void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); if(r>.5) discard; gl_FragColor=vec4(vc,a*smoothstep(.5,0.,r)); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.tick = (dt, t) => (mat.uniforms.t.value = t); return pts;
}
export function galaxy({ n = Q.high ? 9000 : 3500, arms = 3, radius = 60, spin = 1.4, c1 = 0xffd9a0, c2 = 0x6a8cff, seed = 1 } = {}) {
  let s = seed; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), col = new Float32Array(n * 3); const A = new THREE.Color(c1), B = new THREE.Color(c2), tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = Math.pow(R(), 1.6) * radius, arm = (i % arms) / arms * Math.PI * 2, ang = arm + r / radius * spin * Math.PI * 2;
    const sc = Math.pow(R(), 3) * (R() < .5 ? 1 : -1) * (radius * 0.18) * (1 - r / radius * 0.6);
    p.set([Math.cos(ang) * r + sc, (R() - .5) * radius * 0.05 * (1 - r / radius), Math.sin(ang) * r + Math.pow(R(), 3) * (R() < .5 ? 1 : -1) * radius * 0.18], i * 3);
    tmp.copy(A).lerp(B, r / radius); col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: radius / 90, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, map: dotTex() });
  const pts = new THREE.Points(g, m); pts.userData.tick = (dt) => (pts.rotation.y += dt * 0.02); return pts;
}
let _dot; export function dotTex() {
  if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, '#fffc'); gr.addColorStop(1, '#fff0'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_dot = new THREE.CanvasTexture(c));
}
export function glowSprite(color = 0xffeecc, size = 40, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s;
}
export function earth(radius = 10, sunDir = new THREE.Vector3(1, 0.2, 0.4).normalize()) {
  const grp = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { day: { value: tex(`/tex/earth_day_${Q.high ? '4k' : '2k'}.jpg`) }, night: { value: tex('/tex/earth_night_2k.jpg') }, sun: { value: sunDir } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform sampler2D day,night; uniform vec3 sun; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float l=dot(vN,sun); float k=smoothstep(-.15,.25,l); vec3 d=texture2D(day,vUv).rgb; vec3 n=texture2D(night,vUv).rgb*vec3(1.,.85,.6)*1.4;
      vec3 c=mix(n*(1.-k),d*(.15+1.1*max(l,0.)),k); float f=pow(1.-max(dot(vN,vV),0.),3.); c+=vec3(.3,.55,1.)*f*k*.8;
      vec3 h=normalize(sun+vV); c+=vec3(.6,.7,.8)*pow(max(dot(vN,h),0.),40.)*k*.25; gl_FragColor=vec4(c,1.); }`,
  });
  mat.uniforms.day.value.colorSpace = THREE.SRGBColorSpace;
  const e = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), mat); grp.add(e);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 64, 48), new THREE.MeshLambertMaterial({ alphaMap: tex('/tex/earth_clouds_2k.jpg', { srgb: false }), transparent: true, opacity: 0.85, depthWrite: false, color: 0xffffff }));
  grp.add(clouds);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 48, 32), new THREE.ShaderMaterial({
    uniforms: { sun: { value: sunDir } }, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.); vP=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 sun; varying vec3 vN; varying vec3 vP; void main(){ vec3 v=normalize(cameraPosition-vP); float d=max(0.,-dot(vN,v)); float f=pow(d,2.)*2.2; float s=.2+.8*smoothstep(-.35,.5,dot(vN,sun)); gl_FragColor=vec4(vec3(.35,.6,1.)*f*s,1.); }`,
  }));
  grp.add(atm);
  grp.userData.tick = (dt) => { e.rotation.y += dt * 0.02; clouds.rotation.y += dt * 0.026; };
  return grp;
}
export function moon(radius = 2.7) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshStandardMaterial({ map: tex('/tex/moon_2k.jpg'), roughness: 1, metalness: 0, bumpMap: tex('/tex/moon_2k.jpg', { srgb: false }), bumpScale: 0.6 }));
  m.userData.tick = (dt) => (m.rotation.y += dt * 0.01); return m;
}
export function tickAll(root, dt, t) { root.traverse((o) => o.userData.tick && o.userData.tick(dt, t)); }
