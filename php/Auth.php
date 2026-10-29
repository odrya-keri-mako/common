<?php

declare(strict_types=1);

class Auth {

  // Login
  public static function login(array $user): bool {

    // Check required data
    if (!isset($user['id'], $user['name'], $user['type'])) {
      self::logout();
      return false;
    }

    // Create new session identifier
    session_regenerate_id(true);

    // Set user
    $_SESSION['user'] = [
      'id'   => (int)$user['id'],
      'name' => (string)$user['name'],
      'type' => (string)$user['type']
    ];
    return true;
  }

  // Check the user is logged in?
  public static function isLoggedIn(): bool {
    return isset($_SESSION['user']);
  }

  // Get user
  public static function getUser(): ?array {
    return self::isLoggedIn()
      ? $_SESSION['user']
      : null;
  }

  // Get user identifier
  public static function getUserId(): ?int {
    return self::isLoggedIn()
      ? $_SESSION['user']['id']
      : null;
  }

  // Get user type
  public static function getUserType(): ?string {
    return self::isLoggedIn()
      ? $_SESSION['user']['type']
      : null;
  }

  // Get user name
  public static function getUserName(): ?string {
    return self::isLoggedIn()
      ? $_SESSION['user']['name']
      : null;
  }

  // Check user is administrator
  public static function isAdmin(): bool {
    return self::isLoggedIn() &&
           $_SESSION['user']['type'] === 'A';
  }

  // Logout
  public static function logout(): void {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE)
      session_destroy();
  }
}