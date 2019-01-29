<?php

require_once(EZFC_PATH . "class.ezfc_settings.php");
require_once(EZFC_PATH . "ezplugins/class.ez_css.php");

abstract class Ezfc_Functions {
	static $plugin_slug = "ez-form-calculator";
	static $plugin_slug_short = "ezfcf";

	public static function array_empty($array = null) {
		if (!is_array($array)) return true;
	 
		foreach (array_values($array) as $value) {
			if ($value == "0") return false;
			if (!empty($value)) return false;
		}
	 
		return true;	 
	}

	public static function array_merge_recursive_distinct() {
		$arrays = func_get_args();
		$base = array_shift($arrays);

		foreach ($arrays as $array) {
			reset($base); //important

			while (list($key, $value) = @each($array)) {
				if (is_array($value) && @is_array($base[$key])) {
					$base[$key] = self::array_merge_recursive_distinct($base[$key], $value);
				} else {
					$base[$key] = $value;
				}
			}
		}

		return $base;
	}

	public static function array_merge_recursive_existing_keys() {
		$arrays = func_get_args();
		$base = array_shift($arrays);

		foreach ($arrays as $array) {
			reset($base); //important

			while (list($key, $value) = @each($array)) {
				if (is_array($value) && @is_array($base[$key])) {
					$base[$key] = self::array_merge_recursive_distinct($base[$key], $value);
				} else if (isset($base[$key])) {
					$base[$key] = $value;
				}
			}
		}

		return $base;
	}

	public static function check_valid_date($date_format, $date, $convert_jqueryui_format=false) {
		$date_format = $convert_jqueryui_format ? self::date_jqueryui_to_php($date_format) : $date_format;

		return (DateTime::createFromFormat($date_format, $date) !== false);
	}

	public static function count_days_format($format, $from, $to) {
		if (!self::check_valid_date($format, $from, true) || !self::check_valid_date($format, $to, true)) return 0;
		
		$datepicker_format = self::date_jqueryui_to_php($format);

		$date_from = DateTime::createFromFormat($datepicker_format, $from);
		$date_to   = DateTime::createFromFormat($datepicker_format, $to);
		$days      = $date_to->diff($date_from)->format("%a");

		return $days;
	}

	public static function date_jqueryui_to_php($format) {
		$format_array = array(
			//   Day
			'dd' => 'd',
			'DD' => 'l',
			'd'  => 'j',
			'o'  => 'z',
			//   Month
			'MM' => 'F',
			'mm' => 'm',
			'M'  => 'M',
			'm'  => 'n',
			//   Year
			'yy' => 'Y',
			'y'  => 'y',
		);

		$format_ui     = array_keys($format_array);
		$format_php    = array_values($format_array);
		$output_format = "";

		$i = 0;
		while (isset($format[$i])) {
			$char   = $format[$i];
			$chars  = $format[$i];
			$chars .= isset($format[$i+1]) ? $format[$i+1] : "";

			// multiple chars
			if (isset($format_array[$chars])) {
				$output_format .= str_replace($chars, $format_array[$chars], $chars);
				$format         = substr_replace($format, "", 0, 2);
			}
			// single char
			else {
				if (isset($format_array[$char])) {
					$output_format .= str_replace($char, $format_array[$char], $char);
				}
				// other
				else {
					$output_format .= $char;
				}

				$format = substr_replace($format, "", 0, 1);
			}
		}

		return $output_format;
	}

	public static function esc_html_array($array) {
		if (!is_array($array) || count($array) < 1) return $array;

		$html = array();
		foreach ($array as $key => $value) {
			$html[] = "{$key}='" . esc_attr($value) . "'";
		}

		return implode(" ", $html);
	}


