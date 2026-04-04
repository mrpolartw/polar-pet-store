<?php
/**
 * Plugin Name: MrPolar API
 * Plugin URI:  https://mrpolar.com
 * Description: REST API and admin tools for the MrPolar membership system.
 * Version:     1.0.0
 * Author:      MrPolar
 * Text Domain: mrpolar-api
 */

defined('ABSPATH') || exit;

define('MRPOLAR_API_VERSION', '1.0.0');
define('MRPOLAR_API_NAMESPACE', 'mrpolar/v1');

require_once plugin_dir_path(__FILE__) . 'includes/class-member.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-admin-member.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-auth.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-customer.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-cors.php';

add_action('rest_api_init', function () {
    MrPolar_Member::register_routes();
    MrPolar_Auth::register_routes();
    MrPolar_Customer::register_routes();
});

add_action('admin_menu', ['MrPolar_Admin_Member', 'register_menus']);
add_action('init', ['MrPolar_Cors', 'handle_cors']);
