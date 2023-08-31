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
            } else  iElement.focus();
          });

          // Reset asynchronous
          $timeout(() => {

            // Set clear icon visibility
            setVisibility();

          }, 250);
        }
      };
  }])

  // Show/Hide password
	.directive('ngDisplayPassword', [
    '$timeout',
    ($timeout) => {
      return {
        restrict: 'EA',
        link: (scope, element, attr) => {

          // Get/Check/Set skeleton
          let skeleton = attr.ngDisplayPassword.trim();
          if (!skeleton.length) skeleton = 'form';

          // Reset asynchronous
          $timeout(() => {

            // Get/Check parent element
            let parent = element[0].closest(skeleton);
            if (parent) {

              // Get/Check input passwords
              let elements = parent.querySelectorAll('.input-password');
              if (elements.length) {

                // Add event listener changed
                element[0].addEventListener('change', () => {

                  // Each input passwords
                  elements.forEach(e => {

                    // Set input password type
                    if (element[0].checked)
                          e.type = 'text';
                    else 	e.type = 'password';
                  });
                });
              }
            }
          });
				}
			}
		}
	]);

})(window, angular);