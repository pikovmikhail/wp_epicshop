jQuery(document).ready(function($) {
	if (typeof EZFC_LOADED !== "undefined") return;
	EZFC_LOADED = true;

	/**
		global functions for custom calculation codes
	**/
	ezfc_functions = {
		calculate_price: function(form_id) {
			var $form = $(".ezfc-form[data-id='" + form_id + "']");
			return calculate_price($form)
		},
		get_value_from: function(id, is_text) {
			return ezfc_get_value_from_element(null, id, is_text);
		}
	};

	// listeners for external values on change
	var external_listeners = [];
	var ezfc_price_old_global = [];

	numeral.language("ezfc", {
		delimiters: {
			decimal:   ezfc_vars.price_format_dec_point,
			thousands: ezfc_vars.price_format_dec_thousand
		},
		abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
	});
	numeral.language("ezfc");

	var defaultFormat = ezfc_vars.price_format ? ezfc_vars.price_format : "0,0[.]00";
	numeral.defaultFormat(defaultFormat);

	// datepicker language
	$.datepicker.setDefaults($.datepicker.regional[ezfc_vars.datepicker_language]);

	// image option listener
	$(".ezfc-element-option-image").click(function() {
		// radio option image listener
		if ($(this).hasClass("ezfc-element-radio-image")) {
			var $parent_container = $(this).parents(".ezfc-element-wrapper-radio");

			// remove selected class from images
			$parent_container.find(".ezfc-selected").removeClass("ezfc-selected");
			// "uncheck"
			$parent_container.find(".ezfc-element-radio-input").prop("checked", false).trigger("change");
			// check radio input
			$(this).siblings(".ezfc-element-radio-input").prop("checked", true).trigger("change");
			// add selected class
			$(this).addClass("ezfc-selected");
		}
		else if ($(this).hasClass("ezfc-element-checkbox-image")) {
			var checkbox_el = $(this).siblings(".ezfc-element-checkbox-input");
			
			// uncheck it -> remove selected class
			if (checkbox_el.prop("checked")) {
				checkbox_el.prop("checked", false).trigger("change");
				$(this).removeClass("ezfc-selected");
			}
			// check it
			else {
				checkbox_el.prop("checked", true).trigger("change");
				$(this).addClass("ezfc-selected");
			}
		}
	});

	// init vars / events for each form
	var ezfc_form_vars = [];
	// init form functions
	var ezfc_form_functions = [];
	$(".ezfc-form").each(function() {
		ezfc_form_init(this);
	});

	$(".ezfc-element-fileupload").each(function(i, el) {
		var parent   = $(this).parents(".ezfc-element");
		var btn      = $(parent).find(".ezfc-upload-button");

		// build form data
		var form     = $(this).parents("form.ezfc-form");
		var form_id  = form.find("input[name='id']").val();
		var ref_id   = form.find("input[name='ref_id']").val();

		var formData = {
			action: "ezfc_frontend_fileupload",
			data: "id=" + form_id + "&ref_id=" + ref_id
		};

		$(this).fileupload({
			formData: formData,
			dataType: 'json',
		    add: function (e, data) {
		    	$(parent).find(".ezfc-bar").css("width", 0);
		    	$(parent).find(".progress").addClass("active");
		    	$(parent).find(".ezfc-fileupload-message").text("");

	            btn.click(function() {
	            	if ($(el).val() == "") return false;

	                data.submit();
	                $(btn).attr("disabled", "disabled");

	                e.preventDefault();
	                return false;
	            });
	        },
	        done: function (e, data) {
	        	if (data.result.error) {
	        		$(btn).removeAttr("disabled");
	        		$(parent).find(".ezfc-fileupload-message").text(data.result.error);
	        		$(parent).find(".ezfc-bar").css("width", 0);

	        		return false;
	        	}

	        	if ($(this).attr("multiple")) {
	        		$(this).val("");
	        		$(btn).removeAttr("disabled");
	        	}

	        	$(parent).find(".progress").removeClass("active");
	        	$(parent).find(".ezfc-fileupload-message").text(ezfc_vars.upload_success);
	        },
	        progressall: function (e, data) {
		        var progress = parseInt(data.loaded / data.total * 100, 10);
		        $(parent).find(".ezfc-bar").css("width", progress + "%");
		    },
		    replaceFileInput: false,
	        url: ezfc_vars.ajaxurl
		});
	});

	$(".ezfc-overview").dialog({
		autoOpen: false,
		modal: true
	});

	/**
		ui events
	**/
	// form has changed -> recalc price
	$(".ezfc-form input, .ezfc-form select").on("change keyup", function() {
		var form = $(this).parents(".ezfc-form");
		ezfc_form_change(form);
	});

	// number-slider
	$(".ezfc-slider").each(function(i, el) {
		var $target = $(this);
		var $slider_element = $(el).siblings(".ezfc-slider-element");

		var slider_object = $slider_element.slider({
			min:   $target.data("min") || 0,
			max:   $target.data("max") || 100,
			step:  $target.data("stepsslider") || 1,
			value: $target.val() || 0,
			slide: function(ev, ui) {
				// change value before trigger
				var value = ezfc_normalize_value(ui.value, true);
				$target.val(value);
				$target.trigger("change");
			}
		});

		$target.on("change keyup", function() {
			slider_object.slider("value", $target.val());
		});

		if ($target.hasClass("ezfc-pips")) {
			$slider_element.slider("pips", {
				rest: "label",
				step: $target.data("stepspips") || 1
			});
		}

		// slider compatibility for mobile devices
		$target.draggable();
	});

	// number-spinner
	$(".ezfc-spinner").each(function(i, el) {
		var $target = $(this);

		$target.spinner({
			min:  $target.data("min") || 0,
			max:  $target.data("max") || 100,
			step: $target.data("stepsspinner") || 1,
			change: function(ev, ui) {
				$target.trigger("change");
			},
			spin: function(ev, ui) {
				// normalize
				var value = ezfc_normalize_value(ui.value, true);
				// change value before trigger
				$target.val(value);
				$target.trigger("change");
			},
			start: function(ev, ui) {
				// normalize
				var value = ezfc_normalize_value($target.val());
				$target.val(value);
			},
			stop: function(ev, ui) {
				// normalize
				var value = ezfc_normalize_value($target.val(), true);
				$target.val(value);
			}
		});
	});

	// steps
	$(".ezfc-step-button").on("click", function() {
		var form_wrapper = $(this).parents(".ezfc-form");
		var current_step = parseInt(form_wrapper.find(".ezfc-step-active").data("step"));
		var next_step    = current_step + ($(this).hasClass("ezfc-step-next") ? 1 : -1);
		var verify_step  = $(this).hasClass("ezfc-step-next") ? 1 : 0;

		ezfc_set_step(form_wrapper, next_step, verify_step);
		return false;
	});
	// steps indicator
	$(".ezfc-step-indicator-item-active").on("click", function() {
		var $form = $(this).closest(".ezfc-form");
		var step = parseInt($(this).data("step"));

		ezfc_set_step($form, step, 0);
		return false;
	});

	// payment option text switch
	$(".ezfc-element-wrapper-payment input").on("change", function() {
		var form_id   = $(this).parents(".ezfc-form").data("id");

		// submit text will be toggled by ezfc_price_request_toggle()
		if (ezfc_form_vars[form_id].price_show_request == 1 || ezfc_form_vars[form_id].summary_enabled) return;

		var is_paypal     = $(this).data("value")=="paypal";
		var submit_text   = is_paypal ? ezfc_form_vars[form_id].submit_text.paypal : ezfc_form_vars[form_id].submit_text.default;
		var submit_button = $(this).parents(".ezfc-form").find(".ezfc-element-submit").val(submit_text);
	});

	// fixed price
	$(window).scroll(function() {
		ezfc_scroll();
	});
	ezfc_scroll();

	$(".ezfc-form").submit(function(e) {
		var form = $(this);
		var id   = form.data("id");

		if (ezfc_form_vars[id].hard_submit == 1) {
			return true;
		}

		ezfc_form_submit(form, -1);

		e.preventDefault();
		return false;
	});

	// reset button
	$(".ezfc-reset").click(function() {
		var $form = $(this).parents(".ezfc-form");
		ezfc_reset_form($form);

		return false;
	});

	// collapsible groups
	$(".ezfc-collapse-title-wrapper").on("click", function() {
		var $group = $(this).closest(".ezfc-element-wrapper-group").find("> .ezfc-group-elements");
		$group.slideToggle(500);

		var icon_class_open   = "fa-chevron-circle-down";
		var icon_class_closed = "fa-chevron-circle-right";

		var $toggle_icon = $(this).find(".ezfc-collapse-icon i");
		if ($toggle_icon.hasClass(icon_class_open)) {
			$toggle_icon.removeClass(icon_class_open).addClass(icon_class_closed);
		}
		else {
			$toggle_icon.removeClass(icon_class_closed).addClass(icon_class_open);
		}
	});

	/**
		init form
	**/
	function ezfc_form_init(form_dom) {
		var $form   = $(form_dom);
		var form_id = $form.data("id");
		
		ezfc_form_vars[form_id] = $form.data("vars");
		if (typeof ezfc_form_vars[form_id] !== "object") {
			ezfc_form_vars[form_id] = $.parseJSON($form.data("vars"));
		}

		// init listener for each form
		external_listeners[form_id] = [];

		// set request price text
		if (ezfc_form_vars[form_id].price_show_request == 1) {
			ezfc_price_request_toggle(form_id, false);
		}

		// init datepicker
		$form.find(".ezfc-element-datepicker").each(function() {
			var $element = $(this);

			var el_settings = {};
			if ($element.data("settings")) {
				el_settings = $element.data("settings");
			}

			$element.datepicker({
				dateFormat:     ezfc_form_vars[form_id].datepicker_format,
				minDate:        el_settings.minDate ? el_settings.minDate : "",
				maxDate:        el_settings.maxDate ? el_settings.maxDate : "",
				numberOfMonths: el_settings.numberOfMonths ? parseInt(el_settings.numberOfMonths) : 1,
				showAnim:       el_settings.showAnim ? el_settings.showAnim : "fadeIn",
				showWeek:       el_settings.showWeek=="1" ? el_settings.showWeek : false,
      			firstDay:       el_settings.firstDay ? el_settings.firstDay : false
			});
		});

		// init timepicker
		$form.find(".ezfc-element-timepicker").each(function() {
			var $element = $(this);

			var el_settings = {};
			if ($element.data("settings")) {
				el_settings = $element.data("settings");
			}

			$element.timepicker({
				minTime:    el_settings.minTime ? el_settings.minTime : null,
				maxTime:    el_settings.maxTime ? el_settings.maxTime : null,
				step:       el_settings.step ? el_settings.step : 30,
				timeFormat: el_settings.format ? el_settings.format : ezfc_form_vars[form_id].timepicker_format
			});
		});

		// date range setup
		$form.find(".ezfc-element-daterange").each(function() {
			var $element    = $(this);
			var date_format = ezfc_form_vars[form_id].datepicker_format;

			// from
			if ($element.hasClass("ezfc-element-daterange-from")) {
				$element.datepicker({
					dateFormat: date_format,
					minDate: $element.data("mindate"),
					maxDate: $element.data("maxdate"),
					onSelect: function(selectedDate) {
						var minDays = $element.data("mindays") || 0;
						var minDate = $.datepicker.parseDate(date_format, selectedDate);
						minDate.setDate(minDate.getDate() + minDays);

						$element.siblings(".ezfc-element-daterange-to").datepicker("option", "minDate", minDate);
						$element.trigger("change");
					}
				});
			}
			// to
			else {
				$element.datepicker({
					dateFormat: ezfc_form_vars[form_id].datepicker_format,
					minDate: $element.data("mindate"),
					maxDate: $element.data("maxdate"),
					onSelect: function(selectedDate) {
						var minDays = $element.data("mindays") || 0;
						var maxDate = $.datepicker.parseDate(date_format, selectedDate);
						maxDate.setDate(maxDate.getDate() - minDays);

						$element.siblings(".ezfc-element-daterange-from").datepicker("option", "maxDate", maxDate);
						$element.trigger("change");
					}
				});
			}
		});

		// colorpicker
		$form.find(".ezfc-element-colorpicker").each(function() {
			var $element = $(this);
			var input    = $element.parents(".ezfc-element").find(".ezfc-element-colorpicker-input");

			var colorpicker = $element.colorpicker({
				container: $element
			}).on("changeColor.colorpicker", function(ev) {
				$element.css("background-color", ev.color.toHex());
				input.val(ev.color.toHex());
			});

			$(input).on("click focus", function() {
				colorpicker.colorpicker("show");
			}).on("change", function() {
				colorpicker.colorpicker("setValue", $form.val());
			});
		});

		// if steps are used, move the submission button + summary table to the last step
		var steps = $form.find(".ezfc-step");
		if (steps.length > 0) {
			var last_step = steps.last();
			
			$form.find(".ezfc-summary-wrapper").appendTo(last_step);
			$form.find(".ezfc-submit-wrapper").appendTo(last_step).addClass("ezfc-submit-step");

			// prevent enter step in last step
			ezfc_prevent_enter_step_listener(last_step.find("input"), $form);
		}

		// put elements into groups
		$(".ezfc-custom-element[data-group]").each(function() {
			var $element = $(this);

			var group_id = $element.data("group");
			var $group_element = $("#ezfc_element-" + group_id);

			if ($group_element.data("element") != "group") return;

			// append element to group
			if ($group_element.length > 0) {
				var $group_element_wrapper = $group_element.find("> .ezfc-group-elements");
				$element.appendTo($group_element_wrapper);
			}
		});

		// set price
		ezfc_set_price($form);

		// hide woocommerce price+button
		if (ezfc_form_vars[form_id].use_woocommerce) {
			var elements_to_hide = ".woocommerce form.cart, .woocommerce .price";

			$(elements_to_hide).hide();
		}

		// step indicator start added by 1 so it becomes more readable
		var step_indicator_start = parseInt(ezfc_form_vars[form_id].step_indicator_start) + 1;
		if (step_indicator_start > 1) {
			$form.find(".ezfc-step-indicator").hide();
		}

		// init debug info
		if (ezfc_vars.debug_mode == "2") {
			$form.append("<button id='ezfc-show-all-elements'>Show/hide elements</button>");

			$("#ezfc-show-all-elements").click(function() {
				if ($form.hasClass("ezfc-debug-visible")) {
					$form.removeClass("ezfc-debug-visible");
					$form.find(".ezfc-tmp-visible").removeClass("ezfc-tmp-visible").hide();
				}
				else {
					$form.addClass("ezfc-debug-visible");
					$form.find(".ezfc-hidden").addClass("ezfc-tmp-visible").show().css("display", "inline-block");
				}

				return false;
			});
		}
	}

	// form has changed
	function ezfc_form_change(form) {
		var form_id = $(form).data("id");

		// clear hidden values
		ezfc_clear_hidden_values(form);

		// form has changed -> reset price + summary
		ezfc_form_vars[form_id].price_requested = 0;
		ezfc_form_vars[form_id].summary_shown = 0;

		$(form).find(".ezfc-summary-wrapper").fadeOut();
		
		// do not calculate when price request is enabled
		if (ezfc_form_vars[form_id].price_show_request == 1) {
			ezfc_price_request_toggle(form_id, false);
			
			return false;
		}
		
		ezfc_set_price(form);
		ezfc_set_submit_text(form);
	}

	/**
		form submitted
	**/
	function ezfc_form_submit(form, step) {
		$(".ezfc-submit-icon").addClass("ezfc-submit-icon-show");

		// set spinner icon to submit field
		var submit_icon = $(form).find(".ezfc-submit-icon");
		submit_icon.fadeIn();
		var submit_element = $(form).find("input[type='submit']");
		submit_element.attr("disabled", "disabled");

		// clear hidden elements (due to conditional logic)
		$(form).find(".ezfc-custom-hidden:not(.ezfc-element-wrapper-fileupload)").each(function() {
			$(this).find("input, :selected").val("__HIDDEN__").addClass("ezfc-has-hidden-placeholder");

			// empty radio buttons --> select first element to submit __hidden__ data
			var radio_empty = $(this).find(".ezfc-element-radio:not(:has(:radio:checked))");
			if (radio_empty.length) {
				$(radio_empty).first().find("input").prop("checked", true);
			}
		});

		var id   = $(form).data("id");
		var data = "id=" + id + "&" + $(form).serialize();

		// url
		data += "&url=" + encodeURI(window.location.href);

		// request price for the first time
		if (ezfc_form_vars[id].price_requested == 0) {
			data += "&price_requested=1";
		}

		// summary
		if (ezfc_form_vars[id].summary_shown == 0) {
			data += "&summary=1";
		}

		// next/previous step
		if (step != -1) {
			data += "&step=" + step;
		}

		if (ezfc_form_vars[id].preview) {
			data += "&preview=" + ezfc_form_vars[id].preview;
		}

		ezfc_call_hook("ezfc_before_submission", {
			form: $(form),
			form_vars: ezfc_form_vars[id],
			id: id
		});

		$.ajax({
			type: "post",
			url: ezfc_vars.ajaxurl,
			data: {
				action: "ezfc_frontend",
				data: data
			},
			success: function(response) {
				$(".ezfc-submit-icon").removeClass("ezfc-submit-icon-show");

				submit_element.removeAttr("disabled");
				submit_icon.fadeOut();

				if (ezfc_vars.debug_mode == "1") console.log(response);

				response = $.parseJSON(response);
				if (!response) {
					$(form).find(".ezfc-message").text("Something went wrong. :(");
					if (typeof Recaptcha !== "undefined") Recaptcha.reload();

					ezfc_reset_disabled_fields(form, true);
						
					return false;
				}

				// error occurred -> invalid form fields
				if (response.error) {
					ezfc_reset_disabled_fields(form, true);

					if (response.id) {
						// error tip (if the form uses steps, do not show this if all fields are valid up until this step)
						var show_error_tip = true;
						// error tip data
						var el_target = "#ezfc_element-" + response.id;
						var el_tip    = $(el_target).find(".ezfc-element").first();

						// check if form uses steps
						var use_steps = $(form).find(".ezfc-step-active").length > 0 ? true : false;
						if (use_steps) {
							var error_step = parseInt($(el_target).parents(".ezfc-step").data("step"));
							
							// if invalid field is not on the current step, do not show the tip. also, do not show the tip when submitting the form (step = -1)
							if (error_step != step && step != -1) {
								show_error_tip = false;
								ezfc_set_step(form, step + 1);
							}
						}

						if (show_error_tip) {
							if (!el_tip.length) {
								el_tip = $(el_target);
							}
							var tip_delay = use_steps ? 1000 : 400;

							var tip = new Opentip(el_tip, {
								delay: 800,
								hideDelay: 0.1,
								hideTriggers: ["closeButton", "target"],
								removeElementsOnHide: true,
								showOn: null,
								target: el_target,
								tipJoint: ezfc_vars.required_text_position || "middle right",
							});
							tip.setContent(response.error);
							tip.show();

							// auto hide tooltip
							if (typeof ezfc_vars.required_text_auto_hide !== "undefined") {
								var required_text_auto_hide = parseFloat(ezfc_vars.required_text_auto_hide) * 1000;

								if (required_text_auto_hide > 0) {
									setTimeout(function() {
										if (tip) tip.hide();
									}, required_text_auto_hide);
								}
							}

							if (!ezfc_form_vars[id].disable_error_scroll) {
								ezfc_scroll_to(el_target);
							}
						}
					}
					else {
						var message_wrapper = $(form).parents(".ezfc-wrapper").find(".ezfc-message");
						message_wrapper.text(response.error).fadeIn().delay(7500).fadeOut();
					}

					if (typeof Recaptcha !== "undefined") Recaptcha.reload();

					return false;
				}
				// next step
				else if (response.step_valid) {
					ezfc_reset_disabled_fields(form);
					ezfc_set_step(form, step + 1);

					return false;
				}
				// summary
				else if (response.summary) {
					$(form).find(".ezfc-summary-wrapper").fadeIn().find(".ezfc-summary").html(response.summary);
					ezfc_form_vars[id].summary_shown = 1;

					ezfc_reset_disabled_fields(form);

					return false;
				}

				// prevent spam
				if (typeof Recaptcha !== "undefined") Recaptcha.reload();

				// submit paypal form
				if (response.paypal) {
					// disable submit button again to prevent doubleclicking
					submit_element.attr("disabled", "disabled");
					// redirect to paypal express checkout url
					window.location.href = response.paypal;
				}
				else {
					// price request
					if (response.price_requested || response.price_requested === 0) {
						ezfc_price_request_toggle(id, true, response.price_requested);
						return;
					}

					/**
						submission successful
					**/
					ezfc_call_hook("ezfc_submission_success", {
						form: $(form),
						form_vars: ezfc_form_vars[id],
						id: id,
						price: price,
						response: response
					});

					var $success_text = $(".ezfc-success-text[data-id='" + id + "']");
					$success_text.html(response.success);

					// reset form after submission
					if (ezfc_form_vars[id].reset_after_submission == 1) {
						ezfc_reset_form(form);

						$success_text.fadeIn().delay(7500).fadeOut();
						return;
					}

					// hide all forms
					if (ezfc_form_vars[id].hide_all_forms == 1) {
						$(".ezfc-form, .ezfc-required-notification").fadeOut();
					}
					else {
						$(form).fadeOut();
						$(form).find(".ezfc-required-notification").fadeOut();
					}

					// scroll to success message
					if (ezfc_form_vars[id].scroll_to_success_message == 1) {
						$success_text.fadeIn(400, function() {
							ezfc_scroll_to($success_text, -200);
						});
					}
					else {
						$success_text.fadeIn();
					}

					if (ezfc_form_vars[id]) {
						// redirect the user
						if (typeof ezfc_form_vars[id].redirect_url !== "undefined" && ezfc_form_vars[id].redirect_url.length > 0) {
							var redirect_form_vars = "";
							if (ezfc_form_vars[id].redirect_forward_values == 1) redirect_form_vars = $(form).serialize();

							var href_separator = ezfc_form_vars[id].redirect_url.indexOf("?") == -1 ? "?" : "&";
							window.location.href = ezfc_form_vars[id].redirect_url + href_separator + redirect_form_vars;
						}
						// refresh the page
						else if (typeof ezfc_form_vars[id].refresh_page_after_submission !== "undefined" && ezfc_form_vars[id].refresh_page_after_submission == 1) {
							var redirect_timer = Math.max(0, Math.abs(parseInt(ezfc_form_vars[id].redirect_timer)));

							setTimeout(function() {
								window.location.reload();
							}, redirect_timer * 1000)
						}
					}
				}
			}
		});
	}

	/**
		external values
	**/
	function calculate_get_external_values(form, form_id, el_object, el_type) {
		var value_external_element = el_object.data("value_external");
		if (value_external_element && $(value_external_element).length > 0) {
			// get external value
			var value_external;

			if ($(value_external_element).is("input[type='radio']")) {
				value_external = $(value_external_element).find(":checked").val();
			}
			else if ($(value_external_element).is("input, input[type='text'], textarea")) {
				value_external = $(value_external_element).val();
			}
			else if ($(value_external_element).is("select")) {
				value_external = $(value_external_element).find(":selected").text();
			}
			else {
				value_external = $(value_external_element).text();
			}

			// set external value
			if (el_type == "input" || el_type == "numbers" || el_type == "subtotal") {
				el_object.find("input").val(value_external);
			}
			else if (el_type == "dropdown") {
				el_object.find(":selected").removeAttr("selected");
				el_object.find("option[value='" + value_external + "']").attr("selected", "selected");
			}
			else if (el_type == "radio") {
				el_object.find(":checked").removeAttr("checked");
				el_object.find("input[value='" + value_external + "']").attr("checked", "checked");
			}
			else if (el_type == "checkbox") {
				el_object.find(":checked").removeAttr("checked");
				el_object.find("input[value='" + value_external + "']").attr("checked", "checked");
			}
			else if (el_type == "textfield") {
				el_object.find("textarea").val(value_external);
			}

			// set event listener
			if (!external_listeners[form_id][value_external_element]) {
				external_listeners[form_id][value_external_element] = 1;

				$(value_external_element).on("change keyup", function() {
					ezfc_set_price($(form));
				});
			}
		}
	}


	/**
		conditionals
	**/
	function calculate_conditionals(form, form_id, el_object, el_type) {
		var cond_action       = el_object.data("conditional_action");
		var cond_operator     = el_object.data("conditional_operator");
		var cond_target       = el_object.data("conditional_target");
		var cond_value        = el_object.data("conditional_values");
		var cond_target_value = el_object.data("conditional_target_value");
		var cond_notoggle     = el_object.data("conditional_notoggle");
		var cond_redirects    = el_object.data("conditional_redirects");
		var cond_use_factor   = el_object.data("conditional_use_factor");
		var cond_row_operator = el_object.data("conditional_row_operator");

		// check if there should be conditional actions
		if (!cond_action || cond_action == 0) return;

		var cond_actions_elements    = cond_action.toString().split(",");
		var cond_operator_elements   = cond_operator.toString().split(",");
		var cond_target_elements     = cond_target.toString().split(",");
		var cond_custom_values       = cond_value.toString().split(",");
		var cond_custom_target_value = cond_target_value.toString().split(",");
		var cond_notoggle_values     = cond_notoggle.toString().split(",");
		var cond_redirects_values    = cond_redirects.toString().split(",");
		var cond_use_factor_values   = cond_use_factor.toString().split(",");
		var cond_row_operator_values = cond_row_operator.toString().split(",");

		// value of this element
		var el_value  = el_object.val();
		var el_factor = 1;
			
		// get selected value from input fields
		if (el_type == "input") {
			el_value = el_object.find("input").val();
		}
		else if (el_type == "numbers" || el_type == "hidden" || el_type == "subtotal" || el_type == "set") {
			el_value  = parseFloat(el_object.find("input").val());
			el_factor = el_object.find("input").data("factor");
		}
		// get selected value from dropdowns
		else if (el_type == "dropdown") {
			el_value = el_object.find(":selected").data("value");
		}
		// get selected value from radio
		else if (el_type == "radio") {
			el_value = el_object.find(":checked").data("value");
		}
		// get selected values from checkboxes
		else if (el_type == "checkbox") {
			el_value = 0;
			el_object.find(":checked").each(function(ct, ct_el) {
				el_value += parseFloat($(ct_el).data("value"));
			});
		}
		// get amount of days from date range
		else if (el_type == "daterange") {
			var tmp_target_value = [
				// from
				$(el_object).find(".ezfc-element-daterange-from").datepicker("getDate"),
				// to
				$(el_object).find(".ezfc-element-daterange-to").datepicker("getDate")
			];

			el_value  = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]);
			el_factor = el_object.find("input").data("factor");
		}
		else if (el_type == "starrating") {
			el_value = parseFloat(el_object.find(":checked").val());
			if (isNaN(el_value)) el_value = 0;
		}

		// prepare chain
		var cond_chain_reset = {
			action: -1,
			index:  -1,
			target: -1
		};
		var cond_chain_element = cond_chain_reset;

		// go through all conditionals
		$.each(cond_actions_elements, function(ic, action) {
			// get conditional target element
			var cond_target;
			if (cond_target_elements[ic] == "submit_button") {
				cond_target = $(form).find(".ezfc-submit");
			}
			else {
				cond_target = $("#ezfc_element-" + cond_target_elements[ic]);
			}

			// no target element found
			if (cond_target.length < 1 && cond_redirects_values.length < 1) return;

			// check if raw value should be used
			if (cond_use_factor_values[ic] == 1) {
				el_factor = parseFloat(el_factor);
				if (!isNaN(el_factor)) {
					el_value *= el_factor;
				}
			}

			// chaining
			var conditional_chain = [ { operator: cond_operator_elements[ic], value: cond_custom_values[ic] } ];

			var chain_length = el_object.data("conditional_chain_length");
			if (chain_length > 0) {
				var $dom_coc = el_object.data("conditional_operator_chain_" + ic);
				var $dom_cvc = el_object.data("conditional_value_chain_" + ic);

				if ($dom_coc) {
					var conditional_operator_chain = $dom_coc.toString().split(",");
					var conditional_value_chain    = $dom_cvc.toString().split(",");

					$.each(conditional_operator_chain, function(cn, operator_chain) {
						conditional_chain.push({ operator: operator_chain, value: conditional_value_chain[cn] });
					});
				}
			}

			/**
				TODO
				check all conditional chains
			**/
			var do_action = false;

			$.each(conditional_chain, function(chain_index, chain_row) {
				// do not parse float for input elements
				//var cond_custom_value = cond_custom_values[ic];
				var cond_custom_value = chain_row.value;

				if (el_object.data("is_currency") == 1 && chain_row.operator != "in") {
					cond_custom_value = parseFloat(chain_row.value);
				}
				else {
					cond_custom_value = chain_row.value;
				}

				// check if conditional is true - separate text and number elements
				if (el_type == "input") {
					do_action = cond_custom_value.toLowerCase()==cond_target.val().toLowerCase();
				}
				else {
					var cond_value_min_max = chain_row.value.split(":");

					switch (chain_row.operator) {
						case "gr": do_action = el_value > cond_custom_value;
						break;
						case "gre": do_action = el_value >= cond_custom_value;
						break;

						case "less": do_action = el_value < cond_custom_value;
						break;
						case "lesse": do_action = el_value <= cond_custom_value;
						break;

						case "equals": do_action = el_value == cond_custom_value;
						break;

						case "between":
							if (cond_value_min_max.length < 2) {
								do_action = false;
							}
							else {
								do_action = (el_value >= cond_value_min_max[0] && el_value <= cond_value_min_max[1]);
							}
						break;

						case "not":
							if (cond_value_min_max.length < 2) {
								do_action = el_value != cond_custom_value;
							}
							else {
								do_action = (el_value < cond_value_min_max[0] && el_value > cond_value_min_max[1]);
							}
						break;

						case "hidden": do_action = el_object.hasClass("ezfc-custom-hidden");
						break;

						case "visible": do_action = !el_object.hasClass("ezfc-custom-hidden");
						break;

						case "mod0": do_action = el_value > 0 && (el_value % cond_custom_value) == 0;
						break;
						case "mod1": do_action = el_value > 0 && (el_value % cond_custom_value) != 0;
						break;

						case "bit_and": do_action = el_value & cond_custom_value;
						break;

						case "bit_or": do_action = el_value | cond_custom_value;
						break;

						case "empty":
							if (typeof el_value === "undefined") {
								do_action = true;
							}
							if (typeof el_value === "number") {
								do_action = isNaN(el_value);
							}
							else {
								do_action = el_value.length < 1;
							}
						break;

						case "notempty":
							if (typeof el_value === "undefined") {
								do_action = false;
							}
							else if (typeof el_value === "number") {
								do_action = !isNaN(el_value);
							}
							else {
								do_action = el_value.length > 0;
							}
						break;

						case "in":
							if (typeof el_value === "undefined") {
								do_action = false;
							}
							else {
								var in_values = cond_custom_value.split("|");

								do_action = false;
								for (var i in in_values) {
									if (el_value == in_values[i]) {
										do_action = true;
										return;
									}
								}
							}
						break;

						default: do_action = false;
						break;
					}
				}

				// at least one condition needs to be true (i.e. row OR operator)
				if (typeof cond_row_operator_values[ic] !== "undefined" && cond_row_operator_values[ic] == 1) {
					if (do_action) return false;
				}
				// all conditions need to be true (i.e. row AND operator)
				else {
					if (!do_action) return false;
				}
			});

			// conditional actions
			var js_action, js_counter_action;
			// when cond_notoggle_element is true, the opposite action will not be executed
			var cond_notoggle_element = cond_notoggle_values[ic];
			// target element type
			var cond_target_type = cond_target.data("element");

			// set cond_target to all direct child elements when it's a group
			if (cond_target_type == "group") {
				cond_target.push($(cond_target).find("> .ezfc-custom-element"));
			}

			// set values
			if (action == "set" && do_action) {
				if (cond_target_type == "input" || cond_target_type == "numbers" || cond_target_type == "subtotal" || cond_target_type == "set") {
					cond_target.find("input").val(cond_custom_target_value[ic]);
				}
				else if (cond_target_type == "dropdown") {
					cond_target.find(":selected").removeAttr("selected");
					cond_target.find("option[data-value='" + cond_custom_target_value[ic] + "']").prop("selected", "selected");
				}
				else if (cond_target_type == "radio") {
					cond_target.find(":checked").removeAttr("checked");
					cond_target.find("input[data-value='" + cond_custom_target_value[ic] + "']").prop("checked", true);
				}
				else if (cond_target_type == "checkbox") {
					cond_target.find("input[data-value='" + cond_custom_target_value[ic] + "']").prop("checked", true);
				}
				else {
					cond_target.text(cond_custom_target_value[ic]);
				}
			}
			// activate element
			else if (action == "activate") {
				// activate
				if (do_action) {
					// submit button
					if (cond_target_type == "submit") {
						cond_target.prop("disabled", false);
					}
					// group
					else if (cond_target_type == "group") {
						cond_target.find("[data-calculate_enabled]").data("calculate_enabled", 1);
					}
					// element
					else {
						cond_target.data("calculate_enabled", 1);
					}
				}
				// deactivate
				else if (cond_notoggle_element != 1) {
					// submit button
					if (cond_target_type == "submit") {
						cond_target.prop("disabled", true);
					}
					// group
					else if (cond_target_type == "group") {
						cond_target.find("[data-calculate_enabled]").data("calculate_enabled", 0);
					}
					// element
					else {
						cond_target.data("calculate_enabled", 0);
					}
				}
			}
			// deactivate element
			else if (action == "deactivate") {
				// deactivate
				if (do_action) {
					// submit button
					if (cond_target_type == "submit") {
						cond_target.prop("disabled", true);
					}
					// group
					else if (cond_target_type == "group") {
						cond_target.find("[data-calculate_enabled]").data("calculate_enabled", 0);
					}
					// element
					else cond_target.data("calculate_enabled", 0);
				}
				// activate
				else if (cond_notoggle_element != 1) {
					// submit button
					if (cond_target_type == "submit") {
						cond_target.prop("disabled", false);
					}
					// group
					else if (cond_target_type == "group") {
						cond_target.find("[data-calculate_enabled]").data("calculate_enabled", 1);
					}
					// element
					else {
						cond_target.data("calculate_enabled", 1);
					}
				}
			}
			// load form
			else if (action == "redirect" && do_action) {
				// set message
				var message_wrapper = $(form).parents(".ezfc-wrapper").find(".ezfc-message");
				message_wrapper.text(ezfc_form_vars[form_id].redirect_text).fadeIn();

				// hide the form
				$(form).fadeOut();

				setTimeout(function() {
					window.location.href = cond_redirects_values[ic];
				}, ezfc_form_vars[form_id].redirect_timer * 1000);
			}
			// steps
			else if ((action == "step_goto" || action == "step_prev" || action == "step_next") && do_action) {
				var current_step = parseInt($(form).find(".ezfc-step-active").data("step"));
				var next_step = 0;

				switch (action) {
					case "step_prev":
						if (current_step == 0) return;
						next_step = current_step - 1;
					break;

					case "step_next":
						var step_length = $(form).find(".ezfc-step-start").length;
						if (current_step == step_length - 1) return;

						next_step = current_step + 1;
					break;

					case "step_goto":
						var step_goto = $(form).find(".ezfc-step-start[data-id='" + cond_target_elements[ic] + "']");
						if (step_goto.length < 1) return;

						next_step = parseInt(step_goto.data("step"));
					break;
				}

				ezfc_set_step($(form), next_step, 0);
			}
			// show / hide elements
			else {
				if (action == "show") {
					js_action         = "removeClass";
					js_counter_action = "addClass";
				}
				else if (action == "hide") {
					js_action         = "addClass"
					js_counter_action = "removeClass";
				}
				else return;

				if (do_action) {
					cond_target[js_action]("ezfc-hidden ezfc-custom-hidden");
					
					// fade in
					if (action == "show") {
						cond_target.addClass("ezfc-fade-in");
					}
					// fade out
					else {
						$(cond_target).fadeOut(500, function() {
							cond_target.removeClass("ezfc-fade-in");

							if (ezfc_form_vars[form_id].clear_selected_values_hidden == 1) {
								// clear values
								ezfc_clear_hidden_values_element();
							}
						});
					}
				}
				// only do the counter action when notoggle is not enabled
				else if (cond_notoggle_element != 1) {
					cond_target[js_counter_action]("ezfc-hidden ezfc-custom-hidden");

					if (action == "show") { cond_target.removeClass("ezfc-fade-in"); }
					else { cond_target.addClass("ezfc-fade-in"); }
				}
			}
		});
	}


	/**
		element calculations
	**/
	function calculate_elements(form, form_id, el_object, el_type, price) {
		var calc_enabled    = el_object.data("calculate_enabled");
		var calc_operator   = el_object.data("calculate_operator") || 0;
		var calc_targets    = el_object.data("calculate_target") || 0;
		var calc_values     = el_object.data("calculate_values") || 0;
		var overwrite_price = el_object.data("overwrite_price");
		var add_to_price    = el_object.data("add_to_price");
	
		// dropdowns / radios / checkboxes could contain more values
		var calc_list = el_object.find(".ezfc-element-numbers, .ezfc-element-input-hidden, .ezfc-element-subtotal, .ezfc-element-daterange-container, .ezfc-element-set, .ezfc-element-extension, :selected, :checked, .ezfc-element-custom-calculation");

		// these operators do not need any target or value
		var operator_no_check = ["ceil", "floor", "round", "abs", "subtotal"];

		$(calc_list).each(function(cl, cl_object) {
			var el_settings = {};
			if ($(this).data("settings")) {
				el_settings = $(this).data("settings");
			}

			// skip when calculation is disabled for hidden elements
			if (!$(el_object).is(":visible") && (!el_settings.hasOwnProperty("calculate_when_hidden") || el_settings.calculate_when_hidden == 0)) {
				ezfc_add_debug_info("calculate", el_object, "Skipped as element is hidden and calculate_when_hidden is not enabled.");
				return;
			}

			// no target or values to calculate with were found. skip for subtotals / hidden.
			if ((!calc_enabled || calc_enabled == 0) &&
			    !calc_targets &&
			    !calc_values &&
			    el_type != "set" &&
				el_type != "subtotal" &&
				el_type != "hidden" &&
				el_type != "extension" &&
				el_type != "custom_calculation") {
				ezfc_add_debug_info("calculate", el_object, "No target or values were found to calculate with. Subtotal, Hidden and Set elements are skipped.");
				return;
			}

			// check if calculation is enabled for this element
			if ((!calc_enabled || calc_enabled == 0) && el_type != "custom_calculation") {
				ezfc_add_debug_info("calculate", el_object, "Calculation is disabled.");
				return;
			}

			var factor       = parseFloat($(cl_object).data("factor"));
			var value_raw    = $(cl_object).val();
			//var value        = parseFloat(value_raw);
			var value        = ezfc_get_value_from_element(el_object, null, false);
			var value_pct    = value / 100;
			var value_is_pct = value_raw.indexOf("%") >= 0;

			// default values
			if (!value || isNaN(value)) value = 0;
			if ((!factor || isNaN(factor)) && factor !== 0) factor = 1;

			// set addprice to value first
			var addPrice = value;

			// basic calculations
			switch (el_type) {
				case "numbers":
				case "extension":
					addPrice = value;
				break;

				case "hidden":
					// set price from woocommerce product
					if ($(cl_object).data("use_woocommerce_price")) {
						// get product price
						var woo_product_price = parseFloat($("meta[itemprop='price']").attr("content"));
						// if no price can be found, set it to 0
						if (isNaN(woo_product_price)) woo_product_price = 0;
						// element price
						addPrice = woo_product_price;
						// also set the hidden input value
						$(cl_object).val(woo_product_price);
					}
					else {
						addPrice = value;
					}
				break;

				case "dropdown":
				case "radio":
				case "checkbox":
					addPrice = parseFloat($(cl_object).data("value"));
					if (isNaN(addPrice)) addPrice = 0;
				break;

				case "subtotal":
					addPrice = price;
				break;

				case "daterange":
					var tmp_target_value = [
						// from
						$(cl_object).find(".ezfc-element-daterange-from").datepicker("getDate"),
						// to
						$(cl_object).find(".ezfc-element-daterange-to").datepicker("getDate")
					];

					addPrice = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]) * factor;
				break;

				// custom calculation function
				case "custom_calculation":
					var function_name = $(el_object).find(".ezfc-element-custom-calculation").data("function");

					addPrice = window[function_name](price);
					if (calc_enabled) {
						addPrice = parseFloat(addPrice);
					}

					$(el_object).find(".ezfc-element-custom-calculation-input").val(addPrice);

					// improve performance here
					if (ezfc_vars.debug_mode == 2) {
						var function_text = $(el_object).find(".ezfc-element-custom-calculation script").text();
						ezfc_add_debug_info("custom_calculation", el_object, "custom_calculation:\n" + function_text);
					}
				break;
			}

			// percent calculation
			if (value_is_pct) {
				addPrice = price * value_pct;
			}

			// advanced calculations
			var	calc_operator_elements = calc_operator.toString().split(",");
				calc_target_elements   = calc_targets.toString().split(",");
				calc_custom_values     = calc_values.toString().split(",");

			// check if any advanced calculations are present
			if (calc_operator_elements.length > 0 && calc_operator_elements[0] != 0) {
				// iterate through all operators elements
				$.each(calc_operator_elements, function(n, operator) {
					// no calculation operator
					if (!operator) {
						ezfc_add_debug_info("calculate", el_object, "#" + n + ": No operator found here.");
						return;
					}

					var calc_target = [];
					// operator needs a target
					if ($.inArray(operator, operator_no_check) == -1) {
						// target to be calculated with
						calc_target = $("#ezfc_element-" + calc_target_elements[n]);

						// skip hidden element
						if (calc_target.hasClass("ezfc-custom-hidden")) {
							ezfc_add_debug_info("calculate", el_object, "#" + n + ": Skipping this element as it is conditionally hidden.");
							return;
						}
					}

					// custom value used when no target was found
					var calc_value = calc_custom_values[n];

					// use value from target
					var target_value;
					if (calc_target.length > 0) {
						var calc_target_element = calc_target.data("element");

						// get value from numbers-element (multiplied with factor)
						if (calc_target_element == "numbers" || calc_target_element == "subtotal" || calc_target_element == "hidden" || calc_target_element == "set") {
							var calc_target_input = calc_target.find("input");
							var target_factor     = parseFloat(calc_target_input.data("factor"));
							if (!target_factor || isNaN(target_factor)) target_factor = 1;

							target_value = ezfc_normalize_value(calc_target_input.val()) * target_factor;
						}
						// get selected value from dropdowns
						else if (calc_target_element == "dropdown") {
							target_value = parseFloat(calc_target.find(":selected").data("value"));
						}
						// get selected value from radio
						else if (calc_target_element == "radio") {
							target_value = parseFloat(calc_target.find(":checked").data("value"));
						}
						// get selected values from checkboxes
						else if (calc_target_element == "checkbox") {
							target_value = 0;
							calc_target.find(":checked").each(function(ct, ct_el) {
								target_value += parseFloat($(ct_el).data("value"));
							});
						}
						// get amount of days from date range
						else if (calc_target_element == "daterange") {
							var tmp_target_value = [
								// from
								$(calc_target).find(".ezfc-element-daterange-from").datepicker("getDate"),
								// to
								$(calc_target).find(".ezfc-element-daterange-to").datepicker("getDate")
							];

							var target_factor = parseFloat($(calc_target).find(".ezfc-element-daterange-container").data("factor"));
							if (!target_factor || isNaN(target_factor)) target_factor = 1;

							target_value = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]) * target_factor;
						}
						// get value from custom function
						else if (calc_target_element == "custom_calculation") {
							var $target = $(calc_target).find(".ezfc-element-custom-calculation");
							var function_name = $target.data("function");
							var target_calc_enabled = $target.data("calculate_enabled");

							target_value = window[function_name](calc_value);

							if (target_calc_enabled == 1) {
								target_value = parseFloat(target_value);
							}
						}
						else if (calc_target_element == "starrating") {
							target_value = parseFloat($(calc_target).find(":checked").val());
							if (isNaN(target_value)) target_value = 0;
						}
					}
					else if (calc_value != "0") {
						target_value = parseFloat(calc_value);
					}

					if (!target_value || isNaN(target_value)) target_value = 0;

					switch (operator) {
						case "add":	addPrice += target_value;
						break;

						case "subtract": addPrice -= target_value;
						break;

						case "multiply": addPrice *= target_value;
						break;

						case "divide": 
							if (target_value == 0) {
								ezfc_add_debug_info("calculate", el_object, "#" + n + ": Division by 0.");
								return;
							}

							addPrice /= target_value;

							// still necessary?
							if ($(cl_object).data("calculate_before") == "1") {
								overwrite_price = 1;
								addPrice = target_value / value;
							}
						break;

						case "equals":
							addPrice = target_value;
						break;

						case "power":
							addPrice = Math.pow(addPrice, target_value);
						break;

						case "ceil":
							addPrice = Math.ceil(addPrice);
						break;

						case "floor":
							addPrice = Math.floor(addPrice);
						break;

						case "round":
							addPrice = Math.round(addPrice);
						break;

						case "abs":
							addPrice = Math.abs(addPrice);
						break;

						case "subtotal":
							addPrice = price;
						break;

						case "log":
							if (target_value == 0) return;
							addPrice = Math.log(target_value);
						break;
						case "log2":
							if (target_value == 0) return;
							addPrice = Math.log2(target_value);
						break;
						case "log10":
							if (target_value == 0) return;
							addPrice = Math.log10(target_value);
						break;
					}

					ezfc_add_debug_info("calculate", el_object, "#" + n + ": operator = " + operator + "\ntarget_value = " + target_value + "\ncalc_value = " + calc_value + "\naddPrice = " + addPrice);
				});
			}

			ezfc_add_debug_info("calculate", el_object, "\nprice = " + price + "\naddPrice = " + addPrice + "\nfactor = " + factor);

			// add calculated price to total price
			if (add_to_price == 1) {
				if (overwrite_price == "1") {
					price = addPrice;
				}
				else if (calc_enabled == "1") {
					price += addPrice;
				}
			}
			// for subtotal / set elements only (doesn't interfere with calculation but use the calculated price as text)
			else {
				if (overwrite_price == 1) {
					tmp_price = addPrice;
				}
			}

			if (el_type == "subtotal" || el_type == "set") {
				var tmp_price;
				if (add_to_price == 1) {
					tmp_price = overwrite_price==1 ? price : addPrice;
				}
				else {
					tmp_price = addPrice;
				}

				var precision = 2;
				if ($(cl_object).data("settings")) {
					el_settings = $(cl_object).data("settings");
					precision   = el_settings.precision;
				}

				var price_to_write = ezfc_normalize_value(tmp_price.toFixed(precision), true);

				el_object.find("input").val(price_to_write);
			}
		});

		return price;
	}


	/**
		discount calculations
	**/
	function calculate_discounts(form, form_id, el_object, el_type, price) {
		var discount_range_min = el_object.data("discount_range_min");
		var discount_range_max = el_object.data("discount_range_max");
		var discount_operator  = el_object.data("discount_operator");
		var discount_value     = el_object.data("discount_values");

		// check if there should be conditional actions
		if (discount_value || discount_value == 0) {
			var discount_range_min_values = discount_range_min.toString().split(",");
			var discount_range_max_values = discount_range_max.toString().split(",");
			var discount_operator_values  = discount_operator.toString().split(",");
			var discount_value_values     = discount_value.toString().split(",");

			var el_value = 0;
			var factor   = 1;

			// get selected value from input fields
			if (el_type == "input" || el_type == "numbers" || el_type == "subtotal" || el_type == "hidden" || el_type == "extension") {
				var el_input = el_object.find("input");

				factor = parseFloat(el_input.data("factor"));
				if ((!factor || isNaN(factor)) && factor !== 0) factor = 1;

				el_value = parseFloat(el_input.val());
			}
			// get selected value from dropdowns
			else if (el_type == "dropdown") {
				el_value = parseFloat(el_object.find(":selected").data("value"));
			}
			// get selected value from radio
			else if (el_type == "radio") {
				el_value = parseFloat(el_object.find(":checked").data("value"));
			}
			// get selected values from checkboxes
			else if (el_type == "checkbox") {
				el_value = 0;
				el_object.find(":checked").each(function(ct, ct_el) {
					el_value += parseFloat($(ct_el).data("value"));
				});
			}
			// get amount of days from date range
			else if (el_type == "daterange") {
				var tmp_target_value = [
					// from
					el_object.find(".ezfc-element-daterange-from").datepicker("getDate"),
					// to
					el_object.find(".ezfc-element-daterange-to").datepicker("getDate")
				];

				el_value = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]);
			}

			// go through all discounts
			$.each(discount_operator_values, function(id, operator) {
				if (discount_value_values[id].length < 1) return;
				
				if (!discount_range_min_values[id] && discount_range_min_values[id] !== 0) discount_range_min_values[id] = Number.NEGATIVE_INFINITY;
				if (!discount_range_max_values[id] && discount_range_max_values[id] !== 0) discount_range_max_values[id] = Number.POSITIVE_INFINITY;

				var discount_value_write_to_input;

				if (el_value >= parseFloat(discount_range_min_values[id]) && el_value <= parseFloat(discount_range_max_values[id])) {
					var disc_value = parseFloat(discount_value_values[id]);
					var discount_value_operator;

					switch (operator) {
						case "add":
							discount_value_operator = disc_value;
							discount_value_write_to_input = discount_value_operator;

							price += discount_value_write_to_input;
						break;

						case "subtract":
							discount_value_operator = disc_value;
							discount_value_write_to_input = discount_value_operator;

							price -= discount_value_write_to_input;
						break;

						case "percent_add":
							discount_value_operator = el_value * factor * (disc_value / 100);
							discount_value_write_to_input = price + discount_value_operator;

							price = discount_value_write_to_input;
						break;

						case "percent_sub":
							discount_value_operator = el_value * factor * (disc_value / 100);
							discount_value_write_to_input = price - discount_value_operator;

							price = discount_value_write_to_input;
						break;

						case "equals":
							discount_value_operator = disc_value;
							discount_value_write_to_input = discount_value_operator;

							price = discount_value_write_to_input;
						break;
					}

					if (el_type == "subtotal" && !isNaN(discount_value_write_to_input)) {
						$(el_object).find("input").val(discount_value_write_to_input.toFixed(2));
					}

					ezfc_add_debug_info("discount", el_object, "discount = " + discount_value_operator + "\nprice after discount = " + price);
				}
			});
		}


		return price;
	}

	/**
		set values for set elements
	**/
	function calculate_set_elements(form, form_id, el_object, el_type, price) {
		var set_operator = el_object.data("set_operator");
		var tmp_targets = el_object.data("set_elements");

		// check if there should be conditional actions
		if (!tmp_targets) return;

		var targets = tmp_targets.toString().split(",");
		var value_to_write;
		
		$.each(targets, function(i, v) {
			var target_object = $("#ezfc_element-" + v);

			if (!target_object) return;

			var target_type = $(target_object).data("element");

			// get selected value from input fields
			if (target_type == "input" || target_type == "numbers" || target_type == "subtotal" || target_type == "hidden" || target_type == "extension" || target_type == "set") {
				var el_input = target_object.find("input");

				factor = parseFloat(el_input.data("factor"));
				if ((!factor || isNaN(factor)) && factor !== 0) factor = 1;

				el_value = parseFloat(el_input.val());

				// check if factor should be used
				var el_child = el_object.find("input");
				if (el_child) {
					var el_child_settings = el_child.data("settings");

					if (typeof el_child_settings["use_factor"] !== "undefined") {
						var use_factor = parseInt(el_child_settings.use_factor);
						if (use_factor == 1) {
							el_value *= factor;
						}
					}
				}
			}
			// get selected value from dropdowns
			else if (target_type == "dropdown") {
				el_value = parseFloat(target_object.find(":selected").data("value"));
			}
			// get selected value from radio
			else if (target_type == "radio") {
				el_value = parseFloat(target_object.find(":checked").data("value"));
			}
			// get selected values from checkboxes
			else if (target_type == "checkbox") {
				el_value = 0;
				target_object.find(":checked").each(function(ct, ct_el) {
					el_value += parseFloat($(ct_el).data("value"));
				});
			}
			// get amount of days from date range
			else if (target_type == "daterange") {
				var tmp_target_value = [
					// from
					target_object.find(".ezfc-element-daterange-from").datepicker("getDate"),
					// to
					target_object.find(".ezfc-element-daterange-to").datepicker("getDate")
				];

				el_value = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]);
			}

			// first element
			if (i == 0) {
				value_to_write = el_value;
				return;
			}

			switch (set_operator) {
				case "min":
					if (el_value < value_to_write) value_to_write = el_value;
				break;

				case "max":
					if (el_value > value_to_write) value_to_write = el_value;
				break;

				case "avg":
				case "sum":
					value_to_write += el_value;
				break;

				case "dif":
					value_to_write -= el_value;
				break;

				case "prod":
					value_to_write *= el_value;
				break;

				case "quot":
					if (el_value != 0) value_to_write /= el_value;
				break;
			}
		});

		if (set_operator == "avg") {
			value_to_write = value_to_write / targets.length;
		}

		el_object.find("input").val(value_to_write);
	}

	// price calculation
	function calculate_price(form) {
		var price = 0;

		// remove debug info
		ezfc_remove_debug_info();

		// find all elements first
		$(form).find(".ezfc-custom-element").each(function(i, element) {
			var form_id   = $(form).data("id");
			var el_object = $(element);
			var el_type   = $(element).data("element");

			// classes may have changed meanwhile
			if ($(this).hasClass("ezfc-hidden") &&
				el_type != "subtotal" &&
				el_type != "hidden" &&
				ezfc_form_vars[form_id].calculate_old == 1) return;

			// get external value if present
			calculate_get_external_values(form, form_id, el_object, el_type);

			// check conditionals
			calculate_conditionals(form, form_id, el_object, el_type);

			// classes may have changed meanwhile
			if ($(this).hasClass("ezfc-hidden") &&
				el_type != "subtotal" &&
				el_type != "hidden") return;

			// set elements
			calculate_set_elements(form, form_id, el_object, el_type);

			// process calculations
			price = calculate_elements(form, form_id, el_object, el_type, price);

			// discount
			price = calculate_discounts(form, form_id, el_object, el_type, price);

			// check conditionals again
			calculate_conditionals(form, form_id, el_object, el_type);
		});

		return price;
	}

	function ezfc_set_price(form, price_old) {
		var form_id = $(form).data("id");

		// calculate price
		if (!price_old || price_old !== 0) {
			price = calculate_price($(form));
		}

		ezfc_set_subtotal_values($(form));

		// show price after request
		if (ezfc_form_vars[form_id].price_show_request == 1 && ezfc_form_vars[form_id].price_requested == 0) {
			ezfc_price_request_toggle(form_id, false);

			return;
		}

		if (typeof ezfc_price_old_global[form_id] === "undefined") ezfc_price_old_global[form_id] = 0;
		if (ezfc_price_old_global[form_id] == price) return;

		if (ezfc_form_vars[form_id].counter_duration != 0) {
			$(form).find(".ezfc-price-value").countTo({
				from: ezfc_price_old_global[form_id],
				to: price,
				speed: ezfc_form_vars[form_id].counter_duration,
				refreshInterval: ezfc_form_vars[form_id].counter_interval,
				formatter: function (value, options) {
					return ezfc_format_price(form_id, value);
				}
			});
		}
		else {
			$(form).find(".ezfc-price-value").text(ezfc_format_price(form_id, price));
		}

		ezfc_price_old_global[form_id] = price;
	}

	function ezfc_format_price(form_id, price, currency, custom_price_format) {
		var form_price_format = defaultFormat;
		var form_currency     = currency || ezfc_form_vars[form_id].currency;

		// use price format from form settings
		if (ezfc_form_vars[form_id].price_format && ezfc_form_vars[form_id].price_format.length > 0) {
			form_price_format = ezfc_form_vars[form_id].price_format;
		}

		// if defined, use custom price format
		if (custom_price_format && custom_price_format.length > 0) {
			form_price_format = custom_price_format;
		}

		if (isNaN(price)) price = 0;

		var price_formatted = numeral(price).format(form_price_format);

		return price_formatted;
	}

	// price request toggler
	function ezfc_price_request_toggle(form_id, enable, price) {
		var form = $(".ezfc-form[data-id='" + form_id + "']");

		// enable submit
		if (enable) {
			ezfc_price_old_global[form_id] = 0;
			ezfc_form_vars[form_id].price_requested = 1;
			ezfc_set_price(form, price);

			ezfc_set_submit_text(form);
		}
		else {
			ezfc_form_vars[form_id].price_requested = 0;

			$(form).find(".ezfc-price-value").text(ezfc_form_vars[form_id].price_show_request_before);
			$(form).find(".ezfc-submit").val(ezfc_form_vars[form_id].price_show_request_text);
		}
	}

	function ezfc_set_subtotal_values(form) {
		// subtotal elements
		$(form).find("[data-element='subtotal']").each(function(i, el) {
			var $subtotal_element = $(el).find(".ezfc-element-subtotal");
			var value             = $subtotal_element.val();
			var price_format      = null;

			var el_settings, text;

			if ($subtotal_element.data("settings")) {
				el_settings  = $subtotal_element.data("settings");
				price_format = el_settings.price_format;
			}

			text = ezfc_format_price($(form).data("id"), value, null, price_format);

			$(el).find(".ezfc-text").text(text);
		});

		// set elements
		$(form).find("[data-element='set']").each(function(i, el) {
			var $subtotal_element = $(el).find(".ezfc-element-set");
			var value             = $subtotal_element.val();
			var price_format      = null;

			var el_settings, text;

			if ($subtotal_element.data("settings")) {
				el_settings  = $subtotal_element.data("settings");
				price_format = el_settings.price_format;
			}

			text = ezfc_format_price($(form).data("id"), value, null, price_format);

			$(el).find(".ezfc-text").text(text);
		});
	}

	function ezfc_scroll() {
		$(".ezfc-fixed-price").each(function() {
			var offset             = $(this).offset();
			var form_id            = $(this).data("id");
			var form               = $(".ezfc-form[data-id='" + form_id + "']");
			var form_height        = form.outerHeight();
			var form_offset        = form.offset();
			var window_top         = $(window).scrollTop();
			var price_position_top = parseFloat(ezfc_form_vars[form_id].price_position_scroll_top);

			var diff = form_offset.top - window_top - price_position_top;
			if (diff < 0 && diff > -form_height) $(this).offset({ top: window_top + price_position_top });
			if (diff > 0 && offset.top > form_offset.top) $(this).offset({ top: form_offset.top });
		});
	}

	// reset disabled fields and restore initial values (since they may have changed due to conditional logic). also, set the relevant submit button text
	function ezfc_reset_disabled_fields(form, error) {
		$(form).find(".ezfc-custom-hidden").each(function() {
			$.each($(this).find("input, :selected"), function(i, v) {
				$(this).val($(this).data("index")).removeAttr("disabled");
			});
		});

		ezfc_set_submit_text(form, error);
	}

	// reset the whole form
	function ezfc_reset_form($form) {
		// reset values
		$form.find(".ezfc-custom-element").each(function() {
			var el_type = $(this).data("element");
			var initvalue = $(this).find("[data-initvalue]").data("initvalue");

			switch (el_type) {
				case "checkbox":
					$(this).find("input").each(function() {
						var initvalue = $(this).data("initvalue");

						if (initvalue == 1)
							$(this).prop("checked", true);
						else
							$(this).removeAttr("checked");
					});
				break;

				case "dropdown":
					$(this).find("option").removeAttr("selected");
					$(this).find("option[data-index='" + initvalue + "']").prop("selected", true);
				break;

				case "radio":
					$(this).find("input").removeAttr("checked");
					$(this).find("input[data-initvalue]").prop("checked", true);
				break;

				default:
					$(this).find("input").val(initvalue);
				break;
			}
		});

		$form.find(".ezfc-selected").removeClass("ezfc-selected");

		ezfc_set_step($form, 0, 0);
		ezfc_form_change($form);
	}

	function ezfc_set_step(form, new_step, verify) {
		var current_step = parseInt(form.find(".ezfc-step-active").data("step"));
		var step_wrapper = form.find(".ezfc-step[data-step='" + current_step + "']");
		var form_id      = form.data("id");

		if (current_step == new_step) return;

		// check ajax
		if (verify == 1 && ezfc_form_vars[form_id].verify_steps == 1) {
			var submit_icon = form.find(".ezfc-submit-icon");
			submit_icon.fadeIn();

			ezfc_form_submit(form, new_step - 1);

			$(".ezfc-has-hidden-placeholder").val("").removeClass("ezfc-has-hidden-placeholder");
			return;
		}

		var step_indicator_start = parseInt(ezfc_form_vars[form_id].step_indicator_start) - 1;

		step_wrapper.fadeOut(200, function() {
			var step_wrapper_next = form.find(".ezfc-step[data-step='" + new_step + "']");
			
			step_wrapper_next.fadeIn(200).addClass("ezfc-step-active");
			$(this).removeClass("ezfc-step-active");

			// maybe show step indicator
			if (new_step >= step_indicator_start) {
				form.find(".ezfc-step-indicator").fadeIn();
			}
			else {
				form.find(".ezfc-step-indicator").hide();
			}

			ezfc_scroll_to(step_wrapper_next, parseFloat(ezfc_vars.scroll_steps_offset));
		});

		form.find(".ezfc-step-indicator-item").each(function() {
			var step_dom = parseInt($(this).data("step"));
			$(this).removeClass("ezfc-step-indicator-item-active");
			
			if (step_dom <= new_step) {
				$(this).addClass("ezfc-step-indicator-item-active");
			}
		});

		return false;
	}

	function ezfc_scroll_to(element, custom_offset) {
		var element_offset = $(element).offset();

		if (typeof element_offset === "undefined" || ezfc_vars.auto_scroll_steps == 0) return;

		var offset_add = custom_offset || 50;
		var offset_scroll = element_offset.top + offset_add;
		$("html, body").animate({ scrollTop: element_offset.top + offset_add });
	}

	function ezfc_get_value_from_element($el_object, e_id, is_text) {
		if (!$el_object) $el_object = $("#ezfc_element-" + e_id);

		var decimal_point = $el_object.data("decimal_point");
		var el_type       = $el_object.data("element");
		var value_raw     = $el_object.find("input").val();
		var value         = ezfc_normalize_value(value_raw);
		var value_pct     = value / 100;
		var value_is_pct  = value_raw ? value_raw.indexOf("%") >= 0 : 0;

		// default values
		if (!value || isNaN(value)) value = 0;

		// set addprice to value first
		var addPrice = value;

		// basic calculations
		switch (el_type) {
			case "subtotal":
			case "numbers":
			case "hidden":
			case "extension":
			case "set":
				var $input_element = $el_object.find("input");
				var factor = parseFloat($input_element.data("factor"));

				if ((!factor || isNaN(factor)) && factor !== 0) factor = 1;

				addPrice = value_raw;

				if (!is_text) {
					value = ezfc_normalize_value($input_element.val());
					addPrice = value * factor;
				}
			break;

			case "dropdown":
			case "radio":
			case "checkbox":
				$el_object.find(":selected, :checked").each(function() {
					// return array of checked / selected values
					if (is_text) {
						if (typeof addPrice !== "object") addPrice = [];
						addPrice.push($(this).data("value"));
					}
					// add up values by default
					else {
						addPrice += parseFloat($(this).data("value"));
					}
				});
			break;

			case "daterange":
				var tmp_target_value = [
					// from
					$el_object.find(".ezfc-element-daterange-from").datepicker("getDate"),
					// to
					$el_object.find(".ezfc-element-daterange-to").datepicker("getDate")
				];

				var factor = parseFloat($el_object.find(".ezfc-element-daterange-from").data("factor"));

				if ((!factor || isNaN(factor)) && factor !== 0) factor = 1;

				// return date difference in days
				if (!is_text) {
					addPrice = jqueryui_date_diff(tmp_target_value[0], tmp_target_value[1]) * factor;
				}
				// return dates as array
				else {
					addPrice = tmp_target_value;
				}
			break;

			// custom calculation function
			case "custom_calculation":
				var function_name = $el_object.find(".ezfc-element-custom-calculation").data("function");

				addPrice = $el_object.find(".ezfc-element-custom-calculation-input").val();

				if (!is_text) {
					addPrice = parseFloat(addPrice);
				}
			break;

			case "starrating":
				addPrice = parseFloat($el_object.find(":checked").val());
				if (isNaN(addPrice)) addPrice = 0;
			break;
		}

		// percent calculation
		if (value_is_pct) {
			addPrice = price * value_pct;
		}

		if (!is_text) {
			if (isNaN(addPrice)) addPrice = 0;
			
			return !addPrice ? 0 : parseFloat(addPrice);
		}

		return addPrice;
	}

	function ezfc_clear_hidden_values(form) {
		var form_id = $(form).data("id");
		if (ezfc_form_vars[form_id].clear_selected_values_hidden != 1) return;

		$(form).find(".ezfc-custom-hidden").each(function() {	
			$(this).find("input[type='text']").val("");
    		$(this).find(":checkbox, :radio").prop("checked", false);
		});
	}

	function ezfc_clear_hidden_values_element(element) {
		var cond_target_type = element.data("element");

		if (cond_target_type == "input" || cond_target_type == "numbers" || cond_target_type == "subtotal") {
			cond_target.find("input").val("");
		}
		else if (cond_target_type == "dropdown") {
			cond_target.find(":selected").removeAttr("selected");
		}
		else if (cond_target_type == "radio" || cond_target_type == "checkbox") {
			cond_target.find(":checked").removeAttr("checked");
		}
	}

	function ezfc_normalize_value(value, reverse) {
		var decimal_point = ezfc_vars.price_format_dec_point;
		var value_normalized = String(value);

		// use dot as default
		if (decimal_point.length < 1) decimal_point = ".";

		if (reverse) {
			if (decimal_point == ",") {
				value_normalized = value_normalized.replace(",", "");
				value_normalized = value_normalized.replace(".", ",");
			}
		}
		else {
			if (decimal_point == ",") {
				value_normalized = value_normalized.replace(".", "");
				value_normalized = value_normalized.replace(",", ".");
			}
		}

		return value_normalized;
	}

	function ezfc_set_submit_text(form, error) {
		var form_id = $(form).data("id");

		// default submit text
		var submit_text = ezfc_form_vars[form_id].submit_text.default;
		
		// price request
		if (ezfc_form_vars[form_id].price_show_request == 1 && error) {
			ezfc_price_request_toggle(form_id, false);
			return false;
		}
		// summary
		else if (ezfc_form_vars[form_id].summary_enabled == 1 && ezfc_form_vars[form_id].summary_shown == 0) {
			submit_text = ezfc_form_vars[form_id].submit_text.summary;
		}
		// paypal
		else if (ezfc_form_vars[form_id].use_paypal == 1) {
			submit_text = ezfc_form_vars[form_id].submit_text.paypal;
		}
		// woocommerce
		else if (ezfc_form_vars[form_id].use_woocommerce == 1) {
			submit_text = ezfc_form_vars[form_id].submit_text.woocommerce;
		}
		// default text
		else {
			var is_paypal = false;

			// check is payment method is used
			var payment_method_element = $(form).find(".ezfc-element-wrapper-payment");
			if (payment_method_element.length > 0) {
				is_paypal = $(payment_method_element).find(":checked").data("value") == "paypal";
			}

			submit_text = is_paypal ? ezfc_form_vars[form_id].submit_text.paypal : ezfc_form_vars[form_id].submit_text.default;
		}

		$(form).find(".ezfc-submit").val(submit_text);
	}

	/**
		prevent enter key to trigger the click-event on step-buttons since pressing enter would submit the form and move a step backwards in the last step
	**/
	function ezfc_prevent_enter_step_listener($elements, $form) {
		// step prevent enter keypress
		$($elements).keypress(function(e) {
			// normalize
			var key = e.keyCode || e.which;

			if (e.which == 13) {
				ezfc_form_submit($form, -1);
				e.preventDefault();
			}
		});
	}

	/**
		js hooks for advanced customization purposes
	**/
	function ezfc_call_hook(hook_name, args) {
		var func = window[hook_name];

		if (typeof func !== "function") return;

		args = args || {};

		func(args);
	}

	/**
		debug
	**/
	function ezfc_remove_debug_info() {
		$(".ezfc-debug-info").remove();
	}

	function ezfc_add_debug_info(type, element, text) {
		if (ezfc_vars.debug_mode != 2) return;

		var id = $(element).attr("id");
		if (id) {
			id = id.split("ezfc_element-")[1];
		}

		var element_type = $(element).data("element");

		$(element).append("<pre class='ezfc-debug-info ezfc-debug-type-" + type + "'>[[" + element_type + " #" + id + "]]\n[" + type + "]\n" + text + "</pre>");

		console.log(text, element);
	}

	/**
		misc
	**/
	function jqueryui_date_diff(start, end) {
		if (!start || !end)  return 0;

		return (end - start) / 1000 / 60 / 60 / 24;
	}
});

// global functions for custom calculation codes
ezfc_functions = {};