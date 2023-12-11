<?php
declare(strict_types=1);

// Set namespace
namespace PHPMailer;

use Exception;
use \Util\Util as Util;
use \PHPMailer\PHPMailer\PHPMailer as PHPMailer;
use \PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Email
 */

class Email {

	// Set properties
  private $email,
					$subject,
					$body,
					$addressees,
					$attachments,
					$error = null;

	// Constructor
  function __construct($options=null) {

		// Set email
		$this->set_email($options);
  }

	// Destructor
	function __destruct() {
		$this->email = null;
  }

	// Set email
	private function set_email($options) {

		// Get configuration file
		$file = searchForFile('email.ini', 'ini');
    if (!is_null($file)) {
      $config 	= parse_ini_file($file, true);
			$options 	= Util::objMerge($config, $options);
		}

    $options = Util::objMerge(array(
      'host' 			=> null,						// SMTP server
			'port'			=> null,						// SMPT port
			'email'			=> null,						// SMTP felhasználó
			'pass' 			=> null,						// SMTP jelszo
			'from'			=> null,						// Feladó e-mail címe
			'fromName'	=> null							// Feladó neve
    ), $options);

		$this->email = new PHPMailer();														// PHPMailer létrehozása
		$this->email->isSMTP();                                  	// SMTP-n keresztül küldés
  	$this->email->Host = $options['host'];             				// SMTP server
  	$this->email->SMTPAuth = true;                           	// SMTP hitelesítést engedélyezése

		// Implicit TLS titkosítást engedélyezése
  	$this->email->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  	
  	$this->email->Port = $options['port'];             				// SMPT port

		$this->email->Username = $options['email'];        				// SMTP felhasználó
  	$this->email->Password = $options['pass'];         				// SMTP jelszo
  	$this->email->setFrom($options['from']);           				// Feladó e-mail címe
  	$this->email->FromName = $options['fromName'];     				// Feladó neve

		$this->email->WordWrap = 80;                        			// Sortores allitasa
  	$this->email->IsHTML(true);                         			// Kuldes HTML-kent
  	$this->email->CharSet = "UTF-8";                    			// Character set
	}

	// Get email
	public function get_email() {
		return $this->email;
	}

	// Set subject
	public function set_subject($subject) {
		$this->subject = $subject;
	}

	// Get subject
	public function get_subject() {
		return $this->subject;
	}

	// Set body
	public function set_body($body) {
		$this->body = $body;
	}

	// Get body
	public function get_body() {
		return $this->body;
	}

	// Set addressees
	public function set_addressees($address) {
		if (!is_array($this->addressees)) $this->addressees = array();
		if (is_string($address)) $address = array('address' => $address);
		$address = Util::objMerge(array(
      'address'	=> null,
			'name'		=> null
    ), $address);
		array_push($this->addressees, $address);
	}

	// Get addressees
	public function get_addressees() {
		return $this->addressees;
	}

	// Set attachments
	public function set_attachments($attachment) {
		if (!is_array($this->attachments)) $this->attachments = array();
		if (is_string($attachment)) $attachment = array('attachment' => $attachment);
		$attachment = Util::objMerge(array(
      'attachment'	=> null,
			'name'				=> null
    ), $attachment);
		array_push($this->attachments, $attachment);
	}

	// Get attachments
	public function get_attachments() {
		return $this->attachments;
	}

	// Set error
	private function set_error($error) {
		if (!is_string($error)) $error = "Unknown error";
		$this->error = $error;
	}

	// Get error
	public function get_error() {
		return $this->error;
	}

	// Check is error
	public function isError() {
		return !is_null($this->error);
	}

	// Send email
	public function send_email() {
		try {
			if (!is_array($this->addressees)) {
				$this->set_error('Missing email adress!');
				return;
			}
			foreach($this->addressees as $item) {
				$this->email->AddAddress($item['address'], $item['name']);
			}
			if (is_array($this->attachments)) {
				foreach($this->attachments as $item) {
					$this->email->addAttachment($item['attachment'], $item['name']);
				}
			}
			$this->email->Subject = $this->get_subject();
			$this->email->Body = $this->get_body();
			$this->email->Send();
		} catch (PHPMailerException $e) {
			$this->set_error($e->errorMessage());
		} catch (Exception $e) {
			$this->set_error($e->getMessage());
		}
	}
}