<?php

defined( 'ABSPATH' ) OR exit;

require_once(EZFC_PATH . "class.ezfc_functions.php");
require_once(EZFC_PATH . "class.ezfc_backend.php");
$ezfc = new Ezfc_backend();

if (!empty($_REQUEST["manual_update"])) {
	$ezfc->setup_db();
	$ezfc->upgrade();
}

$elements  = $ezfc->elements_get();
$forms     = $ezfc->forms_get();
$settings  = $ezfc->get_options();
$templates = $ezfc->form_templates_get();

// elements -> js var
$elements_js = array();
foreach ($elements as $e) {
	$elements_js[$e->id] = $e;
}

// categorize elements for improved overview
$elements_cat = array();
foreach ($elements as $e) {
	$elements_cat[$e->category][] = $e;
}

$elements_cat = apply_filters("ezfc_add_elements", $elements_cat);

// categorize settings
$settings_cat = array();
foreach ($settings as $cat => $s) {
	$settings_cat[$cat] = $s;
}

// security nonce
$nonce = wp_create_nonce("ezfc-nonce");

// purchase dialog
$page_views  = get_option("ezfc_page_views", 1);
update_option("ezfc_page_views", ++$page_views);
$show_dialog = $page_views%3 == 0;

// notification
$notification = "";
$old_version  = get_option("ezfc_version", "1.0");

// show manual update notification
if ($old_version != "1.0" && version_compare($old_version, "2.9.4.1") < 0 && version_compare($old_version, EZFC_VERSION) < 0) {
	$notification  = "<div class='updated'>";
	$notification .= __("It seems that you have manually updated the plugin. Please perform the following update:", "ezfc");
	$notification .= "<br><br>";
	$notification .= "<a class='button button-primary' href='" . admin_url("admin.php") . "?page=ezfc&manual_update=1'>" . __("Manual update", "ezfc") . "</a>";
	$notification .= "</div>";

	echo $notification;
}

// get wp posts
$wp_posts_raw = get_posts(array(
	"numberposts" => 100
));

$wp_posts = array(
	0 => array("id" => 0, "title" => __("No post selected.", "ezfc"))
);
if (count($wp_posts_raw) > 0) {
	foreach ($wp_posts_raw as $post) {
		$wp_posts[$post->ID] = array(
			"id"    => $post->ID,
			"title" => $post->post_title
		);
	}
}

$purchase_action = "<p>You are using the free version of ez Form Calculator. Purchase the premium plugin for many more elements and features!</p>";
$purchase_action .= '<p><a class="button button-primary" href="http://codecanyon.net/item/ez-form-calculator-wordpress-plugin/7595334?ref=keksdieb" target="_blank">Purchase now</a></p>';

?>

