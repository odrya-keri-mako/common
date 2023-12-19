<?php
declare(strict_types=1);

// Set namespace
namespace Document;

/**
 * Class Tag
 * Create html5 tag
 * @package Document
 */
class Tag {

  // Properties
  private const TAB_SIZE = 2;       // Tabulator size
  private $parent     = null;       // Parent tag
  private $minimized  = false;      // Is document minimized
  private $level      = 0;          // Tag level

  private $name;        // Tag name
  private $attr;        // Tag attribute(s)
  private $content;     // Tag content
  private $children;    // Tag children tag(s)

  /**
   * Tag constructor.
   * @param string $name tag name
   * @param array|null $attr tag attribute(s)
   * @param mixed $content tag content
   * @param Tag|array|null $children tag children tag(s)
   */
  public function __construct($name, $attr=null, $content=null, $children=null) {

    // Set properties
    $this->setName($name);
    $this->setAttr($attr);
    $this->setContent($content);
    $this->setChildren($children, true);
  }

  /**
   * Get parent tag
   * @param string|null $selector  selector
   * @return Tag|null parent tag
   */
  public function getParent($selector=null) {

    // When selector is null, or is empty, then return tag parent
    if (!is_string($selector) || empty(($selector = trim($selector)))) 
      return $this->parent;

    // Convert/Check selector
    $selector = $this->getSelector($selector);
    if (empty($selector)) return $this->parent;

    // Set selector reverse
    $selector = array_reverse($selector);

    // Set element
    $element = $this;

    // Each selector item(s)
    foreach ($selector as $item) {

      // Split selector item to element properties
      $filter = $this->getSelector($item, false);

      // While is element valid
      while (!is_null($element) && $element instanceof Tag) {

        // Get parent element
        $parent = $element->getParent();

        // Check parent element is not valid
        if (is_null($parent) || !($parent instanceof Tag)) return null;

        // Check parent tag properties is equal with filter properties
        $element = $this->checkProperties($parent, $filter);

        // When found, then break
        if (!is_null($element)) break;

        // Set element
        $element = $parent;
      }
    }

    // Return result
    return $element;
  }

  /**
   * Set parent tag
   * @param Tag $parent parent tag
   */
  public function setParent($parent) {
    $this->parent = $parent;
  }

  /**
   * Get tag level
   * @return int tag level
   */
  public function getLevel() {
    return $this->level;
  }

  /**
   * Set tag level
   * @param int $level tag level
   */
  public function setLevel($level) {
    if (!is_int($level) || $level < 0) $level = 0;
    $this->level = $level;
  }

  /**
   * Get is minimized
   * @return bool is minimized
   */
  public function isMinimized() {
    return $this->minimized;
  }

  /**
   * Set is minimized
   * @param bool $minimized is minimized
   */
  public function setMinimized($minimized=false) {
    if (!is_bool($minimized)) $minimized = false;
    $this->minimized = $minimized;
  }

  /**
   * Get tag name
   * @return string tag name
   */
  public function getName() {
    return $this->name;
  }

  /**
   * Set tag name
   * @param string $name tag name
   */
  public function setName($name) {
    if (!is_string($name) || empty(($name = trim($name))))
      $name = 'div';
    $this->name = $name;
  }

  /**
   * Get tag attribute(s)
   * @return array tag attribute(s)
   */
  public function getAttr() {
    return $this->attr;
  }

  /**
   * Set tag attribute(s)
   * @param array|null $attr tag attribute(s)
   * @param bool|null $isClear is clear attribute(s)
   */
  public function setAttr($attr=null, $isClear=false) {

    // Check parameter is clear attribute(s)
    if (!is_bool($isClear)) $isClear = false;

    // When not set yet attributes, or is clear, then set to empty array
    if (!isset($this->attr) || $isClear) $this->attr = array();

    // Check attribute(s) is not associative
    if (!is_array($attr) || empty($attr) || array_values($attr) === $attr) return;

    // Each attribute(s) key and value
    foreach ($attr as $k => $v) {
      if (!is_string($k) || empty(($k = trim($k)))) continue;   // Check key valid
      $this->attr[$k] = $v;                               // Set tag attribute key
    }
  }

  /**
   * Get tag content
   * @return string tag content
   */
  public function getContent() {
    return $this->content;
  }

  /**
   * Convert tag content
   * @param mixed $content tag content
   * @return string tag content
   */
  public function convertContent($content=null) {

    switch(gettype($content)) {
      case 'string':
        break;
      case 'integer':
      case 'double':
        $content = strval($content);
        break;
      case 'boolean':
        $content = $content ? 'true' : 'false';
        break;
      case 'array':
        $content = json_encode($content,JSON_UNESCAPED_UNICODE);
        break;
      default:
        $content = '';
    }
    
    // Return content
    return $content;
  }

