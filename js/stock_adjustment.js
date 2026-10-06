$(document).ready(function () {
    dateRangeSettings.startDate = moment().subtract(6, 'days');
    dateRangeSettings.endDate = moment();
    $('#stock_adjustment_list_filter_date').daterangepicker(
        dateRangeSettings,
        function(start, end) {
            $('#stock_adjustment_list_filter_date').val(start.format(moment_date_format) + ' ~ ' + end.format(
                moment_date_format));
            sell_table.ajax.reload();
        }
    );
    $('#stock_adjustment_list_filter_date').on('cancel.daterangepicker', function(ev, picker) {
        $('#stock_adjustment_list_filter_date').val('');
        sell_table.ajax.reload();
    });
    $('#stock_adjustment_list_start_time').datetimepicker({
        format: moment_time_format,
        ignoreReadonly: false,

    }).on('dp.change', function(ev) {
        sell_table.ajax.reload();
    });
    $('#stock_adjustment_list_end_time').datetimepicker({
        format: moment_time_format,
        ignoreReadonly: false,
    }).on('dp.change', function(ev) {
        sell_table.ajax.reload();
    });

    //Add products search_product_for_srock_adjustment
    if ($('#search_product_for_srock_adjustment').length > 0) {
        //Add Product
        $('#search_product_for_srock_adjustment')
            .autocomplete({
                source: function(request, response) {
                    $.getJSON(
                        '/products/list',
                        { location_id: $('#location_id').val(), term: request.term },
                        response
                    );
                },
                minLength: 2,
                response: function(event, ui) {
                    if (ui.content.length == 1) {
                        ui.item = ui.content[0];
                        if (ui.item.qty_available > 0 && ui.item.enable_stock == 1) {
                            $(this)
                                .data('ui-autocomplete')
                                ._trigger('select', 'autocompleteselect', ui);
                            $(this).autocomplete('close');
                        }
                    } else if (ui.content.length == 0) {
                        swal(LANG.no_products_found);
                    }
                },
                focus: function(event, ui) {
                    if (ui.item.qty_available <= 0) {
                        return false;
                    }
                },
                select: function(event, ui) {
                    if (ui.item.qty_available > 0) {
                        $(this).val(null);
                        stock_adjustment_product_row(ui.item.variation_id);
                    } else {
                        alert(LANG.out_of_stock);
                    }
                },
            })
            .autocomplete('instance')._renderItem = function(ul, item) {
            if (item.qty_available <= 0) {
                var string = '<li class="ui-state-disabled">' + item.name;
                if (item.type == 'variable') {
                    string += '-' + item.variation;
                }
                string += ' (' + item.sub_sku + ') (Out of stock) </li>';
                return $(string).appendTo(ul);
            } else if (item.enable_stock != 1) {
                return ul;
            } else {
                var string = '<div>' + item.name;
                if (item.type == 'variable') {
                    string += '-' + item.variation;
                }
                string += ' (' + item.sub_sku + ') </div>';
                return $('<li>')
                    .append(string)
                    .appendTo(ul);
            }
        };
    }

    
    //Add products search_product filter
    if ($('#search_product').length > 0) {
        $('#search_product').autocomplete({
            source: function (request, response) {
                $.ajax({
                    url: '/purchases/get_products?check_enable_stock=false',
                    dataType: 'json',
                    data: {
                        term: request.term,
                    },
                    success: function (data) {
                        response(
                            $.map(data, function (v, i) {
                                if (v.variation_id) {
                                    return { label: v.text, value: v.variation_id };
                                }
                                return false;
                            })
                        );
                    },
                });
            },
            minLength: 2,
            select: function (event, ui) {
                $('#variation_id')
                    .val(ui.item.value)
                    .change();
                event.preventDefault();
                $(this).val(ui.item.label);
            },
            focus: function (event, ui) {
                event.preventDefault();
                $(this).val(ui.item.label);
            },
        });
    }

    $('select#location_id').change(function() {
        if ($(this).val()) {
            $('#search_product_for_srock_adjustment').removeAttr('disabled');
        } else {
            $('#search_product_for_srock_adjustment').attr('disabled', 'disabled');
        }
        $('table#stock_adjustment_product_table tbody').html('');
        $('#product_row_index').val(0);
        update_table_total();
    });

    $(document).on('change', 'input.product_quantity', function() {
        update_table_row($(this).closest('tr'));
    });
    $(document).on('change', 'input.product_unit_price', function() {
        update_table_row($(this).closest('tr'));
    });

    $(document).on('click', '.remove_product_row', function() {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(willDelete => {
            if (willDelete) {
                $(this)
                    .closest('tr')
                    .remove();
                update_table_total();
            }
        });
    });

    $('#stock_adjustments_form #search_product').keyup(function () {
        if (
            $(this)
                .val()
                .trim() == ''
        ) {
            $('#stock_adjustments_form #variation_id')
                .val('')
                .change();
        }
    });

    $('#stock_adjustments_form #variation_id, #stock_adjustments_form #location_id,  #stock_adjustments_form #adjustment_type,  #stock_adjustments_form #product_list_filter_category_id').change(function () {
        stock_adjustment_table.ajax.reload();
        stock_adjustment_report_table.ajax.reload();
        updateStockAdjustmentReport();
    });
     //Product Sell Report
    if ($('#stock_adjustment_list_filter_date').length == 1) {
        $('#stock_adjustment_list_filter_date').daterangepicker(
            dateRangeSettings,
            function (start, end) {
                $('#stock_adjustment_list_filter_date').val(
                    start.format(moment_date_format) + ' ~ ' + end.format(moment_date_format)
                );
                stock_adjustment_table.ajax.reload();
                stock_adjustment_report_table.ajax.reload();
                
            }
        );
        $('#stock_adjustment_list_filter_date').on('cancel.daterangepicker', function (ev, picker) {
            $('#stock_adjustment_list_filter_date').val('');
            stock_adjustment_table.ajax.reload();
            stock_adjustment_report_table.ajax.reload();
        });

        $('#stock_adjustment_list_start_time, #stock_adjustment_list_end_time').datetimepicker({
            format: moment_time_format,
            ignoreReadonly: true,
        }).on('dp.change', function (ev) {
            stock_adjustment_table.ajax.reload();
            stock_adjustment_report_table.ajax.reload();
        });
        updateStockAdjustmentReport();
    }

   

    function updateStockAdjustmentReport() {
        var location_id = $('#location_id').val();
        var adjustment_type = $('#adjustment_type').val();
        var variation_id = $('#variation_id').val();
        var start = $('#stock_adjustment_list_filter_date')
            .data('daterangepicker')
            .startDate.format('YYYY-MM-DD');
        var end = $('#stock_adjustment_list_filter_date')
            .data('daterangepicker')
            .endDate.format('YYYY-MM-DD');
        var data = { start_date_stock: start, end_date_stock: end, location_id: location_id,variation_id:variation_id,adjustment_type:adjustment_type };
        var loader = __fa_awesome();
        $('.total_amount').html(loader);
        $('.total_recovered').html(loader);
        $('.total_normal').html(loader);
        $('.total_abnormal').html(loader);
        $('.total_wastage').html(loader);
        $('.total_damage').html(loader);
        $('.total_shortage').html(loader);
        $.ajax({
            method: 'GET',
            url: '/reports/stock-adjustment-report',
            dataType: 'json',
            data: data,
            success: function (data) {
                $('.total_amount').html(__currency_trans_from_en(data.total_amount, true));
                $('.total_recovered').html(__currency_trans_from_en(data.total_recovered, true));
                $('.total_normal').html(__currency_trans_from_en(data.total_normal, true));
                $('.total_abnormal').html(__currency_trans_from_en(data.total_abnormal, true));
                $('.total_wastage').html(__currency_trans_from_en(data.total_wastage, true));
                $('.total_damage').html(__currency_trans_from_en(data.total_damage, true));
                $('.total_shortage').html(__currency_trans_from_en(data.total_shortage, true));
            },
        });
    }

    //Date picker
    $('#transaction_date').datetimepicker({
        format: moment_date_format + ' ' + moment_time_format,
        ignoreReadonly: true,
    });

    $('form#stock_adjustment_form').validate();
    stock_adjustment_table = $('#stock_adjustment_table').DataTable({
        processing: true,
        serverSide: true,
        //ajax: '/stock-adjustments',
        ajax: {
            url: '/stock-adjustments',
            data: function (d) {
                var start = '';
                var end = '';
                var start_time = $('#stock_adjustment_list_start_time').val();
                var end_time = $('#stock_adjustment_list_end_time').val();

                if ($('#stock_adjustment_list_filter_date').val()) {
                    start = $('input#stock_adjustment_list_filter_date')
                        .data('daterangepicker')
                        .startDate.format('YYYY-MM-DD');

                    start = moment(start + " " + start_time, "YYYY-MM-DD" + " " + moment_time_format).format('YYYY-MM-DD HH:mm');
                    end = $('input#stock_adjustment_list_filter_date')
                        .data('daterangepicker')
                        .endDate.format('YYYY-MM-DD');
                    end = moment(end + " " + end_time, "YYYY-MM-DD" + " " + moment_time_format).format('YYYY-MM-DD HH:mm');
                }
                d.start_date = start;
                d.end_date = end;
                d.adjustment_type = $('#adjustment_type').val();
                d.variation_id = $('#variation_id').val();
                d.location_id = $('select#location_id').val();
                d.category_id = $('select#product_list_filter_category_id').val();
            },
        },
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                searchable: false,
            },
        ],
        aaSorting: [[1, 'desc']],
        columns: [
            { data: 'action', name: 'action' },
            { data: 'transaction_date', name: 'transaction_date' },
            { data: 'ref_no', name: 'ref_no' },
            { data: 'location_name', name: 'BL.name' },
            { data: 'adjustment_type', name: 'adjustment_type' },
            { data: 'final_total', name: 'final_total' },
            { data: 'total_amount_recovered', name: 'total_amount_recovered' },
            { data: 'additional_notes', name: 'additional_notes' },
            { data: 'added_by', name: 'u.first_name' },
        ],
        fnDrawCallback: function(oSettings) {
            __currency_convert_recursively($('#stock_adjustment_table'));
        },
    });

     stock_adjustment_report_table = $('#stock_adjustment_report_table').DataTable({
        processing: true,
        serverSide: true,
        //ajax: '/stock-adjustments',
        ajax: {
             url: '/reports/stock-adjustment-report-detail',
            data: function (d) {
                var start = '';
                var end = '';
                var start_time = $('#stock_adjustment_list_start_time').val();
                var end_time = $('#stock_adjustment_list_end_time').val();

                if ($('#stock_adjustment_list_filter_date').val()) {
                    start = $('input#stock_adjustment_list_filter_date')
                        .data('daterangepicker')
                        .startDate.format('YYYY-MM-DD');

                    start = moment(start + " " + start_time, "YYYY-MM-DD" + " " + moment_time_format).format('YYYY-MM-DD HH:mm');
                    end = $('input#stock_adjustment_list_filter_date')
                        .data('daterangepicker')
                        .endDate.format('YYYY-MM-DD');
                    end = moment(end + " " + end_time, "YYYY-MM-DD" + " " + moment_time_format).format('YYYY-MM-DD HH:mm');
                }
                d.start_date = start;
                d.end_date = end;
                d.adjustment_type = $('#adjustment_type').val();
                d.variation_id = $('#variation_id').val();
                d.location_id = $('select#location_id').val();
                d.category_id = $('select#product_list_filter_category_id').val();
            },
        },
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                searchable: false,
            },
        ],
        aaSorting: [[0, 'desc']],
        columns: [
            { data: 'transaction_date', name: 'transaction_date' },
            { data: 'ref_no', name: 'ref_no' },
            { data: 'location_name', name: 'BL.name' },
            { data: 'adjustment_type', name: 'adjustment_type' },
            { data: 'final_total', name: 'final_total' },
            { data: 'total_amount_recovered', name: 'total_amount_recovered' },
            { data: 'additional_notes', name: 'additional_notes' },
            { data: 'added_by', name: 'u.first_name' },
        ],
        fnDrawCallback: function(oSettings) {
            __currency_convert_recursively($('#stock_adjustment_report_table'));
        },
    });
    var detailRows = [];

    $(document).on('click', 'button.delete_stock_adjustment', function() {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(willDelete => {
            if (willDelete) {
                var href = $(this).data('href');
                $.ajax({
                    method: 'DELETE',
                    url: href,
                    dataType: 'json',
                    success: function(result) {
                        if (result.success) {
                            toastr.success(result.msg);
                            stock_adjustment_table.ajax.reload();
                        } else {
                            toastr.error(result.msg);
                        }
                    },
                });
            }
        });
    });
});

