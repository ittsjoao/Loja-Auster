FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl postgresql-client
RUN corepack enable && corepack prepare pnpm@11.14.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite inlines VITE_* at build time; pass them as build args so the
# client bundle is compiled with the correct values (.env is dockerignored).
ARG VITE_AUTHENTIK_ENABLED
ARG VITE_API_URL=/api
ENV VITE_AUTHENTIK_ENABLED=$VITE_AUTHENTIK_ENABLED
ENV VITE_API_URL=$VITE_API_URL

RUN npx prisma generate
RUN pnpm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npx", "tsx", "src/server/index.ts"]
