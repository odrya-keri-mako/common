<?php
declare(strict_types=1);

// Using namespaces aliasing
use Util\Util as Util;
use Database\Database as Database;

// Get arguments
$args = Util::getArgs();

// Connect to database
$db = new Database();

// Set query
$query =  "SELECT `email`,
									`password`,
									`valid`,
									`wrong_attempts` 
						 FROM `user` 
						WHERE `id` = ?
						LIMIT 1;";

// Execute query with argument
$result = $db->execute($query, array($args['user']['id']));

// Check user exist
if (is_null($result)) {

	// Set error
	Util::setError('user_not_exist', $db);
}

// Simplify result
$result = $result[0];

// Check email is not equal
if ($args['user']['email_current'] !== $result['email']) {

	// Set error
	Util::setError('user_id_email_not_match', $db);
}

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

// Verify the current password
if (!password_verify($args['user']['password_current'], $result['password'])) {

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

// Set query
$query = 	"UPDATE `user` 
							SET `password` = :password,
									`modified` = :dateNow
						WHERE `id` = :id;";

// Execute query with arguments
$result = $db->execute($query, array(
	"password"	=> password_hash($args['user']['password'], PASSWORD_DEFAULT),
	"dateNow" 	=> date("Y-m-d H:i:s"), 
	"id" 				=> $args['user']['id']
));

// Close connection
$db = null;

// Check not success
if (!$result['affectedRows']) {

	// Set error
	Util::setError('password_change_failed');
}

// Set response
Util::setResponse('password_changed');