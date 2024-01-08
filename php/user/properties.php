<?php
declare(strict_types=1);

// Using namespaces aliasing
use \Util\Util as Util;
use \Database\Database as Database;

// When global application property not exist, then set environment
if (!isset($GLOBALS['___app___'])) require_once('../environment.php');

// Get arguments
$args = Util::getArgs();

// Connect to database
$db = new Database();

// Set query
$query 	= "SELECT `user`.`type`,
									`type`.`name` AS `typeName`,
									`user`.`born`, 
                	`user`.`country`,
									`user`.`country_code`,
									`user`.`phone`,
									`user`.`city`,
									`user`.`postcode`,
                	`user`.`address`
						 FROM `user`
				LEFT JOIN `type`
							 ON `type`.`id` = `user`.`type` 
						WHERE `user`.`id` = :id
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