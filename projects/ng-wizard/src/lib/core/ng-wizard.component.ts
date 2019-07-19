import { Component, OnInit, Input } from '@angular/core';

import { NgWizardService } from './ng-wizard.service';
import { NgWizardConfig, NgWizardStep, NgWizardStepState } from '../utils/interfaces';
import { TOOLBAR_POSITION, STEP_STATE, STEP_STATUS } from '../utils/enums';

@Component({
  selector: 'ng-wizard',
  templateUrl: './ng-wizard.component.html',
  styleUrls: ['./ng-wizard.component.css'],
})
export class NgWizardComponent implements OnInit {
  @Input() steps: NgWizardStep[];
  stepStates: NgWizardStepState[];

  @Input() config: NgWizardConfig;
  styles: {
    main?: string;
    step?: string;
    page?: string;
    previousButton?: string;
    nextButton?: string;
    toolbarTop?: string;
    toolbarBottom?: string;
  } = {};

  showToolbarTop: boolean = false;
  showToolbarBottom: boolean = false;
  showExtraButtons: boolean = false;
  current_index: number = null;// Active step index
  currentStepState: NgWizardStepState; // Active step

  constructor(private ngService: NgWizardService) {
  }

  ngOnInit() {
    this.config = this.ngService.getMergedWithDefaultConfig(this.config);

    // set step states
    this._setStepStates();

    // Set the elements
    this._setStyles();

    // Add toolbar
    this._setToolbar();

    // Assign plugin events
    this._setEvents();

    // Show the initial step
    this._showStep(this.config.selected);
  }

  _setStepStates() {
    this.stepStates = this.steps.map((step, index) => <NgWizardStepState>{
      step: step,
      index: index,
    });

    // Mark previous steps of the active step as done
    if (this.config.selected > 0
      && this.config.anchorSettings.markDoneStep
      && this.config.anchorSettings.markAllPreviousStepsAsDone) {

      this.stepStates.forEach(stepState => {
        if (stepState.step.state != STEP_STATE.disabled && stepState.step.state != STEP_STATE.hidden) {
          stepState.step.status = stepState.index < this.config.selected ? STEP_STATUS.done : stepState.step.status;
        }
      });
    }
  }

  // PRIVATE FUNCTIONS
  _setStyles() {
    // Set the main element
    this.styles.main = 'ng-wizard-main ng-wizard-theme-' + this.config.theme;

    // Set anchor elements
    this.styles.step = 'nav-item'; // li

    // Make the anchor clickable
    if (this.config.anchorSettings.enableAllAnchors != false && this.config.anchorSettings.anchorClickable != false) {
      this.styles.step += ' clickable';
    }

    // Set the toolbar styles
    this.styles.toolbarTop = 'btn-toolbar ng-wizard-toolbar ng-wizard-toolbar-top justify-content-' + this.config.toolbarSettings.toolbarButtonPosition;
    this.styles.toolbarBottom = 'btn-toolbar ng-wizard-toolbar ng-wizard-toolbar-bottom justify-content-' + this.config.toolbarSettings.toolbarButtonPosition;

    // Set content pages
    this.styles.page = 'tab-pane step-content';

    if (this.config.cycleSteps) {
      this.styles.previousButton = 'btn btn-secondary ng-wizard-btn-prev';
      this.styles.nextButton = 'btn btn-secondary ng-wizard-btn-next';
    }
    else {
      // TODO
      this.styles.previousButton = 'btn btn-secondary ng-wizard-btn-prev';
      this.styles.nextButton = 'btn btn-secondary ng-wizard-btn-next';
    }
  }

  _setToolbar() {
    this.showToolbarTop = this.config.toolbarSettings.toolbarPosition == TOOLBAR_POSITION.top ||
      this.config.toolbarSettings.toolbarPosition == TOOLBAR_POSITION.both;

    this.showToolbarBottom = this.config.toolbarSettings.toolbarPosition == TOOLBAR_POSITION.bottom ||
      this.config.toolbarSettings.toolbarPosition == TOOLBAR_POSITION.both;

    this.showExtraButtons = this.config.toolbarSettings.toolbarExtraButtons && this.config.toolbarSettings.toolbarExtraButtons.length > 0;
  }

