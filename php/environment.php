<?php
declare(strict_types=1);

// Use namescapes aliasing
use Util\Util as Util;

// Include 
require_once('Util\Util.php');


/**
 * Environment
 */

// Set environment
setEnvironment();


// Set environment
function setEnvironment() {
	
	// Set character emcoding
	mb_http_output('UTF-8');
	mb_regex_encoding('UTF-8');
	mb_internal_encoding('UTF-8');


	// Set memory limit
	ini_set('memory_limit', '-1');
	set_time_limit(0);


	// Get application path(s)
	$appPaths = getApplicationPath();

	// Set application path(s)
	setApplicationPath($appPaths);

	// Set application global relative path(s)
	$GLOBALS['___app___'] = array(
		"path" => array_merge(array(), $appPaths)
	);
	unset($appPaths);


	// Set custum error reporting
	error_reporting(0);
	set_error_handler('customErrorHandler', E_ALL);
	register_shutdown_function('customFatalErrorHandler');


	// Set include path(s)
	setIncludePath();
}


// Autoload register
spl_autoload_register(function ($className) {

	// Search for class file
	$file = searchForFile($className.'.php', array(
		'subFolder' 	=> 'php',
		'isRecursive' => false
	));

	// When is found, then include it
	if (!is_null($file)) require_once($file);
});


// Get application path(s)
function getApplicationPath() {
	$appPaths 	= array(checkPath(realpath('./'), 'php'));
	$backfiles	= array_reverse(debug_backtrace());
	foreach($backfiles as $item) {
		$appPaths[] = checkPath(dirname($item['file']), 'php');
	}
	$appPaths[] = checkPath(dirname(__FILE__), 'php');
	$appPaths 	= array_values(array_unique($appPaths));
	
	// Change working directory to first path
	if (count($appPaths) < 1 || !chdir($appPaths[0])) {
		throw new Exception('Unable to change directory');
	}
	return $appPaths;
}


// Set application path(s)
function setApplicationPath(&$appPaths) {
	$currPath = checkPath(realpath('./'), 'php');
	for($i=0; $i<count($appPaths); $i++) {
		$appPaths[$i] = getRelativePath($currPath, $appPaths[$i]);
	}
}


// Get relative path from working directory
function getRelativePath($currPath, $pathTo) {
	$currPath = array_values(array_filter(explode( '/', $currPath)));
	$toPpath 	= array_values(array_filter(explode( '/', $pathTo)));
	$root 		= '';
	$index 		= 0;
	$minLen 	= min(count($currPath), count($toPpath));
	while($index++ < $minLen && 
				$currPath[0] === 
				$toPpath[0]) {
		$root 	 .= $currPath[0] . "/";
		array_shift($currPath);
		array_shift($toPpath);
	}
	$pathTo = substr($pathTo, strlen($root));
	if (($count = count($currPath)) === 0)
				$relativePath = "./" . $pathTo;
	else	$relativePath = str_repeat("../", $count)  . $pathTo;
	return $relativePath; 
}

