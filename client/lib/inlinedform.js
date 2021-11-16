// A inlined form is used to provide a quick edition of single field for a given
// document. Clicking on a edit button should display the form to edit the field
// value. The form can then be submited, or just closed.
//
// When the form is closed we save non-submitted values in memory to avoid any
// data loss.
//
// Usage:
//
//   +inlineForm
//     // the content when the form is open
//   else
//     // the content when the form is close (optional)

// We can only have one inlined form element opened at a time
const currentlyOpenedForm = new ReactiveVar(null);

InlinedForm = BlazeComponent.extendComponent({
  template() {
    return 'inlinedForm';
  },

  onCreated() {
    this.isOpen = new ReactiveVar(false);
  },

  onDestroyed() {
    currentlyOpenedForm.set(null);
  },

  open(evt) {
    if (evt) {
      evt.preventDefault();
      // Close currently opened form, if any
      EscapeActions.clickExecute(evt.target, 'inlinedForm');
    } else {
      // Close currently opened form, if any
      EscapeActions.executeUpTo('inlinedForm');
    }

    this.isOpen.set(true);
    currentlyOpenedForm.set(this);
  },

  close() {
    this.isOpen.set(false);
    currentlyOpenedForm.set(null);
  },

  getValue() {
    const input = this.find('textarea,input[type=text]');
    // \s without \n + unicode (https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Regular_Expressions#special-white-space)
    return this.isOpen.get() && input && input.value.replaceAll(/[ \f\r\t\v]+$/gm, '');
  },

  events() {
    return [
      {
        'click .js-close-inlined-form': this.close,
        'click .js-open-inlined-form': this.open,

        // Pressing Ctrl+Enter should submit the form
        'keydown form textarea'(evt) {
          if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
            this.find('button[type=submit]').click();
          }
        },

        // Close the inlined form when after its submission
        submit() {
          if (this.currentData().autoclose !== false) {
            Tracker.afterFlush(() => {
              this.close();
            });
          }
        },
      },
    ];
  },
}).register('inlinedForm');

// Press escape to close the currently opened inlinedForm
EscapeActions.register(
  'inlinedForm',
  () => {
    currentlyOpenedForm.get().close();
  },
  () => {
    return currentlyOpenedForm.get() !== null;
  },
  {
    enabledOnClick: false,
  },
);

// submit on click outside
//document.addEventListener('click', function(evt) {
//  const openedForm = currentlyOpenedForm.get();
//  const isClickOutside = $(evt.target).closest('.js-inlined-form').length === 0;
//  if (openedForm && isClickOutside) {
//    $('.js-inlined-form button[type=submit]').click();
//    openedForm.close();
//  }
//}, true);