  _setEvents() {
    //TODO: keyNavigation, backButtonSupport
    // Keyboard navigation event
    if (this.config.keyNavigation) {
      // $(document).keyup(function (e) {
      //   mi._keyNav(e);
      // });
    }

    // Back/forward browser button event
    if (this.config.backButtonSupport) {
      // $(window).on('hashchange', function (e) {
      //   if (!mi.options.useURLhash) {
      //     return true;
      //   }
      //   if (window.location.hash) {
      //     var elm = $("a[href*='" + window.location.hash + "']", mi.nav);
      //     if (elm && elm.length > 0) {
      //       e.preventDefault();
      //       mi._showStep(mi.steps.index(elm));
      //     }
      //   }
      // });
    }
  }

  _getStepCssClass(selectedStepState: NgWizardStepState) {
    var stepClass = this.styles.step;

    switch (selectedStepState.step.state) {
      case STEP_STATE.disabled:
        stepClass += ' disabled';
        break;
      case STEP_STATE.error:
        stepClass += ' danger';
        break;
      case STEP_STATE.hidden:
        stepClass += ' hidden';
        break;
    }

    switch (selectedStepState.step.status) {
      case STEP_STATUS.done:
        stepClass += ' done';
        break;
      case STEP_STATUS.active:
        stepClass += ' active';
        break;
    }

    return stepClass;
  }

  _getPageCssClass(selectedStepState: NgWizardStepState) {
    var pageClass = this.styles.page;

    if (selectedStepState.index == this.current_index) {
      pageClass += ' active';
    }

    return pageClass;
  }

  _showSelectedStep(event: Event, selectedStepState: NgWizardStepState) {
    event.preventDefault();

    if (this.config.anchorSettings.anchorClickable == false) {
      return;
    }

    if (this.config.anchorSettings.enableAnchorOnDoneStep == false && selectedStepState.step.status == STEP_STATUS.done) {
      return true;
    }

    if (selectedStepState.index != this.current_index) {
      if (this.config.anchorSettings.enableAllAnchors && this.config.anchorSettings.anchorClickable) {
        this._showStep(selectedStepState.index);
      }
      else {
        if (selectedStepState.step.status == STEP_STATUS.done) {
          this._showStep(selectedStepState.index);
        }
      }
    }
  }

  _showNextStep(event: Event) {
    event.preventDefault();
    // Find the next not disabled & hidden step
    var filteredStepStates = this.stepStates.filter((stepState, stepIndex) => {
      return stepIndex > (this.current_index == null ? -1 : this.current_index)
        && stepState.step.state != STEP_STATE.disabled
        && stepState.step.state != STEP_STATE.hidden;
    });

    if (filteredStepStates.length == 0) {
      if (!this.config.cycleSteps) {
        return;
      }

      this._showStep(0)
    }
    else {
      this._showStep(filteredStepStates.shift().index)
    }
  }

  _showPreviousStep(event: Event) {
    event.preventDefault();
    // Find the previous not disabled & hidden step
    var filteredStepStates = this.stepStates.filter((stepState, stepIndex) => {
      return stepIndex < (this.current_index == null && this.config.cycleSteps ? this.stepStates.length : this.current_index)
        && stepState.step.state != STEP_STATE.disabled
        && stepState.step.state != STEP_STATE.hidden;
    });

    if (filteredStepStates.length == 0) {
      if (!this.config.cycleSteps) {
        return;
      }

      this._showStep(this.steps.length - 1)
    }
    else {
      this._showStep(filteredStepStates.pop().index)
    }
  }

  _showStep(stepIndex: number) {
    // If step not found, skip
    if (stepIndex >= this.stepStates.length || stepIndex < 0) {
      return;
    }
    // If current step is requested again, skip
    if (stepIndex == this.current_index) {
      return;
    }
    var selectedStepState = this.stepStates[stepIndex];
    // If it is a disabled or hidden step, skip
    if (selectedStepState.step.state == STEP_STATE.disabled || selectedStepState.step.state == STEP_STATE.hidden) {
      return;
    }

    // Load step content
    this._loadStepContent(selectedStepState);
  }

