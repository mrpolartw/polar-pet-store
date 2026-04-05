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
        add_action('woocommerce_order_status_completed', [self::instance(), 'on_order_completed'], 10, 1);
        add_action('woocommerce_order_status_cancelled', [self::instance(), 'on_order_cancelled'], 10, 1);
        add_action('woocommerce_order_status_refunded', [self::instance(), 'on_order_cancelled'], 10, 1);
    }

    public static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    // fix: allow explicit operator ID during redemption deductions
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

    public function on_order_completed(int $orderId): void {
        $order = wc_get_order($orderId);

        if (!$order instanceof WC_Order || $order->get_customer_id() <= 0) {
            return;
        }

        $alreadyProcessed = (string) $order->get_meta('_mrpolar_points_processed', true);
        if ('1' === $alreadyProcessed) {
            return;
        }

        $memberId = $this->get_member_id_by_wp_user((int) $order->get_customer_id());
        if (null === $memberId) {
            return;
        }

        $qualifyingAmount = $this->get_qualifying_amount($order);
        $rate             = $this->get_member_cashback_rate($memberId);
        $pointsToEarn     = ($qualifyingAmount > 0 && $rate > 0)
            ? (int) floor($qualifyingAmount * $rate)
            : 0;

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

        global $wpdb;

        $updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET yearly_spending = yearly_spending + %f
                 WHERE id = %d",
                $qualifyingAmount,
                $memberId
            )
        );

        if (false === $updated) {
            return;
        }

        $this->maybe_upgrade_tier($memberId);

        $order->update_meta_data('_mrpolar_points_processed', '1');
        $order->save();
    }

    public function on_order_cancelled(int $orderId): void {
        $order = wc_get_order($orderId);

        if (!$order instanceof WC_Order || $order->get_customer_id() <= 0) {
            return;
        }

        $alreadyProcessed = (string) $order->get_meta('_mrpolar_points_processed', true);
        if ('1' !== $alreadyProcessed) {
            return;
        }

        $alreadyReversed = (string) $order->get_meta('_mrpolar_points_reversed', true);
        if ('1' === $alreadyReversed) {
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
                 WHERE member_id = %d
                   AND order_id = %d
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
                 SET yearly_spending = GREATEST(0, yearly_spending - %f)
                 WHERE id = %d",
                $qualifyingAmount,
                $memberId
            )
        );

        $order->update_meta_data('_mrpolar_points_reversed', '1');
        $order->save();
    }

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
                "SELECT points_balance
                 FROM {$this->table_members}
                 WHERE id = %d
                 FOR UPDATE",
                $memberId
            )
        );

        if (null === $currentBalance) {
            $wpdb->query('ROLLBACK');
            return false;
        }

        $newBalance   = max(0, (int) $currentBalance + $delta);
        $updated      = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_members}
                 SET points_balance = %d,
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
            return false;
        }

        $user         = ($operatedBy ?? 0) > 0 ? get_userdata((int) $operatedBy) : false;
        $operatedName = $user instanceof WP_User ? (string) $user->display_name : 'System';

        $orderIdSql = null === $orderId ? 'NULL' : '%d';
        $noteSql    = null === $note ? 'NULL' : '%s';
        // fix: keep system-generated points logs as NULL operated_by instead of 0
        $operatedBySql = (null !== $operatedBy && $operatedBy > 0) ? '%d' : 'NULL';
        $params     = [
            $memberId,
            $changeType,
            $delta,
            $newBalance,
        ];

        if (null !== $orderId) {
            $params[] = $orderId;
        }

        $params[] = $reason;

        if (null !== $note) {
            $params[] = $note;
        }

        if ('%d' === $operatedBySql) {
            $params[] = $operatedBy;
        }

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

    private function maybe_upgrade_tier(int $memberId): void {
        global $wpdb;

        $member = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    m.wp_user_id,
                    m.tier_id,
                    m.yearly_spending,
                    m.points_lifetime,
                    COALESCE(t.sort_order, 0) AS current_sort_order
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

        $tiers = $wpdb->get_results(
            "SELECT
                id,
                sort_order,
                upgrade_min_spending,
                upgrade_min_orders,
                upgrade_min_points
             FROM {$this->table_tiers}
             WHERE is_active = 1
               AND is_manual_only = 0
               AND (
                    upgrade_min_spending IS NOT NULL
                    OR upgrade_min_orders IS NOT NULL
                    OR upgrade_min_points IS NOT NULL
               )
             ORDER BY sort_order DESC",
            ARRAY_A
        );

        if (!is_array($tiers) || [] === $tiers) {
            return;
        }

        $currentSortOrder = (int) ($member['current_sort_order'] ?? 0);
        $yearlySpending   = (float) ($member['yearly_spending'] ?? 0);
        $pointsLifetime   = (int) ($member['points_lifetime'] ?? 0);
        $wpUserId         = (int) ($member['wp_user_id'] ?? 0);
        $orderCount       = null;

        foreach ($tiers as $tier) {
            $qualifies = false;

            if (null !== $tier['upgrade_min_spending']) {
                $qualifies = $yearlySpending >= (float) $tier['upgrade_min_spending'];
            }

            if (null !== $tier['upgrade_min_orders']) {
                if (null === $orderCount) {
                    $orders = wc_get_orders([
                        'customer'   => $wpUserId,
                        'status'     => 'completed',
                        'date_after' => date('Y-01-01'),
                        'return'     => 'ids',
                        'limit'      => -1,
                    ]);
                    $orderCount = is_array($orders) ? count($orders) : 0;
                }

                $qualifies = $qualifies || ($orderCount >= (int) $tier['upgrade_min_orders']);
            }

            if (null !== $tier['upgrade_min_points']) {
                $qualifies = $qualifies || ($pointsLifetime >= (int) $tier['upgrade_min_points']);
            }

            if ($qualifies && (int) ($tier['sort_order'] ?? 0) > $currentSortOrder) {
                $wpdb->query(
                    $wpdb->prepare(
                        "UPDATE {$this->table_members}
                         SET tier_id = %d, tier_upgraded_at = NOW()
                         WHERE id = %d",
                        (int) $tier['id'],
                        $memberId
                    )
                );
                return;
            }
        }
    }

    private function get_member_id_by_wp_user(int $wpUserId): ?int {
        global $wpdb;

        $memberId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id
                 FROM {$this->table_members}
                 WHERE wp_user_id = %d
                 LIMIT 1",
                $wpUserId
            )
        );

        return null === $memberId ? null : (int) $memberId;
    }

    private function get_member_cashback_rate(int $memberId): float {
        global $wpdb;

        $rate = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT t.cashback_rate
                 FROM {$this->table_members} m
                 LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
                 WHERE m.id = %d
                 LIMIT 1",
                $memberId
            )
        );

        return null === $rate ? 0.0 : (float) $rate;
    }

    private function get_member_birthday(int $memberId): ?string {
        global $wpdb;

        $birthday = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT birthday
                 FROM {$this->table_members}
                 WHERE id = %d
                 LIMIT 1",
                $memberId
            )
        );

        if (!is_string($birthday) || '' === $birthday) {
            return null;
        }

        $timestamp = strtotime($birthday);

        return false === $timestamp ? null : gmdate('Y-m-d', $timestamp);
    }

    private function get_member_birthday_bonus_rate(int $memberId): float {
        global $wpdb;

        $rate = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT t.birthday_bonus_rate
                 FROM {$this->table_members} m
                 LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
                 WHERE m.id = %d
                 LIMIT 1",
                $memberId
            )
        );

        return null === $rate ? 0.0 : (float) $rate;
    }

    private function get_member_wp_user_id(int $memberId): int {
        global $wpdb;

        $wpUserId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT wp_user_id
                 FROM {$this->table_members}
                 WHERE id = %d
                 LIMIT 1",
                $memberId
            )
        );

        return null === $wpUserId ? 0 : (int) $wpUserId;
    }

    private function get_qualifying_amount(WC_Order $order): float {
        $orderTotal      = (float) $order->get_total();
        $shippingTotal   = (float) $order->get_shipping_total();
        $discountTotal   = (float) $order->get_total_discount();
        $pointsRedeemed  = (float) $order->get_meta('_mrpolar_points_redeemed_amount', true);
        $qualifyingAmount = max(0.0, $orderTotal - $shippingTotal - $pointsRedeemed);

        unset($discountTotal);

        return $qualifyingAmount;
    }
}
