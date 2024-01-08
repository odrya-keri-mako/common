<?php
declare(strict_types=1);

// Set namespace
namespace Util;

/**
 * User function
 */
 class UserFunction {

	// Set properties
	private $app,
					$require = null,
					$className,
					$methodName,
					$params,
					$paramsToClass,
					$paramsToMethod,
					$isStatic;

	// Constructor
  function __construct($args=null) {

		// Check arguments
		$this->checkArguments($args);

		// Set properties
		$this->app = $args["app"];
		$this->className = $args["className"];
		$this->methodName = $args["methodName"];
		$this->params = $args["params"];
		$this->paramsToClass = $args["paramsToClass"];
		$this->paramsToMethod = $args["paramsToMethod"];
		$this->isStatic = $args["isStatic"];
		
		// Set environment
		$this->setEnvironment();

		// Set require file(s)
		$this->setRequireFiles($args["require"]);

		// Release memory
		unset($args);

		// Create class
		$this->createClass();

		// Check method
		$this->checkMethod();
  }

	// Check arguments
	private function checkArguments(&$args) {

		// Merge wuith default
		$args = Util::objMerge(array(
			"app"							=> null,
			"require"					=> null,
			"className"				=> null,
			"methodName"			=> null,
			"params"					=> null,
			"paramsToClass"		=> false,
			"paramsToMethod"	=> true,
			"isStatic"				=> false
		), $args);

		// Check application identifier
		if (is_string($args['app'])) $args['app'] = array('id' => $args['app']);
		if (!is_array($args['app']) ||
				!array_key_exists('id', $args['app']) ||
				!is_string($args['app']['id']) || 
				empty(($args['app']['id'] = trim($args['app']['id'])))) {
				
			// Set error
			Util::setError('app_identifier_not_exist');
		}

		// Check require field(s)
		if (is_string($args["require"]) && 
				!empty(($args["require"] = trim($args["require"])))) {
			$args["require"] = strtr($args["require"], array(',' => ';'));
			$args["require"] = array_values(array_filter(explode( ';', $args["require"])));
		}
		if (is_array($args["require"]) && !empty($args["require"])) {
					for($i=0; $i<count($args["require"]); $i++) {
						$args["require"][$i] = mb_strtolower(trim($args["require"][$i]), 'UTF-8');
						if (!empty($args["require"][$i])) {
							$fileInfo = pathinfo($args["require"][$i]);
							if (!array_key_exists('extension', $fileInfo))
								$args["require"][$i] .= '.php';
						}
					}
					$args["require"] = array_values(array_unique(array_filter($args["require"])));
					if (empty($args["require"]))
						$args["require"] = null;
		} else 	$args["require"] = null; 

		// Check class name
		if (!is_string($args["className"]) || 
						empty(($args["className"] = trim($args["className"]))))
					$args["className"] = null;
		else	$args["className"] = strtr($args["className"], array('/' => DIRECTORY_SEPARATOR)); 
		
		// Check method name (required)
		if (!is_string($args["methodName"]) || 
						empty(($args["methodName"] = trim($args["methodName"]))))
			$args["methodName"] = null;

		// Check parameters to properties
		if (is_null($args['params'])) {
			$args['paramsToClass']  = false;
			$args['paramsToMethod'] = false;
		} else {
			if (is_null($args['className']))
				$args['paramsToClass'] = false;
			if (is_null($args['methodName']) || 
									$args['paramsToClass'])
				$args['paramsToMethod'] = false;
		}
	}

	// Set environment
	private function setEnvironment() {

		// Set counter, and beginner path
		$counter = 0;
		$path		 = "../../";

		// While not found
		while ($counter++ < 100) {

			// Set working directiory, and check exist 
			$workingDirectory = $path . $this->app['id'];
			if (is_dir($workingDirectory)) {

				// Change working directory
				if (chdir($workingDirectory)) {

					// Set application path
					$appPaths = array(checkPath(getcwd()));
					$appPaths[] = checkPath(dirname(__FILE__), 'php/Util');

					// Set application path(s)
					setApplicationPath($appPaths);

					// Reset application global relative path(s)
					$GLOBALS['___app___'] = array(
						"path" => array_merge(array(), $appPaths)
					);
					unset($appPaths);

					// Reset include path, and return
					setIncludePath();
					return;

				} else {

					// Set error
					Util::setError('unable_to_change_directory');
				}
			}

			// Enlarge path
			$path .= '../';
		}

		// Set error
		Util::setError('application_not_found');
	}

	// Create class
	private function createClass() {

		// Check class name exist
		if (!is_null($this->className)) {

			// Create class
			if ($this->paramsToClass) {

				// Check parameters
				if (!is_array($this->params) || Util::isAssocArray($this->params))
							$params = array($this->params);
				else	$params = $this->params;

							$this->className = new $this->className(...$params);
			} else	$this->className = new $this->className();
		}
	}

	// Get method name
	public function getMethodName() {
		return $this->methodName;
	}

	// Get parameters
	public function getParams() {
		return $this->params;
	}

	// Check method
	private function checkMethod() {

		// Check method exist
		if (!is_null($this->methodName)) {

			// Check class exist
			if (!is_null($this->className)) {

				// Check class has method
				if (!method_exists($this->className, $this->methodName)) {

					// Set error
					Util::setError('method_not_exist');
				}

				// Check method is static, or not, and set method name
				if ($this->isStatic)
							$this->methodName = get_class($this->className) . '::' . $this->methodName;
				else	$this->methodName = array($this->className, $this->methodName);
				
			// Check method exist
			} elseif (!function_exists($this->methodName)) {

				// Set error
				Util::setError('method_not_exist');
			}
		}
	}

	// Set require file(s)
	private function setRequireFiles($require) {

		// Check require file(s) exist
		if (is_array($require)) {

			// Each require file(s)
			foreach($require as $i => $file) {

				// Search for file. 
				$require[$i] = searchForFile($file, array('subFolder' => 'php'));
			}

			// Remove empty values, and check has property
			$require = array_values(array_filter($require));
			if (!empty($require)) {

				// Set arguments
				if ($_SERVER['REQUEST_METHOD'] === 'POST')
							$_POST['data'] 	= Util::jsonEncode($this->getParams());
				else 	$_GET['data'] 	= Util::jsonEncode($this->getParams());

				// Set require file(s)
				$this->require = $require;
			}
		}
	}

	// Get require file(s)
	public function getRequireFiles() {
		return $this->require;
	}

	// Execute method
	public function executeMethod() {

		// Set result
		$result = null;

		// Check method name exist
		if (!is_null($this->methodName)) {

			// Call user function
			if ($this->paramsToMethod) {

				// Check parameters
				if (!is_array($this->params) || Util::isAssocArray($this->params))
							$params = array($this->params);
				else	$params = $this->params;

							$result = call_user_func_array($this->methodName, $params);
			} else	$result = call_user_func($this->methodName);
		}

		// When class exist, close it
		if (!is_null($this->className)) $this->className = null;

		// Return result
		return $result;
	}
}