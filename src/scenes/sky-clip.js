// Clip-space z of the launch sky triangle.
// WebGL clips to [-w, w]. ANGLE on Windows (Chrome) has shipped builds that clip with
// D3D's zero-to-one range before that conversion, so z = 0 sits on the near plane:
// the whole sky is discarded and the cleared framebuffer is black. The test is on the
// boundary, so the same view flickers between sky and black as the camera cuts.
// z = 1 is the far plane and is clipped on the other side. 0.5 is inside both ranges.
export const SKY_CLIP_Z = 0.5;

export function skyVertexShader() {
  const z = SKY_CLIP_Z.toFixed(1);
  return `uniform mat4 invProj; uniform mat3 camRot; varying vec3 vD;
      void main(){ gl_Position=vec4(position.xy,${z},1.); vec4 r=invProj*vec4(position.xy,1.,1.); vD=normalize(camRot*r.xyz); }`;
}
