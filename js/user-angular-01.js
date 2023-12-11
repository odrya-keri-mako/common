;(function(window, angular) {

  'use strict';

  // Application user module
  angular.module('app.user', ['app.common'])

	// User factory
  .factory('user', [
    '$rootScope',
    '$state',
    '$timeout',
    'util',
    ($rootScope, $state, $timeout, util) => {

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
          if (util.isArray(filter))
                return Object.keys($rootScope.user)
                             .filter((k) => !filter.includes(k))
                             .reduce((o, k) => { 
                                return Object.assign(o, {[k]:$rootScope.user[k]})
                              }, {});
          else  return $rootScope.user;
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

					// Confirm
					if (confirm('Biztosan kijelentkezik?')) {

						// Reset user
						service.reset().then(() => {

							// Go to login
							$state.go('login');
						});
					}
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
    '$window',
    '$timeout',
    '$q',
    'util',
    'http',
    'user',
    function($rootScope, $scope, $state, $window, 
             $timeout, $q, util, http, user) {

      // Set methods
      $scope.methods = {
        
        // Initialize
        init: () => {

          // Set model
          $scope.methods.set().then(() => {

            // Set events
            $scope.methods.events();

            // Check all inputs
            $scope.methods.changed(true).then(() => {

              // Set focused element
              $scope.methods.setFocusedElement();
            });
          });
        },

        // Set model
        set: () => {

          // Create promise
					return new Promise((resolve) => {

            // Create new deffered objects
            let set = util.deferredObj(),
                all = util.deferredObj();

            // Set helper
            $scope.helper = { 
              element : null,   // Current focused input element
              isEdit  : true,   // Is edit mode
            };
          
            // Set model
            $scope.model = {};

            // Switch state id, renews model
            switch($rootScope.state.id) {

              // Login
              case 'login':
                $scope.model.email    = $rootScope.user.email;
                $scope.model.password = null;
                break;

              // Register
              case 'register':
                $scope.model.email_confirm    = null;
                $scope.model.password         = null;
                $scope.model.password_confirm = null;
                $scope.model = util.objMerge(user.def(['id', 'type']), $scope.model);
                break;

              // Profile
              case 'profile':
                $scope.model.email_current    = $rootScope.user.email;
                $scope.model.email            = null;
                $scope.model.email_confirm    = null;
                $scope.model.password_current = null;
                $scope.model.password         = null;
                $scope.model.password_confirm = null;
                $scope.model = util.objMerge(user.get(['email']), $scope.model);
                $scope.helper.isEdit  				= false;
                $scope.helper.type    				= 'profile';
                $scope.helper.profileType 		= null;
                break;
            }

            // When state id is not login, then renews model
            if ($rootScope.state.id !== 'login') {

              // Create new deffered objects
              let image     = util.deferredObj(),
                  countries = util.deferredObj(),
                  user      = util.deferredObj();

              // Renews helper
              $scope.helper = util.objMerge({
                maxBorn     : moment().subtract( 18, 'years').format('YYYY-MM-DD'),
                minBorn     : moment().subtract(120, 'years').format('YYYY-MM-DD'),
                image       : null,
                countryCodes: null
              }, $scope.helper);

              // When state id is profile, and user has image properties, then crete image
              if ($rootScope.state.id === 'profile' &&
                  $scope.model.img_type && 
                  $scope.model.img) {
                util.base64Tofile(
                  $scope.model.img_type,
                  $scope.model.img
                ).then(file => {
                  $scope.helper.image = file;
                  image.promise.resolve();
                });
              } else image.promise.resolve();

              // Http request
              http.request($rootScope.app.commonPath+`data/countries.json`)
              .then(response => {
                $scope.helper.countries = response;
                countries.promise.resolve();
              })
              .catch(e => {

                // Resolve completed, reset asynchronous, and show error
                countries.promise.resolve();
                $timeout(() => alert(e), 50);
              });

              // When state id is profile, then get rest user data
              if ($rootScope.state.id === 'profile') {

                // Http request
                http.request({
                  url : `./php/user.php`,
                  data: {id: $rootScope.user.id}
                })
                .then(response => {
                  if (response) {
                    response.born = moment(response.born).toDate();
                    $scope.model  = util.objMerge($scope.model, response);
                    user.promise.resolve();
                  }
                })
                .catch(e => {

                  // Resolve completed, reset asynchronous, and show error
                  user.promise.resolve();
                  $timeout(() => alert(e), 50);
                });
              } else user.promise.resolve();

              // Whait for all completed
              $q.all([image.completed, countries.completed, user.completed]).then(() => {
                set.promise.resolve();
              });
            } else set.promise.resolve();

            // Whait for set completed
            set.completed.then(() => {

              // Reset asynchronous
              $timeout(() => {

                // When state id is not login
                if ($rootScope.state.id !== 'login') {

                  // Find input image element
                  $scope.helper.fileInput = document.querySelector('input#image[type="file"]');

                  // When state id event is profile
                  if ($rootScope.state.id === 'profile') {

                          // Get user country index from contries
                          let index = util.indexByKeyValue(
                                        $scope.helper.countries, 
                                        'country', 
                                        $scope.model.country
                                      );

                          // Check exist
                          if (index !== -1) {
                            $scope.model.country        = $scope.helper.countries[index];
                            $scope.helper.countryCodes  = $scope.helper.countries[index].code;
                          } else {
                            $scope.helper.countryCodes  = null;
                            $scope.model.country        = null;
                            $scope.model.country_code   = null;
                          }

                          // Resolve all completed
                          all.promise.resolve();
                  } else  all.promise.resolve();
                } else {

                  // Find link forgot password
                  //$scope.helper.forgotPassword = document.getElementById('forgot_password');

                  // Resolve all completed
                  all.promise.resolve();
                }

                // Whait for all completed
                all.completed.then(() => {

                  // Apply change, and resolve
                  $scope.$applyAsync();
                  resolve();
                });
              });
            });
          });
        },

        // Events
        events: () => {

          $scope.$on('$destroy', () => {
            console.log('Destroyed...');
          });

          // When allredy set or state id is login, then break
          //if (!isFirst || $rootScope.state.id === 'login') return;

          // Watch user image changed
          $scope.$watch('helper.image', (newValue, oldValue) => {

            // Check is changed
            if(!angular.equals(newValue, oldValue)) {

              // Restore value, apply change, and show error when exist
              let restore = (error=null) => {
                $scope.helper.image = oldValue;
                $scope.$applyAsync();
                if (error) $timeout(() => alert(error), 50);
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

          // Watch is edit mode changed
          $scope.$watch('helper.isEdit', (newValue, oldValue) => {

            // Check is changed
            if(!angular.equals(newValue, oldValue)) {

              // Show editm mode 
              console.log('Edit mode: O' + (newValue ? 'N' : 'FF'));
            }
          });

          // Accept button clicked
          $scope.$on('acceptBtnClicked', (event, args) => {
            console.log('Accept button clicked...', args);
          });

          // Test code changed
          $scope.$on('testcodeChanged', () => {
            console.log('Test code changed...');
          });
        },

        // Input changed
        changed: () => {

          // Create promise
					return new Promise((resolve) => {

            // Reset asynchronous
            $timeout(() => {

              // Set input(s) to check. 
              // When input element exists, select only this element,
              // otherwise check all required input elements
              let inputs  = $scope.helper.element ? [$scope.helper.element] :
                            document.querySelectorAll(
                              `form input[required], 
                               form textarea[required], 
                               form select[required]`);

              // Each input element(s)
              [...inputs].forEach((element) => {

                // Get element identifier as key, belonging to it check mark, define variable is valid
                let key		    = element.id,
                    checkMark = element.closest('.input-row').querySelector('.check-mark'),
                    isValid   = false;

                // Switch model key		
                switch(key) {
                  case 'email':
                  case 'email_confirm':
                  case 'email_current':
                    isValid = util.isEmail($scope.model[key]);
                    if (isValid) {
                      
                    }



                    if (isValid && $rootScope.state.id === 'profile')
                      isValid = $scope.model.email_current !== $scope.model[key];
                    if (isValid && key === 'email_confirm')
                      isValid = $scope.model.email === $scope.model[key];
                    break;
                  case 'password_current':
                  case 'password':
                  case 'password_confirm':
                    isValid = util.isPassword($scope.model[key]);
                    if (isValid && key !== 'password_current') {
                      if ($rootScope.state.id === 'profile')
                        isValid = $scope.model.password_current !== $scope.model[key];
                      if (isValid && key === 'password_confirm')
                        isValid = $scope.model.password === $scope.model[key];
                    }
                    break;
                  case 'phone':
                    isValid = /^[0-9]{7,14}$/.test($scope.model[key]);
                    break;
                  case 'born':
                    isValid = moment($scope.model[key]).isValid() &&
                            (moment($scope.model[key]).isSame($scope.helper.maxBorn) ||
                              moment($scope.model[key]).isBefore($scope.helper.maxBorn)) &&
                            (moment($scope.model[key]).isSame($scope.helper.minBorn) ||
                              moment($scope.model[key]).isAfter($scope.helper.minBorn));       
                    break;
                  case 'female':
                  case 'male':
                    isValid = $scope.model.gender && "FM".includes($scope.model.gender);
                    break;
                  case 'country':
                    isValid = $scope.model[key] && util.isObject($scope.model[key]);
                    if ($scope.helper.element && $scope.helper.element.id === key) {
                      if (isValid) {
                        $scope.helper.countryCodes  = $scope.model[key].code;
                        $scope.model.country_code   = $scope.helper.countryCodes[0];
                      } else {
                        $scope.helper.countryCodes  = null;
                        $scope.model.country_code   = null;
                      }
                    }
                    break;
                  case 'country_code':
                    isValid = $scope.helper.countryCodes && 
                              $scope.helper.countryCodes.includes($scope.model[key]);
                    break;
                  default:
                    isValid = $scope.model[key] && $scope.model[key].trim().length;
                }

                // Check mark
                if (checkMark) {
                  if (isValid && $scope.helper.isEdit)
                        checkMark.classList.remove('d-none');
                  else  checkMark.classList.add('d-none');
                }

                // Check is disabled 
                isDisabled = isDisabled || !isValid;
              });

              // Set accept button 
              acceptBtn.disabled = isDisabled;

              // Reset asynchronous
              $timeout(() => {

                // When state id is login
                if ($rootScope.state.id === 'login') {

                  // Set link password frogot enabled/disabled
                  //$scope.helper.isForgotPasswordEnabled = 
                  //    util.isEmail($scope.model.email) &&
                  //   (util.isNull($scope.model.password) ||
                  //    util.isUndefined($scope.model.password));
                  //$scope.$applyAsync();
                }
                // Resolve
                resolve();
              });
            });
          });
        },


        // Cancel
        cancel: () => {

          // Check state id is profile
          if ($rootScope.state.id === 'profile') {

            // Remove event on before unload
            window.onbeforeunload = null;

            // Reset data, and unset scope data key
            $scope.model = util.objMerge({}, $scope.data.model);
            $scope.helper.countryCodes  = $scope.data.countryCodes;
            $scope.helper.image         = $scope.data.image;
            delete $scope.data;

            // Disable edit mode, and apply change
            $scope.helper.isEdit = false;
            $scope.$broadcast('SetVisibility');
            $scope.$applyAsync();

            // Call input changed
            $scope.methods.changed().then(() => {

              $window.scrollTo(0, 0);
            });

          // Go prevent state or to home
          } else if (['user'].includes($rootScope.state.prev))
                $state.go('home');
          else  $state.go($scope.state.prev);
        },

        // Accept
        accept: () => {

					// Set data, url, filter (not necessary properties)
					let data,
							url = `./php/${$rootScope.state.id}.php`,
          		filterKeys = ['typeName',
														'email_confirm',
														'password_confirm'];

          // Check user parameter event is profile
          if ($state.uid === 'user.profile') {

            // Remove event on before unload
            window.onbeforeunload = null;

            // Disable edit mode, and apply change
            $scope.helper.isEdit = false;
            $scope.$broadcast('SetVisibility');
            $scope.$applyAsync();

						if ($scope.helper.profileType === "change-password") {
							url = `./php/password.php`;
							data = {
								id: $scope.model.id,
								email: $scope.model.email_current,
								password_current: $scope.model.password_current,
								password: $scope.model.password
							};
							filterKeys = [];
						} else if ($scope.helper.profileType === "change-email") {
							url = `./php/email.php`;
							data = {
								id            : $scope.model.id,
								email_current : $scope.model.email_current,
								password      : $scope.model.password_current,
								email         : $scope.model.email,
								url           : $rootScope.app.url
							};
							filterKeys = [];
						} else {
							filterKeys.push('email','email_current','password','password_current');
						}
          }

					// Get only necessary properties
					if (filterKeys.length) {
          	data = Object.keys($scope.model)
                          .filter((key) => !filterKeys.includes(key))
                          .reduce((obj, key) => { 
                             return Object.assign(obj, { [key]: $scope.model[key] })
                          }, {});
            if ($rootScope.state.id === 'profile') {
              data.url = $rootScope.app.url;
            }
					}

          // When data has born property, then convert date to string 
          if (util.isObjectHasKey(data, 'born'))
            data.born = moment(data.born).format('YYYY-MM-DD');

          // When data has country property, then convert object to string 
          if (util.isObjectHasKey(data, 'country'))
            data.country = data.country.country;

          // Http request
          http.request({
            url   : url,
            method: $rootScope.state.id === 'login' ? 'GET' : 'POST',
            data  : data
          })
          .then(response => {

            // Switch state id
            switch($rootScope.state.id) {

              // Register
              case 'register':
                if (response.affectedRows) {
                        data.id   = response.lastInsertId;
                        data.type = response.type;
                        user.set(data);
                } else  alert('Registration failed!');
                break;
              
              // Profile
              case 'profile':
                if (response.affectedRows) {
									if (!$scope.helper.profileType) {
                     data.email = $rootScope.user.email;
                     user.set(data, false);
									} else {
										let msg = ($scope.helper.profileType === "change-password" ?
															'password' : 'email') + ' change successful!';
										$scope.helper.profileType = null;
										$scope.$applyAsync();

										// Reset asynchronous, and show message
										$timeout(() => alert(msg), 50);
									}
                } else  alert('Modify data failed!');
                break;

              // Login
              default:
                response.email = $scope.model.email;
                user.set(response);
            }
            
            // Check state id is profile
            if ($rootScope.state.id !== 'profile') {

              // Go prevent state or to home
              if (['user'].includes($rootScope.state.prev))
                    $state.go('home');
              else  $state.go($scope.state.prev);
            } else  $window.scrollTo(0, 0);
          })

          // Error
          .catch(e => {

            // Initialize
            $scope.methods.init(false);

            // Reset asynchronous, and show error
            $timeout(() => alert(e), 50);
          });
        },

        // Edit
        edit: () => {

          // Set event on before unload
          window.onbeforeunload = (event) => {
            event.preventDefault();
            return event.returnValue = 'Are you sure you want to leave?';
          }

          // Enable edit mode, and apply change
          $scope.helper.isEdit = true;
          $scope.$broadcast('SetVisibility');
          $scope.$applyAsync();

          // Reset asynchronous
          $timeout(() => {

            // Call input changed
            $scope.methods.changed().then(() => {

              // Set focused element
              $scope.methods.setFocusedElement();

              // Save data
              $scope.data = {
                model       : util.objMerge({}, $scope.model),
                countryCodes: $scope.helper.countryCodes,
                image       : $scope.helper.image
              }
            });
          });
        },

        // Profile
        profile: () => {
          //alert(util.capitalize($rootScope.lang.data.under_construction) + '!');
          $scope.helper.isEdit      = false;
          $scope.helper.profileType = null;
          $scope.$applyAsync();
        },

        // Forgot password
        //forgotPassword: () => {
//
				//	console.log('Kérem várjon!');
//
        //  // Http request
        //  http.request({
        //    url   : `./php/password.php`,
        //    data  : {
        //      email: $scope.model.email
        //    }
        //  })
        //  .then(response => {
				//		if (response.affectedRows) {
				//			alert('Emailben elküldtük az Ön új jelszavát!');
				//		} else console.log(response);
        //  })
//
        //  // Error
        //  .catch(e => {
//
        //    // Go prevent state or to home
        //    if (['user'].includes($rootScope.state.prev))
        //          $state.go('home');
        //    else  $state.go($scope.state.prev);
//
        //    // Reset asynchronous, and show error
        //    $timeout(() => alert(e), 50);
        //  });
        //},

        // Change password
        changePassword: () => {
          $scope.helper.profileType = 'change-password';
          $scope.helper.isEdit      = true;
          $scope.$applyAsync();
        },

        // Change email
        changeEmail: () => {
          //alert(util.capitalize($rootScope.lang.data.under_construction) + '!');
          $scope.helper.profileType = 'change-email';
          $scope.helper.isEdit      = true;
          $scope.$applyAsync();
        },

        // Set focused element
        setFocusedElement: (event) => {

          // Check is not call from html
          if (!event) {

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
                inputs[i].focus();
                isFound = true;
                break;
              }
            }
          
            // When is not found, then set first input focus
            if (!isFound && inputs.length) inputs[0].focus();
          
          // Set helper element
          } else $scope.helper.element = event.currentTarget;
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
        templateUrl:`./html/navbar/navigate_user.html`
      };
  }])

  // User panel header (default login)
  .directive('ngUserPanelHeader', [
    () => {
      return {
        replace: true,
        scope: {
          titleClass: "@",
          titleId: '@',
          titleIcon: "@"
        },
        template:`<div class="user-panel-header mb-0 pt-2 pb-1 rounded-top-3"
                       ng-class="titleClass">
				            <h4 class="text-center">
					            <i class="me-2" ng-class="titleIcon"></i>
                      {{titleId | translate:$root.lang.data | capitalize}}
				            </h4>
			            </div>`,
        link: (scope) => {
          if (!scope.titleClass) scope.titleClass = 'bg-primary text-white';
          if (!scope.titleId) scope.titleId  = 'login';
          if (!scope.titleIcon) scope.titleIcon = 'fa-solid fa-right-to-bracket';
          
        }
      };
  }])

  // User panel footer
  .directive('ngUserPanelFooter', [
    () => {
      return {
        replace: true,
        scope: {
          identifier: "@",
          acceptId: "@",
          acceptIcon: "@",
          linkId: "@",
          linkIcon: "@",
          linkState: "@"
        },
        template: `<div class="user-panel-footer pb-2 px-3 border-top rounded-bottom-3">
			            	<div class="row mt-3">
			            		<div class="col-12 clearfix">
			            			<button id="accept"
			            							type="button" 
			            							class="btn btn-primary col-12 col-sm-auto 
			            										 float-sm-start mx-sm-1 mb-1 btnClickEffect"
			            							style="min-width:120px;"
                                ng-click="acceptBtnClicked()"
			            							disabled>
			            				<i ng-class="acceptIcon"></i>
			            				<span class="ms-1 btn-content d-inline-block text-start">
                            {{acceptId | translate:$root.lang.data | capitalize}}
			            				</span>
			            			</button>
			            			<a class="btn btn-secondary col-12 col-sm-auto  
			            								float-sm-start mx-sm-1 mb-1 btnClickEffect"
                           style="min-width:120px;" 
			            				 ui-sref="{{$root.state.prevEnabled}}">
			            				<i class="fa-solid fa-circle-xmark"></i>
			            				<span class="ms-1 btn-content d-inline-block text-start">
			            					{{'cancel' | translate:$root.lang.data | capitalize}}
			            				</span>
			            			</a>
						            <hr class="text-muted d-sm-none" ng-if="linkId">
						            <a class="btn btn-sm btn-outline-info col-12 col-sm-auto 
						            					float-sm-end mx-sm-1 mb-1 btnClickEffect"
                           style="min-width:120px;" 
						            	 ui-sref="{{linkState}}"
                           ng-if="linkId">
						            	<i ng-class="linkIcon"></i>
						            	<span class="ms-1 btn-content d-inline-block text-start">
						            		{{linkId | translate:$root.lang.data | capitalize}}
						            	</span>
						            </a>
			            		</div>
			            	</div>
			            </div>`,
        link: (scope) => {
          if (!scope.identifier) scope.identifier = scope.acceptId;
          scope.acceptBtnClicked = () => {
            scope.$emit('acceptBtnClicked', scope.identifier);
          }
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
          if (!scope.ruleId)  scope.ruleId  = 'password_rule';
          if (!scope.ruleClass) scope.ruleClass = 'text-muted';
          if (!scope.punctuationMark) scope.punctuationMark = '.';
        }
      };
  }]);

})(window, angular);