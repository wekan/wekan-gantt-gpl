const subManager = new SubsManager();

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'submit .js-list-filter'(evt) {
          evt.preventDefault();
          Filter.lists.set(this.find('.js-list-filter input').value.trim());
        },
        'change .js-field-card-filter'(evt) {
          evt.preventDefault();
          Filter.title.set(this.find('.js-field-card-filter').value.trim());
          Filter.resetExceptions();
        },
        'click .js-toggle-label-filter'(evt) {
          evt.preventDefault();
          Filter.labelIds.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-member-filter'(evt) {
          evt.preventDefault();
          Filter.members.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-assignee-filter'(evt) {
          evt.preventDefault();
          Filter.assignees.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-no-due-date-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.noDate();
          Filter.resetExceptions();
        },
        'click .js-toggle-overdue-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.past();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-today-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.today();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-tomorrow-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.tomorrow();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-this-week-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.thisWeek();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-next-week-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.nextWeek();
          Filter.resetExceptions();
        },
        'click .js-toggle-archive-filter'(evt) {
          evt.preventDefault();
          Filter.archive.toggle(this.currentData()._id);
          Filter.resetExceptions();
          const currentBoardId = Session.get('currentBoard');
          if (!currentBoardId) return;
          subManager.subscribe(
            'board',
            currentBoardId,
            Filter.archive.isSelected(),
          );
        },
        'click .js-toggle-hideEmpty-filter'(evt) {
          evt.preventDefault();
          Filter.hideEmpty.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-custom-fields-filter'(evt) {
          evt.preventDefault();
          Filter.customFields.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'change .js-field-advanced-filter'(evt) {
          evt.preventDefault();
          Filter.advanced.set(
            this.find('.js-field-advanced-filter').value.trim(),
          );
          Filter.resetExceptions();
        },
        'click .js-clear-all'(evt) {
          evt.preventDefault();
          Filter.reset();
        },
        'click .js-filter-to-selection'(evt) {
          evt.preventDefault();
          const selectedCards = Cards.find(Filter.mongoSelector()).map(c => {
            return c._id;
          });
          MultiSelection.add(selectedCards);
        },
      },
    ];
  },
}).register('filterSidebar');

function mutateSelectedCards(mutationName, ...args) {
  Cards.find(MultiSelection.getMongoSelector(), {sort: ['sort']}).forEach(card => {
    card[mutationName](...args);
  });
}

BlazeComponent.extendComponent({
  mapSelection(kind, _id) {
    return Cards.find(MultiSelection.getMongoSelector(), {sort: ['sort']}).map(card => {
      const methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
      return card[methodName](_id);
    });
  },

  allSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return _.every(this.mapSelection(kind, _id));
  },

  someSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return _.some(this.mapSelection(kind, _id));
  },

  events() {
    return [
      {
        'click .js-toggle-label-multiselection'(evt) {
          const labelId = this.currentData()._id;
          const mappedSelection = this.mapSelection('label', labelId);

          if (_.every(mappedSelection)) {
            mutateSelectedCards('removeLabel', labelId);
          } else if (_.every(mappedSelection, bool => !bool)) {
            mutateSelectedCards('addLabel', labelId);
          } else {
            const popup = Popup.open('disambiguateMultiLabel');
            // XXX We need to have a better integration between the popup and the
            // UI components systems.
            popup.call(this.currentData(), evt);
          }
        },
        'click .js-toggle-member-multiselection'(evt) {
          const memberId = this.currentData()._id;
          const mappedSelection = this.mapSelection('member', memberId);
          if (_.every(mappedSelection)) {
            mutateSelectedCards('unassignMember', memberId);
          } else if (_.every(mappedSelection, bool => !bool)) {
            mutateSelectedCards('assignMember', memberId);
          } else {
            const popup = Popup.open('disambiguateMultiMember');
            // XXX We need to have a better integration between the popup and the
            // UI components systems.
            popup.call(this.currentData(), evt);
          }
        },
        'click .js-move-selection': Popup.open('moveSelection'),
        'click .js-archive-selection'() {
          mutateSelectedCards('archive');
          EscapeActions.executeUpTo('multiselection');
        },
      },
    ];
  },
}).register('multiselectionSidebar');

Template.multiselectionSidebar.helpers({
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  isCommentOnly() {
    return Meteor.user().isCommentOnly();
  },
});

Template.disambiguateMultiLabelPopup.events({
  'click .js-remove-label'() {
    mutateSelectedCards('removeLabel', this._id);
    Popup.back();
  },
  'click .js-add-label'() {
    mutateSelectedCards('addLabel', this._id);
    Popup.back();
  },
});

Template.disambiguateMultiMemberPopup.events({
  'click .js-unassign-member'() {
    mutateSelectedCards('assignMember', this._id);
    Popup.back();
  },
  'click .js-assign-member'() {
    mutateSelectedCards('unassignMember', this._id);
    Popup.back();
  },
});

Template.moveSelectionPopup.events({
  'click .js-select-list'() {
    // Move the minicard to the end of the target list
    mutateSelectedCards('moveToEndOfList', { listId: this._id });
    EscapeActions.executeUpTo('multiselection');
  },
});
