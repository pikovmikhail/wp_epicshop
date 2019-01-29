<?php

namespace WPaaS\Log\Components;

use \WPaaS\Log\Timer;

if ( ! defined( 'ABSPATH' ) ) {

	exit;

}

final class EasyMode extends Component {

	/**
	 * Make sure callback is only added if wizard is not done
	 */
	protected function do_callbacks_on_hooks() {

		if ( ! get_option( 'wpem_done' ) ) {

			parent::do_callbacks_on_hooks();

		}

	}

	/**
	 * Fires when easy-mode is done and send the data to asap
	 *
	 * @action wpem_done
	 */
	public function callback_wpem_done() {

		Timer::stop();

		$summary = 'Easy Mode Data'; // i18n not required

		$wpem_log = get_option( \WPEM\Log::OPTION_KEY );

		if ( $wpem_log ) {

			$wpem_log = json_decode( $wpem_log, true );

			$this->log(
				'log',
				$summary,
				$wpem_log
			);

		}

	}

}
