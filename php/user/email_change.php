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

// Check the number of attempts exist, and bigger then allow
if (array_key_exists('wrong_attempts', $result) && 
		$result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Verify the current password
if (!password_verify($args['user']['password'], $result['password'])) {

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
	} else	Util::setError('password_incorrect', $db);
}

// Set query (Check new email already exist)
$query = "SELECT `id` 
					FROM 	`user` 
					WHERE `email` = ?
					LIMIT 1;";

// Execute query with arguments
$success = $db->execute($query, array($args['user']['email']));

// Check result
if (!is_null($success)) {

	// Set error
	Util::setError('user_email_already_exist', $db);
}

// Set random email verification code
if ($args['isSendEmail'] && $isEmailConfirm)
	$args['user']['email_verification_code'] = bin2hex(random_bytes(16));

// Set query, and params
$query 	= "UPDATE `user` SET ";
$params	= array('id' =>  $args['user']['id']);
foreach(array('type','type_old','email',
							'email_verification_code','modified') as $key) {
	if (array_key_exists($key, $userFields)) {
		$query .= ("`".$key."`=:".$key.",");
		switch($key) {
			case 'type':
				if ($isEmailConfirm &&
						array_key_exists('type_old', $userFields))
							$params[$key] = 'N';
				else 	$params[$key] = $result['type'];
				break;
			case 'type_old':
				$params[$key] = $result['type'] === 'N' ? null : $result['type'];
				break;
			case 'modified':
				$params[$key] = date("Y-m-d H:i:s");
				break;
			default:
			 $params[$key] = $args['user'][$key];
		}
	}
}

// Finalize query
$query = mb_substr($query, 0, -1, 'utf-8') . " WHERE `id`=:id";

// Execute query with arguments
$success = $db->execute($query, $params);

// Close connection
$db = null;

// Check not success
if (!$success['affectedRows']) {

	// Set error
	Util::setError('email_change_failed');
}

// Unset not a required variable(s)
unset($query, $success, $key, $fields, $params);

// Set language
$lang = new Language($args['lang']);

// Create message
$langData = $lang->translate(array(
	"{{email_changed}}"	=> "email_changed",
	"{{email_new}}"			=> "email_new"
));
$message = "{$langData["{{email_changed}}"]}!\n{$langData["{{email_new}}"]}: {$args['user']["email"]}";

// Check is not send email 
if (!$args['isSendEmail']) {

	// Close language
	$lang = null;

	// Set response
	Util::setResponse($message, $lang);
}

// Translate error messages
$errorMsg = $lang->translate(Email::$errorMessages);

// Set constants data
$constants = array(
	"{{lang_id}}" 			=> $args['lang']['id'],
	"{{user_name}}" 		=> $lang->getUserName($result),
	"{{current_date}}" 	=> date("Y-m-d"),
	"{{current_year}}" 	=> date("Y"),
	"{{email_old}}" 		=> $args['user']["email_current"],
	"{{email_current}}"	=> $args['user']["email"]
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
	'fileName'		=> "{$file}_previous.html",
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

try {

	// Add rest properties
  $phpMailer->Subject = $langData["{{email_changed}}"];
  $phpMailer->Body 		= $phpMailer->getDocument();
  $phpMailer->addAddress($args['user']['email_current'], 
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

// Clear all addresses to
$phpMailer->clearToAddresses();

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
				$x = Util::base64Encode(strval($args['user']['id']));
				$y = Util::base64Encode($args['user']['email']);
				$z = password_hash($args['user']['email_verification_code'],
							PASSWORD_DEFAULT);
				$w = Util::base64Encode(getWorkingDirectory());
				$c = Util::base64Encode($args['app']['common']);
				$a = Util::base64Encode($args['app']['id']);
				$langData["{{email_confirm_url}}"] = 
	"{$u}?l={$l}&t={$t}&e={$e}&v={$v}&x={$x}&y={$y}&z={$z}&w={$w}&c={$c}&a={$a}";
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
  $phpMailer->Body = $phpMailer->getDocument();
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
Util::setResponse('email_changed');