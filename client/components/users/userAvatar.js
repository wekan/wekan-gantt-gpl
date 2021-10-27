import Cards from '/models/cards';
import Avatars from '/models/avatars';
import Users from '/models/users';
import Org from '/models/org';
import Team from '/models/team';

Template.userAvatar.helpers({
  userData() {
    // We need to handle a special case for the search results provided by the
    // `matteodem:easy-search` package. Since these results gets published in a
    // separate collection, and not in the standard Meteor.Users collection as
    // expected, we use a component parameter ("property") to distinguish the
    // two cases.
    const userCollection = this.esSearch ? ESSearchResults : Users;
    return userCollection.findOne(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = Users.findOne(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  presenceStatusClassName() {
    const user = Users.findOne(this.userId);
    const userPresence = presences.findOne({ userId: this.userId });
    if (user && user.isInvitedTo(Session.get('currentBoard'))) return 'pending';
    else if (!userPresence) return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else return 'idle';
  },
});

Template.userAvatarInitials.helpers({
  initials() {
    const user = Users.findOne(this.userId);
    return user && user.getInitials();
  },

  viewPortWidth() {
    const user = Users.findOne(this.userId);
    return ((user && user.getInitials().length) || 1) * 12;
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
        'click .js-manage-board-removeOrg': Popup.open('removeBoardOrg'),
      },
    ];
  },
}).register('boardOrgRow');

Template.boardOrgRow.helpers({
  orgData() {
    const orgCollection = this.esSearch ? ESSearchResults : Org;
    return orgCollection.findOne(this.orgId);
  },
  currentUser(){
    return Meteor.user();
  },
});

Template.boardOrgName.helpers({
  orgName() {
    const org = Org.findOne(this.orgId);
    return org && org.orgDisplayName;
  },

  orgViewPortWidth() {
    const org = Org.findOne(this.orgId);
    return ((org && org.orgDisplayName.length) || 1) * 12;
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
        'click .js-manage-board-removeTeam': Popup.open('removeBoardTeam'),
      },
    ];
  },
}).register('boardTeamRow');

Template.boardTeamRow.helpers({
  teamData() {
    const teamCollection = this.esSearch ? ESSearchResults : Team;
    return teamCollection.findOne(this.teamId);
  },
  currentUser(){
    return Meteor.user();
  },
});

Template.boardTeamName.helpers({
  teamName() {
    const team = Team.findOne(this.teamId);
    return team && team.teamDisplayName;
  },

  teamViewPortWidth() {
    const team = Team.findOne(this.teamId);
    return ((team && team.teamDisplayName.length) || 1) * 12;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');

    Meteor.subscribe('my-avatars');
  },

  avatarUrlOptions() {
    return {
      auth: false,
      brokenIsFine: true,
    };
  },

  uploadedAvatars() {
    return Avatars.find({ userId: Meteor.userId() });
  },

  isSelected() {
    const userProfile = Meteor.user().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    const currentAvatarUrl = this.currentData().url(this.avatarUrlOptions());
    return avatarUrl === currentAvatarUrl;
  },

  noAvatarUrl() {
    const userProfile = Meteor.user().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    return !avatarUrl;
  },

  setAvatar(avatarUrl) {
    Meteor.user().setAvatarUrl(avatarUrl);
  },

  setError(error) {
    this.error.set(error);
  },

  events() {
    return [
      {
        'click .js-upload-avatar'() {
          this.$('.js-upload-avatar-input').click();
        },
        'change .js-upload-avatar-input'(event) {
          let file, fileUrl;

          FS.Utility.eachFile(event, f => {
            try {
              file = Avatars.insert(new FS.File(f));
              fileUrl = file.url(this.avatarUrlOptions());
            } catch (e) {
              this.setError('avatar-too-big');
            }
          });

          if (fileUrl) {
            this.setError('');
            const fetchAvatarInterval = window.setInterval(() => {
              $.ajax({
                url: fileUrl,
                success: () => {
                  this.setAvatar(file.url(this.avatarUrlOptions()));
                  window.clearInterval(fetchAvatarInterval);
                },
              });
            }, 100);
          }
        },
        'click .js-select-avatar'() {
          const avatarUrl = this.currentData().url(this.avatarUrlOptions());
          this.setAvatar(avatarUrl);
        },
        'click .js-select-initials'() {
          this.setAvatar('');
        },
        'click .js-delete-avatar'() {
          Avatars.remove(this.currentData()._id);
        },
      },
    ];
  },
}).register('changeAvatarPopup');

Template.cardMembersPopup.helpers({
  isCardMember() {
    const card = Template.parentData();
    const cardMembers = card.getMembers();

    return _.contains(cardMembers, this.userId);
  },

  user() {
    return Users.findOne(this.userId);
  },
});

Template.cardMembersPopup.events({
  'click .js-select-member'(event) {
    const card = Utils.getCurrentCard();
    const memberId = this.userId;
    card.toggleMember(memberId);
    event.preventDefault();
  },
});

Template.cardMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

Template.cardMemberPopup.events({
  'click .js-remove-member'() {
    Cards.findOne(this.cardId).unassignMember(this.userId);
    Popup.back();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});
