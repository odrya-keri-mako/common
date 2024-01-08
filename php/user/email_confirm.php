<?php
declare(strict_types=1);

// Use namescapes aliasing
use Util\Util as Util;
use Database\Database as Database;
use Language\Language as Language;

// Get url query
parse_str($_SERVER['QUERY_STRING'], $args);

// Check url query
if (!isset($args['l']) || 
		!isset($args['t']) ||
		!isset($args['e']) || 
		!isset($args['v']) || 
		!isset($args['x']) || 
		!isset($args['y']) ||
		!isset($args['z']) ||
		!isset($args['w']) ||
		!isset($args['c']) ||
		!isset($args['a'])) {

	// Set error
	setError(array(
		"langId"	=> "en", 
		"title"		=> "Email address verification", 
		"message"	=> "Invalid url parameters"
	));
}

// Decode arguments
$args = array(
	'langId'			=> base64Decode($args['l']),
	'langType'		=> base64Decode($args['t']),
	'event'				=> base64Decode($args['e']),
	'domain'			=> base64Decode($args['v']),
	'id' 					=> intval(base64Decode($args['x'])),
	'email'				=> base64Decode($args['y']),
	'code'				=> $args['z'],
	'workingDir'	=> base64Decode($args['w']),
	'commonPath'	=> base64Decode($args['c']),
	'appId'				=> base64Decode($args['a'])
);

// Set url
$url = "{$args['domain']}/{$args['appId']}/";

// Change directory
if (!chdir($args['workingDir'])) {

	// Set error
	setError(array(
		"langId"			=> "en", 
		"title"				=> "Email address verification", 
		"message"			=> "Unable to change directory",
		"btnContent"	=> "Moves on",
		"url"					=> $url
	));
}

// Set environment
require_once("{$args['commonPath']}php/environment.php");

// Set language
$lang = new Language(array(
	'id'		=> $args['langId'], 
	'type'	=> $args['langType']
));
$langData = $lang->translate(array(
  "user_not_exist" => "user_not_exist",
	"email_verification_code_invalid" => "email_verification_code_invalid",
	"failed_increase_retries" => "failed_increase_retries",
	"email_verification" => "email_verification",
	"set_session_failed" => "set_session_failed",
	"email_already_confirmed" => "email_already_confirmed",
	"moves_on" => "moves_on"
));
$lang = null;

// Connect to database
$db = new Database();

// Set query
$query =  "SELECT `id`,
									`prefix_name`,
									`first_name`,
									`middle_name`,
									`last_name`,
									`suffix_name`,
									`type_old`,
									`email_verification_code`
						 FROM `user` 
						WHERE `id` = :id AND
									`email` = :email
						LIMIT 1;";

// Execute query with argument
$result = $db->execute($query, array(
	"id"		=> $args['id'],
	"email"	=> $args['email']
));

// Check user exist
if (is_null($result)) {

	// Set error
	setError(array(
		"langId"			=> $args['langId'], 
		"title"				=> $langData['email_verification'], 
		"message"			=> $langData['user_not_exist'],
		"btnContent"	=> $langData['moves_on'],
		"url"					=> $url
	), $db);
}

// Simplify result
$result = $result[0];

// Verify verification code
if (is_null($result['email_verification_code'])) {

	// Set error
	setError(array(
		"langId"			=> $args['langId'], 
		"title"				=> $langData['email_verification'], 
		"message"			=> $langData['email_already_confirmed'],
		"btnContent"	=> $langData['moves_on'],
		"url"					=> $url
	));

} elseif (!password_verify($result['email_verification_code'], $args['code'])) {

	// Set query
	$query = 	"UPDATE `user` 
								SET `wrong_attempts` = `wrong_attempts` + 1
							WHERE `id` = ?;";

	// Execute query with arguments
	$success = $db->execute($query, array($result['id']));

	// Set error
	if ($success['affectedRows'])
				setError(array(
					"langId"			=> $args['langId'], 
					"title"				=> $langData['email_verification'], 
					"message"			=> $langData['email_verification_code_invalid'],
					"btnContent"	=> $langData['moves_on'],
					"url"					=> $url
				), $db);
	else	setError(array(
					"langId"			=> $args['langId'], 
					"title"				=> $langData['email_verification'], 
					"message"			=> $langData['failed_increase_retries'],
					"btnContent"	=> $langData['moves_on'],
					"url"					=> $url
				), $db);
}

