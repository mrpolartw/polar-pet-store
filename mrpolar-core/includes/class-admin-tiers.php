<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_Admin_Tiers {

    public const MENU_SLUG = 'mrpolar-members';
    public const PAGE_SLUG = 'mrpolar-tiers';

    private static ?self $instance = null;

    private string $table_tiers;

    public function __construct() {
        global $wpdb;

        $this->table_tiers = $wpdb->prefix . 'mrpolar_member_tiers';
    }

    public static function boot(): void {
        if (!is_admin()) {
            return;
        }

        $instance = self::instance();

        add_action('admin_post_mrpolar_save_tier', [$instance, 'handle_save_tier']);
        add_action('admin_post_mrpolar_delete_tier', [$instance, 'handle_delete_tier']);
        add_action('admin_post_mrpolar_reorder_tiers', [$instance, 'handle_reorder_tiers']);
    }

    public static function register_menus(): void {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }

        add_submenu_page(
            self::MENU_SLUG,
            '會員等級設定',
            '等級設定',
            'manage_woocommerce',
            self::PAGE_SLUG,
            [self::instance(), 'render_tier_list']
        );
    }

    public function render_tier_list(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'mrpolar-api'));
        }

        global $wpdb;

        $tiers = $wpdb->get_results(
            "SELECT * FROM {$this->table_tiers} ORDER BY sort_order ASC, id ASC",
            ARRAY_A
        );

        echo $this->render_tier_list_page(is_array($tiers) ? $tiers : []);
    }

    public function render_tier_list_page(array $tiers): string {
        ob_start();
        ?>
        <div class="mrpolar-wrap">
            <div class="mrpolar-header">
                <h1><?php echo esc_html('會員等級設定'); ?></h1>
                <div class="mrpolar-actions">
                    <button type="button" class="mrpolar-btn mrpolar-btn-primary" data-open-modal="#mrpolar-tier-modal">
                        <?php echo esc_html('新增等級'); ?>
                    </button>
                </div>
            </div>

            <?php echo $this->render_notice(); ?>

            <div class="mrpolar-card">
                <div class="mrpolar-table-wrap">
                    <table id="mrpolar-tiers-table" class="mrpolar-table">
                        <thead>
                        <tr>
                            <th><?php echo esc_html('拖曳'); ?></th>
                            <th><?php echo esc_html('等級名稱'); ?></th>
                            <th><?php echo esc_html('識別碼'); ?></th>
                            <th><?php echo esc_html('排序'); ?></th>
                            <th><?php echo esc_html('升等條件'); ?></th>
                            <th><?php echo esc_html('點數回饋率'); ?></th>
                            <th><?php echo esc_html('加入贈點'); ?></th>
                            <th><?php echo esc_html('生日加碼'); ?></th>
                            <th><?php echo esc_html('免運門檻'); ?></th>
                            <th><?php echo esc_html('狀態'); ?></th>
                            <th><?php echo esc_html('操作'); ?></th>
                        </tr>
                        </thead>
                        <tbody>
                        <?php if (empty($tiers)) : ?>
                            <tr>
                                <td colspan="11" class="mrpolar-table-empty"><?php echo esc_html('目前尚無會員等級資料。'); ?></td>
                            </tr>
                        <?php else : ?>
                            <?php foreach ($tiers as $tier) : ?>
                                <?php
                                $tierId         = intval($tier['id'] ?? 0);
                                $tierName       = (string) ($tier['tier_name'] ?? '');
                                $tierKey        = (string) ($tier['tier_key'] ?? '');
                                $tierColor      = sanitize_hex_color((string) ($tier['tier_color'] ?? '')) ?: '#888888';
                                $sortOrder      = intval($tier['sort_order'] ?? 0);
                                $cashbackRate   = (float) ($tier['cashback_rate'] ?? 0);
                                $welcomePoints  = intval($tier['welcome_points'] ?? 0);
                                $birthdayRate   = (float) ($tier['birthday_bonus_rate'] ?? 0);
                                $freeShipping   = $tier['free_shipping_threshold'] ?? null;
                                $isActive       = intval($tier['is_active'] ?? 0) === 1;
                                $upgradeDisplay = !empty($tier['upgrade_min_spending'])
                                    ? '消費 NT$' . number_format_i18n((float) $tier['upgrade_min_spending'], 0)
                                    : '不限';
                                $tierJson = esc_attr((string) wp_json_encode($tier));
                                ?>
                                <tr data-tier-id="<?php echo esc_attr((string) $tierId); ?>">
                                    <td><span class="mrpolar-drag-handle" aria-hidden="true">⠿</span></td>
                                    <td>
                                        <span class="tier-dot" style="background:<?php echo esc_attr($tierColor); ?>"></span>
                                        <?php echo esc_html($tierName); ?>
                                    </td>
                                    <td><?php echo esc_html($tierKey); ?></td>
                                    <td><?php echo esc_html((string) $sortOrder); ?></td>
                                    <td><?php echo esc_html($upgradeDisplay); ?></td>
                                    <td><?php echo esc_html($this->format_rate($cashbackRate)); ?></td>
                                    <td><?php echo esc_html(number_format_i18n($welcomePoints) . ' 點'); ?></td>
                                    <td><?php echo esc_html($birthdayRate > 0 ? $this->format_rate($birthdayRate) : '—'); ?></td>
                                    <td>
                                        <?php
                                        echo esc_html(
                                            null !== $freeShipping && '' !== (string) $freeShipping && (float) $freeShipping > 0
                                                ? 'NT$' . number_format_i18n((float) $freeShipping, 0)
                                                : '—'
                                        );
                                        ?>
                                    </td>
                                    <td>
                                        <span class="mrpolar-badge <?php echo esc_attr($isActive ? 'status-active' : 'status-suspended'); ?>">
                                            <?php echo esc_html($isActive ? '啟用中' : '停用'); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="mrpolar-actions">
                                            <button
                                                type="button"
                                                class="mrpolar-btn mrpolar-btn-sm mrpolar-btn-secondary"
                                                data-edit-tier
                                                data-tier-json="<?php echo $tierJson; ?>"
                                            >
                                                <?php echo esc_html('編輯'); ?>
                                            </button>
                                            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                                <input type="hidden" name="action" value="mrpolar_delete_tier">
                                                <input type="hidden" name="tier_id" value="<?php echo esc_attr((string) $tierId); ?>">
                                                <?php echo wp_nonce_field('mrpolar_delete_tier_' . $tierId, '_wpnonce', true, false); ?>
                                                <button
                                                    type="submit"
                                                    class="mrpolar-btn mrpolar-btn-sm mrpolar-btn-danger"
                                                    data-confirm="<?php echo esc_attr('確定要刪除此等級嗎？'); ?>"
                                                >
                                                    <?php echo esc_html('刪除'); ?>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <form id="mrpolar-reorder-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                <input type="hidden" name="action" value="mrpolar_reorder_tiers">
                <?php echo wp_nonce_field('mrpolar_reorder_tiers', 'mrpolar_reorder_nonce', true, false); ?>
                <input type="hidden" id="mrpolar-tier-order" name="tier_order" value="">
            </form>

            <div id="mrpolar-tier-modal" class="mrpolar-modal-overlay">
                <div class="mrpolar-modal">
                    <h2><?php echo esc_html('新增等級'); ?></h2>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                        <input type="hidden" name="action" value="mrpolar_save_tier">
                        <input type="hidden" name="tier_id" value="0">
                        <?php echo wp_nonce_field('mrpolar_save_tier', 'mrpolar_tier_nonce', true, false); ?>

                        <div class="mrpolar-form-row">
                            <label for="mrpolar-tier-name"><?php echo esc_html('等級名稱'); ?></label>
                            <input type="text" id="mrpolar-tier-name" name="tier_name" required>
                        </div>

                        <div class="mrpolar-grid-3">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-key"><?php echo esc_html('識別碼'); ?></label>
                                <input type="text" id="mrpolar-tier-key" name="tier_key" pattern="[a-z0-9_]+" required>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-color"><?php echo esc_html('顏色'); ?></label>
                                <input type="color" id="mrpolar-tier-color" name="tier_color" value="#888888">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-sort"><?php echo esc_html('排序'); ?></label>
                                <input type="number" id="mrpolar-tier-sort" name="sort_order" min="0" value="10">
                            </div>
                        </div>

                        <div class="mrpolar-grid-2">
                            <div class="mrpolar-form-row">
                                <label>
                                    <input type="checkbox" name="is_active" value="1" checked>
                                    <?php echo esc_html('啟用'); ?>
                                </label>
                            </div>
                            <div class="mrpolar-form-row">
                                <label>
                                    <input type="checkbox" name="is_manual_only" value="1">
                                    <?php echo esc_html('僅限手動升等'); ?>
                                </label>
                            </div>
                        </div>

                        <div class="mrpolar-form-section"><?php echo esc_html('升等條件'); ?></div>

                        <div class="mrpolar-grid-3">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-spending"><?php echo esc_html('最低消費'); ?></label>
                                <input type="number" id="mrpolar-upgrade-spending" name="upgrade_min_spending" min="0" step="1" placeholder="空白=不限">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-orders"><?php echo esc_html('最低訂單數'); ?></label>
                                <input type="number" id="mrpolar-upgrade-orders" name="upgrade_min_orders" min="0" step="1" placeholder="空白=不限">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-points"><?php echo esc_html('最低點數'); ?></label>
                                <input type="number" id="mrpolar-upgrade-points" name="upgrade_min_points" min="0" step="1" placeholder="空白=不限">
                            </div>
                        </div>

                        <div class="mrpolar-form-section"><?php echo esc_html('等級效益'); ?></div>

                        <div class="mrpolar-grid-2">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-cashback-rate"><?php echo esc_html('點數回饋率 (%)'); ?></label>
                                <input type="number" id="mrpolar-cashback-rate" name="cashback_rate" min="0" max="100" step="0.01">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-welcome-points"><?php echo esc_html('加入贈點'); ?></label>
                                <input type="number" id="mrpolar-welcome-points" name="welcome_points" min="0" step="1">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-birthday-bonus"><?php echo esc_html('生日加碼 (%)'); ?></label>
                                <input type="number" id="mrpolar-birthday-bonus" name="birthday_bonus_rate" min="0" max="100" step="0.01">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-free-shipping"><?php echo esc_html('免運門檻'); ?></label>
                                <input type="number" id="mrpolar-free-shipping" name="free_shipping_threshold" min="0" step="1" placeholder="空白=不享免運">
                            </div>
                        </div>

                        <div class="mrpolar-form-row">
                            <label for="mrpolar-tier-description"><?php echo esc_html('說明'); ?></label>
                            <textarea id="mrpolar-tier-description" name="description"></textarea>
                        </div>

                        <div class="mrpolar-form-actions">
                            <button type="button" class="mrpolar-btn mrpolar-btn-secondary" data-close-modal><?php echo esc_html('取消'); ?></button>
                            <button type="submit" class="mrpolar-btn mrpolar-btn-primary"><?php echo esc_html('儲存'); ?></button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }

    public function handle_save_tier(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_save_tier', 'mrpolar_tier_nonce');

        global $wpdb;

        $tierId                = isset($_POST['tier_id']) ? intval(wp_unslash((string) $_POST['tier_id'])) : 0;
        $tierName              = sanitize_text_field(wp_unslash((string) ($_POST['tier_name'] ?? '')));
        $tierKey               = sanitize_key(wp_unslash((string) ($_POST['tier_key'] ?? '')));
        $tierColor             = sanitize_hex_color((string) ($_POST['tier_color'] ?? '')) ?: '#888888';
        $sortOrder             = max(0, intval(wp_unslash((string) ($_POST['sort_order'] ?? '10'))));
        $isActive              = isset($_POST['is_active']) ? 1 : 0;
        $isManualOnly          = isset($_POST['is_manual_only']) ? 1 : 0;
        $upgradeMinSpending    = '' !== (string) ($_POST['upgrade_min_spending'] ?? '') ? max(0, (float) wp_unslash((string) $_POST['upgrade_min_spending'])) : null;
        $upgradeMinOrders      = '' !== (string) ($_POST['upgrade_min_orders'] ?? '') ? max(0, intval(wp_unslash((string) $_POST['upgrade_min_orders']))) : null;
        $upgradeMinPoints      = '' !== (string) ($_POST['upgrade_min_points'] ?? '') ? max(0, intval(wp_unslash((string) $_POST['upgrade_min_points']))) : null;
        $cashbackRate          = max(0, min(100, (float) wp_unslash((string) ($_POST['cashback_rate'] ?? '0')))) / 100;
        $welcomePoints         = max(0, intval(wp_unslash((string) ($_POST['welcome_points'] ?? '0'))));
        $birthdayBonusRate     = max(0, min(100, (float) wp_unslash((string) ($_POST['birthday_bonus_rate'] ?? '0')))) / 100;
        $freeShippingThreshold = '' !== (string) ($_POST['free_shipping_threshold'] ?? '') ? max(0, (float) wp_unslash((string) $_POST['free_shipping_threshold'])) : null;
        $description           = sanitize_textarea_field(wp_unslash((string) ($_POST['description'] ?? '')));

        if ('' === $tierName) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級名稱不可為空', 'error'));
            exit;
        }

        if ('' === $tierKey || !preg_match('/^[a-z0-9_]+$/', $tierKey)) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼格式錯誤', 'error'));
            exit;
        }

        $data = [
            'tier_name'               => $tierName,
            'tier_key'                => $tierKey,
            'tier_color'              => $tierColor,
            'sort_order'              => $sortOrder,
            'is_active'               => $isActive,
            'is_manual_only'          => $isManualOnly,
            'upgrade_min_spending'    => $upgradeMinSpending,
            'upgrade_min_orders'      => $upgradeMinOrders,
            'upgrade_min_points'      => $upgradeMinPoints,
            'cashback_rate'           => $cashbackRate,
            'welcome_points'          => $welcomePoints,
            'birthday_bonus_rate'     => $birthdayBonusRate,
            'free_shipping_threshold' => $freeShippingThreshold,
            'description'             => $description,
        ];

        $formats = ['%s', '%s', '%s', '%d', '%d', '%d', '%f', '%d', '%d', '%f', '%d', '%f', '%f', '%s'];

        if ($tierId > 0) {
            $exists = intval(
                $wpdb->get_var(
                    $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_tiers} WHERE id = %d", $tierId)
                )
            );

            if ($exists <= 0) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '找不到指定等級', 'error'));
                exit;
            }

            $duplicate = intval(
                $wpdb->get_var(
                    $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_tiers} WHERE tier_key = %s AND id != %d", $tierKey, $tierId)
                )
            );

            if ($duplicate > 0) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼已存在', 'error'));
                exit;
            }

            $updated = $wpdb->update($this->table_tiers, $data, ['id' => $tierId], $formats, ['%d']);

            if (false === $updated) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已更新失敗', 'error'));
                exit;
            }

            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已更新', 'success'));
            exit;
        }

        $duplicate = intval(
            $wpdb->get_var(
                $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_tiers} WHERE tier_key = %s", $tierKey)
            )
        );

        if ($duplicate > 0) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼已存在', 'error'));
            exit;
        }

        $inserted = $wpdb->insert($this->table_tiers, $data, $formats);

        if (false === $inserted) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已新增失敗', 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已新增', 'success'));
        exit;
    }

    public function handle_delete_tier(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        $tierId = isset($_POST['tier_id']) ? intval(wp_unslash((string) $_POST['tier_id'])) : 0;
        check_admin_referer('mrpolar_delete_tier_' . $tierId);

        global $wpdb;

        $memberCount = intval(
            $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}mrpolar_members WHERE tier_id = %d",
                    $tierId
                )
            )
        );

        if ($memberCount > 0) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '此等級有會員使用中，無法刪除', 'error'));
            exit;
        }

        $deleted = $wpdb->delete($this->table_tiers, ['id' => $tierId], ['%d']);

        if (false === $deleted) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已刪除失敗', 'error'));
            exit;
        }

        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已刪除', 'success'));
        exit;
    }

    public function handle_reorder_tiers(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_reorder_tiers', 'mrpolar_reorder_nonce');

        $decoded = json_decode((string) wp_unslash((string) ($_POST['tier_order'] ?? '[]')), true);

        if (!is_array($decoded) || [] === $decoded) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '排序資料格式錯誤', 'error'));
            exit;
        }

        global $wpdb;

        foreach ($decoded as $index => $tierId) {
            $tierId = intval($tierId);

            if ($tierId <= 0) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '排序資料格式錯誤', 'error'));
                exit;
            }

            $wpdb->update(
                $this->table_tiers,
                ['sort_order' => ($index + 1) * 10],
                ['id' => $tierId],
                ['%d'],
                ['%d']
            );
        }

        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '排序已儲存', 'success'));
        exit;
    }

    private function get_tier_page_url(): string {
        return add_query_arg(['page' => self::PAGE_SLUG], admin_url('admin.php'));
    }

    private function render_notice(): string {
        $message = isset($_GET['mrpolar_notice']) ? sanitize_text_field(wp_unslash((string) $_GET['mrpolar_notice'])) : '';
        if ('' === $message) {
            return '';
        }

        $type  = isset($_GET['mrpolar_notice_type']) ? sanitize_key(wp_unslash((string) $_GET['mrpolar_notice_type'])) : 'success';
        $class = 'success' === $type ? 'success' : 'error';

        return sprintf(
            '<div class="mrpolar-notice %1$s">%2$s</div>',
            esc_attr($class),
            esc_html($message)
        );
    }

    private function with_notice(string $url, string $message, string $type): string {
        return add_query_arg([
            'mrpolar_notice'      => $message,
            'mrpolar_notice_type' => sanitize_key($type),
        ], $url);
    }

    private function format_rate(float $rate): string {
        return number_format($rate * 100, 2) . '%';
    }

    private static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }
}

MrPolar_Admin_Tiers::boot();
