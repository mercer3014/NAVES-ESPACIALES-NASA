# Production handoff

This repository is the imported game. Nothing in this document deploys it, changes DNS, opens a host port, or merges a pull request.

`nasa.nickzar.online` already has an A record for `148.116.104.212`. Leave that record alone. Vercel is DNS only. The site is an own Docker Swarm service behind the existing Traefik on the Oracle VPS. It is not a Dokploy-managed app. It only attaches to the existing network `dokploy-network`.

Container limits below are scheduling limits. They are not a statement that the VPS is free.

## Local process

Node.js 22.12 or newer. From the repository root:

```sh
npm ci
npm test
npm run test:expeditions
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

Non-secret defaults when the variables are unset:

| Variable | Local default | Container / stack |
|---|---|---|
| `HOST` | `127.0.0.1` | `0.0.0.0` (inside the container network namespace only) |
| `PORT` | `8787` | `8787` |
| `STATIC_DIR` | `dist` | `dist-expeditions` |
| `PUBLIC_URL` | empty (request Host is used) | `https://nasa.nickzar.online` |
| `NODE_ENV` | unset | `production` |
| `ENABLE_TURN` | unset | unset |
| `TURN_URLS` | unset | unset |
| `TURN_USER` | unset | unset |
| `TURN_PASS` | unset | unset |

Do not commit TURN credentials. `/rtc-config` is not used; ICE is `GET /rtc.json`. With `ENABLE_TURN` unset, that JSON contains only public STUN URLs.

Same-origin routes:

| Route | Role |
|---|---|
| `8787` | Internal listen port. Traefik reaches it on `dokploy-network`. No host port is published. |
| `/health` | `GET`/`HEAD` returns `{"ok":true}` |
| `/ws` | WebSocket rooms on the same HTTP server |
| `/qr` | SVG join QR |
| `/rtc.json` | ICE server list |
| `/` | Built game in `STATIC_DIR` |

The server allows Range requests and serves the MIME types already implemented in `server/index.js`. It does not serve source, dotfiles, source maps, or the repository root.

## Image from this repository

Final image contents are the production `npm ci --omit=dev` install, `server/index.js`, and the Vite output at `dist-expeditions`. Source, tests, and git metadata are not copied into the runtime stage. The base tag `node:22-bookworm-slim` is multi-arch, including `linux/arm64`. Do not pass `--platform=linux/amd64`.

```sh
docker build -t planta-la-bandera:local .
```

Build that image on the ARM64 VPS. This workspace did not run a container build. See the ARM64 note at the end.

## Transfer bundle

The sanitized archives under the artifact export are the prebuilt bundle: `dist-expeditions/`, `server/index.js`, `package.json`, `package-lock.json`, a runtime `Dockerfile`, `.dockerignore`, and `deploy/stack.yml`. They contain no `.git`, `.env`, `node_modules`, source tree, or credentials. Extract every part into the same empty directory, then:

```sh
docker build -t planta-la-bandera:local .
```

That Dockerfile runs `npm ci --omit=dev` inside the image. Dependencies are not stored in the archives.

## Swarm service, later and elsewhere

Do not run this from the import session. On the VPS, after the image exists locally:

```sh
docker stack deploy --compose-file deploy/stack.yml nasa
```

`deploy/stack.yml` sets one replica, `0.5` CPU, `512M` memory, json-file logs `max-size=10m` and `max-file=3` (30MB), a read-only root with an empty `/tmp` tmpfs, and Traefik labels:

- network `dokploy-network` (external, not created here)
- routers on entrypoints `websecure` and `web`
- TLS certresolver `letsencrypt`
- host rule `nasa.nickzar.online`
- load balancer port `8787`
- HTTP redirects to HTTPS except `/.well-known/acme-challenge`

There is no `ports:` key, no volume, and no `docker.sock` mount.

## Still required on the real origin

Fresh checks that this import did not perform: a physical phone, a real microphone, public HTTPS and WSS through Traefik, QR joins on `https://nasa.nickzar.online`, and a full browser play-through of the three missions. Room codes are short invitation codes. Voice uses public STUN unless short-lived TURN is injected later at runtime.

## ARM64 status for this workspace

The Dockerfile does not pin an amd64-only base or digest. On 2026-11-08, Docker Hub tag metadata for `node:22-bookworm-slim` listed `linux/arm64` variant `v8` (also `linux/amd64`, `linux/arm/v7`, and `linux/ppc64le`). The tag digest observed then was `sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d`. It is not pinned, because a moving tag digest was not verified as the multi-arch index from this machine.

This workspace has no Docker CLI, daemon, or buildx. No `linux/arm64` image was built or started here. ARM64 execution is unverified until the image is built on the VPS.
