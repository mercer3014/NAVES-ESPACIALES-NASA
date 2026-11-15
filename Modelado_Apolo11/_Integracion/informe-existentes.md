# Informe de validación de modelos glb

- Generado: sábado, 14 de noviembre de 2026, 5:19:35 p. m. (America/La_Paz)
- Carpeta: `/workspace/apolo11/game/public/models`
- Archivos: 23

## Resumen

| Métrica | Valor |
| --- | ---: |
| Sin avisos | 4 |
| Con avisos | 19 |
| Errores de lectura | 0 |
| Con meshopt | 23 / 23 |
| Superan 1,5 MB | 3 |

## Tabla

| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `apollo-lunar-module.glb` | 46.177 | 12,143 × 6,511 × 10,742 m | 1,08 | 15 | 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 380×200 | — | 0 | 0 | legs-deploy (2,54 s), legs-stow (2,54 s) | sí | 18 |
| `astronaut_a7l.glb` | 105.136 | 0,904 × 2 × 0,784 m | 1,777 | 18 | — | 17 | 0 | 0 | — | sí | 3 |
| `astronaut-a7l.glb` | 54.700 | 1,232 × 2 × 0,726 m | 1,44 | 9 | 2048×2048, 2048×2048, 2048×2048, 768×512 | 34+34+34 | 0 | 0 | bunny-hop (1,25 s), climb-ladder (2 s), fall-and-get-up (5 s), first-step (4 s), idle (4 s), kneel-pick-sample (4 s), low-g-jump (1,25 s), plant-flag (3 s), point (2 s), run (0,75 s), salute (2 s), walk (1,17 s), wave (2 s) | sí | 4 |
| `astronaut.glb` | 6.271 | 68,914 × 74,263 × 27,598 m | 0,068 | 2 | 1024×1024, 128×128 | — | 0 | 0 | — | sí | 0 |
| `boot-print.glb` | 64 | 0,2 × 0 × 0,4 m | 0,043 | 1 | 512×256, 512×256, 512×256 | — | 0 | 0 | — | sí | 0 |
| `cabin-panels.glb` | 37.580 | 2,039 × 1,65 × 1,499 m | 0,971 | 26 | 512×512, 512×512, 512×512, 512×512, 512×512, 2048×1812, 1024×1024, 2048×1812, 384×128, 1024×512, 1024×512, 512×512, 1024×512, 768×128, 512×128, 512×128, 2048×1980 | — | 0 | 0 | guard-04-open (0,46 s), guard-09-open (0,46 s), guard-12-open (0,46 s), guard-13-open (0,46 s), guard-15-open (0,46 s) | sí | 1 |
| `cm-interior.glb` | 52.582 | 3,42 × 2,75 × 3,444 m | 0,929 | 18 | 1024×1024, 1024×1024, 1024×1024, 2048×1024, 2048×1024, 2048×1024, 512×512, 512×512, 512×512, 1024×512 | — | 0 | 0 | hatch-open (3,04 s), guard-01-open (0,54 s), guard-02-open (0,54 s), guard-03-open (0,54 s), guard-04-open (0,54 s), guard-05-open (0,54 s) | sí | 18 |
| `csm-columbia.glb` | 38.326 | 3,948 × 10,662 × 4,658 m | 1,309 | 17 | 1024×1024, 1024×1024, 1024×1024, 512×512, 512×512, 512×512, 512×512, 512×512, 1024×1024, 1024×1024, 1024×1024, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512 | — | 0 | 0 | probe-retract (2,04 s), hatch-open (3,04 s), hga-deploy (4,04 s), sps-gimbal-test (5,04 s) | sí | 64 |
| `easep-props.glb` | 20.192 | 18,818 × 2,226 × 7,147 m | 1,157 | 15 | 1024×512, 1024×512, 1024×512, 1024×868, 1024×868, 1024×868, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512, 512×768, 512×768, 512×768 | — | 0 | 0 | psep-deploy (2,25 s), swc-unroll (3,04 s), swc-rollup (3,04 s), tongs-grab (0,83 s) | sí | 6 |
| `flag-mast.glb` | 4.444 | 0,946 × 2,43 × 0,034 m | 0,269 | 5 | 512×512, 512×512, 512×512, 256×256, 256×256, 512×512, 512×512 | — | 0 | 0 | crossbar-unfold (0,83 s), crossbar-extend (1,25 s) | sí | 1 |
| `launch-tower.glb` | 22.708 | 49,57 × 144,031 × 41,444 m | 0,532 | 10 | 512×512, 512×512, 512×512 | — | 0 | 0 | swing-arms-retract (6,96 s) | sí | 1 |
| `lc39a-far.glb` | 2.432 | 7.491,191 × 178,016 × 1.850,919 m | 0,326 | 1 | 2048×2048 | — | 0 | 0 | — | sí | 1 |
| `lc39a-pad.glb` | 9.410 | 694,8 × 56,512 × 674,02 m | 1,05 | 7 | 1024×1024, 1024×1024, 512×512, 512×512 | — | 0 | 0 | — | sí | 1 |
| `lc39a-terrain.glb` | 94.118 | 32.000 × 27,253 × 33.731,856 m | 1,709 | 7 | 512×512, 512×128, 512×512, 1024×2048, 2048×2048, 512×512, 1024×1024 | — | 0 | 0 | — | sí | 2 |
| `lm.glb` | 86.687 | 6,427 × 5,013 × 6,427 m | 0,704 | 7 | 400×400, 900×900, 900×900, 64×4 | — | 0 | 0 | lunarlandeAction (0 s), group13 10Action (0 s), group13 11Action (0 s), group13 12Action (0 s), group13 13Action (0 s), group13 14Action (0 s), group13 g1Action (0 s), group13 g2Action (0 s), group13 g3Action (0 s), group13 g4Action (0 s), group13 g5Action (0 s), group13 g6Action (0 s), group13 g7Action (0 s), group13 g8Action (0 s), group13 g9Action (0 s), group13 grAction (0 s), group13 p1Action (0 s), group13 p2Action (0 s), group13 pCAction (0 s), group31 10Action (0 s), group31 11Action (0 s), group31 12Action (0 s), group31 13Action (0 s), group31 14Action (0 s), group31 15Action (0 s), group31 16Action (0 s), group31 17Action (0 s), group31 18Action (0 s), group31 19Action (0 s), group31 20Action (0 s), group31 21Action (0 s), group31 22Action (0 s), group31 g1Action (0 s), group31 g2Action (0 s), group31 g3Action (0 s), group31 g4Action (0 s), group31 g5Action (0 s), group31 g6Action (0 s), group31 g7Action (0 s), group31 g8Action (0 s), group31 g9Action (0 s), group31 grAction (0 s), group32 grAction (0 s), group51 10Action (0 s), group51 11Action (0 s), group51 12Action (0 s), group51 13Action (0 s), group51 14Action (0 s), group51 15Action (0 s), group51 16Action (0 s), group51 17Action (0 s), group51 18Action (0 s), group51 19Action (0 s), group51 20Action (0 s), group51 21Action (0 s), group51 g1Action (0 s), group51 g2Action (0 s), group51 g3Action (0 s), group51 g4Action (0 s), group51 g5Action (0 s), group51 g6Action (0 s), group51 g7Action (0 s), group51 g8Action (0 s), group51 g9Action (0 s), group51 grAction (0 s), group51 p1Action (0 s), group51 poAction (0 s), group51 pSAction (0 s), group61 p1Action (0 s), group61 p2Action (0 s), group61 pSAction (0 s), group73 g1Action (0 s), group73 g2Action (0 s), group73 grAction (0 s), group73 p1Action (0 s), group73 p2Action (0 s), group73 p3Action (0 s), group73 pCAction (0 s), group74 g1Action (0 s), group74 g2Action (0 s), group74 grAction (0 s), group74 p1Action (0 s), group74 p2Action (0 s), group74 p3Action (0 s), group74 pCAction (0 s), group75 10Action (0 s), group75 11Action (0 s), group75 g1Action (0 s), group75 g2Action (0 s), group75 g3Action (0 s), group75 grAction (0 s), group75 p1Action (0 s), group75 p2Action (0 s), group75 p3Action (0 s), group75 p4Action (0 s), group75 p5Action (0 s), group75 p6Action (0 s), group75 p7Action (0 s), group75 p8Action (0 s), group75 p9Action (0 s), group75 pCAction (0 s), group75 pPAction (0 s), pCone6Action (0 s), pCone7Action (0 s), pCube2Action (0 s), pCube27Action (0 s), pCube28Action (0 s), pCube29Action (0 s), pCube3Action (0 s), pCylinde10Action (0 s), pCylinde11Action (0 s), pCylinder1Action (0 s), pCylinder2Action (0 s), pCylinder3Action (0 s), pCylinder4Action (0 s), pCylinder5Action (0 s), pCylinder6Action (0 s), pCylinder7Action (0 s), pCylinder8Action (0 s), pCylinder9Action (0 s), polySurfa1Action (0 s), polySurfa2Action (0 s), polySurfa3Action (0 s), polySurfa4Action (0 s), polySurfacAction (0 s), pPipe1Action (0 s), pPipe2Action (0 s), pPlane1Action (0 s), pPlane2Action (0 s), pSphere20Action (0 s), pSphere26Action (0 s), pSphere27Action (0 s), pSphere28Action (0 s), pSphere29Action (0 s), pSphere30Action (0 s) | sí | 270 |
| `moon-rocks.glb` | 27.900 | 8,057 × 0,921 × 1,57 m | 1,388 | 1 | 1024×1024, 1024×1024, 1024×1024 | — | 0 | 0 | — | sí | 0 |
| `moon-surface-tile.glb` | 41.472 | 32 × 1,445 × 32 m | 1,098 | 1 | 1024×1024, 1024×1024, 1024×1024 | — | 0 | 0 | — | sí | 0 |
| `rover.glb` | 183.037 | 2,705 × 1,846 × 3,108 m | 1,906 | 32 | 1024×1024, 1024×1024, 1024×1024, 1024×1024, 128×128, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 1024×512, 1024×1024, 256×256, 256×256, 256×256, 1024×1024, 512×512, 512×512, 512×512, 1024×1024, 512×512, 128×4, 128×4 | 15 | 0 | 0 | CylinderAction (20,04 s), bottomAction (1,25 s), Empty.001Action.003 (3,75 s), Action (20 s), topAction (20 s), Cylinder.002Action (20 s), ArmatureAction (15 s), haz_cov_front (0 s), e_covers_rear (1,25 s), haz_cov_rear_l (0 s), haz_cov_rear_r (0 s), arm.003Action (24,17 s), arm.002Action (24,17 s), armAction (24,17 s), arm.004Action (24,17 s), turret_objAction (22,92 s), turret_cam_cover_01 (22,92 s), turret.001Action.001 (22,92 s), hingeAction (16,88 s), Empty.002Action (1,25 s), Action (20 s), arm_01_pivotAction (2,5 s), arm_02_pivotAction (3,75 s) | sí | 65 |
| `s4b-sla.glb` | 38.660 | 6,842 × 29,166 × 7,804 m | 1,382 | 17 | 512×512, 512×512, 1024×1024, 1024×1024, 1024×1024, 1024×1024, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512, 512×512 | — | 0 | 0 | sla-open (2,54 s), sla-open-wide (5,04 s), sla-jettison (10,04 s) | sí | 23 |
| `sample-box.glb` | 8.006 | 0,809 × 0,841 × 0,352 m | 0,338 | 9 | 256×256, 256×256, 512×512, 512×512, 512×512, 512×512, 512×512, 512×256 | — | 0 | 0 | lid-open (1,46 s) | sí | 2 |
| `saturn_v.glb` | 26.171 | 2,014 × 12,987 × 2,014 m | 0,226 | 7 | 1000×1000, 1000×1000, 1000×1000, 1000×1000, 64×4 | — | 0 | 0 | saturnv_caAction (0 s), group1 groAction (0 s), group1 pCoAction (0 s), group10 pCAction (0 s), group11 pCAction (0 s), group3 groAction (0 s), group6 pCuAction (0 s), group7 pCuAction (0 s), group8 pCyAction (0 s), group9 pCyAction (0 s), pCone2 groAction (0 s), pCube1 gr1Action (0 s), pCube1 groAction (0 s), pCylinder1Action (0 s), pCylinder2Action (0 s), pCylinder3Action (0 s), pCylinder4Action (0 s), pCylinder5Action (0 s), polySurfa1Action (0 s), polySurfa2Action (0 s), polySurfa3Action (0 s), polySurfa4Action (0 s), polySurfacAction (0 s) | sí | 48 |
| `saturn-v.glb` | 53.492 | 13,011 × 110,6 × 13,011 m | 0,851 | 15 | 1024×1024, 1024×1024, 512×512, 512×512, 512×512, 1024×1024, 1024×1024, 380×200, 512×512 | — | 0 | 0 | — | sí | 9 |
| `tv-camera.glb` | 8.150 | 1,17 × 1,183 × 3,262 m | 0,306 | 8 | 512×512, 512×512, 512×512, 512×512, 512×512, 512×256 | — | 0 | 0 | — | sí | 1 |

