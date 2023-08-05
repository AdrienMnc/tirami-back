# Utiliser une image de base node.js // On était en 16 pendant le cours, mais on est passé à 18.14.2
FROM node:18.14

# Créer un dossier de travail
WORKDIR /app

# Copier les fichiers du dossier local dans l'image
COPY package*.json ./
COPY . .

# Installer les dépendances
RUN npm install

# Exposer le port 5001 utilisé par l'application
EXPOSE 5001

# Démarrer l'application avec nodemon
CMD [ "npm", "run", "dev" ]
