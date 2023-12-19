<?php
declare(strict_types=1);

// Set namespace
namespace Language;

// Use namescapes aliasing
use Util\Util as Util;

/**
 * Language
 */

class Language {

	// Set properties
  private $id,
					$type,
					$rule,
					$data;

	// Constructor
  function __construct($id=null, $type=null) {
		$this->change($id, $type);
  }

	// Destructor
	function __destruct() {
		$this->id 	= null;
		$this->type = null;
		$this->rule = null;
		$this->data	= null;
  }

	// Change language
	public function change($id=null, $type=null) {
		$this->set_id($id);
		$this->set_type($type);
		$this->set_rule();
		$this->set_data();
	}

	// Set language identifier
  private function set_id($id) {
    if (!is_string($id)) $id = "en";
    $this->id = trim($id);
  }
  
  // Get language identifier
  public function get_id() {
    return $this->id;
  }

	// Set language type
  private function set_type($type) {
    if (!is_string($type)) $type = "west";
		$type = mb_strtolower(trim($type), 'utf-8');
		if (!in_array($type, array('west', 'east'))) $type = "west";
    $this->type = $type;
  }
  
  // Get language type
  public function get_type() {
    return $this->type;
  }

	//Set language rule
	private function set_rule() {
		$rule = array(
			"west" => array('prefix_name','first_name','middle_name','last_name','suffix_name'),
			"east" => array('prefix_name','last_name','first_name','middle_name','suffix_name')
		);
		$this->rule = $rule[$this->type];
	}

	// Get language rule
	public function get_rule() {
		return $this->rule;
	}

	// Set language data
	private function set_data() {
		$data = array();
		$file = searchForFile("{$this->id}.json", "lang");
		if (!is_null($file)) {
			$content 	= file_get_contents($file);
			$result 	= json_decode($content, true, 512, 0);
    	if (json_last_error() === JSON_ERROR_NONE)
				$data = $result;
		}
		$this->data = $data;
	}

	// Get language data
	public function get_data() {
		return $this->data;
	}

	// Translate
	public function translate($data=null, $notCapitalize=null) {
		if (is_string($data)) {
			$data = trim(strtr($data, array(';' => ',')));
			$data = array_values(array_filter(explode(",", $data)));
		}
		if (is_array($data) && !Util::isAssocArray($data)) {
			$data = array_unique($data);
			$data = array_combine($data, $data);
		}
		if (!Util::isAssocArray($data)) return null;
		if (is_string($notCapitalize)) {
			$notCapitalize = trim(strtr($notCapitalize, array(';' => ',')));
			$notCapitalize = array_values(array_filter(explode(",", $notCapitalize)));
		}
		if (!is_array($notCapitalize)) $notCapitalize = array();
		foreach($data as $key => $langKey) {
			if (is_string($langKey)) {
				if (array_key_exists($langKey, $this->data)) {
					$data[$key] = $this->data[$langKey];
					if (!in_array($langKey, $notCapitalize))
						$data[$key] = Util::capitalize($data[$key], false);
				} else $data[$key] = $langKey;
			}
		}
		return $data;
	}

	// Translate
	public function translateOld($data=null, $isCapitalize=false) {
		if (is_string($data)) {
			$data = trim(strtr($data, array(';' => ',')));
			$data = array_values(array_filter(explode(",", $data)));
		}
		if (is_array($data) && !Util::isAssocArray($data)) {
			$data = array_unique($data);
			$data = array_combine($data, $data);
		}
		if (!Util::isAssocArray($data)) return null;
		if (!is_bool($isCapitalize)) $isCapitalize = false;
		foreach(array_keys($data) as $key) {
			if (array_key_exists($key, $this->data))
						$data[$key] = $isCapitalize ? 
													Util::capitalize($this->data[$key]) : 
													$this->data[$key];
			else	$data[$key] = $key;
		}
		return $data;
	}

	// Get person name of language rule
	public function getUserName($data) {
		$result = "";
		foreach($this->rule as $field) {
			if (array_key_exists($field, $data) && 
					is_string($data[$field]) &&
					!empty(($data[$field] = trim($data[$field])))) {
				$result .= ($data[$field] . " ");
			}
		}
		return trim($result);
	}
}