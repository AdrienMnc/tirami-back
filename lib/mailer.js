const nodemailer = require("nodemailer");

module.exports = {
  /**
   * Envoi d'un mail de confirmation d'inscription
   * @param {string} email
   * @param {string} username
   * @param {string} token
   * @returns {Promise}
   *
   **/

  sendConfirmationEmail: async (email, username, token) => {
    const transporter = nodemailer.createTransport({
      //   host: process.env.MAIL_HOST,
      //   port: process.env.MAIL_PORT,
      //   secure: false,
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Confirmation d'inscription",
      // Ecrire le texte sous forme HTML pour qu'il soit cliquable
      html: `<p>Bonjour ${username},</p><p>Merci de confirmer votre inscription en cliquant sur le lien suivant : <a href="${process.env.FRONT_URL}/user/activate/${token}">cliquez-ici</a></p>`,
    };

    return transporter.sendMail(mailOptions);
  },

  /**
   * Envoi d'un mail de réinitialisation de mot de passe
   *
   * @param {string} email
   * @param {string} username
   * @param {string} token
   * @returns {Promise}
   *
   **/

  sendResetPasswordEmail: async (email, username, token) => {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Réinitialisation de mot de passe",
      text: `Bonjour ${username}, Merci de réinitialiser votre mot de passe en cliquant sur le lien suivant : ${process.env.FRONT_URL}/reset-password/${token}`,
    };

    return transporter.sendMail(mailOptions);
  },
};
