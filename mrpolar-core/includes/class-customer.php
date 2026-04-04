<?php
defined('ABSPATH') || exit;

class MrPolar_Customer {

    public static function register_routes() {
        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/profile', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [self::class, 'get_profile'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [self::class, 'update_profile'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
        ]);

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

        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/addresses/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'update_address'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [self::class, 'delete_address'],
                'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
            ],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/points', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [self::class, 'get_points'],
            'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
        ]);

        register_rest_route(MRPOLAR_API_NAMESPACE, '/customer/pets', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [self::class, 'update_pets'],
            'permission_callback' => [MrPolar_Auth::class, 'is_logged_in'],
        ]);
    }

    public static function get_profile(WP_REST_Request $request) {
        $customer = MrPolar_Member::get_legacy_customer_by_user_id(get_current_user_id(), true);
        return is_wp_error($customer) ? $customer : new WP_REST_Response($customer, 200);
    }

    public static function update_profile(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $member  = MrPolar_Member::update_member_self_profile($user_id, [
            'display_name' => $request->get_param('display_name'),
            'first_name'   => $request->get_param('first_name'),
            'last_name'    => $request->get_param('last_name'),
            'phone'        => $request->get_param('phone'),
            'gender'       => $request->get_param('gender'),
            'birthday'     => $request->get_param('birthday'),
            'avatar_url'   => $request->get_param('avatar_url'),
        ]);

        if (is_wp_error($member)) {
            return $member;
        }

        if (null !== $request->get_param('pets')) {
            $pets = $request->get_param('pets');
            if (!is_array($pets)) {
                return new WP_Error('invalid_pets', 'Pets payload must be an array.', ['status' => 400]);
            }

            $updated = MrPolar_Member::replace_pets_for_member((int) $member['id'], $pets);
            if (is_wp_error($updated)) {
                return $updated;
            }
        }

        $customer = MrPolar_Member::get_legacy_customer_by_user_id($user_id, true);
        return is_wp_error($customer) ? $customer : new WP_REST_Response($customer, 200);
    }

    public static function get_addresses(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        return new WP_REST_Response(
            MrPolar_Member::get_addresses_by_member_id((int) $member['id']),
            200
        );
    }

    public static function add_address(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        $address = MrPolar_Member::add_address_for_member((int) $member['id'], $request->get_params());
        return is_wp_error($address) ? $address : new WP_REST_Response($address, 201);
    }

    public static function update_address(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        $address = MrPolar_Member::update_address_for_member(
            (int) $member['id'],
            (int) $request->get_param('id'),
            $request->get_params()
        );

        return is_wp_error($address) ? $address : new WP_REST_Response($address, 200);
    }

    public static function delete_address(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        $deleted = MrPolar_Member::delete_address_for_member(
            (int) $member['id'],
            (int) $request->get_param('id')
        );

        return is_wp_error($deleted)
            ? $deleted
            : new WP_REST_Response(['success' => true], 200);
    }

    public static function get_points(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        $summary = MrPolar_Member::get_points_summary((int) $member['id'], 20);
        if (is_wp_error($summary)) {
            return $summary;
        }

        return new WP_REST_Response([
            'points' => (int) $summary['points_balance'],
            'logs'   => $summary['logs'],
        ], 200);
    }

    public static function update_pets(WP_REST_Request $request) {
        $member = MrPolar_Member::get_current_member_record();
        if (is_wp_error($member)) {
            return $member;
        }

        $pets = $request->get_param('pets') ?? [];
        if (!is_array($pets)) {
            return new WP_Error('invalid_pets', 'Pets payload must be an array.', ['status' => 400]);
        }

        $updated = MrPolar_Member::replace_pets_for_member((int) $member['id'], $pets);
        return is_wp_error($updated)
            ? $updated
            : new WP_REST_Response(['pets' => $updated], 200);
    }
}
