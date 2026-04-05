<?php
defined('ABSPATH') || exit;

class MrPolar_Member {

    public static function register_routes() {
        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/profile', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_profile'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [self::class, 'update_profile'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/addresses', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_addresses'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [self::class, 'create_address'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/addresses/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'update_address'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [self::class, 'delete_address'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/pets', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_pets'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [self::class, 'create_pet'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/pets/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'update_pet'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [self::class, 'delete_pet'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/member/points', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_points'],
                'permission_callback' => [self::class, 'is_logged_in'],
            ],
        ]);
    }

    public static function is_logged_in() {
        return is_user_logged_in();
    }

    public static function get_profile(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        return self::rest_response(
            self::format_profile_payload($member),
            'Member profile loaded.'
        );
    }

    public static function update_profile(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $payload = [
            'display_name' => $request->get_param('display_name'),
            'first_name'   => $request->get_param('first_name'),
            'last_name'    => $request->get_param('last_name'),
            'phone'        => $request->get_param('phone'),
            'gender'       => $request->get_param('gender'),
            'birthday'     => $request->get_param('birthday'),
            'avatar_url'   => $request->get_param('avatar_url'),
        ];

        $updated = self::update_member_self_profile((int) $member['wp_user_id'], $payload);
        if (is_wp_error($updated)) {
            return self::rest_error($updated);
        }

        return self::rest_response(
            self::format_profile_payload($updated),
            'Member profile updated.'
        );
    }

    public static function get_addresses(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        return self::rest_response(
            ['addresses' => self::get_addresses_by_member_id((int) $member['id'])],
            'Addresses loaded.'
        );
    }

    public static function create_address(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $address = self::add_address_for_member((int) $member['id'], $request->get_params());
        if (is_wp_error($address)) {
            return self::rest_error($address);
        }

        return self::rest_response(
            ['address' => $address],
            'Address created.',
            201
        );
    }

    public static function update_address(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $address = self::update_address_for_member(
            (int) $member['id'],
            (int) $request->get_param('id'),
            $request->get_params()
        );

        if (is_wp_error($address)) {
            return self::rest_error($address);
        }

        return self::rest_response(
            ['address' => $address],
            'Address updated.'
        );
    }

    public static function delete_address(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $deleted = self::delete_address_for_member((int) $member['id'], (int) $request->get_param('id'));
        if (is_wp_error($deleted)) {
            return self::rest_error($deleted);
        }

        return self::rest_response(
            ['deleted' => true],
            'Address deleted.'
        );
    }

    public static function get_pets(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        return self::rest_response(
            ['pets' => self::get_pets_by_member_id((int) $member['id'])],
            'Pets loaded.'
        );
    }

    public static function create_pet(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $pet = self::add_pet_for_member((int) $member['id'], $request->get_params());
        if (is_wp_error($pet)) {
            return self::rest_error($pet);
        }

        return self::rest_response(
            ['pet' => $pet],
            'Pet created.',
            201
        );
    }

    public static function update_pet(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $pet = self::update_pet_for_member(
            (int) $member['id'],
            (int) $request->get_param('id'),
            $request->get_params()
        );

        if (is_wp_error($pet)) {
            return self::rest_error($pet);
        }

        return self::rest_response(
            ['pet' => $pet],
            'Pet updated.'
        );
    }

    public static function delete_pet(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        $deleted = self::delete_pet_for_member((int) $member['id'], (int) $request->get_param('id'));
        if (is_wp_error($deleted)) {
            return self::rest_error($deleted);
        }

        return self::rest_response(
            ['deleted' => true],
            'Pet deleted.'
        );
    }

    public static function get_points(WP_REST_Request $request) {
        $member = self::get_current_member_record();
        if (is_wp_error($member)) {
            return self::rest_error($member);
        }

        return self::rest_response(
            self::get_points_summary((int) $member['id'], 20),
            'Points loaded.'
        );
    }

    public static function get_current_member_record($create_if_missing = true) {
        return self::get_member_by_user_id(get_current_user_id(), $create_if_missing);
    }

    public static function get_member_by_user_id($user_id, $create_if_missing = false, array $seed = []) {
        global $wpdb;

        $user_id = (int) $user_id;
        if ($user_id <= 0) {
            return new WP_Error('mrpolar_invalid_user', 'Invalid user.', ['status' => 401]);
        }

        $member = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT m.*, t.tier_key, t.tier_name, t.tier_color, t.cashback_rate, t.welcome_points,
                        t.birthday_bonus_rate, t.free_shipping_threshold, t.description AS tier_description,
                        t.benefits_json, t.is_active AS tier_is_active
                 FROM {$wpdb->prefix}mrpolar_members m
                 LEFT JOIN {$wpdb->prefix}mrpolar_member_tiers t ON t.id = m.tier_id
                 WHERE m.wp_user_id = %d
                 LIMIT 1",
                $user_id
            ),
            ARRAY_A
        );

        if (!empty($member)) {
            self::maybe_backfill_legacy_rows($member);
            return self::get_member_by_id((int) $member['id']);
        }

        if (!$create_if_missing) {
            return null;
        }

