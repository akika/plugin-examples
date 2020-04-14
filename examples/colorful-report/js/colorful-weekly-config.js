/*
 * colorful-report Plug-in
 * Copyright (c) 2016 Cybozu
 *
 * Licensed under the MIT License
 */
jQuery.noConflict();
(function($, PLUGIN_ID) {
    'use strict';
    $(document).ready(function() {
        var terms = {
            'ja': {
                'view_title': '色をつける一覧の名前',
                'view_settingButton':'一覧設定ボタン',
                'view_table': '一覧の項目設定(初期設定)',
                'view_note': '初期設定が未完了です。一覧の名前を入力後一覧設定ボタンを押して初期設定を完了してください。',
                'meeting_day': '定例MTG開催曜日',
                'meeting_day_indefinite': '不定',
                'meeting_day_monday': '毎週月曜日',
                'meeting_day_tuesday': '毎週火曜日',
                'meeting_day_wednesday': '毎週水曜日',
                'meeting_day_thursday': '毎週木曜日',
                'meeting_day_friday': '毎週金曜日',
                'report_title': '週報のタイトル用フィールドを選んでください',
                'report_title_note': '※文字列(1行)フィールドのみ対象です',
                'meeting_day_field': '開催日用フィールドを選んでください',
                'meeting_day_field_note': '※日付フィールドのみ対象です',
                'colorSetting_title': 'ハイライトする行に含める文字とハイライト色を指定してください',
                'colorSetting_text' : '文字列',
                'colorSetting_color': '色',
                'save_button': '保存する',
                'cancel_button': 'キャンセル'

            },
            'zh': {
                'view_title': '要设置颜色的列表',
                'view_settingButton':'设置列表',
                'view_table': '设置列表各项(初始设置)',
                'view_note': '初始设置未完成，请输入列表名称并点击右边的设置按钮。',
                'meeting_day': '定理会的开会日期',
                'meeting_day_indefinite': '不确定',
                'meeting_dayvmonday': '每周一',
                'meeting_day_tuesday': '每周二',
                'meeting_day_wednesday': '每周三',
                'meeting_day_thursday': '每周四',
                'meeting_day_friday': '每周五',
                'report_title': '请选择要作为周报标题的字段',
                'report_title_note': '※仅可选择单行文本框',
                'meeting_day_field': '请选择开会日期字段',
                'meeting_day_field_note': '※仅可选择日期字段',
                'colorSetting_title': '请输入标识字符。含有该字符的行将高亮显示。并请在右边输入要显示的颜色',
                'colorSetting_text' : '标识字符',
                'colorSetting_color': '颜色',
                'save_button': '保存',
                'cancel_button': '取消'
            }
        };
        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang]:terms['ja'];
        var configHtml = $('#kintone-colorful-plugin').html();
        var tmpl = $.templates(configHtml);
        $('div#kintone-colorful-plugin').html(tmpl.render({'terms':i18n}));

        var kFields = [];
        var viewNum = 0;
        // set plug-in ID.
        var KEY = PLUGIN_ID;
        var appId = kintone.app.getId();
        var config = kintone.plugin.app.getConfig(KEY);
        kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {app: appId}).then(function(resp) {
            var $op;
            var respKeys = Object.keys(resp.properties);
            for (var i = 0; i < respKeys.length; i++) {
                var prop = resp.properties[respKeys[i]];
                // set field for title.
                if (prop.type === 'SINGLE_LINE_TEXT') {
                    $op = $('<option>', {
                        value: prop.code
                    }).append(
                        '<span>' + prop.label + '(' + prop.code + ')</span>'
                    );
                    $('#title-field').append($op);
                } else if (prop.type === 'DATE') {
                    $op = $('<option>', {
                        value: prop.code
                    }).append(
                        '<span>' + prop.label + '(' + prop.code + ')</span>'
                    );
                    $('#kaisai-date').append($op);
                }
            }
        }).then(function() {
            // if exist setting.
            if (config) {
                $('#view-id').val(config['viewId']);
                $('#set-day').val(config['theDate']);
                $('#title-field').val(config['titleField']);
                $('#kaisai-date').val(config['kaisaiDate']);
                $('#highlight-st').val(config['highlightSt']);
                $('#highlight-co').val(config['highlightCo']);
                viewNum = Object.keys(config).length - 6;
                if (viewNum > 0) {
                    $('.default-noset').remove();
                    var $createTable = $('<table>', {
                        border: 1,
                        id: 'viewTable'
                    });
                    for (var i = 0; i < viewNum; i++) {
                        $createTable.append($('<th>').text(config['viewName' + (i + 1)]));
                        kFields.push(config['viewName' + (i + 1)]);
                    }
                    $createTable.appendTo($('.viewSettingTable'));
                }
            }
            // if push the button for setting of view details.
            $('#getViewSetting').click(function() {
                var $table = $('<table>', {
                    border: 1,
                    id: 'viewTable'
                });
                if (kFields.length > 0) {
                    kFields = [];
                }
                if ($('#viewTable')) {
                    $('#viewTable').remove();
                }
                var viewName = $('#view-id').val();
                kintone.api(kintone.api.url('/k/v1/app/views', true), 'GET', {app: appId}).then(function(viewResp) {
                    if (viewResp['views'][viewName]) {
                        for (var j = 0; j < viewResp['views'][viewName]['fields'].length; j++) {
                            kFields.push(viewResp['views'][viewName]['fields'][j]);
                            $table.append($('<th>').text(viewResp['views'][viewName]['fields'][j]));
                        }
                        $('.default-noset').remove();
                    }
                    $table.appendTo($('.viewSettingTable'));
                }, function(err) {
                    alert('一覧の取得に失敗しました。\n' + err.message);
                });
            });
            // if push the button for submit.
            $('#submit').click(function() {
                var conf = [];
                var viewId = $('#view-id').val();
                var theDate = $('#set-day').val();
                var titleField = $('#title-field').val();
                var kaisaiDate = $('#kaisai-date').val();
                var highlightSt = $('#highlight-st').val();
                var highlightCo = $('#highlight-co').val();
                if (viewId === '' || theDate === '' || titleField === '' || kaisaiDate === '') {
                    alert('必須項目が入力されていません');
                    return;
                }
                conf['viewId'] = viewId;
                conf['theDate'] = theDate;
                conf['titleField'] = titleField;
                conf['kaisaiDate'] = kaisaiDate;
                conf['highlightSt'] = highlightSt;
                conf['highlightCo'] = highlightCo;
                viewNum = Object.keys(conf).length - 6;
                if (kFields.length > 0) {
                    for (var k = 0; k < kFields.length; k++) {
                        conf['viewName' + (k + 1)] = kFields[k];
                    }
                }
                kintone.plugin.app.setConfig(conf);
            });
            $('#cancel').click(function() {
                history.back();
            });
        });
    });
})(jQuery, kintone.$PLUGIN_ID);
