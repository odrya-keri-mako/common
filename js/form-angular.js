;(function(window, angular) {

  'use strict';

  // Application form module
  angular.module('app.form', ['app.common'])

  // Input file
  .directive("fileInput", [
    () => {
      return {
        require: "ngModel",
        scope: false,
        compile: () => {
          return {
            post: (scope, element, attrs, ngModel) => {
              element[0].addEventListener("change", () => {
                if (!element[0].files.length) {
                        element[0].setAttribute('data-file-choice-cancel', true);
                        ngModel.$setViewValue(null);          
                } else  ngModel.$setViewValue(element[0].files[0]);
                ngModel.$render();
                scope.$applyAsync();
              });
            }
          };
        }
      }
    }
  ])

  // Disable input space
  .directive('ngDisableSpace', [
    () => {

      return {
        scope: false,
        link: (scope, iElement) => {

          // Set event key down
          iElement.bind("keydown", function(event) {
            if (event.keyCode === 32) {
              event.preventDefault();
              return false;
            }
          });
        }
      };
    }
  ])

  // Allow numbers only
  .directive('ngAllowNumbers', [
    'util',
    (util) => {

      return {
        restrict: 'EA',
        require : "ngModel",
        scope: false,
        link: (scope, iElement, iAttrs, ngModel) => {

          // Set default options
          let options = {isAllowNegative:false, disableZeroStart:true, isFloat:false};

          // When attribute is json, then merge with default optons
          if (util.isJson(iAttrs.ngAllowNumbers))
            options = util.objMerge(options, JSON.parse(iAttrs.ngAllowNumbers), true);

          // Check options
          if (options.isFloat) options.disableZeroStart = false;

          // Set event key down
          iElement.bind("keydown", function(event) {
            
            // Numbers 0 to 9 also numpad
            if ((event.which >= 48 && event.which <=  57) ||
                (event.which >= 96 && event.which <= 105)) {
              
              // Check disable zero start
              if (options.disableZeroStart && 
                 (event.which === 48 || event.which === 96)) {
                if (!iElement[0].value) {
                        event.preventDefault(); 
                        return false;
                } else  return true;
              } else return true;

            // Backspace, enter, delete, escape, arrows, end, home, ins, numlock
            // When is allow float then allow dot or numpad dot
            // When is allow negative then allow minus sign or numpad minus sign
            } else if (([8,13,46,27,37,38,39,40,35,36,45,144].includes(event.which)) ||
                (event.which >= 48 && event.which <=  57) ||
                (event.which >= 96 && event.which <= 105) ||
                (options.isFloat && [110, 190].includes(event.which)) ||
                (options.isAllowNegative && [173, 109].includes(event.which))) {
              return true;
            } else {
              event.preventDefault(); 
              return false;
            }
          });
        }
      };
    }
  ])
  
  // Clear icon
  .directive('ngClearIcon', [
    '$compile',
    'util',
    ($compile, util) => {

      return {
        restrict: 'EA',
        require : "ngModel",
        scope   : false,
        link: (scope, iElement, iAttrs, ngModel) => {
          
          // Create clear icon element, and set default style
          let icon  = angular.element(
             `<div class="clear-icon position-absolute text-primary cursor-pointer
                          fw-semibold text-center px-2 text-bold fs-5"
                   style="max-width:10px;"
                   ng-show="helper.isInEditMode && ${ngModel.$$parentForm.$name}.${ngModel.$name}.$viewValue">
                &#215;
              </div>`),
              style = {top:'0', right:'25px', zIndex:101};

          // When necessary modify clear icon style 
          if (iElement.hasClass('form-control-sm') ||
              iElement.hasClass('form-select-sm'))
            style.top = '-2px';
          if (util.isJson(iAttrs.ngClearIcon))
            style = util.objMerge(style, JSON.parse(iAttrs.ngClearIcon));

          // Set clear icon style
          icon.css(style);

          // Set input element style
          iElement.css({paddingRight:'25px'});

          // Append and compile clear icon to scope
          iElement.parent().append(icon);
          $compile(icon)(scope);
          
          // Watch input element disabled changed
          scope.$watch(() => iElement.attr('disabled'), 
                (newValue, oldValue) => {
                  if(!angular.equals(newValue, oldValue))
                    icon[0].classList[newValue === 'disabled' ? 
                                  'add' : 'remove']('d-none');
                });

          // On clear icon clicked, reset model
          icon.on('click', () => {
            ngModel.$setViewValue(null);
            ngModel.$render();
            scope.$applyAsync();
            if (iElement[0].type === 'file') {
                    iElement[0].value = "";
            } else  iElement[0].focus();
          });
        }
      };
  }])

  // Check mark
  .directive('ngCheckMark', [
    '$compile',
    ($compile) => {

      return {
        restrict: 'EA',
        require : "ngModel",
        scope   : false,
        link: (scope, iElement, iAttrs, ngModel) => {

          // Check is required
          let isRequired  = iAttrs.ngCheckMark ? 
                            iAttrs.ngCheckMark.trim().toLowerCase() : 'true';

          // Check is required
          if (isRequired === 'true') {

            // Get/Check input parent element
            let skeleton      = iAttrs.ngCheckMarkParentSkeleton ?
                                iAttrs.ngCheckMarkParentSkeleton : '.input-row',
                parentElement = iElement[0].closest(skeleton);

            // Check exist
            if (parentElement) {

              // Create check mark element
              let checkMark = angular.element(
                  `<div class="col-1 pt-1">
                      <span class="check-mark ms-1 fw-bold text-success"
                            ng-show="helper.isInEditMode && 
                              ${ngModel.$$parentForm.$name}.${ngModel.$name}.$valid && 
                              ${ngModel.$$parentForm.$name}.${ngModel.$name}.$viewValue">
                        &check;
                      </span>
                    </div>`);

              // Append to parent element, and compile check mark to scope
              parentElement.append(checkMark[0]);
              $compile(checkMark)(scope);

              // Watch input element disabled changed
              scope.$watch(() => iElement.attr('disabled'), 
                (newValue, oldValue) => {
                  if(!angular.equals(newValue, oldValue))
                    checkMark[0].classList[newValue === 'disabled' ? 
                                        'add' : 'remove']('d-none');
              });
            }
          }
        }
      };
  }])

  // Compare model equal with another model
  .directive('ngCompareModel', [
    '$parse',
    ($parse) => {
      return {
        restrict: 'EA',
        require : "ngModel",
        scope   : false,
        link: function(scope, iElement, iAttrs, ngModel) {
          scope.$watch(() => 	
                $parse(iAttrs.ngCompareModel)(scope) === ngModel.$modelValue, 
                      (isEqual) => ngModel.$setValidity('equal', isEqual));
        }
      };
    }
  ])

  // Compare model different with another model
  .directive('ngCompareModelDifferent', [
    '$parse',
    ($parse) => {
      return {
        restrict: 'EA',
        require : "ngModel",
        scope   : false,
        link: function(scope, iElement, iAttrs, ngModel) {
          scope.$watch(() => 
                $parse(iAttrs.ngCompareModelDifferent)(scope) !== ngModel.$modelValue, 
                (isEqual) => ngModel.$setValidity('equal', isEqual));
        }
      };
    }
  ])

  // Show/Hide password
  .directive('ngShowPassword', [
    '$timeout',
    'util', 
    ($timeout, util) => {

      // Controller
      let controller = [
        '$scope',
        '$element',
        ($scope, $element) => {

          // Set methods
          $scope.methods = {

            // Initialize
            init: () => {

              // Get/Check parent element
              let parentElement = $element[0].closest($scope.skeleton);
              if (parentElement) {

                // Get input(s) password
                let passwords = parentElement.querySelectorAll('input.input-password');

                // When password(s) exist, then set the event handler
                if (passwords.length) $scope.methods.events(passwords);
              }
            },

            // Events
            events: (passwords) => {

              // Get checkbox element
              let checkbox = $element[0].querySelector('input#show_password');

              // Set the event handler changed
              checkbox.addEventListener('change', () => {

                // Each passwords set type
                passwords.forEach(element => {
                  element.type = checkbox.checked ? 'text' : 'password';
                });
              });
            }
          }
        }
      ];

      return {
        restrict: 'EA',
        replace: true,
        scope: {
          skeleton: "@",
          isInEditMode: "<"
        },
        controller: controller,
        template:`<div class="row mb-2">
                    <div class="col-0 col-sm-4"></div>
                    <div class="col-11 col-md-7">
                      <div class="form-check form-check-inline small">
                        <input id="show_password" 
                               class="form-check-input"
                               ng-class="{'input-disabled': !isInEditMode}" 
                               type="checkbox"
                               ng-disabled="!isInEditMode">
                        <label class="form-check-label" 
                               for="show_password">
                          <i class="fa-solid fa-eye mx-1"></i>
                          <span>
                            {{'password_display' | translate:$root.lang.data}}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>`,

        // Compile 
        compile: () => {
          return {
            pre: (scope) => {
              if (!util.isString(scope.skeleton)) scope.skeleton = 'form';
              if (!util.isBoolean(scope.isInEditMode)) scope.isInEditMode = true;
            },
            post: (scope) => {
              $timeout(() => scope.methods.init());
            }
          };
        }
      };
  }])

  // Test code
	.directive('ngTestCode', [
    '$timeout',
    'util',
    ($timeout, util) => {

      return {
        restrict: 'EA',
				replace: true,
				scope: false,
        template:`<div class="testcode-container">
                    <hr class="text-muted" ng-if="testCodeOptions.isTopLine">
                    <div class="row mb-2">
                      <div class="col-form-label fw-semibold"
                           ng-class="testCodeOptions.classLabel"
                           ng-if="testCodeOptions.isLabel">
                        <i class="fa-solid fa-star fa-2xs text-danger"></i>
                        <i class="fa-regular fa-hand-point-right fa-xl mx-1"></i>
                        <span class="text-capitalize">
                          {{'code' | translate:$root.lang.data}}:
                        </span>
                      </div>
                      <div class="col-11 col-md-7 position-relative">
                        <i class="fa-solid fa-star fa-2xs text-danger"
                           ng-if="!testCodeOptions.isLabel"></i>
                        <span id="testcode_content"
                              class="text-start letter-spacing-2 fw-semibold fs-4">
                          {{model.testCodeContent}}
                        </span>
                      </div>
                      <div class="col-1"></div>
                    </div>
                    <div class="row mb-2 input-row">
                      <label for="testcode" 
                             class="col-form-label col-form-label-sm col-md-4 
                                    text-md-end fw-semibold invisible"
                             ng-if="testCodeOptions.isFalseLabel">
                      </label>
                      <div class="col-11 position-relative"
                           ng-class="{'col-md-7': testCodeOptions.isFalseLabel}">
                        <div class="input-group"
                             ng-class="testCodeOptions.classInputGroup">
                          <div class="input-group-prepend">
                            <span class="input-group-text rounded-0 h-100">
                              <i class="fas fa-robot"></i>
                            </span>
                          </div>
                          <input id="testcode"
                                 name="testcode"
                                 type="text" 
                                 class="form-control {{}}"
                                 ng-class="{'input-disabled': !helper.isInEditMode}"
                                 spellcheck="false" 
                                 autocomplete="off"
                                 ng-attr-placeholder="{{('code'|translate:$root.lang.data)}}"
                                 required
                                 maxlength="5"
                                 style="min-width:120px!important;max-width:120px!important;"
                                 ng-keyup="keyUp($event)"
                                 ng-model="model.testcode"
                                 ng-init="model.testcode=null"
                                 ng-disabled="!helper.isInEditMode"
                                 ng-compare-model="model.testCodeContent"
                                 ng-trim="false"
                                 ng-disable-space
                                 ng-clear-icon='{"left":"135px","right":""}'
                                 ng-check-mark>
                          <div class="input-group-append">
                            <button type="button"
                                    class="btn btn-light text-capitalize 
                                           text-small-caps btnClickEffect"
                                    ng-class="testCodeOptions.classBtn"
                                    ng-click="refresh($event)"
                                    ng-disabled="!helper.isInEditMode">
                              <i class="fas fa-sync-alt"></i>
                              <span class="ms-1">
                                {{'refresh' | translate:$root.lang.data}}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`,
        link: function(scope) {

          // Check/Set testcode options
          if (!util.hasKey(scope, 'testCodeOptions'))
            scope.testCodeOptions = {};
          scope.testCodeOptions = util.objMerge({
            isTopLine: true,
            isLabel: true,
            classLabel: "col-form-label-sm col-md-4 text-md-end",
            isFalseLabel: true,
            classInputGroup: "input-group-sm",
            classInput: "form-control-sm",
            classBtn: "btn-sm",
          }, scope.testCodeOptions, true);

          // Refresh testcode
          scope.refresh = (event) => {
            scope.model.testCodeContent = util.getTestCode();
            if (event) {
              scope.model.testcode = null;
              if (util.hasKey(event, 'currentTarget')) {
                let element = event.currentTarget;
                if (element) {
                  let inputGroup = element.closest('.input-group');
                  if (inputGroup) {
                    let inputElement = inputGroup.querySelector('input#testcode');
                    if (inputElement) $timeout(() => {inputElement.focus();}, 50);
                  }
                }
              }
            }
          }

          // Set custom event to refresh testcode
          scope.$on('refreshTestcodeEvent', (event) => {
            scope.refresh(event);
          });

          // Set testcode
          scope.keyUp = (event) => {
            if (event.ctrlKey && event.altKey && event.key.toUpperCase() === 'T') {
              scope.model.testcode = scope.model.testCodeContent;
              let inputElement = event.currentTarget;
              if (inputElement) $timeout(() => {inputElement.focus()}, 50);
            }
          }

          // Refresh testcode
          scope.refresh();
        }
      };
    }
  ]);

})(window, angular);