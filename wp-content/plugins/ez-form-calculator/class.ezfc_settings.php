<?php

abstract class Ezfc_settings {
	/**
		form elements
	**/
	static function get_elements() {
		$elements = array(
			array(
				"id" => 1,
				"name" => __("Input", "ezfc"),
				"description" => __("Basic input field with no restrictions", "ezfc"),
				"type" => "input",
				"data" => array(
					"name" => __("Input", "ezfc"),
					"label" => "Text",
					"required" => 0,
					"value" => "",
					"value_external" => "",
					"value_http" => "",
					"read_only" => 0,
					"placeholder" => "",
					"icon" => "",
					"is_telephone_nr" => 0,
					"custom_regex" => "",
					"custom_error_message" => "",
					"custom_filter" => "",
					"max_length" => "",
					"show_in_email" => 1,
					"description" => "",
					"class" => "",
					"wrapper_class" => "",
					"style" => "",
					"wrapper_style" => "",
					"GET" => "",
					"hidden" => 0,
					"columns" => 6,
					"group_id" => 0
				),
				"icon" => "fa-pencil-square-o",
				"category" => "basic"
			),
			array(
				"id" => 2,
				"name" => __("Email", "ezfc"),
				"description" => __("Email input field", "ezfc"),
				"type" => "email",
				"data" => array(
					"name" => __("Email", "ezfc"),
					"label" => "Email",
					"required" => 0,
					"use_address" => 1,
					"double_check" => 0,
					"allow_multiple" => 0,
					"value" => "",
					"value_external" => "",
					"value_http" => "",
					"read_only" => 0,
					"placeholder" => "",
					"icon" => "",
					"show_in_email" => 1,
					"description" => "",
					"class" => "",
					"wrapper_class" => "",
					"style" => "",
					"wrapper_style" => "",
					"GET" => "",
					"hidden" => 0,
					"columns" => 6,
					"group_id" => 0
				),
				"icon" => "fa-envelope-o",
				"category" => "basic"
			),
			array(
				"id" => 3,
				"name" => __("Textfield", "ezfc"),
				"description" => __("Large text field", "ezfc"),
				"type" => "textfield",
				"data" => array(
					"name" => __("Textfield", "ezfc"),
					"label" => "Textfield",
					"required" => 0,
					"value" => "",
					"value_external" => "",
					"value_http" => "",
					"read_only" => 0,
					"placeholder" => "",
					"icon" => "",
					"max_length" => "",
					"show_in_email" => 1,
					"description" => "",
					"class" => "",
					"wrapper_class" => "",
					"style" => "",
					"wrapper_style" => "",
					"GET" => "",
					"hidden" => 0,
					"columns" => 6,
					"group_id" => 0
				),
				"icon" => "fa-align-justify",
				"category" => "basic"
			),
			array(
				"id" => 5,
				"name" => __("Radio Button", "ezfc"),
				"description" => __("Used for single-choice elements.", "ezfc"),
				"type" => "radio",
				"data" => array(
					"name" => __("Radio", "ezfc"),
					"label" => "Radio",
					"required" => 0,
					"calculate_enabled" => 1,
					"is_currency" => 1,
					"options" => array(array("value" => "0", "text" => "Option")),
					"calculate" => array(array("operator" => "", "target" => 0,"value" => "")),
					"overwrite_price" => 0,
					"calculate_when_hidden" => 1,
					"calculate_before" => 0,
					"conditional" => array(array("action" => "", "target" => 0, "operator" => "", "value" => "")),
					"discount" => array(array("range_min" => "", "range_max" => "", "operator" => "", "discount_value" => "")),
					"show_in_email" => 1,
					"description" => "",
					"max_width" => "",
					"max_height" => "",
					"inline" => 0,
					"class" => "",
					"wrapper_class" => "",
					"style" => "",
					"wrapper_style" => "",
					"hidden" => 0,
					"columns" => 6,
					"group_id" => 0
				),
				"icon" => "fa-dot-circle-o",
				"category" => "calc"
			),
			array(
				"id" => 7,
				"name" => __("Numbers", "ezfc"),
				"description" => __("Numbers only", "ezfc"),
				"type" => "numbers",
				"data" => array(
					"name" => __("Numbers", "ezfc"),
					"label" => "Numbers",
					"required" => 0,
					"calculate_enabled" => 1,
					"is_currency" => 1,
					"factor" => "",
					"value" => "",
					"value_external" => "",
					"value_http" => "",
					"min" => "",
					"max" => "",
					"slider" => 0,
					"steps_slider" => 1,
					"spinner" => 0,
					"steps_spinner" => 1,
					"pips" => 0,
					"steps_pips" => 1,
					"calculate" => array(array("operator" => "", "target" => 0,"value" => "")),
					"overwrite_price" => 0,
					"calculate_when_hidden" => 1,
					"calculate_before" => 0,
					"conditional" => array(array("action" => "", "target" => 0,"operator" => "", "value" => "")),
					"discount" => array(array("range_min" => "", "range_max" => "", "operator" => "", "discount_value" => "")),
					"custom_filter" => "",
					"read_only" => 0,
					"placeholder" => "",
					"icon" => "",
					"max_length" => "",
					"show_in_email" => 1,
					"description" => "",
					"class" => "",
					"wrapper_class" => "",
					"style" => "",
					"wrapper_style" => "",
					"GET" => "",
					"hidden" => 0,
					"columns" => 6,
					"group_id" => 0
				),
				"icon" => "fa-html5",
				"category" => "calc"
			)
		);

		return json_decode(json_encode($elements));
	}

