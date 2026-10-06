$(document).ready(function () {
    $(document).on('change', 'input[name="date-filter"], #dashboard_location', function () {
        var start = $('input[name="date-filter"]:checked').data('start');
        var end = $('input[name="date-filter"]:checked').data('end');
        update_statistics(start, end);
        if ($('#quotation_table').length && $('#dashboard_location').length) {
            quotation_datatable.ajax.reload();
        }

    });

    //atock alert datatables
    var stock_alert_table = $('#stock_alert_table').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        searching: false,
        dom: 'Btirp',
        ajax: '/home/product-stock-alert',
        fnDrawCallback: function (oSettings) {
            __currency_convert_recursively($('#stock_alert_table'));
        },
    });
    //payment dues datatables
    var purchase_payment_dues_table = $('#purchase_payment_dues_table').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        searching: false,
        dom: 'Btirp',
        ajax: '/home/purchase-payment-dues',
        fnDrawCallback: function (oSettings) {
            __currency_convert_recursively($('#purchase_payment_dues_table'));
        },
    });

    //Sales dues datatables
    var sales_payment_dues_table = $('#sales_payment_dues_table').DataTable({
        processing: true,
        serverSide: true,
        ordering: false,
        searching: false,
        dom: 'Btirp',
        ajax: '/home/sales-payment-dues',
        fnDrawCallback: function (oSettings) {
            __currency_convert_recursively($('#sales_payment_dues_table'));
        },
    });

    //Stock expiry report table
    stock_expiry_alert_table = $('#stock_expiry_alert_table').DataTable({
        processing: true,
        serverSide: true,
        searching: false,
        dom: 'Btirp',
        ajax: {
            url: '/reports/stock-expiry',
            data: function (d) {
                d.exp_date_filter = $('#stock_expiry_alert_days').val();
            },
        },
        order: [[3, 'asc']],
        columns: [
            { data: 'product', name: 'p.name' },
            { data: 'location', name: 'l.name' },
            { data: 'stock_left', name: 'stock_left' },
            { data: 'exp_date', name: 'exp_date' },
        ],
        fnDrawCallback: function (oSettings) {
            __show_date_diff_for_human($('#stock_expiry_alert_table'));
            __currency_convert_recursively($('#stock_expiry_alert_table'));
        },
    });

    if ($('#quotation_table').length) {
        quotation_datatable = $('#quotation_table').DataTable({
            processing: true,
            serverSide: true,
            aaSorting: [[0, 'desc']],
            "ajax": {
                "url": '/sells/draft-dt?is_quotation=1',
                "data": function (d) {
                    if ($('#dashboard_location').length > 0) {
                        d.location_id = $('#dashboard_location').val();
                    }
                }
            },
            columnDefs: [{
                "targets": 4,
                "orderable": false,
                "searchable": false
            }],
            columns: [
                { data: 'transaction_date', name: 'transaction_date' },
                { data: 'invoice_no', name: 'invoice_no' },
                { data: 'name', name: 'contacts.name' },
                { data: 'business_location', name: 'bl.name' },
                { data: 'action', name: 'action' }
            ]
        });
    }

    $(".modal-backdrop").addClass("hide");
    var termsConditionNotDone = $('#termsConditionNotDone').val();
    if (termsConditionNotDone != 1) {
        $('#tandCModal').modal({ backdrop: 'static', keyboard: false }, 'show');
    }

    $("#iagree").click(function () {
        if ($(".accept_tc").prop('checked') == true) {
        } else {
            toastr.error('Please check the terms & conditions');
            return;
        }
        $.ajax({
            method: 'GET',
            url: '/home/saveAgreement',
            data: '',
            dataType: 'json',
            success: function (result) {
                if (result.success == 1) {
                    toastr.success(result.msg);
                    $('#tandCModal').modal('hide');

                } else {
                    toastr.error(result.msg);
                }
            },
        });
    });
});

function update_total_purchase(total_purchase_inc_tax, total_purchase_return_inc_tax) {
    if (typeof total_purchase_inc_tax === 'undefined') return;
    if (typeof total_purchase_return_inc_tax === 'undefined') return;
    const total_purchase = total_purchase_inc_tax - total_purchase_return_inc_tax;
    $('.total_purchase').html(__currency_trans_from_en(total_purchase, true));
}

