/*!
 * Common angular  v1.0
 */
;(function(window, angular) {

  'use strict';

  // Add class(es)
  HTMLElement.prototype.addClass = (function(classList) {
    let element = this; 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.add(c));
    }
  });

  // Remove class(es)
  HTMLElement.prototype.removeClass = (function(classList) {
    let element = this;  
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.remove(c));
    }
  });

  // Toogle class(es)
  HTMLElement.prototype.toggleClass = (function(classList) {
    let element = this; 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => element.classList.toggle(c));
    }
  });

  // Sort array randomly
  Array.prototype.random = function() {
    return this.sort((a, b) => Math.random() - 0.5);
  };
  
  // Unique array
  Array.prototype.unique = function(key=null) {
    let arr = this;
    if (Object.prototype.toString.call(key) === '[object String]')
          return [...new Map(arr.filter(obj => key in obj).map(obj => [obj[key], obj])).values()];
    else 	return [...new Set(arr)];
  };

  // Convert day to string format (YYYY-mm-dd)
  Date.prototype.toISOFormat = function() {
    return this.toISOString().split('T')[0];
  }

  // Application common module
  angular.module('app.common', [])

  // Capitalize
  .filter('capitalize', [
    'util', 
    (util) => {
      return (str, isAllowed=null) => {

        // Check parameters
        if (!util.isString(str) ||
            !(str = str.trim()).length) return str;
        if (util.isString(isAllowed))
          isAllowed = util.strToBoolean(isAllowed, true);
        if (!util.isBoolean(isAllowed)) isAllowed = true;
        if (!isAllowed) return str;
        return util.capitalize(str);
      }
    }
  ])

  // Assigns assignments
  .filter('assigns', [
    'util', 
    (util) => {
      return (str, assignments=null) => {

        // Check parameters
        if (!util.isString(str)) return str;
        if (util.isString(assignments)) 
          assignments = util.strToArray(assignments);
        if (util.isArray(assignments))
          assignments = assignments.reduce((o, k) => (o[k] = '', o), {});
        if (!util.isObject(assignments)) return str;
        let keys = util.substrBetween(str);
        if (keys.length) {
          keys.forEach(key => {
            if (util.isObjectHasKey(assignments, key))
              str = str.replaceAll(`{{${key}}}`, assignments[key]);
          });
                return str;
        } else  return str;
      }
    }
  ])

  // Number thousand separator
  .filter('numSep', [
    'util',
    (util) => {
      return (number, separator) => 
        util.mumberToStringThousandSeparator(number, separator)
    }
  ])

  // Number leading zero
  .filter('numPad', [
    'util',
    (util) => {
      return (number, len) => {
      
		  	// Check parameters
		  	if (!util.isNumber(number)) number = 0;
        if (!util.isNumber(len) || len < 2) len = 2;
        return ('0'.repeat(len) + number.toString()).slice (-1 * len);
      };
    }
  ])

  // Add to number pixel property
  .filter('pixel', [
    'util',
    (util) => {
      return (number) => {
        if (!util.isVarNumber(number)) number = 0;
        return number + 'px';
      };
    }
  ])

	// Utilities factory
  .factory('util', [
    '$interval',
    '$q',
    ($interval, $q) => {

      // Set utilities
      let util = {

        variableType: checkedVar => Object.prototype.toString.call(checkedVar).slice(8, -1).toLowerCase(),
				isUndefined: checkedVar => Object.prototype.toString.call(checkedVar) === '[object Undefined]',
    		isNull: checkedVar => Object.prototype.toString.call(checkedVar) === '[object Null]',
    		isBoolean: checkedVar => 	Object.prototype.toString.call(checkedVar) === '[object Boolean]',
    		isNumber: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Number]',
    		isInt: checkedVar => util.isNumber(checkedVar) && checkedVar % 1 === 0,
    		isFloat: checkedVar => util.isNumber(checkedVar) && checkedVar % 1 !== 0,
    		isVarNumber: checkedVar => util.isNumber(checkedVar) ||
    		                          (util.isString(checkedVar) && !isNaN(Number(checkedVar))),
    		isString: checkedVar => 	Object.prototype.toString.call(checkedVar) === '[object String]',
    		isDate: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Date]',
    		isArray: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Array]',
    		isObject: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Object]',
        isFile: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object File]',
        isEmpty: checkedVar => {
          let variableType = util.variableType(checkedVar);
          switch (variableType) {
            case 'undefined':
            case 'null':
              return true;
            case 'string':
              return util.isStringBlank(checkedVar);
            case 'number':
              return checkedVar === 0;
            case 'boolean':
              return !checkedVar;
            case 'date':
              return !Date.parse(checkedVar);
            case 'array':
              return checkedVar.length === 0;
            case 'object':
              return util.isObjectEmpty(checkedVar);
            default:
              return true;
          }
        },
        isStringBlank: checkedVar => !checkedVar || /^\s*$/.test(checkedVar),
				isObjectEmpty: checkedVar => {
					if (util.isObject(checkedVar)) {
						for(var prop in checkedVar) {
							if(checkedVar.hasOwnProperty(prop))
										return false;
							else  return true;
						}
            return true;
					} else return true;
				},
        hasKey: (checkedVar, key) => util.isString(key) && key in checkedVar,
				isObjectHasKey: (checkedVar, key) =>  util.isObject(checkedVar) && util.hasKey(checkedVar, key),
				objFilterByKeys: (obj, filter, isExist=true) => {
						if (!util.isObject(obj)) return obj;
						if (util.isString(filter)) {
              filter = filter.replaceAll(';', ',');
              filter = filter.split(",");
            }
            if (!util.isArray(filter) || !filter.length)
              return Object.assign({}, obj);
            if (!util.isBoolean(isExist)) isExist = true;
						return  Object.assign({}, 
										Object.keys(obj)
										.filter((k) => {
                      if (isExist) 
                            return filter.includes(k);
                      else  return !filter.includes(k); 
                    }).reduce((o, k) => Object.assign(o, {[k]: obj[k]}), {}));
				},
        arrayObjFilterByKeys: (arr, filter, isExist=true) => {
          if (!util.isArray(arr) || !arr.length) return arr;
          return arr.map((obj) => {
            return util.objFilterByKeys(obj, filter, isExist);
          });
        },
        arrayObjShortByKey: (arr, key, isAscending=true) => {
          if (!util.isBoolean(isAscending)) isAscending = true;
          if (isAscending)
                return arr.sort((a, b) => a[key] < b[key] ? -1 : (a[key] > b[key] ?  1 : 0));
          else  return arr.sort((a, b) => a[key] < b[key] ?  1 : (a[key] > b[key] ? -1 : 0));
        },
        arrayObjUniqueByKeys: (arr, keys, isKeepFirst=true) => {
			  	if (util.isString(keys)) 
            keys = keys.replaceAll(';', ',').split(',');
          if (!util.isBoolean(isKeepFirst)) isKeepFirst = true;
			  	return Array.from(
			  			arr.reduce((map, e) => {
			  					let key = keys.map(k => [e[k], typeof e[k]])
			  												.flat().join('-');
			  					if (isKeepFirst && map.has(key)) return map;
			  					return map.set(key, e);
			  			}, new Map()).values()
			  	)
			  },
				objMerge: (target, source, existKeys) => {
						if (!util.isObject(target)) target = {};
						if (!util.isObject(source)) source = {};
						if (util.isBoolean(existKeys) && existKeys)
										return  Object.assign({}, target, util.objFilterByKeys(source, Object.keys(target)));
						else    return  Object.assign({}, target, source);
				},
        indexByKeyValue: (a, k, v) => a.findIndex(o => o[k] === v),
    		isFunction: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Function]',
    		isClass: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Class]',
    		isBlob: checkedVar =>	Object.prototype.toString.call(checkedVar) === '[object Blob]',
    		isJson: checkedVar => {
    		    if (util.isString(checkedVar)) {
    		        try       {return !util.isUndefined(JSON.parse(checkedVar));} 
    		        catch (e) {return false;}	
    		    } else return false;
    		},
        isJQuery: () => typeof jQuery !== 'undefined',
        isJQueryElement: checkedVar =>  util.isJQuery() && 'nodeType' in checkedVar.get(0),
				isNodeElement: checkedVar =>	checkedVar instanceof Element || 
  			                              checkedVar instanceof HTMLElement,
  			isNodeList: checkedVar =>	checkedVar instanceof NodeList ||
  			                          checkedVar instanceof HTMLCollection,
				cloneVariable: variable => {
					if (!util.isUndefined(variable)) {
							if (util.isDate(variable)) 
											return new Date(JSON.parse(JSON.stringify(variable)));
							else    return JSON.parse(JSON.stringify(variable));
					} else      return undefined;
				},
				indexOfElement: (nodeList, element) => Array.from(nodeList).indexOf(element),
    		indexByKeyValue: (arr, key, value) => {
    		  if ('length' in arr && arr.length && util.isString(key)) {
    		    for (let i=0; i < arr.length; i++)
    		      if (key in arr[i] && arr[i][key] === value) return i;
    		  }
    		  return -1;
    		},
        isEmail: checkedVar =>  util.isString(checkedVar) &&
                                /^([a-z0-9_.+-])+\@(([a-z0-9-])+\.)+([a-z0-9]{2,4})+$/i.test(checkedVar),
        isPassword: checkedVar => util.isString(checkedVar) &&
                                  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/.test(checkedVar),
        isPhoneNumber: checkedVar => util.isString(checkedVar) &&
                        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/.test(checkedVar),
        upToLowHyphen: (str) => str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase(),
        lowToUpHyphen: (str) => str.replace(/(-.)/g, (x) => {return x[1].toUpperCase();}),
        strToBoolean: (str, def=false) => {
          if (util.isString(str)) 
                return str.toLowerCase().trim() === 'true';
          else  return def;
        },
        strToArray: (str) => {
          if (util.isString(str)) { 
                  str = str.trim().replaceAll(",", ";");
                  return str.split(";").map(e => e.trim()).filter(Boolean);
          } else  return [];
        },
        substrBetween: (str, beg=null, end=null) => {
          if (!util.isString(str)) return [];
          if (!util.isString(beg) ||
              !(beg = beg.trim()).length) beg = '{{';
          if (!util.isString(end) ||
              !(end = end.trim()).length) end = '}}';
          let regex = new RegExp(`(?<=${beg})(.*?)(?=${end})`, 'g');
          return str.match(regex) || [];
        },
        capitalize: (str, isLowerEnd=true) => {
          if (!util.isString(str) ||
              !(str = str.trim()).length) return str;
          if (str.length === 1) return str.toUpperCase();
          if (!util.isBoolean(isLowerEnd)) isLowerEnd = true;
          return  str.charAt(0).toUpperCase() + (isLowerEnd ?
                  str.substr(1).toLowerCase() : str.substr(1));
        },
        getLocation: (key=null) => {
          if (!util.isString(key)) key = 'origin';
          key = key.toLowerCase().trim();
          if (!util.hasKey(window.location, key)) key = 'origin';
          return window.location[key];
        },
        getPageId: () => {
          let pageId = util.getLocation('pathname').toLowerCase();
          if (pageId[0] === '/') pageId = pageId.slice(1);
          if (pageId.slice(-1) === '/') pageId = pageId.slice(0, -1);
          return pageId;
        },
        getPageUrl: () => {
          return util.getLocation() + '/' + util.getPageId() + '/';
        },
        getCommonRelativePath: () => {
          let page    = (document.location.origin + document.location.pathname).toLowerCase(),
              common  = [...document.querySelectorAll('script[src]:not([src=""])')].filter((item) =>
                item.src.includes('/common/js/common-angular.js') ||
                item.src.includes('/common/js/common-angular.min.js')
              );
          if (common.length) 
                common = common[0].src.toLowerCase();
          else  common = null;
          if (common) {
            common = common.substr(0, common.indexOf('/common/js/common-angular.')+1);
            if (common) {
                    common = page.replace(common, '');
                    if (common) 
                          common = '../'.repeat(common.split('/').filter(Boolean).length);
                    else  common = './';
                    common += 'common/';
            } else  common = null;
          }
          return common;
        },
        isInViewport: (element, parent, type) => {
          if (!util.isNodeElement(element) ||
              !util.isNodeElement(parent)) return false;
          if (!util.isString(type)) type = 'xy';
          type = type.trim().toLowerCase().replace(/[^xy]/g, '');
          type = [...new Set(type)].sort().join('');
          if (!type) type = 'xy';
          let elementRect       = element.getBoundingClientRect(),
              parentRect        = parent.getBoundingClientRect(),
              scrollbarWidth    = parent.offsetWidth   - parent.clientWidth,
              scrollbarHeight   = parent.offsetHeight  - parent.clientHeight,
              isHorizontalView  = parentRect.left <= elementRect.left &&
                                  parentRect.right - scrollbarWidth >= elementRect.right,
              isVerticalView    = parentRect.top <= elementRect.top &&
                                  parentRect.bottom - scrollbarHeight >= elementRect.bottom;
          return  (!type.includes('x') || isHorizontalView) &&
                  (!type.includes('y') || isVerticalView);
        },
        getTestCode: (codeLength) => {
	      	if (!util.isNumber(codeLength) || codeLength < 5) codeLength = 5;
	      	if (codeLength > 34) codeLength = 34;
        
	      	let letters		= 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(''),
	      			numbers		= '123456789'.split(''),
	      			testCode	= [];
        
	      	let ind = Math.floor(Math.random()*letters.length);
	      	testCode.push(letters[ind]);
	      	letters.splice(ind, 1);
        
	      	ind = Math.floor(Math.random()*letters.length);
	      	testCode.push(letters[ind].toLowerCase());
	      	letters.splice(ind, 1);
        
	      	ind = Math.floor(Math.random()*numbers.length);
	      	testCode.push(numbers[ind]);
	      	numbers.splice(ind, 1);
        
	      	let merged	= [].concat.apply([], [numbers, numbers, letters])
	      									.sort(() => {return 0.5-Math.random();}),
	      										filter = (a, c) => {
	      											return $.map(a, (v) => {if (v !== c) return v;});
	      										};
                          
	      	if (testCode.length < codeLength) {
	      		for (let i=testCode.length; i < codeLength; i++) {
	      			ind = Math.floor(Math.random()*merged.length);
	      			let c	= merged[ind];
	      			testCode.push(c[Math.random() < 0.5 ? 'toLowerCase' : 'toUpperCase']());
	      			merged = filter(merged, c);
	      		}
	      	}
	      	return testCode.sort(() => {return 0.5-Math.random();})
	      								 .join('').substring(0, codeLength);
	      },
        randomNumber: (min, max, step) => {
          min		= util.isInt(min) 	&& min >= 0	 ? min : 0;
          max		= util.isInt(max) 	&& max > min ? max : min+1;
          step	= util.isInt(step)	&& step > 0 && step <= max-min ? step : 1;
          return min + (step * Math.floor(Math.random() * (max-min+1) / step));
        },
        isBase64: (checkedVar) => {
          if (util.isString(checkedVar) && checkedVar.trim().length) {
            try {
              let encoded = util.base64Encode(checkedVar);
              return checkedVar === util.base64Decode(encoded);
            } catch (e) {
              return false;
            }
          } else return false;
        },
        base64Decode: (str) => {
			    return	decodeURIComponent(Array.prototype.map.call(
                    atob(str.replace(/\s/g, '')), (c) => {
								        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
							      }
                  ).join(''));
	      },
        base64Encode: (str) => {
          return	btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                    return String.fromCharCode('0x' + p1);
                  }));
        },
        base64ToUrl: (type, data) => `data:${type};base64,${data}`,
        base64Tofile: (type, data, name) => {
          return new Promise((resolve, reject) => {
            fetch(util.base64ToUrl(type, data))
            .then(response => response.blob())
            .then(result => {
              if (!util.isString(name)) name = '';
              resolve(new File([result], name, {type: type}));
            });
          });
        },
        getBase64UrlData: (url) => {
          let data = '';
          if (util.isString(url)) {
            data = url.toString().replace(/^data:(.*,)?/, '');
            if ((data.length % 4) > 0) data += '='.repeat(4 - (data.length % 4));
          }
          return data;
        },
        // getBase64UrlType: (url) => {
        //   let type = '';
        //   if (util.isString(url))
        //     type = url.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
        //   return type;
        // },
        fileReader: (file, options) => {

          // Create promise
          return new Promise((resolve, reject) => {

            // Check file is valid
            if (util.isFile(file)) {

              // Check/Convert options
              if (util.isString(options))
                options = {method: options};

              // Merge options with default
              options = util.objMerge({
                method  : 'readAsText',
                limit   : null,
                unit    : 'KB'
              }, options, true);

              // Check options method
              if (!util.isString(options.method))
                options.method = 'readAsText';
              options.method = options.method.trim();
              if (![
                'readAsArrayBuffer','readAsBinaryString',
                'readAsDataURL','readAsText'
              ].includes(options.method))
                options.method = 'readAsText';

              // Check options size limit
              if (!util.isInt(options.limit) || options.limit <= 0)
                options.limit = null;

              // Set size
              let size = options.limit;

              // Check size limit exist
              if (size) {
            
                // Create variable units
                let units = ["Byte", "KB", "MB", "GB", "TB"];

                // Check parameter size unit
                if (!util.isString(options.unit)) options.unit = 'KB';
                options.unit = options.unit.trim();
                if (options.unit.length === 2)
                      options.unit = options.unit.toUpperCase();
                else  options.unit = util.capitalize(options.unit);
                if (!units.includes(options.unit)) options.unit = 'KB';
                let multiplier = units.indexOf(options.unit);

                // Convert size limit to byte
                if (multiplier) while(multiplier--) size *= 1024;
              }

              // Check size limit exist, or file size is less then size limit
              if (!size || file.size <= size) {

                // Create file reader, and convert file to base64
                let reader = new FileReader();
                reader.onload   = () => resolve(reader.result);
                reader.onerror  = () => reject(`File read error: ${file.name}!`);
                reader[options.method](file);

              } else  reject(`File size limited: ${parseInt(options.limit)} ${options.unit}!`);
            } else    reject('Invalid parameter: file!');
          });
        },
        fileAllowedTypes: (file, types=null) => {

          // Create promise
          return new Promise((resolve, reject) => {

            // Check file is valid
            if (util.isFile(file)) {

              // Check parameter allowed types
              if (util.isString(types)) {
                types = types.trim().toLowerCase();
                if (['*', '*.*'].includes(types))
                      types = null;
                else  types = types.replace('*','').split(',').filter(()=>true);
              }

              // Check allowed types exist
              if (util.isArray(types) && types.length) {
                let isAllowed = false, 
                    mimeType  = file.type.toLowerCase();
                for(let i=0; i<types.length; i++) {
                  if (mimeType.includes(types[i].trim())) {
                    isAllowed = true;
                    break;
                  }
                }
                if (isAllowed)
                      resolve();
                else  reject('Invalid file type!');
              } else  resolve();
            } else    reject('Invalid parameter: file!');
          });
        },
        getComponentVersion: (componentName, tagName) => {
          return new Promise((resolve, reject) => {
            if (util.isString(componentName)) {
              componentName = componentName.trim();
              if (componentName.length) {
                if (!util.isString(tagName))
                  tagName = 'link';
                tagName = tagName.trim().toLowerCase();
                if (!['link', 'script'].includes(tagName))
                  tagName = 'link';
                let attribute = tagName === 'link' ? 'href' : 'src',
                    element 	= document.querySelector(`${tagName}[${attribute}*="${componentName}"]`);
                if (element) {
                  let url = element.getAttribute(attribute);
                  if (url && url.length) {
                    try {
                      fetch(url)
                      .then(response => {
                        if (response.ok)
                              return response.text();
                        else	return reject(`Unable to read (${url})!`); 
                      })
                      .then(response => {
                        if (response) {
                          let matches 	= response.match(/(?!v)([.\d]+[.\d])/);
                          if (matches && matches.length > 0)
                                resolve(matches[0]);
                          else 	reject(`Missing version property (${tagName}/${componentName})!`);
                        }
                      });
                    } catch (e) {
                      reject(e.message);
                    }
                  } else reject(`Missing url attribute (${tagName}/${componentName})!`);
                } else reject(`Unable to find element (${tagName}/${componentName})!`);
              } else reject(`Component name is empty!`);
            } else reject(`Missing component name!`);	
          });
        },
        deferredObj: () => {
          let defer = $q.defer();
          return {promise: defer, completed: defer.promise};
        },
        sleep: async (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
        sleepUntil: (callBack, delay) => {
          return new Promise((resolve, reject) => {
            if (!util.isFunction(callBack)) {
              reject('Missing function!');
              return;
            }
            if (callBack()) {
              if (!util.isInt(delay) || delay < 0) delay = 1;
              let startTime   = new Date(),
                  intervalID  = $interval(() => {
                if (!callBack()) {
                  $interval.cancel(intervalID);
                  resolve();
                  return;
                } else if ((new Date()) - startTime > 5000) {
                  $interval.cancel(intervalID);
                  reject('Time overflow!');
                  return;
                }
              }, delay);
            } else resolve();
          });
        },
				intersectionObserverInit: (options, fnCallBack) => {

          // Check/Set options
          if (util.isString(options)) options = {skeleton: options};
          options = util.objMerge({
            skeleton  : undefined,      // Skeleton element(s)
            root      : undefined,			// Bounding parent element
						rootMargin: undefined,	    // Offset (margin)
						threshold : undefined		    // Numbers between 0.0:1.0 (1-hall element visible)
          }, options, true);
          if (!util.isString(options.skeleton) ||
              !(options.skeleton = options.skeleton.trim()).length)
            return;

          // Check call back function exist
          if (!util.isFunction(fnCallBack)) fnCallBack = null;

					// Create new intersection observer
    		  let observer = new IntersectionObserver(entries => {

						// Each entries
    		    entries.forEach(entry => {

							// Check is in viewport
    		      if (entry.isIntersecting)
    		        		entry.target.classList.add('show');
    		      else 	entry.target.classList.remove('show');

              // When call back function exist, then execute
              if (fnCallBack) fnCallBack(entry.target, entry.isIntersecting);
    		    });
    		  }, options);

					// Get elements
          let elements = document.querySelectorAll(options.skeleton);
          if (elements.length) {
            elements.forEach(element => {
              observer.observe(element);
            });
          }
    		},
        mumberToStringThousandSeparator: (number, separator) => {
		  	  if (!util.isVarNumber(number)) number = 0;
		  	  if (!util.isString(separator)) separator = ' ';
          return number.toString()
		  	  						 .replace(/(\d)(?=(\d{3})+(?!\d))/g,
		  	  										'$1' + separator.charAt(0)); 
        }
			};

			// Return utilities
      return util;
    }
  ])

	// Http request factory
	.factory('http', [
    '$http',
		'util', 
    ($http, util) => {

      return {

        // Request
				request: (options, method=null) => {

					// Create promise
					return new Promise((resolve, reject) => {

            // Get common path
            const COMMON_PATH = util.getCommonRelativePath();

            // Set is blob property (fetch)
            let isBlob  = false;

            // Set methods
            let methods = {

              // Initialize
              init: () => {
                
                // Check options property
                if (util.isString(options))  options = {url: options};
                if (!util.isObject(options)) options = {};
                if (!util.isObjectHasKey(options, 'url'))
                  options.url = `${COMMON_PATH}php/common.php`;

                // Check method property
                if (!util.isString(method)) method = 'ajax';
                method = method.trim().toLowerCase();
                if (!['ajax', 'fetch', 'http', 'xml'].includes(method)) method = 'ajax';
                if (method === 'ajax' && !util.isJQuery()) method = 'fetch';

                // Check response content type
                if (util.isObjectHasKey(options, 'responseType') &&
                    util.isString(options.responseType)) 
                  isBlob = options.responseType.trim().toLowerCase() === 'blob';

                // Merge options with default
                options = methods.options(options);

                // Requiest
                methods[method](options);
              },

              // Options
              options: options => {

                // Check options method
                if (util.isObjectHasKey(options, 'method')) {
                  if (!util.isString(options.method)) 
                    options.method = 'GET';
                  options.method.trim().toUpperCase();
                  if (!['GET','POST'].includes(options.method)) 
                    options.method = 'GET';
                }

                // Check options url is common.php (common path)
                if (options.url === `${COMMON_PATH}php/common.php`) {

                  // Check options parameter property
                  if (!util.isObjectHasKey(options, 'data'))
                    options.data = {};
                  if (util.isString(options.data)) 
                    options.data = {require: options.data};
                  if (!util.isObject(options.data))
                    options.data = {};

                  // Check/Set page identifier
                  if (!util.isObjectHasKey(options.data, 'app') ||
                      !util.isObject(options.data.app))
                    options.data.app = {};
                  options.data.app.id = util.getPageId();
                }

                // Check/Set params
                if (util.isObjectHasKey(options, 'data') && 
                   !util.isUndefined(options.data)) {

                  // Check method
                  if (method !== 'ajax') {
                          options.method  = 'POST';
                          options.data    = JSON.stringify(options.data);                         
                  } else  options.data    = {data: JSON.stringify(options.data)};
                  if (method === 'fetch') {
                    options.body = options.data;
                    delete options.data;
                  }
                }

                // Switch method type
                switch(method) {

                  case 'ajax':

                    // Check/Set response type
                    if (util.isObjectHasKey(options, 'responseType')) {     
                      options.xhrFields = {responseType: options.responseType};
                      delete options.responseType;
                    }

                    // Merge with default
                    return util.objMerge({
                      url         : undefined,
                      method      : 'GET',
                      data        : undefined,
                      async       : true,
                      crossDomain : true,
                      timeout     : 300000,
                      cache       : true,
                      contentType : undefined,
                      processData : true,
                      dataType    : undefined,
                      xhrFields   : undefined
                    }, options, true);

                  case 'fetch':

                    // Merge with default
                    return util.objMerge({
                      url           : undefined,
                      method        : 'GET',
                      body          : undefined,
                      mode          : 'cors',
                      cache         : 'no-cache',
                      credentials   : 'same-origin',
                      headers       : {'Content-Type': undefined},
                      redirect      : 'follow',
                      referrerPolicy: 'strict-origin-when-cross-origin'
                    }, options, true);

                  case 'http':

                    // Merge with default
                    return util.objMerge({
                      url: undefined,
                      method: 'GET',
                      data: undefined,
                      headers: {'Content-Type': undefined},
                    }, options, true);

                  case 'xml':

                    // Merge with default
                    return util.objMerge({
                      url         : undefined,
                      method      : 'GET',                               
                      data        : undefined,
                      contentType : undefined,
                      responseType: "text"
                    }, options, true);
                }
              },

              // AJAX jQuery Http request
              ajax: (options) => {

                $.ajax({
                  url     	  : options.url,
                  type    	  : options.method,	                	
	              	async   	  : options.isAsync,
	              	crossDomain : options.crossDomain,
	              	timeout		  : options.timeout,
	              	cache       : options.cache,
	              	contentType : options.contentType,
	              	processData : options.processData,
	              	dataType    : options.dataType,
                  xhrFields   : options.xhrFields,
                  data    	  : options.data,
                  success: result => methods.check(result),
                  error: (e) => reject(e.statusText)
                });
              },

              // FETCH Http request
              fetch: (options) => {

                // Get url, and remove from options
                let url = options.url;
                delete options.url;

                fetch(url, options)
                .then((response) => {
                  if (response.status >= 200 && response.status < 300) {
                      if (isBlob)
                              return response.blob();
                      else    return response.text();
                  } else      reject(response.statusText);
                })
                .then(result => methods.check(result));
              },

              // Http request
              http: (options) => {

                $http({ 
                  url     : options.url, 
                  method  : options.method,
                  params  : options.params, 
                  data    : options.data,
                  headers : options.headers
                })
                .then( 
                  function(response) {
                    if (response.status >= 200 && response.status < 300) {
                            methods.check(response.data);
                    } else  reject(response.statusText);
                  },
                  function (error) {
                    reject(error.statusText);
                  }
                );
              },

              // XML Http request
              xml: (options) => {

                let xhr = new XMLHttpRequest();
                xhr.open(options.method, options.url, true);
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                          let result = xhr.response;
                          methods.check(result);
                  } else  reject(xhr.statusText);
                };
                xhr.onerror = () => reject(xhr.statusText);
                xhr.setRequestHeader("Content-Type", options.contentType);
                xhr.responseType = options.responseType;
                xhr.send(options.data);
              },

              // Check result
              check: result => {
                if (!util.isBlob(result)) {
                  if (util.isJson(result)) result = JSON.parse(result);
                  if (util.isObjectHasKey(result, "error") && 
                     !util.isNull(result.error))
                        reject(result.error);
                  else if (util.isObjectHasKey(result, "data")) {
                    if (util.isJson(result.data))
                          resolve(JSON.parse(result.data));
                    else  resolve(result.data);
                  } else	resolve(result);
                } else	  resolve(result);
              }
            };

            // Initialize
            methods.init();
        	});
				}
			};
    }
  ])

  // File factory
  .factory('file', [
    'util',
    'http',
    (util, http) => {

      // Define method name
      let methodName;

      // Set service
      let service = {

        // Get
        get: (fileName=null, args=null) => {

          // Check File name
          if (!util.isString(fileName)) return null;

          // Check arguments
          args = service.checkArguments(args);

          // Serch for file, and get url, or content
          return  http.request({
                    data: {
                      methodName: methodName,
                      params    : [fileName, args]
                    }
                  })
                  .then(response => response)
                  .catch(e => {console.log(e); return null;});
        }, 
        
        // Check arguments
        checkArguments: (args) => {

          // Check/Conver arguments
          if (util.isString(args))  args = {subFolder: args.trim()};
          if (util.isBoolean(args)) args = {isContent: args};

          // Merge arguments with default
          args = util.objMerge({
            subFolder: null,
		        isRecursive: true,
            isContent: false,
		        isMinimize: false
          }, args, true);

          // Set method
          methodName = args.isContent ? "getContents" : "searchForFile";
          delete args.isContent;
          if (methodName === "searchForFile")
            delete args.isMinimize;

          // Returnarguments
          return args;
        }
      }

      // Return service
      return service;
    }
  ])

  // Transaction events factory
  .factory('trans', [
    '$transitions',
    '$state',
    '$rootScope',
    '$timeout',
    'util',
    ($transitions, $state, $rootScope, $timeout, util) => {

      // Go to previous state
			$rootScope.goToPreviousState = (isReload=false, isEnabled=true) => {
      
        // Check/Set parameters
        if (!util.isBoolean(isReload )) isReload 	= false;
        if (!util.isBoolean(isEnabled)) isEnabled = false;

        // Check/Set state key
        let key = isEnabled ? 'prevEnabled' : 'prev';

        // Check state exist, andgot to state
        if ($rootScope.state[key])
              $state.go(
                $rootScope.state[key], 
                $rootScope.state.params[key], 
                {reload: isReload}
              );
        else	$state.go(
                $rootScope.state.default, 
                {}, 
                {reload: isReload}
              );
			};

      return {
        /**
         * Events
         * @param {*} options disable state(s) by name, parent, and group 
         *                    property when refresh page
         * @param {boolean} scrollTop   scroll to top when refresh page
         */
        events: (options=null, scrollTop=true) => {

          // Set application properties
          $rootScope.app = {
            id            : util.getPageId(),
            url           : util.getPageUrl(),
            commonPath    : util.getCommonRelativePath(),
            currentDay    : new Date()
          };

          // Check/Merge/Convert options with default
          if (!util.isObject(options)) options = {name: options};
          options = util.objMerge({
            name: null,
            parent: null,
            group: null
          }, options, true);
          Object.keys(options).forEach(key => {
            if (util.isString(options[key])) {
              options[key] = options[key].replaceAll(';', ',').split(',');
              options[key] = options[key].map(name => name.trim())
                                         .filter(name => name !== '');
            }
            if (!util.isArray(options[key])) options[key] = [];
          });
          
          // Define state properties
          $rootScope.state = {
            id          : null,
            default     : null,
            prev        : null,    
            prevEnabled : null,
            params      : {
              prev        : null,
              prevEnabled : null
            },
            parent      : null,
            group       : null
          };
          
          // Get available states
          $rootScope.state.available = 
            $state.get()
                  .filter(state => state.name != '' && 
                  (!util.isObjectHasKey(state, 'abstract') || !state.abstract))
                  .reduce((a, o) => {
                    if (o.url === "/") $rootScope.state.default = o.name;
                    o.class = o.name.replace('.', '-');
                    a.push(util.objMerge({
                      name: null,
                      class: null,
                      parent: null,
                      group: null
                    }, o, true));
                    return a;
                  }, []);

          // When default state not exist set to first state
          if (!$rootScope.state.default)
            $rootScope.state.default = $rootScope.state.available[0].name;

          // Set disabled states
          $rootScope.state.disabled = [
            ...new Set([].concat(
              $rootScope.state.available
                        .filter(state =>  $rootScope.state.default !== state.name &&
                                          options.name.includes(state.name) ||
                                          options.parent.includes(state.parent) ||
                                          options.group.includes(state.group))
                        .map(state => state.name)
          ))];
          
          // Set page container visibility, and class
          let setPageContainer = (stateId, method) => {
            if (stateId) {
              let element = document.querySelector('.page-container');
              if (element) {
                element.classList[method]('show');
                let index = util.indexByKeyValue($rootScope.state.available, 'name', stateId);
                if (index !== -1) 
                  element.classList[method]($rootScope.state.available[index].class);
              }
            }
          }

          // Check parameter scroll to top
          if (!util.isBoolean(scrollTop)) scrollTop = true;

          // On before start transaction
          $transitions.onBefore({}, (transition) => {
            
            // Get transaction properties
            let properties = {
              from: {
                name  : transition.from().name,
                params: util.objFilterByKeys(transition.params('from'), '#', false)
              },
              to: {
                name  : transition.to().name,
                params: util.objFilterByKeys(transition.params('to'), '#', false)
              }
            };

            // Check is first time
            if (util.isNull($rootScope.state.id)) {
              if ($rootScope.state.disabled.includes(properties.to.name))
                return transition.router.stateService.target($rootScope.state.default);
            }

            // Check is changed
            let changed = {
              state : !angular.equals(properties.from.name, properties.to.name),
              params: !angular.equals(properties.from.params, properties.to.params)
            }

            // When is any one changed
            if (changed.state || changed.params) {

              // Check state parameters is changed
              if (changed.params) {

                // Set state properties
                if (!$rootScope.state.disabled.includes($rootScope.state.id))
                  $rootScope.state.params.prevEnabled = properties.from.params;
                $rootScope.state.params.prev = properties.from.params;
              }

              // Check state changed
              if (changed.state || 
                  !angular.equals($rootScope.state.prev, $rootScope.state.id)) {

                // Set state properties
                if (!$rootScope.state.disabled.includes($rootScope.state.id))
                  $rootScope.state.prevEnabled = $rootScope.state.id;
                $rootScope.state.prev = $rootScope.state.id;
                $rootScope.state.id   = properties.to.name;

                // Get/Check transaction state to index
                let index = util.indexByKeyValue(
                  $rootScope.state.available, 'name', properties.to.name);
                if (index !== -1) {
                  $rootScope.state.parent = $rootScope.state.available[index].parent;
                  $rootScope.state.group  = $rootScope.state.available[index].group;
                }
              }

              // Apply change
              $rootScope.$applyAsync();
            }
            return true;
          });
          
          // On success transaction
          $transitions.onSuccess({}, () => {
            
            return $timeout(() => {

              // Check state is changed
              if (!angular.equals($rootScope.state.prev, $rootScope.state.id)) {

                // Set previous page container visibility, and class
                setPageContainer($rootScope.state.prev, 'remove');

                // Set current page container visibility, and class
                setPageContainer($rootScope.state.id, 'add');
              }

              // Scroll to top if necessary
              if (scrollTop) {
                let pageConteiner = document.querySelector('.page-container');
                if (pageConteiner && pageConteiner.scrollTop) 
                      pageConteiner.scrollTo({
                        top: 0, 
                        left: 0, 
                        behavior: 'smooth'
                      });
                else if (document.body.scrollTop)
                      document.body.scrollTo({
                        top: 0, 
                        left: 0, 
                        behavior: 'smooth'
                      });
                else  $('html, body').animate({scrollTop: 0}, 200);
              }
              return true;
            });
          });
        }
      }
    }
  ])

  // Include replace
  .directive('ngIncludeReplace', [
    () => {
      return {
        require: 'ngInclude',
        restrict: 'A',
        link: function (scope, element) {
          element.replaceWith(element.children());
        }
      };
    }
  ])

  // Scroll to
  .directive('ngScrollTo', [
    'util',
    (util) => {
      return {
        link: (scope, element, attrs) => {
          if (util.isString(attrs.ngScrollTo)) {
            element[0].addEventListener('click', () => {
              let target = document.querySelector(attrs.ngScrollTo);
              if (util.isNodeElement(target)) {
                target.scrollIntoView();
              }
            });
          }
        }
      };
  }])

  // Counter factory
  .factory('counter', [
    '$timeout',
		'util',
    ($timeout, util) => {

			// Define options
			let options = null;

			// Set private methods
			let methods = {

				// Set options
				options: (args) => {

					// Create promise
					return new Promise((resolve) => {

						// Check/Convert arguments
          	if (util.isString(args)) args = {skeleton: args};

						// Merge with default
          	options = util.objMerge({
          	  skeleton: '.counter',
          	  dataset	: 'total',
							regex 	: null,
							duration: 2000,
							delay 	: 0
          	}, args, true);

						// Check skeleton
          	if (!util.isString(options.skeleton) ||
          	    !(options.skeleton = options.skeleton.trim()).length)
							options.skeleton = '.counter';

						// Check dataset name
          	if (!util.isString(options.dataset) ||
          	    !(options.dataset = options.dataset.trim()).length)
							options.dataset = 'total';

						// Check regex
          	if (!util.isString(options.regex) ||
          	    !(options.regex = options.regex.trim()).length)
							options.regex = /(\d{1,3})(\d{3}(?:,|$))/;

						// Check duration
          	if (util.isString(options.duration) &&
								isNaN((options.duration = parseInt(options.duration))))
							options.duration = 2000;
						if (!util.isInt(options.duration) ||
								options.duration <= 0)
							options.duration = 2000;

						// Check delay
          	if (util.isString(options.delay) &&
								isNaN((options.delay = parseInt(options.delay))))
							options.delay = 0;
						if (!util.isInt(options.delay) ||
								options.delay < 0)
							options.delay = 0;

						// Resolve
						resolve();
					});
				},

				// Set text
        set: (str) => {
					let text;
					str = str.toString();
      		do {
      		  text = (text || str.split(`.`)[0])
      		        	.replace(options.regex, `$1,$2`)
      		} while (text.match(options.regex));
      		return (str.split(`.`)[1]) ?
      		    		text.concat(`.`, str.split(`.`)[1]) :
      		    		text;
        },

				// Stop/Reset
				stop: (isReset=false) => {
					$(options.skeleton).each(function() {
						$(this).prop('Counter', 0).stop();
						if (util.isBoolean(isReset) && isReset)
							$(this).text('0');
					});
				}
			};

      return {

				// Initialize
				init: (args) => {

					// Set options
					methods.options(args).then(() => {

						// Stop/Reset
						methods.stop(true);
					});
        },

				// Start
				start: () => {
					$timeout(() => {
						$(options.skeleton).each(function() {
							let element = $(this);
							element.text('0');
							element.prop('Counter', 0).stop().animate({
								Counter: element.data(options.dataset) || 0
							}, {
								duration: options.duration,
								easing 	: 'swing',
								step 		: now => element.text(methods.set(Math.ceil(now)))
							});
						});
					}, options.delay);
				},

				// Stop/Reset
				stop: (isReset=false) => {
					methods.stop(isReset);
				}
      }
    }
  ])
  
  // Show bootstrap5 breakpoints
	.directive('ngBreakpoints', [
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

              // Set position when is visible
              if ($scope.isVisible) 
                  $scope.methods.position();

              // Set Events
              $scope.methods.events();
            },

            // Events
            events: () => {

              // Windows resize event
              window.addEventListener('resize', (event) => {
                event.preventDefault();
                if ($scope.isVisible && !$scope.throttled) {
                  $scope.throttled  = true;
                  $scope.winWidth   = parseInt(window.innerWidth);
                  $scope.methods.position();
                  $timeout(() => {
                    $scope.throttled = false;
                  }, 200);
                }
              });

              // Keyboard up event 
              document.addEventListener('keyup', (event) => {
                event.preventDefault();
                if (event.ctrlKey && event.altKey && event.key === 'b') {
                  $element[0].classList.toggle('show');
                  $scope.isVisible = $element[0].classList.contains('show');
                  if (!$scope.isVisible) {
                          $scope.pos = {left:-300, top:-300};
                          $scope.$applyAsync();
                  } else  $scope.methods.position();
                }
              });
            },

            // Position
            position: () => {
              $scope.pos.left = parseInt((window.innerWidth  - $element[0].offsetWidth)   / 2);
              $scope.pos.top  = parseInt((window.innerHeight - $element[0].offsetHeight)  / 2);
              $scope.$applyAsync();
            }
          }
				}
			];

      return {
				restrict: 'EA',
				replace: true,
				scope: {},
				controller: controller,
				template:`<div class="display-1 w-auto position-fixed px-3 
                       bg-dark-transparent text-white d-conditional"
                       style="transition: all .2s ease 0s;"
                       ng-style="{left:(pos.left|pixel),top:(pos.top|pixel)}">
                    <span class="d-inline d-sm-none">XS</span>
                    <span class="d-none d-sm-inline d-md-none">SM</span>
                    <span class="d-none d-md-inline d-lg-none">MD</span>
                    <span class="d-none d-lg-inline d-xl-none">LG</span>
                    <span class="d-none d-xl-inline d-xxl-none">XL</span>
                    <span class="d-none d-xxl-inline">XXL</span>
                    <span class="ms-2 display-6">{{winWidth|pixel}}</span>
                  </div>`,

				// Compile 
				compile: () => {
					
					return {
						
						// Pre-link
						pre: (scope, iElement) => {
              scope.pos = {left:-300, top:-300};
							scope.winWidth  = parseInt(window.innerWidth);
              scope.isVisible = iElement[0].classList.contains('show');
              scope.throttled = false;
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

  /**
	 * Navbar collapse
	 * @attribute: skeleton of navigation items
	 * @description: Collapse navbar on click
	 */
  .directive('ngBsNavbarCollapse', [
    '$timeout',
    ($timeout) => {
      return {

				// Link
        link: (scope, iElement, iAttrs) => {

					// Get/navbar collapse element, and check exist
          let navbarCollapse	= iElement[0].querySelector('.collapse.navbar-collapse');
					if (navbarCollapse) {

						// Get atribute, when not exist set to default
						let skeleton = iAttrs.ngNavbarCollapse || 
                           '.navbar-brand, .nav-item:not(.dropdown)';

						// Reset asynchronous
						$timeout(() => {

							// Get navigation items
							let navItems = iElement[0].querySelectorAll(skeleton);

							// Check navigation items exist
							if (navItems.length) {

								// Create bootstrap collapse instance
								let bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle:false});

								// Each items
								navItems.forEach(item => {

									// Add event listener on click event
									item.addEventListener('click', () => {

										// Check navbar collapse element visibility
										if (navbarCollapse.classList.contains('show')) {

											// When is not active, then collapse navbar
											let isActiveItem =  item.classList.contains('active') ||
																					item.querySelector('.active');
											if (!isActiveItem) bsCollapse.toggle();
										}

										// Hide all parent dropdowns
										let dropdownMenu = item.closest('ul.dropdown-menu.show');
										while(dropdownMenu) {
											dropdownMenu.classList.remove('show');
											dropdownMenu = dropdownMenu.closest('ul.dropdown-menu.show');
										}
									});
								});
							}
						}, 300);
					}
        }
      };
  }])
  
  // Please wait
  .directive('ngWhait', [
    '$parse',
    ($parse) => {
      return {
        restrict: 'EA',
        replace: true,
        scope: {
          langId: '@',
          punctuationMark: '@'
        },
        template:`<div class="please-wait-overlay position-fixed d-conditional
                              vh-100 vw-100 top-0 start-0 bg-light-transparent"
                       style="z-index:2001;">
                    <div class="please-wait-panel position-absolute start-50 top-50 bg-white 
                                shadow-bottom-end border rounded-3 text-center
                                overflow-hidden scale-up fs-6">
                      <div class="please-wait-header lin-grad-gray text-white">
                        <i class="fa-solid fa-hourglass-start ms-3 fa-spin"></i>
                      </div>
                      <div class="please-wait-content">
                        <span>{{langId|translate:$root.lang.data|capitalize}}</span>
                        <span>{{punctuationMark}}</span>
                      </div>
                    </div>
                  </div>`,
        link: (scope, iElement) => {
          if (!scope.langId) scope.langId = 'please_wait';
          if (!scope.punctuationMark) scope.punctuationMark = '...';
          scope.$on('whait-loading', () => {
            iElement[0].classList.add('show'); 
          });
          scope.$on('whait-finished', () => {
            iElement[0].classList.remove('show');
          });
        }
      }
  }]);

})(window, angular);