# Dockerfile

# 1. Usar una imagen base oficial de Node.js (versión 18 LTS).
FROM node:18-slim

# 2. Establecer el directorio de trabajo dentro del contenedor.
WORKDIR /usr/src/app

# 3. Copiar los archivos de definición de dependencias.
# Esto aprovecha el cache de Docker, haciendo builds futuros más rápidos.
COPY package*.json ./

# 4. Instalar solo las dependencias de producción.
RUN npm install --only=production

# 5. Copiar el resto del código de la aplicación.
COPY . .

# 6. Exponer el puerto que usará la aplicación.
# Cloud Run usará este puerto (o el que se defina en la variable PORT).
EXPOSE 8080

# 7. Definir el comando para iniciar la aplicación.
CMD [ "node", "server.js" ]
