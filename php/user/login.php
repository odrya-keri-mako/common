<?php
declare(strict_types=1);

// Using namespaces aliasing
use \Util\Util as Util;
use \Database\Database as Database;

// Check global application property exist
if (!isset($GLOBALS['___app___'])) {

	// Search for file
	$path = "";
	while(!is_readable($path."common/php/environment.php")){$path.="../";}

	// Set environment, and release memory
	require_once($path.'common/php/environment.php');
	unset($path);
}

// Get arguments
$args = Util::getArgs();

// Connect to database
$db = new Database();

// Set query
$query =  "SELECT `id`,
									`type`,
									`prefix_name`,
									`first_name`,
									`middle_name`,
									`last_name`,
									`suffix_name`,
									`nick_name`,
									`gender`,
									BASE64_ENCODE(`img`) AS `img`,
									`img_type`,
									`password`,
									`valid`,
									`wrong_attempts` 
						 FROM `user` 
						WHERE `email` = ?
						LIMIT 1;";

// Execute query with argument
$result = $db->execute($query, array($args['user']['email']));

// Check user exist
if (is_null($result)) {

	// Set error
	Util::setError('user_not_exist', $db);
}

// Simplify result
$result = $result[0];

// Check user valid
if (!$result['valid']) {

	// Set error
	Util::setError('user_disabled', $db);
}

// Check the number of attempts
if ($result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Verify the password
if (!password_verify($args['user']['password'], $result['password'])) {

	// Set query
	$query = 	"UPDATE `user` 
								SET `wrong_attempts` = `wrong_attempts` + 1
							WHERE `id` = ?;";

	// Execute query with arguments
	$success = $db->execute($query, array($result['id']));

	// Set error
	if ($success['affectedRows'])
				Util::setError('password_incorrect', $db);
	else	Util::setError('failed_increase_retries', $db);
}

// Unset not necessary key(s)
unset(
	$result['password'], 
	$result['valid'], 
	$result['wrong_attempts']
);

// Set query
$query = 	"UPDATE `user` 
							SET `last_login` = :dateNow,
									`wrong_attempts` = 0
						WHERE `id` = :id;";

// Execute query with arguments
$success = $db->execute($query, array(
	"dateNow" => date("Y-m-d H:i:s"), 
	"id" 			=> $result['id']
));

// Close connection
$db = null;

// Check not success
if (!$success['affectedRows']) {

	// Set error
	Util::setError('failed_administer_login');
}

// Set response
Util::setResponse($result);