  /**
   * Set tag content
   * @param mixed $content tag content
   */
  public function setContent($content=null) {
    $this->content = $this->convertContent($content);
  }

  /**
   * Get tag children tags(s)
   * @return array  tag children tag(s)
   */
  public function getChildren() {
    return $this->children;
  }

  /**
   * Set tag children tags(s)
   * @param Tag|array|null $children=null tag children tags(s)
   * @param bool|null $isClear is clear tag children tags(s)
   */
  private function setChildren($children=null, $isClear=null) {

    // Check parameter is clear attribute(s)
    if (!is_bool($isClear)) $isClear = false;

    // When not set yet children tag(s), or is clear, then set to empty array
    if (!isset($this->children) || $isClear) $this->clear();

    // Add children tags(s)
    $this->add($children);
  }

  /**
   * Initialize/Clear children tag(s)
   */
  public function clear() {
    $this->children = array();
  }

  /**
   * Add children tag(s)
   * @param Tag|array|null $children new tag(s)
   * @return Tag|null last appended child tag
   */
  public function add($children=null) {

    // Check/Convert parameter children tag(s)
    if ($children instanceof Tag) $children = array($children);
    if (!is_array($children)) return null;

    // Set result last appended child tag
    $result = null;

    // Each children tag(s)
    foreach ($children as $child) {

      // Check is valid tag
      if ($child instanceof Tag) {

        // Add child tag to children
        array_push($this->children, $child);

        // Set child tag properties
        $this->setChild($this, $child);

        // Set result
        $result = $child;
      }
    }

    // Return last appended child tag
    return $result;
  }

  /**
   * Set child tag properties (parent, level, and is minimized)
   * @param Tag $parent parent tag
   * @param Tag $tag  child tag
   */
  private function setChild($parent, $tag) {

    $tag->setParent($parent);                         // Set child tag parent property
    $tag->setLevel($parent->getLevel() + 1);          // Set child tag level property
    $tag->setMinimized($parent->isMinimized());       // Set child tag minimized property

    // Get/Check children tag(s)
    $children = $tag->getChildren();
    if (empty($children)) return;

    // Each children tag(s)
    foreach ($children as $child) {

      // Set child properties recursive
      $this->setChild($tag, $child);
    }
  }

  /**
   * Find child first tag
   * Example: '#error-container table.error thead[name="apple"][ui-view]'
   * @param string $selector  selector
   * @return Tag|null When founded, then tag, otherwise null
   */
  public function find($selector) {

    // Check tag has children tag(s)
    if (empty($this->children)) return null;

    // Convert/Check selector
    $selector = $this->getSelector($selector);
    if (empty($selector)) return null;

    // Set result
    $result = null;

    // Set element
    $element = $this;

    // Each selector item(s)
    foreach ($selector as $item) {

      // Split selector item to element properties
      $filter = $this->getSelector($item, false);

      // Get child
      $element = $this->getChild($element, $filter);

      // When not found return null
      if (is_null($element)) return null;

      // Set result
      $result = $element;
    }

    // Return result
    return $result;
  }

  /**
   * Get selector
   * @param string $selector selector
   * @param bool|null $isElement is split selector to element(s)
   * @return array converted selector
   */
  private function getSelector($selector, $isElement=null) {

    // Check parameter is split selector to element(s) property
    if (!is_bool($isElement)) $isElement = true;

    // When is split selector to element(s) property, then return array of element(s) property
    if ($isElement) return array_filter(explode(' ', trim($selector)));

    // Set result
    $result = array();

    // Split selector of element to element properties
    $properties = array_filter(preg_split('/[#.[]/', trim($selector)));

    // Each element properties
    foreach ($properties as $property) {

      // Get property length
      $length = strlen($property);

      // Check element property is tag name
      if (substr($selector, 0, $length) === $property) $result['name'] = $property;
      else {

        // Get property value
        $value = substr($selector, 0, $length + 1);

        // Check element property is tag identifier
        if ($value === '#'.$property) {

          // Enlarge property length
          $length++;

          // Set tag identifier property
          $result['attr']['id'] = $property;

          // Check element property is tag class
        } else if ($value === '.'.$property) {

          // Enlarge property length
          $length++;

          // Add property to class(es)
          $result['attr']['class'][] = $property;

          // Check element property is attribute property
        } else if (mb_substr($property, 0, -1, 'UTF-8') === ']') {

          // Enlarge property length
          $length++;

          // Remove from property last character
          $property = mb_substr($property, 0, -1, 'UTF-8');

          // Get attribute key and value
          $attr = array_filter(explode('=', trim($property)));

          // Check exist
          if (count($attr) > 0) {

            // Set/Check attribute key
            $attr[0] = trim($attr[0]);
            if (!empty($attr[0] && !in_array($attr[0], ['id', 'class'])) ) {

              // Set tag attribute property
              $result['attr'][$attr[0]] = count($attr) > 1 ?
                json_decode(trim($attr[1]), true) : null;
            }
          }
        }
      }

      // Remove from selector property
      $selector = substr($selector, $length);
    }

    // Return result
    return $result;
  }

