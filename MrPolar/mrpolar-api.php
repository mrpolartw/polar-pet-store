<?php
/**
 * Plugin Name: MrPolar API
 * Plugin URI:  https://mrpolar.com
 * Description: 自定義 REST API：會員註冊、寵物資料、點數系統
 * Version:     1.0.0
 * Author:      MrPolar
 * Text Domain: mrpolar-api
 */

defined('ABSPATH') || exit;

define('MRPOLAR_API_VERSION', '1.0.0');
define('MRPOLAR_API_NAMESPACE', 'mrpolar/v1');

// ============================================================
// 載入各模組
// ============================================================
require_once plugin_dir_path(__FILE__) . 'includes/class-auth.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-customer.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-cors.php';

// ============================================================
// 啟動
// ============================================================
add_action('rest_api_init', function () {
    MrPolar_Auth::register_routes();
    MrPolar_Customer::register_routes();
});

add_action('init', ['MrPolar_Cors', 'handle_cors']);
