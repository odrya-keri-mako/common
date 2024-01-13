<?php
declare(strict_types=1);

// Set namespace
namespace PHPMailer;

// Use namespace
use PHPMailer\PHPMailer\PHPMailer as PHPMailer;
use Language\Language as Language;
use Util\Util as Util;

/**
 * Email
 */
class Email extends PHPMailer {

	// Set error messages
	public static $errorMessages = array(
		"email_send_failed" 		=> "email_send_failed",
		"email_crete_failed"		=> "email_crete_failed",
		"email_content_missing"	=> "email_content_missing",
		"file_name_missing"			=> "file_name_missing",
		"file_not_found" 				=> "file_not_found",
		"file_unable_to_read" 	=> "file_unable_to_read"
	);

	private $args,
					$options,
					$langClass,
					$document,
					$errorMsg = null;

	// Constructor
  function __construct($args=null, $options=null, $exceptions=null) {
		parent::__construct($exceptions);
		$this->setArguments($args);
		$this->setOptions($options);
		$this->setEmail();
  }

	// Clear all addresses to
	public function clearToAddresses() {
		$this->ClearAddresses();
		$this->ClearCCs();
		$this->ClearBCCs();
	}

	// Set document
	public function setDocument($args=null, $constants=null, $langData=null) {

		// Check/Convert arguments
		if (is_string($args)) $args = array('content' => $args);
		$args	= Util::objMerge(array(
			'content'			=> null,
			'fileName'		=> null,
			'subFolder' 	=> null,
			'isMinimize' 	=> true
		), $args, true);

		// Check the email content is exist
		$content = null;
		if (is_string($args['content']) && 
					!empty(($args['content'] = trim($args['content']))))
			 $content = $args['content'];

		// When the email content is not exist get content from file
		if (is_null($content) && !is_null($args['fileName'])) {

			// Check subfolder exist
			if (is_null($args['subFolder'])) 
				$args['subFolder'] = 'email';

			// Get content
			$content = getContents($args['fileName'], array(
				'subFolder' 	=> $args['subFolder'],
				'isMinimize' 	=> $args['isMinimize']
			));
		}

		// Check the email content not exist
		if (is_null($content)) {
			$this->setErrorMsg('email_content_missing');
			return;
		}

		// Get from contents html lang keys
		$langKeys	= array_reduce(
			Util::substrBetween($content), 
			function($a, $k) use($constants) {
				$key = '{{'.$k.'}}';
				if (!array_key_exists($key, $constants))
					$a[$key] = $k;
				return $a;
			}, array()
		);

		// Translate html lang keys, and merge it language
		$language = Util::objMerge($this->langClass->translate($langKeys), $langData);

		// Translate/Set document
		$this->document = strtr($content, $language);
	}

	// Get document
	public function getDocument() {
		return $this->document;
	}

	// Set error message
	private function setErrorMsg($msg) {

		// Check/Set error message
		if (is_string($msg) && 
					!empty(($msg = trim($msg))))
			$this->errorMsg = $msg;

		// Enlarge error count
		$this->error_count++;
	}

	// Get error message
	public function getErrorMsg() {
		if (!is_string($this->errorMsg))
					return 'error_unknown';
		else 	return $this->errorMsg;
	}

