<?php

defined( 'ABSPATH' ) OR exit;

require_once(EZFC_PATH . "class.ezfc_backend.php");
$ezfc = new Ezfc_backend();
$message = "";

// validate user
if (!empty($_POST)) $ezfc->validate_user("ezfc-nonce", "nonce");

$global_settings = Ezfc_settings::get_global_settings(true);

// clear logs
if (isset($_REQUEST["clear_logs"]) && $_REQUEST["clear_logs"] == 1) {
	$ezfc->clear_debug_log();
	$message = __("Logs cleared.", "ezfc");
}

$debug_active = get_option("ezfc_debug_mode", 0)==1 ? true : false;
$debug_log    = $ezfc->get_debug_log();

$icons = array(
	"good" => "<i class='fa fa-check'></i>",
	"bad"  => "<i class='fa fa-times'></i>"
);

$debug_vars = array(
	"php_version"  => phpversion(),
	"wp_version"   => get_bloginfo("version"),
	"magic_quotes" => get_magic_quotes_gpc()==0 ? "Off" : "On",
	"file_get_contents" => function_exists("file_get_contents") ? "On" : "Off"
);

?>

<div class="ezfc wrap ezfc-wrapper container-fluid">
	<div class="row">
		<div class="col-lg-12">
			<div class="inner">
				<h2><?php echo __("Help / debug", "ezfc"); ?> - ez Form Calculator v<?php echo EZFC_VERSION; ?></h2> 
				<p>
					<a class="button button-primary" href="http://ez-form-calculator.ezplugins.de/documentation/" target="_blank"><?php echo __("Open documentation site", "ezfc"); ?></a>
				</p>

				<p>
					<?php echo sprintf(__("If you have found any bugs, please report them to %s. Thank you!", "ezfc"), "<a href='mailto:support@ezplugins.de'>support@ezplugins.de</a>"); ?>
				</p>
			</div>
		</div>

		<?php if (!empty($message)) { ?>
			<div class="col-lg-12">
				<div class="inner">
					<div id="message" class="updated"><?php echo $message; ?></div>
				</div>
			</div>
		<?php } ?>
	</div>
	
	<div class="row">
		<div class="col-lg-4">
			<div class="inner">
				<h3>Debug log</h3>

				<p><?php echo sprintf(__("Debug mode is %s", "ezfc"), $debug_active ? __("active", "ezfc") : __("inactive", "ezfc")); ?>.</p>
				<textarea class="ezfc-settings-type-textarea" style="height: 400px;"><?php echo $debug_log; ?></textarea>

				<form action="" method="POST">
					<input type="hidden" value="1" name="clear_logs" />
					<input type="submit" value="Clear logs" class="button button-primary" />
				</form>
			</div>
		</div>

		<div class="col-lg-4">
			<div class="inner">
				<h3><?php echo __("Environment Vars", "ezfc"); ?></h3>

				<?php
				$out = array();
				$out[] = "<table>";
				foreach ($debug_vars as $key => $var) {
					$out[] = "<tr>";
					$out[] = "	<td>";
					$out[] = 		$key;
					$out[] = "	</td><td>";
					$out[] = 		$var;
					$out[] = "	</td>";
					$out[] = "</tr>";
				}
				$out[] = "</table>";

				echo implode("", $out);
				?>
			</div>
		</div>

		<div class="col-lg-4">
			<a class="twitter-timeline" href="https://twitter.com/ezPlugins" data-widget-id="575319170478383104">Tweets by @ezPlugins</a>
			<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
		</div>
	</div>
</div>
