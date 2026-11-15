# Planta la bandera

Three-mission browser game (Spanish / English), solo with Pancho or two players:
Apollo lunar expedition; Red Garden Mars crops; Horizon fictional rescue expedition.

## Jugar en línea / Play online

**https://nasa.nickzar.online**

«Apolo 11: Un gran salto» (NASA Space Apps 2026, reto Space Mission Design Game). Funciona en computadora, portátil, tableta y teléfono, con teclado y ratón o con controles táctiles. No requiere instalación.

"Apollo 11: One Giant Leap" (NASA Space Apps 2026, Space Mission Design Game challenge). Runs in the browser on desktop, laptop, tablet and phone, with keyboard and mouse or touch controls. No install needed.

## Install and run

Use Node.js 22.12+ (or a compatible newer release). From this repository root:

```sh
npm ci
npm test
npm run test:expeditions
npm run build
npm start
```

Open http://127.0.0.1:8787. The Node server serves only the generated `dist/` game and game endpoints; it supplies WebSocket rooms and QR join links. Do not serve the repository root as a static website. `npm run dev -- --host 127.0.0.1` starts Vite; its `/ws` and `/qr` proxy need the Node server on port 8787.

The canonical install instructions use `package-lock.json`; the existing compatible `pnpm-lock.yaml` is also retained. Do not mix package managers during one installation.

Optional deployment configuration (no credentials supplied): `HOST` (default 127.0.0.1), `PORT` (8787), `STATIC_DIR` (dist), and `PUBLIC_URL` (the actual externally reachable origin). Any later public hosting is a separate action, not performed by this import. A reverse proxy must forward WebSocket upgrade requests at `/ws`, preserve the public Host and supply trusted `X-Forwarded-Proto`. Set `PUBLIC_URL` explicitly for correct QR URLs. Forwarded headers must come only from your trusted proxy. Test HTTPS resources, WSS pairing, rejoin and QR joins on the real deployed origin, not only localhost.

## Game and verification

Mission 1: launch, cruise, lunar descent, EVA/flag/science, photograph and debrief. Mission 2: Mars EDL, rover collection, greenhouse, five sols and crop outcome. Mission 3: rescue, return and debrief; explicitly fictional time scale and illustrative physics, NOT a claim that one can escape a real black hole. See `EXPEDITIONS.md` for controls and shared-room behavior.

`npm test` covers Apollo physics and A7L/EASEP GLB contracts. `npm run test:expeditions` covers Mars/Horizon simulations. With a server already running: `node tests/relay.test.mjs`, `node tests/expeditions-rooms.test.mjs`, and `node tests/preview.test.mjs` exercise room and static-serving contracts. Review each harness configuration before running it; defaults target local services, not a public origin.

Browser harnesses use `puppeteer-core` and require separately installed Chrome (existing default `/usr/bin/google-chrome`). Several legacy harnesses expect `../screenshots`, `../screenshots/90_logs`, or `tests/out`; create those output directories before running. The expedition harness accepts `QA_URL`, `MISSION=mars|horizon`, `COOP=1`, `HOST_CAPCOM=1`, `LANG_QA=es|en`, `MOBILE=1`, `LANDSCAPE=1`, `QUALITY=low|high`. Debug automation hooks are localhost-only and are not a substitute for a public endpoint test. No screenshot, log or recorded debug output is included in this import.

No fresh physical-phone, real-microphone or public HTTPS/WSS verification is claimed by these archives. Radio tests use synthetic devices; review Chromium flags and obey the execution environment's WebRTC/network policies. Do not bypass a restricted environment to make tests pass.

## Security and operational limits

Rooms and checkpoints are in memory, not durable accounts. Room codes are short invitation codes, not strong authentication; avoid sensitive names or conversation. Server restarts can lose rooms. The server defaults to public STUN only; some NAT/firewall combinations will prevent live voice. Real microphone use requires permission and a secure context (or localhost).

TURN is optional and explicitly gated by `ENABLE_TURN=1`, `TURN_URLS`, `TURN_USER`, `TURN_PASS`. No TURN credentials or environment files are supplied. `/rtc-config` intentionally exposes configured ICE credentials to clients: never configure a long-lived privileged secret; use appropriately scoped short-lived TURN credentials and obtain a security review before public production use. No private ICE configuration was copied. Source includes expected public STUN hostnames, test localhost endpoints and environment variable names, not account credentials.

## Assets and import scope

Keep `public/licenses.txt` and in-game credits intact. NASA assets have usage/insignia/no-endorsement caveats; texture attribution is CC BY 4.0; music/SFX and original art have their recorded notices; fonts have OFL notices; dependency notices are retained. No new blanket license grant is made by this README. Existing notices contain public copyright-holder contact addresses; these are legal attribution, not private account details.

Public models, audio, video, images, fonts and textures are copied byte-for-byte. Artist authoring files and duplicate export sources are not needed to play and are omitted. The asset test is adapted to verify the two artist exports using SHA256 values confirmed against original export files before packaging. No runtime gameplay files were modified for import.

Excluded: Git history/config, dependencies, generated builds, environment/secrets/private RTC files, screenshots/logs/debug evidence, machine-specific QA records, unrelated research, private planning and artist authoring sources. Two test paths and the gameplay guide were sanitized; `.gitignore` was strengthened. See `IMPORT_MANIFEST.json` and the accompanying `IMPORT_INSTRUCTIONS.md` for exact file hashes and archive assembly.