	// settings table
	public static function get_settings_table($settings, $options_id = "opt", $options_name = "", $single_overwrite = false) {
		// load mailchimp api wrapper
		$mailchimp_lists = array();
		if (file_exists(EZFC_PATH . "lib/mailchimp/MailChimp.php")) {
			require_once(EZFC_PATH . "lib/mailchimp/MailChimp.php");
			$mailchimp_api_key = get_option("ezfc_mailchimp_api_key", -1);
			$mailchimp_lists   = array();
			if (!empty($mailchimp_api_key) && $mailchimp_api_key != -1) {
				$mailchimp = new Drewm_MailChimp($mailchimp_api_key);
				$mailchimp_lists = $mailchimp->call("lists/list");
			}
		}

		$mailpoet_lists = array();
		if (class_exists("WYSIJA")) {
			$model_list = WYSIJA::get("list", "model");
			$mailpoet_lists = $model_list->get(array("name", "list_id"), array("is_enabled" => 1));
		}

		// currency codes
		$currency_array = array("Australian Dollar" => "AUD", "Brazilian Real" => "BRL", "Canadian Dollar" => "CAD", "Czech Koruna" => "CZK", "Danish Krone" => "DKK", "Euro" => "EUR", "Hong Kong Dollar" => "HKD", "Hungarian Forint" => "HUF", "Israeli New Sheqel" => "ILS", "Japanese Yen" => "JPY", "Malaysian Ringgit" => "MYR", "Mexican Peso" => "MXN", "Norwegian Krone" => "NOK", "New Zealand Dollar" => "NZD", "Philippine Peso" => "PHP", "Polish Zloty" => "PLN", "Pound Sterling" => "GBP", "Singapore Dollar" => "SGD", "Swedish Krona" => "SEK", "Swiss Franc" => "CHF", "Taiwan New Dollar" => "TWD", "Thai Baht" => "THB", "Turkish Lira" => "TRY", "U.S. Dollar" => "USD");
		// languages
		$langs = array('ar'=>'Arabic','ar-ma'=>'Moroccan Arabic','bs'=>'Bosnian','bg'=>'Bulgarian','br'=>'Breton','ca'=>'Catalan','cy'=>'Welsh','cs'=>'Czech','cv'=>'Chuvash','da'=>'Danish','de'=>'German','el'=>'Greek','en'=>'English','en-au'=>'English (Australia)','en-ca'=>'English (Canada)','en-gb'=>'English (England)','eo'=>'Esperanto','es'=>'Spanish','et'=>'Estonian','eu'=>'Basque','fa'=>'Persian','fi'=>'Finnish','fo'=>'Farose','fr-ca'=>'French (Canada)','fr'=>'French','gl'=>'Galician','he'=>'Hebrew','hi'=>'Hindi','hr'=>'Croatian','hu'=>'Hungarian','hy-am'=>'Armenian','id'=>'Bahasa Indonesia','is'=>'Icelandic','it'=>'Italian','ja'=>'Japanese','ka'=>'Georgian','ko'=>'Korean','lv'=>'Latvian','lt'=>'Lithuanian','ml'=>'Malayalam','mr'=>'Marathi','ms-my'=>'Bahasa Malaysian','nb'=>'Norwegian','ne'=>'Nepalese','nl'=>'Dutch','nn'=>'Norwegian Nynorsk','pl'=>'Polish','pt-br'=>'Portuguese (Brazil)','pt'=>'Portuguese','ro'=>'Romanian','ru'=>'Russian','sk'=>'Slovak','sl'=>'Slovenian','sq'=>'Albanian','sv'=>'Swedish','th'=>'Thai','tl-ph'=>'Tagalog (Filipino)','tr'=>'Turkish','tzm-la'=>'Tamaziɣt','uk'=>'Ukrainian','uz'=>'Uzbek','zh-cn'=>'Chinese','zh-tw'=>'Chinese (Traditional)');

		$out   = array();
		$out[] = "<table class='form-table'>";
		$out[] = "	<tr>";

		$table_out = array();
		foreach ($settings as $i => $s) {
			$tmp_id = !empty($s["id"]) ? $s["id"] : $i;

			$tmp_value = "";
			if (isset($s["value"])) {
				$tmp_value = $s["value"];
			}
			else if (isset($s["default"])) {
				$tmp_value = $s["default"];
			}

			if (!empty($tmp_value)) {
				$tmp_value = maybe_unserialize($tmp_value);
			}

			$element_id = "{$options_id}-{$tmp_id}";
			$add_class  = "";
			$tmp_input  = "";

			$type_array = array("");
			if (!empty($s["type"])) {
				$type_array = explode(",", $s["type"]);
				$add_class  = "ezfc-settings-type-{$type_array[0]}";
			}

			switch ($type_array[0]) {
				case "bool_text":
					// default values
					$values = array(
						"enabled" => 0,
						"text"    => ""
					);

					if (is_array($tmp_value)) {
						$values = $tmp_value;
					}

					$selected_no = $selected_yes = "";

					if ($values["enabled"] == 0) $selected_no = " selected='selected'";
					else $selected_yes = " selected='selected'";

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}-enabled' name='{$options_name}[{$tmp_id}][enabled]'>";
					$tmp_input .= "    <option value='0' {$selected_no}>" . __("No", "ezfc") . "</option>";
					$tmp_input .= "    <option value='1' {$selected_yes}>" . __("Yes", "ezfc") . "</option>";
					$tmp_input .= "</select>";

					$tmp_input .= "<input type='text' class='regular-text {$add_class}' id='{$element_id}-text' name='{$options_name}[{$tmp_id}][text]' value=\"{$values["text"]}\" />";
				break;

				case "border":
					// default values
					$border = array(
						"color"  => "",
						"width"  => "",
						"style"  => "",
						"radius" => ""
					);

					if (is_array($tmp_value)) {
						$border = $tmp_value;
					}

					$transparent_checked = empty($border["transparent"]) ? "" : "checked='checked'";

					$border_styles = array("none", "dotted", "dashed", "double", "groove", "inherit", "inset", "outset", "ridge", "solid");

					// color
					$tmp_input = "<input class='ezfc-element-colorpicker-input ezfc-element-border-color' name='{$options_name}[{$tmp_id}][color]' type='text' value='{$border["color"]}' />";
					// transparent
					$tmp_input .= "<input class='ezfc-element-colorpicker-transparent' name='{$options_name}[{$tmp_id}][transparent]' type='checkbox' value='1' {$transparent_checked} /><span class='ezfc-element-transparent-text'>" . __("Transparent", "ezfc") . "</span>";
					// width
					$tmp_input .= "<input class='ezfc-element-border-width' name='{$options_name}[{$tmp_id}][width]' type='text' value='{$border["width"]}' />";
					// style
					$tmp_input .= "<select class='ezfc-element-border-style' name='{$options_name}[{$tmp_id}][style]'>";
					foreach ($border_styles as $style) {
						$selected = "";
						if ($border["style"] == $style) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$style}' {$selected}>{$style}</option>";
					}
					$tmp_input .= "</select>";
					// radius
					$tmp_input .= "<input class='ezfc-element-border-radius' name='{$options_name}[{$tmp_id}][radius]' type='text' value='{$border["radius"]}' />";
				break;

				case "colorpicker":
					// default values
					$color = array(
						"color"  => "",
						"transparent" => ""
					);

					if (is_array($tmp_value)) {
						$color = $tmp_value;
					}

					$transparent_checked = empty($color["transparent"]) ? "" : "checked='checked'";

					wp_enqueue_style("wp-color-picker");

					$tmp_input = "<input class='ezfc-element-colorpicker-input' name='{$options_name}[{$tmp_id}][color]' type='text' value='{$color["color"]}' />";
					$tmp_input .= "<input class='ezfc-element-colorpicker-transparent' name='{$options_name}[{$tmp_id}][transparent]' type='checkbox' value='1' {$transparent_checked} /><span class='ezfc-element-transparent-text'>" . __("Transparent", "ezfc") . "</span>";
				break;

				case "currencycodes":
					$tmp_input  = "<select id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					foreach ($currency_array as $desc => $v) {
						$selected = "";
						if ($tmp_value == $v) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$v}' {$selected}>({$v}) {$desc}</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "date_formats":
					$options = array(
						"mm/dd/yy" => date("m/d/Y"),
						"dd/mm/yy" => date("d/m/Y"),
						"dd.mm.yy" => date("d.m.Y")
					);

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					foreach ($options as $v => $desc) {
						$selected = "";
						if ($tmp_value == $v) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$v}' {$selected}>" . $desc . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "datepicker_array":
					$closed_dates_json = json_decode($tmp_value);

