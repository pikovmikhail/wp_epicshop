<?php

defined( 'ABSPATH' ) OR exit;

require_once(EZFC_PATH . "class.ezfc_functions.php");
require_once(EZFC_PATH . "class.ezfc_backend.php");
$ezfc = new Ezfc_backend();

$forms = $ezfc->forms_get();

// security nonce
$nonce = wp_create_nonce("ezfc-nonce");

?>

<div class="ezfc wrap ezfc-wrapper container-fluid">
	<div class="row">
		<div class="col-lg-12">
			<div class="inner">
				<?php echo "<h2>" . __("Form submissions", "ezfc") . " - ez Form Calculator v" . EZFC_VERSION . " <span class='ezfc-loading'><i class='fa fa-cog fa-spin'></i></span></h2>"; ?>

				<div class="ezfc-error" id="ezfc-error"></div>
				<div class="ezfc-message" id="ezfc-message"></div>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-lg-12 ezfc-inline-list ezfc-form-elements-actions">
			<div class="inner">
				<h3><?php echo __("Actions", "ezfc"); ?></h3>

				<ul>
					<li id="ezfc-form-clear" class="button" data-action="form_delete_submissions" data-ot="<?php echo __("Delete all submissions of the selected form.", "ezfc"); ?>"><i class='fa fa-fw fa-eraser'></i> <?php echo __("Delete form submissions", "ezfc"); ?></li>

					<li class="ezfc-separator"></li>
					
					<li id="ezfc-form-export-csv" class="button" data-action="form_get_csv_submissions" data-ot="<?php echo __("Download form submissions as .csv file.", "ezfc"); ?>"><i class='fa fa-fw fa-th-list'></i> <?php echo __("Download CSV", "ezfc"); ?></li>
				</ul>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-lg-2 col-md-2 col-sm-12 col-xs-12 ezfc-forms">
			<div class="inner">
				<h3><?php echo __("Forms", "ezfc"); ?></h3>

				<ul class="ezfc-forms-list">
					<?php
					foreach ($forms as $f) {
						$submission_count = $ezfc->form_get_submissions_count($f->id);

						echo "
							<li class='button ezfc-form' data-id='{$f->id}' data-action='form_get_submissions' data-selectgroup='forms'>
								<i class='fa fa-fw fa-list-alt'></i> {$f->id} (<strong class='ezfc-submission-counter'>{$submission_count}</strong>) - <span class='ezfc-form-name'>{$f->name}</span>
							</li>
						";
					}
					?>
				</ul>
			</div>
		</div>

		<!-- submissions -->
		<div class="col-lg-10 col-md-10 col-sm-12 col-xs-12">
			<div class="inner">
				<h3><?php echo __("Submissions", "ezfc"); ?></h3>

				<div class="ezfc-form-submissions"></div>
			</div>
		</div>
	</div>
</div>

<script>
ezfc_debug_mode = <?php echo get_option("ezfc_debug_mode", 0); ?>;
ezfc_nonce = "<?php echo $nonce; ?>";
</script>