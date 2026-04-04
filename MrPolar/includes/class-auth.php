<?php
defined('ABSPATH') || exit;

/**
 * 認證相關 API：
 * POST /mrpolar/v1/register  - 公開會員註冊
 * POST /mrpolar/v1/logout    - 登出（前端清除 token）
 * GET  /mrpolar/v1/me        - 取得當前登入會員資料
 */
class MrPolar_Auth {

    public static function register_routes() {
        register_rest_route(MRPOLAR_API_NAMESPACE, '/register', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [self::class, 'register'],
            'permission_callback' => '__return_true',
            'args'                => self::register_args(),
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/me', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [self::class, 'get_me'],
            'permission_callback' => [self::class, 'is_logged_in'],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/me', [
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => [self::class, 'update_me'],
            'permission_callback' => [self::class, 'is_logged_in'],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/change-password', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [self::class, 'change_password'],
            'permission_callback' => [self::class, 'is_logged_in'],
        ]);
    }

    // --------------------------------------------------------
    // 公開會員註冊
    // --------------------------------------------------------
    public static function register(WP_REST_Request $request) {
        $email      = sanitize_email($request->get_param('email'));
        $password   = $request->get_param('password');
        $first_name = sanitize_text_field($request->get_param('first_name'));
        $last_name  = sanitize_text_field($request->get_param('last_name'));
        $phone      = sanitize_text_field($request->get_param('phone') ?? '');
        $gender     = sanitize_text_field($request->get_param('gender') ?? '');
        $birthday   = sanitize_text_field($request->get_param('birthday') ?? '');
        $pets       = $request->get_param('pets') ?? [];

        // 驗證必填
        if (empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', '請輸入有效的電子郵件', ['status' => 400]);
        }
        if (empty($password) || strlen($password) < 8) {
            return new WP_Error('invalid_password', '密碼至少需要 8 個字元', ['status' => 400]);
        }
        if (email_exists($email)) {
            return new WP_Error('email_exists', '此電子郵件已被註冊', ['status' => 409]);
        }

        // 建立 WordPress 使用者
        $username = self::generate_username($email);
        $user_id  = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return new WP_Error('register_failed', $user_id->get_error_message(), ['status' => 500]);
        }

        // 更新基本資料
        wp_update_user([
            'ID'           => $user_id,
            'first_name'   => $first_name,
            'last_name'    => $last_name,
            'display_name' => trim("$first_name $last_name") ?: $username,
            'role'         => 'customer',
        ]);

        // 儲存自定義 meta
        if ($phone)    update_user_meta($user_id, 'billing_phone', $phone);
        if ($gender)   update_user_meta($user_id, 'mrpolar_gender', $gender);
        if ($birthday) update_user_meta($user_id, 'mrpolar_birthday', $birthday);

        // 同步 WooCommerce billing
        update_user_meta($user_id, 'billing_email', $email);
        update_user_meta($user_id, 'billing_first_name', $first_name);
        update_user_meta($user_id, 'billing_last_name', $last_name);

        // 初始化點數
        update_user_meta($user_id, 'mrpolar_points', 0);

        // 儲存寵物資料
        if (!empty($pets) && is_array($pets)) {
            $sanitized_pets = array_map([self::class, 'sanitize_pet'], $pets);
            update_user_meta($user_id, 'mrpolar_pets', wp_json_encode($sanitized_pets));
        }

        // 建立 WooCommerce 顧客記錄
        do_action('woocommerce_created_customer', $user_id, [], $password);

        $customer = self::format_customer($user_id);

        return new WP_REST_Response([
            'success'  => true,
            'message'  => '註冊成功',
            'customer' => $customer,
        ], 201);
    }

    // --------------------------------------------------------
    // 取得當前會員
    // --------------------------------------------------------
    public static function get_me(WP_REST_Request $request) {
        $user_id  = get_current_user_id();
        $customer = self::format_customer($user_id);

        return new WP_REST_Response($customer, 200);
    }

    // --------------------------------------------------------
    // 更新當前會員
    // --------------------------------------------------------
    public static function update_me(WP_REST_Request $request) {
        $user_id    = get_current_user_id();
        $first_name = $request->get_param('first_name');
        $last_name  = $request->get_param('last_name');
        $phone      = $request->get_param('phone');
        $gender     = $request->get_param('gender');
        $birthday   = $request->get_param('birthday');
        $pets       = $request->get_param('pets');

        $update_data = ['ID' => $user_id];

        if ($first_name !== null) {
            $update_data['first_name'] = sanitize_text_field($first_name);
            update_user_meta($user_id, 'billing_first_name', sanitize_text_field($first_name));
        }
        if ($last_name !== null) {
            $update_data['last_name'] = sanitize_text_field($last_name);
            update_user_meta($user_id, 'billing_last_name', sanitize_text_field($last_name));
        }
        if (!empty($update_data['first_name']) || !empty($update_data['last_name'])) {
            $fn = $update_data['first_name'] ?? get_user_meta($user_id, 'first_name', true);
            $ln = $update_data['last_name']  ?? get_user_meta($user_id, 'last_name', true);
            $update_data['display_name'] = trim("$fn $ln");
        }

        wp_update_user($update_data);

        if ($phone !== null)    update_user_meta($user_id, 'billing_phone', sanitize_text_field($phone));
        if ($gender !== null)   update_user_meta($user_id, 'mrpolar_gender', sanitize_text_field($gender));
        if ($birthday !== null) update_user_meta($user_id, 'mrpolar_birthday', sanitize_text_field($birthday));

        if ($pets !== null && is_array($pets)) {
            $sanitized_pets = array_map([self::class, 'sanitize_pet'], $pets);
            update_user_meta($user_id, 'mrpolar_pets', wp_json_encode($sanitized_pets));
        }

        return new WP_REST_Response(self::format_customer($user_id), 200);
    }

    // --------------------------------------------------------
    // 修改密碼
    // --------------------------------------------------------
    public static function change_password(WP_REST_Request $request) {
        $user_id      = get_current_user_id();
        $old_password = $request->get_param('old_password');
        $new_password = $request->get_param('new_password');

        if (empty($old_password) || empty($new_password)) {
            return new WP_Error('missing_fields', '請填寫舊密碼與新密碼', ['status' => 400]);
        }
        if (strlen($new_password) < 8) {
            return new WP_Error('weak_password', '新密碼至少需要 8 個字元', ['status' => 400]);
        }

        $user = get_user_by('ID', $user_id);
        if (!wp_check_password($old_password, $user->user_pass, $user_id)) {
            return new WP_Error('wrong_password', '舊密碼不正確', ['status' => 400]);
        }

        wp_set_password($new_password, $user_id);

        return new WP_REST_Response(['success' => true, 'message' => '密碼已更新'], 200);
    }

    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------
    public static function is_logged_in() {
        return is_user_logged_in();
    }

    private static function generate_username(string $email): string {
        $base = sanitize_user(strstr($email, '@', true), true);
        $username = $base;
        $i = 1;
        while (username_exists($username)) {
            $username = $base . $i;
            $i++;
        }
        return $username;
    }

    public static function format_customer(int $user_id): array {
        $user    = get_user_by('ID', $user_id);
        $meta    = get_user_meta($user_id);
        $pets_raw = $meta['mrpolar_pets'][0] ?? '[]';
        $pets    = json_decode($pets_raw, true) ?: [];
        $points  = (int) ($meta['mrpolar_points'][0] ?? 0);

        // 取得收件地址
        $addresses = self::get_addresses($user_id);

        return [
            'id'          => $user_id,
            'email'       => $user->user_email,
            'username'    => $user->user_login,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'name'        => trim("{$user->first_name} {$user->last_name}") ?: $user->display_name,
            'phone'       => $meta['billing_phone'][0] ?? '',
            'gender'      => $meta['mrpolar_gender'][0] ?? '',
            'birthday'    => $meta['mrpolar_birthday'][0] ?? '',
            'avatar'      => get_avatar_url($user_id),
            'member_since' => $user->user_registered,
            'points'      => $points,
            'pets'        => $pets,
            'addresses'   => $addresses,
        ];
    }

    private static function get_addresses(int $user_id): array {
        $addresses_raw = get_user_meta($user_id, 'mrpolar_addresses', true);
        if (!empty($addresses_raw)) {
            return json_decode($addresses_raw, true) ?: [];
        }

        // 從 WooCommerce billing 地址建立預設
        $meta        = get_user_meta($user_id);
        $city        = $meta['billing_city'][0] ?? '';
        $address_1   = $meta['billing_address_1'][0] ?? '';

        if (empty($city) && empty($address_1)) {
            return [];
        }

        return [[
            'id'         => 'default',
            'label'      => '預設地址',
            'name'       => trim(($meta['billing_first_name'][0] ?? '') . ' ' . ($meta['billing_last_name'][0] ?? '')),
            'phone'      => $meta['billing_phone'][0] ?? '',
            'city'       => $city,
            'district'   => $meta['billing_state'][0] ?? '',
            'address'    => $address_1,
            'is_default' => true,
        ]];
    }

    private static function sanitize_pet(array $pet): array {
        return [
            'id'       => sanitize_text_field($pet['id'] ?? uniqid('pet_')),
            'name'     => sanitize_text_field($pet['name'] ?? ''),
            'type'     => sanitize_text_field($pet['type'] ?? ''),
            'breed'    => sanitize_text_field($pet['breed'] ?? ''),
            'age'      => sanitize_text_field($pet['age'] ?? ''),
            'weight'   => sanitize_text_field($pet['weight'] ?? ''),
            'birthday' => sanitize_text_field($pet['birthday'] ?? ''),
            'gender'   => sanitize_text_field($pet['gender'] ?? ''),
        ];
    }

    private static function register_args(): array {
        return [
            'email'      => ['required' => true, 'type' => 'string'],
            'password'   => ['required' => true, 'type' => 'string'],
            'first_name' => ['required' => true, 'type' => 'string'],
            'last_name'  => ['required' => false, 'type' => 'string', 'default' => ''],
            'phone'      => ['required' => false, 'type' => 'string'],
            'gender'     => ['required' => false, 'type' => 'string'],
            'birthday'   => ['required' => false, 'type' => 'string'],
            'pets'       => ['required' => false, 'type' => 'array'],
        ];
    }
}