					$tmp_input  = "<div id='{$element_id}' class='container-fluid option-wrapper datepicker-range-wrapper' data-option_name='{$options_name}' data-option_id='{$tmp_id}' data-inputnames='from,to'>";
					// add business hours button
					$tmp_input .= "		<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12 option-controls'>";
					$tmp_input .= "			<li class='button option-add'><i class='fa fa-fw fa-plus'></i> " . __("Add closed days", "ezfc") . "</li>";
					$tmp_input .= "		</div>";

					// clone element
					$tmp_input .= "		<div class='ezfc-hidden option-clone option-item' data-row='0'>";

					// day
					$tmp_input .= "			<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12'>";
					$tmp_input .= "				" . __("From" , "ezfc") . " <input class='datepicker-range datepicker-from' type='text' name='{$options_name}[{$tmp_id}][-1][from]' value='' />";
					$tmp_input .= "				" . __("To" , "ezfc") . " <input class='datepicker-range datepicker-to' type='text' name='{$options_name}[{$tmp_id}][-1][to]' value='' />";
					$tmp_input .= "				<button class='button option-remove' data-ot='" . __("Remove item", "ezfc") . "'><i class='fa fa-fw fa-times'></i></button>";
					$tmp_input .= "			</div>";

					// clone end
					$tmp_input .= "		</div>";

