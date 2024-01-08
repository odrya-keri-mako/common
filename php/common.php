<?php

// Using namespaces aliasing
use Util\Util as Util;
use Util\UserFunction as UserFunction;

// Set environment
require_once('environment.php');

// Get arguments
$args = Util::getArgs();

// Create new user function
$userFunction = new UserFunction($args);

// Check user function method exist
if (!is_null($userFunction->getMethodName())) {

	// Execute user function method
	$result = $userFunction->executeMethod();

	// Close class
	$userFunction = null;

	// Set response
	Util::setResponse($result);

} else {

	// Get require file(s)
	$requireFiles = $userFunction->getRequireFiles();

	// Close class
	$userFunction = null;

	// Check exist
	if (is_array($requireFiles)) {

		// Each require file(s)
		foreach($requireFiles as $file) {

			// Include file
			require_once($file);
		}

	// Set error
	} else Util::setError('missing_required_files');
}