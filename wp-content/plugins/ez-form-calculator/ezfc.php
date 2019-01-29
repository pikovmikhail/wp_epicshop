<?php
/*
Plugin Name: ez Form Calculator Free
Plugin URI: http://ez-form-calculator.ezplugins.de/
Description: With ez Form Calculator, you can simply create a form calculator for both yourself and your customers. Easily add basic form elements like checkboxes, dropdown menus, radio buttons etc. with only a few clicks. Each form element can be assigned a value which will automatically be calculated. Get the premium version at <a href="http://codecanyon.net/item/ez-form-calculator-wordpress-plugin/7595334?ref=keksdieb">
Version: 2.9.6.1
Author: Michael Schuppenies
Author URI: http://www.ezplugins.de/
*/

defined( 'ABSPATH' ) OR exit;

if (defined("EZFC_VERSION")) return;

/**
	setup
**/
define("EZFC_VERSION", "2.9.6.1");
define("EZFC_PATH", trailingslashit(plugin_dir_path(__FILE__)));
define("EZFC_SLUG", plugin_basename(__FILE__));
define("EZFC_URL", plugin_dir_url(__FILE__));

// ez functions
require_once(EZFC_PATH . "class.ezfc_functions.php");

// wrapper
function ezfc_get_version() {
	return EZFC_VERSION;
}

/**
	install
**/
function ezfc_register() {
	require_once(EZFC_PATH . "ezfc-register.php");
}

/**
	uninstall
**/
function ezfc_uninstall() {
	require_once(EZFC_PATH . "ezfc-uninstall.php");
}

// hooks
register_activation_hook(__FILE__, "ezfc_register");
register_uninstall_hook(__FILE__, "ezfc_uninstall");

// custom filter
add_filter("ezfc_custom_filter_test", "ezfc_test_filter", 0, 2);
function ezfc_test_filter($element_data, $input_value) {
	if ($input_value%2 == 1) {
		return array("error" => "Error!");
	}
}


