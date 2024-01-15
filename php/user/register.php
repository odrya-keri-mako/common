<?php
declare(strict_types=1);

// Using namespaces aliasing
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

// Set query (Check new email already exist)
$query = "SELECT `id` 
					FROM 	`user` 
					WHERE `email` = ?
					LIMIT 1;";

// Execute query with argument
$success = $db->execute($query, array($args['user']['email']));

// Check result
if (!is_null($success)) {

	// Set error
	Util::setError('user_email_already_exist', $db);
}

// Get user table fields
$userFields = $db->getFieldsName('user');

// Check user table fields exist
if (is_null($userFields)) {

	// Set error
	Util::setError('table_not_exist', $db);
}

// Check has fields for email confirmation
$isEmailConfirm = 
		array_key_exists('email_verification_code', $userFields) &&
		array_key_exists('type', $userFields);

// Check image exist
if (array_key_exists('img', $userFields) && 
		array_key_exists('img', $args['user']) &&
									 !is_null($args['user']['img'])) {

	// Decode image
	$args['user']['img'] = Util::base64Decode($args['user']['img']);
}

// Save, and create a new password hash
$password_current = $args['user']['password'];
$args['user']['password'] = password_hash($args['user']['password'], PASSWORD_DEFAULT);

// Set random email verification code
if ($args['isSendEmail'] && $isEmailConfirm)
	$args['user']['email_verification_code'] = bin2hex(random_bytes(16));

// Set created datetime
if (array_key_exists('created', $userFields))
	$args['user']['created'] = date("Y-m-d H:i:s");

// Set user type
if (array_key_exists('type', $userFields))
	$args['user']['type'] = $isEmailConfirm ? "N" : "U";

// Filter default fields by keys if present in table fields
$fields = array_filter(array(
	"type" => null,
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
	"email" => null,
	"password" => null,
	"created" => null,
	"email_verification_code" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set query
$query = "INSERT INTO `user` 
					(`" . implode("`,`", array_keys($fields)) . "`) 
					VALUES";

// Set parameters
$params = Util::objMerge($fields, $args['user'], true);

// Execute query
$result = $db->execute($query, $params);

// Close connection
$db = null;

// Check not success
if (!$result['affectedRows']) {

	// Set error
	Util::setError('registration_failed');
}

// Check is not send email 
if (!$args['isSendEmail']) {
	
	// Set result
	$result = array("id" => $result['lastInsertId']);
	
	// Check has type property
	if (array_key_exists('type', $userFields))
		$result['type'] = $args['user']['type'];
	
	// Set response
	Util::setResponse($result);
}

// Unset not a required variable(s)
unset($query, $success, $params, $fields);

// Set language
$lang = new Language($args['lang']);

// Translate error messages
$errorMsg = $lang->translate(Email::$errorMessages);

// Create language data
$langData = $lang->translate(array(
	"{{register}}"			=> "register",
	"{{email_address}}"	=> "email_address"
));

// Create message
$message = "{$langData["{{register}}"]}!\n{$langData["{{email_address}}"]}: {$args['user']['email']}";

// Set constants data
$constants = array(
	"{{lang_id}}" 					=> $args['lang']['id'],
	"{{user_name}}" 				=> $lang->getUserName($args['user']),
	"{{current_date}}" 			=> date("Y-m-d"),
	"{{current_year}}" 			=> date("Y"),
	"{{email_current}}" 		=> $args['user']['email'],
	"{{password_current}}" 	=> $password_current
);

// Merge language with constants
$langData = Util::objMerge($langData, $constants);

// Check email confirmation is required
if ($isEmailConfirm) {

	// Set url
	$u = getUrl('email_confirm.php', $args['app']);
	if (is_null($u)) {

		// Set error
		Util::setError("{$langData['file_not_found']}: email_confirm.php!");
	}

	// Set url query
	$l = Util::base64Encode($args['lang']['id']);
	$t = Util::base64Encode($args['lang']['type']);
	$e = Util::base64Encode($args['app']['event']);
	$v = Util::base64Encode($args['app']['domain']);
	$x = Util::base64Encode(strval($result['lastInsertId']));
	$y = Util::base64Encode($args['user']['email']);
	$z = password_hash($args['user']['email_verification_code'], PASSWORD_DEFAULT);
	$w = Util::base64Encode(getWorkingDirectory());
	$c = Util::base64Encode($args['app']['common']);
	$a = Util::base64Encode($args['app']['id']);
	$langData["{{email_confirm_url}}"] = 
		"{$u}?l={$l}&t={$t}&e={$e}&v={$v}&x={$x}&y={$y}&z={$z}&w={$w}&c={$c}&a={$a}";
}

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
$slice = $isEmailConfirm ? 'confirm' : 'inform';
$phpMailer->setDocument(array(
	'fileName'		=> "{$file}_{$slice}.html",
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
  $phpMailer->Subject = $langData["{{register}}"];
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

// Set result
$result = array("id" => $result['lastInsertId']);

// Check has type property
if (array_key_exists('type', $userFields))
	$result['type'] = $args['user']['type'];

// Set response
Util::setResponse($result);