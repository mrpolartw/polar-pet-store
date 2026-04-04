<?php
defined('ABSPATH') || exit;

if (is_admin() && !class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

if (class_exists('WP_List_Table') && !class_exists('MrPolar_Admin_Member_List_Table')) {
    class MrPolar_Admin_Member_List_Table extends WP_List_Table {

        public function __construct() {
            parent::__construct([
                'singular' => 'mrpolar_member',
                'plural'   => 'mrpolar_members',
                'ajax'     => false,
            ]);
        }

        public function get_columns() {
            return [
                'id'              => 'ID',
                'display_name'    => '姓名',
                'email'           => 'Email',
                'phone'           => '電話',
                'tier_name'       => '等級',
                'points_balance'  => '點數餘額',
                'yearly_spending' => '年度消費',
                'total_spending'  => '總消費',
                'status'          => '狀態',
                'registered_at'   => '加入日期',
            ];
        }

        public function prepare_items() {
            global $wpdb;

            $per_page = 20;
            $paged    = max(1, (int) ($_GET['paged'] ?? 1));
            $search   = sanitize_text_field(wp_unslash((string) ($_GET['s'] ?? '')));
            $tier_id  = isset($_GET['tier_id']) ? (int) $_GET['tier_id'] : 0;
            $status   = sanitize_text_field(wp_unslash((string) ($_GET['member_status'] ?? '')));

            $where  = ['1=1'];
            $params = [];

            if ('' !== $search) {
                $like     = '%' . $wpdb->esc_like($search) . '%';
                $where[]  = '(m.display_name LIKE %s OR m.email LIKE %s OR CONCAT(COALESCE(m.first_name, \'\'), \' \', COALESCE(m.last_name, \'\')) LIKE %s)';
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
            }

            if ($tier_id > 0) {
                $where[]  = 'm.tier_id = %d';
                $params[] = $tier_id;
            }

            if ('' !== $status) {
                $where[]  = 'm.status = %s';
                $params[] = $status;
            }

            $from_sql = "FROM {$wpdb->prefix}mrpolar_members m LEFT JOIN {$wpdb->prefix}mrpolar_member_tiers t ON t.id = m.tier_id WHERE " . implode(' AND ', $where);
            $count_sql = "SELECT COUNT(*) {$from_sql}";
            $list_sql  = "SELECT m.id, m.display_name, m.email, m.phone, m.points_balance, m.yearly_spending, m.total_spending, m.status, m.registered_at, t.tier_name {$from_sql} ORDER BY m.registered_at DESC, m.id DESC LIMIT %d OFFSET %d";

            $total_items = (int) $wpdb->get_var(MrPolar_Member::prepare_sql($count_sql, $params));
            $params[]    = $per_page;
            $params[]    = ($paged - 1) * $per_page;

            $this->items = $wpdb->get_results(MrPolar_Member::prepare_sql($list_sql, $params), ARRAY_A);

            $this->set_pagination_args([
                'total_items' => $total_items,
                'per_page'    => $per_page,
                'total_pages' => (int) ceil($total_items / $per_page),
            ]);

            $this->_column_headers = [$this->get_columns(), [], []];
        }

        protected function extra_tablenav($which) {
            if ('top' !== $which) {
                return;
            }

            $current_tier   = isset($_GET['tier_id']) ? (int) $_GET['tier_id'] : 0;
            $current_status = sanitize_text_field(wp_unslash((string) ($_GET['member_status'] ?? '')));
            $tiers          = MrPolar_Member::get_all_tiers();
            ?>
            <div class="alignleft actions">
                <label class="screen-reader-text" for="filter-by-tier">依等級篩選</label>
                <select name="tier_id" id="filter-by-tier">
                    <option value="">全部等級</option>
                    <?php foreach ($tiers as $tier) : ?>
                        <option value="<?php echo esc_attr((int) $tier['id']); ?>" <?php selected($current_tier, (int) $tier['id']); ?>>
                            <?php echo esc_html($tier['tier_name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <label class="screen-reader-text" for="filter-by-status">依狀態篩選</label>
                <select name="member_status" id="filter-by-status">
                    <option value="">全部狀態</option>
                    <option value="active" <?php selected($current_status, 'active'); ?>>active</option>
                    <option value="suspended" <?php selected($current_status, 'suspended'); ?>>suspended</option>
                    <option value="deleted" <?php selected($current_status, 'deleted'); ?>>deleted</option>
                </select>

                <?php submit_button('篩選', '', 'filter_action', false); ?>
            </div>
            <?php
        }

        public function column_display_name($item) {
            $name = $item['display_name'] ?: '未命名會員';
            $url  = add_query_arg([
                'page'      => MrPolar_Admin_Member::MEMBERS_SLUG,
                'member_id' => (int) $item['id'],
            ], admin_url('admin.php'));

            return sprintf('<a href="%s"><strong>%s</strong></a>', esc_url($url), esc_html($name));
        }

        public function column_default($item, $column_name) {
            if (in_array($column_name, ['yearly_spending', 'total_spending'], true)) {
                return 'NT$ ' . number_format_i18n((float) $item[$column_name], 2);
            }

            if ('registered_at' === $column_name) {
                return esc_html(mysql2date('Y-m-d H:i', $item[$column_name]));
            }

            return esc_html((string) ($item[$column_name] ?? ''));
        }
    }
}

class MrPolar_Admin_Member {
    public const MENU_SLUG    = 'mrpolar-members';
    public const MEMBERS_SLUG = 'mrpolar-members';
    public const TIERS_SLUG   = 'mrpolar-tier-settings';

    public static function register_menus() {
        $member_access = self::can_view_members();
        $tier_access   = self::can_view_tiers();

        if (!$member_access && !$tier_access) {
            return;
        }

        add_menu_page(
            'MrPolar 會員',
            'MrPolar 會員',
            'read',
            self::MENU_SLUG,
            [self::class, 'render_members_page'],
            'dashicons-groups',
            56
        );

        add_submenu_page(
            self::MENU_SLUG,
            '會員列表',
            '會員列表',
            'read',
            self::MEMBERS_SLUG,
            [self::class, 'render_members_page']
        );

        if ($tier_access) {
            add_submenu_page(
                self::MENU_SLUG,
                '等級設定',
                '等級設定',
                'read',
                self::TIERS_SLUG,
                [self::class, 'render_tiers_page']
            );
        }
    }

    public static function render_members_page() {
        if (!self::can_view_members()) {
            if (self::can_view_tiers()) {
                wp_safe_redirect(admin_url('admin.php?page=' . self::TIERS_SLUG));
                exit;
            }

            wp_die('你沒有查看會員資料的權限。');
        }

        $member_id = isset($_GET['member_id']) ? (int) $_GET['member_id'] : 0;
        if ($member_id > 0) {
            self::render_member_detail_page($member_id);
            return;
        }

        $table = new MrPolar_Admin_Member_List_Table();
        $table->prepare_items();

        self::render_styles();
        ?>
        <div class="wrap mrpolar-admin">
            <h1 class="wp-heading-inline">MrPolar 會員列表</h1>
            <?php self::render_notice(); ?>
            <form method="get">
                <input type="hidden" name="page" value="<?php echo esc_attr(self::MEMBERS_SLUG); ?>">
                <?php $table->search_box('搜尋會員', 'mrpolar-member'); ?>
                <?php $table->display(); ?>
            </form>
        </div>
        <?php
    }

    public static function render_tiers_page() {
        if (!self::can_view_tiers()) {
            wp_die('你沒有查看等級設定的權限。');
        }

        self::maybe_handle_tier_post();
        $tiers      = MrPolar_Member::get_all_tiers();
        $can_config = MrPolar_Member::has_admin_permission('perm_tier_config', 2);

        self::render_styles();
        ?>
        <div class="wrap mrpolar-admin">
            <h1 class="wp-heading-inline">MrPolar 等級設定</h1>
            <?php self::render_notice(); ?>
            <form method="post">
                <?php wp_nonce_field('mrpolar_save_tiers'); ?>
                <input type="hidden" name="mrpolar_admin_action" value="save_tiers">
                <div class="mrpolar-tier-grid">
                    <?php foreach ($tiers as $tier) : ?>
                        <div class="mrpolar-card">
                            <h2><?php echo esc_html($tier['tier_name']); ?></h2>
                            <p class="description"><?php echo esc_html($tier['tier_key']); ?></p>
                            <table class="form-table" role="presentation">
                                <tbody>
                                    <?php self::render_input_row("tiers[{$tier['id']}][tier_name]", '名稱', $tier['tier_name'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][tier_color]", '顏色', $tier['tier_color'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][cashback_rate]", '回饋比率', $tier['cashback_rate'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][welcome_points]", '入會點數', $tier['welcome_points'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][upgrade_min_spending]", '升級消費門檻', $tier['upgrade_min_spending'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][birthday_bonus_rate]", '生日加碼比率', $tier['birthday_bonus_rate'], !$can_config); ?>
                                    <?php self::render_input_row("tiers[{$tier['id']}][free_shipping_threshold]", '免運門檻', $tier['free_shipping_threshold'], !$can_config); ?>
                                    <tr>
                                        <th scope="row"><label for="tier-desc-<?php echo esc_attr((int) $tier['id']); ?>">說明</label></th>
                                        <td>
                                            <textarea id="tier-desc-<?php echo esc_attr((int) $tier['id']); ?>" name="tiers[<?php echo esc_attr((int) $tier['id']); ?>][description]" rows="4" class="large-text" <?php disabled(!$can_config); ?>><?php echo esc_textarea((string) $tier['description']); ?></textarea>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">啟用</th>
                                        <td>
                                            <label>
                                                <input type="checkbox" name="tiers[<?php echo esc_attr((int) $tier['id']); ?>][is_active]" value="1" <?php checked((int) $tier['is_active'], 1); ?> <?php disabled(!$can_config); ?>>
                                                顯示此等級
                                            </label>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php if ($can_config) : ?>
                    <?php submit_button('儲存等級設定'); ?>
                <?php endif; ?>
            </form>
        </div>
        <?php
    }

    private static function render_member_detail_page($member_id) {
        self::maybe_handle_member_post($member_id);

        $member = MrPolar_Member::get_member_by_id($member_id);
        if (empty($member)) {
            wp_die('找不到指定會員。');
        }

        $addresses = MrPolar_Member::get_addresses_by_member_id($member_id);
        $pets      = MrPolar_Member::get_pets_by_member_id($member_id);
        $points    = MrPolar_Member::get_points_summary($member_id, 50);
        $tiers     = MrPolar_Member::get_all_tiers();

        $can_edit_basic   = MrPolar_Member::has_admin_permission('perm_member_basic', 2);
        $can_edit_status  = MrPolar_Member::has_admin_permission('perm_account_status', 2);
        $can_edit_note    = MrPolar_Member::has_admin_permission('perm_note', 2);
        $can_view_address = MrPolar_Member::has_admin_permission('perm_member_address', 1);
        $can_view_pets    = MrPolar_Member::has_admin_permission('perm_member_pets', 1);
        $can_view_points  = MrPolar_Member::has_admin_permission('perm_points_view', 1);
        $can_edit_points  = MrPolar_Member::has_admin_permission('perm_points_edit', 2);

        self::render_styles();
        ?>
        <div class="wrap mrpolar-admin">
            <a href="<?php echo esc_url(admin_url('admin.php?page=' . self::MEMBERS_SLUG)); ?>" class="page-title-action">返回列表</a>
            <h1 class="wp-heading-inline">會員詳情 #<?php echo esc_html((string) $member['id']); ?></h1>
            <?php self::render_notice(); ?>

            <div class="mrpolar-two-col">
                <div class="mrpolar-card">
                    <h2>基本資料</h2>
                    <form method="post">
                        <?php wp_nonce_field('mrpolar_save_member_' . $member_id); ?>
                        <input type="hidden" name="mrpolar_admin_action" value="save_member">
                        <table class="form-table" role="presentation">
                            <tbody>
                                <?php self::render_input_row('display_name', '顯示名稱', $member['display_name'], !$can_edit_basic); ?>
                                <?php self::render_input_row('email', 'Email', $member['email'], !$can_edit_basic); ?>
                                <?php self::render_input_row('phone', '電話', $member['phone'], !$can_edit_basic); ?>
                                <tr>
                                    <th scope="row"><label for="gender">性別</label></th>
                                    <td>
                                        <select name="gender" id="gender" <?php disabled(!$can_edit_basic); ?>>
                                            <?php foreach (['' => '未填寫', 'male' => 'male', 'female' => 'female', 'other' => 'other', 'prefer_not_to_say' => 'prefer_not_to_say'] as $value => $label) : ?>
                                                <option value="<?php echo esc_attr($value); ?>" <?php selected((string) $member['gender'], (string) $value); ?>><?php echo esc_html($label); ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </td>
                                </tr>
                                <?php self::render_input_row('birthday', '生日', $member['birthday'], !$can_edit_basic, 'date'); ?>
                                <tr>
                                    <th scope="row"><label for="status">狀態</label></th>
                                    <td>
                                        <select name="status" id="status" <?php disabled(!$can_edit_status); ?>>
                                            <?php foreach (['active', 'suspended', 'deleted'] as $status) : ?>
                                                <option value="<?php echo esc_attr($status); ?>" <?php selected((string) $member['status'], $status); ?>><?php echo esc_html($status); ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">會員等級</th>
                                    <td><?php echo esc_html((string) ($member['tier_name'] ?? '未設定')); ?></td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="note">備註</label></th>
                                    <td><textarea id="note" name="note" rows="5" class="large-text" <?php disabled(!$can_edit_note); ?>><?php echo esc_textarea((string) $member['note']); ?></textarea></td>
                                </tr>
                            </tbody>
                        </table>
                        <?php if ($can_edit_basic || $can_edit_status || $can_edit_note) : ?>
                            <?php submit_button('儲存會員資料'); ?>
                        <?php endif; ?>
                    </form>
                </div>

                <div class="mrpolar-card">
                    <h2>會員摘要</h2>
                    <p><strong>點數餘額：</strong><?php echo esc_html((string) $member['points_balance']); ?></p>
                    <p><strong>總點數累積：</strong><?php echo esc_html((string) $member['points_lifetime']); ?></p>
                    <p><strong>年度消費：</strong>NT$ <?php echo esc_html(number_format_i18n((float) $member['yearly_spending'], 2)); ?></p>
                    <p><strong>總消費：</strong>NT$ <?php echo esc_html(number_format_i18n((float) $member['total_spending'], 2)); ?></p>
                    <p><strong>加入時間：</strong><?php echo esc_html(mysql2date('Y-m-d H:i', (string) $member['registered_at'])); ?></p>
                    <p><strong>最後更新：</strong><?php echo esc_html(mysql2date('Y-m-d H:i', (string) $member['updated_at'])); ?></p>
                    <?php if ($can_edit_points) : ?>
                        <hr>
                        <h3>手動調整點數</h3>
                        <form method="post">
                            <?php wp_nonce_field('mrpolar_adjust_points_' . $member_id); ?>
                            <input type="hidden" name="mrpolar_admin_action" value="adjust_points">
                            <p>
                                <label for="points_amount">異動點數</label><br>
                                <input type="number" min="1" step="1" name="points_amount" id="points_amount" class="small-text" required>
                            </p>
                            <p>
                                <label for="points_direction">方向</label><br>
                                <select name="points_direction" id="points_direction">
                                    <option value="increase">增加</option>
                                    <option value="decrease">扣除</option>
                                </select>
                            </p>
                            <p>
                                <label for="points_reason">原因</label><br>
                                <input type="text" name="points_reason" id="points_reason" class="regular-text" required>
                            </p>
                            <p>
                                <label for="points_note">備註</label><br>
                                <textarea name="points_note" id="points_note" rows="3" class="large-text"></textarea>
                            </p>
                            <?php submit_button('送出點數調整', 'secondary'); ?>
                        </form>
                    <?php endif; ?>
                </div>
            </div>

            <?php if ($can_view_address) : ?>
                <div class="mrpolar-card">
                    <h2>地址列表</h2>
                    <?php self::render_table(['標籤', '收件人', '電話', '地址', '預設'], array_map(static function ($address) {
                        return [
                            $address['label'],
                            $address['name'],
                            $address['phone'],
                            trim($address['city'] . ' ' . $address['district'] . ' ' . $address['address']),
                            $address['is_default'] ? '是' : '',
                        ];
                    }, $addresses)); ?>
                </div>
            <?php endif; ?>

            <?php if ($can_view_pets) : ?>
                <div class="mrpolar-card">
                    <h2>毛孩列表</h2>
                    <?php self::render_table(['名稱', '類型', '品種', '性別', '生日', '年齡', '體重'], array_map(static function ($pet) {
                        return [
                            $pet['name'],
                            $pet['type'],
                            $pet['breed'],
                            $pet['gender'],
                            $pet['birthday'],
                            (string) $pet['petAge'],
                            $pet['petWeight'],
                        ];
                    }, $pets)); ?>
                </div>
            <?php endif; ?>

            <?php if ($can_view_points && !is_wp_error($points)) : ?>
                <div class="mrpolar-card">
                    <h2>最近 50 筆點數紀錄</h2>
                    <?php self::render_table(['類型', '異動', '異動後', '原因', '操作人', '時間'], array_map(static function ($log) {
                        return [
                            $log['change_type'],
                            (string) $log['points_delta'],
                            (string) $log['points_after'],
                            $log['reason'],
                            $log['operated_name'],
                            $log['operated_at'],
                        ];
                    }, $points['logs'])); ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    private static function maybe_handle_member_post($member_id) {
        if ('POST' !== $_SERVER['REQUEST_METHOD'] || empty($_POST['mrpolar_admin_action'])) {
            return;
        }

        $action = sanitize_text_field(wp_unslash((string) $_POST['mrpolar_admin_action']));

        if ('save_member' === $action) {
            self::handle_member_save($member_id);
        }

        if ('adjust_points' === $action) {
            self::handle_points_adjustment($member_id);
        }
    }

    private static function handle_member_save($member_id) {
        check_admin_referer('mrpolar_save_member_' . $member_id);

        $member = MrPolar_Member::get_member_by_id($member_id);
        if (empty($member)) {
            self::redirect_with_notice(self::MEMBERS_SLUG, '找不到會員資料。', 'error', ['member_id' => $member_id]);
        }

        $payload = [];
        $basic_changed = false;

        foreach (['display_name', 'email', 'phone', 'gender', 'birthday'] as $field) {
            $new = sanitize_text_field(wp_unslash((string) ($_POST[$field] ?? '')));
            $old = (string) ($member[$field] ?? '');
            if ($new !== $old) {
                $basic_changed = true;
                $payload[$field] = $new;
            }
        }

        $status = sanitize_text_field(wp_unslash((string) ($_POST['status'] ?? $member['status'])));
        if ($status !== (string) $member['status']) {
            if (!MrPolar_Member::has_admin_permission('perm_account_status', 2)) {
                self::redirect_with_notice(self::MEMBERS_SLUG, '你沒有修改帳號狀態的權限。', 'error', ['member_id' => $member_id]);
            }
            $payload['status'] = $status;
        }

        $note = sanitize_textarea_field(wp_unslash((string) ($_POST['note'] ?? $member['note'])));
        if ($note !== (string) $member['note']) {
            if (!MrPolar_Member::has_admin_permission('perm_note', 2)) {
                self::redirect_with_notice(self::MEMBERS_SLUG, '你沒有修改備註的權限。', 'error', ['member_id' => $member_id]);
            }
            $payload['note'] = $note;
        }

        if ($basic_changed && !MrPolar_Member::has_admin_permission('perm_member_basic', 2)) {
            self::redirect_with_notice(self::MEMBERS_SLUG, '你沒有編輯會員基本資料的權限。', 'error', ['member_id' => $member_id]);
        }

        $updated = MrPolar_Member::update_member_admin_profile($member_id, $payload);
        if (is_wp_error($updated)) {
            self::redirect_with_notice(self::MEMBERS_SLUG, $updated->get_error_message(), 'error', ['member_id' => $member_id]);
        }

        self::redirect_with_notice(self::MEMBERS_SLUG, '會員資料已更新。', 'success', ['member_id' => $member_id]);
    }

    private static function handle_points_adjustment($member_id) {
        check_admin_referer('mrpolar_adjust_points_' . $member_id);

        if (!MrPolar_Member::has_admin_permission('perm_points_edit', 2)) {
            self::redirect_with_notice(self::MEMBERS_SLUG, '你沒有調整點數的權限。', 'error', ['member_id' => $member_id]);
        }

        $amount    = max(1, (int) ($_POST['points_amount'] ?? 0));
        $direction = sanitize_text_field(wp_unslash((string) ($_POST['points_direction'] ?? 'increase')));
        $reason    = sanitize_text_field(wp_unslash((string) ($_POST['points_reason'] ?? '')));
        $note      = sanitize_textarea_field(wp_unslash((string) ($_POST['points_note'] ?? '')));
        $delta     = 'decrease' === $direction ? -$amount : $amount;
        $type      = $delta < 0 ? 'deduct_manual' : 'earn_manual';
        $operator  = wp_get_current_user();

        $result = MrPolar_Member::adjust_points(
            $member_id,
            $delta,
            $type,
            $reason,
            $note,
            get_current_user_id(),
            $operator ? $operator->display_name : ''
        );

        if (is_wp_error($result)) {
            self::redirect_with_notice(self::MEMBERS_SLUG, $result->get_error_message(), 'error', ['member_id' => $member_id]);
        }

        self::redirect_with_notice(self::MEMBERS_SLUG, '點數已調整。', 'success', ['member_id' => $member_id]);
    }

    private static function maybe_handle_tier_post() {
        if ('POST' !== $_SERVER['REQUEST_METHOD'] || 'save_tiers' !== ($_POST['mrpolar_admin_action'] ?? '')) {
            return;
        }

        check_admin_referer('mrpolar_save_tiers');

        if (!MrPolar_Member::has_admin_permission('perm_tier_config', 2)) {
            self::redirect_with_notice(self::TIERS_SLUG, '你沒有修改等級設定的權限。', 'error');
        }

        global $wpdb;
        $tiers = $_POST['tiers'] ?? [];

        if (!is_array($tiers)) {
            self::redirect_with_notice(self::TIERS_SLUG, '等級資料格式不正確。', 'error');
        }

        foreach ($tiers as $tier_id => $row) {
            $tier_id = (int) $tier_id;
            if ($tier_id <= 0 || !is_array($row)) {
                continue;
            }

            $color = sanitize_text_field(wp_unslash((string) ($row['tier_color'] ?? '#888888')));
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
                $color = '#888888';
            }

            $wpdb->update(
                $wpdb->prefix . 'mrpolar_member_tiers',
                [
                    'tier_name'               => sanitize_text_field(wp_unslash((string) ($row['tier_name'] ?? ''))),
                    'tier_color'              => $color,
                    'cashback_rate'           => number_format((float) ($row['cashback_rate'] ?? 0), 4, '.', ''),
                    'welcome_points'          => (int) ($row['welcome_points'] ?? 0),
                    'upgrade_min_spending'    => '' === (string) ($row['upgrade_min_spending'] ?? '') ? null : number_format((float) $row['upgrade_min_spending'], 2, '.', ''),
                    'birthday_bonus_rate'     => number_format((float) ($row['birthday_bonus_rate'] ?? 0), 4, '.', ''),
                    'free_shipping_threshold' => '' === (string) ($row['free_shipping_threshold'] ?? '') ? null : number_format((float) $row['free_shipping_threshold'], 2, '.', ''),
                    'description'             => sanitize_textarea_field(wp_unslash((string) ($row['description'] ?? ''))),
                    'is_active'               => !empty($row['is_active']) ? 1 : 0,
                ],
                ['id' => $tier_id],
                ['%s', '%s', '%f', '%d', '%f', '%f', '%f', '%s', '%d'],
                ['%d']
            );
        }

        self::redirect_with_notice(self::TIERS_SLUG, '等級設定已更新。', 'success');
    }

    private static function render_input_row($name, $label, $value, $disabled = false, $type = 'text') {
        ?>
        <tr>
            <th scope="row"><label for="<?php echo esc_attr(sanitize_key($name)); ?>"><?php echo esc_html($label); ?></label></th>
            <td><input type="<?php echo esc_attr($type); ?>" name="<?php echo esc_attr($name); ?>" id="<?php echo esc_attr(sanitize_key($name)); ?>" value="<?php echo esc_attr((string) $value); ?>" class="regular-text" <?php disabled($disabled); ?>></td>
        </tr>
        <?php
    }

    private static function render_table(array $headers, array $rows) {
        if (empty($rows)) {
            echo '<p class="description">目前沒有資料。</p>';
            return;
        }

        echo '<table class="widefat striped"><thead><tr>';
        foreach ($headers as $header) {
            echo '<th>' . esc_html($header) . '</th>';
        }
        echo '</tr></thead><tbody>';
        foreach ($rows as $row) {
            echo '<tr>';
            foreach ($row as $cell) {
                echo '<td>' . esc_html((string) $cell) . '</td>';
            }
            echo '</tr>';
        }
        echo '</tbody></table>';
    }

    private static function render_notice() {
        if (empty($_GET['mrpolar_notice'])) {
            return;
        }

        $message = sanitize_text_field(wp_unslash((string) $_GET['mrpolar_notice']));
        $type    = sanitize_key((string) ($_GET['mrpolar_notice_type'] ?? 'success'));
        $class   = 'notice notice-success';

        if ('error' === $type) {
            $class = 'notice notice-error';
        }

        echo '<div class="' . esc_attr($class) . ' is-dismissible"><p>' . esc_html($message) . '</p></div>';
    }

    private static function redirect_with_notice($page, $message, $type = 'success', array $extra_args = []) {
        $args = array_merge($extra_args, [
            'page'                => $page,
            'mrpolar_notice'      => $message,
            'mrpolar_notice_type' => $type,
        ]);

        wp_safe_redirect(add_query_arg($args, admin_url('admin.php')));
        exit;
    }

    private static function can_view_members() {
        return MrPolar_Member::has_admin_permission('perm_member_basic', 1);
    }

    private static function can_view_tiers() {
        return MrPolar_Member::has_admin_permission('perm_tier_view', 1) || MrPolar_Member::has_admin_permission('perm_tier_config', 1);
    }

    private static function render_styles() {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;
        ?>
        <style>
            .mrpolar-admin .mrpolar-two-col { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; margin-top:20px; }
            .mrpolar-admin .mrpolar-card { background:#fff; border:1px solid #dcdcde; border-radius:10px; padding:20px; margin-top:20px; }
            .mrpolar-admin .mrpolar-card h2 { margin-top:0; }
            .mrpolar-tier-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; margin-top:20px; }
        </style>
        <?php
    }
}