// Custom error handler
function customErrorHandler($errNum, $errMsg, $errFile, $errLine) {
  
	// Set own error array
	$error = array(
		'type'			=> "E_UNKNOWN",
		'message'		=> trim($errMsg),
		'file'			=> basename(trim($errFile)),
		'line'			=> strval($errLine)
	);

	// Check error type
	switch ($errNum) {
		case E_ERROR:
			$error['type'] = "E_ERROR"; break;
		case E_WARNING:
			$error['type'] = "E_WARNING"; break;
		case E_PARSE:
			$error['type'] = "E_PARSE"; break;
		case E_NOTICE:
			$error['type'] = "E_NOTICE"; break;
		case E_CORE_ERROR:
			$error['type'] = "E_CORE_ERROR"; break;
		case E_CORE_WARNING:
			$error['type'] = "E_CORE_WARNING"; break;
		case E_COMPILE_ERROR:
			$error['type'] = "E_COMPILE_ERROR"; break;
		case E_CORE_WARNING:
			$error['type'] = "E_COMPILE_WARNING"; break;
		case E_USER_ERROR:
			$error['type'] = "E_USER_ERROR"; break;
		case E_USER_WARNING:
			$error['type'] = "E_USER_WARNING"; break;
		case E_USER_NOTICE:
			$error['type'] = "E_USER_NOTICE"; break;
		case E_STRICT:
			$error['type'] = "E_STRICT"; break;
		case E_RECOVERABLE_ERROR:
			$error['type'] = "E_RECOVERABLE_ERROR"; break;
		case E_DEPRECATED:
			$error['type'] = "E_DEPRECATED"; break;
		case E_USER_DEPRECATED:
			$error['type'] = "E_USER_DEPRECATED"; break;
		case E_ALL:
			$error['type'] = "E_ALL";
	}

	// Conver to string
	array_walk($error, function(&$value, $key) {
		$value = "{$key}: {$value}";
	});

	// Set error
	Util::setError(implode(', ', $error));
}


// Custom fatal error handler
function customFatalErrorHandler() {

	// Get last error
	$error = error_get_last();

	// Check is error
	if (!is_null($error)) {
	
		// Check error type
		switch ($error['type']) {
			case E_ERROR:
			case E_CORE_ERROR:
			case E_COMPILE_ERROR:
			case E_USER_ERROR:
				$isFatalError = true;
				break;
			default:
				$isFatalError = false;
		}
	
		// If fatal error
		if ($isFatalError) {
			if (($pos = strpos($error['message'], ':')) !== false)
				$error['message'] = trim(substr($error['message'], $pos+1));
			if (($pos = strpos($error['message'], ' in')) !== false)
				$error['message'] = trim(substr($error['message'], 0, $pos));
			function fakeHandler() {}
			$prevErrorHandler = set_error_handler('fakeHandler', E_ALL);
			restore_exception_handler();
			call_user_func($prevErrorHandler, $error['type'], $error['message'], $error['file'], $error['line']);
		}
	}
}


// Check path
function checkPath($path, $exceptFolder=null) {

	// Convert path
	$path = trim(strtr($path, array(DIRECTORY_SEPARATOR => '/')));
	$path = mb_strtolower($path, 'UTF-8');

	// Check last character
	if (substr($path, -1) !== '/')
		$path .= '/';

	// Check except folder(s)
	if (is_string($exceptFolder) && 
				!empty(($exceptFolder = mb_strtolower(trim($exceptFolder), 'UTF-8'))) &&
				substr($path, -1 * (mb_strlen($exceptFolder, 'utf-8') + 2)) === '/'.$exceptFolder.'/')
		$path = substr($path, 0, -1 * (mb_strlen($exceptFolder, 'utf-8') + 1));

	// Return result
	return $path;
}


// Check folder
function checkFolder($folder=null) {
	if (is_string($folder) && 
				!empty(($folder = trim($folder)))) {
					$folder = strtr($folder, array(DIRECTORY_SEPARATOR => '/'));
					if (substr($folder, 0, 1) === '/')
						$folder = substr($folder, 1);
					if (substr($folder, -1) !== '/')
						$folder .= '/';
					return mb_strtolower($folder, 'UTF-8');
	} else  return '';
}


// Set/Reset include path
function setIncludePath() {

	// Get include path(s)
	$include = get_include_path();
	if ($include === false) $include = "";
	$includePaths = explode(PATH_SEPARATOR, $include);
	$includePaths = array_values(array_filter($includePaths));

	// Get application global
	global $___app___;

	// Get/Set application global paths
	$globalPaths = array_merge(array(), $___app___['path']);
	foreach($globalPaths as $i => $path) {
		if (is_dir($path.'php'))
		 $globalPaths[$i] .= "php/";

		// Reset order
		if (($ind = array_search($globalPaths[$i], $includePaths)) !== false) 
			array_splice($includePaths, $ind, 1);
	}

	// Merge/Check include paths with global paths
	$includePaths = array_merge($includePaths, $globalPaths);
	foreach($includePaths as $i => $path) {
		$includePaths[$i] = checkPath($path);
	}
	$includePaths = array_unique($includePaths);

	// Set new include paths
	$include = implode(PATH_SEPARATOR, $includePaths);
	set_include_path(PATH_SEPARATOR . $include);
}

