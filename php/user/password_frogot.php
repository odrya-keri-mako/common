<?php
declare(strict_types=1);

// Use namescapes aliasing
use Util\Util as Util;
use Database\Database as Database;
use Language\Language as Language;
use PHPMailer\Email as Email;

// Get current file name, 
// and unset not a required variable(s)
$file = basename(__FILE__, '.php');
unset($requireFiles);

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
	"id" => null,
	"name" => null, 
	"prefix_name" => null, 
	"first_name" => null,
	"middle_name" => null,
	"last_name" => null,
	"suffix_name" => null,
 	"nick_name" => null,
	"valid" => null,
	"wrong_attempts" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set query
$query = "SELECT `" . implode("`,`", array_keys($fields)) . 
				 "` FROM `user` WHERE `email` = ? LIMIT 1;";

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

// Check the number of attempts
if (array_key_exists('wrong_attempts', $result) &&
		$result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Unset not necessary result key(s)
unset($result['valid'], $result['wrong_attempts']);

// Creates a new password
$password_new = '1234Aa';

// Set query, and params
$query 	= "UPDATE `user` 
							SET `password` = :password";
$params = array("password"	=> password_hash($password_new, PASSWORD_DEFAULT));
if (array_key_exists('modified', $userFields)) {
	$query .= ", `modified` = :dateNow";
	$params['dateNow'] = date("Y-m-d H:i:s");
}
$query .= " WHERE `id` = :id;";
$params['id'] = $result['id'];

// Execute query with arguments
$success = $db->execute($query, $params);

// Close connection
$db = null;

// Check not success
if (!$success['affectedRows']) {

	// Set error
	Util::setError('password_change_failed');
}

// Unset not necessary variables
unset($query, $success);

// Set language
$lang = new Language($args['lang']);

// Create message
$langData = $lang->translate(array(
	"{{password_changed}}"	=> "password_changed",
	"{{password_new}}"			=> "password_new"
));
$message = "{$langData["{{password_changed}}"]}!\n{$langData["{{password_new}}"]}: {$password_new}";

// Check is send email
if (!$args['isSendEmail']) {

	// Close language
	$lang = null;

	// Set response
	Util::setResponse($message);
}

// Unset not necessary variables
unset($query, $success);

// Translate error messages
$errorMsg = $lang->translate(Email::$errorMessages);

// Set constants data
$constants = array(
	"{{lang_id}}" 					=> $args['lang']['id'],
	"{{user_name}}" 				=> $lang->getUserName($result),
	"{{current_date}}" 			=> date("Y-m-d"),
	"{{current_year}}" 			=> date("Y"),
	"{{password_current}}" 	=> $password_new
);

// Merge language with constants
$langData = Util::objMerge($langData, $constants);

// Create email
$phpMailer = new Email($lang);

// Check is error
if ($phpMailer->isError()) {

	// Get error
	$error = $phpMailer->getErrorMsg();
	if (array_key_exists($error, $errorMsg))
		$error =$errorMsg[$error];

	// Set error
	Util::setError("{$error}!\n{$message}", $phpMailer, $lang);
}

// Set document
$phpMailer->setDocument(array(
	'fileName'		=> "{$file}.html",
	'subFolder' 	=> 'email/user'
), $constants, $langData);

// Check is error
if ($phpMailer->isError()) {

	// Get error
	$error = $phpMailer->getErrorMsg();
	if (array_key_exists($error, $errorMsg))
		$error =$errorMsg[$error];

	// Set error
	Util::setError("{$error}!\n{$message}", $phpMailer, $lang);
}

// Close language
$lang = null;

try {

	// Add rest properties
  $phpMailer->Subject = $langData["{{password_changed}}"];
  $phpMailer->Body 		= $phpMailer->getDocument();
  $phpMailer->addAddress($args['user']['email'], 
												 $langData["{{user_name}}"]);

	// Send email
  $phpMailer->send();

// Exception
} catch (Exception $e) {

	// Get error
	$error = 'email_send_failed';
	if (array_key_exists($error, $errorMsg))
		$error =$errorMsg[$error];

  // Set error
	Util::setError("{$error}!\n{$message}", $phpMailer);
}

// Close email
$phpMailer = null;

// Set response
Util::setResponse('password_changed');