import { TAPi18n } from '/imports/i18n';

Sidebar = null;

const defaultView = 'home';
const MCB = '.materialCheckBox';
const CKCLS = 'is-checked';

const viewTitles = {
  filter: 'filter-cards',
  search: 'search-cards',
  multiselection: 'multi-selection',
  customFields: 'custom-fields',
  archives: 'archives',
};

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling];
  },

  onCreated() {
    this._isOpen = new ReactiveVar(false);
    this._view = new ReactiveVar(defaultView);
    this._hideCardCounterList = new ReactiveVar(false);
    this._hideBoardMemberList = new ReactiveVar(false);
    Sidebar = this;
  },

  onDestroyed() {
    Sidebar = null;
  },

  isOpen() {
    return this._isOpen.get();
  },

  open() {
    if (!this._isOpen.get()) {
      this._isOpen.set(true);
      EscapeActions.executeUpTo('detailsPane');
    }
  },

  hide() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toggle() {
    this._isOpen.set(!this._isOpen.get());
  },

  calculateNextPeak() {
    const sidebarElement = this.find('.js-board-sidebar-content');
    if (sidebarElement) {
      const altitude = sidebarElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden() {
    return this.isOpen() && this.getView() !== defaultView;
  },

  scrollTop() {
    this.$('.js-board-sidebar-content').scrollTop(0);
  },

  getView() {
    return this._view.get();
  },

  setView(view) {
    view = _.isString(view) ? view : defaultView;
    if (this._view.get() !== view) {
      this._view.set(view);
      this.scrollTop();
      EscapeActions.executeUpTo('detailsPane');
    }
    this.open();
  },

  isDefaultView() {
    return this.getView() === defaultView;
  },

  getViewTemplate() {
    return `${this.getView()}Sidebar`;
  },

  getViewTitle() {
    return TAPi18n.__(viewTitles[this.getView()]);
  },

  showTongueTitle() {
    if (this.isOpen()) return `${TAPi18n.__('sidebar-close')}`;
    else return `${TAPi18n.__('sidebar-open')}`;
  },

  events() {
    return [
      {
        'click .js-hide-sidebar': this.hide,
        'click .js-toggle-sidebar': this.toggle,
        'click .js-back-home': this.setView,
        'click .js-toggle-minicard-label-text'() {
          currentUser = Meteor.user();
          if (currentUser) {
            Meteor.call('toggleMinicardLabelText');
          } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
            window.localStorage.removeItem('hiddenMinicardLabelText');
            location.reload();
          } else {
            window.localStorage.setItem('hiddenMinicardLabelText', 'true');
            location.reload();
          }
        },
        'click .js-shortcuts'() {
          FlowRouter.go('shortcuts');
        },
        'click .js-close-sidebar'() {
          Sidebar.toggle()
        },
      },
    ];
  },
}).register('sidebar');

Blaze.registerHelper('Sidebar', () => Sidebar);

Template.homeSidebar.helpers({
  hiddenMinicardLabelText() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
});

Template.boardInfoOnMyBoardsPopup.helpers({
  currentSetting() {
    return Settings.findOne();
  },
  hideCardCounterList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
  hideBoardMemberList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
});

EscapeActions.register(
  'sidebarView',
  () => {
    Sidebar.setView(defaultView);
  },
  () => {
    return Sidebar && Sidebar.getView() !== defaultView;
  },
);

Template.memberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  memberType() {
    const type = Users.findOne(this.userId).isBoardAdmin() ? 'admin' : 'normal';
    if (type === 'normal') {
      const currentBoard = Boards.findOne(Session.get('currentBoard'));
      const commentOnly = currentBoard.hasCommentOnly(this.userId);
      const noComments = currentBoard.hasNoComments(this.userId);
      const worker = currentBoard.hasWorker(this.userId);
      if (commentOnly) {
        return TAPi18n.__('comment-only');
      } else if (noComments) {
        return TAPi18n.__('no-comments');
      } else if (worker) {
        return TAPi18n.__('worker');
      } else {
        return TAPi18n.__(type);
      }
    } else {
      return TAPi18n.__(type);
    }
  },
  isInvited() {
    return Users.findOne(this.userId).isInvitedTo(Session.get('currentBoard'));
  },
});


Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-rules-view'() {
    Modal.openWide('rulesMain');
    Popup.back();
  },
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.back();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.back();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-background-image': Popup.open('boardChangeBackgroundImage'),
  'click .js-board-info-on-my-boards': Popup.open('boardInfoOnMyBoards'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-delete-board': Popup.afterConfirm('deleteBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    Popup.back();
    Boards.remove(currentBoard._id);
    FlowRouter.go('home');
  }),
  'click .js-outgoing-webhooks': Popup.open('outgoingWebhooks'),
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-subtask-settings': Popup.open('boardSubtaskSettings'),
  'click .js-card-settings': Popup.open('boardCardSettings'),
  'click .js-minicard-settings': Popup.open('boardMinicardSettings'),
  'click .js-export-board': Popup.open('exportBoard'),
});

