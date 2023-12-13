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
        if (!isAllowed || 
            !util.isObjectHasKey(data, key) ||
            !data[key]) 
              return key;
        else  return data[key];
      }
    }
  ])

	// Language factory
  .factory('lang', [
    '$rootScope',
    'http',
    'util', 
    function($rootScope, http, util) {

      // Create event language changed
      const languageChanged = new Event("languageChanged");

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

          // Check application properties
          if (!util.isObjectHasKey($rootScope, 'app'))
            $rootScope.app = {};
          if (!util.isObjectHasKey($rootScope.app, 'id'))
            $rootScope.app.id = util.getPageId();

          // Get available languages
          http.request("./lang/available.json")
          .then(data => {

            // Check response data
            if (util.isArray(data) && data.length) {

              // Each available languages
              data = data.map(o => {

                // Merge language properties with default
                o = util.objMerge({
                  id		: null,
                  type	: "west",
                  name	: null,
                  local	: null,
                  img		: null,
                  valid	: true
                }, o, true);

                // Check/Set language properties
                if (util.isString(o.id) && !util.isEmpty(o.id)) {
                  o.id = o.id.trim().toLowerCase();
                  if (!util.isString(o.type)) o.type = 'west';
                  o.type = o.type.trim().toLowerCase();
                  if (!['west','east'].includes(o.type)) o.type = 'west';
                  if (!util.isString(o.name) || util.isEmpty(o.name)) o.name = o.id;
                  o.name = o.name.trim().toLowerCase();
                  if (!util.isString(o.local) || util.isEmpty(o.local)) o.local = o.name;
                  o.local = o.local.trim().toLowerCase();
                  if (!util.isString(o.img) || util.isEmpty(o.img)) o.img = `${o.id}.png`;
                  if (!util.isBoolean(o.valid)) o.valid = true;
                } else o.valid = false;
                return o;
              }).filter(o => o.valid).unique('id');
            }

            // When there is no data, set it to default
            if (!util.isArray(data) || !data.length) {
              data = [{
                id    : "hu",
		            type  : "east",
                name  : "hungarian",
				        local : "magyar",
                img   : "hun.png",
                valid : true
              }];
            }

            // Set available languages
            $rootScope.lang.available = data;

            // Get/Check last language identifier
            $rootScope.lang.id = localStorage.getItem($rootScope.app.id + "_lang_id");
            if (!$rootScope.lang.id) $rootScope.lang.id = document.documentElement.lang;

            // When language id is not in available languages, then set to first
            $rootScope.lang.index = util.indexByKeyValue($rootScope.lang.available, 'id', $rootScope.lang.id);
            if ($rootScope.lang.index === -1) {
                $rootScope.lang.id    = $rootScope.lang.available[0].id;
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
        },

        // Translate
        translate: (key, isUpper=false) => {
          if (!util.isString(key)) return key;
          key = key.trim();
          if (!key) return key;
          if (!util.isBoolean(isUpper)) isUpper=false;
          if (util.isObjectHasKey($rootScope.lang.data, key)) {
            if (isUpper)
                  return util.capitalize($rootScope.lang.data[key]);
            else  return $rootScope.lang.data[key];
          } return key;
        }
      };

      // On language changed
      $rootScope.changeLanguage = (event) => {
        service.set(event.currentTarget.dataset.langId);
        document.dispatchEvent(languageChanged);
      };

      // Return service
      return service;
    }
  ])

  // Navbar language
  .directive('ngNavbarLanguage', [
    () => {
      return {
        replace: true,
        scope: false,
        templateUrl:`./html/navbar/navigate_language.html`
      };
  }]);

})(window, angular);