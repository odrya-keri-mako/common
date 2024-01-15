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

// Check image exist
if (array_key_exists('img', $userFields) && 
		array_key_exists('img', $args['user']) &&
									 !is_null($args['user']['img'])) {

	// Decode image
	$args['user']['img'] = Util::base64Decode($args['user']['img']);
}

// Set modified datetime
if (array_key_exists('modified', $userFields))
	$args['user']['modified'] = date("Y-m-d H:i:s");

// Filter default fields by keys if present in table fields
$fields = array_filter(array(
	"name" => null, 
	"prefix_name" => null, 
	"first_name" => null,
	"middle_name" => null,
	"last_name" => null,
	"suffix_name" => null,
 	"nick_name" => null,
	"born" => null,
	"gender" => null,
	"img" => null,
	"img_type" => null,
	"country" => null,
	"country_code" => null,
	"phone" => null,
	"city" => null,
	"postcode" => null,
	"address" => null,
	"modified" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set parameters, and query
$params = array('id' => $args['user']['id']);
$query 	= "UPDATE `user` SET ";
foreach(array_keys($fields) as $key) {
	if (array_key_exists($key, $args['user'])) {
		$query .= ("`".$key."` = :".$key.",");
		$params[$key] = $args['user'][$key];
	}
}

// Finalize query
$query = mb_substr($query, 0, -1, 'utf-8') . " WHERE `id` = :id";

// Execute query
$result = $db->execute($query, $params);

// Close connection
$db = null;

// Check not success
if (!$result['affectedRows']) {

	// Set error
	Util::setError('data_modification_failed');
}

// Set response
Util::setResponse('data_modification_successful');