Template.boardMenuPopup.onCreated(function() {
  this.apiEnabled = new ReactiveVar(false);
  Meteor.call('_isApiEnabled', (e, result) => {
    this.apiEnabled.set(result);
  });
});

Template.boardMenuPopup.helpers({
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  withApi() {
    return Template.instance().apiEnabled.get();
  },
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.json`;
  },
});

Template.memberPopup.events({
  'click .js-filter-member'() {
    Filter.members.toggle(this.userId);
    Popup.back();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    // This works from removing member from board, card members and assignees.
    const boardId = Session.get('currentBoard');
    const memberId = this.userId;
    Cards.find({ boardId, members: memberId }).forEach(card => {
      card.unassignMember(memberId);
    });
    Cards.find({ boardId, assignees: memberId }).forEach(card => {
      card.unassignAssignee(memberId);
    });
    Boards.findOne(boardId).removeMember(memberId);
    Popup.back();
  }),
  'click .js-leave-member': Popup.afterConfirm('leaveBoard', () => {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, () => {
      Popup.back();
      FlowRouter.go('home');
    });
  }),
});

Template.removeMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});

Template.leaveBoardPopup.helpers({
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});
BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});
    this.findTeamsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.teamPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });

    this.autorun(() => {
      const limitTeams = this.teamPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findTeamsOptions.get(), limitTeams, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
    Utils.setBackgroundImage();
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  tabs() {
    return [
      { name: TAPi18n.__('people'), slug: 'people' },
      { name: TAPi18n.__('organizations'), slug: 'organizations' },
      { name: TAPi18n.__('teams'), slug: 'teams' },
    ];
  },
}).register('membersWidget');

Template.membersWidget.helpers({
  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(Session.get('currentBoard'));
  },
  isWorker() {
    const user = Meteor.user();
    if (user) {
      return Meteor.call(Boards.hasWorker(user.memberId));
    } else {
      return false;
    }
  },
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  AtLeastOneOrgWasCreated(){
    let orgs = Org.find({}, {sort: { createdAt: -1 }});
    if(orgs === undefined)
      return false;

    return orgs.count() > 0;
  },

  AtLeastOneTeamWasCreated(){
    let teams = Team.find({}, {sort: { createdAt: -1 }});
    if(teams === undefined)
      return false;

    return teams.count() > 0;
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-manage-board-addOrg': Popup.open('addBoardOrg'),
  'click .js-manage-board-addTeam': Popup.open('addBoardTeam'),
  'click .js-import': Popup.open('boardImportBoard'),
  submit: this.onSubmit,
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
  'click .sandstorm-powerbox-request-identity'() {
    window.sandstormRequestIdentity();
  },
  'click .js-member-invite-accept'() {
    const boardId = Session.get('currentBoard');
    Meteor.user().removeInvite(boardId);
  },
  'click .js-member-invite-decline'() {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, (err, ret) => {
      if (!err && ret) {
        Meteor.user().removeInvite(boardId);
        FlowRouter.go('home');
      }
    });
  },
});

BlazeComponent.extendComponent({
  boardId() {
    return Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
  },
  integrations() {
    const boardId = this.boardId();
    return Integrations.find({ boardId: `${boardId}` }).fetch();
  },
  types() {
    return Integrations.Const.WEBHOOK_TYPES;
  },
  integration(cond) {
    const boardId = this.boardId();
    const condition = { boardId, ...cond };
    for (const k in condition) {
      if (!condition[k]) delete condition[k];
    }
    return Integrations.findOne(condition);
  },
  onCreated() {
    this.disabled = new ReactiveVar(false);
  },
  events() {
    return [
      {
        'click a.flex'(evt) {
          this.disabled.set(!this.disabled.get());
          $(evt.target).toggleClass(CKCLS, this.disabled.get());
        },
        submit(evt) {
          evt.preventDefault();
          const url = evt.target.url.value;
          const boardId = this.boardId();
          let id = null;
          let integration = null;
          const title = evt.target.title.value;
          const token = evt.target.token.value;
          const type = evt.target.type.value;
          const enabled = !this.disabled.get();
          let remove = false;
          const values = {
            url,
            type,
            token,
            title,
            enabled,
          };
          if (evt.target.id) {
            id = evt.target.id.value;
            integration = this.integration({ _id: id });
            remove = !url;
          } else if (url) {
            integration = this.integration({ url, token });
          }
          if (remove) {
            Integrations.remove(integration._id);
          } else if (integration && integration._id) {
            Integrations.update(integration._id, {
              $set: values,
            });
          } else if (url) {
            Integrations.insert({
              ...values,
              userId: Meteor.userId(),
              enabled: true,
              boardId,
              activities: ['all'],
            });
          }
          Popup.back();
        },
      },
    ];
  },
}).register('outgoingWebhooksPopup');

BlazeComponent.extendComponent({
  template() {
    return 'chooseBoardSource';
  },
}).register('chooseBoardSourcePopup');

BlazeComponent.extendComponent({
  template() {
    return 'exportBoard';
  },
  withApi() {
    return Template.instance().apiEnabled.get();
  },
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportUrlExcel() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path(
      '/api/boards/:boardId/exportExcel',
      params,
      queryParams,
    );
  },
  exportFilenameExcel() {
    const boardId = Session.get('currentBoard');
    return `export-board-excel-${boardId}.xlsx`;
  },
  exportCsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: ',',
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportScsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: ';',
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportTsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: '\t',
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportJsonFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.json`;
  },
  exportCsvFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.csv`;
  },
  exportTsvFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.tsv`;
  },
}).register('exportBoardPopup');

