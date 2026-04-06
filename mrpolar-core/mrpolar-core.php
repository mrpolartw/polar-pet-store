<?php
/**
 * Plugin Name: MrPolar Core
 * Plugin URI:  https://mrpolar.com
 * Description: MrPolar 會員管理系統核心模組
 * Version:     1.0.0
 * Author:      MrPolar
 * Text Domain: mrpolar-api
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * WC requires at least: 8.0
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

if (!defined('MRPOLAR_API_VERSION')) {
    define('MRPOLAR_API_VERSION', '1.0.0');
}

if (!defined('MRPOLAR_API_PLUGIN_FILE')) {
    define('MRPOLAR_API_PLUGIN_FILE', __FILE__);
}

if (!defined('MRPOLAR_API_PLUGIN_DIR')) {
    define('MRPOLAR_API_PLUGIN_DIR', plugin_dir_path(__FILE__));
}

if (!defined('MRPOLAR_API_PLUGIN_URL')) {
    define('MRPOLAR_API_PLUGIN_URL', plugin_dir_url(__FILE__));
}

spl_autoload_register(function (string $class): void {
    if (strpos($class, 'MrPolar_') !== 0) {
        return;
    }

    $filename = 'class-' . strtolower(str_replace(['MrPolar_', '_'], ['', '-'], $class)) . '.php';
    $path = MRPOLAR_API_PLUGIN_DIR . 'includes/' . $filename;

    if (file_exists($path)) {
        require_once $path;
    }
});

function mrpolar_api_init(): void {
    if (!class_exists('WooCommerce')) {
        return;
    }

    MrPolar_REST_Member::boot();
    MrPolar_Order_Hooks::boot();
    MrPolar_Points_Shortcode::boot();

    if (is_admin()) {
        MrPolar_Admin_Member::boot();
        MrPolar_Admin_Tiers::boot();

        add_action('admin_menu',            ['MrPolar_Admin_Member', 'register_menus']);
        add_action('admin_menu',            ['MrPolar_Admin_Tiers',  'register_menus']);
        add_action('admin_enqueue_scripts', 'mrpolar_enqueue_admin_assets');
    }
}
add_action('plugins_loaded', 'mrpolar_api_init', 10);

/**
 * 後台資產載入：css + js + SortableJS
 */
function mrpolar_enqueue_admin_assets(string $hook): void {
    // 只在 MrPolar 管理頁面載入
    if (
        strpos($hook, 'mrpolar') === false &&
        strpos($hook, 'page_mrpolar') === false
    ) {
        return;
    }

    wp_enqueue_style(
        'mrpolar-admin',
        MRPOLAR_API_PLUGIN_URL . 'assets/admin.css',
        [],
        MRPOLAR_API_VERSION
    );

    // SortableJS 由 CDN 載入
    wp_enqueue_script(
        'sortablejs',
        'https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js',
        [],
        '1.15.3',
        true
    );

    wp_enqueue_script(
        'mrpolar-admin',
        MRPOLAR_API_PLUGIN_URL . 'assets/admin.js',
        ['jquery', 'sortablejs'],
        MRPOLAR_API_VERSION,
        true
    );
}

function mrpolar_api_activate(): void {
    flush_rewrite_rules();

    if (!get_option('mrpolar_api_installed')) {
        update_option('mrpolar_api_installed', MRPOLAR_API_VERSION);
    }
}
register_activation_hook(__FILE__, 'mrpolar_api_activate');