  _loadStepContent(selectedStepState: NgWizardStepState) {
    // Get the direction of step navigation
    var stepDirection = (this.current_index != null && this.current_index != selectedStepState.index) ? (this.current_index < selectedStepState.index ? "forward" : "backward") : '';

    // Trigger "leaveStep" event
    if (this.current_index != null && this._triggerEvent("leaveStep", [this.currentStepState, this.current_index, stepDirection]) == false) {
      return;
    }

    var contentURL = selectedStepState.step.contentURL && selectedStepState.step.contentURL.length > 0 ? selectedStepState.step.contentURL : this.config.contentURL;

    if (contentURL && contentURL.length > 0 && (!selectedStepState.step.content || selectedStepState.step.content.length == 0 || !this.config.contentCache)) {
      // Get ajax content and then show step
      // TODO
      // var selPage = elm.length > 0 ? $(elm.attr("href"), this.main) : null;

      // var ajaxSettings = $.extend(true, {}, {
      //   url: contentURL,
      //   type: "POST",
      //   data: { step_number: idx },
      //   dataType: "text",
      //   beforeSend: function () {
      //     mi._loader('show');
      //   },
      //   error: function (jqXHR, status, message) {
      //     mi._loader('hide');
      //     $.error(message);
      //   },
      //   success: function (res) {
      //     if (res && res.length > 0) {
      //       elm.data('has-content', true);
      //       selPage.html(res);
      //     }
      //     mi._loader('hide');
      //     mi._transitPage(idx);
      //   }
      // }, this.options.ajaxSettings);

      // $.ajax(ajaxSettings);
    } else {
      // Show step
      this._transitPage(selectedStepState);
    }
  }

  _transitPage(selectedStepState: NgWizardStepState) {
    // Get the direction of step navigation
    var stepDirection = (this.current_index != null && this.current_index != selectedStepState.index) ? (this.current_index < selectedStepState.index ? "forward" : "backward") : '';
    var stepPosition = (selectedStepState.index == 0) ? 'first' : (selectedStepState.index == this.steps.length - 1 ? 'final' : 'middle');

    // TODO: Hide previous step content, show selected step content

    // Change the url hash to new step
    // this._setURLHash(selectedStepState.href);
    // Update controls
    this._setAnchor(selectedStepState);
    // Set the buttons based on the step
    this._setButtons(selectedStepState.index);
    // Fix height with content
    this._fixHeight(selectedStepState);
    // Update the current index
    this.current_index = selectedStepState.index;
    this.currentStepState = selectedStepState;

    // Trigger "showStep" event
    this._triggerEvent("showStep", [selectedStepState, this.current_index, stepDirection, stepPosition]);
  }

  _setAnchor(selectedStepState: NgWizardStepState) {
    // Current step anchor > Remove other classes and add done class
    if (this.currentStepState) {
      this.currentStepState.step.status = STEP_STATUS.untouched;

      if (this.config.anchorSettings.markDoneStep != false) {
        this.currentStepState.step.status = STEP_STATUS.done;

        if (this.config.anchorSettings.removeDoneStepOnNavigateBack != false) {
          this.stepStates.forEach(stepState => {
            if (stepState.index > selectedStepState.index) {
              stepState.step.status = STEP_STATUS.untouched;
            }
          });
        }
      }
    }

    // Next step anchor > Remove other classes and add active class
    selectedStepState.step.status = STEP_STATUS.active;
  }

  _setButtons(stepIndex: number) {
    // Previous/Next Button enable/disable based on step
    if (!this.config.cycleSteps) {
      if (0 >= stepIndex) {
        this.styles.previousButton = 'btn btn-secondary ng-wizard-btn-prev disabled';
      }
      else {
        this.styles.previousButton = 'btn btn-secondary ng-wizard-btn-prev';
      }

      if (this.stepStates.length - 1 <= stepIndex) {
        this.styles.nextButton = 'btn btn-secondary ng-wizard-btn-next disabled';
      }
      else {
        this.styles.nextButton = 'btn btn-secondary ng-wizard-btn-next';
      }
    }
  }

