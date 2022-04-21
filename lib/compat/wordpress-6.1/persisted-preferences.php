<?php
/**
 * Server-side requirements for database persisted preferences.
 *
 * @package gutenberg
 */

/**
 * Register the user meta for persisted preferences.
 */
function gutenberg_configure_persisted_preferences() {
	// Create a meta key that incorporates the blog prefix so that each site
	// on a multisite can have distinct user preferences.
	global $wpdb;
	$meta_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	register_meta(
		'user',
		$meta_key,
		array(
			'type'         => 'object',
			'single'       => true,
			'show_in_rest' => array(
				'name'    => 'persisted_preferences',
				'type'    => 'object',
				'context' => array( 'edit' ),
				'schema'  => array(
					'type'                 => 'object',
					'properties'           => array(
						'__modified' => array(
							'description' => __( 'The date and time the preferences were updated.', 'default' ),
							'type'        => 'string',
							'format'      => 'date-time',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
					),
					'additionalProperties' => true,
				),
			),
		)
	);

	$user_id = get_current_user_id();
	if ( empty( $user_id ) ) {
		return;
	}

	$preload_data = get_user_meta( $user_id, $meta_key, true );

	wp_add_inline_script(
		'wp-preferences',
		sprintf(
			'( function() {
				var serverData = %s;
				var userId = "%s";
				var localStorageRestoreKey = "WP_PREFERENCES_USER_" + userId;
				var localData = JSON.parse(
					localStorage.getItem( localStorageRestoreKey )
				);

				// Date parse returns NaN for invalid input. Coerce anything invalid
				// into a conveniently comparable zero.
				var serverModified =
				    Date.parse( serverData && serverData.__modified ) || 0;
				var localModified =
				    Date.parse( localData && localData.__modified ) || 0;

				var preloadedData;
				if ( serverData && serverModified >= localModified ) {
					preloadedData = serverData;
				} else if ( localData ) {
					preloadedData = localData;
				} else {
					// Check if there is data in the legacy format from the old persistence system.
					const convertLegacyLocalStorageData =
					    wp.databasePersistenceLayer.__unstableConvertLegacyLocalStorageData;
					preloadedData = convertLegacyLocalStorageData( userId );
				}

				var create = wp.databasePersistenceLayer.create;
				var persistenceLayer = create( { preloadedData, localStorageRestoreKey } );
				var preferencesStore = wp.preferences.store;
				wp.data.dispatch( "core/preferences" ).setPersistenceLayer( persistenceLayer );
			} ) ();',
			wp_json_encode( $preload_data ),
			$user_id
		),
		'after'
	);

}

add_action( 'init', 'gutenberg_configure_persisted_preferences' );

/**
 * Register dependencies for the inline script that configures the persistence layer.
 *
 * Note: When porting this to core update the code here:
 * https://github.com/WordPress/wordpress-develop/blob/d2ab3d183740c3d1252cb921b18005495007e022/src/wp-includes/script-loader.php#L251-L258
 *
 * And make the same update to the gutenberg client assets file here:
 * https://github.com/WordPress/gutenberg/blob/3f3c8df23c70a37b7ac4dddebc82030362133593/lib/client-assets.php#L242-L254
 *
 * The update should be adding a new case like this like this:
 * ```
 * case 'wp-preferences':
 *     array_push( $dependencies, 'wp-database-persistence-layer' );
 *     break;
 * ```
 *
 * @param WP_Scripts $scripts An instance of WP_Scripts.
 */
function gutenberg_update_database_persistence_layer_deps( $scripts ) {
	$persistence_script = $scripts->query( 'wp-preferences', 'registered' );
	if ( isset( $persistence_script->deps ) ) {
		array_push( $persistence_script->deps, 'wp-database-persistence-layer' );
	}
}

add_action( 'wp_default_scripts', 'gutenberg_update_database_persistence_layer_deps', 11 );
