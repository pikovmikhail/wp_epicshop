<?php

defined( 'ABSPATH' ) OR exit;
if (!current_user_can('activate_plugins')) return;

require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

$tmp_path = plugin_dir_path(__FILE__);
require_once($tmp_path . "class.ezfc_settings.php");

// do not delete data
if (get_option("ezfc_uninstall_keep_data") == 1) return;

require_once(EZFC_PATH . "class.ezfc_backend.php");
$ezfc_backend = new Ezfc_backend();

foreach ($ezfc_backend->tables as $table) {
	$wpdb->query("DROP TABLE IF EXISTS `{$table}`");
}

// default global options
$options = Ezfc_settings::get_global_settings(true);

foreach ($options as $name => $option) {
	delete_option("ezfc_{$name}");
}