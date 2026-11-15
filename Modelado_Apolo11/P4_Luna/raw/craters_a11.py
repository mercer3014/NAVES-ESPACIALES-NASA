#!/usr/bin/env python3
"""craters_a11.py - Persona 4: Little West Crater y West Crater para la Luna del juego.

HALLAZGO (leer antes de usar): en el juego, moon-surface-height.json NO lo lee ningun archivo de src/ ni
tests/ (rg 'moon-surface-height' solo lo encuentra a el mismo). Es metadata del tile del artista
(size_m=32, min/max de la malla, res=1024 del mapa original). El relieve real que pisa el jugador es:
    hAt(x,z) = ground(x,z)  [src/sim/lander.js, procedural, lista CR de crateres]
             + w(x,z) * (alturas de la malla moon-surface-tile.glb - h0)   [tile 32 m repetido 3x3 = +-48 m alrededor del LM]
Por eso este script:
  1) escribe P4_Luna/moon-surface-height-a11.json: las 4 claves originales identicas (mismo formato, el tile
     no cambia) + una clave nueva "a11_craters" con los crateres en coordenadas del juego, y
  2) escribe P4_Luna/raw/lander-craters-a11.patch.js con la UNICA linea que la Persona 2 debe insertar en
     src/sim/lander.js justo despues de `const CR = [...]`, y
  3) con --apply <ruta/lander.js> inserta esa linea en una COPIA del juego (nunca en /workspace/apolo11/game).

Ejes del juego (deducidos del codigo y verificados contra el Apolo 11 real):
  * el descenso avanza en +x (x0=-760 -> PAD.x=250); el Apolo 11 descendio de este a oeste  => +x = OESTE
  * el sol (sunDir = -0.95,0.2,0.18) esta en -x; el sol de la manana estaba al ESTE             => -x = ESTE
  * la escalera del LM mira a +x (lmYaw=pi/2 sobre frente +Z); Eagle aterrizo con la escalera al oeste
  * con Y arriba y mano derecha: +z = NORTE.
  LM nominal en la EVA: x = PAD.x - 6 = 244, z = 0 (eva.js: shared.landing || {x: PAD.x-6}).

Fuentes: ALSJ "Little West Crater" (https://www.nasa.gov/history/alsj/a11/a11EastCraterRIP.html,
copia https://apollojournals.org/alsj/a11/a11EastCraterRIP.html): crater de ~30 m a ~60 m al ESTE del LM;
ALSJ a11.landing.html (Armstrong vuela mas alla del campo de rocas de West Crater); LROC "What Armstrong Saw"
(https://lroc.im-ldi.com/images/1115) y LROC Apollo 11 Landing Site: West crater 180-190 m, el LM se poso
~500 m mas alla (al oeste) del punto previsto en su flanco NE => West Crater queda ~400 m al ESTE del LM.
OJO: el plan v4 dice "400 m al oeste"; la fuente dice ESTE (uprange). Se usa ESTE (WEST_SIDE=-1). Para
seguir literalmente el plan, cambiar WEST_SIDE a +1.

Modelo de crater del juego (lander.js): q = dist/r; q<1: h -= d*(1-q^2); 1<=q<1.6: borde h += d/4*cos^2(...).
Esa formula tiene un ESCALON de d/4 en q=1 (dentro vale 0, fuera d/4): con d=16 seria una pared de 4 m.
Para los crateres A11 se usa la misma curva de borde pero el cuenco sube hasta el borde (continuo):
    q<1: h += D*(q^2 - 0.75)      1<=q<1.6: h += D/4*cos^2(((q-1)/0.6)*pi/2)
=> borde = +D/4, fondo = -0.75*D, profundidad borde-fondo = D exactamente. Los crateres existentes no se tocan.
"""
import json, os, re, sys, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
P4 = os.path.dirname(HERE)
SRC_JSON = '/workspace/apolo11/game/public/models/moon-surface-height.json'
PAD_X = 250.0             # src/sim/lander.js  PAD = { x: 250, r: 24 }
LM_X = PAD_X - 6          # posicion nominal del LM en la EVA
EAST = -1.0               # -x = este
WEST_SIDE = -1.0          # West Crater hacia el ESTE (fuente ALSJ/LROC). +1 = literal del plan (oeste)

LW = dict(name='little-west', diameter_m=33.0, depth_rim_to_floor_m=4.0, dist_from_lm_m=60.0, bearing='E', z=0.0)
WC = dict(name='west-crater', diameter_m=180.0, depth_rim_to_floor_m=20.0, dist_from_lm_m=400.0, bearing='E' if WEST_SIDE < 0 else 'W', z=0.0)

