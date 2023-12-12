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

  // Clear icon
  .directive('ngClearIcon', [
    '$compile',
    '$timeout',
    'util',
    ($compile, $timeout, util) => {

      return {
        restrict: 'EA',
        require : "ngModel",
        scope   : false,

        // Link
        link: (scope, iElement, iAttrs, ngModel) => {

          // Create clear icon element, and set default style
          let icon  = angular.element(
                        '<span class="clear-icon position-absolute text-primary cursor-pointer fw-semibold d-conditional btnClickEffect text-center me-2">x<span/>'),
              style = {top:'5px', right:'10px', width:'10px', zIndex:101};

          // When necessary modify clear icon style 
          if (iElement.hasClass('form-control-sm'))
            style.top = '2px';
          if (util.isJson(iAttrs.ngClearIcon))
            style = util.objMerge(style, JSON.parse(iAttrs.ngClearIcon));

          // Set clear icon style
          icon.css(style);

          // Set input element style
          iElement.css({paddingRight:'25px'});

          // Append and compile clear icon to scope
          iElement.parent().append(icon);
          $compile(icon)(scope);

          // Set clear icon visibility
          let setVisibility = () => {

            // Crete variable method
            let method = 'removeClass';

            // Reset asynchronous
            $timeout(() => {

              // Get element type
              let type = (iElement[0].type ? iElement[0].type :
                          iElement[0].tagName).toLowerCase();
              
              // Check is element disabled
              if (!iElement[0].disabled) {

                // Switch input element type
                switch(type) {
                  case 'file':
                    method = util.isFile(ngModel.$viewValue) ?   
                                        'addClass' : 'removeClass';
                    break;
                  case 'select':
                  case 'select-one':
                    method = ngModel.$viewValue ?   
                            'addClass' : 'removeClass';
                    break;
                  default:
                    method = util.isString(ngModel.$viewValue) && 
                                          ngModel.$viewValue.length ? 
                                          'addClass' : 'removeClass';
                }
              }

              // Set clear icon visibility
              icon[method]('show');
            });
          };

          // On input change, set clear icon visibility
          iElement.on('input', () => setVisibility());

          // On custom event, set clear icon visibility
          scope.$on('SetVisibility', () => setVisibility());

          // On clear icon clicked, reset model
          icon.on('click', () => {
            icon.removeClass('show');
            ngModel.$setViewValue(null);
            ngModel.$render();
            scope.$applyAsync();
            if (iElement[0].type === 'file') {
                    iElement[0].value = "";
            } else  iElement[0].focus();
          });

          // Reset asynchronous
          $timeout(() => {

            // Set clear icon visibility
            setVisibility();

          }, 250);
        }
      };
  }])

  // Check mark
  .directive('ngCheckMark', [
    () => {
      return {
        replace: true,
        scope: false,
        template:`<div class="col-1 pt-1">
                    <span class="check-mark ms-1 fw-bold text-success d-none">
                      &check;
                    </span>
                  </div>`
      };
  }])

  // Show/Hide password
	.directive('ngShowPassword', [
    '$timeout', 
    ($timeout) => {

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
              if (!parentElement) parentElement = document;

              // Get inputs type password
              let passwords = parentElement.querySelectorAll('input[type="password"]');

              // When exists exists, then set the event handler
              if (passwords.length) $scope.methods.events(passwords);
            },

            // Events
            events: (passwords) => {

              // Get checkbox element
              let checkbox = $element[0].querySelector('input#show-password');

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
          skeleton: "@"
        },
				controller: controller,
				template:`<div class="row mb-2">
                    <div class="col-0 col-sm-4"></div>
                    <div class="col-11 col-md-7">
                      <div class="form-check form-check-inline small">
                        <input id="show-password" 
                               class="form-check-input" 
                               type="checkbox">
                        <label class="form-check-label" 
                               for="show-password">
                          <i class="fa-solid fa-eye mx-1"></i>
                          <span>{{'display_password' | translate:$root.lang.data}}</span>
                        </label>
                      </div>
                    </div>
                  </div>`,

				// Compile 
				compile: () => {
					
					return {
						
						// Pre-link
						pre: (scope) => {

              // Check skeleton exist
              if (!scope.skeleton) scope.skeleton = 'form';
						},

						// Post-link
						post: (scope) => {
              $timeout(() => {
                scope.methods.init();
              });
						}
					};
				}
			};
		}
	])

  // Test code
	.directive('ngTestCode', [
    '$timeout',
    ($timeout) => {

			// Controller
			let controller = [
				'$scope',
        '$element',
        'util',
				($scope, $element, util) => {

          // Set methods
					$scope.methods = {

            // Initialize
            init: () => {

              // Set helper
              $scope.helper = {
                checkMark       : $element[0].querySelector('.check-mark'),
                clearIcon       : $element[0].querySelector('.clear-icon'),
                testCodeContent : util.getTestCode()
              };

              // Set model
              $scope.model = {testCode: null};
            },

            // Refresh
            refresh: () => {
              $scope.helper.testCodeContent = util.getTestCode();
              if ($scope.model.testCode) {
                $scope.model.testCode = null;
                $scope.helper.clearIcon.classList.remove('show');
                $scope.$applyAsync();
                $timeout(() => $scope.methods.changed());
              }
            },

            // Key up event
            keyUp: (event) => {
              if (event.ctrlKey && event.altKey && event.key.toUpperCase() === 'T' &&
                  $scope.model.testCode !== $scope.helper.testCodeContent) {
                $scope.model.testCode = $scope.helper.testCodeContent;
                $scope.helper.clearIcon.classList.add('show');
                $scope.$applyAsync();
                $timeout(() => $scope.methods.changed());
              }
            },

            // Changed
            changed: () => {
              $scope.helper.checkMark.classList[
                $scope.model.testCode === 
                $scope.helper.testCodeContent ? 'remove' : 'add']('d-none');
              $scope.$emit('testcodeChanged');
            }
          }
				}
			];

      return {
				restrict: 'EA',
				replace: true,
				scope: {},
				controller: controller,
				template:`<div>
                    <hr class="text-muted">
                    <div class="row mb-2">
                      <div class="col-form-label col-md-4 text-md-end fw-semibold">
                        <span class="fw-bold text-danger">*</span>
                        <i class="fa-regular fa-hand-point-right fa-xl"></i>
                        <span class="ms-1 text-capitalize">
                          {{'code' | translate:$root.lang.data}}:
                        </span>
                      </div>
                      <div class="col-11 col-md-7 position-relative">
                        <span id="testcode_content"
                              class="text-start letter-spacing-2 fw-semibold fs-4">
                          {{helper.testCodeContent}}
                        </span>
                      </div>
                      <div class="col-1"></div>
                    </div>
                    <div class="row input-row">
                      <div class="col-form-label d-none d-sm-block col-sm-4"></div>
                      <div class="col-11 col-md-7 position-relative">
                        <div class="input-group input-group-sm">
                          <div class="input-group-prepend">
                            <span class="input-group-text rounded-0 h-100">
                              <i class="fas fa-robot"></i>
                            </span>
                          </div>
                          <input id="testcode"
                                 type="text" 
                                 class="form-control form-control-sm"
                                 spellcheck="false" 
                                 autocomplete="off"
                                 ng-attr-placeholder="{{('code'|translate:$root.lang.data)}}"
                                 required
                                 maxlength="5"
                                 style="min-width:120px!important;max-width:120px!important;"
                                 ng-keyup="methods.keyUp($event)"
                                 ng-model="model.testCode"
                                 ng-change="methods.changed()"
                                 ng-clear-icon='{"left":"150px"}'>
                          <div class="input-group-append">
                            <button type="button"
                                    class="btn btn-sm btn-light text-capitalize 
                                           text-small-caps btnClickEffect"
                                    ng-click="methods.refresh()">
                              <i class="fas fa-sync-alt"></i>
                              <span class="ms-1">
                                {{'refresh' | translate:$root.lang.data}}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
					            <ng-check-mark></ng-check-mark>
                    </div>
                  </div>`,

				// Compile 
				compile: () => {
					
					return {
						
						// Post-link
						post: (scope) => {
              $timeout(() => scope.methods.init());
						}
					};
				}
			};
		}
	]);

})(window, angular);