					if (count($closed_dates_json) > 0) {
						foreach ($closed_dates_json as $d => $closed_date) {
							if (!property_exists($closed_date, "from")) {
								$closed_date = json_encode(array(
									"from" => "",
									"to"   => ""
								));
							}

							if (empty($closed_date->from) && empty($closed_date->to)) continue;

							$tmp_input .= "<div class='option-item' data-row='{$d}'>";
							$tmp_input .= "		<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12'>";
							$tmp_input .= "			" . __("From" , "ezfc") . " <input class='datepicker-range datepicker-from' type='text' name='{$options_name}[{$tmp_id}][{$d}][from]' value='{$closed_date->from}' />";
							$tmp_input .= "			" . __("To" , "ezfc") . " <input class='datepicker-range datepicker-to' type='text' name='{$options_name}[{$tmp_id}][{$d}][to]' value='{$closed_date->to}' />";
							$tmp_input .= "				<button class='button option-remove' data-ot='" . __("Remove item", "ezfc") . "'><i class='fa fa-fw fa-times'></i></button>";
							$tmp_input .= "		</div>";
							$tmp_input .= "</div>";
						}
					}

					$tmp_input .= "</div>";
				break;

				case "dimensions":
					if (is_array($tmp_value) && isset($tmp_value["value"])) {
						$dim_value = $tmp_value["value"];
						$dim_unit  = $tmp_value["unit"];
					}
					else if (!empty($s["default"])) {
						$dim_value = $s["default"]["value"];
						$dim_unit  = $s["default"]["units"];
					}
					else {
						$dim_value = "";
						$dim_unit  = "";
					}

					// default units
					$default_units = array("px", "em", "rem", "%", "vw", "vh");
					if (!empty($s["units"])) {
						$default_units = $s["units"];
					}

					$tmp_input = "<input type='text' class='ezfc-input-small {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}][value]' value=\"{$dim_value}\" />";

					$tmp_input .= "<select id='{$element_id}' name='{$options_name}[{$tmp_id}][unit]'>";

