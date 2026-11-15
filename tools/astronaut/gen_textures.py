# Texturas procedurales tileables (CC0, generadas aquí): tela beta (color/normal/rugosidad), suela con relieve
import numpy as np, os
from PIL import Image
rng = np.random.default_rng(7)
N = 1024
def tile_noise(n, freq, octaves=4, seed=0):
    r = np.random.default_rng(seed); out = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        f = freq * 2 ** o; g = r.standard_normal((f, f))
        # interpolación bicúbica periódica vía FFT (tileable)
        F = np.fft.fft2(g); P = np.zeros((n, n), complex); h = f // 2
        P[:h, :h] = F[:h, :h]; P[:h, -h:] = F[:h, -h:]; P[-h:, :h] = F[-h:, :h]; P[-h:, -h:] = F[-h:, -h:]
        out += amp * np.real(np.fft.ifft2(P)) * (n / f) ** 2 / n; tot += amp; amp *= 0.5
    out -= out.min(); out /= out.max(); return out
y, x = np.mgrid[0:N, 0:N] / N
T = 48  # hilos por tile
u, v = x * T, y * T
iu, iv = np.floor(u).astype(int), np.floor(v).astype(int)
fu, fv = u - iu, v - iv
over = ((iu + iv) // 2) % 2 == 0  # sarga 2/2
warp = np.sin(np.pi * fu) ** 0.6 * (0.75 + 0.25 * np.cos(2 * np.pi * (v / 2)))
weft = np.sin(np.pi * fv) ** 0.6 * (0.75 + 0.25 * np.cos(2 * np.pi * (u / 2)))
h = np.where(over, warp * 1.0 + weft * 0.35, weft * 1.0 + warp * 0.35)
fib = tile_noise(N, 64, 3, 1); big = tile_noise(N, 4, 4, 2); mid = tile_noise(N, 16, 3, 3)
h = h * 0.8 + fib * 0.2
# arrugas/crinkles de escala media (pliegues de tela comprimida, ~1-3 cm): crestas de ruido tileable
def ridge(fr, seed, oct=3):
    n = tile_noise(N, fr, oct, seed); return (1 - np.abs(n * 2 - 1)) ** 2.5
crk = ridge(4, 11) * 0.65 + ridge(8, 12) * 0.35
H = h * 0.35 + crk * 1.0  # altura combinada para el normal (tejido fino + arrugas)
def normal_from(hh, strength):
    dx = (np.roll(hh, -1, 1) - np.roll(hh, 1, 1)) * strength; dy = (np.roll(hh, -1, 0) - np.roll(hh, 1, 0)) * strength
    nz = np.ones_like(hh); l = np.sqrt(dx * dx + dy * dy + 1)
    n = np.stack([-dx / l, dy / l, nz / l], -1); return ((n * 0.5 + 0.5) * 255).astype(np.uint8)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../public/tex/')
def save(a, name): Image.fromarray(a).save(OUT + name + '.webp', quality=88, method=6)
save(np.clip(normal_from(h, 2.2).astype(int) + normal_from(crk, 3.5).astype(int) - 128, 0, 255).astype(np.uint8), 'suit_beta_n')
# color: blanco hueso/gris (beta cloth usado): variación, manchas de suciedad, polvo gris en las arrugas
base = np.array([0.9, 0.89, 0.86])
grime = np.clip((mid - 0.5) * 2.2, 0, 1) ** 1.5
c = base[None, None] * (0.93 + 0.07 * h[..., None]) * (0.95 + 0.05 * big[..., None])
c = c * (1 - 0.07 * grime[..., None]) - 0.025 * crk[..., None] * np.array([0.9, 0.95, 1.05])[None, None]
c = c * (1 - 0.06 * np.clip((tile_noise(N, 24, 2, 13)[..., None] - 0.6) * 4, 0, 1))
save((np.clip(c, 0, 1) * 255).astype(np.uint8), 'suit_beta_c')
rough = 0.82 + 0.12 * (1 - h) + 0.04 * big - 0.05 * crk
save((np.clip(rough, 0, 1) * 255).astype(np.uint8), 'suit_beta_r')
# suela: dibujo de tacos en chevron (altura) -> normal
S = 512; ys, xs = np.mgrid[0:S, 0:S] / S
ch = ((xs * 6 + np.abs(ys - 0.5) * 4) % 1.0); tread = (ch < 0.55).astype(float)
tread = np.clip(tread * 0.9 + tile_noise(S, 32, 2, 5) * 0.1, 0, 1)
save(normal_from(tread, 6.0), 'suit_sole_n')
# goma / tela de guantes (azul grisáceo) con grano fino
g = tile_noise(512, 32, 3, 9)
save(normal_from(g, 2.0), 'suit_rubber_n')
print('ok')
