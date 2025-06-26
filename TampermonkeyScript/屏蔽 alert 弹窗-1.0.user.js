// ==UserScript==
// @name         屏蔽 alert 弹窗
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  屏蔽 ticket.yes24.com 的 alert 弹窗
// @author       YourName
// @match        *://ticket.yes24.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 屏蔽 alert
    window.alert = function(message) {
        console.log('[拦截 alert]', message);
    };

    // 可选：屏蔽 confirm（确认框）
    window.confirm = function(message) {
        console.log('[拦截 confirm]', message);
        return true; // 始终“确定”
    };

    // 可选：屏蔽 prompt（输入框）
    window.prompt = function(message, defaultText) {
        console.log('[拦截 prompt]', message);
        return defaultText || '';
    };
})();
