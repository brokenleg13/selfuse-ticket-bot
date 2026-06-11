// ==UserScript==
// @name         屏蔽 ticket 弹窗
// @namespace    selfuse-ticket-bot
// @version      1.1
// @description  屏蔽票务站点的 alert / confirm / prompt / beforeunload 弹窗
// @author       selfuse-ticket-bot
// @match        *://ticket.yes24.com/*
// @match        *://tkglobal.melon.com/*
// @match        *://world.nol.com/*
// @match        *://gpoticket.globalinterpark.com/*
// @match        *://*.thaiticketmajor.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const injected = document.createElement('script');
    injected.textContent = `(${function() {
        'use strict';

        const FLAG = '__ticketBotPopupBlockerInstalled';
        if (window[FLAG]) {
            return;
        }
        window[FLAG] = true;

        const log = (type, message) => {
            try {
                console.log('[TicketBot 屏蔽弹窗]', type, message == null ? '' : message);
            } catch (error) {
                // ignore console failures
            }
        };

        const handlers = {
            alert(message) {
                log('alert', message);
                return undefined;
            },
            confirm(message) {
                log('confirm', message);
                return true;
            },
            prompt(message, defaultText) {
                log('prompt', message);
                return defaultText || '';
            },
        };

        function definePopupHandler(name, handler) {
            try {
                Object.defineProperty(window, name, {
                    configurable: true,
                    enumerable: true,
                    writable: false,
                    value: handler,
                });
            } catch (error) {
                try {
                    window[name] = handler;
                } catch (assignError) {
                    // ignore read-only windows
                }
            }
        }

        function installPopupHandlers() {
            definePopupHandler('alert', handlers.alert);
            definePopupHandler('confirm', handlers.confirm);
            definePopupHandler('prompt', handlers.prompt);
        }

        function blockBeforeUnload(event) {
            log('beforeunload', '');
            event.preventDefault = function() {};
            event.returnValue = undefined;
            event.stopImmediatePropagation();
            return undefined;
        }

        installPopupHandlers();
        window.addEventListener('beforeunload', blockBeforeUnload, true);

        try {
            Object.defineProperty(window, 'onbeforeunload', {
                configurable: true,
                enumerable: true,
                get() {
                    return null;
                },
                set(handler) {
                    log('onbeforeunload', handler && (handler.name || 'handler'));
                },
            });
        } catch (error) {
            window.onbeforeunload = null;
        }

        // Some ticket pages overwrite alert after loading their own scripts.
        // Reinstall a few times so late assignments are neutralized too.
        let reinstallCount = 0;
        const reinstallTimer = window.setInterval(() => {
            installPopupHandlers();
            reinstallCount += 1;
            if (reinstallCount >= 20) {
                window.clearInterval(reinstallTimer);
            }
        }, 500);
    }.toString()})();`;

    (document.documentElement || document.head || document).appendChild(injected);
    injected.remove();
})();
