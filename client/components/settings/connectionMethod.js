Template.connectionMethod.onCreated(function() {
  this.authenticationMethods = new ReactiveVar([]);

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter(e => e[1])
          .map(e => ({ value: e[0] })),
      ]);
    }

    // If only the default authentication available, hides the select boxe
    const content = $('.at-form-authentication');
    // OAuth method is a separate button, so ignore it in the count
    const formAuthenticationMethods = this.authenticationMethods.get().filter((method) => method.value !== 'oauth2');
    if (formAuthenticationMethods > 1) {
      content.show();
    } else {
      content.hide();
    }
  });
});

Template.connectionMethod.onRendered(() => {
  // Moves the select boxe in the first place of the at-pwd-form div
  $('.at-form-authentication')
    .detach()
    .prependTo('.at-pwd-form');
});

Template.connectionMethod.helpers({
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    return Template.instance().data.authenticationMethod === match;
  },
});
