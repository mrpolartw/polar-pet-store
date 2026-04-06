<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_Order_Hooks {

    private static ?self $instance = null;

    private string $table_members;
    private string $table_tiers;
    private string $table_points_log;

    public function __construct() {
        global $wpdb;

        $this->table_members    = $wpdb->prefix . 'mrpolar_members';
        $this->table_tiers      = $wpdb->prefix . 'mrpolar_member_tiers';
        $this->table_points_log = $wpdb->prefix . 'mrpolar_points_log';
    }

    public static function boot(): void {
        // 付款完成立即觸發（支援所有付款方式）
        add_action('woocommerce_payment_complete',       [self::instance(), 'on_order_paid'], 10, 1);
        // 訂單直接被標為完成時也觸發（e.g. 貨到付款手動完成）
        add_action('woocommerce_order_status_completed', [self::instance(), 'on_order_paid'], 10, 1);
        // 訂單取消 / 退款時扣回
        add_action('woocommerce_order_status_cancelled', [self::instance(), 'on_order_cancelled'], 10, 1);
        add_action('woocommerce_order_status_refunded',  [self::instance(), 'on_order_cancelled'], 10, 1);
        // 每年 1 月 1 日 00:05 執行年度 reset 與保級降等
        add_action('mrpolar_yearly_tier_reset',          [self::instance(), 'run_yearly_reset']);
        // 排程若尚未建立則建立
        add_action('init',                               [self::instance(), 'maybe_schedule_yearly_reset']);
    }

    public static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    // ───────────────────────────────────────────
    // 公用：折抵點數扣除
    // ───────────────────────────────────────────
    public static function deduct_points_for_redemption(int $memberId, int $points, int $orderId, ?int $operatedBy = null): void {
        self::instance()->award_points(
            $memberId,
            -abs($points),
            'redeem_order',
            $orderId,
            sprintf('訂單 #%d 點數折抵使用', $orderId),
            null,
            $operatedBy ?? (get_current_user_id() ?: null)
        );
    }

    // ───────────────────────────────────────────
    // 訂單付款完成
    // ───────────────────────────────────────────
    public function on_order_paid(int $orderId): void {
        $order = wc_get_order($orderId);

        if (!$order instanceof WC_Order || $order->get_customer_id() <= 0) {
            return;
        }

        // 防止重複處理（payment_complete + status_completed 都掛鉤）
        if ('1' === (string) $order->get_meta('_mrpolar_points_processed', true)) {
            return;
        }

        $memberId = $this->get_member_id_by_wp_user((int) $order->get_customer_id());
        if (null === $memberId) {
            return;
        }

        $qualifyingAmount = $this->get_qualifying_amount($order);

        // ── 計算回饋點數 ──
        $rate         = $this->get_member_cashback_rate($memberId);
        $pointsToEarn = ($qualifyingAmount > 0 && $rate > 0)
            ? (int) floor($qualifyingAmount * $rate)
            : 0;

        // ── 生日加碼 ──
        $memberBirthday = $this->get_member_birthday($memberId);
        if (null !== $memberBirthday) {
            $birthMonth   = gmdate('m', strtotime($memberBirthday));
            $currentMonth = current_time('m');

            if ($birthMonth === $currentMonth) {
                $birthdayRate = $this->get_member_birthday_bonus_rate($memberId);
                if ($birthdayRate > 0 && $qualifyingAmount > 0) {
                    $pointsToEarn += (int) floor($qualifyingAmount * $birthdayRate);
                }
            }
        }

        // ── 寫入點數 ──
        if ($pointsToEarn > 0) {
            $awarded = $this->award_points(
                $memberId,
                $pointsToEarn,
                'earn_order',
                $orderId,
                sprintf('訂單 #%d 消費回饋', $orderId),
                null,
                (int) $order->get_customer_id()
            );

            if (!$awarded) {
                return;
            }
        }

        // ── 累加年度消費 + 累計消費 ──
        global $wpdb;

        $updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET yearly_spending = yearly_spending + %f,
                     total_spending  = total_spending  + %f
                 WHERE id = %d",
                $qualifyingAmount,
                $qualifyingAmount,
                $memberId
            )
        );

        if (false === $updated) {
            return;
        }

        // ── 即時升等檢查 ──
        $this->maybe_upgrade_tier($memberId);

        $order->update_meta_data('_mrpolar_points_processed', '1');
        $order->save();
    }

    // ───────────────────────────────────────────
    // 訂單取消 / 退款
    // ───────────────────────────────────────────
    public function on_order_cancelled(int $orderId): void {
        $order = wc_get_order($orderId);

        if (!$order instanceof WC_Order || $order->get_customer_id() <= 0) {
            return;
        }

        if ('1' !== (string) $order->get_meta('_mrpolar_points_processed', true)) {
            return;
        }

        if ('1' === (string) $order->get_meta('_mrpolar_points_reversed', true)) {
            return;
        }

        $memberId = $this->get_member_id_by_wp_user((int) $order->get_customer_id());
        if (null === $memberId) {
            return;
        }

        global $wpdb;

        $originalLog = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, points_delta
                 FROM {$this->table_points_log}
                 WHERE member_id  = %d
                   AND order_id   = %d
                   AND change_type = %s
                 LIMIT 1",
                $memberId,
                $orderId,
                'earn_order'
            ),
            ARRAY_A
        );

        if (is_array($originalLog) && (int) ($originalLog['points_delta'] ?? 0) > 0) {
            $deducted = $this->award_points(
                $memberId,
                -((int) $originalLog['points_delta']),
                'deduct_cancel',
                $orderId,
                sprintf('訂單 #%d 取消退回', $orderId),
                null,
                null
            );

            if (!$deducted) {
                return;
            }
        }

        $qualifyingAmount = $this->get_qualifying_amount($order);

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET yearly_spending = GREATEST(0, yearly_spending - %f),
                     total_spending  = GREATEST(0, total_spending  - %f)
                 WHERE id = %d",
                $qualifyingAmount,
                $qualifyingAmount,
                $memberId
            )
        );

        $order->update_meta_data('_mrpolar_points_reversed', '1');
        $order->save();
    }

    // ───────────────────────────────────────────
    // 升等邏輯：由高到低掃描，找到最高符合等級（AND 邏輯）
    // ───────────────────────────────────────────
    private function maybe_upgrade_tier(int $memberId): void {
        global $wpdb;

        $member = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    m.wp_user_id,
                    m.tier_id,
                    m.yearly_spending,
                    m.points_lifetime,
                    COALESCE(t.sort_order, 0)    AS current_sort_order,
                    COALESCE(t.is_manual_only, 0) AS current_is_manual_only
                 FROM {$this->table_members} m
                 LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
                 WHERE m.id = %d
                 LIMIT 1",
                $memberId
            ),
            ARRAY_A
        );

        if (!is_array($member)) {
            return;
        }

        // 手動等級不自動變動
        if ((int) ($member['current_is_manual_only'] ?? 0) === 1) {
            return;
        }

        $tiers = $wpdb->get_results(
            "SELECT id, sort_order, upgrade_min_spending, upgrade_min_orders, upgrade_min_points
             FROM {$this->table_tiers}
             WHERE is_active      = 1
               AND is_manual_only = 0
               AND (
                   upgrade_min_spending IS NOT NULL
                   OR upgrade_min_orders IS NOT NULL
                   OR upgrade_min_points IS NOT NULL
               )
             ORDER BY sort_order DESC",
            ARRAY_A
        );

        if (empty($tiers)) {
            return;
        }

        $yearlySpending   = (float) ($member['yearly_spending'] ?? 0);
        $pointsLifetime   = (int)   ($member['points_lifetime'] ?? 0);
        $wpUserId         = (int)   ($member['wp_user_id'] ?? 0);
        $currentSortOrder = (int)   ($member['current_sort_order'] ?? 0);
        $orderCount       = null;

        foreach ($tiers as $tier) {
            // 每個非 null 的條件都要通過（AND 邏輯）
            $qualifies = true;

            if (null !== $tier['upgrade_min_spending']) {
                $qualifies = $qualifies && ($yearlySpending >= (float) $tier['upgrade_min_spending']);
            }

            if (null !== $tier['upgrade_min_orders']) {
                if (null === $orderCount) {
                    $orders = wc_get_orders([
                        'customer'   => $wpUserId,
                        'status'     => ['completed'],
                        'date_after' => gmdate('Y-01-01'),
                        'return'     => 'ids',
                        'limit'      => -1,
                    ]);
                    $orderCount = is_array($orders) ? count($orders) : 0;
                }
                $qualifies = $qualifies && ($orderCount >= (int) $tier['upgrade_min_orders']);
            }

            if (null !== $tier['upgrade_min_points']) {
                $qualifies = $qualifies && ($pointsLifetime >= (int) $tier['upgrade_min_points']);
            }

            if ($qualifies) {
                $tierSortOrder = (int) ($tier['sort_order'] ?? 0);
                // 只升不降（降等由年度 reset 負責）
                if ($tierSortOrder > $currentSortOrder) {
                    $wpdb->query(
                        $wpdb->prepare(
                            "UPDATE {$this->table_members}
                             SET tier_id = %d, tier_upgraded_at = NOW()
                             WHERE id = %d",
                            (int) $tier['id'],
                            $memberId
                        )
                    );
                }
                // 最高符合等級找到，停止掃描
                return;
            }
        }
    }

    // ───────────────────────────────────────────
    // 年度排程：建立 WP Cron
    // ───────────────────────────────────────────
    public function maybe_schedule_yearly_reset(): void {
        if (!wp_next_scheduled('mrpolar_yearly_tier_reset')) {
            $nextReset = strtotime(gmdate('Y', strtotime('+1 year')) . '-01-01 00:05:00 Asia/Taipei');
            wp_schedule_event((int) $nextReset, 'yearly', 'mrpolar_yearly_tier_reset');
        }
    }

    // ───────────────────────────────────────────
    // 年度 reset：保級判斷 + yearly_spending 歸零
    // ───────────────────────────────────────────
    public function run_yearly_reset(): void {
        global $wpdb;

        $members = $wpdb->get_results(
            "SELECT m.id, m.tier_id, m.yearly_spending,
                    t.is_manual_only, t.sort_order AS tier_sort_order,
                    t.downgrade_to_tier_id, t.downgrade_min_spending, t.upgrade_min_spending
             FROM {$this->table_members} m
             LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
             WHERE m.tier_id IS NOT NULL",
            ARRAY_A
        );

        foreach ((array) $members as $member) {
            if ((int) ($member['is_manual_only'] ?? 0) === 1) {
                continue;
            }

            $memberId    = (int) $member['id'];
            $yearlySpend = (float) $member['yearly_spending'];

            // 保級門檻：優先用 downgrade_min_spending，fallback 用 upgrade_min_spending
            $maintainMin = null !== $member['downgrade_min_spending'] && '' !== (string) $member['downgrade_min_spending']
                ? (float) $member['downgrade_min_spending']
                : (float) ($member['upgrade_min_spending'] ?? 0);

            if (
                $maintainMin > 0
                && $yearlySpend < $maintainMin
                && !empty($member['downgrade_to_tier_id'])
            ) {
                $wpdb->query(
                    $wpdb->prepare(
                        "UPDATE {$this->table_members} SET tier_id = %d WHERE id = %d",
                        (int) $member['downgrade_to_tier_id'],
                        $memberId
                    )
                );
            }
        }

        // 全部歸零年度消費
        $wpdb->query("UPDATE {$this->table_members} SET yearly_spending = 0");
    }

    // ───────────────────────────────────────────
    // 私有輔助方法
    // ───────────────────────────────────────────
    private function award_points(
        int $memberId,
        int $delta,
        string $changeType,
        ?int $orderId,
        string $reason,
        ?string $note,
        ?int $operatedBy
    ): bool {
        if (0 === $delta) {
            return true;
        }

        global $wpdb;

        $started = $wpdb->query('START TRANSACTION');
        if (false === $started) {
            return false;
        }

        $currentBalance = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT points_balance FROM {$this->table_members} WHERE id = %d FOR UPDATE",
                $memberId
            )
        );

        if (null === $currentBalance) {
            $wpdb->query('ROLLBACK');
            return false;
        }

        $newBalance = max(0, (int) $currentBalance + $delta);
        $updated    = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET points_balance  = %d,
                     points_lifetime = IF(%d > 0, points_lifetime + %d, points_lifetime),
                     updated_at      = NOW()
                 WHERE id = %d",
                $newBalance,
                $delta,
                $delta,
                $memberId
            )
        );

        if (false === $updated) {
            $wpdb->query('ROLLBACK');
            return false;
        }

        $user         = ($operatedBy ?? 0) > 0 ? get_userdata((int) $operatedBy) : false;
        $operatedName = $user instanceof WP_User ? (string) $user->display_name : 'System';

        $orderIdSql    = null === $orderId    ? 'NULL' : '%d';
        $noteSql       = null === $note       ? 'NULL' : '%s';
        $operatedBySql = (null !== $operatedBy && $operatedBy > 0) ? '%d' : 'NULL';

        $params = [$memberId, $changeType, $delta, $newBalance];
        if (null !== $orderId)           { $params[] = $orderId; }
        $params[] = $reason;
        if (null !== $note)              { $params[] = $note; }
        if ('%d' === $operatedBySql)     { $params[] = $operatedBy; }
        $params[] = $operatedName;
        $params[] = '';

        $insertSql = "INSERT INTO {$this->table_points_log}
            (member_id, change_type, points_delta, points_after, order_id, reason, note, operated_by, operated_name, operated_at, ip_address)
            VALUES (%d, %s, %d, %d, {$orderIdSql}, %s, {$noteSql}, {$operatedBySql}, %s, NOW(), %s)";

        $inserted = $wpdb->query($wpdb->prepare($insertSql, $params));

        if (false === $inserted) {
            $wpdb->query('ROLLBACK');
            return false;
        }

        $committed = $wpdb->query('COMMIT');
        if (false === $committed) {
            $wpdb->query('ROLLBACK');
            return false;
        }

        return true;
    }

    private function get_member_id_by_wp_user(int $wpUserId): ?int {
        global $wpdb;
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_members} WHERE wp_user_id = %d LIMIT 1",
            $wpUserId
        ));
        return null === $id ? null : (int) $id;
    }

    private function get_member_cashback_rate(int $memberId): float {
        global $wpdb;
        $rate = $wpdb->get_var($wpdb->prepare(
            "SELECT t.cashback_rate
             FROM {$this->table_members} m
             LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
             WHERE m.id = %d LIMIT 1",
            $memberId
        ));
        return null === $rate ? 0.0 : (float) $rate;
    }

    private function get_member_birthday(int $memberId): ?string {
        global $wpdb;
        $birthday = $wpdb->get_var($wpdb->prepare(
            "SELECT birthday FROM {$this->table_members} WHERE id = %d LIMIT 1",
            $memberId
        ));
        if (!is_string($birthday) || '' === $birthday) {
            return null;
        }
        $ts = strtotime($birthday);
        return false === $ts ? null : gmdate('Y-m-d', $ts);
    }

    private function get_member_birthday_bonus_rate(int $memberId): float {
        global $wpdb;
        $rate = $wpdb->get_var($wpdb->prepare(
            "SELECT t.birthday_bonus_rate
             FROM {$this->table_members} m
             LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
             WHERE m.id = %d LIMIT 1",
            $memberId
        ));
        return null === $rate ? 0.0 : (float) $rate;
    }

    private function get_qualifying_amount(WC_Order $order): float {
        $orderTotal     = (float) $order->get_total();
        $shippingTotal  = (float) $order->get_shipping_total();
        $pointsRedeemed = (float) $order->get_meta('_mrpolar_points_redeemed_amount', true);
        return max(0.0, $orderTotal - $shippingTotal - $pointsRedeemed);
    }
}
