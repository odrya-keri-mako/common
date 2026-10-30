<?php

declare(strict_types=1);

class Auth {

  // Login
  public static function set(array $user): bool {

    // Check required data
    if (!isset($user['id'], $user['type']) ||
        !is_numeric($user['id']) || 
        (int)$user['id'] <= 0 ||
        !is_string($user['type']) || 
        !$user['type']) {
      self::logout();
      return false;
    }

    // Create new session identifier
    session_regenerate_id(true);

    // If a password property exists, delete it.
    unset(
      $user['password'],
      $user['password_hash'],
      $user['token']
    );

    // Convert to integer
    $user['id'] = (int)$user['id'];

    // Set user
    $_SESSION['user'] = $user;
    return true;
  }

  // Check the user is logged in?
  public static function isLoggedIn(): bool {
    return isset($_SESSION['user']);
  }

  // Get user properties
  public static function me(): ?array {
    return self::isLoggedIn()
      ? $_SESSION['user']
      : null;
  }

  // Get user one property
  public static function getProp(string $property): mixed {
    if (!self::isLoggedIn()) return null;
    return isset($_SESSION['user'][$property])
      ? $_SESSION['user'][$property]
      : null;
  }

  // Get user identifier
  public static function getId(): ?int {
    return self::getProp('id');
  }

  // Get user type
  public static function getType(): ?string {
    return self::getProp('type');
  }

  // Get user name
  public static function getName(): string|array|null {
    if (!self::isLoggedIn()) return null;
    $result = [];
    $keys   = ['name','prefix_name','first_name',
               'middle_name','last_name','postfix_name'];
    foreach($keys as $key) {
      if (isset($_SESSION['user'][$key]))
        $result[$key] = $_SESSION['user'][$key];
    }
    if (!$result) return null;
    if (isset($result['name']) && count(array_keys($result)) === 1)
      return $result['name'];
    return $result;
  }

  // Check user type
  public static function hasType(string $type): bool {
    return self::getType() === $type;
  }

  // Check user is administrator
  public static function isAdmin(): bool {
    return self::hasType('A');
  }

  // Logout
  public static function logout(): void {
    unset($_SESSION['user']);
    if (session_status() === PHP_SESSION_ACTIVE)
      session_regenerate_id(true);
  }

  // Destroy all session data
  public static function destroySession(): void {

    $_SESSION = [];

    if (session_status() === PHP_SESSION_ACTIVE) {

      // Delete session cookie
      if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
          session_name(),
          '',
          time() - 42000,
          $params['path'],
          $params['domain'],
          $params['secure'],
          $params['httponly']
        );
      }

      // Destroy server-side session
      session_destroy();
    }
  }
}