function stock_adjustment_product_row(variation_id) {
    var row_index = parseInt($('#product_row_index').val());
    var location_id = $('select#location_id').val();
    $.ajax({
        method: 'POST',
        url: '/stock-adjustments/get_product_row',
        data: { row_index: row_index, variation_id: variation_id, location_id: location_id },
        dataType: 'html',
        success: function(result) {
            $('table#stock_adjustment_product_table tbody').append(result);
            update_table_total();
            $('#product_row_index').val(row_index + 1);
        },
    });
}

function update_table_total() {
    var table_total = 0;
    $('table#stock_adjustment_product_table tbody tr').each(function() {
        var this_total = parseFloat(__read_number($(this).find('input.product_line_total')));
        if (this_total) {
            table_total += this_total;
        }
    });
    $('input#total_amount').val(table_total);
    $('span#total_adjustment').text(__number_f(table_total));
}

function update_table_row(tr) {
    var quantity = parseFloat(__read_number(tr.find('input.product_quantity')));
    var unit_price = parseFloat(__read_number(tr.find('input.product_unit_price')));
    var row_total = 0;
    if (quantity && unit_price) {
        row_total = quantity * unit_price;
    }
    tr.find('input.product_line_total').val(__number_f(row_total));
    update_table_total();
}

$(document).on('shown.bs.modal', '.view_modal', function() {
    __currency_convert_recursively($('.view_modal'));
});
