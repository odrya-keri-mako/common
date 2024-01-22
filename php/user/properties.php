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

// Set query
$query = "";

// Define type table fields
$typeFields = null;

// Check has type property
if (array_key_exists('type', $userFields)) {

	// Set query
	$query .= "`user`.`type`";

	// Get type table fields
	$typeFields = $db->getFieldsName('type');

	// Check exist
	if (!is_null($typeFields) && 
			array_key_exists('id', $typeFields)) {

					// Set query
					$query .= ", `type`.`name` AS `typeName`";
	} else 	$typeFields = null;
}

// Filter default fields by keys if present in table fields
$fields = array_filter(array(
	"born" => null,
	"country" => null,
	"country_code" => null,
	"phone" => null,
	"city" => null,
	"postcode" => null,
	"address" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Add exist fields
if (!empty($fields)) {
	foreach(array_keys($fields) as $field) {

		// Set query
		$query .= ", `user`.`{$field}`";
	}
}

// Check query
if (mb_substr($query, 0, 1, 'utf-8') === ',')
	$query = trim(mb_substr($query, 1, null, 'utf-8'));

// Check is no field to select
if (empty($query)) {

	// Set response
	Util::setResponse(array());
}

// Set query
$query = "SELECT " . $query . " FROM `user`";

// Check is join type table
if (!is_null($typeFields)) {

	// Set query
	$query .= " LEFT JOIN `type`
										 ON `type`.`id` = `user`.`type` AND 
										 		`type`.`type` = 'USER'";
}

// Set query
$query .= " WHERE `user`.`id` = :id
						LIMIT 1;";

// Execute query with argument
$result = $db->execute($query, $args);

// Close connection
$db = null;

// Check user exist
if (is_null($result)) {

	// Set error
	Util::setError('user_not_exist');
}

// Simplify result
$result = $result[0];

// Set response
Util::setResponse($result);