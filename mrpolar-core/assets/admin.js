jQuery(function ($) {
    'use strict';

    // ── Tabs ──────────────────────────────────────────────
    $('.mrpolar-tab').on('click', function () {
        var $tab     = $(this);
        var tab      = $tab.data('tab');
        var $wrapper = $tab.closest('.mrpolar-wrap');
        $wrapper.find('.mrpolar-tab').removeClass('active');
        $tab.addClass('active');
        $wrapper.find('.mrpolar-tab-content').removeClass('active');
        $wrapper.find('.mrpolar-tab-content[data-tab="' + tab + '"]').addClass('active');
    });

    // ── Column toggle dropdown ────────────────────────────
    $('.mrpolar-col-toggle-btn').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).closest('.mrpolar-col-toggle').toggleClass('open');
    });
    $('#mrpolar-columns-form input[type="checkbox"]').on('change', function () {
        $(this).closest('form').trigger('submit');
    });
    $(document).on('click', function () {
        $('.mrpolar-col-toggle').removeClass('open');
    });
    $('.mrpolar-col-dropdown').on('click', function (e) {
        e.stopPropagation();
    });

    // ── Confirm links ─────────────────────────────────────
    $('[data-confirm]').on('click', function (e) {
        if (!window.confirm($(this).data('confirm'))) {
            e.preventDefault();
        }
    });

    // ── Toggle inline form (e.g. 調整點數) ────────────────
    $('[data-toggle-form]').on('click', function (e) {
        e.preventDefault();
        var $target     = $($(this).data('toggle-form'));
        if (!$target.length) { return; }
        var $tabContent = $target.closest('.mrpolar-tab-content');
        if ($tabContent.length) {
            var tabKey    = $tabContent.data('tab');
            var $tabBtn   = $tabContent.parent().find('.mrpolar-tab[data-tab="' + tabKey + '"]').first();
            if ($tabBtn.length) { $tabBtn.trigger('click'); }
        }
        $target.slideToggle(200);
    });

    // ── Modal open / close ────────────────────────────────
    function openModal($modal) {
        $modal.addClass('open');
    }
    function closeModal($modal) {
        $modal.removeClass('open');
        var form = $modal.find('form')[0];
        if (form) { form.reset(); }
        $modal.find('input[name="tier_id"]').val('0');
        $modal.find('#mrpolar-modal-title, h2').first().text('新增等級');
        $modal.find('#mrpolar-tier-submit').text('儲存等級');
    }

    // 開啟按鈕 (#mrpolar-open-tier-modal)
    $(document).on('click', '#mrpolar-open-tier-modal', function () {
        var $modal = $('#mrpolar-tier-modal');
        closeModal($modal);
        openModal($modal);
    });

    // 關閉按鈕 [data-close-modal]
    $(document).on('click', '[data-close-modal]', function () {
        closeModal($(this).closest('.mrpolar-modal-overlay'));
    });

    // 點擊遮罩關閉
    $(document).on('click', '.mrpolar-modal-overlay', function (e) {
        if ($(e.target).is('.mrpolar-modal-overlay')) {
            closeModal($(this));
        }
    });

    // ESC 關閉
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.mrpolar-modal-overlay.open').each(function () {
                closeModal($(this));
            });
        }
    });

    // ── Edit tier button ──────────────────────────────────
    $(document).on('click', '.mrpolar-edit-tier-btn', function () {
        var raw = $(this).data('tier-json') || $(this).attr('data-tier-json') || '{}';
        var tier;
        try {
            tier = (typeof raw === 'object') ? raw : JSON.parse(raw);
        } catch (err) {
            tier = {};
        }
        if (!tier || !tier.id) { return; }

        var $modal = $('#mrpolar-tier-modal');
        $modal.find('#mrpolar-modal-title').text('編輯等級：' + (tier.tier_name || ''));
        $modal.find('#mrpolar-tier-submit').text('更新等級');

        function sv(id, v) {
            var el = document.getElementById(id);
            if (el) { el.value = (v !== null && v !== undefined) ? v : ''; }
        }
        function sc(name, v) {
            var el = $modal.find('[name="' + name + '"]')[0];
            if (el) { el.checked = !!+v; }
        }

        sv('mrpolar-tier-id',          tier.id || 0);
        sv('mrpolar-tier-name',         tier.tier_name);
        sv('mrpolar-tier-key',          tier.tier_key);
        sv('mrpolar-tier-color',        tier.tier_color || '#888888');
        sv('mrpolar-tier-sort',         tier.sort_order);
        sc('is_active',                 tier.is_active);
        sc('is_manual_only',            tier.is_manual_only);
        sv('mrpolar-upgrade-spending',  tier.upgrade_min_spending);
        sv('mrpolar-upgrade-orders',    tier.upgrade_min_orders);
        sv('mrpolar-upgrade-points',    tier.upgrade_min_points);
        sv('mrpolar-maintain-spending', tier.downgrade_min_spending);
        sv('mrpolar-cashback-rate',     tier.cashback_rate      != null ? (parseFloat(tier.cashback_rate)      * 100).toFixed(2) : '');
        sv('mrpolar-birthday-bonus',    tier.birthday_bonus_rate != null ? (parseFloat(tier.birthday_bonus_rate) * 100).toFixed(2) : '');
        sv('mrpolar-welcome-points',    tier.welcome_points);
        sv('mrpolar-free-shipping',     tier.free_shipping_threshold);
        sv('mrpolar-tier-description',  tier.description);

        var ddSel = document.getElementById('mrpolar-downgrade-to');
        if (ddSel) { ddSel.value = tier.downgrade_to_tier_id || ''; }

        openModal($modal);
    });

    // ── Tier drag-and-drop reorder (jQuery UI Sortable) ───
    if ($.isFunction($.fn.sortable)) {
        var $tbody = $('#mrpolar-tiers-tbody');
        if ($tbody.length) {
            $tbody.sortable({
                handle: '.mrpolar-drag-handle',
                axis: 'y',
                cursor: 'grabbing',
                placeholder: 'mrpolar-sortable-placeholder',
                tolerance: 'pointer',
                update: function () {
                    var ids = [];
                    $tbody.find('tr[data-tier-id]').each(function () {
                        ids.push($(this).data('tier-id'));
                    });
                    // 逗號分隔，對應 handle_reorder_tiers 的 explode(',', ...)
                    $('#mrpolar-tier-order').val(ids.join(','));
                    $('#mrpolar-reorder-form').trigger('submit');
                }
            });
            $tbody.disableSelection();
        }
    }
});