// Set query
$query = 	"UPDATE `user` 
							SET `type` = :type,
									`email_confirmed` = :dateNow,
									`type_old` = :type_old,
									`email_verification_code` = :code
						WHERE `id` = :id;";

// Execute query with arguments
$success = $db->execute($query, array(
	'type' 			=> $result['type_old'] ? $result['type_old'] : 'U',
	"dateNow"		=> date("Y-m-d H:i:s"),
	'type_old'	=> NULL,
	'code' 			=> NULL,
	'id' 				=> $result['id']
));

// Close connection
$db = null;

// Check not success
if (!$success['affectedRows']) {

	// Set error
	setError(array(
		"langId"			=> $args['langId'], 
		"title"				=> $langData['email_verification'], 
		"message"			=> $langData['email_confirmation_failed'],
		"btnContent"	=> $langData['moves_on'],
		"url"					=> $url
	));
}

// Set session
if (!Util::setSession(array(
	'id'    => $args['appId'],
  'key'   => "email_confirm_{$args['event']}_{$args['id']}",
  'data'	=> 	array_filter($result, function($key) {
								return strpos($key, '_name') !== false;
							}, ARRAY_FILTER_USE_KEY)
))) {

	// Set error
	setError(array(
		"langId"			=> $args['langId'], 
		"title"				=> $langData['email_verification'], 
		"message"			=> $langData['set_session_failed'],
		"btnContent"	=> $langData['moves_on'],
		"url"					=> $url
	));
}

// Set url
$e 		= Util::base64Encode($args['event']);
$i 		= Util::base64Encode(strval($args['id']));
$l 		= Util::base64Encode($args['langId']);
$url .= "#!/email_confirm?e={$e}&i={$i}&l={$l}";

// Redirect browser, and die
header("Location: {$url}");
die();

// Base64 decode
function base64Decode($data) {
	$mod4 = strlen($data) % 4;
	if ($mod4) $data .= substr('====', $mod4);
	return base64_decode($data);
}

// Set error, and die
function setError($args, &$db=null) {

	// Cloce connection if exist
	if (!is_null($db)) $db=null;

	// Set html
	$html =
	 "<!DOCTYPE html>
		<html lang=\"{$args['langId']}\">
		<head>
			<meta charset=\"UTF-8\">
			<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
			<title>{$args['title']}</title>
			<style>
				body {margin:0;height:100vh;display:flex;justify-content:center;align-items:center;}
				h1 {color:red;}
				.shadow-sm-bottom-end {
					-webkit-box-shadow: 0.3rem 0.3rem 0.3rem 0 rgba(0,0,0,0.3);
									box-shadow: 0.3rem 0.3rem 0.3rem 0 rgba(0,0,0,0.3);
				}
				.scale-up {
					-webkit-animation:scale-up .4s ease-out;
									animation:scale-up .4s ease-out;
				}
				@-webkit-keyframes scale-up {
						0% 	{-webkit-transform: scale(0);}
					100% 	{-webkit-transform: scale(1);}
				}
				@keyframes scale-up {
						0% 	{transform: scale(0);}
					100% 	{transform: scale(1);}
				}
			</style>
		</head>
		<body>
			<div class='scale-up'>
				<h1>{$args['message']}!</h1>";

	// Check url exist
	if (isset($args['url'])) {

		// Set button
		$html .= 
		 "<div style=\"text-align:center;margin-top:50px;\">
				<a  class=\"shadow-sm-bottom-end\"
						style=\"padding:10px 25px;line-height:1.25;background-color:#24a9ca;
										text-decoration:underline;color:white;font-size:20px;
										font-variant:small-caps;display:inline-block;
										overflow:hidden;\"
				 	 	href=\"{$args['url']}\">
					{$args['btnContent']}
				</a>
			</div>";
	}

	// Finish html
	$html .=			
		 "</div>
		</body>
		</html>";

	// Show html, and die
	echo Util::minimizeHtml($html);
	die();
}