Template.exportBoard.events({
  'click .html-export-board': async event => {
    event.preventDefault();
    await ExportHtml(Popup)();
  },
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

Template.labelsWidget.helpers({
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
});

// Board members can assign people or labels by drag-dropping elements from the
// sidebar to the cards on the board. In order to re-initialize the jquery-ui
// plugin any time a draggable member or label is modified or removed we use a
// autorun function and register a dependency on the both members and labels
// fields of the current board document.
function draggableMembersLabelsWidgets() {
  this.autorun(() => {
    const currentBoardId = Tracker.nonreactive(() => {
      return Session.get('currentBoard');
    });
    Boards.findOne(currentBoardId, {
      fields: {
        members: 1,
        labels: 1,
      },
    });
    Tracker.afterFlush(() => {
      const $draggables = this.$('.js-member,.js-label');
      $draggables.draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start() {
          EscapeActions.executeUpTo('popup-back');
        },
      });

      function userIsMember() {
        return Meteor.user() && Meteor.user().isBoardMember();
      }

      this.autorun(() => {
        $draggables.draggable('option', 'disabled', !userIsMember());
      });
    });
  });
}

Template.membersWidget.onRendered(draggableMembersLabelsWidgets);
Template.labelsWidget.onRendered(draggableMembersLabelsWidgets);

BlazeComponent.extendComponent({
  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [
      {
        'click .js-select-background'(evt) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          const newColor = this.currentData().toString();
          currentBoard.setColor(newColor);
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        submit(event) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          const backgroundImageURL = this.find('.js-board-background-image-url').value.trim();
          currentBoard.setBackgroundImageURL(backgroundImageURL);
          Utils.setBackgroundImage();
          Popup.back();
          event.preventDefault();
        },
        'click .js-remove-background-image'() {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          currentBoard.setBackgroundImageURL("");
          Popup.back();
          Utils.reload();
          event.preventDefault();
        },
      },
    ];
  },
}).register('boardChangeBackgroundImagePopup');

