# syntax=docker/dockerfile:1.7
# Production image of the site: the Next.js standalone server with the own CMS and the office.
# deploy/deploy.sh builds it on the server, because `next build` prerenders the pages from the
# production database: the build runs on the host network with the env passed as a BuildKit
# secret, so no password lands in a layer.

FROM node:26-bookworm-slim AS base
# deploy/deploy.sh prunes only the images of this stack (other sites share the Docker host).
LABEL kern.image=true
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
# Node 26 ships without Corepack: pnpm in the version package.json names.
RUN npm install -g pnpm@12.6.0 \
  && groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# The SQL migrations (src/cms/migrations) against the production database, run before each build
# (deploy/deploy.sh). The same image runs the one-off and nightly scripts: the first administrator
# (deploy/admin.sh), retention and scheduled publishing (deploy/aufgabe.sh).
FROM deps AS migrate
ENV NODE_ENV=production
COPY . .
CMD ["pnpm", "migrate"]

FROM deps AS build
COPY . .
RUN --mount=type=secret,id=env,target=/app/.env pnpm build

FROM node:26-bookworm-slim AS app
LABEL kern.image=true
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# sharp writes the image sizes on upload and next/image encodes WebP; glibc gives each of its threads a malloc arena of its
# own and keeps what it freed. Two arenas keep the peak down without slowing it.
ENV MALLOC_ARENA_MAX=2
WORKDIR /app
# The same user id as in the migrate image, so files a one-off script writes into the media
# volume belong to the app.
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app \
  && mkdir -p media && chown app:app media
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
# The encoded images are a volume (deploy/compose.yml); created here so a new volume belongs to app.
RUN mkdir -p .next/cache/images && chown -R app:app .next/cache
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/admin/login').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
