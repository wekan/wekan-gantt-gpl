ChecklistItems = new Mongo.Collection('checklistItems');

/**
 * An item in a checklist
 */
ChecklistItems.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the text of the item
       */
      type: String,
    },
    sort: {
      /**
       * the sorting field of the item
       */
      type: Number,
      decimal: true,
    },
    isFinished: {
      /**
       * Is the item checked?
       */
      type: Boolean,
      defaultValue: false,
    },
    checklistId: {
      /**
       * the checklist ID the item is attached to
       */
      type: String,
    },
    cardId: {
      /**
       * the card ID the item is attached to
       */
      type: String,
    },
    createdAt: {
      type: Date,
      optional: true,
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
  }),
);

ChecklistItems.allow({
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

ChecklistItems.before.insert((userId, doc) => {
  if (!doc.userId) {
    doc.userId = userId;
  }
});

// Mutations
ChecklistItems.mutations({
  setTitle(title) {
    return { $set: { title } };
  },
  check() {
    return { $set: { isFinished: true } };
  },
  uncheck() {
    return { $set: { isFinished: false } };
  },
  toggleItem() {
    return { $set: { isFinished: !this.isFinished } };
  },
  move(checklistId, sortIndex) {
    const cardId = Checklists.findOne(checklistId).cardId;
    const mutatedFields = {
      cardId,
      checklistId,
      sort: sortIndex,
    };

    return { $set: mutatedFields };
  },
});

// Activities helper
function itemCreation(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  Activities.insert({
    userId,
    activityType: 'addChecklistItem',
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

function itemRemover(userId, doc) {
  Activities.remove({
    checklistItemId: doc._id,
  });
}

function publishCheckActivity(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  let activityType;
  if (doc.isFinished) {
    activityType = 'checkedItem';
  } else {
    activityType = 'uncheckedItem';
  }
  const act = {
    userId,
    activityType,
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  };
  Activities.insert(act);
}

function publishChekListCompleted(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = Checklists.findOne({ _id: checklistId });
  if (checkList.isFinished()) {
    const act = {
      userId,
      activityType: 'completeChecklist',
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName: checkList.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    };
    Activities.insert(act);
  }
}

function publishChekListUncompleted(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = Checklists.findOne({ _id: checklistId });
  // BUGS in IFTTT Rules: https://github.com/wekan/wekan/issues/1972
  //       Currently in checklist all are set as uncompleted/not checked,
  //       IFTTT Rule does not move card to other list.
  //       If following line is negated/changed to:
  //         if(!checkList.isFinished()){
  //       then unchecking of any checkbox will move card to other list,
  //       even when all checkboxes are not yet unchecked.
  //       What is correct code for only moving when all in list is unchecked?
  // TIPS: Finding  files, ignoring some directories with grep -v:
  //         cd wekan
  //         find . | xargs grep 'count' -sl | grep -v .meteor | grep -v node_modules | grep -v .build
  //       Maybe something related here?
  //         wekan/client/components/rules/triggers/checklistTriggers.js
  if (checkList.isFinished()) {
    const act = {
      userId,
      activityType: 'uncompleteChecklist',
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName: checkList.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    };
    Activities.insert(act);
  }
}

// Activities
if (Meteor.isServer) {
  Meteor.startup(() => {
    ChecklistItems._collection.createIndex({ modifiedAt: -1 });
    ChecklistItems._collection.createIndex({ checklistId: 1 });
    ChecklistItems._collection.createIndex({ cardId: 1 });
  });

  ChecklistItems.after.update((userId, doc, fieldNames) => {
    publishCheckActivity(userId, doc);
    publishChekListCompleted(userId, doc, fieldNames);
  });

  ChecklistItems.before.update((userId, doc, fieldNames) => {
    publishChekListUncompleted(userId, doc, fieldNames);
  });

  ChecklistItems.after.insert((userId, doc) => {
    itemCreation(userId, doc);
  });

  ChecklistItems.before.remove((userId, doc) => {
    itemRemover(userId, doc);
    const card = Cards.findOne(doc.cardId);
    const boardId = card.boardId;
    Activities.insert({
      userId,
      activityType: 'removedChecklistItem',
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistItemId: doc._id,
      checklistItemName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  });
}

if (Meteor.isServer) {
  /**
   * @operation get_checklist_item
   * @tag Checklists
   * @summary Get a checklist item
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the checklist ID
   * @param {string} itemId the ID of the item
   * @return_type ChecklistItems
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramItemId = req.params.itemId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const checklistItem = ChecklistItems.findOne({ _id: paramItemId });
      if (checklistItem) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: checklistItem,
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 500,
        });
      }
    },
  );

  /**
  * @operation new_checklist_item
  * @summary add a new item to a checklist
  *
  * @param {string} boardId the board ID
  * @param {string} cardId the card ID
  * @param {string} checklistId the ID of the checklist
  * @param {string} title the title of the new item
  * @return_type {_id: string}
  */

  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items',
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
        const id = ChecklistItems.insert({
          cardId: paramCardId,
          checklistId: paramChecklistId,
          title: req.body.title,
          isFinished: false,
          sort: 0,
        });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: {
            _id: id,
          },
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 404,
        });
      }
    },
  );

  /**
   * @operation edit_checklist_item
   * @tag Checklists
   * @summary Edit a checklist item
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the checklist ID
   * @param {string} itemId the ID of the item
   * @param {string} [isFinished] is the item checked?
   * @param {string} [title] the new text of the item
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'PUT',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramItemId = req.params.itemId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      function isTrue(data) {
        try {
          return data.toLowerCase() === 'true';
        } catch (error) {
          return data;
        }
      }

      if (req.body.hasOwnProperty('isFinished')) {
        ChecklistItems.direct.update(
          { _id: paramItemId },
          { $set: { isFinished: isTrue(req.body.isFinished) } },
        );
      }
      if (req.body.hasOwnProperty('title')) {
        ChecklistItems.direct.update(
          { _id: paramItemId },
          { $set: { title: req.body.title } },
        );
      }

      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramItemId,
        },
      });
    },
  );

  /**
   * @operation delete_checklist_item
   * @tag Checklists
   * @summary Delete a checklist item
   *
   * @description Note: this operation can't be reverted.
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the checklist ID
   * @param {string} itemId the ID of the item to be removed
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramItemId = req.params.itemId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      ChecklistItems.direct.remove({ _id: paramItemId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramItemId,
        },
      });
    },
  );
}

export default ChecklistItems;
