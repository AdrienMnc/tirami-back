// Middleware de limitation du nombre de requêtes par IP

const requestLimit = {};
const emailLimit = {};

module.exports = {
  // Gestion du nombre de requêtes par IP
  requestLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();

    // Si l'IP n'est pas déjà enregistrée, on crée un nouvel enregistrement
    if (!requestLimit[ip]) {
      requestLimit[ip] = {
        lastRequest: now,
        requests: 1,
      };
      next();
    } else {
      const elapsedTime = now - requestLimit[ip].lastRequest;
      // Si le temps écoulé depuis la dernière demande est supérieur ou égal à 10 secondes
      if (elapsedTime >= 10000) {
        // On réinitialise le compteur et le temps de la dernière demande
        requestLimit[ip] = {
          lastRequest: now,
          requests: 1,
        };
        next();
      } else {
        // Sinon, on incrémente le compteur de demandes
        requestLimit[ip].requests++;
        // Si le nombre de demandes dépasse 10, on envoie une réponse d'erreur
        if (requestLimit[ip].requests > 10) {
          return res.status(429).json({ message: "Too many requests" });
        } else {
          next();
        }
      }
    }
  },

  // Gestion du nombre de tentatives de login avec un même email
  loginLimiter(req, res, next) {
    const email = req.body.email;
    const now = Date.now();

    // Si l'email n'est pas déjà enregistré, on crée un nouvel enregistrement
    if (!emailLimit[email]) {
      emailLimit[email] = {
        lastAttempt: now,
        attempts: 1,
      };
      next();
    } else {
      const elapsedTime = now - emailLimit[email].lastAttempt;
      // Si le temps écoulé depuis la dernière tentative est supérieur ou égal à trois minutes
      if (elapsedTime >= 180000) {
        // On réinitialise le compteur et le temps de la dernière tentative
        emailLimit[email] = {
          lastAttempt: now,
          attempts: 1,
        };
        next();
      } else {
        // Sinon, on incrémente le compteur de tentatives
        emailLimit[email].attempts++;
        // Si le nombre de tentatives dépasse 5, on envoie une réponse d'erreur
        if (emailLimit[email].attempts > 5) {
          const blockTime = 300000; // 5 minutes en millisecondes
          const remainingTime = blockTime - elapsedTime;
          res.set("Retry-After", Math.floor(remainingTime / 1000));
          return res
            .status(429)
            .json({
              message: "Too many login attempts. Please try again later.",
            });
        } else {
          next();
        }
      }
    }
  },
};
