# Build stage: installs every dependency and builds the packages, the server, and the browser app.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/seeded-random/package.json packages/seeded-random/
COPY packages/game-server-api/package.json packages/game-server-api/
COPY packages/number-game/package.json packages/number-game/
COPY packages/block-game/package.json packages/block-game/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY . .
RUN npm run build

# Run stage: only the built files and the dependencies the server needs at run time.
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/seeded-random/package.json packages/seeded-random/
COPY packages/game-server-api/package.json packages/game-server-api/
COPY packages/number-game/package.json packages/number-game/
COPY packages/block-game/package.json packages/block-game/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/packages/seeded-random/dist packages/seeded-random/dist
COPY --from=build /app/packages/game-server-api/dist packages/game-server-api/dist
COPY --from=build /app/packages/number-game/dist packages/number-game/dist
COPY --from=build /app/packages/block-game/dist packages/block-game/dist
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist

# Inside the container the server always listens on all addresses on port 3000 and keeps its
# database in /data. compose.yaml maps the host port and the host data folder onto these.
ENV HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/server/dist/index.js"]