					foreach ($default_units as $unit) {
						$selected = "";
						if ($dim_unit == $unit) $selected = "selected";
						
						$tmp_input .= "<option value='{$unit}' {$selected}>{$unit}</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "dropdown":
					$tmp_input = "<select id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";

					foreach ($s["options"] as $value => $description) {
						$selected = "";
						if ($tmp_value == $value) $selected = "selected";
						
						$tmp_input .= "<option value='{$value}' {$selected}>" . $description . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "editor":
					ob_start();

					wp_editor($tmp_value, "editor_{$tmp_id}", array(
						"textarea_name" => "{$options_name}[{$tmp_id}]",
						"textarea_rows" => 5,
						"teeny"         => true
					));
					$tmp_input = ob_get_contents();

					ob_end_clean();
				break;

				case "font":
					$tmp_input = "<select id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";

					$fonts_json = file_get_contents(EZFC_PATH . "ezplugins/google-fonts.json");
					$fonts      = json_decode($fonts_json, true);
					array_unshift($fonts, array("css-name" => "", "font-name" => "", "font-family" => ""));

					foreach ($fonts as $font) {
						$selected = "";
						if ($tmp_value == $font["font-name"]) $selected = "selected";
						
						$tmp_input .= "<option value='{$font["font-name"]}' {$selected}>{$font["font-name"]}</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "hidden":
					$tmp_value = esc_attr($tmp_value);
					
					$tmp_input = "<input type='hidden' class='regular-text {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]' value=\"{$tmp_value}\" />";
				break;

				case "image":
					$tmp_input  = "<div class='ezfc-image-upload-wrapper'>";
					$tmp_input .= "		<input class='ezfc-image-upload-hidden' type='hidden' name='{$options_name}[{$tmp_id}]' value='{$tmp_value}' />";
					$tmp_input .= "		<button class='button ezfc-image-upload'>" . __("Choose image", "ezfc") . "</button>&nbsp;";
					$tmp_input .= "		<button class='button ezfc-clear-image'>" . __("Clear image", "ezfc") . "</button>";
					$tmp_input .= "		<br><img src='{$tmp_value}' class='ezfc-image-preview' />";
					$tmp_input .= "</div>";
				break;

				case "input":
					$tmp_value = esc_attr($tmp_value);
					
					$tmp_input = "<input type='text' class='regular-text {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]' value=\"{$tmp_value}\" />";
				break;

				case "lang":
					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					foreach ($langs as $lang => $langdesc) {
						$selected = "";
						if ($tmp_value == $lang) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$lang}' {$selected}>[{$lang}] {$langdesc}</option>";	
					}
					$tmp_input .= "</select>";
				break;

				case "mailchimp_list":
					$tmp_input = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";

					if (isset($mailchimp_lists["total"]) && $mailchimp_lists["total"] > 0) {
						foreach ($mailchimp_lists["data"] as $list) {
							$selected = $tmp_value==$list["id"] ? "selected='selected'" : "";

							$tmp_input .= "<option value='{$list["id"]}' {$selected}>{$list["name"]}</option>";
						}
					}
					// no lists
					else {
						$tmp_input .= "<option value='-1'>" . __("No MailChimp lists found or wrong API key", "ezfc") . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "mailpoet_list":
					$tmp_input = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";

					if (count($mailpoet_lists) > 0) {
						foreach ($mailpoet_lists as $list) {
							$selected = $tmp_value==$list["list_id"] ? "selected='selected'" : "";

							$tmp_input .= "<option value='{$list["list_id"]}' {$selected}>{$list["name"]}</option>";
						}
					}
					// no lists
					else {
						$tmp_input .= "<option value='-1'>" . __("No Mailpoet lists found.", "ezfc") . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "numbers":
					$type_numbers = explode("-", $type_array[1]);

					$tmp_input = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					for ($ti = $type_numbers[0]; $ti <= $type_numbers[1]; $ti++) {
						$selected = $tmp_value==$ti ? "selected='selected'" : "";

						$tmp_input .= "<option value='{$ti}' {$selected}>{$ti}</option>";
					}
					$tmp_input .= "</select>";
				break;

				case "password":
					$tmp_value = esc_attr($tmp_value);
					
					$tmp_input = "<input type='password' class='regular-text {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]' value=\"{$tmp_value}\" />";
				break;

				case "post_types":
					$options = get_post_types(array(
						"public" => true
					));

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}][]' multiple>";
					foreach ($options as $v => $desc) {
						$selected = "";
						if (!empty($tmp_value) && in_array($v, $tmp_value)) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$v}' {$selected}>" . $desc . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "roles":
					global $current_user;
					$tmp_input = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					$caps = $current_user->allcaps;
					ksort($caps);

					foreach ($caps as $role => $value) {
						$selected = "";
						if (!empty($tmp_value) && $role == $tmp_value) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$role}' {$selected}>{$role}</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "select":
					$options = explode("|", $type_array[1]);

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					foreach ($options as $v => $desc) {
						$selected = "";
						if ($tmp_value == $v) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$v}' {$selected}>" . $desc . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "textarea":
					$tmp_input  = "<textarea class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					$tmp_input .= $tmp_value;
					$tmp_input .= "</textarea>";
				break;

				case "themes":
					$tmp_input = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";

					foreach (glob(EZFC_PATH . "themes/*.css") as $file) {
						$file_id  = basename($file, ".css");
						$selected = $tmp_value==$file_id ? "selected='selected'" : "";

						$tmp_input .= "<option value='{$file_id}' {$selected}>{$file_id}</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "timepicker_array":
					$times_json = json_decode($tmp_value);

					$tmp_input  = "<div id='{$element_id}' class='container-fluid option-wrapper ezfc-hours' data-option_name='{$options_name}' data-option_id='{$tmp_id}' data-inputnames='from,to'>";
					// add business hours button
					$tmp_input .= "		<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12 option-controls'>";
					$tmp_input .= "			<li class='button option-add'><i class='fa fa-fw fa-plus'></i> " . __("Add business hours", "ezfc") . "</li>";
					$tmp_input .= "		</div>";

					// clone element
					$tmp_input .= "		<div class='ezfc-hidden option-clone option-item' data-row='0'>";

					// from
					$tmp_input .= "			<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12'>";
					$tmp_input .= "				" . __("From" , "ezfc") . " <input class='timepicker timepicker-from' type='text' value='09:00' />";
					// to
					$tmp_input .= "				" . __("To" , "ezfc") . " <input class='timepicker timepicker-to' type='text' value='17:00' />";
					// remove button
					$tmp_input .= "				<button class='button option-remove'><i class='fa fa-fw fa-times'></i></button>";
					$tmp_input .= "			</div>";

					// clone end
					$tmp_input .= "		</div>";

					foreach ($times_json as $t => $times_array) {
						if (!property_exists($times_array, "from") || !property_exists($times_array, "to")) {
							$times_array = json_encode(array(
								"from" => "09:00",
								"to"   => "17:00"
							));
						}

						$tmp_input .= "<div class='option-item' data-row='{$t}'>";
						$tmp_input .= "		<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12'>";
						$tmp_input .= "			" . __("From" , "ezfc") . " <input class='timepicker timepicker-from' type='text' name='{$options_name}[{$tmp_id}][{$t}][from]' value='{$times_array->from}' />";
						$tmp_input .= "			" . __("To" , "ezfc") . " <input class='timepicker timepicker-to' type='text' name='{$options_name}[{$tmp_id}][{$t}][to]' value='{$times_array->to}' />";
						$tmp_input .= "				<button class='button option-remove' data-ot='" . __("Remove item", "ezfc") . "'><i class='fa fa-fw fa-times'></i></button>";
						$tmp_input .= "		</div>";
						$tmp_input .= "</div>";
					}

					// option wrapper
					$tmp_input .= "</div>";
				break;

				case "time_formats":
					$options = array(
						"H:i"   => "13:00",
						"h:i A" => "01:00 AM",
						"h:i a" => "01:00 am"
					);

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					foreach ($options as $v => $desc) {
						$selected = "";
						if ($tmp_value == $v) $selected = "selected='selected'";

						$tmp_input .= "<option value='{$v}' {$selected}>" . $desc . "</option>";
					}

					$tmp_input .= "</select>";
				break;

				case "weekdays":
					$days_selected = explode(",", $tmp_value);
					$days = array(
						1 => __("Monday", "ezfc"),
						2 => __("Tuesday", "ezfc"),
						3 => __("Wednesday", "ezfc"),
						4 => __("Thursday", "ezfc"),
						5 => __("Friday", "ezfc"),
						6 => __("Saturday", "ezfc"),
						0 => __("Sunday", "ezfc")
					);

					$tmp_input  = "<input type='hidden' class='regular-text {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]' value='{$tmp_value}' />";
					$tmp_input .= "<div class='buttonset'>";

					foreach ($days as $i => $day) {
						$checked = in_array($i, $days_selected) ? "checked" : "";
						$tmp_input .= "<input class='{$s["name"]}' type='checkbox' value='{$i}' id='{$s["name"]}_{$i}' {$checked} />";
						$tmp_input .= "<label for='{$s["name"]}_{$i}'>";
						$tmp_input .= $day;
						$tmp_input .= "</label>";
					}
					$tmp_input .= "</div>";
				break;

				case "yesno":
					$selected_no = $selected_yes = "";

					if ($tmp_value == 0) $selected_no = " selected='selected'";
					else                $selected_yes = " selected='selected'";

					$tmp_input  = "<select class='{$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]'>";
					$tmp_input .= "    <option value='0' {$selected_no}>" . __("No", "ezfc") . "</option>";
					$tmp_input .= "    <option value='1' {$selected_yes}>" . __("Yes", "ezfc") . "</option>";
					$tmp_input .= "</select>";
				break;

				default:
					$tmp_value = esc_attr($tmp_value);
					
					$tmp_input = "<input type='text' class='regular-text {$add_class}' id='{$element_id}' name='{$options_name}[{$tmp_id}]' value=\"{$tmp_value}\" />";
				break;
			}

			$single_overwrite_button = "";
			if ($single_overwrite) {
				$single_overwrite_button = "<br><input type='submit' name='submit' class='button ezfc-single-overwrite-button' value='" . __("Overwrite", "ezfc") . "' />";
			}

			if (!empty($s["hidden"])) {
				$tmp_input = __("This option is only available in the premium version.", "ezfc");
			}

			$table_out[] = "
				<tr class='ezfc-table-option-{$s["type"]}' id='ezfc-table-option-{$tmp_id}'>
					<th scope='row'>
						<label for='{$options_name}-{$tmp_id}'>" . $s["description"] . "</label>
						{$single_overwrite_button}
					</th>
					<td id='ezfc-option-{$tmp_id}'>
						{$tmp_input}
						<p class='description'>" . (empty($s["description_long"]) ? "" : $s["description_long"]) . "</p>
					</td>
				</tr>
			";
		}

		$out[] = implode("", $table_out);
		$out[] = "</table>";

		return implode("", $out);
	}