	/**
		global settings
	**/
	static function get_global_settings($flat = false) {
		$settings = array(
			"Customization" => array(
				"custom_css" => array("description" => __("Custom CSS", "ezfc"), "description_long" => __("Add your custom styles here.", "ezfc"), "type" => "textarea"),
				"required_text" => array("description" => __("Required text", "ezfc"), "description_long" => __("This text is shown below the form.", "ezfc"), "type" => "input", "default" => "Required"),
				"required_text_element" => array("description" => __("Required element text", "ezfc"), "description_long" => __("This text will be shown when a required element is empty. Default: 'This field is required'", "ezfc"), "type" => "input", "default" => "This field is required."),
				"required_text_position" => array("description" => __("Required text position", "ezfc"), "description_long" => __("Position of the required text tip.", "ezfc"), "type" => "dropdown", "default" => "middle right", "options" => array(
					"bottom left"  => __("Top left", "ezfc"),
					"bottom"       => __("Top", "ezfc"),
					"bottom right" => __("Top right", "ezfc"),
					"middle left"  => __("Middle left", "ezfc"),
					"middle"       => __("Middle", "ezfc"),
					"middle right" => __("Middle right", "ezfc"),
					"top left"     => __("Bottom left", "ezfc"),
					"top"          => __("Bottom", "ezfc"),
					"top right"    => __("Bottom right", "ezfc")
				)),
				"required_text_auto_hide" => array("description" => __("Required text auto hide", "ezfc"), "description_long" => __("Seconds to automatically hide the required text tooltip. Leave blank or set to 0 to disable this option.", "ezfc"), "type" => "input", "default" => ""),
				"datepicker_language" => array("description" => __("Datepicker language", "ezfc"), "description_long" => __("Datepicker language. Default: 'en'", "ezfc"), "type" => "input"),
				"datepicker_load_languages" => array("description" => __("Load datepicker languages", "ezfc"), "description_long" => __("Load additional datepicker languages. Only set this option to 'Yes' when using a different language than English since all languages will be loaded with an additional ~40kb file. If you know what you are doing, you can remove all unneccessary data from the file /ez-form-calculator-premium/assets/js/jquery.ui.u18n.all.min.js", "ezfc"), "type" => "yesno"),
				"auto_scroll_steps" => array("description" => __("Auto scroll steps", "ezfc"), "description_long" => __("Automatically scroll to top upon changing steps.", "ezfc"), "type" => "yesno", "default" => 1),
				"loading_icon" => array("description" => __("Loading icon", "ezfc"), "description_long" => __("This icon will be shown when the form is submitted.", "ezfc"), "type" => "input", "default" => "fa fa-cog fa-spin"),
				"scroll_steps" => array("description" => __("Scroll steps", "ezfc"), "description_long" => __("The browser window scrolls to the top of the form automatically.", "ezfc"), "type" => "yesno", "default" => 1),
				"scroll_steps_offset" => array("description" => __("Scroll offset", "ezfc"), "description_long" => __("Top offset when scrolling (in px)", "ezfc"), "type" => "input", "default" => -200)
			),

			"Price" => array(
				"price_format"                 => array(
					"description" => __("Price format", "ezfc"),
					"description_long" => sprintf(__("See %s for syntax documentation", "ezfc"), "<a href='http://numeraljs.com/' target='_blank'>numeraljs.com</a>"),
					"type" => "input",
					"default" => "0,0[.]00"
				),
				"email_price_format_thousand"  => array(
					"description" => __("Price format thousands separator", "ezfc"),
					"description_long" => __("Thousands separator", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"." => __("Dot (.)", "ezfc"),
						"," => __("Comma (,)", "ezfc"),
						""  => __("Blank", "ezfc")
					),
					"default" => ","
				),
				"email_price_format_dec_point" => array(
					"description" => __("Price format decimal point", "ezfc"),
					"description_long" => __("Decimal point separator", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"." => __("Dot (.)", "ezfc"),
						"," => __("Comma (,)", "ezfc")
					),
					"default" => "."
				)
			),

			"Email" => array(
				"email_price_format_dec_num" => array("description" => __("Price format decimals", "ezfc"), "description_long" => __("Number of decimals in email prices", "ezfc"), "type" => "input", "default" => 2),
				"email_font_family" => array("hidden" => true, "description" => __("Email font family", "ezfc"), "description_long" => __("Font to be used in email body. It is recommended to provide fallback fonts, example: Arial, Helvetica, sans-serif", "ezfc"), "type" => "input", "default" => "Arial, Helvetica, sans-serif"),
				"email_plain_html" => array("hidden" => true, "description" => __("Use plain HTML", "ezfc"), "description_long" => __("If disabled, HTML elements will be shown as code in emails.", "ezfc"), "type" => "yesno", "default" => 1),
				"email_smtp_enabled" => array("description" => __("Enable SMTP", "ezfc"), "description_long" => "", "type" => "yesno", "hidden" => true),
				"email_smtp_host"    => array("description" => __("SMTP Host", "ezfc"), "description_long" => "", "type" => "input", "hidden" => true),
				"email_smtp_user"    => array("description" => __("SMTP Username", "ezfc"), "description_long" => "", "type" => "input", "hidden" => true),
				"email_smtp_pass"    => array("description" => __("SMTP Password", "ezfc"), "description_long" => "", "type" => "password", "hidden" => true),
				"email_smtp_port"    => array("description" => __("SMTP Port", "ezfc"), "description_long" => "", "type" => "input", "hidden" => true),
				"email_smtp_secure"  => array("description" => __("SMTP Encryption", "ezfc"), "description_long" => "", "type" => "dropdown", "options" => array(
					"0"   => "No encryption",
					"ssl" => "SSL",
					"tls" => "TLS"
				), "hidden" => true)
			),

			"PayPal" => array(
				"pp_api_username"         => array("hidden" => true, "description" => __("PayPal API username", "ezfc"), "description_long" => __("See <a href='https://developer.paypal.com/docs/classic/api/apiCredentials/'>PayPal docs</a> to read how to get your API credentials.", "ezfc"), "type" => "input"),
				"pp_api_password"         => array("hidden" => true, "description" => __("PayPal API password", "ezfc"), "description_long" => "", "type" => "password"),
				"pp_api_signature"        => array("hidden" => true, "description" => __("PayPal API signature", "ezfc"), "description_long" => "", "type" => "input"),
				"pp_return_url"           => array("hidden" => true, "description" => __("Return URL", "ezfc"), "description_long" => __("The return URL is the location where buyers return to when a payment has been succesfully authorized. <br>You need to use this shortcode on the return page/post or else it will not work:<br>[ezfc_verify]", "ezfc"), "type" => "input"),
				"pp_cancel_url"           => array("hidden" => true, "description" => __("Cancel URL", "ezfc"), "description_long" => __("The cancelURL is the location buyers are sent to when they hit the cancel button during authorization of payment during the PayPal flow.", "ezfc"), "type" => "input"),
				"pp_currency_code"        => array("hidden" => true, "description" => __("Currency code", "ezfc"), "description_long" => "", "type" => "currencycodes"),
				"pp_sandbox"              => array("hidden" => true, "description" => __("Use sandbox", "ezfc"), "description_long" => __("Set to 'yes' for testing purposes.", "ezfc"), "type" => "yesno", "default" => 0),
				"pp_acount_required"      => array("hidden" => true, "description" => __("Account required", "ezfc"), "description_long" => __("Whether a PayPal account is required or not. If an account is optional, you still need to do the following step: Log in to your PayPal account, go to the Profile subtab, click on Website Payment Preferences under the Selling Preferences column, and check the yes/no box under PayPal Account Optional.", "ezfc"), "type" => "yesno", "default" => 1)
			),

			"PDF" => array(
				"pdf_save_file" => array(
					"name" => "pdf_save_file",
					"description" => __("Save PDF files", "ezfc"),
					"description_long" => __("Only available in the premium version", "ezfc"),
					"type" => "yesno",
					"default" => 0, "hidden" => true
				),
				"pdf_allow_remote" => array(
					"name" => "pdf_allow_remote",
					"description" => __("Allow remote content", "ezfc"),
					"description_long" => __("If this setting is set to true, the PDF library (DOMPDF) will access remote sites for images and CSS files as required.", "ezfc"),
					"type" => "yesno",
					"default" => 1, "hidden" => true
				)
			),

			"ReCaptcha" => array(
				"captcha_public"  => array("description" => __("Recaptcha public key", "ezfc"), "description_long" => "", "type" => "input", "hidden" => true),
				"captcha_private" => array("description" => __("Recaptcha private key", "ezfc"), "description_long" => "", "type" => "input", "hidden" => true)
			),

			"Styling" => array(
				"load_custom_styling" => array(
					"name" => "load_custom_styling",
					"description" => __("Load custom styling", "ezfc"),
					"description_long" => __("Only enable this option if you want to use the styling below.", "ezfc"),
					"type" => "yesno",
					"default" => 0,
					"value" => ""
				),
				// will be generated automatically
				"css_custom_styling" => array(
					"name" => "css_custom_styling",
					"description" => "",
					"description_long" => "",
					"type" => "hidden",
					"default" => "",
					"value" => ""
				),
				"css_font" => array(
					"name" => "css_font",
					"description" => __("Font", "ezfc"),
					"type" => "font",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "font-family"
					),
					"value" => ""
				),
				"css_font_size" => array(
					"name" => "css_font_size",
					"description" => __("Font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "font-size"
					),
					"value" => ""
				),
				"css_background_color" => array(
					"name" => "css_background_color",
					"description" => __("Background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_background_image" => array(
					"name" => "css_background_image",
					"description" => __("Background image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-image",
						"is_url"   => true
					),
					"value" => ""
				),
				"css_background_size" => array(
					"default" => "contain",
					"name" => "css_background_size",
					"description" => __("Background size", "ezfc"),
					"type" => "input",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-size"
					),
					"value" => ""
				),
				"css_background_repeat" => array(
					"name" => "css_background_repeat",
					"description" => __("Background repeat", "ezfc"),
					"type" => "input",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-repeat"
					),
					"value" => ""
				),
				"css_text_color" => array(
					"name" => "css_text_color",
					"description" => __("Text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "color"
					),
					"value" => ""
				),
				// input
				"css_input_background_color" => array(
					"name" => "css_input_background_color",
					"description" => __("Input background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_input_text_color" => array(
					"name" => "css_input_text_color",
					"description" => __("Input text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "color"
					),
					"value" => ""
				),
				"css_input_border" => array(
					"name" => "css_input_border",
					"description" => __("Input border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "border"
					),
					"value" => ""
				),
				"css_input_padding" => array(
					"name" => "css_input_padding",
					"description" => __("Input padding", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "padding"
					),
					"value" => ""
				),
				// submit button
				"css_submit_image" => array(
					"name" => "css_submit_image",
					"description" => __("Submit button image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "background-image",
						"is_url"   => true,
						"add"      => array(
							"background-repeat" => "no-repeat",
							"background-size" => "contain"
						),
						"hover_override" => true
					),
					"value" => ""
				),
				"css_submit_background" => array(
					"name" => "css_submit_background",
					"description" => __("Submit button background", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "background-color",
						"hover_override" => true
					),
					"value" => ""
				),
				"css_submit_text_color" => array(
					"name" => "css_submit_text_color",
					"description" => __("Submit button text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "color",
						"hover_override" => true
					),
					"value" => ""
				),
				"css_submit_border" => array(
					"name" => "css_submit_border",
					"description" => __("Submit button border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "border",
						"hover_override" => true
					),
					"value" => ""
				),
				// step styling
				"css_step_button_image" => array(
					"name" => "css_step_button_image",
					"description" => __("Step button image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "background-image",
						"is_url"   => true,
						"add"      => array(
							"background-repeat" => "no-repeat",
							"background-size" => "contain"
						),
						"hover_override" => true
					),
					"value" => ""
				),
				"css_step_button_background" => array(
					"name" => "css_step_button_background",
					"description" => __("Step button background", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_step_button_text_color" => array(
					"name" => "css_step_button_text_color",
					"description" => __("Step button text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "color"
					),
					"value" => ""
				),
				"css_step_button_border" => array(
					"name" => "css_step_button_border",
					"description" => __("Step button border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "border"
					),
					"value" => ""
				),
				"css_title_font_size" => array(
					"name" => "css_title_font_size",
					"description" => __("Step title font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-step-title",
						"property" => "font-size"
					),
					"value" => ""
				),
				// fixed price
				"css_fixed_price_font_size" => array(
					"name" => "css_fixed_price_font_size",
					"description" => __("Fixed price font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "font-size"
					),
					"value" => ""
				),
				"css_fixed_price_background_color" => array(
					"name" => "css_fixed_price_background_color",
					"description" => __("Fixed price background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_fixed_price_text_color" => array(
					"name" => "css_fixed_price_text_color",
					"description" => __("Fixed price color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "color"
					),
					"value" => ""
				),
				// other
				"css_form_padding" => array(
					"name" => "css_form_padding",
					"description" => __("Form padding", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "padding"
					),
					"value" => ""
				),
				"css_form_width" => array(
					"name" => "css_form_width",
					"description" => __("Form width", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "width"
					),
					"value" => ""
				),
				"css_form_height" => array(
					"description" => __("Form height", "ezfc"),
					"description_long" => "",
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "height"
					),
					"value" => ""
				),
				"css_overflow_x" => array(
					"description" => __("Overflow-x", "ezfc"),
					"description_long" => "",
					"type" => "dropdown",
					"options" => array(
						"auto" => "auto",
						"visible" => "visible",
						"hidden" => "hidden",
						"scroll" => "scroll",
						"inherit" => "inherit",
						"initial" => "initial",
						"unset" => "unset",
					),
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "overflow-x"
					),
					"default" => "auto",
					"value" => ""
				),
				"css_overflow_y" => array(
					"description" => __("Overflow-y", "ezfc"),
					"description_long" => "",
					"type" => "dropdown",
					"options" => array(
						"auto" => "auto",
						"visible" => "visible",
						"hidden" => "hidden",
						"scroll" => "scroll",
						"inherit" => "inherit",
						"initial" => "initial",
						"unset" => "unset",
					),
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "overflow-y"
					),
					"default" => "auto",
					"value" => ""
				),
				"css_vertical_spacing" => array(
					"description" => __("Vertical spacing", "ezfc"),
					"description_long" => "",
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-element-wrapper-spacer",
						"property" => "height"
					),
					"value" => ""
				)
			),

			"WooCommerce" => array(
				"woocommerce"            => array("hidden" => true, "description" => __("Integrate with WooCommerce", "ezfc"), "description_long" => __("Integrate with WooCommerce. Please be aware that on a single product page, the product price and add-to-cart button will be hidden since the plugin handles this.", "ezfc"), "type" => "yesno"),
				"woocommerce_text"       => array("hidden" => true, "description" => __("'Added to cart' text", "ezfc"), "description_long" => __("This text will be displayed after a submission was added to the cart.", "ezfc"), "type" => "input"),
				"woocommerce_add_forms"  => array("hidden" => true, "description" => __("Add forms to products", "ezfc"), "description_long" => __("When this option is enabled, forms will be added to products automatically. If you want to show individual forms for products, please make sure you add a custom field to the product:<br>
					custom field name: ezfc_form_id<br>custom field value: &lt;form_id&gt;<br>
					If you want to show one form for all products, please enter a form ID in 'Global form ID' below.<br>
					<strong>This will replace the 'Add to cart'-button from Woocommerce!</strong><br>
					More information here: <a href='http://ez-form-calculator.ezplugins.de/documentation/woocommerce-integration/' target='_blank'>ezfc Woocommerce Integration</a>", "ezfc"), "type" => "yesno"),
				"woocommerce_global_form_id"  => array("hidden" => true, "description" => __("Global form ID", "ezfc"), "description_long" => __("Form with this ID will be added to the WooCommerce product when 'Add forms to products' is set to 'Yes'", "ezfc"), "type" => "input"),
				"woocommerce_checkout_details" => array("hidden" => true, "description" => __("Show selected values in checkout", "ezfc"), "description_long" => __("Show the selected values in a table on the checkout page", "ezfc"), "type" => "yesno"),
				"woocommerce_checkout_details_text" => array("hidden" => true, "description" => __("Checkout details text", "ezfc"), "description_long" => __("If 'Show selected values in checkout' is enabled, display this text above the details table.", "ezfc"), "type" => "input", "default" => "Selected values"),
				"woocommerce_checkout_details_values" => array("hidden" => true, "description" => __("Checkout details values", "ezfc"), "description_long" => __("Details text in checkout: 'Full Details' shows all values and calculations. 'Simple details' shows values and prices. 'Values only' shows the selected values only. <strong>Note: only applies to products added after this values was changed.</strong>", "ezfc"), "type" => "dropdown", "default" => "result", "options" => array("hidden" => true, 
						"result" => __("Full details (result)", "ezfc"),
						"result_simple" => __("Simple details (result_simple)", "ezfc"),
						"result_values" => __("Values only (result_values)", "ezfc"),
						"result_values_submitted" => __("Submitted values only (result_values_submitted)", "ezfc")
				)),
				"woocommerce_enable_edit" => array("hidden" => true, "description" => __("Editable cart items", "ezfc"), "description_long" => __("Customers can edit the submitted form in the cart. When set to 'Yes', an editable link will be added to relevant cart items.", "ezfc"), "type" => "yesno", "default" => 1),
				"woocommerce_edit_text" => array("hidden" => true, "description" => __("Edit text", "ezfc"), "description_long" => __("Text of the edit link.", "ezfc"), "type" => "input", "default" => __("Edit", "ezfc")),
				"woocommerce_add_hook"  => array("hidden" => true, "description" => __("Form display hook", "ezfc"), "description_long" => __("WooCommerce hook when forms are added to products (for a full list, see <a href='http://docs.woothemes.com/document/hooks/' target='_blank'>docs.woothemes.com</a>)", "ezfc"), "type" => "input", "default" => "woocommerce_after_single_product"),
				"woocommerce_product_id" => array("hidden" => true, "description" => __("WooCommerce product id", "ezfc"), "description_long" => __("<strong>NOTE:</strong> this value is deprecated since v2.7.3 and has no effect - set the WooCommerce product id in the form options", "ezfc"), "type" => "input"),
				/*"woocommerce_send_mail" => array("description" => __("Send additional email", "ezfc"), "description_long" => __("Emails won't be sent when using WooCommerce, but you might want to receive a separate email sent by this plugin with the submitted values.", "ezfc"), "type" => "dropdown", "default" => 0, "options" => array(
						"0" => "No",
						"admin" => "Admin only",
						"admin_customer" => "Admin and customers"
				)),*/
			),

			"Other" => array(
				"user_roles"             => array("description" => __("User roles", "ezfc"), "description_long" => __("Check which user role has access to edit this plugin.", "ezfc"), "type" => "roles", "default" => "administrator"),
				"mailchimp_api_key"      => array("description" => __("Mailchimp API key", "ezfc"), "description_long" => __("<a href='http://kb.mailchimp.com/accounts/management/about-api-keys'>How to find your API key</a> (mailchimp.com)", "ezfc"), "type" => "input"),
				"content_filter"         => array("description" => __("Content filter", "ezfc"), "description_long" => __("WordPress filter to apply html elements on. You might want to use 'the_content' if HTML elements look wrong (without quotes).", "ezfc"), "type" => "input", "default" => ""),
				"use_tinymce"            => array("description" => __("Use tinyMCE", "ezfc"), "description_long" => __("Use tinyMCE editor in HTML elements.", "ezfc"), "type" => "yesno", "default" => 1),
				"use_large_data_editor"  => array("description" => __("Use large data editor", "ezfc"), "description_long" => __("Use large data editor to edit form elements. The editor will be fixed to the right side and expanded to full height.", "ezfc"), "type" => "yesno", "default" => 1),
				"debug_mode"             => array("description" => __("Enable debug mode", "ezfc"), "description_long" => "", "type" => "dropdown", "default" => 0, "options" => array(
					0 => "No",
					1 => "Yes",
					2 => "Yes + Frontend details"
				)),
				"jquery_ui" => array("description" => __("Add default jQuery UI stylesheet", "ezfc"), "description_long" => __("If your theme looks differently after installing this plugin, set this option to 'No' and see again. It may break due to the default jQuery UI stylesheet.", "ezfc"), "type" => "yesno", "default" => 1),
				"uninstall_keep_data"    => array("description" => __("Keep data after uninstall", "ezfc"), "description_long" => __("The plugin will keep all plugin-related data in the database when uninstalling. Only select 'Yes' if you want to upgrade the script.", "ezfc"), "type" => "yesno"),
				"css_form_label_width" => array("description" => __("CSS label width", "ezfc"), "description_long" => __("Width of the labels. Default: 15em", "ezfc") . " - <strong>" . __("Deprecated", "ezfc") . "</strong>", "type" => "input"),
			)
		);

		// get values
		foreach ($settings as $cat => &$settings_cat) {
			foreach ($settings_cat as $name => &$setting) {
				$default = isset($setting["default"]) ? $setting["default"] : "";

				$setting["value"] = get_option("ezfc_{$name}", $default);
			}
		}

		if ($flat) {
			$settings = self::flatten($settings);
		}

		return $settings;
	}

	/**
		update global settings
	**/
	public static function update_global_settings($submitted_values) {
		$settings = self::get_global_settings(true);

		// css array builder
		$css_builder = new EZ_CSS_Builder(".ezfc-wrapper");

		foreach ($settings as $setting_key => $setting) {
			if (!isset($submitted_values[$setting_key])) continue;

			// get post value
			$value = $submitted_values[$setting_key];

			if (is_array($value)) {
				$value = serialize($value);
			}
			else {
				$value = stripslashes($value);
			}

			// update wp option
			update_option("ezfc_{$setting_key}", $value);

			// check for css
			if (!empty($setting["css"]) && !empty($value)) {
				$css_builder->add_css($setting["css"], $value);
			}
		}

		// build css output
		$css_output = $css_builder->get_output();
		update_option("ezfc_css_custom_styling", $css_output);
	}

	/**
		form options
	**/
	static function get_form_options($flat = false) {
		$settings = array(
			"Email" => array(
				"email_recipient" => array(
					"id" => 1,
					"name" => "email_recipient",
					"default" => "",
					"description" => __("Email recipient", "ezfc"),
					"description_long" => __("Notifications will be sent to this email. Leave blank for no notifications.", "ezfc"),
					"type" => "email",
					"value" => ""
				),
				"email_admin_sender" => array(
					"id" => 10,
					"name" => "email_admin_sender",
					"default" => "",
					"description" => __("Sender name", "ezfc"),
					"description_long" => __("Sender name in emails. Use this syntax: Sendername &lt;sender@mail.com&gt;", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"email_admin_sender_recipient" => array(
					"id" => 91,
					"name" => "email_admin_sender_recipient",
					"default" => "",
					"description" => __("Sender name (admin)", "ezfc"),
					"description_long" => __("Sender name in emails sent to the admin (recipient). Use this syntax: Sendername &lt;sender@mail.com&gt;", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"email_subject" => array(
					"id" => 11,
					"name" => "email_subject",
					"default" => "Your submission",
					"description" => __("Email subject", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"email_text" => array(
					"id" => 12,
					"name" => "email_text",
					"default" => "Thank you for your submission, we will contact you soon!\n\n{{result_simple}}",
					"description" => __("Email text", "ezfc"),
					"description_long" => __("Email text sent to the user. Use {{result}} for submission details, {{result_simple}} for no calculation details, {{result_values}} for values only. Use {{Elementname}} for single element values (where Elementname is the internal name of the element). Use {{files}} for attached files (you should not send these to the customer for security reasons).", "ezfc") . "<br><a href='http://ez-form-calculator.ezplugins.de/email-placeholder-list/' target='_blank'>" . __("View all placeholders", "ezfc") . "</a>",
					"type" => "editor",
					"value" => ""
				),
				"email_admin_subject" => array(
					"id" => 13,
					"name" => "email_admin_subject",
					"default" => "New submission",
					"description" => __("Admin email subject", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"email_admin_text" => array(
					"id" => 14,
					"name" => "email_admin_text",
					"default" => "You have received a new submission:\n\n{{result}}",
					"description" => __("Admin email text", "ezfc"),
					"description_long" => __("Email text sent to the admin. Use {{result}} for submission details. Use {{Elementname}} for single element values (where Elementname is the internal name of the element). Use {{files}} for attached files (you should not send these to the customer for security reasons)", "ezfc") . "<br><a href='http://ez-form-calculator.ezplugins.de/email-placeholder-list/' target='_blank'>" . __("View all placeholders", "ezfc") . "</a>",
					"type" => "editor",
					"value" => ""
				),
				"email_subject_pp" => array(
					"id" => 24,
					"name" => "email_subject_pp",
					"default" => "Your submission",
					"description" => __("Email Paypal subject", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"email_text_pp" => array(
					"id" => 25,
					"name" => "email_text_pp",
					"default" => "Thank you for your submission,\n\nwe have received your payment via PayPal.",
					"description" => __("Email Paypal text", "ezfc"),
					"description_long" => __("Email text sent to the user when paid with PayPal.", "ezfc") . "<br><a href='http://ez-form-calculator.ezplugins.de/email-placeholder-list/' target='_blank'>" . __("View all placeholders", "ezfc") . "</a>",
					"type" => "editor",
					"value" => ""
				),
				"email_send_files_attachment" => array(
					"id" => 41,
					"name" => "email_send_files_attachment",
					"default" => "0",
					"description" => __("Send files as attachment", "ezfc"),
					"description_long" => __("Uploaded files will be sent to the admin email recipient as attachments", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"email_show_html_elements" => array(
					"id" => 75,
					"name" => "email_show_html_elements",
					"default" => "0",
					"description" => __("Show HTML elements", "ezfc"),
					"description_long" => __("HTML elements can be shown in emails. You need to make sure that HTML elements have the option 'Show_in_email' enabled as well.", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"email_nl2br" => array(
					"id" => 98,
					"name" => "email_nl2br",
					"default" => 1,
					"description" => __("Add linebreaks", "ezfc"),
					"description_long" => __("Automatically add linebreaks to emails. If emails contain a lot of blank space, you may want to disable this option.", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"email_subject_utf8" => array(
					"id" => 99,
					"name" => "email_subject_utf8",
					"default" => 0,
					"description" => __("Use utf8 subject", "ezfc"),
					"description_long" => __("When special characters aren't shown properly in email subjects, set this option to 'Yes'.", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"mailchimp_add" => array(
					"id" => 30,
					"name" => "mailchimp_add",
					"default" => "0",
					"description" => __("Enable MailChimp", "ezfc"),
					"description_long" => __("Enable MailChimp integration", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"mailchimp_list" => array(
					"id" => 31,
					"name" => "mailchimp_list",
					"default" => "",
					"description" => __("Mailchimp list", "ezfc"),
					"description_long" => __("Email addresses will be added to this list upon form submission.", "ezfc"),
					"type" => "mailchimp_list",
					"value" => ""
				),
				"mailpoet_add" => array(
					"id" => 48,
					"name" => "mailpoet_add",
					"default" => "0",
					"description" => __("Enable Mailpoet", "ezfc"),
					"description_long" => __("Enable Mailpoet integration", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"mailpoet_list" => array(
					"id" => 49,
					"name" => "mailpoet_list",
					"default" => "",
					"description" => __("Mailpoet list", "ezfc"),
					"description_long" => __("Email addresses will be added to this list upon form submission.", "ezfc"),
					"type" => "mailpoet_list",
					"value" => ""
				)
			),

			"Form" => array(
				"success_text" => array(
					"id" => 2,
					"name" => "success_text",
					"default" => "Thank you for your submission!",
					"description" => __("Submission message", "ezfc"),
					"description_long" => __("Frontend message after successful submission.", "ezfc"),
					"type" => "editor",
					"value" => ""
				),
				"spam_time" => array(
					"id" => 3,
					"name" => "spam_time",
					"default" => "60",
					"description" => __("Spam protection in seconds", "ezfc"),
					"description_long" => __("Every x seconds, a user (identified by IP address) can add an entry. Default: 60.", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"submission_enabled" => array(
					"id" => 8,
					"name" => "submission_enabled",
					"default" => "1",
					"description" => __("Submission enabled", "ezfc"),
					"description_long" => "",
					"type" => "yesno",
					"value" => ""
				),
				"min_submit_value" => array(
					"id" => 28,
					"name" => "min_submit_value",
					"default" => "0",
					"description" => __("Minimum submission value", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"min_submit_value_text" => array(
					"id" => 29,
					"name" => "min_submit_value_text",
					"default" => "Minimum submission value is %s",
					"description" => __("Minimum submission value text", "ezfc"),
					"description_long" => __("This text will be displayed when the user's total value is less than the minimum value.", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"max_submit_value" => array(
					"id" => 119,
					"name" => "max_submit_value",
					"default" => "",
					"description" => __("Maximum submission value", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"max_submit_value_text" => array(
					"id" => 120,
					"name" => "max_submit_value_text",
					"default" => "Maximum submission value is %s",
					"description" => __("Maximum submission value text", "ezfc"),
					"description_long" => __("This text will be displayed when the user's total value is greater than the maximum value.", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"hide_all_forms" => array(
					"id" => 32,
					"name" => "hide_all_forms",
					"default" => "0",
					"description" => __("Hide all forms on submission", "ezfc"),
					"description_long" => __("If this option is set to 'yes', all forms on the relevant page will be hidden upon submission (useful for product comparisons).", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"clear_selected_values_hidden" => array(
					"id" => 36,
					"name" => "clear_selected_values_hidden",
					"default" => "0",
					"description" => __("Clear selected values when hiding", "ezfc"),
					"description_long" => __("When elements are hidden, clear the selected values (numbers, dropdowns, radio buttons etc.). Please note that preselected values will be cleared as well!", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"reset_enabled" => array(
					"id" => 76,
					"name" => "reset_enabled",
					"default" => array(
						"enabled" => 0,
						"text" => __("Reset", "ezfc")
					),
					"description" => __("Enable reset button", "ezfc"),
					"description_long" => __("The reset button is used to reset the form elements to their initial values.", "ezfc"),
					"type" => "bool_text",
					"value" => "", "hidden" => true
				),
				"reset_after_submission" => array(
					"id" => 89,
					"name" => "reset_after_submission",
					"default" => 0,
					"description" => __("Reset form after submission", "ezfc"),
					"description_long" => __("When the form was submitted successfully, reset the form to its initial values.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"redirect_url" => array(
					"id" => 27,
					"name" => "redirect_url",
					"default" => "",
					"description" => __("Redirect URL", "ezfc"),
					"description_long" => __("Redirect users to this URL upon form submission. Note: URL must start with http://", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"refresh_page_after_submission" => array(
					"id" => 94,
					"name" => "refresh_page_after_submission",
					"default" => "",
					"description" => __("Refresh page after submission", "ezfc"),
					"description_long" => __("The current page will be refreshed after the user has submitted the form. This will not work if you have entered a URL in the 'Redirect URL' option.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"redirect_timer" => array(
					"id" => 77,
					"name" => "redirect_timer",
					"default" => 3,
					"description" => __("Redirect timer", "ezfc"),
					"description_long" => __("Duration after which the user will be redirected when the conditional action 'redirect' is executed (in seconds).", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"redirect_text" => array(
					"id" => 78,
					"name" => "redirect_text",
					"default" => __("You will be redirected in %s seconds...", "ezfc"),
					"description" => __("Redirect text", "ezfc"),
					"description_long" => __("This text will be shown when the user will be redirected (conditional action only). Use %s as the placeholder for the redirect timer.", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"redirect_forward_values" => array(
					"id" => 95,
					"name" => "redirect_forward_values",
					"default" => 0,
					"description" => __("Redirect forward values", "ezfc"),
					"description_long" => __("When redirecting to another page, the submitted values can be forwarded by GET-parameters. The elements' IDs will be used as keys. Please note that you have to enter a redirection URL.", "ezfc"),
					"type" => "yesno",
					"value" => 0, "hidden" => true
				),
				"summary_enabled" => array(
					"id" => 79,
					"name" => "summary_enabled",
					"default" => 0,
					"description" => __("Show summary", "ezfc"),
					"description_long" => __("Show a summary of the selected values at the end of the form.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"summary_text" => array(
					"id" => 80,
					"name" => "summary_text",
					"default" => __("Summary", "ezfc"),
					"description" => __("Summary text", "ezfc"),
					"description_long" => __("This text will be shown above the summary.", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"summary_values" => array(
					"id" => 117,
					"name" => "summary_values",
					"default" => "result_values",
					"description" => __("Summary values", "ezfc"),
					"description_long" => __("If summary is enabled, the plugin will show a table of submitted values. In this option, you can select which summary table should be shown (default: values only).", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"result" => __("Full details (result)", "ezfc"),
						"result_simple" => __("Simple details (result_simple)", "ezfc"),
						"result_values" => __("Values only (result_values)", "ezfc"),
						"result_values_submitted" => __("Submitted values only (result_values_submitted)", "ezfc")
					),
					"value" => "", "hidden" => true
				),
				"summary_button_text" => array(
					"id" => 81,
					"name" => "summary_button_text",
					"default" => __("Check your order", "ezfc"),
					"description" => __("Summary button text", "ezfc"),
					"description_long" => __("Text on the summary submit button.", "ezfc"),
					"type" => "",
					"value" => __("Check your order", "ezfc"), "hidden" => true
				),
				"hard_submit" => array(
					"id" => 103,
					"name" => "hard_submit",
					"default" => 0,
					"description" => __("Hard submit", "ezfc"),
					"description_long" => __("Form submissions will not be processed by the plugin. Useful when you want to process the values through your own functon.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"invoice_method" => array(
					"id" => 121,
					"name" => "invoice_method",
					"default" => "form",
					"description" => __("Invoice ID method", "ezfc"),
					"description_long" => __("Form submission counter will use the 'counter' ID from the form submissions. Global submission counter will use the last submission ID of all forms.", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"form"   => __("Use form submission counter", "ezfc"),
						"global" => __("Use global submission counter", "ezfc")
					),
					"value" => "", "hidden" => true
				),
				"invoice_prefix" => array(
					"id" => 122,
					"name" => "invoice_prefix",
					"default" => "",
					"description" => __("Invoice ID prefix", "ezfc"),
					"description_long" => __("This text will be added in front of the generated invoice ID.", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"invoice_suffix" => array(
					"id" => 123,
					"name" => "invoice_suffix",
					"default" => "",
					"description" => __("Invoice ID suffix", "ezfc"),
					"description_long" => __("This text will be added behind the generated invoice ID.", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				)
			),

			"Layout" => array(
				"show_required_char" => array(
					"id" => 4,
					"name" => "show_required_char",
					"default" => "1",
					"description" => __("Show required char", "ezfc"),
					"description_long" => "",
					"type" => "yesno",
					"value" => ""
				),
				"submit_text" => array(
					"id" => 15,
					"name" => "submit_text",
					"default" => "Submit",
					"description" => __("Submit text", "ezfc"),
					"description_long" => __("Text in submit buttons", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"submit_text_woo" => array(
					"id" => 16,
					"name" => "submit_text_woo",
					"default" => "Add to cart",
					"description" => __("Submit text WooCommerce", "ezfc"),
					"description_long" => __("Text used for WooCommerce submissions", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"submit_button_class" => array(
					"id" => 17,
					"name" => "submit_button_class",
					"default" => "",
					"description" => __("Submit button CSS class", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"theme" => array(
					"id" => 19,
					"name" => "theme",
					"default" => "default",
					"description" => __("Form theme", "ezfc"),
					"description_long" => "",
					"type" => "themes",
					"value" => "", "hidden" => true
				),
				"datepicker_format" => array(
					"id" => 21,
					"name" => "datepicker_format",
					"default" => "mm/dd/yy",
					"description" => __("Datepicker format", "ezfc"),
					"description_long" => __("See jqueryui.com for date formats.", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"timepicker_format" => array(
					"id" => 33,
					"name" => "timepicker_format",
					"default" => "H:i",
					"description" => __("Timepicker format", "ezfc"),
					"description_long" => __("See php.net for time formats", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"form_class" => array(
					"id" => 42,
					"name" => "form_class",
					"default" => "",
					"description" => __("Form class", "ezfc"),
					"description_long" => __("Additional css classes for the form", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"price_position_scroll_top" => array(
					"id" => 43,
					"name" => "price_position_scroll_top",
					"default" => "0",
					"description" => __("Price scroll top position", "ezfc"),
					"description_long" => __("Top position of the price with fixed position. Some designs may overlay a navigation (or something else) on the top of the page. Enter a number without any dimension here.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"counter_duration" => array(
					"id" => 46,
					"name" => "counter_duration",
					"default" => "1000",
					"description" => __("Number counter duration", "ezfc"),
					"description_long" => __("Duration of the number counter to count after each change (in ms). Set to 0 to disable the counter.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"counter_interval" => array(
					"id" => 47,
					"name" => "counter_interval",
					"default" => "30",
					"description" => __("Number counter interval", "ezfc"),
					"description_long" => __("Interval rate at which the counter updates the numbers (in ms).", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"disable_error_scroll" => array(
					"id" => 96,
					"name" => "disable_error_scroll",
					"default" => 0,
					"description" => __("Disable scroll to error element", "ezfc"),
					"description_long" => __("Depending on your theme, scrolling to the element which caused an error message may not work correctly. If this option is enabled, scrolling will be disabled.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"scroll_to_success_message" => array(
					"id" => 116,
					"name" => "scroll_to_success_message",
					"default" => 0,
					"description" => __("Scroll to success message", "ezfc"),
					"description_long" => __("Scroll to success message after the form was submitted.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"grid_12" => array(
					"id" => 97,
					"name" => "grid_12",
					"default" => 0,
					"description" => __("Use 12 columns grid", "ezfc"),
					"description_long" => __("Forms are divided into 6 columns by default. Enable this option to use a 12 column grid (experimental).", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"form_center" => array(
					"id" => 105,
					"name" => "form_center",
					"default" => 0,
					"description" => __("Center form", "ezfc"),
					"description_long" => __("All elements will be centered.", "ezfc"),
					"type" => "yesno",
					"value" => ""
				)
			),

			"Price" => array(
				"currency" => array(
					"id" => 5,
					"name" => "currency",
					"default" => "$",
					"description" => __("Currency", "ezfc"),
					"description_long" => "",
					"type" => "",
					"value" => ""
				),
				"currency_position" => array(
					"id" => 20,
					"name" => "currency_position",
					"default" => "0",
					"description" => __("Currency position", "ezfc"),
					"description_long" => "",
					"type" => "select,Before|After",
					"value" => ""
				),
				"price_format" => array(
					"id" => 34,
					"name" => "price_format",
					"default" => "",
					"description" => __("Price format", "ezfc"),
					"description_long" => __("If left blank, the global price format will be used. See numeraljs.com for syntax documentation", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"price_label" => array(
					"id" => 6,
					"name" => "price_label",
					"default" => "Price",
					"description" => __("Price label", "ezfc"),
					"description_long" => __("Calculated field label (default: Price)", "ezfc"),
					"type" => "",
					"value" => ""
				),
				"show_element_price" => array(
					"id" => 7,
					"name" => "show_element_price",
					"default" => "0",
					"description" => __("Show element prices", "ezfc"),
					"description_long" => "",
					"type" => "yesno",
					"value" => ""
				),
				"show_price_position" => array(
					"id" => 9,
					"name" => "show_price_position",
					"default" => "1",
					"description" => __("Total price position", "ezfc"),
					"description_long" => __("Price can be displayed above or below the form (or both) as well as fixed (scrolls with window)", "ezfc"),
					"type" => "select,Hidden|Below|Above|Below and above|Fixed left|Fixed right",
					"value" => ""
				),
				"email_total_price_text" => array(
					"id" => 92,
					"name" => "email_total_price_text",
					"default" => "",
					"description" => __("Total price text", "ezfc"),
					"description_long" => __("This text will be shown before the total price in emails.", "ezfc"),
					"type" => "",
					"value" => __("Total", "ezfc")
				),
				"email_show_total_price" => array(
					"id" => 18,
					"name" => "email_show_total_price",
					"default" => "1",
					"description" => __("Show total price in email", "ezfc"),
					"description_long" => __("Whether the total price of a submission should be shown or not. (Disable this option when you don't have a calculation form)", "ezfc"),
					"type" => "yesno",
					"value" => ""
				),
				"price_show_request" => array(
					"id" => 38,
					"name" => "price_show_request",
					"default" => "0",
					"description" => __("Request price", "ezfc"),
					"description_long" => __("Enable this option if you do not want to show the price immediately.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"price_show_request_text" => array(
					"id" => 39,
					"name" => "price_show_request_text",
					"default" => "Request price",
					"description" => __("Request price text", "ezfc"),
					"description_long" => __("Text in request price button", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"price_show_request_before" => array(
					"id" => 40,
					"name" => "price_show_request_before",
					"default" => "-",
					"description" => __("Price text before request", "ezfc"),
					"description_long" => "",
					"type" => "input",
					"value" => "", "hidden" => true
				)
			),

			"PayPal" => array(
				"pp_enabled" => array(
					"id" => 22,
					"name" => "pp_enabled",
					"default" => "0",
					"description" => __("Force PayPal payment", "ezfc"),
					"description_long" => __("Enabling this option will force the user to use PayPal. If you want to let the user choose how to pay, disable this option and add the Payment element (do not change the paypal value).", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"pp_submittext" => array(
					"id" => 23,
					"name" => "pp_submittext",
					"default" => "Check out with PayPal",
					"description" => __("Submit text PayPal", "ezfc"),
					"description_long" => __("Text used for PayPal checkouts", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"pp_paid_text" => array(
					"id" => 26,
					"name" => "pp_paid_text",
					"default" => "We have received your payment, thank you!",
					"description" => __("PayPal payment success text", "ezfc"),
					"description_long" => __("This text will be displayed when the user has successfully paid and returns to the site.", "ezfc"),
					"type" => "editor",
					"value" => "", "hidden" => true
				),
				"pp_item_name" => array(
					"id" => 44,
					"name" => "pp_item_name",
					"default" => "",
					"description" => __("Item name", "ezfc"),
					"description_long" => __("This text will be displayed as item name on the PayPal checkout page.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"pp_item_desc" => array(
					"id" => 45,
					"name" => "pp_item_desc",
					"default" => "",
					"description" => __("Item description", "ezfc"),
					"description_long" => __("This text will be displayed as description below the item name on the PayPal checkout page.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
			),

			"PDF" => array(
				"pdf_enable" => array(
					"id" => 112,
					"name" => "pdf_enable",
					"description" => __("Enable PDF integration", "ezfc"),
					"description_long" => __("When the form is submitted, a PDF file will be created with the content from 'PDF Text'.", "ezfc"),
					"type" => "yesno",
					"default" => 0,
					"value" => "", "hidden" => true
				),
				"pdf_send_to_admin" => array(
					"id" => 113,
					"name" => "pdf_send_to_admin",
					"description" => __("Send PDF to admin", "ezfc"),
					"description_long" => __("The created PDF file will be sent to all recipients as email attachment.", "ezfc"),
					"type" => "yesno",
					"default" => 1,
					"value" => "", "hidden" => true
				),
				"pdf_send_to_customer" => array(
					"id" => 114,
					"name" => "pdf_send_to_customer",
					"description" => __("Send PDF to customer", "ezfc"),
					"description_long" => __("The created PDF file will be sent to the customer as email attachment.", "ezfc"),
					"type" => "yesno",
					"default" => 1,
					"value" => "", "hidden" => true
				),
				"pdf_text" => array(
					"id" => 115,
					"name" => "pdf_text",
					"default" => "{{result_values}}",
					"description" => __("PDF text", "ezfc"),
					"description_long" => __("Email text sent to the user. Use {{result}} for submission details, {{result_simple}} for no calculation details, {{result_values}} for values only. Use {{Elementname}} for single element values (where Elementname is the internal name of the element). Use {{files}} for attached files (you should not send these to the customer for security reasons).", "ezfc") . "<br><a href='http://ez-form-calculator.ezplugins.de/email-placeholder-list/' target='_blank'>" . __("View all placeholders", "ezfc") . "</a>",
					"type" => "editor",
					"value" => "", "hidden" => true
				)
			),

			"Steps" => array(
				"step_indicator" => array(
					"id" => 100,
					"name" => "step_indicator",
					"default" => 0,
					"description" => __("Show step indicator", "ezfc"),
					"description_long" => "",
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"step_indicator_text" => array(
					"id" => 101,
					"name" => "step_indicator_text",
					"default" => __("Step %d", "ezfc"),
					"description" => __("Step indicator text", "ezfc"),
					"description_long" => __("Text on step indicator. The placeholder %d will be replaced with the step numbers.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				),
				"step_use_titles" => array(
					"id" => 102,
					"name" => "step_use_titles",
					"default" => 0,
					"description" => __("Use step titles", "ezfc"),
					"description_long" => __("Use titles in step-start elements instead of step indicator text.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"step_indicator_start" => array(
					"id" => 118,
					"name" => "step_indicator_start",
					"default" => 1,
					"description" => __("Step indicator start", "ezfc"),
					"description_long" => __("Step indicator will be shown with the step value of this option. Example: if the step indicator should be shown after the second step, the value of this option must be 3.", "ezfc"),
					"type" => "input",
					"value" => 1, "hidden" => true
				),
				"verify_steps" => array(
					"id" => 104,
					"name" => "verify_steps",
					"default" => 1,
					"description" => __("Verify steps", "ezfc"),
					"description_long" => __("Verify required element values after each step.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				)
			),

			"Styling" => array(
				"load_custom_styling" => array(
					"id" => 50,
					"name" => "load_custom_styling",
					"description" => __("Load custom styling", "ezfc"),
					"description_long" => __("Only enable this option if you want to use the styling below.", "ezfc"),
					"type" => "yesno",
					"default" => 0,
					"value" => ""
				),
				// will be generated automatically
				"css_custom_styling" => array(
					"id" => 51,
					"name" => "css_custom_styling",
					"description" => "",
					"description_long" => "",
					"type" => "hidden",
					"default" => "",
					"value" => ""
				),
				"css_font" => array(
					"id" => 58,
					"name" => "css_font",
					"description" => __("Font", "ezfc"),
					"type" => "font",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "font-family"
					),
					"value" => ""
				),
				"css_font_size" => array(
					"id" => 59,
					"name" => "css_font_size",
					"description" => __("Font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "font-size"
					),
					"value" => ""
				),
				"css_background_color" => array(
					"id" => 53,
					"name" => "css_background_color",
					"description" => __("Background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_background_image" => array(
					"id" => 52,
					"name" => "css_background_image",
					"description" => __("Background image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-image",
						"is_url"   => true
					),
					"value" => ""
				),
				"css_background_attachment" => array(
					"id" => 107,
					"name" => "css_background_attachment",
					"description" => __("Background attachment", "ezfc"),
					"type" => "input",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-attachment"
					),
					"value" => ""
				),
				"css_background_repeat" => array(
					"id" => 108,
					"name" => "css_background_repeat",
					"description" => __("Background repeat", "ezfc"),
					"type" => "dropdown",
					"default" => "no-repeat",
					"options" => array(
						"no-repeat" => "no-repeat",
						"repeat" => "repeat",
						"repeat-x" => "repeat-x",
						"repeat-y" => "repeat-y"
					),
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-repeat"
					),
					"value" => ""
				),
				"css_background_size" => array(
					"id" => 106,
					"name" => "css_background_size",
					"description" => __("Background size", "ezfc"),
					"type" => "input",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "background-size"
					),
					"default" => "contain",
					"value" => ""
				),
				"css_text_color" => array(
					"id" => 54,
					"name" => "css_text_color",
					"description" => __("Text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-form,.ezfc-element-wrapper-subtotal span",
						"property" => "color"
					),
					"value" => ""
				),
				"css_input_background_color" => array(
					"id" => 55,
					"name" => "css_input_background_color",
					"description" => __("Input background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_input_text_color" => array(
					"id" => 56,
					"name" => "css_input_text_color",
					"description" => __("Input text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "color"
					),
					"value" => ""
				),
				"css_input_border" => array(
					"id" => 57,
					"name" => "css_input_border",
					"description" => __("Input border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "border"
					),
					"value" => ""
				),
				"css_input_padding" => array(
					"id" => 71,
					"name" => "css_input_padding",
					"description" => __("Input padding", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-element-input,.ezfc-element-numbers,.ezfc-element-textarea,.ezfc-element-select",
						"property" => "padding"
					),
					"value" => ""
				),
				// submit button
				"css_submit_image" => array(
					"id" => 60,
					"name" => "css_submit_image",
					"description" => __("Submit button image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "background-image",
						"is_url"   => true,
						"add"      => array(
							"background-repeat" => "no-repeat",
							"background-size" => "contain"
						),
						"hover_override" => true
					),
					"value" => ""
				),
				"css_submit_background" => array(
					"id" => 61,
					"name" => "css_submit_background",
					"description" => __("Submit button background", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_submit_text_color" => array(
					"id" => 62,
					"name" => "css_submit_text_color",
					"description" => __("Submit button text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "color"
					),
					"value" => ""
				),
				"css_submit_border" => array(
					"id" => 63,
					"name" => "css_submit_border",
					"description" => __("Submit button border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-element-submit",
						"property" => "border"
					),
					"value" => ""
				),
				// step styling
				"css_step_button_image" => array(
					"id" => 64,
					"name" => "css_step_button_image",
					"description" => __("Step button image", "ezfc"),
					"type" => "image",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "background-image",
						"is_url"   => true,
						"add"      => array(
							"background-repeat" => "no-repeat",
							"background-size" => "contain"
						),
						"hover_override" => true
					),
					"value" => ""
				),
				"css_step_button_background" => array(
					"id" => 65,
					"name" => "css_step_button_background",
					"description" => __("Step button background", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_step_button_text_color" => array(
					"id" => 66,
					"name" => "css_step_button_text_color",
					"description" => __("Step button text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "color"
					),
					"value" => ""
				),
				"css_step_button_border" => array(
					"id" => 67,
					"name" => "css_step_button_border",
					"description" => __("Step button border", "ezfc"),
					"description_long" => __("Color, size (px), style, border-radius (px)", "ezfc"),
					"type" => "border",
					"separator" => " ",
					"css" => array(
						"selector" => ".ezfc-step-button",
						"property" => "border"
					),
					"value" => ""
				),
				"css_title_font_size" => array(
					"id" => 68,
					"name" => "css_title_font_size",
					"description" => __("Step title font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-step-title",
						"property" => "font-size"
					),
					"value" => ""
				),
				// fixed price
				"css_fixed_price_font_size" => array(
					"id" => 72,
					"name" => "css_fixed_price_font_size",
					"description" => __("Fixed price font size", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "font-size"
					),
					"value" => ""
				),
				"css_fixed_price_background_color" => array(
					"id" => 73,
					"name" => "css_fixed_price_background_color",
					"description" => __("Fixed price background color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_fixed_price_text_color" => array(
					"id" => 74,
					"name" => "css_fixed_price_text_color",
					"description" => __("Fixed price color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-fixed-price",
						"property" => "color"
					),
					"value" => ""
				),
				// summary table
				"css_summary_width" => array(
					"id" => 82,
					"name" => "css_summary_width",
					"description" => __("Summary table width", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-summary-table",
						"property" => "width"
					),
					"value" => ""
				),
				"css_summary_bgcolor_even" => array(
					"id" => 83,
					"name" => "css_summary_bgcolor_even",
					"description" => __("Summary table even row", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-summary-table tr:nth-child(even)",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_summary_bgcolor_odd" => array(
					"id" => 84,
					"name" => "css_summary_bgcolor_odd",
					"description" => __("Summary table odd row", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-summary-table tr:nth-child(odd)",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_summary_text_color" => array(
					"id" => 85,
					"name" => "css_summary_text_color",
					"description" => __("Summary table text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-summary-table",
						"property" => "color"
					),
					"value" => ""
				),
				"css_summary_total_background" => array(
					"id" => 86,
					"name" => "css_summary_total_background",
					"description" => __("Summary total row color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-summary-table .ezfc-summary-table-total",
						"property" => "background-color"
					),
					"value" => ""
				),
				"css_summary_total_color" => array(
					"id" => 87,
					"name" => "css_summary_total_color",
					"description" => __("Summary total text color", "ezfc"),
					"type" => "colorpicker",
					"css" => array(
						"selector" => ".ezfc-summary-table .ezfc-summary-table-total",
						"property" => "color"
					),
					"value" => ""
				),
				"css_summary_table_padding" => array(
					"id" => 88,
					"name" => "css_summary_table_padding",
					"description" => __("Summary table padding", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-summary-table td",
						"property" => "padding"
					),
					"value" => ""
				),
				// other
				"css_form_padding" => array(
					"id" => 69,
					"name" => "css_form_padding",
					"description" => __("Form padding", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "padding"
					),
					"value" => ""
				),
				"css_form_width" => array(
					"id" => 70,
					"name" => "css_form_width",
					"description" => __("Form width", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "width"
					),
					"value" => ""
				),
				"css_form_height" => array(
					"id" => 109,
					"name" => "css_form_height",
					"description" => __("Form height", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "height"
					),
					"value" => ""
				),
				"css_overflow_x" => array(
					"id" => 110,
					"name" => "css_overflow_x",
					"description" => __("Overflow-x", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"auto" => "auto",
						"visible" => "visible",
						"hidden" => "hidden",
						"scroll" => "scroll",
						"inherit" => "inherit",
						"initial" => "initial",
						"unset" => "unset",
					),
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "overflow-x"
					),
					"default" => "auto",
					"value" => ""
				),
				"css_overflow_y" => array(
					"id" => 111,
					"name" => "css_overflow_y",
					"description" => __("Overflow-y", "ezfc"),
					"type" => "dropdown",
					"options" => array(
						"auto" => "auto",
						"visible" => "visible",
						"hidden" => "hidden",
						"scroll" => "scroll",
						"inherit" => "inherit",
						"initial" => "initial",
						"unset" => "unset",
					),
					"css" => array(
						"selector" => ".ezfc-form",
						"property" => "overflow-y"
					),
					"default" => "auto",
					"value" => ""
				),
				"css_vertical_spacing" => array(
					"id" => 93,
					"name" => "css_vertical_spacing",
					"description" => __("Vertical spacing", "ezfc"),
					"type" => "dimensions",
					"css" => array(
						"selector" => ".ezfc-element-wrapper-spacer",
						"property" => "height"
					),
					"value" => ""
				)
			),
			
			"WooCommerce" => array(
				"woo_product_id" => array(
					"id" => 35,
					"name" => "woo_product_id",
					"default" => "",
					"description" => __("WooCommerce Product ID", "ezfc"),
					"description_long" => __("WooCommerce product ID for this form", "ezfc"),
					"type" => "",
					"value" => "", "hidden" => true
				),
				"woo_disable_form" => array(
					"id" => 37,
					"name" => "woo_disable_form",
					"default" => "0",
					"description" => __("Disable WooCommerce for this form", "ezfc"),
					"description_long" => __("In case you don't want to add products from this form (e.g. use it as a contact form), you can set this to 'Yes'.", "ezfc"),
					"type" => "yesno",
					"value" => "", "hidden" => true
				),
				"woo_categories" => array(
					"id" => 90,
					"name" => "woo_categories",
					"default" => "",
					"description" => __("Categories", "ezfc"),
					"description_long" => __("Add form to these product categories only. Separate categories by comma. <strong>Use category slug, not name!</strong>. Leave blank to add the form to all categories.", "ezfc"),
					"type" => "input",
					"value" => "", "hidden" => true
				)
			)
		);

		if ($flat) {
			$settings = self::flatten($settings);
		}

		return $settings;
	}

	/**
		prepare form elements for export, e.g. replace target IDs with positions
	**/
	static function form_elements_prepare_export($form_elements = array()) {
		// replace calculate positions with target ids
		$template_elements_indexed = self::array_index_key($form_elements, "id");

		foreach ($template_elements_indexed as $id => &$element) {
			$element->id = $element->position;

			if (!property_exists($element, "data")) continue;

			$element_data = json_decode($element->data);

			// calculate elements
			if (property_exists($element_data, "calculate") &&
				!empty($element_data->calculate) &&
				count($element_data->calculate) > 0) {

				// convert object to array
				if (!is_array($element_data->calculate)) {
					$element_data->calculate = (array) $element_data->calculate;
				}

				foreach ($element_data->calculate as &$calc_value) {
					if ($calc_value->target == 0) continue;

					if (!isset($template_elements_indexed[$calc_value->target])) continue;

					$target_element = $template_elements_indexed[$calc_value->target];
					$calc_id = $target_element->position;

					$calc_value->target = $calc_id;
				}
			}

			// conditional elements
			if (property_exists($element_data, "conditional") &&
				!empty($element_data->conditional) &&
				count($element_data->conditional) > 0) {

				// convert object to array
				if (!is_array($element_data->conditional)) {
					$element_data->conditional = (array) $element_data->conditional;
				}

				foreach ($element_data->conditional as &$cond_value) {
					if ($cond_value->target == 0) continue;

					if (!isset($template_elements_indexed[$cond_value->target])) continue;

					$target_element = $template_elements_indexed[$cond_value->target];
					$cond_id = $target_element->position;

					$cond_value->target = $cond_id;
				}
			}

			// set elements
			if (property_exists($element_data, "set") &&
				!empty($element_data->set) &&
				count($element_data->set) > 0) {
				// convert object to array
				if (!is_array($element_data->set)) {
					$element_data->set = (array) $element_data->set;
				}

				foreach ($element_data->set as &$set_element) {
					if ($set_element->target == 0) continue;

					if (!isset($template_elements_indexed[$set_element->target])) continue;

					$target_element = $template_elements_indexed[$set_element->target];
					$cond_id = $target_element->position;

					$set_element->target = $cond_id;
				}
			}

			// groups
			if (!empty($element_data->group_id)) {
				if (!isset($template_elements_indexed[$element_data->group_id])) continue;

				$target_element = $template_elements_indexed[$element_data->group_id];
				$target_id      = $target_element->position;

				$element_data->group_id = $target_id;
			}

			$element->data = json_encode($element_data);
		}

		return $template_elements_indexed;
	}

	static function flatten($settings) {
		$settings_flat = array();

		foreach ($settings as $cat => $settings_cat) {
			foreach ($settings_cat as $name => $setting) {
				$tmp_id = "";
				
				if (is_array($setting)) {
					if (!empty($setting["id"])) $tmp_id = $setting["id"];
					else if (!empty($setting["name"])) $tmp_id = $setting["name"];
					else $tmp_id = $name;
				}
				else if (is_object($setting)) {
					if (!empty($setting->id)) $tmp_id = $setting->id;
					else if (!empty($setting->name)) $tmp_id = $setting->name;
					else $tmp_id = $name;
				}

				$settings_flat[$tmp_id] = $setting;
			}
		}

		return $settings_flat;
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
		validate options
	**/
	public static function validate_option($setting = array(), $value = "", $id = 0) {
		// invalid function call
		if (!is_array($setting)) wp_die(__("Function validate_option was called incorrectly.", "ezfc"));
		// do not mess with arrays
		if (is_array($value)) return $value;

		// set to input by default
		$setting["type"] = empty($setting["type"]) ? "input" : $setting["type"];

		switch ($setting["type"]) {
			case "yesno":
				$value = empty($value) ? 0 : 1;
			break;

			case "email":
				if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
					return self::return_option_error(__("Please enter a valid email address.", "ezfc"), $id);
				}
			break;

			default:
				// no action
				$value = stripslashes($value);
			break;
		}

		return $value;
	}

	public static function return_option_error($msg, $id = 0) {
		return Ezfc_Functions::send_message("error", $msg, $id);
	}
}