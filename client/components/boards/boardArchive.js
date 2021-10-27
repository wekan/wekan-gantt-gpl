BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('archivedBoards');
  },

  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },

  archivedBoards() {
    return Boards.find(
      { archived: true },
      {
        sort: { archivedAt: -1, modifiedAt: -1 },
      },
    );
  },

  events() {
    return [
      {
        'click .js-restore-board'() {
          // TODO : Make isSandstorm variable global
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Session.get('currentBoard')) {
            const currentBoard = Boards.findOne(Session.get('currentBoard'));
            currentBoard.archive();
          }
          const board = this.currentData();
          board.restore();
          Utils.goBoardId(board._id);
        },
        'click .js-delete-board': Popup.afterConfirm('boardDelete', function() {
          Popup.back();
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Session.get('currentBoard')) {
            const currentBoard = Boards.findOne(Session.get('currentBoard'));
            Boards.remove(currentBoard._id);
          }
          Boards.remove(this._id);
          FlowRouter.go('home');
        }),
      },
    ];
  },
}).register('archivedBoards');
