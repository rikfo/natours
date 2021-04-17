const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// new Email(user,url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Rikfo Miharbi ${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        //service: 'Gmail', // yahoo, hotmail , outlook ....
        // service: 'SendGrid'
        host: process.env.EMAIL_HOST,
        auth: {
          // add username and password of sendgrid
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    // production
    return 1;
  }

  async send(template, subject) {
    // 1) render html based on pug
    const htmlTemp = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: htmlTemp,
      text: htmlToText.htmlToText(htmlTemp, {
        wordwrap: 100,
      }),
    };

    // 3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the natours family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token is only ava');
  }
};
