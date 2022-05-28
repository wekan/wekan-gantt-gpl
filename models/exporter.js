import moment from 'moment/min/moment-with-locales';
const Papa = require('papaparse');
import { TAPi18n } from '/imports/i18n';

//const stringify = require('csv-stringify');

//const stringify = require('csv-stringify');

// exporter maybe is broken since Gridfs introduced, add fs and path
export class Exporter {
  constructor(boardId, attachmentId) {
    this._boardId = boardId;
    this._attachmentId = attachmentId;
  }

  build() {
    const fs = Npm.require('fs');
    const os = Npm.require('os');
    const path = Npm.require('path');

    const byBoard = { boardId: this._boardId };
    const byBoardNoLinked = {
      boardId: this._boardId,
      linkedId: { $in: ['', null] },
    };
    // we do not want to retrieve boardId in related elements
    const noBoardId = {
      fields: {
        boardId: 0,
      },
    };
    const result = {
      _format: 'wekan-board-1.0.0',
    };
    _.extend(
      result,
      Boards.findOne(this._boardId, {
        fields: {
          stars: 0,
        },
      }),
    );

    // [Old] for attachments we only export IDs and absolute url to original doc
    // [New] Encode attachment to base64

    const getBase64Data = function (doc, callback) {
      let buffer = Buffer.allocUnsafe(0);
      buffer.fill(0);

      // callback has the form function (err, res) {}
      const tmpFile = path.join(
        os.tmpdir(),
        `tmpexport${process.pid}${Math.random()}`,
      );
      const tmpWriteable = fs.createWriteStream(tmpFile);
      const readStream = doc.createReadStream();
      readStream.on('data', function (chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });

      readStream.on('error', function () {
        callback(null, null);
      });
      readStream.on('end', function () {
        // done
        fs.unlink(tmpFile, () => {
          //ignored
        });

        callback(null, buffer.toString('base64'));
      });
      readStream.pipe(tmpWriteable);
    };
    const getBase64DataSync = Meteor.wrapAsync(getBase64Data);
    const byBoardAndAttachment = this._attachmentId
      ? { boardId: this._boardId, _id: this._attachmentId }
      : byBoard;
    result.attachments = Attachments.find(byBoardAndAttachment)
      .fetch()
      .map((attachment) => {
        let filebase64 = null;
        filebase64 = getBase64DataSync(attachment);

        return {
          _id: attachment._id,
          cardId: attachment.meta.cardId,
          //url: FlowRouter.url(attachment.url()),
          file: filebase64,
          name: attachment.name,
          type: attachment.type,
        };
      });
    //When has a especific valid attachment return the single element
    if (this._attachmentId) {
      return result.attachments.length > 0 ? result.attachments[0] : {};
    }

    result.lists = Lists.find(byBoard, noBoardId).fetch();
    result.cards = Cards.find(byBoardNoLinked, noBoardId).fetch();
    result.swimlanes = Swimlanes.find(byBoard, noBoardId).fetch();
    result.customFields = CustomFields.find(
      { boardIds: this._boardId },
      { fields: { boardIds: 0 } },
    ).fetch();
    result.comments = CardComments.find(byBoard, noBoardId).fetch();
    result.activities = Activities.find(byBoard, noBoardId).fetch();
    result.rules = Rules.find(byBoard, noBoardId).fetch();
    result.checklists = [];
    result.checklistItems = [];
    result.subtaskItems = [];
    result.triggers = [];
    result.actions = [];
    result.cards.forEach((card) => {
      result.checklists.push(
        ...Checklists.find({
          cardId: card._id,
        }).fetch(),
      );
      result.checklistItems.push(
        ...ChecklistItems.find({
          cardId: card._id,
        }).fetch(),
      );
      result.subtaskItems.push(
        ...Cards.find({
          parentId: card._id,
        }).fetch(),
      );
    });
    result.rules.forEach((rule) => {
      result.triggers.push(
        ...Triggers.find(
          {
            _id: rule.triggerId,
          },
          noBoardId,
        ).fetch(),
      );
      result.actions.push(
        ...Actions.find(
          {
            _id: rule.actionId,
          },
          noBoardId,
        ).fetch(),
      );
    });

    // we also have to export some user data - as the other elements only
    // include id but we have to be careful:
    // 1- only exports users that are linked somehow to that board
    // 2- do not export any sensitive information
    const users = {};
    result.members.forEach((member) => {
      users[member.userId] = true;
    });
    result.lists.forEach((list) => {
      users[list.userId] = true;
    });
    result.cards.forEach((card) => {
      users[card.userId] = true;
      if (card.members) {
        card.members.forEach((memberId) => {
          users[memberId] = true;
        });
      }
    });
    result.comments.forEach((comment) => {
      users[comment.userId] = true;
    });
    result.activities.forEach((activity) => {
      users[activity.userId] = true;
    });
    result.checklists.forEach((checklist) => {
      users[checklist.userId] = true;
    });
    const byUserIds = {
      _id: {
        $in: Object.getOwnPropertyNames(users),
      },
    };
    // we use whitelist to be sure we do not expose inadvertently
    // some secret fields that gets added to User later.
    const userFields = {
      fields: {
        _id: 1,
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
        'profile.avatarUrl': 1,
      },
    };
    result.users = Users.find(byUserIds, userFields)
      .fetch()
      .map((user) => {
        // user avatar is stored as a relative url, we export absolute
        if ((user.profile || {}).avatarUrl) {
          user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
        }
        return user;
      });
    return result;
  }

