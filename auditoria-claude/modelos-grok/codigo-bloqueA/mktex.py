from PIL import Image, ImageDraw, ImageFont
W=H=1024
A=Image.new('RGB',(W,H),(92,96,100)); E=Image.new('RGB',(W,H),(0,0,0))
a=ImageDraw.Draw(A); e=ImageDraw.Draw(E)
F=lambda s,b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf' if b else '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',s)
FS=lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
# --- DSKY (0,0,512,512)
a.rectangle((0,0,512,512),fill=(70,72,74))
a.rectangle((14,14,498,250),fill=(40,41,43))
# luces de estado (izq)
labs=['UPLINK\nACTY','NO ATT','STBY','KEY REL','OPR ERR','TEMP','GIMBAL\nLOCK','PROG','RESTART','TRACKER']
for i,l in enumerate(labs):
    x=24+(i%2)*104; y=24+(i//2)*44
    a.rectangle((x,y,x+96,y+38),fill=(205,200,180) if l not in('TEMP','PROG','GIMBAL\nLOCK','RESTART','TRACKER') else (190,150,60))
    a.multiline_text((x+48,y+19),l,fill=(30,30,30),font=F(11),anchor='mm',align='center')
# display (der)
a.rectangle((240,24,488,240),fill=(12,16,13)); e.rectangle((240,24,488,240),fill=(0,0,0))
G=(80,255,140)
def t(x,y,s,sz,col=G,lab=False):
    if lab:
        a.text((x,y),s,fill=(30,30,30),font=F(sz)); a.rectangle(a.textbbox((x,y),s,font=F(sz)),outline=None)
    else:
        a.text((x,y),s,fill=col,font=F(sz)); e.text((x,y),s,fill=col,font=F(sz))
for (x,y,s) in ((250,30,'COMP'),(400,30,'PROG'),(250,92,'VERB'),(400,92,'NOUN')):
    a.rectangle((x,y,x+70,y+16),fill=(60,170,90)); a.text((x+35,y+8),s,fill=(10,20,10),font=F(12),anchor='mm'); e.rectangle((x,y,x+70,y+16),fill=(30,90,50))
t(410,48,'63',36); t(258,108,'16',36); t(410,108,'68',36)
for i,s in enumerate(['+00128','-00213','+41526']):
    a.line((250,152+i*30,480,152+i*30),fill=(60,170,90),width=1); t(262,154+i*29,s,26)
# teclado
keys=[['VERB','+','7','8','9','CLR','ENTR'],['NOUN','-','4','5','6','PRO','RSET'],['','0','1','2','3','KEY\nREL','']]
for r,row in enumerate(keys):
    for c,k in enumerate(row):
        if not k: continue
        x=20+c*68; y=272+r*76
        a.rounded_rectangle((x,y,x+60,y+66),8,fill=(225,222,210),outline=(40,40,40),width=2)
        a.multiline_text((x+30,y+33),k,fill=(25,25,25),font=F(18 if len(k)<3 else 12),anchor='mm',align='center')
a.text((256,500),'DSKY',fill=(220,220,220),font=F(14),anchor='mb')
# --- Paneles 1/2 (512,0,1024,512)
a.rectangle((512,0,1024,512),fill=(64,68,72))
for (x0,lab) in ((512,'PANEL 1'),(768,'PANEL 2')):
    a.rectangle((x0+6,6,x0+250,506),outline=(200,200,200),width=2)
    a.text((x0+128,22),lab,fill=(230,230,230),font=F(14),anchor='mm')
    # bola FDAI
    cx,cy=x0+128,150
    a.ellipse((cx-78,cy-78,cx+78,cy+78),fill=(20,20,20)); a.pieslice((cx-66,cy-66,cx+66,cy+66),180,360,fill=(235,235,235)); a.pieslice((cx-66,cy-66,cx+66,cy+66),0,180,fill=(40,40,40))
    a.line((cx-70,cy,cx+70,cy),fill=(240,140,30),width=4); a.line((cx,cy-40,cx,cy+40),fill=(240,140,30),width=3)
    # cintas y relojes
    for k,l in enumerate(['ALT','ALT RATE'] if x0==512 else ['THRUST','RCS PRESS']):
        x=x0+30+k*110; a.rectangle((x,250,x+60,400),fill=(15,15,15),outline=(200,200,200)); 
        for j in range(8): a.line((x+4,262+j*18,x+20,262+j*18),fill=(230,230,230),width=2)
        a.polygon([(x+60,320),(x+44,312),(x+44,328)],fill=(240,140,30)); a.text((x+30,412),l,fill=(230,230,230),font=F(12),anchor='mt')
    for k in range(3):
        cx=x0+50+k*78; a.ellipse((cx-28,448-28,cx+28,448+28),fill=(15,15,15),outline=(190,190,190),width=2); a.line((cx,448,cx+16,436),fill=(240,240,240),width=3)
# alarma maestra
a.rectangle((742,430,794,470),fill=(150,20,15)); a.text((768,450),'MASTER\nALARM',fill=(255,220,210),font=F(9),anchor='mm',align='center')
# --- Panel 16 (0,512,1024,640)
a.rectangle((0,512,1024,640),fill=(60,63,66))
a.text((512,530),'CIRCUIT BREAKER PANEL 16  ·  LMP',fill=(235,235,235),font=F(18),anchor='mm')
labs16=['STAB/CONT','ABORT STAGE','ENG ARM','AELD','ATCA','DECA','GIMBAL','INST','RCS SYS A','EPS','COMM','ECS','EXPLO DEV','HTRS']
for i,l in enumerate(labs16):
    x=10+i*72; a.text((x+34,572),l,fill=(235,235,235),font=F(10),anchor='mm'); a.line((x,590,x+68,590),fill=(200,200,200),width=1)
    a.text((x+34,612),l if i%3 else 'SYS',fill=(200,200,200),font=F(9),anchor='mm')
# --- Escotilla (0,640,256,896)
a.rectangle((0,640,256,896),fill=(110,114,116)); a.rectangle((10,650,246,886),outline=(40,40,40),width=4)
a.text((128,690),'FORWARD HATCH',fill=(20,20,20),font=F(15),anchor='mm'); a.text((128,850),'PULL TO OPEN',fill=(140,20,10),font=F(14),anchor='mm')
a.rectangle((40,760,216,790),fill=(180,40,30)); a.text((128,775),'CABIN PRESS',fill=(250,240,230),font=F(12),anchor='mm')
# --- Panel 11 (256,640,768,768)
a.rectangle((256,640,768,768),fill=(60,63,66)); a.text((512,656),'CIRCUIT BREAKER PANEL 11  ·  CDR',fill=(235,235,235),font=F(16),anchor='mm')
for i in range(7): a.text((290+i*70,700),['FLT DISP','HTR','PRPLNT','COMM','LTG','ECS','EPS'][i],fill=(230,230,230),font=F(10),anchor='mm')
# --- Placa (768,640,1024,896)
a.rectangle((768,640,1024,896),fill=(170,172,168)); a.text((896,700),'LM-5',fill=(20,20,20),font=FS(40),anchor='mm'); a.text((896,760),'EAGLE',fill=(20,20,20),font=FS(34),anchor='mm'); a.text((896,830),'GRUMMAN',fill=(60,60,60),font=FS(18),anchor='mm')
# --- Pared acolchada (0,896,1024,1024): gris con costuras
a.rectangle((0,896,1024,1024),fill=(118,121,117))
for x in range(0,1024,128): a.line((x,896,x,1024),fill=(104,107,104),width=2)
for x in range(0,1024,128):
    for y in (928,992): a.ellipse((x+60,y-3,x+66,y+3),fill=(100,103,100))
A.save('tex/lmi_atlas.png'); E.save('tex/lmi_emissive.png')
