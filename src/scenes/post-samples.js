// Multisample count for the launch EffectComposer targets.
// Those targets are RGBA16F. samples > 0 allocates a multisampled half-float buffer.
// SwiftShader reports that format as supported, so a headless run stays bright.
// Windows ANGLE/D3D often cannot resolve it: the framebuffer is incomplete and the
// OutputPass samples black, or the resolve flickers, even when the driver advertises
// the sample count. Bloom stays in half-float; only the MSAA resolve is dropped.
export const COMPOSER_SAMPLES = 0;
