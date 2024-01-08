<?php
declare(strict_types=1);

// Set namespace
namespace Document;

/**
 * Class Document
 * Create html5 document
 * @package Document
 */
class Document {

  // Properties
  private $minimized;   // Document is minimized
  private $html;        // Document html tag
  private $head;        // Document head tag
  private $body;        // Document body tag

  /**
   * Document constructor.
   * Create document
   * @param bool|null $minimized is minimized
   */
  public function __construct($minimized=false) {

    // Set properties
    $this->setMinimized($minimized);
    $this->setHtml();
    $this->setHead();
    $this->setBody();
  }

  /**
   * Set is minimized
   * @param bool $minimized is minimized
   */
  private function setMinimized($minimized) {
    if (!is_bool($minimized)) $minimized = false;
    $this->minimized = $minimized;
  }

  /**
   * Get is minimized
   * @return bool is minimized
   */
  public function isMinimized() {
    return $this->minimized;
  }

  /**
   * Set document html tag
   */
  private function setHtml() {
    $this->html = new Tag('html',array('lang'=>'en','dir'=>'ltr'));
    $this->html->setMinimized($this->isMinimized());
  }

  /**
   * Get document html tag
   */
  public function getHtml() {
    return $this->html;
  }

  /**
   * Set document head tag
   * Add defaults tags
   */
  private function setHead() {
    $this->head = new Tag('head');
    $this->head->setMinimized($this->isMinimized());
    $this->head->add(array(
      new Tag('meta',array('charset'=>'utf-8')),
      new Tag('meta',array('http-equiv'=>'content-type','content'=>'text/html;charset=utf-8')),
      new Tag('meta',array('name'=>'viewport','content'=>'width=device-width, initial-scale=1.0'))
    ));
  }

  /**
   * Get document head tag
   * @return Tag document head tag
   */
  public function getHead() {
    return $this->head;
  }

  /**
   * Set document body tag
   */
  private function setBody() {
    $this->body = new Tag('body');
    $this->body->setMinimized($this->isMinimized());
  }

  /**
   * Get document body tag
   * @return Tag document body tag
   */
  public function getBody() {
    return $this->body;
  }

  /**
   * Overwrite method __toString()
   * @return string Html document
   */
  public function __toString() {
    return  '<!DOCTYPE html>' .
      $this->html .
      $this->head .
      $this->body .
      ($this->minimized ? '' : PHP_EOL) .
      '</html>';
  }
}