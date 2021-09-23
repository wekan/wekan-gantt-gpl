import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

BlazeComponent.extendComponent({
  isGanttInitialized: false,

  onCreated() {
    //Meteor.subscribe("cards");
  },

  onRendered() {
    if (this.isGanttInitialized) {
      return;
    }

    this.isGanttInitialized = true;

    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const currentUser = Meteor.user();
    const boards = Boards.find({
      'members.userId': currentUser._id,
      type: 'board',
    });

    //Tooltips
    gantt.plugins({
      tooltip: true,
    });

    gantt.templates.tooltip_text = function(start, end, task) {
      return `<b>${TAPi18n.__('task')}:</b> ${task.text}<br/><b>${TAPi18n.__(
        'description',
      )}:</b> ${task.description}`;
    };

    gantt.init('ganttEl');

    // Retain links created between tasks
    // https://github.com/wekan/wekan/issues/2870#issuecomment-857115753
    // Code part 3: Adding this to gantt.js which will fire during the events specified.
    // https://github.com/wekan/wekan/issues/2870#issuecomment-857171127
    gantt.attachEvent("onLinkCreated", function(link){
      const c = Cards.findOne(link.source);
      var sourceTask = gantt.getTask(link.source);
      var targetTask = gantt.getTask(link.target);

      c.setGanttTargetId(sourceTask.id, targetTask.id, link.type, link.id);
      return true;
    });

    gantt.attachEvent("onBeforeLinkDelete", function(id,item){
      const c = Cards.findOne(item.source);

      c.removeGanttTargetId(item.source, item.target, item.type, id)
      return true;
    });

    //Clicking on task will show the card
    gantt.attachEvent('onTaskClick', function(id, e) {
      const path = FlowRouter.current();
      e.cancelBubble = true;

      FlowRouter.go('card', {
        boardId: path.params.id,
        slug: path.params.slug,
        cardId: id,
      });
      return e;
    });

    //Update start/end date
    gantt.attachEvent('onAfterTaskUpdate', function(id, item) {
      const c = Cards.findOne(id);
      if (c) {
        c.setStart(item.start_date);
        c.setEnd(item.end_date);
      }
    });

    //Delete task
    gantt.attachEvent('onAfterTaskDelete', function(id) {
      Cards.remove(id);
    });

    //Suppress doubleclicks
    gantt.attachEvent('onTaskDblClick', function(id, e) {
      e.cancelBubble = true;
      return e;
    });

    gantt.attachEvent('onTaskCreated', function(item) {
      let html = `<label>${TAPi18n.__('select-board')}</label>`;
      html += '<select style="width:100%;">';
      boards.forEach(b => {
        html += `<option value="${b._id}">${b.title}</option>`;
      });
      html += '</select>';

      const modal = gantt.modalbox({
        title: `${TAPi18n.__('create-task')}`,
        text: html,
        buttons: [`${TAPi18n.__('ok')}`, `${TAPi18n.__('cancel')}`],
        callback(result) {
          if (result !== 0) {
            return;
          }

          const bId = $(modal)
            .find('select')
            .val();
          let board = null;

          boards.forEach(b => {
            if (b._id === bId) {
              board = b;
            }
          });

          if (!board) {
            return;
          }

          const swimlaneId = board.getDefaultSwimline()._id;
          const lists = board.lists().fetch();
          let listId;
          if (lists.length > 0) {
            listId = lists[0]._id;
          } else {
            listId = Lists.insert({
              title: 'List',
              boardId: board._id,
              sort: 0,
              type: 'list',
              swimlaneId,
            });
          }
          const startDate = new Date();
          let endDate = new Date(startDate.getTime());
          endDate = endDate.setDate(endDate.getDate() + item.duration);
          const cardId = Cards.insert({
            title: item.text,
            members: [],
            labelIds: [],
            listId,
            startAt: startDate,
            endAt: endDate,
            boardId: board._id,
            sort: 1,
            swimlaneId,
            type: 'cardType-card',
            linkedId: '',
          });

          Meteor.setTimeout(() => {
            FlowRouter.go('card', {
              boardId: board._id,
              slug: board.slug,
              cardId,
            });
          }, 50);
        },
      });
    });

    this.autorun(() => {
      const events = [];
      // https://github.com/wekan/wekan/issues/2870#issuecomment-857171127 part 4
      const LinksDate = [];
      currentBoard.cards().forEach(c => {
        if (!c.startAt || !c.endAt) {
          return;
        }

        const event = {
          id: c._id,
          text: c.title,
          description: c.description,
          start_date: moment(c.startAt).format('DD-MM-YYYY'),
          due_date: moment(c.endAt).format('YYYY-MM-DD'),
          duration: moment.duration(moment(c.endAt).diff(c.startAt)).asDays(),
          // type: projectTask,
        };

        if(c.targetId_gantt) {
          for (var i = 0; i < c.targetId_gantt.length; i++) {
            var cardLink = c.targetId_gantt[i];
            var linkType = c.linkType_gantt[i];
            var linkId = c.linkId_gantt[i];

            const LinkInfo= {
              id: linkId,
              source: c._id,
              target: cardLink,
              type: linkType,
            };
          LinksDate.push(LinkInfo);
          }
        }

        events.push(event);
        //LinksDate.push(links);
      });

      gantt.clearAll();

      gantt.parse({
        data: events,
        links: LinksDate,
      });
    });
  },

  isViewGantt() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-gantt';
    } else {
      return cookies.get('boardView') === 'board-view-gantt';
    }
  },
}).register('ganttView');
