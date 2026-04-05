jQuery(function ($) {
    'use strict';

    var TEXT_POINTS_FORM = '\u9ede\u6578\u8abf\u6574';
    var TEXT_POINTS_FORM_OPEN = '\u9ede\u6578\u8abf\u6574\uff08\u9ede\u64ca\u6309\u9215\u6536\u5408\uff09';
    var TEXT_MODAL_CREATE = '\u65b0\u589e\u7b49\u7d1a';
    var TEXT_MODAL_EDIT = '\u7de8\u8f2f\u7b49\u7d1a';

    $('.mrpolar-tab').on('click', function () {
        var $tab = $(this);
        var tab = $tab.data('tab');
        var $wrapper = $tab.closest('.mrpolar-wrap');

        $wrapper.find('.mrpolar-tab').removeClass('active');
        $tab.addClass('active');
        $wrapper.find('.mrpolar-tab-content').removeClass('active');
        $wrapper.find('.mrpolar-tab-content[data-tab="' + tab + '"]').addClass('active');
    });

    $('.mrpolar-col-toggle-btn').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).closest('.mrpolar-col-toggle').toggleClass('open');
    });

    $('#mrpolar-columns-form input[type="checkbox"]').on('change', function () {
        $(this).closest('form').trigger('submit');
    });

    $(document).on('click', function () {
        $('.mrpolar-col-toggle').removeClass('open');
    });

    $('.mrpolar-col-dropdown').on('click', function (event) {
        event.stopPropagation();
    });

    $('[data-confirm]').on('click', function (event) {
        if (!window.confirm($(this).data('confirm'))) {
            event.preventDefault();
        }
    });

    $('[data-toggle-form]').on('click', function (event) {
        var $trigger = $(this);
        var $target = $($trigger.data('toggle-form'));
        var $tabContent;
        var tabKey;
        var $tabButton;

        event.preventDefault();

        if (!$target.length) {
            return;
        }

        $tabContent = $target.closest('.mrpolar-tab-content');
        if ($tabContent.length) {
            tabKey = $tabContent.data('tab');
            $tabButton = $tabContent.parent().find('.mrpolar-tab[data-tab="' + tabKey + '"]').first();

            if ($tabButton.length) {
                $tabButton.trigger('click');
            }
        }

        $target.slideToggle(200, function () {
            $target.closest('.mrpolar-card').find('h3').first().text(
                $target.is(':visible') ? TEXT_POINTS_FORM_OPEN : TEXT_POINTS_FORM
            );
        });
    });

    $('[data-open-modal]').on('click', function (event) {
        var $modal = $($(this).data('open-modal'));
        var form = $modal.find('form')[0];

        event.preventDefault();

        if (!$modal.length) {
            return;
        }

        if (form) {
            form.reset();
        }

        $modal.addClass('open');
        $modal.find('input[name="tier_id"]').val('0');
        $modal.find('.mrpolar-modal h2').text(TEXT_MODAL_CREATE);
    });

    $('[data-close-modal]').on('click', function (event) {
        event.preventDefault();
        $(this).closest('.mrpolar-modal-overlay').removeClass('open');
    });

    $('.mrpolar-modal-overlay').on('click', function (event) {
        if ($(event.target).is('.mrpolar-modal-overlay')) {
            $(this).removeClass('open');
        }
    });

    $('[data-edit-tier]').on('click', function (event) {
        var tier = $(this).data('tier-json');
        var $modal = $('#mrpolar-tier-modal');

        event.preventDefault();

        if (typeof tier === 'string') {
            try {
                tier = JSON.parse(tier);
            } catch (error) {
                tier = null;
            }
        }

        if (!tier || !$modal.length) {
            return;
        }

        $modal.addClass('open');
        $modal.find('.mrpolar-modal h2').text(TEXT_MODAL_EDIT);
        $modal.find('input[name="tier_id"]').val(tier.id || 0);
        $modal.find('input[name="tier_name"]').val(tier.tier_name || '');
        $modal.find('input[name="tier_key"]').val(tier.tier_key || '');
        $modal.find('input[name="tier_color"]').val(tier.tier_color || '#888888');
        $modal.find('input[name="sort_order"]').val(tier.sort_order || 0);
        $modal.find('input[name="is_active"]').prop('checked', String(tier.is_active) === '1');
        $modal.find('input[name="is_manual_only"]').prop('checked', String(tier.is_manual_only) === '1');
        $modal.find('input[name="upgrade_min_spending"]').val(tier.upgrade_min_spending || '');
        $modal.find('input[name="upgrade_min_orders"]').val(tier.upgrade_min_orders || '');
        $modal.find('input[name="upgrade_min_points"]').val(tier.upgrade_min_points || '');
        $modal.find('input[name="cashback_rate"]').val(tier.cashback_rate ? parseFloat(tier.cashback_rate) * 100 : '');
        $modal.find('input[name="birthday_bonus_rate"]').val(tier.birthday_bonus_rate ? parseFloat(tier.birthday_bonus_rate) * 100 : '');
        $modal.find('input[name="welcome_points"]').val(tier.welcome_points || '');
        $modal.find('input[name="free_shipping_threshold"]').val(tier.free_shipping_threshold || '');
        $modal.find('textarea[name="description"]').val(tier.description || '');
    });

    if ($.isFunction($.fn.sortable) && $('#mrpolar-tiers-table tbody').length) {
        $('#mrpolar-tiers-table tbody').sortable({
            handle: '.mrpolar-drag-handle',
            axis: 'y',
            update: function () {
                var order = [];

                $('#mrpolar-tiers-table tbody tr').each(function () {
                    order.push($(this).data('tier-id'));
                });

                $('#mrpolar-tier-order').val(JSON.stringify(order));
                $('#mrpolar-reorder-form').trigger('submit');
            }
        });
    }
});
