<?php
declare(strict_types=1);

// Set namespace
namespace Util;


/**
 * File
 */

class File {

	// Read file by line
	public static function readByLine($file, $skipEmpty=true) {
		if (is_readable($file)) {
			if (($handle = fopen($file, "r"))) {
				if (!is_bool($skipEmpty)) $skipEmpty = true;
				$result = array();
				while(!feof($handle)) {
					$line = fgets($handle);
					if (is_string($line)) {
						$line = trim($line);
						if (!empty($line) || !$skipEmpty)
							$result[] = $line;
					}
				}
				fclose($handle);
				return $result;
			} else	Util::setError("Unable to open file {$file}!");
		} else		Util::setError("The file cannot be found or cannot be read {$file}!");
	}
}