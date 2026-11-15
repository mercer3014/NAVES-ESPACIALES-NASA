// Single-scattering dust sky. The sun vector is shared with the shadow light so the disk and the shadows agree.
import { MARS_SUN, MARS_HORIZON } from './mars-terrain.js';

const VERT = /* glsl */`varying vec3 vD;
void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

const FRAG = /* glsl */`uniform vec3 sun;
uniform float storm;
varying vec3 vD;
void main(){
  vec3 rd=normalize(vD);
  float h=rd.y;
  float mu=dot(rd,sun);
  float zen=max(h,-0.05);
  float od=exp(-2.6*zen);
  vec3 high=mix(vec3(0.30,0.11,0.06),vec3(0.16,0.07,0.05),storm);
  vec3 dust=mix(vec3(0.93,0.55,0.30),vec3(0.55,0.28,0.16),storm);
  float ray=0.62+0.38*mu*mu;
  float mie=pow(max(mu,0.),6.0);
  vec3 col=mix(high,dust,clamp(od,0.,1.));
  col*=0.78+0.42*ray;
  col+=vec3(1.0,0.62,0.30)*mie*(0.55-storm*0.25);
  float disk=smoothstep(0.9992,0.9997,mu);
  col+=vec3(1.0,0.86,0.62)*disk*(1.6-storm);
  col+=vec3(1.0,0.72,0.4)*pow(max(mu,0.),180.0)*1.3;
  if(h<0.){
    vec3 ground=mix(vec3(0.34,0.15,0.07),vec3(0.18,0.08,0.05),storm);
    col=mix(col,ground,smoothstep(0.,-0.28,h));
  }
  gl_FragColor=vec4(col,1.);
}`;

export function createSky(THREE) {
  const sun = new THREE.Vector3(MARS_SUN.x, MARS_SUN.y, MARS_SUN.z).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: { sun: { value: sun }, storm: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(980, 36, 24), mat);
  mesh.frustumCulled = false;
  mesh.userData.noShadow = true;
  return {
    mesh,
    sun,
    horizon: new THREE.Color(MARS_HORIZON),
    setStorm(k) { mat.uniforms.storm.value = k; },
    dispose() { mesh.geometry.dispose(); mat.dispose(); },
  };
}