<div class="ezfc wrap ezfc-wrapper container-fluid">
	<div class="row">
		<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
			<div class="inner">
				<?php echo "<h2 class='heading-title'>" . __("Overview", "ezfc") . " - ez Form Calculator Free v" . EZFC_VERSION . " <span class='ezfc-loading'><i class='fa fa-cog fa-spin'></i></span></h2>"; ?>

				<div class="ezfc-error notice notice-error" id="ezfc-error"></div>
				<div class="ezfc-message" id="ezfc-message"></div>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-lg-2 col-md-2 col-sm-4 col-xs-12">
			<div class="inner">
				<h3><?php echo __("Add form", "ezfc"); ?></h3>

				<ul class="ezfc-template-list">
					<li>
						<select id="ezfc-form-template-id" name="ezfc-form-template-id">
							<option value="0"><?php echo __("Blank", "ezfc"); ?></option>

							<?php
							$out = "";
							foreach ($templates as $t) {
								$out .= "<option value='{$t->id}'>{$t->name}</option>";
							}
							echo $out;
							?>
						</select>
					</li>
					<li class="button button-primary" data-action="form_add" data-ot="<?php echo __("Add form", "ezfc"); ?>"><i class='fa fa-fw fa-plus-square-o'></i></li>
					<li class="button" data-action="form_template_delete" data-ot="<?php echo __("Delete template", "ezfc"); ?>"><i class='fa fa-fw fa-times'></i></li>
					<li class="button" data-action="form_show_import" id="ezfc-form-import" data-ot="<?php echo __("Import form", "ezfc"); ?>"><i class='fa fa-fw fa-upload'></i></li>
				</ul>
			</div>
		</div>

		<div class="ezfc-hidden col-lg-8 col-md-8 col-sm-6 col-xs-12 ezfc-inline-list ezfc-form-elements-actions">
			<div class="inner">
				<h3><?php echo __("Actions", "ezfc"); ?></h3>

				<ul>
					<li id="ezfc-form-save" class="button button-primary" data-action="form_save"><i class='fa fa-fw fa-floppy-o'></i> <?php echo __("Update form", "ezfc"); ?></li>
					<li id="ezfc-form-save-post" class="button" data-action="form_save_post" data-ot="<?php echo __("Save / update form to post", "ezfc"); ?>"><i class='fa fa-fw fa-pencil-square-o'></i></li>
					<li id="ezfc-form-show-options" class="button" data-action="form_show_options"><i class='fa fa-fw fa-cogs'></i> <?php echo __("Options", "ezfc"); ?></li>

					<li class="ezfc-separator"></li>

					<li id="ezfc-form-show" class="button" data-action="form_show"><i class='fa fa-fw fa-list-alt' data-ot="<?php echo __("Show form", "ezfc"); ?>"></i></li>
					<li id="ezfc-form-show-submissions" class="button" data-action="form_get_submissions" data-ot="<?php echo __("Show submissions", "ezfc"); ?>"><i class='fa fa-fw fa-envelope'></i> (<span id="ezfc-form-submissions-count">0</span>)</li>

					<li class="ezfc-separator"></li>

					<li id="ezfc-form-duplicate" class="button" data-action="form_duplicate" data-ot="<?php echo __("Duplicate form", "ezfc"); ?>"><i class='fa fa-fw fa-files-o'></i></li>
					<li id="ezfc-form-save-template" class="button" data-action="form_save_template" data-ot="<?php echo __("Save current form as template", "ezfc"); ?>"><i class='fa fa-fw fa-star'></i></li>

					<li class="ezfc-separator"></li>

					<li id="ezfc-form-import" class="button" data-action="form_show_export" data-ot="<?php echo __("Show form export data", "ezfc"); ?>"><i class='fa fa-fw fa-file-code-o'></i></li>
					<li id="ezfc-form-import" class="button" data-action="form_download" data-ot="<?php echo __("Download form", "ezfc"); ?>"><i class='fa fa-fw fa-download'></i></li>

					<li class="ezfc-separator"></li>

					<li id="ezfc-form-clear" class="button" data-action="form_clear" data-ot="<?php echo __("Clear form (delete all elements)", "ezfc"); ?>"><i class='fa fa-fw fa-eraser'></i></li>
					<li id="ezfc-form-delete" class="button" data-action="form_delete" data-ot="<?php echo __("Delete form", "ezfc"); ?>"><i class='fa fa-fw fa-times'></i></li>

					<li class="ezfc-separator"></li>

					<li id="ezfc-toggle-element-ids" class="button" data-action="toggle_element_info" data-ot="<?php echo __("Toggle element info", "ezfc"); ?>"><i class='fa fa-fw fa-info-circle'></i></li>
				</ul>

				<a class="button button-primary" href="http://www.ezplugins.de/link/ezfc-free-page-main/" target="_blank" style="width: auto">Buy now!</a>
			</div>
		</div>

		<div class="ezfc-hidden col-lg-2 col-md-2 col-sm-2 col-xs-12 ezfc-form-elements-actions ezfc-form-shortcodes">
			<div class="inner">
				<h3><?php echo __("Shortcode", "ezfc"); ?></h3>
				<input id="ezfc-shortcode-id" type="text" readonly /><br />
				<input id="ezfc-shortcode-name" type="text" readonly />
			</div>
		</div>

	</div>
	<div class="row">
		<div class="col-lg-2 col-md-2 col-sm-12 col-xs-12 ezfc-forms">
			<div class="inner">
				<h3><?php echo __("Forms", "ezfc"); ?></h3>

				<ul class="ezfc-forms-list">
					<li class="button clone" data-action="form_get" data-selectgroup="forms"></li>

					<?php
					foreach ($forms as $f) {
						echo "
							<li class='button ezfc-form' data-id='{$f->id}' data-action='form_get' data-selectgroup='forms'>
								<i class='fa fa-fw fa-list-alt'></i> {$f->id} - <span class='ezfc-form-name'>{$f->name}</span>
							</li>
						";
					}
					?>
				</ul>
			</div>
		</div>

		<div class="ezfc-hidden col-lg-8 col-md-8 col-sm-12 col-xs-12 ezfc-form-elements-container" id="ezfc-form-elements-container">
			<div class="inner">
				<div class="ezfc-elements-show">
					<h3><?php echo __("Form elements", "ezfc"); ?></h3>

					<div id="empty-form-text">
						<?php echo __("<p>There are no elements in this form. You can add elements from the 'Add elements' section in the right sidebar.</p><p>Click on an element to add it to the end of the form or drag and drop to the desired position.</p>", "ezfc"); ?>
					</div>

					<form id="form-elements" name="ezfc-form-elements" action="" novalidate>
						<ul class="ezfc-form-elements" id="form-elements-list">
						</ul>
					</form>
				</div>
			</div>
		</div>

		<div class="ezfc-hidden col-lg-2 col-md-2 col-sm-12 col-xs-12 ezfc-form-options-wrapper" id="ezfc-form-options-wrapper">
			<div class="inner">
				<h3><label for="ezfc-form-name"><?php echo __("Name", "ezfc"); ?></label></h3>
				<input type="text" id="ezfc-form-name" name="ezfc-form-name" value="" />

				<h3><?php echo __("Add elements"); ?></h3>

				<div class="ezfc-elements-add ezfc-accordion" id="ezfc-elements-add">
					<h4 class="ezfc-cat-basic"><?php echo __("Basic", "ezfc"); ?></h4>
					<div>
						<ul class="ezfc-elements ezfc-cat-basic">
							<?php ezfc_list_elements($elements_cat["basic"], "form_element_add"); ?>
						</ul>
					</div>

					<h4 class="ezfc-cat-calc"><?php echo __("Calculation", "ezfc"); ?></h4>
					<div>
						<ul class="ezfc-elements ezfc-cat-calc">
							<?php ezfc_list_elements($elements_cat["calc"], "form_element_add"); ?>
						</ul>
					</div>

					<h4 class="ezfc-cat-other"><?php echo __("Other", "ezfc"); ?></h4>
					<div>
						<?php echo $purchase_action; ?>
					</div>

					<h4 class="ezfc-cat-steps"><?php echo __("Steps", "ezfc"); ?></h4>
					<div>
						<?php echo $purchase_action; ?>
					</div>

					<h4 class="ezfc-cat-predefined"><?php echo __("Predefined", "ezfc"); ?></h4>
					<div>
						<?php echo $purchase_action; ?>
					</div>
				</div>
			</div>
		</div>

		<!-- submissions -->
		<div class="ezfc-hidden col-lg-8 col-md-8 col-sm-8 col-xs-8 ezfc-form-submissions">
		</div>

	</div>

	<!-- options modal dialog -->
	<div class="ezfc-options-dialog ezfc-dialog" title="Form options">
		<form id="form-options" name="ezfc-form-options" action="" novalidate>
			<div id="ezfc-form-options">
				<div id="tabs">
					<ul>
						<?php
						$tabs = array_keys($settings_cat);

						foreach ($tabs as $i => $cat) {
							echo "<li><a href='#tab-{$i}'>{$cat}</a></li>";
						}
						?>
					</ul>

				    <?php

				    $tab_i = 0;
				    foreach ($settings_cat as $cat_name => $cat) {
						?>

						<div id="tab-<?php echo $tab_i; ?>">
							<?php
							echo Ezfc_Functions::get_settings_table($cat, "opt", "opt");
							?>
						</div>

						<?php

						$tab_i++;
					}
					?>
				</div>
			</div>

			<!-- placeholder for modal buttons -->
			<button class="button button-primary ezfc-option-save hidden" data-action="form_update_options" data-id=""><?php echo __("Update options", "ezfc"); ?></button>
		</form>
	</div>

	<!-- form import modal dialog -->
	<div class="ezfc-import-dialog ezfc-dialog" title="<?php echo __("Import form", "ezfc"); ?>">
		<form name="ezfc-form-import" action="" novalidate>
			<h3><?php echo __("Import data", "ezfc"); ?></h3>
			<textarea name="import_data" id="form-import-data"></textarea>

			<h3><?php echo __("Import file", "ezfc"); ?></h3>
			<p><?php echo __("The form will be imported automatically as soon as you select a file.", "ezfc"); ?></p>
			<p><?php echo __("Filetype allowed: .zip", "ezfc"); ?></p>
			<input type="file" name="import_file" id="ezfc_import_file" />
			
			<div class="ezfc-progress ezfc-progress-striped active">
				<div class="ezfc-bar ezfc-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0">
				<span class="sr-only">0% Complete</span>
		  	</div>

		  	<div id="ezfc-import-message"></div>

			<!-- placeholder for modal buttons -->
			<button class="button button ezfc-import-data hidden" data-action="form_import_data" data-id=""></button>
			<button class="button button ezfc-import-upload hidden" data-action="form_import_upload" data-id=""></button>
		</form>
	</div>

	<!-- form export modal dialog -->
	<div class="ezfc-export-dialog ezfc-default-dialog" title="<?php echo __("Export form", "ezfc"); ?>">
		<p><?php echo __("Export data", "ezfc"); ?></p>
		<textarea name="export_data" id="form-export-data"></textarea>
	</div>

	<!-- icons dialog -->
	<div class="ezfc-icons-dialog ezfc-default-dialog ezfc-dialog" title="<?php echo __("Icons", "ezfc"); ?>">
		<?php
		$icon_list = array('fa-500px','fa-adjust','fa-adn','fa-align-center','fa-align-justify','fa-align-left','fa-align-right','fa-amazon','fa-ambulance','fa-american-sign-language-interpreting','fa-anchor','fa-android','fa-angellist','fa-angle-double-down','fa-angle-double-left','fa-angle-double-right','fa-angle-double-up','fa-angle-down','fa-angle-left','fa-angle-right','fa-angle-up','fa-apple','fa-archive','fa-area-chart','fa-arrow-circle-down','fa-arrow-circle-left','fa-arrow-circle-o-down','fa-arrow-circle-o-left','fa-arrow-circle-o-right','fa-arrow-circle-o-up','fa-arrow-circle-right','fa-arrow-circle-up','fa-arrow-down','fa-arrow-left','fa-arrow-right','fa-arrow-up','fa-arrows','fa-arrows-alt','fa-arrows-h','fa-arrows-v','fa-asl-interpreting','fa-assistive-listening-systems','fa-asterisk','fa-at','fa-audio-description','fa-automobile','fa-backward','fa-balance-scale','fa-ban','fa-bank','fa-bar-chart','fa-bar-chart-o','fa-barcode','fa-bars','fa-battery-0','fa-battery-1','fa-battery-2','fa-battery-3','fa-battery-4','fa-battery-empty','fa-battery-full','fa-battery-half','fa-battery-quarter','fa-battery-three-quarters','fa-bed','fa-beer','fa-behance','fa-behance-square','fa-bell','fa-bell-o','fa-bell-slash','fa-bell-slash-o','fa-bicycle','fa-binoculars','fa-birthday-cake','fa-bitbucket','fa-bitbucket-square','fa-bitcoin','fa-black-tie','fa-blind','fa-bluetooth','fa-bluetooth-b','fa-bold','fa-bolt','fa-bomb','fa-book','fa-bookmark','fa-bookmark-o','fa-braille','fa-briefcase','fa-btc','fa-bug','fa-building','fa-building-o','fa-bullhorn','fa-bullseye','fa-bus','fa-buysellads','fa-cab','fa-calculator','fa-calendar','fa-calendar-check-o','fa-calendar-minus-o','fa-calendar-o','fa-calendar-plus-o','fa-calendar-times-o','fa-camera','fa-camera-retro','fa-car','fa-caret-down','fa-caret-left','fa-caret-right','fa-caret-square-o-down','fa-caret-square-o-left','fa-caret-square-o-right','fa-caret-square-o-up','fa-caret-up','fa-cart-arrow-down','fa-cart-plus','fa-cc','fa-cc-amex','fa-cc-diners-club','fa-cc-discover','fa-cc-jcb','fa-cc-mastercard','fa-cc-paypal','fa-cc-stripe','fa-cc-visa','fa-certificate','fa-chain','fa-chain-broken','fa-check','fa-check-circle','fa-check-circle-o','fa-check-square','fa-check-square-o','fa-chevron-circle-down','fa-chevron-circle-left','fa-chevron-circle-right','fa-chevron-circle-up','fa-chevron-down','fa-chevron-left','fa-chevron-right','fa-chevron-up','fa-child','fa-chrome','fa-circle','fa-circle-o','fa-circle-o-notch','fa-circle-thin','fa-clipboard','fa-clock-o','fa-clone','fa-close','fa-cloud','fa-cloud-download','fa-cloud-upload','fa-cny','fa-code','fa-code-fork','fa-codepen','fa-codiepie','fa-coffee','fa-cog','fa-cogs','fa-columns','fa-comment','fa-comment-o','fa-commenting','fa-commenting-o','fa-comments','fa-comments-o','fa-compass','fa-compress','fa-connectdevelop','fa-contao','fa-copy','fa-copyright','fa-creative-commons','fa-credit-card','fa-credit-card-alt','fa-crop','fa-crosshairs','fa-css3','fa-cube','fa-cubes','fa-cut','fa-cutlery','fa-dashboard','fa-dashcube','fa-database','fa-deaf','fa-deafness','fa-dedent','fa-delicious','fa-desktop','fa-deviantart','fa-diamond','fa-digg','fa-dollar','fa-dot-circle-o','fa-download','fa-dribbble','fa-dropbox','fa-drupal','fa-edge','fa-edit','fa-eject','fa-ellipsis-h','fa-ellipsis-v','fa-empire','fa-envelope','fa-envelope-o','fa-envelope-square','fa-envira','fa-eraser','fa-eur','fa-euro','fa-exchange','fa-exclamation','fa-exclamation-circle','fa-exclamation-triangle','fa-expand','fa-expeditedssl','fa-external-link','fa-external-link-square','fa-eye','fa-eye-slash','fa-eyedropper','fa-fa','fa-facebook','fa-facebook-f','fa-facebook-official','fa-facebook-square','fa-fast-backward','fa-fast-forward','fa-fax','fa-feed','fa-female','fa-fighter-jet','fa-file','fa-file-archive-o','fa-file-audio-o','fa-file-code-o','fa-file-excel-o','fa-file-image-o','fa-file-movie-o','fa-file-o','fa-file-pdf-o','fa-file-photo-o','fa-file-picture-o','fa-file-powerpoint-o','fa-file-sound-o','fa-file-text','fa-file-text-o','fa-file-video-o','fa-file-word-o','fa-file-zip-o','fa-files-o','fa-film','fa-filter','fa-fire','fa-fire-extinguisher','fa-firefox','fa-first-order','fa-flag','fa-flag-checkered','fa-flag-o','fa-flash','fa-flask','fa-flickr','fa-floppy-o','fa-folder','fa-folder-o','fa-folder-open','fa-folder-open-o','fa-font','fa-font-awesome','fa-fonticons','fa-fort-awesome','fa-forumbee','fa-forward','fa-foursquare','fa-frown-o','fa-futbol-o','fa-gamepad','fa-gavel','fa-gbp','fa-ge','fa-gear','fa-gears','fa-genderless','fa-get-pocket','fa-gg','fa-gg-circle','fa-gift','fa-git','fa-git-square','fa-github','fa-github-alt','fa-github-square','fa-gitlab','fa-gittip','fa-glass','fa-glide','fa-glide-g','fa-globe','fa-google','fa-google-plus','fa-google-plus-circle','fa-google-plus-official','fa-google-plus-square','fa-google-wallet','fa-graduation-cap','fa-gratipay','fa-group','fa-h-square','fa-hacker-news','fa-hand-grab-o','fa-hand-lizard-o','fa-hand-o-down','fa-hand-o-left','fa-hand-o-right','fa-hand-o-up','fa-hand-paper-o','fa-hand-peace-o','fa-hand-pointer-o','fa-hand-rock-o','fa-hand-scissors-o','fa-hand-spock-o','fa-hand-stop-o','fa-hard-of-hearing','fa-hashtag','fa-hdd-o','fa-header','fa-headphones','fa-heart','fa-heart-o','fa-heartbeat','fa-history','fa-home','fa-hospital-o','fa-hotel','fa-hourglass','fa-hourglass-1','fa-hourglass-2','fa-hourglass-3','fa-hourglass-end','fa-hourglass-half','fa-hourglass-o','fa-hourglass-start','fa-houzz','fa-html5','fa-i-cursor','fa-ils','fa-image','fa-inbox','fa-indent','fa-industry','fa-info','fa-info-circle','fa-inr','fa-instagram','fa-institution','fa-internet-explorer','fa-intersex','fa-ioxhost','fa-italic','fa-joomla','fa-jpy','fa-jsfiddle','fa-key','fa-keyboard-o','fa-krw','fa-language','fa-laptop','fa-lastfm','fa-lastfm-square','fa-leaf','fa-leanpub','fa-legal','fa-lemon-o','fa-level-down','fa-level-up','fa-life-bouy','fa-life-buoy','fa-life-ring','fa-life-saver','fa-lightbulb-o','fa-line-chart','fa-link','fa-linkedin','fa-linkedin-square','fa-linux','fa-list','fa-list-alt','fa-list-ol','fa-list-ul','fa-location-arrow','fa-lock','fa-long-arrow-down','fa-long-arrow-left','fa-long-arrow-right','fa-long-arrow-up','fa-low-vision','fa-magic','fa-magnet','fa-mail-forward','fa-mail-reply','fa-mail-reply-all','fa-male','fa-map','fa-map-marker','fa-map-o','fa-map-pin','fa-map-signs','fa-mars','fa-mars-double','fa-mars-stroke','fa-mars-stroke-h','fa-mars-stroke-v','fa-maxcdn','fa-meanpath','fa-medium','fa-medkit','fa-meh-o','fa-mercury','fa-microphone','fa-microphone-slash','fa-minus','fa-minus-circle','fa-minus-square','fa-minus-square-o','fa-mixcloud','fa-mobile','fa-mobile-phone','fa-modx','fa-money','fa-moon-o','fa-mortar-board','fa-motorcycle','fa-mouse-pointer','fa-music','fa-navicon','fa-neuter','fa-newspaper-o','fa-object-group','fa-object-ungroup','fa-odnoklassniki','fa-odnoklassniki-square','fa-opencart','fa-openid','fa-opera','fa-optin-monster','fa-outdent','fa-pagelines','fa-paint-brush','fa-paper-plane','fa-paper-plane-o','fa-paperclip','fa-paragraph','fa-paste','fa-pause','fa-pause-circle','fa-pause-circle-o','fa-paw','fa-paypal','fa-pencil','fa-pencil-square','fa-pencil-square-o','fa-percent','fa-phone','fa-phone-square','fa-photo','fa-picture-o','fa-pie-chart','fa-pied-piper','fa-pied-piper-alt','fa-pied-piper-pp','fa-pinterest','fa-pinterest-p','fa-pinterest-square','fa-plane','fa-play','fa-play-circle','fa-play-circle-o','fa-plug','fa-plus','fa-plus-circle','fa-plus-square','fa-plus-square-o','fa-power-off','fa-print','fa-product-hunt','fa-puzzle-piece','fa-qq','fa-qrcode','fa-question','fa-question-circle','fa-question-circle-o','fa-quote-left','fa-quote-right','fa-ra','fa-random','fa-rebel','fa-recycle','fa-reddit','fa-reddit-alien','fa-reddit-square','fa-refresh','fa-registered','fa-remove','fa-renren','fa-reorder','fa-repeat','fa-reply','fa-reply-all','fa-resistance','fa-retweet','fa-rmb','fa-road','fa-rocket','fa-rotate-left','fa-rotate-right','fa-rouble','fa-rss','fa-rss-square','fa-rub','fa-ruble','fa-rupee','fa-safari','fa-save','fa-scissors','fa-scribd','fa-search','fa-search-minus','fa-search-plus','fa-sellsy','fa-send','fa-send-o','fa-server','fa-share','fa-share-alt','fa-share-alt-square','fa-share-square','fa-share-square-o','fa-shekel','fa-sheqel','fa-shield','fa-ship','fa-shirtsinbulk','fa-shopping-bag','fa-shopping-basket','fa-shopping-cart','fa-sign-in','fa-sign-language','fa-sign-out','fa-signal','fa-signing','fa-simplybuilt','fa-sitemap','fa-skyatlas','fa-skype','fa-slack','fa-sliders','fa-slideshare','fa-smile-o','fa-snapchat','fa-snapchat-ghost','fa-snapchat-square','fa-soccer-ball-o','fa-sort','fa-sort-alpha-asc','fa-sort-alpha-desc','fa-sort-amount-asc','fa-sort-amount-desc','fa-sort-asc','fa-sort-desc','fa-sort-down','fa-sort-numeric-asc','fa-sort-numeric-desc','fa-sort-up','fa-soundcloud','fa-space-shuttle','fa-spinner','fa-spoon','fa-spotify','fa-square','fa-square-o','fa-stack-exchange','fa-stack-overflow','fa-star','fa-star-half','fa-star-half-empty','fa-star-half-full','fa-star-half-o','fa-star-o','fa-steam','fa-steam-square','fa-step-backward','fa-step-forward','fa-stethoscope','fa-sticky-note','fa-sticky-note-o','fa-stop','fa-stop-circle','fa-stop-circle-o','fa-street-view','fa-strikethrough','fa-stumbleupon','fa-stumbleupon-circle','fa-subscript','fa-subway','fa-suitcase','fa-sun-o','fa-superscript','fa-support','fa-table','fa-tablet','fa-tachometer','fa-tag','fa-tags','fa-tasks','fa-taxi','fa-television','fa-tencent-weibo','fa-terminal','fa-text-height','fa-text-width','fa-th','fa-th-large','fa-th-list','fa-themeisle','fa-thumb-tack','fa-thumbs-down','fa-thumbs-o-down','fa-thumbs-o-up','fa-thumbs-up','fa-ticket','fa-times','fa-times-circle','fa-times-circle-o','fa-tint','fa-toggle-down','fa-toggle-left','fa-toggle-off','fa-toggle-on','fa-toggle-right','fa-toggle-up','fa-trademark','fa-train','fa-transgender','fa-transgender-alt','fa-trash','fa-trash-o','fa-tree','fa-trello','fa-tripadvisor','fa-trophy','fa-truck','fa-try','fa-tty','fa-tumblr','fa-tumblr-square','fa-turkish-lira','fa-tv','fa-twitch','fa-twitter','fa-twitter-square','fa-umbrella','fa-underline','fa-undo','fa-universal-access','fa-university','fa-unlink','fa-unlock','fa-unlock-alt','fa-unsorted','fa-upload','fa-usb','fa-usd','fa-user','fa-user-md','fa-user-plus','fa-user-secret','fa-user-times','fa-users','fa-venus','fa-venus-double','fa-venus-mars','fa-viacoin','fa-viadeo','fa-viadeo-square','fa-video-camera','fa-vimeo','fa-vimeo-square','fa-vine','fa-vk','fa-volume-control-phone','fa-volume-down','fa-volume-off','fa-volume-up','fa-warning','fa-wechat','fa-weibo','fa-weixin','fa-whatsapp','fa-wheelchair','fa-wheelchair-alt','fa-wifi','fa-wikipedia-w','fa-windows','fa-won','fa-wordpress','fa-wpbeginner','fa-wpforms','fa-wrench','fa-xing','fa-xing-square','fa-y-combinator','fa-y-combinator-square','fa-yahoo','fa-yc','fa-yc-square','fa-yelp','fa-yen','fa-yoast','fa-youtube','fa-youtube-play','fa-youtube-square');

		$out = array();
		foreach ($icon_list as $icon) {
			$out[] = "<i class='fa fa-fw {$icon}' data-icon='{$icon}'></i>";
		}

		echo implode("", $out);
	?>
	</div>

	<!-- custom calculation functions -->
	<div class="ezfc-functions-dialog ezfc-default-dialog" id="ezfc-custom-calculation-functions" title="<?php echo __("Custom calculation functions", "ezfc"); ?>">
		<dl>
			<?php
			$calculation_functions = array(
				"ezfc_functions.get_value_from(id, is_text)" => __("Get the value from an element with the specific ID as the first parameter. The parameter is_text should be set to true if you do not want numbers returned since parseFloat() is used by default. Example:<br>", "ezfc") . "<pre>var tmp = ezfc_functions.get_value_from(126);\nprice = tmp + 10;</pre>"
			);

			foreach ($calculation_functions as $func => $desc) {
				echo "<dt>{$func}</dt><dd>{$desc}</dd>";
			} ?>
		</dl>
	</div>
