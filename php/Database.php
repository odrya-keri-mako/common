<?php

declare(strict_types=1);

class Database {

  // Set properties
  private ?PDO $dbHandle = null;
  private array $conn = [];

  // Constructor
  public function __construct(?string $db = null) {

    // Set connection details
    $this->setConnection($db);

    // Connect to MySQL server
    $this->connect();
  }

  // Destructor
  public function __destruct() {
    $this->dbHandle = null;
  }

  // Set connection details
  private function setConnection(?string $db): void {

    // When configuration file exist, then get connection details
    $file = Env::searchForFile('db_config.ini', ['subFolder' => 'db']);
    $conn = $file ? parse_ini_file($file, true) : [];

    // Merge with default
    $this->conn = Util::objMerge([
      "host" => "localhost",
      "dbname" => "",
      "user" => "root",
      "pass" => ""
    ], $conn, true);

    // Set database name if exist
    if ($db) $this->conn["dbname"] = $db;
  }

  // Connect to MySQL server
  private function connect(): void {
    try {
      $dsn = "mysql:host={$this->conn['host']};dbname={$this->conn['dbname']};charset=utf8";
      $this->dbHandle = new PDO(
        $dsn, 
        $this->conn['user'], 
        $this->conn['pass'], 
        [
          PDO::MYSQL_ATTR_INIT_COMMAND       => "SET NAMES utf8",
          PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
          PDO::ATTR_ERRMODE                  => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE       => PDO::FETCH_ASSOC,
          PDO::ATTR_ORACLE_NULLS             => PDO::NULL_EMPTY_STRING,
          PDO::ATTR_EMULATE_PREPARES         => false,
          PDO::ATTR_STRINGIFY_FETCHES        => false
        ]
      );
    } catch (Exception $e) {
        Util::setError("Unable to connect to MySQL server: " . $e->getMessage());
    }
  }

  // Get query type
  private function getType(string $query, ?string $type = null): string {
    return strtoupper($type ?: strtok(trim(preg_replace('!\s+!', ' ', $query)), " "));
  }

  // Preparate sql command INSERT
  public function preparateInsert(string $tblName, array $fields, 
                                int $count = 1): ?string {

    // Check parameters
    if (empty($tblName = trim($tblName)) || empty($fields)) return null;
    if (Util::isAssocArray($fields)) $fields = array_keys($fields);
    
    // Generate command 
    $query  = "(`" . implode('`,`', $fields) . "`)";
    $values = str_repeat('?,', count($fields) - 1) . '?';
    $values = " VALUES " . str_repeat("($values),", $count - 1) . "($values);";
    
    // Return result 
    return "INSERT INTO `$tblName` $query$values";
  }

  // Preparate sql command UPDATE
  public function preparateUpdate(string $tblName, array $fields, 
                                array|string|null $filter = null): ?string {

    // Check parameters
    if (empty($tblName = trim($tblName)) || empty($fields)) return null;
    if (Util::isAssocArray($fields)) $fields = array_keys($fields);
    if (is_string($filter)) $filter = explode(";", $filter);
    if (Util::isAssocArray($filter)) $filter = array_keys($filter);
    
    // Set filter, and result
    $filter = (array) $filter;
    $result = [];
    
    // Set par field, value
    foreach ($fields as $field) {
      if (!in_array($field, $filter, true)) {
        $result[] = "`$field` = :$field";
      }
    }
    
    // Return result 
    return "UPDATE `$tblName` SET " . implode(", ", $result);
  }

  // Execute
  public function execute(string $query, array|string|null $params = null, 
                          ?string $type = null): ?array {

      // Set result
      $result = null;

      // Check/Get query type
      $type = $this->getType($query, $type);

      // Check parameters
      if (!is_null($params) && !is_array($params)) $params = [$params];
      
      try {

        // Prepare statement for execution and returns a statement object
        $stmt = $this->dbHandle->prepare($query);

        // Executes a prepared statement
        $stmt->execute($params);

        switch ($type) {

          case "SELECT":

            // Get result
            $result = $stmt->fetchAll();

            // Check/Return result
            return empty($result) ? null : $result;

          case "INSERT":
          case "UPDATE":
          case "DELETE":

            // Get affected rows
            $result = ["affectedRows" => $stmt->rowCount()];

            // When query type is insert and successfully inserted data
            if ($type === "INSERT" && $result["affectedRows"] > 0) {

              // Get last inserted identifier (when autoincrement field exist)
              $lastId = $this->dbHandle->lastInsertId();

              // Check has value
              if ($lastId !== false) {

                // Calculate first/last inserted identifier
                $result["firstInsertId"] = (int) $lastId;
                $result["lastInsertId" ] = $result["affectedRows"] + (int) $lastId - 1;
              }
            }

            // Return result
            return $result;
        }
      } catch (PDOException | Exception $e) {
        Util::setError($e->getMessage());
      }

      // Return result
      return null;
  }
}