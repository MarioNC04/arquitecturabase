const nodemailer = require('nodemailer');
const baseUrl = (process.env.url || process.env.URL || 'http://localhost:3000').replace(/\/$/, '') + '/';
const emailUser = process.env.email_user || process.env.EMAIL_USER || 'marionc2004@gmail.com';
const emailPass = process.env.email_pass || process.env.EMAIL_PASS || '';

let transporter = null;
if (emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
} else {
  console.warn('email.js: email_pass no configurada en .env, emails deshabilitados');
}
module.exports.enviarEmail = async function(direccion, key, men) {
	if (!transporter) {
		console.warn('enviarEmail: transporter no configurado, omitiendo envío a', direccion);
		return;
	}
	try {
		const result = await transporter.sendMail({
			from: emailUser,
			to: direccion,
			subject: men,
			text: 'Pulsa aquí para confirmar cuenta',
			html: '<p>Bienvenido a Sistema</p><p><a href="' + baseUrl + 'confirmarUsuario/' + direccion + '/' + key + '">Pulsa aquí para confirmar cuenta</a></p>'
		});
		console.log('enviarEmail: mail sent to', direccion, result && result.messageId);
	} catch (err) {
		console.error('enviarEmail error (credentials or network):', err && err.message ? err.message : err);
	}
}