class EZFC_Free {
	/**
		init plugin
	**/
	static function init() {
		// setup pages
		add_action("admin_menu", array(__CLASS__, "admin_menu"));

		// load languages
		add_action("plugins_loaded", array(__CLASS__, "load_language"));

		// load backend scripts / styles
		add_action("admin_enqueue_scripts", array(__CLASS__, "load_scripts"));

		// settings page
		$ezfc_plugin_name = plugin_basename(__FILE__);
		add_filter("plugin_action_links_{$ezfc_plugin_name}", array(__CLASS__, "plugin_settings_page"));

		// ** ajax **
		// backend
		add_action("wp_ajax_ezfc_backend", array(__CLASS__, "ajax"));
		// frontend
		add_action("wp_ajax_ezfc_frontend", array(__CLASS__, "ajax_frontend"));
		add_action("wp_ajax_nopriv_ezfc_frontend", array(__CLASS__, "ajax_frontend"));

		// tinymce
		add_action("admin_head", array(__CLASS__, "tinymce"));
		add_action("admin_print_scripts", array(__CLASS__, "tinymce_script"));

		// widget
		add_action("widgets_init", array(__CLASS__, "register_widget"));

		if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
			require_once( ABSPATH . '/wp-admin/includes/plugin.php' );
		}
	}

	/**
		admin pages
	**/
	static function admin_menu() {
		// user role
		$role = get_option("ezfc_user_roles", "administrator");
		
		require_once(EZFC_PATH . "class.ezfc_backend.php");
		$ezfc_backend = new Ezfc_backend();

		// setup pages
		add_menu_page("ezfc", "ez Form Calculator", $role, "ezfc", array(__CLASS__, "page_main"), EZFC_URL . "assets/img/ez-icon.png");
		add_submenu_page("ezfc", __("Form settings", "ezfc"), __("Form settings", "ezfc"), $role, "ezfc-settings-form", array(__CLASS__, "page_settings_form"));
		add_submenu_page("ezfc", __("Form submissions", "ezfc"), __("Form submissions", "ezfc"), $role, "ezfc-submissions", array(__CLASS__, "page_submissions"));
		add_submenu_page("ezfc", __("Global settings", "ezfc"), __("Global settings", "ezfc"), $role, "ezfc-options", array(__CLASS__, "page_settings"));
		add_submenu_page("ezfc", __("Help / debug", "ezfc"), __("Help / debug", "ezfc"), $role, "ezfc-help", array(__CLASS__, "page_help"));
		add_submenu_page("ezfc", __("Premium version", "ezfc"), __("Premium version", "ezfc"), $role, "ezfc-premium", array(__CLASS__, "page_premium"));
	}

	static function page_main() {
		require_once(EZFC_PATH . "ezfc-page-main.php");
	}

	static function page_settings_form() {
		require_once(EZFC_PATH . "ezfc-page-settings-form.php");
	}

	static function page_settings() {
		require_once(EZFC_PATH . "ezfc-page-settings.php");
	}

	static function page_help() {
		require_once(EZFC_PATH . "ezfc-page-help.php");
	}

	static function page_premium() {
		require_once(EZFC_PATH . "ezfc-page-premium.php");
	}

	static function page_preview() {
		require_once(EZFC_PATH . "ezfc-page-preview.php");
	}

	static function page_submissions() {
		require_once(EZFC_PATH . "ezfc-page-submissions.php");
	}

	/**
		add settings to plugins page
	**/
	static function plugin_settings_page($links) { 
		$settings_link = "<a href='" . admin_url("admin.php") . "?page=ezfc-options'>" . __("Global Settings", "ezfc") . "</a>";
		array_unshift($links, $settings_link);

		$form_settings_link = "<a href='" . admin_url("admin.php") . "?page=ezfc-settings-form'>" . __("Form Settings", "ezfc") . "</a>";
		array_unshift($links, $form_settings_link);

		return $links; 
	}

	/**
		ajax
	**/
	// frontend
	static function ajax_frontend() {
		require_once(EZFC_PATH . "ajax.php");
	}

	// backend
	static function ajax() {
		require_once(EZFC_PATH . "ajax-admin.php");
	}


	/**
		language domain
	**/
	static function load_language() {
		load_plugin_textdomain("ezfc", false, dirname(plugin_basename(__FILE__)) . '/lang/');
	}

	/**
		scripts
	**/
	static function load_scripts($page, $force_load=false) {
		if (!$force_load && $page != "toplevel_page_ezfc" && substr($page, 0, 23) != "ez-form-calculator_page") return;

		wp_enqueue_media();
		
		wp_enqueue_style("bootstrap-grid", plugins_url("assets/css/bootstrap-grid.min.css", __FILE__));
		wp_enqueue_style("ezfc-jquery-ui", plugins_url("assets/css/jquery-ui.min.css", __FILE__));
		wp_enqueue_style("ezfc-jquery-ui-theme", plugins_url("assets/css/jquery-ui.theme.min.css", __FILE__));
		wp_enqueue_style("jquerytimepicker-css", plugins_url("assets/css/jquery.timepicker.css", __FILE__));
		wp_enqueue_style("opentip", plugins_url("assets/css/opentip.css", __FILE__));
		wp_enqueue_style("thickbox");
		wp_enqueue_style("ezfc-css-backend", plugins_url("style-backend.css", __FILE__), array(), EZFC_VERSION);
		wp_enqueue_style("ezfc-font-awesome", plugins_url("assets/css/font-awesome.min.css", __FILE__));

		wp_enqueue_script("jquery");
		wp_enqueue_script("jquery-ui-accordion");
		wp_enqueue_script("jquery-ui-core");
		wp_enqueue_script("jquery-ui-dialog");
		wp_enqueue_script("jquery-ui-draggable");
		wp_enqueue_script("jquery-ui-droppable");
		wp_enqueue_script("jquery-ui-mouse");
		wp_enqueue_script("jquery-ui-selectable");
		wp_enqueue_script("jquery-ui-sortable");
		wp_enqueue_script("jquery-ui-spinner");
		wp_enqueue_script("jquery-ui-tabs");
		wp_enqueue_script("jquery-ui-widget");
		wp_enqueue_script("jquery-opentip", plugins_url("assets/js/opentip-jquery.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("numeraljs", plugins_url("assets/js/numeral.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("jquerytimepicker", plugins_url("assets/js/jquery.timepicker.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("ezfc-jquery-file-upload", plugins_url("assets/js/jquery.fileupload.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("jquery-iframe-transport", plugins_url("assets/js/jquery.iframe-transport.min.js", __FILE__), array("jquery-ui-widget"));
		wp_enqueue_script("thickbox");
		wp_enqueue_script("wp-color-picker");

		//wp_enqueue_script("ezfc-backend", plugins_url("backend.min.js", __FILE__), array("jquery"), EZFC_VERSION);
		wp_enqueue_script("ezfc-backend", plugins_url("backend.js", __FILE__), array("jquery"), EZFC_VERSION);

		if ($page == "ez-form-calculator_page_ezfc-options" || $page == "ez-form-calculator_page_ezfc-settings-form") {
			wp_enqueue_script("ezfc-backend-options", plugins_url("backend-options.js", __FILE__), array("ezfc-backend"), EZFC_VERSION);
		}

		wp_localize_script("ezfc-backend", "ezfc_vars", array(
			"delete" => __("Delete", "ezfc"),
			"delete_form" => __("Really delete the selected form?", "ezfc"),
			"delete_element" => __("Really delete the selected element?", "ezfc"),
			"form_changed" => __("You have changed the form without having saved. Really leave the current form unsaved?"),
			"form_overwrite_confirm" => __("Really overwrite this option for all forms?", "ezfc"),
			"submit_button" => __("Submit button", "ezfc"),
			"unavailable_element" => __("Unavailable for this element.", "ezfc"),
			"yes_no" => array(
				"yes" => __("Yes", "ezfc"),
				"no"  => __("No", "ezfc")
			),
			"element_option_description" => array(
				"add_line" => __("Add a line above step buttons.", "ezfc"),
				"add_to_price" => __("Add calculated value to total price", "ezfc"),
				"allow_multiple" => __("Allow multiple email addresses to be entered, separated by comma.", "ezfc"),
				"calculate" => __("Choose the operator and target element to calculate with. <br><br>Example: [ * ] [ field_1 ]<br>Result = current_value + field_1 * this_field.", "ezfc"),
				"calculate_enabled" => __("When checked, this field will be taken into calculations.", "ezfc"),
				"calculate_before" => __("When checked, this field will be calculated first. <br><br><strong>Checked</strong>: this_field / target_calculation_field. <br><br><strong>Unchecked</strong>: target_calculation_field / this_field.", "ezfc"),
				"calculate_when_hidden" => __("Whether to take this element into calculations when it is hidden or not.", "ezfc"),
				"class" => __("Additional CSS class for this element.", "ezfc"),
				"collapsible" => __("Allow the user to collapse or expand the group manually.", "ezfc"),
				"conditional" => __("Conditional fields can show or hide elements. Check out the conditional example from the templates or visit the documentation site for more information.", "ezfc"),
				"custom_calculation" => __("Javascript code. The code inside will be wrapped in a unique function. You do not need to add a return value since the variable 'price' will always be returned.", "ezfc"),
				"custom_error_message" => __("Error message when element value does not validate regular expression from custom_regex", "ezfc"),
				"custom_regex" => __("Custom regular expression. Only numbers allowed example: /[0-9]/i", "ezfc"),
				"description" => __("Users will see the description in a tooltip.", "ezfc"),
				"discount" => __("Discount values", "ezfc"),
				"do_shortcode" => __("Process shortcodes", "ezfc"),
				"double_check" => __("Double check email-address", "ezfc"),
				"expanded" => __("Whether the group should be expanded or collapsed at page load (only relevant when 'collapsible' is enabled).", "ezfc"),
				"factor" => __("The value will be automatically multiplied by this factor. Default factor: 1", "ezfc"),
				"GET" => __("This field will be filled from a GET-parameter. Example: <br><br><strong>URL</strong>: http://www.test.com/?test_value=1 <br><strong>GET</strong>: test_value <br><strong>Field value</strong>: 1.", "ezfc"),
				"hidden" => __("Hidden field. If this field is taken into conditional calculations, you need to set this option to Conditional hidden.", "ezfc"),
				"inline" => __("Display options in a row.", "ezfc"),
				"is_currency" => __("Format this field as currency value in submissions.", "ezfc"),
				"is_telephone_nr" => __("Mobile phones will automatically show the number pad when this element is focused. However, it will *not* check for actual phone numbers.", "ezfc"),
				"label" => __("This text will be displayed in the frontend.", "ezfc"),
				"max" => __("Maximum value", "ezfc"),
				"maxDate" => __("The opposite of minDate.", "ezfc"),
				"max_width" => __("Maximum width of images (if no unit is present, px will be used)."),
				"max_height" => __("Maximum height of images (if no unit is present, px will be used)."),
				"min" => __("Minimum value", "ezfc"),
				"minDate" => __("Minimum date of both dates. Example: +1d;;+2d - the first datepicker (from) will only have selectable dates 1 day in the future, the second datepicker (to) will only have selectable dates 2 days in the future", "ezfc"),
				"minDays" => __("The amount of minimum days to select.", "ezfc"),
				"multiple" => __("When checked, multiple files can be uploaded.", "ezfc"),
				"name" => __("Internal name. This value is displayed in submissions/emails only.", "ezfc"),
				"overwrite_price" => __("When checked, this field will override the calculations above. Useful with division operator. <br><br><strong>Checked</strong>: result = target_calculation_field / this_field. <br><br><strong>Unchecked</strong>: result = current_value + target_calculation_field / this_field.", "ezfc"),
				"pips" => __("Show little \"pips\" in the slider.", "ezfc"),
				"placeholder" => __("Placeholder only (slight background text when no value is present).", "ezfc"),
				"post_id" => __("Enter the ID of the post you want to show.", "ezfc"),
				"precision" => __("How many decimal numbers are used to calculate with", "ezfc"),
				"price_format" => __("Custom price format (see numeraljs.com for syntax). Default: 0,0[.]00", "ezfc"),
				"read_only" => __("Element is read-only."),
				"required" => __("Whether this is a required field or not.", "ezfc"),
				"set" => __("All selected elements will use the \"set_operator\".", "ezfc"),
				"set_operator" => __("This operator will be applied on all selected elements.", "ezfc"),
				"set_use_factor" => __("The value to be read from another element will be multiplied by its factor.", "ezfc"),
				"show_in_email" => __("Show this element in emails", "ezfc"),
				"slider" => __("Display a slider instead of a textfield. Needs minimum and maximum fields defined.", "ezfc"),
				"slidersteps" => __("Slider step value", "ezfc"),
				"spinner" => __("Display a spinner instead of a textfield.", "ezfc"),
				"steps_pips" => __("Incremental steps", "ezfc"),
				"steps_slider" => __("Incremental steps", "ezfc"),
				"steps_spinner" => __("Incremental steps", "ezfc"),
				"style" => __("CSS inline style, example (without quotes): \"color: #f00; margin-top: 1em;\"", "ezfc"),
				"tag" => __("HTML tag", "ezfc"),
				"text_after" => __("Text after price", "ezfc"),
				"text_before" => __("Text before price", "ezfc"),
				"title" => __("Title", "ezfc"),
				"use_address" => __("Emails will be sent to this address.", "ezfc"),
				"text_only" => __("Display text only instead of an input field", "ezfc"),
				"use_woocommerce_price" => __("This element will get the price of the current WooCommerce product.", "ezfc"),
				"value" => __("Predefined value.", "ezfc"),
				"value_external" => __("DOM-selector to get the value from (e.g. #myinputfield).", "ezfc"),
				"wrapper_class" => __("CSS class that will be added to the element wrapper.", "ezfc"),
				"wrapper_style" => __("CSS inline style that will be added to the element wrapper.", "ezfc")
			),
			"element_tip_description" => array(
				"action_perform" => __("This action will be performed", "ezfc"),
				"calc_target_element" => __("The value of the target element will be used to calculate with", "ezfc"),
				"calc_target_value" => __("The calculation value will only be used when no target element is selected", "ezfc"),
				"conditional_chain" => __("Conditional action will only be performed when all conditions are true.", "ezfc"),
				"conditional_factor" => __("Calculate with factor: the value to be read from another element will be multiplied by its factor", "ezfc"),
				"conditional_operator" => __("Conditional operator: compare operator of this element's value and target element's value. For the \"in between\" operator, use a colon (:) as separator, example: 20:100", "ezfc"),
				"conditional_row_operator" => __("If this checkbox is checked, then at least one condition needs to be true to trigger the conditional action."),
				"conditional_toggle" => __("Conditional toggle: when this field is checked, the opposite action will not be executed when this condition is triggered", "ezfc"),
				"conditional_value" => __("Conditional value", "ezfc"),
				"discount_operator" => __("Discount operator for the following discount value", "ezfc"),
				"discount_value_min" => __("Minimum value for this discount condition (leave blank for negative infinity)", "ezfc"),
				"discount_value_max" => __("Maximum value for this discount condition (leave blank for positive infinity)", "ezfc"),
				"target_element" => __("Target element", "ezfc"),
				"target_value" => __("Set target element value to this value (only with SET operator)", "ezfc")
			),
			"texts" => array(
				"action" => __("Action", "ezfc"),
				"add_calculation_field" => __("Add calculation field", "ezfc"),
				"add_conditional_field" => __("Add conditional field", "ezfc"),
				"change_element" => __("Change element", "ezfc"),
				"choose_image" => __("Choose image", "ezfc"),
				"choose_icon" => __("Choose icon", "ezfc"),
				"conditional_operator_short" => __("CO", "ezfc"),
				"discount_value" => __("Discount value", "ezfc"),
				"documentation" => __("Documentation", "ezfc"),
				"fileupload_conditional" => __("Please note that file upload elements cannot be both required and hidden at the same time due to browser security restrictions."),
				"functions" => __("Functions", "ezfc"),
				"operator" => __("Operator", "ezfc"),
				"remove" => __("Remove", "ezfc"),
				"refresh_fields" => __("Refresh fields", "ezfc"),
				"show_if_not_empty" => __("Show if not empty", "ezfc"),
				"show_if_not_empty_0" => __("Show if not empty and not 0", "ezfc"),
				"target_element" => __("Target element", "ezfc"),
				"target_value_short" => __("TV", "ezfc"),
				"value" => __("Value", "ezfc"),
				"value_min" => __("Value min", "ezfc"),
				"value_max" => __("Value max", "ezfc")
			),
			"editor" => array(
				"use_tinymce" => get_option("ezfc_use_tinymce", 1),
				"use_large_data_editor" => get_option("ezfc_use_large_data_editor", 1)
			)
		));
	}

	/**
		tinymce button
	**/
	static function tinymce() {
		global $typenow;

		if( ! in_array( $typenow, array( 'post', 'page' ) ) )
			return;

		add_filter('mce_external_plugins', array(__CLASS__, 'add_tinymce_plugin'));
		add_filter('mce_buttons', array(__CLASS__, 'add_tinymce_button'));
	}

	static function tinymce_script() {
		global $typenow;

		if( ! in_array( $typenow, array( 'post', 'page' ) ) )
			return;

		require_once(EZFC_PATH . "class.ezfc_backend.php");
		$ezfc_backend = new Ezfc_backend();

		echo "<script>ezfc_forms = " . json_encode($ezfc_backend->forms_get()) . ";</script>";
	}

	static function add_tinymce_plugin( $plugin_array ) {
		$plugin_array['ezfc_tinymce'] = plugins_url('/ezfc_tinymce.js', __FILE__ );

		return $plugin_array;
	}

	static function add_tinymce_button( $buttons ) {
		array_push( $buttons, 'ezfc_tinymce_button' );

		return $buttons;
	}

	/**
		widget
	**/
	static function register_widget() {
		require_once(EZFC_PATH . "widget.php");

		return register_widget("Ezfc_widget");
	}
}
EZFC_Free::init();

/**
	shortcodes
**/
class Ezfc_shortcode {
	static $add_script;
	static $ezfc_frontend;
	static $is_preview;

	static function init() {
		require_once(EZFC_PATH . "class.ezfc_frontend.php");
		self::$ezfc_frontend = new Ezfc_frontend();

		add_shortcode("ezfc", array(__CLASS__, "get_output"));

		add_action("wp_head", array(__CLASS__, "wp_head"));
		add_action("wp_footer", array(__CLASS__, "print_script"));
	}

	static function get_form_output($id=null, $name=null, $product_id=null, $theme=null, $preview=null) {
		return self::$ezfc_frontend->get_output($id, $name, $product_id, $theme, $preview);
	}

	static function get_output($atts) {
		self::$add_script = true;

		extract(shortcode_atts(array(
			"id"       => null,
			"name"     => null,
			"preview"  => null,
			"theme"    => null
		), $atts));

		self::$is_preview = $preview !== null;

		return self::get_form_output($id, $name, null, $theme, $preview);
	}

	static function wp_head() {
		wp_register_style("ezfc-css-frontend", plugins_url("style-frontend.css", __FILE__), array(), EZFC_VERSION);

		if (get_option("ezfc_load_custom_styling", 0) == 1) {
			wp_add_inline_style("ezfc-css-frontend", get_option("ezfc_css_custom_styling", ""));
		}
	}

	static function print_script() {
		if ( ! self::$add_script )
			return;

		if (get_option("ezfc_jquery_ui") == 1) {
			wp_enqueue_style("jquery-ui", plugins_url("assets/css/jquery-ui.min.css", __FILE__));
			wp_enqueue_style("jquery-ui", plugins_url("assets/css/jquery-ui.theme.min.css", __FILE__));
		}
		wp_enqueue_style("opentip", plugins_url("assets/css/opentip.css", __FILE__));
		wp_enqueue_style("ezfc-font-awesome", plugins_url("assets/css/font-awesome.min.css", __FILE__));
		wp_enqueue_style("ezfc-css-frontend", plugins_url("style-frontend.css", __FILE__), array(), EZFC_VERSION);

		// datepicker language
		if (get_option("ezfc_datepicker_load_languages", 0) == 1) {
			wp_enqueue_script("jquery-languages", plugins_url("assets/js/jquery.ui.i18n.all.min.js", __FILE__));
		}

		wp_enqueue_script("jquery");
		wp_enqueue_script("jquery-ui-core");
		wp_enqueue_script("jquery-ui-datepicker");
		wp_enqueue_script("jquery-ui-dialog");
		wp_enqueue_script("jquery-ui-widget");
		wp_enqueue_script("jquery-touch-punch", plugins_url("assets/js/jquery.ui.touch-punch.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("jquery-opentip", plugins_url("assets/js/opentip-jquery.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("numeraljs", plugins_url("assets/js/numeral.min.js", __FILE__), array("jquery"));
		wp_enqueue_script("jquery-countto", plugins_url("assets/js/jquery.countTo.min.js", __FILE__), array("jquery"));

		wp_enqueue_script("ezfc-frontend", plugins_url("frontend.min.js", __FILE__), array("jquery"), EZFC_VERSION);	

		// preview
		if (self::$is_preview) {
			wp_enqueue_script("ezfc-frontend-preview", plugins_url("frontend-preview.js", __FILE__), array("jquery"), microtime(true));
		}

		// general options
		wp_localize_script("ezfc-frontend", "ezfc_vars", array(
			"ajaxurl"   => admin_url( 'admin-ajax.php' ),
			"form_vars" => array(),

			"auto_scroll_steps"         => get_option("ezfc_auto_scroll_steps", 1),
			"datepicker_language"       => get_option("ezfc_datepicker_language", "en"),
			"debug_mode"                => get_option("ezfc_debug_mode", 0),
			"noid"                      => __("No form with the requested ID found.", "ezfc"),
			"price_format"              => get_option("ezfc_price_format"),
			"price_format_dec_num"      => get_option("ezfc_email_price_format_dec_num", 2),
			"price_format_dec_point"    => get_option("ezfc_email_price_format_dec_point", "."),
			"price_format_dec_thousand" => get_option("ezfc_email_price_format_thousand", ","),
			"required_text_position"    => get_option("ezfc_required_text_position", "middle right"),
			"scroll_steps_offset"       => get_option("ezfc_scroll_steps_offset", -200),
			"uploading"                 => __("Uploading...", "ezfc"),
			"upload_success"            => __("File upload successful.", "ezfc"),
			"yes_no" => array(
				"yes" => __("Yes", "ezfc"),
				"no"  => __("No", "ezfc")
			)
		));

		// extension scripts / styles
		do_action("ezfc_ext_enqueue_scripts");
	}
}
Ezfc_shortcode::init();