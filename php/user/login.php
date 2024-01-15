<?php
declare(strict_types=1);

// Using namespaces aliasing
use \Util\Util as Util;
use \Database\Database as Database;

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
	"id"=>null,
	"type" => null,
	"name" => null, 
	"prefix_name" => null, 
	"first_name" => null,
	"middle_name" => null,
	"last_name" => null,
	"suffix_name" => null,
 	"nick_name" => null,
	"gender" => null,
	"img_type" => null,
	"password" => null,
	"valid" => null,
	"wrong_attempts" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set query
$query = "SELECT `" . implode("`,`", array_keys($fields)) . "`";
if (array_key_exists('img', $userFields))
	$query .= ", BASE64_ENCODE(`img`) AS `img`";
$query .= " FROM `user` 
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
if (array_key_exists('valid', $result) && 
		!$result['valid']) {

	// Set error
	Util::setError('user_disabled', $db);
}

// Check the number of attempts exist, and bigger
if (array_key_exists('wrong_attempts', $result) && 
		$result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Verify the password
if (!password_verify($args['user']['password'], $result['password'])) {

	// Check the number of attempts exist, and bigger then allow
	if (array_key_exists('wrong_attempts', $result) && 
			$result['wrong_attempts'] > 5) {

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
	} else  Util::setError('password_incorrect', $db);
}

// Unset not necessary key(s)
unset(
	$result['password'], 
	$result['valid'], 
	$result['wrong_attempts']
);

// Check for login administration
if (array_key_exists('last_login', $userFields) ||
		array_key_exists('wrong_attempts', $userFields)) {
		
	// Set query, and params
	$query 	= "UPDATE `user` SET";
	$params = array();

	if (array_key_exists('last_login', $userFields)) {
		$query .= " `last_login` = :dateNow,";
		$params['dateNow'] = date("Y-m-d H:i:s");
	}
	if (array_key_exists('wrong_attempts', $userFields)) {
		$query .= " `wrong_attempts` = 0,";
	}
	if (mb_substr($query, 0, 1, 'utf-8') === ',')
		$query = trim(mb_substr($query, 1, null, 'utf-8'));

	// Finalize query
	$query = mb_substr($query, 0, -1, 'utf-8') . " WHERE `id`=:id";
	$params['id'] = $result['id'];

	// Execute query with arguments
	$success = $db->execute($query, $params);

	// Check not success
	if (!$success['affectedRows']) {

		// Set error
		Util::setError('failed_administer_login');
	}
}

// Close connection
$db = null;

// Set response
Util::setResponse($result);