</div>

<div id="ezfc-preview-dialog" class="ezfc-default-dialog" title="<?php echo __("Preview", "ezfc"); ?>"></div>

<?php if ($show_dialog) { ?>
	<div class="ezfc-dialog" id="ezfc-rating-dialog" title="<?php echo __("Buy premium version now!", "ezfc"); ?>" style="text-align: center;">
		<p>
			<a href="http://codecanyon.net/item/ez-form-calculator-wordpress-plugin/7595334?ref=keksdieb" target="_blank">
				<img src="https://0.s3.envato.com/files/148647500/inline_preview.jpg" alt="Buy premium version now!" />
			</a>
		</p>

		<p>
			<a class="button button-primary" href="http://www.ezplugins.de/link/ezfc-free-page-dialog/" target="_blank">Buy now!</a>
		</p>
	</div>
<?php } ?>

<!-- change element dialog -->
<div id="ezfc-change-element-dialog" class="ezfc-default-dialog ezfc-inline-list ezfc-inline-list-autowidth" title="<?php echo __("Change element", "ezfc"); ?>">
	<p>
		<?php echo __("Elements can be changed into different elements. Element data will only be transferred with matched element options, e.g. radio options will be lost when changed to an input element. However, radio options persist when it is changed to a checkbox or dropdown element.", "ezfc"); ?>
	</p>

	<?php
	foreach ($elements_cat as $cat) {
		ezfc_list_elements($cat, "form_element_change", array("group"));
	}
	?>
