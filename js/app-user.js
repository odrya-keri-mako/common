;(function(window, angular) {

  'use strict';

  // Application user module
  angular.module('app.user', [
    'app.common',
		'app.message',
  ])

	// User factory
  .factory('user', [
    '$rootScope',
    '$state',
    'util',
    'msg',
    ($rootScope, $state, util, msg) => {

      // Set user properties, and root scope user key
      let properties,
          userKey;

      // Set local methods
      let methods = {

        // Default user properties
        default: () => {
          return {
            id          : null,
            type        : null,
            first_name  : null,
            middle_name : null,
            last_name   : null,
            gender      : null,
            email       : null 
          };
        }
      };

      // Set user
      let user = {

        // Initialize
        init: (prop=null, key=null) => {

          // Check user properties
          if (util.isString(prop)) {
            prop = prop.replaceAll(",", ";");
            prop = prop.replaceAll(" ", "");
            prop = prop.split(';');
          }
          if (util.isObject(prop))
                properties = util.objMerge({}, prop);
          else if (util.isArray(prop) && prop.length)
                properties = prop.reduce((o, k) => (o[k] = null, o), {});
          else  properties = util.objMerge({}, methods.default());

          // Check root scope user key
          if (util.isString(key))
            key = key.replaceAll(" ", "");
          if (util.isString(key) && key.length)
                userKey = key;
          else  userKey = 'user';

          // Set user default properties
          $rootScope[userKey] = util.objMerge({}, properties);
        },

        // Set
        set: (data) => {
          Object.keys(properties).forEach(key => {
            if (util.hasKey(data, key)) 
              $rootScope[userKey][key] = data[key];
          });
          $rootScope.$applyAsync();
        },

        // Get
        get: () => properties,

        // Reset
        reset: (filter=null) => {
          if (util.isString(filter)) {
            filter = filter.replaceAll(",", ";");
            filter = filter.replaceAll(" ", "");
            filter = filter.split(';');
          }
          if (!util.isArray(filter)) filter = [];
          Object.keys(properties).forEach(key => {
            if (!filter.includes(key)) $rootScope[userKey][key] = null;
          });
          $rootScope.$applyAsync();
        }
      };

      // Logout
      $rootScope.logout = () => {
        msg.show({
          icon      : "text-primary fa-solid fa-circle-question",
          content   : "Biztosan kijelentkezik?",
          isConfirm	: true,
          callback  : (response) => {
            if (response === 'ok') {
              user.reset();
              if (util.isObjectHasKey($rootScope, 'state')) {
                if ($rootScope.state.disabled.includes($rootScope.state.id)) {
                  if ($rootScope.state.disabled.includes($rootScope.state.prev))
                        $state.go($rootScope.state.default);
                  else  $state.go($rootScope.state.prev); 
                }
              }
            }
          }
        });
      };

      // Return user
      return user;
    }
  ]);

})(window, angular);