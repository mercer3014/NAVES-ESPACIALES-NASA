"""Photographic PBR detail for existing UV atlases. Apollo beta cloth, Saturn paint, LM kapton.

Build-machine only. The production image only ships the packed files in public/models.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

def save(path, arr):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGB').save(path, 'WEBP', quality=76, method=6)

def weave_normal(size, n=18):
    yy, xx = np.mgrid[0:size, 0:size]
    cell = size / n
    fx = (xx % cell) / cell
    fy = (yy % cell) / cell
    # basket weave: alternate raised warps
    warp = np.sin(fx * np.pi) ** 1.4
    weft = np.sin(fy * np.pi) ** 1.4
    odd = ((xx // cell + yy // cell) % 2) == 0
    height = np.where(odd, warp * 0.85, weft * 0.85)
    # thread ridge
    height += 0.15 * np.sin(xx / cell * np.pi * 6) * odd + 0.15 * np.sin(yy / cell * np.pi * 6) * (~odd)
    gy, gx = np.gradient(height.astype(np.float32))
    nx, ny, nz = -gx * 2.2, -gy * 2.2, np.ones_like(gx)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([(nx / norm * 0.5 + 0.5) * 255, (ny / norm * 0.5 + 0.5) * 255, (nz / norm * 0.5 + 0.5) * 255], -1)
    return rgb

def enhance_suit(src_dir, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    base = np.asarray(Image.open(src_dir / 'astronaut_basecolor.webp').convert('RGB')).astype(np.float32)
    normal = np.asarray(Image.open(src_dir / 'astronaut_normal.webp').convert('RGB')).astype(np.float32)
    orm = np.asarray(Image.open(src_dir / 'astronaut_orm.webp').convert('RGB')).astype(np.float32)
    h, w = base.shape[:2]
    lum = base.mean(2)
    mx, mn = base.max(2), base.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    cloth = (lum > 150) & (sat < 0.18)
    wn = weave_normal(512, 42)
    reps = int(np.ceil(h / wn.shape[0]))
    tiled = np.tile(wn, (reps, reps, 1))[:h, :w]
    delta = tiled - 128
    mask = cloth.astype(np.float32)
    n = normal.copy()
    n[:, :, 0] = np.clip(n[:, :, 0] + delta[:, :, 0] * 0.48 * mask, 0, 255)
    n[:, :, 1] = np.clip(n[:, :, 1] + delta[:, :, 1] * 0.48 * mask, 0, 255)
    n[:, :, 2] = np.clip(n[:, :, 2] - np.abs(delta[:, :, 0]) * 0.22 * mask, 180, 255)
    # albedo: ivory beta cloth, weave shading, a little lunar dust in the gray boots
    wc = tiled.mean(2) / 128.0
    alb = base.copy()
    shade = 0.93 + 0.07 * wc
    alb[cloth] *= shade[cloth][:, None]
    # warm the white a hair toward sunlit beta cloth (Apollo photos are cream, not blue-gray)
    alb[:, :, 0] = np.where(cloth, np.clip(alb[:, :, 0] * 1.02, 0, 255), alb[:, :, 0])
    alb[:, :, 2] = np.where(cloth, np.clip(alb[:, :, 2] * 0.97, 0, 255), alb[:, :, 2])
    rough = orm.copy()
    rough[:, :, 1] = np.where(cloth, np.clip(orm[:, :, 1] * (0.82 + 0.18 * (1 - (wc - 0.9))), 0, 255), orm[:, :, 1])
    save(out_dir / 'astronaut_basecolor.webp', alb)
    save(out_dir / 'astronaut_normal.webp', n)
    save(out_dir / 'astronaut_orm.webp', rough)
    print('suit', out_dir)

def paint(size, dark=False):
    rng = np.random.default_rng(7 if not dark else 11)
    noise = rng.random((size, size)).astype(np.float32)
    # cheap blur via stride average
    k = noise.reshape(size // 8, 8, size // 8, 8).mean((1, 3))
    k = np.repeat(np.repeat(k, 8, 0), 8, 1)
    yy, xx = np.mgrid[0:size, 0:size]
    seam_y = (yy % 96) < 2
    seam_x = (xx % 140) < 2
    rivet = ((yy % 96) == 18) & ((xx % 28) < 2)
    if dark:
        base = 18 + k * 10
    else:
        base = 214 + k * 22
    img = np.stack([base, base * (0.99 if not dark else 1), base * (0.96 if not dark else 1)], -1)
    img[seam_y | seam_x] *= 0.55 if not dark else 0.45
    img[rivet] *= 0.62
    # slight soot streak
    soot = (np.sin(xx / 40) * 0.5 + 0.5) * (yy > size * 0.82)
    img *= (1 - soot[:, :, None] * (0.18 if not dark else 0.05))
    return img

def enhance_saturn(src_dir, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    save(out_dir / 'paint_white.webp', paint(1024, False))
    save(out_dir / 'paint_black.webp', paint(1024, True))
    print('saturn', out_dir)

def enhance_lm(src_dir, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    npath = src_dir / 'foil_normal.webp'
    if not npath.exists():
        print('no foil'); return
    n = np.asarray(Image.open(npath).convert('RGB')).astype(np.float32)
    v = n / 255 * 2 - 1
    h, w = v.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    crinkle = np.sin(xx * 0.37) * np.cos(yy * 0.29) + 0.6 * np.sin(xx * 1.3 + yy * 0.8)
    gy, gx = np.gradient(crinkle.astype(np.float32))
    v[:, :, 0] = v[:, :, 0] * 1.45 + gx * 0.35
    v[:, :, 1] = v[:, :, 1] * 1.45 + gy * 0.35
    v[:, :, 2] = np.clip(v[:, :, 2], 0.15, 1)
    ln = np.sqrt((v ** 2).sum(2, keepdims=True))
    v = v / np.maximum(ln, 1e-6)
    rgb = (v * 0.5 + 0.5) * 255
    save(out_dir / 'foil_normal.webp', rgb)
    gpath = src_dir / 'foil_gold_albedo.webp'
    if gpath.exists():
        g = np.asarray(Image.open(gpath).convert('RGB')).astype(np.float32)
        shade = 0.86 + 0.14 * (crinkle - crinkle.min()) / (np.ptp(crinkle) + 1e-6)
        # kapton is amber, not flat yellow
        g = g * shade[:, :, None]
        g[:, :, 0] = np.clip(g[:, :, 0] * 1.04, 0, 255)
        g[:, :, 1] = np.clip(g[:, :, 1] * 0.92, 0, 255)
        g[:, :, 2] = np.clip(g[:, :, 2] * 0.55, 0, 255)
        save(out_dir / 'foil_gold_albedo.webp', g)
    print('lm', out_dir)

if __name__ == '__main__':
    kind, src, out = sys.argv[1:]
    {'suit': enhance_suit, 'saturn': enhance_saturn, 'lm': enhance_lm}[kind](Path(src), Path(out))
