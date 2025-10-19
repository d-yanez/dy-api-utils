# ------------------------------
# 1) Builder: instala deps (incluye dev) y compila si aplica
# ------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias del sistema mínimas
RUN apk add --no-cache python3 make g++ bash

# Solo manifiestos primero (aprovecha cache de Docker)
COPY package*.json ./

# Instala TODAS las deps (dev+prod) para poder compilar si hay scripts
RUN npm ci

# Copia el resto del código
COPY . .

# Compila Tailwind si existe el script (no falla si no existe)
RUN npm run tailwind:build || true

# ------------------------------
# 2) Runner: solo deps de producción + app + usuario no root
# ------------------------------
FROM node:20-alpine AS runner

# Arg para controlar Node env
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PORT=8080

WORKDIR /app

# Copia solo package*.json para --omit=dev
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código ya preparado desde el builder (incluye public/ y vistas)
COPY --from=builder /app /app

# Seguridad: usuario no root
RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp
USER nodeuser

# Exponer puerto para Cloud Run
EXPOSE 8080

# Healthcheck simple (opcional: remueve si no tienes /health)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1

# Arranque
CMD ["npm", "start"]