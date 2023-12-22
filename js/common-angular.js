/*!
 * Common angular  v1.0
 */
;(function(window, angular) {

  'use strict';

  // Add class(es)
  HTMLElement.prototype.addClass = (function(classList) {
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => this.classList.add(c));
    }
  });

  // Remove class(es)
  HTMLElement.prototype.removeClass = (function(classList) { 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => this.classList.remove(c));
    }
  });

  // Toogle class(es)
  HTMLElement.prototype.toggleClass = (function(classList) { 
    if (Object.prototype.toString.call(classList) === '[object String]') {
      classList = [...new Set(classList.split(' ').map(s => s.trim()).filter(s => s.length))];
      classList.forEach(c => this.classList.toogle(c));
    }
  });

  // Unique array
  Array.prototype.unique = function(key=null) {
    let arr = this;
    if (Object.prototype.toString.call(key) === '[object String]')
          return [...new Map(arr.filter(obj => key in obj).map(obj => [obj[key], obj])).values()];
    else 	return [... new Set(arr)];
  };

  // Application common module
  angular.module('app.common', [])

  // Capitalize
  .filter('capitalize', [
    'util', 
    (util) => {
      return (str, isAllowed=true) => {

        // Check parameters
        if (!util.isString(str)) return str;
        str = str.trim();
        if (!util.isBoolean(isAllowed)) isAllowed = true;
        if (!isAllowed || !str.length) return str;
        return util.capitalize(str);
      }
    }
  ])

  // Number thousand separator
  .filter('numSep', [
    'util',
    (util) => {
      return (number, separator) => {
      
		  	// Check parameters
		  	if (!util.isVarNumber(number)) number = 0;
		  	if (!util.isString(separator)) separator = ' ';
      
		  	// Return number thousand separated
        return number.toString()
		  							 .replace(/(\d)(?=(\d{3})+(?!\d))/g,
		  											'$1' + separator.charAt(0)); 
      };
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
    '$q',
    ($q) => {

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
									else    return true;
							}
					} else  return true;
				},
				isObjectHasKey: (checkedVar, key) =>  util.isObject(checkedVar) && 
                                              util.isString(key) && key in checkedVar,
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
        capitalize: (str, isLowerEnd=true) => {
          if (!util.isString(str)) return str;
          str = str.trim();
          if (str.length === 0) return str;
          if (str.length === 1) return str.toUpperCase();
          if (!util.isBoolean(isLowerEnd)) isLowerEnd = true;
          return  str.charAt(0).toUpperCase() + (isLowerEnd ?
                  str.substr(1).toLowerCase() : str.substr(1));
        },
        getPageId: () => {
          let pageID = document.location.pathname;
          if (pageID[0] === '/') pageID = pageID.slice(1);
          if (pageID.slice(-1) === '/') pageID = pageID.slice(0, -1);
          return pageID;
        },
        getPageUrl: () => {
          return document.location.origin + '/' + util.getPageId() + '/';
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
        getBase64UrlType: (url) => {
          let type = '';
          if (util.isString(url))
            type = url.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
          return type;
        },
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
        sleep: async (delay) => new Promise((resolve) => setTimeout(resolve, delay))
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

            // Set is blob property
            let isBlob  = false;

            // Set methods
            let methods = {

              // Initialize
              init: () => {

                // Check options property
                if (util.isString(options)) options = {url: options};
                if (!util.isObjectHasKey(options, 'url') || 
                    !util.isString(options.url)) {
                  reject('Missing url property in httpRequest!');
                  return;
                }

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

                // Check/Set params
                if (util.isObjectHasKey(options, 'data') && 
                   !util.isUndefined(options.data)) {
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
                  else if (util.isObjectHasKey(result, "data"))
                        resolve(result.data);
                  else	resolve(result);
                } else	resolve(result);
              }
            };

            // Initialize
            methods.init();
        	});
				}
			};
    }
  ])

  // Transaction events factory
  .factory('trans', [
    '$transitions',
    '$window',
    '$state',
    '$rootScope',
    '$timeout',
    'util',
    ($transitions, $window, $state, $rootScope, $timeout, util) => {

      return {
        /**
         * Events
         * @param {*} options disable state(s) by name, parent, and group property when refresh page
         * @param {boolean} scrollTop   scroll to top when refresh page
         */
        events: (options=null, scrollTop=true) => {

          // Set application properties
          $rootScope.app = {
            id        : util.getPageId(),
            url       : util.getPageUrl(),
            commonPath: util.getCommonRelativePath(),
            currentDay: new Date()
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
              options[key] = options[key].map(name => name.trim()).filter(name => name !== '');
            }
            if (!util.isArray(options[key])) options[key] = [];
          });
          
          // Define state properties
          $rootScope.state = {
            id          : null,
            prev        : null,    
            prevEnabled : null,
            parent      : null,
            group       : null,
            default     : null
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
            let element = document.querySelector('.page-container');
            if (element) {
              element.classList[method]('show');
              let index = util.indexByKeyValue($rootScope.state.available, 'name', stateId);
              if (index !== -1) 
                element.classList[method]($rootScope.state.available[index].class);
            }
          }

          // Check parameter scroll to top
          if (!util.isBoolean(scrollTop)) scrollTop = true;
          
          // On before transaction
          $transitions.onBefore({}, (transition) => {
            
            // Check is first time
            if (util.isNull($rootScope.state.id)) {
              if ($rootScope.state.disabled.includes(transition.to().name))
                return transition.router.stateService.target($rootScope.state.default);
            }

            // Check state is change
            if(!angular.equals(transition.to().name, transition.from().name)) {
            
              // Set page container visibility, and class
              setPageContainer(transition.from().name, 'remove');
              
              // Set state properties
              if (!$rootScope.state.disabled.includes($rootScope.state.id))
                $rootScope.state.prevEnabled = $rootScope.state.id;
              $rootScope.state.prev = $rootScope.state.id;
              $rootScope.state.id   = transition.to().name;

              // Get/Check transaction state to index
              let index = util.indexByKeyValue($rootScope.state.available, 'name', transition.to().name);
              if (index !== -1) {
                $rootScope.state.parent = $rootScope.state.available[index].parent;
                $rootScope.state.group = $rootScope.state.available[index].group;
              }

              // Apply change
              $rootScope.$applyAsync();
            }
            return true;
          });
          
          // On success transaction
          $transitions.onSuccess({}, () => {
            
            return $timeout(() => {

              // Set page container visibility, and class
              setPageContainer($rootScope.state.id, 'add');

              // Scroll to top if necessary
              if (scrollTop) $window.scrollTo(0, 0);
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