<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

class MrPolar_REST_Member {

    private static ?self $instance = null;

    private string $namespace = 'mrpolar/v1';
    private string $table_members;
    private string $table_tiers;
    private string $table_addresses;
    private string $table_pets;
    private string $table_points_log;

    public function __construct() {
        global $wpdb;
        $this->table_members    = $wpdb->prefix . 'mrpolar_members';
        $this->table_tiers      = $wpdb->prefix . 'mrpolar_member_tiers';
        $this->table_addresses  = $wpdb->prefix . 'mrpolar_addresses';
        $this->table_pets       = $wpdb->prefix . 'mrpolar_pets';
        $this->table_points_log = $wpdb->prefix . 'mrpolar_points_log';
    }

    public static function boot(): void {
        add_action('rest_api_init', [self::instance(), 'register_routes']);
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/member/me', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_me'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'update_me'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/member/me/addresses', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_addresses'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_address'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/member/me/addresses/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [$this, 'update_address'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_address'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/member/me/pets', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_pets'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_pet'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/member/me/pets/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [$this, 'update_pet'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_pet'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/member/me/points', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_points'],
                'permission_callback' => [$this, 'permission_callback'],
            ],
        ]);

        register_rest_route($this->namespace, '/tiers', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_tiers'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    public function permission_callback(): bool {
        return is_user_logged_in();
    }

    public function get_me(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        return new WP_REST_Response($member, 200);
    }

    public function update_me(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        $updates = [];

        if (null !== $request->get_param('display_name')) {
            $updates['display_name'] = sanitize_text_field((string) $request->get_param('display_name'));
        }

        if (null !== $request->get_param('phone')) {
            $updates['phone'] = sanitize_text_field((string) $request->get_param('phone'));
        }

        if (null !== $request->get_param('gender')) {
            $gender = sanitize_text_field((string) $request->get_param('gender'));
            if (!in_array($gender, ['male', 'female', 'other', 'prefer_not_to_say', ''], true)) {
                return new WP_Error('invalid_param', 'Invalid gender value', ['status' => 400]);
            }
            $updates['gender'] = '' === $gender ? null : $gender;
        }

        if (null !== $request->get_param('birthday')) {
            $birthday = $this->sanitize_date((string) $request->get_param('birthday'));
            if (is_wp_error($birthday)) {
                return $birthday;
            }
            $updates['birthday'] = $birthday;
        }

        if (null !== $request->get_param('avatar_url')) {
            $avatarUrl = $this->sanitize_url((string) $request->get_param('avatar_url'));
            if (is_wp_error($avatarUrl)) {
                return $avatarUrl;
            }
            $updates['avatar_url'] = $avatarUrl;
        }

        if (!empty($updates)) {
            $result = $this->perform_update($this->table_members, $updates, 'id = %d', [intval($member['id'])]);
            if (false === $result) {
                return $this->db_error();
            }
        }

        return new WP_REST_Response($this->get_member_by_id(intval($member['id'])), 200);
    }

    public function get_addresses(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_addresses} WHERE member_id = %d ORDER BY is_default DESC, id ASC",
                intval($member['id'])
            ),
            ARRAY_A
        );

        return new WP_REST_Response(is_array($rows) ? $rows : [], 200);
    }

    public function create_address(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $isDefault = $this->to_bool($request->get_param('is_default')) ? 1 : 0;

        if (1 === $isDefault) {
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE {$this->table_addresses} SET is_default = %d WHERE member_id = %d",
                    0,
                    intval($member['id'])
                )
            );
        }

        $data = [
            'member_id'       => intval($member['id']),
            'label'           => sanitize_text_field((string) $request->get_param('label')),
            'recipient_name'  => sanitize_text_field((string) $request->get_param('recipient_name')),
            'phone'           => sanitize_text_field((string) $request->get_param('phone')),
            'postal_code'     => sanitize_text_field((string) $request->get_param('postal_code')),
            'city'            => sanitize_text_field((string) $request->get_param('city')),
            'district'        => sanitize_text_field((string) $request->get_param('district')),
            'address'         => sanitize_text_field((string) $request->get_param('address')),
            'is_default'      => $isDefault,
            'store_type'      => sanitize_text_field((string) $request->get_param('store_type')),
            'store_id'        => sanitize_text_field((string) $request->get_param('store_id')),
            'store_name'      => sanitize_text_field((string) $request->get_param('store_name')),
        ];

        $result = $this->perform_insert($this->table_addresses, $data);
        if (false === $result) {
            return $this->db_error();
        }

        $addressId = intval($wpdb->insert_id);
        return new WP_REST_Response($this->get_address_row($addressId, intval($member['id'])), 201);
    }

    public function update_address(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        $addressId = intval($request->get_param('id'));
        $address   = $this->get_address_row($addressId, intval($member['id']));

        if (empty($address)) {
            return new WP_Error('not_found', 'Address not found', ['status' => 404]);
        }

        $updates = [];
        foreach (['label', 'recipient_name', 'phone', 'postal_code', 'city', 'district', 'address', 'store_type', 'store_id', 'store_name'] as $field) {
            if (null !== $request->get_param($field)) {
                $updates[$field] = sanitize_text_field((string) $request->get_param($field));
            }
        }

        if (null !== $request->get_param('is_default')) {
            $updates['is_default'] = $this->to_bool($request->get_param('is_default')) ? 1 : 0;
        }

        global $wpdb;

        if (isset($updates['is_default']) && 1 === intval($updates['is_default'])) {
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE {$this->table_addresses} SET is_default = %d WHERE member_id = %d",
                    0,
                    intval($member['id'])
                )
            );
        }

        if (!empty($updates)) {
            $result = $this->perform_update(
                $this->table_addresses,
                $updates,
                'id = %d AND member_id = %d',
                [$addressId, intval($member['id'])]
            );

            if (false === $result) {
                return $this->db_error();
            }
        }

        return new WP_REST_Response($this->get_address_row($addressId, intval($member['id'])), 200);
    }

    public function delete_address(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $addressId = intval($request->get_param('id'));
        $exists    = $this->get_address_row($addressId, intval($member['id']));

        if (empty($exists)) {
            return new WP_Error('not_found', 'Address not found', ['status' => 404]);
        }

        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$this->table_addresses} WHERE id = %d AND member_id = %d",
                $addressId,
                intval($member['id'])
            )
        );

        if (false === $deleted) {
            return $this->db_error();
        }

        return new WP_REST_Response(['success' => true], 200);
    }

    public function get_pets(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_pets} WHERE member_id = %d ORDER BY id ASC",
                intval($member['id'])
            ),
            ARRAY_A
        );

        return new WP_REST_Response(is_array($rows) ? $rows : [], 200);
    }

    public function create_pet(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $birthday = $this->sanitize_date((string) $request->get_param('birthday'));
        if (is_wp_error($birthday)) {
            return $birthday;
        }

        $avatarUrl = $this->sanitize_url((string) $request->get_param('avatar_url'));
        if (is_wp_error($avatarUrl)) {
            return $avatarUrl;
        }

        $data = [
            'member_id'   => intval($member['id']),
            'pet_uid'     => sanitize_text_field((string) $request->get_param('pet_uid')),
            'name'        => sanitize_text_field((string) $request->get_param('name')),
            'type'        => sanitize_text_field((string) $request->get_param('type')),
            'breed'       => sanitize_text_field((string) $request->get_param('breed')),
            'gender'      => sanitize_text_field((string) $request->get_param('gender')),
            'birthday'    => $birthday,
            'age'         => null !== $request->get_param('age') && '' !== (string) $request->get_param('age') ? intval($request->get_param('age')) : null,
            'weight'      => null !== $request->get_param('weight') && '' !== (string) $request->get_param('weight') ? (float) $request->get_param('weight') : null,
            'avatar_url'  => $avatarUrl,
            'note'        => sanitize_textarea_field((string) $request->get_param('note')),
        ];

        $result = $this->perform_insert($this->table_pets, $data);
        if (false === $result) {
            return $this->db_error();
        }

        $petId = intval($wpdb->insert_id);
        return new WP_REST_Response($this->get_pet_row($petId, intval($member['id'])), 201);
    }

    public function update_pet(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        $petId = intval($request->get_param('id'));
        $pet   = $this->get_pet_row($petId, intval($member['id']));

        if (empty($pet)) {
            return new WP_Error('not_found', 'Pet not found', ['status' => 404]);
        }

        $updates = [];
        foreach (['pet_uid', 'name', 'type', 'breed', 'gender', 'note'] as $field) {
            if (null !== $request->get_param($field)) {
                $updates[$field] = 'note' === $field
                    ? sanitize_textarea_field((string) $request->get_param($field))
                    : sanitize_text_field((string) $request->get_param($field));
            }
        }

        if (null !== $request->get_param('birthday')) {
            $birthday = $this->sanitize_date((string) $request->get_param('birthday'));
            if (is_wp_error($birthday)) {
                return $birthday;
            }
            $updates['birthday'] = $birthday;
        }

        if (null !== $request->get_param('age')) {
            $updates['age'] = '' === (string) $request->get_param('age') ? null : intval($request->get_param('age'));
        }

        if (null !== $request->get_param('weight')) {
            $updates['weight'] = '' === (string) $request->get_param('weight') ? null : (float) $request->get_param('weight');
        }

        if (null !== $request->get_param('avatar_url')) {
            $avatarUrl = $this->sanitize_url((string) $request->get_param('avatar_url'));
            if (is_wp_error($avatarUrl)) {
                return $avatarUrl;
            }
            $updates['avatar_url'] = $avatarUrl;
        }

        if (!empty($updates)) {
            $result = $this->perform_update(
                $this->table_pets,
                $updates,
                'id = %d AND member_id = %d',
                [$petId, intval($member['id'])]
            );

            if (false === $result) {
                return $this->db_error();
            }
        }

        return new WP_REST_Response($this->get_pet_row($petId, intval($member['id'])), 200);
    }

    public function delete_pet(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $petId  = intval($request->get_param('id'));
        $exists = $this->get_pet_row($petId, intval($member['id']));

        if (empty($exists)) {
            return new WP_Error('not_found', 'Pet not found', ['status' => 404]);
        }

        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$this->table_pets} WHERE id = %d AND member_id = %d",
                $petId,
                intval($member['id'])
            )
        );

        if (false === $deleted) {
            return $this->db_error();
        }

        return new WP_REST_Response(['success' => true], 200);
    }

    public function get_points(WP_REST_Request $request) {
        $member = $this->get_current_member();
        if (is_wp_error($member)) {
            return $member;
        }

        global $wpdb;

        $logs = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT *
                 FROM {$this->table_points_log}
                 WHERE member_id = %d
                 ORDER BY operated_at DESC, id DESC
                 LIMIT %d",
                intval($member['id']),
                20
            ),
            ARRAY_A
        );

        return new WP_REST_Response([
            'balance'  => intval($member['points_balance'] ?? 0),
            'lifetime' => intval($member['points_lifetime'] ?? 0),
            'logs'     => is_array($logs) ? $logs : [],
        ], 200);
    }

    public function get_tiers(WP_REST_Request $request) {
        global $wpdb;

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT
                    id,
                    tier_key,
                    tier_name,
                    tier_color,
                    sort_order,
                    cashback_rate,
                    upgrade_min_spending,
                    welcome_points,
                    birthday_bonus_rate,
                    free_shipping_threshold,
                    description
                 FROM {$this->table_tiers}
                 WHERE is_active = %d
                 ORDER BY sort_order ASC, id ASC",
                1
            ),
            ARRAY_A
        );

        return new WP_REST_Response(is_array($rows) ? $rows : [], 200);
    }

    public function ensure_member_exists(int $wpUserId): array {
        global $wpdb;

        $member = $this->get_member_by_wp_user_id($wpUserId);
        if (!empty($member)) {
            return $member;
        }

        $user = get_user_by('id', $wpUserId);
        if (!$user instanceof WP_User) {
            return [];
        }

        $basicTierId = intval($wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$this->table_tiers} WHERE tier_key = %s LIMIT 1",
                'basic'
            )
        ));

        if ($basicTierId > 0) {
            $inserted = $wpdb->query(
                $wpdb->prepare(
                    "INSERT INTO {$this->table_members}
                        (wp_user_id, email, display_name, registered_at, updated_at, status, tier_id)
                     VALUES (%d, %s, %s, NOW(), NOW(), %s, %d)",
                    $wpUserId,
                    (string) $user->user_email,
                    (string) $user->display_name,
                    'active',
                    $basicTierId
                )
            );
        } else {
            $inserted = $wpdb->query(
                $wpdb->prepare(
                    "INSERT INTO {$this->table_members}
                        (wp_user_id, email, display_name, registered_at, updated_at, status)
                     VALUES (%d, %s, %s, NOW(), NOW(), %s)",
                    $wpUserId,
                    (string) $user->user_email,
                    (string) $user->display_name,
                    'active'
                )
            );
        }

        if (false === $inserted) {
            return [];
        }

        return $this->get_member_by_id(intval($wpdb->insert_id));
    }

    public function get_current_member() {
        $userId = get_current_user_id();

        if ($userId <= 0) {
            return new WP_Error('not_logged_in', 'Not authenticated', ['status' => 401]);
        }

        $member = $this->ensure_member_exists($userId);

        if (empty($member)) {
            return $this->db_error();
        }

        return $member;
    }

    private function get_member_by_id(int $memberId): array {
        global $wpdb;

        if ($memberId <= 0) {
            return [];
        }

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    m.*,
                    t.tier_key,
                    t.tier_name,
                    t.tier_color,
                    t.sort_order,
                    t.cashback_rate,
                    t.upgrade_min_spending,
                    t.welcome_points,
                    t.birthday_bonus_rate,
                    t.free_shipping_threshold,
                    t.description
                 FROM {$this->table_members} m
                 LEFT JOIN {$this->table_tiers} t ON t.id = m.tier_id
                 WHERE m.id = %d
                 LIMIT 1",
                $memberId
            ),
            ARRAY_A
        );

        return is_array($row) ? $row : [];
    }

    private function get_member_by_wp_user_id(int $wpUserId): array {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id FROM {$this->table_members} WHERE wp_user_id = %d LIMIT 1",
                $wpUserId
            ),
            ARRAY_A
        );

        if (!is_array($row) || empty($row['id'])) {
            return [];
        }

        return $this->get_member_by_id(intval($row['id']));
    }

    private function get_address_row(int $addressId, int $memberId): array {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_addresses} WHERE id = %d AND member_id = %d LIMIT 1",
                $addressId,
                $memberId
            ),
            ARRAY_A
        );

        return is_array($row) ? $row : [];
    }

    private function get_pet_row(int $petId, int $memberId): array {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_pets} WHERE id = %d AND member_id = %d LIMIT 1",
                $petId,
                $memberId
            ),
            ARRAY_A
        );

        return is_array($row) ? $row : [];
    }

    private function perform_insert(string $table, array $data) {
        global $wpdb;

        $columns      = [];
        $placeholders = [];
        $params       = [];

        foreach ($data as $column => $value) {
            $columns[] = $column;

            if (null === $value) {
                $placeholders[] = 'NULL';
                continue;
            }

            $placeholders[] = $this->get_placeholder($value);
            $params[]       = $value;
        }

        $sql = "INSERT INTO {$table} (`" . implode('`,`', $columns) . "`) VALUES (" . implode(',', $placeholders) . ')';
        $sql = !empty($params) ? $wpdb->prepare($sql, $params) : $sql;

        return $wpdb->query($sql);
    }

    private function perform_update(string $table, array $data, string $whereSql, array $whereParams) {
        global $wpdb;

        if (empty($data)) {
            return 0;
        }

        $setParts = [];
        $params   = [];

        foreach ($data as $column => $value) {
            if (null === $value) {
                $setParts[] = "`{$column}` = NULL";
                continue;
            }

            $setParts[] = "`{$column}` = " . $this->get_placeholder($value);
            $params[]   = $value;
        }

        $params = array_merge($params, $whereParams);
        $sql    = "UPDATE {$table} SET " . implode(', ', $setParts) . " WHERE {$whereSql}";
        $sql    = $wpdb->prepare($sql, $params);

        return $wpdb->query($sql);
    }

    private function get_placeholder($value): string {
        if (is_int($value) || is_bool($value)) {
            return '%d';
        }

        if (is_float($value)) {
            return '%f';
        }

        return '%s';
    }

    private function to_bool($value): bool {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function sanitize_date(string $value) {
        $value = sanitize_text_field($value);
        if ('' === $value) {
            return null;
        }

        $date = DateTime::createFromFormat('Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            return new WP_Error('invalid_param', 'Invalid date format', ['status' => 400]);
        }

        return $value;
    }

    private function sanitize_url(string $value) {
        $value = trim($value);
        if ('' === $value) {
            return null;
        }

        $url = esc_url_raw($value);
        if ('' === $url) {
            return new WP_Error('invalid_param', 'Invalid URL', ['status' => 400]);
        }

        return $url;
    }

    private function db_error(): WP_Error {
        return new WP_Error('db_error', 'Database error', ['status' => 500]);
    }

    private static function instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }
}
