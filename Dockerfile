# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Installer dumb-init pour une meilleure gestion des signaux
RUN apk add --no-cache dumb-init

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/dist ./dist

# Exposer le port
EXPOSE 3000

# Utiliser dumb-init pour démarrer le processus Node
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["npm", "start"]
