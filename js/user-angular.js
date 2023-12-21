;(function(window, angular) {

  'use strict';

  // Application user module
  angular.module('app.user', ['app.common'])

	// User factory
  .factory('user', [
    '$rootScope',
    '$state',
    '$timeout',
    'lang',
    'util',
    ($rootScope, $state, $timeout, lang, util) => {

      // Set user default properties
      let user = {
        base: {
          id          : null,
          type        : null,
          prefix_name : null,
          first_name  : null,
          middle_name : null,
          last_name   : null,
          suffix_name : null,
          nick_name   : null,
          gender      : null,
          img         : null,
          img_type    : null,
          email       : null
        },
        rest: {
          born        : null,
          country     : null,
          country_code: null, 
          phone       : null,
          city        : null,
          postcode    : null,
          address     : null
        }
      };

      // Set service
      let service = {

        // Initialize 
        init: () => {
          service.set(util.objMerge(user.base, {
            email: window.localStorage.getItem(service.getKey())
          }, true), false);
        },
        
        // Get key
				getKey: () => {
					return [$rootScope.app.id, 'user_email'].join('_');
				},

        // Set
        set: (data, isSave=true) => {
          $rootScope.user = util.objMerge(user.base, data, true);
          if(util.isBoolean(isSave) && isSave) service.save();
          $timeout(() => {
            $rootScope.$applyAsync();
          });
        },

        // Get
        get: (filter=null) => {
          return util.objFilterByKeys($rootScope.user, filter);
        },
        
        // Default
        def: (filter=null , key=null) => {
          let prop  = util.isObjectHasKey(user, key) ? user[key] : 
                      util.objMerge(user.base, user.rest);
          if (util.isArray(filter))
                return Object.keys(prop)
                             .filter((k) => !filter.includes(k))
                             .reduce((o, k) => { 
                                return Object.assign(o, {[k]:prop[k]})
                              }, {});
          else  return prop;
        },

        // Reset
        reset: () => {
          return new Promise((resolve) => {
            Object.keys(user.base).forEach((k) => {
              if (k !== 'email') $rootScope.user[k] = null;
            });
            $timeout(() => {
              $rootScope.$applyAsync();
              resolve();
            });
          });
        },

        // Save
        save: () => {
          window.localStorage.setItem(
            service.getKey(), $rootScope.user.email);
        }
      };

      // Check logout function exist
			if (!util.isFunction($rootScope.logout)) {

				// Logout
				$rootScope.logout = () => {

          // Reset asynchronous
          $timeout(() => {

					  // Confirm
					  if (confirm(lang.translate('logout_confirm', true)+'?')) {

					  	// Reset user
					  	service.reset().then(() => {

					  		// When current state is not enabled, then goto previous enabled state
                if ($rootScope.state.disabled.includes($rootScope.state.id))
					  		  $state.go($rootScope.state.prevEnabled);
					  	});
					  }
          }, 50);
				};
			}

      // Return service
      return service;
  }])

	// User controller
  .controller('userController', [
    '$rootScope',
    '$scope',
    '$state',
    '$timeout',
    'util',
    'user',
    'lang',
    'http',
    function($rootScope, $scope, $state, $timeout, util, user, lang, http) {

      console.log('User controller...');

      // Set methods
      $scope.methods = {
        
        // Initialize
        init: () => {

          // Set model
          $scope.methods.set().then(() => {

            // Set events
            $scope.methods.events();

            // Check is editable
            if ($scope.helper.editable) {

              // Set focus
              $scope.methods.setFocus();
            }
          });
        },

        // Set model
        set: () => {

          // Create promise
					return new Promise((resolve) => {

            // Create new deffered objects
            let set = util.deferredObj();

            // Set model
            $scope.model = {};

            // Set helper
            $scope.helper = { 
              editable : $rootScope.state.id !== 'profile'
            };
            
            // Switch state id, renews model/helper
            switch($rootScope.state.id) {

              case 'register':
              case 'profile':
                $scope.helper.maxBorn       = moment().subtract( 18, 'years').format('YYYY-MM-DD');
                $scope.helper.minBorn       = moment().subtract(120, 'years').format('YYYY-MM-DD');
                $scope.helper.image         = null;
                $scope.helper.countryCodes  = null;
                $scope.helper.fileInput     = document.querySelector('input#image[type="file"]'); 
                set.promise.resolve();
                break;

              default:
                set.promise.resolve();
            }
            
            // Whait for set completed
            set.completed.then(() => {

              // Apply change, and resolve
              $scope.$applyAsync();
              resolve();
            });
          });
        },

        // Events
        events: () => {

          // Check helper has image property
          if (util.isObjectHasKey($scope.helper, 'image')) {

            // Watch user image changed
            $scope.$watch('helper.image', (newValue, oldValue) => {

              // Check is changed
              if(!angular.equals(newValue, oldValue)) {

                // Restore value, apply change, and show error when exist
                let restore = (error=null) => {
                  $scope.helper.image = oldValue;
                  $scope.$applyAsync();
                  if (error) 
                    $timeout(() => alert(lang.translate(error, true)+'!'), 50);
                };

                // Check has property
                if (newValue) {

                  // Check accept file types property
                  util.fileAllowedTypes(newValue, $scope.helper.fileInput.accept).then(() => {

                    // File reader
                    util.fileReader(newValue, {
                      method  : 'readAsDataURL',
                      limit   : 64
                    }).then((data) => {

                      // Set image
                      $scope.model.img      = util.getBase64UrlData(data);
                      $scope.model.img_type = newValue.type;
                      $scope.$applyAsync();

                    // Restore
                    }).catch(error => restore(error));
                  }).catch(error => restore(error));

                } else {

                  // Get/Check input file data attribute file-choice-cancel property
                  let isCanceled = $scope.helper.fileInput.getAttribute('data-file-choice-cancel');
                  $scope.helper.fileInput.removeAttribute('data-file-choice-cancel');
                  if (!isCanceled) {

                    // Reset image
                    $scope.model.img      = null;
                    $scope.model.img_type = null;
                    $scope.$applyAsync();

                  // Restore
                  } else restore();
                }
              }
            });
          }

          // Check state identifier is register or profile
          if (['register','profile'].includes($rootScope.state.id)) {

            // Name properties (sufix,first,middle,last,postfix) changed
            $scope.nameChanged = () => $scope.methods.showName();

            // When language is changed show name
            document.addEventListener("languageChanged", () => $scope.methods.showName());
          }
        },

        // Toogle name details
        toogleName: (event) => {
          let element = event.currentTarget;
          if (element) {
            let btnIcon     = element.querySelector('.name-detail-toggle-icon'),
                parentForm  = element.closest('form');
            if (btnIcon)
              btnIcon.classList.toggle('fa-rotate-180');
            if (parentForm) {
              let nameDetailContainer = parentForm.querySelector('.name-detail-container');
              if (nameDetailContainer)
                nameDetailContainer.classList.toggle('show');
            }
          }
        },

        // Show user name
        showName: () => {
          let name = "";
          $rootScope.lang.rule[$rootScope.lang.type].forEach(k => {
            if ($scope.model[k]) name += ($scope.model[k] + " ");
          });
          $scope.model.name = name.trim();
        },

        // Accept button clicked
        clicked: (event) => {

          // Get accept button identifier, 
          // and set variable is show please whait.
          let acceptBtnId = event.currentTarget.id,
              isShowWait  = false;

          // Check type
          if (acceptBtnId === 'modify') {
            if ($rootScope.state.id !== 'profile')
              $state.go($rootScope.state.prevEnabled);
            return;
          }

          // Set url, and set arguments for requiest
          let args  = {
                url   : `./php/${acceptBtnId}.php`,
                method: acceptBtnId === 'login' ? 'GET' : 'POST',
                data  : util.objFilterByKeys($scope.model, [
                          'testcode',
                          'testCodeContent',
                          'email_confirm',
                          'email_current_user',
                          'password_confirm'
                        ], false)
              };

          // Update arguments
          switch(acceptBtnId) {
            case 'password_change':
              args.data.userId = $rootScope.user.id;
              break;
            case 'password_frogot':
            case 'email_change':
              isShowWait = true;
              args.data.langId    = $rootScope.lang.id;
              args.data.langType  = $rootScope.lang.type;
              if (acceptBtnId === 'email_change') {
                args.data.userId  = $rootScope.user.id;
                args.data.appUrl  = $rootScope.app.url;
                args.data.event   = acceptBtnId;
              }
              break;
            case 'register':
            case 'profile':
              if (acceptBtnId === 'register') {
                isShowWait = true;
              }
              break;
            default:   
          }

          // Show please wait
          if (isShowWait) $rootScope.$broadcast("whait-loading");

          // Http request
          http.request(args).then(response => {
            if (isShowWait) $rootScope.$broadcast("whait-finished");
            switch(acceptBtnId) {
              case 'login':
                response.email = $scope.model.email;
                user.set(response);
                break;
              case 'email_change':
              case 'password_change':
              case 'password_frogot':
                $timeout(() => alert(lang.translate(response, true)+'!'), 50);
                break;
              case 'register':
              case 'profile':
                break;
              default:   
            }
            if (acceptBtnId !== 'profile') {
              $state.go($rootScope.state.prevEnabled);
            }
          })
          .catch(e => {
            if (isShowWait) $rootScope.$broadcast("whait-finished");
            $scope.helper.editable = !$scope.helper.editable;
            $scope.$applyAsync();
            $timeout(() => alert(lang.translate(e, true)+'!'), 50);
          });
        },

        // Set focus
        setFocus: () => {

          // Reset asynchronous
          $timeout(() => {

            // Get all input elements, and set variable is found
            let inputs  = document.querySelectorAll('form input, form textarea, form select'),
                isFound = false;

            // Each input elements
            for (let i=0; i < inputs.length; i++) {
              
              // Get input identifier key
              let key = inputs[i].id;

              // Check is not disabled, has model, and has not value
              if (!inputs[i].disabled &&
                  util.isObjectHasKey($scope.model, key) &&
                  !$scope.model[key]) {
                
                // Set input element focus, mark is fouund, and break
                $timeout(() => inputs[i].focus(), 50);
                isFound = true;
                break;
              }
            }

            // When is not found, then set first input focus
            if (!isFound && inputs.length) 
              $timeout(() => inputs[0].focus(), 50);
          }, 50);
        }
      };

      // Initialize
      $scope.methods.init();
    }
  ])

  // Navbar user
  .directive('ngNavbarUser', [
    () => {
      return {
        replace: true,
        scope: false,
        template:`<li class="nav-item mx-1">
                    <ul class="navbar-nav">
                      <li class="nav-item"
                          ng-if="!$root.user.id && $root.state.id !== 'login' && 
                                  $root.state.id !== 'password_frogot'">
                        <a class="nav-link" 
                           ui-sref="login" 
                           ui-sref-active="active">
                          <i class="fa-solid fa-right-to-bracket me-1"></i>
                          <span class="text-capitalize text-small-caps">
                            {{'login' | translate:$root.lang.data}}
                          </span>
                        </a>
                      </li>
                      <li class="nav-item" 
                          ng-if="!$root.user.id && ($root.state.id === 'login' || 
                                  $root.state.id === 'password_frogot')">
                        <a class="nav-link" 
                           ui-sref="register" 
                           ui-sref-active="active">
                          <i class="fa-solid fa-id-card me-1"></i>
                          <span class="text-capitalize text-small-caps">
                            {{'register' | translate:$root.lang.data}}
                          </span>
                        </a>
                      </li>
                      <li class="nav-item dropdown" 
                          ng-if="$root.user.id">
                        <a id="dropdown-menu-user"
                           href="#" 
                           class="nav-link dropdown-toggle"
                           role="button" 
                           data-bs-toggle="dropdown" 
                           aria-expanded="false">
                          <div class="bg-img bg-img-cover overflow-hidden rounded-circle d-inline-block float-start me-2" 
                               style="width:32px;height:32px;"
                               ng-style="{'background-image':$root.user.img_type?'url(data:'+$root.user.img_type+';base64,'+$root.user.img+')	            ':'url	('	+app.commonPath+'media/image/blank/'+($root.user.gender==='F'?'fe':'')+'male-blank.webp)'}"
                               ng-show="$root.user.img || $root.user.gender">
                          </div>
                          <div class="text-capitalize text-small-caps d-inline-block float-start">
                            {{'account' | translate:$root.lang.data}}
                          </div>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end mt-2" 
                            aria-labelledby="dropdown-menu-user">
                          <li>
                            <a class="dropdown-item disabled" href="#">
                              <span class="text-capitalize text-small-caps" 
                                    ng-if="$root.user.nick_name">
                                {{$root.user.nick_name}}
                              </span>
                              <span class="text-capitalize text-small-caps" 
                                    ng-repeat="k in $root.lang.rule[$root.lang.type]"
                                    ng-if="!$root.user.nick_name">
                                {{user[k]}}
                              </span>
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item"
                               ng-class="{'disabled': $root.state.id === 'user' && userEvent === 'profile'}"
                               ui-sref="profile">
                              <i class="fa-solid fa-user fa-lg"></i>
                              <span class="text-capitalize text-small-caps">
                                {{'profile' | translate:$root.lang.data}}
                              </span>
                            </a>
                          </li>
                          <li><hr class="dropdown-divider"></li>
                          <li>
                            <a class="dropdown-item" 
                               href="javascript:void(0)" 
                               ng-click="logout()">
                              <i class="fa-solid fa-right-from-bracket fa-lg"></i>
                              <span class="text-capitalize text-small-caps">
                                {{'logout' | translate:$root.lang.data}}
                              </span>
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>`
      };
  }])

  // Form dialog header
  .directive('ngFormDialogHeader', [
    () => {
      return {
        replace: true,
        scope: {
          titleClass: "@",
          titleIcon: "@",
          titleTextId: '@',
          titleTextClass: '@'
        },
        template:`<div class="form-dialog-header w-100 d-flex flex-row align-items-center p-3"
                       ng-class="titleClass">
                    <i class="fa-2xl" ng-class="titleIcon"></i>
                    <h4 class="w-100 mb-0 text-center"
                        ng-class="titleTextClass">
                      {{titleTextId | translate:$root.lang.data | capitalize}}
                    </h4>
                  </div>`,
        link: (scope) => {
          if (!scope.titleClass) scope.titleClass = 'lin-grad-blue text-white';
          if (!scope.titleIcon) scope.titleIcon = 'fa-solid fa-list-check';
          if (!scope.titleTextId) scope.titleTextId  = 'form';
          if (!scope.titleTextClass) scope.titleTextClass = '';
        }
      };
  }])

  // Form dialog footer
  .directive('ngFormDialogFooter', [
    'util',
    (util) => {
      return {
        replace: true,
        restrict: 'EA',
        scope: {
          formName: '<',
          isModify: '@',
          identifier: "@",
          acceptId: "@",
          acceptIcon: "@",
          acceptClass: "@",
          editable: "=",
          callback: '&',
          linkId: "@",
          linkIcon: "@",
          linkState: "@",
          linkId2: "@",
          linkIcon2: "@",
          linkState2: "@"
        },
        template:`<div class="form-dialog-footer w-100 px-3 py-2"
                       ng-init="callback=callback()">
                    <div class="clearfix">
                      <div class="float-none float-sm-end pt-2">
                        <button id="{{identifier}}"
                                type="button" 
                                class="btn btn-primary mb-2 mx-1 col-12 col-sm-auto 
                                       shadow-sm-bottom-end btnClickEffect"
                                ng-class="acceptClass"
                                style="min-width:100px;"
                                ng-click="editable=!editable;callback($event)"
                                ng-disabled="formName.$invalid"
                                ng-show="editable||!isModify">
                          <i ng-class="acceptIcon"></i>
                          <span class="ms-1 btn-content">
                            {{acceptId | translate:$root.lang.data | capitalize}}
                          </span>
                        </button>
                        <button id="modify"
                                type="button" 
                                class="btn btn-primary mb-2 mx-1 col-12 col-sm-auto 
                                       shadow-sm-bottom-end btnClickEffect"
                                style="min-width:100px;"
                                ng-click="editable=!editable;callback($event)"
                                ng-show="!editable"
                                ng-if="isModify">
                          <i class="fa-solid fa-pen-to-square"></i>
                          <span class="ms-1 btn-content">
                            {{'modify' | translate:$root.lang.data | capitalize}}
                          </span>
                        </button>
                        <button id="save"
                                type="button" 
                                class="btn btn-primary mb-2 mx-1 col-12 col-sm-auto 
                                       shadow-sm-bottom-end btnClickEffect"
                                style="min-width:100px;"
                                ng-click="callback($event)"
                                ng-show="editable"
                                ng-if="$root.state.id==='profile'">
                          <i class="fa-solid fa-floppy-disk"></i>
                          <span class="ms-1 btn-content">
                            {{'save' | translate:$root.lang.data | capitalize}}
                          </span>
                        </button>
                        <a id="cancel"
                           type="button" 
                           class="btn btn-secondary mb-2 mx-1 col-12 col-sm-auto 
                                  shadow-sm-bottom-end btnClickEffect"
                           style="min-width:100px;"
                           ui-sref="{{$root.state.prevEnabled}}">
                          <i class="fa-solid fa-circle-xmark"></i>
                          <span class="ms-1 btn-content">
                            {{'cancel' | translate:$root.lang.data | capitalize}}
                          </span>
                        </a>
                      </div>
                      <div class="float-none float-sm-start text-center text-sm-start pt-1"
                           ng-if="linkId||linkId2">
                        <hr class="text-muted d-sm-none">
                        <a class="link-offset-2 link-offset-3-hover link-underline
                                  link-underline-opacity-0 link-underline-opacity-75-hover
                                  mb-3 mb-sm-1 col-12 col-sm-auto btnClickEffect d-block"
                           ui-sref="{{linkState}}"
                           ng-if="linkId"
                           ng-class="{'mt-sm-3':!linkId2}">
                          <i class="text-decoration-none mx-1"
                             ng-class="linkIcon"></i>
                          <span class="btn-content">
                            {{linkId | translate:$root.lang.data | capitalize}}
                          </span>
                        </a>
                        <a class="link-offset-2 link-offset-3-hover link-underline
                                  link-underline-opacity-0 link-underline-opacity-75-hover
                                  mb-3 mb-sm-1 col-12 col-sm-auto btnClickEffect d-block"
                           ui-sref="{{linkState2}}"
                           ng-if="linkId2">
                          <i class="text-decoration-none mx-1"
                             ng-class="linkIcon2"></i>
                          <span class="btn-content">
                            {{linkId2 | translate:$root.lang.data | capitalize}}
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>`,
        link: (scope) => {
          if (!util.isString(scope.identifier)) scope.identifier = scope.acceptId;
          if (!util.isString(scope.isModify)) scope.isModify = "false";
          scope.isModify = scope.isModify.trim().toLowerCase();
          if (!['true','false'].includes(scope.isModify)) scope.isModify = "false";
          scope.isModify = scope.isModify === 'true';
          if (!util.isBoolean(scope.editable)) scope.editable = true;
        }
      };
  }])

  // Show password/email/born rule
  .directive('ngShowRule', [
    () => {
      return {
        replace: true,
        scope: {
          ruleId: "@",
          ruleClass: "@",
          punctuationMark: '@'
        },
        template:`<div class="row mt-1 mb-2">
                    <div class="col-0 col-sm-4"></div>
                    <div class="col-12 col-md-8 fs-sm" ng-class="ruleClass">
                      {{ruleId|translate:$root.lang.data|capitalize}}{{punctuationMark}}
                    </div>
                  </div>`,
        link: (scope) => {
          if (!scope.ruleId) scope.ruleId  = 'password_rule';
          if (!scope.ruleClass) scope.ruleClass = 'text-muted';
          if (!scope.punctuationMark) scope.punctuationMark = '.';
        }
      };
  }]);

})(window, angular);