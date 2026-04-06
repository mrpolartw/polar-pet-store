<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_Admin_Member {

    private const MENU_SLUG        = 'mrpolar-members';
    private const LIST_PAGE_SLUG   = 'mrpolar-members';
    private const DETAIL_PAGE_SLUG = 'mrpolar-member';

    private const DEFAULT_COLUMNS = [
        'avatar',
        'name',
        'email',
        'phone',
        'tier',
        'points',
        'status',
        'registered',
        'line',
        'actions',
    ];

    private const ALLOWED_COLUMNS = [
        'avatar'     => '頭像',
        'name'       => '會員',
        'email'      => 'Email',
        'phone'      => '電話',
        'tier'       => '等級',
        'points'     => '點數',
        'spending'   => '年度消費',
        'pets'       => '毛孩數',
        'status'     => '狀態',
        'registered' => '加入日期',
        'line'       => 'LINE',
        'actions'    => '操作',
    ];

    private static ?self $instance = null;

    private string $table_members;
    private string $table_tiers;
    private string $table_pets;
    private string $table_addresses;
    private string $table_points_log;
    private string $table_permissions;

    public function __construct() {
        global $wpdb;
        $this->table_members     = $wpdb->prefix . 'mrpolar_members';
        $this->table_tiers       = $wpdb->prefix . 'mrpolar_member_tiers';
        $this->table_pets        = $wpdb->prefix . 'mrpolar_pets';
        $this->table_addresses   = $wpdb->prefix . 'mrpolar_addresses';
        $this->table_points_log  = $wpdb->prefix . 'mrpolar_points_log';
        $this->table_permissions = $wpdb->prefix . 'mrpolar_admin_permissions';
    }

    public static function boot(): void {
        if (!is_admin()) {
            return;
        }

        $instance = self::instance();

        add_action('admin_post_mrpolar_save_columns', [$instance, 'handle_save_columns']);
        add_action('admin_post_mrpolar_export_members', [$instance, 'handle_export_members']);
        add_action('admin_post_mrpolar_adjust_points', [$instance, 'handle_adjust_points']);
        add_action('admin_post_mrpolar_save_member_profile', [$instance, 'handle_save_member_profile']);
        add_action('admin_post_mrpolar_save_member_note', [$instance, 'handle_save_member_note']);
        add_action('admin_post_mrpolar_save_member_tier', [$instance, 'handle_save_member_tier']);
        add_action('admin_post_mrpolar_toggle_member_status', [$instance, 'handle_toggle_member_status']);
        add_action('admin_enqueue_scripts', [$instance, 'enqueue_assets']);
    }

    public static function register_menus(): void {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }

        $instance = self::instance();

        add_menu_page(
            'MrPolar 會員',
            'MrPolar 會員',
            'manage_woocommerce',
            self::MENU_SLUG,
            [$instance, 'render_member_list'],
            'dashicons-groups',
            56
        );

        add_submenu_page(
            self::MENU_SLUG,
            '會員列表',
            '會員列表',
            'manage_woocommerce',
            self::LIST_PAGE_SLUG,
            [$instance, 'render_member_list']
        );

        add_submenu_page(
            null,
            '會員詳情',
            '會員詳情',
            'manage_woocommerce',
            self::DETAIL_PAGE_SLUG,
            [$instance, 'render_member_detail']
        );
    }

    public function render_member_list(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'mrpolar-api'));
        }

        $state      = $this->get_member_list_state($_GET, true);
        $visible    = $this->get_visible_columns();
        $tiers      = $this->get_tier_options();
        $stats      = $this->get_stats();
        $members    = $this->get_member_rows($state, true);
        $totalItems = $this->count_members($state);

        echo $this->render_member_list_page($state, $visible, $tiers, $stats, $members, $totalItems);
    }

    public function handle_save_columns(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_save_columns', 'mrpolar_columns_nonce');

        $rawColumns = isset($_POST['columns']) ? wp_unslash($_POST['columns']) : [];
        $columns    = [];

        if (is_array($rawColumns)) {
            $allowed   = array_keys(self::ALLOWED_COLUMNS);
            $sanitized = array_map('sanitize_key', $rawColumns);

            foreach ($allowed as $columnKey) {
                if (in_array($columnKey, $sanitized, true)) {
                    $columns[] = $columnKey;
                }
            }
        }

        if (empty($columns)) {
            $columns = self::DEFAULT_COLUMNS;
        }

        update_user_meta(get_current_user_id(), 'mrpolar_columns', $columns);

        $redirectUrl = $this->sanitize_redirect_url(
            isset($_POST['redirect_to']) ? (string) wp_unslash($_POST['redirect_to']) : $this->get_list_page_url()
        );

        wp_safe_redirect($this->with_notice($redirectUrl, '欄位顯示設定已儲存', 'success'));
        exit;
    }

    public function handle_export_members(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to export members.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_export_members', 'mrpolar_export_nonce');

        $state   = $this->get_member_list_state($_REQUEST, false);
        $members = $this->get_member_rows($state, false);

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=members_' . wp_date('Ymd') . '.csv');

        $output = fopen('php://output', 'w');
        if (false === $output) {
            exit;
        }

        fwrite($output, "\xEF\xBB\xBF");
        fputcsv($output, ['ID', '顯示名稱', 'Email', '電話', '性別', '生日', '等級', '點數', '年度消費', '狀態', '註冊日期', 'LINE綁定']);

        foreach ($members as $member) {
            fputcsv($output, [
                intval($member['id']),
                (string) ($member['display_name'] ?? ''),
                (string) ($member['email'] ?? ''),
                (string) ($member['phone'] ?? ''),
                (string) ($member['gender'] ?? ''),
                (string) ($member['birthday'] ?? ''),
                (string) ($member['tier_name'] ?? ''),
                intval($member['points_balance'] ?? 0),
                (string) number_format((float) ($member['yearly_spending'] ?? 0), 2, '.', ''),
                $this->get_status_label((string) ($member['status'] ?? '')),
                (string) ($member['registered_at'] ?? ''),
                !empty($member['line_user_id']) ? '已綁定' : '未綁定',
            ]);
        }

        fclose($output);
        exit;
    }

    public function render_member_detail(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'mrpolar-api'));
        }

        $memberId = isset($_GET['id']) ? intval(wp_unslash((string) $_GET['id'])) : 0;
        if ($memberId <= 0) {
            wp_die(esc_html__('Invalid member ID.', 'mrpolar-api'));
        }

        $member = MrPolar_Member::get_member_by_id($memberId);
        if (empty($member)) {
            wp_die(esc_html__('Member not found.', 'mrpolar-api'));
        }

        $addresses = MrPolar_Member::get_addresses_by_member_id($memberId);
        $pets      = MrPolar_Member::get_pets_by_member_id($memberId);
        $points    = MrPolar_Member::get_points_summary($memberId, 50);

        echo $this->render_member_detail_page(
            $member,
            is_array($addresses) ? $addresses : [],
            is_array($pets) ? $pets : [],
            is_array($points) ? $points : []
        );
    }

    private static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function enqueue_assets(): void {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }

        $page = isset($_GET['page']) ? sanitize_key(wp_unslash((string) $_GET['page'])) : '';
        if (!in_array($page, [self::LIST_PAGE_SLUG, self::DETAIL_PAGE_SLUG], true)) {
            return;
        }

        wp_enqueue_style('mrpolar-admin', plugins_url('../assets/admin.css', __FILE__), [], defined('MRPOLAR_API_VERSION') ? MRPOLAR_API_VERSION : '1.0.0');
        wp_enqueue_script('jquery-ui-sortable');
        wp_enqueue_script(
            'mrpolar-admin',
            plugins_url('../assets/admin.js', __FILE__),
            ['jquery', 'jquery-ui-sortable'],
            defined('MRPOLAR_API_VERSION') ? MRPOLAR_API_VERSION : '1.0.0',
            true
        );

        wp_localize_script('mrpolar-admin', 'mrpolarAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('mrpolar_admin_nonce'),
        ]);
    }

    private function get_member_list_state(array $source, bool $persistPerPage): array {
        $search   = isset($source['search']) ? sanitize_text_field(wp_unslash((string) $source['search'])) : '';
        $tierId   = isset($source['tier_id']) ? intval(wp_unslash((string) $source['tier_id'])) : 0;
        $status   = isset($source['status']) ? sanitize_text_field(wp_unslash((string) $source['status'])) : '';
        $dateFrom = isset($source['date_from']) ? $this->sanitize_date((string) wp_unslash($source['date_from'])) : '';
        $dateTo   = isset($source['date_to']) ? $this->sanitize_date((string) wp_unslash($source['date_to'])) : '';
        $orderby  = isset($source['orderby']) ? sanitize_key(wp_unslash((string) $source['orderby'])) : 'registered_at';
        $order    = isset($source['order']) ? strtoupper(sanitize_text_field(wp_unslash((string) $source['order']))) : 'DESC';
        $paged    = isset($source['paged']) ? max(1, intval(wp_unslash((string) $source['paged']))) : 1;

        if (!in_array($status, ['active', 'suspended', 'deleted'], true)) {
            $status = '';
        }

        if (!in_array($orderby, ['registered_at', 'display_name', 'points_balance', 'yearly_spending'], true)) {
            $orderby = 'registered_at';
        }

        if (!in_array($order, ['ASC', 'DESC'], true)) {
            $order = 'DESC';
        }

        return [
            'search'    => $search,
            'tier_id'   => max(0, $tierId),
            'status'    => $status,
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
            'orderby'   => $orderby,
            'order'     => $order,
            'paged'     => $paged,
            'per_page'  => $this->resolve_per_page($source, $persistPerPage),
        ];
    }

    private function resolve_per_page(array $source, bool $persist): int {
        $allowedPerPage = [20, 50, 100];
        $rawPerPage     = isset($source['per_page']) ? intval(wp_unslash((string) $source['per_page'])) : 0;

        if (in_array($rawPerPage, $allowedPerPage, true)) {
            if ($persist) {
                update_user_meta(get_current_user_id(), 'mrpolar_per_page', $rawPerPage);
            }

            return $rawPerPage;
        }

        $savedPerPage = intval(get_user_meta(get_current_user_id(), 'mrpolar_per_page', true));
        return in_array($savedPerPage, $allowedPerPage, true) ? $savedPerPage : 20;
    }

    private function get_visible_columns(): array {
        $savedColumns = get_user_meta(get_current_user_id(), 'mrpolar_columns', true);
        $visible      = [];

        if (is_array($savedColumns)) {
            foreach (array_keys(self::ALLOWED_COLUMNS) as $columnKey) {
                if (in_array($columnKey, $savedColumns, true)) {
                    $visible[] = $columnKey;
                }
            }
        }

        return empty($visible) ? self::DEFAULT_COLUMNS : $visible;
    }

    private function get_member_rows(array $state, bool $withLimit): array {
        global $wpdb;

        $where = $this->build_member_where($state);
        $order = $this->get_orderby_sql($state['orderby']) . ' ' . $state['order'];
        $sql   = "
            SELECT
                m.*,
                t.tier_name,
                t.tier_color,
                t.tier_key,
                (SELECT COUNT(*) FROM {$this->table_pets} WHERE member_id = m.id) AS pet_count,
                (SELECT COUNT(*) FROM {$this->table_addresses} WHERE member_id = m.id) AS address_count,
                u.user_login,
                u.user_email AS wp_email
            FROM {$this->table_members} m
            LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
            LEFT JOIN {$wpdb->users} u ON u.ID = m.wp_user_id
            WHERE {$where['sql']}
            ORDER BY {$order}
        ";

        $params = $where['params'];

        if ($withLimit) {
            $sql      .= ' LIMIT %d OFFSET %d';
            $params[] = intval($state['per_page']);
            $params[] = max(0, (intval($state['paged']) - 1) * intval($state['per_page']));
        }

        $results = $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
        return is_array($results) ? $results : [];
    }

    private function count_members(array $state): int {
        global $wpdb;

        $where = $this->build_member_where($state);
        $sql   = "
            SELECT COUNT(*)
            FROM {$this->table_members} m
            LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
            LEFT JOIN {$wpdb->users} u ON u.ID = m.wp_user_id
            WHERE {$where['sql']}
        ";

        return intval($wpdb->get_var($wpdb->prepare($sql, $where['params'])));
    }

    private function build_member_where(array $state): array {
        global $wpdb;

        $conditions = ['1 = %d'];
        $params     = [1];

        if ('' !== $state['search']) {
            $like         = '%' . $wpdb->esc_like($state['search']) . '%';
            $conditions[] = '(m.email LIKE %s OR m.display_name LIKE %s OR m.phone LIKE %s)';
            $params[]     = $like;
            $params[]     = $like;
            $params[]     = $like;
        }

        if (intval($state['tier_id']) > 0) {
            $conditions[] = 'm.tier_id = %d';
            $params[]     = intval($state['tier_id']);
        }

        if ('' !== $state['status']) {
            $conditions[] = 'm.status = %s';
            $params[]     = $state['status'];
        }

        if ('' !== $state['date_from']) {
            $conditions[] = 'm.registered_at >= %s';
            $params[]     = $state['date_from'] . ' 00:00:00';
        }

        if ('' !== $state['date_to']) {
            $conditions[] = 'm.registered_at <= %s';
            $params[]     = $state['date_to'] . ' 23:59:59';
        }

        return ['sql' => implode(' AND ', $conditions), 'params' => $params];
    }

    private function get_orderby_sql(string $orderby): string {
        $map = [
            'registered_at'   => 'm.registered_at',
            'display_name'    => 'm.display_name',
            'points_balance'  => 'm.points_balance',
            'yearly_spending' => 'm.yearly_spending',
        ];

        return isset($map[$orderby]) ? $map[$orderby] : 'm.registered_at';
    }

    private function render_member_list_page(
        array $state,
        array $visibleColumns,
        array $tiers,
        array $stats,
        array $members,
        int $totalItems
    ): string {
        ob_start();
        ?>
        <div class="mrpolar-wrap">
            <?php echo $this->render_member_list_header($state, $visibleColumns); ?>
            <?php echo $this->render_notice(); ?>
            <?php echo $this->render_stats_row($stats); ?>
            <?php echo $this->render_filter_bar($state, $tiers); ?>
            <div class="mrpolar-card">
                <div class="mrpolar-header">
                    <h1><?php echo esc_html('找到 ' . number_format_i18n($totalItems) . ' 筆會員'); ?></h1>
                </div>
                <?php echo $this->render_member_table($state, $visibleColumns, $members); ?>
                <?php echo $this->render_pagination($state, $totalItems); ?>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_member_list_header(array $state, array $visibleColumns): string {
        ob_start();
        ?>
        <div class="mrpolar-header">
            <h1><?php echo esc_html('MrPolar 會員列表'); ?></h1>
            <div class="mrpolar-actions">
                <?php echo $this->render_column_toggle($visibleColumns, $state); ?>
                <?php echo $this->render_export_form($state); ?>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_column_toggle(array $visibleColumns, array $state): string {
        ob_start();
        ?>
        <form id="mrpolar-columns-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="mrpolar_save_columns">
            <input type="hidden" name="redirect_to" value="<?php echo esc_attr($this->get_list_page_url($state)); ?>">
            <?php echo wp_nonce_field('mrpolar_save_columns', 'mrpolar_columns_nonce', true, false); ?>
            <div class="mrpolar-col-toggle">
                <button type="button" class="mrpolar-col-toggle-btn"><?php echo esc_html('欄位顯示'); ?></button>
                <div class="mrpolar-col-dropdown">
                    <?php foreach (self::ALLOWED_COLUMNS as $key => $label) : ?>
                        <label>
                            <input type="checkbox" name="columns[]" value="<?php echo esc_attr($key); ?>" <?php checked(in_array($key, $visibleColumns, true)); ?>>
                            <span><?php echo esc_html($label); ?></span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>
        </form>
        <?php

        return (string) ob_get_clean();
    }

    private function render_export_form(array $state): string {
        $fields = [
            'search'    => $state['search'],
            'tier_id'   => intval($state['tier_id']),
            'status'    => $state['status'],
            'date_from' => $state['date_from'],
            'date_to'   => $state['date_to'],
            'orderby'   => $state['orderby'],
            'order'     => $state['order'],
        ];

        ob_start();
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="mrpolar_export_members">
            <?php echo wp_nonce_field('mrpolar_export_members', 'mrpolar_export_nonce', true, false); ?>
            <?php foreach ($fields as $name => $value) : ?>
                <input type="hidden" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr((string) $value); ?>">
            <?php endforeach; ?>
            <button type="submit" class="mrpolar-btn mrpolar-btn-secondary"><?php echo esc_html('匯出 CSV'); ?></button>
        </form>
        <?php

        return (string) ob_get_clean();
    }

    private function render_stats_row(array $stats): string {
        ob_start();
        ?>
        <div class="mrpolar-stat-row">
            <div class="mrpolar-stat-box">
                <div class="stat-value"><?php echo esc_html(number_format_i18n(intval($stats['total']))); ?></div>
                <div class="stat-label"><?php echo esc_html('全部會員'); ?></div>
            </div>
            <div class="mrpolar-stat-box">
                <div class="stat-value"><?php echo esc_html(number_format_i18n(intval($stats['this_month']))); ?></div>
                <div class="stat-label"><?php echo esc_html('本月新增'); ?></div>
            </div>
            <div class="mrpolar-stat-box">
                <div class="stat-value"><?php echo esc_html(number_format_i18n(intval($stats['line_bound']))); ?></div>
                <div class="stat-label"><?php echo esc_html('已綁定LINE'); ?></div>
            </div>
            <div class="mrpolar-stat-box">
                <div class="stat-value"><?php echo esc_html(number_format_i18n(intval($stats['total_points']))); ?></div>
                <div class="stat-label"><?php echo esc_html('總點數庫存'); ?></div>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_filter_bar(array $state, array $tiers): string {
        ob_start();
        ?>
        <form method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>" class="mrpolar-filters">
            <input type="hidden" name="page" value="<?php echo esc_attr(self::LIST_PAGE_SLUG); ?>">
            <input type="hidden" name="orderby" value="<?php echo esc_attr($state['orderby']); ?>">
            <input type="hidden" name="order" value="<?php echo esc_attr($state['order']); ?>">
            <label>
                <span><?php echo esc_html('搜尋'); ?></span>
                <input type="text" name="search" value="<?php echo esc_attr($state['search']); ?>" placeholder="<?php echo esc_attr('姓名 / Email / 電話'); ?>">
            </label>
            <label>
                <span><?php echo esc_html('等級'); ?></span>
                <select name="tier_id">
                    <option value="0"><?php echo esc_html('全部'); ?></option>
                    <?php foreach ($tiers as $tier) : ?>
                        <option value="<?php echo esc_attr((string) intval($tier['id'])); ?>" <?php selected(intval($state['tier_id']), intval($tier['id'])); ?>>
                            <?php echo esc_html((string) $tier['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label>
                <span><?php echo esc_html('狀態'); ?></span>
                <select name="status">
                    <option value=""><?php echo esc_html('全部'); ?></option>
                    <option value="active" <?php selected($state['status'], 'active'); ?>><?php echo esc_html('啟用中'); ?></option>
                    <option value="suspended" <?php selected($state['status'], 'suspended'); ?>><?php echo esc_html('停用'); ?></option>
                    <option value="deleted" <?php selected($state['status'], 'deleted'); ?>><?php echo esc_html('已刪除'); ?></option>
                </select>
            </label>
            <label>
                <span><?php echo esc_html('開始日期'); ?></span>
                <input type="date" name="date_from" value="<?php echo esc_attr($state['date_from']); ?>">
            </label>
            <label>
                <span><?php echo esc_html('結束日期'); ?></span>
                <input type="date" name="date_to" value="<?php echo esc_attr($state['date_to']); ?>">
            </label>
            <label>
                <span><?php echo esc_html('每頁'); ?></span>
                <select name="per_page">
                    <?php foreach ([20, 50, 100] as $perPage) : ?>
                        <option value="<?php echo esc_attr((string) $perPage); ?>" <?php selected(intval($state['per_page']), $perPage); ?>>
                            <?php echo esc_html((string) $perPage); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
            <button type="submit" class="mrpolar-btn mrpolar-btn-primary"><?php echo esc_html('搜尋'); ?></button>
            <a href="<?php echo esc_url($this->get_list_page_url()); ?>" class="mrpolar-btn mrpolar-btn-secondary"><?php echo esc_html('清除篩選'); ?></a>
        </form>
        <?php

        return (string) ob_get_clean();
    }

    private function render_member_table(array $state, array $visibleColumns, array $members): string {
        ob_start();
        ?>
        <div class="mrpolar-table-wrap">
            <table class="mrpolar-table">
                <thead>
                <tr>
                    <?php foreach ($visibleColumns as $columnKey) : ?>
                        <th scope="col"><?php echo $this->render_column_header($columnKey, $state); ?></th>
                    <?php endforeach; ?>
                </tr>
                </thead>
                <tbody>
                <?php if (empty($members)) : ?>
                    <tr>
                        <td colspan="<?php echo esc_attr((string) count($visibleColumns)); ?>" class="mrpolar-table-empty">
                            <?php echo esc_html('目前沒有符合條件的會員資料'); ?>
                        </td>
                    </tr>
                <?php else : ?>
                    <?php foreach ($members as $member) : ?>
                        <tr>
                            <?php foreach ($visibleColumns as $columnKey) : ?>
                                <td><?php echo $this->render_member_cell($columnKey, $member, $state); ?></td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_column_header(string $columnKey, array $state): string {
        $label = isset(self::ALLOWED_COLUMNS[$columnKey]) ? self::ALLOWED_COLUMNS[$columnKey] : $columnKey;
        $map   = [
            'name'       => 'display_name',
            'points'     => 'points_balance',
            'spending'   => 'yearly_spending',
            'registered' => 'registered_at',
        ];

        if (!isset($map[$columnKey])) {
            return esc_html($label);
        }

        $orderby   = $map[$columnKey];
        $nextOrder = ($state['orderby'] === $orderby && 'ASC' === $state['order']) ? 'DESC' : 'ASC';
        $url       = $this->get_list_page_url(array_merge($state, [
            'orderby' => $orderby,
            'order'   => $nextOrder,
            'paged'   => 1,
        ]));

        return sprintf('<a href="%1$s">%2$s</a>', esc_url($url), esc_html($label));
    }

    private function render_member_cell(string $columnKey, array $member, array $state): string {
        switch ($columnKey) {
            case 'avatar':
                return $this->render_avatar_cell($member);
            case 'name':
                return $this->render_name_cell($member);
            case 'email':
                return $this->render_email_cell($member);
            case 'phone':
                return esc_html((string) ($member['phone'] ?? ''));
            case 'tier':
                return $this->render_tier_badge($member);
            case 'points':
                return esc_html(number_format_i18n(intval($member['points_balance'] ?? 0)));
            case 'spending':
                return esc_html('NT$' . number_format_i18n((float) ($member['yearly_spending'] ?? 0), 0));
            case 'pets':
                return esc_html(number_format_i18n(intval($member['pet_count'] ?? 0)));
            case 'status':
                return $this->render_status_badge((string) ($member['status'] ?? ''));
            case 'registered':
                return esc_html($this->format_date((string) ($member['registered_at'] ?? '')));
            case 'line':
                return $this->render_line_badge(!empty($member['line_user_id']));
            case 'actions':
                return $this->render_actions_cell($member, $state);
        }

        return '';
    }

    private function render_avatar_cell(array $member): string {
        $avatarUrl = !empty($member['avatar_url']) ? esc_url((string) $member['avatar_url']) : '';
        $name      = trim((string) ($member['display_name'] ?? ''));

        if ('' !== $avatarUrl) {
            return sprintf(
                '<img src="%1$s" alt="%2$s" style="width:36px;height:36px;border-radius:999px;object-fit:cover;background:#f3f4f6;">',
                $avatarUrl,
                esc_attr($name)
            );
        }

        $initial = $this->get_initial($name);
        $color   = $this->get_placeholder_color(intval($member['id'] ?? 0));

        return sprintf(
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;background:%1$s;color:#fff;font-weight:700;">%2$s</span>',
            esc_attr($color),
            esc_html($initial)
        );
    }

    private function render_name_cell(array $member): string {
        $name      = trim((string) ($member['display_name'] ?? ''));
        $userLogin = (string) ($member['user_login'] ?? '');
        $detailUrl = add_query_arg([
            'page' => self::DETAIL_PAGE_SLUG,
            'id'   => intval($member['id'] ?? 0),
        ], admin_url('admin.php'));

        if ('' === $name) {
            $name = '未命名會員';
        }

        return sprintf(
            '<a href="%1$s"><strong>%2$s</strong></a><div style="margin-top:4px;color:#6b7280;font-size:12px;">%3$s</div>',
            esc_url($detailUrl),
            esc_html($name),
            esc_html($userLogin)
        );
    }

    private function render_email_cell(array $member): string {
        $email = (string) ($member['email'] ?? '');
        if ('' === $email) {
            return '';
        }

        return sprintf('<a href="%1$s">%2$s</a>', esc_url('mailto:' . $email), esc_html($email));
    }

    private function render_tier_badge(array $member): string {
        $tierName  = (string) ($member['tier_name'] ?? '');
        $tierColor = sanitize_hex_color((string) ($member['tier_color'] ?? ''));

        if ('' === $tierName) {
            $tierName = '未設定';
        }

        if (empty($tierColor)) {
            $tierColor = '#6b7280';
        }

        return sprintf(
            '<span class="mrpolar-tier-badge" style="background-color:%1$s;">%2$s</span>',
            esc_attr($tierColor),
            esc_html($tierName)
        );
    }

    private function render_status_badge(string $status): string {
        $class = 'status-active';
        if ('suspended' === $status) {
            $class = 'status-suspended';
        } elseif ('deleted' === $status) {
            $class = 'status-deleted';
        }

        return sprintf(
            '<span class="mrpolar-badge %1$s">%2$s</span>',
            esc_attr($class),
            esc_html($this->get_status_label($status))
        );
    }

    private function render_line_badge(bool $bound): string {
        return sprintf(
            '<span class="mrpolar-badge %1$s">%2$s</span>',
            esc_attr($bound ? 'line-bound' : 'line-unbound'),
            esc_html($bound ? '已綁定' : '未綁定')
        );
    }

    private function render_actions_cell(array $member, array $state): string {
        $memberId    = intval($member['id'] ?? 0);
        $detailUrl   = add_query_arg(['page' => self::DETAIL_PAGE_SLUG, 'id' => $memberId], admin_url('admin.php'));
        $status      = (string) ($member['status'] ?? '');
        $isActive    = 'active' === $status;
        $target      = $isActive ? 'suspended' : 'active';
        $buttonClass = $isActive ? 'mrpolar-btn-danger' : 'mrpolar-btn-primary';
        $buttonLabel = $isActive ? '停用' : '啟用';
        $confirmText = $isActive ? '確定要停用這位會員嗎？' : '確定要啟用這位會員嗎？';
        $toggleUrl   = add_query_arg([
            'action'      => 'mrpolar_toggle_member_status',
            'member_id'   => $memberId,
            'status'      => $target,
            'redirect_to' => $this->get_list_page_url($state),
        ], admin_url('admin-post.php'));

        $toggleUrl = wp_nonce_url($toggleUrl, 'mrpolar_toggle_member_status_' . $memberId);

        return sprintf(
            '<div class="mrpolar-actions"><a class="mrpolar-btn mrpolar-btn-sm mrpolar-btn-secondary" href="%1$s">%2$s</a><a class="mrpolar-btn mrpolar-btn-sm %3$s" href="%4$s" data-confirm="%5$s">%6$s</a></div>',
            esc_url($detailUrl),
            esc_html('編輯'),
            esc_attr($buttonClass),
            esc_url($toggleUrl),
            esc_attr($confirmText),
            esc_html($buttonLabel)
        );
    }

    private function render_pagination(array $state, int $totalItems): string {
        $perPage    = max(1, intval($state['per_page']));
        $totalPages = (int) ceil($totalItems / $perPage);

        if ($totalPages <= 1) {
            return '';
        }

        $args = $state;
        unset($args['paged']);
        $args['page']  = self::LIST_PAGE_SLUG;
        $args['paged'] = '%#%';

        $links = paginate_links([
            'base'      => add_query_arg($args, admin_url('admin.php')),
            'format'    => '',
            'current'   => max(1, intval($state['paged'])),
            'total'     => $totalPages,
            'type'      => 'array',
            'prev_text' => '上一頁',
            'next_text' => '下一頁',
        ]);

        if (empty($links) || !is_array($links)) {
            return '';
        }

        ob_start();
        ?>
        <div class="mrpolar-pagination">
            <?php foreach ($links as $link) : ?>
                <?php echo wp_kses_post($link); ?>
            <?php endforeach; ?>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_notice(): string {
        $message = isset($_GET['mrpolar_notice']) ? sanitize_text_field(wp_unslash((string) $_GET['mrpolar_notice'])) : '';
        if ('' === $message) {
            return '';
        }

        $type  = isset($_GET['mrpolar_notice_type']) ? sanitize_key(wp_unslash((string) $_GET['mrpolar_notice_type'])) : 'success';
        $class = 'success' === $type ? 'success' : 'error';

        return sprintf('<div class="mrpolar-notice %1$s">%2$s</div>', esc_attr($class), esc_html($message));
    }

    private function render_member_detail_page_legacy(array $member, array $addresses, array $pets, array $points): string {
        $backUrl       = $this->get_list_page_url();
        $pointsBalance = intval($member['points_balance'] ?? 0);
        $yearlySpend   = number_format_i18n((float) ($member['yearly_spending'] ?? 0), 0);
        $totalSpend    = number_format_i18n((float) ($member['total_spending'] ?? 0), 0);
        $logs          = isset($points['logs']) && is_array($points['logs']) ? $points['logs'] : [];

        ob_start();
        ?>
        <div class="mrpolar-wrap">
            <div class="mrpolar-header">
                <h1><?php echo esc_html('會員詳情 #' . intval($member['id'])); ?></h1>
                <div class="mrpolar-actions">
                    <a href="<?php echo esc_url($backUrl); ?>" class="mrpolar-btn mrpolar-btn-secondary"><?php echo esc_html('返回列表'); ?></a>
                </div>
            </div>

            <?php echo $this->render_notice(); ?>

            <div class="mrpolar-member-header">
                <?php echo $this->render_avatar_cell($member); ?>
                <div class="mrpolar-member-info">
                    <h2><?php echo esc_html((string) (($member['display_name'] ?? '') ?: '未命名會員')); ?></h2>
                    <div class="mrpolar-member-meta">
                        <span><?php echo esc_html((string) ($member['email'] ?? '')); ?></span>
                        <span><?php echo esc_html((string) ($member['phone'] ?? '')); ?></span>
                        <?php echo $this->render_tier_badge($member); ?>
                        <?php echo $this->render_status_badge((string) ($member['status'] ?? '')); ?>
                        <?php echo $this->render_line_badge(!empty($member['line_user_id'])); ?>
                    </div>
                </div>
                <div>
                    <div class="mrpolar-points-big"><?php echo esc_html(number_format_i18n($pointsBalance)); ?></div>
                    <div class="mrpolar-points-label"><?php echo esc_html('目前點數'); ?></div>
                </div>
            </div>

            <div class="mrpolar-grid-3">
                <div class="mrpolar-card">
                    <h3><?php echo esc_html('基本資料'); ?></h3>
                    <?php echo $this->render_key_value_list([
                        '會員ID'       => intval($member['id']),
                        'WordPress ID' => intval($member['wp_user_id']),
                        '姓名'         => (string) ($member['display_name'] ?? ''),
                        'Email'        => (string) ($member['email'] ?? ''),
                        '電話'         => (string) ($member['phone'] ?? ''),
                        '性別'         => (string) ($member['gender'] ?? ''),
                        '生日'         => (string) ($member['birthday'] ?? ''),
                        '註冊日期'     => $this->format_date((string) ($member['registered_at'] ?? ''), 'Y/m/d H:i'),
                    ]); ?>
                </div>
                <div class="mrpolar-card">
                    <h3><?php echo esc_html('消費與點數'); ?></h3>
                    <?php echo $this->render_key_value_list([
                        '點數餘額' => number_format_i18n($pointsBalance),
                        '累積點數' => number_format_i18n(intval($member['points_lifetime'] ?? 0)),
                        '年度消費' => 'NT$' . $yearlySpend,
                        '總消費'   => 'NT$' . $totalSpend,
                    ]); ?>
                </div>
                <div class="mrpolar-card">
                    <h3><?php echo esc_html('備註與帳號'); ?></h3>
                    <?php echo $this->render_key_value_list([
                        'LINE User ID' => (string) ($member['line_user_id'] ?? ''),
                        '帳號狀態'     => $this->get_status_label((string) ($member['status'] ?? '')),
                        '備註'         => (string) ($member['note'] ?? ''),
                    ]); ?>
                </div>
            </div>

            <div class="mrpolar-card">
                <h3><?php echo esc_html('地址列表'); ?></h3>
                <?php echo $this->render_simple_table(['標籤', '收件人', '電話', '地址', '預設'], $this->map_address_rows($addresses)); ?>
            </div>

            <div class="mrpolar-card">
                <h3><?php echo esc_html('毛孩列表'); ?></h3>
                <?php echo $this->render_simple_table(['名稱', '類型', '品種', '性別', '生日', '年齡', '體重'], $this->map_pet_rows($pets)); ?>
            </div>

            <div class="mrpolar-card">
                <h3><?php echo esc_html('最近 20 筆點數紀錄'); ?></h3>
                <?php echo $this->render_simple_table(['類型', '異動', '餘額', '原因', '操作人', '時間'], $this->map_point_rows($logs)); ?>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    /* ========================================
     * SECTION B-1: Member Detail Tabs
     * ====================================== */
    public function render_member_detail_page(array $member, array $addresses, array $pets, array $points): string {
        $memberId       = intval($member['id'] ?? 0);
        $wpUserId       = intval($member['wp_user_id'] ?? 0);
        $displayName    = trim((string) (($member['display_name'] ?? '') ?: '未命名會員'));
        $email          = (string) ($member['email'] ?? '');
        $phone          = (string) ($member['phone'] ?? '');
        $tierName       = (string) (($member['tier_name'] ?? '') ?: '未設定');
        $tierColor      = sanitize_hex_color((string) ($member['tier_color'] ?? ''));
        $tierColor      = $tierColor ?: '#6b7280';
        $status         = (string) ($member['status'] ?? 'active');
        $statusLabels   = [
            'active'    => ['class' => 'status-active', 'label' => '啟用中'],
            'suspended' => ['class' => 'status-suspended', 'label' => '停用'],
            'deleted'   => ['class' => 'status-deleted', 'label' => '已刪除'],
        ];
        $statusMeta     = $statusLabels[$status] ?? ['class' => 'status-active', 'label' => '啟用中'];
        $lineBound      = !empty($member['line_user_id']);
        $pointsBalance  = intval($member['points_balance'] ?? 0);
        $pointsLifetime = intval($member['points_lifetime'] ?? 0);
        $yearlySpending = (float) ($member['yearly_spending'] ?? 0);
        $totalSpending  = (float) ($member['total_spending'] ?? 0);
        $userLogin      = (string) ($member['user_login'] ?? '');
        $backUrl        = $this->get_list_page_url();
        $userEditUrl    = add_query_arg(['page' => self::DETAIL_PAGE_SLUG, 'id' => $memberId], admin_url('admin.php')) . '#mrpolar-member-profile-form';
        $isActive       = 'active' === $status;
        $toggleStatus   = $isActive ? 'suspended' : 'active';
        $toggleLabel    = $isActive ? '停用會員' : '啟用會員';
        $toggleConfirm  = $isActive ? '確定要停用這位會員嗎？' : '確定要啟用這位會員嗎？';
        $toggleUrl      = add_query_arg([
            'action'      => 'mrpolar_toggle_member_status',
            'member_id'   => $memberId,
            'status'      => $toggleStatus,
            'redirect_to' => add_query_arg(['page' => self::DETAIL_PAGE_SLUG, 'id' => $memberId], admin_url('admin.php')),
        ], admin_url('admin-post.php'));
        $toggleUrl      = wp_nonce_url($toggleUrl, 'mrpolar_toggle_member_status_' . $memberId);
        $nextTier       = MrPolar_Member::get_next_tier(intval($member['tier_sort_order'] ?? 0));
        $nextTierName   = (string) ($nextTier['tier_name'] ?? '');
        $nextTierMin    = isset($nextTier['upgrade_min_spending']) ? (float) $nextTier['upgrade_min_spending'] : 0.0;
        $tierOptions    = $this->get_tier_options();

        if ($nextTierMin <= 0 && isset($member['next_tier_min_spending'])) {
            $nextTierMin = (float) $member['next_tier_min_spending'];
        }

        $progressWidth = ($nextTierMin > 0)
            ? min(100, max(0, ($yearlySpending / $nextTierMin) * 100))
            : 100;

        $pointLogs = isset($points['logs']) && is_array($points['logs']) ? array_slice($points['logs'], 0, 50) : [];
        $changeTypeLabels = [
            'earn_order'    => '消費回饋',
            'earn_welcome'  => '加入贈點',
            'earn_birthday' => '生日贈點',
            'earn_event'    => '活動贈點',
            'earn_manual'   => '手動增加',
            'redeem_order'  => '訂單折抵',
            'deduct_manual' => '手動扣除',
            'deduct_expire' => '點數到期',
            'deduct_cancel' => '取消退扣',
        ];
        $addressRows = [];

        foreach ($addresses as $address) {
            $addressRows[] = [
                (string) ($address['label'] ?? ''),
                (string) ($address['recipient_name'] ?? $address['name'] ?? ''),
                (string) ($address['phone'] ?? ''),
                trim((string) ($address['city'] ?? '') . ' ' . (string) ($address['district'] ?? '')),
                (string) ($address['address'] ?? ''),
                (string) ($address['store_name'] ?? $address['storeName'] ?? ''),
                !empty($address['is_default']) ? '是' : '否',
            ];
        }

        ob_start();
        ?>
        <div class="mrpolar-wrap">
            <div class="mrpolar-header">
                <h1><?php echo esc_html('會員詳情'); ?></h1>
                <div class="mrpolar-actions">
                    <a href="<?php echo esc_url($backUrl); ?>" class="mrpolar-btn mrpolar-btn-secondary"><?php echo esc_html('返回列表'); ?></a>
                    <span class="mrpolar-badge"><?php echo esc_html('會員ID #' . $memberId); ?></span>
                </div>
            </div>

            <div class="mrpolar-member-header">
                <?php echo $this->render_avatar_cell($member); ?>
                <div class="mrpolar-member-info">
                    <h2><?php echo esc_html($displayName); ?></h2>
                    <div class="mrpolar-member-meta">
                        <?php if ('' !== $email) : ?>
                            <a href="<?php echo esc_url('mailto:' . $email); ?>"><?php echo esc_html($email); ?></a>
                        <?php endif; ?>
                        <?php if ('' !== $phone) : ?>
                            <span><?php echo esc_html($phone); ?></span>
                        <?php endif; ?>
                        <span class="mrpolar-tier-badge" style="background-color:<?php echo esc_attr($tierColor); ?>;"><?php echo esc_html($tierName); ?></span>
                        <span class="mrpolar-badge <?php echo esc_attr($statusMeta['class']); ?>"><?php echo esc_html($statusMeta['label']); ?></span>
                        <span class="mrpolar-badge <?php echo esc_attr($lineBound ? 'line-bound' : 'line-unbound'); ?>"><?php echo esc_html($lineBound ? '已綁定' : '未綁定'); ?></span>
                    </div>
                </div>
                <div>
                    <div class="mrpolar-points-big"><?php echo esc_html(number_format_i18n($pointsBalance)); ?></div>
                    <div class="mrpolar-points-label"><?php echo esc_html('目前點數'); ?></div>
                </div>
                <div class="mrpolar-member-quick-actions">
                    <button type="button" class="mrpolar-btn mrpolar-btn-primary" data-toggle-form="#mrpolar-points-form"><?php echo esc_html('調整點數'); ?></button>
                    <a href="<?php echo esc_url($userEditUrl); ?>" class="mrpolar-btn mrpolar-btn-secondary"><?php echo esc_html('編輯資料'); ?></a>
                    <a href="<?php echo esc_url($toggleUrl); ?>" class="mrpolar-btn <?php echo esc_attr($isActive ? 'mrpolar-btn-danger' : 'mrpolar-btn-secondary'); ?>" data-confirm="<?php echo esc_attr($toggleConfirm); ?>"><?php echo esc_html($toggleLabel); ?></a>
                </div>
            </div>

            <div>
                <div class="mrpolar-tabs">
                    <button type="button" class="mrpolar-tab active" data-tab="info"><?php echo esc_html('基本資料'); ?></button>
                    <button type="button" class="mrpolar-tab" data-tab="addresses"><?php echo esc_html('收件地址'); ?></button>
                    <button type="button" class="mrpolar-tab" data-tab="pets"><?php echo esc_html('毛孩資料'); ?></button>
                    <button type="button" class="mrpolar-tab" data-tab="points"><?php echo esc_html('點數紀錄'); ?></button>
                    <button type="button" class="mrpolar-tab" data-tab="line"><?php echo esc_html('LINE 對話'); ?></button>
                </div>

                <div class="mrpolar-tab-content active" data-tab="info">
                    <div class="mrpolar-grid-2">
                        <div class="mrpolar-card">
                            <h3><?php echo esc_html('個人資訊'); ?></h3>
                            <?php echo $this->render_key_value_list([
                                '顯示名稱' => $displayName,
                                'Email'    => $email,
                                '電話'     => $phone,
                                '性別'     => (string) ($member['gender'] ?? ''),
                                '生日'     => (string) ($member['birthday'] ?? ''),
                            ]); ?>
                            <form id="mrpolar-member-profile-form" class="mrpolar-inline-form open" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                <input type="hidden" name="action" value="mrpolar_save_member_profile">
                                <input type="hidden" name="member_id" value="<?php echo esc_attr((string) $memberId); ?>">
                                <?php echo wp_nonce_field('mrpolar_save_member_profile_' . $memberId, '_wpnonce', true, false); ?>
                                <div class="mrpolar-grid-2">
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_display_name"><?php echo esc_html('顯示名稱'); ?></label>
                                        <input type="text" id="mrpolar_display_name" name="display_name" value="<?php echo esc_attr($displayName); ?>" required>
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_email"><?php echo esc_html('Email'); ?></label>
                                        <input type="email" id="mrpolar_email" value="<?php echo esc_attr($email); ?>" disabled>
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_phone"><?php echo esc_html('電話'); ?></label>
                                        <input type="text" id="mrpolar_phone" name="phone" value="<?php echo esc_attr($phone); ?>">
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_birthday"><?php echo esc_html('生日'); ?></label>
                                        <input type="date" id="mrpolar_birthday" name="birthday" value="<?php echo esc_attr((string) ($member['birthday'] ?? '')); ?>">
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_gender"><?php echo esc_html('性別'); ?></label>
                                        <select id="mrpolar_gender" name="gender">
                                            <option value="" <?php selected((string) ($member['gender'] ?? ''), ''); ?>><?php echo esc_html('請選擇'); ?></option>
                                            <option value="male" <?php selected((string) ($member['gender'] ?? ''), 'male'); ?>><?php echo esc_html('男'); ?></option>
                                            <option value="female" <?php selected((string) ($member['gender'] ?? ''), 'female'); ?>><?php echo esc_html('女'); ?></option>
                                            <option value="other" <?php selected((string) ($member['gender'] ?? ''), 'other'); ?>><?php echo esc_html('其他'); ?></option>
                                            <option value="prefer_not_to_say" <?php selected((string) ($member['gender'] ?? ''), 'prefer_not_to_say'); ?>><?php echo esc_html('不透露'); ?></option>
                                        </select>
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_avatar_url"><?php echo esc_html('Avatar URL'); ?></label>
                                        <input type="url" id="mrpolar_avatar_url" name="avatar_url" value="<?php echo esc_attr((string) ($member['avatar_url'] ?? '')); ?>">
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_tier_id"><?php echo esc_html('會員等級'); ?></label>
                                        <select id="mrpolar_tier_id" name="tier_id">
                                            <?php foreach ($tierOptions as $tierOption) : ?>
                                                <option value="<?php echo esc_attr((string) intval($tierOption['id'])); ?>" <?php selected(intval($member['tier_id'] ?? 0), intval($tierOption['id'])); ?>>
                                                    <?php echo esc_html((string) ($tierOption['name'] ?? '')); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                    <div class="mrpolar-form-row">
                                        <label for="mrpolar_status"><?php echo esc_html('帳號狀態'); ?></label>
                                        <select id="mrpolar_status" name="status">
                                            <option value="active" <?php selected($status, 'active'); ?>><?php echo esc_html('啟用中'); ?></option>
                                            <option value="suspended" <?php selected($status, 'suspended'); ?>><?php echo esc_html('停用中'); ?></option>
                                            <option value="deleted" <?php selected($status, 'deleted'); ?>><?php echo esc_html('已刪除'); ?></option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mrpolar-form-row">
                                    <label for="mrpolar_note"><?php echo esc_html('備註'); ?></label>
                                    <textarea id="mrpolar_note" name="note"><?php echo esc_textarea((string) ($member['note'] ?? '')); ?></textarea>
                                </div>
                                <div class="mrpolar-form-actions">
                                    <button type="submit" class="mrpolar-btn mrpolar-btn-primary"><?php echo esc_html('儲存會員資料'); ?></button>
                                </div>
                            </form>
                            <div class="mrpolar-progress-wrap">
                                <?php if (!empty($nextTierName) && $nextTierMin > 0) : ?>
                                    <div class="mrpolar-progress-label">
                                        <span><?php echo esc_html($tierName . ' -> ' . $nextTierName); ?></span>
                                        <span><?php echo esc_html('NT$' . number_format_i18n($yearlySpending, 0) . ' / NT$' . number_format_i18n($nextTierMin, 0)); ?></span>
                                    </div>
                                    <div class="mrpolar-progress">
                                        <div class="mrpolar-progress-bar" style="width:<?php echo esc_attr((string) round($progressWidth, 2)); ?>%;"></div>
                                    </div>
                                <?php else : ?>
                                    <div class="mrpolar-progress-label">
                                        <span><?php echo esc_html('已是最高等級'); ?></span>
                                        <span><?php echo esc_html($tierName); ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="mrpolar-card">
                            <h3><?php echo esc_html('帳號資訊'); ?></h3>
                            <?php echo $this->render_key_value_list([
                                '會員ID'       => (string) $memberId,
                                'WordPress ID' => (string) $wpUserId,
                                '用戶名稱'     => $userLogin,
                                '等級'         => $tierName,
                                '點數餘額'     => number_format_i18n($pointsBalance),
                                '累積點數'     => number_format_i18n($pointsLifetime),
                                '年度消費'     => 'NT$' . number_format_i18n($yearlySpending, 0),
                                '總消費'       => 'NT$' . number_format_i18n($totalSpending, 0),
                                'LINE綁定'     => $lineBound ? '已綁定' : '未綁定',
                                '帳號狀態'     => $statusMeta['label'],
                                '備註'         => (string) ($member['note'] ?? ''),
                                '加入日期'     => $this->format_date((string) ($member['registered_at'] ?? ''), 'Y/m/d H:i'),
                            ]); ?>
                        </div>
                    </div>
                </div>

                <div class="mrpolar-tab-content" data-tab="addresses">
                    <div class="mrpolar-card">
                        <h3><?php echo esc_html('收件地址'); ?></h3>
                        <?php if (empty($addressRows)) : ?>
                            <div class="mrpolar-table-empty"><?php echo esc_html('目前沒有收件地址'); ?></div>
                        <?php else : ?>
                            <?php echo $this->render_simple_table(['標籤', '收件人', '電話', '縣市', '詳細地址', '超商取貨', '預設'], $addressRows); ?>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="mrpolar-tab-content" data-tab="pets">
                    <div class="mrpolar-card">
                        <h3><?php echo esc_html('毛孩資料'); ?></h3>
                        <?php if (empty($pets)) : ?>
                            <div class="mrpolar-table-empty"><?php echo esc_html('目前沒有毛孩資料'); ?></div>
                        <?php else : ?>
                            <div class="mrpolar-pet-grid">
                                <?php foreach ($pets as $pet) : ?>
                                    <?php
                                    $petName   = (string) (($pet['name'] ?? '') ?: '未命名');
                                    $petAvatar = (string) ($pet['avatar_url'] ?? $pet['avatar'] ?? '');
                                    $petColor  = $this->get_placeholder_color(intval($pet['id'] ?? 0));
                                    ?>
                                    <div class="mrpolar-pet-card">
                                        <?php if ('' !== $petAvatar) : ?>
                                            <img class="mrpolar-pet-avatar" src="<?php echo esc_url($petAvatar); ?>" alt="<?php echo esc_attr($petName); ?>">
                                        <?php else : ?>
                                            <span class="mrpolar-pet-avatar" style="display:flex;align-items:center;justify-content:center;background:<?php echo esc_attr($petColor); ?>;color:#fff;font-weight:700;">
                                                <?php echo esc_html($this->get_initial($petName)); ?>
                                            </span>
                                        <?php endif; ?>
                                        <div class="mrpolar-pet-name"><?php echo esc_html($petName); ?></div>
                                        <div class="mrpolar-pet-meta">
                                            <?php echo esc_html('類型：' . (string) ($pet['type'] ?? '')); ?><br>
                                            <?php echo esc_html('品種：' . (string) ($pet['breed'] ?? '')); ?><br>
                                            <?php echo esc_html('性別：' . (string) ($pet['gender'] ?? '')); ?><br>
                                            <?php echo esc_html('生日：' . (string) ($pet['birthday'] ?? '')); ?><br>
                                            <?php echo esc_html('體重：' . (string) ($pet['petWeight'] ?? $pet['weight'] ?? '')); ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="mrpolar-tab-content" data-tab="points">
                    <div class="mrpolar-card">
                        <h3><?php echo esc_html('點數調整'); ?></h3>
                        <form id="mrpolar-points-form" class="mrpolar-inline-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <input type="hidden" name="action" value="mrpolar_adjust_points">
                            <input type="hidden" name="member_id" value="<?php echo esc_attr((string) $memberId); ?>">
                            <?php echo wp_nonce_field('mrpolar_adjust_points_' . $memberId, '_wpnonce', true, false); ?>
                            <div class="mrpolar-grid-3">
                                <div class="mrpolar-form-row">
                                    <label for="points_change_type"><?php echo esc_html('異動類型'); ?></label>
                                    <select name="change_type" id="points_change_type">
                                        <option value="earn_manual"><?php echo esc_html('手動增加'); ?></option>
                                        <option value="earn_event"><?php echo esc_html('活動贈點'); ?></option>
                                        <option value="earn_birthday"><?php echo esc_html('生日贈點'); ?></option>
                                        <option value="deduct_manual"><?php echo esc_html('手動扣除'); ?></option>
                                    </select>
                                </div>
                                <div class="mrpolar-form-row">
                                    <label for="points_amount"><?php echo esc_html('點數'); ?></label>
                                    <input type="number" name="amount" id="points_amount" min="1" step="1" required>
                                </div>
                                <div class="mrpolar-form-row">
                                    <label for="points_reason"><?php echo esc_html('原因'); ?></label>
                                    <input type="text" name="reason" id="points_reason" required>
                                </div>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="points_note"><?php echo esc_html('備註'); ?></label>
                                <textarea name="note" id="points_note"></textarea>
                            </div>
                            <div class="mrpolar-form-actions">
                                <button type="submit" class="mrpolar-btn mrpolar-btn-primary"><?php echo esc_html('儲存調整'); ?></button>
                            </div>
                        </form>
                    </div>

                    <div class="mrpolar-card">
                        <h3><?php echo esc_html('點數紀錄'); ?></h3>
                        <div class="mrpolar-table-wrap">
                            <table class="mrpolar-table">
                                <thead>
                                <tr>
                                    <th><?php echo esc_html('類型'); ?></th>
                                    <th><?php echo esc_html('異動點數'); ?></th>
                                    <th><?php echo esc_html('異動後餘額'); ?></th>
                                    <th><?php echo esc_html('原因'); ?></th>
                                    <th><?php echo esc_html('操作人員'); ?></th>
                                    <th><?php echo esc_html('時間'); ?></th>
                                </tr>
                                </thead>
                                <tbody>
                                <?php if (empty($pointLogs)) : ?>
                                    <tr>
                                        <td colspan="6" class="mrpolar-table-empty"><?php echo esc_html('目前沒有點數紀錄'); ?></td>
                                    </tr>
                                <?php else : ?>
                                    <?php foreach ($pointLogs as $log) : ?>
                                        <?php
                                        $delta = intval($log['points_delta'] ?? 0);
                                        $type  = (string) ($log['change_type'] ?? '');
                                        ?>
                                        <tr>
                                            <td><?php echo esc_html($changeTypeLabels[$type] ?? $type); ?></td>
                                            <td><?php echo esc_html($delta > 0 ? '+' . $delta : (string) $delta); ?></td>
                                            <td style="text-align:right;"><?php echo esc_html(number_format_i18n(intval($log['points_after'] ?? 0))); ?></td>
                                            <td><?php echo esc_html((string) ($log['reason'] ?? '')); ?></td>
                                            <td><?php echo esc_html((string) ($log['operated_name'] ?? '')); ?></td>
                                            <td><?php echo esc_html($this->format_date((string) ($log['operated_at'] ?? ''), 'Y/m/d H:i')); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="mrpolar-tab-content" data-tab="line">
                    <?php if (!$lineBound) : ?>
                        <div class="mrpolar-card">
                            <div class="mrpolar-notice error"><?php echo esc_html('此會員尚未綁定 LINE'); ?></div>
                        </div>
                    <?php else : ?>
                        <div class="mrpolar-chat-wrap">
                            <div class="mrpolar-chat-header">
                                <span><?php echo esc_html('LINE 對話'); ?></span>
                                <button type="button" id="mrpolar-refresh-chat" class="mrpolar-btn mrpolar-btn-secondary mrpolar-btn-sm"><?php echo esc_html('重新整理'); ?></button>
                            </div>
                            <div class="mrpolar-chat-messages">
                                <!-- messages loaded by JS -->
                            </div>
                            <input type="hidden" id="mrpolar-line-uid" value="<?php echo esc_attr((string) ($member['line_user_id'] ?? '')); ?>">
                            <div class="mrpolar-chat-input">
                                <textarea id="mrpolar-line-message" placeholder="<?php echo esc_attr('輸入要傳送的訊息'); ?>"></textarea>
                                <button type="button" id="mrpolar-send-message" class="mrpolar-chat-send"><?php echo esc_html('傳送'); ?></button>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_key_value_list(array $items): string {
        ob_start();
        ?>
        <div class="mrpolar-form-row">
            <?php foreach ($items as $label => $value) : ?>
                <div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <strong><?php echo esc_html((string) $label); ?></strong>
                    <span><?php echo esc_html((string) $value); ?></span>
                </div>
            <?php endforeach; ?>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function render_simple_table(array $headers, array $rows): string {
        ob_start();
        ?>
        <div class="mrpolar-table-wrap">
            <table class="mrpolar-table">
                <thead>
                <tr>
                    <?php foreach ($headers as $header) : ?>
                        <th scope="col"><?php echo esc_html((string) $header); ?></th>
                    <?php endforeach; ?>
                </tr>
                </thead>
                <tbody>
                <?php if (empty($rows)) : ?>
                    <tr>
                        <td colspan="<?php echo esc_attr((string) count($headers)); ?>" class="mrpolar-table-empty">
                            <?php echo esc_html('目前沒有資料'); ?>
                        </td>
                    </tr>
                <?php else : ?>
                    <?php foreach ($rows as $row) : ?>
                        <tr>
                            <?php foreach ($row as $cell) : ?>
                                <td><?php echo esc_html((string) $cell); ?></td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    private function map_address_rows(array $addresses): array {
        $rows = [];

        foreach ($addresses as $address) {
            $rows[] = [
                (string) ($address['label'] ?? ''),
                (string) ($address['name'] ?? ''),
                (string) ($address['phone'] ?? ''),
                trim((string) ($address['city'] ?? '') . ' ' . (string) ($address['district'] ?? '') . ' ' . (string) ($address['address'] ?? '')),
                !empty($address['is_default']) ? '是' : '',
            ];
        }

        return $rows;
    }

    private function map_pet_rows(array $pets): array {
        $rows = [];

        foreach ($pets as $pet) {
            $rows[] = [
                (string) ($pet['name'] ?? ''),
                (string) ($pet['type'] ?? ''),
                (string) ($pet['breed'] ?? ''),
                (string) ($pet['gender'] ?? ''),
                (string) ($pet['birthday'] ?? ''),
                (string) ($pet['petAge'] ?? $pet['age'] ?? ''),
                (string) ($pet['petWeight'] ?? $pet['weight'] ?? ''),
            ];
        }

        return $rows;
    }

    private function map_point_rows(array $logs): array {
        $rows = [];

        foreach ($logs as $log) {
            $rows[] = [
                (string) ($log['change_type'] ?? ''),
                (string) ($log['points_delta'] ?? ''),
                (string) ($log['points_after'] ?? ''),
                (string) ($log['reason'] ?? ''),
                (string) ($log['operated_name'] ?? ''),
                (string) ($log['operated_at'] ?? ''),
            ];
        }

        return $rows;
    }

    /* ========================================
     * SECTION B-2: Points Adjustment Handler
     * ====================================== */
    public function handle_adjust_points(): void {
        global $wpdb;

        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId  = isset($_POST['member_id']) ? intval(wp_unslash((string) $_POST['member_id'])) : 0;
        $detailUrl = add_query_arg(['page' => self::DETAIL_PAGE_SLUG, 'id' => $memberId], admin_url('admin.php'));

        if ($memberId <= 0) {
            wp_safe_redirect($this->with_notice($detailUrl, '會員不存在', 'error'));
            exit;
        }

        check_admin_referer('mrpolar_adjust_points_' . $memberId);

        $changeType   = isset($_POST['change_type']) ? sanitize_text_field(wp_unslash((string) $_POST['change_type'])) : '';
        $amount       = isset($_POST['amount']) ? intval(wp_unslash((string) $_POST['amount'])) : 0;
        $reason       = isset($_POST['reason']) ? sanitize_text_field(wp_unslash((string) $_POST['reason'])) : '';
        $note         = isset($_POST['note']) ? sanitize_textarea_field(wp_unslash((string) $_POST['note'])) : '';
        $allowedTypes = ['earn_manual', 'earn_event', 'earn_birthday', 'deduct_manual'];

        if (!in_array($changeType, $allowedTypes, true)) {
            wp_safe_redirect($this->with_notice($detailUrl, '點數異動類型無效', 'error'));
            exit;
        }

        if ($amount < 1 || $amount > 100000) {
            wp_safe_redirect($this->with_notice($detailUrl, '點數必須介於 1 到 100000 之間', 'error'));
            exit;
        }

        if (mb_strlen($reason) < 2) {
            wp_safe_redirect($this->with_notice($detailUrl, '原因至少需要 2 個字', 'error'));
            exit;
        }

        $member = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, points_balance FROM {$this->table_members} WHERE id = %d LIMIT 1",
                $memberId
            ),
            ARRAY_A
        );

        if (!is_array($member) || empty($member)) {
            wp_safe_redirect($this->with_notice($detailUrl, '會員不存在', 'error'));
            exit;
        }

        $oldBalance   = intval($member['points_balance'] ?? 0);
        $delta        = 0 === strpos($changeType, 'deduct_') ? -$amount : $amount;
        $newBalance   = max(0, $oldBalance + $delta);
        $currentUser  = wp_get_current_user();
        $operatorName = $currentUser instanceof WP_User ? (string) $currentUser->display_name : '';
        $ipAddress    = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash((string) $_SERVER['REMOTE_ADDR'])) : '';

        $wpdb->query('START TRANSACTION');

        // fix: keep lifetime points in sync for positive admin adjustments
        $updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET
                    points_balance = %d,
                    points_lifetime = IF(%d > 0, points_lifetime + %d, points_lifetime),
                    updated_at = NOW()
                 WHERE id = %d",
                $newBalance,
                $delta,
                $delta,
                $memberId
            )
        );

        if (false === $updated) {
            $wpdb->query('ROLLBACK');
            wp_safe_redirect($this->with_notice($detailUrl, '點數更新失敗', 'error'));
            exit;
        }

        $inserted = $wpdb->query(
            $wpdb->prepare(
                "INSERT INTO {$this->table_points_log}
                    (member_id, change_type, points_delta, points_after, reason, note, operated_by, operated_name, ip_address)
                 VALUES (%d, %s, %d, %d, %s, %s, %d, %s, %s)",
                $memberId,
                $changeType,
                $delta,
                $newBalance,
                $reason,
                $note,
                get_current_user_id(),
                $operatorName,
                $ipAddress
            )
        );

        if (false === $inserted) {
            $wpdb->query('ROLLBACK');
            wp_safe_redirect($this->with_notice($detailUrl, '點數紀錄寫入失敗', 'error'));
            exit;
        }

        $wpdb->query('COMMIT');

        wp_safe_redirect($this->with_notice($detailUrl, sprintf('點數已調整：%+d 點', $delta), 'success'));
        exit;
    }

    public function handle_save_member_profile(): void {
        global $wpdb;

        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId  = isset($_POST['member_id']) ? intval(wp_unslash((string) $_POST['member_id'])) : 0;
        $detailUrl = add_query_arg(['page' => self::DETAIL_PAGE_SLUG, 'id' => $memberId], admin_url('admin.php'));

        if ($memberId <= 0) {
            wp_safe_redirect($this->with_notice($detailUrl, '無效的會員 ID', 'error'));
            exit;
        }

        check_admin_referer('mrpolar_save_member_profile_' . $memberId);

        $displayName = isset($_POST['display_name']) ? sanitize_text_field(wp_unslash((string) $_POST['display_name'])) : '';
        $phone       = isset($_POST['phone']) ? sanitize_text_field(wp_unslash((string) $_POST['phone'])) : '';
        $gender      = isset($_POST['gender']) ? sanitize_text_field(wp_unslash((string) $_POST['gender'])) : '';
        $birthday    = isset($_POST['birthday']) ? sanitize_text_field(wp_unslash((string) $_POST['birthday'])) : '';
        $avatarUrl   = isset($_POST['avatar_url']) ? esc_url_raw(wp_unslash((string) $_POST['avatar_url'])) : '';
        $tierId      = isset($_POST['tier_id']) ? intval(wp_unslash((string) $_POST['tier_id'])) : 0;
        $status      = isset($_POST['status']) ? sanitize_text_field(wp_unslash((string) $_POST['status'])) : 'active';
        $note        = isset($_POST['note']) ? sanitize_textarea_field(wp_unslash((string) $_POST['note'])) : '';

        if ('' === $displayName) {
            wp_safe_redirect($this->with_notice($detailUrl, '顯示名稱不可為空白', 'error'));
            exit;
        }

        if ($tierId > 0) {
            $tierExists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$this->table_tiers} WHERE id = %d AND is_active = 1 LIMIT 1",
                    $tierId
                )
            );

            if (!$tierExists) {
                wp_safe_redirect($this->with_notice($detailUrl, '會員等級不存在', 'error'));
                exit;
            }
        }

        $payload = [
            'display_name' => $displayName,
            'phone'        => $phone,
            'gender'       => $gender,
            'birthday'     => $birthday,
            'avatar_url'   => $avatarUrl,
            'tier_id'      => $tierId,
            'status'       => $status,
            'note'         => $note,
        ];

        $currentMember = MrPolar_Member::get_member_by_id($memberId);

        if ($tierId > 0 && intval($currentMember['tier_id'] ?? 0) !== $tierId) {
            $payload['tier_upgraded_at'] = current_time('mysql');
        }

        $result = MrPolar_Member::update_member_admin_profile($memberId, $payload);

        if (is_wp_error($result)) {
            wp_safe_redirect($this->with_notice($detailUrl, $result->get_error_message(), 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($detailUrl, '會員資料已更新', 'success'));
        exit;
    }

    /* ========================================
     * Save Member Note Handler
     * ====================================== */
    public function handle_save_member_note(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId  = isset($_POST['member_id']) ? intval(wp_unslash((string) $_POST['member_id'])) : 0;
        $detailUrl = add_query_arg(['page' => 'mrpolar-member', 'id' => $memberId], admin_url('admin.php'));

        if ($memberId <= 0) {
            wp_safe_redirect($this->with_notice($detailUrl, '無效的會員ID', 'error'));
            exit;
        }

        check_admin_referer('mrpolar_save_member_note_' . $memberId);

        $note = isset($_POST['note'])
            ? sanitize_textarea_field(wp_unslash((string) $_POST['note']))
            : '';

        $result = MrPolar_Member::update_member_admin_profile($memberId, ['note' => $note]);

        if (is_wp_error($result)) {
            wp_safe_redirect($this->with_notice($detailUrl, $result->get_error_message(), 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($detailUrl, '備註已儲存', 'success'));
        exit;
    }

    /* ========================================
     * Save Member Tier Handler
     * ====================================== */
    public function handle_save_member_tier(): void {
        global $wpdb;

        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId  = isset($_POST['member_id']) ? intval(wp_unslash((string) $_POST['member_id'])) : 0;
        $tierId    = isset($_POST['tier_id']) ? intval(wp_unslash((string) $_POST['tier_id'])) : 0;
        $detailUrl = add_query_arg(['page' => 'mrpolar-member', 'id' => $memberId], admin_url('admin.php'));

        if ($memberId <= 0 || $tierId <= 0) {
            wp_safe_redirect($this->with_notice($detailUrl, '資料無效', 'error'));
            exit;
        }

        check_admin_referer('mrpolar_save_member_tier_' . $memberId);

        $tierExists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_tiers} WHERE id = %d AND is_active = 1 LIMIT 1",
            $tierId
        ));

        if (!$tierExists) {
            wp_safe_redirect($this->with_notice($detailUrl, '等級不存在', 'error'));
            exit;
        }

        $result = MrPolar_Member::update_member_admin_profile($memberId, [
            'tier_id'          => $tierId,
            'tier_upgraded_at' => current_time('mysql'),
        ]);

        if (is_wp_error($result)) {
            wp_safe_redirect($this->with_notice($detailUrl, $result->get_error_message(), 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($detailUrl, '會員等級已更新', 'success'));
        exit;
    }

    public function handle_toggle_member_status_legacy(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId = isset($_GET['member_id']) ? intval(wp_unslash((string) $_GET['member_id'])) : 0;
        $status   = isset($_GET['status']) ? sanitize_text_field(wp_unslash((string) $_GET['status'])) : '';

        if ($memberId <= 0 || !in_array($status, ['active', 'suspended'], true)) {
            wp_die(esc_html__('Invalid status update request.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_toggle_member_status_' . $memberId);

        $result = MrPolar_Member::update_member_admin_profile($memberId, ['status' => $status]);

        $redirectUrl = $this->sanitize_redirect_url(
            isset($_GET['redirect_to']) ? (string) wp_unslash($_GET['redirect_to']) : $this->get_list_page_url()
        );

        if (is_wp_error($result)) {
            wp_safe_redirect($this->with_notice($redirectUrl, $result->get_error_message(), 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($redirectUrl, 'active' === $status ? '會員已啟用' : '會員已停用', 'success'));
        exit;
    }

    public function handle_toggle_member_status(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $memberId = isset($_GET['member_id']) ? intval(wp_unslash((string) $_GET['member_id'])) : 0;
        $status   = isset($_GET['status']) ? sanitize_text_field(wp_unslash((string) $_GET['status'])) : '';

        if ($memberId <= 0 || !in_array($status, ['active', 'suspended'], true)) {
            wp_die(esc_html__('Invalid status update request.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_toggle_member_status_' . $memberId);

        $result = MrPolar_Member::update_member_admin_profile($memberId, ['status' => $status]);
        $redirectUrl = $this->sanitize_redirect_url(
            isset($_GET['redirect_to']) ? (string) wp_unslash($_GET['redirect_to']) : $this->get_list_page_url()
        );

        if (is_wp_error($result)) {
            wp_safe_redirect($this->with_notice($redirectUrl, $result->get_error_message(), 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($redirectUrl, 'active' === $status ? '會員已啟用' : '會員已停用', 'success'));
        exit;
    }

    private function sanitize_date(string $value): string {
        $value = sanitize_text_field($value);
        if ('' === $value) {
            return '';
        }

        $date = DateTime::createFromFormat('Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            return '';
        }

        return $value;
    }

    private function get_initial(string $value): string {
        $value = trim($value);
        if ('' === $value) {
            return 'M';
        }

        return function_exists('mb_substr') ? (string) mb_substr($value, 0, 1) : substr($value, 0, 1);
    }

    private function get_placeholder_color(int $memberId): string {
        $palette = ['#01696f', '#1d4ed8', '#ea580c', '#7c3aed', '#b45309', '#be185d'];
        return $palette[$memberId % count($palette)];
    }

    private function format_date(string $value, string $format = 'Y/m/d'): string {
        if ('' === $value) {
            return '';
        }

        $timestamp = strtotime($value);
        if (false === $timestamp) {
            return '';
        }

        return wp_date($format, $timestamp);
    }

    private function get_status_label(string $status): string {
        $labels = [
            'active'    => '啟用中',
            'suspended' => '停用',
            'deleted'   => '已刪除',
        ];

        return isset($labels[$status]) ? $labels[$status] : '未知';
    }

    private function sanitize_redirect_url(string $url): string {
        $fallback = $this->get_list_page_url();
        $url      = wp_validate_redirect($url, $fallback);

        return $url ? $url : $fallback;
    }

    private function with_notice(string $url, string $message, string $type): string {
        return add_query_arg([
            'mrpolar_notice'      => $message,
            'mrpolar_notice_type' => sanitize_key($type),
        ], $url);
    }

    private function get_list_page_url(array $state = []): string {
        $args = ['page' => self::LIST_PAGE_SLUG];

        foreach (['search', 'tier_id', 'status', 'date_from', 'date_to', 'orderby', 'order', 'paged', 'per_page'] as $key) {
            if (!array_key_exists($key, $state)) {
                continue;
            }

            $value = $state[$key];
            if ('' === $value || 0 === $value || null === $value) {
                continue;
            }

            $args[$key] = $value;
        }

        return add_query_arg($args, admin_url('admin.php'));
    }

    private function get_tier_options(): array {
        global $wpdb;

        $sql     = "SELECT id, tier_name FROM {$this->table_tiers} WHERE is_active = %d ORDER BY sort_order ASC, id ASC";
        $results = $wpdb->get_results($wpdb->prepare($sql, 1), ARRAY_A);

        if (!is_array($results)) {
            return [];
        }

        return array_map(static function (array $tier): array {
            return [
                'id'   => intval($tier['id']),
                'name' => (string) ($tier['tier_name'] ?? ''),
            ];
        }, $results);
    }

    private function get_stats(): array {
        global $wpdb;

        $firstDay = wp_date('Y-m-01 00:00:00', current_time('timestamp'));

        $total = intval($wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_members} WHERE 1 = %d", 1)
        ));

        $thisMonth = intval($wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_members} WHERE registered_at >= %s", $firstDay)
        ));

        $lineBound = intval($wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_members} WHERE 1 = %d AND COALESCE(line_user_id, '') <> ''", 1)
        ));

        $totalPoints = intval($wpdb->get_var(
            $wpdb->prepare("SELECT COALESCE(SUM(points_balance), 0) FROM {$this->table_members} WHERE 1 = %d", 1)
        ));

        return [
            'total'        => $total,
            'this_month'   => $thisMonth,
            'line_bound'   => $lineBound,
            'total_points' => $totalPoints,
        ];
    }
}

MrPolar_Admin_Member::boot();