def crater_row(c, side):
    r = c['diameter_m'] / 2
    d = c['depth_rim_to_floor_m']                             # D (borde-fondo) en la formula continua
    off = side * c['dist_from_lm_m']                          # metros en x respecto al LM nominal
    return dict(name=c['name'], x=round(LM_X + off, 2), z=c['z'], r=r, d=d,
                x_expr=f"PAD.x {'-' if off - 6 < 0 else '+'} {abs(off - 6):g}",
                rim_height_m=round(d / 4, 2), floor_m=round(-0.75 * d, 2), rim_outer_radius_m=round(1.6 * r, 2),
                dist_from_lm_m=c['dist_from_lm_m'], bearing=c['bearing'])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', help='ruta a src/sim/lander.js de una COPIA del juego')
    a = ap.parse_args()
    base = json.load(open(SRC_JSON))
    rows = [crater_row(LW, EAST), crater_row(WC, WEST_SIDE)]
    # Comprobacion de area: el terreno procedural cubre x in [-1100, 900], z in [-700, 700] (moonsurface.js)
    for c in rows:
        assert -1100 < c['x'] - c['rim_outer_radius_m'] and c['x'] + c['rim_outer_radius_m'] < 900, c
    out = dict(base)  # mismas 4 claves, mismos valores (el tile 32 m no cambia)
    out['a11_craters'] = dict(
        note='Crateres del Apolo 11 en coordenadas del juego (+x=oeste, +z=norte, metros, LM nominal x=PAD.x-6=244,z=0). '
             'El juego no lee este JSON: la P2 debe pegar js_const despues de const CR y js_loop despues del for de CR dentro de ground() (src/sim/lander.js).',
        formula='q=dist/r; q<1: h+=D*(q*q-0.75); 1<=q<1.6: h+=D*0.25*cos(((q-1)/0.6)*PI/2)^2  (D = profundidad borde-fondo; continua en q=1)',
        lm_nominal=dict(x=LM_X, z=0.0), axes=dict(x='+oeste', z='+norte', y='arriba'),
        craters=rows, js_const=js_const(rows), js_loop=JS_LOOP,
        sources=['https://www.nasa.gov/history/alsj/a11/a11EastCraterRIP.html',
                 'https://apollojournals.org/alsj/a11/a11.landing.html',
                 'https://lroc.im-ldi.com/images/1115'])
    p = os.path.join(P4, 'moon-surface-height-a11.json')
    json.dump(out, open(p, 'w'), indent=1, ensure_ascii=True)
    open(os.path.join(HERE, 'lander-craters-a11.patch.js'), 'w').write(
        '// 1) Insertar en src/sim/lander.js inmediatamente despues de la linea `const CR = [...]` (linea 6):\n' + js_const(rows) +
        '\n// 2) Insertar dentro de ground(), justo despues de la linea `for (const [cx, cz, r, d] of CR) {...}`:\n' + JS_LOOP + '\n')
    print('escrito', p); print(js_const(rows)); print(JS_LOOP)
    if a.apply:
        assert not os.path.realpath(a.apply).startswith('/workspace/apolo11/game/'), 'NO tocar el juego original'
        s = open(a.apply, newline='').read(); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')  # conservar CRLF del repo
        s = re.sub(r'\n// Apolo 11 \(P4\).*\n(CR\.push\(.*\n|const CR_A11.*\n)?', '\n', s)
        s = re.sub(r'\n *for \(const \[cx, cz, r, d\] of CR_A11\).*', '', s)
        s2 = re.sub(r'(const CR = \[.*?\];\n)', lambda m: m.group(1) + js_const(rows) + '\n', s, count=1)
        assert s2 != s, 'no encontre const CR'
        s3 = re.sub(r'(\n( *)for \(const \[cx, cz, r, d\] of CR\) .*)', lambda m: m.group(1) + '\n' + m.group(2) + JS_LOOP, s2, count=1)
        assert s3 != s2, 'no encontre el for de CR'; s2 = s3
        open(a.apply, 'w', newline='').write(s2.replace('\n', '\r\n') if crlf else s2); print('aplicado en', a.apply, '(CRLF)' if crlf else '')

JS_LOOP = ('for (const [cx, cz, r, d] of CR_A11) { const q = Math.hypot(x - cx, z - cz) / r; '
           'if (q < 1) h += d * (q * q - 0.75); else if (q < 1.6) h += d * 0.25 * Math.cos(((q - 1) / 0.6) * Math.PI / 2) ** 2; }')

def js_const(rows):
    parts = ', '.join(f"[{c['x_expr']}, {c['z']:g}, {c['r']:g}, {c['d']:g}]" for c in rows)
    return ('// Apolo 11 (P4): Little West (33 m, 60 m al E del LM) y West Crater (180 m, ~400 m al E); en el juego +x = oeste. [cx, cz, r, prof. borde-fondo]'
            '\nconst CR_A11 = [' + parts + '];')

if __name__ == '__main__':
    main()
