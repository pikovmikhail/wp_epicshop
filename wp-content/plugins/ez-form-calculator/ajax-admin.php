<?php

defined( 'ABSPATH' ) OR exit;

if (get_option("ezfc_debug_mode", 0) == 1) {
	@error_reporting(E_ALL);
	@ini_set("display_errors", "On");
}

global $wpdb;

require_once(EZFC_PATH . "class.ezfc_functions.php");
require_once(EZFC_PATH . "class.ezfc_backend.php");
$ezfc = new Ezfc_backend();

parse_str($_REQUEST["data"], $data);

$action = $data["action"];
$id 	= isset($data["id"])   ? (int) $data["id"] : 0;
$f_id 	= isset($data["f_id"]) ? (int) $data["f_id"] : 0;
$nonce  = $data["nonce"];

if (!wp_verify_nonce($nonce, "ezfc-nonce")) {
	ezfc_send_ajax(array("error" => __("Unable to verify security nonce. Please refresh this page."), "ezfc"));
	die();
}

/**
	actions
**/
switch ($action) {
	case "form_add":
		if ($ezfc->form_get_count() >= 1) {
			ezfc_send_ajax(array("error" => __("Only 1 form per site allowed in the free version", "ezfc")));
			die();
		}

		$new_form_id = $ezfc->form_add($id);

		$ret = array(
			"elements" => $ezfc->form_elements_get($new_form_id),
			"form"     => $ezfc->form_get($new_form_id),
			"options"  => $ezfc->form_get_options($new_form_id)
		);

		ezfc_send_ajax($ret);
	break;

	case "form_clear":
		ezfc_send_ajax($ezfc->form_clear($f_id));
	break;

	case "form_delete":
		ezfc_send_ajax($ezfc->form_delete($f_id));
	break;

	case "form_delete_submissions":
		ezfc_send_ajax($ezfc->form_delete_submissions($f_id));
	break;

	case "form_download":
		$file = $ezfc->form_get_export_download($f_id);

		if (is_array($file) && isset($file["error"])) {
			ezfc_send_ajax($file);
			die();
		}

		ezfc_send_ajax(array(
			"download_url" => $file["file_url"]
		));
	break;

	case "form_duplicate":
		ezfc_send_ajax($ezfc->form_duplicate($f_id));
	break;

	case "form_element_change":
		if (!isset($data["fe_id"])) {
			ezfc_send_ajax(array("error" => __("Invalid data.", "ezfc")));
			die();
		}

		$fe_id = (int) $data["fe_id"];
		ezfc_send_ajax($ezfc->form_element_change($id, $fe_id));
	break;

	case "form_file_delete":
		ezfc_send_ajax($ezfc->form_file_delete($id));
	break;

	case "form_get":
		$ret = array(
			"elements"          => $ezfc->form_elements_get($id),
			"form"              => $ezfc->form_get($id),
			"options"           => $ezfc->form_get_options($id),
			"submissions_count" => $ezfc->form_get_submissions_count($id)
		);

		ezfc_send_ajax($ret);
	break;

	case "form_get_csv_submissions":
		$file = $ezfc->form_get_submissions_csv($f_id);

		if (is_array($file) && isset($file["error"])) {
			ezfc_send_ajax($file);
			die();
		}

		ezfc_send_ajax(array(
			"download_url" => $file["file_url"]
		));
	break;

	case "form_get_submissions":
		$ret = array(
			"files"       => $ezfc->form_get_submissions_files($f_id),
			"submissions" => $ezfc->form_get_submissions($f_id)
		);

		ezfc_send_ajax($ret);
	break;

	case "form_import_data":
	case "form_import_upload":
		// import by file upload
		if (!empty($_FILES)) {
			$import_data_json = EZFC_Functions::zip_read($_FILES["import_file"]["tmp_name"], "ezfc_form_export_data.json");
			
			if (!empty($import_data_json["error"])) {
				ezfc_send_ajax($import_data_json);
				die();
			}
		}
		// import by text
		else if (!empty($data["import_data"])) {
			$import_data_json = $data["import_data"];
		}
		// empty
		else {
			ezfc_send_ajax(array("error" => __("Empty form data or invalid file format", "ezfc")));
			die();
		}

		$import_data_json = json_decode($import_data_json);

		// elements couldn't be parsed - let's try with stripslashes
		if (!$import_data_json) {
			$import_data_json = json_decode(stripslashes($data["import_data"]));

			// still no luck - tell the user to remove special characters
			if (!$import_data_json) {
				ezfc_send_ajax(array("error" => __("Unable to import elements.", "ezfc")));
				die();
			}
		}

		ezfc_send_ajax($ezfc->form_import($import_data_json));
	break;

	case "form_preview":
	case "form_save":
	case "form_save_post":
		$preview = $action == "form_preview";

		if (!$preview) {
			// update form info
			$ezfc->form_update($id, $data["ezfc-form-name"]);
		}

		$elements_save = array();

		// replace ' with entity
		$data["elements"] = str_replace("\'", "&#39;", $data["elements"]);
		$elements = json_decode($data["elements"]);

		// empty form
		if (is_array($elements) && count($elements) < 1) {
			ezfc_send_ajax(1);
			die();
		}

		// elements couldn't be parsed - let's try with stripslashes
		if (!$elements) {
			$elements = json_decode(stripslashes($data["elements"]));

			// still no luck - tell the user to remove special characters
			if (!$elements) {
				ezfc_send_ajax(array("error" => __("Unable to save elements, please remove any special characters before saving.", "ezfc")));
				die();
			}
		}

		// empty form
		if (is_array($elements) && count($elements) < 1 && !$preview) {
			ezfc_send_ajax(1);
			die();
		}

		foreach ($elements as $element) {
			$tmp_str = $element->name . "=" . urlencode($element->value);
			parse_str($tmp_str, $tmp_save);
			
			$elements_save = EZFC_Functions::array_merge_recursive_distinct($elements_save, $tmp_save);
		}

		// preview
		if ($preview) {
			$ezfc->form_save_preview($id, $elements_save["elements"], $data["opt"]);

			$preview_nonce = wp_create_nonce("ezfc-preview-nonce");
			ezfc_send_ajax(array(
				"preview_url" => admin_url("admin.php") . "?page=ezfc-preview&preview_id={$id}&nonce={$preview_nonce}"
			));
		}
		else {
			// update form elements
			$res = $ezfc->form_elements_save($id, $elements_save["elements"]);
			if ($res !== 1) {
				ezfc_send_ajax($res);
				die();
			}

			if ($action == "form_save_post") {
				// send post url
				ezfc_send_ajax($ezfc->form_add_post($id));
			}
			else {
				ezfc_send_ajax($res);
			}
		}
	break;

	case "form_save_template":
		ezfc_send_ajax($ezfc->form_save_template($f_id));
	break;

	case "form_show_export":
		$ret = $ezfc->form_get_export_data(null, $f_id);

		ezfc_send_ajax($ret);
	break;

	case "form_submission_delete":
		ezfc_send_ajax($ezfc->form_submission_delete($f_id));
	break;

	case "form_template_delete":
		ezfc_send_ajax($ezfc->form_template_delete($id));
	break;

	case "form_update_options":
		$message = array();
		$update_result = $ezfc->form_update_options($f_id, $data["opt"]);

		// check for error
		if (!empty($update_result) && is_array($update_result)) {
			$message = array(
				"error" => __("Invalid form options", "ezfc"),
				"error_options" => json_encode($update_result)
			);
		}
		// no error
		else {
			$message = array("success" => __("Settings updated.", "ezfc"));
		}

		ezfc_send_ajax($message);
	break;

	case "elements_get":
		$ret = array(
			"elements" => $ezfc->elements_get()
		);

		ezfc_send_ajax($ret);
	break;

	case "element_get":
		$ret = array(
			"element" => $ezfc->element_get($id)
		);

		ezfc_send_ajax($ret);
	break;

	case "form_element_add":
		$f_id = isset($data["f_id"]) ? $data["f_id"] : null;
		$e_id = isset($data["e_id"]) ? $data["e_id"] : null;
		//$type = isset($data["type"]) ? $data["type"] : null;
		$element_settings = isset($data["element_settings"]) ? $data["element_settings"] : array();

		$extension_data = null;
		if (isset($data["extension"])) {
			// extension_id = $e_id
			$extension_data = json_encode(apply_filters("ezfc_element_data_{$e_id}", $e_id));
		}

		$new_element_id = $ezfc->form_element_add($f_id, $e_id, $extension_data, $element_settings);

		if (is_array($new_element_id)) {
			ezfc_send_ajax($new_element_id);
			return;
		}

		ezfc_send_ajax($ezfc->form_element_get($new_element_id));
	break;

	case "form_element_delete":
		$child_element_ids = isset($data["child_element_ids"]) ? $data["child_element_ids"] : null;
		
		ezfc_send_ajax($ezfc->form_element_delete($id, $child_element_ids));
	break;

	case "form_element_duplicate":
		$element_data = isset($data["elements"]) ? $data["elements"][$id] : null;

		ezfc_send_ajax($ezfc->form_element_duplicate($id, $element_data));
	break;
}

die();

function ezfc_send_ajax($msg) {
	// check for errors in array
	if (is_array($msg)) {
		foreach ($msg as $m) {
			if (is_array($m) && isset($m["error"])) {
				echo json_encode($m);

				return;
			}
		}
	}

	echo json_encode($msg);
}

?>