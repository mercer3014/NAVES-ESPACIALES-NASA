# Reproducible production image from this repository.
# The official node:22-bookworm-slim tag is a multi-arch index (linux/amd64 and linux/arm64).
# Do not pin --platform=linux/amd64. On the ARM64 VPS, build with:
#   docker build -t planta-la-bandera:local .
# EXPOSE documents the internal port only. This image does not publish a host port.
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npx vite build --outDir dist-expeditions

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    STATIC_DIR=dist-expeditions
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force && rm -rf /root/.npm && chown -R node:node /app
COPY --from=build --chown=node:node /src/dist-expeditions ./dist-expeditions
COPY --chown=node:node server ./server
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
