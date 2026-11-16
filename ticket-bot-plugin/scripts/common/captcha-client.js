/*
 * TicketBotCaptcha —— 验证码识别公共客户端（content script，所有购票页都已加载）。
 *
 * 只负责“把图片发给识别服务、拿回结果”。什么时候弹验证码、从页面读哪张图、
 * 识别结果填到哪里、怎么提交和重试，都由各平台脚本自己决定（见 docs/captcha-service.md）。
 *
 *   const r = await TicketBotCaptcha.recognizeText(dataUrl, { codeLength: 6, charset: "upper" });
 *   if (r.ok) input.value = r.text;
 *
 *   const s = await TicketBotCaptcha.detectSliderGap(dataUrl, { conf: 0.7 });
 *   if (s.ok) dragSliderTo(s.x);  // box/x/y/width/height/confidence，坐标基于传入图片
 *
 * 所有方法都不抛异常，失败时返回 { ok: false, error }。
 *
 * 默认 provider "http" 调用 config.js 里 services.captcha 配置的 HTTP 服务
 * （默认是 local-services/glm_ocr_service.py）。要换成其他 OCR：
 *   - 推荐：写一个实现同样 API 的本地服务/代理，改 services.captcha.baseUrl；
 *   - 或者：TicketBotCaptcha.registerProvider("myocr", { recognizeText, detectSliderGap })，
 *     再把 services.captcha.provider 设为 "myocr"。
 */
(function(global) {
    if (global.TicketBotCaptcha) {
        return;
    }

    const appConfig = global.TicketBotConfig || {};

    function settings() {
        return Object.assign({
            provider: "http",
            baseUrl: "http://127.0.0.1:17861",
            endpoints: { health: "/health", ocr: "/ocr", slider: "/slider", sliderOffset: "/slider/offset" },
            headers: {},
            timeoutMs: 3000,
        }, appConfig.services && appConfig.services.captcha || {});
    }

    function endpointUrl(name) {
        const current = settings();
        const path = current.endpoints && current.endpoints[name];
        if (!path) return "";
        return /^https?:\/\//i.test(path) ? path : `${String(current.baseUrl).replace(/\/$/, "")}${path}`;
    }

    async function requestJson(name, body, timeoutMs) {
        const url = endpointUrl(name);
        if (!url) {
            return { ok: false, error: `captcha endpoint "${name}" is not configured` };
        }
        const current = settings();
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs || current.timeoutMs) : null;
        try {
            const response = await fetch(url, {
                method: body === undefined ? "GET" : "POST",
                headers: Object.assign({ "Content-Type": "application/json" }, current.headers || {}),
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller ? controller.signal : undefined,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
                return Object.assign({}, payload, {
                    ok: false,
                    status: response.status,
                    error: payload.error || `captcha service returned ${response.status}`,
                });
            }
            return payload;
        } catch (error) {
            const aborted = error && error.name === "AbortError";
            return { ok: false, error: aborted ? "captcha service timeout" : `captcha service unavailable: ${error && error.message || error}` };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    const httpProvider = {
        health: options => requestJson("health", undefined, options && options.timeoutMs),
        recognizeText: (image, options = {}) => requestJson("ocr", {
            image,
            codeLength: options.codeLength,
            charset: options.charset,
            prompt: options.prompt,
        }, options.timeoutMs),
        detectSliderGap: (image, options = {}) => requestJson("slider", {
            image,
            conf: options.conf,
            iou: options.iou,
        }, options.timeoutMs),
        getSliderOffset: (image, options = {}) => requestJson("sliderOffset", {
            image,
            conf: options.conf,
            iou: options.iou,
        }, options.timeoutMs),
    };

    const providers = { http: httpProvider };

    function provider() {
        return providers[settings().provider] || httpProvider;
    }

    async function call(method, args) {
        const impl = provider()[method] || httpProvider[method];
        try {
            const result = await impl(...args);
            return result && typeof result === "object" ? result : { ok: false, error: "empty captcha result" };
        } catch (error) {
            return { ok: false, error: error && error.message || String(error) };
        }
    }

    global.TicketBotCaptcha = {
        registerProvider(name, impl) {
            providers[name] = Object.assign({}, httpProvider, impl);
        },
        endpointUrl,
        health: options => call("health", [options]),
        recognizeText: (image, options) => call("recognizeText", [image, options]),
        detectSliderGap: (image, options) => call("detectSliderGap", [image, options]),
        getSliderOffset: (image, options) => call("getSliderOffset", [image, options]),
    };
})(typeof window !== "undefined" ? window : globalThis);
