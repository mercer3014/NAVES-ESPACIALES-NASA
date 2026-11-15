# Textura 512x512 del nucleo DSKY del Guardian (original): "1202" en 7 segmentos verdes + teclado.
from PIL import Image, ImageDraw, ImageFont
import os
W = 512
im = Image.new('RGB', (W, W), (58, 60, 63)); d = ImageDraw.Draw(im)
GREEN = (90, 255, 120); DIMG = (8, 22, 12); AMBER = (255, 190, 60)
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f_s = ImageFont.truetype(F, 15); f_m = ImageFont.truetype(F, 18)
# marco y esquinas oscuras (caras laterales usan la esquina 496..512)
d.rectangle([496, 496, 511, 511], fill=(40, 42, 45))
# panel EL negro
d.rectangle([12, 12, 499, 262], fill=(6, 10, 8), outline=(30, 30, 30), width=3)
SEG = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}
def hseg(x1, x2, yc, t):
    return [(x1, yc), (x1+t/2, yc-t/2), (x2-t/2, yc-t/2), (x2, yc), (x2-t/2, yc+t/2), (x1+t/2, yc+t/2)]
def vseg(xc, y1, y2, t):
    return [(xc, y1), (xc+t/2, y1+t/2), (xc+t/2, y2-t/2), (xc, y2), (xc-t/2, y2-t/2), (xc-t/2, y1+t/2)]
def digit(x, y, w, h, ch, t, on=GREEN, off=DIMG):
    s = SEG.get(ch, ''); g = t*0.25
    xl, xr, yt, ym, yb = x+t/2, x+w-t/2, y+t/2, y+h/2, y+h-t/2
    P = {'a': hseg(xl+g, xr-g, yt, t), 'g': hseg(xl+g, xr-g, ym, t), 'd': hseg(xl+g, xr-g, yb, t),
         'f': vseg(xl, yt+g, ym-g, t), 'b': vseg(xr, yt+g, ym-g, t), 'e': vseg(xl, ym+g, yb-g, t), 'c': vseg(xr, ym+g, yb-g, t)}
    for k, poly in P.items():
        d.polygon(poly, fill=on if k in s else off)
# fila superior: PROG lamp + VERB 05 NOUN 09
d.rounded_rectangle([24, 24, 120, 62], 6, fill=AMBER); d.text((40, 33), 'PROG', font=f_m, fill=(60, 30, 0))
d.text((150, 22), 'VERB', font=f_s, fill=GREEN); d.text((300, 22), 'NOUN', font=f_s, fill=GREEN)
for i, c in enumerate('05'): digit(150 + i*34, 42, 28, 44, c, 6)
for i, c in enumerate('09'): digit(300 + i*34, 42, 28, 44, c, 6)
d.rectangle([24, 98, 488, 102], fill=(20, 60, 30))
# "1202" grande
for i, c in enumerate('1202'):
    digit(48 + i*112, 116, 88, 136, c, 16)
# teclado
labels = [['VERB', '+', '7', '8', '9', 'CLR'], ['NOUN', '-', '4', '5', '6', 'PRO'], ['ENTR', '0', '1', '2', '3', 'RSET']]
for r, row in enumerate(labels):
    for cidx, lab in enumerate(row):
        x0 = 20 + cidx*80; y0 = 282 + r*72
        d.rounded_rectangle([x0, y0, x0+68, y0+60], 8, fill=(46, 48, 50), outline=(110, 112, 115), width=3)
        tw = d.textlength(lab, font=f_m); d.text((x0+34-tw/2, y0+19), lab, font=f_m, fill=(225, 225, 225))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex', 'dsky-1202.png')
im.save(out); print(out)
