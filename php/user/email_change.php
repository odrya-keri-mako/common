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

// Set query
$query =  "SELECT `prefix_name`,
									`first_name`,
									`middle_name`,
									`last_name`,
									`suffix_name`,
									`type`,
									`email`,
									`password`,
									`valid`,
									`wrong_attempts`
						 FROM `user`
						WHERE `id` = ?
						LIMIT 1;";

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
if (!$result['valid']) {

	// Set error
	Util::setError('user_disabled', $db);
}

// Check the number of attempts
if ($result['wrong_attempts'] > 5) {

	// Set error
	Util::setError('user_wrong_attempts', $db);
}

// Verify the current password
if (!password_verify($args['user']['password'], $result['password'])) {

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
}

// Set query (Check new email already exist)
$query = "SELECT `id` 
					FROM 	`user` 
					WHERE `email` = ?
					LIMIT 1;";

// Execute query with arguments
$success	= $db->execute($query, array($args['user']['email']));

// Check result
if (!is_null($success)) {

	// Set error
	Util::setError('user_email_already_exist', $db);
}

// Set random email verification code
$args['user']['email_verification_code'] = bin2hex(random_bytes(16));

// Set query
$query 	= "UPDATE `user` 
							SET `type`			= :type,
									`type_old` 	= :type_old,
									`email`			= :email,
									`email_verification_code`	= :code,
						 			`modified`	= :modified
						WHERE `id` = :id";

// Execute query with arguments
$success = $db->execute($query, array(
	"type"			=> 'N',
	"type_old"	=> $result['type'] === 'N' ? null : $result['type'],
	"email"			=> $args['user']['email'],
	"code"			=> $args['user']['email_verification_code'],
	"modified"	=> date("Y-m-d H:i:s"),
	"id"				=> $args['user']['id']
));

// Close connection
$db = null;

// Check not success
if (!$success['affectedRows']) {

	// Set error
	Util::setError('email_change_failed');
}

// Unset not a required variable(s)
unset($query, $success);

// Set language
$lang = new Language($args['lang']);

// Translate error messages
$errorMsg = $lang->translate(Email::$errorMessages);

// Create message
$langData = $lang->translate(array(
	"{{email_changed}}"	=> "email_changed",
	"{{email_new}}"			=> "email_new"
));
$message = "{$langData["{{email_changed}}"]}!\n
						{$langData["{{email_new}}"]}: {$args['user']["email"]}";

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

	// Set error
	Util::setError("{$phpMailer->getErrorMsg()}!
									\n{$message}", $phpMailer, $lang);
}

// Set document
$phpMailer->setDocument(array(
	'fileName'		=> "{$file}_previous.html",
	'subFolder' 	=> 'email/user'
), $constants, $langData);

// Check is error
if ($phpMailer->isError()) {

	// Set error
	Util::setError("{$phpMailer->getErrorMsg()}!
									\n{$message}", $phpMailer, $lang);
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

  // Set error
	Util::setError("{$errorMsg['email_send_failed']}!
									\n{$message}", $phpMailer);
}

// Clear all addresses to
$phpMailer->clearToAddresses();

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
$z = password_hash($args['user']['email_verification_code'], PASSWORD_DEFAULT);
$w = Util::base64Encode(getWorkingDirectory());
$c = Util::base64Encode($args['app']['common']);
$a = Util::base64Encode($args['app']['id']);
$langData["{{email_confirm_url}}"] = 
	"{$u}?l={$l}&t={$t}&e={$e}&v={$v}&x={$x}&y={$y}&z={$z}&w={$w}&c={$c}&a={$a}";

// Set document
$phpMailer->setDocument(array(
	'fileName'		=> "{$file}_confirm.html",
	'subFolder' 	=> 'email/user'
), $constants, $langData);

// Check is error
if ($phpMailer->isError()) {

	// Set error
	Util::setError("{$phpMailer->getErrorMsg()}!
									\n{$message}", $phpMailer, $lang);
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

  // Set error
	Util::setError("{$errorMsg['email_send_failed']}!
									\n{$message}", $phpMailer);
}

// Close email
$phpMailer = null;

// Set response
Util::setResponse('email_changed');