<?php
declare(strict_types=1);

// Using namespaces aliasing
use Util\Util as Util;
use Database\Database as Database;

// Get arguments
$args = Util::getArgs();

// Connect to database
$db = new Database();

// Get user table fields
$userFields = $db->getFieldsName('user');

// Check user table fields exist
if (is_null($userFields)) {

	// Set error
	Util::setError('table_not_exist', $db);
}

// Filter default fields by keys if present in table fields
$fields = array_filter(array(
	"email" => null,
	"password" => null,
	"valid" => null,
	"wrong_attempts" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set query
$query = "SELECT `" . implode("`,`", array_keys($fields)) . 
				 "` FROM `user` WHERE `id` = ? LIMIT 1;";

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
if (array_key_exists('valid', $result) && 
		!$result['valid']) {

	// Set error
	Util::setError('user_disabled', $db);
}

// Check the number of attempts
if (array_key_exists('wrong_attempts', $result) && 
		$result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Verify the current password
if (!password_verify($args['user']['password_current'], $result['password'])) {

	// Check the number of attempts exist
	if (array_key_exists('wrong_attempts', $result)) {

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
	} else 	Util::setError('password_incorrect', $db); 
}

// Set query, and params
$query 	= "UPDATE `user` 
							SET `password` = :password";
$params = array("password"	=> password_hash($args['user']['password'], PASSWORD_DEFAULT));
if (array_key_exists('modified', $userFields)) {
	$query .= ", `modified` = :dateNow";
	$params['dateNow'] = date("Y-m-d H:i:s");
}
$query .= " WHERE `id` = :id;";
$params['id'] = $args['user']['id'];

// Execute query with arguments
$result = $db->execute($query, $params);

// Close connection
$db = null;

// Check not success
if (!$result['affectedRows']) {

	// Set error
	Util::setError('password_change_failed');
}

// Set response
Util::setResponse('password_changed');