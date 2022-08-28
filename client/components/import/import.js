import { trelloGetMembersToMap } from './trelloMembersMapper';
import { wekanGetMembersToMap } from './wekanMembersMapper';
import { csvGetMembersToMap } from './csvMembersMapper';

const Papa = require('papaparse');

BlazeComponent.extendComponent({
  title() {
    return `import-board-title-${Session.get('importSource')}`;
  },
}).register('importHeaderBar');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.steps = ['importTextarea', 'importMapMembers'];
    this._currentStepIndex = new ReactiveVar(0);
    this.importedData = new ReactiveVar();
    this.membersToMap = new ReactiveVar([]);
    this.importSource = Session.get('importSource');
  },

  currentTemplate() {
    return this.steps[this._currentStepIndex.get()];
  },

  nextStep() {
    const nextStepIndex = this._currentStepIndex.get() + 1;
    if (nextStepIndex >= this.steps.length) {
      this.finishImport();
    } else {
      this._currentStepIndex.set(nextStepIndex);
    }
  },

  importData(evt, dataSource) {
    evt.preventDefault();
    const input = this.find('.js-import-json').value;
    if (dataSource === 'csv') {
      const csv = input.indexOf('\t') > 0 ? input.replace(/(\t)/g, ',') : input;
      const ret = Papa.parse(csv);
      if (ret && ret.data && ret.data.length) this.importedData.set(ret.data);
      else throw new Meteor.Error('error-csv-schema');
      const membersToMap = this._prepareAdditionalData(ret.data);
      this.membersToMap.set(membersToMap);
      this.nextStep();
    } else {
      try {
        const dataObject = JSON.parse(input);
        this.setError('');
        this.importedData.set(dataObject);
        const membersToMap = this._prepareAdditionalData(dataObject);
        // store members data and mapping in Session
        // (we go deep and 2-way, so storing in data context is not a viable option)
        this.membersToMap.set(membersToMap);
        this.nextStep();
      } catch (e) {
        this.setError('error-json-malformed');
      }
    }
  },

  setError(error) {
    this.error.set(error);
  },

  finishImport() {
    const additionalData = {};
    const membersMapping = this.membersToMap.get();
    if (membersMapping) {
      const mappingById = {};
      membersMapping.forEach(member => {
        if (member.wekanId) {
          mappingById[member.id] = member.wekanId;
        }
      });
      additionalData.membersMapping = mappingById;
    }
    this.membersToMap.set([]);
    Meteor.call(
      'importBoard',
      this.importedData.get(),
      additionalData,
      this.importSource,
      Session.get('fromBoard'),
      (err, res) => {
        if (err) {
          this.setError(err.error);
        } else {
          let title = getSlug(this.importedData.get().title) || 'imported-board';
          Session.set('fromBoard', null);
          FlowRouter.go('board', {
            id: res,
            slug: title,
          })
          //Utils.goBoardId(res);
        }
      },
    );
  },

  _prepareAdditionalData(dataObject) {
    const importSource = Session.get('importSource');
    let membersToMap;
    switch (importSource) {
      case 'trello':
        membersToMap = trelloGetMembersToMap(dataObject);
        break;
      case 'wekan':
        membersToMap = wekanGetMembersToMap(dataObject);
        break;
      case 'csv':
        membersToMap = csvGetMembersToMap(dataObject);
        break;
    }
    return membersToMap;
  },

  _screenAdditionalData() {
    return 'mapMembers';
  },
}).register('import');

BlazeComponent.extendComponent({
  template() {
    return 'importTextarea';
  },

  instruction() {
    return `import-board-instruction-${Session.get('importSource')}`;
  },

  importPlaceHolder() {
    const importSource = Session.get('importSource');
    if (importSource === 'csv') {
      return 'import-csv-placeholder';
    } else {
      return 'import-json-placeholder';
    }
  },

  events() {
    return [
      {
        submit(evt) {
          return this.parentComponent().importData(
            evt,
            Session.get('importSource'),
          );
        },
      },
    ];
  },
}).register('importTextarea');

BlazeComponent.extendComponent({
  onCreated() {
    this.usersLoaded = new ReactiveVar(false);

    this.autorun(() => {
      const handle = this.subscribe(
        'user-miniprofile',
        this.members().map(member => {
          return member.username;
        }),
      );
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          if (
            handle.ready() &&
            !this.usersLoaded.get() &&
            this.members().length
          ) {
            this._refreshMembers(
              this.members().map(member => {
                if (!member.wekanId) {
                  let user = Users.findOne({ username: member.username });
                  if (!user) {
                    user = Users.findOne({ importUsernames: member.username });
                  }
                  if (user) {
                    // eslint-disable-next-line no-console
                    // console.log('found username:', user.username);
                    member.wekanId = user._id;
                  }
                }
                return member;
              }),
            );
          }
          this.usersLoaded.set(handle.ready());
        });
      });
    });
  },

  members() {
    return this.parentComponent().membersToMap.get();
  },

  _refreshMembers(listOfMembers) {
    return this.parentComponent().membersToMap.set(listOfMembers);
  },

  /**
   * Will look into the list of members to import for the specified memberId,
   * then set its property to the supplied value.
   * If unset is true, it will remove the property from the rest of the list as well.
   *
   * use:
   * - memberId = null to use selected member
   * - value = null to unset a property
   * - unset = true to ensure property is only set on 1 member at a time
   */
  _setPropertyForMember(property, value, memberId, unset = false) {
    const listOfMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = member => member.id === memberId;
    } else {
      finder = member => member.selected;
    }
    listOfMembers.forEach(member => {
      if (finder(member)) {
        if (value !== null) {
          member[property] = value;
        } else {
          delete member[property];
        }
        if (!unset) {
          // we shortcut if we don't care about unsetting the others
          return false;
        }
      } else if (unset) {
        delete member[property];
      }
      return true;
    });
    // Session.get gives us a copy, we have to set it back so it sticks
    this._refreshMembers(listOfMembers);
  },

  setSelectedMember(memberId) {
    return this._setPropertyForMember('selected', true, memberId, true);
  },

  /**
   * returns the member with specified id,
   * or the selected member if memberId is not specified
   */
  getMember(memberId = null) {
    const allMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = user => user.id === memberId;
    } else {
      finder = user => user.selected;
    }
    return allMembers.find(finder);
  },

  mapSelectedMember(wekanId) {
    return this._setPropertyForMember('wekanId', wekanId, null);
  },

  unmapMember(memberId) {
    return this._setPropertyForMember('wekanId', null, memberId);
  },

  onSubmit(evt) {
    evt.preventDefault();
    this.parentComponent().nextStep();
  },

  events() {
    return [
      {
        submit: this.onSubmit,
        'click .js-select-member'(evt) {
          const memberToMap = this.currentData();
          if (memberToMap.wekan) {
            // todo xxx ask for confirmation?
            this.unmapMember(memberToMap.id);
          } else {
            this.setSelectedMember(memberToMap.id);
            Popup.open('importMapMembersAdd')(evt);
          }
        },
      },
    ];
  },
}).register('importMapMembers');

BlazeComponent.extendComponent({
  onRendered() {
    this.find('.js-map-member input').focus();
  },

  onSelectUser() {
    Popup.getOpenerComponent(5).mapSelectedMember(this.currentData().__originalId);
    Popup.back();
  },

  events() {
    return [
      {
        'click .js-select-import': this.onSelectUser,
      },
    ];
  },
}).register('importMapMembersAddPopup');

Template.importMapMembersAddPopup.helpers({
  searchIndex: () => UserSearchIndex,
})
