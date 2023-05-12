import fs from 'fs';
import path from 'path';
import { TAPi18n } from '/imports/i18n';
import AccountSettings from '../models/accountSettings';
import TableVisibilityModeSettings from '../models/tableVisibilityModeSettings';
import Actions from '../models/actions';
import Activities from '../models/activities';
import Announcements from '../models/announcements';
import Attachments from '../models/attachments';
import AttachmentsOld from '../models/attachments_old';
import Avatars from '../models/avatars';
import AvatarsOld from '../models/avatars_old';
import Boards from '../models/boards';
import CardComments from '../models/cardComments';
import Cards from '../models/cards';
import ChecklistItems from '../models/checklistItems';
import Checklists from '../models/checklists';
import CustomFields from '../models/customFields';
import Integrations from '../models/integrations';
import InvitationCodes from '../models/invitationCodes';
import Lists from '../models/lists';
import Rules from '../models/rules';
import Settings from '../models/settings';
import Swimlanes from '../models/swimlanes';
import Triggers from '../models/triggers';
import UnsavedEdits from '../models/unsavedEdits';
import Users from '../models/users';

// Anytime you change the schema of one of the collection in a non-backward
// compatible way you have to write a migration in this file using the following
// API:
//
//   Migrations.add(name, migrationCallback, optionalOrder);

// Note that we have extra migrations defined in `sandstorm.js` that are
// exclusive to Sandstorm and shouldn’t be executed in the general case.
// XXX I guess if we had ES6 modules we could
// `import { isSandstorm } from sandstorm.js` and define the migration here as
// well, but for now I want to avoid definied too many globals.

// In the context of migration functions we don't want to validate database
// mutation queries against the current (ie, latest) collection schema. Doing
// that would work at the time we write the migration but would break in the
// future when we'll update again the concerned collection schema.
//
// To prevent this bug we always have to disable the schema validation and
// argument transformations. We generally use the shorthandlers defined below.
const noValidate = {
  validate: false,
  filter: false,
  autoConvert: false,
  removeEmptyStrings: false,
  getAutoValues: false,
};
const noValidateMulti = { ...noValidate, multi: true };

