jQuery(document).ready(function($) {
	/**
		ui
	**/
	$.fx.speeds._default = 200;
	if (typeof tinyMCE !== "undefined") {
		tinyMCE.init({
			plugins: "wordpress wplink",
			menubar: false
		});
	}

	// colorpicker
	$(".ezfc-element-colorpicker-input").wpColorPicker();

	// form builder vars
	ezfc_elements_data = [];
	ezfc_form_options = [];
	ezfc_z_index = 100000;
	form_changed = false;

	/**
		operator lists
	**/
	var ezfc_operators = [
		{ value: "0", text: " " },
		{ value: "add", text: "+" },
		{ value: "subtract", text: "-" },
		{ value: "multiply", text: "*" },
		{ value: "divide", text: "/" },
		{ value: "equals", text: "=" },
		{ value: "power", text: "^" },
		{ value: "floor", text: "floor" },
		{ value: "ceil", text: "ceil" },
		{ value: "round", text: "round" },
		{ value: "abs", text: "abs" },
		{ value: "subtotal", text: "subtotal" },
		{ value: "log", text: "log" },
		{ value: "log2", text: "log2" },
		{ value: "log10", text: "log10" }
	];

	var ezfc_operators_discount = [
		{ value: "0", text: " " },
		{ value: "add", text: "+" },
		{ value: "subtract", text: "-" },
		{ value: "percent_add", text: "%+" },
		{ value: "percent_sub", text: "%-" },
		{ value: "equals", text: "=" }
	];

	var ezfc_cond_operators = [
		{ value: "0", text: " " },
		{ value: "gr", text: ">" },
		{ value: "gre", text: ">=" },
		{ value: "less", text: "<" },
		{ value: "lesse", text: "<=" },
		{ value: "equals", text: "=" },
		{ value: "not", text: "not" },
		{ value: "between", text: "between" },
		{ value: "hidden", text: "is hidden" },
		{ value: "visible", text: "is visible" },
		{ value: "mod0", text: "%x = 0" },
		{ value: "mod1", text: "%x != 0" },
		{ value: "bit_and", text: "bitwise AND" },
		{ value: "bit_or", text: "bitwise OR" },
		{ value: "empty", text: "empty" },
		{ value: "notempty", text: "not empty" },
		{ value: "in", text: "in" }
	];

	var ezfc_cond_actions = [
		{ value: "0", text: " " },
		{ value: "show", text: "Show" },
		{ value: "hide", text: "Hide" },
		{ value: "set", text: "Set" },
		{ value: "activate", text: "Activate" },
		{ value: "deactivate", text: "Deactivate" },
		{ value: "redirect", text: "Redirect" },
		{ value: "step_goto", text: "Go to step" },
		{ value: "step_next", text: "Next step" },
		{ value: "step_prev", text: "Previous step" }
	];

	var ezfc_set_operators = [
		{ value: "min", text: "Minimum" },
		{ value: "max", text: "Maximum" },
		{ value: "avg", text: "Average" },
		{ value: "sum", text: "Sum" },
		{ value: "dif", text: "Difference" },
		{ value: "prod", text: "Product" },
		{ value: "quot", text: "Quotient" }
	];

	// tabs
	$("#tabs").tabs();
	// accordion
	$(".ezfc-accordion").accordion({
		heightStyle: "content"
	});

	// dialogs
	var dialog_default_attr = {
		autoOpen: false,
		height: Math.min(800, $(window).height() - 200),
		width: Math.min(1200, $(window).width() - 200),
		modal: true
	};

	var dialog_options_buttons = {
		buttons: {
			"Update options": function() {
				$(".ezfc-option-save").click();
			},
			"Close": function() {
				$(this).dialog("close");
			}
		}
	};

	var dialog_import_buttons = {
		buttons: {
			"Import text data": function() {
				$("[data-action='form_import_data']").click();
			},
			"Close": function() {
				$(this).dialog("close");
			}
		}
	};

	var dialog_default_buttons = {
		buttons: {
			"Close": function() {
				$(this).dialog("close");
			}
		}
	}

	$(".ezfc-options-dialog").dialog($.extend(dialog_default_attr, dialog_options_buttons));
	$(".ezfc-import-dialog").dialog($.extend(dialog_default_attr, dialog_import_buttons));
	$(".ezfc-default-dialog").dialog($.extend(dialog_default_attr, dialog_default_buttons));

	// ajax actions
	$(document).on("click", "[data-action]", function() {
		if ($(this).data("action") == "form_get" && form_changed) {
			if (!confirm(ezfc_vars.form_changed)) {
				$(".ezfc-loading").hide();
				return false;
			}
		}

		var selectgroup = $(this).data("selectgroup");
		if (selectgroup) {
			$(".button-primary[data-selectgroup='" + selectgroup + "']").removeClass("button-primary");
			$(this).addClass("button-primary");
		}

		do_action($(this));

		return false;
	});

	// toggle form element data
	$(document).on("click", ".ezfc-form-element-name, .ezfc-form-element-close-data", function() {
		var $parent_el = $(this).closest(".ezfc-form-element");
		var form_element_data = $parent_el.find("> .ezfc-form-element-data");

		maybe_add_data_element($parent_el);

		// toggle element data and increase z-index
		form_element_data.toggle().css("z-index", ++ezfc_z_index);

		if (ezfc_vars.editor.use_large_data_editor == 1) {
			var $modal = $("#ezfc-element-data-modal");
			if ($modal.is(":visible")) $modal.fadeOut();
			else $modal.fadeIn();
		}

		custom_trigger_change(form_element_data);
		init_tooltips();

		return false;
	});
	// toggle form element data via modal
	$(document).on("click", "#ezfc-element-data-modal", function() {
		ezfc_builder_functions.close_data_dialog();
	});
	// toggle form element data via modal (via escape)
	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
			ezfc_builder_functions.close_data_dialog();
		}
	});


	// toggle submission data
	$(document).on("click", ".ezfc-form-submission-name", function() {
		$(this).parent().find(".ezfc-form-submission-data").toggle();
	});

	// image upload
	$(document).on("click", ".ezfc-image-upload", function(e) {
		e.preventDefault();

		var file_frame;
		var _this = this;

	    file_frame = wp.media.frames.file_frame = wp.media({
	      title: jQuery( this ).data( 'uploader_title' ),
	      button: {
	        text: jQuery( this ).data( 'uploader_button_text' ),
	      },
	      multiple: false
	    });
	 
	    file_frame.on( 'select', function() {
	    	var attachment = file_frame.state().get('selection').first().toJSON();
	    	$(_this).parent().find("input").val(attachment.url);
	    	$(_this).parent().find(".ezfc-image-preview").attr("src", attachment.url);
	    });
	 
	    file_frame.open();
    });
    // clear image
    $(document).on("click", ".ezfc-clear-image", function() {
    	var $parent = $(this).parent();

    	$parent.find("input").val("");
    	$parent.find("img").attr("src", "");

    	return false;
    });

	// add option
	$(document).on("click", ".ezfc-form-element-option-add", function() {
		form_changed = true;

		var $option_container = $(this).closest(".row").find($(".ezfc-form-element-option-container"));
		var target_element_id = $(this).data("element_id");
		var $target           = $option_container.find(".ezfc-form-element-option:last");
		var target_row_new    = $option_container.find(".ezfc-form-element-option").length;

		$target.clone()
			.insertAfter($target)
			.find("input, select, textarea").each(function() {
				var option_array = $(this).attr("name").replace(/\]/g, "").split("[");
				// duplicate array
				var option_array_tmp = option_array.slice();

				var option_type = option_array[2];
				var option_name = option_array.splice(-1);
				var option_name_new;
				var option_value = parseInt($(this).val());

				if ($(this).attr("type") == "radio" || option_name == "preselect_container") {
					option_name_new = "elements[" + target_element_id + "][" + option_name + "]";

					$(this).val(option_value + 1);
				}
				// can be improved though it works this way
				else if (option_array_tmp.length == 6) {
					option_name_new = "elements[" + target_element_id + "][" + option_type + "][" + target_row_new + "][" + option_array_tmp[4] + "][" + option_array_tmp[5] + "]";
				}
				else {
					option_name_new = "elements[" + target_element_id + "][" + option_type + "][" + target_row_new + "][" + option_name + "]";
				}

				// increase value field
				if (option_name == "value" && !isNaN(option_value)) {
					$(this).val(option_value + 1);
				}

				$(this).attr("name", option_name_new);
			});

		custom_trigger_change($(this).closest(".ezfc-form-element-data"));

		return false;
	});
	// delete option
	$(document).on("click", ".ezfc-form-element-option-delete", function() {
		var $self      = $(this).closest(".ezfc-form-element-option");
		var $target    = $(this).closest(".ezfc-option-container");
		
		var target_children = $target.find("> .ezfc-form-element-option").length;

		if (target_children <= 1) {
			$target.find(":input").val("");
		}
		else {
			$self.remove();
		}

		return false;
	});

	// move option fields
	$(document).on("click", ".ezfc-form-element-move", function() {
		var target_selector = $(this).data("target");
		var target = $(this).closest(target_selector);
		var target_swap;

		// move up
		if ($(this).hasClass("ezfc-form-element-move-up")) {
			if ($(target).prev(target_selector).length < 1) return false;
			
			target_swap = $(target).prev(target_selector);

			$(target).slideUp(function() {
				$(target).after($(target).prev(target_selector)).slideDown();
			});
		}
		// move down
		else {
			if ($(target).next(target_selector).length < 1) return false;

			target_swap = $(target).next(target_selector);

			$(target).slideUp(function() {
				$(target).before($(target).next(target_selector)).slideDown();
			});
		}

		// change input fields
		$(target).find("select, input").each(function() {
			var input_class = $(this).attr("class");
			var input_name  = $(this).attr("name");

			var input_swap_name = $(target_swap).find("[class='" + input_class + "']").attr("name");

			$(this).attr("name", input_swap_name);
			$(target_swap).find("[class='" + input_class + "']").attr("name", input_name);
		});

		// change preselect value
		var $preselect_element      = $(target).find("input[name*='preselect']");
		var $preselect_element_swap = $(target_swap).find("input[name*='preselect']");
		if ($preselect_element && $preselect_element_swap && $preselect_element.attr("type")) {
			var preselect_value      = $preselect_element.val();
			var preselect_value_swap = $preselect_element_swap.val();

			$preselect_element.val(preselect_value_swap);
			$preselect_element_swap.val(preselect_value);
		}

		return false;
	});

	// restrict calculation target / value field
	var trigger_change_classes = ".ezfc-form-element-calculate-target, .ezfc-form-element-calculate-operator, .ezfc-form-element-conditional-action";
	$(document).on("change", trigger_change_classes, function() {
		custom_trigger_change($(this).closest(".ezfc-form-element-data"));
	});

	// refresh calculation fields
	$(document).on("click", ".ezfc-form-calculate-refresh", function() {
		fill_calculate_fields(false, true);

		return false;
	});

	// label name keyboard input
	$(document).on("keyup", ".ezfc-form-element-data .element-label-listener", function() {
		var text = $(this).val();

		$(this).closest(".ezfc-form-element").find("> .ezfc-form-element-name .element-label").text(text);
	});

	// add changed class upon change
	$(document).on("keyup change", ".ezfc-form-element-data input, .ezfc-form-element-data select", function() {
		ezfc_form_has_changed(this);
	});
	// add changed class when options were added / removed
	$(document).on("click", ".ezfc-form-element-data button:not(.ezfc-form-element-close-data)", function() {
		ezfc_form_has_changed(this);
	});

	// required toggle char
	$(document).on("click", ".ezfc-form-element-required-toggle", function() {
		form_changed = true;

		var req_char = $(this).val()==1 ? "*" : "";
		$(this).closest(".ezfc-form-element").find(".ezfc-form-element-required-char").text(req_char);
	});

	// preview suppress submit
	$(document).on("click", "form .ezfc-element-submit", function() {
		return false;
	});

	// column change
	$(document).on("click", ".ezfc-form-element-column-left", function() {
		maybe_add_data_element($(this).closest(".ezfc-form-element"));

		change_columns($(this), -1);
		return false;
	});
	$(document).on("click", ".ezfc-form-element-column-right", function() {
		maybe_add_data_element($(this).closest(".ezfc-form-element"));

		change_columns($(this), 1);
		return false;
	});

	// group toggle
	$(document).on("click", ".ezfc-form-element-group-toggle", function() {
		$(this).closest(".ezfc-form-element").find("> .ezfc-group").toggle();

		var icon_set = ["fa-toggle-up", "fa-toggle-down"];

		var $group_icon_el = $(this).find(".fa");
		var old_icon       = $group_icon_el.hasClass(icon_set[0]) ? icon_set[0] : icon_set[1];
		var set_icon       = old_icon == icon_set[0] ? icon_set[1] : icon_set[0];
		
		$group_icon_el.removeClass(old_icon).addClass(set_icon);
		return false;
	});

	// tinymce toggle
	$(document).on("click", ".ezfc-html-tinymce-toggle", function() {
		if (typeof tinyMCE !== "undefined" && typeof tinyMCE.execCommand === "function") {
			var target = $(this).data("target");
			tinymce.execCommand("mceToggleEditor", false, target);
		}

		return false;
	});

	// icon dialog
	$(document).on("click", ".ezfc-icon-button", function() {
		icon_target = $(this).data("target");
		$(".ezfc-icons-dialog").dialog("open");

		return false;
	});
	$(".ezfc-icons-dialog i").on("click", function() {
		var icon = $(this).data("icon");
		
		$("#" + icon_target).val(icon);
		$("#" + icon_target + "-icon").attr("class", "fa " + icon);

		$(".ezfc-icons-dialog").dialog("close");
	});

	// image dialog
	$(document).on("click", ".ezfc-option-image-button", function(e) {
		e.preventDefault();

		var file_frame;
		var _this = this;

	    file_frame = wp.media.frames.file_frame = wp.media({
	      title: jQuery( this ).data( 'uploader_title' ),
	      button: {
	        text: jQuery( this ).data( 'uploader_button_text' ),
	      },
	      multiple: false
	    });
	 
	    file_frame.on( 'select', function() {
	    	var attachment = file_frame.state().get('selection').first().toJSON();
	    	$(_this).parent().find("input").val(attachment.url);
	    	$(_this).parent().find(".ezfc-option-image-placeholder").attr("src", attachment.url);
	    });
	 
	    file_frame.open();

		return false;
	});
	// image remove
	$(document).on("click", ".ezfc-option-image-remove", function() {
		$(this).siblings(".ezfc-form-element-option-image").val("");
		$(this).siblings(".ezfc-option-image-placeholder").attr("src", "");

		return false;
	});

	// functions help dialog
	$(document).on("click", ".ezfc-open-function-dialog", function() {
		$("#ezfc-custom-calculation-functions").dialog("open");
		
		return false;
	});

	// toggle
	$(document).on("click", "[data-toggle]", function() {
		var $target = $($(this).data("toggle"));
		if ($target.length < 1) return;

		if ($target.hasClass("ezfc-hidden")) $target.removeClass("ezfc-hidden");
		else $target.addClass("ezfc-hidden");
	});

	// custom func
	$(document).on("click", "[data-func]", function() {
		var function_name = $(this).data("func");

		if (typeof ezfc_builder_functions[function_name] !== "function") return false;

		var args = $(this).data("args");

		ezfc_builder_functions[function_name](this, args);
		return false;
	});

	/**
		import data via file
	**/
	if ($("#ezfc_import_file").length > 0) {
		var import_btn          = $(".ezfc-import-upload");
		var import_message_el   = $("#ezfc-import-message");
		var import_progress_bar = import_btn.siblings(".ezfc-bar");

		$("#ezfc_import_file").fileupload({
			formData: {
				action: "ezfc_backend",
				data: "action=form_import_upload&nonce=" + ezfc_nonce
			},
		    add: function (e, data) {
		    	data.submit();

		    	$(".ezfc-loading").fadeIn();
	        },
	        done: function (e, data) {
	        	import_message_el.text("");
	        	import_progress_bar.css("width", 0).text("");
	        	$(this).val("");

	        	if (data.result.error) {
	        		import_message_el.text(data.result.error);

	        		return false;
	        	}

	        	var result_json = $.parseJSON(data.result);

	        	form_add(result_json);
				form_show(result_json);

				$(".ezfc-dialog").dialog("close");
		        $(".ezfc-loading").fadeOut();
	        },
	        progressall: function (e, data) {
		        var progress = parseInt(data.loaded / data.total * 100, 10);
		        import_progress_bar.css("width", progress + "%").text("Importing...");
		    },
		    replaceFileInput: false,
	        url: ajaxurl
		});
	}

	/**
		ui functions
	**/
	function init_ui() {
		// groups
		var sortable_options = {
			connectWith: ".ezfc-group",
			distance: 5,
			forcePlaceholderSize: true,
			handle: ".ezfc-form-element-name",
			placeholder: "ui-state-highlight",
			stop: function(ev, ui) {
				var $item = $(ui.item[0]);

				var index = $item.index("li");

				// not dropped
				if (index < 0) {
					return false;
				}

				// closest but exclude self first
				var group_id = $item.parent().closest(".ezfc-form-element-group").data("id") || 0;
				if ($item.data("id") == group_id) return;

				var $element_wrapper = $item.closest(".ezfc-form-element");
				maybe_add_data_element($element_wrapper);

				// set group id value to element
				$element_wrapper.find("[data-element-name='group_id']").val(group_id);
			}
		}

		// sortable elements (main view)
		$("#form-elements-list").sortable(sortable_options);
		// group list
		$(".ezfc-group").sortable($.extend(sortable_options, { connectWith: "#form-elements-list,.ezfc-group" }));

		// put elements into groups
		$("#form-elements-list .ezfc-form-element").each(function() {
			var id       = $(this).data("id");
			var group_id = $(this).data("group_id");

			if (!group_id || group_id < 1) return;

			var $group_target = $(".ezfc-form-element[data-id='" + group_id + "']");

			// check if group_id contains itself due to a bug in previous versions
			if ($group_target.data("group_id") == id) return;

			var $group_list = $group_target.find("> .ezfc-group");

			// check if group element exists
			if (!$group_list || $group_list.length < 1) return;

			$(this).appendTo($group_list);
		});

		// draggable elements (add elements)
		$(".ezfc-elements-add .ezfc-elements li").draggable({
			connectToSortable: "#form-elements-list,.ezfc-group",
			helper: "clone",
			start: function(ev, ui) {
				$(ui.helper[0]).attr("id", "ezfc-element-drag-placeholder");
			},
			stop: function(ev, ui) {
				var $item = $(ui.helper[0]);

				var dropped = $item.parents("#form-elements-list").length > 0;
				// check if item was actually dropped in the form elements list
				if (!dropped) {
					$item.remove();
					// do not return false since this would stop the user to being unable to drag the element again
				}
				// dropped in form list -> add element to form
				else {
					var item_count = $("#form-elements-list li").length - 1;
					//var index = item_count - $item.index("#form-elements-list li");
					var index = item_count - $item.index("li");

					// closest but exclude self first
					var $parent_group = $item.parent().closest(".ezfc-form-element-group");
					var group_id      = $parent_group.length ? $parent_group.data("id") : 0;

					//do_action
					do_action($item, { position: index, group_id: group_id });

					// hide first
					$("#ezfc-element-drag-placeholder").html("<i class='fa fa-cog fa-spin'></i>");
				}
			}
		});

		// remove tinymce editors from html elements
		if (typeof tinyMCE !== "undefined" && typeof tinyMCE.execCommand === "function") {
			$(".ezfc-html").each(function() {
				tinyMCE.execCommand("mceRemoveEditor", false, $(this).attr("id"));
			});
		}

		// spinner
		$(".ezfc-spinner").spinner();

		init_tooltips();
	}

	function init_tooltips() {
		$(".ezfc-elements-show [data-ot]").each(function(i, el) {
			$(el).opentip($(el).data("ot"), {
				fixed: true,
				tipJoint: "bottom"
			});
		});
	}

	function maybe_add_data_element($dom_element) {
		var $form_element_data = $dom_element.find("> .ezfc-form-element-data:not(.ezfc-form-element-has-data)");

		// create element input values
		$form_element_data.addClass("ezfc-form-element-has-data");

		var element_id = $dom_element.data("id");

		// data not available or already added
		if (!ezfc_current_form_elements[element_id]) return;

		var current_form_element = ezfc_current_form_elements[element_id];
		var element_html = "";
		
		if (ezfc.elements[current_form_element.e_id].type == "fileupload") {
			element_html += "<p>" + ezfc_vars.texts.fileupload_conditional + "</p>";
		}

		element_html += element_add_html(current_form_element);

		// delete "noupdate" flag
		$form_element_data.find(".noupdate-flag").remove();

		// append form element data
		$form_element_data.append(element_html);

		// re-fill list of elements
		fill_calculate_fields();
	}

	// restrict certain fields upon change
	function custom_trigger_change(element) {
		// calculation target / value field
		var calculate_wrapper = $(element).find(".ezfc-form-element-calculate-wrapper");

		$(calculate_wrapper).each(function(i, cw) {
			var selected_operator = $(cw).find(".ezfc-form-element-calculate-operator :selected").val();
			var selected_target   = $(cw).find(".ezfc-form-element-calculate-target");
			var selected_value    = $(cw).find(".ezfc-form-element-calculate-value");

			// if ceil/floor/round was selected, disable target element + value
			var disable_element_value_operators = ["floor", "ceil", "round", "abs", "subtotal"];
			if ($.inArray(selected_operator, disable_element_value_operators) > -1) {
				selected_target.attr("disabled", "disabled");
				selected_value.attr("disabled", "disabled");
			}
			else {
				selected_target.removeAttr("disabled");
				selected_value.removeAttr("disabled");

				if (selected_target.val() == 0) {
					selected_value.removeAttr("disabled");
				}
				else {
					selected_value.attr("disabled", "disabled");
				}
			}
		});

		// conditional target value
		var conditional_wrapper = $(element).find(".ezfc-form-element-conditional-wrapper");

		$(conditional_wrapper).each(function(i, cw) {
			var selected_action     = $(cw).find(".ezfc-form-element-conditional-action :selected").val();
			var target_value_object = $(cw).find(".ezfc-form-element-conditional-target-value");
			var redirect_wrapper    = $(cw).find(".ezfc-conditional-redirect-wrapper");

			// if 'set' was selected, enable target value field
			if (selected_action == "set") {
				target_value_object.removeAttr("disabled");
			}
			else {
				target_value_object.attr("disabled", "disabled");
			}

			// show form field
			if (selected_action == "redirect") {
				redirect_wrapper.removeClass("ezfc-hidden");
			}
			else {
				redirect_wrapper.addClass("ezfc-hidden");
			}
		});

		// add visual editor to html fields
		var html_id = $(element).find("textarea.ezfc-html").attr("id");

		if (typeof tinyMCE !== "undefined" && typeof tinyMCE.execCommand === "function") {
			tinyMCE.execCommand("mceAddEditor", false, html_id);
		}
	}

	/**
		forms
	**/
	// add form
	function form_add(data) {
		var html = "";
		html += "<li class='button ezfc-form' data-id='" + data.form.id + "' data-action='form_get' data-selectgroup='forms'>";
		html += "	<i class='fa fa-fw fa-list-alt'></i> ";
		html += 	data.form.id + " - ";
		html += "	<span class='ezfc-form-name'>" + data.form.name + "</span>";
		html += "</li>";

		$(".ezfc-forms-list").append(html);

		$(".ezfc-form.button-primary").removeClass("button-primary");
		$(".ezfc-form[data-id='" + data.form.id + "']").addClass("button-primary");

		form_show(data);
	}

	function form_clear() {
		$(".ezfc-form-element").remove();
	}

	function form_delete(id) {
		$(".ezfc-form-elements-actions, .ezfc-form-elements-container, .ezfc-form-options-wrapper").addClass("ezfc-hidden");
		$(".ezfc-form[data-id='" + id + "']").remove();
	}

	function form_file_delete(id) {
		$(".ezfc-form-file[data-id='" + id + "']").remove();
	}

	// show single form
	function form_show(data) {
		form_changed = false;
		ezfc_fill_elements_html = -1;
		ezfc_fill_elements_filtered_html = -1;

		if (data) {
			form_show_elements(data.elements);

			$("#ezfc-form-save, #ezfc-form-delete, #ezfc-form-clear").data("id", data.form.id);
			$("#ezfc-shortcode-id").val("[ezfc id='" + data.form.id + "' /]");
			$("#ezfc-shortcode-name").val("[ezfc name='" + data.form.name + "' /]");
			$("#ezfc-form-name").val(ezfc_stripslashes(data.form.name).replace(/&apos;/g, "'"));

			// calculate fields
			fill_calculate_fields();

			// populate form option fields
			form_show_options(data.options);

			// set submission entries
			var submissions_count = 0;
			if (typeof data.submissions_count !== "undefined") submissions_count = data.submissions_count;
			$("#ezfc-form-submissions-count").text(submissions_count);

			// grid
			var grid_12 = parseInt(ezfc_get_form_option_value("grid_12"));
			var grid_css = grid_12 ? "ezfc-grid-12" : "ezfc-grid-6";

			$("#form-elements-list").removeClass("ezfc-grid-6 ezfc-grid-12").addClass(grid_css);
		}

		$(".ezfc-form-submissions").addClass("ezfc-hidden");
		$(".ezfc-form-elements-actions, .ezfc-form-elements-container, .ezfc-form-options-wrapper").removeClass("ezfc-hidden");

		// scroll to form
		var $selected_form = $(".ezfc-forms-list .button-primary");
		$(".ezfc-forms-list").animate({ scrollTop: $selected_form.scrollHeight }, "slow");

		elements_add_div     = $("#ezfc-elements-add");
		elements_add_div_top = elements_add_div.offset().top;

		init_ui();
		change_columns();
	}

	/**
		show form elements
	**/
	function form_show_elements(elements, append) {
		var append = append || false;
		var out = [];

		if (!append || typeof ezfc_current_form_elements === "undefined") {
			ezfc_current_form_elements = {};
		}

		if (elements && elements.length > 0) {
			$.each(elements, function(i, element) {
				out.push(element_add(element));
			});
		}

		if (append) {
			$(".ezfc-form-elements").append(out.join(""));
		}
		else {
			$(".ezfc-form-elements").html(out.join(""));	
		}

		fill_calculate_fields(true, true);
		init_ui();
	}

	/**
		show form options
	**/
	function form_show_options(options) {
		ezfc_form_options = options;

		$.each(options, function(i, v) {
			var option_row = "#ezfc-table-option-" + v.id;
			var target = "#opt-" + v.id;

			switch (v.type) {
				case "bool_text":
					if (!v.value) {
						v.value = {
							enabled: 0,
							text: ""
						}
					}

					$(option_row + " select option[value='" + v.value.enabled + "']").attr("selected", "selected");
    				$(option_row + " input").val(v.value.text);
				break;

    			case "border":
    				if (!v.value) {
    					v.value = {
    						color: "",
    						width: "",
    						style: "",
    						radius: ""
    					};
    				}

    				$(option_row + " .ezfc-element-border-color").val(v.value.color).trigger("change");
    				$(option_row + " .ezfc-element-border-width").val(v.value.width);
    				$(option_row + " .ezfc-element-border-style option[value='" + v.value.style + "']").attr("selected", "selected");
    				$(option_row + " .ezfc-element-border-radius").val(v.value.radius);

    				if (v.value.transparent) {
    					$(option_row + " .ezfc-element-border-transparent").attr("checked", "checked");
    				}
    			break;

    			case "colorpicker":
    				if (!v.value) {
    					v.value = {
    						color: "",
    						transparent: false
    					};
    				}

    				$(option_row + " .ezfc-element-colorpicker-input").val(v.value.color).trigger("change");
    				
    				if (v.value.transparent) {
    					$(option_row + " .ezfc-element-colorpicker-transparent").attr("checked", "checked");
    				}
    			break;

    			case "dimensions":
    				if (!v.value) {
    					v.value = {
    						value: "",
    						unit: ""
    					};
    				}

    				$(option_row + " input").val(v.value.value);
    				$(option_row + " select option[value='" + v.value.unit + "']").attr("selected", "selected");
    			break;

    			case "editor":
    				// visual editor
    				try {
    					$("#editor_" + v.id + "_ifr").contents().find("body").html(nl2br(v.value));
    				}
    				catch (e) {
    					$("#editor_" + v.id + "_ifr").contents().find("body").text(nl2br(v.value));	
    				}

    				// textarea
    				$("#editor_" + v.id).val(v.value);
    			break;

    			case "image":
    				$(option_row + " .ezfc-image-upload-hidden").val(v.value);
    				$(option_row + " img").attr("src", v.value);
    			break;

    			case "lang":
    			case "yesno":
    				$(target + " option").removeAttr("selected");
    				$(target + " option[value='" + v.value + "']").attr("selected", "selected");
    			break;   			

    			default:
    				$(target).val(v.value);
    			break;
    		}
		});
	}

	// show form submissions
	function form_show_submissions(submissions) {
		// no submissions
		if (!submissions) {
			submissions = { submissions: [] };
		}
		
		// update counter
		$(".ezfc-forms-list .button-primary .ezfc-submission-counter").text(submissions.submissions.length);

		form_changed = false;
		var out = "<ul>";

		$.each(submissions.submissions, function(i, submission) {
			var date    = ezfc_parse_date(submission.date);
			var addIcon = "";

			if (submission.payment_id == 1) {
				addIcon += " <i class='fa fa-fw fa-paypal' data-ot='PayPal used'></i>";

				if (submission.transaction_id.length>0) addIcon += " <i class='fa fa-fw fa-check' data-ot='Payment verified.'></i>";
				else addIcon += " <i class='fa fa-fw fa-times' data-ot='Payment denied or cancelled'></i>";
			}

			out += "<li class='ezfc-form-submission' data-id='" + submission.id + "'>";
			out += "	<div class='ezfc-form-submission-name'>";
			out += "		<i class='fa fa-fw fa-envelope'></i>" + addIcon + " ID: " + submission.id + " - " + date.toUTCString();
			out += "		<button class='ezfc-form-submission-delete button' data-action='form_submission_delete' data-id='" + submission.id + "'><i class='fa fa-times'></i></button>";
			out += "	</div>";

			// additional data (toggle)
			out += "	<div class='ezfc-form-submission-data hidden'>";

			// paypal info
			if (submission.payment_id == 1) {
				out += "<div>";
				out += "	<p><strong>Paid with Paypal</strong></p>";
				out += "	<p>Transaction-ID: " + submission.transaction_id;
				out += "</div>";
			}

			out += submission.content;

			// files
			if (submissions.files[submission.ref_id]) {
				out += "	<div class='ezfc-form-files'>";
				out += "		<p>Files</p>";

				$.each(submissions.files[submission.ref_id], function(fi, file) {
					var filename = file.url.split("/").slice(-1);

					out += "	<ul>";
					out += "		<li class='ezfc-form-file' data-id='" + file.id + "'>";
					out += "			<a href='" + file.url + "'>" + filename + "</a>";
					out += "			<button class='ezfc-form-file-delete button' data-action='form_file_delete' data-id='" + file.id + "'><i class='fa fa-times'></i></button>";
					out += "	</li>";
					out += "	</ul>";
				});

				out += "	</div>";
			}

			// resend admin
			//out += "<button class='ezfc-submission-resend-admin' data-action='submission_resend_admin' data-id='" + submission.id + "'>Send to admin</button> &nbsp;";
			// resend customer
			//out += "<button class='ezfc-submission-resend-customer' data-action='submission_resend_admin' data-id='" + submission.id + "'>Send to customer</button>";

			out += "</li>";
		});

		out += "</ul>";

		$(".ezfc-form-submissions").removeClass("ezfc-hidden").html(out);
		$(".ezfc-form-elements-container, .ezfc-form-options-wrapper").addClass("ezfc-hidden");

		// meh
		$(".ezfc-form-submission-data h2").remove();
	}

	// add element
	function element_add(element) {
		// add to current form elements
		ezfc_current_form_elements[element.id] = element;

		// form element data
		var data_el = $.parseJSON(element.data);

		// use large element data editor
		var data_editor_class = ezfc_vars.editor.use_large_data_editor == 1 ? "ezfc-form-element-data-fixed" : "";

		if (!data_el) {
			var ret_error = "";
			ret_error += "<li class='ezfc-form-element ezfc-form-element-error ezfc-col-6'>";
			ret_error += "    <div class='ezfc-form-element-name'>Corrupt element";
			ret_error += "        <button class='ezfc-form-element-delete button' data-action='form_element_delete' data-id='" + element.id + "'><i class='fa fa-times'></i></button>";
			ret_error += "    </div>";
			ret_error += "    <div class='container-fluid ezfc-form-element-data ezfc-form-element-input hidden " + data_editor_class + "'>";

			if (typeof element === "object") {
				ret_error += "        <p>" + JSON.stringify(element) + "</p>";
			}
			
			ret_error += "    </div>";
			ret_error += "</li>";

			return ret_error;
		}

		ezfc_current_form_elements[element.id].data_json = data_el;

		var columns             = data_el.columns ? data_el.columns : 6;
		var element_name_header = data_el.label ? data_el.label : data_el.name;
		var group_id            = data_el.group_id ? data_el.group_id : 0;
		var req_char            = (typeof data_el.required !== "undefined" && data_el.required == 1) ? "*" : "";
		var html                = [];
		var is_extension        = false;
		var extension_id        = "";

		// data wrapper for inbuilt / extension elements
		var data_element_wrapper = get_element_data_wrapper(element);

		// add extension field
		if (data_element_wrapper.hasOwnProperty("ext")) {
			html.push("<input type='hidden' value='" + data_element_wrapper.id + "' name='elements[" + element.id + "][extension]' />");
		}

		// put element id into every element (necessary)
		html.push("<input type='hidden' class='ezfc-form-element-e_id' value='" + element.e_id + "' name='elements[" + element.id + "][e_id]' />");
		// input flag that this element was not changed (will be deleted when the element is opened)
		html.push("<input type='hidden' class='noupdate-flag' value='1' name='elements[" + element.id + "][__noupdate__]' />");

		var out = "";

		// element label
		var element_label = " - <span class='element-label'>" + element_name_header + "</span>";

		out += "<li class='ezfc-form-element ezfc-cat-" + data_element_wrapper.category + " ezfc-form-element-" + data_element_wrapper.type + " ezfc-col-" + columns + "' data-columns='" + columns + "' data-id='" + element.id + "' data-group_id='" + group_id + "'>";
		out += "	<div class='ezfc-form-element-name'>";
		
		// group buttons
		if (data_element_wrapper.type == "group") {
			out += "	<button class='ezfc-form-element-action ezfc-form-element-group-toggle button'><i class='fa fa-toggle-up'></i></button>";
		}

		// column buttons
		out += "		<button class='ezfc-form-element-action ezfc-form-element-column-left button'><i class='fa fa-toggle-left'></i></button>";
		out += "		<button class='ezfc-form-element-action ezfc-form-element-column-right button'><i class='fa fa-toggle-right'></i></button>";

		// element info
		var element_info = "ID: " + element.id;
		var element_info_add = "";
		// calculation icon
		if (ezfc_builder_functions.element_has_calculation(element.data_json)) {
			element_info_add += "&nbsp;" + get_tip("Calculation", "fa-calculator");
		}
		// conditional icon
		if (ezfc_builder_functions.element_has_condition(element.data_json)) {
			element_info_add += "&nbsp;" + get_tip("Condition", "fa-chain");
		}
		// discount icon
		if (ezfc_builder_functions.element_has_discount(element.data_json)) {
			element_info_add += "&nbsp;" + get_tip("Discount", "fa-percent");
		}
		// add separator
		if (element_info_add.length > 0) {
			element_info += " | " + element_info_add;
		}

		// more element info
		out += "        <span class='ezfc-form-element-info'>" + element_info + " |</span>";
		out += "		<span class='fa fa-fw " + data_element_wrapper.icon + "'></span>";
		out += "		<span class='ezfc-form-element-required-char'>" + req_char + "</span> ";
		out += "		<span class='ezfc-form-element-type'>" + data_element_wrapper.name + "</span> " + element_label;

		// duplicate element button
		if (data_element_wrapper.type != "group") {
			out += "		<button class='ezfc-form-element-duplicate button' data-action='form_element_duplicate' data-id='" + element.id + "'><i class='fa fa-files-o' data-ot='Duplicate element'></i></button>";
		}

		// delete element button
		out += "		<button class='ezfc-form-element-delete button' data-action='form_element_delete' data-id='" + element.id + "'><i class='fa fa-times'></i></button>";
		out += "		</div>";
		out += "	<div class='container-fluid ezfc-form-element-data " + data_editor_class + " ezfc-form-element-" + data_element_wrapper.name.replace(" ", "-").toLowerCase() + " hidden'>" + html.join("") + "</div>";

		// close element data button left side
		if (ezfc_vars.editor.use_large_data_editor == 1) {
			out += "<button class='ezfc-form-element-close-data ezfc-form-element-close-data-fixed-left ezfc-hidden'><i class='fa fa-chevron-right'></i></button>";
		}

		// group suffix
		if (data_element_wrapper.type == "group") {
			out += "<ul class='ezfc-group'></ul>";
		}

		out += "</li>";

		return out;
	}

	function element_add_html(element) {
		// form element data
		var data_el = $.parseJSON(element.data);
		// output array
		var html = [];

		// get element data wrapper
		var data_element_wrapper = get_element_data_wrapper(element);

		var advanced_actions = "<div class='ezfc-form-element-advanced-actions'>";

		if (ezfc.elements[element.e_id].type != "group") {
			// change element
			advanced_actions += "	<button class='ezfc-form-element-change button' data-func='change_element_dialog' data-args='" + element.id + "'><i class='fa fa-exchange'></i> " + ezfc_vars.texts.change_element + "</button>";
		}

		// close button
		advanced_actions += "	<button class='ezfc-form-element-close-data button pull-right'>" + get_tip("Close data", "fa-times") + "</button>";

		advanced_actions += "</div>";
		html.push(advanced_actions);

		$.each(data_el, function(name, value) {
			// skip id
			if (name == "e_id" || name == "preselect" || name == "extension") return;

			var input_id   = "elements-" + name + "-" + element.id;
			var input_raw  = "elements[" + element.id + "]";
			var input_name = "elements[" + element.id + "][" + name + "]";

			var input = "";

			// replace &apos;
			value = ezfc_sanitize_value(value);

			input += "<input type='text' value='" + value + "' name='" + input_name + "' data-element-name='" + name + "' id='" + input_id + "' />";

			var el_description = ezfc_get_element_option_description(name);

			switch (name) {
				case "columns":
					columns = value;
					html.push("<input name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "' type='hidden' value='" + value + "' />");
					// skip because we don't want this field to be displayed
					return;
				break;

				case "group_id":
					html.push("<input class='ezfc-form-group-id' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "' type='hidden' value='" + value + "' />");
					// skip because we don't want this field to be displayed
					return;
				break;

				case "name":
					var data_class = (data_element_wrapper.type=="group" || data_element_wrapper.type=="html" || data_element_wrapper.type=="placeholder" || data_element_wrapper.type=="spacer" || data_element_wrapper.type=="stepstart" || data_element_wrapper.type=="stepend") ? "element-label-listener" : "";

					input = "<input class='" + data_class + "' type='text' value='" + value + "' name='" + input_name + "' data-element-name='" + name + "' id='" + input_id + "' />";
					element_name_header = value;
				break;

				case "label":
					var data_class = (data_element_wrapper.type!="group" && data_element_wrapper.type!="html") ? "element-label-listener" : "";

					input = "<input class='" + data_class + "' type='text' value='" + value + "' name='" + input_name + "' data-element-name='" + name + "' id='" + input_id + "' />";
					element_name_header = value;
				break;

				case "html":
					var html_class = "";

					if (ezfc_vars.editor.use_tinymce == 1) {
						html_class = "ezfc-html";

						// wp tinymce hack (next version)
						input = '<div class="wp-editor-tools hide-if-no-js"><div class="wp-media-buttons">';
						input += '<a href="#" id="insert-media-button" class="button insert-media add_media" data-editor="' + input_id + '" title="Add Media"><span class="wp-media-buttons-icon"></span> Add Media</a>';
						input += "<button class='button ezfc-html-tinymce-toggle' data-target='" + input_id + "'>Toggle view</button>";
						input += '</div></div>';

						input += "<textarea class='" + html_class + "' name='" + input_name + "' id='" + input_id + "'>" + ezfc_stripslashes(value) + "</textarea>";
					}
					else {
						input = "<textarea class='" + html_class + "' name='" + input_name + "' id='" + input_id + "'>" + ezfc_stripslashes(value) + "</textarea>";
					}
				break;

				case "required":
					req_char = value==1 ? "*" : "";

					input = "<select class='ezfc-form-element-required-toggle' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";
					input += "	<option value='0'>" + ezfc_vars.yes_no.no + "</option>";
					input += "	<option value='1'" + (value==1 ? "selected" : "") + ">" + ezfc_vars.yes_no.yes + "</option>";
					input += "</select>";
				break;

				case "add_line":
				case "add_linebreaks":
				case "add_to_price":
				case "allow_multiple":
				case "collapsible":
				case "do_shortcode":
				case "calculate_enabled":
				case "calculate_before":
				case "calculate_when_hidden":
				case "double_check":
				case "expanded":
				case "inline":
				case "is_currency":
				case "is_telephone_nr":
				case "overwrite_price":
				case "pips":
				case "read_only":
				case "set_use_factor":
				case "showWeek":
				case "slider":
				case "spinner":
				case "use_address":
				case "text_only":
				case "use_woocommerce_price":
					input = "<select class='ezfc-form-element-" + name + "' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";
					input += "	<option value='0'>" + ezfc_vars.yes_no.no + "</option>";
					input += "	<option value='1'" + (value==1 ? "selected" : "") + ">" + ezfc_vars.yes_no.yes + "</option>";
					input += "</select>";
				break;

				case "hidden":
					input = "<select class='ezfc-form-element-" + name + "' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";
					input += "	<option value='0'>" + ezfc_vars.yes_no.no + "</option>";
					input += "	<option value='1'" + (value==1 ? "selected" : "") + ">Yes</option>";
					input += "	<option value='2'" + (value==2 ? "selected" : "") + ">Conditional hidden</option>";
					input += "</select>";
				break;

				case "steps_slider":
				case "steps_spinner":
				case "steps_pips":
					input = "<input class='ezfc-spinner' type='text' value='" + value + "' name='" + input_name + "' data-element-name='" + name + "' id='" + input_id + "' />";
				break;

				case "multiple":
					input = "<select class='ezfc-form-element-multiple' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";
					input += "	<option value='0'>" + ezfc_vars.yes_no.no + "</option>";
					input += "	<option value='1'" + (value==1 ? "selected" : "") + ">" + ezfc_vars.yes_no.yes + "</option>";
					input += "</select>";
				break;

				// used for radio-buttons, checkboxes
				case "options":
					input = "<button class='button ezfc-form-element-option-add' data-element_id='" + element.id + "'>Add option</button></div>";
					
					input += "<div class='col-xs-3'>Value</div>";
					input += "<div class='col-xs-3'>Text</div>";
					input += "<div class='col-xs-3'>Image</div>";
					input += "<div class='col-xs-3'>";
					input += "	<abbr title='Preselect values'>Sel</abbr>&nbsp;";
					input += "	<abbr title='Disabled'>Dis</abbr>&nbsp;";
					input += "</div>";

					input += "<div class='ezfc-form-element-option-container ezfc-option-container'>";

					var n              = 0,
						preselect      = (data_el.preselect || data_el.preselect == 0) ? data_el.preselect : "",
						preselect_html = "",
						preselect_type = "",
						preselect_val  = "";

					switch (data_element_wrapper.type) {
						case "checkbox":
							preselect_name = input_raw + "[preselect_container]";
							preselect_type = "checkbox";
							preselect_val  = [];

							if (preselect.length > 1) {
								preselect_val  = $.map(preselect.split(","), function(v) {
									return parseInt(v);
								});
							}
						break;

						default:
							preselect_name = input_raw + "[preselect]";
							preselect_type = "radio";
							preselect_val  = parseInt(preselect);
						break;
					}

					$.each(value, function(opt_val, opt_text) {
						input += "<div class='ezfc-form-element-option' data-element_id='" + element.id + "'>";
						// value
						input += "	<div class='col-xs-3'><input class='ezfc-form-element-option-value small' name='" + input_name + "[" + n + "][value]' value='" + opt_text.value + "' type='text' /></div>";
						// text
						input += "	<div class='col-xs-3'><input class='ezfc-form-element-option-text' name='" + input_name + "[" + n + "][text]' type='text' value='" + opt_text.text + "' /></div>";

						// image wrapper
						input += "	<div class='col-xs-3'>";
						// image
						if (data_element_wrapper.type == "radio" || data_element_wrapper.type == "checkbox") {
							var tmp_img_src = "";
							if (opt_text.image) tmp_img_src = opt_text.image;

							input += "	<input class='ezfc-form-element-option-image' name='" + input_name + "[" + n + "][image]' type='hidden' value='" + tmp_img_src + "' />";

							input += "	<img class='ezfc-option-image-placeholder' src='" + tmp_img_src + "' />";
							input += "	<button class='button ezfc-option-image-button' data-ot='Choose image'><i class='fa fa-image'></i></button>";
							input += "	<button class='button ezfc-option-image-remove' data-ot='Remove image'><i class='fa fa-times'></i></button>";
						}
						else if (data_element_wrapper.type == "dropdown") {
							input += ezfc_vars.unavailable_element;
						}

						input += "	</div>";

						// preselect
						preselect_html = "";

						// checkbox element can have multiple preselect values
						if (data_element_wrapper.type == "checkbox") {
							preselect_html = $.inArray(n, preselect_val)!=-1 ? "checked='checked'" : "";
						}
						else {
							preselect_html = preselect_val == n ? "checked='checked'" : "";
						}

						// disabled
						disabled_html = opt_text.disabled ? "checked='checked'" : "";

						input += "	<div class='col-xs-3'>";
						// preselect
						input += "		<input class='ezfc-form-element-option-" + preselect_type + "' name='" + preselect_name + "' type='" + preselect_type + "' data-element_id='" + element.id + "' value='" + n + "' " + preselect_html + " />&nbsp;";
						// disabled
						input += "		<input class='ezfc-form-element-option-disabled' name='" + input_name + "[" + n + "][disabled]' type='checkbox' data-element_id='" + element.id + "' value='1' " + disabled_html + " />&nbsp;";
						// move up
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-up' data-target='.ezfc-form-element-option' data-element_id='" + element.id + "'><i class='fa fa-sort-up'></i></button>";
						// move down
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-down' data-target='.ezfc-form-element-option' data-element_id='" + element.id + "'><i class='fa fa-sort-down'></i></button>";
						// remove
						input += "		<button class='button ezfc-form-element-option-delete' data-target='.ezfc-form-element-option' data-element_id='" + element.id + "' data-target_row='" + n + "'><i class='fa fa-times'></i></button>";
						input += "	</div>";

						input += "	<div class='clearfix'></div>";
						input += "</div>";
						
						n++;
					});

					input += "</div>"; // move container

					if (preselect_type == "checkbox") {
						input += "<input class='ezfc-form-option-preselect' type='hidden' name='" + input_raw + "[preselect]' data-element_id='" + element.id + "' value='" + preselect + "' />";
					}
					else if (preselect_type == "radio") {
						preselect_html = preselect==-1 ? "checked='checked'" : "";

						input += "<div class='col-xs-9'>No preselected value</div>";
						input += "<div class='col-xs-3'><input class='ezfc-form-element-option-radio' name='" + input_raw + "[preselect]' type='radio' data-element_id='" + element.id + "' value='-1' " + preselect_html + " /></div>";
					}

					input += "<div>";
				break;

				// calculate
				case "calculate":
					input = "<button class='button ezfc-form-element-option-add' data-element_id='" + element.id + "'>" + ezfc_vars.texts.add_calculation_field + "</button>&nbsp;";
					input += "<button class='ezfc-form-calculate-refresh button' data-ot='" + ezfc_vars.texts.refresh_fields + "'><span class='fa fa-refresh'></span></button>";
					input += "<a class='pull-right' href='http://ez-form-calculator.ezplugins.de/documentation/calculation/' target='_blank'>" + ezfc_vars.texts.documentation + "</a>";
					input += "</div>";

					input += "<div class='col-xs-2'>" + ezfc_vars.texts.operator + "</div>";
					input += "<div class='col-xs-5'>" + get_tip(ezfc_vars.element_tip_description.calc_target_element) + " " + ezfc_vars.texts.target_element + "</div>";
					input += "<div class='col-xs-3'>" + get_tip(ezfc_vars.element_tip_description.calc_target_value) + " " + ezfc_vars.texts.value + "</div>";
					input += "<div class='col-xs-2'></div>";
					input += "<div class='clearfix'></div>";

					input += "<div class='ezfc-form-element-option-container ezfc-option-container'>";

					// calculation fields
					var n = 0;
					$.each(value, function(calc_key, calc_text) {
						input += "<div class='ezfc-form-element-option ezfc-form-element-calculate-wrapper' data-element_id='" + element.id + "' data-row='" + n + "'>";
						// operator
						input += "	<div class='col-xs-2'>";
						input += "		<select class='ezfc-form-element-calculate-operator' name='" + input_name + "[" + n + "][operator]' data-element-name='" + name + "'>";

						// iterate through operators
						$.each(ezfc_operators, function(nn, operator) {
							var selected = "";
							if (calc_text.operator == operator.value) selected = "selected='selected'";

							input += "<option value='" + operator.value + "' " + selected + ">" + operator.text + "</option>";
						});

						input += "		</select>";
						input += "	</div>";

						// other elements (will be filled in from function fill_calculate_fields())
						input += "	<div class='col-xs-5'>";
						input += "		<select class='ezfc-form-element-calculate-target fill-elements' name='" + input_name + "[" + n + "][target]' id='" + input_id + "-target' data-element-name='" + name + "' data-target='" + calc_text.target + "'>";
						input += "		</select>";
						input += "	</div>";

						// value when no element was selected
						if (!calc_text.value) calc_text.value = "";
						input += "	<div class='col-xs-3'>";
						input += "		<input class='ezfc-form-element-calculate-value' name='" + input_name + "[" + n + "][value]' id='" + input_id + "-value' data-element-name='" + name + "' value='" + calc_text.value + "' type='text' />";
						input += "	</div>";

						// actions
						input += "	<div class='col-xs-2'>";
						// move up
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-up' data-target='.ezfc-form-element-calculate-wrapper' data-element_id='" + element.id + "'><i class='fa fa-sort-up'></i></button>";
						// move down
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-down' data-target='.ezfc-form-element-calculate-wrapper' data-element_id='" + element.id + "'><i class='fa fa-sort-down'></i></button>";
						// remove
						input += "		<button class='button ezfc-form-element-option-delete' data-target='.ezfc-form-element-calculate-wrapper' data-element_id='" + element.id + "'><i class='fa fa-times'></i></button>";
						input += "	</div>";

						input += "	<div class='clearfix'></div>";
						input += "</div>";

						n++;
					});

					input += "</div>"; // move container
					input += "<div>";
				break;

				// conditional fields
				case "conditional":
					input = "<button class='button ezfc-form-element-option-add' data-element_id='" + element.id + "'>" + ezfc_vars.texts.add_conditional_field + "</button>&nbsp;";
					input += "<button class='ezfc-form-calculate-refresh button' data-ot='Refresh fields'><span class='fa fa-refresh'></span></button>";
					input += "<a class='pull-right' href='http://ez-form-calculator.ezplugins.de/documentation/conditional-fields/' target='_blank'>" + ezfc_vars.texts.documentation + "</a>";
					input += "</div>";

					input += "<div class='col-xs-2'>" + get_tip(ezfc_vars.element_tip_description.action_perform) + " " + ezfc_vars.texts.action + "</div>";
					input += "<div class='col-xs-2'>" + get_tip(ezfc_vars.element_tip_description.target_element) + " " + ezfc_vars.texts.target_element + "</div>";
					input += "<div class='col-xs-1'>" + get_tip(ezfc_vars.element_tip_description.target_value) + " " + ezfc_vars.texts.target_value_short + "</div>";
					input += "<div class='col-xs-2'>" + get_tip(ezfc_vars.element_tip_description.conditional_operator) + " " + ezfc_vars.texts.conditional_operator_short + "</div>";
					input += "<div class='col-xs-2'>" + get_tip(ezfc_vars.element_tip_description.conditional_value) + " " + ezfc_vars.texts.value + "</div>";
					input += "<div class='col-xs-3'>" + get_tip(ezfc_vars.element_tip_description.conditional_chain, "fa-chain") + " &nbsp; &nbsp;" + get_tip(ezfc_vars.element_tip_description.conditional_row_operator) + " &nbsp; " + get_tip(ezfc_vars.element_tip_description.conditional_toggle) + " &nbsp; " + get_tip(ezfc_vars.element_tip_description.conditional_factor) + "</div>";
					input += "<div class='clearfix'></div>";

					input += "<div class='ezfc-form-element-option-container ezfc-option-container'>";

					var n = 0;
					$.each(value, function(calc_key, calc_text) {
						input += "<div class='ezfc-form-element-option ezfc-form-element-conditional-wrapper' data-element_id='" + element.id + "' data-row='" + n + "'>";

						// show or hide
						input += "	<div class='col-xs-2'>";
						input += "		<select class='ezfc-form-element-conditional-action' name='" + input_name + "[" + n + "][action]' id='" + input_id + "-action' data-element-name='" + name + "'>";

						// iterate through conditional operators
						$.each(ezfc_cond_actions, function(nn, operator) {
							var selected = "";
							if (calc_text.action == operator.value) selected = "selected='selected'";

							input += "<option value='" + operator.value + "' " + selected + ">" + operator.text + "</option>";
						});

						input += "		</select>";
						input += "	</div>";

						// target element
						input += "	<div class='col-xs-2'>";
						input += "		<select class='ezfc-form-element-conditional-target fill-elements' name='" + input_name + "[" + n + "][target]' data-element-name='" + name + "' data-target='" + calc_text.target + "' data-show_all='true'>";
						input += "		</select>";
						input += "	</div>";

						// target value
						if (!calc_text.target_value) calc_text.target_value = "";
						input += "	<div class='col-xs-1'>";
						input += "		<input class='ezfc-form-element-conditional-target-value' name='" + input_name + "[" + n + "][target_value]' id='" + input_id + "-target-value' data-element-name='" + name + "' value='" + calc_text.target_value + "' type='text' />";
						input += "	</div>";

						// conditional operator
						input += "	<div class='col-xs-2'>";
						input += "		<select class='ezfc-form-element-conditional-operator' name='" + input_name + "[" + n + "][operator]' id='" + input_id + "-target' data-element-name='" + name + "'>";

						// iterate through conditional operators
						$.each(ezfc_cond_operators, function(nn, operator) {
							var selected = "";
							if (calc_text.operator == operator.value) selected = "selected='selected'";

							input += "<option value='" + operator.value + "' " + selected + ">" + operator.text + "</option>";
						});

						input += "		</select>";
						input += "	</div>";

						// conditional value
						if (!calc_text.value) calc_text.value = "";
						input += "	<div class='col-xs-2'>";
						input += "		<input class='ezfc-form-element-conditional-value' name='" + input_name + "[" + n + "][value]' id='" + input_id + "-value' data-element-name='" + name + "' value='" + calc_text.value + "' type='text' />";
						input += "	</div>";

						// conditional toggle
						var cond_row_operator = (calc_text.row_operator && calc_text.row_operator == 1) ? "checked='checked'" : "";
						var cond_toggle       = (calc_text.notoggle && calc_text.notoggle == 1) ? "checked='checked'" : "";
						var cond_use_factor   = (calc_text.use_factor && calc_text.use_factor == 1) ? "checked='checked'" : "";
						var cond_chain_args   = [input_name, n].join(",");

						input += "	<div class='col-xs-3'>";
						// add conditional operator
						input += "		<button class='button button-primary ezfc-form-element-conditional-chain-add' data-func='conditional_chain_add' data-args='" + cond_chain_args + "' id='" + input_id + "-chain' data-element-name='" + name + "'>" + get_tip("Add condition", "fa-plus-square-o") + "</button>";
						// conditional row operator (or / and)
						input += "		<input class='ezfc-form-element-conditional-row-operator' name='" + input_name + "[" + n + "][row_operator]' id='" + input_id + "-row-operator' data-element-name='" + name + "' value='1' type='checkbox' " + cond_row_operator + " />";
						// notoggle
						input += "		<input class='ezfc-form-element-conditional-notoggle' name='" + input_name + "[" + n + "][notoggle]' id='" + input_id + "-notoggle' data-element-name='" + name + "' value='1' type='checkbox' " + cond_toggle + " />";
						// use factor
						input += "		<input class='ezfc-form-element-conditional-use_factor' name='" + input_name + "[" + n + "][use_factor]' id='" + input_id + "-use_factor' data-element-name='" + name + "' value='1' type='checkbox' " + cond_use_factor + " />";

						// move up
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-up' data-target='.ezfc-form-element-conditional-wrapper' data-element_id='" + element.id + "'><i class='fa fa-sort-up'></i></button>";
						// move down
						input += "		<button class='button ezfc-form-element-move ezfc-form-element-move-down' data-target='.ezfc-form-element-conditional-wrapper' data-element_id='" + element.id + "'><i class='fa fa-sort-down'></i></button>";
						// remove
						input += "		<button class='button ezfc-form-element-option-delete' data-target='.ezfc-form-element-conditional-wrapper' data-element_id='" + element.id + "'><i class='fa fa-times'></i></button>";
						input += "  </div>";

						input += "	<div class='clearfix'></div>";

						// redirect
						input += "	<div class='col-xs-4 ezfc-hidden ezfc-conditional-redirect-wrapper'>URL: ";
						input += "		<input class='ezfc-form-element-conditional-redirect' name='" + input_name + "[" + n + "][redirect]' id='" + input_id + "-redirect' data-element-name='" + name + "' value='" + (calc_text.redirect ? calc_text.redirect : "") + "' type='text' />";
						input += "  </div>";


						input += "	<div class='clearfix'></div>";

						if (calc_text.operator_chain && Object.keys(calc_text.operator_chain).length > 0) {
							$.each(calc_text.operator_chain, function(i, chain_operator_value) {
								var chain_value = calc_text.value_chain[i];

								var input_name_operator = input_name + "[" + n + "][operator_chain][" + i + "]";
								var input_name_value    = input_name + "[" + n + "][value_chain][" + i + "]";

								input += ezfc_builder_functions.conditional_chain_get_html(input_name_operator, input_name_value, chain_operator_value, chain_value);
							});
						}

						input += "</div>";

						n++;
					});

					// option wrapper
					input += "</div>";

					input += "<div>";
				break;

				// discount
				case "discount":
					input = "<button class='button ezfc-form-element-option-add' data-element_id='" + element.id + "'>Add discount field</button>&nbsp;";
					input += "<button class='ezfc-form-calculate-refresh button' data-ot='Refresh fields'><span class='fa fa-refresh'></span></button>";
					input += "</div>";

					input += "<div class='col-xs-3'>" + get_tip(ezfc_vars.element_tip_description.discount_value_min) + " " + ezfc_vars.texts.value_min + "</div>";
					input += "<div class='col-xs-3'>" + get_tip(ezfc_vars.element_tip_description.discount_value_max) + " " + ezfc_vars.texts.value_max + "</div>";
					input += "<div class='col-xs-2'>" + get_tip(ezfc_vars.element_tip_description.discount_operator) + " Op</div>";
					input += "<div class='col-xs-3'>" + get_tip(ezfc_vars.texts.discount_value) + " " + ezfc_vars.texts.discount_value + "</div>";
					input += "<div class='col-xs-1'>" + ezfc_vars.texts.remove + "</div>";
					input += "<div class='clearfix'></div>";

					input += "<div class='ezfc-form-element-option-container ezfc-option-container'>";

					// discount fields
					var n = 0;
					$.each(value, function(discount_key, discount_text) {
						input += "<div class='ezfc-form-element-option ezfc-form-element-discount-wrapper' data-element_id='" + element.id + "' data-row='" + n + "'>";

						// range_min
						input += "	<div class='col-xs-3'>";
						input += "		<input class='ezfc-form-element-discount-range_min' name='" + input_name + "[" + n + "][range_min]' id='" + input_id + "-value' data-element-name='" + name + "' value='" + discount_text.range_min + "' type='text' />";
						input += "	</div>";

						// range_max
						input += "	<div class='col-xs-3'>";
						input += "		<input class='ezfc-form-element-discount-range_max' name='" + input_name + "[" + n + "][range_max]' id='" + input_id + "-value' data-element-name='" + name + "' value='" + discount_text.range_max + "' type='text' />";
						input += "	</div>";

						// operator
						input += "	<div class='col-xs-2'>";
						input += "		<select class='ezfc-form-element-discount-operator' name='" + input_name + "[" + n + "][operator]' data-element-name='" + name + "'>";

						// iterate through operators
						$.each(ezfc_operators_discount, function(nn, operator) {
							var selected = "";
							if (discount_text.operator == operator.value) selected = "selected='selected'";

							input += "<option value='" + operator.value + "' " + selected + ">" + operator.text + "</option>";
						});

						input += "		</select>";
						input += "	</div>";

						// other elements (will be filled in from function fill_calculate_fields())
						input += "	<div class='col-xs-3'>";
						input += "		<input class='ezfc-form-element-discount-discount_value' name='" + input_name + "[" + n + "][discount_value]' id='" + input_id + "-value' data-element-name='" + name + "' value='" + discount_text.discount_value + "' type='text' />";
						input += "	</div>";

						// remove
						input += "	<div class='col-xs-1'>";
						input += "		<button class='button ezfc-form-element-option-delete' data-target='.ezfc-form-element-discount-wrapper' data-element_id='" + element.id + "'><i class='fa fa-times'></i></button>";
						input += "	</div>";

						input += "	<div class='clearfix'></div>";
						input += "</div>";
						n++;
					});

					// option wrapper
					input += "</div>";

					input += "<div>";
				break;

				case "set":
					input = "<button class='button ezfc-form-element-option-add' data-element_id='" + element.id + "'>Add element to set</button>&nbsp;";
					input += "<button class='ezfc-form-calculate-refresh button' data-ot='Refresh fields'><span class='fa fa-refresh'></span></button>";
					input += "</div>";

					input += "<div class='col-xs-12'>Element / Remove</div>";
					input += "<div class='clearfix'></div>";

					input += "<div class='ezfc-form-element-option-container ezfc-option-container'>";

					// set fields
					var n = 0;
					$.each(value, function(set_key, set_text) {
						input += "<div class='ezfc-form-element-option ezfc-form-element-set-wrapper' data-element_id='" + element.id + "' data-row='" + n + "'>";

						// field to show
						input += "	<div class='ezfc-form-element-set-element'>";
						input += "		<select class='ezfc-form-element-set-target fill-elements' name='" + input_name + "[" + n + "][target]' data-element-name='" + name + "' data-target='" + set_text.target + "'>";
						input += "		</select>";

						// remove
						input += "		<button class='button ezfc-form-element-option-delete' data-target='.ezfc-form-element-set-wrapper' data-element_id='" + element.id + "'><i class='fa fa-times'></i></button>";
						input += "	</div>";
						input += "</div>";
						n++;
					});

					// option wrapper
					input += "</div>";

					input += "<div>";
				break;
				case "set_operator":
					input = "<select class='ezfc-form-element-" + name + "' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";

					// iterate through operators
					$.each(ezfc_set_operators, function(nn, operator) {
						var selected = "";
						if (value == operator.value) selected = "selected='selected'";

						input += "<option value='" + operator.value + "' " + selected + ">" + operator.text + "</option>";
					});

					input += "</select>";
				break;

				// image
				case "image":
					input += "<button class='button ezfc-image-upload'>" + ezfc_vars.texts.choose_image + "</button>";
					input += "<br><img src='" + value + "' class='ezfc-image-preview' />";
				break;
				
				case "slidersteps":
					input = "<input class='ezfc-spinner' name='" + input_name + "' value='" + value + "' />";
				break;

				case "icon":
					input += "<button class='button ezfc-icon-button' data-target='" + input_id + "'>" + ezfc_vars.texts.choose_icon + "</button>";
					input += "<i class='fa " + value + "' id='" + input_id + "-icon' data-previewicon></i>";
				break;

				// wordpress posts
				case "post_id":
					input = "<select class='ezfc-form-element-" + name + "' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";

					// iterate through operators
					$.each(ezfc_wp_posts, function(post_id, post) {
						var selected = "";
						if (value == post.id) selected = "selected='selected'";

						input += "<option value='" + post.id + "' " + selected + ">" + post.title + "</option>";
					});

					input += "</select>";
				break;

				// custom calculation
				case "custom_calculation":
					input = "<textarea class='ezfc-custom-calculation' name='" + input_name + "' id='" + input_id + "'>" + ezfc_stripslashes(value) + "</textarea>";
					input += "<button class='ezfc-open-function-dialog'>" + ezfc_vars.texts.functions + "</button>";
				break;

				case "show_in_email":
					input = "<select class='ezfc-form-element-" + name + "' name='" + input_name + "' id='" + input_id + "' data-element-name='" + name + "'>";

					var tmp_options = [
						[0, ezfc_vars.yes_no.no],
						[1, ezfc_vars.yes_no.yes],
						[2, ezfc_vars.texts.show_if_not_empty],
						[3, ezfc_vars.texts.show_if_not_empty_0]
					];

					// iterate through operators
					$.each(tmp_options, function(nn, tmp_option) {
						var selected = "";
						if (value == tmp_option[0]) selected = "selected='selected'";

						input += "<option value='" + tmp_option[0] + "' " + selected + ">" + tmp_option[1] + "</option>";
					});

					input += "</select>";
				break;

				case "tag":
					input = ezfc_get_input("select", input_name, {
						options: [
							{ value: "h1", text: "h1"},
							{ value: "h2", text: "h2"},
							{ value: "h3", text: "h3"},
							{ value: "h4", text: "h4"},
							{ value: "h5", text: "h5"},
							{ value: "h6", text: "h6"}
						],
						selected: value
					});
				break;
			}

			html.push("<div class='row'>");
			html.push("	<div class='col-xs-4'>");

			if (el_description.length > 0) {
				html.push("		<span class='fa fa-question-circle' data-ot='" + el_description + "'></span> &nbsp;");
			}

			html.push("		<label for='" + input_name + "'>" + name.capitalize() + "</label>");
			html.push("	</div>");
			html.push("	<div class='col-xs-8'>");
			html.push(input);
			html.push("	</div>");
			html.push("</div>");

			//html += "<div class='clearfix'></div>";
		});

		return html.join("");
	}

	function get_element_data_wrapper(element) {
		var data_el = $.parseJSON(element.data);

		if (element.e_id == 0) {
			is_extension = true;
			extension_id = data_el.extension;

			// check if extension exists
			var extension_element = $(".ezfc-element[data-id='" + extension_id + "']");
			if (extension_element.length < 1) {
				// error message
				return;
			}

			// get element data
			var extension_element_data = extension_element.data("extension_data");

			data_element_wrapper = {
				ext:  true,
				icon: extension_element_data.icon,
				name: extension_element_data.name,
				type: extension_element_data.type
			};
		}
		else {
			data_element_wrapper = ezfc.elements[element.e_id];
		}

		return data_element_wrapper;
	}

	function fill_calculate_fields(show_all, force_reload) {
		if (ezfc_fill_elements_html == -1 || force_reload) {
			var elements = $(".ezfc-form-element-data");
			var elements_filtered = elements.not(".ezfc-form-element-email, .ezfc-form-element-date, .ezfc-form-element-image, .ezfc-form-element-line, .ezfc-form-element-date, .ezfc-form-element-html, .ezfc-form-element-recaptcha, .ezfc-form-element-file-upload, .ezfc-form-element-group, .ezfc-form-element-spacer, .ezfc-form-element-placeholder, .ezfc-form-element-stepstart, .ezfc-form-element-stepend");

			ezfc_fill_elements_html = "<option value='0'> </option>";
			$(elements).each(function(ie, element) {
				var $el_parent           = $(element).closest(".ezfc-form-element");
				var el_id                = $el_parent.data("id");
				var current_form_element = ezfc_current_form_elements[el_id];

				var name, type;
				if ($el_parent.find("> .ezfc-form-element-data").hasClass("ezfc-form-element-has-data")) {
					var name_selector = "input[data-element-name='name']";
					var type_selector = ".ezfc-form-element-type";

					if ($el_parent.hasClass("ezfc-form-element-group")) {
						name_selector = "> .ezfc-form-element-data " + name_selector;
						type_selector = "> .ezfc-form-element-name " + type_selector;
					}

					name = $el_parent.find(name_selector).val();
					type = $el_parent.find(type_selector).text();				
				}
				else {
					name = ezfc_current_form_elements[current_form_element.id].data_json.name;
					type = ezfc.elements[current_form_element.data_json.e_id].type;
				}

				ezfc_fill_elements_html += "<option value='" + el_id + "'>" + name + " (" + type + ")</option>";
			});

			ezfc_fill_elements_filtered_html = "<option value='0'> </option>";
			$(elements_filtered).each(function(ie, element) {
				var $el_parent           = $(element).closest(".ezfc-form-element");
				var el_id                = $el_parent.data("id");
				var current_form_element = ezfc_current_form_elements[el_id];

				var name, type;
				if ($el_parent.find("> .ezfc-form-element-data").hasClass("ezfc-form-element-has-data")) {
					var name_selector = "input[data-element-name='name']";
					var type_selector = ".ezfc-form-element-type";

					if ($el_parent.hasClass("ezfc-form-element-group")) {
						name_selector = "> .ezfc-form-element-data " + name_selector;
						type_selector = "> .ezfc-form-element-name " + type_selector;
					}

					name = $el_parent.find(name_selector).val();
					type = $el_parent.find(type_selector).text();				
				}
				else {
					name = ezfc_current_form_elements[current_form_element.id].data_json.name;
					type = ezfc.elements[current_form_element.data_json.e_id].type;
				}

				ezfc_fill_elements_filtered_html += "<option value='" + el_id + "'>" + name + " (" + type + ")</option>";
			});
		}

		$(".fill-elements").each(function(i, calculate_element) {
			var selected = $(this).find(":selected").val() || $(this).data("target");
			var show_all = $(this).data("show_all") ? true : false;

			var is_calculation = $(this).hasClass("ezfc-form-element-calculate-target");
			var is_conditional = $(this).hasClass("ezfc-form-element-conditional-target");

			// skip elements which cannot be calculated with
			var elements_to_insert = show_all ? ezfc_fill_elements_html : ezfc_fill_elements_filtered_html;

			// add submit button to conditionals
			if (is_conditional) {
				elements_to_insert += "<option value='submit_button'>" + ezfc_vars.submit_button + "</option>";
			}

			$(calculate_element).html(elements_to_insert);

			var el_parent = $(calculate_element).parent();

			// calculate
			if (is_calculation) {
				var operator = $(this).closest(".ezfc-form-element-calculate-wrapper").find(".ezfc-form-element-calculate-operator");

				el_parent.parent().find(".ezfc-form-element-calculate-operator option[value='" + operator + "']").prop("selected", "selected");
				el_parent.parent().find(".ezfc-form-element-calculate-target option[value='" + selected + "']").prop("selected", "selected");
			}
			// conditional
			else if (is_conditional) {
				el_parent.find(".ezfc-form-element-conditional-action option[value='" + selected + "']").prop("selected", "selected");
				el_parent.find(".ezfc-form-element-conditional-target option[value='" + selected + "']").prop("selected", "selected");
			}
			// set
			else if ($(this).hasClass("ezfc-form-element-set-target")) {
				el_parent.find(".ezfc-form-element-set-target option[value='" + selected + "']").prop("selected", "selected");
			}
		});
	}

	/**
		ajax
	**/
	function do_action(el, settings) {
		$(".ezfc-loading").fadeIn("fast");

		var action = $(el).data("action");
		var f_id   = $(".ezfc-forms-list .button-primary").data("id");
		var id     = $(el).data("id");
		var data   = "action=" + action;

		var el_disabled_list;

		switch (action) {
			case "form_add":
			case "form_add_template_elements":
				id = $("#ezfc-form-template-id option:selected").val();
			break;

			case "form_duplicate":
				form_clear(id);
			break;

			case "form_element_add":
				if (!f_id) return false;
				var e_id = id;

				// check if element is an extension
				if ($(el).data("extension") != 0) {
					data += "&extension=1";
				}

				// custom position from dropped element
				if (settings) {
					for (key in settings) {
						data += "&element_settings[" + key + "]=" + settings[key];
					}
				}
				
				data += "&e_id=" + e_id + "&f_id=" + f_id;
			break;

			case "form_element_change":
				data += "&fe_id=" + ezfc_selected_element;
			break;

			case "form_clear":
			case "form_delete":
			case "form_delete_submissions":
			case "form_submission_delete":
			case "form_template_delete":
			case "form_file_delete":
				if (action == "form_template_delete") {
					id = $("#ezfc-form-template-id option:selected").val();

					if (id == 0) {
						$(".ezfc-loading").hide();
						return false;
					}
				} 

				if (!confirm(ezfc_vars.delete_element)) {
					$(".ezfc-loading").hide();
					return false;
				}
			break;

			case "form_element_delete":
				var $el_parent = $(el).closest(".ezfc-form-element");

				// check if group
				if ($el_parent.hasClass("ezfc-form-element-group")) {
					// put together child element ids
					var child_element_ids = [];
					
					$el_parent.find(".ezfc-form-element").each(function() {
						child_element_ids.push($(this).data("id"));
					});

					data += "&child_element_ids=" + child_element_ids.join(",");
				}
				
				if (!confirm(ezfc_vars.delete_element)) {
					$(".ezfc-loading").hide();
					return false;
				}
			break;

			case "form_show":
				$(".ezfc-loading").hide();
				form_show(null);
				return false;
			break;

			// import dialog
			case "form_show_import":
				$(".ezfc-loading").hide();
				$(".ezfc-import-dialog").dialog("open");
				$("#form-import-data").val("");
				return false;
			break;

			// import form data
			case "form_import_data":
				data += "&import_data=" + encodeURIComponent($("#form-import-data").val().replace(/'/g, "&apos;"));
			break;

			case "form_save":
			case "form_save_post":
			case "form_preview":
				// add html data for all elements before saving
				if (action == "form_preview") {
					$(".ezfc-form-element").each(function() {
						maybe_add_data_element($(this));
					});
				}

				if (typeof tinyMCE !== "undefined") {
					tinyMCE.triggerSave();
				}

				// temporarily remove disabled fields
				el_disabled_list = $("#form-elements [disabled='disabled']");
				el_disabled_list.removeAttr("disabled");

				// concatenate preselect checkboxes
				$(".ezfc-form-element-checkbox").each(function() {
					// only concatenate for checkbox preselect options
					var is_checkbox_option_container = $(this).find("input[name*='preselect_container']").length > 0;
					if (is_checkbox_option_container) {
						var preselect = [];

						$(this).find("input[name*='preselect_container']").each(function(i, checkbox) {
							if ($(checkbox).is(":checked")) {
								preselect.push($(checkbox).val());
							}
						});

						$(this).find(".ezfc-form-option-preselect").val(preselect.join(","));
					}
				});

				var data_elements = encodeURIComponent(JSON.stringify($("#form-elements").serializeArray()));
				//var data_options  = encodeURIComponent(JSON.stringify($("#form-options").serializeArray()));
				var data_options = $("#form-options").serialize();

				var form_name = encodeURIComponent($("#ezfc-form-name").val());
				data += "&elements=" + data_elements + "&ezfc-form-name=" + form_name + "&" + data_options;

				if (action == "form_save_post" || action == "form_preview") id = f_id;
			break;

			case "form_show_options":
				$(".ezfc-loading").hide();
				$(".ezfc-options-dialog").dialog("open");
				return false;
			break;

			case "form_update_options":
				if (typeof tinyMCE !== "undefined") {
					tinyMCE.triggerSave();
				}
				
				var save_data = $("#form-options").serialize();
				data += "&" + save_data;
			break;

			case "form_element_duplicate":
				// check if element was changed before duplicating
				if ($(el).parents(".ezfc-form-element-name").hasClass("ezfc-changed")) {
					var element_data = $(el).closest(".ezfc-form-element").find(".ezfc-form-element-data").find("input, select, textarea").serialize();
					data += "&" + element_data;
				}
			break;

			case "toggle_element_info":
				$(".ezfc-form-element-info").toggle();
				$(".ezfc-loading").hide();

				return false;
			break;
		}

		// auto append id
		if (id) {
			data += "&id=" + id;
		}
		if (f_id) {
			data += "&f_id=" + f_id;
		}

		// nonce
		data += "&nonce=" + ezfc_nonce;

		$.ajax({
			type: "post",
			url: ajaxurl,
			data: {
				action: "ezfc_backend",
				data: data
			},
			success: function(response) {
				$(".ezfc-loading").fadeOut("fast");

				if (ezfc_debug_mode == 1 && console) console.log(response);

				var response_json;
				try {
					response_json = $.parseJSON(response);
				} catch (e) {
					$(".ezfc-error").text("Unable to perform action " + action + ": " + response);
					return false;
				}

				if (!response_json) {
					$(".ezfc-error").text("Something went wrong. :(");
						
					return false;
				}

				if (response_json.error) {
					if (action == "form_update_options") {
						ezfc_form_option_error(response_json.error_options);
					}
					else {
						ezfc_message_error(response_json.error);
					}

					return false;
				}
				$(".ezfc-error").text("");

				if (response_json.message) {
					ezfc_message(response_json.message);
				} 

				if (response_json.download_url) {
					$("body").append("<iframe src='" + response_json.download_url + "' style='display: none;' ></iframe>");
				}

				/**
					call functions after ajax request
				**/
				switch (action) {
					case "element_get":
						element_show(response_json.element[0]);
					break;

					case "form_add":
					case "form_duplicate":
						form_add(response_json);
					break;

					case "form_add_template_elements":
						form_show_elements(response_json.elements, true);
					break;

					case "form_delete_submissions":
						form_show_submissions();
					break;

					case "form_get":
						form_show(response_json);
					break;

					case "form_get_submissions":
						form_show_submissions(response_json);
					break;

					case "form_clear":
						form_clear();
					break;

					case "form_delete":
						form_changed = false;
						form_delete(id);
					break;

					case "form_file_delete":
						form_file_delete(id);
					break;

					case "form_preview":
						if (!response_json.preview_url) {
							console.log("Error", response_json);
							return;
						}

						var preview_url = decodeURIComponent(response_json.preview_url);
						window.open(preview_url, "ezfc_" + id);
					break;

					case "form_save_post":
					case "form_save":
						form_changed = false;
						$(".ezfc-changed").removeClass("ezfc-changed");
						el_disabled_list.attr("disabled", "disabled");

						// update name in forms list
						var form_name = $("#ezfc-form-name").val();
						$(".ezfc-form[data-id='" + id + "'] .ezfc-form-name").text(form_name);
						// update name shortcodes
						$("#ezfc-shortcode-name").val("[ezfc name='" + form_name + "' /]");

						if (action == "form_save_post") window.open(decodeURIComponent(response_json.success), "ezfc_" + id);
					break;

					case "form_save_template":
						var template_name = $("#ezfc-form-name").val();
						$("#ezfc-form-template-id").append("<option value='" + response_json + "'>" + template_name + "</option>");
					break;

					case "form_template_delete":
						$("#ezfc-form-template-id option[value='" + id + "']").remove();
					break;

					case "form_element_change":
						var element_new = element_add(response_json);
						$(".ezfc-form-element[data-id='" + ezfc_selected_element + "']").replaceWith(element_new);
						$("#ezfc-change-element-dialog").dialog("close");

						fill_calculate_fields();
						init_ui();
					break;

					case "form_element_delete":
						$(el).closest(".ezfc-form-element").remove();
						fill_calculate_fields();
					break;

					case "form_element_add":
					case "form_element_duplicate":
						var element_new = element_add(response_json);

						// dropped element
						if (settings) {
							$("#ezfc-element-drag-placeholder").after(element_new);
							$("#ezfc-element-drag-placeholder").remove();
						}
						else {
							$(".ezfc-form-elements").append(element_new);
						}

						fill_calculate_fields();
						init_ui();
					break;

					case "form_submission_delete":
						$(el).parents(".ezfc-form-submission").remove();

						// update counter
						var $form_counter = $(".ezfc-forms-list .button-primary .ezfc-submission-counter");
						var counter = parseInt($form_counter.text());
						$form_counter.text(counter - 1);
					break;

					case "form_update_options":
						$(".ezfc-forms-list li[data-id='" + id + "'] .ezfc-form-name").text($("#opt-name").val());
						$(".ezfc-dialog").dialog("close");
					break;

					case "form_import_data":
						form_add(response_json);
						form_show(response_json);
						$(".ezfc-dialog").dialog("close");
					break;

					case "form_show_export":
						$("#form-export-data").val(JSON.stringify(response_json));
						$(".ezfc-export-dialog").dialog("open");
					break;
				}

				// show or hide empty text
				if ($("#form-elements-list").is(":empty")) {
					$("#empty-form-text").show();
				}
				else {
					$("#empty-form-text").hide();
				}
			}
		});

		return false;
	}

	function ezfc_message(message, html, error) {
		var selector = error ? ".ezfc-error" : ".ezfc-message";

		if (!html) {
			$(selector).text(message).slideDown();
		}
		else {
			$(selector).append(message).slideDown();	
		}

		if (!error) {
			setTimeout(function() {
				$(selector).slideUp();
			}, 7500);
		}
	}
	
	function ezfc_message_error(message, html) {
		ezfc_message(message, html, true);
	}

	function ezfc_form_option_error(errors_json) {
		var errors = [];

		try {
			errors = $.parseJSON(errors_json);
		}
		catch (e) {
			console.log("Something went wrong", e);
		}

		// clear all messages before
		$(".ezfc-form-option-error-message").remove();

		// add messages
		$.each(errors, function(i, error) {
			$("#ezfc-option-" + error.id).append("<p class='ezfc-form-option-error-message ezfc-color-error'>" + error.error + "</p>");
		});
	}

	function ezfc_form_has_changed(trigger_el) {
		form_changed = true;

		$(trigger_el).closest(".ezfc-form-element").find("> .ezfc-form-element-name").addClass("ezfc-changed");
	}

	function ezfc_stripslashes(str) {
		return (str + '')
		.replace(/\\(.?)/g, function (s, n1) {
		  switch (n1) {
		  case '\\':
		    return '\\';
		  case '0':
		    return '\u0000';
		  case '':
		    return '';
		  default:
		    return n1;
		  }
		});
	}

	function ezfc_get_form_option_value(option_name) {
		for (i in ezfc_form_options) {
			if (ezfc_form_options[i].name == option_name) {
				var ret_value = typeof ezfc_form_options[i]["name"] === "undefined" ? false : ezfc_form_options[i].value;
				return ret_value;
			}
		}

		return false;
	}

	// change form element columns
	function change_columns(el, inc) {
		var $element_wrapper = $(el).closest(".ezfc-form-element");
		var columns = $element_wrapper.data("columns");
		
		var grid_12 = parseInt(ezfc_get_form_option_value("grid_12"));
		var max_col = grid_12 ? 12 : 6;
		var columns_new = Math.min(max_col, Math.max(1, columns + inc));

		$element_wrapper
			.removeClass("ezfc-col-" + columns)
			.addClass("ezfc-col-" + columns_new)
			.data("columns", columns_new)
			.find("> .ezfc-form-element-data [data-element-name='columns']")
				.val(columns_new);
	}

	function nl2br (str, is_xhtml) {
	    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
	    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
	}

	String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	}

	function get_tip(text, icon) {
		icon = icon || "fa-question-circle";

		return "<span class='fa " + icon + "' data-ot='" + ezfc_escape(text) + "'></span>";
	}

	function clear_option_row(row) {
		$(row).find("input").val("");
		$(row).find("select").val("0");
	}

	// stick add elements div to top
	var $element_option_wrapper = $("#ezfc-form-options-wrapper");
	if ($element_option_wrapper.length > 0) {
		var elements_add_div_top = $element_option_wrapper.offset().top;

	    $(window).scroll(function(){
	        if ($(window).scrollTop() > elements_add_div_top + 30 ) {
	            $element_option_wrapper.addClass("ezfc-sticky");
	        } else {
	            $element_option_wrapper.removeClass("ezfc-sticky");
	        }
	    });
	}

	// rating dialog
	var rating_dialog = $("#ezfc-rating-dialog");
	if (rating_dialog.length > 0) {
		$("#ezfc-rating-dialog").dialog({
			height: 500,
			width: 700,
			modal: true
		});
	}

	function ezfc_get_element_option_description(option) {
		if (ezfc_vars.element_option_description[option]) return ezfc_vars.element_option_description[option];
		return "";
	}

	function ezfc_parse_date(d) {
		// yyyy-mm-dd hh:mm:ss
		var tmp = d.split(" ");

		var tmp_date = tmp[0].split("-");
		var tmp_time = tmp[1].split(":");

		return new Date(tmp_date[0], parseInt(tmp_date[1]) - 1, tmp_date[2], tmp_time[0], tmp_time[1], tmp_time[2]);
	}

	function ezfc_sanitize_value(value) {
		if (typeof value === "string") {
			value = value.replace("'", "&apos;");
		}
		else if (typeof value === "object") {
			$.each(value, function(i, v) {
				value[i] = ezfc_sanitize_value(v);
			});
		}

		return value;
	}

	function ezfc_escape(str) {
		str = str.replace("'", "&#x27;");
		str = str.replace('"', "&quot;");

    	return str;
	}

	// internal builder functions
	var ezfc_builder_functions = {
		change_element_dialog: function(btn, id) {
			ezfc_selected_element = id;
			$("#ezfc-change-element-dialog").dialog("open");
			return false;
		},

		close_data_dialog: function() {
			$(".ezfc-form-element-data").hide();
			$("#ezfc-element-data-modal").fadeOut();
		},

		conditional_chain_add: function(btn, args_tmp) {
			var args          = args_tmp.split(",");
			var input_name    = args[0];
			var counter       = args[1];
			var input_counter = ezfc_builder_functions.conditional_chain_get_counter_id(btn);

			var input_name_operator = input_name + "[" + counter + "][operator_chain][" + input_counter + "]";
			var input_name_value    = input_name + "[" + counter + "][value_chain][" + input_counter + "]";

			var $cond_wrapper = $(btn).closest(".ezfc-form-element-conditional-wrapper");

			var input = ezfc_builder_functions.conditional_chain_get_html(input_name_operator, input_name_value, "", "");

			$cond_wrapper.append(input);
		},

		conditional_chain_get_html: function(input_name_operator, input_name_value, input_name_operator_value, input_name_value_value) {
			var input = "<div class='ezfc-conditional-chain-wrapper'>";
			input += "<div class='clearfix'></div>";
			input += "<div class='col-xs-5'></div>";

			// conditional operator
			input += "	<div class='col-xs-2'>";
			input += ezfc_get_input("select", input_name_operator, {
				class: "ezfc-conditional-chain-operator",
				options: ezfc_cond_operators,
				selected: input_name_operator_value
			});
			input += "	</div>";

			// conditional value
			input += "	<div class='col-xs-2'>";
			input += ezfc_get_input("input", input_name_value, {
				class: "ezfc-conditional-chain-value",
				value: input_name_value_value
			});
			input += "	</div>";

			// remove button
			input += "	<div class='col-xs-3'>";
			input += "		<button class='button ezfc-form-element-conditional-chain-remove' data-func='conditional_chain_remove'><i class='fa fa-times'></i></button>";
			input += "	</div>";
			
			input += "<div class='clearfix'></div>";
			input += "</div>";

			return input;
		},

		conditional_chain_get_counter_id: function(btn) {
			var $last_wrapper = $(btn).closest(".ezfc-form-element-conditional-wrapper").find(".ezfc-conditional-chain-wrapper:last");

			if ($last_wrapper.length < 1) return 0;

			var input_name_tmp = $last_wrapper.find(".ezfc-conditional-chain-operator").attr("name").split("]");
			var counter = input_name_tmp[4].replace("[", "");
			var counter_new = parseInt(counter) + 1;

			return counter_new;
		},

		conditional_chain_remove: function(btn) {
			var $wrapper = $(btn).closest(".ezfc-conditional-chain-wrapper");
			$wrapper.remove();
		},

		element_has_calculation: function(data) {
			if (typeof data["calculate"] === "undefined" || typeof data["calculate"][0] === "undefined") return false;
			if (typeof data.calculate[0]["operator"] === "undefined" || data.calculate[0].operator == 0) return false;

			return true;
		},
		element_has_condition: function(data) {
			if (typeof data["conditional"] === "undefined" || typeof data["conditional"][0]== "undefined") return false;
			if (typeof data.conditional[0]["action"] === "undefined" || data.conditional[0].action == 0) return false;

			return true;
		},
		element_has_discount: function(data) {
			if (typeof data["discount"] === "undefined" || typeof data["discount"][0] === "undefined") return false;
			if (typeof data.discount[0]["operator"] === "undefined" || data.discount[0].operator == 0) return false;

			return true;
		}
	};

	var ezfc_get_input = function(type, name, args) {
		args = args || {};

		var input = "";
		var input_class = args.class || "";

		switch (type) {
			case "input":
				input += "<input class='" + input_class + "' name='" + name + "' value='" + args.value + "' type='text' />";
			break;

			case "select":
				input = "<select class='" + input_class + "' name='" + name + "'>";

				$.each(args.options, function(n, option) {
					var selected = "";
					if (args.selected && args.selected == option.value) {
						selected = "selected='selected'";
					}

					input += "<option value='" + option.value + "' " + selected + ">" + option.text + "</option>";
				});

				input += "</select>";
			break;
		}

		return input;
	};
});