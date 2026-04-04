<?php
defined('ABSPATH') || exit;

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

    public static function register(WP_REST_Request $request) {
        $email      = sanitize_email($request->get_param('email'));
        $password   = (string) $request->get_param('password');
        $first_name = sanitize_text_field((string) $request->get_param('first_name'));
        $last_name  = sanitize_text_field((string) ($request->get_param('last_name') ?? ''));
        $phone      = sanitize_text_field((string) ($request->get_param('phone') ?? ''));
        $gender     = $request->get_param('gender');
        $birthday   = $request->get_param('birthday');
        $pets       = $request->get_param('pets') ?? [];

        if (empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'A valid email is required.', ['status' => 400]);
        }
        if (empty($password) || strlen($password) < 8) {
            return new WP_Error('invalid_password', 'Password must be at least 8 characters.', ['status' => 400]);
        }
        if (email_exists($email)) {
            return new WP_Error('email_exists', 'This email is already registered.', ['status' => 409]);
        }

        $username = self::generate_username($email);
        $user_id  = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) {
            return new WP_Error('register_failed', $user_id->get_error_message(), ['status' => 500]);
        }

        $display_name = trim($first_name . ' ' . $last_name);
        wp_update_user([
            'ID'           => $user_id,
            'first_name'   => $first_name,
            'last_name'    => $last_name,
            'display_name' => '' !== $display_name ? $display_name : $username,
            'role'         => 'customer',
        ]);

        $member = MrPolar_Member::ensure_member_for_user($user_id, [
            'display_name' => '' !== $display_name ? $display_name : $username,
            'first_name'   => $first_name,
            'last_name'    => $last_name,
            'email'        => $email,
            'phone'        => $phone,
            'gender'       => $gender,
            'birthday'     => $birthday,
            'pets'         => is_array($pets) ? $pets : [],
        ]);

        if (is_wp_error($member)) {
            return $member;
        }

        do_action('woocommerce_created_customer', $user_id, [], $password);

        return new WP_REST_Response([
            'success'  => true,
            'message'  => 'Registration completed.',
            'customer' => self::format_customer($user_id),
        ], 201);
    }

    public static function get_me(WP_REST_Request $request) {
        return new WP_REST_Response(self::format_customer(get_current_user_id()), 200);
    }

    public static function update_me(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $data    = [
            'display_name' => $request->get_param('display_name'),
            'first_name'   => $request->get_param('first_name'),
            'last_name'    => $request->get_param('last_name'),
            'phone'        => $request->get_param('phone'),
            'gender'       => $request->get_param('gender'),
            'birthday'     => $request->get_param('birthday'),
            'avatar_url'   => $request->get_param('avatar_url'),
        ];

        $member = MrPolar_Member::update_member_self_profile($user_id, $data);
        if (is_wp_error($member)) {
            return $member;
        }

        $pets = $request->get_param('pets');
        if (null !== $pets) {
            if (!is_array($pets)) {
                return new WP_Error('invalid_pets', 'Pets payload must be an array.', ['status' => 400]);
            }
            $updated_pets = MrPolar_Member::replace_pets_for_member((int) $member['id'], $pets);
            if (is_wp_error($updated_pets)) {
                return $updated_pets;
            }
        }

        return new WP_REST_Response(self::format_customer($user_id), 200);
    }

    public static function change_password(WP_REST_Request $request) {
        $user_id      = get_current_user_id();
        $old_password = (string) $request->get_param('old_password');
        $new_password = (string) $request->get_param('new_password');

        if ('' === $old_password || '' === $new_password) {
            return new WP_Error('missing_fields', 'Both old and new passwords are required.', ['status' => 400]);
        }
        if (strlen($new_password) < 8) {
            return new WP_Error('weak_password', 'Password must be at least 8 characters.', ['status' => 400]);
        }

        $user = get_user_by('ID', $user_id);
        if (!$user || !wp_check_password($old_password, $user->user_pass, $user_id)) {
            return new WP_Error('wrong_password', 'Current password is incorrect.', ['status' => 400]);
        }

        wp_set_password($new_password, $user_id);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Password updated.',
        ], 200);
    }

    public static function is_logged_in() {
        return is_user_logged_in();
    }

    public static function format_customer($user_id) {
        $customer = MrPolar_Member::get_legacy_customer_by_user_id((int) $user_id, true);

        if (is_wp_error($customer)) {
            return [
                'id'         => (int) $user_id,
                'member_id'  => 0,
                'email'      => '',
                'username'   => '',
                'first_name' => '',
                'last_name'  => '',
                'name'       => '',
                'phone'      => '',
                'gender'     => '',
                'birthday'   => '',
                'avatar'     => '',
                'member_since' => '',
                'points'     => 0,
                'pets'       => [],
                'addresses'  => [],
            ];
        }

        return $customer;
    }

    private static function generate_username($email) {
        $base     = sanitize_user(strstr($email, '@', true), true);
        $username = $base;
        $index    = 1;

        while (username_exists($username)) {
            $username = $base . $index;
            $index++;
        }

        return $username;
    }

    private static function register_args() {
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
