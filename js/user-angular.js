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
    'http',
    ($rootScope, $state, $timeout, lang, util, http) => {

      // Set options
      let options = {
        minAgeLimit         : 18,
        maxAgeLimit         : 120,
        isBornShowRule     	: true,
        isPhoneShowRule     : true,
        isPostcodeShowRule  : true,
        isTestCode          : true,
        isEmailConfirm      : true,
        isEmailShowRule     : true,
        isPasswordConfirm   : true,
        isPasswordShowRule  : true,
        isNameDetail        : true,
        isSendEmail         : true,
        isDividingPlusLine  : true
      };

      // Set user default properties
      let user = {
        base: {
          id          : null,
          type        : null,
          name        : null,
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
        init: (args=null) => {
          service.setOptions(args).then(() => {
            service.getFields().then(() => {
              service.checkOptions();
              service.set(util.objMerge(user.base, {
                email: window.localStorage.getItem(service.getKey())
              }, true), false);
            }).catch(e => console.log(e));
          });
        },
        
        // Set optons
        setOptions: (args) => {

          // Create promise
					return new Promise((resolve) => {

            // Check/Convert arguments
            if (util.isNumber(args)) {
              args = {minAgeLimit: parseInt(args)};
            } else if (util.isBoolean(args)) {
              args = {isTestCode: args};
            }

            // Merge options with arguments, and resolve
            options = util.objMerge(options, args, true);

            // Check options
            if (options.minAgeLimit < 0 ||
                options.minAgeLimit > 120)
                options.minAgeLimit = null;
            if (options.maxAgeLimit < 0 ||
                options.maxAgeLimit > 120 ||
               (!util.isNull(options.minAgeLimit) &&
                             options.maxAgeLimit < options.minAgeLimit))
                options.maxAgeLimit = null;
            resolve();
          });
        },

        // Check options
        checkOptions: () => {
          if (util.isObjectHasKey(user.fields, 'name'))
            options.isNameDetail = false;
          if (!util.isObjectHasKey(user.fields, 'born')) {
            options.minAgeLimit     = null;
            options.maxAgeLimit     = null;
            options.isBornShowRule  = false;
          }
          if (!util.isObjectHasKey(user.fields, 'phone'))
            options.isPhoneShowRule = false;
          if (!util.isObjectHasKey(user.fields, 'postcode'))
            options.isPostcodeShowRule = false;
          if (!util.isObjectHasKey(user.fields, 'postcode'))
            options.isPostcodeShowRule = false;
          if (!options.minAgeLimit)
            options.isBornShowRule  = false;
          if (!options.isSendEmail ||
              !util.isObjectHasKey(user.fields, 'email_verification_code'))
            options.isEmailShowRule = false;
        },

        // Get optons
        getOptions: (key=null) => {
          if (util.isString(key)) {
            if (util.isObjectHasKey(options, key))
                  return options[key];
            else  return null;
          } else  return options;
        },

        // Get user fields
        getFields: () => {

          // Create promise
					return new Promise((resolve, reject) => {
            http.request({
              data: {
                className : "Database/Database",
                methodName: "getFieldsName",
                params    : 'user'
              }
            })
            .then(response => {
              user.base   = util.objFilterByKeys(user.base, Object.keys(response));
              user.rest   = util.objFilterByKeys(user.rest, Object.keys(response));
              user.fields = response;
              resolve();
            })
            .catch(e => reject(e));
          });
        },

        // Check field exist
        isFieldExist: (fieldName, key=null) => {
          if (!util.isString(key)) key = 'fields';
          if (!util.isObjectHasKey(user, key)) key = 'fields'
          return util.isObjectHasKey(user[key], fieldName);
        },

        // Get key
				getKey: () => {
					return [$rootScope.app.id, 'user_email'].join('_');
				},

        // Set
        set: (data, isSave=true) => {
          $rootScope.user = util.objMerge(user.base, data, true);
          if(util.isBoolean(isSave) && isSave) service.save();
          $timeout(() => $rootScope.$applyAsync());
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
    '$element',
    '$state',
    '$timeout',
    '$q',
    'util',
    'user',
    'lang',
    'http',
    function($rootScope, $scope, $element, $state, 
             $timeout, $q, util, user, lang, http) {

      // Set methods
      $scope.methods = {
        
        // Initialize
        init: () => {

          // Set model
          $scope.methods.set().then(() => {

            // Set events
            $scope.methods.events();

            // Check is in edit mode
            if ($scope.helper.isInEditMode) {

              // Reset asynchronous
              $timeout(() => {

                // Set focus
                $scope.methods.setFocus();
              });
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

            // Set model rescue
            $scope.rescue = {};

            // Set helper
            $scope.helper = {
              isInEditMode: $rootScope.state.id !== 'profile',
              rescue: {}
            };
            
            // Switch state id, renews model/helper
            switch($rootScope.state.id) {

              case 'register':
              case 'profile':
                if (user.isFieldExist('born')) {
                  let limit = user.getOptions('minAgeLimit');
                  if (!util.isNull(limit))
                        $scope.helper.maxBorn = 
                            moment().subtract(limit, 'years')
                                    .format('YYYY-MM-DD');
                  else  $scope.helper.maxBorn = null;
                  limit = user.getOptions('maxAgeLimit');
                  if (!util.isNull(limit))
                        $scope.helper.minBorn = 
                            moment().subtract(limit, 'years')
                                    .format('YYYY-MM-DD');
                  else  $scope.helper.minBorn = null;
                }
                if (user.isFieldExist('img')) {
                  $scope.helper.image = null;
                  $scope.helper.rescue.image = null;
                }
                if (user.isFieldExist('country')) {
                  $scope.helper.countryCodes = null;
                  $scope.helper.rescue.countryCodes = null;
                }
                if ($rootScope.state.id === 'profile') 
                  $scope.model = util.objMerge($scope.model, user.get());

                // Create new deffered objects, 
                // and create list watch
                let countries = util.deferredObj(),
                    completed = [countries.completed];

                // Check state id is profile
                if ($rootScope.state.id === 'profile') {

                  // Create new deffered objects
                  let image   = util.deferredObj(),
                      getUser = util.deferredObj();
                
                  // Add to list watch
                  completed.push(image.completed, getUser.completed);
                  
                  // Check img field exist
                  if (user.isFieldExist('img')) {

                    // When user has image properties, then crete image
                    if ($scope.model.img_type && $scope.model.img) {
                      util.base64Tofile(
                        $scope.model.img_type,
                        $scope.model.img
                      ).then(file => {
                        $scope.helper.image = file;
                        image.promise.resolve();
                      });
                    } else image.promise.resolve();
                  } else image.promise.resolve();

                  // Get user rest properties
                  http.request({
                    data: {
                      require : `properties.php`,
                      params  : {id: $rootScope.user.id}
                    }
                  })
                  .then(response => {
                    if (response) {
                      if (util.isObjectHasKey(response, 'born'))
                        response.born = moment(response.born).toDate();
                      $scope.model = util.objMerge($scope.model, response);
                      getUser.promise.resolve();
                    }
                  })
                  .catch(e => {
                    getUser.promise.resolve();
                    $timeout(() => {alert(lang.translate(e, true)+'!');}, 50);
                  });
                }

                // Check country field exist
                if (user.isFieldExist('country')) {

                  // Get countries
                  http.request({
                    data: {
                      methodName: "getContents",
                      params    : [
                        'countries.json', 
                        {subFolder:'data', isMinimize:true}
                      ]
                    }
                  })
                  .then(response => {
                    $scope.helper.countries = response;
                    countries.promise.resolve();
                  })
                  .catch(e => {
                    countries.promise.resolve();
                    $timeout(() => {alert(e);}, 50);
                  });
                } else countries.promise.resolve();

                // Whait for all completed
                $q.all(completed).then(() => {

                  // Check state id is profile, and has country property
                  if ($rootScope.state.id === 'profile') {
                    
                    // Set name from name details
                    $scope.methods.setUserName();

                    // Check country exist and has property
                    if (user.isFieldExist('country') && 
                        $scope.model.country) {

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
                    }
                          // Resolve set completed
                          set.promise.resolve();
                  } else  set.promise.resolve();
                });
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

            // Get input element image type file, and check exist
            let inputElement = document.querySelector('input#image[type="file"]');
            if (inputElement) {

              // Watch user image changed
              $scope.$watch('helper.image', (newValue, oldValue) => {

                // Check is changed
                if(!angular.equals(newValue, oldValue)) {

                  // Restore value, apply change, and show error when exist
                  let restore = (error=null) => {
                    $scope.helper.image = oldValue;
                    $scope.$applyAsync();
                    if (error) 
                      $timeout(() => {alert(lang.translate(error, true)+'!');}, 50);
                  };

                  // Check has property
                  if (newValue) {

                    // Check accept file types property
                    util.fileAllowedTypes(newValue, inputElement.accept).then(() => {

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
                    let isCanceled = inputElement.getAttribute('data-file-choice-cancel');
                    inputElement.removeAttribute('data-file-choice-cancel');
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
          }

          // Check state identifier is register or profile
          if (util.isObjectHasKey($scope.model, 'user_name') &&
              ['register','profile'].includes($rootScope.state.id)) {

            // Name properties (sufix,first,middle,last,postfix) changed
            $scope.nameChanged = () => 
                $scope.methods.setUserName();

            // When language is changed show name
            document.addEventListener("languageChanged", () => 
                $scope.methods.setUserName());
          }
        },

        // Toogle name detail
        toogleNameDetail: () => {
          let detailContainer = $element[0].querySelector('.name-detail-container');
          if (detailContainer) {
            $timeout(() => {
              detailContainer.classList.toggle('show');
              let toggleIcon = $element[0].querySelector('.name-detail-toggle-icon');
              if (toggleIcon) 
                toggleIcon.classList.toggle('fa-rotate-180');
            });
          }
        },

        // Show name detail
        showNameDetail: () => {
          $scope.helper.isInEditMode = true;
          let detailContainer = $element[0].querySelector('.name-detail-container');
          if (detailContainer) {
            $timeout(() => {
              detailContainer.classList.add('show');
              let toggleIcon = $element[0].querySelector('.name-detail-toggle-icon');
              if (toggleIcon) 
                toggleIcon.classList.remove('fa-rotate-180');
              $timeout(() => {$scope.methods.setFocus();}, 300);
            });  
          }
        },

        // Hide name detail
        hideNameDetail: () => {
          let detailContainer = $element[0].querySelector('.name-detail-container');
          if (detailContainer) {
            detailContainer.classList.remove('show');
            let toggleIcon = $element[0].querySelector('.name-detail-toggle-icon');
            if (toggleIcon) 
              toggleIcon.classList.add('fa-rotate-180');
            $timeout(() => {
              $scope.helper.isInEditMode = false;
            }, 300);
          } else $scope.helper.isInEditMode = false;
        },

        // Set user name
        setUserName: () => {

          // When user name exist, then set name from name details
          if (util.isObjectHasKey($scope.model, 'user_name')) {

            // Set name from name details
            let userName = "";
            $rootScope.lang.rule[$rootScope.lang.type].forEach(k => {
              if (util.isObjectHasKey($scope.model, k) && $scope.model[k]) {
                $scope.model[k] = $scope.model[k].replace(/\s+/g, ' ');
                userName += ($scope.model[k].trim() + " ");
              }
            });
            $scope.model.user_name = userName.trim();
          }
        },

        // Country changed
        countryChanged: () => {
          if (user.isFieldExist('country')) {
            if ($scope.model.country) {
              $scope.helper.countryCodes  = $scope.model.country.code;
              $scope.model.country_code   = $scope.helper.countryCodes[0];
            } else {
              $scope.helper.countryCodes  = null;
              $scope.model.country_code   = null;
              $scope.model.phone          = null;
            }
            $scope.$applyAsync();
          }
        },

        // City changed
        cityChanged: () => {
          if (user.isFieldExist('city') && 
              user.isFieldExist('postcode')) {
            if (!$scope.model.city) $scope.model.postcode = null;
          }
        },

        // Removing whitespaces
        removeWhitespaces: (event) => {
          let element = event.currentTarget;
          if (element) {
            if (element.value)
              element.value = element.value.replace(/\s+/g, ' ').trim();
            if (util.isObjectHasKey($scope.model, element.name) && 
                $scope.model[element.name]) {
              $scope.model[element.name] = 
              $scope.model[element.name].replace(/\s+/g, ' ').trim();
            }
          }
        },

        // Accept button clicked
        accept: (event) => {

          // Get accept button identifier, 
          // and set variable is show please whait.
          let acceptBtnId = event.currentTarget.id,
              isShowWait  = false;

          // Check type
          if (acceptBtnId === 'edit') {

            // Save model, change is in edit mode, and return
            angular.copy($scope.model, $scope.rescue);
            Object.keys($scope.helper.rescue).forEach(key => {
              $scope.helper.rescue[key] = $scope.helper[key];
            });
            $scope.methods.showNameDetail();
            return;
          }

          // Get user neccesary property filtered
          let user_property = util.objFilterByKeys($scope.model, [
            'identifier',
            'user_name',
            'testcode',
            'testCodeContent',
            'email_confirm',
            'email_current_user',
            'password_confirm'
          ], false);
          
          // Convert data
          if (util.isObjectHasKey(user_property, 'born') &&
              util.isDate(user_property.born))
            user_property.born = moment(user_property.born).format('YYYY-MM-DD');
          if (util.isObjectHasKey(user_property, 'country') &&
              util.isObjectHasKey(user_property.country, 'country'))
            user_property.country = user_property.country.country;

          // Set arguments
          let args = {user: util.cloneVariable(user_property)};

          // Update arguments
          switch(acceptBtnId) {
            case 'password_change':
              args.user.id  = $rootScope.user.id;
              break;
            case 'password_frogot':
            case 'email_change':
            case 'register':

              // Set is send email property
              args.isSendEmail = user.getOptions('isSendEmail');

              // Set please wait message to true when send email
              isShowWait = args.isSendEmail;

              // Get language properties
              args.lang = util.objFilterByKeys($rootScope.lang, ['id','type'], true);

              // Set necessary data for email address confirmation
              if (acceptBtnId === 'email_change' ||
                  acceptBtnId === 'register') {
                args.app  = {
                  id    : $rootScope.app.id,
                  common: $rootScope.app.commonPath,
                  domain: util.getLocation(),
                  event : acceptBtnId
                };
                if (acceptBtnId === 'email_change')
                  args.user.id = $rootScope.user.id;
              }
              break;
            default:   
          }

          // When is necessary, then show the please wait message
          if (isShowWait) $rootScope.$broadcast("whait-loading");

          // Http request
          http.request({
            method: acceptBtnId === 'login' ? 'GET' : 'POST',
            data: {
              require : `${acceptBtnId}.php`,
              params  : args,
            }
          })
          .then(response => {

            // When the please wait message appears, then close it
            if (isShowWait) $rootScope.$broadcast("whait-finished");

            // Switch accept button type
            switch(acceptBtnId) {
              case 'login':
                response.email = $scope.model.email;
                user.set(response);
                break;
              case 'email_change':
              case 'password_change':
              case 'password_frogot':
                if (acceptBtnId === 'email_change') {
                  let prop = {email: $scope.model.email};
                  if (user.isFieldExist('type') &&
                      user.isFieldExist('email_verification_code'))
                    prop.type = 'N';
                  user.set(prop);
                }
                $timeout(() => {alert(lang.translate(response, true)+'!');}, 50);
                break;
              case 'register':
                user_property.id = response.id;
                if (user.isFieldExist('type'))
                  user_property.type = response.type;
                user.set(user_property);
                $timeout(() => {
                  alert(lang.translate('registration_successful', true)+'!');
                }, 50);
                break;
              case 'profile':
                $scope.methods.hideNameDetail();
                user.set(user_property);
                $scope.model.password = null;
                if (util.isObjectHasKey($scope.model, 'testcode'))
                  $rootScope.$broadcast('refreshTestcodeEvent');
                $timeout(() => {
                  alert(lang.translate(response, true)+'!');
                }, 500);
                break;
              default:   
            }
            if (acceptBtnId !== 'profile') {
              $state.go($rootScope.state.prevEnabled);
              return;
            }
          })
          .catch(e => {

            // When the please wait message appears, then close it
            if (isShowWait) $rootScope.$broadcast("whait-finished");
            
            // Reset asynchronous
            $timeout(() => {

              // Translate, and show error
              alert(lang.translate(e, true)+'!');

              // When is state profile, then disable edit mode.
              if (acceptBtnId === 'profile') {

                // Reset password
                $scope.model.password = null;

                // Refresh testcode
                if (util.isObjectHasKey($scope.model, 'testcode'))
                  $rootScope.$broadcast('refreshTestcodeEvent');

                // Hide name details
                $scope.methods.hideNameDetail();

              // When is state is not login or register, then go to prevent enabled state.
              } else if(acceptBtnId !== 'login' && 
                        acceptBtnId !== 'register') {
                $state.go($rootScope.state.prevEnabled);
                      
              } else {

                // Reset password
                $scope.model.password = null;

                // Refresh testcode
                if (util.isObjectHasKey($scope.model, 'testcode'))
                  $rootScope.$broadcast('refreshTestcodeEvent');

                // Get email input element
                let email = $element[0].querySelector('form input#email');

                // When found, then set focus to input email
                if (email) $timeout(() => {email.focus();}, 50);
              }
            }, 50);
          });
        },

        // Cancel button clicked
        cancel: () => {

          // When state id is not profile, or not is in editmode, then got to prevent enabled state
          if ($rootScope.state.id !== 'profile' || !$scope.helper.isInEditMode) {
            $state.go($rootScope.state.prevEnabled);
            return;
          }

          // Reset model, change is in edit mode, and apply change
          $scope.model = angular.copy($scope.rescue);
          Object.keys($scope.helper.rescue).forEach(key => {
            $scope.helper[key] = $scope.helper.rescue[key];
          });
          $scope.$applyAsync();
          $scope.methods.hideNameDetail();
        },

        // Set focus
        setFocus: () => {

          // Reset asynchronous
          $timeout(() => {

            // Get all input elements, and set variable is found
            let inputs  = $element[0].querySelectorAll('form input, form textarea, form select'),
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
                $timeout(() => {inputs[i].focus();}, 50);
                isFound = true;
                break;
              }
            }

            // When is not found, then set first input focus
            if (!isFound && inputs.length) 
              $timeout(() => {inputs[0].focus();}, 50);
          }, 50);
        },

        // Check user field exist
        isFieldExist: (fieldName) => {
          if (fieldName === 'name') {
            let atika = user.isFieldExist(fieldName);
          }
          return user.isFieldExist(fieldName);
        },

        // Get options key
        getOptionsKey: (key) => {
          return user.getOptions(key);
        }
      };

      // Initialize
      $scope.methods.init();
    }
  ])

  // User email confirm controller
  .controller('emailConfirmController', [
		'$rootScope',
    '$scope',
		'$state',
		'$stateParams',
		'$element',
		'$timeout',
		'$q',
		'util',
		'lang',
    'http',
    function($rootScope, $scope, $state, $stateParams, $element, $timeout, $q, util, lang, http) {

			// Check state parameters
			if (!util.isString($stateParams.e) ||
					!util.isString($stateParams.i) ||
					!util.isString($stateParams.l)) {
				$state.go("home");
				return;
			}

			// Decode state parameters
			$scope.data = {
				event	: util.base64Decode($stateParams.e),
				userId: parseInt(util.base64Decode($stateParams.i)),
				langId: util.base64Decode($stateParams.l)
			};
			
			let language 	= util.deferredObj(),
					session 	= util.deferredObj();

			// Check language
			if ($scope.data.langId !== $rootScope.lang.id) {

            // Reset asynchronous
            $timeout(() => {

              // Set language
              $rootScope.changeLanguage($scope.data.langId);

              // Resolve completed
              language.promise.resolve();
            });
			} else 	language.promise.resolve();

			// Http request
			http.request({
				data: {
					className: "Util/Util",
					methodName: "getSession",
					isStatic: true,
					params: {
						id : $rootScope.app.id,
						key: `email_confirm_${$scope.data.event}_${$scope.data.userId}`,
						isDestroy: true
					}
				}
			})
			.then(response => {

				// Check response
				if (util.isNull(response)) { 
					$state.go("home");
					return;
				}

				// Resolve completed
				session.promise.resolve(response);
			})
			.catch(e => {
				$state.go("home");
				return;
			});

			// Whait for all completed
			$q.all([
				session.completed, 
				language.completed
			]).then((response) => {

				// Set person, and apply change
				$scope.person = response[0];
        console.log(response);
				$scope.$applyAsync();

				// Reset asynchronous, and show card container
				$timeout(() => $element[0].querySelector('#card-container')
									 								.classList.add('show'));
			});
		}
	])

  // Username details
  .directive('ngUsernameDetails', [
    '$compile',
    'file',
    ($compile, file) => {
      return {
        replace: true,
        restrict: 'EA',
        scope: false,
        link: (scope, iElement) => {
          file.get('username_details.html', {
            subFolder: 'html',
            isContent: true,
            isMinimize: true
          }).then(template => {
            let e = $compile(template)(scope);
            iElement.replaceWith(e);
          });
        }
      };
    }
  ])

  // Navbar user
  .directive('ngNavbarUser', [
    '$timeout',
    '$compile',
    'file',
    ($timeout, $compile, file) => {
      return {
        restrict: 'EA',
        scope: false,
        
        // Compile 
				compile: () => {
					
					return {
						
						// Pre-link
						pre: (scope, iElement) => {
              file.get('user_navbar.html', {
                subFolder: 'html',
				        isContent: true,
				        isMinimize: true
              }).then(template => {
                let e = $compile(template)(scope);
                iElement.replaceWith(e);
              });
						},

            // Post-link
						post: (scope, iElement, iAttrs) => {
              $timeout(() => {
                if (iAttrs.dropdownMenuClass)
                  scope.userDropdownMenuClass = iAttrs.dropdownMenuClass;
              });
            }
          };
        }
      };
  }])

  // Form dialog header
  .directive('ngFormDialogHeader', [
    '$compile',
    'file',
    ($compile, file) => {
      return {
        restrict: 'EA',
        scope: {
          titleClass: "@",
          titleIcon: "@",
          titleTextId: '@',
          titleTextClass: '@'
        },
        
        link: (scope, iElement) => {
          file.get('user_form_dialog_header.html', {
            subFolder: 'html',
            isContent: true,
            isMinimize: true
          }).then(template => {

            let e = $compile(template)(scope);
            iElement.replaceWith(e);

            if (!scope.titleClass) scope.titleClass = 'lin-grad-blue text-white';
            if (!scope.titleIcon) scope.titleIcon = 'fa-solid fa-list-check';
            if (!scope.titleTextId) scope.titleTextId  = 'form';
            if (!scope.titleTextClass) scope.titleTextClass = '';
          });
        }
      };
  }])

  // Form dialog footer
  .directive('ngFormDialogFooter', [
    '$compile',
    'file',
    'util',
    ($compile, file, util) => {
      return {
        restrict: 'EA',
        scope: {
          formName: '<',
          identifier: "@",
          acceptId: "@",
          acceptIcon: "@",
          acceptClass: "@",
          isInEditMode: "=",
          callbackAccept: '&',
          callbackCancel: '&',
          footerClass: "@",
          linkId: "@",
          linkIcon: "@",
          linkState: "@",
          linkId2: "@",
          linkIcon2: "@",
          linkState2: "@"
        },
        
        link: (scope, iElement) => {
          file.get('user_form_dialog_footer.html', {
            subFolder: 'html',
            isContent: true,
            isMinimize: true
          }).then(template => {

            let e = $compile(template)(scope);
            iElement.replaceWith(e);

            if (!util.isString(scope.identifier)) scope.identifier = scope.acceptId;
            if (!util.isBoolean(scope.isInEditMode)) scope.isInEditMode = true;
          });
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
          preWidth: "@",
          punctuationMark: '@',
          isCapitalize: "@",
          assignments: "<"
        },
        template:`<div class="row mt-1 mb-2">
                    <div class="col-0 col-sm-4"></div>
                    <div class="col-12 col-md-8 fs-sm" ng-class="ruleClass">
                      <div class="d-inline-block" style="min-width:{{preWidth}}px;"></div>
                      {{ruleId |
                        translate: $root.lang.data |
                        assigns: assignments | 
                        capitalize: isCapitalize}}
                      {{punctuationMark}}
                    </div>
                  </div>`,
        link: (scope) => {
          if (!scope.ruleId) scope.ruleId  = 'password_rule';
          if (!scope.ruleClass) scope.ruleClass = 'text-muted';
          if (!scope.preWidth) scope.preWidth = '0';
          if (!scope.punctuationMark) scope.punctuationMark = '.';
          if (scope.isCapitalize) {
                  scope.isCapitalize = scope.isCapitalize.trim().toLowerCase();
                  scope.isCapitalize = !(scope.isCapitalize === 'false');
          } else  scope.isCapitalize = true;
        }
      };
  }]);

})(window, angular);