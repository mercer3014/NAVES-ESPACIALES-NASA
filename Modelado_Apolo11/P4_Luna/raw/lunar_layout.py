# Genera P4_Luna/lunar-layout.json: posiciones reales de Tranquility Base relativas al LM, en metros este/norte y en
# coordenadas del juego (+x = oeste, +z = norte, LM nominal x = PAD.x - 6 = 244, z = 0). Ver craters_a11.py para los ejes.
import json, math, os
R = 1735473.7                         # radio local (Wagner et al. 2017, LM A11: 1735473.711 m)
MPD = 2 * math.pi * R / 360           # m por grado de latitud
LM = (0.67416, 23.47314)              # LROC (Wagner et al. 2017)
def from_latlon(lat, lon):
    return ((lon - LM[1]) * MPD * math.cos(math.radians(LM[0])), (lat - LM[0]) * MPD)   # (este, norte)
def from_bearing(dist, az):
    return (dist * math.sin(math.radians(az)), dist * math.cos(math.radians(az)))
items = [
  ('lm', 'Lunar Module Eagle (centro del descenso)', (0.0, 0.0), 'alta', 'LROC/Wagner 2017: 0.67416 N, 23.47314 E'),
  ('psep', 'Passive Seismic Experiment Package', from_latlon(0.67322, 23.47315), 'alta', 'LROC "Spacecraft Related Coordinates 2016": PSE 0.67322 N, 23.47315 E (PSR: 16,8 m al sur del punto mas cercano del LM)'),
  ('lrrr', 'Laser Ranging RetroReflector', from_latlon(0.67337, 23.47293), 'alta', 'Coordenadas por laser lunar (Wagner 2017 / LROC shapefile): 0.67337 N, 23.47293 E; ALSJ: PSEP ~7,5 m mas alla en el mismo azimut'),
  ('flag', 'Bandera de EE. UU.', from_bearing(7.0, 292.5), 'media', 'NASA/ALSJ "Magnificent Desolation": bandera 7 m al oeste-noroeste del LM'),
  ('swc', 'Solar Wind Composition', from_bearing(5.0, 337.5), 'media', 'NASA/ALSJ: SWC 5 m al nor-noroeste del LM'),
  ('tv-camera', 'Camara de TV en tripode', from_bearing(12.0, 320.0), 'baja', 'Informe de mision PAO: ~40 ft (12 m) del LM; ALSJ: LRRR a 40 m de la camara. Azimut aprox. NO (PSR fig. 3-15), revisar'),
  ('double-crater', 'Crater doble (estacion panoramica 2)', from_bearing(7.0, 247.5), 'media', 'NASA/ALSJ: Aldrin a 7 m al oeste-suroeste del LM, en el borde del crater doble'),
  ('little-west', 'Little West Crater (33 m, 4 m prof.)', (60.0, 0.0), 'alta', 'ALSJ a11EastCraterRIP + NASA "Magnificent Desolation": 60 m al este del LM; LROC: ~50 m'),
  ('west-crater', 'West Crater (180-190 m)', (400.0, 0.0), 'media', 'LROC: el LM se poso ~500 m mas alla (al oeste) del punto previsto en el flanco NE de West Crater'),
]
LX = 244.0
GAME_NOW = {'psep': (15.0, 6.0), 'lrrr': (12.5, 9.0), 'swc': (-3.0, 8.0), 'flag': (2.5, 12.5), 'tv-camera': (-7.0, 14.0)}  # relativo al LM, ejes juego
out = dict(
  note='Posiciones reales de Tranquility Base relativas al LM. east_m/north_m: metros reales. game_rel: (x, z) relativo al LM en ejes del juego '
       '(+x = oeste, +z = norte). game_abs: con el LM nominal en x = PAD.x - 6 = 244, z = 0 (en la EVA usar lx real: x = lx + game_rel.x). '
       'game_now_rel: donde lo pone hoy el juego (eva.js / easep-props.glb) para comparar. La P2 decide si mueve los pivotes (easep.js mueve pivotes con nombre, nunca los hijos *-geo).',
  axes=dict(x='+oeste', z='+norte', y='arriba', evidence='descenso en +x (E->O real), sol en -x (azimut real 88 grados, el del juego ~79), escalera del LM (+Z) mirando a +x (oeste real)'),
  lm_heading='Escalera/escotilla (+Z del LM) al oeste (azimut 270) = +x del juego (eva.js ya usa lmYaw = pi/2)',
  sun=dict(azimuth_deg=88, elevation_deg=15, source='NASA/ALSJ a11_eva_thumbs'),
  meters_per_degree=round(MPD, 2), items=[])
for key, label, (e, n), conf, src in items:
    rel = (round(-e, 2) + 0.0, round(n, 2) + 0.0)
    it = dict(id=key, label=label, east_m=round(e, 2) + 0.0, north_m=round(n, 2) + 0.0, dist_m=round(math.hypot(e, n), 2),
              azimuth_deg=round(math.degrees(math.atan2(e, n)) % 360, 1), game_rel=dict(x=rel[0], z=rel[1]),
              game_abs=dict(x=round(LX + rel[0], 2), z=rel[1]), confidence=conf, source=src)
    if key in GAME_NOW: it['game_now_rel'] = dict(x=GAME_NOW[key][0], z=GAME_NOW[key][1])
    out['items'].append(it)
out['sources'] = ['https://lroc.im-ldi.com/images/938', 'https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS',
  'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11_eva_thumbs.html', 'https://apollojournals.org/alsj/a11/a11LM2LWC.html',
  'https://www.apollojournals.org/alsj/a11/A11_PAOMissionReport.html', 'https://www.apollojournals.org/alsj/a11/a11prsci3-15.html',
  'https://www.nasa.gov/history/alsj/a11/a11EastCraterRIP.html', 'https://lroc.im-ldi.com/images/1115']
p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'lunar-layout.json')
json.dump(out, open(p, 'w'), indent=1, ensure_ascii=False)
for it in out['items']: print(f"{it['id']:14s} E{it['east_m']:8.2f} N{it['north_m']:8.2f}  d={it['dist_m']:6.1f} az={it['azimuth_deg']:5.1f}  juego rel ({it['game_rel']['x']:7.2f},{it['game_rel']['z']:7.2f})  hoy {it.get('game_now_rel','')}")