Migrations.add('board-background-color', () => {
  const defaultColor = '#16A085';
  Boards.update(
    {
      background: {
        $exists: false,
      },
    },
    {
      $set: {
        background: {
          type: 'color',
          color: defaultColor,
        },
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-cardcounterlist-allowed', () => {
  Boards.update(
    {
      allowsCardCounterList: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsCardCounterList: true,
      },
    },
    noValidateMulti,
  );
});

/*
Migrations.add('add-boardmemberlist-allowed', () => {
  Boards.update(
    {
      allowsBoardMemberList: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsBoardMemberList: true,
      },
    },
    noValidateMulti,
  );
});
*/

Migrations.add('lowercase-board-permission', () => {
  ['Public', 'Private'].forEach(permission => {
    Boards.update(
      { permission },
      { $set: { permission: permission.toLowerCase() } },
      noValidateMulti,
    );
  });
});

/*
// Security migration: see https://github.com/wekan/wekan/issues/99
Migrations.add('change-attachments-type-for-non-images', () => {
  const newTypeForNonImage = 'application/octet-stream';
  Attachments.find().forEach(file => {
    if (!file.isImage()) {
      Attachments.update(
        file._id,
        {
          $set: {
            'original.type': newTypeForNonImage,
            'copies.attachments.type': newTypeForNonImage,
          },
        },
        noValidate,
      );
    }
  });
});

Migrations.add('card-covers', () => {
  Cards.find().forEach(card => {
    const cover = Attachments.findOne({ cardId: card._id, cover: true });
    if (cover) {
      Cards.update(card._id, { $set: { coverId: cover._id } }, noValidate);
    }
  });
  Attachments.update({}, { $unset: { cover: '' } }, noValidateMulti);
});

*/

Migrations.add('use-css-class-for-boards-colors', () => {
  const associationTable = {
    '#27AE60': 'nephritis',
    '#C0392B': 'pomegranate',
    '#2980B9': 'belize',
    '#8E44AD': 'wisteria',
    '#2C3E50': 'midnight',
    '#E67E22': 'pumpkin',
    '#CD5A91': 'moderatepink',
    '#00AECC': 'strongcyan',
    '#4BBF6B': 'limegreen',
    '#2C3E51': 'dark',
    '#27AE61': 'relax',
    '#568BA2': 'corteza',
    '#499BEA': 'clearblue',
    '#596557': 'natural',
    '#2A80B8': 'modern',
    '#2a2a2a': 'moderndark',
    '#222222': 'exodark',
  };
  Boards.find().forEach(board => {
    const oldBoardColor = board.background.color;
    const newBoardColor = associationTable[oldBoardColor];
    Boards.update(
      board._id,
      {
        $set: { color: newBoardColor },
        $unset: { background: '' },
      },
      noValidate,
    );
  });
});

Migrations.add('denormalize-star-number-per-board', () => {
  Boards.find().forEach(board => {
    const nStars = Users.find({ 'profile.starredBoards': board._id }).count();
    Boards.update(board._id, { $set: { stars: nStars } }, noValidate);
  });
});

// We want to keep a trace of former members so we can efficiently publish their
// infos in the general board publication.
Migrations.add('add-member-isactive-field', () => {
  Boards.find({}, { fields: { members: 1 } }).forEach(board => {
    const allUsersWithSomeActivity = _.chain(
      Activities.find(
        { boardId: board._id },
        { fields: { userId: 1 } },
      ).fetch(),
    )
      .pluck('userId')
      .uniq()
      .value();
    const currentUsers = _.pluck(board.members, 'userId');
    const formerUsers = _.difference(allUsersWithSomeActivity, currentUsers);

    const newMemberSet = [];
    board.members.forEach(member => {
      member.isActive = true;
      newMemberSet.push(member);
    });
    formerUsers.forEach(userId => {
      newMemberSet.push({
        userId,
        isAdmin: false,
        isActive: false,
      });
    });
    Boards.update(board._id, { $set: { members: newMemberSet } }, noValidate);
  });
});

Migrations.add('add-sort-checklists', () => {
  Checklists.find().forEach((checklist, index) => {
    if (!checklist.hasOwnProperty('sort')) {
      Checklists.direct.update(
        checklist._id,
        { $set: { sort: index } },
        noValidate,
      );
    }
    checklist.items.forEach((item, index) => {
      if (!item.hasOwnProperty('sort')) {
        Checklists.direct.update(
          { _id: checklist._id, 'items._id': item._id },
          { $set: { 'items.$.sort': index } },
          noValidate,
        );
      }
    });
  });
});

Migrations.add('add-swimlanes', () => {
  Boards.find().forEach(board => {
    const swimlaneId = board.getDefaultSwimline()._id;
    Cards.find({ boardId: board._id }).forEach(card => {
      if (!card.hasOwnProperty('swimlaneId')) {
        Cards.direct.update(
          { _id: card._id },
          { $set: { swimlaneId } },
          noValidate,
        );
      }
    });
  });
});

Migrations.add('add-views', () => {
  Boards.find().forEach(board => {
    if (!board.hasOwnProperty('view')) {
      Boards.direct.update(
        { _id: board._id },
        { $set: { view: 'board-view-swimlanes' } },
        noValidate,
      );
    }
  });
});

Migrations.add('add-checklist-items', () => {
  Checklists.find().forEach(checklist => {
    // Create new items
    _.sortBy(checklist.items, 'sort').forEach((item, index) => {
      ChecklistItems.direct.insert({
        title: item.title ? item.title : 'Checklist',
        sort: index,
        isFinished: item.isFinished,
        checklistId: checklist._id,
        cardId: checklist.cardId,
      });
    });

    // Delete old ones
    Checklists.direct.update(
      { _id: checklist._id },
      { $unset: { items: 1 } },
      noValidate,
    );
  });
});

Migrations.add('add-card-types', () => {
  Cards.find().forEach(card => {
    Cards.direct.update(
      { _id: card._id },
      {
        $set: {
          type: 'cardType-card',
          linkedId: null,
        },
      },
      noValidate,
    );
  });
});

Migrations.add('add-custom-fields-to-cards', () => {
  Cards.update(
    {
      customFields: {
        $exists: false,
      },
    },
    {
      $set: {
        customFields: [],
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-requester-field', () => {
  Cards.update(
    {
      requestedBy: {
        $exists: false,
      },
    },
    {
      $set: {
        requestedBy: '',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-assigner-field', () => {
  Cards.update(
    {
      assignedBy: {
        $exists: false,
      },
    },
    {
      $set: {
        assignedBy: '',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-parent-field-to-cards', () => {
  Cards.update(
    {
      parentId: {
        $exists: false,
      },
    },
    {
      $set: {
        parentId: '',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-subtasks-boards', () => {
  Boards.update(
    {
      subtasksDefaultBoardId: {
        $exists: false,
      },
    },
    {
      $set: {
        subtasksDefaultBoardId: null,
        subtasksDefaultListId: null,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-subtasks-sort', () => {
  Boards.update(
    {
      subtaskSort: {
        $exists: false,
      },
    },
    {
      $set: {
        subtaskSort: -1,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-subtasks-allowed', () => {
  Boards.update(
    {
      allowsSubtasks: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsSubtasks: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-subtasks-allowed', () => {
  Boards.update(
    {
      presentParentTask: {
        $exists: false,
      },
    },
    {
      $set: {
        presentParentTask: 'no-parent',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-authenticationMethod', () => {
  Users.update(
    {
      authenticationMethod: {
        $exists: false,
      },
    },
    {
      $set: {
        authenticationMethod: 'password',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('remove-tag', () => {
  Users.update(
    {},
    {
      $unset: {
        'profile.tags': 1,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('remove-customFields-references-broken', () => {
  Cards.update(
    { 'customFields.$value': null },
    {
      $pull: {
        customFields: { value: null },
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-product-name', () => {
  Settings.update(
    {
      productName: {
        $exists: false,
      },
    },
    {
      $set: {
        productName: '',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-hide-logo', () => {
  Settings.update(
    {
      hideLogo: {
        $exists: false,
      },
    },
    {
      $set: {
        hideLogo: false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-hide-card-counter-list', () => {
  Settings.update(
    {
      hideCardCounterList: {
        $exists: false,
      },
    },
    {
      $set: {
        hideCardCounterList: false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-hide-board-member-list', () => {
  Settings.update(
    {
      hideBoardMemberList: {
        $exists: false,
      },
    },
    {
      $set: {
        hideBoardMemberList: false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-displayAuthenticationMethod', () => {
  Settings.update(
    {
      displayAuthenticationMethod: {
        $exists: false,
      },
    },
    {
      $set: {
        displayAuthenticationMethod: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-defaultAuthenticationMethod', () => {
  Settings.update(
    {
      defaultAuthenticationMethod: {
        $exists: false,
      },
    },
    {
      $set: {
        defaultAuthenticationMethod: 'password',
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-templates', () => {
  Boards.update(
    {
      type: {
        $exists: false,
      },
    },
    {
      $set: {
        type: 'board',
      },
    },
    noValidateMulti,
  );
  Swimlanes.update(
    {
      type: {
        $exists: false,
      },
    },
    {
      $set: {
        type: 'swimlane',
      },
    },
    noValidateMulti,
  );
  Lists.update(
    {
      type: {
        $exists: false,
      },
      swimlaneId: {
        $exists: false,
      },
    },
    {
      $set: {
        type: 'list',
        swimlaneId: '',
      },
    },
    noValidateMulti,
  );
  Users.find({
    'profile.templatesBoardId': {
      $exists: false,
    },
  }).forEach(user => {
    // Create board and swimlanes
    Boards.insert(
      {
        title: TAPi18n.__('templates'),
        permission: 'private',
        type: 'template-container',
        members: [
          {
            userId: user._id,
            isAdmin: true,
            isActive: true,
            isNoComments: false,
            isCommentOnly: false,
          },
        ],
      },
      (err, boardId) => {
        // Insert the reference to our templates board
        Users.update(user._id, {
          $set: { 'profile.templatesBoardId': boardId },
        });

        // Insert the card templates swimlane
        Swimlanes.insert(
          {
            title: TAPi18n.__('card-templates-swimlane'),
            boardId,
            sort: 1,
            type: 'template-container',
          },
          (err, swimlaneId) => {
            // Insert the reference to out card templates swimlane
            Users.update(user._id, {
              $set: { 'profile.cardTemplatesSwimlaneId': swimlaneId },
            });
          },
        );

        // Insert the list templates swimlane
        Swimlanes.insert(
          {
            title: TAPi18n.__('list-templates-swimlane'),
            boardId,
            sort: 2,
            type: 'template-container',
          },
          (err, swimlaneId) => {
            // Insert the reference to out list templates swimlane
            Users.update(user._id, {
              $set: { 'profile.listTemplatesSwimlaneId': swimlaneId },
            });
          },
        );

        // Insert the board templates swimlane
        Swimlanes.insert(
          {
            title: TAPi18n.__('board-templates-swimlane'),
            boardId,
            sort: 3,
            type: 'template-container',
          },
          (err, swimlaneId) => {
            // Insert the reference to out board templates swimlane
            Users.update(user._id, {
              $set: { 'profile.boardTemplatesSwimlaneId': swimlaneId },
            });
          },
        );
      },
    );
  });
});

Migrations.add('fix-circular-reference_', () => {
  Cards.find().forEach(card => {
    if (card.parentId === card._id) {
      Cards.update(card._id, { $set: { parentId: '' } }, noValidateMulti);
    }
  });
});

Migrations.add('mutate-boardIds-in-customfields', () => {
  CustomFields.find().forEach(cf => {
    CustomFields.update(
      cf,
      {
        $set: {
          boardIds: [cf.boardId],
        },
        $unset: {
          boardId: '',
        },
      },
      noValidateMulti,
    );
  });
});

const modifiedAtTables = [
  AccountSettings,
  TableVisibilityModeSettings,
  Actions,
  Activities,
  Announcements,
  Boards,
  CardComments,
  Cards,
  ChecklistItems,
  Checklists,
  CustomFields,
  Integrations,
  InvitationCodes,
  Lists,
  Rules,
  Settings,
  Swimlanes,
  Triggers,
  UnsavedEdits,
  Users,
];

Migrations.add('add-missing-created-and-modified', () => {
  Promise.all(
    modifiedAtTables.map(db =>
      db
        .rawCollection()
        .updateMany(
          { modifiedAt: { $exists: false } },
          { $set: { modifiedAt: new Date() } },
          { multi: true },
        )
        .then(() =>
          db
            .rawCollection()
            .updateMany(
              { createdAt: { $exists: false } },
              { $set: { createdAt: new Date() } },
              { multi: true },
            ),
        ),
    ),
  )
    .then(() => {
      // eslint-disable-next-line no-console
      console.info('Successfully added createdAt and updatedAt to all tables');
    })
    .catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
    });
});

Migrations.add('fix-incorrect-dates', () => {
  const tables = [
    AccountSettings,
    TableVisibilityModeSettings,
    Actions,
    Activities,
    Announcements,
    Boards,
    CardComments,
    Cards,
    ChecklistItems,
    Checklists,
    CustomFields,
    Integrations,
    InvitationCodes,
    Lists,
    Rules,
    Settings,
    Swimlanes,
    Triggers,
    UnsavedEdits,
  ];

  // Dates were previously created with Date.now() which is a number, not a date
  tables.forEach(t =>
    t
      .rawCollection()
      .find({ $or: [{ createdAt: { $type: 1 } }, { updatedAt: { $type: 1 } }] })
      .forEach(({ _id, createdAt, updatedAt }) => {
        t.rawCollection().updateMany(
          { _id },
          {
            $set: {
              createdAt: new Date(createdAt),
              updatedAt: new Date(updatedAt),
            },
          },
        );
      }),
  );
});

Migrations.add('add-assignee', () => {
  Cards.update(
    {
      assignees: {
        $exists: false,
      },
    },
    {
      $set: {
        assignees: [],
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-profile-showDesktopDragHandles', () => {
  Users.update(
    {
      'profile.showDesktopDragHandles': {
        $exists: false,
      },
    },
    {
      $set: {
        'profile.showDesktopDragHandles': false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-profile-hiddenMinicardLabelText', () => {
  Users.update(
    {
      'profile.hiddenMinicardLabelText': {
        $exists: false,
      },
    },
    {
      $set: {
        'profile.hiddenMinicardLabelText': false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-receiveddate-allowed', () => {
  Boards.update(
    {
      allowsReceivedDate: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsReceivedDate: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-startdate-allowed', () => {
  Boards.update(
    {
      allowsStartDate: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsStartDate: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-duedate-allowed', () => {
  Boards.update(
    {
      allowsDueDate: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsDueDate: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-enddate-allowed', () => {
  Boards.update(
    {
      allowsEndDate: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsEndDate: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-members-allowed', () => {
  Boards.update(
    {
      allowsMembers: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsMembers: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-assignee-allowed', () => {
  Boards.update(
    {
      allowsAssignee: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsAssignee: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-labels-allowed', () => {
  Boards.update(
    {
      allowsLabels: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsLabels: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-checklists-allowed', () => {
  Boards.update(
    {
      allowsChecklists: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsChecklists: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-attachments-allowed', () => {
  Boards.update(
    {
      allowsAttachments: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsAttachments: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-comments-allowed', () => {
  Boards.update(
    {
      allowsComments: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsComments: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-assigned-by-allowed', () => {
  Boards.update(
    {
      allowsAssignedBy: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsAssignedBy: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-requested-by-allowed', () => {
  Boards.update(
    {
      allowsRequestedBy: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsRequestedBy: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-activities-allowed', () => {
  Boards.update(
    {
      allowsActivities: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsActivities: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-description-title-allowed', () => {
  Boards.update(
    {
      allowsDescriptionTitle: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsDescriptionTitle: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-description-text-allowed', () => {
  Boards.update(
    {
      allowsDescriptionText: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsDescriptionText: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-description-text-allowed-on-minicard', () => {
  Boards.update(
    {
      allowsDescriptionTextOnMinicard: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsDescriptionTextOnMinicard: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-sort-field-to-boards', () => {
  Boards.find().forEach((board, index) => {
    if (!board.hasOwnProperty('sort')) {
      Boards.direct.update(board._id, { $set: { sort: index } }, noValidate);
    }
  });
});

Migrations.add('add-default-profile-view', () => {
  Users.find().forEach(user => {
    if (!user.hasOwnProperty('profile.boardView')) {
      // Set default view
      Users.direct.update(
        { _id: user._id },
        { $set: { 'profile.boardView': 'board-view-swimlanes' } },
        noValidate,
      );
    }
  });
});

Migrations.add('add-hide-logo-by-default', () => {
  Settings.update(
    {
      hideLogo: {
        hideLogo: false,
      },
    },
    {
      $set: {
        hideLogo: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-hide-card-counter-list-by-default', () => {
  Settings.update(
    {
      hideCardCounterList: {
        hideCardCounterList: false,
      },
    },
    {
      $set: {
        hideCardCounterList: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-hide-board-member-list-by-default', () => {
  Settings.update(
    {
      hideBoardMemberList: {
        hideBoardMember: false,
      },
    },
    {
      $set: {
        hideBoardMemberList: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('add-card-number-allowed', () => {
  Boards.update(
    {
      allowsCardNumber: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsCardNumber: false,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('assign-boardwise-card-numbers', () => {
  Boards.find().forEach(board => {
    let nextCardNumber = board.getNextCardNumber();
    Cards.find(
      {
        boardId: board._id,
        cardNumber: {
          $exists: false
        }
      },
      {
        sort: { createdAt: 1 }
      }
    ).forEach(card => {
      Cards.update(
        card._id,
        { $set: { cardNumber: nextCardNumber } },
        noValidate);
      nextCardNumber++;
    });
  })
});

Migrations.add('add-card-details-show-lists', () => {
  Boards.update(
    {
      allowsShowLists: {
        $exists: false,
      },
    },
    {
      $set: {
        allowsShowLists: true,
      },
    },
    noValidateMulti,
  );
});

Migrations.add('migrate-attachments-collectionFS-to-ostrioFiles', () => {
  Meteor.settings.public.ostrioFilesMigrationInProgress = "true";
  AttachmentsOld.find().forEach(function(fileObj) {
    const newFileName = fileObj.name();
    const storagePath = Attachments.storagePath({});
    // OLD:
    // const filePath = path.join(storagePath, `${fileObj._id}-${newFileName}`);
    // NEW: Save file only with filename of ObjectID, not including filename.
    // Fixes https://github.com/wekan/wekan/issues/4416#issuecomment-1510517168
    //const filePath = path.join(storagePath, `${fileObj._id}`);
    const filePath = path.join(storagePath, `${fileObj._id}-${newFileName}`);

    // This is "example" variable, change it to the userId that you might be using.
    const userId = fileObj.userId;

    const fileType = fileObj.type();
    const fileSize = fileObj.size();
    const fileId = fileObj._id;

    const readStream = fileObj.createReadStream('attachments');
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', function(err) {
      console.log('Writing error: ', err, filePath);
    });

    // Once we have a file, then upload it to our new data storage
    readStream.on('end', () => {
      console.log('Ended: ', filePath);
      // UserFiles is the new Meteor-Files/FilesCollection collection instance

      Attachments.addFile(
        filePath,
        {
          fileName: newFileName,
          type: fileType,
          meta: {
            boardId: fileObj.boardId,
            cardId: fileObj.cardId,
            listId: fileObj.listId,
            swimlaneId: fileObj.swimlaneId,
            uploadedBeforeMigration: fileObj.uploadedAt,
            migrationTime: new Date(),
            copies: fileObj.copies,
            source: 'import'
          },
          userId,
          size: fileSize,
          fileId,
        },
        (err, fileRef) => {
          if (err) {
            console.log(err);
          } else {
            console.log('File Inserted: ', fileRef._id);
            // Set the userId again
            Attachments.update({ _id: fileRef._id }, { $set: { userId } });
            fileObj.remove();
          }
        },
        true,
      ); // proceedAfterUpload
    });

    readStream.on('error', error => {
      console.log('Error: ', filePath, error);
    });

    readStream.pipe(writeStream);
  });
  Meteor.settings.public.ostrioFilesMigrationInProgress = "false";
});

Migrations.add('migrate-avatars-collectionFS-to-ostrioFiles', () => {
  Meteor.settings.public.ostrioFilesMigrationInProgress = "true";
  AvatarsOld.find().forEach(function(fileObj) {
    const newFileName = fileObj.name();
    const storagePath = Avatars.storagePath({});
    // OLD:
    // const filePath = path.join(storagePath, `${fileObj._id}-${newFileName}`);
    // NEW: Save file only with filename of ObjectID, not including filename.
    // Fixes https://github.com/wekan/wekan/issues/4416#issuecomment-1510517168
    //const filePath = path.join(storagePath, `${fileObj._id}`);
    const filePath = path.join(storagePath, `${fileObj._id}-${newFileName}`);

    // This is "example" variable, change it to the userId that you might be using.
    const userId = fileObj.userId;

    const fileType = fileObj.type();
    const fileSize = fileObj.size();
    const fileId = fileObj._id;

    const readStream = fileObj.createReadStream('avatars');
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', function(err) {
      console.log('Writing error: ', err, filePath);
    });

    // Once we have a file, then upload it to our new data storage
    readStream.on('end', () => {
      console.log('Ended: ', filePath);
      // UserFiles is the new Meteor-Files/FilesCollection collection instance

      Avatars.addFile(
        filePath,
        {
          fileName: newFileName,
          type: fileType,
          meta: {
            boardId: fileObj.boardId,
            cardId: fileObj.cardId,
            listId: fileObj.listId,
            swimlaneId: fileObj.swimlaneId,
          },
          userId,
          size: fileSize,
          fileId,
        },
        (err, fileRef) => {
          if (err) {
            console.log(err);
          } else {
            console.log('File Inserted: ', newFileName, fileRef._id);
            // Set the userId again
            Avatars.update({ _id: fileRef._id }, { $set: { userId } });
            Users.find().forEach(user => {
              const old_url = fileObj.url();
              new_url = Avatars.findOne({ _id: fileRef._id }).link(
                'original',
                '/',
              );
              if (user.profile.avatarUrl !== undefined) {
                if (user.profile.avatarUrl.startsWith(old_url)) {
                  // Set avatar url to new url
                  Users.direct.update(
                    { _id: user._id },
                    { $set: { 'profile.avatarUrl': new_url } },
                    noValidate,
                  );
                  console.log('User avatar updated: ', user._id, new_url);
                }
              }
            });
            fileObj.remove();
          }
        },
        true, // proceedAfterUpload
      );
    });

    readStream.on('error', error => {
      console.log('Error: ', filePath, error);
    });

    readStream.pipe(writeStream);
  });
  Meteor.settings.public.ostrioFilesMigrationInProgress = "false";
});

Migrations.add('migrate-attachment-drop-index-cardId', () => {
  try {
    Attachments.collection._dropIndex({'cardId': 1});
  } catch (error) {
  }
});

Migrations.add('migrate-attachment-migration-fix-source-import', () => {
  // there was an error at first versions, so source was import, instead of import
  Attachments.update(
    {"meta.source":"import,"},
    {$set:{"meta.source":"import"}},
    noValidateMulti
  );
});
