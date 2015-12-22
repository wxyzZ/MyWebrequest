// Generated by CoffeeScript 1.10.0
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

define(function(require) {
  var UNION_PAGES, addRule, checkCustomRule, collection, initSection, isSafe4Qr, isUnionCat, modal, removeRule, resetSectionCtrlsState, tpl, utils, vars;
  utils = require('common/js/utils');
  collection = require('common/js/collection');
  modal = require('js/component');
  tpl = require('js/tpl');
  vars = require('js/vars');
  UNION_PAGES = ['block', 'hotlink', 'hsts', 'log', 'custom'];
  isUnionCat = function(cat) {
    var ref;
    return ref = (cat || '').replace('#', ''), indexOf.call(UNION_PAGES, ref) >= 0;
  };
  isSafe4Qr = function(cat, host) {
    var str;
    if (cat !== 'block') {
      return true;
    }
    str = host.replace(/\./g, '\\.').replace('*', '.*');
    return !(new RegExp('^' + str + '$')).test(vars.QR_API_HOST);
  };

  /**
   * toggle enable state of section of cat( category )
   * @param  {String} cat
   */
  resetSectionCtrlsState = function(cat) {
    var $switch, $tbody, $thead, ruleNum, switchEnabled;
    $thead = $('#request-settings thead');
    $tbody = $('#request-settings tbody');
    ruleNum = $tbody.find('tr:not([nodata])').length;
    $switch = $('#request-settings .switch-input');
    switchEnabled = collection.getSwitch(cat);
    $switch.prop({
      'checked': switchEnabled && !!ruleNum,
      'disabled': !ruleNum
    });
    $('#request-settings .enable-tip').prop('hidden', !!ruleNum);
    $thead.find('input, button').prop('disabled', !ruleNum);
    $('#request-settings .rule-cunt-num').text(ruleNum);
    $thead.find('input').prop('checked', ruleNum && ruleNum === $tbody.find('tr input:checked').length);
  };
  removeRule = function(cat, $trs) {
    var $tbody, isRemoveAll, rules;
    $tbody = $('#request-settings tbody');
    if (!$trs) {
      $trs = $tbody.find('input:checked').parents('tr');
    }
    if (!$trs.length) {
      return;
    }
    rules = $trs.find('input').map(function() {
      return this.value;
    }).get();
    isRemoveAll = rules.length === $tbody.find('tr').length;
    collection.removeRule(cat, rules);
    $trs.addClass('fadeOutDown');
    setTimeout(function() {
      $trs.remove();
      if (isRemoveAll) {
        $tbody.html(tpl.nodataTpl);
      }
      resetSectionCtrlsState(cat);
    }, 200);
  };
  addRule = function(cat, rule) {
    var $tbody, $tr, noRule;
    $tbody = $('#request-settings tbody');
    $tr = $(tpl.rulesTpl([rule]));
    $tr.addClass('new-item');
    noRule = !$tbody.find('tr:not([nodata])').length;
    $tbody[noRule ? 'html' : 'prepend']($tr);
    $('.rule-field input').val('');
    $('#host').focus();
    collection.addRule(cat, rule);
    resetSectionCtrlsState(cat);
    setTimeout(function() {
      $tr.removeClass('new-item');
    }, 600);
  };

  /**
   * init section of cat( category )
   * @param  {String} cat
   */
  initSection = function(cat) {
    var hasRule, html, isCustom, isHsts, rules;
    rules = collection.getRules(cat);
    isCustom = cat === 'custom';
    $('#request-settings .js-custom').prop('hidden', !isCustom);
    $('#request-settings .js-not-custom').prop('hidden', isCustom);
    rules.reverse();
    $('#fun-name').text($("#nav a[href^=#" + cat + "]").text());
    $('#fun-desc').text(utils.i18n("opt_" + cat + "_desc"));
    hasRule = !!rules.length;
    isHsts = cat === 'hsts';
    if (hasRule) {
      html = tpl.rulesTpl(rules);
    } else {
      html = tpl.nodataTpl;
      collection.setSwitch(cat, false);
    }
    $('#request-settings tbody').html(html);
    resetSectionCtrlsState(cat);
    $('#request-settings').attr('data-id', cat);
    setTimeout(function() {
      $('#request-settings').find('input:text:enabled:visible:first').focus();
    }, 300);
    $('#protocol').val(isHsts ? 'http' : '*').attr('disabled', isHsts);
  };
  $('#request-settings .switch-input').on('change', function(e) {
    var cat;
    cat = $('#request-settings').attr('data-id');
    collection.setSwitch(cat, this.checked);
  });
  $('#host').on('keyup', function(e) {
    var $path;
    if (e.keyCode === 13) {
      $path = $('#path');
      if ($path.val() === '') {
        $path.focus();
      } else {
        $(this).parents('.rule-field').find('.add-rule').click();
      }
    }
  });
  $('#host').on('paste', function(e) {
    var url;
    url = utils.getUrlFromClipboard(e);
    if (!(url.protocol && utils.isProtocol(url.protocol))) {
      return true;
    }
    if (!$('#protocol').prop('disabled')) {
      $('#protocol').val(url.protocol);
    }
    $('#host').val(url.host);
    $('#path').val(url.path.replace(/^\//, ''));
    return false;
  });
  $('#path').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $(this).parents('.rule-field').find('.add-rule').click();
      return false;
    }
  });
  $('.rule-field').on('click', '.add-rule', function(e) {
    var $host, $path, $protocol, cat, data, eMsg, rule;
    cat = $('#request-settings').attr('data-id');
    $protocol = $('#protocol');
    $host = $("#host");
    $path = $("#path");
    data = {
      protocol: $protocol.val().trim(),
      host: $host.val().trim().toLowerCase(),
      path: $path.val().trim()
    };
    if (!utils.isProtocol(data.protocol)) {
      modal.showTip($protocol, utils.i18n('opt_errtip_protocol'));
      return false;
    }
    if (!(data.host && (utils.isIp(data.host) || utils.isHost(data.host)))) {
      modal.showTip($host, utils.i18n('opt_errtip_host'));
      return false;
    }
    if (data.path === '') {
      data.path = '*';
    }
    if (!(data.path && utils.isPath(data.path))) {
      modal.showTip($path, utils.i18n('opt_errtip_path'));
      return false;
    }
    rule = data.protocol + "://" + data.host + "/" + data.path;
    if (rule.length > 500) {
      modal.showTip($host, utils.i18n('opt_errtip_rulelong'));
      return false;
    }
    if (~collection.indexOfRule(cat, rule)) {
      modal.showTip($host, utils.i18n('opt_errtip_duplicate'));
      return false;
    }
    if (data.host === '*') {
      if (['block', 'hsts'].indexOf(cat) !== -1) {
        eMsg = 'opt_errdlg_cstarqr';
      } else {
        eMsg = 'opt_errdlg_cstar';
      }
    } else {
      if (!isSafe4Qr(cat, data.host)) {
        eMsg = 'opt_errdlg_cqr';
      }
    }
    if (eMsg) {
      modal.showDlg({
        title: utils.i18n('opt_errdlg_title'),
        content: utils.i18n(eMsg),
        callback: addRule,
        cbargs: [cat, rule]
      });
      return;
    } else {
      addRule(cat, rule);
    }
  });
  $('#request-settings .multi-delete').on('click', function(e) {
    var cat, len;
    cat = $('#request-settings').attr('data-id');
    len = $(this).parents('table').find('tbody input:checked').length;
    if (len) {
      modal.showDlg({
        title: utils.i18n('opt_deldlg_title'),
        content: utils.i18n('opt_deldlg_content').replace('xx', len),
        callback: removeRule,
        cbargs: [cat]
      });
    } else {
      modal.showTip(this, utils.i18n('opt_errtip_nochose'));
      return false;
    }
  });
  $('#request-settings tbody').on('click', '.delete', function(e) {
    var $tr, cat;
    $tr = $(this).parents('tr');
    cat = $('#request-settings').attr('data-id');
    removeRule(cat, $tr);
  });
  $('#check-all-rules').on('change', function(e) {
    var $table, $this, checked;
    $this = $(this);
    checked = $this.prop('checked');
    $table = $this.parents('.rules');
    $table.find('tbody input[type="checkbox"]').prop('checked', checked);
    $table.find('tbody tr')[checked ? 'addClass' : 'removeClass']('checked');
  });
  $('#request-settings tbody').on('change', 'input[type="checkbox"]', function(e) {
    var $checkAll, $tbody, $this, $tr;
    $this = $(this);
    $tr = $this.parents('tr');
    $tbody = $this.parents('tbody');
    $checkAll = $('#check-all-rules');
    if ($this.prop('checked')) {
      $tr.addClass('checked');
      if ($tbody.find('tr').length === $tbody.find('input:checked').length) {
        $checkAll.prop('checked', true);
      }
    } else {
      $tr.removeClass('checked');
      $checkAll.prop('checked', false);
    }
  });
  $('#host-c').on('paste', function(e) {
    var url;
    url = utils.getUrlFromClipboard(e);
    if (!(url.protocol && utils.isProtocol(url.protocol))) {
      return true;
    }
    if (!$('#protocol').prop('disabled')) {
      $('#protocol-c').val(url.protocol);
    }
    $('#host-c').val("" + url.host + url.path);
    return false;
  });
  $('#host-c').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#redirect-url-input').focus();
      return false;
    }
  });
  $('#redirect-url-input').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#test-url-input').focus();
      return false;
    }
  });
  $('#test-url-input').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#test-url-btn').click();
      return false;
    }
  });

  /**
   * Test the custom rule with a real url
   * if pass return the rule object or nothing
   */
  checkCustomRule = function() {
    var $host, $protocol, $redirectUrl, $testUrl, host, matchUrl, protocol, redirectUrl, ret, router, testUrl;
    $protocol = $('#protocol-c');
    $host = $('#host-c');
    $redirectUrl = $('#redirect-url-input');
    $testUrl = $('#test-url-input');
    protocol = $protocol.val();
    host = $host.val();
    redirectUrl = $redirectUrl.val();
    testUrl = $testUrl.val();
    matchUrl = protocol + '://' + host;
    if (!utils.isProtocol(protocol)) {
      modal.showTip($protocol, utils.i18n('opt_errtip_protocol'));
      return;
    }
    if (false === utils.isRouterStrValid(matchUrl)) {
      alert('match rule not valid');
      return;
    }
    router = utils.getRouter(matchUrl);
    if (ret = utils.hasReservedWord(router)) {
      alert('reserved keywords found in the router: ' + ret.join(','));
      return;
    }
    console.log('router: %o', router);
    if (ret = utils.hasUndefinedWord(router, redirectUrl)) {
      alert('undefined keywords found in the redirect url: ' + ret.join(','));
      return;
    }
    if (!testUrl) {
      alert('test url need be filled');
      return;
    }
    $('#custom-test-result').text(utils.getTargetUrl(matchUrl, redirectUrl, testUrl));
    return {
      url: '',
      matchUrl: '',
      redirectUrl: ''
    };
  };
  $('#test-url-btn').on('click', function(e) {
    return checkCustomRule();
  });
  return {
    init: initSection,
    isUnionCat: isUnionCat
  };
});


//# sourceMappingURL=union-page.js.map