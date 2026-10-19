# 404style: один образ = API + собранный фронт (Express раздаёт client/dist)
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Провайдер БД выбирается при сборке: sqlite (по умолчанию) или postgresql
ARG DB_PROVIDER=sqlite

COPY package*.json ./
COPY prisma ./prisma
RUN sed -i "s/provider = \"sqlite\"/provider = \"${DB_PROVIDER}\"/" prisma/schema.prisma \
 && (if [ -f package-lock.json ]; then npm ci; else npm install --no-audit; fi)

COPY . .
RUN sed -i "s/provider = \"sqlite\"/provider = \"${DB_PROVIDER}\"/" prisma/schema.prisma \
 && npm run build

# devDependencies оставлены намеренно: нужны prisma CLI (db push / migrate) и tsx (seed)
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server/dist/index.js"]