  /**
   * Get child filtered
   * @param Tag $element  element
   * @param array $filter filter
   * @return Tag|null When found, then element, otherwise null
   */
  private function getChild($element, $filter) {

    // Each element tag children tag(s)
    foreach ($element->getChildren() as $child) {

      // Check element tag properties is equal with filter properties
      if (!is_null(($result = $this->checkProperties($child, $filter)))) return $result;

      // Check element children tag(s) recursive
      if (!is_null(($result = $this->getChild($child, $filter)))) return $result;
    }

    // Return result
    return null;
  }

  /**
   * Check tag properties is equal with filter properties
   * @param Tag $element element tag
   * @param array $filter filter
   * @return Tag|null tag properties is equal, then tag, otherwise null
   */
  private function checkProperties($element, $filter) {

    // Get element tag attribute(s)
    $attr = $element->getAttr();

    // Check filter name not exist, or element tag name is same
    if ((!array_key_exists('name', $filter) || $filter['name'] === $element->getName())) {

      // When filter attributes not exist, then return with element tag
      if (!isset($filter['attr']) || !is_array($filter['attr']) || empty($filter['attr'])) return $element;

      // Set is found
      $isFound = true;

      // Each filter attributes properties
      foreach ($filter['attr'] as $key => $value) {

        // When element tag attribute key not exist,
        // then set is found to false, and break
        if (!array_key_exists($key, $attr)) {$isFound = false; break;}

        // Check attribute key is class
        if ($key === 'class') {

          // When element tag attribute class not contains filter attribute class value(s),
          // then set is found to false, and break
          if (!$this->checkClass($attr['class'], $filter['attr']['class'])) {$isFound = false; break;}

          // When element tag attribute key value not same with filter attribute value,
          // then set is found to false, and break
        } else if ($attr[$key] !== $value) {$isFound = false; break;}
      }

      // When founded, then set result
      if ($isFound) return $element;
    }

    // Return result
    return null;
  }

  /**
   * Check tag attribute class contain filter attribute class value(s)
   * @param string $attrClasses tag attribute class
   * @param array $classes filter attribute class value(s)
   * @return bool is contain
   */
  private function checkClass($attrClasses, $classes) {
    $attrClasses = explode(' ', $attrClasses);
    foreach ($classes as $class) {
      if (!in_array($class, $attrClasses)) return false;
    }
    return true;
  }

  /**
   * Check tag is html, or self closing
   * @return bool tag is html, or self closing
   */
  private function isSelfClosingTag() {
    return in_array(mb_strtolower($this->name, 'UTF-8'),
      ['html','area','base','br','col','embed','hr','img',
        'input','link','meta','param','source','track','wbr']);
  }

  /**
   * Get tabulator
   * @param int|null $enlarge enlarge tabulator size
   * @return string tabulator
   */
  private function getTab($enlarge=null) {

    // Check document is minimized
    if ($this->minimized) return '';

    // Check tabulator enlarge property
    if (!is_int($enlarge) || $enlarge < 0) $enlarge = 0;

    // Return tabulator
    return PHP_EOL
      .str_repeat(' ',self::TAB_SIZE * $this->level)
      .str_repeat(' ',self::TAB_SIZE * $enlarge);
  }

  /**
   * Overwrite method toString
   * @return string formatted html tag
   */
  public function __toString(): string {

    // Set tag beg
    $result = $this->getTab().'<'.$this->getName();

    // Get tag attributes
    $attrs = $this->getAttr();

    // Each tag attributes
    foreach ($attrs as $key => $value) {

      // Set attribute key
      $result .= ' '.$key;

      // Convert value
      $result .= '="'.$this->convertContent($value).'"';
    }

    // Close tage beg
    $result .= '>';

    // When tag is html, or self closing return result
    if ($this->isSelfClosingTag()) return $result;

    // Check content exist
    if (!empty($this->getContent())) {

      // When children tag(s) exist, then add new line, and tabulator enlarged one
      if (!empty($this->children)) $result .= $this->getTab(1);

      // Set content
      $result .= $this->getContent();
    }

    // Each tag children tag(s) print
    foreach ($this->children as $tag) $result .= $tag;

    // When children tag(s) exist, or tag is in array exceptions, then add new line, and tabulator
    if (!empty($this->children) ||
      ($this->name === 'script' && isset($attrs['id']) && $attrs['id'] === 'app-env') ||
      in_array($this->name, ['style'])) $result .= $this->getTab();

    // Close tag
    return $result.'</'.$this->getName().'>';
  }
}