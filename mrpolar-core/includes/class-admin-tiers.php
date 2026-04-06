<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_Admin_Tiers {

    public const MENU_SLUG = 'mrpolar-members';
    public const PAGE_SLUG = 'mrpolar-tiers';

    private static ?self $instance = null;
    private string $table_tiers;
    private string $table_members;

    public function __construct() {
        global $wpdb;
        $this->table_tiers   = $wpdb->prefix . 'mrpolar_member_tiers';
        $this->table_members = $wpdb->prefix . 'mrpolar_members';
    }

    public static function boot(): void {
        if (!is_admin()) {
            return;
        }
        $instance = self::instance();
        add_action('admin_post_mrpolar_save_tier',     [$instance, 'handle_save_tier']);
        add_action('admin_post_mrpolar_delete_tier',   [$instance, 'handle_delete_tier']);
        add_action('admin_post_mrpolar_reorder_tiers', [$instance, 'handle_reorder_tiers']);
    }

    public static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
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

    // ══════════════════════════════════════════════
    // 列表頁
    // ══════════════════════════════════════════════
    public function render_tier_list(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'mrpolar-api'));
        }

        global $wpdb;

        $tiers = $wpdb->get_results(
            "SELECT t.*,
                    (SELECT COUNT(*) FROM {$this->table_members} m WHERE m.tier_id = t.id) AS member_count
             FROM {$this->table_tiers} t
             ORDER BY t.sort_order ASC, t.id ASC",
            ARRAY_A
        );

        $tierOptions = [];
        foreach (is_array($tiers) ? $tiers : [] as $t) {
            $tierOptions[(int) $t['id']] = (string) $t['tier_name'];
        }

        echo $this->render_tier_list_page(is_array($tiers) ? $tiers : [], $tierOptions);
    }

    public function render_tier_list_page(array $tiers, array $tierOptions): string {
        ob_start();
        ?>
        <div class="mrpolar-wrap">
            <div class="mrpolar-header">
                <div>
                    <h1><?php echo esc_html('會員等級設定'); ?></h1>
                    <p class="mrpolar-subtitle">拖曳列可調整等級順序；升等條件以「AND」邏輯判斷</p>
                </div>
                <div class="mrpolar-actions">
                    <button type="button" class="mrpolar-btn mrpolar-btn-primary" id="mrpolar-open-tier-modal">
                        + 新增等級
                    </button>
                </div>
            </div>

            <?php echo $this->render_notice(); ?>

            <div class="mrpolar-info-card">
                <strong>ℹ️ 年度保級制說明</strong>
                每年 1 月 1 日自動歸零年度消費，依「保級門檻」判斷是否降等。
                若會員年度消費低於保級門檻且有設定「降等至」，則自動降至指定等級。
                標註 <code>is_manual_only</code> 的等級不受自動升降等影響。
            </div>

            <div class="mrpolar-card">
                <div class="mrpolar-table-wrap">
                    <table id="mrpolar-tiers-table" class="mrpolar-table">
                        <thead>
                        <tr>
                            <th style="width:36px">&nbsp;</th>
                            <th>等級名稱</th>
                            <th>識別碼</th>
                            <th>會員數</th>
                            <th>升等門檻</th>
                            <th>保級門檻</th>
                            <th>降等至</th>
                            <th>回饋率</th>
                            <th>生日加碼</th>
                            <th>免運門檻</th>
                            <th>手動</th>
                            <th>狀態</th>
                            <th style="width:110px">操作</th>
                        </tr>
                        </thead>
                        <tbody id="mrpolar-tiers-tbody">
                        <?php if (empty($tiers)) : ?>
                            <tr>
                                <td colspan="13" class="mrpolar-table-empty">目前尚無會員等級，點擊「新增等級」開始設定。</td>
                            </tr>
                        <?php else : ?>
                            <?php foreach ($tiers as $tier) : ?>
                                <?php
                                $tierId          = intval($tier['id'] ?? 0);
                                $tierName        = (string) ($tier['tier_name'] ?? '');
                                $tierKey         = (string) ($tier['tier_key'] ?? '');
                                $tierColor       = sanitize_hex_color((string) ($tier['tier_color'] ?? '')) ?: '#888888';
                                $cashbackRate    = (float) ($tier['cashback_rate'] ?? 0);
                                $welcomePoints   = intval($tier['welcome_points'] ?? 0);
                                $birthdayRate    = (float) ($tier['birthday_bonus_rate'] ?? 0);
                                $freeShipping    = $tier['free_shipping_threshold'] ?? null;
                                $isActive        = intval($tier['is_active'] ?? 0) === 1;
                                $isManualOnly    = intval($tier['is_manual_only'] ?? 0) === 1;
                                $memberCount     = intval($tier['member_count'] ?? 0);
                                $upgradeSpending = $tier['upgrade_min_spending'] ?? null;
                                $maintainSpend   = $tier['downgrade_min_spending'] ?? null;
                                $downgradeToId   = $tier['downgrade_to_tier_id'] ?? null;
                                $downgradeToName = ($downgradeToId && isset($tierOptions[(int)$downgradeToId]))
                                    ? $tierOptions[(int)$downgradeToId] : '—';
                                $tierJson = esc_attr((string) wp_json_encode($tier));
                                ?>
                                <tr data-tier-id="<?php echo esc_attr((string) $tierId); ?>">
                                    <td class="col-drag"><span class="mrpolar-drag-handle" title="拖曳調整順序" aria-hidden="true">☰</span></td>
                                    <td>
                                        <span class="tier-dot" style="background:<?php echo esc_attr($tierColor); ?>"></span>
                                        <strong><?php echo esc_html($tierName); ?></strong>
                                    </td>
                                    <td><code class="mrpolar-code"><?php echo esc_html($tierKey); ?></code></td>
                                    <td><span class="mrpolar-badge"><?php echo esc_html((string)$memberCount); ?> 人</span></td>
                                    <td class="col-mono"><?php echo esc_html(null !== $upgradeSpending && '' !== (string)$upgradeSpending ? 'NT$' . number_format((float)$upgradeSpending) : '不限'); ?></td>
                                    <td class="col-mono"><?php echo esc_html(null !== $maintainSpend && '' !== (string)$maintainSpend ? 'NT$' . number_format((float)$maintainSpend) : '—'); ?></td>
                                    <td><?php echo esc_html($downgradeToName); ?></td>
                                    <td class="col-mono"><?php echo esc_html($this->format_rate($cashbackRate)); ?></td>
                                    <td class="col-mono"><?php echo esc_html($birthdayRate > 0 ? $this->format_rate($birthdayRate) : '—'); ?></td>
                                    <td class="col-mono"><?php echo esc_html(null !== $freeShipping && '' !== (string)$freeShipping && (float)$freeShipping > 0 ? 'NT$' . number_format((float)$freeShipping) : '—'); ?></td>
                                    <td>
                                        <?php if ($isManualOnly) : ?>
                                            <span class="mrpolar-badge status-manual">手動</span>
                                        <?php else : ?>
                                            <span class="mrpolar-text-muted">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <span class="mrpolar-badge <?php echo esc_attr($isActive ? 'status-active' : 'status-suspended'); ?>">
                                            <?php echo esc_html($isActive ? '啟用' : '停用'); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="mrpolar-row-actions">
                                            <button type="button"
                                                class="mrpolar-btn mrpolar-btn-sm mrpolar-btn-secondary mrpolar-edit-tier-btn"
                                                data-tier-json="<?php echo $tierJson; ?>">編輯</button>
                                            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline">
                                                <input type="hidden" name="action" value="mrpolar_delete_tier">
                                                <input type="hidden" name="tier_id" value="<?php echo esc_attr((string) $tierId); ?>">
                                                <?php wp_nonce_field('mrpolar_delete_tier_' . $tierId); ?>
                                                <button type="submit"
                                                    class="mrpolar-btn mrpolar-btn-sm mrpolar-btn-danger"
                                                    onclick="return confirm('確定要刪除「<?php echo esc_js($tierName); ?>」等級？目前有 <?php echo esc_js((string)$memberCount); ?> 位會員。')">&#x1f5d1;</button>
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

            <!-- 拖曳排序用隐藏表單 -->
            <form id="mrpolar-reorder-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
                <input type="hidden" name="action" value="mrpolar_reorder_tiers">
                <?php wp_nonce_field('mrpolar_reorder_tiers', 'mrpolar_reorder_nonce'); ?>
                <input type="hidden" id="mrpolar-tier-order" name="tier_order" value="">
            </form>

            <!-- Modal：新增 / 編輯等級 -->
            <div id="mrpolar-tier-modal" class="mrpolar-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mrpolar-modal-title">
                <div class="mrpolar-modal mrpolar-modal-lg">

                    <div class="mrpolar-modal-header">
                        <h2 id="mrpolar-modal-title">新增等級</h2>
                        <button type="button" id="mrpolar-close-tier-modal" class="mrpolar-modal-close" aria-label="關閉">&times;</button>
                    </div>

                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="mrpolar-tier-form">
                        <?php wp_nonce_field('mrpolar_save_tier', 'mrpolar_tier_nonce'); ?>
                        <input type="hidden" name="action" value="mrpolar_save_tier">
                        <input type="hidden" name="tier_id" id="mrpolar-tier-id" value="0">

                        <!-- 基本設定 -->
                        <div class="mrpolar-section-label">基本設定</div>
                        <div class="mrpolar-form-row">
                            <label for="mrpolar-tier-name">等級名稱 <span class="required">*</span></label>
                            <input type="text" id="mrpolar-tier-name" name="tier_name" required placeholder="例：銀卡會員">
                        </div>
                        <div class="mrpolar-grid-3">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-key">識別碼 (slug) <span class="required">*</span></label>
                                <input type="text" id="mrpolar-tier-key" name="tier_key" pattern="[a-z0-9_]+" required placeholder="silver">
                                <span class="mrpolar-hint">小寫英數與底線</span>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-color">等級顏色</label>
                                <input type="color" id="mrpolar-tier-color" name="tier_color" value="#888888" style="height:38px;width:100%;padding:2px 4px;">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-tier-sort">排序數值</label>
                                <input type="number" id="mrpolar-tier-sort" name="sort_order" min="0" value="10" step="5">
                                <span class="mrpolar-hint">數字越大等級越高</span>
                            </div>
                        </div>
                        <div class="mrpolar-checkbox-row">
                            <label class="mrpolar-checkbox-label">
                                <input type="checkbox" name="is_active" value="1" id="mrpolar-is-active" checked>
                                啟用此等級
                            </label>
                            <label class="mrpolar-checkbox-label">
                                <input type="checkbox" name="is_manual_only" value="1" id="mrpolar-is-manual">
                                僅限手動指派 <span class="mrpolar-hint">（不納入自動升降等）</span>
                            </label>
                        </div>

                        <!-- 升等條件 -->
                        <div class="mrpolar-section-label">
                            升等條件
                            <span class="mrpolar-badge-info">AND 邏輯：所有填寫的條件同時達標才升等</span>
                        </div>
                        <div class="mrpolar-grid-3">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-spending">年度消費門檻（NT$）</label>
                                <input type="number" id="mrpolar-upgrade-spending" name="upgrade_min_spending" min="0" step="1" placeholder="空白 = 不限">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-orders">最低訂單數（筆）</label>
                                <input type="number" id="mrpolar-upgrade-orders" name="upgrade_min_orders" min="0" step="1" placeholder="空白 = 不限">
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-upgrade-points">最低終生點數（點）</label>
                                <input type="number" id="mrpolar-upgrade-points" name="upgrade_min_points" min="0" step="1" placeholder="空白 = 不限">
                            </div>
                        </div>

                        <!-- 保級 / 降等 -->
                        <div class="mrpolar-section-label">
                            保級條件
                            <span class="mrpolar-badge-info">每年 1/1 歸零年度消費後判斷</span>
                        </div>
                        <div class="mrpolar-grid-2">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-maintain-spending">保級消費門檻（NT$）</label>
                                <input type="number" id="mrpolar-maintain-spending" name="downgrade_min_spending" min="0" step="1" placeholder="空白 = 不降等">
                                <span class="mrpolar-hint">低於此金額且設有「降等至」時自動降等</span>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-downgrade-to">降等至</label>
                                <select id="mrpolar-downgrade-to" name="downgrade_to_tier_id">
                                    <option value="">— 不降等 —</option>
                                    <?php foreach ($tierOptions as $tid => $tname) : ?>
                                        <option value="<?php echo esc_attr((string) $tid); ?>"><?php echo esc_html($tname); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <!-- 等級效益 -->
                        <div class="mrpolar-section-label">等級效益</div>
                        <div class="mrpolar-grid-2">
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-cashback-rate">消費回饋率（%）</label>
                                <input type="number" id="mrpolar-cashback-rate" name="cashback_rate" min="0" max="100" step="0.01" placeholder="0">
                                <span class="mrpolar-hint">每 NT$1 消費可獲得的點數比例</span>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-welcome-points">加入贈點（點）</label>
                                <input type="number" id="mrpolar-welcome-points" name="welcome_points" min="0" step="1" placeholder="0">
                                <span class="mrpolar-hint">升等至此等級時一次性贈送</span>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-birthday-bonus">生日加碼率（%）</label>
                                <input type="number" id="mrpolar-birthday-bonus" name="birthday_bonus_rate" min="0" max="100" step="0.01" placeholder="0">
                                <span class="mrpolar-hint">生日當月消費額外加碼回饋</span>
                            </div>
                            <div class="mrpolar-form-row">
                                <label for="mrpolar-free-shipping">免運門檻（NT$）</label>
                                <input type="number" id="mrpolar-free-shipping" name="free_shipping_threshold" min="0" step="1" placeholder="空白 = 不享免運">
                            </div>
                        </div>

                        <!-- 說明 -->
                        <div class="mrpolar-form-row">
                            <label for="mrpolar-tier-description">等級說明（前台顯示）</label>
                            <textarea id="mrpolar-tier-description" name="description" rows="3" placeholder="例：年度消費累積 NT$6,000 即可升級，享有 5% 消費回饋點數與生日雙倍加碼。"></textarea>
                        </div>

                        <div class="mrpolar-form-actions">
                            <button type="button" id="mrpolar-cancel-tier-modal" class="mrpolar-btn mrpolar-btn-secondary">取消</button>
                            <button type="submit" class="mrpolar-btn mrpolar-btn-primary" id="mrpolar-tier-submit">儲存等級</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script>
        /* 等待 DOM 就緒 */
        document.addEventListener('DOMContentLoaded', function () {

            var modal   = document.getElementById('mrpolar-tier-modal');
            var form    = document.getElementById('mrpolar-tier-form');
            var title   = document.getElementById('mrpolar-modal-title');
            var submit  = document.getElementById('mrpolar-tier-submit');

            function openModal() { modal.classList.add('open'); }
            function closeModal() {
                modal.classList.remove('open');
                form.reset();
                document.getElementById('mrpolar-tier-id').value = '0';
                title.textContent  = '新增等級';
                submit.textContent = '儲存等級';
            }

            document.getElementById('mrpolar-open-tier-modal').addEventListener('click', openModal);
            document.getElementById('mrpolar-close-tier-modal').addEventListener('click', closeModal);
            document.getElementById('mrpolar-cancel-tier-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

            /* 編輯按鈕 */
            document.querySelectorAll('.mrpolar-edit-tier-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var tier = JSON.parse(this.dataset.tierJson || '{}');

                    title.textContent  = '編輯等級：' + (tier.tier_name || '');
                    submit.textContent = '更新等級';

                    function setVal(id, v) {
                        var el = document.getElementById(id);
                        if (el) el.value = (v !== null && v !== undefined) ? v : '';
                    }
                    function setChk(name, v) {
                        var el = form.querySelector('[name="' + name + '"]');
                        if (el) el.checked = !!+v;
                    }

                    document.getElementById('mrpolar-tier-id').value = tier.id || 0;
                    setVal('mrpolar-tier-name',  tier.tier_name);
                    setVal('mrpolar-tier-key',   tier.tier_key);
                    setVal('mrpolar-tier-color', tier.tier_color || '#888888');
                    setVal('mrpolar-tier-sort',  tier.sort_order);
                    setChk('is_active',     tier.is_active);
                    setChk('is_manual_only', tier.is_manual_only);

                    setVal('mrpolar-upgrade-spending', tier.upgrade_min_spending);
                    setVal('mrpolar-upgrade-orders',   tier.upgrade_min_orders);
                    setVal('mrpolar-upgrade-points',   tier.upgrade_min_points);
                    setVal('mrpolar-maintain-spending', tier.downgrade_min_spending);

                    var ddSel = document.getElementById('mrpolar-downgrade-to');
                    if (ddSel) ddSel.value = tier.downgrade_to_tier_id || '';

                    /* 率值: DB 儲 0.05 → 顯示 5.00 */
                    setVal('mrpolar-cashback-rate',  tier.cashback_rate     != null ? (parseFloat(tier.cashback_rate)     * 100).toFixed(2) : '');
                    setVal('mrpolar-welcome-points', tier.welcome_points);
                    setVal('mrpolar-birthday-bonus', tier.birthday_bonus_rate != null ? (parseFloat(tier.birthday_bonus_rate) * 100).toFixed(2) : '');
                    setVal('mrpolar-free-shipping',  tier.free_shipping_threshold);
                    setVal('mrpolar-tier-description', tier.description);

                    openModal();
                });
            });

            /* SortableJS 拖曳排序 */
            if (typeof Sortable !== 'undefined') {
                var tbody = document.getElementById('mrpolar-tiers-tbody');
                if (tbody) {
                    Sortable.create(tbody, {
                        handle: '.mrpolar-drag-handle',
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        onEnd: function () {
                            var ids = Array.from(tbody.querySelectorAll('tr[data-tier-id]'))
                                          .map(function (tr) { return tr.dataset.tierId; });
                            document.getElementById('mrpolar-tier-order').value = ids.join(',');
                            document.getElementById('mrpolar-reorder-form').submit();
                        }
                    });
                }
            }
        });
        </script>
        <?php
        return (string) ob_get_clean();
    }

    // ══════════════════════════════════════════════
    // 儲存等級（修正 $formats 對齊 + nullable 安全處理）
    // ══════════════════════════════════════════════
    public function handle_save_tier(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }

        check_admin_referer('mrpolar_save_tier', 'mrpolar_tier_nonce');

        global $wpdb;

        $tierId       = isset($_POST['tier_id']) ? absint(wp_unslash((string) $_POST['tier_id'])) : 0;
        $tierName     = sanitize_text_field(wp_unslash((string) ($_POST['tier_name'] ?? '')));
        $tierKey      = sanitize_key(wp_unslash((string) ($_POST['tier_key'] ?? '')));
        $tierColor    = sanitize_hex_color((string) ($_POST['tier_color'] ?? '')) ?: '#888888';
        $sortOrder    = max(0, absint(wp_unslash((string) ($_POST['sort_order'] ?? '10'))));
        $isActive     = isset($_POST['is_active']) ? 1 : 0;
        $isManualOnly = isset($_POST['is_manual_only']) ? 1 : 0;

        // nullable float
        $upgradeMinSpending = $this->parse_nullable_float($_POST['upgrade_min_spending'] ?? null);
        $downgradeMinSpend  = $this->parse_nullable_float($_POST['downgrade_min_spending'] ?? null);
        $freeShipping       = $this->parse_nullable_float($_POST['free_shipping_threshold'] ?? null);

        // nullable int
        $upgradeMinOrders  = $this->parse_nullable_int($_POST['upgrade_min_orders'] ?? null);
        $upgradeMinPoints  = $this->parse_nullable_int($_POST['upgrade_min_points'] ?? null);
        $downgradeToTierId = $this->parse_nullable_int($_POST['downgrade_to_tier_id'] ?? null);
        if ($downgradeToTierId === 0) { $downgradeToTierId = null; }

        // 率值：前台傳百分比，儲 decimal (0~1)
        $cashbackRate      = max(0.0, min(1.0, (float) wp_unslash((string) ($_POST['cashback_rate'] ?? '0')) / 100));
        $birthdayBonusRate = max(0.0, min(1.0, (float) wp_unslash((string) ($_POST['birthday_bonus_rate'] ?? '0')) / 100));
        $welcomePoints     = max(0, absint(wp_unslash((string) ($_POST['welcome_points'] ?? '0'))));
        $description       = sanitize_textarea_field(wp_unslash((string) ($_POST['description'] ?? '')));

        // 驗證
        if ('' === $tierName) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級名稱不可為空', 'error')); exit;
        }
        if ('' === $tierKey || !preg_match('/^[a-z0-9_]+$/', $tierKey)) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼格式錯誤（只能小寫英數與底線）', 'error')); exit;
        }
        if (null !== $downgradeToTierId && $tierId > 0 && $downgradeToTierId === $tierId) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '降等目標不可指向自己', 'error')); exit;
        }

        // 寫入資料：用 %s 處理所有欄位以支援 NULL
        // wpdb->insert/update 對於 NULL 值必須用 %s 才能正確寫入 SQL NULL
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
            'downgrade_min_spending'  => $downgradeMinSpend,
            'downgrade_to_tier_id'    => $downgradeToTierId,
            'cashback_rate'           => $cashbackRate,
            'welcome_points'          => $welcomePoints,
            'birthday_bonus_rate'     => $birthdayBonusRate,
            'free_shipping_threshold' => $freeShipping,
            'description'             => $description,
        ];
        // 所有欄位統一用 %s：讓 wpdb 自行根據 PHP 形態轉換型別，
        // 同時支援 null 寫入 SQL NULL（%d/%f 無法寫入 NULL）
        $formats = array_fill(0, count($data), '%s');

        if ($tierId > 0) {
            $exists = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_tiers} WHERE id = %d", $tierId
            ));
            if ($exists <= 0) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '找不到指定等級', 'error')); exit;
            }
            $dup = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_tiers} WHERE tier_key = %s AND id != %d", $tierKey, $tierId
            ));
            if ($dup > 0) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼已存在', 'error')); exit;
            }
            $result = $wpdb->update($this->table_tiers, $data, ['id' => $tierId], $formats, ['%d']);
            if (false === $result) {
                wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級更新失敗：' . $wpdb->last_error, 'error')); exit;
            }
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已更新', 'success')); exit;
        }

        $dup = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_tiers} WHERE tier_key = %s", $tierKey
        ));
        if ($dup > 0) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '識別碼已存在', 'error')); exit;
        }
        $result = $wpdb->insert($this->table_tiers, $data, $formats);
        if (false === $result) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級新增失敗：' . $wpdb->last_error, 'error')); exit;
        }
        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已新增', 'success')); exit;
    }

    // ══════════════════════════════════════════════
    // 刪除等級
    // ══════════════════════════════════════════════
    public function handle_delete_tier(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }
        $tierId = isset($_POST['tier_id']) ? absint(wp_unslash((string) $_POST['tier_id'])) : 0;
        check_admin_referer('mrpolar_delete_tier_' . $tierId);
        global $wpdb;
        $memberCount = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_members} WHERE tier_id = %d", $tierId
        ));
        if ($memberCount > 0) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(),
                "此等級有 {$memberCount} 位會員使用中，無法刪除。請先移轉會員等級。", 'error'));
            exit;
        }
        $refCount = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_tiers} WHERE downgrade_to_tier_id = %d", $tierId
        ));
        if ($refCount > 0) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(),
                '其他等級設定此等級為降等目標，請先移除相關設定。', 'error'));
            exit;
        }
        $deleted = $wpdb->delete($this->table_tiers, ['id' => $tierId], ['%d']);
        if (false === $deleted) {
            wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級刪除失敗', 'error')); exit;
        }
        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級已刪除', 'success')); exit;
    }

    // ══════════════════════════════════════════════
    // 拖曳重新排序
    // ══════════════════════════════════════════════
    public function handle_reorder_tiers(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to perform this action.', 'mrpolar-api'));
        }
        check_admin_referer('mrpolar_reorder_tiers', 'mrpolar_reorder_nonce');
        global $wpdb;
        $rawOrder = sanitize_text_field(wp_unslash((string) ($_POST['tier_order'] ?? '')));
        $ids      = array_values(array_filter(array_map('absint', explode(',', $rawOrder))));
        foreach ($ids as $index => $id) {
            $wpdb->update(
                $this->table_tiers,
                ['sort_order' => ($index + 1) * 10],
                ['id' => $id],
                ['%d'],
                ['%d']
            );
        }
        wp_safe_redirect($this->with_notice($this->get_tier_page_url(), '等級順序已更新', 'success')); exit;
    }

    // ══════════════════════════════════════════════
    // 輔助方法
    // ══════════════════════════════════════════════

    /**
     * 輸入空白/null 回傳 null，否則回傳非負 float
     */
    private function parse_nullable_float(mixed $v): ?float {
        if (null === $v || '' === (string) $v) {
            return null;
        }
        return max(0.0, (float) wp_unslash((string) $v));
    }

    /**
     * 輸入空白/null 回傳 null，否則回傳非負 int
     */
    private function parse_nullable_int(mixed $v): ?int {
        if (null === $v || '' === (string) $v) {
            return null;
        }
        return max(0, absint(wp_unslash((string) $v)));
    }

    private function format_rate(float $rate): string {
        $pct = $rate * 100;
        return (fmod($pct, 1.0) === 0.0 ? (int) $pct : round($pct, 2)) . '%';
    }

    private function render_notice(): string {
        $msg  = isset($_GET['mrpolar_notice'])      ? sanitize_text_field(wp_unslash((string) $_GET['mrpolar_notice'])) : '';
        $type = isset($_GET['mrpolar_notice_type']) ? sanitize_key(wp_unslash((string) $_GET['mrpolar_notice_type'])) : 'success';
        if ('' === $msg) {
            return '';
        }
        $class = 'error' === $type ? 'notice-error' : 'notice-success';
        return '<div class="notice ' . esc_attr($class) . ' is-dismissible"><p>' . esc_html(urldecode($msg)) . '</p></div>';
    }

    private function get_tier_page_url(): string {
        return admin_url('admin.php?page=' . self::PAGE_SLUG);
    }

    private function with_notice(string $url, string $msg, string $type = 'success'): string {
        return add_query_arg(['mrpolar_notice' => rawurlencode($msg), 'mrpolar_notice_type' => $type], $url);
    }
}
