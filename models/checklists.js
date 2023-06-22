Checklists = new Mongo.Collection('checklists');

/**
 * A Checklist
 */
Checklists.attachSchema(
  new SimpleSchema({
    cardId: {
      /**
       * The ID of the card the checklist is in
       */
      type: String,
    },
    title: {
      /**
       * the title of the checklist
       */
      type: String,
      defaultValue: 'Checklist',
    },
    finishedAt: {
      /**
       * When was the checklist finished
       */
      type: Date,
      optional: true,
    },
    createdAt: {
      /**
       * Creation date of the checklist
       */
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    sort: {
      /**
       * sorting value of the checklist
       */
      type: Number,
      decimal: true,
    },
  }),
);

Checklists.helpers({
  copy(newCardId) {
    const oldChecklistId = this._id;
    this._id = null;
    this.cardId = newCardId;
    const newChecklistId = Checklists.insert(this);
    ChecklistItems.find({ checklistId: oldChecklistId }).forEach(function(
      item,
    ) {
      item._id = null;
      item.checklistId = newChecklistId;
      item.cardId = newCardId;
      ChecklistItems.insert(item);
    });
  },

  itemCount() {
    return ChecklistItems.find({ checklistId: this._id }).count();
  },
  items() {
    return ChecklistItems.find(
      {
        checklistId: this._id,
      },
      { sort: ['sort'] },
    );
  },
  firstItem() {
    const allItems = this.items().fetch();
    const ret = _.first(allItems);
    return ret;
  },
  lastItem() {
    const allItems = this.items().fetch();
    const ret = allItems[allItems.length - 1];
    return ret;
  },
  finishedCount() {
    return ChecklistItems.find({
      checklistId: this._id,
      isFinished: true,
    }).count();
  },
  /** returns the finished percent of the checklist */
  finishedPercent() {
    const checklistItems = ChecklistItems.find({ checklistId: this._id });
    const count = checklistItems.count();
    const checklistItemsFinished = checklistItems.fetch().filter(checklistItem => checklistItem.isFinished);

    let ret = 0;

    if (count > 0) {
      ret = Math.round(checklistItemsFinished.length / count * 100);
    }
    return ret;
  },
  isFinished() {
    return 0 !== this.itemCount() && this.itemCount() === this.finishedCount();
  },
  checkAllItems() {
    const checkItems = ChecklistItems.find({ checklistId: this._id });
    checkItems.forEach(function(item) {
      item.check();
    });
  },
  uncheckAllItems() {
    const checkItems = ChecklistItems.find({ checklistId: this._id });
    checkItems.forEach(function(item) {
      item.uncheck();
    });
  },
  itemIndex(itemId) {
    const items = self.findOne({ _id: this._id }).items;
    return _.pluck(items, '_id').indexOf(itemId);
  },
});

Checklists.allow({
  insert(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

Checklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});

Checklists.mutations({
  setTitle(title) {
    return { $set: { title } };
  },
  /** move the checklist to another card
   * @param newCardId move the checklist to this cardId
   */
  move(newCardId) {
    // update every activity
    Activities.find(
      {checklistId: this._id}
    ).forEach(activity => {
      Activities.update(activity._id, {
        $set: {
          cardId: newCardId,
        },
      });
    });
    // update every checklist-item
    ChecklistItems.find(
      {checklistId: this._id}
    ).forEach(checklistItem => {
      ChecklistItems.update(checklistItem._id, {
        $set: {
          cardId: newCardId,
        },
      });
    });
    // update the checklist itself
    return {
      $set: {
        cardId: newCardId,
      },
    };
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Checklists._collection.createIndex({ modifiedAt: -1 });
    Checklists._collection.createIndex({ cardId: 1, createdAt: 1 });
  });

  Checklists.after.insert((userId, doc) => {
    const card = Cards.findOne(doc.cardId);
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      cardId: doc.cardId,
      boardId: card.boardId,
      checklistId: doc._id,
      checklistName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  });

  Checklists.before.remove((userId, doc) => {
    const activities = Activities.find({ checklistId: doc._id });
    const card = Cards.findOne(doc.cardId);
    if (activities) {
      activities.forEach(activity => {
        Activities.remove(activity._id);
      });
    }
    Activities.insert({
      userId,
      activityType: 'removeChecklist',
      cardId: doc.cardId,
      boardId: Cards.findOne(doc.cardId).boardId,
      checklistId: doc._id,
      checklistName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  });
}

if (Meteor.isServer) {
  /**
   * @operation get_all_checklists
   * @summary Get the list of checklists attached to a card
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @return_type [{_id: string,
   *                title: string}]
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cards/:cardId/checklists',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const checklists = Checklists.find({ cardId: paramCardId }).map(function(
        doc,
      ) {
        return {
          _id: doc._id,
          title: doc.title,
        };
      });
      if (checklists) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: checklists,
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 500,
        });
      }
    },
  );

  /**
   * @operation get_checklist
   * @summary Get a checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist
   * @return_type {cardId: string,
   *               title: string,
   *               finishedAt: string,
   *               createdAt: string,
   *               sort: number,
   *               items: [{_id: string,
   *                        title: string,
   *                        isFinished: boolean}]}
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramChecklistId = req.params.checklistId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const checklist = Checklists.findOne({
        _id: paramChecklistId,
        cardId: paramCardId,
      });
      if (checklist) {
        checklist.items = ChecklistItems.find({
          checklistId: checklist._id,
        }).map(function(doc) {
          return {
            _id: doc._id,
            title: doc.title,
            isFinished: doc.isFinished,
          };
        });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: checklist,
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 500,
        });
      }
    },
  );

  /**
   * @operation new_checklist
   * @summary create a new checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} title the title of the new checklist
   * @param {string} [items] the list of items on the new checklist
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/cards/:cardId/checklists',
    function(req, res) {
      // Check user is logged in
      //Authentication.checkLoggedIn(req.userId);
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      // Check user has permission to add checklist to the card
      const board = Boards.findOne({
        _id: paramBoardId,
      });
      const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
      Authentication.checkAdminOrCondition(req.userId, addPermission);
      const paramCardId = req.params.cardId;
      const id = Checklists.insert({
        title: req.body.title,
        cardId: paramCardId,
        sort: 0,
      });
      if (id) {
        let items = req.body.items || [];
        if (_.isString(items)) {
          if (items === '') {
            items = [];
          } else {
            items = [items];
          }
        }
        items.forEach(function(item, idx) {
          ChecklistItems.insert({
            cardId: paramCardId,
            checklistId: id,
            title: item,
            sort: idx,
          });
        });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: {
            _id: id,
          },
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 400,
        });
      }
    },
  );

  /**
   * @operation delete_checklist
   * @summary Delete a checklist
   *
   * @description The checklist will be removed, not put in the recycle bin.
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist to remove
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramChecklistId = req.params.checklistId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      Checklists.remove({ _id: paramChecklistId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramChecklistId,
        },
      });
    },
  );
}

export default Checklists;
