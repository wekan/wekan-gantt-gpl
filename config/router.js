import { TAPi18n } from '/imports/i18n';

let previousPath;
FlowRouter.triggers.exit([
  ({ path }) => {
    previousPath = path;
  },
]);

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardListHeaderBar',
      content: 'boardList',
    });
  },
});

FlowRouter.route('/public', {
  name: 'public',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardListHeaderBar',
      content: 'boardList',
    });
  },
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  action(params) {
    const currentBoard = params.id;
    const previousBoard = Session.get('currentBoard');
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (previousBoard !== currentBoard) {
      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    } else {
      EscapeActions.executeUpTo('popup-close');
    }

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardHeaderBar',
      content: 'board',
    });
  },
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action(params) {
    EscapeActions.executeUpTo('inlinedForm');

    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardHeaderBar',
      content: 'board',
    });
  },
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action() {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        header: 'shortcutsModalTitle',
        onCloseGoTo: previousPath,
      });
    } else {
      BlazeLayout.render('defaultLayout', {
        headerBar: 'shortcutsHeaderBar',
        content: shortcutsTemplate,
      });
    }
  },
});

FlowRouter.route('/b/templates', {
  name: 'template-container',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardListHeaderBar',
      content: 'boardList',
    });
  },
});

FlowRouter.route('/my-cards', {
  name: 'my-cards',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'myCardsHeaderBar',
      content: 'myCards',
    });
    // }
  },
});

FlowRouter.route('/due-cards', {
  name: 'due-cards',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'dueCardsHeaderBar',
      content: 'dueCards',
    });
    // }
  },
});

FlowRouter.route('/global-search', {
  name: 'global-search',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();
    DocHead.setTitle(TAPi18n.__('globalSearch-title'));

    if (FlowRouter.getQueryParam('q')) {
      Session.set(
        'globalQuery',
        decodeURIComponent(FlowRouter.getQueryParam('q')),
      );
    }
    BlazeLayout.render('defaultLayout', {
      headerBar: 'globalSearchHeaderBar',
      content: 'globalSearch',
    });
  },
});

FlowRouter.route('/broken-cards', {
  name: 'broken-cards',
  action() {
    const brokenCardsTemplate = 'brokenCards';

    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'brokenCardsHeaderBar',
      content: brokenCardsTemplate,
    });
  },
});

FlowRouter.route('/import/:source', {
  name: 'import',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    if (Session.get('currentBoard')) {
      Session.set('fromBoard', Session.get('currentBoard'));
    }
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    Session.set('importSource', params.source);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();
    BlazeLayout.render('defaultLayout', {
      headerBar: 'importHeaderBar',
      content: 'import',
    });
  },
});

FlowRouter.route('/setting', {
  name: 'setting',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    Utils.manageCustomUI();
    BlazeLayout.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'setting',
    });
  },
});

FlowRouter.route('/information', {
  name: 'information',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    BlazeLayout.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'information',
    });
  },
});

FlowRouter.route('/people', {
  name: 'people',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    BlazeLayout.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'people',
    });
  },
});

FlowRouter.route('/admin-reports', {
  name: 'admin-reports',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    BlazeLayout.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'adminReports',
    });
  },
});

FlowRouter.route('/attachments', {
  name: 'attachments',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    BlazeLayout.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'attachments',
    });
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('defaultLayout', { content: 'notFound' });
  },
};

// We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
const redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId',
  '/import': '/import/trello',
};

_.each(redirections, (newPath, oldPath) => {
  FlowRouter.route(oldPath, {
    triggersEnter: [
      (context, redirect) => {
        redirect(FlowRouter.path(newPath, context.params));
      },
    ],
  });
});

// As it is not possible to use template helpers in the page <head> we create a
// reactive function whose role is to set any page-specific tag in the <head>
// using the `kadira:dochead` package. Currently we only use it to display the
// board title if we are in a board page (see #364) but we may want to support
// some <meta> tags in the future.
//const appTitle = Utils.manageCustomUI();

// XXX The `Meteor.startup` should not be necessary -- we don't need to wait for
// the complete DOM to be ready to call `DocHead.setTitle`. But the problem is
// that the global variable `Boards` is undefined when this file loads so we
// wait a bit until hopefully all files are loaded. This will be fixed in a
// clean way once Meteor will support ES6 modules -- hopefully in Meteor 1.3.
//Meteor.isClient && Meteor.startup(() => {
//  Tracker.autorun(() => {

//    const currentBoard = Boards.findOne(Session.get('currentBoard'));
//    const titleStack = [appTitle];
//    if (currentBoard) {
//      titleStack.push(currentBoard.title);
//    }
//    DocHead.setTitle(titleStack.reverse().join(' - '));
//  });
//});
