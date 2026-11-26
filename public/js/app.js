$(function () {
  function formatINR(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  // Initialize generic DataTables
  $('table.datatable').each(function () {
    const $table = $(this);
    if ($.fn.DataTable.isDataTable($table)) return;

    const orderCol = $table.data('order-col');
    const orderDir = $table.data('order-dir') || 'asc';

    $table.DataTable({
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      order: orderCol !== undefined ? [[Number(orderCol), orderDir]] : [],
      language: {
        search: 'Search:',
        searchPlaceholder: 'Type to filter...',
      },
    });
  });

  // Stock DataTable with live filtered footer total
  const $stockTable = $('#stockTable');
  if ($stockTable.length && !$.fn.DataTable.isDataTable($stockTable)) {
    $stockTable.DataTable({
      pageLength: 25,
      lengthMenu: [10, 25, 50, 100],
      order: [[3, 'asc'], [0, 'asc']],
      footerCallback: function () {
        const api = this.api();
        let filteredTotal = 0;
        let filteredCount = 0;

        api.rows({ search: 'applied' }).every(function () {
          const rowNode = this.node();
          const val = Number($(rowNode).data('cost')) || 0;
          filteredTotal += val;
          filteredCount += 1;
        });

        $('#stockFilteredCount').text(filteredCount);
        $('#stockFilteredTotal').text(formatINR(filteredTotal));
      },
    });
  }

  // Edit Employee modal binding
  $(document).on('click', '.btn-edit-employee', function () {
    const btn = $(this);
    const id = btn.data('id');
    $('#editEmployeeForm').attr('action', '/employees/' + id);
    $('#editEmpCode').val(btn.data('code'));
    $('#editEmpFirstName').val(btn.data('firstname'));
    $('#editEmpLastName').val(btn.data('lastname'));
    $('#editEmpEmail').val(btn.data('email'));
    $('#editEmpPhone').val(btn.data('phone') || '');
    $('#editEmpDepartment').val(btn.data('department'));
    $('#editEmpDesignation').val(btn.data('designation') || '');
    $('#editEmpBranch').val(btn.data('branch'));
    $('#editEmpStatus').val(btn.data('status'));
    $('#editEmpJoinedDate').val(btn.data('joineddate') || '');
  });

  // Edit Category modal binding
  $(document).on('click', '.btn-edit-category', function () {
    const btn = $(this);
    const id = btn.data('id');
    $('#editCategoryForm').attr('action', '/categories/' + id);
    $('#editCatCode').val(btn.data('code'));
    $('#editCatName').val(btn.data('name'));
    $('#editCatDescription').val(btn.data('description') || '');
    $('#editCatActive').prop('checked', btn.data('active') === true || btn.data('active') === 'true');
  });

  // Edit Asset modal binding
  $(document).on('click', '.btn-edit-asset', function () {
    const btn = $(this);
    const id = btn.data('id');
    $('#editAssetForm').attr('action', '/assets/' + id);
    $('#editAssetTag').val(btn.data('tag'));
    $('#editAssetSerial').val(btn.data('serial'));
    $('#editAssetCategory').val(btn.data('categoryid'));
    $('#editAssetBranch').val(btn.data('branch'));
    $('#editAssetMake').val(btn.data('make'));
    $('#editAssetModel').val(btn.data('model'));
    $('#editAssetPurchaseDate').val(btn.data('purchasedate'));
    $('#editAssetPurchaseCost').val(btn.data('purchasecost'));
    $('#editAssetWarranty').val(btn.data('warranty') || '');
    $('#editAssetNotes').val(btn.data('notes') || '');
  });

  // Return page quick-select & custom reason toggle
  $(document).on('click', '.btn-select-return', function () {
    const assetId = $(this).data('assetid');
    const branch = $(this).data('branch');
    $('#returnAssetId').val(assetId).trigger('change');
    if (branch) {
      $('#returnBranch').val(branch);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#returnReason').on('change', function () {
    if ($(this).val() === 'Other') {
      $('#customReasonWrap').removeClass('d-none');
    } else {
      $('#customReasonWrap').addClass('d-none');
    }
  });

  // Scrap page quick-select
  $(document).on('click', '.btn-select-scrap', function () {
    $('#scrapAssetId').val($(this).data('assetid'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // History asset selector jump
  $('#historyAssetPicker').on('change', function () {
    const assetId = $(this).val();
    if (assetId) {
      window.location.href = '/history/' + assetId;
    }
  });
});
