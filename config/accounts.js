const passwordField = AccountsTemplates.removeField('password');
const emailField = AccountsTemplates.removeField('email');
let disableRegistration = false;
let disableForgotPassword = false;

Meteor.call('isDisableRegistration', (err, data) => {
  if (!err) {
    disableRegistration = data;
    console.log(data);
  }
});

Meteor.call('isDisableForgotPassword', (err, data) => {
  if (!err) {
    disableForgotPassword = data;
    console.log(data);
  }
});

AccountsTemplates.addFields([
  {
    _id: 'username',
    type: 'text',
    displayName: 'username',
    required: true,
    minLength: 2,
  },
  emailField,
  passwordField,
  {
    _id: 'invitationcode',
    type: 'text',
    displayName: 'Invitation Code',
    required: false,
    minLength: 6,
    template: 'invitationCode',
  },
]);

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: true,
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: disableForgotPassword === false,
  forbidClientAccountCreation: disableRegistration === true,
  onLogoutHook() {
    const homePage = 'home';
    if (FlowRouter.getRouteName() === homePage) {
      FlowRouter.reload();
    } else {
      FlowRouter.go(homePage);
    }
  },
});

if (disableForgotPassword === false) {
  [
    'forgotPwd',
    'resetPwd',
  ].forEach(routeName => AccountsTemplates.configureRoute(routeName));
}

if (disableRegistration === false) {
  [
    'signUp',
  ].forEach(routeName => AccountsTemplates.configureRoute(routeName));
}

[
  'signIn',
  'enrollAccount',
].forEach(routeName => AccountsTemplates.configureRoute(routeName));

// We display the form to change the password in a popup window that already
// have a title, so we unset the title automatically displayed by useraccounts.
AccountsTemplates.configure({
  texts: {
    title: {
      changePwd: '',
    },
  },
});

AccountsTemplates.configureRoute('changePwd', {
  redirect() {
    // XXX We should emit a notification once we have a notification system.
    // Currently the user has no indication that his modification has been
    // applied.
    Popup.back();
  },
});

if (Meteor.isServer) {
  [
    'resetPassword-subject',
    'resetPassword-text',
    'verifyEmail-subject',
    'verifyEmail-text',
    'enrollAccount-subject',
    'enrollAccount-text',
  ].forEach(str => {
    const [templateName, field] = str.split('-');
    Accounts.emailTemplates[templateName][field] = (user, url) => {
      return TAPi18n.__(
        `email-${str}`,
        {
          url,
          user: user.getName(),
          siteName: Accounts.emailTemplates.siteName,
        },
        user.getLanguage(),
      );
    };
  });
}
