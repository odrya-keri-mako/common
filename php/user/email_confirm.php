<?php
declare(strict_types=1);

// Use namescapes aliasing
use Util\Util as Util;
use Database\Database as Database;
use Language\Language as Language;

// $_SERVER['QUERY_STRING'] =
// 'l=aHU=&t=ZWFzdA==&e=cmVnaXN0ZXI=&v=aHR0cDovL2xvY2FsaG9zdA==&x=MQ==&y=b2RyeS5hdHRpbGFAZ21haWwuY29t&z=$2y$10$DmbnUX6XMDL4cwUVbMgk.OR49t/H4gbuqAAgUGlOqQLHU/5rRX9XK&w=YzoveGFtcHAvaHRkb2NzL3Byb2plY3RzLzIwMjNfMjAyNC92aXpzZ2FyZW1lay91c2VyLWxhbmd1YWdl&c=Li4vY29tbW9uLw==&a=cHJvamVjdHMvMjAyM18yMDI0L3ZpenNnYXJlbWVrL3VzZXItbGFuZ3VhZ2U=';
// $result['email_verification_code'] = '3e20b69950863e6c2098b4e7666f6f23';

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


// Translate data
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

// Get user table fields
$userFields = $db->getFieldsName('user');

// Check user table fields exist
if (is_null($userFields)) {

	// Set error
	Util::setError('table_not_exist', $db);
}

// Filter default fields by keys if present in table fields
$fields = array_filter(array(
	"name" => null, 
	"prefix_name" => null, 
	"first_name" => null,
	"middle_name" => null,
	"last_name" => null,
	"suffix_name" => null,
	"type_old" => null,
	"email_verification_code" => null
), function($key) use($userFields) {
	return array_key_exists($key, $userFields);
}, ARRAY_FILTER_USE_KEY);

// Set query
$query = "SELECT `" . implode("`,`", array_keys($fields)) . 
				 "` FROM `user` WHERE `id` = :id AND `email` = :email LIMIT 1;";

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
if (!$result['email_verification_code']) {

	// Set error
	setError(array(
		"langId"			=> $args['langId'], 
		"title"				=> $langData['email_verification'], 
		"message"			=> $langData['email_already_confirmed'],
		"btnContent"	=> $langData['moves_on'],
		"url"					=> $url
	));

}

// Check verification code
if (!password_verify($result['email_verification_code'], $args['code'])) {

	// Check the number of attempts exist
	if (array_key_exists('wrong_attempts', $userFields)) {

		// Set query
		$query = 	"UPDATE `user` 
									SET `wrong_attempts` = `wrong_attempts` + 1
								WHERE `id` = ?;";

		// Execute query with arguments
		$success = $db->execute($query, array($args['id']));

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
	} else	setError(array(
						"langId"			=> $args['langId'], 
						"title"				=> $langData['email_verification'], 
						"message"			=> $langData['email_verification_code_invalid'],
						"btnContent"	=> $langData['moves_on'],
						"url"					=> $url
					), $db);
}

// Set query, and parameters
$params = array(
	'type' => array_key_exists('type_old', $userFields) &&
						$result['type_old'] ? $result['type_old'] : 'U',
	'code' => 	NULL,
	'id' 	=> 	$args['id']
);
$query 	= 	"UPDATE `user` 
								SET `type` = :type,
										`email_verification_code` = :code";
if (array_key_exists('email_confirmed', $userFields)) {
	$query .= ", `email_confirmed` = :dateNow";
	$params['dateNow'] = date("Y-m-d H:i:s");
}
if (array_key_exists('type_old', $userFields)) {
	$query .= ", `type_old` = :type_old";
	$params['type_old'] = null;
}
$query .= " WHERE `id` = :id;";									
										
// Execute query with arguments
$success = $db->execute($query, $params);

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
								return $key === 'name' || strpos($key, '_name') !== false;
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