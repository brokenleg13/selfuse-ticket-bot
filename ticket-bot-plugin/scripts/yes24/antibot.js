( () => {
    console.log('%c[TicketBot] Local Antibot Script Loaded Successfully!', 'color: white; background: green; font-size: 20px; padding: 5px;');
    var t = {
        215: (t, e, n) => {
            "use strict";
            n.r(e),
            n.d(e, {
                BotKind: () => u,
                BotdError: () => s,
                collect: () => f,
                default: () => k,
                detect: () => l,
                detectors: () => g,
                load: () => _,
                sources: () => m
            });
            var r = function(t, e) {
                return r = Object.setPrototypeOf || {
                    __proto__: []
                }instanceof Array && function(t, e) {
                    t.__proto__ = e
                }
                || function(t, e) {
                    for (var n in e)
                        Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n])
                }
                ,
                r(t, e)
            };
            function o(t, e, n, r) {
                return new (n || (n = Promise))((function(o, i) {
                    function a(t) {
                        try {
                            u(r.next(t))
                        } catch (t) {
                            i(t)
                        }
                    }
                    function c(t) {
                        try {
                            u(r.throw(t))
                        } catch (t) {
                            i(t)
                        }
                    }
                    function u(t) {
                        var e;
                        t.done ? o(t.value) : (e = t.value,
                        e instanceof n ? e : new n((function(t) {
                            t(e)
                        }
                        ))).then(a, c)
                    }
                    u((r = r.apply(t, e || [])).next())
                }
                ))
            }
            function i(t, e) {
                var n, r, o, i, a = {
                    label: 0,
                    sent: function() {
                        if (1 & o[0])
                            throw o[1];
                        return o[1]
                    },
                    trys: [],
                    ops: []
                };
                return i = {
                    next: c(0),
                    throw: c(1),
                    return: c(2)
                },
                "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                    return this
                }
                ),
                i;
                function c(c) {
                    return function(u) {
                        return function(c) {
                            if (n)
                                throw new TypeError("Generator is already executing.");
                            for (; i && (i = 0,
                            c[0] && (a = 0)),
                            a; )
                                try {
                                    if (n = 1,
                                    r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                    0) : r.next) && !(o = o.call(r, c[1])).done)
                                        return o;
                                    switch (r = 0,
                                    o && (c = [2 & c[0], o.value]),
                                    c[0]) {
                                    case 0:
                                    case 1:
                                        o = c;
                                        break;
                                    case 4:
                                        return a.label++,
                                        {
                                            value: c[1],
                                            done: !1
                                        };
                                    case 5:
                                        a.label++,
                                        r = c[1],
                                        c = [0];
                                        continue;
                                    case 7:
                                        c = a.ops.pop(),
                                        a.trys.pop();
                                        continue;
                                    default:
                                        if (!(o = a.trys,
                                        (o = o.length > 0 && o[o.length - 1]) || 6 !== c[0] && 2 !== c[0])) {
                                            a = 0;
                                            continue
                                        }
                                        if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                            a.label = c[1];
                                            break
                                        }
                                        if (6 === c[0] && a.label < o[1]) {
                                            a.label = o[1],
                                            o = c;
                                            break
                                        }
                                        if (o && a.label < o[2]) {
                                            a.label = o[2],
                                            a.ops.push(c);
                                            break
                                        }
                                        o[2] && a.ops.pop(),
                                        a.trys.pop();
                                        continue
                                    }
                                    c = e.call(t, a)
                                } catch (t) {
                                    c = [6, t],
                                    r = 0
                                } finally {
                                    n = o = 0
                                }
                            if (5 & c[0])
                                throw c[1];
                            return {
                                value: c[0] ? c[1] : void 0,
                                done: !0
                            }
                        }([c, u])
                    }
                }
            }
            Object.create;
            function a(t, e, n) {
                if (n || 2 === arguments.length)
                    for (var r, o = 0, i = e.length; o < i; o++)
                        !r && o in e || (r || (r = Array.prototype.slice.call(e, 0, o)),
                        r[o] = e[o]);
                return t.concat(r || Array.prototype.slice.call(e))
            }
            Object.create;
            var c = "1.9.1"
              , u = {
                Awesomium: "awesomium",
                Cef: "cef",
                CefSharp: "cefsharp",
                CoachJS: "coachjs",
                Electron: "electron",
                FMiner: "fminer",
                Geb: "geb",
                NightmareJS: "nightmarejs",
                Phantomas: "phantomas",
                PhantomJS: "phantomjs",
                Rhino: "rhino",
                Selenium: "selenium",
                Sequentum: "sequentum",
                SlimerJS: "slimerjs",
                WebDriverIO: "webdriverio",
                WebDriver: "webdriver",
                HeadlessChrome: "headless_chrome",
                Unknown: "unknown"
            }
              , s = function(t) {
                function e(n, r) {
                    var o = t.call(this, r) || this;
                    return o.state = n,
                    o.name = "BotdError",
                    Object.setPrototypeOf(o, e.prototype),
                    o
                }
                return function(t, e) {
                    if ("function" != typeof e && null !== e)
                        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
                    function n() {
                        this.constructor = t
                    }
                    r(t, e),
                    t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype,
                    new n)
                }(e, t),
                e
            }(Error);
            function l(t, e) {
                return [{}, { bot: !1 }]; // 强制返回：未检测到任何机器人特征
            }
            function f(t) {
                return o(this, void 0, void 0, (function() {
                    var e, n, r = this;
                    return i(this, (function(a) {
                        switch (a.label) {
                        case 0:
                            return e = {},
                            n = Object.keys(t),
                            [4, Promise.all(n.map((function(n) {
                                return o(r, void 0, void 0, (function() {
                                    var r, o, a, c, u;
                                    return i(this, (function(i) {
                                        switch (i.label) {
                                        case 0:
                                            r = t[n],
                                            i.label = 1;
                                        case 1:
                                            return i.trys.push([1, 3, , 4]),
                                            o = e,
                                            a = n,
                                            u = {},
                                            [4, r()];
                                        case 2:
                                            return o[a] = (u.value = i.sent(),
                                            u.state = 0,
                                            u),
                                            [3, 4];
                                        case 3:
                                            return c = i.sent(),
                                            e[n] = c instanceof s ? {
                                                state: c.state,
                                                error: "".concat(c.name, ": ").concat(c.message)
                                            } : {
                                                state: -3,
                                                error: c instanceof Error ? "".concat(c.name, ": ").concat(c.message) : String(c)
                                            },
                                            [3, 4];
                                        case 4:
                                            return [2]
                                        }
                                    }
                                    ))
                                }
                                ))
                            }
                            )))];
                        case 1:
                            return a.sent(),
                            [2, e]
                        }
                    }
                    ))
                }
                ))
            }
            function h(t, e) {
                return -1 !== t.indexOf(e)
            }
            function d(t, e) {
                return -1 !== t.indexOf(e)
            }
            function p(t) {
                return Object.getOwnPropertyNames(t)
            }
            function v(t) {
                for (var e = [], n = 1; n < arguments.length; n++)
                    e[n - 1] = arguments[n];
                for (var r = function(e) {
                    if ("string" == typeof e) {
                        if (h(t, e))
                            return {
                                value: !0
                            }
                    } else if (null != function(t, e) {
                        if ("find"in t)
                            return t.find(e);
                        for (var n = 0; n < t.length; n++)
                            if (e(t[n], n, t))
                                return t[n]
                    }(t, (function(t) {
                        return e.test(t)
                    }
                    )))
                        return {
                            value: !0
                        }
                }, o = 0, i = e; o < i.length; o++) {
                    var a = r(i[o]);
                    if ("object" == typeof a)
                        return a.value
                }
                return !1
            }
            function y(t) {
                return t.reduce((function(t, e) {
                    return t + (e ? 1 : 0)
                }
                ), 0)
            }
            var g = {
                detectAppVersion: function(t) {
                    var e = t.appVersion;
                    return 0 === e.state && (/headless/i.test(e.value) ? u.HeadlessChrome : /electron/i.test(e.value) ? u.Electron : /slimerjs/i.test(e.value) ? u.SlimerJS : void 0)
                },
                detectDocumentAttributes: function(t) {
                    var e = t.documentElementKeys;
                    return 0 === e.state && (v(e.value, "selenium", "webdriver", "driver") ? u.Selenium : void 0)
                },
                detectErrorTrace: function(t) {
                    var e = t.errorTrace;
                    return 0 === e.state && (/PhantomJS/i.test(e.value) ? u.PhantomJS : void 0)
                },
                detectEvalLengthInconsistency: function(t) {
                    var e = t.evalLength
                      , n = t.browserKind
                      , r = t.browserEngineKind;
                    if (0 === e.state && 0 === n.state && 0 === r.state) {
                        var o = e.value;
                        return "unknown" !== r.value && (37 === o && !h(["webkit", "gecko"], r.value) || 39 === o && !h(["internet_explorer"], n.value) || 33 === o && !h(["chromium"], r.value))
                    }
                },
                detectFunctionBind: function(t) {
                    if (-2 === t.functionBind.state)
                        return u.PhantomJS
                },
                detectLanguagesLengthInconsistency: function(t) {
                    var e = t.languages;
                    if (0 === e.state && 0 === e.value.length)
                        return u.HeadlessChrome
                },
                detectNotificationPermissions: function(t) {
                    var e = t.notificationPermissions
                      , n = t.browserKind;
                    return 0 === n.state && "chrome" === n.value && (0 === e.state && e.value ? u.HeadlessChrome : void 0)
                },
                detectPluginsArray: function(t) {
                    var e = t.pluginsArray;
                    if (0 === e.state && !e.value)
                        return u.HeadlessChrome
                },
                detectPluginsLengthInconsistency: function(t) {
                    var e = t.pluginsLength
                      , n = t.android
                      , r = t.browserKind
                      , o = t.browserEngineKind;
                    0 === e.state && 0 === n.state && 0 === r.state && 0 === o.state && "chrome" === r.value && !n.value && o.value
                },
                detectProcess: function(t) {
                    var e, n = t.process;
                    return 0 === n.state && ("renderer" === n.value.type || null != (null === (e = n.value.versions) || void 0 === e ? void 0 : e.electron) ? u.Electron : void 0)
                },
                detectUserAgent: function(t) {
                    var e = t.userAgent;
                    return 0 === e.state && (/PhantomJS/i.test(e.value) ? u.PhantomJS : /Headless/i.test(e.value) ? u.HeadlessChrome : /Electron/i.test(e.value) ? u.Electron : /slimerjs/i.test(e.value) ? u.SlimerJS : void 0)
                },
                detectWebDriver: function(t) {
                    var e = t.webDriver;
                    if (0 === e.state && e.value)
                        return u.HeadlessChrome
                },
                detectWebGL: function(t) {
                    var e = t.webGL;
                    if (0 === e.state) {
                        var n = e.value
                          , r = n.vendor
                          , o = n.renderer;
                        if ("Brian Paul" == r && "Mesa OffScreen" == o)
                            return u.HeadlessChrome
                    }
                },
                detectWindowExternal: function(t) {
                    var e = t.windowExternal;
                    return 0 === e.state && (/Sequentum/i.test(e.value) ? u.Sequentum : void 0)
                },
                detectWindowSize: function(t) {
                    var e = t.windowSize
                      , n = t.documentFocus;
                    if (0 !== e.state || 0 !== n.state)
                        return !1;
                    var r = e.value
                      , o = r.outerWidth
                      , i = r.outerHeight;
                    return n.value && 0 === o && 0 === i ? u.HeadlessChrome : void 0
                },
                detectMimeTypesConsistent: function(t) {
                    var e = t.mimeTypesConsistent;
                    if (0 === e.state && !e.value)
                        return u.Unknown
                },
                detectProductSub: function(t) {
                    var e = t.productSub
                      , n = t.browserKind;
                    return 0 === e.state && 0 === n.state && ("chrome" !== n.value && "safari" !== n.value && "opera" !== n.value && "wechat" !== n.value || "20030107" === e.value ? void 0 : u.Unknown)
                },
                detectDistinctiveProperties: function(t) {
                    var e = t.distinctiveProps;
                    if (0 !== e.state)
                        return !1;
                    var n, r = e.value;
                    for (n in r)
                        if (r[n])
                            return n
                }
            };
            function w() {
                var t, e, n = window, r = navigator;
                return y(["webkitPersistentStorage"in r, "webkitTemporaryStorage"in r, 0 === r.vendor.indexOf("Google"), "webkitResolveLocalFileSystemURL"in n, "BatteryManager"in n, "webkitMediaStream"in n, "webkitSpeechGrammar"in n]) >= 5 ? "chromium" : y(["ApplePayError"in n, "CSSPrimitiveValue"in n, "Counter"in n, 0 === r.vendor.indexOf("Apple"), "getStorageUpdates"in r, "WebKitMediaKeys"in n]) >= 4 ? "webkit" : y(["buildID"in navigator, "MozAppearance"in (null !== (e = null === (t = document.documentElement) || void 0 === t ? void 0 : t.style) && void 0 !== e ? e : {}), "onmozfullscreenchange"in n, "mozInnerScreenX"in n, "CSSMozDocumentRule"in n, "CanvasCaptureMediaStream"in n]) >= 4 ? "gecko" : "unknown"
            }
            var m = {
                android: function() {
                    var t = w()
                      , e = "gecko" === t
                      , n = window
                      , r = navigator
                      , o = "connection";
                    return "chromium" === t ? y([!("SharedWorker"in n), r[o] && "ontypechange"in r[o], !("sinkId"in new Audio)]) >= 2 : !!e && y(["onorientationchange"in n, "orientation"in n, /android/i.test(r.appVersion)]) >= 2
                },
                browserKind: function() {
                    var t, e = null === (t = navigator.userAgent) || void 0 === t ? void 0 : t.toLowerCase();
                    return d(e, "edg/") ? "edge" : d(e, "trident") || d(e, "msie") ? "internet_explorer" : d(e, "wechat") ? "wechat" : d(e, "firefox") ? "firefox" : d(e, "opera") || d(e, "opr") ? "opera" : d(e, "chrome") ? "chrome" : d(e, "safari") ? "safari" : "unknown"
                },
                browserEngineKind: w,
                documentFocus: function() {
                    return void 0 !== document.hasFocus && document.hasFocus()
                },
                userAgent: function() {
                    return navigator.userAgent
                },
                appVersion: function() {
                    var t = navigator.appVersion;
                    if (null == t)
                        throw new s(-1,"navigator.appVersion is undefined");
                    return t
                },
                rtt: function() {
                    if (void 0 === navigator.connection)
                        throw new s(-1,"navigator.connection is undefined");
                    if (void 0 === navigator.connection.rtt)
                        throw new s(-1,"navigator.connection.rtt is undefined");
                    return navigator.connection.rtt
                },
                windowSize: function() {
                    return {
                        outerWidth: window.outerWidth,
                        outerHeight: window.outerHeight,
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight
                    }
                },
                pluginsLength: function() {
                    if (void 0 === navigator.plugins)
                        throw new s(-1,"navigator.plugins is undefined");
                    if (void 0 === navigator.plugins.length)
                        throw new s(-3,"navigator.plugins.length is undefined");
                    return navigator.plugins.length
                },
                pluginsArray: function() {
                    if (void 0 === navigator.plugins)
                        throw new s(-1,"navigator.plugins is undefined");
                    if (void 0 === window.PluginArray)
                        throw new s(-1,"window.PluginArray is undefined");
                    return navigator.plugins instanceof PluginArray
                },
                errorTrace: function() {
                    try {
                        null[0]()
                    } catch (t) {
                        if (t instanceof Error && null != t.stack)
                            return t.stack.toString()
                    }
                    throw new s(-3,"errorTrace signal unexpected behaviour")
                },
                productSub: function() {
                    var t = navigator.productSub;
                    if (void 0 === t)
                        throw new s(-1,"navigator.productSub is undefined");
                    return t
                },
                windowExternal: function() {
                    if (void 0 === window.external)
                        throw new s(-1,"window.external is undefined");
                    var t = window.external;
                    if ("function" != typeof t.toString)
                        throw new s(-2,"window.external.toString is not a function");
                    return t.toString()
                },
                mimeTypesConsistent: function() {
                    if (void 0 === navigator.mimeTypes)
                        throw new s(-1,"navigator.mimeTypes is undefined");
                    for (var t = navigator.mimeTypes, e = Object.getPrototypeOf(t) === MimeTypeArray.prototype, n = 0; n < t.length; n++)
                        e && (e = Object.getPrototypeOf(t[n]) === MimeType.prototype);
                    return e
                },
                evalLength: function() {
                    return eval.toString().length
                },
                webGL: function() {
                    var t = document.createElement("canvas");
                    if ("function" != typeof t.getContext)
                        throw new s(-2,"HTMLCanvasElement.getContext is not a function");
                    var e = t.getContext("webgl");
                    if (null === e)
                        throw new s(-4,"WebGLRenderingContext is null");
                    if ("function" != typeof e.getParameter)
                        throw new s(-2,"WebGLRenderingContext.getParameter is not a function");
                    return {
                        vendor: e.getParameter(e.VENDOR),
                        renderer: e.getParameter(e.RENDERER)
                    }
                },
                webDriver: function() {
                    if (null == navigator.webdriver)
                        throw new s(-1,"navigator.webdriver is undefined");
                    return navigator.webdriver
                },
                languages: function() {
                    var t, e = navigator, n = [], r = e.language || e.userLanguage || e.browserLanguage || e.systemLanguage;
                    if (void 0 !== r && n.push([r]),
                    Array.isArray(e.languages))
                        "chromium" === w() && y([!("MediaSettingsRange"in (t = window)), "RTCEncodedAudioFrame"in t, "" + t.Intl == "[object Intl]", "" + t.Reflect == "[object Reflect]"]) >= 3 || n.push(e.languages);
                    else if ("string" == typeof e.languages) {
                        var o = e.languages;
                        o && n.push(o.split(","))
                    }
                    return n
                },
                notificationPermissions: function() {
                    return o(this, void 0, void 0, (function() {
                        var t, e;
                        return i(this, (function(n) {
                            switch (n.label) {
                            case 0:
                                if (void 0 === window.Notification)
                                    throw new s(-1,"window.Notification is undefined");
                                if (void 0 === navigator.permissions)
                                    throw new s(-1,"navigator.permissions is undefined");
                                if ("function" != typeof (t = navigator.permissions).query)
                                    throw new s(-2,"navigator.permissions.query is not a function");
                                n.label = 1;
                            case 1:
                                return n.trys.push([1, 3, , 4]),
                                [4, t.query({
                                    name: "notifications"
                                })];
                            case 2:
                                return e = n.sent(),
                                [2, "denied" === window.Notification.permission && "prompt" === e.state];
                            case 3:
                                throw n.sent(),
                                new s(-3,"notificationPermissions signal unexpected behaviour");
                            case 4:
                                return [2]
                            }
                        }
                        ))
                    }
                    ))
                },
                documentElementKeys: function() {
                    if (void 0 === document.documentElement)
                        throw new s(-1,"document.documentElement is undefined");
                    var t = document.documentElement;
                    if ("function" != typeof t.getAttributeNames)
                        throw new s(-2,"document.documentElement.getAttributeNames is not a function");
                    return t.getAttributeNames()
                },
                functionBind: function() {
                    if (void 0 === Function.prototype.bind)
                        throw new s(-2,"Function.prototype.bind is undefined");
                    return Function.prototype.bind.toString()
                },
                process: function() {
                    var t = window.process
                      , e = "window.process is";
                    if (void 0 === t)
                        throw new s(-1,"".concat(e, " undefined"));
                    if (t && "object" != typeof t)
                        throw new s(-3,"".concat(e, " not an object"));
                    return t
                },
                distinctiveProps: function() {
                    var t, e, n = ((t = {})[u.Awesomium] = {
                        window: ["awesomium"]
                    },
                    t[u.Cef] = {
                        window: ["RunPerfTest"]
                    },
                    t[u.CefSharp] = {
                        window: ["CefSharp"]
                    },
                    t[u.CoachJS] = {
                        window: ["emit"]
                    },
                    t[u.FMiner] = {
                        window: ["fmget_targets"]
                    },
                    t[u.Geb] = {
                        window: ["geb"]
                    },
                    t[u.NightmareJS] = {
                        window: ["__nightmare", "nightmare"]
                    },
                    t[u.Phantomas] = {
                        window: ["__phantomas"]
                    },
                    t[u.PhantomJS] = {
                        window: ["callPhantom", "_phantom"]
                    },
                    t[u.Rhino] = {
                        window: ["spawn"]
                    },
                    t[u.Selenium] = {
                        window: ["_Selenium_IDE_Recorder", "_selenium", "calledSelenium", /^([a-z]){3}_.*_(Array|Promise|Symbol)$/],
                        document: ["__selenium_evaluate", "selenium-evaluate", "__selenium_unwrapped"]
                    },
                    t[u.WebDriverIO] = {
                        window: ["wdioElectron"]
                    },
                    t[u.WebDriver] = {
                        window: ["webdriver", "__webdriverFunc", "__lastWatirAlert", "__lastWatirConfirm", "__lastWatirPrompt", "_WEBDRIVER_ELEM_CACHE", "ChromeDriverw"],
                        document: ["__webdriver_script_fn", "__driver_evaluate", "__webdriver_evaluate", "__fxdriver_evaluate", "__driver_unwrapped", "__webdriver_unwrapped", "__fxdriver_unwrapped", "__webdriver_script_fn", "__webdriver_script_func", "__webdriver_script_function", "$cdc_asdjflasutopfhvcZLmcf", "$cdc_asdjflasutopfhvcZLmcfl_", "$chrome_asyncScriptInfo", "__$webdriverAsyncExecutor"]
                    },
                    t[u.HeadlessChrome] = {
                        window: ["domAutomation", "domAutomationController"]
                    },
                    t), r = {}, o = p(window), i = [];
                    for (e in void 0 !== window.document && (i = p(window.document)),
                    n) {
                        var c = n[e];
                        if (void 0 !== c) {
                            var s = void 0 !== c.window && v.apply(void 0, a([o], c.window, !1))
                              , l = !(void 0 === c.document || !i.length) && v.apply(void 0, a([i], c.document, !1));
                            r[e] = s || l
                        }
                    }
                    return r
                }
            }
              , b = function() {
                function t() {
                    this.components = void 0,
                    this.detections = void 0
                }
                return t.prototype.getComponents = function() {
                    return this.components
                }
                ,
                t.prototype.getDetections = function() {
                    return this.detections
                }
                ,
                t.prototype.detect = function() {
                    if (void 0 === this.components)
                        throw new Error("BotDetector.detect can't be called before BotDetector.collect");
                    var t = l(this.components, g)
                      , e = t[0]
                      , n = t[1];
                    return this.detections = e,
                    n
                }
                ,
                t.prototype.collect = function() {
                    return o(this, void 0, void 0, (function() {
                        var t;
                        return i(this, (function(e) {
                            switch (e.label) {
                            case 0:
                                return t = this,
                                [4, f(m)];
                            case 1:
                                return t.components = e.sent(),
                                [2, this.components]
                            }
                        }
                        ))
                    }
                    ))
                }
                ,
                t
            }();
            function _(t) {
                var e = (void 0 === t ? {} : t).monitoring
                  , n = void 0 === e || e;
                return o(this, void 0, void 0, (function() {
                    var t;
                    return i(this, (function(e) {
                        switch (e.label) {
                        case 0:
                            return n && function() {
                                if (!(window.__fpjs_d_m || Math.random() >= .001))
                                    try {
                                        var t = new XMLHttpRequest;
                                        t.open("get", "https://m1.openfpcdn.io/botd/v".concat(c, "/npm-monitoring"), !0),
                                        t.send()
                                    } catch (t) {
                                        console.error(t)
                                    }
                            }(),
                            [4, (t = new b).collect()];
                        case 1:
                            return e.sent(),
                            [2, t]
                        }
                    }
                    ))
                }
                ))
            }
            var k = {
                load: _
            }
        }
        ,
        781: function(t) {
            "undefined" != typeof self && self,
            t.exports = function(t) {
                var e = {};
                function n(r) {
                    if (e[r])
                        return e[r].exports;
                    var o = e[r] = {
                        i: r,
                        l: !1,
                        exports: {}
                    };
                    return t[r].call(o.exports, o, o.exports, n),
                    o.l = !0,
                    o.exports
                }
                return n.m = t,
                n.c = e,
                n.d = function(t, e, r) {
                    n.o(t, e) || Object.defineProperty(t, e, {
                        configurable: !1,
                        enumerable: !0,
                        get: r
                    })
                }
                ,
                n.n = function(t) {
                    var e = t && t.__esModule ? function() {
                        return t.default
                    }
                    : function() {
                        return t
                    }
                    ;
                    return n.d(e, "a", e),
                    e
                }
                ,
                n.o = function(t, e) {
                    return Object.prototype.hasOwnProperty.call(t, e)
                }
                ,
                n.p = "",
                n(n.s = 4)
            }([function(t, e, n) {
                "use strict";
                n.d(e, "i", (function() {
                    return l
                }
                )),
                n.d(e, "d", (function() {
                    return f
                }
                )),
                n.d(e, "e", (function() {
                    return h
                }
                )),
                n.d(e, "c", (function() {
                    return d
                }
                )),
                n.d(e, "h", (function() {
                    return p
                }
                )),
                n.d(e, "f", (function() {
                    return v
                }
                )),
                n.d(e, "b", (function() {
                    return y
                }
                )),
                n.d(e, "g", (function() {
                    return g
                }
                )),
                n.d(e, "a", (function() {
                    return w
                }
                ));
                var r, o, i, a, c, u = n(3), s = Object(u.b)(), l = (null === (r = null == s ? void 0 : s.navigator) || void 0 === r ? void 0 : r.userAgent) || "unknown", f = "InstallTrigger"in ((null == s ? void 0 : s.window) || {}) || /firefox/i.test(l), h = /trident/i.test(l) || /msie/i.test(l), d = /edge/i.test(l) || /EdgiOS/i.test(l), p = /webkit/i.test(l), v = /IqiyiApp/.test(l), y = void 0 !== (null === (o = null == s ? void 0 : s.window) || void 0 === o ? void 0 : o.chrome) || /chrome/i.test(l) || /CriOS/i.test(l), g = "[object SafariRemoteNotification]" === ((null === (a = null === (i = null == s ? void 0 : s.window) || void 0 === i ? void 0 : i.safari) || void 0 === a ? void 0 : a.pushNotification) || !1).toString() || /safari/i.test(l) && !y, w = "function" == typeof (null === (c = s.document) || void 0 === c ? void 0 : c.createElement)
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "b", (function() {
                    return i
                }
                )),
                n.d(e, "c", (function() {
                    return a
                }
                )),
                n.d(e, "a", (function() {
                    return c
                }
                ));
                var r = n(0);
                function o(t) {
                    if (r.a && console) {
                        if (!r.e && !r.c)
                            return console[t];
                        if ("log" === t || "clear" === t)
                            return function() {
                                for (var e = [], n = 0; n < arguments.length; n++)
                                    e[n] = arguments[n];
                                console[t].apply(console, e)
                            }
                    }
                    return function() {
                        for (var t = [], e = 0; e < arguments.length; e++)
                            t[e] = arguments[e]
                    }
                }
                var i = o("log")
                  , a = o("table")
                  , c = o("clear")
            }
            , function(t, e, n) {
                "use strict";
                e.a = function(t) {
                    void 0 === t && (t = {});
                    for (var e = t.includes, n = void 0 === e ? [] : e, r = t.excludes, o = void 0 === r ? [] : r, i = !1, a = !1, c = 0, u = n; c < u.length; c++)
                        if (!0 === u[c]) {
                            i = !0;
                            break
                        }
                    for (var s = 0, l = o; s < l.length; s++)
                        if (!0 === l[s]) {
                            a = !0;
                            break
                        }
                    return i && !a
                }
            }
            , function(t, e, n) {
                "use strict";
                (function(t) {
                    e.b = c,
                    e.a = function() {
                        for (var t, e = [], n = 0; n < arguments.length; n++)
                            e[n] = arguments[n];
                        var r = c();
                        return (null == r ? void 0 : r.document) ? (t = r.document).createElement.apply(t, e) : {}
                    }
                    ,
                    e.c = function() {
                        if (r)
                            return r;
                        if (u) {
                            var t = new Blob([o.a.workerScript]);
                            try {
                                var e = URL.createObjectURL(t);
                                r = new o.a(new Worker(e)),
                                URL.revokeObjectURL(e)
                            } catch (t) {
                                try {
                                    r = new o.a(new Worker("data:text/javascript;base64,".concat(btoa(o.a.workerScript))))
                                } catch (t) {
                                    u = !1
                                }
                            }
                            return r
                        }
                    }
                    ,
                    n.d(e, "d", (function() {
                        return s
                    }
                    ));
                    var r, o = n(10), i = this && this.__awaiter || function(t, e, n, r) {
                        return new (n || (n = Promise))((function(o, i) {
                            function a(t) {
                                try {
                                    u(r.next(t))
                                } catch (t) {
                                    i(t)
                                }
                            }
                            function c(t) {
                                try {
                                    u(r.throw(t))
                                } catch (t) {
                                    i(t)
                                }
                            }
                            function u(t) {
                                t.done ? o(t.value) : function(t) {
                                    return t instanceof n ? t : new n((function(e) {
                                        e(t)
                                    }
                                    ))
                                }(t.value).then(a, c)
                            }
                            u((r = r.apply(t, e || [])).next())
                        }
                        ))
                    }
                    , a = this && this.__generator || function(t, e) {
                        var n, r, o, i, a = {
                            label: 0,
                            sent: function() {
                                if (1 & o[0])
                                    throw o[1];
                                return o[1]
                            },
                            trys: [],
                            ops: []
                        };
                        return i = {
                            next: c(0),
                            throw: c(1),
                            return: c(2)
                        },
                        "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                            return this
                        }
                        ),
                        i;
                        function c(c) {
                            return function(u) {
                                return function(c) {
                                    if (n)
                                        throw new TypeError("Generator is already executing.");
                                    for (; i && (i = 0,
                                    c[0] && (a = 0)),
                                    a; )
                                        try {
                                            if (n = 1,
                                            r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                            0) : r.next) && !(o = o.call(r, c[1])).done)
                                                return o;
                                            switch (r = 0,
                                            o && (c = [2 & c[0], o.value]),
                                            c[0]) {
                                            case 0:
                                            case 1:
                                                o = c;
                                                break;
                                            case 4:
                                                return a.label++,
                                                {
                                                    value: c[1],
                                                    done: !1
                                                };
                                            case 5:
                                                a.label++,
                                                r = c[1],
                                                c = [0];
                                                continue;
                                            case 7:
                                                c = a.ops.pop(),
                                                a.trys.pop();
                                                continue;
                                            default:
                                                if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                    a = 0;
                                                    continue
                                                }
                                                if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                    a.label = c[1];
                                                    break
                                                }
                                                if (6 === c[0] && a.label < o[1]) {
                                                    a.label = o[1],
                                                    o = c;
                                                    break
                                                }
                                                if (o && a.label < o[2]) {
                                                    a.label = o[2],
                                                    a.ops.push(c);
                                                    break
                                                }
                                                o[2] && a.ops.pop(),
                                                a.trys.pop();
                                                continue
                                            }
                                            c = e.call(t, a)
                                        } catch (t) {
                                            c = [6, t],
                                            r = 0
                                        } finally {
                                            n = o = 0
                                        }
                                    if (5 & c[0])
                                        throw c[1];
                                    return {
                                        value: c[0] ? c[1] : void 0,
                                        done: !0
                                    }
                                }([c, u])
                            }
                        }
                    }
                    ;
                    function c() {
                        return "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== t ? t : this
                    }
                    var u = !0
                      , s = function() {
                        return i(this, void 0, void 0, (function() {
                            var t;
                            return a(this, (function(e) {
                                switch (e.label) {
                                case 0:
                                    if (t = !1,
                                    !navigator.brave)
                                        return [3, 4];
                                    if (!navigator.brave.isBrave)
                                        return [3, 4];
                                    e.label = 1;
                                case 1:
                                    return e.trys.push([1, 3, , 4]),
                                    [4, Promise.race([navigator.brave.isBrave(), new Promise((function(t) {
                                        return setTimeout((function() {
                                            return t(!1)
                                        }
                                        ), 1e3)
                                    }
                                    ))])];
                                case 2:
                                    return t = e.sent(),
                                    [3, 4];
                                case 3:
                                    return e.sent(),
                                    [3, 4];
                                case 4:
                                    return s = function() {
                                        return i(this, void 0, void 0, (function() {
                                            return a(this, (function(e) {
                                                return [2, t]
                                            }
                                            ))
                                        }
                                        ))
                                    }
                                    ,
                                    [2, t]
                                }
                            }
                            ))
                        }
                        ))
                    }
                }
                ).call(e, n(9))
            }
            , function(t, e, n) {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                e.addListener = function(t) {
                    h.addListener(t)
                }
                ,
                e.removeListener = function(t) {
                    h.removeListener(t)
                }
                ,
                e.isLaunch = function() {
                    return h.isLaunch()
                }
                ,
                e.launch = function() {
                    h.launch()
                }
                ,
                e.stop = function() {
                    h.stop()
                }
                ,
                e.setDetectDelay = function(t) {
                    h.setDetectDelay(t)
                }
                ;
                var r = n(8)
                  , o = n(12);
                n.d(e, "DevtoolsDetector", (function() {
                    return r.a
                }
                )),
                n.d(e, "checkers", (function() {
                    return o
                }
                ));
                var i = n(23);
                n.d(e, "crashBrowserCurrentTab", (function() {
                    return i.b
                }
                )),
                n.d(e, "crashBrowser", (function() {
                    return i.a
                }
                ));
                var a = n(2);
                n.d(e, "match", (function() {
                    return a.a
                }
                ));
                var c = n(3);
                n.d(e, "getGlobalThis", (function() {
                    return c.b
                }
                )),
                n.d(e, "createElement", (function() {
                    return c.a
                }
                )),
                n.d(e, "getWorkerConsole", (function() {
                    return c.c
                }
                )),
                n.d(e, "isBrave", (function() {
                    return c.d
                }
                ));
                var u = n(24);
                n.d(e, "versionMap", (function() {
                    return u.a
                }
                ));
                var s = n(0);
                n.d(e, "userAgent", (function() {
                    return s.i
                }
                )),
                n.d(e, "isFirefox", (function() {
                    return s.d
                }
                )),
                n.d(e, "isIE", (function() {
                    return s.e
                }
                )),
                n.d(e, "isEdge", (function() {
                    return s.c
                }
                )),
                n.d(e, "isWebkit", (function() {
                    return s.h
                }
                )),
                n.d(e, "isIqiyiApp", (function() {
                    return s.f
                }
                )),
                n.d(e, "isChrome", (function() {
                    return s.b
                }
                )),
                n.d(e, "isSafari", (function() {
                    return s.g
                }
                )),
                n.d(e, "inBrowser", (function() {
                    return s.a
                }
                ));
                var l = n(1);
                n.d(e, "log", (function() {
                    return l.b
                }
                )),
                n.d(e, "table", (function() {
                    return l.c
                }
                )),
                n.d(e, "clear", (function() {
                    return l.a
                }
                ));
                var f = n(5);
                n.d(e, "isMac", (function() {
                    return f.d
                }
                )),
                n.d(e, "isIpad", (function() {
                    return f.b
                }
                )),
                n.d(e, "isIphone", (function() {
                    return f.c
                }
                )),
                n.d(e, "isAndroid", (function() {
                    return f.a
                }
                )),
                n.d(e, "isWindows", (function() {
                    return f.e
                }
                ));
                var h = new r.a({
                    checkers: [o.erudaChecker, o.devtoolsFormatterChecker, o.debuggerChecker]
                });
                e.default = h
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "d", (function() {
                    return o
                }
                )),
                n.d(e, "b", (function() {
                    return i
                }
                )),
                n.d(e, "c", (function() {
                    return a
                }
                )),
                n.d(e, "a", (function() {
                    return c
                }
                )),
                n.d(e, "e", (function() {
                    return u
                }
                ));
                var r = n(0)
                  , o = /macintosh/i.test(r.i)
                  , i = /ipad/i.test(r.i) || o && navigator.maxTouchPoints > 1
                  , a = /iphone/i.test(r.i)
                  , c = /android/i.test(r.i)
                  , u = /windows/i.test(r.i)
            }
            , function(t, e, n) {
                "use strict";
                e.a = function() {
                    return "undefined" != typeof performance ? performance.now() : Date.now()
                }
            }
            , function(t, e, n) {
                "use strict";
                e.a = function() {
                    return null === r && (r = function() {
                        for (var t = function() {
                            for (var t = {}, e = 0; e < 500; e++)
                                t["".concat(e)] = "".concat(e);
                            return t
                        }(), e = [], n = 0; n < 50; n++)
                            e.push(t);
                        return e
                    }()),
                    r
                }
                ;
                var r = null
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return a
                }
                ));
                var r = n(0)
                  , o = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , i = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , a = function() {
                    function t(t) {
                        var e = t.checkers;
                        this._listeners = [],
                        this._isOpen = !1,
                        this._detectLoopStopped = !0,
                        this._detectLoopDelay = 500,
                        this._checkers = e.slice()
                    }
                    return Object.defineProperty(t.prototype, "isOpen", {
                        get: function() {
                            return this._isOpen
                        },
                        enumerable: !1,
                        configurable: !0
                    }),
                    t.prototype.launch = function() {
                        r.a && (this._detectLoopDelay <= 0 && this.setDetectDelay(500),
                        this._detectLoopStopped && (this._detectLoopStopped = !1,
                        this._detectLoop()))
                    }
                    ,
                    t.prototype.stop = function() {
                        this._detectLoopStopped || (this._detectLoopStopped = !0,
                        this._isOpen = !1,
                        clearTimeout(this._timer))
                    }
                    ,
                    t.prototype.isLaunch = function() {
                        return !this._detectLoopStopped
                    }
                    ,
                    t.prototype.setDetectDelay = function(t) {
                        this._detectLoopDelay = t
                    }
                    ,
                    t.prototype.addListener = function(t) {
                        this._listeners.push(t)
                    }
                    ,
                    t.prototype.removeListener = function(t) {
                        this._listeners = this._listeners.filter((function(e) {
                            return e !== t
                        }
                        ))
                    }
                    ,
                    t.prototype._broadcast = function(t) {
                        for (var e = 0, n = this._listeners; e < n.length; e++) {
                            var r = n[e];
                            try {
                                r(t.isOpen, t)
                            } catch (t) {}
                        }
                    }
                    ,
                    t.prototype._detectLoop = function() {
                        return o(this, void 0, void 0, (function() {
                            var t, e, n, r, o, a = this;
                            return i(this, (function(i) {
                                switch (i.label) {
                                case 0:
                                    t = !1,
                                    e = "",
                                    n = 0,
                                    r = this._checkers,
                                    i.label = 1;
                                case 1:
                                    return n < r.length ? [4, (o = r[n]).isEnable()] : [3, 6];
                                case 2:
                                    return i.sent() ? (e = o.name,
                                    [4, o.isOpen()]) : [3, 4];
                                case 3:
                                    t = i.sent(),
                                    i.label = 4;
                                case 4:
                                    if (t)
                                        return [3, 6];
                                    i.label = 5;
                                case 5:
                                    return n++,
                                    [3, 1];
                                case 6:
                                    return t !== this._isOpen && (this._isOpen = t,
                                    this._broadcast({
                                        isOpen: t,
                                        checkerName: e
                                    })),
                                    this._detectLoopDelay > 0 && !this._detectLoopStopped ? this._timer = setTimeout((function() {
                                        return a._detectLoop()
                                    }
                                    ), this._detectLoopDelay) : this.stop(),
                                    [2]
                                }
                            }
                            ))
                        }
                        ))
                    }
                    ,
                    t
                }()
            }
            , function(t, e) {
                var n;
                n = function() {
                    return this
                }();
                try {
                    n = n || Function("return this")() || (0,
                    eval)("this")
                } catch (t) {
                    "object" == typeof window && (n = window)
                }
                t.exports = n
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return c
                }
                ));
                var r = n(11)
                  , o = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , i = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , a = this && this.__spreadArray || function(t, e, n) {
                    if (n || 2 === arguments.length)
                        for (var r, o = 0, i = e.length; o < i; o++)
                            !r && o in e || (r || (r = Array.prototype.slice.call(e, 0, o)),
                            r[o] = e[o]);
                    return t.concat(r || Array.prototype.slice.call(e))
                }
                  , c = function() {
                    function t(t) {
                        var e = this;
                        this.callbacks = new Map,
                        this.worker = t,
                        this.worker.onmessage = function(t) {
                            var n = t.data
                              , r = n.id
                              , o = e.callbacks.get(n.id);
                            o && (o({
                                time: n.time
                            }),
                            e.callbacks.delete(r))
                        }
                        ,
                        this.log = function() {
                            for (var t = [], n = 0; n < arguments.length; n++)
                                t[n] = arguments[n];
                            return e.send.apply(e, a(["log"], t, !1))
                        }
                        ,
                        this.table = function() {
                            for (var t = [], n = 0; n < arguments.length; n++)
                                t[n] = arguments[n];
                            return e.send.apply(e, a(["table"], t, !1))
                        }
                        ,
                        this.clear = function() {
                            for (var t = [], n = 0; n < arguments.length; n++)
                                t[n] = arguments[n];
                            return e.send.apply(e, a(["clear"], t, !1))
                        }
                    }
                    return t.prototype.send = function(t) {
                        for (var e = [], n = 1; n < arguments.length; n++)
                            e[n - 1] = arguments[n];
                        return o(this, void 0, void 0, (function() {
                            var n, o = this;
                            return i(this, (function(i) {
                                return n = Object(r.a)(),
                                [2, new Promise((function(r, i) {
                                    o.callbacks.set(n, r),
                                    o.worker.postMessage({
                                        id: n,
                                        type: t,
                                        payload: e
                                    }),
                                    setTimeout((function() {
                                        i(new Error("timeout")),
                                        o.callbacks.delete(n)
                                    }
                                    ), 2e3)
                                }
                                ))]
                            }
                            ))
                        }
                        ))
                    }
                    ,
                    t.workerScript = "\nonmessage = function(event) {\n  var action = event.data;\n  var startTime = performance.now()\n\n  console[action.type](...action.payload);\n  postMessage({\n    id: action.id,\n    time: performance.now() - startTime\n  })\n}\n",
                    t
                }()
            }
            , function(t, e, n) {
                "use strict";
                e.a = function() {
                    return r > Number.MAX_SAFE_INTEGER && (r = 0),
                    r++
                }
                ;
                var r = 0
            }
            , function(t, e, n) {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                });
                var r = n(13);
                n.d(e, "depRegToStringChecker", (function() {
                    return r.a
                }
                ));
                var o = n(14);
                n.d(e, "elementIdChecker", (function() {
                    return o.a
                }
                ));
                var i = n(15);
                n.d(e, "functionToStringChecker", (function() {
                    return i.a
                }
                ));
                var a = n(16);
                n.d(e, "regToStringChecker", (function() {
                    return a.a
                }
                ));
                var c = n(17);
                n.d(e, "debuggerChecker", (function() {
                    return c.a
                }
                ));
                var u = n(18);
                n.d(e, "dateToStringChecker", (function() {
                    return u.a
                }
                ));
                var s = n(19);
                n.d(e, "performanceChecker", (function() {
                    return s.a
                }
                ));
                var l = n(20);
                n.d(e, "erudaChecker", (function() {
                    return l.a
                }
                ));
                var f = n(21);
                n.d(e, "devtoolsFormatterChecker", (function() {
                    return f.a
                }
                ));
                var h = n(22);
                n.d(e, "workerPerformanceChecker", (function() {
                    return h.a
                }
                ))
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return l
                }
                ));
                var r = n(0)
                  , o = n(1)
                  , i = n(2)
                  , a = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , c = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , u = / /
                  , s = !1;
                u.toString = function() {
                    return s = !0,
                    l.name
                }
                ;
                var l = {
                    name: "dep-reg-to-string",
                    isOpen: function() {
                        return a(this, void 0, void 0, (function() {
                            return c(this, (function(t) {
                                return s = !1,
                                Object(o.c)({
                                    dep: u
                                }),
                                Object(o.a)(),
                                [2, s]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return a(this, void 0, void 0, (function() {
                            return c(this, (function(t) {
                                return [2, Object(i.a)({
                                    includes: [!0],
                                    excludes: [r.d, r.e]
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return f
                }
                ));
                var r = n(0)
                  , o = n(1)
                  , i = n(2)
                  , a = n(3)
                  , c = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , u = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , s = Object(a.a)("div")
                  , l = !1;
                Object.defineProperty(s, "id", {
                    get: function() {
                        return l = !0,
                        f.name
                    },
                    configurable: !0
                });
                var f = {
                    name: "element-id",
                    isOpen: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return l = !1,
                                Object(o.b)(s),
                                Object(o.a)(),
                                [2, l]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return [2, Object(i.a)({
                                    includes: [!0],
                                    excludes: [r.e, r.c, r.d]
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return f
                }
                ));
                var r = n(0)
                  , o = n(1)
                  , i = n(5)
                  , a = n(2)
                  , c = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , u = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                ;
                function s() {}
                var l = 0;
                s.toString = function() {
                    return l++,
                    ""
                }
                ;
                var f = {
                    name: "function-to-string",
                    isOpen: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return l = 0,
                                Object(o.b)(s),
                                Object(o.a)(),
                                [2, 2 === l]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return c(this, void 0, void 0, (function() {
                            var t;
                            return u(this, (function(e) {
                                return t = i.b || i.c,
                                [2, Object(a.a)({
                                    includes: [!0],
                                    excludes: [r.f, r.d, t && r.b, t && r.c]
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return l
                }
                ));
                var r = n(1)
                  , o = n(0)
                  , i = n(2)
                  , a = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , c = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , u = / /
                  , s = !1;
                u.toString = function() {
                    return s = !0,
                    l.name
                }
                ;
                var l = {
                    name: "reg-to-string",
                    isOpen: function() {
                        return a(this, void 0, void 0, (function() {
                            return c(this, (function(t) {
                                return s = !1,
                                Object(r.b)(u),
                                Object(r.a)(),
                                [2, s]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return a(this, void 0, void 0, (function() {
                            return c(this, (function(t) {
                                return [2, Object(i.a)({
                                    includes: [!0],
                                    excludes: [o.h]
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return a
                }
                ));
                var r = n(6)
                  , o = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , i = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , a = {
                    name: "debugger-checker",
                    isOpen: function() {
                        return o(this, void 0, void 0, (function() {
                            var t;
                            return i(this, (function(e) {
                                t = Object(r.a)();
                                try {
                                    (function() {}
                                    ).constructor("debugger")()
                                } catch (t) {}
                                return [2, Object(r.a)() - t > 100]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return o(this, void 0, void 0, (function() {
                            return i(this, (function(t) {
                                return [2, !0]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return f
                }
                ));
                var r = n(0)
                  , o = n(1)
                  , i = n(2)
                  , a = n(4)
                  , c = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , u = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , s = new Date
                  , l = 0;
                s.toString = function() {
                    return l++,
                    ""
                }
                ;
                var f = {
                    name: "date-to-string",
                    isOpen: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return l = 0,
                                Object(o.b)(s),
                                Object(o.a)(),
                                [2, 2 === l]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return [2, Object(i.a)({
                                    includes: [r.b],
                                    excludes: [(a.isIpad || a.isIphone) && r.b]
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return h
                }
                ));
                var r = n(1)
                  , o = n(0)
                  , i = n(7)
                  , a = n(2)
                  , c = n(3)
                  , u = n(6)
                  , s = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , l = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , f = 0
                  , h = {
                    name: "performance",
                    isOpen: function() {
                        return s(this, void 0, void 0, (function() {
                            var t, e;
                            return l(this, (function(n) {
                                switch (n.label) {
                                case 0:
                                    return navigator.webdriver ? [2, !1] : (t = function() {
                                        var t = Object(i.a)()
                                          , e = Object(u.a)();
                                        return Object(r.c)(t),
                                        Object(u.a)() - e
                                    }(),
                                    e = Math.max(d(), d()),
                                    f = Math.max(f, e),
                                    Object(r.a)(),
                                    0 === t ? [2, !1] : 0 !== f ? [3, 2] : [4, Object(c.d)()]);
                                case 1:
                                    return n.sent() ? [2, !0] : [2, !1];
                                case 2:
                                    return [2, t > 80 * f]
                                }
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return s(this, void 0, void 0, (function() {
                            return l(this, (function(t) {
                                return [2, Object(a.a)({
                                    includes: [o.b],
                                    excludes: []
                                })]
                            }
                            ))
                        }
                        ))
                    }
                };
                function d() {
                    var t = Object(i.a)()
                      , e = Object(u.a)();
                    return Object(r.b)(t),
                    Object(u.a)() - e
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return i
                }
                ));
                var r = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , o = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , i = {
                    name: "eruda",
                    isOpen: function() {
                        var t;
                        return r(this, void 0, void 0, (function() {
                            return o(this, (function(e) {
                                return "undefined" != typeof eruda ? [2, !0 === (null === (t = null === eruda || void 0 === eruda ? void 0 : eruda._devTools) || void 0 === t ? void 0 : t._isShow)] : [2, !1]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return r(this, void 0, void 0, (function() {
                            return o(this, (function(t) {
                                return [2, !0]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return u
                }
                ));
                var r = n(1)
                  , o = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , i = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , a = !1
                  , c = {
                    header: function() {
                        return a = !0,
                        null
                    }
                }
                  , u = {
                    name: "DevtoolsFormatters",
                    isOpen: function() {
                        return o(this, void 0, void 0, (function() {
                            return i(this, (function(t) {
                                return window.devtoolsFormatters ? -1 === window.devtoolsFormatters.indexOf(c) && window.devtoolsFormatters.push(c) : window.devtoolsFormatters = [c],
                                a = !1,
                                Object(r.b)({}),
                                Object(r.a)(),
                                [2, a]
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return o(this, void 0, void 0, (function() {
                            return i(this, (function(t) {
                                return [2, !0]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return l
                }
                ));
                var r = n(0)
                  , o = n(2)
                  , i = n(3)
                  , a = n(7)
                  , c = this && this.__awaiter || function(t, e, n, r) {
                    return new (n || (n = Promise))((function(o, i) {
                        function a(t) {
                            try {
                                u(r.next(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function c(t) {
                            try {
                                u(r.throw(t))
                            } catch (t) {
                                i(t)
                            }
                        }
                        function u(t) {
                            t.done ? o(t.value) : function(t) {
                                return t instanceof n ? t : new n((function(e) {
                                    e(t)
                                }
                                ))
                            }(t.value).then(a, c)
                        }
                        u((r = r.apply(t, e || [])).next())
                    }
                    ))
                }
                  , u = this && this.__generator || function(t, e) {
                    var n, r, o, i, a = {
                        label: 0,
                        sent: function() {
                            if (1 & o[0])
                                throw o[1];
                            return o[1]
                        },
                        trys: [],
                        ops: []
                    };
                    return i = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    },
                    "function" == typeof Symbol && (i[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    i;
                    function c(c) {
                        return function(u) {
                            return function(c) {
                                if (n)
                                    throw new TypeError("Generator is already executing.");
                                for (; i && (i = 0,
                                c[0] && (a = 0)),
                                a; )
                                    try {
                                        if (n = 1,
                                        r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r),
                                        0) : r.next) && !(o = o.call(r, c[1])).done)
                                            return o;
                                        switch (r = 0,
                                        o && (c = [2 & c[0], o.value]),
                                        c[0]) {
                                        case 0:
                                        case 1:
                                            o = c;
                                            break;
                                        case 4:
                                            return a.label++,
                                            {
                                                value: c[1],
                                                done: !1
                                            };
                                        case 5:
                                            a.label++,
                                            r = c[1],
                                            c = [0];
                                            continue;
                                        case 7:
                                            c = a.ops.pop(),
                                            a.trys.pop();
                                            continue;
                                        default:
                                            if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
                                                a = 0;
                                                continue
                                            }
                                            if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
                                                a.label = c[1];
                                                break
                                            }
                                            if (6 === c[0] && a.label < o[1]) {
                                                a.label = o[1],
                                                o = c;
                                                break
                                            }
                                            if (o && a.label < o[2]) {
                                                a.label = o[2],
                                                a.ops.push(c);
                                                break
                                            }
                                            o[2] && a.ops.pop(),
                                            a.trys.pop();
                                            continue
                                        }
                                        c = e.call(t, a)
                                    } catch (t) {
                                        c = [6, t],
                                        r = 0
                                    } finally {
                                        n = o = 0
                                    }
                                if (5 & c[0])
                                    throw c[1];
                                return {
                                    value: c[0] ? c[1] : void 0,
                                    done: !0
                                }
                            }([c, u])
                        }
                    }
                }
                  , s = 0
                  , l = {
                    name: "worker-performance",
                    isOpen: function() {
                        return c(this, void 0, void 0, (function() {
                            var t, e, n;
                            return u(this, (function(r) {
                                switch (r.label) {
                                case 0:
                                    return null == (t = Object(i.c)()) ? [2, !1] : [4, function(t) {
                                        return c(this, void 0, void 0, (function() {
                                            var e;
                                            return u(this, (function(n) {
                                                switch (n.label) {
                                                case 0:
                                                    return e = Object(a.a)(),
                                                    [4, t.table(e)];
                                                case 1:
                                                    return [2, n.sent().time]
                                                }
                                            }
                                            ))
                                        }
                                        ))
                                    }(t)];
                                case 1:
                                    return e = r.sent(),
                                    [4, function(t) {
                                        return c(this, void 0, void 0, (function() {
                                            var e;
                                            return u(this, (function(n) {
                                                switch (n.label) {
                                                case 0:
                                                    return e = Object(a.a)(),
                                                    [4, t.log(e)];
                                                case 1:
                                                    return [2, n.sent().time]
                                                }
                                            }
                                            ))
                                        }
                                        ))
                                    }(t)];
                                case 2:
                                    return n = r.sent(),
                                    s = Math.max(s, n),
                                    [4, t.clear()];
                                case 3:
                                    return r.sent(),
                                    0 === e ? [2, !1] : 0 !== s ? [3, 5] : [4, Object(i.d)()];
                                case 4:
                                    return r.sent() ? [2, !0] : [2, !1];
                                case 5:
                                    return [2, e > 10 * s]
                                }
                            }
                            ))
                        }
                        ))
                    },
                    isEnable: function() {
                        return c(this, void 0, void 0, (function() {
                            return u(this, (function(t) {
                                return [2, Object(o.a)({
                                    includes: [r.b],
                                    excludes: []
                                })]
                            }
                            ))
                        }
                        ))
                    }
                }
            }
            , function(t, e, n) {
                "use strict";
                e.b = function() {
                    if (r.a)
                        for (var t = 0; t < Number.MAX_VALUE; t++)
                            window["".concat(t)] = new Array(Math.pow(2, 32) - 1).fill(0)
                }
                ,
                e.a = function() {
                    if (r.a)
                        for (var t = []; ; )
                            t.push(0),
                            location.reload()
                }
                ;
                var r = n(0)
            }
            , function(t, e, n) {
                "use strict";
                n.d(e, "a", (function() {
                    return r
                }
                ));
                for (var r = {}, o = 0, i = (n(0).i || "").match(/\w+\/(\d|\.)+(\s|$)/gi) || []; o < i.length; o++) {
                    var a = i[o].split("/")
                      , c = a[0]
                      , u = a[1];
                    r[c] = u
                }
            }
            ])
        }
    }
      , e = {};
    function n(r) {
        var o = e[r];
        if (void 0 !== o)
            return o.exports;
        var i = e[r] = {
            exports: {}
        };
        return t[r].call(i.exports, i, i.exports, n),
        i.exports
    }
    n.n = t => {
        var e = t && t.__esModule ? () => t.default : () => t;
        return n.d(e, {
            a: e
        }),
        e
    }
    ,
    n.d = (t, e) => {
        for (var r in e)
            n.o(e, r) && !n.o(t, r) && Object.defineProperty(t, r, {
                enumerable: !0,
                get: e[r]
            })
    }
    ,
    n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e),
    n.r = t => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
            value: "Module"
        }),
        Object.defineProperty(t, "__esModule", {
            value: !0
        })
    }
    ,
    ( () => {
        "use strict";
        var t = {
            tenantId: "",
            domainName: "",
            serverUrl: "",
            detectOnLoad: !0,
            detectDevTools: !0,
            detectClickBehavior: !0,
            detectClickSampleSize: 10,
            detectClickThreshold: 10,
            detectClickMaxTimeDiff: 6e4,
            detectAutomation: !0,
            redirectOnLocation: !0,
            networkTimeout: 3e3,
            useMainDomain: !0,
            useSecureCookie: !0,
            preventBypass: !1,
            preventBypassMinutes: 5,
            preventBypassDetectTime: "5M",
            validateSessionId: !0
        };
        function e(t) {
            return e = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            e(t)
        }
        function r(t, e) {
            var n = Object.keys(t);
            if (Object.getOwnPropertySymbols) {
                var r = Object.getOwnPropertySymbols(t);
                e && (r = r.filter((function(e) {
                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                }
                ))),
                n.push.apply(n, r)
            }
            return n
        }
        function o(t) {
            for (var e = 1; e < arguments.length; e++) {
                var n = null != arguments[e] ? arguments[e] : {};
                e % 2 ? r(Object(n), !0).forEach((function(e) {
                    i(t, e, n[e])
                }
                )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : r(Object(n)).forEach((function(e) {
                    Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
                }
                ))
            }
            return t
        }
        function i(t, n, r) {
            return (n = function(t) {
                var n = function(t, n) {
                    if ("object" != e(t) || !t)
                        return t;
                    var r = t[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var o = r.call(t, n || "default");
                        if ("object" != e(o))
                            return o;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === n ? String : Number)(t)
                }(t, "string");
                return "symbol" == e(n) ? n : n + ""
            }(n))in t ? Object.defineProperty(t, n, {
                value: r,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : t[n] = r,
            t
        }
        function a(e) {
            if (!e || 0 === Object.keys(e).length)
                return null;
            var n = function(e) {
                var n = o(o({}, t), e);
                return "loginId"in e || (n.loginId = void 0),
                "customId"in e || (n.customId = void 0),
                n
            }(e);
            return function(t) {
                return !!(t.domainName && t.tenantId && t.serverUrl)
            }(n) ? n : (console.error("Invalid BotManager configuration."),
            t)
        }
        var c = "BM-login-id"
          , u = "BM-session-id"
          , s = "BM-clickTimes"
          , l = "BM-lastClickTime"
          , f = "x-botmanager-location"
          , h = "".concat("BM-browser-agent", "-").concat("1.2.4")
          , d = "spf_sid_key"
          , p = "BM-devtools-whitelist"
          , v = "BM-cookie-initialized"
          , y = "developer-tools"
          , g = "";
        function w(t) {
            return t || "https://cdn-botmanager.stclab.com"
        }
        var m = "/deny/index.html"
          , b = "/captcha/index.html"
          , _ = "/challenge/index.html"
          , k = {
            0: m,
            1: _,
            2: b
        }
          , S = "/detect"
          , x = "detectClick";
        function L(t, e) {
            return function(t) {
                if (Array.isArray(t))
                    return t
            }(t) || function(t, e) {
                var n = null == t ? null : "undefined" != typeof Symbol && t[Symbol.iterator] || t["@@iterator"];
                if (null != n) {
                    var r, o, i, a, c = [], u = !0, s = !1;
                    try {
                        if (i = (n = n.call(t)).next,
                        0 === e) {
                            if (Object(n) !== n)
                                return;
                            u = !1
                        } else
                            for (; !(u = (r = i.call(n)).done) && (c.push(r.value),
                            c.length !== e); u = !0)
                                ;
                    } catch (t) {
                        s = !0,
                        o = t
                    } finally {
                        try {
                            if (!u && null != n.return && (a = n.return(),
                            Object(a) !== a))
                                return
                        } finally {
                            if (s)
                                throw o
                        }
                    }
                    return c
                }
            }(t, e) || function(t, e) {
                if (t) {
                    if ("string" == typeof t)
                        return O(t, e);
                    var n = {}.toString.call(t).slice(8, -1);
                    return "Object" === n && t.constructor && (n = t.constructor.name),
                    "Map" === n || "Set" === n ? Array.from(t) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? O(t, e) : void 0
                }
            }(t, e) || function() {
                throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
            }()
        }
        function O(t, e) {
            (null == e || e > t.length) && (e = t.length);
            for (var n = 0, r = Array(e); n < e; n++)
                r[n] = t[n];
            return r
        }
        var E = function(t) {
            var e = document.cookie.match(new RegExp("(^| )" + t + "=([^;]+)"));
            return e ? decodeURIComponent(e[2]) : null
        };
        function j(t, e, n, r) {
            var o = new Date;
            o.setTime(o.getTime() + 24 * n * 60 * 60 * 1e3);
            var i = "".concat(t, "=").concat(encodeURIComponent(e), ";expires=").concat(o.toUTCString(), ";path=/");
            if (r.useMainDomain) {
                var a = function() {
                    var t = window.location.hostname
                      , e = t.split(".");
                    if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(t))
                        return "";
                    if (1 === e.length)
                        return t;
                    var n = e.length > 2 && ["co", "gov"].includes(e[e.length - 2]) ? e.slice(-3).join(".") : e.slice(-2).join(".");
                    return ".".concat(n)
                }();
                i += ";domain=".concat(a)
            }
            r.useSecureCookie && "https:" === location.protocol && (i += ";SameSite=None;Secure"),
            document.cookie = i
        }
        function P(t, e) {
            j(t, "", -1, e)
        }
        var T = function(t) {
            return btoa(t)
        }
          , I = function(t) {
            try {
                return atob(t)
            } catch (t) {
                return console.error("Failed to decode base64 string", t),
                ""
            }
        }
          , C = function(t) {
            window.top && window.top !== window.self ? window.top.location.href = t.toString() : window.location.href = t.toString()
        };
        function A(t) {
            if (t)
                try {
                    var e = new URL(t);
                    e.searchParams.append("redirectUrl", window.location.href),
                    window.top && window.top !== window.self ? window.top.location.href = e.toString() : window.location.href = e.toString()
                } catch (t) {
                    console.error("Unable to redirect using top. Falling back to current window redirect.", t)
                }
        }
        function D(t) {
            if (!t) {
                var e = new URL(window.location.href);
                return {
                    pageUrl: e.pathname,
                    queryString: e.search.replace("?", "")
                }
            }
            try {
                var n = new URL(t);
                return {
                    pageUrl: n.pathname,
                    queryString: n.search.replace("?", "")
                }
            } catch (e) {
                var r = window.location.origin
                  , o = new URL(t.startsWith("/") ? t : "/".concat(t),r);
                return {
                    pageUrl: o.pathname,
                    queryString: o.search.replace("?", "")
                }
            }
        }
        function M(t, e, n) {
            if (!$t.getRedirectingStatus()) {
                var r = e.detectionType
                  , o = e.blockType;
                if ((void 0 === r || 0 !== r) && 0 !== o) {
                    var i = function(t, e) {
                        var n = w(t.protectionServerUrl)
                          , r = k[e] || "";
                        return r ? "".concat(n).concat(r) : null
                    }(t, e.secondVerifyType || 0);
                    if (i) {
                        $t.setRedirectingStatus(!0);
                        var a = N(t, n, e)
                          , c = "".concat(i, "?").concat(a.toString());
                        C(c)
                    }
                }
            }
        }
        function N(t, e, n) {
            var r;
            return new URLSearchParams({
                serverUrl: encodeURIComponent(t.serverUrl),
                tenantId: t.tenantId,
                domainName: t.domainName,
                loginId: T(e.loginId),
                sessionId: e.sessionId,
                pageUrl: e.pageUrl,
                queryString: e.queryString,
                detectionType: (null === (r = n.detectionType) || void 0 === r ? void 0 : r.toString()) || "0",
                agentTag: h,
                redirectUrl: encodeURIComponent(window.location.href)
            })
        }
        function B(t) {
            try {
                return btoa(atob(t)) === t
            } catch (t) {
                return !1
            }
        }
        function R(t, e) {
            var n = arguments.length > 3 ? arguments[3] : void 0
              , r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2] ? T(e) : e;
            localStorage.setItem(t, r),
            j(t, r, 365, n)
        }
        function G(t) {
            var e = arguments.length > 1 && void 0 !== arguments[1] && arguments[1]
              , n = arguments.length > 2 ? arguments[2] : void 0
              , r = localStorage.getItem(t)
              , o = E(t) ? decodeURIComponent(E(t)) : null
              , i = null;
            return r === o ? i = r : r && o && r !== o ? (i = o,
            localStorage.setItem(t, o)) : (i = r || o || null) && (r || localStorage.setItem(t, i),
            o || j(t, i, 365, n)),
            i && e && B(i) ? I(i) : i
        }
        function U(t, e) {
            if (void 0 !== e)
                return R(c, e, !0, t),
                e;
            var n = G(c, !1, t);
            return n ? B(n) ? I(n) : (j(c, T(n), 365, t),
            n) : ""
        }
        function F(t) {
            var e, n, r, o = G(u, !1, t);
            return (!o || o.length > 30) && (e = Date.now().toString(36),
            n = Math.floor(1e3 * performance.now()).toString(36),
            r = (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).substring(0, 12),
            o = "".concat(e, "-").concat(n).concat(r),
            R(u, o, !1, t)),
            o
        }
        function W(t) {
            return W = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            W(t)
        }
        function q() {
            q = function() {
                return e
            }
            ;
            var t, e = {}, n = Object.prototype, r = n.hasOwnProperty, o = Object.defineProperty || function(t, e, n) {
                t[e] = n.value
            }
            , i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
            function s(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }),
                t[e]
            }
            try {
                s({}, "")
            } catch (t) {
                s = function(t, e, n) {
                    return t[e] = n
                }
            }
            function l(t, e, n, r) {
                var i = e && e.prototype instanceof g ? e : g
                  , a = Object.create(i.prototype)
                  , c = new T(r || []);
                return o(a, "_invoke", {
                    value: O(t, n, c)
                }),
                a
            }
            function f(t, e, n) {
                try {
                    return {
                        type: "normal",
                        arg: t.call(e, n)
                    }
                } catch (t) {
                    return {
                        type: "throw",
                        arg: t
                    }
                }
            }
            e.wrap = l;
            var h = "suspendedStart"
              , d = "suspendedYield"
              , p = "executing"
              , v = "completed"
              , y = {};
            function g() {}
            function w() {}
            function m() {}
            var b = {};
            s(b, a, (function() {
                return this
            }
            ));
            var _ = Object.getPrototypeOf
              , k = _ && _(_(I([])));
            k && k !== n && r.call(k, a) && (b = k);
            var S = m.prototype = g.prototype = Object.create(b);
            function x(t) {
                ["next", "throw", "return"].forEach((function(e) {
                    s(t, e, (function(t) {
                        return this._invoke(e, t)
                    }
                    ))
                }
                ))
            }
            function L(t, e) {
                function n(o, i, a, c) {
                    var u = f(t[o], t, i);
                    if ("throw" !== u.type) {
                        var s = u.arg
                          , l = s.value;
                        return l && "object" == W(l) && r.call(l, "__await") ? e.resolve(l.__await).then((function(t) {
                            n("next", t, a, c)
                        }
                        ), (function(t) {
                            n("throw", t, a, c)
                        }
                        )) : e.resolve(l).then((function(t) {
                            s.value = t,
                            a(s)
                        }
                        ), (function(t) {
                            return n("throw", t, a, c)
                        }
                        ))
                    }
                    c(u.arg)
                }
                var i;
                o(this, "_invoke", {
                    value: function(t, r) {
                        function o() {
                            return new e((function(e, o) {
                                n(t, r, e, o)
                            }
                            ))
                        }
                        return i = i ? i.then(o, o) : o()
                    }
                })
            }
            function O(e, n, r) {
                var o = h;
                return function(i, a) {
                    if (o === p)
                        throw Error("Generator is already running");
                    if (o === v) {
                        if ("throw" === i)
                            throw a;
                        return {
                            value: t,
                            done: !0
                        }
                    }
                    for (r.method = i,
                    r.arg = a; ; ) {
                        var c = r.delegate;
                        if (c) {
                            var u = E(c, r);
                            if (u) {
                                if (u === y)
                                    continue;
                                return u
                            }
                        }
                        if ("next" === r.method)
                            r.sent = r._sent = r.arg;
                        else if ("throw" === r.method) {
                            if (o === h)
                                throw o = v,
                                r.arg;
                            r.dispatchException(r.arg)
                        } else
                            "return" === r.method && r.abrupt("return", r.arg);
                        o = p;
                        var s = f(e, n, r);
                        if ("normal" === s.type) {
                            if (o = r.done ? v : d,
                            s.arg === y)
                                continue;
                            return {
                                value: s.arg,
                                done: r.done
                            }
                        }
                        "throw" === s.type && (o = v,
                        r.method = "throw",
                        r.arg = s.arg)
                    }
                }
            }
            function E(e, n) {
                var r = n.method
                  , o = e.iterator[r];
                if (o === t)
                    return n.delegate = null,
                    "throw" === r && e.iterator.return && (n.method = "return",
                    n.arg = t,
                    E(e, n),
                    "throw" === n.method) || "return" !== r && (n.method = "throw",
                    n.arg = new TypeError("The iterator does not provide a '" + r + "' method")),
                    y;
                var i = f(o, e.iterator, n.arg);
                if ("throw" === i.type)
                    return n.method = "throw",
                    n.arg = i.arg,
                    n.delegate = null,
                    y;
                var a = i.arg;
                return a ? a.done ? (n[e.resultName] = a.value,
                n.next = e.nextLoc,
                "return" !== n.method && (n.method = "next",
                n.arg = t),
                n.delegate = null,
                y) : a : (n.method = "throw",
                n.arg = new TypeError("iterator result is not an object"),
                n.delegate = null,
                y)
            }
            function j(t) {
                var e = {
                    tryLoc: t[0]
                };
                1 in t && (e.catchLoc = t[1]),
                2 in t && (e.finallyLoc = t[2],
                e.afterLoc = t[3]),
                this.tryEntries.push(e)
            }
            function P(t) {
                var e = t.completion || {};
                e.type = "normal",
                delete e.arg,
                t.completion = e
            }
            function T(t) {
                this.tryEntries = [{
                    tryLoc: "root"
                }],
                t.forEach(j, this),
                this.reset(!0)
            }
            function I(e) {
                if (e || "" === e) {
                    var n = e[a];
                    if (n)
                        return n.call(e);
                    if ("function" == typeof e.next)
                        return e;
                    if (!isNaN(e.length)) {
                        var o = -1
                          , i = function n() {
                            for (; ++o < e.length; )
                                if (r.call(e, o))
                                    return n.value = e[o],
                                    n.done = !1,
                                    n;
                            return n.value = t,
                            n.done = !0,
                            n
                        };
                        return i.next = i
                    }
                }
                throw new TypeError(W(e) + " is not iterable")
            }
            return w.prototype = m,
            o(S, "constructor", {
                value: m,
                configurable: !0
            }),
            o(m, "constructor", {
                value: w,
                configurable: !0
            }),
            w.displayName = s(m, u, "GeneratorFunction"),
            e.isGeneratorFunction = function(t) {
                var e = "function" == typeof t && t.constructor;
                return !!e && (e === w || "GeneratorFunction" === (e.displayName || e.name))
            }
            ,
            e.mark = function(t) {
                return Object.setPrototypeOf ? Object.setPrototypeOf(t, m) : (t.__proto__ = m,
                s(t, u, "GeneratorFunction")),
                t.prototype = Object.create(S),
                t
            }
            ,
            e.awrap = function(t) {
                return {
                    __await: t
                }
            }
            ,
            x(L.prototype),
            s(L.prototype, c, (function() {
                return this
            }
            )),
            e.AsyncIterator = L,
            e.async = function(t, n, r, o, i) {
                void 0 === i && (i = Promise);
                var a = new L(l(t, n, r, o),i);
                return e.isGeneratorFunction(n) ? a : a.next().then((function(t) {
                    return t.done ? t.value : a.next()
                }
                ))
            }
            ,
            x(S),
            s(S, u, "Generator"),
            s(S, a, (function() {
                return this
            }
            )),
            s(S, "toString", (function() {
                return "[object Generator]"
            }
            )),
            e.keys = function(t) {
                var e = Object(t)
                  , n = [];
                for (var r in e)
                    n.push(r);
                return n.reverse(),
                function t() {
                    for (; n.length; ) {
                        var r = n.pop();
                        if (r in e)
                            return t.value = r,
                            t.done = !1,
                            t
                    }
                    return t.done = !0,
                    t
                }
            }
            ,
            e.values = I,
            T.prototype = {
                constructor: T,
                reset: function(e) {
                    if (this.prev = 0,
                    this.next = 0,
                    this.sent = this._sent = t,
                    this.done = !1,
                    this.delegate = null,
                    this.method = "next",
                    this.arg = t,
                    this.tryEntries.forEach(P),
                    !e)
                        for (var n in this)
                            "t" === n.charAt(0) && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = t)
                },
                stop: function() {
                    this.done = !0;
                    var t = this.tryEntries[0].completion;
                    if ("throw" === t.type)
                        throw t.arg;
                    return this.rval
                },
                dispatchException: function(e) {
                    if (this.done)
                        throw e;
                    var n = this;
                    function o(r, o) {
                        return c.type = "throw",
                        c.arg = e,
                        n.next = r,
                        o && (n.method = "next",
                        n.arg = t),
                        !!o
                    }
                    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                        var a = this.tryEntries[i]
                          , c = a.completion;
                        if ("root" === a.tryLoc)
                            return o("end");
                        if (a.tryLoc <= this.prev) {
                            var u = r.call(a, "catchLoc")
                              , s = r.call(a, "finallyLoc");
                            if (u && s) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0);
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            } else if (u) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0)
                            } else {
                                if (!s)
                                    throw Error("try statement without catch or finally");
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            }
                        }
                    }
                },
                abrupt: function(t, e) {
                    for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                        var o = this.tryEntries[n];
                        if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                            var i = o;
                            break
                        }
                    }
                    i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                    var a = i ? i.completion : {};
                    return a.type = t,
                    a.arg = e,
                    i ? (this.method = "next",
                    this.next = i.finallyLoc,
                    y) : this.complete(a)
                },
                complete: function(t, e) {
                    if ("throw" === t.type)
                        throw t.arg;
                    return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg,
                    this.method = "return",
                    this.next = "end") : "normal" === t.type && e && (this.next = e),
                    y
                },
                finish: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.finallyLoc === t)
                            return this.complete(n.completion, n.afterLoc),
                            P(n),
                            y
                    }
                },
                catch: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.tryLoc === t) {
                            var r = n.completion;
                            if ("throw" === r.type) {
                                var o = r.arg;
                                P(n)
                            }
                            return o
                        }
                    }
                    throw Error("illegal catch attempt")
                },
                delegateYield: function(e, n, r) {
                    return this.delegate = {
                        iterator: I(e),
                        resultName: n,
                        nextLoc: r
                    },
                    "next" === this.method && (this.arg = t),
                    y
                }
            },
            e
        }
        function H(t, e, n, r, o, i, a) {
            try {
                var c = t[i](a)
                  , u = c.value
            } catch (t) {
                return void n(t)
            }
            c.done ? e(u) : Promise.resolve(u).then(r, o)
        }
        function z(t) {
            return function() {
                var e = this
                  , n = arguments;
                return new Promise((function(r, o) {
                    var i = t.apply(e, n);
                    function a(t) {
                        H(i, r, o, a, c, "next", t)
                    }
                    function c(t) {
                        H(i, r, o, a, c, "throw", t)
                    }
                    a(void 0)
                }
                ))
            }
        }
        function J(t, e, n, r) {
            return V.apply(this, arguments)
        }
        function V() {
            return (V = z(q().mark((function t(e, n, r, o) {
                var i, a;
                return q().wrap((function(t) {
                    for (; ; )
                        switch (t.prev = t.next) {
                        case 0:
                            return i = Object.keys(r).map((function(t) {
                                return "".concat(encodeURIComponent(t), "=").concat(encodeURIComponent(r[t]))
                            }
                            )).join("&"),
                            a = "".concat(e).concat(n, "?").concat(i),
                            t.abrupt("return", new Promise((function(t, e) {
                                var n = new AbortController
                                  , r = n.signal
                                  , i = setTimeout((function() {
                                    return n.abort()
                                }
                                ), o);
                                fetch(a, {
                                    signal: r,
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "text/plain"
                                    }
                                }).then((function(n) {
                                    clearTimeout(i),
                                    n.ok ? t(n.json()) : e("Request failed")
                                }
                                )).catch((function(t) {
                                    e(t)
                                }
                                ))
                            }
                            )));
                        case 3:
                        case "end":
                            return t.stop()
                        }
                }
                ), t)
            }
            )))).apply(this, arguments)
        }
        function K(t, e, n, r) {
            return; // 核心修改：直接阻断所有上报请求
        }
        function Y() {
            return (Y = z(q().mark((function t(e, n, r, o) {
                var i, a, c, u, s;
                return q().wrap((function(t) {
                    for (; ; )
                        switch (t.prev = t.next) {
                        case 0:
                            return i = D(),
                            a = r && Object.keys(r).length > 0 ? r : i,
                            t.next = 4,
                            $(e, n, a);
                        case 4:
                            return c = t.sent,
                            t.prev = 5,
                            t.next = 8,
                            J(e.serverUrl, S, c, e.networkTimeout);
                        case 8:
                            u = t.sent,
                            M(e, u, c),
                            o && o(u),
                            t.next = 18;
                            break;
                        case 13:
                            t.prev = 13,
                            t.t0 = t.catch(5),
                            console.error("Error sending detect info:", t.t0),
                            s = {
                                status: "error"
                            },
                            o && o(s);
                        case 18:
                        case "end":
                            return t.stop()
                        }
                }
                ), t, null, [[5, 13]])
            }
            )))).apply(this, arguments)
        }
        function $(t, e, n) {
            return X.apply(this, arguments)
        }
        function X() {
            return (X = z(q().mark((function t(e, n, r) {
                var o, i, a, c;
                return q().wrap((function(t) {
                    for (; ; )
                        switch (t.prev = t.next) {
                        case 0:
                            return o = function(t) {
                                return t ? t.replace(/^\?/, "") : ""
                            }
                            ,
                            i = void 0 !== (null == r ? void 0 : r.queryString) ? o(r.queryString) : o(window.location.search),
                            a = encodeURIComponent(i),
                            c = e.detectAutomation && n.automationTools || "",
                            t.abrupt("return", {
                                tenantId: e.tenantId,
                                domainName: e.domainName,
                                loginId: U(e, e.loginId),
                                sessionId: F(e),
                                pageUrl: (null == r ? void 0 : r.pageUrl) || window.location.pathname,
                                queryString: a,
                                devTool: n.devTool || "",
                                agentTag: h,
                                userBehavior: n.userBehavior || "",
                                hreferrer: document.referrer || "",
                                atn: c
                            });
                        case 5:
                        case "end":
                            return t.stop()
                        }
                }
                ), t)
            }
            )))).apply(this, arguments)
        }
        var Z = n(781)
          , Q = n.n(Z)
          , tt = g
          , et = !1;
        function nt(t) {
            return g; // 始终返回正常状态
        }
        function rt() {
            try {
                var t = localStorage.getItem(p);
                if (!t)
                    return !1;
                if ("Y" === t)
                    return localStorage.removeItem(p),
                    !1;
                var e = JSON.parse(t);
                return Date.now() > e.timestamp + 864e5 ? (localStorage.removeItem(p),
                !1) : !0 === e.whitelisted
            } catch (t) {
                return localStorage.removeItem(p),
                !1
            }
        }
        "undefined" == typeof window || window.devtoolsDetector || (window.devtoolsDetector = Q());
        var ot = JSON.parse(localStorage.getItem(s) || "[]")
          , it = JSON.parse(localStorage.getItem(l) || "null");
        function at(t, e) {
            var n = performance.now()
              , r = t.detectClickMaxTimeDiff || 6e4;
            if (it && n - it > r && (ot = []),
            it) {
                var o = n - it;
                ot.push(o),
                ct(s, ot)
            }
            ct(l, n),
            it = n;
            var i = t.detectClickSampleSize || 7;
            ot.length >= i && (!function(t, e) {
                var n = (o = ot,
                i = o.reduce((function(t, e) {
                    return t + e
                }
                ), 0) / o.length,
                a = o.reduce((function(t, e) {
                    return t + Math.pow(e - i, 2)
                }
                ), 0) / o.length,
                Math.sqrt(a))
                  , r = t.detectClickThreshold || 15;
                var o, i, a;
                n < r && e(x)
            }(t, e),
            ot = [])
        }
        function ct(t, e) {
            localStorage.setItem(t, JSON.stringify(e))
        }
        function ut(t) {
            return ut = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            ut(t)
        }
        function st(t, e) {
            var n = Object.keys(t);
            if (Object.getOwnPropertySymbols) {
                var r = Object.getOwnPropertySymbols(t);
                e && (r = r.filter((function(e) {
                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                }
                ))),
                n.push.apply(n, r)
            }
            return n
        }
        function lt(t, e, n) {
            return (e = function(t) {
                var e = function(t, e) {
                    if ("object" != ut(t) || !t)
                        return t;
                    var n = t[Symbol.toPrimitive];
                    if (void 0 !== n) {
                        var r = n.call(t, e || "default");
                        if ("object" != ut(r))
                            return r;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === e ? String : Number)(t)
                }(t, "string");
                return "symbol" == ut(e) ? e : e + ""
            }(e))in t ? Object.defineProperty(t, e, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : t[e] = n,
            t
        }
        function ft(t) {
            if (t.detectOnLoad) {
                var e = history.pushState
                  , n = history.replaceState
                  , r = {
                    pageUrl: window.location.pathname,
                    queryString: window.location.search.replace("?", "")
                }
                  , o = function() {
                    var e = {
                        pageUrl: window.location.pathname,
                        queryString: window.location.search.replace("?", "")
                    };
                    e.pageUrl === r.pageUrl && e.queryString === r.queryString || (r = function(t) {
                        for (var e = 1; e < arguments.length; e++) {
                            var n = null != arguments[e] ? arguments[e] : {};
                            e % 2 ? st(Object(n), !0).forEach((function(e) {
                                lt(t, e, n[e])
                            }
                            )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : st(Object(n)).forEach((function(e) {
                                Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
                            }
                            ))
                        }
                        return t
                    }({}, e),
                    $t.setRedirectingStatus(!1),
                    t.callback(e))
                };
                history.pushState = function() {
                    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
                        n[r] = arguments[r];
                    e.apply(this, n),
                    o()
                }
                ,
                history.replaceState = function() {
                    for (var t = arguments.length, e = new Array(t), r = 0; r < t; r++)
                        e[r] = arguments[r];
                    n.apply(this, e),
                    o()
                }
                ,
                window.addEventListener("popstate", o)
            }
        }
        function ht(t) {
            if (t) {
                var e = new Date(t).getTime() - Date.now();
                localStorage.setItem("BM_server_time_offset", e.toString())
            }
        }
        function dt(t) {
            var e = XMLHttpRequest.prototype.open
              , n = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function(n, r) {
                var o = !(arguments.length > 2 && void 0 !== arguments[2]) || arguments[2]
                  , i = arguments.length > 3 ? arguments[3] : void 0
                  , a = arguments.length > 4 ? arguments[4] : void 0
                  , c = new URL(r,window.location.href).toString()
                  , u = null == t ? void 0 : t.serverUrl;
                u && c.startsWith(u) || e.call(this, n, c, o, i, a)
            }
            ,
            XMLHttpRequest.prototype.send = function(e) {
                var r = this;
                e instanceof ReadableStream ? console.error("ReadableStream is not supported by XMLHttpRequest") : (n.call(this, e),
                this.addEventListener("load", (function() {
                    try {
                        var e = r.getAllResponseHeaders().split("\r\n").reduce((function(t, e) {
                            var n = L(e.split(": "), 2)
                              , r = n[0]
                              , o = n[1];
                            return r && o && (t[r.toLowerCase()] = o.trim()),
                            t
                        }
                        ), {})
                          , n = e[f];
                        if (null != t && t.preventBypass) {
                            var o = e.date;
                            o && ht(o)
                        }
                        n && A(n)
                    } catch (t) {
                        console.error("Failed to process Location header:", t)
                    }
                }
                )))
            }
        }
        function pt(t) {
            return pt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            pt(t)
        }
        function vt() {
            vt = function() {
                return e
            }
            ;
            var t, e = {}, n = Object.prototype, r = n.hasOwnProperty, o = Object.defineProperty || function(t, e, n) {
                t[e] = n.value
            }
            , i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
            function s(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }),
                t[e]
            }
            try {
                s({}, "")
            } catch (t) {
                s = function(t, e, n) {
                    return t[e] = n
                }
            }
            function l(t, e, n, r) {
                var i = e && e.prototype instanceof g ? e : g
                  , a = Object.create(i.prototype)
                  , c = new T(r || []);
                return o(a, "_invoke", {
                    value: O(t, n, c)
                }),
                a
            }
            function f(t, e, n) {
                try {
                    return {
                        type: "normal",
                        arg: t.call(e, n)
                    }
                } catch (t) {
                    return {
                        type: "throw",
                        arg: t
                    }
                }
            }
            e.wrap = l;
            var h = "suspendedStart"
              , d = "suspendedYield"
              , p = "executing"
              , v = "completed"
              , y = {};
            function g() {}
            function w() {}
            function m() {}
            var b = {};
            s(b, a, (function() {
                return this
            }
            ));
            var _ = Object.getPrototypeOf
              , k = _ && _(_(I([])));
            k && k !== n && r.call(k, a) && (b = k);
            var S = m.prototype = g.prototype = Object.create(b);
            function x(t) {
                ["next", "throw", "return"].forEach((function(e) {
                    s(t, e, (function(t) {
                        return this._invoke(e, t)
                    }
                    ))
                }
                ))
            }
            function L(t, e) {
                function n(o, i, a, c) {
                    var u = f(t[o], t, i);
                    if ("throw" !== u.type) {
                        var s = u.arg
                          , l = s.value;
                        return l && "object" == pt(l) && r.call(l, "__await") ? e.resolve(l.__await).then((function(t) {
                            n("next", t, a, c)
                        }
                        ), (function(t) {
                            n("throw", t, a, c)
                        }
                        )) : e.resolve(l).then((function(t) {
                            s.value = t,
                            a(s)
                        }
                        ), (function(t) {
                            return n("throw", t, a, c)
                        }
                        ))
                    }
                    c(u.arg)
                }
                var i;
                o(this, "_invoke", {
                    value: function(t, r) {
                        function o() {
                            return new e((function(e, o) {
                                n(t, r, e, o)
                            }
                            ))
                        }
                        return i = i ? i.then(o, o) : o()
                    }
                })
            }
            function O(e, n, r) {
                var o = h;
                return function(i, a) {
                    if (o === p)
                        throw Error("Generator is already running");
                    if (o === v) {
                        if ("throw" === i)
                            throw a;
                        return {
                            value: t,
                            done: !0
                        }
                    }
                    for (r.method = i,
                    r.arg = a; ; ) {
                        var c = r.delegate;
                        if (c) {
                            var u = E(c, r);
                            if (u) {
                                if (u === y)
                                    continue;
                                return u
                            }
                        }
                        if ("next" === r.method)
                            r.sent = r._sent = r.arg;
                        else if ("throw" === r.method) {
                            if (o === h)
                                throw o = v,
                                r.arg;
                            r.dispatchException(r.arg)
                        } else
                            "return" === r.method && r.abrupt("return", r.arg);
                        o = p;
                        var s = f(e, n, r);
                        if ("normal" === s.type) {
                            if (o = r.done ? v : d,
                            s.arg === y)
                                continue;
                            return {
                                value: s.arg,
                                done: r.done
                            }
                        }
                        "throw" === s.type && (o = v,
                        r.method = "throw",
                        r.arg = s.arg)
                    }
                }
            }
            function E(e, n) {
                var r = n.method
                  , o = e.iterator[r];
                if (o === t)
                    return n.delegate = null,
                    "throw" === r && e.iterator.return && (n.method = "return",
                    n.arg = t,
                    E(e, n),
                    "throw" === n.method) || "return" !== r && (n.method = "throw",
                    n.arg = new TypeError("The iterator does not provide a '" + r + "' method")),
                    y;
                var i = f(o, e.iterator, n.arg);
                if ("throw" === i.type)
                    return n.method = "throw",
                    n.arg = i.arg,
                    n.delegate = null,
                    y;
                var a = i.arg;
                return a ? a.done ? (n[e.resultName] = a.value,
                n.next = e.nextLoc,
                "return" !== n.method && (n.method = "next",
                n.arg = t),
                n.delegate = null,
                y) : a : (n.method = "throw",
                n.arg = new TypeError("iterator result is not an object"),
                n.delegate = null,
                y)
            }
            function j(t) {
                var e = {
                    tryLoc: t[0]
                };
                1 in t && (e.catchLoc = t[1]),
                2 in t && (e.finallyLoc = t[2],
                e.afterLoc = t[3]),
                this.tryEntries.push(e)
            }
            function P(t) {
                var e = t.completion || {};
                e.type = "normal",
                delete e.arg,
                t.completion = e
            }
            function T(t) {
                this.tryEntries = [{
                    tryLoc: "root"
                }],
                t.forEach(j, this),
                this.reset(!0)
            }
            function I(e) {
                if (e || "" === e) {
                    var n = e[a];
                    if (n)
                        return n.call(e);
                    if ("function" == typeof e.next)
                        return e;
                    if (!isNaN(e.length)) {
                        var o = -1
                          , i = function n() {
                            for (; ++o < e.length; )
                                if (r.call(e, o))
                                    return n.value = e[o],
                                    n.done = !1,
                                    n;
                            return n.value = t,
                            n.done = !0,
                            n
                        };
                        return i.next = i
                    }
                }
                throw new TypeError(pt(e) + " is not iterable")
            }
            return w.prototype = m,
            o(S, "constructor", {
                value: m,
                configurable: !0
            }),
            o(m, "constructor", {
                value: w,
                configurable: !0
            }),
            w.displayName = s(m, u, "GeneratorFunction"),
            e.isGeneratorFunction = function(t) {
                var e = "function" == typeof t && t.constructor;
                return !!e && (e === w || "GeneratorFunction" === (e.displayName || e.name))
            }
            ,
            e.mark = function(t) {
                return Object.setPrototypeOf ? Object.setPrototypeOf(t, m) : (t.__proto__ = m,
                s(t, u, "GeneratorFunction")),
                t.prototype = Object.create(S),
                t
            }
            ,
            e.awrap = function(t) {
                return {
                    __await: t
                }
            }
            ,
            x(L.prototype),
            s(L.prototype, c, (function() {
                return this
            }
            )),
            e.AsyncIterator = L,
            e.async = function(t, n, r, o, i) {
                void 0 === i && (i = Promise);
                var a = new L(l(t, n, r, o),i);
                return e.isGeneratorFunction(n) ? a : a.next().then((function(t) {
                    return t.done ? t.value : a.next()
                }
                ))
            }
            ,
            x(S),
            s(S, u, "Generator"),
            s(S, a, (function() {
                return this
            }
            )),
            s(S, "toString", (function() {
                return "[object Generator]"
            }
            )),
            e.keys = function(t) {
                var e = Object(t)
                  , n = [];
                for (var r in e)
                    n.push(r);
                return n.reverse(),
                function t() {
                    for (; n.length; ) {
                        var r = n.pop();
                        if (r in e)
                            return t.value = r,
                            t.done = !1,
                            t
                    }
                    return t.done = !0,
                    t
                }
            }
            ,
            e.values = I,
            T.prototype = {
                constructor: T,
                reset: function(e) {
                    if (this.prev = 0,
                    this.next = 0,
                    this.sent = this._sent = t,
                    this.done = !1,
                    this.delegate = null,
                    this.method = "next",
                    this.arg = t,
                    this.tryEntries.forEach(P),
                    !e)
                        for (var n in this)
                            "t" === n.charAt(0) && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = t)
                },
                stop: function() {
                    this.done = !0;
                    var t = this.tryEntries[0].completion;
                    if ("throw" === t.type)
                        throw t.arg;
                    return this.rval
                },
                dispatchException: function(e) {
                    if (this.done)
                        throw e;
                    var n = this;
                    function o(r, o) {
                        return c.type = "throw",
                        c.arg = e,
                        n.next = r,
                        o && (n.method = "next",
                        n.arg = t),
                        !!o
                    }
                    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                        var a = this.tryEntries[i]
                          , c = a.completion;
                        if ("root" === a.tryLoc)
                            return o("end");
                        if (a.tryLoc <= this.prev) {
                            var u = r.call(a, "catchLoc")
                              , s = r.call(a, "finallyLoc");
                            if (u && s) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0);
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            } else if (u) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0)
                            } else {
                                if (!s)
                                    throw Error("try statement without catch or finally");
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            }
                        }
                    }
                },
                abrupt: function(t, e) {
                    for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                        var o = this.tryEntries[n];
                        if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                            var i = o;
                            break
                        }
                    }
                    i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                    var a = i ? i.completion : {};
                    return a.type = t,
                    a.arg = e,
                    i ? (this.method = "next",
                    this.next = i.finallyLoc,
                    y) : this.complete(a)
                },
                complete: function(t, e) {
                    if ("throw" === t.type)
                        throw t.arg;
                    return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg,
                    this.method = "return",
                    this.next = "end") : "normal" === t.type && e && (this.next = e),
                    y
                },
                finish: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.finallyLoc === t)
                            return this.complete(n.completion, n.afterLoc),
                            P(n),
                            y
                    }
                },
                catch: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.tryLoc === t) {
                            var r = n.completion;
                            if ("throw" === r.type) {
                                var o = r.arg;
                                P(n)
                            }
                            return o
                        }
                    }
                    throw Error("illegal catch attempt")
                },
                delegateYield: function(e, n, r) {
                    return this.delegate = {
                        iterator: I(e),
                        resultName: n,
                        nextLoc: r
                    },
                    "next" === this.method && (this.arg = t),
                    y
                }
            },
            e
        }
        function yt(t, e, n, r, o, i, a) {
            try {
                var c = t[i](a)
                  , u = c.value
            } catch (t) {
                return void n(t)
            }
            c.done ? e(u) : Promise.resolve(u).then(r, o)
        }
        function gt(t) {
            var e = window.fetch;
            window.fetch = function() {
                var n, r = (n = vt().mark((function n(r, o) {
                    var i, a, c, u, s;
                    return vt().wrap((function(n) {
                        for (; ; )
                            switch (n.prev = n.next) {
                            case 0:
                                if (i = "string" == typeof r ? new URL(r,window.location.href).toString() : r instanceof URL ? r.href : r.toString(),
                                !(a = null == t ? void 0 : t.serverUrl) || !i.startsWith(a)) {
                                    n.next = 4;
                                    break
                                }
                                return n.abrupt("return", e(i, o));
                            case 4:
                                return n.prev = 4,
                                n.next = 7,
                                e(i, o);
                            case 7:
                                return c = n.sent,
                                u = c.headers.get(f),
                                null != t && t.preventBypass && (s = c.headers.get("date")) && ht(s),
                                u && A(u),
                                n.abrupt("return", c);
                            case 14:
                                throw n.prev = 14,
                                n.t0 = n.catch(4),
                                n.t0;
                            case 17:
                            case "end":
                                return n.stop()
                            }
                    }
                    ), n, null, [[4, 14]])
                }
                )),
                function() {
                    var t = this
                      , e = arguments;
                    return new Promise((function(r, o) {
                        var i = n.apply(t, e);
                        function a(t) {
                            yt(i, r, o, a, c, "next", t)
                        }
                        function c(t) {
                            yt(i, r, o, a, c, "throw", t)
                        }
                        a(void 0)
                    }
                    ))
                }
                );
                return function(t, e) {
                    return r.apply(this, arguments)
                }
            }()
        }
        function wt(t) {
            return wt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            wt(t)
        }
        function mt(t, e) {
            for (var n = 0; n < e.length; n++) {
                var r = e[n];
                r.enumerable = r.enumerable || !1,
                r.configurable = !0,
                "value"in r && (r.writable = !0),
                Object.defineProperty(t, _t(r.key), r)
            }
        }
        function bt(t, e, n) {
            return (e = _t(e))in t ? Object.defineProperty(t, e, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : t[e] = n,
            t
        }
        function _t(t) {
            var e = function(t, e) {
                if ("object" != wt(t) || !t)
                    return t;
                var n = t[Symbol.toPrimitive];
                if (void 0 !== n) {
                    var r = n.call(t, e || "default");
                    if ("object" != wt(r))
                        return r;
                    throw new TypeError("@@toPrimitive must return a primitive value.")
                }
                return ("string" === e ? String : Number)(t)
            }(t, "string");
            return "symbol" == wt(e) ? e : e + ""
        }
        var kt = function() {
            return t = function t(e) {
                !function(t, e) {
                    if (!(t instanceof e))
                        throw new TypeError("Cannot call a class as a function")
                }(this, t),
                bt(this, "cookieRefreshInterval", null),
                bt(this, "lastCookieCheck", 0),
                this.config = e;
                var n = this.parseDetectTimeToMinutes(this.config.preventBypassDetectTime || "1M");
                (this.config.preventBypassMinutes || 1) > n && (this.config.preventBypassMinutes = n)
            }
            ,
            e = [{
                key: "initialize",
                value: function() {
                    this.checkOnPageChange(),
                    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this)),
                    window.addEventListener("focus", this.handleVisibilityChange.bind(this)),
                    document.addEventListener("pageshow", this.handlePageShowChange.bind(this))
                }
            }, {
                key: "handleVisibilityChange",
                value: function() {
                    document.hidden || this.checkAndAdjustCookieInterval()
                }
            }, {
                key: "handlePageShowChange",
                value: function(t) {
                    t.persisted && this.checkAndAdjustCookieInterval()
                }
            }, {
                key: "checkOnPageChange",
                value: function() {
                    this.checkAndDeleteCBkSid(),
                    this.checkAndAdjustCookieInterval()
                }
            }, {
                key: "checkAndDeleteCBkSid",
                value: function() {
                    E("c_bk_sid") && P("c_bk_sid", this.config)
                }
            }, {
                key: "refreshAntiBypassCookie",
                value: function() {
                    var t = this
                      , e = this.config.preventBypassMinutes || 1
                      , n = this.makeAntiBypassToken()
                      , r = this.config.preventBypassDetectTime || "5M"
                      , o = this.parseDetectTime(r);
                    j(d, n, o, this.config),
                    this.lastCookieCheck = Date.now(),
                    this.cookieRefreshInterval && clearInterval(this.cookieRefreshInterval);
                    var i = 60 * e * 1e3;
                    this.cookieRefreshInterval = window.setInterval((function() {
                        t.refreshAntiBypassCookie()
                    }
                    ), i)
                }
            }, {
                key: "parseDetectTimeToMinutes",
                value: function() {
                    var t = (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "1M").match(/^(\d+)([MHD])$/);
                    if (!t)
                        return 1;
                    var e = parseInt(t[1], 10);
                    switch (t[2]) {
                    case "M":
                        return e;
                    case "H":
                        return 60 * e;
                    case "D":
                        return 1440 * e;
                    default:
                        return 5
                    }
                }
            }, {
                key: "parseDetectTime",
                value: function() {
                    var t = (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "5M").match(/^(\d+)([MHD])$/);
                    if (!t)
                        return 5 / 1440;
                    var e, n = parseInt(t[1], 10);
                    switch (t[2]) {
                    case "M":
                        e = n / 1440;
                        break;
                    case "H":
                        e = n / 24;
                        break;
                    case "D":
                        e = n;
                        break;
                    default:
                        e = 12.5
                    }
                    return e
                }
            }, {
                key: "makeAntiBypassToken",
                value: function() {
                    for (var t, e = Math.floor((t = Number(localStorage.getItem("BM_server_time_offset") || 0),
                    (Date.now() + t) / 1e3)).toString(), n = 0; n < 3; n++)
                        e = btoa(e);
                    return e
                }
            }, {
                key: "getAntiBypassToken",
                value: function() {
                    var t = E(d)
                      , e = t ? decodeURIComponent(t) : null;
                    if (!e)
                        return "";
                    for (var n = e, r = 0; r < 3; r++)
                        n = atob(n);
                    return n
                }
            }, {
                key: "checkAndAdjustCookieInterval",
                value: function() {
                    var t = this
                      , e = Date.now()
                      , n = this.getAntiBypassToken()
                      , r = 60 * (this.config.preventBypassMinutes || 5) * 1e3;
                    try {
                        if (n) {
                            var o = e - 1e3 * parseInt(n);
                            if (o > r)
                                this.refreshAntiBypassCookie();
                            else {
                                var i = r - o;
                                this.cookieRefreshInterval && clearInterval(this.cookieRefreshInterval),
                                this.cookieRefreshInterval = window.setInterval((function() {
                                    t.refreshAntiBypassCookie()
                                }
                                ), i)
                            }
                        } else
                            this.refreshAntiBypassCookie();
                        this.lastCookieCheck = e
                    } catch (t) {
                        return void console.error("Error decoding anti-bypass cookie:", t)
                    }
                }
            }, {
                key: "destroy",
                value: function() {
                    this.cookieRefreshInterval && (clearInterval(this.cookieRefreshInterval),
                    this.cookieRefreshInterval = null)
                }
            }],
            e && mt(t.prototype, e),
            n && mt(t, n),
            Object.defineProperty(t, "prototype", {
                writable: !1
            }),
            t;
            var t, e, n
        }();
        function St(t) {
            return St = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            St(t)
        }
        function xt() {
            xt = function() {
                return e
            }
            ;
            var t, e = {}, n = Object.prototype, r = n.hasOwnProperty, o = Object.defineProperty || function(t, e, n) {
                t[e] = n.value
            }
            , i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
            function s(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }),
                t[e]
            }
            try {
                s({}, "")
            } catch (t) {
                s = function(t, e, n) {
                    return t[e] = n
                }
            }
            function l(t, e, n, r) {
                var i = e && e.prototype instanceof g ? e : g
                  , a = Object.create(i.prototype)
                  , c = new T(r || []);
                return o(a, "_invoke", {
                    value: O(t, n, c)
                }),
                a
            }
            function f(t, e, n) {
                try {
                    return {
                        type: "normal",
                        arg: t.call(e, n)
                    }
                } catch (t) {
                    return {
                        type: "throw",
                        arg: t
                    }
                }
            }
            e.wrap = l;
            var h = "suspendedStart"
              , d = "suspendedYield"
              , p = "executing"
              , v = "completed"
              , y = {};
            function g() {}
            function w() {}
            function m() {}
            var b = {};
            s(b, a, (function() {
                return this
            }
            ));
            var _ = Object.getPrototypeOf
              , k = _ && _(_(I([])));
            k && k !== n && r.call(k, a) && (b = k);
            var S = m.prototype = g.prototype = Object.create(b);
            function x(t) {
                ["next", "throw", "return"].forEach((function(e) {
                    s(t, e, (function(t) {
                        return this._invoke(e, t)
                    }
                    ))
                }
                ))
            }
            function L(t, e) {
                function n(o, i, a, c) {
                    var u = f(t[o], t, i);
                    if ("throw" !== u.type) {
                        var s = u.arg
                          , l = s.value;
                        return l && "object" == St(l) && r.call(l, "__await") ? e.resolve(l.__await).then((function(t) {
                            n("next", t, a, c)
                        }
                        ), (function(t) {
                            n("throw", t, a, c)
                        }
                        )) : e.resolve(l).then((function(t) {
                            s.value = t,
                            a(s)
                        }
                        ), (function(t) {
                            return n("throw", t, a, c)
                        }
                        ))
                    }
                    c(u.arg)
                }
                var i;
                o(this, "_invoke", {
                    value: function(t, r) {
                        function o() {
                            return new e((function(e, o) {
                                n(t, r, e, o)
                            }
                            ))
                        }
                        return i = i ? i.then(o, o) : o()
                    }
                })
            }
            function O(e, n, r) {
                var o = h;
                return function(i, a) {
                    if (o === p)
                        throw Error("Generator is already running");
                    if (o === v) {
                        if ("throw" === i)
                            throw a;
                        return {
                            value: t,
                            done: !0
                        }
                    }
                    for (r.method = i,
                    r.arg = a; ; ) {
                        var c = r.delegate;
                        if (c) {
                            var u = E(c, r);
                            if (u) {
                                if (u === y)
                                    continue;
                                return u
                            }
                        }
                        if ("next" === r.method)
                            r.sent = r._sent = r.arg;
                        else if ("throw" === r.method) {
                            if (o === h)
                                throw o = v,
                                r.arg;
                            r.dispatchException(r.arg)
                        } else
                            "return" === r.method && r.abrupt("return", r.arg);
                        o = p;
                        var s = f(e, n, r);
                        if ("normal" === s.type) {
                            if (o = r.done ? v : d,
                            s.arg === y)
                                continue;
                            return {
                                value: s.arg,
                                done: r.done
                            }
                        }
                        "throw" === s.type && (o = v,
                        r.method = "throw",
                        r.arg = s.arg)
                    }
                }
            }
            function E(e, n) {
                var r = n.method
                  , o = e.iterator[r];
                if (o === t)
                    return n.delegate = null,
                    "throw" === r && e.iterator.return && (n.method = "return",
                    n.arg = t,
                    E(e, n),
                    "throw" === n.method) || "return" !== r && (n.method = "throw",
                    n.arg = new TypeError("The iterator does not provide a '" + r + "' method")),
                    y;
                var i = f(o, e.iterator, n.arg);
                if ("throw" === i.type)
                    return n.method = "throw",
                    n.arg = i.arg,
                    n.delegate = null,
                    y;
                var a = i.arg;
                return a ? a.done ? (n[e.resultName] = a.value,
                n.next = e.nextLoc,
                "return" !== n.method && (n.method = "next",
                n.arg = t),
                n.delegate = null,
                y) : a : (n.method = "throw",
                n.arg = new TypeError("iterator result is not an object"),
                n.delegate = null,
                y)
            }
            function j(t) {
                var e = {
                    tryLoc: t[0]
                };
                1 in t && (e.catchLoc = t[1]),
                2 in t && (e.finallyLoc = t[2],
                e.afterLoc = t[3]),
                this.tryEntries.push(e)
            }
            function P(t) {
                var e = t.completion || {};
                e.type = "normal",
                delete e.arg,
                t.completion = e
            }
            function T(t) {
                this.tryEntries = [{
                    tryLoc: "root"
                }],
                t.forEach(j, this),
                this.reset(!0)
            }
            function I(e) {
                if (e || "" === e) {
                    var n = e[a];
                    if (n)
                        return n.call(e);
                    if ("function" == typeof e.next)
                        return e;
                    if (!isNaN(e.length)) {
                        var o = -1
                          , i = function n() {
                            for (; ++o < e.length; )
                                if (r.call(e, o))
                                    return n.value = e[o],
                                    n.done = !1,
                                    n;
                            return n.value = t,
                            n.done = !0,
                            n
                        };
                        return i.next = i
                    }
                }
                throw new TypeError(St(e) + " is not iterable")
            }
            return w.prototype = m,
            o(S, "constructor", {
                value: m,
                configurable: !0
            }),
            o(m, "constructor", {
                value: w,
                configurable: !0
            }),
            w.displayName = s(m, u, "GeneratorFunction"),
            e.isGeneratorFunction = function(t) {
                var e = "function" == typeof t && t.constructor;
                return !!e && (e === w || "GeneratorFunction" === (e.displayName || e.name))
            }
            ,
            e.mark = function(t) {
                return Object.setPrototypeOf ? Object.setPrototypeOf(t, m) : (t.__proto__ = m,
                s(t, u, "GeneratorFunction")),
                t.prototype = Object.create(S),
                t
            }
            ,
            e.awrap = function(t) {
                return {
                    __await: t
                }
            }
            ,
            x(L.prototype),
            s(L.prototype, c, (function() {
                return this
            }
            )),
            e.AsyncIterator = L,
            e.async = function(t, n, r, o, i) {
                void 0 === i && (i = Promise);
                var a = new L(l(t, n, r, o),i);
                return e.isGeneratorFunction(n) ? a : a.next().then((function(t) {
                    return t.done ? t.value : a.next()
                }
                ))
            }
            ,
            x(S),
            s(S, u, "Generator"),
            s(S, a, (function() {
                return this
            }
            )),
            s(S, "toString", (function() {
                return "[object Generator]"
            }
            )),
            e.keys = function(t) {
                var e = Object(t)
                  , n = [];
                for (var r in e)
                    n.push(r);
                return n.reverse(),
                function t() {
                    for (; n.length; ) {
                        var r = n.pop();
                        if (r in e)
                            return t.value = r,
                            t.done = !1,
                            t
                    }
                    return t.done = !0,
                    t
                }
            }
            ,
            e.values = I,
            T.prototype = {
                constructor: T,
                reset: function(e) {
                    if (this.prev = 0,
                    this.next = 0,
                    this.sent = this._sent = t,
                    this.done = !1,
                    this.delegate = null,
                    this.method = "next",
                    this.arg = t,
                    this.tryEntries.forEach(P),
                    !e)
                        for (var n in this)
                            "t" === n.charAt(0) && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = t)
                },
                stop: function() {
                    this.done = !0;
                    var t = this.tryEntries[0].completion;
                    if ("throw" === t.type)
                        throw t.arg;
                    return this.rval
                },
                dispatchException: function(e) {
                    if (this.done)
                        throw e;
                    var n = this;
                    function o(r, o) {
                        return c.type = "throw",
                        c.arg = e,
                        n.next = r,
                        o && (n.method = "next",
                        n.arg = t),
                        !!o
                    }
                    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                        var a = this.tryEntries[i]
                          , c = a.completion;
                        if ("root" === a.tryLoc)
                            return o("end");
                        if (a.tryLoc <= this.prev) {
                            var u = r.call(a, "catchLoc")
                              , s = r.call(a, "finallyLoc");
                            if (u && s) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0);
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            } else if (u) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0)
                            } else {
                                if (!s)
                                    throw Error("try statement without catch or finally");
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            }
                        }
                    }
                },
                abrupt: function(t, e) {
                    for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                        var o = this.tryEntries[n];
                        if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                            var i = o;
                            break
                        }
                    }
                    i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                    var a = i ? i.completion : {};
                    return a.type = t,
                    a.arg = e,
                    i ? (this.method = "next",
                    this.next = i.finallyLoc,
                    y) : this.complete(a)
                },
                complete: function(t, e) {
                    if ("throw" === t.type)
                        throw t.arg;
                    return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg,
                    this.method = "return",
                    this.next = "end") : "normal" === t.type && e && (this.next = e),
                    y
                },
                finish: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.finallyLoc === t)
                            return this.complete(n.completion, n.afterLoc),
                            P(n),
                            y
                    }
                },
                catch: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.tryLoc === t) {
                            var r = n.completion;
                            if ("throw" === r.type) {
                                var o = r.arg;
                                P(n)
                            }
                            return o
                        }
                    }
                    throw Error("illegal catch attempt")
                },
                delegateYield: function(e, n, r) {
                    return this.delegate = {
                        iterator: I(e),
                        resultName: n,
                        nextLoc: r
                    },
                    "next" === this.method && (this.arg = t),
                    y
                }
            },
            e
        }
        function Lt(t, e, n, r, o, i, a) {
            try {
                var c = t[i](a)
                  , u = c.value
            } catch (t) {
                return void n(t)
            }
            c.done ? e(u) : Promise.resolve(u).then(r, o)
        }
        function Ot() {
            var t;
            return t = xt().mark((function t(e, n, r, o) {
                var i, a;
                return xt().wrap((function(t) {
                    for (; ; )
                        switch (t.prev = t.next) {
                        case 0:
                            return i = {
                                code: o,
                                blockType: o,
                                detectionType: o,
                                secondVerifyType: 0,
                                message: "Invalid session_id: timestamp out of range"
                            },
                            t.next = 3,
                            $(e, n, r);
                        case 3:
                            return a = t.sent,
                            t.abrupt("return", N(e, a, i));
                        case 5:
                        case "end":
                            return t.stop()
                        }
                }
                ), t)
            }
            )),
            Ot = function() {
                var e = this
                  , n = arguments;
                return new Promise((function(r, o) {
                    var i = t.apply(e, n);
                    function a(t) {
                        Lt(i, r, o, a, c, "next", t)
                    }
                    function c(t) {
                        Lt(i, r, o, a, c, "throw", t)
                    }
                    a(void 0)
                }
                ))
            }
            ,
            Ot.apply(this, arguments)
        }
        function Et(t, e) {
            return function(t) {
                if (Array.isArray(t))
                    return t
            }(t) || function(t, e) {
                var n = null == t ? null : "undefined" != typeof Symbol && t[Symbol.iterator] || t["@@iterator"];
                if (null != n) {
                    var r, o, i, a, c = [], u = !0, s = !1;
                    try {
                        if (i = (n = n.call(t)).next,
                        0 === e) {
                            if (Object(n) !== n)
                                return;
                            u = !1
                        } else
                            for (; !(u = (r = i.call(n)).done) && (c.push(r.value),
                            c.length !== e); u = !0)
                                ;
                    } catch (t) {
                        s = !0,
                        o = t
                    } finally {
                        try {
                            if (!u && null != n.return && (a = n.return(),
                            Object(a) !== a))
                                return
                        } finally {
                            if (s)
                                throw o
                        }
                    }
                    return c
                }
            }(t, e) || function(t, e) {
                if (t) {
                    if ("string" == typeof t)
                        return jt(t, e);
                    var n = {}.toString.call(t).slice(8, -1);
                    return "Object" === n && t.constructor && (n = t.constructor.name),
                    "Map" === n || "Set" === n ? Array.from(t) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? jt(t, e) : void 0
                }
            }(t, e) || function() {
                throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
            }()
        }
        function jt(t, e) {
            (null == e || e > t.length) && (e = t.length);
            for (var n = 0, r = Array(e); n < e; n++)
                r[n] = t[n];
            return r
        }
        function Pt(t) {
            var e = F(t);
            if (e && !function(t) {
                if (!t)
                    return !1;
                var e = t.split("-");
                if (e.length < 2)
                    return !1;
                var n, r = Et(e, 2), o = r[0], i = r[1];
                if (!/^[0-9a-z]+$/.test(o))
                    return !1;
                try {
                    if (n = parseInt(o, 36),
                    isNaN(n))
                        return !1
                } catch (t) {
                    return !1
                }
                var a = Date.now();
                return !(n < a - 15768e7 || n > a + 864e5 || !i || i.length < 8)
            }(e)) {
                console.warn("Invalid session_id: timestamp out of range");
                var n = w(t.protectionServerUrl)
                  , r = m
                  , o = function(t, e, n, r) {
                    return Ot.apply(this, arguments)
                }(t, {}, {}, 400);
                throw C("".concat(n).concat(r, "?").concat(o.toString())),
                new Error("Invalid session_id: timestamp out of range")
            }
        }
        function Tt(t) {
            return Tt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            Tt(t)
        }
        function It(t) {
            return function(t) {
                if (Array.isArray(t))
                    return Ct(t)
            }(t) || function(t) {
                if ("undefined" != typeof Symbol && null != t[Symbol.iterator] || null != t["@@iterator"])
                    return Array.from(t)
            }(t) || function(t, e) {
                if (t) {
                    if ("string" == typeof t)
                        return Ct(t, e);
                    var n = {}.toString.call(t).slice(8, -1);
                    return "Object" === n && t.constructor && (n = t.constructor.name),
                    "Map" === n || "Set" === n ? Array.from(t) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ct(t, e) : void 0
                }
            }(t) || function() {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
            }()
        }
        function Ct(t, e) {
            (null == e || e > t.length) && (e = t.length);
            for (var n = 0, r = Array(e); n < e; n++)
                r[n] = t[n];
            return r
        }
        function At() {
            At = function() {
                return e
            }
            ;
            var t, e = {}, n = Object.prototype, r = n.hasOwnProperty, o = Object.defineProperty || function(t, e, n) {
                t[e] = n.value
            }
            , i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
            function s(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }),
                t[e]
            }
            try {
                s({}, "")
            } catch (t) {
                s = function(t, e, n) {
                    return t[e] = n
                }
            }
            function l(t, e, n, r) {
                var i = e && e.prototype instanceof g ? e : g
                  , a = Object.create(i.prototype)
                  , c = new T(r || []);
                return o(a, "_invoke", {
                    value: O(t, n, c)
                }),
                a
            }
            function f(t, e, n) {
                try {
                    return {
                        type: "normal",
                        arg: t.call(e, n)
                    }
                } catch (t) {
                    return {
                        type: "throw",
                        arg: t
                    }
                }
            }
            e.wrap = l;
            var h = "suspendedStart"
              , d = "suspendedYield"
              , p = "executing"
              , v = "completed"
              , y = {};
            function g() {}
            function w() {}
            function m() {}
            var b = {};
            s(b, a, (function() {
                return this
            }
            ));
            var _ = Object.getPrototypeOf
              , k = _ && _(_(I([])));
            k && k !== n && r.call(k, a) && (b = k);
            var S = m.prototype = g.prototype = Object.create(b);
            function x(t) {
                ["next", "throw", "return"].forEach((function(e) {
                    s(t, e, (function(t) {
                        return this._invoke(e, t)
                    }
                    ))
                }
                ))
            }
            function L(t, e) {
                function n(o, i, a, c) {
                    var u = f(t[o], t, i);
                    if ("throw" !== u.type) {
                        var s = u.arg
                          , l = s.value;
                        return l && "object" == Tt(l) && r.call(l, "__await") ? e.resolve(l.__await).then((function(t) {
                            n("next", t, a, c)
                        }
                        ), (function(t) {
                            n("throw", t, a, c)
                        }
                        )) : e.resolve(l).then((function(t) {
                            s.value = t,
                            a(s)
                        }
                        ), (function(t) {
                            return n("throw", t, a, c)
                        }
                        ))
                    }
                    c(u.arg)
                }
                var i;
                o(this, "_invoke", {
                    value: function(t, r) {
                        function o() {
                            return new e((function(e, o) {
                                n(t, r, e, o)
                            }
                            ))
                        }
                        return i = i ? i.then(o, o) : o()
                    }
                })
            }
            function O(e, n, r) {
                var o = h;
                return function(i, a) {
                    if (o === p)
                        throw Error("Generator is already running");
                    if (o === v) {
                        if ("throw" === i)
                            throw a;
                        return {
                            value: t,
                            done: !0
                        }
                    }
                    for (r.method = i,
                    r.arg = a; ; ) {
                        var c = r.delegate;
                        if (c) {
                            var u = E(c, r);
                            if (u) {
                                if (u === y)
                                    continue;
                                return u
                            }
                        }
                        if ("next" === r.method)
                            r.sent = r._sent = r.arg;
                        else if ("throw" === r.method) {
                            if (o === h)
                                throw o = v,
                                r.arg;
                            r.dispatchException(r.arg)
                        } else
                            "return" === r.method && r.abrupt("return", r.arg);
                        o = p;
                        var s = f(e, n, r);
                        if ("normal" === s.type) {
                            if (o = r.done ? v : d,
                            s.arg === y)
                                continue;
                            return {
                                value: s.arg,
                                done: r.done
                            }
                        }
                        "throw" === s.type && (o = v,
                        r.method = "throw",
                        r.arg = s.arg)
                    }
                }
            }
            function E(e, n) {
                var r = n.method
                  , o = e.iterator[r];
                if (o === t)
                    return n.delegate = null,
                    "throw" === r && e.iterator.return && (n.method = "return",
                    n.arg = t,
                    E(e, n),
                    "throw" === n.method) || "return" !== r && (n.method = "throw",
                    n.arg = new TypeError("The iterator does not provide a '" + r + "' method")),
                    y;
                var i = f(o, e.iterator, n.arg);
                if ("throw" === i.type)
                    return n.method = "throw",
                    n.arg = i.arg,
                    n.delegate = null,
                    y;
                var a = i.arg;
                return a ? a.done ? (n[e.resultName] = a.value,
                n.next = e.nextLoc,
                "return" !== n.method && (n.method = "next",
                n.arg = t),
                n.delegate = null,
                y) : a : (n.method = "throw",
                n.arg = new TypeError("iterator result is not an object"),
                n.delegate = null,
                y)
            }
            function j(t) {
                var e = {
                    tryLoc: t[0]
                };
                1 in t && (e.catchLoc = t[1]),
                2 in t && (e.finallyLoc = t[2],
                e.afterLoc = t[3]),
                this.tryEntries.push(e)
            }
            function P(t) {
                var e = t.completion || {};
                e.type = "normal",
                delete e.arg,
                t.completion = e
            }
            function T(t) {
                this.tryEntries = [{
                    tryLoc: "root"
                }],
                t.forEach(j, this),
                this.reset(!0)
            }
            function I(e) {
                if (e || "" === e) {
                    var n = e[a];
                    if (n)
                        return n.call(e);
                    if ("function" == typeof e.next)
                        return e;
                    if (!isNaN(e.length)) {
                        var o = -1
                          , i = function n() {
                            for (; ++o < e.length; )
                                if (r.call(e, o))
                                    return n.value = e[o],
                                    n.done = !1,
                                    n;
                            return n.value = t,
                            n.done = !0,
                            n
                        };
                        return i.next = i
                    }
                }
                throw new TypeError(Tt(e) + " is not iterable")
            }
            return w.prototype = m,
            o(S, "constructor", {
                value: m,
                configurable: !0
            }),
            o(m, "constructor", {
                value: w,
                configurable: !0
            }),
            w.displayName = s(m, u, "GeneratorFunction"),
            e.isGeneratorFunction = function(t) {
                var e = "function" == typeof t && t.constructor;
                return !!e && (e === w || "GeneratorFunction" === (e.displayName || e.name))
            }
            ,
            e.mark = function(t) {
                return Object.setPrototypeOf ? Object.setPrototypeOf(t, m) : (t.__proto__ = m,
                s(t, u, "GeneratorFunction")),
                t.prototype = Object.create(S),
                t
            }
            ,
            e.awrap = function(t) {
                return {
                    __await: t
                }
            }
            ,
            x(L.prototype),
            s(L.prototype, c, (function() {
                return this
            }
            )),
            e.AsyncIterator = L,
            e.async = function(t, n, r, o, i) {
                void 0 === i && (i = Promise);
                var a = new L(l(t, n, r, o),i);
                return e.isGeneratorFunction(n) ? a : a.next().then((function(t) {
                    return t.done ? t.value : a.next()
                }
                ))
            }
            ,
            x(S),
            s(S, u, "Generator"),
            s(S, a, (function() {
                return this
            }
            )),
            s(S, "toString", (function() {
                return "[object Generator]"
            }
            )),
            e.keys = function(t) {
                var e = Object(t)
                  , n = [];
                for (var r in e)
                    n.push(r);
                return n.reverse(),
                function t() {
                    for (; n.length; ) {
                        var r = n.pop();
                        if (r in e)
                            return t.value = r,
                            t.done = !1,
                            t
                    }
                    return t.done = !0,
                    t
                }
            }
            ,
            e.values = I,
            T.prototype = {
                constructor: T,
                reset: function(e) {
                    if (this.prev = 0,
                    this.next = 0,
                    this.sent = this._sent = t,
                    this.done = !1,
                    this.delegate = null,
                    this.method = "next",
                    this.arg = t,
                    this.tryEntries.forEach(P),
                    !e)
                        for (var n in this)
                            "t" === n.charAt(0) && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = t)
                },
                stop: function() {
                    this.done = !0;
                    var t = this.tryEntries[0].completion;
                    if ("throw" === t.type)
                        throw t.arg;
                    return this.rval
                },
                dispatchException: function(e) {
                    if (this.done)
                        throw e;
                    var n = this;
                    function o(r, o) {
                        return c.type = "throw",
                        c.arg = e,
                        n.next = r,
                        o && (n.method = "next",
                        n.arg = t),
                        !!o
                    }
                    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                        var a = this.tryEntries[i]
                          , c = a.completion;
                        if ("root" === a.tryLoc)
                            return o("end");
                        if (a.tryLoc <= this.prev) {
                            var u = r.call(a, "catchLoc")
                              , s = r.call(a, "finallyLoc");
                            if (u && s) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0);
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            } else if (u) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0)
                            } else {
                                if (!s)
                                    throw Error("try statement without catch or finally");
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            }
                        }
                    }
                },
                abrupt: function(t, e) {
                    for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                        var o = this.tryEntries[n];
                        if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                            var i = o;
                            break
                        }
                    }
                    i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                    var a = i ? i.completion : {};
                    return a.type = t,
                    a.arg = e,
                    i ? (this.method = "next",
                    this.next = i.finallyLoc,
                    y) : this.complete(a)
                },
                complete: function(t, e) {
                    if ("throw" === t.type)
                        throw t.arg;
                    return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg,
                    this.method = "return",
                    this.next = "end") : "normal" === t.type && e && (this.next = e),
                    y
                },
                finish: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.finallyLoc === t)
                            return this.complete(n.completion, n.afterLoc),
                            P(n),
                            y
                    }
                },
                catch: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.tryLoc === t) {
                            var r = n.completion;
                            if ("throw" === r.type) {
                                var o = r.arg;
                                P(n)
                            }
                            return o
                        }
                    }
                    throw Error("illegal catch attempt")
                },
                delegateYield: function(e, n, r) {
                    return this.delegate = {
                        iterator: I(e),
                        resultName: n,
                        nextLoc: r
                    },
                    "next" === this.method && (this.arg = t),
                    y
                }
            },
            e
        }
        function Dt(t, e, n, r, o, i, a) {
            try {
                var c = t[i](a)
                  , u = c.value
            } catch (t) {
                return void n(t)
            }
            c.done ? e(u) : Promise.resolve(u).then(r, o)
        }
        function Mt(t) {
            return function() {
                var e = this
                  , n = arguments;
                return new Promise((function(r, o) {
                    var i = t.apply(e, n);
                    function a(t) {
                        Dt(i, r, o, a, c, "next", t)
                    }
                    function c(t) {
                        Dt(i, r, o, a, c, "throw", t)
                    }
                    a(void 0)
                }
                ))
            }
        }
        function Nt(t, e) {
            for (var n = 0; n < e.length; n++) {
                var r = e[n];
                r.enumerable = r.enumerable || !1,
                r.configurable = !0,
                "value"in r && (r.writable = !0),
                Object.defineProperty(t, Rt(r.key), r)
            }
        }
        function Bt(t, e, n) {
            return (e = Rt(e))in t ? Object.defineProperty(t, e, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : t[e] = n,
            t
        }
        function Rt(t) {
            var e = function(t, e) {
                if ("object" != Tt(t) || !t)
                    return t;
                var n = t[Symbol.toPrimitive];
                if (void 0 !== n) {
                    var r = n.call(t, e || "default");
                    if ("object" != Tt(r))
                        return r;
                    throw new TypeError("@@toPrimitive must return a primitive value.")
                }
                return ("string" === e ? String : Number)(t)
            }(t, "string");
            return "symbol" == Tt(e) ? e : e + ""
        }
        var Gt = null;
        try {
            Gt = n(215)
        } catch (t) {}
        var Ut = function() {
            function t() {
                !function(t, e) {
                    if (!(t instanceof e))
                        throw new TypeError("Cannot call a class as a function")
                }(this, t),
                Bt(this, "detectedTools", []),
                Bt(this, "botdLibrary", null),
                Bt(this, "useFallback", !1),
                Bt(this, "eventListeners", new Set),
                Bt(this, "isMonitoring", !1),
                Bt(this, "monitoringInterval", null),
                this.initializeBotDLibrary()
            }
            return e = t,
            n = [{
                key: "initializeBotDLibrary",
                value: function() {
                    try {
                        var t = Gt;
                        if (!t)
                            return void (this.useFallback = !0);
                        var e = t.default || t;
                        this.botdLibrary = {
                            detect: (n = Mt(At().mark((function t() {
                                var n, r, o;
                                return At().wrap((function(t) {
                                    for (; ; )
                                        switch (t.prev = t.next) {
                                        case 0:
                                            return t.prev = 0,
                                            t.next = 3,
                                            e.load();
                                        case 3:
                                            return n = t.sent,
                                            t.next = 6,
                                            n.detect();
                                        case 6:
                                            return r = t.sent,
                                            o = [],
                                            r.bot && (r.botKind ? o.push("".concat(r.botKind)) : o.push("Automation-Detected")),
                                            t.abrupt("return", {
                                                detectedTools: o
                                            });
                                        case 12:
                                            throw t.prev = 12,
                                            t.t0 = t.catch(0),
                                            console.error("BotD detection error:", t.t0),
                                            t.t0;
                                        case 16:
                                        case "end":
                                            return t.stop()
                                        }
                                }
                                ), t, null, [[0, 12]])
                            }
                            ))),
                            function() {
                                return n.apply(this, arguments)
                            }
                            )
                        }
                    } catch (t) {
                        console.error("Failed to initialize BotD library:", t),
                        this.useFallback = !0
                    }
                    var n
                }
            }, {
                key: "detectAutomationTools",
                value: (a = Mt(At().mark((function t() {
                    var e, n;
                    return At().wrap((function(t) {
                        for (; ; )
                            switch (t.prev = t.next) {
                            case 0:
                                if (this.useFallback || !this.botdLibrary) {
                                    t.next = 12;
                                    break
                                }
                                return t.prev = 1,
                                t.next = 4,
                                this.botdLibrary.detect();
                            case 4:
                                return e = t.sent,
                                t.abrupt("return", e.detectedTools || []);
                            case 8:
                                t.prev = 8,
                                t.t0 = t.catch(1),
                                console.error("BotD detection error:", t.t0),
                                this.useFallback = !0;
                            case 12:
                                return n = this.detectWithFallback(),
                                t.abrupt("return", n);
                            case 14:
                            case "end":
                                return t.stop()
                            }
                    }
                    ), t, this, [[1, 8]])
                }
                ))),
                function() {
                    return a.apply(this, arguments)
                }
                )
            }, {
                key: "detectWithFallback",
                value: function() {
                    return this.detectedTools = [],
                    this.detectSelenium() && this.detectedTools.push("Selenium."),
                    this.detectPlaywright() && this.detectedTools.push("Playwright"),
                    this.detectPuppeteer() && this.detectedTools.push("Puppeteer"),
                    this.detectCDP() && this.detectedTools.push("CDP"),
                    this.detectPhantomJS() && this.detectedTools.push("PhantomJS"),
                    this.detectedTools
                }
            }, {
                key: "getDetectedToolsString",
                value: (i = Mt(At().mark((function t() {
                    var e;
                    return At().wrap((function(t) {
                        for (; ; )
                            switch (t.prev = t.next) {
                            case 0:
                                return t.next = 2,
                                this.detectAutomationTools();
                            case 2:
                                return e = t.sent,
                                t.abrupt("return", e.length > 0 ? e.join(",") : "");
                            case 4:
                            case "end":
                                return t.stop()
                            }
                    }
                    ), t, this)
                }
                ))),
                function() {
                    return i.apply(this, arguments)
                }
                )
            }, {
                key: "detectSelenium",
                value: function() {
                    return !1; // 强制返回 false
                }
            }, {
                key: "detectPlaywright",
                value: function() {
                    return !1;
                }
            }, {
                key: "detectPuppeteer",
                value: function() {
                    return !1;
                }
            }, {
                key: "detectCDP",
                value: function() {
                    return !1;
                }
            }, {
                key: "detectPhantomJS",
                value: function() {
                    return !!["__phantomas", "_phantom", "phantom", "callPhantom"].some((function(t) {
                        return t in window
                    }
                    )) || !!navigator.userAgent.toLowerCase().includes("phantomjs")
                }
            }, {
                key: "addEventListener",
                value: function(t) {
                    this.eventListeners.add(t)
                }
            }, {
                key: "removeEventListener",
                value: function(t) {
                    this.eventListeners.delete(t)
                }
            }, {
                key: "startEventBasedMonitoring",
                value: function() {
                    var t = this
                      , e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 5e3;
                    this.isMonitoring || (this.isMonitoring = !0,
                    this.performDetectionAndNotify(),
                    this.monitoringInterval = window.setInterval((function() {
                        t.performDetectionAndNotify()
                    }
                    ), e))
                }
            }, {
                key: "stopEventBasedMonitoring",
                value: function() {
                    this.isMonitoring && (this.isMonitoring = !1,
                    null !== this.monitoringInterval && (clearInterval(this.monitoringInterval),
                    this.monitoringInterval = null))
                }
            }, {
                key: "performDetectionAndNotify",
                value: (o = Mt(At().mark((function t() {
                    var e, n, r;
                    return At().wrap((function(t) {
                        for (; ; )
                            switch (t.prev = t.next) {
                            case 0:
                                return t.prev = 0,
                                e = It(this.detectedTools),
                                t.next = 4,
                                this.detectAutomationTools();
                            case 4:
                                n = t.sent,
                                !this.arraysEqual(e, n) && n.length > 0 && (r = n.join(","),
                                this.eventListeners.forEach((function(t) {
                                    try {
                                        t(r)
                                    } catch (t) {
                                        console.error("Event listener error:", t)
                                    }
                                }
                                ))),
                                this.detectedTools = n,
                                t.next = 13;
                                break;
                            case 10:
                                t.prev = 10,
                                t.t0 = t.catch(0),
                                console.error("Automation detection error:", t.t0);
                            case 13:
                            case "end":
                                return t.stop()
                            }
                    }
                    ), t, this, [[0, 10]])
                }
                ))),
                function() {
                    return o.apply(this, arguments)
                }
                )
            }, {
                key: "arraysEqual",
                value: function(t, e) {
                    if (t.length !== e.length)
                        return !1;
                    var n = It(t).sort()
                      , r = It(e).sort();
                    return n.every((function(t, e) {
                        return t === r[e]
                    }
                    ))
                }
            }, {
                key: "reset",
                value: function() {
                    this.detectedTools = []
                }
            }],
            r = [{
                key: "getInstance",
                value: function() {
                    return t.instance || (t.instance = new t),
                    t.instance
                }
            }],
            n && Nt(e.prototype, n),
            r && Nt(e, r),
            Object.defineProperty(e, "prototype", {
                writable: !1
            }),
            e;
            var e, n, r, o, i, a
        }();
        function Ft() {
            return Ut.getInstance()
        }
        function Wt() {
            return qt.apply(this, arguments)
        }
        function qt() {
            return (qt = Mt(At().mark((function t() {
                var e;
                return At().wrap((function(t) {
                    for (; ; )
                        switch (t.prev = t.next) {
                        case 0:
                            return e = Ft(),
                            t.next = 3,
                            e.getDetectedToolsString();
                        case 3:
                            return t.abrupt("return", t.sent);
                        case 4:
                        case "end":
                            return t.stop()
                        }
                }
                ), t)
            }
            )))).apply(this, arguments)
        }
        function Ht() {
            Ht = function() {
                return e
            }
            ;
            var t, e = {}, n = Object.prototype, r = n.hasOwnProperty, o = Object.defineProperty || function(t, e, n) {
                t[e] = n.value
            }
            , i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
            function s(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }),
                t[e]
            }
            try {
                s({}, "")
            } catch (t) {
                s = function(t, e, n) {
                    return t[e] = n
                }
            }
            function l(t, e, n, r) {
                var i = e && e.prototype instanceof g ? e : g
                  , a = Object.create(i.prototype)
                  , c = new T(r || []);
                return o(a, "_invoke", {
                    value: O(t, n, c)
                }),
                a
            }
            function f(t, e, n) {
                try {
                    return {
                        type: "normal",
                        arg: t.call(e, n)
                    }
                } catch (t) {
                    return {
                        type: "throw",
                        arg: t
                    }
                }
            }
            e.wrap = l;
            var h = "suspendedStart"
              , d = "suspendedYield"
              , p = "executing"
              , v = "completed"
              , y = {};
            function g() {}
            function w() {}
            function m() {}
            var b = {};
            s(b, a, (function() {
                return this
            }
            ));
            var _ = Object.getPrototypeOf
              , k = _ && _(_(I([])));
            k && k !== n && r.call(k, a) && (b = k);
            var S = m.prototype = g.prototype = Object.create(b);
            function x(t) {
                ["next", "throw", "return"].forEach((function(e) {
                    s(t, e, (function(t) {
                        return this._invoke(e, t)
                    }
                    ))
                }
                ))
            }
            function L(t, e) {
                function n(o, i, a, c) {
                    var u = f(t[o], t, i);
                    if ("throw" !== u.type) {
                        var s = u.arg
                          , l = s.value;
                        return l && "object" == Jt(l) && r.call(l, "__await") ? e.resolve(l.__await).then((function(t) {
                            n("next", t, a, c)
                        }
                        ), (function(t) {
                            n("throw", t, a, c)
                        }
                        )) : e.resolve(l).then((function(t) {
                            s.value = t,
                            a(s)
                        }
                        ), (function(t) {
                            return n("throw", t, a, c)
                        }
                        ))
                    }
                    c(u.arg)
                }
                var i;
                o(this, "_invoke", {
                    value: function(t, r) {
                        function o() {
                            return new e((function(e, o) {
                                n(t, r, e, o)
                            }
                            ))
                        }
                        return i = i ? i.then(o, o) : o()
                    }
                })
            }
            function O(e, n, r) {
                var o = h;
                return function(i, a) {
                    if (o === p)
                        throw Error("Generator is already running");
                    if (o === v) {
                        if ("throw" === i)
                            throw a;
                        return {
                            value: t,
                            done: !0
                        }
                    }
                    for (r.method = i,
                    r.arg = a; ; ) {
                        var c = r.delegate;
                        if (c) {
                            var u = E(c, r);
                            if (u) {
                                if (u === y)
                                    continue;
                                return u
                            }
                        }
                        if ("next" === r.method)
                            r.sent = r._sent = r.arg;
                        else if ("throw" === r.method) {
                            if (o === h)
                                throw o = v,
                                r.arg;
                            r.dispatchException(r.arg)
                        } else
                            "return" === r.method && r.abrupt("return", r.arg);
                        o = p;
                        var s = f(e, n, r);
                        if ("normal" === s.type) {
                            if (o = r.done ? v : d,
                            s.arg === y)
                                continue;
                            return {
                                value: s.arg,
                                done: r.done
                            }
                        }
                        "throw" === s.type && (o = v,
                        r.method = "throw",
                        r.arg = s.arg)
                    }
                }
            }
            function E(e, n) {
                var r = n.method
                  , o = e.iterator[r];
                if (o === t)
                    return n.delegate = null,
                    "throw" === r && e.iterator.return && (n.method = "return",
                    n.arg = t,
                    E(e, n),
                    "throw" === n.method) || "return" !== r && (n.method = "throw",
                    n.arg = new TypeError("The iterator does not provide a '" + r + "' method")),
                    y;
                var i = f(o, e.iterator, n.arg);
                if ("throw" === i.type)
                    return n.method = "throw",
                    n.arg = i.arg,
                    n.delegate = null,
                    y;
                var a = i.arg;
                return a ? a.done ? (n[e.resultName] = a.value,
                n.next = e.nextLoc,
                "return" !== n.method && (n.method = "next",
                n.arg = t),
                n.delegate = null,
                y) : a : (n.method = "throw",
                n.arg = new TypeError("iterator result is not an object"),
                n.delegate = null,
                y)
            }
            function j(t) {
                var e = {
                    tryLoc: t[0]
                };
                1 in t && (e.catchLoc = t[1]),
                2 in t && (e.finallyLoc = t[2],
                e.afterLoc = t[3]),
                this.tryEntries.push(e)
            }
            function P(t) {
                var e = t.completion || {};
                e.type = "normal",
                delete e.arg,
                t.completion = e
            }
            function T(t) {
                this.tryEntries = [{
                    tryLoc: "root"
                }],
                t.forEach(j, this),
                this.reset(!0)
            }
            function I(e) {
                if (e || "" === e) {
                    var n = e[a];
                    if (n)
                        return n.call(e);
                    if ("function" == typeof e.next)
                        return e;
                    if (!isNaN(e.length)) {
                        var o = -1
                          , i = function n() {
                            for (; ++o < e.length; )
                                if (r.call(e, o))
                                    return n.value = e[o],
                                    n.done = !1,
                                    n;
                            return n.value = t,
                            n.done = !0,
                            n
                        };
                        return i.next = i
                    }
                }
                throw new TypeError(Jt(e) + " is not iterable")
            }
            return w.prototype = m,
            o(S, "constructor", {
                value: m,
                configurable: !0
            }),
            o(m, "constructor", {
                value: w,
                configurable: !0
            }),
            w.displayName = s(m, u, "GeneratorFunction"),
            e.isGeneratorFunction = function(t) {
                var e = "function" == typeof t && t.constructor;
                return !!e && (e === w || "GeneratorFunction" === (e.displayName || e.name))
            }
            ,
            e.mark = function(t) {
                return Object.setPrototypeOf ? Object.setPrototypeOf(t, m) : (t.__proto__ = m,
                s(t, u, "GeneratorFunction")),
                t.prototype = Object.create(S),
                t
            }
            ,
            e.awrap = function(t) {
                return {
                    __await: t
                }
            }
            ,
            x(L.prototype),
            s(L.prototype, c, (function() {
                return this
            }
            )),
            e.AsyncIterator = L,
            e.async = function(t, n, r, o, i) {
                void 0 === i && (i = Promise);
                var a = new L(l(t, n, r, o),i);
                return e.isGeneratorFunction(n) ? a : a.next().then((function(t) {
                    return t.done ? t.value : a.next()
                }
                ))
            }
            ,
            x(S),
            s(S, u, "Generator"),
            s(S, a, (function() {
                return this
            }
            )),
            s(S, "toString", (function() {
                return "[object Generator]"
            }
            )),
            e.keys = function(t) {
                var e = Object(t)
                  , n = [];
                for (var r in e)
                    n.push(r);
                return n.reverse(),
                function t() {
                    for (; n.length; ) {
                        var r = n.pop();
                        if (r in e)
                            return t.value = r,
                            t.done = !1,
                            t
                    }
                    return t.done = !0,
                    t
                }
            }
            ,
            e.values = I,
            T.prototype = {
                constructor: T,
                reset: function(e) {
                    if (this.prev = 0,
                    this.next = 0,
                    this.sent = this._sent = t,
                    this.done = !1,
                    this.delegate = null,
                    this.method = "next",
                    this.arg = t,
                    this.tryEntries.forEach(P),
                    !e)
                        for (var n in this)
                            "t" === n.charAt(0) && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = t)
                },
                stop: function() {
                    this.done = !0;
                    var t = this.tryEntries[0].completion;
                    if ("throw" === t.type)
                        throw t.arg;
                    return this.rval
                },
                dispatchException: function(e) {
                    if (this.done)
                        throw e;
                    var n = this;
                    function o(r, o) {
                        return c.type = "throw",
                        c.arg = e,
                        n.next = r,
                        o && (n.method = "next",
                        n.arg = t),
                        !!o
                    }
                    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
                        var a = this.tryEntries[i]
                          , c = a.completion;
                        if ("root" === a.tryLoc)
                            return o("end");
                        if (a.tryLoc <= this.prev) {
                            var u = r.call(a, "catchLoc")
                              , s = r.call(a, "finallyLoc");
                            if (u && s) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0);
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            } else if (u) {
                                if (this.prev < a.catchLoc)
                                    return o(a.catchLoc, !0)
                            } else {
                                if (!s)
                                    throw Error("try statement without catch or finally");
                                if (this.prev < a.finallyLoc)
                                    return o(a.finallyLoc)
                            }
                        }
                    }
                },
                abrupt: function(t, e) {
                    for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                        var o = this.tryEntries[n];
                        if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                            var i = o;
                            break
                        }
                    }
                    i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                    var a = i ? i.completion : {};
                    return a.type = t,
                    a.arg = e,
                    i ? (this.method = "next",
                    this.next = i.finallyLoc,
                    y) : this.complete(a)
                },
                complete: function(t, e) {
                    if ("throw" === t.type)
                        throw t.arg;
                    return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg,
                    this.method = "return",
                    this.next = "end") : "normal" === t.type && e && (this.next = e),
                    y
                },
                finish: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.finallyLoc === t)
                            return this.complete(n.completion, n.afterLoc),
                            P(n),
                            y
                    }
                },
                catch: function(t) {
                    for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                        var n = this.tryEntries[e];
                        if (n.tryLoc === t) {
                            var r = n.completion;
                            if ("throw" === r.type) {
                                var o = r.arg;
                                P(n)
                            }
                            return o
                        }
                    }
                    throw Error("illegal catch attempt")
                },
                delegateYield: function(e, n, r) {
                    return this.delegate = {
                        iterator: I(e),
                        resultName: n,
                        nextLoc: r
                    },
                    "next" === this.method && (this.arg = t),
                    y
                }
            },
            e
        }
        function zt(t, e, n, r, o, i, a) {
            try {
                var c = t[i](a)
                  , u = c.value
            } catch (t) {
                return void n(t)
            }
            c.done ? e(u) : Promise.resolve(u).then(r, o)
        }
        function Jt(t) {
            return Jt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t
            }
            : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
            }
            ,
            Jt(t)
        }
        function Vt(t, e) {
            for (var n = 0; n < e.length; n++) {
                var r = e[n];
                r.enumerable = r.enumerable || !1,
                r.configurable = !0,
                "value"in r && (r.writable = !0),
                Object.defineProperty(t, Yt(r.key), r)
            }
        }
        function Kt(t, e, n) {
            return (e = Yt(e))in t ? Object.defineProperty(t, e, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : t[e] = n,
            t
        }
        function Yt(t) {
            var e = function(t, e) {
                if ("object" != Jt(t) || !t)
                    return t;
                var n = t[Symbol.toPrimitive];
                if (void 0 !== n) {
                    var r = n.call(t, e || "default");
                    if ("object" != Jt(r))
                        return r;
                    throw new TypeError("@@toPrimitive must return a primitive value.")
                }
                return ("string" === e ? String : Number)(t)
            }(t, "string");
            return "symbol" == Jt(e) ? e : e + ""
        }
        Bt(Ut, "instance", null);
        var $t = function() {
            function t(e) {
                !function(t, e) {
                    if (!(t instanceof e))
                        throw new TypeError("Cannot call a class as a function")
                }(this, t),
                Kt(this, "stopDevTools", !1),
                Kt(this, "antiBypass", null),
                Kt(this, "whitelistCheckInterval", null),
                this.config = e,
                this.init()
            }
            return e = t,
            n = [{
                key: "setYes24InitializeCookie",
                value: function() {
                    if ("m.ticket.yes24.com" === window.location.host) {
                        if (this.config.useMainDomain = !0,
                        this.config.useSecureCookie = !1,
                        "Y" === localStorage.getItem(v))
                            return;
                        this.config.useMainDomain = !1,
                        this.config.useSecureCookie = !0,
                        P(c, this.config),
                        P(u, this.config),
                        localStorage.setItem(v, "Y"),
                        this.config.useMainDomain = !0,
                        this.config.useSecureCookie = !1
                    }
                }
            }, {
                key: "init",
                value: function() {
                    var e = this;
                    this.setYes24InitializeCookie(),
                    !1 !== this.config.validateSessionId ? Pt(this.config) : F(this.config),
                    function(t) {
                        try {
                            var e = new URL(window.location.href);
                            e.searchParams.has(t) && (e.searchParams.delete(t),
                            window.history.replaceState({}, "", e.toString()))
                        } catch (t) {
                            console.error("Failed to remove query parameter:", t)
                        }
                    }("nnbk_state"),
                    this.config.preventBypass && (this.antiBypass = new kt(this.config),
                    this.antiBypass.initialize()),
                    this.config.detectOnLoad && this.setupLocationDetection(),
                    this.config.detectClickSampleSize && this.config.detectClickThreshold && this.startBehaviorTracking(),
                    this.config.redirectOnLocation && this.redirectOnLocation(),
                    this.config.detectAutomation && this.setupAutomationDetection(),
                    this.startWhitelistPeriodicCheck(),
                    this.manageDevToolsDetector(),
                    window.addEventListener("pageshow", (function(e) {
                        t.setRedirectingStatus(!1),
                        e.persisted && window.location.reload()
                    }
                    )),
                    window.addEventListener("beforeunload", (function() {
                        e.stopWhitelistPeriodicCheck()
                    }
                    ))
                }
            }, {
                key: "manageDevToolsDetector",
                value: function() {
                    console.log("[TicketBot] DevTools detection disabled.");
                    return;
                }
            }, {
                key: "startWhitelistPeriodicCheck",
                value: function() {
                    this.whitelistCheckInterval = window.setInterval((function() {
                        rt()
                    }
                    ), 6e4)
                }
            }, {
                key: "stopWhitelistPeriodicCheck",
                value: function() {
                    var t;
                    (t = this.whitelistCheckInterval) && clearInterval(t),
                    this.whitelistCheckInterval = null
                }
            }, {
                key: "setupLocationDetection",
                value: function() {
                    var t = this;
                    this.handleOnLoadDetection(),
                    ft({
                        detectOnLoad: this.config.detectOnLoad,
                        callback: function(e) {
                            var n, r = nt(t.config);
                            K(t.config, {
                                userBehavior: "",
                                devTool: r
                            }),
                            t.config.preventBypass && (null === (n = t.antiBypass) || void 0 === n || n.checkOnPageChange())
                        }
                    })
                }
            }, {
                key: "handleOnLoadDetection",
                value: function() {
                    var t = nt(this.config);
                    K(this.config, {
                        devTool: t
                    })
                }
            }, {
                key: "startBehaviorTracking",
                value: function() {
                    console.log("[TicketBot] Behavior tracking disabled.");
                    return;
                }
            }, {
                key: "setupAutomationDetection",
                value: function() {
                    var t = this;
                    if (this.config.detectAutomation) {
                        var e = Ft();
                        e.addEventListener((function(e) {
                            e && K(t.config, {
                                devTool: "",
                                userBehavior: "",
                                automationTools: e
                            })
                        }
                        )),
                        e.startEventBasedMonitoring(5e3)
                    }
                }
            }, {
                key: "redirectOnLocation",
                value: function() {
                    dt(this.config),
                    gt(this.config)
                }
            }, {
                key: "detectWithPageUrl",
                value: function(t, e) {
                    var n;
                    if (function(t) {
                        if (!t)
                            return !1;
                        var e = t.pageUrl
                          , n = t.queryString;
                        return !("string" != typeof e || "" === e.trim() || !e.startsWith("/") || void 0 !== n && "string" != typeof n)
                    }(n = void 0 === t ? D() : "string" == typeof t ? D(t) : "object" === Jt(t) ? {
                        pageUrl: t.pageUrl,
                        queryString: t.queryString
                    } : {})) {
                        var r = nt(this.config);
                        K(this.config, {
                            devTool: r
                        }, n, e)
                    } else
                        console.error("Invalid page URL:", n)
                }
            }, {
                key: "setCustomId",
                value: function(t) {
                    var e, n;
                    return e = t,
                    n = this.config,
                    R(c, e, !0, n),
                    this
                }
            }, {
                key: "getVersion",
                value: function() {
                    return "1.2.4"
                }
            }, {
                key: "getAutomationDetected",
                value: (o = Ht().mark((function t() {
                    var e;
                    return Ht().wrap((function(t) {
                        for (; ; )
                            switch (t.prev = t.next) {
                            case 0:
                                return t.next = 2,
                                Wt();
                            case 2:
                                return e = t.sent,
                                t.abrupt("return", e);
                            case 4:
                            case "end":
                                return t.stop()
                            }
                    }
                    ), t)
                }
                )),
                i = function() {
                    var t = this
                      , e = arguments;
                    return new Promise((function(n, r) {
                        var i = o.apply(t, e);
                        function a(t) {
                            zt(i, n, r, a, c, "next", t)
                        }
                        function c(t) {
                            zt(i, n, r, a, c, "throw", t)
                        }
                        a(void 0)
                    }
                    ))
                }
                ,
                function() {
                    return i.apply(this, arguments)
                }
                )
            }],
            r = [{
                key: "getInstance",
                value: function(e) {
                    if (!t.instance && e && (t.instance = new t(e)),
                    !t.instance)
                        throw new Error("BrowserAgent is not initialized.");
                    return t.instance
                }
            }, {
                key: "setRedirectingStatus",
                value: function(e) {
                    t.isRedirecting = e
                }
            }, {
                key: "getRedirectingStatus",
                value: function() {
                    return t.isRedirecting
                }
            }, {
                key: "resetDevtoolsWhitelist",
                value: function() {
                    localStorage.removeItem(p),
                    t.instance && (t.instance.stopWhitelistPeriodicCheck(),
                    t.instance.startWhitelistPeriodicCheck())
                }
            }],
            n && Vt(e.prototype, n),
            r && Vt(e, r),
            Object.defineProperty(e, "prototype", {
                writable: !1
            }),
            e;
            var e, n, r, o, i
        }();
        Kt($t, "instance", null),
        Kt($t, "isRedirecting", !1),
        window["BotManager-config"] && function(t) {
            if (!window.BotManager || !window.BotManager.initialize) {
                var e = a(t || {});
                if (e) {
                    e.loginId || void 0 === e.customId || (e.loginId = e.customId);
                    var n = $t.getInstance(e);
                    window.BotManager = {
                        initialize: !0,
                        getVersion: n.getVersion.bind(n),
                        detectPage: n.detectWithPageUrl.bind(n),
                        setCustomId: n.setCustomId.bind(n),
                        getAutomationDetected: n.getAutomationDetected.bind(n)
                    }
                }
            }
        }(window["BotManager-config"])
    }
    )()
}
)();
