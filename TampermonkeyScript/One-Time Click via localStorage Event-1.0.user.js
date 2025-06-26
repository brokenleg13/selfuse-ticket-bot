// ==UserScript==
// @name         One-Time Click via localStorage Event
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  通过设置 localStorage CLICK_NOW=YES 来点击一次按钮
// @match        http*://*.yes24.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 监听 localStorage 改变事件
    window.addEventListener("storage", (event) => {
        if (event.key === "CLICK_NOW" && event.newValue === "YES") {
            // 尝试点击按钮
            const btn = document.querySelector('img.booking[src*="btn_booking2.gif"]');
            if (btn) {
                btn.click();
                console.log("✅ 已点击按钮");
            } else {
                console.log("❌ 未找到按钮");
            }

            // 清除标志，避免重复触发
            localStorage.removeItem("CLICK_NOW");
        }
    });
})();