Template.boardChangeBackgroundImagePopup.helpers({
  backgroundImageURL() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.backgroundImageURL;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsCardCounterList() {
    return this.currentBoard.allowsCardCounterList;
  },

  allowsBoardMemberList() {
    return this.currentBoard.allowsBoardMemberList;
  },

  events() {
    return [
      {
        'click .js-field-has-cardcounterlist'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCardCounterList = !this.currentBoard
            .allowsCardCounterList;
            this.currentBoard.setAllowsCardCounterList(
              this.currentBoard.allowsCardCounterList,
          );
          $(`.js-field-has-cardcounterlist ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCardCounterList,
          );
          $('.js-field-has-cardcounterlist').toggleClass(
            CKCLS,
            this.currentBoard.allowsCardCounterList,
          );
        },
        'click .js-field-has-boardmemberlist'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsBoardMemberList = !this.currentBoard
            .allowsBoardMemberList;
            this.currentBoard.setAllowsBoardMemberList(
              this.currentBoard.allowsBoardMemberList,
          );
          $(`.js-field-has-boardmemberlist ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsBoardMemberList,
          );
          $('.js-field-has-boardmemberlist').toggleClass(
            CKCLS,
            this.currentBoard.allowsBoardMemberList,
          );
        },
      },
    ];
  },
}).register('boardInfoOnMyBoardsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsSubtasks() {
    return this.currentBoard.allowsSubtasks;
  },

  allowsReceivedDate() {
    return this.currentBoard.allowsReceivedDate;
  },

  isBoardSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  isNullBoardSelected() {
    return (
      this.currentBoard.subtasksDefaultBoardId === null ||
      this.currentBoard.subtasksDefaultBoardId === undefined
    );
  },

  boards() {
    return Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  lists() {
    return Lists.find(
      {
        boardId: this.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  presentParentTask() {
    let result = this.currentBoard.presentParentTask;
    if (result === null || result === undefined) {
      result = 'no-parent';
    }
    return result;
  },

  events() {
    return [
      {
        'click .js-field-has-subtasks'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsSubtasks = !this.currentBoard.allowsSubtasks;
          this.currentBoard.setAllowsSubtasks(this.currentBoard.allowsSubtasks);
          $(`.js-field-has-subtasks ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-has-subtasks').toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-deposit-board').prop(
            'disabled',
            !this.currentBoard.allowsSubtasks,
          );
        },
        'change .js-field-deposit-board'(evt) {
          let value = evt.target.value;
          if (value === 'null') {
            value = null;
          }
          this.currentBoard.setSubtasksDefaultBoardId(value);
          evt.preventDefault();
        },
        'change .js-field-deposit-list'(evt) {
          this.currentBoard.setSubtasksDefaultListId(evt.target.value);
          evt.preventDefault();
        },
        'click .js-field-show-parent-in-minicard'(evt) {
          const value =
            evt.target.id ||
            $(evt.target).parent()[0].id ||
            $(evt.target)
              .parent()[0]
              .parent()[0].id;
          const options = [
            'prefix-with-full-path',
            'prefix-with-parent',
            'subtext-with-full-path',
            'subtext-with-parent',
            'no-parent',
          ];
          options.forEach(function(element) {
            if (element !== value) {
              $(`#${element} ${MCB}`).toggleClass(CKCLS, false);
              $(`#${element}`).toggleClass(CKCLS, false);
            }
          });
          $(`#${value} ${MCB}`).toggleClass(CKCLS, true);
          $(`#${value}`).toggleClass(CKCLS, true);
          this.currentBoard.setPresentParentTask(value);
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardSubtaskSettingsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsReceivedDate() {
    return this.currentBoard.allowsReceivedDate;
  },

  allowsStartDate() {
    return this.currentBoard.allowsStartDate;
  },

  allowsDueDate() {
    return this.currentBoard.allowsDueDate;
  },

  allowsEndDate() {
    return this.currentBoard.allowsEndDate;
  },

  allowsSubtasks() {
    return this.currentBoard.allowsSubtasks;
  },

  allowsCreator() {
    return (
      this.currentBoard.allowsCreator === null ||
      this.currentBoard.allowsCreator === undefined ||
      this.currentBoard.allowsCreator
    );
  },

  allowsMembers() {
    return this.currentBoard.allowsMembers;
  },

  allowsAssignee() {
    return this.currentBoard.allowsAssignee;
  },

  allowsAssignedBy() {
    return this.currentBoard.allowsAssignedBy;
  },

  allowsRequestedBy() {
    return this.currentBoard.allowsRequestedBy;
  },

  allowsCardSortingByNumber() {
    return this.currentBoard.allowsCardSortingByNumber;
  },

  allowsShowLists() {
    return this.currentBoard.allowsShowLists;
  },

  allowsLabels() {
    return this.currentBoard.allowsLabels;
  },

  allowsChecklists() {
    return this.currentBoard.allowsChecklists;
  },

  allowsAttachments() {
    return this.currentBoard.allowsAttachments;
  },

  allowsComments() {
    return this.currentBoard.allowsComments;
  },

  allowsCardNumber() {
    return this.currentBoard.allowsCardNumber;
  },

  allowsDescriptionTitle() {
    return this.currentBoard.allowsDescriptionTitle;
  },

  allowsDescriptionText() {
    return this.currentBoard.allowsDescriptionText;
  },

  isBoardSelected() {
    return this.currentBoard.dateSettingsDefaultBoardID;
  },

  isNullBoardSelected() {
    return (
      this.currentBoard.dateSettingsDefaultBoardId === null ||
      this.currentBoard.dateSettingsDefaultBoardId === undefined
    );
  },

  boards() {
    return Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  lists() {
    return Lists.find(
      {
        boardId: this.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return (
      this.currentBoard.dateSettingsDefaultBoardId === this.currentData()._id
    );
  },

  events() {
    return [
      {
        'click .js-field-has-receiveddate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsReceivedDate = !this.currentBoard
            .allowsReceivedDate;
          this.currentBoard.setAllowsReceivedDate(
            this.currentBoard.allowsReceivedDate,
          );
          $(`.js-field-has-receiveddate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsReceivedDate,
          );
          $('.js-field-has-receiveddate').toggleClass(
            CKCLS,
            this.currentBoard.allowsReceivedDate,
          );
        },
        'click .js-field-has-startdate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsStartDate = !this.currentBoard
            .allowsStartDate;
          this.currentBoard.setAllowsStartDate(
            this.currentBoard.allowsStartDate,
          );
          $(`.js-field-has-startdate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsStartDate,
          );
          $('.js-field-has-startdate').toggleClass(
            CKCLS,
            this.currentBoard.allowsStartDate,
          );
        },
        'click .js-field-has-enddate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsEndDate = !this.currentBoard.allowsEndDate;
          this.currentBoard.setAllowsEndDate(this.currentBoard.allowsEndDate);
          $(`.js-field-has-enddate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsEndDate,
          );
          $('.js-field-has-enddate').toggleClass(
            CKCLS,
            this.currentBoard.allowsEndDate,
          );
        },
        'click .js-field-has-duedate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDueDate = !this.currentBoard.allowsDueDate;
          this.currentBoard.setAllowsDueDate(this.currentBoard.allowsDueDate);
          $(`.js-field-has-duedate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDueDate,
          );
          $('.js-field-has-duedate').toggleClass(
            CKCLS,
            this.currentBoard.allowsDueDate,
          );
        },
        'click .js-field-has-subtasks'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsSubtasks = !this.currentBoard.allowsSubtasks;
          this.currentBoard.setAllowsSubtasks(this.currentBoard.allowsSubtasks);
          $(`.js-field-has-subtasks ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-has-subtasks').toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
        },
        'click .js-field-has-creator'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCreator = !this.currentBoard.allowsCreator;
          this.currentBoard.setAllowsCreator(this.currentBoard.allowsCreator);
          $(`.js-field-has-creator ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCreator,
          );
          $('.js-field-has-creator').toggleClass(
            CKCLS,
            this.currentBoard.allowsCreator,
          );
        },
        'click .js-field-has-members'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsMembers = !this.currentBoard.allowsMembers;
          this.currentBoard.setAllowsMembers(this.currentBoard.allowsMembers);
          $(`.js-field-has-members ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsMembers,
          );
          $('.js-field-has-members').toggleClass(
            CKCLS,
            this.currentBoard.allowsMembers,
          );
        },
        'click .js-field-has-assignee'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAssignee = !this.currentBoard.allowsAssignee;
          this.currentBoard.setAllowsAssignee(this.currentBoard.allowsAssignee);
          $(`.js-field-has-assignee ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
          $('.js-field-has-assignee').toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
        },
        'click .js-field-has-assigned-by'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAssignedBy = !this.currentBoard
            .allowsAssignedBy;
          this.currentBoard.setAllowsAssignedBy(
            this.currentBoard.allowsAssignedBy,
          );
          $(`.js-field-has-assigned-by ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignedBy,
          );
          $('.js-field-has-assigned-by').toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignedBy,
          );
        },
        'click .js-field-has-requested-by'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsRequestedBy = !this.currentBoard
            .allowsRequestedBy;
          this.currentBoard.setAllowsRequestedBy(
            this.currentBoard.allowsRequestedBy,
          );
          $(`.js-field-has-requested-by ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsRequestedBy,
          );
          $('.js-field-has-requested-by').toggleClass(
            CKCLS,
            this.currentBoard.allowsRequestedBy,
          );
        },
        'click .js-field-has-card-sorting-by-number'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCardSortingByNumber = !this.currentBoard
            .allowsCardSortingByNumber;
          this.currentBoard.setAllowsCardSortingByNumber(
            this.currentBoard.allowsCardSortingByNumber,
          );
          $(`.js-field-has-card-sorting-by-number ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCardSortingByNumber,
          );
          $('.js-field-has-card-sorting-by-number').toggleClass(
            CKCLS,
            this.currentBoard.allowsCardSortingByNumber,
          );
        },
        'click .js-field-has-card-show-lists'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsShowLists = !this.currentBoard
            .allowsShowLists;
          this.currentBoard.setAllowsShowLists(
            this.currentBoard.allowsShowLists,
          );
          $(`.js-field-has-card-show-lists ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsShowLists,
          );
          $('.js-field-has-card-show-lists').toggleClass(
            CKCLS,
            this.currentBoard.allowsShowLists,
          );
        },
        'click .js-field-has-labels'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsLabels = !this.currentBoard.allowsLabels;
          this.currentBoard.setAllowsLabels(this.currentBoard.allowsLabels);
          $(`.js-field-has-labels ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
          $('.js-field-has-labels').toggleClass(
            CKCLS,
            this.currentBoard.allowsLabels,
          );
        },
        'click .js-field-has-description-title'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDescriptionTitle = !this.currentBoard
            .allowsDescriptionTitle;
          this.currentBoard.setAllowsDescriptionTitle(
            this.currentBoard.allowsDescriptionTitle,
          );
          $(`.js-field-has-description-title ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTitle,
          );
          $('.js-field-has-description-title').toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTitle,
          );
        },
        'click .js-field-has-card-number'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCardNumber = !this.currentBoard
            .allowsCardNumber;
          this.currentBoard.setAllowsCardNumber(
            this.currentBoard.allowsCardNumber,
          );
          $(`.js-field-has-card-number ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCardNumber,
          );
          $('.js-field-has-card-number').toggleClass(
            CKCLS,
            this.currentBoard.allowsCardNumber,
          );
        },
        'click .js-field-has-description-text'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDescriptionText = !this.currentBoard
            .allowsDescriptionText;
          this.currentBoard.setAllowsDescriptionText(
            this.currentBoard.allowsDescriptionText,
          );
          $(`.js-field-has-description-text ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionText,
          );
          $('.js-field-has-description-text').toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionText,
          );
        },
        'click .js-field-has-checklists'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsChecklists = !this.currentBoard
            .allowsChecklists;
          this.currentBoard.setAllowsChecklists(
            this.currentBoard.allowsChecklists,
          );
          $(`.js-field-has-checklists ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsChecklists,
          );
          $('.js-field-has-checklists').toggleClass(
            CKCLS,
            this.currentBoard.allowsChecklists,
          );
        },
        'click .js-field-has-attachments'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAttachments = !this.currentBoard
            .allowsAttachments;
          this.currentBoard.setAllowsAttachments(
            this.currentBoard.allowsAttachments,
          );
          $(`.js-field-has-attachments ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAttachments,
          );
          $('.js-field-has-attachments').toggleClass(
            CKCLS,
            this.currentBoard.allowsAttachments,
          );
        },
        'click .js-field-has-comments'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsComments = !this.currentBoard.allowsComments;
          this.currentBoard.setAllowsComments(this.currentBoard.allowsComments);
          $(`.js-field-has-comments ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsComments,
          );
          $('.js-field-has-comments').toggleClass(
            CKCLS,
            this.currentBoard.allowsComments,
          );
        },
        'click .js-field-has-activities'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsActivities = !this.currentBoard
            .allowsActivities;
          this.currentBoard.setAllowsActivities(
            this.currentBoard.allowsActivities,
          );
          $(`.js-field-has-activities ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsActivities,
          );
          $('.js-field-has-activities').toggleClass(
            CKCLS,
            this.currentBoard.allowsActivities,
          );
        },
      },
    ];
  },
}).register('boardCardSettingsPopup');


BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsDescriptionTextOnMinicard() {
    return this.currentBoard.allowsDescriptionTextOnMinicard;
  },

  allowsCoverAttachmentOnMinicard() {
    return this.currentBoard.allowsCoverAttachmentOnMinicard;
  },

  allowsBadgeAttachmentOnMinicard() {
    return this.currentBoard.allowsBadgeAttachmentOnMinicard;
  },

  allowsCardSortingByNumberOnMinicard() {
    return this.currentBoard.allowsCardSortingByNumberOnMinicard;
  },

 lists() {
    return Lists.find(
      {
        boardId: this.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return (
      this.currentBoard.dateSettingsDefaultBoardId === this.currentData()._id
    );
  },

  events() {
    return [
      {
        'click .js-field-has-description-text-on-minicard'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDescriptionTextOnMinicard = !this.currentBoard
            .allowsDescriptionTextOnMinicard;
          this.currentBoard.setallowsDescriptionTextOnMinicard(
            this.currentBoard.allowsDescriptionTextOnMinicard,
          );
          $(`.js-field-has-description-text-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTextOnMinicard,
          );
          $('.js-field-has-description-text-on-minicard').toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTextOnMinicard,
          );
        },
        'click .js-field-has-cover-attachment-on-minicard'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCoverAttachmentOnMinicard = !this.currentBoard
            .allowsCoverAttachmentOnMinicard;
          this.currentBoard.setallowsCoverAttachmentOnMinicard(
            this.currentBoard.allowsCoverAttachmentOnMinicard,
          );
          $(`.js-field-has-cover-attachment-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCoverAttachmentOnMinicard,
          );
          $('.js-field-has-cover-attachment-on-minicard').toggleClass(
            CKCLS,
            this.currentBoard.allowsCoverAttachmentOnMinicard,
          );
        },
        'click .js-field-has-badge-attachment-on-minicard'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsBadgeAttachmentOnMinicard = !this.currentBoard
            .allowsBadgeAttachmentOnMinicard;
          this.currentBoard.setallowsBadgeAttachmentOnMinicard(
            this.currentBoard.allowsBadgeAttachmentOnMinicard,
          );
          $(`.js-field-has-badge-attachment-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsBadgeAttachmentOnMinicard,
          );
          $('.js-field-has-badge-attachment-on-minicard').toggleClass(
            CKCLS,
            this.currentBoard.allowsBadgeAttachmentOnMinicard,
          );
        },
        'click .js-field-has-card-sorting-by-number-on-minicard'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCardSortingByNumberOnMinicard = !this.currentBoard
            .allowsCardSortingByNumberOnMinicard;
          this.currentBoard.setallowsCardSortingByNumberOnMinicard(
            this.currentBoard.allowsCardSortingByNumberOnMinicard,
          );
          $(`.js-field-has-card-sorting-by-number-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCardSortingByNumberOnMinicard,
          );
          $('.js-field-has-card-sorting-by-number-on-minicard').toggleClass(
            CKCLS,
            this.currentBoard.allowsCardSortingByNumberOnMinicard,
          );
        },
      },
    ];
  },
}).register('boardMinicardSettingsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  onRendered() {
    this.find('.js-search-member input').focus();
    this.setLoading(false);
  },

  isBoardMember() {
    const userId = this.currentData().__originalId;
    const user = Users.findOne(userId);
    return user && user.isBoardMember();
  },

  isValidEmail(email) {
    return SimpleSchema.RegEx.Email.test(email);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  inviteUser(idNameEmail) {
    const boardId = Session.get('currentBoard');
    this.setLoading(true);
    const self = this;
    Meteor.call('inviteUserToBoard', idNameEmail, boardId, (err, ret) => {
      self.setLoading(false);
      if (err) self.setError(err.error);
      else if (ret.email) self.setError('email-sent');
      else Popup.back();
    });
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click .js-select-member'() {
          const userId = this.currentData().__originalId;
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          if (!currentBoard.hasMember(userId)) {
            this.inviteUser(userId);
          }
        },
        'click .js-email-invite'() {
          const idNameEmail = $('.js-search-member input').val();
          if (idNameEmail.indexOf('@') < 0 || this.isValidEmail(idNameEmail)) {
            this.inviteUser(idNameEmail);
          } else this.setError('email-invalid');
        },
      },
    ];
  },
}).register('addMemberPopup');

