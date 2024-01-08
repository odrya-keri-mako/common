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

// Set query
$query =  "SELECT `id`,
									`prefix_name`,
									`first_name`,
									`middle_name`,
									`last_name`,
									`suffix_name`,
									`valid`,
									`wrong_attempts` 
						 FROM `user` 
						WHERE `email` = ?
						LIMIT 1;";

// Execute query with argument
$result = $db->execute($query, 
							 array($args['user']['email']));

// Check user exist
if (is_null($result)) {

	// Set error
	Util::setError('user_not_exist', $db);
}

// Simplify result
$result = $result[0];

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

// Unset not necessary result key(s)
unset($result['valid'], $result['wrong_attempts']);

// Creates a new password
$password_new = '1234Aa';

// Set query
$query 	= "UPDATE `user` 
							SET `password` = :password,
									`modified` = :modified
						WHERE `id` = :id";

// Execute query with arguments
$success	= $db->execute($query, array(
							"password"	=> password_hash($password_new, 
																					 PASSWORD_DEFAULT),
							"modified"	=> date("Y-m-d H:i:s"),
							"id"				=> $result['id']
						));

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

// Translate error messages
$errorMsg = $lang->translate(Email::$errorMessages);

// Create message
$langData = $lang->translate(array(
	"{{password_changed}}"	=> "password_changed",
	"{{password_new}}"			=> "password_new"
));
$message = "{$langData["{{password_changed}}"]}!\n
						{$langData["{{password_new}}"]}: {$password_new}";

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

	// Set error
	Util::setError("{$phpMailer->getErrorMsg()}!
									\n{$message}", $phpMailer, $lang);
}

// Set document
$phpMailer->setDocument(array(
	'fileName'		=> "{$file}.html",
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
  $phpMailer->Subject = $langData["{{password_changed}}"];
  $phpMailer->Body 		= $phpMailer->getDocument();
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
Util::setResponse('password_changed');