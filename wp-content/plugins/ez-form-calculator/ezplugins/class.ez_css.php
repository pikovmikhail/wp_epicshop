<?php

/**
	ez css builder class
**/

if (class_exists("EZ_CSS_Builder")) return;

class EZ_CSS_Builder {
	const VERSION = "1.0";

	public $has_css      = false; // whether any css rules are present or not
	public $output_array = array(); // internal array
	public $output_css   = ""; // css output

	public $prefix_rule  = ""; // css prefix rule for all selectors

	private $check_empty_properties = array("border-radius", "font-size", "padding", "width", "height");

	/**
		$rule = ".prefix-rule"
	**/
	public function __construct($rule = "") {
		$this->prefix_rule = $rule;
	}


	/**
		$css_array = array(
			"selector" => ".selector",
			"property" => "color",
			"is_url"   => true
		)
	**/
	public function add_css($css_array, $value) {
		$value = maybe_unserialize($value);

		// check for certain values not to be empty
		if (($css_array["property"] == "background-color" || $css_array["property"] == "color") && empty($value["color"]) && empty($value["transparent"])) return;
		if ($css_array["property"] == "border") {
			if (empty($value["color"]) && empty($value["transparent"])) return;

			$this->add_css(array(
				"selector" => $css_array["selector"],
				"property" => "border-radius"
			), $value["radius"]);
		}

		// if value is empty for certain properties, do not continue
		$check_empty_return = false;
		foreach ($this->check_empty_properties as $rule) {
			if ($css_array["property"] == $rule && empty($value["value"])) {
				$check_empty_return = true;
			}
		}

		if ($check_empty_return) return;

		// wrap value in url
		if (!empty($css_array["is_url"])) {
			$value = "url({$value})";
		}

		// existing selector
		if (!empty($this->output_array[$css_array["selector"]])) {
			$this->output_array[$css_array["selector"]][$css_array["property"]] = $value;

			if (!empty($css_array["hover_override"])) {
				$this->output_array[$css_array["selector"] . ":hover"][$css_array["property"]] = $value;	
			}
		}
		// new selector
		else {
			$this->output_array[$css_array["selector"]] = array($css_array["property"] => $value);

			if (!empty($css_array["hover_override"])) {
				$this->output_array[$css_array["selector"] . ":hover"] = array($css_array["property"] => $value);
			}
		}

		// additional css
		if (!empty($css_array["add"])) {
			foreach ($css_array["add"] as $property => $value) {
				$this->output_array[$css_array["selector"]][$property] = $value;

				if (!empty($css_array["hover_override"])) {
					$this->output_array[$css_array["selector"] . ":hover"][$property] = $value;
				}
			}
		}

		$this->has_css = true;
	}


	/**
		return css output
	**/
	public function get_output() {
		foreach ($this->output_array as $css_selector => $css_properties) {
			// multiple selectors
			if (strpos($css_selector, ",") !== false) {
				$css_selector_array = explode(",", $css_selector);

				$this->output_css .= "{$this->prefix_rule} " . implode(",{$this->prefix_rule} ", $css_selector_array) . " {";
			}
			// single selector
			else {
				$this->output_css .= "{$this->prefix_rule} {$css_selector} {";
			}

			foreach ($css_properties as $property => $value) {
				// depending on the css property, the value might need to be built manually
				switch ($property) {
					case "border":
						$value["color"] = empty($value["transparent"]) ? $value["color"] : "transparent";
						$value["width"] = empty($value["width"]) ? "0" : "{$value["width"]}px";

						$value = "{$value["color"]} {$value["width"]} {$value["style"]}";
					break;
					case "border-radius":
						$value = "{$value}px";
					break;
					case "background-color":
					case "color":
						$value = empty($value["transparent"]) ? $value["color"] : "transparent";
					break;
					default:
						if (is_array($value)) $value = implode("", $value);
					break;
				}

				$this->output_css .= "{$property}:{$value};";
			}

			$this->output_css .= "}";
		}

		return $this->output_css;
	}
}