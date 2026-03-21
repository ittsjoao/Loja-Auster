FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl postgresql-client

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npx", "tsx", "src/server/index.ts"]
