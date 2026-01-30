<?php
declare(strict_types=1);

// Include environment
require_once("./environment.php");

// Get arguments (data)
$args = Util::getArgs();

// Connect to MySQL server
// $db = new Database('database_name');
$db = new Database();   // Required: db/db_config.ini

// Set query
$query = "";

// Execute SQL command
$result = $db->execute($query, $args);

// Close connection
$db = null;

// Error
//  if (some_error) {
//    Util::setError('Error description'); 
//  }

// Set response
Util::setResponse($result);