        return self::ensure_member_for_user($user_id, $seed);
    }

    public static function get_member_by_id(int $id): array {
        global $wpdb;

        if ($id <= 0) {
            return [];
        }

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    m.*,
                    t.tier_name,
                    t.tier_color,
                    t.tier_key,
                    t.cashback_rate,
                    t.upgrade_min_spending AS next_tier_min_spending,
                    t.sort_order AS tier_sort_order,
                    t.welcome_points,
                    t.birthday_bonus_rate,
                    t.free_shipping_threshold,
                    t.description AS tier_description,
                    t.benefits_json,
                    t.is_active AS tier_is_active,
                    u.user_login
                 FROM {$wpdb->prefix}mrpolar_members m
                 LEFT JOIN {$wpdb->prefix}mrpolar_member_tiers t ON t.id = m.tier_id
                 LEFT JOIN {$wpdb->users} u ON u.ID = m.wp_user_id
                 WHERE m.id = %d
                 LIMIT 1",
                $id
            ),
            ARRAY_A
        );

        return is_array($row) ? $row : [];
    }

    public static function get_addresses_by_member_id(int $memberId): array {
        return self::get_addresses_by_member_id_legacy($memberId);
    }

    public static function get_pets_by_member_id(int $memberId): array {
        return self::get_pets_by_member_id_legacy($memberId);
    }

    public static function get_points_summary(int $memberId, int $limit = 50): array {
        $summary = self::get_points_summary_legacy($memberId, $limit);

        if (is_wp_error($summary)) {
            return [
                'member_id'       => $memberId,
                'points_balance'  => 0,
                'points_lifetime' => 0,
                'logs'            => [],
            ];
        }

        return is_array($summary) ? $summary : ['logs' => []];
    }

    public static function update_member_admin_profile(int $id, array $data) {
        global $wpdb;

        if ($id <= 0) {
            return new WP_Error('mrpolar_invalid_member_id', 'Invalid member ID.', ['status' => 400]);
        }

        // fix: allow manual tier changes to persist upgrade timestamp
        $allowed = ['status', 'note', 'tier_id', 'points_balance', 'tier_upgraded_at'];
        $set     = [];
        $params  = [];

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            switch ($field) {
                case 'status':
                    $status = self::normalize_member_status($data[$field]);
                    if (is_wp_error($status)) {
                        return $status;
                    }
                    $set[]    = 'status = %s';
                    $params[] = $status;
                    break;

                case 'note':
                    $set[]    = 'note = %s';
                    $params[] = sanitize_textarea_field(wp_unslash((string) $data[$field]));
                    break;

                case 'tier_id':
                    $set[]    = 'tier_id = %d';
                    $params[] = max(0, (int) $data[$field]);
                    break;

                case 'points_balance':
                    $set[]    = 'points_balance = %d';
                    $params[] = max(0, (int) $data[$field]);
                    break;

                case 'tier_upgraded_at':
                    $set[]    = 'tier_upgraded_at = %s';
                    $params[] = sanitize_text_field((string) $data[$field]);
                    break;
            }
        }

        if (empty($set)) {
            return true;
        }

        $member = self::get_member_by_id($id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $params[] = $id;

        $updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->prefix}mrpolar_members
                 SET " . implode(', ', $set) . ", updated_at = NOW()
                 WHERE id = %d",
                $params
            )
        );

        if (false === $updated) {
            return new WP_Error('mrpolar_member_update_failed', 'Unable to update member.', ['status' => 500]);
        }

        self::sync_legacy_user_meta(self::get_member_by_id($id));

        return true;
    }

    public static function get_next_tier(int $currentTierSortOrder): array {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT *
                 FROM {$wpdb->prefix}mrpolar_member_tiers
                 WHERE sort_order > %d
                   AND is_active = %d
                   AND is_manual_only = %d
                 ORDER BY sort_order ASC
                 LIMIT 1",
                $currentTierSortOrder,
                1,
                0
            ),
            ARRAY_A
        );

        return is_array($row) ? $row : [];
    }

    public static function get_member_by_id_legacy($member_id) {
        global $wpdb;

        $member_id = (int) $member_id;
        if ($member_id <= 0) {
            return null;
        }

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT m.*, t.tier_key, t.tier_name, t.tier_color, t.cashback_rate, t.welcome_points,
                        t.birthday_bonus_rate, t.free_shipping_threshold, t.description AS tier_description,
                        t.benefits_json, t.is_active AS tier_is_active
                 FROM {$wpdb->prefix}mrpolar_members m
                 LEFT JOIN {$wpdb->prefix}mrpolar_member_tiers t ON t.id = m.tier_id
                 WHERE m.id = %d
                 LIMIT 1",
                $member_id
            ),
            ARRAY_A
        );
    }

    public static function ensure_member_for_user($user_id, array $seed = []) {
        global $wpdb;

        $user = get_userdata((int) $user_id);
        if (!$user) {
            return new WP_Error('mrpolar_user_not_found', 'User not found.', ['status' => 404]);
        }

        $legacy_seed = self::build_seed_from_user((int) $user_id);
        $seed        = array_merge($legacy_seed, $seed);

        $insert = [
            'wp_user_id'        => (int) $user_id,
            'display_name'      => self::value_or_null($seed['display_name'] ?? $user->display_name),
            'first_name'        => self::value_or_null($seed['first_name'] ?? get_user_meta($user_id, 'first_name', true)),
            'last_name'         => self::value_or_null($seed['last_name'] ?? get_user_meta($user_id, 'last_name', true)),
            'email'             => sanitize_email($seed['email'] ?? $user->user_email),
            'phone'             => self::value_or_null($seed['phone'] ?? ''),
            'gender'            => self::normalize_member_gender($seed['gender'] ?? null, true),
            'birthday'          => self::normalize_date_or_null($seed['birthday'] ?? null, true),
            'avatar_url'        => self::normalize_url_or_null($seed['avatar_url'] ?? null, true),
            'tier_id'           => !empty($seed['tier_id']) ? (int) $seed['tier_id'] : self::get_default_tier_id(),
            'points_balance'    => max(0, (int) ($seed['points_balance'] ?? 0)),
            'points_lifetime'   => max(0, (int) ($seed['points_lifetime'] ?? ($seed['points_balance'] ?? 0))),
            'yearly_spending'   => self::normalize_money_or_zero($seed['yearly_spending'] ?? 0),
            'total_spending'    => self::normalize_money_or_zero($seed['total_spending'] ?? 0),
            'status'            => self::normalize_member_status($seed['status'] ?? 'active', true),
            'note'              => self::value_or_null($seed['note'] ?? null),
            'registered_at'     => !empty($seed['registered_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $seed['registered_at'])) : gmdate('Y-m-d H:i:s', strtotime((string) $user->user_registered)),
        ];

        foreach ($insert as $value) {
            if (is_wp_error($value)) {
                return $value;
            }
        }

        $inserted = $wpdb->insert(
            $wpdb->prefix . 'mrpolar_members',
            $insert,
            [
                '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s',
                '%d', '%d', '%d', '%f', '%f', '%s', '%s', '%s',
            ]
        );

        if (false === $inserted) {
            return new WP_Error('mrpolar_member_create_failed', 'Unable to create member profile.', ['status' => 500]);
        }

        $member_id = (int) $wpdb->insert_id;

        if (!empty($seed['addresses']) && is_array($seed['addresses'])) {
            foreach ($seed['addresses'] as $address) {
                self::add_address_for_member($member_id, $address, false);
            }
        }

        if (!empty($seed['pets']) && is_array($seed['pets'])) {
            self::replace_pets_for_member($member_id, $seed['pets'], false);
        }

        $member = self::get_member_by_id($member_id);
        self::sync_legacy_user_meta($member);

        return $member;
    }

    public static function get_legacy_customer_by_user_id($user_id, $create_if_missing = true) {
        $member = self::get_member_by_user_id((int) $user_id, $create_if_missing);
        if (is_wp_error($member) || empty($member)) {
            return $member;
        }

        return self::format_legacy_customer($member);
    }

    public static function format_profile_payload(array $member) {
        return [
            'member_id'       => (int) $member['id'],
            'wp_user_id'      => (int) $member['wp_user_id'],
            'display_name'    => (string) ($member['display_name'] ?? ''),
            'first_name'      => (string) ($member['first_name'] ?? ''),
            'last_name'       => (string) ($member['last_name'] ?? ''),
            'email'           => (string) ($member['email'] ?? ''),
            'phone'           => (string) ($member['phone'] ?? ''),
            'gender'          => (string) ($member['gender'] ?? ''),
            'birthday'        => (string) ($member['birthday'] ?? ''),
            'avatar_url'      => self::member_avatar_url($member),
            'tier'            => self::format_tier_payload($member),
            'points_balance'  => (int) $member['points_balance'],
            'points_lifetime' => (int) $member['points_lifetime'],
            'yearly_spending' => (float) $member['yearly_spending'],
            'total_spending'  => (float) $member['total_spending'],
            'yearly_reset_at' => (string) ($member['yearly_reset_at'] ?? ''),
            'line_user_id'    => (string) ($member['line_user_id'] ?? ''),
            'status'          => (string) ($member['status'] ?? ''),
            'note'            => (string) ($member['note'] ?? ''),
            'registered_at'   => (string) ($member['registered_at'] ?? ''),
            'updated_at'      => (string) ($member['updated_at'] ?? ''),
        ];
    }

    public static function format_legacy_customer(array $member) {
        $user      = get_userdata((int) $member['wp_user_id']);
        $addresses = self::get_addresses_by_member_id((int) $member['id']);
        $pets      = self::get_pets_by_member_id((int) $member['id']);
        $name      = trim((string) ($member['display_name'] ?? ''));

        if ('' === $name) {
            $name = trim((string) ($member['first_name'] ?? '') . ' ' . (string) ($member['last_name'] ?? ''));
        }

        return [
            'id'              => (int) $member['wp_user_id'],
            'member_id'       => (int) $member['id'],
            'email'           => (string) ($member['email'] ?? ''),
            'username'        => $user ? (string) $user->user_login : '',
            'first_name'      => (string) ($member['first_name'] ?? ''),
            'last_name'       => (string) ($member['last_name'] ?? ''),
            'display_name'    => (string) ($member['display_name'] ?? ''),
            'name'            => $name,
            'phone'           => (string) ($member['phone'] ?? ''),
            'gender'          => (string) ($member['gender'] ?? ''),
            'birthday'        => (string) ($member['birthday'] ?? ''),
            'avatar'          => self::member_avatar_url($member),
            'avatar_url'      => self::member_avatar_url($member),
            'member_since'    => (string) ($member['registered_at'] ?? ''),
            'points'          => (int) $member['points_balance'],
            'points_balance'  => (int) $member['points_balance'],
            'points_lifetime' => (int) $member['points_lifetime'],
            'status'          => (string) ($member['status'] ?? ''),
            'tier'            => self::format_tier_payload($member),
            'pets'            => $pets,
            'addresses'       => $addresses,
        ];
    }

    public static function update_member_self_profile($user_id, array $data) {
        $member = self::get_member_by_user_id((int) $user_id, true);
        if (is_wp_error($member)) {
            return $member;
        }

        $update = [];

        if (array_key_exists('display_name', $data) && null !== $data['display_name']) {
            $update['display_name'] = sanitize_text_field(wp_unslash((string) $data['display_name']));
        }
        if (array_key_exists('first_name', $data) && null !== $data['first_name']) {
            $update['first_name'] = sanitize_text_field(wp_unslash((string) $data['first_name']));
        }
        if (array_key_exists('last_name', $data) && null !== $data['last_name']) {
            $update['last_name'] = sanitize_text_field(wp_unslash((string) $data['last_name']));
        }
        if (array_key_exists('phone', $data) && null !== $data['phone']) {
            $update['phone'] = sanitize_text_field(wp_unslash((string) $data['phone']));
        }
        if (array_key_exists('gender', $data) && null !== $data['gender']) {
            $update['gender'] = self::normalize_member_gender($data['gender']);
        }
        if (array_key_exists('birthday', $data) && null !== $data['birthday']) {
            $update['birthday'] = self::normalize_date_or_null($data['birthday']);
        }
        if (array_key_exists('avatar_url', $data) && null !== $data['avatar_url']) {
            $update['avatar_url'] = self::normalize_url_or_null($data['avatar_url']);
        }

        if (empty($update)) {
            return $member;
        }

        if ((isset($update['first_name']) || isset($update['last_name'])) && !isset($update['display_name'])) {
            $first = isset($update['first_name']) ? $update['first_name'] : (string) $member['first_name'];
            $last  = isset($update['last_name']) ? $update['last_name'] : (string) $member['last_name'];
            $name  = trim($first . ' ' . $last);
            if ('' !== $name) {
                $update['display_name'] = $name;
            }
        }

        return self::update_member_record((int) $member['id'], $update, true);
    }

    public static function update_member_admin_profile_legacy($member_id, array $data) {
        $update = [];

        if (array_key_exists('display_name', $data)) {
            $update['display_name'] = sanitize_text_field(wp_unslash((string) $data['display_name']));
        }
        if (array_key_exists('email', $data)) {
            $email = sanitize_email(wp_unslash((string) $data['email']));
            if (empty($email) || !is_email($email)) {
                return new WP_Error('mrpolar_invalid_email', 'A valid email is required.', ['status' => 400]);
            }
            $update['email'] = $email;
        }
        if (array_key_exists('phone', $data)) {
            $update['phone'] = sanitize_text_field(wp_unslash((string) $data['phone']));
        }
        if (array_key_exists('gender', $data)) {
            $update['gender'] = self::normalize_member_gender($data['gender']);
        }
        if (array_key_exists('birthday', $data)) {
            $update['birthday'] = self::normalize_date_or_null($data['birthday']);
        }
        if (array_key_exists('status', $data)) {
            $update['status'] = self::normalize_member_status($data['status']);
        }
        if (array_key_exists('note', $data)) {
            $update['note'] = sanitize_textarea_field(wp_unslash((string) $data['note']));
        }

        if (empty($update)) {
            return self::get_member_by_id((int) $member_id);
        }

        return self::update_member_record((int) $member_id, $update, true);
    }

    public static function update_member_record($member_id, array $update, $sync_wp_user = true) {
        global $wpdb;

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        foreach ($update as $value) {
            if (is_wp_error($value)) {
                return $value;
            }
        }

        if (isset($update['email'])) {
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}mrpolar_members WHERE email = %s AND id != %d LIMIT 1",
                    $update['email'],
                    (int) $member['id']
                )
            );
            if (!empty($existing)) {
                return new WP_Error('mrpolar_email_exists', 'This email is already used by another member.', ['status' => 409]);
            }
        }

        $formats = [];
        foreach ($update as $value) {
            $formats[] = self::infer_format($value);
        }

        $updated = $wpdb->update(
            $wpdb->prefix . 'mrpolar_members',
            $update,
            ['id' => (int) $member['id']],
            $formats,
            ['%d']
        );

        if (false === $updated) {
            return new WP_Error('mrpolar_member_update_failed', 'Unable to update member.', ['status' => 500]);
        }

        if ($sync_wp_user) {
            self::sync_wordpress_user((int) $member['wp_user_id'], array_merge($member, $update));
        }

        $fresh = self::get_member_by_id((int) $member['id']);
        self::sync_legacy_user_meta($fresh);

        return $fresh;
    }

    public static function get_addresses_by_member_id_legacy($member_id) {
        global $wpdb;

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT *
                 FROM {$wpdb->prefix}mrpolar_addresses
                 WHERE member_id = %d
                 ORDER BY is_default DESC, id ASC",
                (int) $member_id
            ),
            ARRAY_A
        );

        return array_map([self::class, 'format_address'], $rows ?: []);
    }

    public static function add_address_for_member($member_id, array $data, $sync_meta = true) {
        global $wpdb;

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $address = self::sanitize_address_input($data);
        if (is_wp_error($address)) {
            return $address;
        }

        $existing = self::get_addresses_by_member_id((int) $member_id);
        if (empty($existing)) {
            $address['is_default'] = 1;
        }

        if (!empty($address['is_default'])) {
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE {$wpdb->prefix}mrpolar_addresses SET is_default = 0 WHERE member_id = %d",
                    (int) $member_id
                )
            );
        }

        $inserted = $wpdb->insert(
            $wpdb->prefix . 'mrpolar_addresses',
            array_merge(['member_id' => (int) $member_id], $address),
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s']
        );

        if (false === $inserted) {
            return new WP_Error('mrpolar_address_create_failed', 'Unable to create address.', ['status' => 500]);
        }

        if ($sync_meta) {
            self::sync_legacy_user_meta($member);
        }

        return self::get_address_row((int) $wpdb->insert_id, (int) $member_id);
    }

    public static function update_address_for_member($member_id, $address_id, array $data, $sync_meta = true) {
        global $wpdb;

        $row = self::get_address_row((int) $address_id, (int) $member_id, false);
        if (empty($row)) {
            return new WP_Error('mrpolar_address_not_found', 'Address not found.', ['status' => 404]);
        }

        $update = self::sanitize_address_input($data, true, $row);
        if (is_wp_error($update)) {
            return $update;
        }

        if (empty($update)) {
            return self::format_address($row);
        }

        if (!empty($update['is_default'])) {
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE {$wpdb->prefix}mrpolar_addresses SET is_default = 0 WHERE member_id = %d",
                    (int) $member_id
                )
            );
        }

        $updated = $wpdb->update(
            $wpdb->prefix . 'mrpolar_addresses',
            $update,
            ['id' => (int) $address_id, 'member_id' => (int) $member_id],
            array_map([self::class, 'infer_format'], array_values($update)),
            ['%d', '%d']
        );

        if (false === $updated) {
            return new WP_Error('mrpolar_address_update_failed', 'Unable to update address.', ['status' => 500]);
        }

        self::ensure_default_address((int) $member_id);

        if ($sync_meta) {
            self::sync_legacy_user_meta(self::get_member_by_id((int) $member_id));
        }

        return self::get_address_row((int) $address_id, (int) $member_id);
    }

    public static function delete_address_for_member($member_id, $address_id, $sync_meta = true) {
        global $wpdb;

        $deleted = $wpdb->delete(
            $wpdb->prefix . 'mrpolar_addresses',
            ['id' => (int) $address_id, 'member_id' => (int) $member_id],
            ['%d', '%d']
        );

        if (0 === (int) $deleted) {
            return new WP_Error('mrpolar_address_not_found', 'Address not found.', ['status' => 404]);
        }

        self::ensure_default_address((int) $member_id);

        if ($sync_meta) {
            self::sync_legacy_user_meta(self::get_member_by_id((int) $member_id));
        }

        return true;
    }

    public static function get_pets_by_member_id_legacy($member_id) {
        global $wpdb;

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT *
                 FROM {$wpdb->prefix}mrpolar_pets
                 WHERE member_id = %d
                 ORDER BY id ASC",
                (int) $member_id
            ),
            ARRAY_A
        );

        return array_map([self::class, 'format_pet'], $rows ?: []);
    }

    public static function add_pet_for_member($member_id, array $data, $sync_meta = true) {
        global $wpdb;

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $pet = self::sanitize_pet_input($data);
        if (is_wp_error($pet)) {
            return $pet;
        }

        $inserted = $wpdb->insert(
            $wpdb->prefix . 'mrpolar_pets',
            array_merge(['member_id' => (int) $member_id], $pet),
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%f', '%s', '%s']
        );

        if (false === $inserted) {
            return new WP_Error('mrpolar_pet_create_failed', 'Unable to create pet.', ['status' => 500]);
        }

        if ($sync_meta) {
            self::sync_legacy_user_meta($member);
        }

        return self::get_pet_row((int) $wpdb->insert_id, (int) $member_id);
    }

    public static function update_pet_for_member($member_id, $pet_id, array $data, $sync_meta = true) {
        global $wpdb;

        $row = self::get_pet_row((int) $pet_id, (int) $member_id, false);
        if (empty($row)) {
            return new WP_Error('mrpolar_pet_not_found', 'Pet not found.', ['status' => 404]);
        }

        $update = self::sanitize_pet_input($data, true, $row);
        if (is_wp_error($update)) {
            return $update;
        }

        if (empty($update)) {
            return self::format_pet($row);
        }

        $updated = $wpdb->update(
            $wpdb->prefix . 'mrpolar_pets',
            $update,
            ['id' => (int) $pet_id, 'member_id' => (int) $member_id],
            array_map([self::class, 'infer_format'], array_values($update)),
            ['%d', '%d']
        );

        if (false === $updated) {
            return new WP_Error('mrpolar_pet_update_failed', 'Unable to update pet.', ['status' => 500]);
        }

        if ($sync_meta) {
            self::sync_legacy_user_meta(self::get_member_by_id((int) $member_id));
        }

        return self::get_pet_row((int) $pet_id, (int) $member_id);
    }

    public static function delete_pet_for_member($member_id, $pet_id, $sync_meta = true) {
        global $wpdb;

        $deleted = $wpdb->delete(
            $wpdb->prefix . 'mrpolar_pets',
            ['id' => (int) $pet_id, 'member_id' => (int) $member_id],
            ['%d', '%d']
        );

        if (0 === (int) $deleted) {
            return new WP_Error('mrpolar_pet_not_found', 'Pet not found.', ['status' => 404]);
        }

        if ($sync_meta) {
            self::sync_legacy_user_meta(self::get_member_by_id((int) $member_id));
        }

        return true;
    }

    public static function replace_pets_for_member($member_id, $pets, $sync_meta = true) {
        global $wpdb;

        if (!is_array($pets)) {
            return new WP_Error('mrpolar_invalid_pets', 'Pets payload must be an array.', ['status' => 400]);
        }

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $wpdb->delete(
            $wpdb->prefix . 'mrpolar_pets',
            ['member_id' => (int) $member_id],
            ['%d']
        );

        foreach ($pets as $pet) {
            $created = self::add_pet_for_member((int) $member_id, (array) $pet, false);
            if (is_wp_error($created)) {
                return $created;
            }
        }

        if ($sync_meta) {
            self::sync_legacy_user_meta($member);
        }

        return self::get_pets_by_member_id((int) $member_id);
    }

    public static function get_points_summary_legacy($member_id, $limit = 20) {
        global $wpdb;

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $logs = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, change_type, points_delta, points_after, order_id, reason, note, expires_at,
                        operated_by, operated_name, operated_at, ip_address
                 FROM {$wpdb->prefix}mrpolar_points_log
                 WHERE member_id = %d
                 ORDER BY operated_at DESC, id DESC
                 LIMIT %d",
                (int) $member_id,
                max(1, (int) $limit)
            ),
            ARRAY_A
        );

        return [
            'member_id'       => (int) $member['id'],
            'points_balance'  => (int) $member['points_balance'],
            'points_lifetime' => (int) $member['points_lifetime'],
            'logs'            => array_map([self::class, 'format_points_log'], $logs ?: []),
        ];
    }

    public static function adjust_points($member_id, $delta, $change_type, $reason, $note = '', $operator_user_id = 0, $operator_name = '') {
        global $wpdb;

        $member = self::get_member_by_id((int) $member_id);
        if (empty($member)) {
            return new WP_Error('mrpolar_member_not_found', 'Member not found.', ['status' => 404]);
        }

        $delta = (int) $delta;
        if (0 === $delta) {
            return new WP_Error('mrpolar_invalid_points', 'Points delta must not be zero.', ['status' => 400]);
        }

        $allowed_types = [
            'earn_order', 'earn_welcome', 'earn_birthday', 'earn_event', 'earn_manual',
            'redeem_order', 'deduct_manual', 'deduct_expire', 'deduct_cancel',
        ];
        if (!in_array($change_type, $allowed_types, true)) {
            return new WP_Error('mrpolar_invalid_change_type', 'Invalid points change type.', ['status' => 400]);
        }

        $reason = sanitize_text_field(wp_unslash((string) $reason));
        if ('' === $reason) {
            return new WP_Error('mrpolar_missing_reason', 'A reason is required.', ['status' => 400]);
        }

        $current_balance = (int) $member['points_balance'];
        $new_balance     = $current_balance + $delta;

        if ($new_balance < 0) {
            return new WP_Error('mrpolar_negative_balance', 'Points balance cannot be negative.', ['status' => 400]);
        }

        $new_lifetime = (int) $member['points_lifetime'];
        if ($delta > 0) {
            $new_lifetime += $delta;
        }

        $member_updated = $wpdb->update(
            $wpdb->prefix . 'mrpolar_members',
            [
                'points_balance'  => $new_balance,
                'points_lifetime' => $new_lifetime,
            ],
            ['id' => (int) $member['id']],
            ['%d', '%d'],
            ['%d']
        );

        if (false === $member_updated) {
            return new WP_Error('mrpolar_points_update_failed', 'Unable to update points.', ['status' => 500]);
        }

        $log_inserted = $wpdb->insert(
            $wpdb->prefix . 'mrpolar_points_log',
            [
                'member_id'     => (int) $member['id'],
                'change_type'   => $change_type,
                'points_delta'  => $delta,
                'points_after'  => $new_balance,
                'reason'        => $reason,
                'note'          => sanitize_textarea_field(wp_unslash((string) $note)),
                'operated_by'   => $operator_user_id > 0 ? (int) $operator_user_id : null,
                'operated_name' => self::value_or_null($operator_name),
                'ip_address'    => self::value_or_null(self::current_ip()),
            ],
            ['%d', '%s', '%d', '%d', '%s', '%s', '%d', '%s', '%s']
        );

        if (false === $log_inserted) {
            return new WP_Error('mrpolar_points_log_failed', 'Unable to write points log.', ['status' => 500]);
        }

        $fresh = self::get_member_by_id((int) $member['id']);
        self::sync_legacy_user_meta($fresh);

        return self::get_points_summary((int) $member['id'], 20);
    }

    public static function get_all_tiers() {
        global $wpdb;

        $rows = $wpdb->get_results(
            "SELECT *
             FROM {$wpdb->prefix}mrpolar_member_tiers
             ORDER BY sort_order ASC, id ASC",
            ARRAY_A
        );

        return $rows ?: [];
    }

    public static function get_admin_permissions($user_id = 0) {
        global $wpdb;

        $user_id = $user_id > 0 ? (int) $user_id : get_current_user_id();
        if ($user_id <= 0) {
            return [];
        }

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT *
                 FROM {$wpdb->prefix}mrpolar_admin_permissions
                 WHERE wp_user_id = %d AND is_active = 1
                 LIMIT 1",
                $user_id
            ),
            ARRAY_A
        );

        if (!empty($row)) {
            return $row;
        }

        if (user_can($user_id, 'manage_options')) {
            return [
                'role'                => 'admin',
                'perm_member_basic'   => 2,
                'perm_member_address' => 2,
                'perm_member_pets'    => 2,
                'perm_points_view'    => 2,
                'perm_points_edit'    => 2,
                'perm_tier_view'      => 2,
                'perm_tier_edit'      => 2,
                'perm_tier_config'    => 2,
                'perm_account_status' => 2,
                'perm_note'           => 2,
            ];
        }

        return [];
    }

    public static function has_admin_permission($permission_key, $required_level = 1, $user_id = 0) {
        $permissions = self::get_admin_permissions($user_id);

        if (empty($permissions) || !array_key_exists($permission_key, $permissions)) {
            return false;
        }

        return (int) $permissions[$permission_key] >= (int) $required_level;
    }

    public static function prepare_sql($query, array $params = []) {
        global $wpdb;

        if (empty($params)) {
            return $query;
        }

        return $wpdb->prepare($query, $params);
    }

    private static function maybe_backfill_legacy_rows(array $member) {
        global $wpdb;

        $member_id = (int) $member['id'];
        $user_id   = (int) $member['wp_user_id'];

        $has_addresses = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}mrpolar_addresses WHERE member_id = %d",
                $member_id
            )
        );
        $has_pets = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}mrpolar_pets WHERE member_id = %d",
                $member_id
            )
        );

        if (0 === $has_addresses) {
            foreach (self::extract_legacy_addresses($user_id) as $address) {
                self::add_address_for_member($member_id, $address, false);
            }
        }

        if (0 === $has_pets) {
            $pets = self::extract_legacy_pets($user_id);
            if (!empty($pets)) {
                self::replace_pets_for_member($member_id, $pets, false);
            }
        }

        self::sync_legacy_user_meta($member);
    }

    private static function build_seed_from_user($user_id) {
        $user = get_userdata((int) $user_id);
        if (!$user) {
            return [];
        }

        return [
            'display_name'    => $user->display_name,
            'first_name'      => get_user_meta($user_id, 'first_name', true),
            'last_name'       => get_user_meta($user_id, 'last_name', true),
            'email'           => $user->user_email,
            'phone'           => get_user_meta($user_id, 'billing_phone', true),
            'gender'          => get_user_meta($user_id, 'mrpolar_gender', true),
            'birthday'        => get_user_meta($user_id, 'mrpolar_birthday', true),
            'avatar_url'      => '',
            'points_balance'  => (int) get_user_meta($user_id, 'mrpolar_points', true),
            'points_lifetime' => (int) get_user_meta($user_id, 'mrpolar_points', true),
            'registered_at'   => $user->user_registered,
            'addresses'       => self::extract_legacy_addresses($user_id),
            'pets'            => self::extract_legacy_pets($user_id),
        ];
    }

    private static function extract_legacy_addresses($user_id) {
        $addresses = [];
        $raw       = get_user_meta((int) $user_id, 'mrpolar_addresses', true);

        if (!empty($raw)) {
            $decoded = json_decode((string) $raw, true);
            if (is_array($decoded)) {
                foreach ($decoded as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $addresses[] = [
                        'label'          => $item['label'] ?? '',
                        'recipient_name' => $item['recipient_name'] ?? ($item['name'] ?? ''),
                        'phone'          => $item['phone'] ?? '',
                        'postal_code'    => $item['postal_code'] ?? '',
                        'city'           => $item['city'] ?? '',
                        'district'       => $item['district'] ?? '',
                        'address'        => $item['address'] ?? '',
                        'is_default'     => !empty($item['is_default']) || !empty($item['isDefault']),
                        'store_type'     => $item['store_type'] ?? ($item['type'] ?? 'home'),
                        'store_id'       => $item['store_id'] ?? ($item['storeId'] ?? ''),
                        'store_name'     => $item['store_name'] ?? ($item['storeName'] ?? ''),
                    ];
                }
            }
        }

        if (!empty($addresses)) {
            return $addresses;
        }

        $billing_address = get_user_meta($user_id, 'billing_address_1', true);
        $billing_city    = get_user_meta($user_id, 'billing_city', true);
        $billing_state   = get_user_meta($user_id, 'billing_state', true);
        $billing_phone   = get_user_meta($user_id, 'billing_phone', true);

        if (empty($billing_address) && empty($billing_city) && empty($billing_state)) {
            return [];
        }

        return [[
            'label'          => '預設地址',
            'recipient_name' => trim((string) get_user_meta($user_id, 'billing_first_name', true) . ' ' . (string) get_user_meta($user_id, 'billing_last_name', true)),
            'phone'          => $billing_phone,
            'postal_code'    => get_user_meta($user_id, 'billing_postcode', true),
            'city'           => $billing_city,
            'district'       => $billing_state,
            'address'        => $billing_address,
            'is_default'     => true,
            'store_type'     => 'home',
            'store_id'       => '',
            'store_name'     => '',
        ]];
    }

    private static function extract_legacy_pets($user_id) {
        $raw = get_user_meta((int) $user_id, 'mrpolar_pets', true);
        if (empty($raw)) {
            return [];
        }

        $decoded = json_decode((string) $raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        $pets = [];
        foreach ($decoded as $item) {
            if (!is_array($item)) {
                continue;
            }
            $pets[] = [
                'pet_uid'    => $item['pet_uid'] ?? ($item['id'] ?? ''),
                'name'       => $item['name'] ?? ($item['petName'] ?? ''),
                'type'       => $item['type'] ?? ($item['petType'] ?? ''),
                'breed'      => $item['breed'] ?? ($item['petBreed'] ?? ''),
                'gender'     => $item['gender'] ?? ($item['petGender'] ?? ''),
                'birthday'   => $item['birthday'] ?? ($item['petBirthday'] ?? ''),
                'age'        => $item['age'] ?? ($item['petAge'] ?? ''),
                'weight'     => $item['weight'] ?? ($item['petWeight'] ?? ''),
                'avatar_url' => $item['avatar_url'] ?? '',
                'note'       => $item['note'] ?? '',
            ];
        }

        return $pets;
    }

    private static function get_default_tier_id() {
        global $wpdb;

        $tier_id = $wpdb->get_var(
            "SELECT id
             FROM {$wpdb->prefix}mrpolar_member_tiers
             WHERE is_active = 1
             ORDER BY sort_order ASC, id ASC
             LIMIT 1"
        );

        return $tier_id ? (int) $tier_id : 0;
    }

    private static function sanitize_address_input(array $data, $partial = false, array $current = []) {
        $label          = array_key_exists('label', $data) ? sanitize_text_field(wp_unslash((string) $data['label'])) : ($current['label'] ?? '');
        $recipient_name = array_key_exists('recipient_name', $data)
            ? sanitize_text_field(wp_unslash((string) $data['recipient_name']))
            : (array_key_exists('name', $data)
                ? sanitize_text_field(wp_unslash((string) $data['name']))
                : ($current['recipient_name'] ?? ''));
        $phone       = array_key_exists('phone', $data) ? sanitize_text_field(wp_unslash((string) $data['phone'])) : ($current['phone'] ?? '');
        $postal_code = array_key_exists('postal_code', $data)
            ? sanitize_text_field(wp_unslash((string) $data['postal_code']))
            : (array_key_exists('postalCode', $data)
                ? sanitize_text_field(wp_unslash((string) $data['postalCode']))
                : ($current['postal_code'] ?? ''));
        $city       = array_key_exists('city', $data) ? sanitize_text_field(wp_unslash((string) $data['city'])) : ($current['city'] ?? '');
        $district   = array_key_exists('district', $data) ? sanitize_text_field(wp_unslash((string) $data['district'])) : ($current['district'] ?? '');
        $address    = array_key_exists('address', $data) ? sanitize_text_field(wp_unslash((string) $data['address'])) : ($current['address'] ?? '');
        $store_type = array_key_exists('store_type', $data)
            ? sanitize_text_field(wp_unslash((string) $data['store_type']))
            : (array_key_exists('type', $data)
                ? sanitize_text_field(wp_unslash((string) $data['type']))
                : ($current['store_type'] ?? 'home'));
        $store_id = array_key_exists('store_id', $data)
            ? sanitize_text_field(wp_unslash((string) $data['store_id']))
            : (array_key_exists('storeId', $data)
                ? sanitize_text_field(wp_unslash((string) $data['storeId']))
                : ($current['store_id'] ?? ''));
        $store_name = array_key_exists('store_name', $data)
            ? sanitize_text_field(wp_unslash((string) $data['store_name']))
            : (array_key_exists('storeName', $data)
                ? sanitize_text_field(wp_unslash((string) $data['storeName']))
                : ($current['store_name'] ?? ''));
        $is_default = array_key_exists('is_default', $data)
            ? self::to_bool_int($data['is_default'])
            : (array_key_exists('isDefault', $data)
                ? self::to_bool_int($data['isDefault'])
                : (int) ($current['is_default'] ?? 0));

        if ((!$partial || array_key_exists('recipient_name', $data) || array_key_exists('name', $data)) && '' === $recipient_name) {
            return new WP_Error('mrpolar_invalid_address_name', 'Recipient name is required.', ['status' => 400]);
        }
        if ((!$partial || array_key_exists('phone', $data)) && '' === $phone) {
            return new WP_Error('mrpolar_invalid_address_phone', 'Phone is required.', ['status' => 400]);
        }
        if ((!$partial || array_key_exists('address', $data)) && '' === $address) {
            return new WP_Error('mrpolar_invalid_address', 'Address is required.', ['status' => 400]);
        }

        return [
            'label'          => self::value_or_null($label),
            'recipient_name' => $recipient_name,
            'phone'          => $phone,
            'postal_code'    => self::value_or_null($postal_code),
            'city'           => self::value_or_null($city),
            'district'       => self::value_or_null($district),
            'address'        => $address,
            'is_default'     => $is_default,
            'store_type'     => self::value_or_null($store_type ?: 'home'),
            'store_id'       => self::value_or_null($store_id),
            'store_name'     => self::value_or_null($store_name),
        ];
    }

    private static function sanitize_pet_input(array $data, $partial = false, array $current = []) {
        $pet_uid = array_key_exists('pet_uid', $data)
            ? sanitize_text_field(wp_unslash((string) $data['pet_uid']))
            : (array_key_exists('id', $data) && !is_numeric($data['id'])
                ? sanitize_text_field(wp_unslash((string) $data['id']))
                : ($current['pet_uid'] ?? ''));
        $name = array_key_exists('name', $data)
            ? sanitize_text_field(wp_unslash((string) $data['name']))
            : (array_key_exists('petName', $data)
                ? sanitize_text_field(wp_unslash((string) $data['petName']))
                : ($current['name'] ?? ''));
        $type = array_key_exists('type', $data)
            ? sanitize_text_field(wp_unslash((string) $data['type']))
            : (array_key_exists('petType', $data)
                ? sanitize_text_field(wp_unslash((string) $data['petType']))
                : ($current['type'] ?? ''));
        $breed = array_key_exists('breed', $data)
            ? sanitize_text_field(wp_unslash((string) $data['breed']))
            : (array_key_exists('petBreed', $data)
                ? sanitize_text_field(wp_unslash((string) $data['petBreed']))
                : ($current['breed'] ?? ''));
        $gender = array_key_exists('gender', $data)
            ? $data['gender']
            : (array_key_exists('petGender', $data)
                ? $data['petGender']
                : ($current['gender'] ?? 'unknown'));
        $birthday = array_key_exists('birthday', $data)
            ? $data['birthday']
            : (array_key_exists('petBirthday', $data)
                ? $data['petBirthday']
                : ($current['birthday'] ?? null));
        $age = array_key_exists('age', $data)
            ? $data['age']
            : (array_key_exists('petAge', $data)
                ? $data['petAge']
                : ($current['age'] ?? null));
        $weight = array_key_exists('weight', $data)
            ? $data['weight']
            : (array_key_exists('petWeight', $data)
                ? $data['petWeight']
                : ($current['weight'] ?? null));
        $avatar_url = array_key_exists('avatar_url', $data) ? $data['avatar_url'] : ($current['avatar_url'] ?? null);
        $note       = array_key_exists('note', $data) ? sanitize_textarea_field(wp_unslash((string) $data['note'])) : ($current['note'] ?? '');

        if ((!$partial || array_key_exists('name', $data) || array_key_exists('petName', $data)) && '' === $name) {
            return new WP_Error('mrpolar_invalid_pet_name', 'Pet name is required.', ['status' => 400]);
        }

        $normalized_gender   = self::normalize_pet_gender($gender);
        $normalized_birthday = self::normalize_date_or_null($birthday);
        $normalized_age      = self::normalize_nullable_int($age, 0, 255);
        $normalized_weight   = self::normalize_nullable_decimal($weight, 1);
        $normalized_avatar   = self::normalize_url_or_null($avatar_url);

        foreach ([$normalized_gender, $normalized_birthday, $normalized_age, $normalized_weight, $normalized_avatar] as $value) {
            if (is_wp_error($value)) {
                return $value;
            }
        }

        return [
            'pet_uid'    => self::value_or_null($pet_uid),
            'name'       => $name,
            'type'       => self::value_or_null($type),
            'breed'      => self::value_or_null($breed),
            'gender'     => $normalized_gender,
            'birthday'   => $normalized_birthday,
            'age'        => $normalized_age,
            'weight'     => $normalized_weight,
            'avatar_url' => $normalized_avatar,
            'note'       => self::value_or_null($note),
        ];
    }

    private static function get_address_row($address_id, $member_id, $format = true) {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}mrpolar_addresses WHERE id = %d AND member_id = %d LIMIT 1",
                (int) $address_id,
                (int) $member_id
            ),
            ARRAY_A
        );

        if (!$format) {
            return $row;
        }

        return $row ? self::format_address($row) : null;
    }

    private static function get_pet_row($pet_id, $member_id, $format = true) {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}mrpolar_pets WHERE id = %d AND member_id = %d LIMIT 1",
                (int) $pet_id,
                (int) $member_id
            ),
            ARRAY_A
        );

        if (!$format) {
            return $row;
        }

        return $row ? self::format_pet($row) : null;
    }

    private static function ensure_default_address($member_id) {
        global $wpdb;

        $default_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}mrpolar_addresses WHERE member_id = %d AND is_default = 1 LIMIT 1",
                (int) $member_id
            )
        );

        if (!empty($default_id)) {
            return;
        }

        $first_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}mrpolar_addresses WHERE member_id = %d ORDER BY id ASC LIMIT 1",
                (int) $member_id
            )
        );

        if (empty($first_id)) {
            return;
        }

        $wpdb->update(
            $wpdb->prefix . 'mrpolar_addresses',
            ['is_default' => 1],
            ['id' => (int) $first_id, 'member_id' => (int) $member_id],
            ['%d'],
            ['%d', '%d']
        );
    }

    private static function sync_wordpress_user($user_id, array $member_data) {
        $user_update = ['ID' => (int) $user_id];

        if (array_key_exists('display_name', $member_data)) {
            $user_update['display_name'] = (string) $member_data['display_name'];
        }
        if (array_key_exists('email', $member_data)) {
            $user_update['user_email'] = (string) $member_data['email'];
        }

        if (array_key_exists('first_name', $member_data)) {
            update_user_meta($user_id, 'first_name', (string) $member_data['first_name']);
            update_user_meta($user_id, 'billing_first_name', (string) $member_data['first_name']);
        }
        if (array_key_exists('last_name', $member_data)) {
            update_user_meta($user_id, 'last_name', (string) $member_data['last_name']);
            update_user_meta($user_id, 'billing_last_name', (string) $member_data['last_name']);
        }
        if (array_key_exists('phone', $member_data)) {
            update_user_meta($user_id, 'billing_phone', (string) $member_data['phone']);
        }
        if (array_key_exists('gender', $member_data)) {
            update_user_meta($user_id, 'mrpolar_gender', (string) $member_data['gender']);
        }
        if (array_key_exists('birthday', $member_data)) {
            update_user_meta($user_id, 'mrpolar_birthday', (string) $member_data['birthday']);
        }

        if (count($user_update) > 1) {
            wp_update_user($user_update);
        }
    }

    private static function sync_legacy_user_meta($member) {
        if (empty($member)) {
            return;
        }

        $user_id = (int) $member['wp_user_id'];
        if ($user_id <= 0) {
            return;
        }

        update_user_meta($user_id, 'mrpolar_gender', (string) ($member['gender'] ?? ''));
        update_user_meta($user_id, 'mrpolar_birthday', (string) ($member['birthday'] ?? ''));
        update_user_meta($user_id, 'mrpolar_points', (int) ($member['points_balance'] ?? 0));
        update_user_meta($user_id, 'billing_phone', (string) ($member['phone'] ?? ''));
        update_user_meta($user_id, 'billing_email', (string) ($member['email'] ?? ''));

        $pets      = self::get_pets_by_member_id((int) $member['id']);
        $addresses = self::get_addresses_by_member_id((int) $member['id']);

        $legacy_pets = [];
        foreach ($pets as $pet) {
            $legacy_pets[] = [
                'id'       => $pet['pet_uid'] ?: $pet['id'],
                'name'     => $pet['name'],
                'type'     => $pet['type'],
                'breed'    => $pet['breed'],
                'gender'   => $pet['gender'],
                'birthday' => $pet['birthday'],
                'age'      => $pet['age'],
                'weight'   => $pet['weight'],
            ];
        }

        $legacy_addresses = [];
        foreach ($addresses as $address) {
            $legacy_addresses[] = [
                'id'          => $address['id'],
                'label'       => $address['label'],
                'name'        => $address['name'],
                'phone'       => $address['phone'],
                'postal_code' => $address['postal_code'],
                'city'        => $address['city'],
                'district'    => $address['district'],
                'address'     => $address['address'],
                'is_default'  => $address['is_default'],
                'type'        => $address['type'],
                'storeId'     => $address['storeId'],
                'storeName'   => $address['storeName'],
            ];
        }

        update_user_meta($user_id, 'mrpolar_pets', wp_json_encode($legacy_pets));
        update_user_meta($user_id, 'mrpolar_addresses', wp_json_encode($legacy_addresses));

        $default_address = null;
        foreach ($addresses as $address) {
            if (!empty($address['is_default'])) {
                $default_address = $address;
                break;
            }
        }

        if ($default_address) {
            update_user_meta($user_id, 'billing_city', (string) ($default_address['city'] ?? ''));
            update_user_meta($user_id, 'billing_state', (string) ($default_address['district'] ?? ''));
            update_user_meta($user_id, 'billing_postcode', (string) ($default_address['postal_code'] ?? ''));
            update_user_meta($user_id, 'billing_address_1', (string) ($default_address['address'] ?? ''));
            update_user_meta($user_id, 'billing_phone', (string) ($default_address['phone'] ?? ''));

            if (!empty($default_address['name'])) {
                $parts = preg_split('/\s+/', trim((string) $default_address['name'])) ?: [];
                if (!empty($parts)) {
                    update_user_meta($user_id, 'billing_first_name', (string) array_shift($parts));
                    update_user_meta($user_id, 'billing_last_name', implode(' ', $parts));
                }
            }
        }
    }

    private static function format_address(array $row) {
        $is_default = !empty($row['is_default']);
        $type       = !empty($row['store_type']) ? (string) $row['store_type'] : 'home';

        return [
            'id'             => (int) $row['id'],
            'label'          => (string) ($row['label'] ?? ''),
            'recipient_name' => (string) ($row['recipient_name'] ?? ''),
            'name'           => (string) ($row['recipient_name'] ?? ''),
            'phone'          => (string) ($row['phone'] ?? ''),
            'postal_code'    => (string) ($row['postal_code'] ?? ''),
            'postalCode'     => (string) ($row['postal_code'] ?? ''),
            'city'           => (string) ($row['city'] ?? ''),
            'district'       => (string) ($row['district'] ?? ''),
            'address'        => (string) ($row['address'] ?? ''),
            'is_default'     => $is_default,
            'isDefault'      => $is_default,
            'store_type'     => $type,
            'type'           => $type,
            'store_id'       => (string) ($row['store_id'] ?? ''),
            'storeId'        => (string) ($row['store_id'] ?? ''),
            'store_name'     => (string) ($row['store_name'] ?? ''),
            'storeName'      => (string) ($row['store_name'] ?? ''),
            'created_at'     => (string) ($row['created_at'] ?? ''),
            'updated_at'     => (string) ($row['updated_at'] ?? ''),
        ];
    }

    private static function format_pet(array $row) {
        $age        = '' === (string) ($row['age'] ?? '') ? null : (int) $row['age'];
        $weight     = '' === (string) ($row['weight'] ?? '') ? null : (float) $row['weight'];
        $weight_str = null === $weight ? '' : rtrim(rtrim(number_format($weight, 1, '.', ''), '0'), '.');

        return [
            'id'          => (int) $row['id'],
            'pet_uid'     => (string) ($row['pet_uid'] ?? ''),
            'name'        => (string) ($row['name'] ?? ''),
            'petName'     => (string) ($row['name'] ?? ''),
            'type'        => (string) ($row['type'] ?? ''),
            'petType'     => (string) ($row['type'] ?? ''),
            'breed'       => (string) ($row['breed'] ?? ''),
            'petBreed'    => (string) ($row['breed'] ?? ''),
            'gender'      => (string) ($row['gender'] ?? ''),
            'petGender'   => (string) ($row['gender'] ?? ''),
            'birthday'    => (string) ($row['birthday'] ?? ''),
            'petBirthday' => (string) ($row['birthday'] ?? ''),
            'age'         => $age,
            'petAge'      => null === $age ? '' : (string) $age,
            'weight'      => $weight,
            'petWeight'   => $weight_str,
            'avatar'      => (string) ($row['avatar_url'] ?? ''),
            'avatar_url'  => (string) ($row['avatar_url'] ?? ''),
            'note'        => (string) ($row['note'] ?? ''),
            'created_at'  => (string) ($row['created_at'] ?? ''),
            'updated_at'  => (string) ($row['updated_at'] ?? ''),
        ];
    }

    private static function format_points_log(array $row) {
        return [
            'id'           => (int) $row['id'],
            'change_type'  => (string) ($row['change_type'] ?? ''),
            'points_delta' => (int) $row['points_delta'],
            'points_after' => (int) $row['points_after'],
            'order_id'     => !empty($row['order_id']) ? (int) $row['order_id'] : null,
            'reason'       => (string) ($row['reason'] ?? ''),
            'note'         => (string) ($row['note'] ?? ''),
            'expires_at'   => (string) ($row['expires_at'] ?? ''),
            'operated_by'  => !empty($row['operated_by']) ? (int) $row['operated_by'] : null,
            'operated_name'=> (string) ($row['operated_name'] ?? ''),
            'operated_at'  => (string) ($row['operated_at'] ?? ''),
            'ip_address'   => (string) ($row['ip_address'] ?? ''),
        ];
    }

    private static function format_tier_payload(array $member) {
        if (empty($member['tier_id'])) {
            return null;
        }

        return [
            'id'                      => (int) $member['tier_id'],
            'key'                     => (string) ($member['tier_key'] ?? ''),
            'name'                    => (string) ($member['tier_name'] ?? ''),
            'color'                   => (string) ($member['tier_color'] ?? ''),
            'cashback_rate'           => isset($member['cashback_rate']) ? (float) $member['cashback_rate'] : 0.0,
            'welcome_points'          => isset($member['welcome_points']) ? (int) $member['welcome_points'] : 0,
            'birthday_bonus_rate'     => isset($member['birthday_bonus_rate']) ? (float) $member['birthday_bonus_rate'] : 0.0,
            'free_shipping_threshold' => isset($member['free_shipping_threshold']) ? (float) $member['free_shipping_threshold'] : null,
            'description'             => (string) ($member['tier_description'] ?? ''),
            'benefits_json'           => (string) ($member['benefits_json'] ?? ''),
            'is_active'               => isset($member['tier_is_active']) ? (bool) $member['tier_is_active'] : false,
        ];
    }

    private static function member_avatar_url(array $member) {
        if (!empty($member['avatar_url'])) {
            return (string) $member['avatar_url'];
        }

        return get_avatar_url((int) $member['wp_user_id']);
    }

    private static function normalize_member_gender($value, $allow_empty = false) {
        if (null === $value || '' === (string) $value) {
            return $allow_empty ? null : '';
        }

        $value   = sanitize_text_field(wp_unslash((string) $value));
        $allowed = ['male', 'female', 'other', 'prefer_not_to_say'];
        if (!in_array($value, $allowed, true)) {
            return new WP_Error('mrpolar_invalid_gender', 'Invalid gender value.', ['status' => 400]);
        }

        return $value;
    }

    private static function normalize_pet_gender($value) {
        if (null === $value || '' === (string) $value) {
            return 'unknown';
        }

        $value   = sanitize_text_field(wp_unslash((string) $value));
        $allowed = ['male', 'female', 'unknown'];
        if (!in_array($value, $allowed, true)) {
            return new WP_Error('mrpolar_invalid_pet_gender', 'Invalid pet gender value.', ['status' => 400]);
        }

        return $value;
    }

    private static function normalize_member_status($value, $allow_empty = false) {
        if (null === $value || '' === (string) $value) {
            return $allow_empty ? 'active' : null;
        }

        $value   = sanitize_text_field(wp_unslash((string) $value));
        $allowed = ['active', 'suspended', 'deleted'];
        if (!in_array($value, $allowed, true)) {
            return new WP_Error('mrpolar_invalid_status', 'Invalid member status.', ['status' => 400]);
        }

        return $value;
    }

    private static function normalize_date_or_null($value, $allow_empty = false) {
        if (null === $value || '' === (string) $value) {
            return null;
        }

        $value = sanitize_text_field(wp_unslash((string) $value));
        $dt    = DateTime::createFromFormat('Y-m-d', $value);
        if (!$dt || $dt->format('Y-m-d') !== $value) {
            return new WP_Error('mrpolar_invalid_date', 'Date must use YYYY-MM-DD format.', ['status' => 400]);
        }

        return $value;
    }

    private static function normalize_url_or_null($value, $allow_empty = false) {
        if (null === $value || '' === (string) $value) {
            return $allow_empty ? null : null;
        }

        $url = esc_url_raw(wp_unslash((string) $value));
        if ('' === $url) {
            return new WP_Error('mrpolar_invalid_url', 'Invalid URL.', ['status' => 400]);
        }

        return $url;
    }

    private static function normalize_nullable_int($value, $min = 0, $max = PHP_INT_MAX) {
        if (null === $value || '' === (string) $value) {
            return null;
        }

        if (!is_numeric($value)) {
            return new WP_Error('mrpolar_invalid_integer', 'Invalid integer value.', ['status' => 400]);
        }

        $value = (int) $value;
        if ($value < $min || $value > $max) {
            return new WP_Error('mrpolar_invalid_integer', 'Integer value is out of range.', ['status' => 400]);
        }

        return $value;
    }

    private static function normalize_nullable_decimal($value, $precision = 2) {
        if (null === $value || '' === (string) $value) {
            return null;
        }

        if (!is_numeric($value)) {
            return new WP_Error('mrpolar_invalid_decimal', 'Invalid decimal value.', ['status' => 400]);
        }

        return number_format((float) $value, (int) $precision, '.', '');
    }

    private static function normalize_money_or_zero($value) {
        if (null === $value || '' === (string) $value || !is_numeric($value)) {
            return '0.00';
        }

        return number_format((float) $value, 2, '.', '');
    }

    private static function value_or_null($value) {
        if (null === $value) {
            return null;
        }

        $value = trim((string) $value);
        return '' === $value ? null : $value;
    }

    private static function infer_format($value) {
        if (is_int($value) || is_bool($value)) {
            return '%d';
        }
        if (is_float($value)) {
            return '%f';
        }
        if (null === $value) {
            return '%s';
        }
        if (is_numeric($value) && false !== strpos((string) $value, '.')) {
            return '%f';
        }
        if (is_numeric($value) && (string) (int) $value === (string) $value) {
            return '%d';
        }

        return '%s';
    }

    private static function to_bool_int($value) {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }
        if (is_numeric($value)) {
            return ((int) $value) > 0 ? 1 : 0;
        }

        $value = strtolower(trim((string) $value));
        return in_array($value, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
    }

    private static function current_ip() {
        $keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        foreach ($keys as $key) {
            if (empty($_SERVER[$key])) {
                continue;
            }

            $value = trim(explode(',', (string) $_SERVER[$key])[0]);
            if ('' !== $value) {
                return sanitize_text_field($value);
            }
        }

        return '';
    }

    private static function rest_response($data, $message, $status = 200) {
        return new WP_REST_Response([
            'success' => true,
            'data'    => $data,
            'message' => $message,
        ], $status);
    }

    private static function rest_error(WP_Error $error) {
        $status = 500;
        $data   = $error->get_error_data();
        if (is_array($data) && !empty($data['status'])) {
            $status = (int) $data['status'];
        }

        return new WP_REST_Response([
            'success' => false,
            'data'    => (object) [],
            'message' => $error->get_error_message(),
        ], $status);
    }
}
