import { ReactiveCache } from '/imports/reactiveCache';

BlazeComponent.extendComponent({
  onCreated() {
    this.showBoardTrigger = new ReactiveVar(true);
    this.showCardTrigger = new ReactiveVar(false);
    this.showChecklistTrigger = new ReactiveVar(false);
  },

  setBoardTriggers() {
    this.showBoardTrigger.set(true);
    this.showCardTrigger.set(false);
    this.showChecklistTrigger.set(false);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').addClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setCardTriggers() {
    this.showBoardTrigger.set(false);
    this.showCardTrigger.set(true);
    this.showChecklistTrigger.set(false);
    $('.js-set-card-triggers').addClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setChecklistTriggers() {
    this.showBoardTrigger.set(false);
    this.showCardTrigger.set(false);
    this.showChecklistTrigger.set(true);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').addClass('active');
  },

  rules() {
    const ret = ReactiveCache.getRules({});
    return ret;
  },

  name() {
    // console.log(this.data());
  },
  events() {
    return [
      {
        'click .js-set-board-triggers'() {
          this.setBoardTriggers();
        },
        'click .js-set-card-triggers'() {
          this.setCardTriggers();
        },
        'click .js-set-checklist-triggers'() {
          this.setChecklistTriggers();
        },
      },
    ];
  },
}).register('rulesTriggers');
