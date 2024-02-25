<?php
declare(strict_types=1);

// Using namespaces aliasing
use Util\Util as Util;
use Database\Database as Database;

// Set environment
require_once('./environment.php');

// Set arguments
$args = array(
	'fileName'	=> '',
	'subFolder'	=> null,
	'dbName'		=> '',
	'tblName'		=> ''
);

// Check arguments
if (!is_string($args['fileName']) || empty(($args['fileName'] = trim($args['fileName']))) ||
		!is_string($args['dbName']) 	|| empty(($args['dbName'] 	= trim($args['dbName']))) 	||
		!is_string($args['tblName']) 	|| empty(($args['tblName'] 	= trim($args['tblName'])))) {

	// Set error
	Util::setError('Invalid arguments!');
}

// Get/Check file content
$content 	= getContents($args['fileName'], $args['subFolder']);
if (is_null($content)) {

	// Set error
	Util::setError('Content not exist!');
}

// Decode content
$data = Util::jsonDecode($content);

// Check is associative array
if (Util::isAssocArray($data)) {

	// Convert to array
	$data = array($data);
}

// Check data exist
if (!is_array($data) || !count($data)) {

	// Set error
	Util::setError('Data not exist!');
}

// Connect to database
$db = new Database($args['dbName']);

// Get table fields
$tblFields = $db->getFieldsName($args['tblName']);

// Check user table fields exist
if (is_null($tblFields)) {

	// Set error
	Util::setError("Table not exist: {$args['tblName']}!", $db);
}

// Get first data row keys
$dataKeys = array_map(function() {
							return NULL;
						}, $data[0]);

// Filter default fields by keys if present in table fields
$fields = array_filter($dataKeys, function($key) use($tblFields) {
	return array_key_exists($key, $tblFields);
}, ARRAY_FILTER_USE_KEY);

// Set all data row keys
$data = array_map(function($item) use ($fields) {
	return Util::objMerge($fields, $item, true);
}, $data);

// Set query
$query = "INSERT INTO `{$args['tblName']}` 
					(`" . implode("`,`", array_keys($fields)) . "`) 
					VALUES";

// Execute query
$result = $db->execute($query, $data);

// Close connection
$db = null;

// Check not success
if (!$result['affectedRows']) {

	// Set error
	Util::setError('Failed to import data!');
}

// Set response
Util::setResponse($result);