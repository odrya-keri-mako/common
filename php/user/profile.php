<?php
declare(strict_types=1);

// Using namespaces aliasing
use Util\Util as Util;
use Database\Database as Database;

// Get arguments
$args = Util::getArgs();

// Connect to database
$db = new Database();

// Check image exist
if (!is_null($args['user']['img'])) {

	// Decode image
	$args['user']['img'] = Util::base64Decode($args['user']['img']);
}

// Set modified datetime
$args['user']['modified'] = date("Y-m-d H:i:s");

// Set query
$query = "UPDATE 	`user` 
						 SET 	`prefix_name` = :prefix_name,
									`first_name` = :first_name,
									`middle_name` = :middle_name,
									`last_name` = :last_name,
									`suffix_name` = :suffix_name,
									`nick_name` = :nick_name,
									`born` = :born,
									`gender` = :gender,
									`img` = :img,
									`img_type` = :img_type,
									`country` = :country,
									`country_code` = :country_code,
									`phone` = :phone,
									`city` = :city,
									`postcode` = :postcode,
									`address` = :address,
									`modified` = :modified 
						WHERE `id` = :id";

// Set params
$params = Util::objMerge(array(
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
	"modified" => null,
	"id" => null
), $args['user'], true);

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