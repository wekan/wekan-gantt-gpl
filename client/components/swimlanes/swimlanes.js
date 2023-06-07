const { calculateIndex } = Utils;

function currentListIsInThisSwimlane(swimlaneId) {
  const currentList = Lists.findOne(Session.get('currentList'));
  return (
    currentList &&
    (currentList.swimlaneId === swimlaneId || currentList.swimlaneId === '')
  );
}

function currentCardIsInThisList(listId, swimlaneId) {
  const currentCard = Utils.getCurrentCard();
  //const currentUser = Meteor.user();
  if (
    //currentUser &&
    //currentUser.profile &&
    Utils.boardView() === 'board-view-swimlanes'
  )
    return (
      currentCard &&
      currentCard.listId === listId &&
      currentCard.swimlaneId === swimlaneId
    );
  else if (
    //currentUser &&
    //currentUser.profile &&
    Utils.boardView() === 'board-view-lists'
  )
    return (
      currentCard &&
      currentCard.listId === listId
    );

  // https://github.com/wekan/wekan/issues/1623
  // https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de
  // TODO: In public board, if you would like to switch between List/Swimlane view, you could
  //       1) If there is no view cookie, save to cookie board-view-lists
  //          board-view-lists / board-view-swimlanes / board-view-cal
  //       2) If public user changes clicks board-view-lists then change view and
  //          then change view and save cookie with view value
  //          without using currentuser above, because currentuser is null.
}

function initSortable(boardComponent, $listsDom) {
  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  $listsDom._uihooks = {
    removeElement(node) {
      const removeNode = _.once(() => {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0,
        });
        $listsDom.one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    },
  };

  $listsDom.sortable({
    connectWith: '.board-canvas',
    tolerance: 'pointer',
    helper: 'clone',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'js-list placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      ui.placeholder.width(ui.helper.width());
      EscapeActions.executeUpTo('popup-close');
      boardComponent.setIsDragging(true);
    },
    stop(evt, ui) {
      // To attribute the new index number, we need to get the DOM element
      // of the previous and the following card -- if any.
      const prevListDom = ui.item.prev('.js-list').get(0);
      const nextListDom = ui.item.next('.js-list').get(0);
      const sortIndex = calculateIndex(prevListDom, nextListDom, 1);

      $listsDom.sortable('cancel');
      const listDomElement = ui.item.get(0);
      const list = Blaze.getData(listDomElement);

      /*
            Reverted incomplete change list width,
            removed from below Lists.update:
             https://github.com/wekan/wekan/issues/4558
                $set: {
                  width: list._id.width(),
                  height: list._id.height(),
      */

      Lists.update(list._id, {
        $set: {
          sort: sortIndex.base,
        },
      });

      boardComponent.setIsDragging(false);
    },
  });

  //function userIsMember() {
  //  return (
  //    Meteor.user() &&
  //    Meteor.user().isBoardMember() &&
  //    !Meteor.user().isCommentOnly() &&
  //    !Meteor.user().isWorker()
  //  );
  //}

  boardComponent.autorun(() => {
    if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
      $listsDom.sortable({
        handle: '.js-list-handle',
      });
    } else {
      $listsDom.sortable({
        handle: '.js-list-header',
      });
    }

    const $listDom = $listsDom;
    if ($listDom.data('uiSortable') || $listDom.data('sortable')) {
      $listsDom.sortable(
        'option',
        'disabled',
        // Disable drag-dropping when user is not member/is worker
        //!userIsMember() || Meteor.user().isWorker(),
        !Meteor.user() || !Meteor.user().isBoardAdmin(),
        // Not disable drag-dropping while in multi-selection mode
        // MultiSelection.isActive() || !userIsMember(),
      );
    }
  });
}

