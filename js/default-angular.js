;(function(window, angular) {

  'use strict';

  // Application module
  angular.module('customAppModuleName', [
    'ui.router'
  ])

	// Custum filter
  .filter('customFilterName', [
    () => {
      return (param) => {
        return param;
      }
    }
  ])

	// Custom factory
  .factory('customFactoryName', [
    '$timeout',
    function($timeout) {
      return {
        get: () => {
        },
        set: () => {
        }
      }
    }
  ])

  /* Application config */
  .config([
    '$stateProvider', 
    '$urlRouterProvider', 
    function($stateProvider, $urlRouterProvider) {

      $stateProvider
			.state('home', {
				url: '/',
				templateUrl: './html/home.html',
				controller: 'homeController'
			})
			.state('page1', {
				url: '/page1',
				templateUrl: './html/page1.html',
				controller: 'page1Controller'
			})
			.state('page2', {
				url: '/page2',
				templateUrl: './html/page2.html',
				controller: 'page2Controller',
				params: {
					data: null
				}
			});
      
      $urlRouterProvider.otherwise('/');
    }
  ])

  // Application run
  .run([
    '$rootScope',
    function($rootScope) {
			console.log('Run...');
    }
  ])

  // Home controller
  .controller('homeController', [
    '$scope',
    function($scope) {
      console.log('Home controller...');
    }
  ])

	// Page1 controller
  .controller('page1Controller', [
    '$scope',
    function($scope) {
      console.log('Page1 controller...');
    }
  ])

	// Page2 controller
  .controller('page2Controller', [
    '$state',
    '$scope',
		'$stateParams',
    function($state, $scope, $stateParams) {

			// Get/Check parameters
      $scope.data = $stateParams.data;
      if (!$scope.data) {
        $state.go('home');
        return;
      }

      console.log('Page2 controller...');
    }
  ])

	// Custom directive 1
  .directive('customDirectiveName1', [
    () => {
      return {
        link: (scope, iElement, iAttrs) => {
          console.log('Link...')
        }
      };
  }])

	// Custom directive 2
  // Scope bindings:
  // < one-way binding      <? optional     
  // = two-way binding      =? optional
  // & function binding     &? optional
  // @ pass only strings    @? optional
	.directive('customDirectiveName2', [
    '$timeout', 
    ($timeout) => {

			// Controller
			let controller = [
				'$scope', 
				($scope) => {
					console.log('controller...');
				}
			];

      return {
				restrict: 'EA',
				replace: true,
				scope: {},
				controller: controller,
				template:`<h1></h1>`,

				// Compile 
				compile: () => {
					
					console.log('Compile...');
					return {
						
						// Pre-link
						pre: (scope, iElement, iAttrs) => {
							console.log('Pre-link...');
						},

						// Post-link
						post: (scope, iElement, iAttrs) => {
							console.log('Post-link...');
						}
					};
				}
			};
		}
	]);

})(window, angular);