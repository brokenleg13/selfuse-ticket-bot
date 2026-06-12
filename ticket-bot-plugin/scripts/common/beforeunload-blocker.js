(function() {
    const FLAG = "__ticketBotBeforeUnloadBlockerInstalled";
    if (window[FLAG]) {
        return;
    }
    window[FLAG] = true;

    const log = message => {
        try {
            console.log(`[TicketBot beforeunload] ${message}`);
        } catch (error) {
            // ignore console failures
        }
    };

    const blockedHandler = null;
    const nativeAddEventListener = EventTarget.prototype.addEventListener;
    const popupHandlers = {
        alert(message) {
            log(`Blocked alert: ${message == null ? "" : String(message)}`);
            return undefined;
        },
        confirm(message) {
            log(`Blocked confirm: ${message == null ? "" : String(message)}`);
            return true;
        },
        prompt(message, defaultText) {
            log(`Blocked prompt: ${message == null ? "" : String(message)}`);
            return defaultText || "";
        },
    };

    function defineLockedValue(target, name, value) {
        try {
            Object.defineProperty(target, name, {
                configurable: false,
                enumerable: true,
                writable: false,
                value,
            });
            return true;
        } catch (error) {
            try {
                target[name] = value;
                return true;
            } catch (assignError) {
                return false;
            }
        }
    }

    function installPopupHandlers() {
        defineLockedValue(window, "alert", popupHandlers.alert);
        defineLockedValue(window, "confirm", popupHandlers.confirm);
        defineLockedValue(window, "prompt", popupHandlers.prompt);
    }

    function shouldBlockBeforeUnload(target, type) {
        if (type !== "beforeunload") {
            return false;
        }

        return target === window || target === document || target === document.documentElement || target === document.body;
    }

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (shouldBlockBeforeUnload(this, type)) {
            log("Blocked addEventListener(beforeunload).");
            return;
        }

        return nativeAddEventListener.call(this, type, listener, options);
    };

    installPopupHandlers();

    try {
        Object.defineProperty(window, "onbeforeunload", {
            configurable: false,
            enumerable: true,
            get() {
                return blockedHandler;
            },
            set(value) {
                if (value) {
                    log("Blocked window.onbeforeunload assignment.");
                }
            },
        });
    } catch (error) {
        try {
            window.onbeforeunload = blockedHandler;
        } catch (assignError) {
            // ignore readonly assignment failures
        }
    }

    window.addEventListener("beforeunload", event => {
        event.stopImmediatePropagation();
        try {
            delete event.returnValue;
        } catch (error) {
            event.returnValue = undefined;
        }
        return undefined;
    }, true);

    log("Installed.");
})();
