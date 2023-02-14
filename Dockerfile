# utilisez l'image de base node pour construire votre application Node.js
FROM node:14

# définir le répertoire de travail pour notre application
WORKDIR /app

# copier les fichiers de votre projet Node.js dans le répertoire de travail
COPY . .

# installez les dépendances de votre application Node.js
RUN npm install

# exposez le port utilisé par votre application Node.js
EXPOSE 5000

# définissez la commande par défaut pour lancer votre application Node.js
CMD ["npm", "start"]
