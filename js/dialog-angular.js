;(function(window, angular) {

  'use strict';

  // Application dialog module
  angular.module('app.dialog', ['app.common'])

	// Modal dialog factory
	.factory('dialog', [
		'util', 
    (util) => {

      return {

        // Open
				open: (options) => {

					// Create promise
					return new Promise((resolve, reject) => {

						// Set methods
            let methods = {

              // Initialize
              init: () => {

								// Merge options with default
                options = methods.options(options);
							},

							options: options => {

								// Merge with default
								return util.objMerge({
									type        : null,
									message     : null,                               
									buttons     : null
								}, options, true);
							}
						};

						// Initialize
            methods.init();
					});
				}
			}
		}
	]);

})(window, angular);