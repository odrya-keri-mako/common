;(function(window, angular) {

  'use strict';

  // Application language module
  angular.module('app.language', ['app.common'])

  // Traslate
  .filter('translate', [
    '$rootScope',
    'util',
    ($rootScope, util) => {
      return (key, data, isAllowed, separator) => {

				// Check parameters
				if (util.isObjectEmpty(data))
          data = $rootScope.lang.data;
        if (util.isObjectEmpty(data)) 
          return util.isString(key) ? key : '';
				if (util.isString(isAllowed))
          isAllowed = !(isAllowed.toLowerCase().trim() === 'false');
        if (!util.isBoolean(isAllowed)) isAllowed = true;
				if (!util.isString(separator)) separator = ' ';
				
				// Check key type
				if (util.isArray(key)) {
					if (!key.length) return '';
					let result = [];
					[...key].forEach(k => {
            if (util.isString(k)) {
              k = k.trim();
              if (!isAllowed || 
                  !util.isObjectHasKey(data, k) ||
                  !data[k]) 
                    result.push(k);
              else  result.push(data[k]);
            }
					});
          if (result.length)
					      return result.join(separator);
          else  return '';
				} else if (util.isString(key)) {
					key = key.trim();
					if (!isAllowed || 
            !util.isObjectHasKey(data, key) ||
            !data[key]) 
              	return key;
        	else  return data[key];
				} else 	return key;
      }
    }
  ])

	// Language factory
  .factory('lang', [
    '$rootScope',
    'http',
    'util', 
    function($rootScope, http, util) {

      // Create new event language changed
      const languageChanged = new Event("languageChanged");

      // Set service
      let service = {

        // Initialize
        init: (imgPath=null) => {

          // Check parameter image path
          if (!util.isString(imgPath)) 
            imgPath = $rootScope.app.commonPath + 'media/image/countries/';
          imgPath = imgPath.trim();
          if (!imgPath.length) imgPath = './';
          imgPath = imgPath.replaceAll('\\', '/');
          if (imgPath.slice(-1) !== '/') imgPath += '/';

          // Set language
          $rootScope.lang = {
            id:null, 
            type:null, 
            index:null,
            imgPath: imgPath,
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
          http.request({
            data: {
              methodName: "getContents",
              params    : ['available.json', {subFolder: 'lang', isMinimize: true}]
            }
          })
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

            // Set available languages shorted by name
            $rootScope.lang.available = util.arrayObjShortByKey(data, 'name');

            // Get/Check last language identifier
            $rootScope.lang.id = localStorage.getItem(service.getKey());
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

        // Get key
				getKey: () => {
					return [$rootScope.app.id, 'lang_id'].join('_');
				},

        // Set html language property
        setHtml: () => {
          localStorage.setItem(service.getKey(), $rootScope.lang.id);
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
          http.request({
            data: {
              className     : "Language/Language",
              methodName    : "get_data",
              params        : $rootScope.lang.id,
              paramsToClass : true
            }
          })
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

        // Get language identifier
        let langId = util.isString(event) ? event : event.currentTarget.dataset.langId;

        // Set current language
        service.set(langId);

        // Trigger event language changed
        document.dispatchEvent(languageChanged);
      };

      // Return service
      return service;
    }
  ])

  // Show person name order by language type
  .directive('ngPersonName', [
    () => {
      return {
        restrict: 'EA',
        replace: true,
        scope: {
          person: "<",
          personClass: "@",
        },
        template:`<span ng-class="personClass">
                    <span ng-repeat="k in $root.lang.rule[$root.lang.type] 
                          track by $index"
                          ng-if="person[k]">
                      {{person[k]}}
                    </span>
                    <span ng-if="person.name">
                      {{person.name}}
                    </span>
                  </span>`
      };
  }])

  // Navbar language
  .directive('ngNavbarLanguage', [
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
              file.get('lang_navbar.html', {
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
                  scope.langDropdownMenuClass = iAttrs.dropdownMenuClass;
              });
            }
          };
        }
      };
  }]);

})(window, angular);