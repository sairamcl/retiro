# Dockerfile

# 1. Usar una imagen base oficial de Node.js (LTS - Long Term Support)
# Esta imagen ya tiene Node.js y npm instalados.
FROM node:18-slim

# 2. Crear y definir el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de dependencias
# Se copian primero para aprovechar el caché de capas de Docker. Si no cambian, no se reinstalará todo.
COPY package*.json ./

# 4. Instalar las dependencias del proyecto (axios y express)
RUN npm install

# 5. Copiar el resto del código de la aplicación al directorio de trabajo
COPY . .

# 6. Exponer el puerto en el que la aplicación se ejecutará
# Tu server.js usa el puerto 8080 como fallback.
EXPOSE 8080

# 7. Definir el comando para iniciar la aplicación cuando el contenedor se inicie
# Esto ejecuta "node server.js", que es el script de inicio de tu app.
CMD [ "node", "server.js" ]