// Get url
function getUrl($fileName, $app, $args=null) {
	$file = searchForFile($fileName, $args);
	if (!is_null($file)) {
		$file 		= mb_strtolower(trim(strtr(realpath($file), array(DIRECTORY_SEPARATOR => '/'))), 'UTF-8');
		$appPath 	= getWorkingDirectory();
		$rootPath = strtr($appPath, array($app['id'] => ''));
		$file 		= strtr($file, array($rootPath => $app['domain'] . '/'));
	}
	return $file;
}

// Get working directory
function getWorkingDirectory() {
	return mb_strtolower(trim(strtr(getcwd(), array(DIRECTORY_SEPARATOR => '/'))), 'UTF-8');
}

// Search for file
function searchForFile($fileName, $args=null) {

	// Check/Set parameter file name
	if (!is_string($fileName) || 
					empty(($fileName = trim($fileName))))
		return null;
	$fileName = strtr($fileName, array(DIRECTORY_SEPARATOR => '/'));

	// Check arguments
	if (is_string($args))
		$args = array('subFolder' => trim($args));
	if (is_bool($args))
		$args = array('isRecursive' => $args);

	// Merge arguments with default
	$args = Util::objMerge(array(
		'subFolder' 	=> null,
		'isRecursive' => true
	), $args, true);

	// Check/Set parameter folder
	$args['subFolder'] = checkFolder($args['subFolder']);

	// Get application global
	global $___app___;

	// Each application path(s)
	foreach($___app___["path"] as $path) {

		// Set file
		$file = $path . $args['subFolder'] . $fileName;

		// When is exist, and readeble, then return file
		if (is_readable($file)) return $file;

		// When is recursive
		if ($args['isRecursive']) {

			// Get sub directory(es)
			$directories = glob($path . $args['subFolder'] . '*', GLOB_ONLYDIR);

			// Each sub directory(es)
			foreach($directories as $dir) {

				// Get sub directory
				$dir = mb_strtolower(basename($dir), 'UTF-8');

				// Search for file recursive
				$file = searchForFile($fileName, array(
					'subFolder' 	=> $args['subFolder'] . $dir,
					'isRecursive' => $args['isRecursive']
				));

				// When found, then return file
				if (!is_null($file)) return $file;
			}
		}
	}

	// When not is recursive
	if (!$args['isRecursive']) {

		// Check file exists anywhere in the include path
		$file = stream_resolve_include_path($fileName);

		// When is exist, and readeble, then return file
		if ($file !== false && is_readable($file)) 
					return $file;
		else 	return null;
	} else 	return null;
}


// Search for file, and fet file contents
function getContents($fileName, $args=null) {

	// Check/Set parameter file name
	if (!is_string($fileName) || 
					empty(($fileName = trim($fileName))))
		return null;

	// Check arguments
	if (is_string($args))
		$args = array('subFolder' => trim($args));
	if (is_bool($args))
		$args = array('isRecursive' => $args);

	// Merge arguments with default
	$args = Util::objMerge(array(
		'subFolder' 	=> null,
		'isRecursive' => true,
		'isMinimize' 	=> false
	), $args, true);

	// Search for file
	$file = searchForFile($fileName, array(
		'subFolder' 	=> $args['subFolder'],
		'isRecursive' => $args['isRecursive']
	));

	// Check found
	if (!is_null($file)) {

		// Read file
		$content = file_get_contents($file);

		// Check sucess
		if ($content !== false) {

			// Minimize content when is necesary
			if ($args['isMinimize'])
						return Util::minimizeHtml($content);
			else 	return $content;
		} else	return null;
	} else		return null;
}