function update_total_sell(total_sell_inc_tax, total_sell_return_inc_tax) {
    if (typeof total_sell_inc_tax === 'undefined') return;
    if (typeof total_sell_return_inc_tax === 'undefined') return;
    const total_sell = total_sell_inc_tax - total_sell_return_inc_tax;
    $('.total_sell').html(__currency_trans_from_en(total_sell, true));
}

function update_total_paid_payment(total_paid_payment, total_sell_return_inc_tax) {
    if (typeof total_paid_payment === 'undefined') return;
    if (typeof total_sell_return_inc_tax === 'undefined') return;
    const total_net_payment = total_paid_payment - total_sell_return_inc_tax;
    $('.total_paid_payment').html(__currency_trans_from_en(total_net_payment, true));
}

function update_total_return_payment(total_return_payment, total_sell_return_inc_tax) {
    if (typeof total_return_payment === 'undefined') return;
    if (typeof total_sell_return_inc_tax === 'undefined') return;
    const total_returned = total_return_payment - total_sell_return_inc_tax;
    $('.total_return_payment').html(__currency_trans_from_en(total_returned, true));
}



function update_statistics(start, end) {
    var location_id = '';
    let total_purchase_inc_tax = undefined;
    let total_purchase_return_inc_tax = undefined;
    let total_sell_inc_tax = undefined;
    let total_sell_return_inc_tax = undefined;

    if ($('#dashboard_location').length > 0) {
        location_id = $('#dashboard_location').val();
    }
    var data = { start: start, end: end, location_id: location_id };
    //get purchase details
    var loader = '<i class="fas fa-sync fa-spin fa-fw margin-bottom"></i>';
    $('.total_purchase').html(loader);
    $('.purchase_due').html(loader);
    $('.total_sell').html(loader);
    $('.total_paid_payment').html(loader);
    $('.total_return_payment').html(loader);
    $('.invoice_due').html(loader);
    $('.total_expense').html(loader);
    $.ajax({
        method: 'get',
        url: '/home/get-purchase-totals',
        dataType: 'json',
        data: data,
        success: function (data) {
            console.log(data);
            $('.purchase_due').html(__currency_trans_from_en(data.purchase_due, true));
            total_purchase_inc_tax = data.total_purchase_inc_tax;
            update_total_purchase(total_purchase_inc_tax, total_purchase_return_inc_tax)
        },
    });

    $.ajax({
        method: 'get',
        url: '/home/get-transactional-totals',
        dataType: 'json',
        data: data,
        success: function (data) {
            console.log(data);
            $('.total_expense').html(__currency_trans_from_en(data.total_expense, true));

            total_purchase_return_inc_tax = data.total_purchase_return_inc_tax;
            total_sell_return_inc_tax = data.total_sell_return_inc_tax;
            update_total_purchase(total_purchase_inc_tax, total_purchase_return_inc_tax);
            update_total_sell(total_sell_inc_tax, total_sell_return_inc_tax);

        },
    });

    $.ajax({
        method: 'get',
        url: '/home/get-sale-totals',
        dataType: 'json',
        data: data,
        success: function (data) {
            console.log(data);
            $('.invoice_due').html(__currency_trans_from_en(data.invoice_due, true));
            $('.total_paid_payment').html(__currency_trans_from_en(data.total_paid_payment, true));
            $('.total_return_payment').html(__currency_trans_from_en(data.total_return_payment, true));
            total_sell_inc_tax = data.total_sell_inc_tax;
            update_total_sell(total_sell_inc_tax, total_sell_return_inc_tax);

        },
    });

    // $.ajax({
    //     method: 'get',
    //     url: '/home/get-totals',
    //     dataType: 'json',
    //     data: data,
    //     success: function (data) {
    //         //purchase details
    //         $('.total_purchase').html(__currency_trans_from_en(data.total_purchase, true));
    //         $('.purchase_due').html(__currency_trans_from_en(data.purchase_due, true));

    //         //sell details
    //         $('.total_sell').html(__currency_trans_from_en(data.total_sell, true));
    //         $('.invoice_due').html(__currency_trans_from_en(data.invoice_due, true));
    //         //expense details
    //         $('.total_expense').html(__currency_trans_from_en(data.total_expense, true));
    //     },
    // });
}
