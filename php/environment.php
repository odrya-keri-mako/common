<?php
declare(strict_types=1);

// Include require file
require_once("Util.php");

class Env {

  private static ?self $instance = null;
  private static array $appPaths = [];

  // Singleton constructor
  private function __construct() {
    $this->set();
    $this->setError();
    $this->getApplicationPath();
    $this->setIncludePath();
    $this->setAutoload();
  }

  // Clone protection
  private function __clone() {}

  // Create environment instance
  public static function create(): self {
    return self::$instance ??= new self();
  }

  // Set environment configurations
  private function set(): void {
    mb_http_output('UTF-8');
    mb_regex_encoding('UTF-8');
    mb_internal_encoding('UTF-8');

    ini_set('memory_limit', '-1');
    set_time_limit(0);
  }

  // Set custom error reporting
  private function setError(): void {
    error_reporting(0);
    set_error_handler([$this, 'customErrorHandler']);
    register_shutdown_function([$this, 'customFatalErrorHandler']);
  }

  // Custom error handler → Mindig `Util::setError()` hívódik meg!
  public function customErrorHandler(int $errNum, string $errMsg, 
                                     string $errFile, int $errLine): void {

    // Set own error array
		$error = [
			'message'		=> trim($errMsg),
			'file'			=> basename(trim($errFile)),
			'line'			=> strval($errLine)
    ];

    // Error types
    $errorTypes = [
      E_ERROR => "E_ERROR",
      E_WARNING => "E_WARNING",
      E_PARSE => "E_PARSE",
      E_NOTICE => "E_NOTICE",
      E_CORE_ERROR => "E_CORE_ERROR",
      E_CORE_WARNING => "E_CORE_WARNING",
      E_COMPILE_ERROR => "E_COMPILE_ERROR",
      E_COMPILE_WARNING => "E_COMPILE_WARNING",
      E_USER_ERROR => "E_USER_ERROR",
      E_USER_WARNING => "E_USER_WARNING",
      E_USER_NOTICE => "E_USER_NOTICE",
      E_STRICT => "E_STRICT",
      E_RECOVERABLE_ERROR => "E_RECOVERABLE_ERROR",
      E_DEPRECATED => "E_DEPRECATED",
      E_USER_DEPRECATED => "E_USER_DEPRECATED",
      E_ALL => "E_ALL"
    ];

    // Set error type
    $error['type'] = $errorTypes[$errNum] ?? "E_UNKNOWN";

    // Set error
    Util::setError($this->setErrorMessage($error));
  }

  // Custom fatal error handler → `Util::setError()` hívódik meg!
  public function customFatalErrorHandler(): void {

    // Get last error
    $error = error_get_last();

    // Check exist
    if ($error !== null && 
        in_array($error['type'], 
        [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
      
      // Error types
      $errorTypes = [
        E_ERROR => "E_ERROR",
        E_CORE_ERROR => "E_CORE_ERROR",
        E_COMPILE_ERROR => "E_COMPILE_ERROR",
        E_USER_ERROR => "E_USER_ERROR"
      ];
      
      // Set error type
      $error['type'] = $errorTypes[$error['type']];
      
      // Set error
		  Util::setError($this->setErrorMessage($error));
    }
  }

  // Set custom error reporting
  private function setErrorMessage(array $error): string {

    // Conver to string
    array_walk($error, function(&$value, $key) {
      $value = "{$key}: {$value}";
    });
    return implode(', ', $error);
  }

  // Get application paths
  private function getApplicationPath(): void {

    $appPaths = [self::checkPath(realpath('./'), 'php')];

    foreach (array_reverse(debug_backtrace()) as $item) {
      $appPaths[] = self::checkPath(dirname($item['file']), 'php');
    }

    $appPaths[] = self::checkPath(dirname(__FILE__), 'php');
    $appPaths   = array_values(array_unique($appPaths));

    // Change working directory to first path
		if (empty($appPaths) || !chdir($appPaths[0])) {
			throw new Exception('Unable to change directory');
		}

    // Set application path(s)
		$currPath = $this->checkPath(realpath('./'), 'php');
		self::$appPaths = array_map(fn($path) => 
                      self::getRelativePath($currPath, $path), $appPaths);
  }

  // Get relative path from working directory
	private function getRelativePath(string $currPath, string $pathTo): string {

		$currParts  = array_values(array_filter(explode('/', $currPath)));
    $toParts    = array_values(array_filter(explode('/', $pathTo)));
    $root       = '';

    while (!empty($currParts) && 
           !empty($toParts) && 
           $currParts[0] === $toParts[0]) {
      $root .= array_shift($currParts) . "/";
      array_shift($toParts);
    }

    return  empty($currParts) ? 
            "./" . implode('/', $toParts) : 
            str_repeat("../", count($currParts)) . 
            implode('/', $toParts) . '/';
	}

  // Get application paths
  public static function getAppPaths(): array {
    return self::$appPaths;
  }
  
  // Normalize paths
  private static function checkPath(string $path, 
                                    ?string $exceptFolder = null): string {
    $path = rtrim(str_replace(DIRECTORY_SEPARATOR, '/', 
                  strtolower(trim($path))), '/') . '/';
    return ($exceptFolder !== null && str_ends_with($path, "/$exceptFolder/")) ? 
            substr($path, 0, -strlen($exceptFolder) - 1) : $path;
  }

  // Search for file
  public static function searchForFile(string $fileName, 
                                       ?array $args = null): ?string {
    if (empty($fileName = trim($fileName))) {
      return null;
    }

    $args = Util::objMerge([
      'subFolder' => '',
      'isRecursive' => true
    ], $args ?? []);

    $args['subFolder'] = self::checkPath($args['subFolder']);

    foreach (self::$appPaths as $path) {
      $file = $path . $args['subFolder'] . $fileName;
      if (is_readable($file)) return $file;

      if ($args['isRecursive']) {
        foreach (glob($path . $args['subFolder'] . '*', GLOB_ONLYDIR) as $dir) {
          $dir = strtolower(basename($dir));
          if ($foundFile = self::searchForFile($fileName, [
            'subFolder' => $args['subFolder'] . $dir, 'isRecursive' => true])) {
            return $foundFile;
          }
        }
      }
    }
    return null;
  }

  // Set include path
  private function setIncludePath(): void {

    $includePaths = explode(PATH_SEPARATOR, get_include_path() ?: '');
    $includePaths = array_unique(array_merge($includePaths, self::$appPaths));

    foreach ($includePaths as &$path) {
      $path = self::checkPath($path);
    }

    set_include_path(implode(PATH_SEPARATOR, $includePaths));
  }

  // Set autoload function
  private function setAutoload(): void {
    spl_autoload_register(function (string $className): void {
      if ($file = self::searchForFile("{$className}.php", [
        'subFolder' => 'php', 'isRecursive' => false])) {
        require_once $file;
      }
    });
  }
}

// Create environment
Env::create();
