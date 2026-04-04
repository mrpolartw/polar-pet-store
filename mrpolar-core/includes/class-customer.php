<?php
defined('ABSPATH') || exit;

/**
 * 顧客相關 API：
 * GET    /mrpolar/v1/customer/addresses         - 取得所有收件地址
 * POST   /mrpolar/v1/customer/addresses         - 新增收件地址
 * PUT    /mrpolar/v1/customer/addresses/{id}    - 更新收件地址
 * DELETE /mrpolar/v1/customer/addresses/{id}    - 刪除收件地址
 * GET    /mrpolar/v1/customer/points            - 取得點數
 * POST   /mrpolar/v1/customer/pets              - 更新寵物列表
 */
class MrPolar_Customer {

    public static function register_routes() {
        // 收件地址
        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/addresses', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_addresses'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [self::class, 'add_address'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/addresses/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [self::class, 'update_address'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [self::class, 'delete_address'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
        ]);

        // 點數
        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/points', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [self::class, 'get_points'],
            'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
        ]);

        // 寵物
        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/pets', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [self::class, 'update_pets'],
            'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
        ]);
    }

    // --------------------------------------------------------
    // 收件地址 CRUD
    // --------------------------------------------------------
    public static function get_addresses(WP_REST_Request $request) {
        $user_id   = get_current_user_id();
        $addresses = self::load_addresses($user_id);
        return new WP_REST_Response($addresses, 200);
    }

    public static function add_address(WP_REST_Request $request) {
        $user_id   = get_current_user_id();
        $addresses = self::load_addresses($user_id);

        $new_address = self::sanitize_address($request->get_params());
        $new_address['id'] = uniqid('addr_');

        // 如果是第一筆，設為預設
        if (empty($addresses)) {
            $new_address['is_default'] = true;
        }

        // 如果設為預設，取消其他預設
        if ($new_address['is_default']) {
            $addresses = array_map(function ($addr) {
                $addr['is_default'] = false;
                return $addr;
            }, $addresses);
        }

        $addresses[] = $new_address;
        self::save_addresses($user_id, $addresses);

        return new WP_REST_Response($new_address, 201);
    }

    public static function update_address(WP_REST_Request $request) {
        $user_id   = get_current_user_id();
        $addr_id   = $request->get_param('id');
        $addresses = self::load_addresses($user_id);
        $found     = false;

        $updated = sanitize_text_field($request->get_param('is_default')) === 'true'
            || $request->get_param('is_default') === true;

        if ($updated) {
            $addresses = array_map(function ($addr) {
                $addr['is_default'] = false;
                return $addr;
            }, $addresses);
        }

        $addresses = array_map(function ($addr) use ($addr_id, $request, &$found) {
            if ($addr['id'] === $addr_id) {
                $found = true;
                return array_merge($addr, self::sanitize_address($request->get_params()));
            }
            return $addr;
        }, $addresses);

        if (!$found) {
            return new WP_Error('not_found', '找不到此地址', ['status' => 404]);
        }

        self::save_addresses($user_id, $addresses);
        return new WP_REST_Response(current(array_filter($addresses, fn($a) => $a['id'] === $addr_id)), 200);
    }

    public static function delete_address(WP_REST_Request $request) {
        $user_id   = get_current_user_id();
        $addr_id   = $request->get_param('id');
        $addresses = self::load_addresses($user_id);
        $before    = count($addresses);

        $addresses = array_values(array_filter($addresses, fn($a) => $a['id'] !== $addr_id));

        if (count($addresses) === $before) {
            return new WP_Error('not_found', '找不到此地址', ['status' => 404]);
        }

        self::save_addresses($user_id, $addresses);
        return new WP_REST_Response(['success' => true], 200);
    }

    // --------------------------------------------------------
    // 點數
    // --------------------------------------------------------
    public static function get_points(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $points  = (int) get_user_meta($user_id, 'mrpolar_points', true);
        return new WP_REST_Response(['points' => $points], 200);
    }

    // --------------------------------------------------------
    // 寵物
    // --------------------------------------------------------
    public static function update_pets(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $pets    = $request->get_param('pets') ?? [];

        if (!is_array($pets)) {
            return new WP_Error('invalid_data', '寵物資料格式錯誤', ['status' => 400]);
        }

        $sanitized = array_map(function ($pet) {
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
        }, $pets);

        update_user_meta($user_id, 'mrpolar_pets', wp_json_encode($sanitized));

        return new WP_REST_Response(['pets' => $sanitized], 200);
    }

    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------
    private static function load_addresses(int $user_id): array {
        $raw = get_user_meta($user_id, 'mrpolar_addresses', true);
        return !empty($raw) ? (json_decode($raw, true) ?: []) : [];
    }

    private static function save_addresses(int $user_id, array $addresses): void {
        update_user_meta($user_id, 'mrpolar_addresses', wp_json_encode(array_values($addresses)));

        // 同步預設地址到 WooCommerce billing
        foreach ($addresses as $addr) {
            if (!empty($addr['is_default'])) {
                update_user_meta($user_id, 'billing_city', $addr['city'] ?? '');
                update_user_meta($user_id, 'billing_address_1', $addr['address'] ?? '');
                update_user_meta($user_id, 'billing_state', $addr['district'] ?? '');
                update_user_meta($user_id, 'billing_phone', $addr['phone'] ?? '');
                break;
            }
        }
    }

    private static function sanitize_address(array $data): array {
        return [
            'label'      => sanitize_text_field($data['label'] ?? ''),
            'name'       => sanitize_text_field($data['name'] ?? ''),
            'phone'      => sanitize_text_field($data['phone'] ?? ''),
            'city'       => sanitize_text_field($data['city'] ?? ''),
            'district'   => sanitize_text_field($data['district'] ?? ''),
            'address'    => sanitize_text_field($data['address'] ?? ''),
            'is_default' => (bool) ($data['is_default'] ?? false),
        ];
    }
}
