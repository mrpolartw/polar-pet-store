<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_Points_Shortcode {

    public const POINTS_TO_NTD_RATE = 1;
    public const MIN_REDEEM_POINTS  = 50;

    private static ?self $instance = null;

    private string $table_members;

    public function __construct() {
        global $wpdb;

        $this->table_members = $wpdb->prefix . 'mrpolar_members';
    }

    public static function boot(): void {
        add_shortcode('mrpolar_points_balance', [self::instance(), 'render_points_balance']);
        add_action('woocommerce_review_order_before_payment', [self::instance(), 'render_redeem_form']);
        add_action('woocommerce_checkout_process', [self::instance(), 'validate_redeem_points']);
        add_action('woocommerce_checkout_update_order_meta', [self::instance(), 'save_redeem_to_order'], 10, 2);
        add_action('woocommerce_cart_calculate_fees', [self::instance(), 'apply_points_discount']);
        add_action('woocommerce_after_checkout_form', [self::instance(), 'clear_session_if_needed']);
        add_action('wc_ajax_mrpolar_set_redeem_points', [self::instance(), 'ajax_set_redeem_points']);
    }

    public static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function render_points_balance($atts): string {
        unset($atts);

        if (!is_user_logged_in()) {
            return '';
        }

        $memberId = $this->get_current_member_id();
        $balance  = null === $memberId ? 0 : $this->get_member_points_balance($memberId);

        return '<span class="mrpolar-points-balance">' . intval($balance) . ' 點</span>';
    }

    public function render_redeem_form(): void {
        if (!is_user_logged_in() || !WC()->cart || WC()->cart->is_empty()) {
            return;
        }

        $memberId = $this->get_current_member_id();
        if (null === $memberId) {
            return;
        }

        $balance      = $this->get_member_points_balance($memberId);
        $maxRedeemNtd = intval($balance) * self::POINTS_TO_NTD_RATE;
        $cartTotal    = (float) WC()->cart->get_subtotal();
        $maxApply     = (int) min($maxRedeemNtd, floor($cartTotal * 0.8));

        if ($balance < self::MIN_REDEEM_POINTS || $maxApply < self::MIN_REDEEM_POINTS) {
            return;
        }

        $currentValue = min((int) WC()->session->get('mrpolar_redeem_points', 0), $maxApply);
        ?>
        <div class="mrpolar-redeem-wrap">
            <h4><?php echo esc_html('點數折抵'); ?></h4>
            <p>
                <?php
                echo wp_kses_post(
                    sprintf(
                        '可用點數：<strong>%1$d 點</strong>（最多折抵 NT$%2$d 元）',
                        intval($balance),
                        intval($maxApply)
                    )
                );
                ?>
            </p>
            <label>
                <?php echo esc_html('使用點數：'); ?>
                <input
                    type="number"
                    name="mrpolar_redeem_points"
                    min="0"
                    max="<?php echo esc_attr((string) intval($maxApply)); ?>"
                    step="1"
                    value="<?php echo esc_attr((string) intval($currentValue)); ?>"
                >
            </label>
            <button type="button" id="mrpolar-apply-redeem"><?php echo esc_html('套用'); ?></button>
            <span id="mrpolar-redeem-notice"></span>
        </div>
        <script>
            (function () {
                var btn = document.getElementById('mrpolar-apply-redeem');
                if (!btn) return;

                btn.addEventListener('click', function () {
                    var input = document.querySelector('[name="mrpolar_redeem_points"]');
                    var points = parseInt(input && input.value, 10) || 0;
                    var notice = document.getElementById('mrpolar-redeem-notice');

                    fetch('/?wc-ajax=mrpolar_set_redeem_points', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'points=' + encodeURIComponent(points) + '&nonce=' + encodeURIComponent((window.wc_checkout_params && window.wc_checkout_params.nonce) || '')
                    })
                        .then(function (response) { return response.json(); })
                        .then(function (data) {
                            notice.textContent = data.message || '';

                            if (data.success) {
                                if (window.jQuery) {
                                    window.jQuery(document.body).trigger('update_checkout');
                                } else {
                                    document.body.dispatchEvent(new Event('update_checkout'));
                                }
                            }
                        });
                });
            })();
        </script>
        <?php
    }

    public function ajax_set_redeem_points(): void {
        if (!is_user_logged_in()) {
            wp_send_json(['success' => false, 'message' => '請先登入']);
        }

        $points   = max(0, intval(wp_unslash((string) ($_POST['points'] ?? 0))));
        $memberId = $this->get_current_member_id();

        if (null === $memberId) {
            wp_send_json(['success' => false, 'message' => '找不到會員資料']);
        }

        $balance  = $this->get_member_points_balance($memberId);
        $maxApply = $this->get_max_redeem_points($balance);

        if ($points > $balance || $points > $maxApply) {
            wp_send_json(['success' => false, 'message' => '點數不足']);
        }

        if ($points > 0 && $points < self::MIN_REDEEM_POINTS) {
            wp_send_json(['success' => false, 'message' => '最少需兌換 50 點']);
        }

        WC()->session->set('mrpolar_redeem_points', $points);

        wp_send_json([
            'success' => true,
            'message' => sprintf('已套用 %1$d 點折抵 NT$%2$d 元', $points, $points),
        ]);
    }

    public function apply_points_discount(): void {
        if (!is_user_logged_in() || !is_checkout() || !WC()->cart) {
            return;
        }

        $points = intval(WC()->session->get('mrpolar_redeem_points', 0));
        if ($points <= 0) {
            return;
        }

        $discount = $points * self::POINTS_TO_NTD_RATE;

        WC()->cart->add_fee('點數折抵', -abs($discount), false);
    }

    public function validate_redeem_points(): void {
        $points = intval(WC()->session->get('mrpolar_redeem_points', 0));
        if ($points <= 0) {
            return;
        }

        $memberId = $this->get_current_member_id();
        if (null === $memberId) {
            WC()->session->set('mrpolar_redeem_points', 0);
            return;
        }

        $balance  = $this->get_member_points_balance($memberId);
        $maxApply = $this->get_max_redeem_points($balance);

        if ($points < self::MIN_REDEEM_POINTS) {
            wc_add_notice('點數折抵至少需使用 50 點', 'error');
            WC()->session->set('mrpolar_redeem_points', 0);
            return;
        }

        if ($points > $balance || $points > $maxApply) {
            wc_add_notice('點數不足，請重新套用點數折抵', 'error');
            WC()->session->set('mrpolar_redeem_points', 0);
        }
    }

    public function save_redeem_to_order(int $orderId, array $data): void {
        unset($data);

        $points = intval(WC()->session->get('mrpolar_redeem_points', 0));
        if ($points <= 0) {
            return;
        }

        $discount = $points * self::POINTS_TO_NTD_RATE;
        $order    = wc_get_order($orderId);
        // fix: use the order customer as operator when no logged-in user context exists
        $wpUserId = $order instanceof WC_Order ? (int) $order->get_customer_id() : 0;

        if (!$order instanceof WC_Order) {
            return;
        }

        $order->update_meta_data('_mrpolar_points_redeemed', $points);
        $order->update_meta_data('_mrpolar_points_redeemed_amount', (float) $discount);
        $order->save();

        $memberId = $this->get_current_member_id();
        if (null !== $memberId) {
            MrPolar_Order_Hooks::deduct_points_for_redemption($memberId, $points, $orderId, $wpUserId ?: null);
        }

        WC()->session->set('mrpolar_redeem_points', 0);
    }

    public function clear_session_if_needed(): void {
        // Intentionally left empty for v1.0.
    }

    private function get_current_member_id(): ?int {
        if (!is_user_logged_in()) {
            return null;
        }

        global $wpdb;

        $memberId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id
                 FROM {$this->table_members}
                 WHERE wp_user_id = %d
                 LIMIT 1",
                get_current_user_id()
            )
        );

        return null === $memberId ? null : (int) $memberId;
    }

    private function get_member_points_balance(int $memberId): int {
        global $wpdb;

        $balance = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT points_balance
                 FROM {$this->table_members}
                 WHERE id = %d
                 LIMIT 1",
                $memberId
            )
        );

        return null === $balance ? 0 : (int) $balance;
    }

    private function get_max_redeem_points(int $balance): int {
        if (!WC()->cart) {
            return 0;
        }

        $maxRedeemNtd = intval($balance) * self::POINTS_TO_NTD_RATE;
        $cartTotal    = (float) WC()->cart->get_subtotal();

        return (int) min($maxRedeemNtd, floor($cartTotal * 0.8));
    }
}
