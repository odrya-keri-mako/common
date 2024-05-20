<?php
declare(strict_types=1);

// Set namespace
namespace Util;

/**
 * Utilities
 */

 class Util {

	// Set result
  public static $result = array(
    "data"  => null,
    "error" => null
  );

	// Check is error
  public static function isError() {
    return !is_null(self::$result["error"]);
  }

  // Set error
  public static function setError($msg=null, &$class1=null, &$class2=null, &$class3=null) {
    if ($class1) $class1=null;
    if ($class2) $class2=null;
    if ($class3) $class3=null;
    if (!is_string($msg) || empty(($msg = trim($msg)))) 
			$msg = "Unknow error!";
		self::$result["error"] = $msg;
    self::setResponse();
  }

  // Set response
  public static function setResponse($data=null) {
    self::$result["data"] = $data;
    echo self::jsonEncode(self::$result, 'response');
    exit(self::isError() ? 1 : 0);
  }

	// JSON decode (convert data from json string)
  public static function jsonDecode($var, $errMsg=null) {
    $result = json_decode($var, true, 512, 0);
    if (json_last_error() !== JSON_ERROR_NONE)
      throw new \Exception("Unable to decode {$errMsg}!");
    return $result;
  }

  // JSON encode (convert data to json string)
  public static function jsonEncode($var, $errMsg=null) {
    $result = json_encode($var, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (json_last_error() !== JSON_ERROR_NONE)
      throw new \Exception("Unable to encode {$errMsg}!");
    return $result;
  }

  // Base64 decode
  public static function base64Decode($data) {
    $mod4 = strlen($data) % 4;
    if ($mod4) $data .= substr('====', $mod4);
    return base64_decode($data);
  }

  // Base64 encode
  public static function base64Encode($data) {
    return base64_encode($data);
  }

  // Set session
  public static function setSession($args=null) {

    // Check session arguments
    if (!self::checkSessionArgs($args, array(
      'id'            => null,
      'key'           => null,
      'data'          => null,
      'isMerge'       => false
    ))) return false;

    // Check session status
		if (session_status() !== PHP_SESSION_ACTIVE)
      session_start();

    // Check session application identifier key not exist
    if (!isset($_SESSION[$args['id']])) {
      if (!is_null($args['key']))
            $_SESSION[$args['id']] = array($args['key'] => $args['data']);
      else  $_SESSION[$args['id']] = $args['data'];
    } else {
      if (!is_null($args['key'])) {
        if (!is_array($_SESSION[$args['id']]))
          $_SESSION[$args['id']] = array($_SESSION[$args['id']]);
        if (isset($_SESSION[$args['id']][$args['key']])) {
          if ($args['isMerge'])
                $_SESSION[$args['id']][$args['key']] = 
                  Util::objMerge($_SESSION[$args['id']][$args['key']], $args['data']);
          else  $_SESSION[$args['id']][$args['key']] = $args['data'];
        } else  $_SESSION[$args['id']][$args['key']] = $args['data'];
      } elseif ($args['isMerge']) {
              $_SESSION[$args['id']] = Util::objMerge($_SESSION[$args['id']], $args['data']);
      } else  $_SESSION[$args['id']] = $args['data'];
    }

    // Write, and close session
    if (session_status() === PHP_SESSION_ACTIVE)
      session_write_close();

    // Return
    return true;
  }

  // Get session
  public static function getSession($args=null) {

    // Check session arguments
    if (!self::checkSessionArgs($args, array(
      'id'            => null,
      'key'           => null,
      'filter'        => null,
      'isDestroy'     => false
    ))) return null;

    // Check session status
		if (session_status() !== PHP_SESSION_ACTIVE)
      session_start();

    // Check session application identifier key exist
    if (!isset($_SESSION[$args['id']])) {

      // Write, and close session
		  if (session_status() === PHP_SESSION_ACTIVE)
        session_write_close();

      // Return
      return null;
    }

    // Check session property key, and set result
    if (!is_null($args['key'])) {

      // Check session property key exist
      if (!isset($_SESSION[$args['id']][$args['key']])) {

        // Write, and close session
		    if (session_status() === PHP_SESSION_ACTIVE)
          session_write_close();
        
        // Return
        return null;

      // Set result
      } else  $result = $_SESSION[$args['id']][$args['key']];
    } else    $result = $_SESSION[$args['id']];

    // Check filter properties, and result is associative array
    if (!is_null($args['filter']) && self::isAssocArray($result)) {
      $filter = $args['filter'];
      $result = array_filter($result, function ($key) use ($filter) {
        return in_array($key, $filter);
      }, ARRAY_FILTER_USE_KEY);
      if (empty($result)) $result = null;
    }

    // Check result exist, and arguments is destroy
    if ($args['isDestroy']) {

      // Unset application session key when exist
      if (!is_null($args['key']) &&
          isset($_SESSION[$args['id']][$args['key']]))
          unset($_SESSION[$args['id']][$args['key']]);

      // Unset application session when has not property
      if (  is_null($_SESSION[$args['id']]) ||
         (is_string($_SESSION[$args['id']]) &&
              empty($_SESSION[$args['id']])) || 
          (is_array($_SESSION[$args['id']]) && 
              empty($_SESSION[$args['id']])))
              unset($_SESSION[$args['id']]);
    }

    // Write, and close session
    if (session_status() === PHP_SESSION_ACTIVE)
      session_write_close();

    // Return result
    return $result;
  }

  // Check session arguments
  private static function checkSessionArgs(&$args, $keys) {

    // Check/Convert arguments
    if (is_string($args) && !empty(($args = trim($args))))
      $args = array('id' => $args);
    if (is_bool($args)) {
      if (array_key_exists('isMerge', $keys))
            $args = array('isMerge' => $args);
      else  $args = array('isDestroy' => $args);
    }

    // Merge arguments with default
    $args = self::objMerge($keys, $args, true);

    // Check application identifier
    if (!is_string($args['id']) || 
            empty(($args['id'] = trim($args['id']))))
      return false;

    // Check session property key
    if (!is_string($args['key']) || 
            empty(($args['key'] = trim($args['key']))))
                   $args['key'] = null;

    // Check filter properties
    if (array_key_exists('filter', $keys)) {
      if (is_string($args['filter']) && 
            !empty(($args['filter'] = trim($args['filter'])))) {
        $args['filter'] = strtr($args['filter'], array(',' => ';'));
        $args['filter'] = explode(';', $args['filter']);
        $args['filter'] = array_values(array_filter($args['filter']));
      }
      if (!is_array($args['filter']) || 
              empty($args['filter'])) 
                    $args['filter'] = null;
    }

    // Return result
    return true;
  }

	// Get arguments
  public static function getArgs($isRequired=true) {

    // Check parameters
    if (!is_bool($isRequired)) $isRequired = true;

    // Get arguments
    if (isset($_POST['data'])) {
      $args = $_POST['data'];
      unset($_POST['data']);
      if (!isset($_SERVER['REQUEST_METHOD']))
        $_SERVER['REQUEST_METHOD'] = 'POST';
    } elseif (isset($_GET['data'])) {
      $args = $_GET['data'];
      unset($_GET['data']);
      if (!isset($_SERVER['REQUEST_METHOD']))
        $_SERVER['REQUEST_METHOD'] = 'GET';
    } else {
      $args = file_get_contents("php://input");
      if (!isset($_SERVER['REQUEST_METHOD']))
        $_SERVER['REQUEST_METHOD'] = 'POST';
    }


		// Check arguments
		if (!is_string($args) || 
        empty(($args = trim($args))))
			$args = null;

    // Check arguments exist
    if (!is_null($args)) {

      // Decode arguments
      $args = self::jsonDecode($args, 'arguments');

    // Check is required
    } elseif($isRequired)
      throw new \Exception("Missing parameters!");

    // Return arguments
    return $args;
  }

	// Merge two object/arrays
  public static function objMerge($target=null, $source=null, $existKeys=false) {

    // Check parameters
    if (!is_array($target))   $target     = array();
    if (!is_array($source))   $source     = array();
    if (!is_bool($existKeys)) $existKeys  = false;

    // Each source keys
    foreach($source as $key => $value) {

      // Check key exist in target
      if (array_key_exists($key, $target)) {

        // Check type is equal
        if (gettype($target[$key]) === gettype($value)) {
          
          // Check type is array
          if (is_array($value)) {

            // Merge two object/arrays recursive
            $target[$key] = self::objMerge($target[$key], $value, $existKeys);

          } else                          $target[$key] = $value;
        } elseif (is_null($target[$key])) $target[$key] = $value;
      } elseif (!$existKeys)              $target[$key] = $value;
    }

    // Return result
    return $target;
  }

  // Check is array associative
  public static function isAssocArray($arr) {
    return  is_array($arr) &&
            !empty($arr) && 
            array_keys($arr) !== range(0, count($arr) - 1);
  }

  // Capitalize
  public static function capitalize($str, $isLowerEnd=true, $encoding="utf-8") {
    if (!is_string($str)) $str = "";
    $str = trim($str);
    if (empty($str)) return $str;
    if (!is_string($encoding) || empty(($encoding = trim($encoding)))) $encoding = "utf-8";
    $firstLetter = mb_strtoupper(mb_substr($str, 0, 1, $encoding), $encoding);
    if (!is_bool($isLowerEnd)) $isLowerEnd = true;
    if ($isLowerEnd)
          $strEnd = mb_strtolower(mb_substr($str, 1, mb_strlen($str, $encoding), $encoding), $encoding);
    else  $strEnd = mb_substr($str, 1, mb_strlen($str, $encoding), $encoding);
    return $firstLetter . $strEnd;
  }

  // Get a substring(s) between two strings
  public static function substrBetween($str=null, $beg=null, $end=null) {

    // Set result
    $result = array();

    // Check parameters
    if (!is_string($str) || empty(($str = trim($str))))
      return $result;
    if (!is_string($beg) || empty(($beg = trim($beg))))
      $beg = "{{";
    if (!is_string($end) || empty(($end = trim($end))))
      $end = "}}";

    // Get a substring(s) between two strings 
    while(true) {
      if (($posEnd = mb_strpos($str, $end, 0, 'utf-8')) === false) break;
      $key = trim(mb_substr($str, 0, $posEnd, 'utf-8'));
      if (($posBeg = mb_strpos($key, $beg, 0, 'utf-8')) === false) break;
      $key = trim(mb_substr($key, $posBeg + mb_strlen($beg), null, 'utf-8'));
      if (!empty($key)) array_push($result, $key);
      $str = trim(mb_substr($str, $posEnd + mb_strlen($end), null, 'utf-8'));
    }

    // Return result
    return array_values(array_unique(array_filter($result)));
  }

	// Minimize html
	public static function minimizeHtml($html=null) {
    
		// Check parameters
    if (!is_string($html)) $html = '';
		
    // Check is empty
    if (empty(($html = trim($html)))) return $html;
		
    // Remove carriage return, new line, and tabulator
    $html = strtr($html, array("\r" => "", "\n" => " ", "\t" => ""));
    
    // Remove extra white-space(s) between HTML attribute(s)
    $html = preg_replace_callback(
      '#<([^\/\s<>!]+)(?:\s+([^<>]*?)\s*|\s*)(\/?)>#s', function($matches) {
      return '<' . $matches[1] . preg_replace('#([^\s=]+)(\=([\'"]?)(.*?)\3)?(\s+|$)#s', ' $1$2', $matches[2]) . $matches[3] . '>';
    }, str_replace("\r", "", $html));
    
    // Minimize in tag CSS declaration(s)
    if(strpos($html, ' style=') !== false) {
      $html = preg_replace_callback(
        '#<([^<]+?)\s+style=([\'"])(.*?)\2(?=[\/\s>])#s', function($matches) {
        return '<' . $matches[1] . ' style=' . $matches[2] . self::nimizeHtmlCssDeclarations($matches[3]) . $matches[2];
      }, $html);
    }

    // Return result
    return trim(preg_replace(
      array(
          '#<(img|input)(>| .*?>)#s',
          '#(<!--.*?-->)|(>)(?:\n*|\s{2,})(<)|^\s*|\s*$#s',
          '#(<!--.*?-->)|(?<!\>)\s+(<\/.*?>)|(<[^\/]*?>)\s+(?!\<)#s',
          '#(<!--.*?-->)|(<[^\/]*?>)\s+(<[^\/]*?>)|(<\/.*?>)\s+(<\/.*?>)#s', 
          '#(<!--.*?-->)|(<\/.*?>)\s+(\s)(?!\<)|(?<!\>)\s+(\s)(<[^\/]*?\/?>)|(<[^\/]*?\/?>)\s+(\s)(?!\<)#s',
          '#(<!--.*?-->)|(<[^\/]*?>)\s+(<\/.*?>)#s',
          '#<(img|input)(>| .*?>)<\/\1>#s',
          '#(&nbsp;)&nbsp;(?![<\s])#',
          '#(?<=\>)(&nbsp;)(?=\<)#',
          '#\s*<!--(?!\[if\s).*?-->\s*|(?<!\>)\n+(?=\<[^!])#s'
      ),
      array(
          '<$1$2</$1>',
          '$1$2$3',
          '$1$2$3',
          '$1$2$3$4$5',
          '$1$2$3$4$5$6$7',
          '$1$2$3',
          '<$1$2',
          '$1 ',
          '$1',
          ""
      ),
      $html
    ));
	}

  // Minimize html css declarations
  private static function nimizeHtmlCssDeclarations($html=null) {
    
		// Check parameters
    if (!is_string($html)) $html = '';
		
    // Check is empty
    if (empty(($html = trim($html)))) return $html;
		
    // Return result
    return trim(preg_replace(
      array(
          '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')|\/\*(?!\!)(?>.*?\*\/)|^\s*|\s*$#s',
					'#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/))|\s*+;\s*+(})\s*+|\s*+([*$~^|]?+=|[{};,>~+]|\s*+-(?![0-9\.])|!important\b)\s*+|([[(:])\s++|\s++([])])|\s++(:)\s*+(?!(?>[^{}"\']++|"(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')*+{)|^\s++|\s++\z|(\s)\s+#si',
          '#(?<=[\s:])(0)(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)#si',
          '#:(0\s+0|0\s+0\s+0\s+0)(?=[;\}]|\!important)#i',
          '#(background-position):0(?=[;\}])#si',
          '#(?<=[\s:,\-])0+\.(\d+)#s',
          '#(\/\*(?>.*?\*\/))|(?<!content\:)([\'"])([a-z_][a-z0-9\-_]*?)\2(?=[\s\{\}\];,])#si',
          '#(\/\*(?>.*?\*\/))|(\burl\()([\'"])([^\s]+?)\3(\))#si',
          '#(?<=[\s:,\-]\#)([a-f0-6]+)\1([a-f0-6]+)\2([a-f0-6]+)\3#i',
          '#(?<=[\{;])(border|outline):none(?=[;\}\!])#',
          '#(\/\*(?>.*?\*\/))|(^|[\{\}])(?:[^\s\{\}]+)\{\}#s'
      ),
      array(
          '$1',
          '$1$2$3$4$5$6$7',
          '$1',
          ':0',
          '$1:0 0',
          '.$1',
          '$1$3',
          '$1$2$4$5',
          '$1$2$3',
          '$1:0',
          '$1$2'
      ),
      $html
    ));
	}

  // Short array
  public static function usort_local(&$arr, $order=null) {
    if (!is_array($arr) || empty($arr)) return;
    $currentOrder = setlocale(LC_COLLATE, 0);
    if (!is_string($order) || empty(($order = trim($order))))
      $order = "Hungarian_Hungary.utf8";
    setlocale(LC_COLLATE, $order);
    usort($arr, function($a, $b) {
      return strcoll(mb_strtolower($a), mb_strtolower($b));
    });
    setlocale(LC_COLLATE, $currentOrder);
    return;
  }

  // Insert arry to array before/after every chunk items
  public static function insertArryToArray($target, $insert, $options=null) {

    // Set result, and check arrays
    $result = array();
    if (!is_array($target)) $target = array($target);
    if (!is_array($insert)) $insert = array($insert);
    if (self::isAssocArray($target)) $target = array_values($target);
    if (self::isAssocArray($insert)) $insert = array_values($insert);
    if (empty($target)) return $insert;
    if (empty($insert)) return $target;
    
    // Check/Merge options
    if (is_int($options) && $options > 0) $options = array("chunkLength" => $options);
    if (is_bool($options)) $options = array("insertToBeg" => $options);
    $options = self::objMerge(array(
      "chunkLength" => 1,
      "insertToBeg" => true
    ), $options, true);
  
    // Create chunked array from traget
    $target = array_chunk($target, $options["chunkLength"]);
  
    // Combine two array
    foreach($target as $chunk) {
      if ($options["insertToBeg"])
            $result = array_merge($result, $insert, $chunk);
      else	$result = array_merge($result, $chunk, $insert); 
    }
  
    // Return result
    return $result;
  }
}