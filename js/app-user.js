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
    'util',
    'msg',
    'trans',
    ($rootScope, util, msg, trans) => {

      // Set user properties
      let properties;

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
        init: (prop=null, callback=null) => {

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

          // Set user default properties
          $rootScope.user = util.objMerge({}, properties);
          $rootScope.$applyAsync();

          // Check callback function exist
          if (util.isFunction(callback)) {

            // Execute callback function
            callback();
          }
        },

        // Set
        set: (data) => {
          Object.keys(properties).forEach(key => {
            if (util.hasKey(data, key)) 
              $rootScope.user[key] = data[key];
          });
          $rootScope.$applyAsync();        
        },

        // Get
        get: () => util.objMerge({}, $rootScope.user),

        // Reset
        reset: (filter=null) => {
          if (util.isString(filter)) {
            filter = filter.replaceAll(",", ";");
            filter = filter.replaceAll(" ", "");
            filter = filter.split(';');
          }
          if (!util.isArray(filter)) filter = [];
          Object.keys(properties).forEach(key => {
            if (!filter.includes(key)) $rootScope.user[key] = null;
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
              util.localStorage('remove', 'user');
              if (util.isObjectHasKey($rootScope, 'state'))
                trans.preventState();
            }
          }
        });
      };

      // Return user
      return user;
    }
  ]);

})(window, angular);