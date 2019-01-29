<?php
/** Enable W3 Total Cache */
define('WP_CACHE', true); // Added by W3 Total Cache

//Begin Really Simple SSL Server variable fix
$_SERVER["HTTPS"] = "on";
//END Really Simple SSL

//Begin Really Simple SSL Load balancing fix
$server_opts = array("HTTP_CLOUDFRONT_FORWARDED_PROTO" => "https", "HTTP_CF_VISITOR"=>"https", "HTTP_X_FORWARDED_PROTO"=>"https", "HTTP_X_FORWARDED_SSL"=>"on");
foreach( $server_opts as $option => $value ) {
if ( (isset($_ENV["HTTPS"]) && ( "on" == $_ENV["HTTPS"] )) || (isset( $_SERVER[ $option ] ) && ( strpos( $_SERVER[ $option ], $value ) !== false )) ) {
$_SERVER[ "HTTPS" ] = "on";
break;
}
}
//END Really Simple SSL

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'i3364447_wp1');

/** MySQL database username */
define('DB_USER', 'i3364447_wp1');

/** MySQL database password */
define('DB_PASSWORD', 'A~]EDSWO@]VPpk1F2T.96*&1');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'FiEfZF1ffrnft2A0sdxdPQ5u9OOUNTvqQrApd5Ywl70XyYELAY1I5AWxOVfvFbOt');
define('SECURE_AUTH_KEY',  'BgljeVIXVu1sUrfJL1KlIlFxaUoM9f5sb1rZXTIVtloo4lGAbx4uLDTCzah9BGrI');
define('LOGGED_IN_KEY',    'nO46LAqgovtuOfHu5o4ilTU5xrfmV7k8XIxfcd3yT0YhWIbkYahtfOLRKHV5cJRI');
define('NONCE_KEY',        'Yue9rLmzecRpR87ELTm26Z9TyBObnLERVCajvMPWpyqXbQCNuF2VArl3FROAMqy2');
define('AUTH_SALT',        'MiLBhBi6BUGwZOBTvdy3YUhDsXAdQSGU50FcCduNurkCf4Arx3ra8HqbWkpNEkpR');
define('SECURE_AUTH_SALT', 'mLIKz7pBWhwALXAyNWckZsjHwdlr4HwUJzds9yCz2LGRjC1z05q8av1HduTUJL0N');
define('LOGGED_IN_SALT',   'wFNZaWoDrO4ut6qtQaMGdYeCFf1gh42jJHakFeUOkMrMNJmyvwQP4DPvr9Z3hIgB');
define('NONCE_SALT',       'JVIbA1bYInHzvBZZJApVNwWrIm6jLrzXSE4vLCDqLUl8rntG59E314rT8YsHoHg6');

/**
 * Other customizations.
 */
define('FS_METHOD','direct');define('FS_CHMOD_DIR',0755);define('FS_CHMOD_FILE',0644);
define('WP_TEMP_DIR',dirname(__FILE__).'/wp-content/uploads');

/**
 * Turn off automatic updates since these are managed upstream.
 */
define('AUTOMATIC_UPDATER_DISABLED', true);


/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
