<?php
declare(strict_types=1);

// Set namespace
namespace PHPMailer;

// Use namespace
use PHPMailer\PHPMailer\PHPMailer as PHPMailer;
use Util\Util as Util;

/**
 * Email
 */
class Email extends PHPMailer {

	// Constructor
  function __construct($exceptions=null, $options=null) {
		parent::__construct($exceptions);
		$this->setEmail($options);
  }

	// Clear all addresses to
	public function clearToAddresses() {
		$this->ClearAddresses();
		$this->ClearCCs();
		$this->ClearBCCs();
	}

	// Create email
	private function setEmail($options) {

		// Check/Convert options
		if (is_string($options) && !empty(($options = trim($options))))
			$options = array('fromName'	=> $options);

		// Get configuration file
		$file = searchForFile('email.ini', 'ini');
    if (!is_null($file)) {
      $config 	= parse_ini_file($file, true);
			$options 	= Util::objMerge($config, $options);
		}

		// Merge options with default
    $options = Util::objMerge(array(
      'host' 			=> null,						// SMTP server
			'port'			=> null,						// SMPT port
			'email'			=> null,						// SMTP felhasználó
			'pass' 			=> null,						// SMTP jelszo
			'from'			=> null,						// Feladó e-mail címe
			'fromName'	=> null							// Feladó neve
    ), $options);

		// Set PHPMailer													
		try {
			$this->isSMTP();                                  	// SMTP-n keresztül küldés
			$this->Host = $options['host'];             				// SMTP server
			$this->SMTPAuth = true;                           	// SMTP hitelesítést engedélyezése

			// Implicit TLS titkosítást engedélyezése
			$this->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;  	
			$this->Port = $options['port'];             				// SMPT port

			$this->Username = $options['email'];        				// SMTP felhasználó
			$this->Password = $options['pass'];         				// SMTP jelszo

			$this->WordWrap = 80;                        				// Sortores allitasa
			$this->IsHTML(true);                         				// Kuldes HTML-kent
			$this->CharSet = "UTF-8";                    				// Character set

			$this->setFrom($options['from']);           				// Feladó e-mail címe
			$this->FromName = $options['fromName'];							// Feladó neve

		// Exception
		} catch (\Exception $e) {
			$this->error_count++;
		}
	}
}