  buildCsv(userDelimiter = ',', userLanguage='en') {
    const result = this.build();
    const columnHeaders = [];
    const cardRows = [];

    const papaconfig = {
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: userDelimiter,
      header: true,
      newline: "\r\n",
      skipEmptyLines: false,
      escapeFormulae: true,
    };

    columnHeaders.push(
      TAPi18n.__('title','',userLanguage),
      TAPi18n.__('description','',userLanguage),
      TAPi18n.__('list','',userLanguage),
      TAPi18n.__('swimlane','',userLanguage),
      TAPi18n.__('owner','',userLanguage),
      TAPi18n.__('requested-by','',userLanguage),
      TAPi18n.__('assigned-by','',userLanguage),
      TAPi18n.__('members','',userLanguage),
      TAPi18n.__('assignee','',userLanguage),
      TAPi18n.__('labels','',userLanguage),
      TAPi18n.__('card-start','',userLanguage),
      TAPi18n.__('card-due','',userLanguage),
      TAPi18n.__('card-end','',userLanguage),
      TAPi18n.__('overtime-hours','',userLanguage),
      TAPi18n.__('spent-time-hours','',userLanguage),
      TAPi18n.__('createdAt','',userLanguage),
      TAPi18n.__('last-modified-at','',userLanguage),
      TAPi18n.__('last-activity','',userLanguage),
      TAPi18n.__('voting','',userLanguage),
      TAPi18n.__('archived','',userLanguage),
    );
    const customFieldMap = {};
    let i = 0;
    result.customFields.forEach((customField) => {
      customFieldMap[customField._id] = {
        position: i,
        type: customField.type,
      };
      if (customField.type === 'dropdown') {
        let options = '';
        customField.settings.dropdownItems.forEach((item) => {
          options = options === '' ? item.name : `${`${options}/${item.name}`}`;
        });
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}-${options}`,
        );
      } else if (customField.type === 'currency') {
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}-${customField.settings.currencyCode}`,
        );
      } else {
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}`,
        );
      }
      i++;
    });
    //cardRows.push([[columnHeaders]]);
    cardRows.push(columnHeaders);

    result.cards.forEach((card) => {
      const currentRow = [];
      currentRow.push(card.title);
      currentRow.push(card.description);
      currentRow.push(
        result.lists.find(({ _id }) => _id === card.listId).title,
      );
      currentRow.push(
        result.swimlanes.find(({ _id }) => _id === card.swimlaneId).title,
      );
      currentRow.push(
        result.users.find(({ _id }) => _id === card.userId).username,
      );
      currentRow.push(card.requestedBy ? card.requestedBy : ' ');
      currentRow.push(card.assignedBy ? card.assignedBy : ' ');
      let usernames = '';
      card.members.forEach((memberId) => {
        const user = result.users.find(({ _id }) => _id === memberId);
        usernames = `${usernames + user.username} `;
      });
      currentRow.push(usernames.trim());
      let assignees = '';
      card.assignees.forEach((assigneeId) => {
        const user = result.users.find(({ _id }) => _id === assigneeId);
        assignees = `${assignees + user.username} `;
      });
      currentRow.push(assignees.trim());
      let labels = '';
      card.labelIds.forEach((labelId) => {
        const label = result.labels.find(({ _id }) => _id === labelId);
        labels = `${labels + label.name}-${label.color} `;
      });
      currentRow.push(labels.trim());
      currentRow.push(card.startAt ? moment(card.startAt).format() : ' ');
      currentRow.push(card.dueAt ? moment(card.dueAt).format() : ' ');
      currentRow.push(card.endAt ? moment(card.endAt).format() : ' ');
      currentRow.push(card.isOvertime ? 'true' : 'false');
      currentRow.push(card.spentTime);
      currentRow.push(card.createdAt ? moment(card.createdAt).format() : ' ');
      currentRow.push(card.modifiedAt ? moment(card.modifiedAt).format() : ' ');
      currentRow.push(
        card.dateLastActivity ? moment(card.dateLastActivity).format() : ' ',
      );
      if (card.vote && card.vote.question !== '') {
        let positiveVoters = '';
        let negativeVoters = '';
        card.vote.positive.forEach((userId) => {
          const user = result.users.find(({ _id }) => _id === userId);
          positiveVoters = `${positiveVoters + user.username} `;
        });
        card.vote.negative.forEach((userId) => {
          const user = result.users.find(({ _id }) => _id === userId);
          negativeVoters = `${negativeVoters + user.username} `;
        });
        const votingResult = `${
          card.vote.public
            ? `yes-${
                card.vote.positive.length
              }-${positiveVoters.trimRight()}-no-${
                card.vote.negative.length
              }-${negativeVoters.trimRight()}`
            : `yes-${card.vote.positive.length}-no-${card.vote.negative.length}`
        }`;
        currentRow.push(`${card.vote.question}-${votingResult}`);
      } else {
        currentRow.push(' ');
      }
      currentRow.push(card.archived ? 'true' : 'false');
      //Custom fields
      const customFieldValuesToPush = new Array(result.customFields.length);
      card.customFields.forEach((field) => {
        if (field.value !== null) {
          if (customFieldMap[field._id].type === 'date') {
            customFieldValuesToPush[customFieldMap[field._id].position] =
              moment(field.value).format();
          } else if (customFieldMap[field._id].type === 'dropdown') {
            const dropdownOptions = result.customFields.find(
              ({ _id }) => _id === field._id,
            ).settings.dropdownItems;
            const fieldValue = dropdownOptions.find(
              ({ _id }) => _id === field.value,
            ).name;
            customFieldValuesToPush[customFieldMap[field._id].position] =
              fieldValue;
          } else {
            customFieldValuesToPush[customFieldMap[field._id].position] =
              field.value;
          }
        }
      });
      for (
        let valueIndex = 0;
        valueIndex < customFieldValuesToPush.length;
        valueIndex++
      ) {
        if (!(valueIndex in customFieldValuesToPush)) {
          currentRow.push(' ');
        } else {
          currentRow.push(customFieldValuesToPush[valueIndex]);
        }
      }
      //cardRows.push([[currentRow]]);
      cardRows.push(currentRow);
    });

    return Papa.unparse(cardRows, papaconfig);
  }

  canExport(user) {
    const board = Boards.findOne(this._boardId);
    return board && board.isVisibleBy(user);
  }
}
