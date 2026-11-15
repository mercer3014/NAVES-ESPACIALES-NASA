# Hillshade antes/despues de ground() (grillas exportadas por craters_check.mjs). Norte (+z) arriba, este (-x) a la DERECHA
# como en un mapa: en el juego +x = oeste, asi que se espeja x para que el mapa se lea con el este a la derecha.
import json, numpy as np
from PIL import Image, ImageDraw, ImageFont
g = json.load(open('/tmp/ground-grid.json')); nx, nz = g['nx'], g['nz']; lx = g['lx']
OUT = '/workspace/apolo11/Modelado_Apolo11/P4_Luna/previews/'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18); Fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception: F = Fs = ImageFont.load_default()
def px(x, z):  # mundo -> pixel en la imagen espejada (antes de escalar)
    return (g['x1'] - x), (g['z1'] - z)
imgs = {}
for tag in ('before', 'after'):
    h = np.fromfile(f'/tmp/ground-{tag}.f32', dtype=np.float32).reshape(nz, nx)
    h = h[::-1, ::-1]  # filas: z1..z0 (norte arriba); columnas: x1..x0 (oeste izq, este der)
    dy, dx = np.gradient(h)
    az, alt = np.radians(90 + 45), np.radians(35)  # luz desde el NE-E
    slope = np.arctan(np.hypot(dx, dy) * 1.6); aspect = np.arctan2(-dx, dy)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    hn = (h - (-18)) / (6 - (-18)); hn = np.clip(hn, 0, 1)
    base = np.clip(hs, 0, 1)
    rgb = np.stack([0.35 + 0.65 * base * (0.75 + 0.25 * hn)] * 3, -1)
    rgb[..., 2] *= 0.96
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    S = 1024 / nx; im = im.resize((1024, int(nz * S)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    def mark(x, z, label, col=(255, 60, 40), r=6):
        u, v = px(x, z); u *= S; v *= S; d.ellipse([u - r, v - r, u + r, v + r], outline=col, width=3); d.text((u + r + 3, v - 9), label, fill=col, font=Fs)
    mark(lx, 0, 'LM (x=244)'); mark(250, 0, '', (60, 200, 90), 4)
    if tag == 'after':
        mark(lx - 60, 0, 'Little West 33 m', (255, 200, 40), 4); mark(lx - 400, 0, 'West Crater 180 m', (255, 200, 40), 4)
    # escala 100 m
    d.line([20, im.height - 30, 20 + 100 * S, im.height - 30], fill=(255, 255, 255), width=4); d.text((20, im.height - 55), '100 m', fill=(255, 255, 255), font=Fs)
    d.text((im.width - 90, 10), 'N ^', fill=(255, 255, 255), font=F); d.text((im.width - 150, im.height - 55), 'E ->  (-x juego)', fill=(255, 255, 255), font=Fs)
    d.text((10, 10), ('ANTES' if tag == 'before' else 'DESPUES (A11)') + '  ground() x=-380..420, z=-220..220', fill=(255, 255, 255), font=F)
    im.save(OUT + f'terrain-hillshade-{tag}.png'); imgs[tag] = im
# zoom Little West (100x100 m alrededor del LM y el crater) despues
h = np.fromfile('/tmp/ground-after.f32', dtype=np.float32).reshape(nz, nx)
i0 = int(lx - 110 - g['x0']); i1 = int(lx + 30 - g['x0']); j0 = int(-60 - g['z0']); j1 = int(60 - g['z0'])
sub = h[j0:j1, i0:i1][::-1, ::-1]
sub = (sub - sub.min()) / (np.ptp(sub) + 1e-6)
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(10.24, 8.8), dpi=100)
ext = [lx + 30, lx - 110, -60, 60]  # x invertido (este a la derecha)
hh = h[j0:j1, i0:i1]
cs = ax.imshow(hh, origin='lower', extent=[lx - 110, lx + 30, -60, 60], cmap='gray'); ax.invert_xaxis()
ax.contour(np.arange(lx - 110, lx + 30)[: hh.shape[1]], np.arange(-60, 60)[: hh.shape[0]], hh, levels=14, colors='orange', linewidths=0.6)
ax.plot([lx], [0], 'r^', ms=12); ax.annotate('LM', (lx, 0), color='r', xytext=(4, 6), textcoords='offset points')
for n, (x, z) in {'bandera': (lx + 2.5, 12.5), 'TV': (lx - 7, 14), 'PSEP': (lx + 15, 6), 'LRRR': (lx + 12.5, 9)}.items(): ax.plot([x], [z], 'c.', ms=8); ax.annotate(n, (x, z), color='c', fontsize=8, xytext=(3, 3), textcoords='offset points')
ax.set_xlabel('x del juego (m)  <- oeste | este ->'); ax.set_ylabel('z del juego (m)  +z = norte')
ax.set_title('DESPUES: Little West (33 m, 4 m) a 60 m al este del LM. Curvas de nivel cada ~0.5 m')
plt.colorbar(cs, ax=ax, label='altura ground() (m)'); plt.tight_layout(); plt.savefig(OUT + 'terrain-little-west-zoom.png'); print('ok')
