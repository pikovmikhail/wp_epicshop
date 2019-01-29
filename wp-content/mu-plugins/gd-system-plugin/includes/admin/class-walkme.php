<?php

namespace WPaaS\Admin;

use WPaaS\Plugin;

if ( ! defined( 'ABSPATH' ) ) {

	exit;

}

final class WalkMe {

	/**
	 * Class constructor.
	 */
	public function __construct() {

		add_action( 'init', [ $this, 'init' ] );

	}

	/**
	 * Initialize for logged in users only.
	 *
	 * @action init
	 */
	public function init() {

		if ( ! is_user_logged_in() || ! Plugin::is_gd() || ! Plugin::has_used_wpem() ) {

			return;

		}

		add_action( 'admin_enqueue_scripts', [ $this, 'dns_prefetch' ], 2 );
		add_action( 'admin_enqueue_scripts', [ $this, 'inline_scripts' ], PHP_INT_MAX );

		// Only print on the front-end during Page Builder sessions
		if ( ! is_admin() && isset( $_GET['fl_builder'] ) ) {

			add_action( 'wp_enqueue_scripts', [ $this, 'dns_prefetch' ], 2 );
			add_action( 'wp_enqueue_scripts', [ $this, 'inline_scripts' ], PHP_INT_MAX );

		}

	}

	/**
	 * Print DNS prefetch elements.
	 *
	 * @action admin_enqueue_scripts
	 * @action wp_enqueue_scripts
	 */
	public function dns_prefetch() {

		echo '<link rel="dns-prefetch" href="//cdn.walkme.com" />' . PHP_EOL;
		echo '<link rel="dns-prefetch" href="//s3.amazonaws.com" />' . PHP_EOL; // Called inside *_https.js

	}

	/**
	 * Print inline scripts.
	 *
	 * @action admin_enqueue_scripts
	 * @action wp_enqueue_scripts
	 */
	public function inline_scripts() {

		echo $this->data();

		$url = Plugin::is_env( 'prod' ) ? 'https://cdn.walkme.com/users/d0d425e1bc584619956e4a08cef17319/walkme_d0d425e1bc584619956e4a08cef17319_https.js' : 'https://cdn.walkme.com/users/d0d425e1bc584619956e4a08cef17319/test/walkme_d0d425e1bc584619956e4a08cef17319_https.js';

		?>
		<script type="text/javascript">(function() {var walkme = document.createElement('script'); walkme.type = 'text/javascript'; walkme.async = true; walkme.src = '<?php echo esc_url( $url ); ?>'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(walkme, s); window._walkmeConfig = {smartLoad:true}; })();</script>
		<?php

	}

	/**
	 * Print user data variable.
	 */
	private function data() {

		$user  = wp_get_current_user();
		$users = count_users();
		$theme = wp_get_theme();

		unset( $users['avail_roles']['none'] );

		$data = [
			'account' => [
				'fqdn'     => gethostname(),
				'login'    => Plugin::account_id(),
				'php'      => PHP_VERSION,
				'reseller' => Plugin::reseller_id(),
				'staging'  => Plugin::is_staging_site(),
				'xid'      => Plugin::xid(),
			],
			'user' => [
				'id'     => $user->ID,
				'locale' => get_user_locale(),
				'role'   => ! empty( $user->roles[0] ) ? $user->roles[0] : '',
			],
			'wp' => [
				'blog_id'              => get_current_blog_id(),
				'easy_mode'            => $this->get_wpem_timestamp(),
				'first_login'          => get_option( 'gd_system_first_login', null ),
				'locale'               => get_locale(),
				'multisite'            => is_multisite(),
				'parent_theme'         => $this->get_parent_theme(),
				'parent_theme_version' => $this->get_parent_theme( 'Version' ),
				'plugins'              => $this->get_active_plugins_array(),
				'site_id'              => is_multisite() ? (int) get_current_site()->id : 1,
				'site_url'             => site_url(),
				'temp_domain'          => Plugin::is_temp_domain(),
				'theme'                => $theme->get_stylesheet(),
				'theme_version'        => $theme->get( 'Version' ),
				'total_users'          => ! empty( $users['total_users'] ) ? $users['total_users'] : 1,
				'user_roles'           => ! empty( $users['avail_roles'] ) ? $users['avail_roles'] : [ 'administrator' => 1 ],
				'version'              => $GLOBALS['wp_version'],
				'wpaas'                => Plugin::version(),
			],
		];

		?>
		<script type="text/javascript">
		/* <![CDATA[ */
		var walkMeUserData = <?php echo wp_json_encode( $data ); ?>;
		/* ]]> */
		</script>
		<?php

	}

	/**
	 * Return the parent theme stylesheet slug, or a specific property.
	 *
	 * @param  string $property (optional)
	 *
	 * @return string|null
	 */
	private function get_parent_theme( $property = null ) {

		$template = get_template();

		if ( get_stylesheet() === $template ) {

			return null; // Current theme is not a child theme

		}

		$parent = wp_get_theme( $template );

		if ( ! $parent->exists() ) {

			return null; // Current theme's parent is missing

		}

		return ( $property ) ? $parent->get( $property ) : $parent->get_stylesheet();

	}

	/**
	 * Return an array of active plugins and their version.
	 *
	 * @return array
	 */
	private function get_active_plugins_array() {

		if ( ! function_exists( 'get_plugins' ) ) {

			require_once ABSPATH . 'wp-admin/includes/plugin.php';

		}

		$active_plugins = array_intersect_key(
			get_plugins(), // All plugins
			array_flip( (array) get_option( 'active_plugins', [] ) ) // Active plugins
		);

		foreach ( $active_plugins as &$plugin ) {

			$plugin = $plugin['Version'];

		}

		return $active_plugins;

	}

	/**
	 * Return a Unix timestamp of when WPEM was completed.
	 *
	 * @return int|null
	 */
	private function get_wpem_timestamp() {

		$log = json_decode( (string) get_option( 'wpem_log', '' ), true );

		if ( empty( $log['datetime'] ) || empty( $log['took'] ) ) {

			return null;

		}

		return strtotime( sprintf( '%s + %s seconds', $log['datetime'], round( $log['took'] ) ) );

	}

}
