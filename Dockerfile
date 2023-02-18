# Utiliser une image de base node.js
FROM node:16

# Créer un dossier de travail
WORKDIR /app

# Copier les fichiers du dossier local dans l'image
COPY package*.json ./
COPY . .

# Installer les dépendances
RUN npm install

# Exposer le port 3000 utilisé par l'application
EXPOSE 5001

# Démarrer l'application avec nodemon
CMD [ "npm", "run", "dev" ]
