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
  function __construct($args=null) {

		// Check arguments
		$this->checkArguments($args);
		
		// Set properties
		$this->set_id($args["id"]);
		$this->set_type($args["type"]);
		$this->set_rule();
		$this->set_data();
  }

	// Check arguments
	private function checkArguments(&$args) {

		// Check arguments
		if (is_string($args)) $args = array("id" => $args);
		$args = Util::objMerge(array(
			"id"		=> null,
			"type"	=> null
		), $args, true);
	}

	// Set language identifier
  private function set_id($id) {
    if (!is_string($id) || empty(($id = trim($id)))) $id = "en";
    $this->id = strtolower(trim($id));
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

		// Get application global
		global $___app___;

		// Set empty data
		$data = array();

		// Each application path(s)
		foreach($___app___["path"] as $path) {

			// Set language file
			$file = $path . "lang/" . $this->id . ".json";

			// Check exist, and readeble
			if (is_readable($file)) {

				// Get content
				$content = file_get_contents($file);

				// Decode, when is not error merge result with data
				$result = json_decode($content, true, 512, 0);
    		if (json_last_error() === JSON_ERROR_NONE)
					$data = Util::objMerge($result, $data);
			}
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
		$result = trim($result);
		if (empty($result) &&
				array_key_exists('name', $data) && 
					is_string($data['name']) &&
					!empty(($data['name'] = trim($data['name'])))) {
			$result = $data['name'];
		}
		return $result;
	}
}