## Detalle por archivo

### apollo-lunar-module.glb

- Peso: 1,08 MB (1.132.148 bytes)
- Triángulos: 46.177
- Caja: min [-6,0715, 0, -6,0715]  max [6,0715, 6,5111, 4,67]  tamaño 12,143 × 6,511 × 10,742 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (15): WhitePaint, DarkMetal, Aluminum, AscentSkin, AscentBlack, SilverFoil, AscentDark, BlackPanel, RCSBell, Window, BlackFoil, EngineBell, GoldFoil, Flag, MESAFoil
- Texturas: panel_normal image/webp 1024×1024; panel_alu_albedo image/webp 1024×1024; panel_orm image/webp 1024×1024; panel_black_albedo image/webp 1024×1024; panel_orm image/webp 1024×1024; foil_normal image/webp 1024×1024; foil_silver_albedo image/webp 1024×1024; foil_orm image/webp 1024×1024; panel_dark_albedo image/webp 1024×1024; foil_black_albedo image/webp 1024×1024; foil_gold_albedo image/webp 1024×1024; flag_us image/webp 380×200
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: legs-deploy (2,542 s), legs-stow (2,542 s)
- Nodos (72): Antennas, AscentStage_Body, DockingTarget, RCS, Windows, AscentStage, DescentStage_Body, EngineBell, GoldFoil, LegMounts, leg-aft-geo, leg-aft-pad-geo, leg-aft-probe-geo, leg-aft-probe, leg-aft-pad, leg-aft, leg-aft-sec-a-geo, leg-aft-sec-a, leg-aft-sec-b-geo, leg-aft-sec-b, leg-aft-truss-a-geo, leg-aft-truss-a, leg-aft-truss-b-geo, leg-aft-truss-b, Ladder, leg-fwd-geo, leg-fwd-pad-geo, leg-fwd-pad, leg-fwd, leg-fwd-sec-a-geo, leg-fwd-sec-a, leg-fwd-sec-b-geo, leg-fwd-sec-b, leg-fwd-truss-a-geo, leg-fwd-truss-a, leg-fwd-truss-b-geo, leg-fwd-truss-b, leg-left-geo, leg-left-pad-geo, leg-left-probe-geo, leg-left-probe, leg-left-pad, leg-left, leg-left-sec-a-geo, leg-left-sec-a, leg-left-sec-b-geo, leg-left-sec-b, leg-left-truss-a-geo, leg-left-truss-a, leg-left-truss-b-geo, leg-left-truss-b, leg-right-geo, leg-right-pad-geo, leg-right-probe-geo, leg-right-probe, leg-right-pad, leg-right, leg-right-sec-a-geo, leg-right-sec-a, leg-right-sec-b-geo, leg-right-sec-b, leg-right-truss-a-geo, leg-right-truss-a, leg-right-truss-b-geo, leg-right-truss-b, Legs, Markings, MESA, PlumeDeflectors, Porch, DescentStage, LM_Eagle
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: Antennas
  - `[not-kebab-case]` Nodo no es kebab-case: AscentStage_Body
  - `[not-kebab-case]` Nodo no es kebab-case: DockingTarget
  - `[not-kebab-case]` Nodo no es kebab-case: RCS
  - `[not-kebab-case]` Nodo no es kebab-case: Windows
  - `[not-kebab-case]` Nodo no es kebab-case: AscentStage
  - `[not-kebab-case]` Nodo no es kebab-case: DescentStage_Body
  - `[not-kebab-case]` Nodo no es kebab-case: EngineBell
  - `[not-kebab-case]` Nodo no es kebab-case: GoldFoil
  - `[not-kebab-case]` Nodo no es kebab-case: LegMounts
  - `[not-kebab-case]` Nodo no es kebab-case: Ladder
  - `[not-kebab-case]` Nodo no es kebab-case: Legs
  - `[not-kebab-case]` Nodo no es kebab-case: Markings
  - `[not-kebab-case]` Nodo no es kebab-case: MESA
  - `[not-kebab-case]` Nodo no es kebab-case: PlumeDeflectors
  - `[not-kebab-case]` Nodo no es kebab-case: Porch
  - `[not-kebab-case]` Nodo no es kebab-case: DescentStage
  - `[not-kebab-case]` Nodo no es kebab-case: LM_Eagle

### astronaut_a7l.glb

