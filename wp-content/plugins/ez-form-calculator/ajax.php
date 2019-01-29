<?php

if (!function_exists("get_option")) die("Access denied.");

if (get_option("ezfc_debug_mode", 0) == 1) {
	@error_reporting(E_ALL);
	@ini_set("display_errors", "On");
}

require_once(EZFC_PATH . "class.ezfc_frontend.php");
$ezfc = new Ezfc_frontend();

// check if recaptcha was already included / defined otherwise
if (!class_exists("ReCaptchaResponse")) {
	require_once(EZFC_PATH . "lib/recaptcha-php-1.11/recaptchalib.php");
}

parse_str($_POST["data"], $data);
$id = (int) $data["id"];

if (empty($id) || empty($data)) die();

// preview
$preview_id = empty($data["preview"]) ? null : (int) $data["preview"];

// check input
$check_input_result = $ezfc->check_input($id, $data, $preview_id);

// form validation failed
if (array_key_exists("error", $check_input_result)) {
	ezfc_send_ajax($check_input_result);
	die();
}
// form validation until the submitted step is valid
elseif (array_key_exists("step_valid", $check_input_result)) {
	ezfc_send_ajax($ezfc->send_message("step_valid", 1));
	die();
}

// prepare form elements / options
$elements = $ezfc->elements_get();

if ($preview_id !== null) {
	$preview_form  = $ezfc->form_get_preview($preview_id);
	$form_elements = $preview_form->elements;
	$form_options  = $ezfc->form_get_option_values(false, $preview_form->options);
}
else {
	$form_elements = $ezfc->form_elements_get($id);
	$form_options  = $ezfc->form_get_option_values($id);
}

// prepare submission data
$ezfc->prepare_submission_data($id, $data);

// special checks
$has_recaptcha      = false;
$has_upload         = false;
$use_payment_choice = false;

// user can choose to pay via paypal or other types
$force_paypal = false;

if ($form_options["submission_enabled"] == 0) {
	return $this->send_message("error", __("Submission not allowed.", "ezfc"));
}

foreach ($form_elements as $k => $fe) {
	$fe_data = json_decode($fe->data);

	// skip for extensions
	if (!empty($fe_data->extension)) continue;

	if ($elements[$fe->e_id]->type == "recaptcha") {
		$has_recaptcha = true;
	}

	if ($elements[$fe->e_id]->type == "payment") {
		$use_payment_choice = true;

		// if the user chose paypal payment, set it to submission data
		if (isset($data["ezfc_element"][$fe->id]) && $ezfc->get_target_value_from_input($fe->id, $data["ezfc_element"][$fe->id]) == "paypal") {
			$force_paypal = true;
			$ezfc->submission_data["force_paypal"] = true;
		}
	}
}

// recaptcha in form?
if ($has_recaptcha) {
	$recaptcha_fail_message = __("Recaptcha failed, please try again.", "ezfc");

	if (empty($data["g-recaptcha-response"])) {
		ezfc_send_ajax($ezfc->send_message("error", $recaptcha_fail_message));
		die();
	}

	$privatekey = get_option("ezfc_captcha_private");
	$recaptcha_user = $data["g-recaptcha-response"];

	// new
	$recaptcha_query = http_build_query(array(
		"secret"   => $privatekey,
		"response" => $recaptcha_user,
		"remoteip" => $_SERVER["REMOTE_ADDR"]
	));

	$recaptcha_result = null;
	$recaptcha_url = "https://www.google.com/recaptcha/api/siteverify?{$recaptcha_query}";
	// recaptcha result via file_get_contents
	if ( ini_get('allow_url_fopen')) {
		$recaptcha_result = json_decode(file_get_contents($recaptcha_url));
	}
	else if (function_exists("curl_version")) {
		$ch = curl_init();
		curl_setopt ($ch, CURLOPT_URL, $recaptcha_url);
		curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 10);
		curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
		$recaptcha_result_tmp = curl_exec($ch);

		if (curl_errno($ch)) {
			$ezfc->debug(__("Unable to get ReCaptchaResponse.", "ezfc"));
		}
		else {
			curl_close($ch);
			$recaptcha_result = json_decode($recaptcha_result_tmp);
		}
	}
	else {
		ezfc_send_ajax($ezfc->send_message("error", __("Unable to use ReCaptcha since neither allow_url_fopen nor curl is installed.", "ezfc")));
		die();
	}

	if (!is_object($recaptcha_result) || !isset($recaptcha_result->success)) {
		ezfc_send_ajax($ezfc->send_message("error", $recaptcha_fail_message));
		die();
	}
}

$total = $ezfc->get_total($data["ezfc_element"]);

// price request
if (!empty($data["price_requested"]) && $form_options["price_show_request"] == 1) {
	ezfc_send_ajax(array(
		"price_requested" => $total
	));

	die();
}

// check for minimum price
if (isset($form_options["min_submit_value"]) && $form_options["min_submit_value"] != "") {
	if ($total < $form_options["min_submit_value"]) {
		$replaced_message = str_replace("%s", $form_options["min_submit_value"], $form_options["min_submit_value_text"]);
		ezfc_send_ajax($ezfc->send_message("error", $replaced_message));
		die();
	}
}
// check for maximum price
if (isset($form_options["max_submit_value"]) && $form_options["max_submit_value"] != "") {
	if ($total > $form_options["max_submit_value"]) {
		$replaced_message = str_replace("%s", $form_options["max_submit_value"], $form_options["max_submit_value_text"]);
		ezfc_send_ajax($ezfc->send_message("error", $replaced_message));
		die();
	}
}

// summary
if (!empty($data["summary"]) && $form_options["summary_enabled"] == 1) {
	ezfc_send_ajax(array(
		"summary" => $ezfc->get_mail_output($ezfc->submission_data, true)
	));

	die();
}

// hard submit
if ($form_options["hard_submit"] == 1) {
	ezfc_send_ajax(array(
		"hard_submit" => 1
	));

	die();
}

// check if form uses paypal
if (($use_payment_choice && $force_paypal) || $form_options["pp_enabled"] == 1) {
	if (session_id() == '') {
	    session_start();
	}

	$_SESSION["Payment_Amount"] = $ezfc->get_total($data["ezfc_element"]);

	// get item name / description
	global $ezfc_item_options;
	$ezfc_item_options = array(
		"name" => $form_options["pp_item_name"],
		"desc" => $form_options["pp_item_desc"]
	);

	require_once(EZFC_PATH . "lib/paypal/expresscheckout.php");
	$ret = Ezfc_paypal::checkout();

	// paypal error :(
	if (isset($ret["error"])) {
		ezfc_send_ajax(array($ret));
		die();
	}

	// insert submission details
	$ezfc->insert($id, $data["ezfc_element"], $data["ref_id"], false, array("id" => 1, "transaction_id" => "", "token" => $ret["token"]));

	ezfc_send_ajax(array(
		"paypal" => $ret["url"]
	));
}
// preview success
else if ($preview_id !== null) {
	ezfc_send_ajax(array("success" => 1));
}
else {
	// insert into db
	ezfc_send_ajax($ezfc->insert($id, $data["ezfc_element"], $data["ref_id"]));
}

die();

function ezfc_send_ajax($msg) {
	// check for errors in array
	if (is_array($msg)) {
		foreach ($msg as $m) {
			if (is_array($m) && $m["error"]) {
				echo json_encode($m);

				return;
			}
		}
	}

	echo json_encode($msg);
}