BlazeComponent.extendComponent({
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Utils.getCurrentCardId()) {
      boardComponent.scrollLeft();
    }

    initSortable(boardComponent, $listsDom);
  },
  onCreated() {
    this.draggingActive = new ReactiveVar(false);

    this._isDragging = false;
    this._lastDragPositionX = 0;
  },
  id() {
    return this._id;
  },
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },
  currentListIsInThisSwimlane(swimlaneId) {
    return currentListIsInThisSwimlane(swimlaneId);
  },
  visible(list) {
    if (list.archived) {
      // Show archived list only when filter archive is on
      if (!Filter.archive.isSelected()) {
        return false;
      }
    }
    if (Filter.lists._isActive()) {
      if (!list.title.match(Filter.lists.getRegexSelector())) {
        return false;
      }
    }
    if (Filter.hideEmpty.isSelected()) {
      const swimlaneId = this.parentComponent()
        .parentComponent()
        .data()._id;
      const cards = list.cards(swimlaneId);
      if (cards.count() === 0) {
        return false;
      }
    }
    return true;
  },
  events() {
    return [
      {
        // Click-and-drag action
        'mousedown .board-canvas'(evt) {
          // Translating the board canvas using the click-and-drag action can
          // conflict with the build-in browser mechanism to select text. We
          // define a list of elements in which we disable the dragging because
          // the user will legitimately expect to be able to select some text with
          // his mouse.

          const noDragInside = ['a', 'input', 'textarea', 'p'].concat(
            Utils.isTouchScreenOrShowDesktopDragHandles()
              ? ['.js-list-handle', '.js-swimlane-header-handle']
              : ['.js-list-header'],
          );

          if (
            $(evt.target).closest(noDragInside.join(',')).length === 0 &&
            this.$('.swimlane').prop('clientHeight') > evt.offsetY
          ) {
            this._isDragging = true;
            this._lastDragPositionX = evt.clientX;
          }
        },
        mouseup() {
          if (this._isDragging) {
            this._isDragging = false;
          }
        },
        mousemove(evt) {
          if (this._isDragging) {
            // Update the canvas position
            this.listsDom.scrollLeft -= evt.clientX - this._lastDragPositionX;
            this._lastDragPositionX = evt.clientX;
            // Disable browser text selection while dragging
            evt.stopPropagation();
            evt.preventDefault();
            // Don't close opened card or inlined form at the end of the
            // click-and-drag.
            EscapeActions.executeUpTo('popup-close');
            EscapeActions.preventNextClick();
          }
        },
      },
    ];
  },
}).register('swimlane');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
    this.isListTemplatesSwimlane =
      this.currentBoard.isTemplatesBoard() &&
      this.currentData().isListTemplatesSwimlane();
    this.currentSwimlane = this.currentData();
  },

  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  events() {
    return [
      {
        submit(evt) {
          evt.preventDefault();
          const lastList = this.currentBoard.getLastList();
          const titleInput = this.find('.list-name-input');
          const title = titleInput.value.trim();
          let sortIndex = 0
          if (lastList) {
            const positionInput = this.find('.list-position-input');
            const position = positionInput.value.trim();
            const ret = Lists.findOne({ boardId: Session.get('currentBoard'), _id: position, archived: false })
            sortIndex = parseInt(JSON.stringify(ret['sort']))
            sortIndex = sortIndex+1
          } else {
            sortIndex = Utils.calculateIndexData(lastList, null).base;
          }

          if (title) {
            Lists.insert({
              title,
              boardId: Session.get('currentBoard'),
              sort: sortIndex,
              type: this.isListTemplatesSwimlane ? 'template-list' : 'list',
              swimlaneId: this.currentBoard.isTemplatesBoard()
                ? this.currentSwimlane._id
                : '',
            });

            titleInput.value = '';
            titleInput.focus();
          }
        },
        'click .js-list-template': Popup.open('searchElement'),
      },
    ];
  },
}).register('addListForm');

Template.swimlane.helpers({
  canSeeAddList() {
    return Meteor.user().isBoardAdmin();
    /*
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
      */
  },
});

BlazeComponent.extendComponent({
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },
  visible(list) {
    if (list.archived) {
      // Show archived list only when filter archive is on
      if (!Filter.archive.isSelected()) {
        return false;
      }
    }
    if (Filter.lists._isActive()) {
      if (!list.title.match(Filter.lists.getRegexSelector())) {
        return false;
      }
    }
    if (Filter.hideEmpty.isSelected()) {
      const swimlaneId = this.parentComponent()
        .parentComponent()
        .data()._id;
      const cards = list.cards(swimlaneId);
      if (cards.count() === 0) {
        return false;
      }
    }
    return true;
  },
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Utils.getCurrentCardId()) {
      boardComponent.scrollLeft();
    }

    initSortable(boardComponent, $listsDom);
  },
}).register('listsGroup');

class MoveSwimlaneComponent extends BlazeComponent {
  serverMethod = 'moveSwimlane';

  onCreated() {
    this.currentSwimlane = this.currentData();
  }

  board() {
    return Boards.findOne(Session.get('currentBoard'));
  }

  toBoardsSelector() {
    return {
      archived: false,
      'members.userId': Meteor.userId(),
      type: 'board',
      _id: { $ne: this.board()._id },
    };
  }

  toBoards() {
    return Boards.find(this.toBoardsSelector(), { sort: { title: 1 } });
  }

  events() {
    return [
      {
        'click .js-done'() {
          // const swimlane = Swimlanes.findOne(this.currentSwimlane._id);
          const bSelect = $('.js-select-boards')[0];
          let boardId;
          if (bSelect) {
            boardId = bSelect.options[bSelect.selectedIndex].value;
            Meteor.call(this.serverMethod, this.currentSwimlane._id, boardId);
          }
          Popup.back();
        },
      },
    ];
  }
}
MoveSwimlaneComponent.register('moveSwimlanePopup');

(class extends MoveSwimlaneComponent {
  serverMethod = 'copySwimlane';
  toBoardsSelector() {
    const selector = super.toBoardsSelector();
    delete selector._id;
    return selector;
  }
}.register('copySwimlanePopup'));
