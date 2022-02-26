function getCardsBetween(idA, idB) {
  function pluckId(doc) {
    return doc._id;
  }

  function getListsStrictlyBetween(id1, id2) {
    return Lists.find({
      $and: [
        { sort: { $gt: Lists.findOne(id1).sort } },
        { sort: { $lt: Lists.findOne(id2).sort } },
      ],
      archived: false,
    }).map(pluckId);
  }

  const cards = _.sortBy([Cards.findOne(idA), Cards.findOne(idB)], c => {
    return c.sort;
  });

  let selector;
  if (cards[0].listId === cards[1].listId) {
    selector = {
      listId: cards[0].listId,
      sort: {
        $gte: cards[0].sort,
        $lte: cards[1].sort,
      },
      archived: false,
    };
  } else {
    selector = {
      $or: [
        {
          listId: cards[0].listId,
          sort: { $lte: cards[0].sort },
        },
        {
          listId: {
            $in: getListsStrictlyBetween(cards[0].listId, cards[1].listId),
          },
        },
        {
          listId: cards[1].listId,
          sort: { $gte: cards[1].sort },
        },
      ],
      archived: false,
    };
  }

  return Cards.find(Filter.mongoSelector(selector)).map(pluckId);
}

MultiSelection = {
  sidebarView: 'multiselection',

  _selectedCards: new ReactiveVar([]),

  _isActive: new ReactiveVar(false),

  startRangeCardId: null,

  _sidebarWasOpen: false,

  reset() {
    this._selectedCards.set([]);
  },

  getMongoSelector() {
    return Filter.mongoSelector({
      _id: { $in: this._selectedCards.get() },
    });
  },

  isActive() {
    return this._isActive.get();
  },

  count() {
    return Cards.find(this.getMongoSelector()).count();
  },

  isEmpty() {
    return this.count() === 0;
  },
  getSelectedCardIds(){
    return this._selectedCards.curValue;
  },

  activate() {
    if (!this.isActive()) {
      this._sidebarWasOpen = Sidebar.isOpen();
      EscapeActions.executeUpTo('detailsPane');
      this._isActive.set(true);
      Tracker.flush();
    }
    Sidebar.setView(this.sidebarView);
    if(Utils.isMiniScreen()) {
      Sidebar.hide();
    }
  },

  disable() {
    if (this.isActive()) {
      this._isActive.set(false);
      if (Sidebar && Sidebar.getView() === this.sidebarView) {
        Sidebar.setView();
        if(!this._sidebarWasOpen) {
          Sidebar.hide();
        }
      }
      this.reset();
    }
  },

  add(cardIds) {
    return this.toggle(cardIds, { add: true, remove: false });
  },

  remove(cardIds) {
    return this.toggle(cardIds, { add: false, remove: true });
  },

  toggleRange(cardId) {
    const selectedCards = this._selectedCards.get();
    this.reset();
    if (!this.isActive() || selectedCards.length === 0) {
      this.toggle(cardId);
    } else {
      const startRange = selectedCards[selectedCards.length - 1];
      this.toggle(getCardsBetween(startRange, cardId));
    }
  },

  toggle(cardIds, options = {}) {
    cardIds = _.isString(cardIds) ? [cardIds] : cardIds;
    options = {
      add: true,
      remove: true,
      ...options,
    };

    if (!this.isActive()) {
      this.reset();
      this.activate();
    }

    const selectedCards = this._selectedCards.get();

    cardIds.forEach(cardId => {
      const indexOfCard = selectedCards.indexOf(cardId);

      if (options.remove && indexOfCard > -1)
        selectedCards.splice(indexOfCard, 1);
      else if (options.add) selectedCards.push(cardId);
    });

    this._selectedCards.set(selectedCards);
  },

  isSelected(cardId) {
    return this._selectedCards.get().indexOf(cardId) > -1;
  },
};

Blaze.registerHelper('MultiSelection', MultiSelection);

EscapeActions.register(
  'multiselection',
  () => {
    MultiSelection.disable();
  },
  () => {
    return MultiSelection.isActive();
  },
  {
    noClickEscapeOn: '.js-minicard,.js-board-sidebar-content',
  },
);
