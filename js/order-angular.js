;(function(window, angular) {

  'use strict';

  // Application order module
  angular.module('app.order', ['app.common'])

	// Shop factory
  .factory('order', [
    '$rootScope',
    '$timeout',
    'util',
    'user',
    ($rootScope, $timeout, util, user) => {

      // Set service
      let service = {

        // Initialize 
        init: () => {

					// Set order
					$rootScope.order = {
            userId: null,
            label: [
              {checked:true,id:"id",field:"product_id",translate:true,filter:'numSep',thClass:"text-center",tdClass:"text-end"},
              {checked:true,id:"name",field:"name_id",translate:true,filter:null,thClass:"text-start",tdClass:"text-start"},
              {checked:true,id:"quantity",field:"quantity",translate:true,filter:'numSep',thClass:"text-center",tdClass:"text-center"},
              {checked:true,id:"price",field:"price",translate:true,filter:'numSep',thClass:"text-end",tdClass:"text-end"},
              {checked:true,id:"total",field:"total",translate:true,filter:'numSep',thClass:"text-end",tdClass:"text-end"}
            ],
						cart: []
					};

          // Events
          service.event();
        },

        images: () => {
          return [
            "apple",
            "apricot",
            "banana",
            "coconut",
            "grapefruit",
            "kiwi",
            "lemon",
            "mandarin",
            "mango",
            "nectarine",
            "orange",
            "pear",
            "plum",
            "raspberry",
            "strawberry",
            "watermelon"
          ];
        },

        // Events
        event: () => {

          // Watch user id changed
          $rootScope.$watch('$root.user.id', (newValue, oldValue) => {

            // Check is changed
            if(!angular.equals(newValue, oldValue)) {

              if (newValue) {
                $rootScope.order.userId = newValue;
                $rootScope.order.cart = service.get();
              } else {
                service.save().then(() => {
                  $rootScope.order.userId = newValue;
                  $rootScope.order.cart = [];
                });
              }
            }
          });
        },

				// Get key
				getKey: () => {
					return [$rootScope.app.id, 
                  $rootScope.order.userId, 
									'shopping_cart'].join('_');
				},

        // Get
        get: () => { 
          let cart = window.localStorage.getItem(service.getKey());
          if (!util.isJson(cart)) return [];
          return JSON.parse(cart);
        },
        
        // Default
        def: () => {
          return {
            checked     : null,
						product_id  : null,
						name_id     : null,
						quantity 		: null,
						price  			: null,
						total 			: null
					};
        },

        // Save
        save: () => {
          return new Promise((resolve, reject) => {
            window.localStorage.setItem(service.getKey(),  
              JSON.stringify($rootScope.order.cart));
            $timeout(() => resolve());
          });
        },

        // Remove
        remove: () => {
          localStorage.removeItem(service.getKey());
        }
      };

      // Return service
      return service;
  }])

  // Order controller
  .controller('orderController', [
    '$rootScope',
    '$scope',
    '$state',
    '$timeout',
    'lang',
    'order',
    'http',
    function($rootScope, $scope, $state, $timeout, lang, order, http) {

      // Set methods
      $scope.methods = {

        // Initialize
        init: () => {
          
          // Events
          $scope.methods.events();

          // Changed
          $scope.methods.changed();
        },

        // Events
        events: () => {
          document.addEventListener('keyup', (event) => {
            if (event.ctrlKey && event.altKey && event.key.toUpperCase() === 'O') {
              fetch('./data/order.json')
              .then(response => response.json())
              .then(response => {
                $rootScope.order.cart = response;
                $scope.methods.changed();
                $rootScope.$applyAsync();
              });
            }
          });
        },

        // Changed
        changed: () => {
          $scope.sumTotal = 0;
          $rootScope.order.cart.forEach((item, index) => {
            $rootScope.order.cart[index].total = item.checked ? item.quantity * item.price : 0;
            if (!$rootScope.order.cart[index].total &&
                 $rootScope.order.cart[index].checked) {
              $rootScope.order.cart[index].checked = false;
            }
            $scope.sumTotal += $rootScope.order.cart[index].total;
          });
        },

        // Toggle checked
        toggle: () => {
          $rootScope.order.cart.forEach((item, index) => {
            $rootScope.order.cart[index].checked = !$rootScope.order.cart[index].checked;
          });
          $timeout(() => $scope.methods.changed());
        },

        // Delete item
        delete: (event) => {
          let index = parseInt(event.currentTarget.dataset.id);
          if (!isNaN(index)) {
            if (confirm(lang.translate('delete_surely_item', true)+'?')) {
              $rootScope.order.cart.splice(index, 1);
              $scope.methods.changed();
            }
          }
        },

        // Purchase
        purchase: () => {

          // Http request
          http.request({
            url   : './php/order.php',
            method: 'POST',
            data  : $rootScope.order.data
          })
          .then(response => {
            if (response === 'purchase_thank_you') {
              $rootScope.order.cart = [];
              order.remove();
              $rootScope.$applyAsync();
              $state.go($rootScope.state.prevEnabled);
              $timeout(() => {
                alert(lang.translate(response, true)+'!');
              }, 50);
            }
          })
          .catch(e => {
            $timeout(() => alert(lang.translate(e, true)+'!'), 50);
          });
        }
      };

      // Initialize
      $scope.methods.init();
    }
  ])

  // Navbar order
  .directive('ngNavbarOrder', [
    () => {
      return {
        replace: true,
        scope: false,
        template:`<li class="nav-item mx-1 mt-3 mt-lg-0"
										ng-if="$root.user.id">
									<a class="nav-link position-relative" 
										 ui-sref="order"
										 ui-sref-active="active"
										 data-bs-toggle="collapse" 
										 data-bs-target=".navbar-collapse.show">
										<i class="fa-solid fa-cart-shopping fa-2xl me-1"></i>
										<div class="shopping-item position-absolute text-center text-white bg-primary">
											{{$root.order.cart.length}}
										</div>
										<span class="text-small-caps d-md-none">
											{{'shopping_cart' | translate:lang.data | capitalize}}
										</span>
									</a>
								</li>`
      };
  }]);

})(window, angular);