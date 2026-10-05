# syntax=docker/dockerfile:1

# The Knowledge Hub's production image: linux/amd64, Node 22, Next.js
# standalone. Built, tested and pushed by .github/workflows/release.yml, and
# deployed as docs/deploy-nas.md describes. Nothing in this file, or in any
# layer it produces, is a secret: runtime values come from Portainer.
#
# EVERY STAGE BUILDS FOR THE TARGET PLATFORM, NOT $BUILDPLATFORM. `npm ci`
# installs sharp's and libsql's native binaries for the platform it runs on, so
# installing dependencies on an ARM builder and copying them into an amd64
# image ships binaries that cannot load. The release runner is amd64, so this
# costs no emulation there.

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public by design — it is in the page source of every page — and baked in at
# build time, as every NEXT_PUBLIC_ value is. Empty means no page-view beacon.
ARG NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=""
ENV NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=$NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN
# THE BUILD HAS NO DATABASE, on purpose: it would need production's. With no
# DATABASE_URI, Payload points at an empty SQLite file, every read the pages
# make falls back to an empty list (lib/resources `safeRead`), and the
# pre-rendered pages come out empty. start.mjs re-renders them from the live
# database as soon as the container starts. The secret is a placeholder for
# this one command and is not kept in the image's environment.
RUN PAYLOAD_SECRET=build-placeholder npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# The commit this image was built from, reported by /api/health.
ARG APP_COMMIT_SHA=""
ENV APP_COMMIT_SHA=$APP_COMMIT_SHA

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# OWNED BY THE APP'S USER, because the Hub writes here at runtime: every ISR
# refresh rewrites the page it renders under .next/server/app. Root-owned, each
# refresh would fail and the pages would stay as the build made them — empty.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/deploy/start.mjs ./start.mjs

# NATIVE PACKAGES, WHOLE. The standalone file tracer copies sharp's `.node`
# binding but not the libvips library it links against (Article Studio's lesson
# on Vercel), and Payload makes every upload's sizes with sharp. libsql is the
# SQLite driver: production never uses it, but payload.config imports its
# adapter, so it has to load.
COPY --from=builder /app/node_modules/@img ./node_modules/@img
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "start.mjs"]
