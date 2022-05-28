import { TAPi18n } from '/imports/i18n';
//var nodemailer = require('nodemailer');

// buffer each user's email text in a queue, then flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('email', (user, title, description, params) => {
    // add quote to make titles easier to read in email text
    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach(key => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });
    ['timeValue', 'timeOldValue'].forEach(key => {
      quoteParams[key] = quoteParams[key] ? `${params[key]}` : '';
    });

    const lan = user.getLanguage();
    const subject = TAPi18n.__(title, params, lan); // the original function has a fault, i believe the title should be used according to original author
    const existing = user.getEmailBuffer().length > 0;
    const htmlEnabled =
      Meteor.settings.public &&
      Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR !== false;
    const text = `${existing ? `\n${subject}\n` : ''}${
      params.user
    } ${TAPi18n.__(description, quoteParams, lan)}\n${params.url}`;

    user.addEmailBuffer(htmlEnabled ? text.replace(/\n/g, '<br/>') : text);

    // unlike setTimeout(func, delay, args),
    // Meteor.setTimeout(func, delay) does not accept args :-(
    // so we pass userId with closure
    const userId = user._id;
    Meteor.setTimeout(() => {
      const user = Users.findOne(userId);

      // for each user, in the timed period, only the first call will get the cached content,
      // other calls will get nothing
      const texts = user.getEmailBuffer();
      if (texts.length === 0) return;

      // merge the cached content into single email and flush
      const html = texts.join('<br/>\n\n');
      user.clearEmailBuffer();
      try {
/*
        if (process.env.MAIL_SERVICE !== '') {
          let transporter = nodemailer.createTransport({
            service: process.env.MAIL_SERVICE,
            auth: {
              user: process.env.MAIL_SERVICE_USER,
              pass: process.env.MAIL_SERVICE_PASSWORD
            },
          })
          let info = transporter.sendMail({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject,
            html,
          })
        } else {
          Email.send({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject,
            html,
          });
        }
*/
        Email.send({
          to: user.emails[0].address.toLowerCase(),
          from: Accounts.emailTemplates.from,
          subject,
          html,
        });
      } catch (e) {
        return;
      }
    }, process.env.EMAIL_NOTIFICATION_TIMEOUT || 30000);
  });
});
