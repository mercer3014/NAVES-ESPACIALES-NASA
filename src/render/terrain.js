// Relieve de dunas para un MeshStandardMaterial. No sustituye mallas ni texturas de artista.
const DUNE = `float dH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float dN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dH(i),dH(i+vec2(1.,0.)),f.x),mix(dH(i+vec2(0.,1.)),dH(i+vec2(1.,1.)),f.x),f.y);}
float dF(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*dN(p);p=p*2.02+13.7;a*=.5;}return s;}`;

export function patchDunes(material) {
  if (!material?.isMaterial) return material;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDuneW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDuneW=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vDuneW;\n${DUNE}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 w=vDuneW.xz; float e=.4; float h0=dF(w*.07); float hx=dF((w+vec2(e,0.))*.07); float hz=dF((w+vec2(0.,e))*.07);
          vec3 dn=vec3(-(hx-h0)/e,0.,-(hz-h0)/e)*.9;
          normal=normalize(normal+(viewMatrix*vec4(dn,0.)).xyz);
          diffuseColor.rgb*=.84+.32*h0; }`);
  };
  const prevKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}|dunes-v1`;
  material.needsUpdate = true;
  return material;
}

export function duneCacheKey(material) {
  return material?.customProgramCacheKey?.() || '';
}
