;(function(window, angular) {

  'use strict';

  // Application language module
  angular.module('app.language', ['app.common'])

	// Traslate
  .filter('translate', [
    'util', 
    (util) => {
      return (key, data=null, isAllowed=true) => {
        if (!util.isString(key)) return key;
        key = key.trim();
        if (!util.isBoolean(isAllowed)) isAllowed = true;
        if (!isAllowed || !util.isObjectHasKey(data, key)) return key;
        return data[key];
      }
    }
  ])

	// Language factory
  .factory('lang', [
    '$rootScope',
    'http',
    'util', 
    function($rootScope, http, util) {

      // Set service
      let service = {

        // Initialize
        init: () => {

          // Set language
          $rootScope.lang = {
            id:null, 
            type:null, 
            index:null,
            rule: {
              west: ['prefix_name','first_name','middle_name','last_name','suffix_name'],
              east: ['prefix_name','last_name','first_name','middle_name','suffix_name']
            }, 
            available:[], 
            data:{}
          };

          // Get available languages
          http.request("./lang/available.json")
          .then(data => {

            // Check/Set available languages
            $rootScope.lang.available = data;
            if (!util.isArray($rootScope.lang.available) || 
                             !$rootScope.lang.available.length) {
              $rootScope.lang.available = [{
                id    : "en",
		            type  : "west",
                name  : "english",
                local : "english",
                img   : "./image/countries/usa.png",
                valid : true
              }];
            }

            // Get/Check last language identifier
            $rootScope.lang.id = localStorage.getItem($rootScope.app.id + "_lang_id");
            if (!$rootScope.lang.id) $rootScope.lang.id = document.documentElement.lang;

            // When language id is not in available languages, then set to first
            $rootScope.lang.index = util.indexByKeyValue($rootScope.lang.available, 'id', $rootScope.lang.id);
            if ($rootScope.lang.index === -1) {
                $rootScope.lang.id    = $rootScope.lang.available[0];
                $rootScope.lang.index = 0;
            }

            // Get language type
            $rootScope.lang.type = $rootScope.lang.available[$rootScope.lang.index].type;

            // Get data
            service.get();
          })
          .catch(e => console.log(e));
        },

        // Set html language property
        setHtml: () => {
          localStorage.setItem($rootScope.app.id + "_lang_id", $rootScope.lang.id);
          document.documentElement.lang = $rootScope.lang.id;
          let title = document.getElementsByTagName("title");
          if (title.length) {
            let langKey = title[0].dataset.langKey;
            if (util.isObjectHasKey($rootScope.lang.data, langKey)) 
              document.title = util.capitalize($rootScope.lang.data[langKey]);
          }
        },

        // Get language data
        get: () => {

          http.request("./lang/" + $rootScope.lang.id + ".json")
          .then(data => {
            $rootScope.lang.data = data;
            service.setHtml();
            $rootScope.$applyAsync();
          })
          .catch(e => console.log(e));
        },

        // Set language
        set: (id) => {
          $rootScope.lang.id  = id;
          $rootScope.lang.index = util.indexByKeyValue($rootScope.lang.available, 'id', id);
          $rootScope.lang.type = $rootScope.lang.available[$rootScope.lang.index].type;
          service.get();
        }
      };

      // On language changed
      $rootScope.changeLanguage = (event) => {
        service.set(event.currentTarget.dataset.langId);
      };

      // Return service
      return service;
    }
  ]);

})(window, angular);