- Peso: 1,777 MB (1.863.044 bytes)
- Triángulos: 105.136
- Caja: min [-0,4521, -1, -0,3919]  max [0,4521, 1, 0,3919]  tamaño 0,904 × 2 × 0,784 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (18): Suit, Gauntlet, MetalBlue, Glove, Tip, MetalRed, Boot, Sole, Shell, Visor, Metal, PLSS, Dark, RCU, NameTag, Hose, FlagPatch, MissionPatch
- Texturas: ninguna
- Skins: Rig (17 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (18): head, neck, hand_L, forearm_L, upperarm_L, hand_R, forearm_R, upperarm_R, chest, spine, foot_L, shin_L, thigh_L, foot_R, shin_R, thigh_R, hips, Astronaut
- Avisos:
  - `[not-kebab-case]` Nombre de archivo no es kebab-case: astronaut_a7l.glb
  - `[not-kebab-case]` Nodo no es kebab-case: Astronaut
  - `[over-1.5mb]` 1,777 MB supera el límite de 1.5 MB

### astronaut-a7l.glb

- Peso: 1,44 MB (1.509.584 bytes)
- Triángulos: 54.700
- Caja: min [-0,6161, -1, -0,3628]  max [0,6161, 1, 0,3628]  tamaño 1,232 × 2 × 0,726 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (9): SuitPBR, GoldVisor, ClearVisor, FlagPatch, Overshoe, Sole, Strap, Buckle, CommanderStripes
- Texturas: astronaut_normal image/webp 2048×2048; astronaut_orm image/webp 2048×2048; astronaut_basecolor image/webp 2048×2048; flag_patch_usa image/webp 768×512
- Skins: Armature (34 huesos), Armature (34 huesos), Armature (34 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: bunny-hop (1,25 s), climb-ladder (2 s), fall-and-get-up (5 s), first-step (4 s), idle (4 s), kneel-pick-sample (4 s), low-g-jump (1,25 s), plant-flag (3 s), point (2 s), run (0,75 s), salute (2 s), walk (1,167 s), wave (2 s)
- Nodos (42): LeftToeBase, LeftFoot, LeftLeg, LeftUpLeg, RightToeBase, RightFoot, RightLeg, RightUpLeg, LeftHandIndex2, LeftHandIndex1, LeftHandMiddle2, LeftHandMiddle1, LeftHandThumb2, LeftHandThumb1, hand-l, LeftHand, LeftForeArm, flag-patch, LeftArm, LeftShoulder, camera-head, Head, Neck, RightHandIndex2, RightHandIndex1, RightHandMiddle2, RightHandMiddle1, RightHandThumb2, RightHandThumb1, hand-r, RightHand, RightForeArm, RightArm, RightShoulder, Spine2, Spine1, Spine, Hips, Astronaut_LOD0, Astronaut_LOD1, CommanderStripes, Armature
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: Astronaut_LOD0
  - `[not-kebab-case]` Nodo no es kebab-case: Astronaut_LOD1
  - `[not-kebab-case]` Nodo no es kebab-case: CommanderStripes
  - `[not-kebab-case]` Nodo no es kebab-case: Armature

### astronaut.glb

- Peso: 0,068 MB (71.368 bytes)
- Triángulos: 6.271
- Caja: min [-34,457, -37,1314, -13,7988]  max [34,4571, 37,1313, 13,799]  tamaño 68,914 × 74,263 × 27,598 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (2): astnt1_1, astnt1_2
- Texturas: astnt1_1 image/webp 1024×1024; astnt1_2 image/webp 128×128
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (1): astronaut1
- Avisos: ninguno

### boot-print.glb

- Peso: 0,043 MB (44.536 bytes)
- Triángulos: 64
- Caja: min [-0,1, 0,004, -0,2]  max [0,1, 0,004, 0,2]  tamaño 0,2 × 0 × 0,4 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (1): BootPrint
- Texturas: bootprint_normal image/webp 512×256; bootprint_albedo image/webp 512×256; bootprint_orm image/webp 512×256
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (1): boot-print
- Avisos: ninguno

### cabin-panels.glb

- Peso: 0,971 MB (1.018.560 bytes)
- Triángulos: 37.580
- Caja: min [-1,0197, -0,8, -1,02]  max [1,0197, 0,85, 0,4788]  tamaño 2,039 × 1,65 × 1,499 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_materials_specular, KHR_mesh_quantization
- Materiales (26): CabinWall, ConsoleHousing, PanelBezel, WindowGlass, Aluminium, NeedleWhite, BlackAnodized, panel-ecs-plate, Chrome, Steel, Dials, GaugeGlass, GuardRed, panel-eps-plate, Talkback, DSKYDisplay, DSKYKeys, FDAIBall, lamp-abort, lamp-liftoff, master-alarm, TimerDisplay, panel-gnc-plate, FDAIReticle, FDAINeedle, DSKYHousing
- Texturas: paint_normal image/webp 512×512; paint_orm image/webp 512×512; alu_normal image/webp 512×512; alu_albedo image/webp 512×512; alu_orm image/webp 512×512; panel-ecs_albedo image/webp 2048×1812; dials_albedo image/webp 1024×1024; panel-eps_albedo image/webp 2048×1812; talkback_albedo image/webp 384×128; dsky_face_emissive image/webp 1024×512; dsky_face_albedo image/webp 1024×512; dsky_keys_albedo image/webp 512×512; fdai_albedo image/webp 1024×512; lamps_albedo image/webp 768×128; timer_emissive image/webp 512×128; timer_albedo image/webp 512×128; panel-gnc_albedo image/webp 2048×1980
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: guard-04-open (0,458 s), guard-09-open (0,458 s), guard-12-open (0,458 s), guard-13-open (0,458 s), guard-15-open (0,458 s)
- Nodos (140): cabin-shell, needle-cabin-press, needle-o2-flow, panel-ecs-body, switch-18, switch-19, switch-20, switch-21, switch-22, switch-23, switch-24, switch-25, switch-26, switch-27, panel-ecs, guard-04, guard-09, needle-volt-a, needle-volt-b, panel-eps-body, switch-01, switch-02, switch-03, switch-04, switch-05, switch-06, switch-07, switch-08, switch-09, switch-10, talkback-fc-1, talkback-fc-2, talkback-fc-3, panel-eps, dsky-display, dsky-key-0, dsky-key-1, dsky-key-2, dsky-key-3, dsky-key-4, dsky-key-5, dsky-key-6, dsky-key-7, dsky-key-8, dsky-key-9, dsky-key-clr, dsky-key-entr, dsky-key-keyrel, dsky-key-minus, dsky-key-noun, dsky-key-plus, dsky-key-pro, dsky-key-rset, dsky-key-verb, fdai-ball, guard-12, guard-13, guard-15, lamp-abort, lamp-liftoff, master-alarm, mission-timer-display, panel-gnc-body, switch-11, switch-12, switch-13, switch-14, switch-15, switch-16, switch-17, panel-gnc, CabinPanels, cabin-shell-geo, needle-cabin-press-geo, needle-o2-flow-geo, panel-ecs-body-geo, switch-18-geo, switch-19-geo, switch-20-geo, switch-21-geo, switch-22-geo, switch-23-geo, switch-24-geo, switch-25-geo, switch-26-geo, switch-27-geo, guard-04-geo, guard-09-geo, needle-volt-a-geo, needle-volt-b-geo, panel-eps-body-geo, switch-01-geo, switch-02-geo, switch-03-geo, switch-04-geo, switch-05-geo, switch-06-geo, switch-07-geo, switch-08-geo, switch-09-geo, switch-10-geo, talkback-fc-1-geo, talkback-fc-2-geo, talkback-fc-3-geo, dsky-display-geo, dsky-key-0-geo, dsky-key-1-geo, dsky-key-2-geo, dsky-key-3-geo, dsky-key-4-geo, dsky-key-5-geo, dsky-key-6-geo, dsky-key-7-geo, dsky-key-8-geo, dsky-key-9-geo, dsky-key-clr-geo, dsky-key-entr-geo, dsky-key-keyrel-geo, dsky-key-minus-geo, dsky-key-noun-geo, dsky-key-plus-geo, dsky-key-pro-geo, dsky-key-rset-geo, dsky-key-verb-geo, fdai-ball-geo, guard-12-geo, guard-13-geo, guard-15-geo, lamp-abort-geo, lamp-liftoff-geo, master-alarm-geo, mission-timer-display-geo, panel-gnc-body-geo, switch-11-geo, switch-12-geo, switch-13-geo, switch-14-geo, switch-15-geo, switch-16-geo, switch-17-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: CabinPanels

### cm-interior.glb

- Peso: 0,929 MB (974.292 bytes)
- Triángulos: 52.582
- Caja: min [-1,71, 0,2399, -1,71]  max [1,71, 2,99, 1,7339]  tamaño 3,42 × 2,75 × 3,444 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_materials_specular, KHR_mesh_quantization
- Materiales (18): CMI-Mamparo, CMI-Pared, CMI-Metal-Oscuro, CMI-Aluminio, CMI-Bisel, CMI-Acero, CMI-Casillero, CMI-Goma, CMI-Paneles, CMI-Panel-Canto, CMI-Asiento-Tela, CMI-Correa, CMI-Luz, CMI-Vidrio, CMI-Guarda-Roja, CMI-FDAI, CMI-Indice, CMI-Manguera
- Texturas: wall_normal image/webp 1024×1024; wall_albedo image/webp 1024×1024; wall_orm image/webp 1024×1024; atlas_emissive image/webp 2048×1024; atlas_normal image/webp 2048×1024; atlas_albedo image/webp 2048×1024; couch_normal image/webp 512×512; couch_albedo image/webp 512×512; couch_orm image/webp 512×512; fdai_albedo image/webp 1024×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: hatch-open (3,042 s), guard-01-open (0,542 s), guard-02-open (0,542 s), guard-03-open (0,542 s), guard-04-open (0,542 s), guard-05-open (0,542 s)
- Nodos (118): cabin-center, cabin-shell, cb-5, cb-8, couch-CDR, couch-CMP, couch-LMP, eye-CDR, eye-CMP, eye-LMP, flood-lights, forward-hatch, hatch-inner, hatch-inner-hinge, dsky-leb-keys, leb-122-switches, switch-17, switch-18, leb-122, light-flood-1, light-flood-2, light-flood-3, fdai-1-ball, guard-01, guard-02, guard-03, mdc-1-switches, switch-01, switch-02, switch-03, switch-04, switch-05, switch-06, switch-07, mdc-1, dsky-main-keys, fdai-2-ball, guard-04, mdc-2-switches, switch-08, switch-09, switch-10, mdc-2, guard-05, mdc-3-switches, switch-11, switch-12, switch-13, switch-14, switch-15, switch-16, mdc-3, mdc-structure, MDC, rhc-CDR, seat-CDR, seat-CMP, seat-LMP, suit-hoses, thc-CDR, wall-stringers, win-hatch, win-rdz-left, win-rdz-right, win-side-left, win-side-right, window-glass, CM_Interior, cabin-shell-geo, cb-5-geo, cb-8-geo, couch-CDR-geo, couch-CMP-geo, couch-LMP-geo, flood-lights-geo, forward-hatch-geo, hatch-inner-geo, dsky-leb-keys-geo, leb-122-switches-geo, switch-17-geo, switch-18-geo, leb-122-geo, fdai-1-ball-geo, guard-01-geo, guard-02-geo, guard-03-geo, mdc-1-switches-geo, switch-01-geo, switch-02-geo, switch-03-geo, switch-04-geo, switch-05-geo, switch-06-geo, switch-07-geo, mdc-1-geo, dsky-main-keys-geo, fdai-2-ball-geo, guard-04-geo, mdc-2-switches-geo, switch-08-geo, switch-09-geo, switch-10-geo, mdc-2-geo, guard-05-geo, mdc-3-switches-geo, switch-11-geo, switch-12-geo, switch-13-geo, switch-14-geo, switch-15-geo, switch-16-geo, mdc-3-geo, mdc-structure-geo, rhc-CDR-geo, suit-hoses-geo, thc-CDR-geo, wall-stringers-geo, window-glass-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: couch-CDR
  - `[not-kebab-case]` Nodo no es kebab-case: couch-CMP
  - `[not-kebab-case]` Nodo no es kebab-case: couch-LMP
  - `[not-kebab-case]` Nodo no es kebab-case: eye-CDR
  - `[not-kebab-case]` Nodo no es kebab-case: eye-CMP
  - `[not-kebab-case]` Nodo no es kebab-case: eye-LMP
  - `[not-kebab-case]` Nodo no es kebab-case: MDC
  - `[not-kebab-case]` Nodo no es kebab-case: rhc-CDR
  - `[not-kebab-case]` Nodo no es kebab-case: seat-CDR
  - `[not-kebab-case]` Nodo no es kebab-case: seat-CMP
  - `[not-kebab-case]` Nodo no es kebab-case: seat-LMP
  - `[not-kebab-case]` Nodo no es kebab-case: thc-CDR
  - `[not-kebab-case]` Nodo no es kebab-case: CM_Interior
  - `[not-kebab-case]` Nodo no es kebab-case: couch-CDR-geo
  - `[not-kebab-case]` Nodo no es kebab-case: couch-CMP-geo
  - `[not-kebab-case]` Nodo no es kebab-case: couch-LMP-geo
  - `[not-kebab-case]` Nodo no es kebab-case: rhc-CDR-geo
  - `[not-kebab-case]` Nodo no es kebab-case: thc-CDR-geo

### csm-columbia.glb

- Peso: 1,309 MB (1.372.504 bytes)
- Triángulos: 38.326
- Caja: min [-1,974, -10,1273, -2,3959]  max [1,974, 0,535, 2,262]  tamaño 3,948 × 10,662 × 4,658 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (17): Acero, Metal-Oscuro, CM-Mylar, Marco-Ventana, Vidrio, CM-Quemado, RCS-Tobera, CM-Ablator, Junta, Pintura-Blanca, SM-Aluminio, SM-Radiador, Lente, Aluminio-Estructura, Kapton-Oro, SPS-Tobera, SPS-Interior
- Texturas: mylar_normal image/webp 1024×1024; mylar_albedo image/webp 1024×1024; mylar_orm image/webp 1024×1024; ablator_normal image/webp 512×512; ablator_albedo image/webp 512×512; ablator_orm image/webp 512×512; paint_normal image/webp 512×512; paint_orm image/webp 512×512; alu_normal image/webp 1024×1024; alu_albedo image/webp 1024×1024; alu_orm image/webp 1024×1024; rad_normal image/webp 512×512; rad_albedo image/webp 512×512; rad_orm image/webp 512×512; sps_normal image/webp 512×512; sps_albedo image/webp 512×512; sps_orm image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: probe-retract (2,042 s), hatch-open (3,042 s), hga-deploy (4,042 s), sps-gimbal-test (5,042 s)
- Nodos (72): cg, probe-tip, CM-docking-probe, CM-hatch, CM-hatch-hinge, CM-RCS-pitch-down-1, CM-RCS-pitch-down-2, CM-RCS-pitch-down, CM-RCS-pitch-up-1, CM-RCS-pitch-up-2, CM-RCS-pitch-up, CM-RCS-roll-1-1, CM-RCS-roll-1-2, CM-RCS-roll-1, CM-RCS-roll-2-1, CM-RCS-roll-2-2, CM-RCS-roll-2, CM-RCS-yaw-left-1, CM-RCS-yaw-left-2, CM-RCS-yaw-left, CM-RCS-yaw-right-1, CM-RCS-yaw-right-2, CM-RCS-yaw-right, CM-shell, view-hatch, view-rendezvous-left, view-rendezvous-right, view-side-left, view-side-right, CM, SM-body, SM-HGA, SM-RCS-A-ccw, SM-RCS-A-cw, SM-RCS-A-down, SM-RCS-A-up, SM-RCS-A, SM-RCS-B-ccw, SM-RCS-B-cw, SM-RCS-B-down, SM-RCS-B-up, SM-RCS-B, SM-RCS-C-ccw, SM-RCS-C-cw, SM-RCS-C-down, SM-RCS-C-up, SM-RCS-C, SM-RCS-D-ccw, SM-RCS-D-cw, SM-RCS-D-down, SM-RCS-D-up, SM-RCS-D, sps-thrust-point, SM-SPS-bell, SM, CSM, CM-docking-probe-geo, CM-hatch-geo, CM-RCS-pitch-down-geo, CM-RCS-pitch-up-geo, CM-RCS-roll-1-geo, CM-RCS-roll-2-geo, CM-RCS-yaw-left-geo, CM-RCS-yaw-right-geo, CM-shell-geo, SM-body-geo, SM-HGA-geo, SM-RCS-A-geo, SM-RCS-B-geo, SM-RCS-C-geo, SM-RCS-D-geo, SM-SPS-bell-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: CM-docking-probe
  - `[not-kebab-case]` Nodo no es kebab-case: CM-hatch
  - `[not-kebab-case]` Nodo no es kebab-case: CM-hatch-hinge
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-down-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-down-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-down
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-up-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-up-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-up
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-1-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-1-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-2-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-2-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-left-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-left-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-left
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-right-1
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-right-2
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-right
  - `[not-kebab-case]` Nodo no es kebab-case: CM-shell
  - `[not-kebab-case]` Nodo no es kebab-case: CM
  - `[not-kebab-case]` Nodo no es kebab-case: SM-body
  - `[not-kebab-case]` Nodo no es kebab-case: SM-HGA
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A-ccw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A-cw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A-down
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A-up
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B-ccw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B-cw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B-down
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B-up
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C-ccw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C-cw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C-down
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C-up
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D-ccw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D-cw
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D-down
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D-up
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D
  - `[not-kebab-case]` Nodo no es kebab-case: SM-SPS-bell
  - `[not-kebab-case]` Nodo no es kebab-case: SM
  - `[not-kebab-case]` Nodo no es kebab-case: CSM
  - `[not-kebab-case]` Nodo no es kebab-case: CM-docking-probe-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-hatch-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-down-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-pitch-up-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-1-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-roll-2-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-left-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-RCS-yaw-right-geo
  - `[not-kebab-case]` Nodo no es kebab-case: CM-shell-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-body-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-HGA-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-A-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-B-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-C-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-RCS-D-geo
  - `[not-kebab-case]` Nodo no es kebab-case: SM-SPS-bell-geo

### easep-props.glb

- Peso: 1,157 MB (1.212.640 bytes)
- Triángulos: 20.192
- Caja: min [-3,1799, -0,15, 2,1442]  max [15,638, 2,0758, 9,2914]  tamaño 18,818 × 2,226 × 7,147 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (15): BootPrintDecal, PlaqueSteel, Steel, Aluminium, AluminiumDull, CornerCubeSilica, BlackAnodized, ThermalWhite, KaptonGold, MylarSilver, SolarCells, MylarSkirt, SWCFoil, TeflonGrip, BlackRubber
- Texturas: bootprints_normal image/webp 1024×512; bootprints_albedo image/webp 1024×512; bootprints_orm image/webp 1024×512; plaque_normal image/webp 1024×868; plaque_albedo image/webp 1024×868; plaque_orm image/webp 1024×868; alu_normal image/webp 512×512; alu_albedo image/webp 512×512; alu_orm image/webp 512×512; paint_normal image/webp 512×512; paint_orm image/webp 512×512; mylar_normal image/webp 512×512; mylar_albedo image/webp 512×512; mylar_orm image/webp 512×512; solar_normal image/webp 512×768; solar_albedo image/webp 512×768; solar_orm image/webp 512×768
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: psep-deploy (2,25 s), swc-unroll (3,042 s), swc-rollup (3,042 s), tongs-grab (0,833 s)
- Nodos (93): boot-print-a, boot-print-b, boot-print-c, boot-print-d, boot-trail-01, boot-trail-02, boot-trail-03, boot-trail-04, boot-trail-05, boot-trail-06, boot-trail-07, boot-trail-08, boot-trail-09, boot-trail-10, boot-trail-11, boot-trail-12, boot-trail-13, boot-trail-14, boot-trail-15, boot-trail-16, BootPrints, lm-plaque-attach, lm-plaque, lrrr-array, lrrr-base, lrrr-carry, LRRR, psep-body, psep-carry, psep-panel-l-outer, psep-panel-l, psep-panel-r-outer, psep-panel-r, psep-skirt, PSEP, swc-bar, swc-foil, swc-grip, swc-pole, swc-roller, SWC, drive-tube-grip, drive-tube, extension-handle-grip, extension-handle-socket, extension-handle, geo-hammer-grip, geo-hammer, tongs-grip, tongs-jaw-a, tongs-jaw-b, tongs, Tools, EASEP_Props, boot-print-a-geo, boot-print-b-geo, boot-print-c-geo, boot-print-d-geo, boot-trail-01-geo, boot-trail-02-geo, boot-trail-03-geo, boot-trail-04-geo, boot-trail-05-geo, boot-trail-06-geo, boot-trail-07-geo, boot-trail-08-geo, boot-trail-09-geo, boot-trail-10-geo, boot-trail-11-geo, boot-trail-12-geo, boot-trail-13-geo, boot-trail-14-geo, boot-trail-15-geo, boot-trail-16-geo, lm-plaque-geo, lrrr-array-geo, lrrr-base-geo, psep-body-geo, psep-panel-l-outer-geo, psep-panel-l-geo, psep-panel-r-outer-geo, psep-panel-r-geo, psep-skirt-geo, swc-bar-geo, swc-foil-geo, swc-pole-geo, swc-roller-geo, drive-tube-geo, extension-handle-geo, geo-hammer-geo, tongs-jaw-a-geo, tongs-jaw-b-geo, tongs-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: BootPrints
  - `[not-kebab-case]` Nodo no es kebab-case: LRRR
  - `[not-kebab-case]` Nodo no es kebab-case: PSEP
  - `[not-kebab-case]` Nodo no es kebab-case: SWC
  - `[not-kebab-case]` Nodo no es kebab-case: Tools
  - `[not-kebab-case]` Nodo no es kebab-case: EASEP_Props

### flag-mast.glb

- Peso: 0,269 MB (281.856 bytes)
- Triángulos: 4.444
- Caja: min [-0,898, -0,2, -0,0169]  max [0,0475, 2,23, 0,0167]  tamaño 0,946 × 2,43 × 0,034 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (5): Aluminium, AluminiumDull, Steel, FlagCloth, BlackAnodized
- Texturas: alu_normal image/webp 512×512; alu_albedo image/webp 512×512; alu_orm image/webp 512×512; cloth_normal image/webp 256×256; cloth_orm image/webp 256×256; paint_normal image/webp 512×512; paint_orm image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: crossbar-unfold (0,833 s), crossbar-extend (1,25 s)
- Nodos (16): collar, crossbar-inner, crossbar-outer, flag-cloth, crossbar, hit-point, latch, mast-pole, tip, FlagMast, collar-geo, crossbar-inner-geo, crossbar-outer-geo, flag-cloth-geo, latch-geo, mast-pole-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: FlagMast

### launch-tower.glb

- Peso: 0,532 MB (557.788 bytes)
- Triángulos: 22.708
- Caja: min [-32,1, -7,6308, -20,7218]  max [17,47, 136,3997, 20,7218]  tamaño 49,57 × 144,031 × 41,444 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (10): CraneYellow, TowerRed, DarkMetal, PipeWhite, Grating, EquipGreen, SteelGrey, Hose, WhiteRoom, Soot
- Texturas: tower_red image/webp 512×512; equip_green image/webp 512×512; ml_grey image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: swing-arms-retract (6,958 s)
- Nodos (25): crane-hammerhead-mesh, crane-hammerhead, lut-structure, swing-arm-1-mesh, swing-arm-1, swing-arm-2-mesh, swing-arm-2, swing-arm-3-mesh, swing-arm-3, swing-arm-4-mesh, swing-arm-4, swing-arm-5-mesh, swing-arm-5, swing-arm-6-mesh, swing-arm-6, swing-arm-7-mesh, swing-arm-7, swing-arm-8-mesh, swing-arm-8, swing-arm-9-mesh, swing-arm-9, lut, ml-platform, mobile-launcher, LaunchTower
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: LaunchTower

### lc39a-far.glb

- Peso: 0,326 MB (341.868 bytes)
- Triángulos: 2.432
- Caja: min [-2.841,2048, -29,5382, 569,0808]  max [4.649,9858, 148,4782, 2.420]  tamaño 7.491,191 × 178,016 × 1.850,919 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (1): Facade
- Texturas: facade_atlas image/webp 2048×2048
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (6): lcc, mss, pad-39b, utility-buildings, vab, LC39A_Far
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: LC39A_Far

### lc39a-pad.glb

- Peso: 1,05 MB (1.100.512 bytes)
- Triángulos: 9.410
- Caja: min [-363,8, -27,3339, -334,0099]  max [331, 29,178, 340,0099]  tamaño 694,8 × 56,512 × 674,02 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (7): Steel, Lamp, Galv, Concrete, Grass, CrawlRock, TankWhite
- Texturas: concrete_normal image/webp 1024×1024; concrete_albedo image/webp 1024×1024; ground_normal image/webp 512×512; foliage_albedo image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (8): pad-deflectors, pad-lamps, pad-light-masts, pad-mound, pad-pipes, pad-sheds, pad-tanks, LC39A_Pad
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: LC39A_Pad

### lc39a-terrain.glb

- Peso: 1,709 MB (1.791.676 bytes)
- Triángulos: 94.118
- Caja: min [-16.000, -35,854, -16.999,6592]  max [16.000, -8,6011, 16.732,1971]  tamaño 32.000 × 27,253 × 33.731,856 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (7): Sea, Surf, TerrainFar, TerrainNear, TerrainOuter, Foliage, VegCards
- Texturas: water_normal image/webp 512×512; surf_foam image/webp 512×128; ground_normal image/webp 512×512; terrain_far_albedo image/webp 1024×2048; terrain_near_albedo image/webp 2048×2048; foliage_albedo image/webp 512×512; veg_cards image/webp 1024×1024
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (9): sea, surf, terrain-far, terrain-near, terrain-outer, veg-hammocks, veg-palms, veg-scrub, LC39A_Terrain
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: LC39A_Terrain
  - `[over-1.5mb]` 1,709 MB supera el límite de 1.5 MB

### lm.glb

- Peso: 0,704 MB (738.464 bytes)
- Triángulos: 86.687
- Caja: min [-3,2145, 0,1026, -3,2157]  max [3,2129, 5,1154, 3,2109]  tamaño 6,427 × 5,013 × 6,427 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (7): blinn5SG.002, blinn8SG.001, blinn12SG.001, PaletteMaterial001, PaletteMaterial002, PaletteMaterial003, PaletteMaterial004
- Texturas: BOOSTER3 image/webp 400×400; TEXTUREA image/webp 900×900; TEXTURE_ image/webp 900×900; PaletteBaseColor image/webp 64×4
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: lunarlandeAction (0 s), group13 10Action (0 s), group13 11Action (0 s), group13 12Action (0 s), group13 13Action (0 s), group13 14Action (0 s), group13 g1Action (0 s), group13 g2Action (0 s), group13 g3Action (0 s), group13 g4Action (0 s), group13 g5Action (0 s), group13 g6Action (0 s), group13 g7Action (0 s), group13 g8Action (0 s), group13 g9Action (0 s), group13 grAction (0 s), group13 p1Action (0 s), group13 p2Action (0 s), group13 pCAction (0 s), group31 10Action (0 s), group31 11Action (0 s), group31 12Action (0 s), group31 13Action (0 s), group31 14Action (0 s), group31 15Action (0 s), group31 16Action (0 s), group31 17Action (0 s), group31 18Action (0 s), group31 19Action (0 s), group31 20Action (0 s), group31 21Action (0 s), group31 22Action (0 s), group31 g1Action (0 s), group31 g2Action (0 s), group31 g3Action (0 s), group31 g4Action (0 s), group31 g5Action (0 s), group31 g6Action (0 s), group31 g7Action (0 s), group31 g8Action (0 s), group31 g9Action (0 s), group31 grAction (0 s), group32 grAction (0 s), group51 10Action (0 s), group51 11Action (0 s), group51 12Action (0 s), group51 13Action (0 s), group51 14Action (0 s), group51 15Action (0 s), group51 16Action (0 s), group51 17Action (0 s), group51 18Action (0 s), group51 19Action (0 s), group51 20Action (0 s), group51 21Action (0 s), group51 g1Action (0 s), group51 g2Action (0 s), group51 g3Action (0 s), group51 g4Action (0 s), group51 g5Action (0 s), group51 g6Action (0 s), group51 g7Action (0 s), group51 g8Action (0 s), group51 g9Action (0 s), group51 grAction (0 s), group51 p1Action (0 s), group51 poAction (0 s), group51 pSAction (0 s), group61 p1Action (0 s), group61 p2Action (0 s), group61 pSAction (0 s), group73 g1Action (0 s), group73 g2Action (0 s), group73 grAction (0 s), group73 p1Action (0 s), group73 p2Action (0 s), group73 p3Action (0 s), group73 pCAction (0 s), group74 g1Action (0 s), group74 g2Action (0 s), group74 grAction (0 s), group74 p1Action (0 s), group74 p2Action (0 s), group74 p3Action (0 s), group74 pCAction (0 s), group75 10Action (0 s), group75 11Action (0 s), group75 g1Action (0 s), group75 g2Action (0 s), group75 g3Action (0 s), group75 grAction (0 s), group75 p1Action (0 s), group75 p2Action (0 s), group75 p3Action (0 s), group75 p4Action (0 s), group75 p5Action (0 s), group75 p6Action (0 s), group75 p7Action (0 s), group75 p8Action (0 s), group75 p9Action (0 s), group75 pCAction (0 s), group75 pPAction (0 s), pCone6Action (0 s), pCone7Action (0 s), pCube2Action (0 s), pCube27Action (0 s), pCube28Action (0 s), pCube29Action (0 s), pCube3Action (0 s), pCylinde10Action (0 s), pCylinde11Action (0 s), pCylinder1Action (0 s), pCylinder2Action (0 s), pCylinder3Action (0 s), pCylinder4Action (0 s), pCylinder5Action (0 s), pCylinder6Action (0 s), pCylinder7Action (0 s), pCylinder8Action (0 s), pCylinder9Action (0 s), polySurfa1Action (0 s), polySurfa2Action (0 s), polySurfa3Action (0 s), polySurfa4Action (0 s), polySurfacAction (0 s), pPipe1Action (0 s), pPipe2Action (0 s), pPlane1Action (0 s), pPlane2Action (0 s), pSphere20Action (0 s), pSphere26Action (0 s), pSphere27Action (0 s), pSphere28Action (0 s), pSphere29Action (0 s), pSphere30Action (0 s)
- Nodos (269): group13 10, group13 11, group13 12, group13 13, group13 14, group13 g1, group13 g2, group13 g3, group13 g4, group13 g5, group13 g6, group13 g7, group13 g8, group13 g9, group13 gr, group13 p1, group13 p2, group13 pC, group31 10, group31 11, group31 12, group31 13, group31 14, group31 15, group31 16, group31 17, group31 18, group31 19, group31 20, group31 21, group31 22, group31 g1, group31 g2, group31 g3, group31 g4, group31 g5, group31 g6, group31 g7, group31 g8, group31 g9, group31 gr, group32 gr, group51 10, group51 11, group51 12, group51 13, group51 14, group51 15, group51 16, group51 17, group51 18, group51 19, group51 20, group51 21, group51 g1, group51 g2, group51 g3, group51 g4, group51 g5, group51 g6, group51 g7, group51 g8, group51 g9, group51 gr, group51 p1, group51 po, group51 pS, group61 p1, group61 p2, group61 pS, group73 g1, group73 g2, group73 gr, group73 p1, group73 p2, group73 p3, group73 pC, group74 g1, group74 g2, group74 gr, group74 p1, group74 p2, group74 p3, group74 pC, group75 10, group75 11, group75 g1, group75 g2, group75 g3, group75 gr, group75 p1, group75 p2, group75 p3, group75 p4, group75 p5, group75 p6, group75 p7, group75 p8, group75 p9, group75 pC, group75 pP, pCone6, pCone7, pCube2, pCube27, pCube28, pCube29, pCube3, pCylinde10, pCylinde11, pCylinder1, pCylinder2, pCylinder3, pCylinder4, pCylinder5, pCylinder6, pCylinder7, pCylinder8, pCylinder9, polySurfa1, polySurfa2, polySurfa3, polySurfa4, polySurfac, pPipe1, pPipe2, pPlane1, pPlane2, pSphere20, pSphere26, pSphere27, pSphere28, pSphere29, pSphere30, lunarlande, (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre)
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: group13 10
  - `[not-kebab-case]` Nodo no es kebab-case: group13 11
  - `[not-kebab-case]` Nodo no es kebab-case: group13 12
  - `[not-kebab-case]` Nodo no es kebab-case: group13 13
  - `[not-kebab-case]` Nodo no es kebab-case: group13 14
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g3
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g4
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g5
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g6
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g7
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g8
  - `[not-kebab-case]` Nodo no es kebab-case: group13 g9
  - `[not-kebab-case]` Nodo no es kebab-case: group13 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group13 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group13 p2
  - `[not-kebab-case]` Nodo no es kebab-case: group13 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group31 10
  - `[not-kebab-case]` Nodo no es kebab-case: group31 11
  - `[not-kebab-case]` Nodo no es kebab-case: group31 12
  - `[not-kebab-case]` Nodo no es kebab-case: group31 13
  - `[not-kebab-case]` Nodo no es kebab-case: group31 14
  - `[not-kebab-case]` Nodo no es kebab-case: group31 15
  - `[not-kebab-case]` Nodo no es kebab-case: group31 16
  - `[not-kebab-case]` Nodo no es kebab-case: group31 17
  - `[not-kebab-case]` Nodo no es kebab-case: group31 18
  - `[not-kebab-case]` Nodo no es kebab-case: group31 19
  - `[not-kebab-case]` Nodo no es kebab-case: group31 20
  - `[not-kebab-case]` Nodo no es kebab-case: group31 21
  - `[not-kebab-case]` Nodo no es kebab-case: group31 22
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g3
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g4
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g5
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g6
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g7
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g8
  - `[not-kebab-case]` Nodo no es kebab-case: group31 g9
  - `[not-kebab-case]` Nodo no es kebab-case: group31 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group32 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group51 10
  - `[not-kebab-case]` Nodo no es kebab-case: group51 11
  - `[not-kebab-case]` Nodo no es kebab-case: group51 12
  - `[not-kebab-case]` Nodo no es kebab-case: group51 13
  - `[not-kebab-case]` Nodo no es kebab-case: group51 14
  - `[not-kebab-case]` Nodo no es kebab-case: group51 15
  - `[not-kebab-case]` Nodo no es kebab-case: group51 16
  - `[not-kebab-case]` Nodo no es kebab-case: group51 17
  - `[not-kebab-case]` Nodo no es kebab-case: group51 18
  - `[not-kebab-case]` Nodo no es kebab-case: group51 19
  - `[not-kebab-case]` Nodo no es kebab-case: group51 20
  - `[not-kebab-case]` Nodo no es kebab-case: group51 21
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g3
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g4
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g5
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g6
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g7
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g8
  - `[not-kebab-case]` Nodo no es kebab-case: group51 g9
  - `[not-kebab-case]` Nodo no es kebab-case: group51 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group51 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group51 po
  - `[not-kebab-case]` Nodo no es kebab-case: group51 pS
  - `[not-kebab-case]` Nodo no es kebab-case: group61 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group61 p2
  - `[not-kebab-case]` Nodo no es kebab-case: group61 pS
  - `[not-kebab-case]` Nodo no es kebab-case: group73 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group73 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group73 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group73 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group73 p2
  - `[not-kebab-case]` Nodo no es kebab-case: group73 p3
  - `[not-kebab-case]` Nodo no es kebab-case: group73 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group74 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group74 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group74 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group74 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group74 p2
  - `[not-kebab-case]` Nodo no es kebab-case: group74 p3
  - `[not-kebab-case]` Nodo no es kebab-case: group74 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group75 10
  - `[not-kebab-case]` Nodo no es kebab-case: group75 11
  - `[not-kebab-case]` Nodo no es kebab-case: group75 g1
  - `[not-kebab-case]` Nodo no es kebab-case: group75 g2
  - `[not-kebab-case]` Nodo no es kebab-case: group75 g3
  - `[not-kebab-case]` Nodo no es kebab-case: group75 gr
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p1
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p2
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p3
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p4
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p5
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p6
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p7
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p8
  - `[not-kebab-case]` Nodo no es kebab-case: group75 p9
  - `[not-kebab-case]` Nodo no es kebab-case: group75 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group75 pP
  - `[not-kebab-case]` Nodo no es kebab-case: pCone6
  - `[not-kebab-case]` Nodo no es kebab-case: pCone7
  - `[not-kebab-case]` Nodo no es kebab-case: pCube2
  - `[not-kebab-case]` Nodo no es kebab-case: pCube27
  - `[not-kebab-case]` Nodo no es kebab-case: pCube28
  - `[not-kebab-case]` Nodo no es kebab-case: pCube29
  - `[not-kebab-case]` Nodo no es kebab-case: pCube3
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinde10
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinde11
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder1
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder2
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder3
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder4
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder5
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder6
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder7
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder8
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder9
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa1
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa2
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa3
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa4
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfac
  - `[not-kebab-case]` Nodo no es kebab-case: pPipe1
  - `[not-kebab-case]` Nodo no es kebab-case: pPipe2
  - `[not-kebab-case]` Nodo no es kebab-case: pPlane1
  - `[not-kebab-case]` Nodo no es kebab-case: pPlane2
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere20
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere26
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere27
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere28
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere29
  - `[not-kebab-case]` Nodo no es kebab-case: pSphere30
  - `[not-kebab-case]` Hay nodos sin nombre
  - `[not-kebab-case]` Clip no es kebab-case: lunarlandeAction
  - `[not-kebab-case]` Clip no es kebab-case: group13 10Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 11Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 12Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 13Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 14Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g3Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g4Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g5Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g6Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g7Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g8Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 g9Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group13 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 p2Action
  - `[not-kebab-case]` Clip no es kebab-case: group13 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group31 10Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 11Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 12Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 13Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 14Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 15Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 16Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 17Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 18Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 19Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 20Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 21Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 22Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g3Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g4Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g5Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g6Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g7Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g8Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 g9Action
  - `[not-kebab-case]` Clip no es kebab-case: group31 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group32 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group51 10Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 11Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 12Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 13Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 14Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 15Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 16Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 17Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 18Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 19Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 20Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 21Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g3Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g4Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g5Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g6Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g7Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g8Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 g9Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group51 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group51 poAction
  - `[not-kebab-case]` Clip no es kebab-case: group51 pSAction
  - `[not-kebab-case]` Clip no es kebab-case: group61 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group61 p2Action
  - `[not-kebab-case]` Clip no es kebab-case: group61 pSAction
  - `[not-kebab-case]` Clip no es kebab-case: group73 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group73 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group73 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group73 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group73 p2Action
  - `[not-kebab-case]` Clip no es kebab-case: group73 p3Action
  - `[not-kebab-case]` Clip no es kebab-case: group73 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group74 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group74 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group74 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group74 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group74 p2Action
  - `[not-kebab-case]` Clip no es kebab-case: group74 p3Action
  - `[not-kebab-case]` Clip no es kebab-case: group74 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group75 10Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 11Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 g1Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 g2Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 g3Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 grAction
  - `[not-kebab-case]` Clip no es kebab-case: group75 p1Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p2Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p3Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p4Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p5Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p6Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p7Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p8Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 p9Action
  - `[not-kebab-case]` Clip no es kebab-case: group75 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group75 pPAction
  - `[not-kebab-case]` Clip no es kebab-case: pCone6Action
  - `[not-kebab-case]` Clip no es kebab-case: pCone7Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube2Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube27Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube28Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube29Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube3Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinde10Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinde11Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder1Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder2Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder3Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder4Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder5Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder6Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder7Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder8Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder9Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa1Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa2Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa3Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa4Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfacAction
  - `[not-kebab-case]` Clip no es kebab-case: pPipe1Action
  - `[not-kebab-case]` Clip no es kebab-case: pPipe2Action
  - `[not-kebab-case]` Clip no es kebab-case: pPlane1Action
  - `[not-kebab-case]` Clip no es kebab-case: pPlane2Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere20Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere26Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere27Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere28Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere29Action
  - `[not-kebab-case]` Clip no es kebab-case: pSphere30Action

### moon-rocks.glb

- Peso: 1,388 MB (1.455.456 bytes)
- Triángulos: 27.900
- Caja: min [-3,8346, -0,0288, -0,8479]  max [4,2225, 0,8927, 0,7219]  tamaño 8,057 × 0,921 × 1,57 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (1): MoonRock
- Texturas: rock_normal image/webp 1024×1024; rock_albedo image/webp 1024×1024; rock_orm image/webp 1024×1024
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (12): rock-01, rock-02, rock-03, rock-04, rock-05, rock-06, rock-07, rock-08, rock-09, rock-10, sample-rock, moon-rocks
- Avisos: ninguno

### moon-surface-tile.glb

- Peso: 1,098 MB (1.151.256 bytes)
- Triángulos: 41.472
- Caja: min [-16, -0,9993, -16]  max [16, 0,4461, 16]  tamaño 32 × 1,445 × 32 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (1): Regolith
- Texturas: regolith_normal image/webp 1024×1024; regolith_albedo image/webp 1024×1024; regolith_orm image/webp 1024×1024
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (1): moon-surface-tile
- Avisos: ninguno

### rover.glb

- Peso: 1,906 MB (1.998.076 bytes)
- Triángulos: 183.037
- Caja: min [-1,3523, 0,0007, -1,7363]  max [1,3523, 1,8463, 1,3719]  tamaño 2,705 × 1,846 × 3,108 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_clearcoat, KHR_materials_ior, KHR_materials_specular, KHR_materials_transmission, KHR_mesh_quantization
- Materiales (32): mars_2020_03, mars_2020_01_n, transparent, mars_2020_02, glass_trans, mars_2020_06_brass, mars_2020_05, mars_2020_02_n, blades, mars_2020_01, mars_2020_04, mars_2020_04_aluminum_r, hub, mars_2020_05_gunmetal, mars_2020_gunmetal_dark, mars_2020_07, mars_2020_06, arm_graphics, mars_2020_05_brass, mars_2020_05_aluminum, mars_2020_05_cooling_lines, glass_2, mars_2020_06_n, sample_handling_door, PaletteMaterial001, PaletteMaterial002, PaletteMaterial003, PaletteMaterial004, PaletteMaterial005, PaletteMaterial006, PaletteMaterial007, PaletteMaterial008
- Texturas: mars_2020_03 image/webp 1024×1024; mars_2020_01_n image/webp 1024×1024; mars_2020_01 image/webp 1024×1024; mars_2020_02 image/webp 1024×1024; glass image/webp 128×128; mars_2020_06_n image/webp 1024×1024; mars_2020_06 image/webp 1024×1024; mars_2020_05 image/webp 1024×1024; mars_2020_02_n image/webp 1024×1024; blade image/webp 1024×512; mars_2020_04 image/webp 1024×1024; mars_2020_spring_n image/webp 256×256; mars_2020_hub_n image/webp 256×256; mars_2020_hub image/webp 256×256; mars_2020_05_n image/webp 1024×1024; foil_n.jpg image/webp 512×512; mars_2020_07 image/webp 512×512; arm_graphics image/webp 512×512; mars_2020_05_r image/webp 1024×1024; sample_handling_door image/webp 512×512; PaletteBaseColor image/webp 128×4; PaletteMetallicRoughness image/webp 128×4
- Skins: Armature (15 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: CylinderAction (20,042 s), bottomAction (1,25 s), Empty.001Action.003 (3,75 s), Action (20 s), topAction (20 s), Cylinder.002Action (20 s), ArmatureAction (15 s), haz_cov_front (0 s), e_covers_rear (1,25 s), haz_cov_rear_l (0 s), haz_cov_rear_r (0 s), arm.003Action (24,167 s), arm.002Action (24,167 s), armAction (24,167 s), arm.004Action (24,167 s), turret_objAction (22,917 s), turret_cam_cover_01 (22,917 s), turret.001Action.001 (22,917 s), hingeAction (16,875 s), Empty.002Action (1,25 s), Action (20 s), arm_01_pivotAction (2,5 s), arm_02_pivotAction (3,75 s)
- Nodos (86): bottom.002, bottom.003, Cylinder.001, Empty.001, probe.001, lens, Mastcam_Z_cams, NavCams, head, Cylinder.002, top, bottom, Cylinder, Bone.014, Bone.013, Bone.012, Bone.011, Bone.010, Bone.009, Bone.008, Bone.007, Bone.006, Bone.005, Bone.004, Bone.003, Bone.002, Bone.001, Bone, bottom.001, Armature, Body, hazcams_front, hazcams_front_cover, Empty, hazcams_rear_cover_l, hazcams_rear_cover_r, Wheels_objs, suspension, arm.001, corring_drill, cover_02, cover_03, PIXL_cover_01, hinge, hinge_cover_01, PIXL, turret_obj, arm.004, arm, arm.002, arm.003, lab, rtg, Name_Chips, probe, Up_Look_Camera, arm_01, arm_01_pivot, arm_01_joint, arm_02, arm_02_pivot, arm_02_joint, Body_Parts, calibration_target, box, arm_cable_etc, (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre)
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: bottom.002
  - `[not-kebab-case]` Nodo no es kebab-case: bottom.003
  - `[not-kebab-case]` Nodo no es kebab-case: Cylinder.001
  - `[not-kebab-case]` Nodo no es kebab-case: Empty.001
  - `[not-kebab-case]` Nodo no es kebab-case: probe.001
  - `[not-kebab-case]` Nodo no es kebab-case: Mastcam_Z_cams
  - `[not-kebab-case]` Nodo no es kebab-case: NavCams
  - `[not-kebab-case]` Nodo no es kebab-case: Cylinder.002
  - `[not-kebab-case]` Nodo no es kebab-case: Cylinder
  - `[not-kebab-case]` Nodo no es kebab-case: bottom.001
  - `[not-kebab-case]` Nodo no es kebab-case: Armature
  - `[not-kebab-case]` Nodo no es kebab-case: Body
  - `[not-kebab-case]` Nodo no es kebab-case: hazcams_front
  - `[not-kebab-case]` Nodo no es kebab-case: hazcams_front_cover
  - `[not-kebab-case]` Nodo no es kebab-case: Empty
  - `[not-kebab-case]` Nodo no es kebab-case: hazcams_rear_cover_l
  - `[not-kebab-case]` Nodo no es kebab-case: hazcams_rear_cover_r
  - `[not-kebab-case]` Nodo no es kebab-case: Wheels_objs
  - `[not-kebab-case]` Nodo no es kebab-case: arm.001
  - `[not-kebab-case]` Nodo no es kebab-case: corring_drill
  - `[not-kebab-case]` Nodo no es kebab-case: cover_02
  - `[not-kebab-case]` Nodo no es kebab-case: cover_03
  - `[not-kebab-case]` Nodo no es kebab-case: PIXL_cover_01
  - `[not-kebab-case]` Nodo no es kebab-case: hinge_cover_01
  - `[not-kebab-case]` Nodo no es kebab-case: PIXL
  - `[not-kebab-case]` Nodo no es kebab-case: turret_obj
  - `[not-kebab-case]` Nodo no es kebab-case: arm.004
  - `[not-kebab-case]` Nodo no es kebab-case: arm.002
  - `[not-kebab-case]` Nodo no es kebab-case: arm.003
  - `[not-kebab-case]` Nodo no es kebab-case: Name_Chips
  - `[not-kebab-case]` Nodo no es kebab-case: Up_Look_Camera
  - `[not-kebab-case]` Nodo no es kebab-case: arm_01
  - `[not-kebab-case]` Nodo no es kebab-case: arm_01_pivot
  - `[not-kebab-case]` Nodo no es kebab-case: arm_01_joint
  - `[not-kebab-case]` Nodo no es kebab-case: arm_02
  - `[not-kebab-case]` Nodo no es kebab-case: arm_02_pivot
  - `[not-kebab-case]` Nodo no es kebab-case: arm_02_joint
  - `[not-kebab-case]` Nodo no es kebab-case: Body_Parts
  - `[not-kebab-case]` Nodo no es kebab-case: calibration_target
  - `[not-kebab-case]` Nodo no es kebab-case: arm_cable_etc
  - `[not-kebab-case]` Hay nodos sin nombre
  - `[not-kebab-case]` Clip no es kebab-case: CylinderAction
  - `[not-kebab-case]` Clip no es kebab-case: bottomAction
  - `[not-kebab-case]` Clip no es kebab-case: Empty.001Action.003
  - `[not-kebab-case]` Clip no es kebab-case: Action
  - `[not-kebab-case]` Clip no es kebab-case: topAction
  - `[not-kebab-case]` Clip no es kebab-case: Cylinder.002Action
  - `[not-kebab-case]` Clip no es kebab-case: ArmatureAction
  - `[not-kebab-case]` Clip no es kebab-case: haz_cov_front
  - `[not-kebab-case]` Clip no es kebab-case: e_covers_rear
  - `[not-kebab-case]` Clip no es kebab-case: haz_cov_rear_l
  - `[not-kebab-case]` Clip no es kebab-case: haz_cov_rear_r
  - `[not-kebab-case]` Clip no es kebab-case: arm.003Action
  - `[not-kebab-case]` Clip no es kebab-case: arm.002Action
  - `[not-kebab-case]` Clip no es kebab-case: armAction
  - `[not-kebab-case]` Clip no es kebab-case: arm.004Action
  - `[not-kebab-case]` Clip no es kebab-case: turret_objAction
  - `[not-kebab-case]` Clip no es kebab-case: turret_cam_cover_01
  - `[not-kebab-case]` Clip no es kebab-case: turret.001Action.001
  - `[not-kebab-case]` Clip no es kebab-case: hingeAction
  - `[not-kebab-case]` Clip no es kebab-case: Empty.002Action
  - `[not-kebab-case]` Clip no es kebab-case: Action
  - `[not-kebab-case]` Clip no es kebab-case: arm_01_pivotAction
  - `[not-kebab-case]` Clip no es kebab-case: arm_02_pivotAction
  - `[over-1.5mb]` 1,906 MB supera el límite de 1.5 MB

### s4b-sla.glb

- Peso: 1,382 MB (1.448.768 bytes)
- Triángulos: 38.660
- Caja: min [-3,4212, -20,651, -3,902]  max [3,4212, 8,515, 3,902]  tamaño 6,842 × 29,166 × 7,804 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (17): S4B-Negro, Aluminio-Estructura, Metal-Oscuro, Kapton-Oro, Pintura-Blanca, S4B-Blanco, Junta, RCS-Tobera, S4B-Corrugado-Negro, S4B-Corrugado-Blanco, S4B-Aislante, J2-Tubos, J2-Interior, Acero, SLA-Corcho, SLA-Interior, SLA-Canto
- Texturas: paint_normal image/webp 512×512; paint_orm image/webp 512×512; alu_normal image/webp 1024×1024; alu_albedo image/webp 1024×1024; alu_orm image/webp 1024×1024; mylar_normal image/webp 1024×1024; corr_normal image/webp 512×512; tubes_normal image/webp 512×512; cork_normal image/webp 512×512; cork_albedo image/webp 512×512; cork_orm image/webp 512×512; honey_normal image/webp 512×512; honey_albedo image/webp 512×512; honey_orm image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: sla-open (2,542 s), sla-open-wide (5,042 s), sla-jettison (10,042 s)
- Nodos (37): IU, S4B-APS-1-pitch, S4B-APS-1-ullage, S4B-APS-1-yaw-roll-1, S4B-APS-1-yaw-roll-2, S4B-APS-1, S4B-APS-2-pitch, S4B-APS-2-ullage, S4B-APS-2-yaw-roll-1, S4B-APS-2-yaw-roll-2, S4B-APS-2, S4B-body, j2-thrust-point, S4B-J2, S4B-J2-actuators, S4B, csm-dock-launch, lm-docking-target, lm-stow, sla-fixed, sla-panel-1, sla-panel-2, sla-panel-3, sla-panel-4, SLA, S4B-SLA, IU-geo, S4B-APS-1-geo, S4B-APS-2-geo, S4B-body-geo, S4B-J2-geo, S4B-J2-actuators-geo, sla-fixed-geo, sla-panel-1-geo, sla-panel-2-geo, sla-panel-3-geo, sla-panel-4-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: IU
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1-pitch
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1-ullage
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1-yaw-roll-1
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1-yaw-roll-2
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2-pitch
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2-ullage
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2-yaw-roll-1
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2-yaw-roll-2
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-body
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-J2
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-J2-actuators
  - `[not-kebab-case]` Nodo no es kebab-case: S4B
  - `[not-kebab-case]` Nodo no es kebab-case: SLA
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-SLA
  - `[not-kebab-case]` Nodo no es kebab-case: IU-geo
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-1-geo
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-APS-2-geo
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-body-geo
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-J2-geo
  - `[not-kebab-case]` Nodo no es kebab-case: S4B-J2-actuators-geo

### sample-box.glb

- Peso: 0,338 MB (354.236 bytes)
- Triángulos: 8.006
- Caja: min [-0,245, -0,0015, -0,1574]  max [0,5638, 0,84, 0,1951]  tamaño 0,809 × 0,841 × 0,352 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (9): TeflonBag, Aluminium, BlackAnodized, BlackRubber, Steel, SRCAluminium, IndiumSeal, YorkMeshLiner, DataPlate
- Texturas: cloth_normal image/webp 256×256; cloth_orm image/webp 256×256; alu_normal image/webp 512×512; alu_albedo image/webp 512×512; alu_orm image/webp 512×512; paint_normal image/webp 512×512; paint_orm image/webp 512×512; labels_albedo image/webp 512×256
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: lid-open (1,458 s)
- Nodos (17): grip, sample-bag, sampler-handle, ContingencySampler, latch-l, latch-r, lid-shell, lid, sample-slot, src-body, SampleBox, sample-bag-geo, sampler-handle-geo, latch-l-geo, latch-r-geo, lid-shell-geo, src-body-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: ContingencySampler
  - `[not-kebab-case]` Nodo no es kebab-case: SampleBox

### saturn_v.glb

- Peso: 0,226 MB (236.740 bytes)
- Triángulos: 26.171
- Caja: min [-1,0194, -0,1409, -0,2641]  max [0,9949, 12,8459, 1,7502]  tamaño 2,014 × 12,987 × 2,014 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (7): blinn10SG, blinn9SG, blinn8SG, blinn11SG, PaletteMaterial001, PaletteMaterial002, PaletteMaterial003
- Texturas: SATURNVU image/webp 1000×1000; SATURNVA image/webp 1000×1000; SATURNVT image/webp 1000×1000; SATURNVW image/webp 1000×1000; PaletteBaseColor image/webp 64×4
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: saturnv_caAction (0 s), group1 groAction (0 s), group1 pCoAction (0 s), group10 pCAction (0 s), group11 pCAction (0 s), group3 groAction (0 s), group6 pCuAction (0 s), group7 pCuAction (0 s), group8 pCyAction (0 s), group9 pCyAction (0 s), pCone2 groAction (0 s), pCube1 gr1Action (0 s), pCube1 groAction (0 s), pCylinder1Action (0 s), pCylinder2Action (0 s), pCylinder3Action (0 s), pCylinder4Action (0 s), pCylinder5Action (0 s), polySurfa1Action (0 s), polySurfa2Action (0 s), polySurfa3Action (0 s), polySurfa4Action (0 s), polySurfacAction (0 s)
- Nodos (45): group1 gro, group1 pCo, group10 pC, group11 pC, group3 gro, group6 pCu, group7 pCu, group8 pCy, group9 pCy, pCone2 gro, pCube1 gr1, pCube1 gro, pCylinder1, pCylinder2, pCylinder3, pCylinder4, pCylinder5, polySurfa1, polySurfa2, polySurfa3, polySurfa4, polySurfac, saturnv_ca, (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre), (sin-nombre)
- Avisos:
  - `[not-kebab-case]` Nombre de archivo no es kebab-case: saturn_v.glb
  - `[not-kebab-case]` Nodo no es kebab-case: group1 gro
  - `[not-kebab-case]` Nodo no es kebab-case: group1 pCo
  - `[not-kebab-case]` Nodo no es kebab-case: group10 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group11 pC
  - `[not-kebab-case]` Nodo no es kebab-case: group3 gro
  - `[not-kebab-case]` Nodo no es kebab-case: group6 pCu
  - `[not-kebab-case]` Nodo no es kebab-case: group7 pCu
  - `[not-kebab-case]` Nodo no es kebab-case: group8 pCy
  - `[not-kebab-case]` Nodo no es kebab-case: group9 pCy
  - `[not-kebab-case]` Nodo no es kebab-case: pCone2 gro
  - `[not-kebab-case]` Nodo no es kebab-case: pCube1 gr1
  - `[not-kebab-case]` Nodo no es kebab-case: pCube1 gro
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder1
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder2
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder3
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder4
  - `[not-kebab-case]` Nodo no es kebab-case: pCylinder5
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa1
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa2
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa3
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfa4
  - `[not-kebab-case]` Nodo no es kebab-case: polySurfac
  - `[not-kebab-case]` Nodo no es kebab-case: saturnv_ca
  - `[not-kebab-case]` Hay nodos sin nombre
  - `[not-kebab-case]` Clip no es kebab-case: saturnv_caAction
  - `[not-kebab-case]` Clip no es kebab-case: group1 groAction
  - `[not-kebab-case]` Clip no es kebab-case: group1 pCoAction
  - `[not-kebab-case]` Clip no es kebab-case: group10 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group11 pCAction
  - `[not-kebab-case]` Clip no es kebab-case: group3 groAction
  - `[not-kebab-case]` Clip no es kebab-case: group6 pCuAction
  - `[not-kebab-case]` Clip no es kebab-case: group7 pCuAction
  - `[not-kebab-case]` Clip no es kebab-case: group8 pCyAction
  - `[not-kebab-case]` Clip no es kebab-case: group9 pCyAction
  - `[not-kebab-case]` Clip no es kebab-case: pCone2 groAction
  - `[not-kebab-case]` Clip no es kebab-case: pCube1 gr1Action
  - `[not-kebab-case]` Clip no es kebab-case: pCube1 groAction
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder1Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder2Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder3Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder4Action
  - `[not-kebab-case]` Clip no es kebab-case: pCylinder5Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa1Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa2Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa3Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfa4Action
  - `[not-kebab-case]` Clip no es kebab-case: polySurfacAction

### saturn-v.glb

- Peso: 0,851 MB (892.664 bytes)
- Triángulos: 53.492
- Caja: min [-6,5054, -0,0001, -6,5054]  max [6,5054, 110,6, 6,5054]  tamaño 13,011 × 110,6 × 13,011 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (15): PaintBlack, DarkMetal, SeamGap, JointMetal, EngineF1, PaintWhite, CorrWhite, CorrBlack, HeatShield, DecalRed, Flag, EngineJ2, Aluminum, CMFoil, Window
- Texturas: skin_normal image/webp 1024×1024; paint_black image/webp 1024×1024; bolt_normal image/webp 512×512; tube_normal image/webp 512×512; engine_dark image/webp 512×512; paint_white image/webp 1024×1024; corr_normal image/webp 1024×1024; flag_us image/webp 380×200; engine_steel image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (25): iu-ring, IU, s1c-engines-f1, s1c-fairings-fins, s1c-skin, s1c-thrust-point, S1C, s2-aft-interstage-mesh, s2-aft-interstage, s2-engines-j2, s2-skin, s2-thrust-point, S2, s4b-engine-j2, s4b-skin, s4b-thrust-point, S4B, csm-sm-cm, CSM, les-tower-bpc, LES, sla-panels, SLA, Spacecraft, SaturnV
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: IU
  - `[not-kebab-case]` Nodo no es kebab-case: S1C
  - `[not-kebab-case]` Nodo no es kebab-case: S2
  - `[not-kebab-case]` Nodo no es kebab-case: S4B
  - `[not-kebab-case]` Nodo no es kebab-case: CSM
  - `[not-kebab-case]` Nodo no es kebab-case: LES
  - `[not-kebab-case]` Nodo no es kebab-case: SLA
  - `[not-kebab-case]` Nodo no es kebab-case: Spacecraft
  - `[not-kebab-case]` Nodo no es kebab-case: SaturnV

### tv-camera.glb

- Peso: 0,306 MB (320.368 bytes)
- Triángulos: 8.150
- Caja: min [-0,4341, -0,002, -3,0003]  max [0,7363, 1,181, 0,262]  tamaño 1,17 × 1,183 × 3,262 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_specular, KHR_mesh_quantization
- Materiales (8): Cable, BlackAnodized, Aluminium, CameraBody, Steel, Nameplate, LensGlass, AluminiumDull
- Texturas: paint_normal image/webp 512×512; paint_orm image/webp 512×512; alu_normal image/webp 512×512; alu_albedo image/webp 512×512; alu_orm image/webp 512×512; labels_albedo image/webp 512×256
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (14): cable, pan-head, camera-body, lens, lens-axis, tilt, pan, tripod, TVCamera, cable-geo, pan-head-geo, camera-body-geo, lens-geo, tripod-geo
- Avisos:
  - `[not-kebab-case]` Nodo no es kebab-case: TVCamera
