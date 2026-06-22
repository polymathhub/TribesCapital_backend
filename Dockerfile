# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 — builder: install deps, generate Prisma client, build BE + FE
###############################################################################
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# openssl is required by Prisma; python3/make/g++ let bcrypt compile if no prebuilt binary is found
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies first (better layer caching).
# package-lock.json is gitignored, so use `npm install` rather than `npm ci`.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Generate the Prisma client (needs the schema only).
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source and build.
# `npm run build` => prebuild (rimraf dist) -> nest build (dist/) -> frontend build (dist/frontend/)
COPY tsconfig.json ./
COPY src ./src
COPY frontend ./frontend
RUN npm run build

###############################################################################
# Stage 2 — runtime: slim image with built artifacts only
###############################################################################
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# openssl for the Prisma query engine; ca-certificates for outbound TLS (S3, SMTP, Google)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# node_modules carries the prisma CLI (for `prisma db push` at startup) and the
# already-built native bcrypt binary + generated Prisma client.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json ./

# ServeStaticModule resolves join(__dirname, '..', 'frontend') -> /app/frontend
# at runtime (main.js lives in /app/dist), so place the Vite build there.
COPY --from=builder --chown=node:node /app/dist/frontend ./frontend

COPY --chown=node:node docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
