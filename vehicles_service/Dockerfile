FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (aprovecha la caché de Docker)
COPY package*.json ./
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

EXPOSE 3005

CMD ["node", "./src/index.js"]
