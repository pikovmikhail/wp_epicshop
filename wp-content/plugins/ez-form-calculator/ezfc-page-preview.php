<?php

defined( 'ABSPATH' ) OR exit;

if (!isset($_GET["nonce"])) {
	echo __("This page is intended for preview purposes.", "ezfc");
	die();
}

// security nonce
$nonce = $_GET["nonce"];

if (!wp_verify_nonce($nonce, "ezfc-preview-nonce")) {
	echo __("Unable to verify security nonce. Please refresh this page.", "ezfc");
	die();
}

$preview_id = (int) $_GET["preview_id"];

?>

<div class="ezfc wrap ezfc-wrapper container-fluid">
	<div class="row">
		<div class="col-lg-12">
			<div class="inner">
				<?php
				Ezfc_shortcode::$add_script = true;
				Ezfc_shortcode::wp_head();
				echo do_shortcode("[ezfc preview='{$preview_id}' /]");
				Ezfc_shortcode::print_script();
				?>
			</div>
		</div>
	</div>
</div>