  // HELPER FUNCTIONS
  _keyNav(event: KeyboardEvent) {
    // Keyboard navigation
    switch (event.which) {
      case 37:
        // left
        this._showPreviousStep(event);
        event.preventDefault();
        break;
      case 39:
        // right
        this._showNextStep(event);
        event.preventDefault();
        break;
      default:
        return; // exit this handler for other keys
    }
  }

  _fixHeight(selectedStepState: NgWizardStepState) {
    // TODO
    // // Auto adjust height of the container
    if (this.config.autoAdjustHeight) {
      // var selPage = this.steps.eq(idx).length > 0 ? $(this.steps.eq(idx).attr("href"), this.main) : null;
      // this.container.finish().animate({ minHeight: selPage.outerHeight() }, this.defaultConfig.transitionSpeed, function () { });
    }
  }

  _triggerEvent(name: string, params: any[]): boolean {
    // TODO
    // // Trigger an event
    // var e = $.Event(name);
    // this.main.trigger(e, params);
    // if (e.isDefaultPrevented()) {
    //     return false;
    // }
    // return e.result;
    return true;
  }

  _setURLHash(hash: string) {
    if (this.config.showStepURLhash && window.location.hash != hash) {
      window.location.hash = hash;
    }
  }

  _loader(action: string) {
    // TODO
    // switch (action) {
    //   case 'show':
    //     this.main.addClass('ng-wizard-loading');
    //     break;
    //   case 'hide':
    //     this.main.removeClass('ng-wizard-loading');
    //     break;
    //   default:
    //     this.main.toggleClass('ng-wizard-loading');
    // }
  }

  // PUBLIC FUNCTIONS
  theme(v) {
    // TODO
    // if (this.options.theme == v) {
    //   return false;
    // }
    // this.main.removeClass('ng-wizard-theme-' + this.options.theme);
    // this.options.theme = v;
    // this.main.addClass('ng-wizard-theme-' + this.options.theme);
    // // Trigger "themeChanged" event
    // this._triggerEvent("themeChanged", [this.options.theme]);
  }

  // next() {
  //   this._showNext();
  // }

  // prev() {
  //   this._showPrevious();
  // }

  reset() {
    // TODO
    // // Trigger "beginReset" event
    // if (this._triggerEvent("beginReset") == false) {
    //   return false;
    // }

    // // Reset all elements and classes
    // this.container.stop(true);
    // this.pages.stop(true);
    // this.pages.hide();
    // this.current_index = null;
    // this._setURLHash(this.steps.eq(this.options.selected).attr("href"));
    // $(".ng-wizard-toolbar", this.main).remove();
    // this.steps.removeClass();
    // this.steps.parents('li').removeClass();
    // this.steps.data('has-content', false);
    // this.init();

    // // Trigger "endReset" event
    // this._triggerEvent("endReset");
  }

  stepState(stepArray, state) {
    // TODO
    // var mi = this;
    // stepArray = $.isArray(stepArray) ? stepArray : [stepArray];
    // var selSteps = $.grep(this.steps, function (n, i) {
    //   return $.inArray(i, stepArray) != -1; //  && i != mi.current_index
    // });
    // if (selSteps && selSteps.length > 0) {
    //   switch (state) {
    //     case 'disable':
    //       $(selSteps).parents('li').addClass('disabled');
    //       break;
    //     case 'enable':
    //       $(selSteps).parents('li').removeClass('disabled');
    //       break;
    //     case 'hide':
    //       $(selSteps).parents('li').addClass('hidden');
    //       break;
    //     case 'show':
    //       $(selSteps).parents('li').removeClass('hidden');
    //       break;
    //     case 'error-on':
    //       $(selSteps).parents('li').addClass('danger');
    //       break;
    //     case 'error-off':
    //       $(selSteps).parents('li').removeClass('danger');
    //       break;
    //   }
    // }
  }
}