	/**
		copy directory
	**/
	public static function recurse_copy($src, $dst) {
		$dir = opendir($src); 
		@mkdir($dst); 
		while(false !== ( $file = readdir($dir)) ) { 
			if (( $file != '.' ) && ( $file != '..' )) { 
				if ( is_dir($src . '/' . $file) ) { 
					self::recurse_copy($src . '/' . $file,$dst . '/' . $file); 
				} 
				else { 
					copy($src . '/' . $file,$dst . '/' . $file); 
				} 
			} 
		}
		closedir($dir);
	}

	/**
		delete directory with files
	**/
	public static function delete_dir($dirPath) {
		if (! is_dir($dirPath)) {
			return false;
		}
		if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
			$dirPath .= '/';
		}
		$files = glob($dirPath . '*', GLOB_MARK);
		foreach ($files as $file) {
			if (is_dir($file)) {
				self::delete_dir($file);
			} else {
				unlink($file);
			}
		}
		rmdir($dirPath);

		return true;
	}

	/**
		read data from file $name in zip file $file
	**/
	public static function zip_read($file, $name) {
		// skip if unzip file does not exist
		if (!function_exists("file_get_contents")) return self::send_message("error", __("Function 'file_get_contents' does not exist.", "ezfc"));
		// check if file exists
		if (!file_exists($file)) return self::send_message("error", __("Unable to find file {$file}", "ezfc"));

		$result = file_get_contents("zip://" . $file . "#" . $name);
		return $result;
	}

	/**
		write data to zip file
	**/
	public static function zip_write($data, $name) {
		// skip if ziparchive class does not exist
		if (!class_exists("ZipArchive")) return self::send_message("error", __("Library ZipArchive is not installed on your webserver.", "ezfc"));

		WP_Filesystem();
		global $wp_filesystem;

		$plugin_dir      = plugin_dir_path( __FILE__ );
		$plugin_path     = str_replace(ABSPATH, $wp_filesystem->abspath(), $plugin_dir);
		$plugin_path_tmp = $plugin_path . "/tmp/";

		$zip  = new ZipArchive();

		$filename = self::$plugin_slug_short . "_export_data_" . md5(microtime()) . ".zip";
		$file     = $plugin_path_tmp . $filename;

		if ($zip->open($file, ZIPARCHIVE::CREATE) !== true) {
			return self::send_message("error", __("Unable to create temporary file.", "ezfc"));
		}

		$zip->addFromString($name, $data);
		$zip->close();

		return array(
			"filepath" => $file,
			"filename" => $filename,
			"file_url" => plugin_dir_url(__FILE__) . "tmp/" . $filename
		);
	}

	/**
		clear temporary files
	**/
	public static function delete_tmp_files() {
		WP_Filesystem();
		global $wp_filesystem;

		$plugin_dir      = plugin_dir_path( __FILE__ );
		$plugin_path     = str_replace(ABSPATH, $wp_filesystem->abspath(), $plugin_dir);
		$plugin_path_tmp = $plugin_path . "/tmp/";

		$files = glob($plugin_path_tmp . "*.zip");
		foreach ($files as $file) {
			unlink($file);
		}

		$files = glob($plugin_path_tmp . "*.csv");
		foreach ($files as $file) {
			unlink($file);
		}
		
		return self::send_message("success", __("Temporary files deleted.", "ezfc"));
	}

	/**
		send file to browser
	**/
	public static function send_file_to_browser($file) {
		if (!file_exists($file)) return;

		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename=' . basename($file));
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: ' . filesize($file));
		ob_clean();
		flush();
		readfile($file);

		exit;
	}

	/**
		ajax message
	**/
	public static function send_message($type, $msg, $id=0) {
		return array(
			$type 	=> $msg,
			"id"	=> $id
		);
	}


	static function array_index_key($array, $key) {
		$ret_array = array();

		if (count($array) < 1) return $ret_array;

		foreach ($array as $v) {
			if (is_object($v)) {
				$ret_array[$v->$key] = $v;
			}
			if (is_array($v)) {
				$ret_array[$v[$key]] = $v;
			}
		}

		return $ret_array;
	}

	/**
	* Formats a line (passed as a fields  array) as CSV and returns the CSV as a string.
	* Adapted from http://us3.php.net/manual/en/function.fputcsv.php#87120
	*/
	static function arrayToCsv( array &$fields, $delimiter = ';', $enclosure = '"', $encloseAll = false, $nullToMysqlNull = false ) {
		$delimiter_esc = preg_quote($delimiter, '/');
		$enclosure_esc = preg_quote($enclosure, '/');

		$output = array();
		foreach ( $fields as $field ) {
			if ($field === null && $nullToMysqlNull) {
				$output[] = 'NULL';
				continue;
			}

			// Enclose fields containing $delimiter, $enclosure or whitespace
			if ( $encloseAll || preg_match( "/(?:${delimiter_esc}|${enclosure_esc}|\s)/", $field ) ) {
				$output[] = $enclosure . str_replace($enclosure, $enclosure . $enclosure, $field) . $enclosure;
			}
			else {
				$output[] = $field;
			}
		}

		return implode( $delimiter, $output );
	}

	static function write_tmp_file($data, $basename, $extension) {
		WP_Filesystem();
		global $wp_filesystem;

		$plugin_dir      = plugin_dir_path( __FILE__ );
		$plugin_path     = str_replace(ABSPATH, $wp_filesystem->abspath(), $plugin_dir);
		$plugin_path_tmp = $plugin_path . "tmp/";

		$filename = self::$plugin_slug_short . "_" . $basename . "_" . md5(microtime()) . "." . $extension;
		$file     = $plugin_path_tmp . $filename;

		$file_handle = fopen($file, "a");
		fputs($file_handle, $data);
		fclose($file_handle);

		return array(
			"filepath" => $file,
			"filename" => $filename,
			"file_url" => plugin_dir_url(__FILE__) . "tmp/" . $filename
		);
	}

	/**
		this will encode/decode entities correctly (also &acute; and other damned characters!)
	**/
	public function normalize_encoding($string, $encode = "encode") {
		// encode
		if ($encode == "encode") {
			$string = htmlentities($string, ENT_COMPAT, "UTF-8", false);
		}
		// decode
		else {
			if (function_exists("mb_convert_encoding")) {
				$string = mb_convert_encoding($string, "HTML-ENTITIES", "UTF-8");
			}
			
			$string = html_entity_decode($string, ENT_COMPAT, "UTF-8");
		}

		return $string;
    }
}