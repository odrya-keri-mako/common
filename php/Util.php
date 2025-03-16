<?php
declare(strict_types=1);

class Util {

  // Set result
  private static array $result = [
    "data"  => null,
    "error" => null
  ];

  // Check is error
  public static function isError(): bool {
    return self::$result["error"] !== null;
  }

  // Set error
  public static function setError(?string $msg = null): void {
    self::$result["error"] =  $msg && trim($msg) !== '' ? 
                              trim($msg) : "Unknown error!";
    self::setResponse();
  }

  // Set response
  public static function setResponse(mixed $data = null): void {
    self::$result["data"] = $data;
    echo self::jsonEncode(self::$result);
    exit(self::isError() ? 1 : 0);
  }

  // JSON decode (convert json string to data)
  public static function jsonDecode(string $var): mixed {
    $result = json_decode($var, true, 512, JSON_THROW_ON_ERROR);
    return $result;
  }

  // JSON encode (convert data to json string)
  public static function jsonEncode(mixed $var): string {
    return json_encode($var,  JSON_UNESCAPED_UNICODE | 
                              JSON_UNESCAPED_SLASHES | 
                              JSON_THROW_ON_ERROR);
  }

  // Base64 decode
  public static function base64Decode(string $data): string {
    return base64_decode(str_pad($data, strlen($data) + 
                        (4 - strlen($data) % 4) % 4, '=', STR_PAD_RIGHT));
  }

  // Base64 encode
  public static function base64Encode(string $data): string {
    return base64_encode($data);
  }

  // Get arguments
  public static function getArgs(bool $isDecode = true): mixed {
    $args = $_GET['data'] ?? $_POST['data'] ?? file_get_contents('php://input');
    $args = is_string($args) && trim($args) !== '' ? 
            trim($args) : null;
    return $isDecode && $args !== null ? self::jsonDecode($args) : $args;
  }

  // Merge two object/arrays
  public static function objMerge(?array $target = [], 
                                  ?array $source = [], 
                                  bool $existKeys = false): array {
    foreach ($source as $key => $value) {
      if (array_key_exists($key, $target)) {
        if (gettype($target[$key]) === gettype($value)) {
          $target[$key] = is_array($value) ? 
              self::objMerge($target[$key], $value, $existKeys) : $value;
        } elseif ($target[$key] === null) {
          $target[$key] = $value;
        }
      } elseif (!$existKeys) {
        $target[$key] = $value;
      }
    }
    return $target;
  }

  // Check if array is associative
  public static function isAssocArray(mixed $arr): bool {
    return is_array($arr) && !empty($arr) && array_keys($arr) !== range(0, count($arr) - 1);
  }

  // Convert array of associative arrays to simple array
  public static function arrayOfAssocArrayToArray(array $arr, 
                                                  mixed $fixValue = null): array {
    return  array_merge(...array_map(fn($item) => $fixValue === null ? 
            array_values($item) : [$fixValue, ...array_values($item)], $arr));
  }

  // Convert array of arrays to simple array
  public static function arrayOfArrayToArray(array $arr, 
                               mixed $fixValue = null): array {
    return  is_null($fixValue) ? 
            array_merge(...$arr) : 
            array_merge(...array_map(fn($item) => [$fixValue, ...$item], $arr));
  }

  // Inserts a fixed value before all elements of an array
  public static function prependToArray(array $arr, mixed $fixValue): array {
    return  array_reduce($arr, fn($a, $item) => 
            [...$a, $fixValue, $item], []);
  }
}