Template.addMemberPopup.helpers({
  searchIndex: () => UserSearchIndex,
})

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'change #jsBoardOrgs'() {
          let currentBoard = Boards.findOne(Session.get('currentBoard'));
          let selectElt = document.getElementById("jsBoardOrgs");
          let selectedOrgId = selectElt.options[selectElt.selectedIndex].value;
          let selectedOrgDisplayName = selectElt.options[selectElt.selectedIndex].text;
          let boardOrganizations = [];
          if(currentBoard.orgs !== undefined){
            for(let i = 0; i < currentBoard.orgs.length; i++){
              boardOrganizations.push(currentBoard.orgs[i]);
            }
          }

          if(!boardOrganizations.some((org) => org.orgDisplayName == selectedOrgDisplayName)){
            boardOrganizations.push({
              "orgId": selectedOrgId,
              "orgDisplayName": selectedOrgDisplayName,
              "isActive" : true,
            })

            if (selectedOrgId != "-1") {
              Meteor.call('setBoardOrgs', boardOrganizations, currentBoard._id);
            }
          }

          Popup.back();
        },
      },
    ];
  },
}).register('addBoardOrgPopup');

Template.addBoardOrgPopup.helpers({
  orgsDatas() {
    let orgs = Org.find({}, {sort: { orgDisplayName: 1 }});
    return orgs;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click #leaveBoardBtn'(){
          let stringOrgId = document.getElementById('hideOrgId').value;
          let currentBoard = Boards.findOne(Session.get('currentBoard'));
          let boardOrganizations = [];
          if(currentBoard.orgs !== undefined){
            for(let i = 0; i < currentBoard.orgs.length; i++){
              if(currentBoard.orgs[i].orgId != stringOrgId){
                boardOrganizations.push(currentBoard.orgs[i]);
              }
            }
          }

          Meteor.call('setBoardOrgs', boardOrganizations, currentBoard._id);

          Popup.back();
        },
        'click #cancelLeaveBoardBtn'(){
          Popup.back();
        },
      },
    ];
  },
}).register('removeBoardOrgPopup');