</div>

<!-- element data modal background -->
<div id="ezfc-element-data-modal"></div>

<script>
ezfc_debug_mode = <?php echo get_option("ezfc_debug_mode", 0); ?>;
ezfc_nonce = "<?php echo $nonce; ?>";
ezfc = {
	elements: <?php echo json_encode($elements_js); ?>
};
ezfc_wp_posts = <?php echo json_encode($wp_posts); ?>;
</script>


<?php
function ezfc_list_elements($elements, $action, $exclude = array()) {
	if (count($elements) < 1) return;

	foreach ($elements as $e) {
		$extension      = 0;
		$extension_data = "";

		// additional extension data
		if (!empty($e->extension)) {
			$extension = empty($e->extension) ? 0 : 1;
			$extension_data_json = json_encode(array(
				"id"   => $e->id,
				"icon" => $e->icon,
				"name" => $e->name,
				"type" => $e->name
			));

			$extension_data = "data-extension_data='{$extension_data_json}'";
		}

		if (in_array($e->type, $exclude)) continue;

		$description = str_replace('"', "'", $e->description);

		echo "<li class='button ezfc-element ezfc-elements-droppable' data-action='{$action}' data-id='{$e->id}' data-ot=\"{$description}\" data-extension='{$extension}' {$extension_data}><i class='fa fa-fw {$e->icon}'></i> {$e->name}</li>
		";
	}
}
?>