	// Set arguments
	private function setArguments(&$args) {

		// Check/Convert arguments
		if ($args instanceof Language) $args = array('langClass' => $args); 
		if (is_string($args)) $args = array('fileName' => $args);
		$args	= Util::objMerge(array(
			'fileName'		=> null,
			'subFolder' 	=> null,
			'langClass'		=> null
		), $args, true);
		if (is_null($args['fileName'])) 
			$args['fileName'] = 'email_config.json';
		if (is_null($args['subFolder'])) 
			$args['subFolder'] = 'email';

		// Check language class exist
		if ($args['langClass'] instanceof Language)
					$this->langClass = $args['langClass'];
		else 	$this->langClass = null;

		// Get configuration file content
		$data	= getContents($args['fileName'], $args['subFolder']);
		if (!is_null($data))
			$data = Util::jsonDecode($data);
		$this->args = Util::objMerge(array(
			"fromNameLang"	=> null,
			"img" 					=> null
		), $data, true);

		// Unset not necessary variable
		$args = null;
		unset($data);

		// Check from name language
		if (!is_string($this->args['fromNameLang']) || 
						empty(($this->args['fromNameLang'] = trim($this->args['fromNameLang']))))
			$this->args['fromNameLang'] = null;

		// When from name language exist, then translate it
		if (!is_null($this->args['fromNameLang']) && 
				!is_null($this->langClass)) {
			$langData	= array_reduce(
				Util::substrBetween($this->args['fromNameLang']), 
				function($a, $k) {
					$a['{{'.$k.'}}'] = $k;
					return $a;
				}, array()
			);
			$langData = $this->langClass->translate($langData);
			$this->args['fromNameLang'] = strtr($this->args['fromNameLang'], $langData);
		}

		// Convert images if necessary
		if (is_string($this->args['img']) && 
					!empty(($this->args['img'] = trim($this->args['img']))))
			$this->args['img'] = array("files" => array("name" => $this->args['img']));
		
		// Check images is exist
		if (is_array($this->args['img']) && !empty($this->args['img'])) {

			// Convert images if necessary
			if (!Util::isAssocArray($this->args['img']))
				$this->args['img'] = array("files" => $this->args['img']);

			// Merge with default
			$this->args['img']	= Util::objMerge(array(
				"files" 		=> null,
				"subFolder" => null
			), $this->args['img'], true);

			// Check default subfolder exist
			if (!is_string($this->args['img']['subFolder']) || 
					empty(($this->args['img']['subFolder'] = trim($this->args['img']['subFolder']))))
				$this->args['img']['subFolder'] = null;

			// Check images exist
			if (is_array($this->args['img']['files']) && 
						!empty($this->args['img']['files'])) {

				// Set result
				$result = array();

				// Each images
				foreach($this->args['img']['files'] as $file) {

					// Convert image if necessary
					if (is_string($file) && !empty(($file = trim($file))))
						$file = array('name' => $file);

					// Merge with default
					$file = Util::objMerge(array(
						"name" 			=> null,
						"alias"			=> null,
						"subFolder"	=> null
					), $file, true);

					// Check valid
					if (is_string($file['name']) && 
								!empty(($file['name'] = trim($file['name'])))) {

						// Check alias
						if (!is_string($file['alias']) || empty(($file['alias'] = trim($file['alias']))))
							$file['alias'] = basename($file['name']);

						// Check subfolder
						if (!is_string($file['subFolder']) || 
										empty(($file['subFolder'] = trim($file['subFolder']))))
						 $file['subFolder'] = !is_null($this->args['img']['subFolder']) ? 
																					 $this->args['img']['subFolder'] : null;

						// Search for file
						$imgFile = searchForFile($file['name'], $file['subFolder']);

						// When found, then add to result
						if (!is_null($imgFile))	{
							 $result[] = array(
								 'file' 	=> $imgFile,
								 'alias'	=> $file['alias']
							 );
						}
					}
				}

				// Check result
				if (count($result))
							$this->args['img'] = $result;
				else 	$this->args['img'] = null;
			} else 	$this->args['img'] = null;
		} else 		$this->args['img'] = null;
	}

	// Set optons
	private function setOptions(&$options) {

		// Check/Convert options
		if (is_string($options) && !empty(($options = trim($options))))
			$options = array('fromName'	=> $options);

		// Get configuration file
		$file = searchForFile('email.ini', array('subFolder' => 'email'));
    if (!is_null($file)) {
      $config 	= parse_ini_file($file, true);
			$options 	= Util::objMerge($config, $options);
		}

		// Merge options with default
    $this->options = Util::objMerge(array(
      'host' 					=> null,						// SMTP server
			'port'					=> null,						// SMPT port
			'email'					=> null,						// SMTP felhasználó
			'pass' 					=> null,						// SMTP jelszo
			'from'					=> null,						// Feladó e-mail címe
			'fromName'			=> null							// Feladó neve
    ), $options);

		$options = null;

		// Check from name language exist
		if (!is_null($this->args['fromNameLang']))
			$this->options['fromName'] = $this->args['fromNameLang'];
	}

	// Create email
	private function setEmail() {

		// Set PHPMailer													
		try {
			$this->isSMTP();                                  	// SMTP-n keresztül küldés
			$this->Host = $this->options['host'];             	// SMTP server
			$this->SMTPAuth = true;                           	// SMTP hitelesítést engedélyezése

			// Implicit TLS titkosítást engedélyezése
			$this->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;  	
			$this->Port = $this->options['port'];             	// SMPT port

			$this->Username = $this->options['email'];        	// SMTP felhasználó
			$this->Password = $this->options['pass'];         	// SMTP jelszo

			$this->WordWrap = 80;                        				// Sortores allitasa
			$this->IsHTML(true);                         				// Kuldes HTML-kent
			$this->CharSet = "UTF-8";                    				// Character set

			$this->setFrom($this->options['from']);           	// Feladó e-mail címe
			$this->FromName = $this->options['fromName'];				// Feladó neve

			// When image(s) exist, then add to email
			if (!is_null($this->args['img'])) {
				foreach($this->args['img'] as $img) {
					$this->AddEmbeddedImage($img['file'], $img['alias']);
				}
			}

		// Exception
		} catch (\Exception $e) {
			$this->setError('email_crete_failed');
		}
	}

	// Get configuration file exist, and has necessary properties 
	public static function isEmailConfigExist() {
		$file = searchForFile('email.ini', array('subFolder' => 'email'));
    if (is_null($file) || ($config = parse_ini_file($file, true)) === false) 
			return false;
		foreach(array('host','port','email','pass','from') as $key) {
			if (!array_key_exists($key, $config) ||
					!is_string($config[$key]) || 
							empty(($config[$key] = trim($config[$key]))))
			return false;
		}
		return true;
	}
}