Template.removeBoardOrgPopup.helpers({
  org() {
    return Org.findOne(this.orgId);
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });

    this.findUsersOptions = new ReactiveVar({});
    this.userPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitUsers = this.userPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'change #jsBoardTeams'() {
          let currentBoard = Boards.findOne(Session.get('currentBoard'));
          let selectElt = document.getElementById("jsBoardTeams");
          let selectedTeamId = selectElt.options[selectElt.selectedIndex].value;
          let selectedTeamDisplayName = selectElt.options[selectElt.selectedIndex].text;
          let boardTeams = [];
          if(currentBoard.teams !== undefined){
            for(let i = 0; i < currentBoard.teams.length; i++){
              boardTeams.push(currentBoard.teams[i]);
            }
          }

          if(!boardTeams.some((team) => team.teamDisplayName == selectedTeamDisplayName)){
            boardTeams.push({
              "teamId": selectedTeamId,
              "teamDisplayName": selectedTeamDisplayName,
              "isActive" : true,
            })

            if (selectedTeamId != "-1") {
              let members = currentBoard.members;

              let query = {
                "teams.teamId": { $in: boardTeams.map(t => t.teamId) },
              };

              const boardTeamUsers = Users.find(query, {
                sort: { sort: 1 },
              });

              if(boardTeams !== undefined && boardTeams.length > 0){
                let index;
                if(boardTeamUsers && boardTeamUsers.count() > 0){
                  boardTeamUsers.forEach((u) => {
                    index = members.findIndex(function(m){ return m.userId == u._id});
                    if(index == -1){
                      members.push({
                        "isActive": true,
                        "isAdmin": u.isAdmin !== undefined ? u.isAdmin : false,
                        "isCommentOnly" : false,
                        "isNoComments" : false,
                        "userId": u._id,
                      });
                    }
                  });
                }
              }

              Meteor.call('setBoardTeams', boardTeams, members, currentBoard._id);
            }
          }

          Popup.back();
        },
      },
    ];
  },
}).register('addBoardTeamPopup');

