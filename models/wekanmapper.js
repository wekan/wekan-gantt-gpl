import { ReactiveCache } from '/imports/reactiveCache';

export function getMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member
  const membersToMap = data.members;
  const users = data.users;
  // auto-map based on username
  membersToMap.forEach(importedMember => {
    importedMember.id = importedMember.userId;
    delete importedMember.userId;
    const user = users.filter(user => {
      return user._id === importedMember.id;
    })[0];
    if (user.profile && user.profile.fullname) {
      importedMember.fullName = user.profile.fullname;
    }
    importedMember.username = user.username;
    const wekanUser = ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
  });
  return membersToMap;
}