Template.addBoardTeamPopup.helpers({
  teamsDatas() {
    let teams = Team.find({}, {sort: { teamDisplayName: 1 }});
    return teams;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });

    this.findUsersOptions = new ReactiveVar({});
    this.userPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitUsers = this.userPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click #leaveBoardTeamBtn'(){
          let stringTeamId = document.getElementById('hideTeamId').value;
          let currentBoard = Boards.findOne(Session.get('currentBoard'));
          let boardTeams = [];
          if(currentBoard.teams !== undefined){
            for(let i = 0; i < currentBoard.teams.length; i++){
              if(currentBoard.teams[i].teamId != stringTeamId){
                boardTeams.push(currentBoard.teams[i]);
              }
            }
          }

          let members = currentBoard.members;
          let query = {
            "teams.teamId": stringTeamId
          };

          const boardTeamUsers = Users.find(query, {
            sort: { sort: 1 },
          });

          if(currentBoard.teams !== undefined && currentBoard.teams.length > 0){
            let index;
            if(boardTeamUsers && boardTeamUsers.count() > 0){
              boardTeamUsers.forEach((u) => {
                index = members.findIndex(function(m){ return m.userId == u._id});
                if(index !== -1 && (u.isAdmin === undefined || u.isAdmin == false)){
                  members.splice(index, 1);
                }
              });
            }
          }

          Meteor.call('setBoardTeams', boardTeams, members, currentBoard._id);

          Popup.back();
        },
        'click #cancelLeaveBoardTeamBtn'(){
          Popup.back();
        },
      },
    ];
  },
}).register('removeBoardTeamPopup');

Template.removeBoardTeamPopup.helpers({
  team() {
    return Team.findOne(this.teamId);
  },
});

Template.changePermissionsPopup.events({
  'click .js-set-admin, click .js-set-normal, click .js-set-no-comments, click .js-set-comment-only, click .js-set-worker'(
    event,
  ) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    const isCommentOnly = $(event.currentTarget).hasClass(
      'js-set-comment-only',
    );
    const isNoComments = $(event.currentTarget).hasClass('js-set-no-comments');
    const isWorker = $(event.currentTarget).hasClass('js-set-worker');
    currentBoard.setMemberPermission(
      memberId,
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
    );
    Popup.back(1);
  },
});

Template.changePermissionsPopup.helpers({
  isAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId);
  },

  isNormal() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      !currentBoard.hasNoComments(this.userId) &&
      !currentBoard.hasCommentOnly(this.userId) &&
      !currentBoard.hasWorker(this.userId)
    );
  },

  isNoComments() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasNoComments(this.userId)
    );
  },

  isCommentOnly() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasCommentOnly(this.userId)
    );
  },

  isWorker() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) && currentBoard.hasWorker(this.userId)
    );
  },

  isLastAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      currentBoard.hasAdmin(this.userId) && currentBoard.activeAdmins() === 1
    );
  },
});
