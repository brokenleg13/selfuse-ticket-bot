(function() {
    const config = window.TicketBotConfig || {};
    const storageKeys = config.storageKeys || {
        botRunState: "ticketBotRunState",
    };
    const actions = config.actions || {
        startBot: "startTicketBot",
        stopBot: "stopTicketBot",
    };
    const interparkConfig = config.interpark || {};
    const PLATFORM = "interpark";
    const DEFAULT_REFRESH_INTERVAL_MS = interparkConfig.refreshIntervalMs || 2000;
    const DEFAULT_REFRESH_JITTER_MS = interparkConfig.refreshJitterMs || 600;
    const DEFAULT_AREA_SCAN_INTERVAL_MS = interparkConfig.areaScanIntervalMs || 800;
    const DEFAULT_MAX_AREA_CLICKS = interparkConfig.maxAreaClicksPerRefresh || 12;
    const DEFAULT_BOOKING_SESSION_TIMEOUT_MINUTES = interparkConfig.bookingSessionTimeoutMinutes || 9.5;
    const USE_SEAT_DETAIL_API_FLOW = interparkConfig.useSeatDetailApiFlow === true;
    const captchaOcrConfig = interparkConfig.captchaOcr || {};
    const BOT_STATE = {
        IDLE: "idle",
        STARTING: "starting",
        PRODUCT_PAGE: "product_page",
        QUEUE_WAITING: "queue_waiting",
        BOOKING_PAGE: "booking_page",
        DATE_TIME: "date_time",
        CAPTCHA: "captcha",
        SCANNING: "scanning",
        LOCKED: "locked",
        SELECTED: "selected",
        RESTARTING: "restarting",
        STOPPED: "stopped",
    };

    let botRunning = false;
    let activeConfig = null;
    let refreshTimer = null;
    let lastSummaryText = "";
    let lockedSeatContext = null;
    let botState = BOT_STATE.IDLE;
    let queueHeartbeatCount = 0;
    const pageStartedAt = typeof performance !== "undefined" && Number.isFinite(performance.timeOrigin)
        ? performance.timeOrigin
        : Date.now();
    let captchaOcrState = {
        attempting: false,
        lastAttemptAt: 0,
        lastImageKey: "",
        lastMessage: "",
        lastSliderError: "",
    };

    function getRunStateKey() {
        return storageKeys.botRunState || "ticketBotRunState";
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function normalizeText(text) {
        return (text || "").replace(/\s+/g, " ").trim();
    }

    function normalizeDateValue(value) {
        return String(value || "").replace(/[^\d]/g, "").slice(0, 8);
    }

    function normalizeTimeValue(value) {
        return String(value || "").replace(/[^\d]/g, "").slice(0, 4);
    }

    function notifyFeishu(message) {
        const webhookUrl = activeConfig && activeConfig["feishu-bot-id"];
        if (webhookUrl && typeof sendFeiShuMsg === "function") {
            sendFeiShuMsg(webhookUrl, `[${new Date().toLocaleString()}] ${message}`);
        }
    }

    function formatSeatBrief(seat) {
        if (!seat) {
            return "";
        }

        const parts = [
            seat.seatGrade && `Grade ${seat.seatGrade}`,
            seat.block && `Zone ${seat.block}`,
            seat.floor && `Floor ${seat.floor}`,
            seat.visualRow && `Visual row ${seat.visualRow}`,
            seat.rowNo && !seat.visualRow && `Row ${seat.rowNo}`,
            seat.seatNo && `Seat ${seat.seatNo}`,
        ].filter(Boolean);

        if (parts.length) {
            return parts.join(", ");
        }

        return normalizeText(seat.title || seat.text || "");
    }

    function formatSeatList(seats) {
        const list = (Array.isArray(seats) ? seats : [seats])
            .filter(Boolean)
            .map(formatSeatBrief)
            .filter(Boolean);
        return list.length ? list.join("; ") : "No specific seat number found";
    }

    function notifySelectedSeats(prefix, seats) {
        notifyFeishu(`${prefix}: ${formatSeatList(seats)}`);
    }

    async function pauseBotWithNotification(message) {
        botRunning = false;
        clearTimeout(refreshTimer);
        await markRunStateStopped();
        setBotState(BOT_STATE.STOPPED);
        updateStatus(message);
        notifyFeishu(`Interpark paused: ${message}`);
    }

    function setBotState(nextState, detail) {
        if (botState === nextState) {
            return;
        }

        botState = nextState;
        console.log(`[Interpark] state -> ${nextState}${detail ? `: ${detail}` : ""}`);
    }

    function getConfiguredProductUrl(botConfig) {
        const value = (botConfig && botConfig["concert-id"] || "").trim();
        if (!value) {
            return "";
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        const queryPlaceMatch = value.match(/^(\d+)\?placeCode=(\d+)$/i);
        if (queryPlaceMatch) {
            return `https://world.nol.com/zh-CN/ticket/genre/CONCERT/products/${queryPlaceMatch[1]}?placeCode=${queryPlaceMatch[2]}`;
        }

        const pairMatch = value.match(/(?:places\/)?(\d+)[/:|, -]+(?:products\/)?(\d+)/i);
        if (pairMatch) {
            return `https://world.nol.com/zh-CN/ticket/places/${pairMatch[1]}/products/${pairMatch[2]}`;
        }

        return "";
    }

    function getConfiguredProductId(botConfig) {
        const value = (botConfig && botConfig["concert-id"] || "").trim();
        if (!value) {
            return "";
        }

        const urlMatch = value.match(/products\/(\d+)/i);
        if (urlMatch) {
            return urlMatch[1];
        }

        const queryPlaceMatch = value.match(/^(\d+)\?placeCode=(\d+)$/i);
        if (queryPlaceMatch) {
            return queryPlaceMatch[1];
        }

        const pairMatch = value.match(/(?:places\/)?(\d+)[/:|, -]+(?:products\/)?(\d+)/i);
        if (pairMatch) {
            return pairMatch[2];
        }

        const numericMatch = value.match(/\d+/);
        return numericMatch ? numericMatch[0] : value;
    }

    function getCurrentProductId() {
        const productFromUrl = location.href.match(/products\/(\d+)/i);
        if (productFromUrl) {
            return productFromUrl[1];
        }

        const gateProduct = new URLSearchParams(location.search).get("gc");
        if (gateProduct) {
            return gateProduct;
        }

        const seatFrame = getSeatFrame();
        const seatDocument = seatFrame && seatFrame.contentDocument;
        const goodsCodeInput = seatDocument && seatDocument.querySelector("[name='GoodsCode'], #GoodsCode");
        if (goodsCodeInput && goodsCodeInput.value) {
            return goodsCodeInput.value;
        }

        const seatDetail = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const detailSrc = seatDetail && seatDetail.src;
        if (detailSrc) {
            const detailProduct = detailSrc.match(/[?&]GoodsCode=(\d+)/i);
            if (detailProduct) {
                return detailProduct[1];
            }
        }

        return "";
    }

    function isMatchingBooking(botConfig) {
        const targetProductId = getConfiguredProductId(botConfig);
        const currentProductId = getCurrentProductId();
        return !targetProductId || !currentProductId || targetProductId === currentProductId;
    }

    async function syncRunStateConfig() {
        const runState = await get_stored_value(getRunStateKey());
        if (!runState || !runState.running || runState.platform !== PLATFORM) {
            botRunning = false;
            clearTimeout(refreshTimer);
            setBotState(BOT_STATE.STOPPED);
            updateStatus("Stopped by current run state.");
            return false;
        }

        if (runState.config) {
            activeConfig = runState.config;
        }

        return true;
    }

    function getSeatFrame() {
        return document.getElementById("ifrmSeat");
    }

    function getSeatWindow() {
        const frame = getSeatFrame();
        return frame && frame.contentWindow;
    }

    function getSeatDocument() {
        const frame = getSeatFrame();
        return frame && frame.contentDocument;
    }

    function getCaptchaDisplay() {
        const seatDocument = getSeatDocument();
        const captcha = seatDocument && seatDocument.getElementById("divCaptchaWrap");
        if (!captcha) {
            return "none";
        }

        return seatDocument.defaultView.getComputedStyle(captcha).display;
    }

    function isCaptchaVisible() {
        return getCaptchaDisplay() !== "none";
    }

    function getCaptchaOcrOptions() {
        return {
            enabled: captchaOcrConfig.enabled !== false,
            serviceUrl: captchaOcrConfig.serviceUrl || "http://127.0.0.1:17861/ocr",
            sliderServiceUrl: captchaOcrConfig.sliderServiceUrl || "http://127.0.0.1:17861/slider",
            timeoutMs: Number(captchaOcrConfig.timeoutMs) || 3000,
            retryIntervalMs: Number(captchaOcrConfig.retryIntervalMs) || 8000,
            maxAttempts: Math.max(1, Number(captchaOcrConfig.maxAttempts) || 3),
            sliderConfidence: Number(captchaOcrConfig.sliderConfidence) || 0.7,
            invalidRefreshDelayMs: Number(captchaOcrConfig.invalidRefreshDelayMs) || 600,
            submitCheckDelayMs: Number(captchaOcrConfig.submitCheckDelayMs) || 1200,
            codeLength: Number(captchaOcrConfig.codeLength) || 6,
        };
    }

    function normalizeCaptchaCode(text, length) {
        return String(text || "")
            .toUpperCase()
            .replace(/[^A-Z]/g, "")
            .slice(0, length);
    }

    function readBlobAsDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error("Failed to read image blob."));
            reader.readAsDataURL(blob);
        });
    }

    function loadImageDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Failed to load screenshot image."));
            image.src = dataUrl;
        });
    }

    function isProbablyCaptchaImage(image) {
        const source = [
            image.id || "",
            image.name || "",
            image.alt || "",
            image.title || "",
            image.src || "",
            image.getAttribute("onclick") || "",
        ].join(" ");
        if (/captcha|capcha|auth|verify|security|문자|인증|验证码/i.test(source)) {
            return true;
        }

        const rect = image.getBoundingClientRect();
        return rect.width >= 80 && rect.width <= 400 && rect.height >= 20 && rect.height <= 160;
    }

    function getCaptchaWrap() {
        const seatDocument = getSeatDocument();
        return seatDocument && seatDocument.getElementById("divCaptchaWrap");
    }

    function findSliderCaptchaElement() {
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const detailDocument = detailFrame && detailFrame.contentDocument;
        const roots = [seatDocument, detailDocument].filter(Boolean);

        for (const root of roots) {
            const slider = root.getElementById && root.getElementById("captchSlider");
            if (slider) {
                return slider;
            }
        }

        return null;
    }

    function isSliderCaptchaPopupVisible() {
        const slider = findSliderCaptchaElement();
        return isElementVisible(slider);
    }

    function findCaptchaImageElement() {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return null;
        }

        const direct = seatDocument.getElementById("imgCaptcha")
            || seatDocument.querySelector("img[name='imgCaptcha'], img[src^='data:image']");
        if (direct) {
            return direct;
        }

        const wrap = getCaptchaWrap();
        const roots = [wrap, seatDocument].filter(Boolean);
        for (const root of roots) {
            const images = Array.from(root.querySelectorAll("img"))
                .filter(image => isElementVisible(image) && isProbablyCaptchaImage(image))
                .sort((left, right) => {
                    const leftRect = left.getBoundingClientRect();
                    const rightRect = right.getBoundingClientRect();
                    return (rightRect.width * rightRect.height) - (leftRect.width * leftRect.height);
                });
            if (images.length) {
                return images[0];
            }
        }

        return null;
    }

    function getFrameElementForWindow(childWindow) {
        const parentDocument = childWindow && childWindow.parent && childWindow.parent.document;
        if (!parentDocument) {
            return null;
        }

        return Array.from(parentDocument.querySelectorAll("iframe, frame"))
            .find(frame => frame.contentWindow === childWindow) || null;
    }

    function getTopViewportRect(element) {
        const rect = element.getBoundingClientRect();
        let left = rect.left;
        let top = rect.top;
        let currentWindow = element.ownerDocument && element.ownerDocument.defaultView;

        while (currentWindow && currentWindow !== window.top) {
            const frame = getFrameElementForWindow(currentWindow);
            if (!frame) {
                break;
            }
            const frameRect = frame.getBoundingClientRect();
            left += frameRect.left;
            top += frameRect.top;
            currentWindow = currentWindow.parent;
        }

        return {
            left,
            top,
            width: rect.width,
            height: rect.height,
        };
    }

    function captureVisibleTab() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "captureVisibleTab",
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!response || !response.success || !response.dataUrl) {
                    reject(new Error(response && response.error || "Visible tab capture failed."));
                    return;
                }
                resolve(response.dataUrl);
            });
        });
    }

    function saveDebugImage(dataUrl, filename) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "saveDebugImage",
                dataUrl,
                filename,
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!response || !response.success) {
                    reject(new Error(response && response.error || "Debug image save failed."));
                    return;
                }
                resolve(response);
            });
        });
    }

    function buildSliderDebugFilename(areaCode) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const areaPart = normalizeAreaCode(areaCode) || "unknown";
        return `ticket-bot-plugin/interpark-captchSlider-${areaPart}-${stamp}.png`;
    }

    async function captureAndSaveSliderCaptchaSnapshot(areaCode) {
        const slider = findSliderCaptchaElement();
        if (!slider) {
            throw new Error("captchSlider not found.");
        }

        const dataUrl = await captureElementAsDataUrl(slider);
        return saveDebugImage(dataUrl, buildSliderDebugFilename(areaCode));
    }

    async function captureElementAsDataUrl(element, padding = 4) {
        if (!element) {
            throw new Error("Captcha image not found.");
        }

        const screenshot = await captureVisibleTab();
        const screenshotImage = await loadImageDataUrl(screenshot);
        const rect = getTopViewportRect(element);
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        try {
            viewportWidth = window.top && window.top.innerWidth || viewportWidth;
            viewportHeight = window.top && window.top.innerHeight || viewportHeight;
        } catch (error) {
            // Cross-origin frames fall back to the current window dimensions.
        }
        const ratioX = screenshotImage.naturalWidth / Math.max(1, viewportWidth);
        const ratioY = screenshotImage.naturalHeight / Math.max(1, viewportHeight);
        const sourceX = Math.max(0, Math.floor((rect.left - padding) * ratioX));
        const sourceY = Math.max(0, Math.floor((rect.top - padding) * ratioY));
        const sourceWidth = Math.min(
            screenshotImage.naturalWidth - sourceX,
            Math.ceil((rect.width + padding * 2) * ratioX),
        );
        const sourceHeight = Math.min(
            screenshotImage.naturalHeight - sourceY,
            Math.ceil((rect.height + padding * 2) * ratioY),
        );
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            throw new Error("Captcha screenshot crop is empty.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        canvas.getContext("2d").drawImage(
            screenshotImage,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight,
        );
        return canvas.toDataURL("image/png");
    }

    async function imageElementToDataUrl(image) {
        if (!image) {
            throw new Error("Captcha image not found.");
        }

        const source = image.getAttribute("src") || image.src;
        if (source && /^data:/i.test(source)) {
            return source;
        }

        if (source) {
            const imageUrl = new URL(source, image.ownerDocument.location.href).href;
            try {
                const response = await fetch(imageUrl, {
                    credentials: "include",
                    cache: "no-store",
                });
                if (response.ok) {
                    return readBlobAsDataUrl(await response.blob());
                }
            } catch (error) {
                // Fall through to canvas extraction; some captcha URLs block fetch.
            }
        }

        try {
            const canvas = image.ownerDocument.createElement("canvas");
            const width = image.naturalWidth || Math.ceil(image.getBoundingClientRect().width);
            const height = image.naturalHeight || Math.ceil(image.getBoundingClientRect().height);
            if (!width || !height) {
                throw new Error("Captcha image is not loaded.");
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(image, 0, 0, width, height);
            return canvas.toDataURL("image/png");
        } catch (error) {
            updateStatus(`Captcha image read failed; using screenshot crop (${error.message || error}).`);
            return captureElementAsDataUrl(image);
        }
    }

    function getDataUrlKey(dataUrl) {
        const value = String(dataUrl || "");
        return `${value.length}:${value.slice(0, 48)}:${value.slice(-48)}`;
    }

    async function requestCaptchaOcr(dataUrl, options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
        try {
            const response = await fetch(options.serviceUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: dataUrl,
                    codeLength: options.codeLength,
                }),
                signal: controller.signal,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || `OCR service returned ${response.status}`);
            }
            const code = normalizeCaptchaCode(payload.text || payload.rawText, options.codeLength);
            if (code.length !== options.codeLength) {
                throw new Error(`OCR result is not ${options.codeLength} letters: ${payload.text || payload.rawText || ""}`);
            }
            return {
                code,
                elapsedMs: payload.elapsedMs,
                rawText: payload.rawText,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    async function requestSliderCaptchaRecognition(dataUrl, options) {
        const dataImage = await loadImageDataUrl(dataUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
        try {
            const response = await fetch(options.sliderServiceUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: dataUrl,
                    conf: options.sliderConfidence,
                }),
                signal: controller.signal,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || `Slider OCR service returned ${response.status}`);
            }

            const confidence = Number(payload.confidence) || 0;
            if (confidence < options.sliderConfidence) {
                throw new Error(`Slider OCR confidence too low: ${confidence.toFixed(4)} < ${options.sliderConfidence}`);
            }

            const box = Array.isArray(payload.box) ? payload.box.map(Number) : [];
            if (box.length !== 4 || box.some(value => !Number.isFinite(value))) {
                throw new Error(`Slider OCR result missing valid box: ${JSON.stringify(payload).slice(0, 160)}`);
            }

            const boxWidth = Number(payload.width ?? (box[2] - box[0]));
            const boxHeight = Number(payload.height ?? (box[3] - box[1]));
            if (!Number.isFinite(boxWidth) || !Number.isFinite(boxHeight) || boxWidth <= 1 || boxHeight <= 1) {
                throw new Error(`Slider OCR returned invalid box size: ${JSON.stringify(box)}`);
            }

            const gapLeft = Number(payload.x ?? (Array.isArray(payload.box) ? payload.box[0] : NaN));
            if (!Number.isFinite(gapLeft) || gapLeft <= 0) {
                throw new Error(`Slider OCR result missing gap left: ${JSON.stringify(payload).slice(0, 160)}`);
            }

            return {
                gapLeft,
                confidence,
                elapsedMs: payload.elapsedMs,
                imageWidth: dataImage.naturalWidth || dataImage.width || 1,
                imageHeight: dataImage.naturalHeight || dataImage.height || 1,
                raw: payload,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    function isInvalidCaptchaOcrError(error) {
        const message = String(error && error.message || error || "");
        return /OCR result is not \d+ letters|Expected \d+ letters|not \d+ letters/i.test(message);
    }

    function findCaptchaInputElement() {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return null;
        }

        const direct = seatDocument.getElementById("txtCaptcha")
            || seatDocument.querySelector("input[name='txtCaptcha']");
        if (direct && !direct.disabled && !direct.readOnly) {
            return direct;
        }

        const wrap = getCaptchaWrap();
        const roots = [wrap, seatDocument].filter(Boolean);
        for (const root of roots) {
            const inputs = Array.from(root.querySelectorAll("input"))
                .filter(input => {
                    const type = String(input.type || "text").toLowerCase();
                    if (!["", "text", "password", "tel", "search"].includes(type)) {
                        return false;
                    }
                    if (input.disabled || input.readOnly || !isElementVisible(input)) {
                        return false;
                    }
                    const hint = [
                        input.id || "",
                        input.name || "",
                        input.placeholder || "",
                        input.title || "",
                        input.getAttribute("aria-label") || "",
                    ].join(" ");
                    return root === wrap || /captcha|capcha|auth|verify|security|문자|인증|验证码/i.test(hint);
                });
            if (inputs.length) {
                return inputs[0];
            }
        }
        return null;
    }

    function clearCaptchaInput() {
        const input = findCaptchaInputElement();
        if (input) {
            setInputValue(input, "");
        }
    }

    function setInputValue(input, value) {
        const prototype = Object.getPrototypeOf(input);
        const descriptor = prototype && Object.getOwnPropertyDescriptor(prototype, "value");
        if (descriptor && descriptor.set) {
            descriptor.set.call(input, value);
        } else {
            input.value = value;
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: value[value.length - 1] || "" }));
    }

    function findCaptchaSubmitElement() {
        const seatDocument = getSeatDocument();
        const wrap = getCaptchaWrap();
        if (!seatDocument) {
            return null;
        }

        const direct = Array.from(seatDocument.querySelectorAll("[onclick*='fnCheck'], [href*='fnCheck']"))
            .find(isElementVisible);
        if (direct) {
            return direct;
        }

        const root = wrap || seatDocument;
        return Array.from(root.querySelectorAll("a, button, input[type='button'], input[type='submit'], img"))
            .filter(isElementVisible)
            .find(element => {
                const text = normalizeText([
                    element.innerText || element.textContent || "",
                    element.value || "",
                    element.alt || "",
                    element.title || "",
                    element.src || "",
                    element.getAttribute("onclick") || "",
                ].join(" "));
                return /확인|입력|输入|完毕|完成|완료|submit|confirm|captcha|auth|verify|fnCheck|btn/i.test(text);
            }) || null;
    }

    function findCaptchaRefreshElement() {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return null;
        }

        const direct = Array.from(seatDocument.querySelectorAll([
            "[onclick*='reCaptcha']",
            "[href*='reCaptcha']",
            "[onclick*='Captcha']",
            "[href*='Captcha']",
        ].join(","))).find(isElementVisible);
        if (direct && !/fnCheck|重新选择日期|输入完毕/i.test(normalizeText([
            direct.innerText || direct.textContent || "",
            direct.value || "",
            direct.alt || "",
            direct.title || "",
            direct.getAttribute("onclick") || "",
            direct.getAttribute("href") || "",
        ].join(" ")))) {
            return direct;
        }

        return Array.from(seatDocument.querySelectorAll("a, button, input[type='button'], img, span, div"))
            .filter(isElementVisible)
            .find(element => {
                const text = normalizeText([
                    element.innerText || element.textContent || "",
                    element.value || "",
                    element.alt || "",
                    element.title || "",
                    element.src || "",
                    element.getAttribute("onclick") || "",
                    element.getAttribute("href") || "",
                    element.id || "",
                    element.className || "",
                ].join(" "));
                if (/重新选择日期|输入完毕|fnCheck|captcha_ok|confirm/i.test(text)) {
                    return false;
                }
                return /reCaptcha|fnCancel|refresh|reload|captcha.*refresh|새로|다시|重新获取|换一张|刷新/i.test(text);
            }) || null;
    }

    async function refreshCaptcha(reason, options) {
        const refresh = findCaptchaRefreshElement();
        clearCaptchaInput();
        captchaOcrState.lastImageKey = "";
        if (!refresh) {
            updateCaptchaOcrStatus(`Captcha refresh button not found after ${reason}; waiting for manual input.`);
            return false;
        }

        updateStatus(`Captcha ${reason}; refreshing image.`);
        await clickElement(refresh);
        await delay(options.invalidRefreshDelayMs);
        return true;
    }

    function getCaptchaErrorText() {
        const seatDocument = getSeatDocument();
        if (!seatDocument || !seatDocument.body) {
            return "";
        }

        const text = normalizeText(seatDocument.body.innerText || seatDocument.body.textContent || "");
        const match = text.match(/请重新确认输入的文字。?|请重新输入[^。.!！]*|输入的文字[^。.!！]*(?:错误|不正确)|incorrect[^。.!！]*captcha|captcha[^。.!！]*(?:incorrect|wrong)|잘못[^。.!！]*입력|다시[^。.!！]*입력|문자[^。.!！]*(?:다시|오류|일치)/i);
        return match ? match[0] : "";
    }

    async function waitForCaptchaResult(options) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < options.submitCheckDelayMs) {
            if (!isCaptchaVisible()) {
                return {
                    solved: true,
                    errorText: "",
                };
            }

            const errorText = getCaptchaErrorText();
            if (errorText) {
                return {
                    solved: false,
                    errorText,
                };
            }
            await delay(200);
        }

        return {
            solved: !isCaptchaVisible(),
            errorText: getCaptchaErrorText(),
        };
    }

    async function submitCaptchaInput(input) {
        const button = findCaptchaSubmitElement();
        if (button) {
            return clickElement(button);
        }

        input.dispatchEvent(new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
        }));
        input.dispatchEvent(new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
        }));
        return true;
    }

    function updateCaptchaOcrStatus(message) {
        if (captchaOcrState.lastMessage === message && Date.now() - captchaOcrState.lastAttemptAt < 2000) {
            return;
        }
        captchaOcrState.lastMessage = message;
        updateStatus(message);
    }

    async function solveCaptchaWithLocalOcr() {
        const options = getCaptchaOcrOptions();
        if (!options.enabled || captchaOcrState.attempting) {
            return false;
        }

        const now = Date.now();
        if (now - captchaOcrState.lastAttemptAt < options.retryIntervalMs) {
            return false;
        }

        captchaOcrState.attempting = true;
        captchaOcrState.lastAttemptAt = now;
        try {
            const image = findCaptchaImageElement();
            const input = findCaptchaInputElement();
            if (!image || !input) {
                updateCaptchaOcrStatus("Captcha OCR skipped: image or input not found; waiting for manual input.");
                return false;
            }

            for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
                const currentImage = findCaptchaImageElement();
                const currentInput = findCaptchaInputElement();
                if (!currentImage || !currentInput) {
                    updateCaptchaOcrStatus("Captcha OCR skipped: image or input not found; waiting for manual input.");
                    return false;
                }

                const dataUrl = await imageElementToDataUrl(currentImage);
                updateStatus(`Captcha detected; calling local GLM-OCR service (${attempt}/${options.maxAttempts}).`);
                let result;
                try {
                    result = await requestCaptchaOcr(dataUrl, options);
                } catch (error) {
                    if (isInvalidCaptchaOcrError(error)) {
                        if (attempt < options.maxAttempts && await refreshCaptcha("OCR returned invalid text", options)) {
                            continue;
                        }
                        updateCaptchaOcrStatus(`Captcha OCR returned invalid text after ${attempt} attempt(s); waiting for manual input.`);
                        return false;
                    }
                    throw error;
                }

                captchaOcrState.lastImageKey = getDataUrlKey(dataUrl);
                setInputValue(currentInput, result.code);
                updateStatus(`Captcha OCR filled ${result.code}${result.elapsedMs ? ` (${result.elapsedMs}ms)` : ""}; submitting.`);
                await submitCaptchaInput(currentInput);

                const verification = await waitForCaptchaResult(options);
                if (verification.solved) {
                    updateStatus("Captcha verified.");
                    return true;
                }

                if (verification.errorText) {
                    if (attempt < options.maxAttempts && await refreshCaptcha(`verification failed (${verification.errorText})`, options)) {
                        continue;
                    }
                    updateCaptchaOcrStatus(`Captcha verification failed: ${verification.errorText}; waiting for manual input.`);
                    return false;
                }

                return true;
            }

            updateCaptchaOcrStatus("Captcha OCR attempts exhausted; waiting for manual input.");
            return false;
        } catch (error) {
            updateCaptchaOcrStatus(`Captcha OCR unavailable: ${error.message || error}; waiting for manual input.`);
            return false;
        } finally {
            captchaOcrState.attempting = false;
        }
    }

    async function waitForSliderCaptchaResult(timeoutMs = 1600) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            if (!isSliderCaptchaPopupVisible()) {
                return true;
            }
            await delay(120);
        }
        return !isSliderCaptchaPopupVisible();
    }

    async function solveSliderCaptchaWithLocalOcr(areaCode) {
        const options = getCaptchaOcrOptions();
        if (!options.enabled || captchaOcrState.attempting) {
            return false;
        }

        captchaOcrState.attempting = true;
        captchaOcrState.lastAttemptAt = Date.now();
        captchaOcrState.lastSliderError = "";
        try {
            const slider = findSliderCaptchaElement();
            if (!slider) {
                captchaOcrState.lastSliderError = "captchSlider not found";
                updateCaptchaOcrStatus("Slider captcha OCR skipped: captchSlider not found.");
                return false;
            }

            const dataUrl = await captureElementAsDataUrl(slider, 0);
            const rect = slider.getBoundingClientRect();
            updateStatus(`Slider captcha detected${areaCode ? ` for area ${areaCode}` : ""}; calling local recognizer.`);
            const result = await requestSliderCaptchaRecognition(dataUrl, options);
            const targetBlockLeft = result.gapLeft * (rect.width / Math.max(1, result.imageWidth));
            if (!Number.isFinite(targetBlockLeft) || targetBlockLeft <= 0 || targetBlockLeft >= rect.width) {
                throw new Error(`Slider target left out of range: ${targetBlockLeft}`);
            }
            updateStatus(
                `Slider gap left ${result.gapLeft.toFixed(2)}px -> ${targetBlockLeft.toFixed(2)} CSS px`
                + `${result.elapsedMs ? ` (${result.elapsedMs}ms)` : ""}.`,
            );

            const dragged = await solveSliderCaptchaInPageWorld(targetBlockLeft);
            if (!dragged) {
                captchaOcrState.lastSliderError = "slider drag failed";
                return false;
            }

            if (await waitForSliderCaptchaResult(Math.max(options.submitCheckDelayMs, 3500))) {
                updateStatus("Slider captcha verified.");
                return true;
            }

            captchaOcrState.lastSliderError = "slider captcha still visible after drag";
            updateCaptchaOcrStatus("Slider captcha still visible after drag; waiting for manual input.");
            return false;
        } catch (error) {
            captchaOcrState.lastSliderError = error.message || String(error);
            updateCaptchaOcrStatus(`Slider captcha OCR unavailable: ${captchaOcrState.lastSliderError}; waiting for manual input.`);
            return false;
        } finally {
            captchaOcrState.attempting = false;
        }
    }

    function parseAvailableSeats() {
        const seatDocument = getSeatDocument();
        if (!seatDocument || !seatDocument.body) {
            return [];
        }

        const text = normalizeText(seatDocument.body.innerText);
        const matches = [];
        const regexp = /([A-Za-z\u4e00-\u9fff\uac00-\ud7af][A-Za-z\u4e00-\u9fff\uac00-\ud7af\s-]{0,30}?)\s+(\d+)\s*座\s+([\d,]+韩元)/g;
        let match;
        while ((match = regexp.exec(text)) !== null) {
            const grade = normalizeText(match[1]).replace(/^时间\s+请选择\s+\d{1,2}:\d{2}\s+/, "");
            matches.push({
                grade,
                count: Number(match[2]),
                price: match[3],
            });
        }

        return matches.filter(item => item.grade && Number.isFinite(item.count));
    }

    function getPreferredSections() {
        const sections = activeConfig && activeConfig.section;
        if (!Array.isArray(sections)) {
            return [];
        }

        return sections
            .map(section => normalizeText(String(section)))
            .filter(Boolean);
    }

    function getDesiredTicketCount() {
        const count = Number(activeConfig && activeConfig.ticket);
        if (!Number.isFinite(count) || count < 1) {
            return 1;
        }

        return Math.max(1, Math.floor(count));
    }

    function getNumericRunConfig(key, fallback, options = {}) {
        const rawValue = activeConfig && activeConfig[key];
        if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
            const value = Number(rawValue);
            if (Number.isFinite(value) && value >= 0) {
                if (options.integer) {
                    return Math.floor(value);
                }
                return value;
            }
        }

        const fallbackValue = Number(fallback);
        if (!Number.isFinite(fallbackValue) || fallbackValue < 0) {
            return 0;
        }
        return options.integer ? Math.floor(fallbackValue) : fallbackValue;
    }

    function getRefreshIntervalMs() {
        return getNumericRunConfig("refreshIntervalMs", DEFAULT_REFRESH_INTERVAL_MS);
    }

    function getRefreshJitterMs() {
        return getNumericRunConfig("refreshJitterMs", DEFAULT_REFRESH_JITTER_MS);
    }

    function getRefreshDelayMs() {
        const baseMs = getRefreshIntervalMs();
        const jitterMs = getRefreshJitterMs();
        if (jitterMs <= 0) {
            return baseMs;
        }

        return baseMs + Math.floor(Math.random() * (jitterMs + 1));
    }

    function getAreaScanIntervalMs() {
        return getNumericRunConfig("areaScanIntervalMs", DEFAULT_AREA_SCAN_INTERVAL_MS);
    }

    function getMaxAreaClicksPerRefresh() {
        return Math.max(1, getNumericRunConfig("maxAreaClicksPerRefresh", DEFAULT_MAX_AREA_CLICKS, { integer: true }));
    }

    function getMaxSeatRow() {
        return getNumericRunConfig("maxSeatRow", interparkConfig.maxSeatRow || 0, { integer: true });
    }

    function getBookingSessionTimeoutMs() {
        const minutes = getNumericRunConfig("bookingSessionTimeoutMinutes", DEFAULT_BOOKING_SESSION_TIMEOUT_MINUTES);
        return minutes > 0 ? minutes * 60 * 1000 : 0;
    }

    async function restartBookingFromProductPage(reason) {
        const targetUrl = getConfiguredProductUrl(activeConfig);
        if (!targetUrl) {
            updateStatus("Booking session expired, but product URL is not configured.");
            return false;
        }

        setBotState(BOT_STATE.RESTARTING, reason);
        clearTimeout(refreshTimer);
        updateStatus(`${reason}; returning to NOL product page and restarting.`);
        location.href = targetUrl;
        return true;
    }

    async function restartIfBookingSessionExpired() {
        if (!isInterparkBookPage()) {
            return false;
        }

        const timeoutMs = getBookingSessionTimeoutMs();
        if (!timeoutMs) {
            return false;
        }

        const elapsedMs = Date.now() - pageStartedAt;
        if (elapsedMs < timeoutMs) {
            return false;
        }

        const elapsedMinutes = (elapsedMs / 60000).toFixed(1);
        const timeoutMinutes = (timeoutMs / 60000).toFixed(1);
        return restartBookingFromProductPage(`Booking page ran ${elapsedMinutes}/${timeoutMinutes} minutes`);
    }

    function coerceBoolean(value, fallback) {
        if (value === true || value === false) {
            return value;
        }
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        return !/^(false|0|no|off)$/i.test(String(value).trim());
    }

    function getDeliveryConfirmationConfig() {
        const defaults = interparkConfig.deliveryConfirmation || {};
        const nested = activeConfig && activeConfig.deliveryConfirmation || {};
        const source = activeConfig || {};
        return {
            delivery: source.delivery || nested.delivery || defaults.delivery || "24000",
            phoneNo: source.phoneNo || nested.phoneNo || defaults.phoneNo || "",
            mobileNo: source.mobileNo || nested.mobileNo || defaults.mobileNo || "",
            snsChannel: source.snsChannel || nested.snsChannel || defaults.snsChannel || "SN004",
            snsId: source.snsId || nested.snsId || defaults.snsId || "",
            autoNext: coerceBoolean(
                source.autoNext !== undefined ? source.autoNext : nested.autoNext,
                coerceBoolean(defaults.autoNext, true)
            ),
        };
    }

    async function delayBeforeNextArea(index, total) {
        if (index >= total - 1) {
            return;
        }

        const intervalMs = getAreaScanIntervalMs();
        if (intervalMs > 0) {
            await delay(intervalMs);
        }
    }

    function getClickableElement(element) {
        let current = element;
        for (let depth = 0; current && depth < 5; depth++) {
            const tagName = current.tagName;
            if (tagName === "A" || tagName === "BUTTON" || current.onclick || current.getAttribute("onclick") || current.getAttribute("href")) {
                return current;
            }
            current = current.parentElement;
        }

        return element;
    }

    function runMainWorldAction(element, mode) {
        const target = getClickableElement(element);
        const documentLike = target && target.ownerDocument;
        if (!target || !documentLike || !target.setAttribute) {
            return Promise.resolve(false);
        }

        const clickId = `ticket-bot-${mode}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const attribute = mode === "seat"
            ? "data-ticket-bot-seat-id"
            : "data-ticket-bot-page-click-id";
        target.setAttribute(attribute, clickId);

        return new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: "interparkMainWorldAction",
                clickId,
                mode,
            }, response => {
                target.removeAttribute(attribute);
                if (chrome.runtime.lastError) {
                    updateStatus(`Main-world ${mode} failed: ${chrome.runtime.lastError.message}`);
                    resolve(false);
                    return;
                }

                if (!response || !response.success) {
                    updateStatus(`Main-world ${mode} failed: ${response && (response.error || response.reason) || "unknown"}`);
                    resolve(false);
                    return;
                }

                resolve(true);
            });
        });
    }

    async function clickElement(element) {
        return runMainWorldAction(element, "click");
    }

    async function clickVisibleElement(element) {
        return runMainWorldAction(element, "click");
    }

    async function selectSeatInPageWorld(element) {
        return runMainWorldAction(element, "seat");
    }

    async function applyLockedSeatsInPageWorld(seats) {
        const selectedSeats = (seats || [])
            .filter(seat => seat && seat.seatGrade && seat.seatNo)
            .map(seat => ({
                seatGrade: seat.seatGrade || "",
                floor: seat.floor || "",
                rowNo: seat.rowNo || "",
                seatNo: seat.seatNo || "",
                block: seat.block || "",
            }));
        if (!selectedSeats.length) {
            return false;
        }

        return new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: "interparkMainWorldAction",
                mode: "applyLockedSeats",
                seats: selectedSeats,
            }, response => {
                if (chrome.runtime.lastError) {
                    updateStatus(`Apply locked seats failed: ${chrome.runtime.lastError.message}`);
                    resolve(false);
                    return;
                }

                if (!response || !response.success) {
                    updateStatus(`Apply locked seats failed: ${response && (response.error || response.reason) || "unknown"}`);
                    resolve(false);
                    return;
                }

                updateStatus(`Applied ${response.added || selectedSeats.length} locked seat(s) to page.`);
                resolve(true);
            });
        });
    }

    async function solveSliderCaptchaInPageWorld(targetBlockLeft) {
        if (!Number.isFinite(targetBlockLeft)) {
            return false;
        }

        return new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: "interparkMainWorldAction",
                mode: "solveSliderCaptcha",
                targetBlockLeft,
            }, response => {
                if (chrome.runtime.lastError) {
                    updateStatus(`Main-world slider captcha failed: ${chrome.runtime.lastError.message}`);
                    resolve(false);
                    return;
                }

                if (!response || !response.success) {
                    updateStatus(`Main-world slider captcha failed: ${response && (response.error || response.reason) || "unknown"}`);
                    resolve(false);
                    return;
                }

                updateStatus(`Slider captcha dragged: block left ${response.finalBlockLeft}px / target ${response.targetBlockLeft}px.`);
                resolve(true);
            });
        });
    }

    function isElementVisible(element) {
        if (!element) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        const view = element.ownerDocument && element.ownerDocument.defaultView || window;
        const style = view.getComputedStyle(element);
        return rect.width > 0
            && rect.height > 0
            && style.display !== "none"
            && style.visibility !== "hidden";
    }

    function parseFunctionArgs(source, functionName) {
        const match = String(source || "").match(new RegExp(`${functionName}\\s*\\(([\\s\\S]*?)\\)`, "i"));
        if (!match) {
            return null;
        }

        const args = [];
        const regexp = /'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|([^,\s][^,]*)/g;
        let argMatch;
        while ((argMatch = regexp.exec(match[1])) !== null) {
            args.push((argMatch[1] || argMatch[2] || argMatch[3] || "").trim());
        }
        return args;
    }

    function findSeatDocumentElements(regexp) {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return [];
        }

        return Array.from(seatDocument.querySelectorAll("a, button, li, td, div, span"))
            .filter(element => {
                const text = normalizeText(element.innerText || element.textContent);
                return text && text.length <= 120 && regexp.test(text);
            });
    }

    async function expandGrade(gradeName) {
        const escapedName = gradeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const elements = findSeatDocumentElements(new RegExp(`${escapedName}\\s*\\d*\\s*座`, "i"));
        const target = elements.find(element => {
            const text = normalizeText(element.innerText || element.textContent);
            return text.includes(gradeName) && !/Price Info|Selected Seats|选择成功/i.test(text);
        });

        if (!target) {
            return false;
        }

        await clickElement(target);
        await delay(300);
        return true;
    }

    async function expandAvailableGrades(summary) {
        const preferred = getPreferredSections();
        const preferredGrades = preferred.filter(section => /[A-Za-z\u4e00-\u9fff\uac00-\ud7af]/.test(section) && !/^\d+$/.test(section));
        const grades = preferredGrades.length ? preferredGrades : summary.map(item => item.grade);
        const uniqueGrades = Array.from(new Set(grades));

        for (const grade of uniqueGrades) {
            if (!botRunning) {
                return;
            }
            await expandGrade(grade);
        }
    }

    function normalizeAreaCode(value) {
        const codeMatch = String(value).match(/\d{1,3}/);
        return codeMatch ? codeMatch[0].padStart(3, "0") : "";
    }

    function collectAreaEntriesFromList() {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return [];
        }

        const entries = [];
        const seen = new Set();
        const elements = Array.from(seatDocument.querySelectorAll("a, button, li, td, div, span"));
        for (const element of elements) {
            const text = normalizeText(element.innerText || element.textContent);
            const match = text.match(/(\d{3})\s*区域\s*\((\d+)\s*座\)/);
            if (!match || seen.has(match[1])) {
                continue;
            }

            seen.add(match[1]);
            entries.push({
                code: match[1],
                count: Number(match[2]),
                element,
                source: "list",
            });
        }

        return entries;
    }

    function collectAreaEntriesFromMap() {
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const detailDocument = detailFrame && detailFrame.contentDocument;
        if (!detailDocument) {
            return [];
        }

        const entries = [];
        const seen = new Set();
        const areas = Array.from(detailDocument.querySelectorAll("area[href*='GetBlockSeatList']"));
        for (const area of areas) {
            const href = area.getAttribute("href") || "";
            const blockMatch = href.match(/['"](\d{3})['"]\s*\)?$/) || href.match(/,\s*['"](\d{3})['"]/);
            const text = normalizeText(area.getAttribute("alt") || area.getAttribute("title") || "");
            const code = blockMatch ? blockMatch[1] : normalizeAreaCode(text);
            if (!code || seen.has(code)) {
                continue;
            }

            const countMatch = text.match(/\((\d+)\s*座\)/);
            seen.add(code);
            entries.push({
                code,
                count: countMatch ? Number(countMatch[1]) : 0,
                element: area,
                source: "map",
            });
        }

        return entries;
    }

    function collectAreaEntries() {
        const byCode = new Map();
        [...collectAreaEntriesFromList(), ...collectAreaEntriesFromMap()].forEach(entry => {
            if (!byCode.has(entry.code) || entry.source === "list") {
                byCode.set(entry.code, entry);
            }
        });

        return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
    }

    function getCurrentAreaDetailUrl(blockCode) {
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const href = detailFrame && detailFrame.contentWindow && detailFrame.contentWindow.location.href;
        if (href && /BookSeatDetail\.asp/i.test(href)) {
            const url = new URL(href);
            url.searchParams.set("Block", blockCode);
            return url.href;
        }

        const seatFrame = getSeatFrame();
        const seatHref = seatFrame && seatFrame.contentWindow && seatFrame.contentWindow.location.href;
        if (!seatHref || !/BookSeat\.asp/i.test(seatHref)) {
            return "";
        }

        const seatUrl = new URL(seatHref);
        const detailUrl = new URL("/Global/Play/Book/BookSeatDetail.asp", seatUrl.origin);
        [
            "GoodsCode",
            "PlaceCode",
            "LanguageType",
            "MemBizCode",
            "TmgsOrNot",
            "LocOfImage",
            "Tiki",
            "BizCode",
            "PlaySeq",
            "SessionId",
            "GoodsBizCode",
            "GlobalSportsYN",
            "InterlockingGoods",
        ].forEach(key => {
            const value = seatUrl.searchParams.get(key);
            if (value !== null) {
                detailUrl.searchParams.set(key, value);
            }
        });
        detailUrl.searchParams.set("Block", blockCode);
        return detailUrl.href;
    }

    function getUrlParam(url, key) {
        try {
            return new URL(url).searchParams.get(key) || "";
        } catch (error) {
            return "";
        }
    }

    function readFieldValueFromDocument(documentLike, fieldName) {
        if (!documentLike) {
            return "";
        }

        const exact = documentLike.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (exact && exact.value) {
            return exact.value;
        }

        const lowerName = fieldName.toLowerCase();
        const fields = Array.from(documentLike.querySelectorAll("input, select"));
        const named = fields.find(element => {
            const name = `${element.name || ""} ${element.id || ""}`.toLowerCase();
            return name.includes(lowerName) && element.value;
        });
        if (named) {
            return named.value;
        }

        return "";
    }

    function getCurrentPlaySeq() {
        const seatFrame = getSeatFrame();
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const stepFrame = document.getElementById("ifrmBookStep");
        const urls = [
            seatFrame && seatFrame.contentWindow && seatFrame.contentWindow.location.href,
            detailFrame && detailFrame.contentWindow && detailFrame.contentWindow.location.href,
            stepFrame && stepFrame.contentWindow && stepFrame.contentWindow.location.href,
            location.href,
        ];

        for (const url of urls) {
            const playSeq = getUrlParam(url, "PlaySeq");
            if (playSeq) {
                return playSeq;
            }
        }

        const documents = [
            seatDocument,
            document,
            stepFrame && stepFrame.contentDocument,
        ];
        for (const documentLike of documents) {
            const playSeq = readFieldValueFromDocument(documentLike, "PlaySeq");
            if (playSeq) {
                return playSeq;
            }
        }

        const desiredTime = normalizeTimeValue(activeConfig && activeConfig.time);
        if (desiredTime) {
            const selects = Array.from(document.querySelectorAll("select"));
            for (const select of selects) {
                const option = Array.from(select.options || []).find(item => item.selected && normalizeTimeValue(item.text || item.value) === desiredTime);
                if (option && option.value) {
                    return option.value;
                }
            }
        }

        return "";
    }

    function parseSelectSeatArgs(onclick) {
        const args = parseFunctionArgs(onclick, "SelectSeat");
        if (!args) {
            return null;
        }

        return {
            seatGrade: args[1] || "",
            floor: args[2] || "",
            rowNo: args[3] || "",
            seatNo: args[4] || "",
            block: args[5] || "",
        };
    }

    function parseSeatCandidate(element, index) {
        const onclick = element.getAttribute("onclick") || element.getAttribute("href") || "";
        const selectArgs = parseSelectSeatArgs(onclick) || {};
        return {
            index,
            id: element.id || "",
            className: String(element.className || ""),
            text: normalizeText(element.textContent || element.innerText || element.title || ""),
            title: element.title || "",
            value: element.getAttribute("value") || "",
            onclick,
            seatGrade: element.getAttribute("SeatGrade") || selectArgs.seatGrade || "",
            floor: element.getAttribute("Floor") || selectArgs.floor || "",
            rowNo: element.getAttribute("RowNo") || selectArgs.rowNo || "",
            seatNo: element.getAttribute("SeatNo") || selectArgs.seatNo || "",
            block: element.getAttribute("Block") || selectArgs.block || "",
        };
    }

    function isSeatGridElement(element) {
        if (!element || element.nodeType !== 1) {
            return false;
        }

        const className = String(element.className || "");
        return /\bSeat(?:N|R|B|T|N_Daegu)\b/.test(className)
            || element.hasAttribute("SeatGrade")
            || /SelectSeat/i.test(element.getAttribute("onclick") || element.getAttribute("href") || "");
    }

    function buildVisualRowMap(documentLike) {
        const map = new Map();
        const root = documentLike && documentLike.body;
        if (!root || !documentLike.createTreeWalker) {
            return map;
        }

        let row = 1;
        let started = false;
        const walker = documentLike.createTreeWalker(root, 1);
        let element = walker.nextNode();
        while (element) {
            if (element.tagName === "BR") {
                if (started) {
                    row += 1;
                }
            } else if (isSeatGridElement(element)) {
                started = true;
                map.set(element, row);
            }

            element = walker.nextNode();
        }

        return map;
    }

    function parseSeatCandidateWithVisualRow(element, index, visualRowMap) {
        const candidate = parseSeatCandidate(element, index);
        const visualRow = visualRowMap && visualRowMap.get(element);
        if (Number.isFinite(visualRow) && visualRow > 0) {
            candidate.visualRow = visualRow;
        }
        return candidate;
    }

    function filterSeatCandidatesByConfiguredRows(candidates) {
        const maxRow = getMaxSeatRow();
        if (!maxRow) {
            return candidates;
        }

        return candidates.filter(candidate => {
            const visualRow = Number(candidate && candidate.visualRow);
            return Number.isFinite(visualRow) && visualRow > 0 && visualRow <= maxRow;
        });
    }

    function describeSeatRowFilter(candidates, filtered) {
        const maxRow = getMaxSeatRow();
        if (!maxRow || candidates.length === filtered.length) {
            return "";
        }

        return `; row filter <= ${maxRow}: ${filtered.length}/${candidates.length}`;
    }

    function findAvailableSeatCandidatesFromDocument(documentLike) {
        if (!documentLike) {
            return [];
        }

        const selectors = [
            ".SeatN",
            ".SeatN_Daegu",
            "[onclick*='SelectSeat']",
            "a[href*='SelectSeat']",
            "[SeatGrade][Floor][RowNo][SeatNo]",
        ].join(",");

        const visualRowMap = buildVisualRowMap(documentLike);
        return Array.from(documentLike.querySelectorAll(selectors))
            .filter(element => {
                const className = String(element.className || "");
                return !/\bSeatR\b|\bSeatB\b|\bSeatT\b/.test(className)
                    && !element.disabled
                    && element.getAttribute("value") !== "Y";
            })
            .map((element, index) => parseSeatCandidateWithVisualRow(element, index, visualRowMap));
    }

    function countSeatGridNodesFromDocument(documentLike) {
        if (!documentLike) {
            return 0;
        }

        const selectors = [
            ".SeatN",
            ".SeatN_Daegu",
            ".SeatR",
            ".SeatB",
            ".SeatT",
            "[onclick*='SelectSeat']",
            "a[href*='SelectSeat']",
            "[SeatGrade][Floor][RowNo][SeatNo]",
        ].join(",");

        return documentLike.querySelectorAll(selectors).length;
    }

    async function fetchAreaDetail(blockCode) {
        const url = getCurrentAreaDetailUrl(blockCode);
        if (!url) {
            return {
                blockCode,
                candidates: [],
                reason: "BookSeatDetail URL is not ready.",
            };
        }

        try {
            const response = await fetch(url, { credentials: "include" });
            const html = await response.text();
            const documentLike = new DOMParser().parseFromString(html, "text/html");
            const captchaOpenDetected = /CaptchaOpen\s*\(/i.test(html);
            return {
                blockCode,
                ok: response.ok,
                status: response.status,
                htmlLength: html.length,
                captchaOpenDetected,
                seatNodeCount: countSeatGridNodesFromDocument(documentLike),
                candidates: findAvailableSeatCandidatesFromDocument(documentLike),
            };
        } catch (error) {
            return {
                blockCode,
                candidates: [],
                error: error.message,
            };
        }
    }

    function buildSeatLockPayload(candidates) {
        const seatDocument = getSeatDocument();
        const form = seatDocument && seatDocument.getElementById("frmInfo");
        if (!form || !form.action) {
            return null;
        }

        const params = new URLSearchParams();
        Array.from(form.elements || []).forEach(element => {
            if (!element.name || element.disabled) {
                return;
            }

            if ((element.type === "checkbox" || element.type === "radio") && !element.checked) {
                return;
            }

            params.append(element.name, element.value || "");
        });

        const selected = candidates.filter(candidate => candidate.seatGrade && candidate.seatNo);
        if (!selected.length) {
            return null;
        }

        const playSeq = params.get("PlaySeq") || getCurrentPlaySeq();
        if (!playSeq) {
            updateStatus("Seat lock payload missing PlaySeq; stop before lock request.");
            return null;
        }

        const joined = field => `${selected.map(candidate => candidate[field] || "").join("^")}^`;
        params.set("Flag", "Blocking");
        params.set("PlaySeq", playSeq);
        params.set("SeatCnt", String(selected.length));
        params.set("SeatGrade", joined("seatGrade"));
        params.set("Floor", joined("floor"));
        params.set("RowNo", joined("rowNo"));
        params.set("SeatNo", joined("seatNo"));

        return {
            action: form.action,
            form,
            params,
            selected,
        };
    }

    function getSelectedSeatCount() {
        const seatDocument = getSeatDocument();
        if (!seatDocument || !seatDocument.body) {
            return 0;
        }

        const text = normalizeText(seatDocument.body.innerText);
        const countMatch = text.match(/共\s*(\d+)\s*座\s*选择成功/i)
            || text.match(/Selected Seats\s*(?:共\s*)?(\d+)\s*座/i)
            || text.match(/선택.*?(\d+)/i);
        if (countMatch) {
            return Number(countMatch[1]) || 0;
        }

        const selectedRows = seatDocument.querySelectorAll("#SelectedSeat, #SelectedSeatList tr, .SeatSelected, .SeatChoice");
        return selectedRows.length || 0;
    }

    async function waitForSelectedSeatCount(expectedCount, timeoutMs = 4000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            if (getSelectedSeatCount() >= expectedCount) {
                return true;
            }
            await delay(250);
        }
        return false;
    }

    function isSeatLockSuccess(responseText) {
        const text = responseText || "";
        const hasSuccessCallbacks = /parent\.fnSetSeat\s*\(\s*\)/i.test(text)
            && /parent\.fnSetSelectAble\s*\(\s*true\s*\)/i.test(text);
        const hasFailureText = /alert\s*\(|error|fail|매진|이미|불가|선택하신 좌석/i.test(text);
        return hasSuccessCallbacks && !hasFailureText;
    }

    async function submitSeatLock(candidates) {
        if (isCaptchaVisible()) {
            updateStatus("Captcha is still visible; skip seat lock API.");
            return null;
        }

        const payload = buildSeatLockPayload(candidates);
        if (!payload) {
            updateStatus("Seat lock payload could not be built.");
            return null;
        }

        await delay(700);
        if (isCaptchaVisible()) {
            updateStatus("Captcha appeared before seat lock API; skip lock request.");
            return null;
        }

        try {
            const response = await fetch(payload.action, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: payload.params.toString(),
            });
            const text = await response.text();
            const success = response.ok && isSeatLockSuccess(text);
            updateStatus(success
                ? `Seat lock API succeeded for ${payload.selected.length} seat(s).`
                : `Seat lock API failed with status ${response.status}.`);
            if (success) {
                const firstSeat = payload.selected[0];
                lockedSeatContext = {
                    selected: payload.selected,
                    firstSeat,
                    lockedAt: Date.now(),
                };
                updateStatus(`Seat lock API returned success for ${firstSeat.block || "-"} ${firstSeat.seatNo || ""}; waiting for page selection.`);
            }
            return success ? payload.selected : null;
        } catch (error) {
            updateStatus(`Seat lock API failed: ${error.message}`);
            return null;
        }
    }

    async function loadAreaInFrame(entry) {
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const detailWindow = detailFrame && detailFrame.contentWindow;
        const currentBlock = getUrlParam(detailWindow && detailWindow.location.href, "Block");

        if (currentBlock === entry.code && findLiveSeatElements().length) {
            return true;
        }

        const url = getCurrentAreaDetailUrl(entry.code);
        if (detailWindow && url) {
            detailWindow.location.href = url;
            await delay(1200);
            return true;
        }

        return clickArea(entry);
    }

    function findSeatCompleteButton() {
        const seatDocument = getSeatDocument();
        if (!seatDocument) {
            return null;
        }

        const selectors = [
            "[onclick*='fnSelect']",
            "a[href*='fnSelect']",
            "img[src*='btn_select']",
            "img[src*='btn_seat']",
            ".seatR a",
            ".seatR input",
            ".seatR button",
        ].join(",");

        const candidates = Array.from(seatDocument.querySelectorAll(selectors))
            .map(element => getClickableElement(element))
            .filter((element, index, list) => element && list.indexOf(element) === index)
            .filter(element => {
                const text = normalizeText([
                element.innerText || element.textContent || "",
                element.value || "",
                element.getAttribute("title") || "",
                element.getAttribute("alt") || "",
                element.getAttribute("onclick") || "",
                element.getAttribute("href") || "",
                element.getAttribute("src") || "",
                element.querySelector && Array.from(element.querySelectorAll("img")).map(img => img.getAttribute("src") || img.alt || "").join(" ") || "",
            ].join(" "));
                return /Seat selection completed|选择成功|选择完成|좌석선택완료|선택완료|fnSelect|btn_select|btn_seat_confirm|btn_booking/i.test(text);
            });

        return candidates.find(isElementVisible) || candidates[0] || null;
    }

    function findLiveSeatElements() {
        const seatDocument = getSeatDocument();
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const detailDocument = detailFrame && detailFrame.contentDocument;
        if (!detailDocument) {
            return [];
        }

        const selectors = [
            ".SeatN",
            ".SeatN_Daegu",
            "[onclick*='SelectSeat']",
            "a[href*='SelectSeat']",
            "[SeatGrade][Floor][RowNo][SeatNo]",
        ].join(",");

        return Array.from(detailDocument.querySelectorAll(selectors))
            .filter(element => !/\bSeatR\b|\bSeatB\b|\bSeatT\b/.test(String(element.className || ""))
                && element.getAttribute("value") !== "Y");
    }

    function isSameSeatCandidate(left, right) {
        if (!left || !right) {
            return false;
        }

        return (!right.seatGrade || left.seatGrade === right.seatGrade)
            && (!right.floor || left.floor === right.floor)
            && (!right.rowNo || left.rowNo === right.rowNo)
            && left.seatNo === right.seatNo
            && (!right.block || left.block === right.block);
    }

    function findLiveSeatElementForCandidate(candidate) {
        const seats = findLiveSeatElements();
        const detailDocument = seats[0] && seats[0].ownerDocument;
        const visualRowMap = buildVisualRowMap(detailDocument);
        const parsedSeats = seats.map((element, index) => ({
            element,
            candidate: parseSeatCandidateWithVisualRow(element, index, visualRowMap),
        }));

        const exact = parsedSeats.find(item => isSameSeatCandidate(item.candidate, candidate));
        if (exact) {
            return exact.element;
        }

        const sameSeatNo = parsedSeats.find(item => item.candidate.seatNo && item.candidate.seatNo === candidate.seatNo);
        return sameSeatNo && sameSeatNo.element || null;
    }

    function findLiveSeatCandidates() {
        const elements = findLiveSeatElements();
        const detailDocument = elements[0] && elements[0].ownerDocument;
        const visualRowMap = buildVisualRowMap(detailDocument);
        return elements
            .map((element, index) => parseSeatCandidateWithVisualRow(element, index, visualRowMap))
            .filter(candidate => candidate.seatGrade && candidate.seatNo);
    }

    async function waitForPriceStep(timeoutMs = 10000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            const priceFrame = document.getElementById("ifrmBookStep");
            const priceDocument = priceFrame && priceFrame.contentDocument;
            const seatCountSelect = priceDocument && priceDocument.querySelector('select[name="SeatCount"]');
            if (seatCountSelect) {
                return {
                    frame: priceFrame,
                    document: priceDocument,
                    select: seatCountSelect,
                };
            }

            await delay(400);
        }

        return null;
    }

    async function waitForDeliveryStep(timeoutMs = 10000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            const deliveryFrame = document.getElementById("ifrmBookStep");
            const deliveryDocument = deliveryFrame && deliveryFrame.contentDocument;
            const hasConfirmationFields = deliveryDocument
                && deliveryDocument.getElementById("MemberName")
                && deliveryDocument.getElementById("Email")
                && deliveryDocument.getElementById("SNSChannel");

            if (hasConfirmationFields) {
                return {
                    frame: deliveryFrame,
                    document: deliveryDocument,
                };
            }

            await delay(400);
        }

        return null;
    }

    function dispatchFieldEvents(element) {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setFieldValue(documentLike, selector, value) {
        const element = documentLike.querySelector(selector);
        if (!element || value === undefined || value === null) {
            return false;
        }

        element.value = String(value);
        dispatchFieldEvents(element);
        return true;
    }

    function isSeatStepReady() {
        const seatDocument = getSeatDocument();
        const seatFrame = getSeatFrame();
        const seatUrl = seatFrame && seatFrame.contentWindow && seatFrame.contentWindow.location.href;
        return Boolean(seatDocument
            && seatDocument.body
            && /BookSeat\.asp/i.test(seatUrl || "")
            && (seatDocument.getElementById("divCaptchaWrap") || seatDocument.getElementById("ifrmSeatDetail") || seatDocument.getElementById("frmInfo")));
    }

    async function clickBookingNextButton() {
        const candidates = [
            document.getElementById("LargeNextBtnImage"),
            document.getElementById("LargeNextBtnLink"),
            document.getElementById("SmallNextBtnLink"),
            document.getElementById("SmallNextBtnImage"),
            ...Array.from(document.querySelectorAll("a, button")).filter(element => /Next|下一步|다음/i.test(normalizeText(element.innerText || element.textContent || ""))),
        ].filter(Boolean);

        const target = candidates.find(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0
                && rect.height > 0
                && style.display !== "none"
                && style.visibility !== "hidden";
        });

        if (!target) {
            updateStatus("Booking next button was not found.");
            return false;
        }

        if (!await clickVisibleElement(target)) {
            return false;
        }
        updateStatus("Clicked booking next button.");
        return true;
    }

    async function waitForSeatStep(timeoutMs = 12000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            if (isSeatStepReady()) {
                return true;
            }
            await delay(400);
        }
        return false;
    }

    async function waitForDateTimeStep(timeoutMs = 10000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            const stepFrame = document.getElementById("ifrmBookStep");
            const stepDocument = stepFrame && stepFrame.contentDocument;
            const stepUrl = stepFrame && stepFrame.contentWindow && stepFrame.contentWindow.location.href;
            if (stepDocument && /BookDatetime\.asp/i.test(stepUrl || "")) {
                return {
                    frame: stepFrame,
                    document: stepDocument,
                };
            }
            await delay(300);
        }
        return null;
    }

    function collectDateTimeOptions(documentLike) {
        if (!documentLike) {
            return [];
        }

        return Array.from(documentLike.querySelectorAll("a, button, input, td, li, div, span"))
            .map(element => {
                const source = [
                    element.getAttribute("onclick") || "",
                    element.getAttribute("href") || "",
                    element.getAttribute("value") || "",
                ].join(" ");
                const args = parseFunctionArgs(source, "fnSetBookDateTime");
                if (!args || !args[0] || !args[1]) {
                    return null;
                }

                return {
                    element,
                    playDate: normalizeDateValue(args[0]),
                    playSeq: args[1],
                    playTime: normalizeTimeValue(args[2]),
                    text: normalizeText(element.innerText || element.textContent || element.value || ""),
                };
            })
            .filter(Boolean);
    }

    function collectPlayDateOptions(documentLike) {
        if (!documentLike) {
            return [];
        }

        return Array.from(documentLike.querySelectorAll("a, button, td, li, div, span"))
            .map(element => {
                const source = [
                    element.getAttribute("onclick") || "",
                    element.getAttribute("href") || "",
                ].join(" ");
                const args = parseFunctionArgs(source, "fnSelectPlayDate");
                if (!args || !args[1]) {
                    return null;
                }

                return {
                    element,
                    index: Number(args[0]),
                    playDate: normalizeDateValue(args[1]),
                    text: normalizeText(element.innerText || element.textContent || ""),
                };
            })
            .filter(Boolean);
    }

    function collectPlaySeqOptions(documentLike) {
        if (!documentLike) {
            return [];
        }

        return Array.from(documentLike.querySelectorAll("a, button, li, div, span"))
            .map(element => {
                const source = [
                    element.getAttribute("onclick") || "",
                    element.getAttribute("href") || "",
                ].join(" ");
                const args = parseFunctionArgs(source, "fnSelectPlaySeq");
                if (!args || !args[1]) {
                    return null;
                }

                return {
                    element,
                    index: Number(args[0]),
                    playSeq: args[1],
                    onlineDate: args[2] || "",
                    playTime: normalizeTimeValue(args[3]),
                    balanceSeatYN: args[4] || "",
                    cancelableDate: args[5] || "",
                    text: normalizeText(element.innerText || element.textContent || ""),
                };
            })
            .filter(Boolean);
    }

    function chooseDateTimeOption(options) {
        const targetDate = normalizeDateValue(activeConfig && activeConfig.date);
        const targetTime = normalizeTimeValue(activeConfig && activeConfig.time);

        return options.find(option => {
            const dateMatches = !targetDate || option.playDate === targetDate;
            const timeMatches = !targetTime || option.playTime === targetTime || normalizeTimeValue(option.text).includes(targetTime);
            return dateMatches && timeMatches;
        }) || options.find(option => !targetDate || option.playDate === targetDate) || options[0] || null;
    }

    function choosePlayDateOption(options) {
        const targetDate = normalizeDateValue(activeConfig && activeConfig.date);
        return options.find(option => !targetDate || option.playDate === targetDate) || options[0] || null;
    }

    function choosePlaySeqOption(options) {
        const targetTime = normalizeTimeValue(activeConfig && activeConfig.time);
        return options.find(option => !targetTime || option.playTime === targetTime || normalizeTimeValue(option.text).includes(targetTime))
            || options[0]
            || null;
    }

    async function waitForPlaySeqOption(dateTimeDocument, timeoutMs = 8000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            const options = collectPlaySeqOptions(dateTimeDocument);
            if (options.length) {
                return choosePlaySeqOption(options);
            }
            await delay(300);
        }
        return null;
    }

    async function ensureDateTimeSelected() {
        if (isSeatStepReady()) {
            return true;
        }

        const dateTimeStep = await waitForDateTimeStep();
        if (!dateTimeStep) {
            updateStatus("Waiting for Date/Time step...");
            return false;
        }

        const options = collectDateTimeOptions(dateTimeStep.document);
        const selected = chooseDateTimeOption(options);
        if (selected) {
            await clickElement(selected.element);
            await delay(500);
            updateStatus(`Selected date/time ${selected.playDate} ${selected.playTime || selected.playSeq}.`);
        } else {
            const dateOption = choosePlayDateOption(collectPlayDateOptions(dateTimeStep.document));
            if (!dateOption) {
                updateStatus("No Date option found for configured date.");
                return false;
            }

            await clickElement(dateOption.element);
            updateStatus(`Selected date ${dateOption.playDate}.`);

            const seqOption = await waitForPlaySeqOption(dateTimeStep.document);
            if (!seqOption) {
                updateStatus("No PlaySeq option found for configured time.");
                return false;
            }

            await clickElement(seqOption.element);
            updateStatus(`Selected time ${seqOption.playTime || seqOption.playSeq}.`);
        }
        await delay(500);

        if (!await clickBookingNextButton()) {
            return false;
        }

        return waitForSeatStep();
    }

    function selectOption(documentLike, selector, preferredValue, fallbackText) {
        const select = documentLike.querySelector(selector);
        if (!select) {
            return false;
        }

        let option = Array.from(select.options).find(item => item.value === preferredValue);
        if (!option && fallbackText) {
            option = Array.from(select.options).find(item => item.text.trim().toLowerCase() === fallbackText.toLowerCase());
        }

        if (!option) {
            return false;
        }

        select.value = option.value;
        dispatchFieldEvents(select);
        return true;
    }

    async function setRadioValue(documentLike, name, value) {
        const radio = Array.from(documentLike.querySelectorAll(`input[type="radio"][name="${name}"]`))
            .find(item => item.value === value);
        if (!radio) {
            return false;
        }

        radio.checked = true;
        await clickElement(radio);
        dispatchFieldEvents(radio);
        return true;
    }

    async function fillDeliveryConfirmationAndNext() {
        const deliveryStep = await waitForDeliveryStep();
        if (!deliveryStep) {
            updateStatus("Delivery/Confirmation step was not reached.");
            return false;
        }

        const deliveryConfig = getDeliveryConfirmationConfig();
        const deliveryDocument = deliveryStep.document;

        await setRadioValue(deliveryDocument, "Delivery", deliveryConfig.delivery || "24000");
        setFieldValue(deliveryDocument, "#PhoneNo", deliveryConfig.phoneNo || "");
        setFieldValue(deliveryDocument, "#HpNo", deliveryConfig.mobileNo || "");
        selectOption(deliveryDocument, "#SNSChannel", deliveryConfig.snsChannel || "SN004", "wechat");
        setFieldValue(deliveryDocument, "#SNSID", deliveryConfig.snsId || "");

        updateStatus("Delivery/Confirmation form filled.");
        await delay(500);

        if (!deliveryDocument.getElementById("PhoneNo").value.trim()) {
            updateStatus("Delivery/Confirmation phoneNo is missing in config.");
            return false;
        }

        const snsChannel = deliveryDocument.getElementById("SNSChannel");
        const snsId = deliveryDocument.getElementById("SNSID");
        if (snsChannel && snsChannel.value && snsId && !snsId.value.trim()) {
            updateStatus("Delivery/Confirmation snsId is missing in config.");
            return false;
        }

        if (deliveryConfig.autoNext === false) {
            return true;
        }

        return clickBookingNextButton();
    }

    async function selectTicketCountAndNext() {
        const priceStep = await waitForPriceStep();
        if (!priceStep) {
            updateStatus("Seat lock did not reach Price/Discount step.");
            return false;
        }

        const desiredCount = getDesiredTicketCount();
        const options = Array.from(priceStep.select.options)
            .map(option => Number(option.value))
            .filter(value => Number.isFinite(value));
        const maxOption = Math.max(...options);
        const selectedCount = Math.min(desiredCount, maxOption);

        if (selectedCount < 1) {
            updateStatus("Price/Discount step has no positive ticket count option.");
            return false;
        }

        priceStep.select.value = String(selectedCount);
        priceStep.select.dispatchEvent(new Event("input", { bubbles: true }));
        priceStep.select.dispatchEvent(new Event("change", { bubbles: true }));
        updateStatus(`Price/Discount ticket count set to ${selectedCount}.`);
        await delay(600);

        if (await clickBookingNextButton()) {
            return fillDeliveryConfirmationAndNext();
        }

        return false;
    }

    async function selectSeatCandidates(entry, candidates) {
        if (!await loadAreaInFrame(entry)) {
            return false;
        }

        const desiredCount = Math.min(getDesiredTicketCount(), candidates.length);
        const clickedSeats = [];
        for (const candidate of candidates.slice(0, desiredCount)) {
            const liveSeat = findLiveSeatElementForCandidate(candidate);
            if (!liveSeat) {
                updateStatus(`Seat ${candidate.seatNo} in area ${entry.code} was not found on the live seat map.`);
                return false;
            }

            if (!await selectSeatInPageWorld(liveSeat)) {
                updateStatus(`Seat ${candidate.seatNo} in area ${entry.code} could not be selected in the page world.`);
                return false;
            }
            clickedSeats.push(candidate);
            await delay(500);
        }

        if (!await waitForSelectedSeatCount(desiredCount)) {
            updateStatus(`Clicked seat(s) ${clickedSeats.map(seat => seat.seatNo).join(", ")}, but selected seat count did not update.`);
            return false;
        }

        const completeButton = findSeatCompleteButton();
        if (completeButton) {
            await clickElement(completeButton);
            updateStatus(`Selected seat(s) ${clickedSeats.map(seat => seat.seatNo).join(", ")} in area ${entry.code}; clicked seat completion.`);
            lockedSeatContext = {
                selected: clickedSeats,
                firstSeat: clickedSeats[0],
                selectedAt: Date.now(),
            };
            return selectTicketCountAndNext();
        }

        updateStatus(`Selected seat(s) in area ${entry.code}; seat completion button not found.`);
        lockedSeatContext = {
            selected: clickedSeats,
            firstSeat: clickedSeats[0],
            selectedAt: Date.now(),
        };
        return true;
    }

    async function scanAreaDetailApis(entries, targetCodes) {
        const sliderCaptchaAttemptsByArea = new Map();
        for (let index = 0; index < targetCodes.length; index++) {
            const code = targetCodes[index];
            if (!botRunning) {
                return null;
            }

            if (isCaptchaVisible()) {
                updateStatus("Captcha is still visible; skip area detail API scan.");
                return null;
            }

            const entry = entries.find(item => item.code === code) || {
                code,
                count: 0,
                element: null,
                source: "config",
            };

            const detail = await fetchAreaDetail(code);
            if (detail.error) {
                updateStatus(`Area ${code} detail fetch failed: ${detail.error}`);
                await delayBeforeNextArea(index, targetCodes.length);
                continue;
            }

            if (detail.ok && detail.captchaOpenDetected) {
                updateStatus(`Area ${code} detail API returned CaptchaOpen; trying manual area open.`);
                await tryOpenAreaForCaptchaCheck(entry);
                if (isSliderCaptchaPopupVisible()) {
                    const options = getCaptchaOcrOptions();
                    const attempts = sliderCaptchaAttemptsByArea.get(code) || 0;
                    if (attempts < options.maxAttempts) {
                        sliderCaptchaAttemptsByArea.set(code, attempts + 1);
                    } else {
                        captchaOcrState.lastSliderError = `slider captcha attempts exhausted for area ${code}`;
                    }

                    if (attempts < options.maxAttempts && await solveSliderCaptchaWithLocalOcr(code)) {
                        updateStatus(`Area ${code}: slider captcha solved; retry detail API.`);
                        await delay(Math.max(options.submitCheckDelayMs, 2000));
                        index -= 1;
                        continue;
                    }

                    try {
                        const saved = await captureAndSaveSliderCaptchaSnapshot(code);
                        updateStatus(`captchSlider snapshot saved: ${saved.filename}`);
                    } catch (error) {
                        updateStatus(`captchSlider snapshot save failed: ${error && error.message || error}`);
                    }
                    const sliderReason = captchaOcrState.lastSliderError
                        ? `Automatic slider handling failed: ${captchaOcrState.lastSliderError}`
                        : "Automatic slider handling failed";
                    await pauseBotWithNotification(`Area ${code} seat map API returned CaptchaOpen and captchSlider appeared on the page; paused. ${sliderReason}`);
                    return {
                        entry,
                        detail,
                        locked: false,
                        selected: false,
                        paused: true,
                    };
                }

                updateStatus(`Area ${code}: CaptchaOpen returned but captchSlider did not appear; continue API polling.`);
                await delayBeforeNextArea(index, targetCodes.length);
                continue;
            }

            const candidates = filterSeatCandidatesByConfiguredRows(detail.candidates);
            if (!candidates.length) {
                updateStatus(`Area ${code}: 0 selectable seats${describeSeatRowFilter(detail.candidates, candidates)}.`);
                await delayBeforeNextArea(index, targetCodes.length);
                continue;
            }

            updateStatus(`Area ${code}: found ${candidates.length} selectable seat(s)${describeSeatRowFilter(detail.candidates, candidates)}.`);
            const desiredCandidates = candidates.slice(0, Math.min(getDesiredTicketCount(), candidates.length));
            const locked = await submitSeatLock(desiredCandidates);
            if (!locked) {
                await delayBeforeNextArea(index, targetCodes.length);
                continue;
            }

            updateStatus(`Area ${code}: API locked seat(s) ${locked.map(seat => seat.seatNo).join(", ")}; applying to page.`);
            const applied = await applyLockedSeatsInPageWorld(locked);
            const selected = applied ? await selectTicketCountAndNext() : await selectSeatCandidates(entry, locked);

            return {
                entry,
                detail,
                locked,
                selected,
            };
        }

        return null;
    }

    function getTargetAreaCodes(entries) {
        const preferredCodes = getPreferredSections()
            .map(normalizeAreaCode)
            .filter(Boolean);
        if (preferredCodes.length) {
            updateStatus(`Using configured area(s): ${preferredCodes.join(", ")}`);
            return preferredCodes;
        }

        return entries
            .map(entry => entry.code)
            .slice(0, getMaxAreaClicksPerRefresh());
    }

    async function clickArea(entry) {
        if (!entry || !entry.element) {
            return false;
        }

        if (!await clickElement(entry.element)) {
            updateStatus(`Area ${entry.code} click failed; trying frame load fallback.`);
            return false;
        }
        await delay(800);
        updateStatus(`Clicked area ${entry.code} (${entry.count || 0} seats).`);
        return true;
    }

    async function tryOpenAreaForCaptchaCheck(entry) {
        if (!entry) {
            return false;
        }

        if (entry.element && await clickArea(entry)) {
            await delay(1000);
            return true;
        }

        if (await loadAreaInFrame(entry)) {
            await delay(1000);
            return true;
        }

        return false;
    }

    function getSelectedAreaSnapshot() {
        const seatDocument = getSeatDocument();
        const infoFrame = seatDocument && seatDocument.getElementById("ifrmInfo");
        const detailFrame = seatDocument && seatDocument.getElementById("ifrmSeatDetail");
        const readFrameText = frame => {
            try {
                return normalizeText(frame && frame.contentDocument && frame.contentDocument.body && frame.contentDocument.body.innerText);
            } catch (error) {
                return "";
            }
        };

        return normalizeText(`${readFrameText(detailFrame)} ${readFrameText(infoFrame)}`);
    }

    async function scanAreas(summary) {
        if (isCaptchaVisible()) {
            updateStatus("Captcha is still visible; skip area scan.");
            return {
                clicked: [],
                availableAreas: [],
                selected: false,
                locked: false,
            };
        }

        await expandAvailableGrades(summary);
        if (isCaptchaVisible()) {
            updateStatus("Captcha appeared while expanding grades; skip area scan.");
            return {
                clicked: [],
                availableAreas: [],
                selected: false,
                locked: false,
            };
        }

        const entries = collectAreaEntries();
        const targetCodes = getTargetAreaCodes(entries);
        if (!targetCodes.length) {
            updateStatus("No area entries found after expanding grades.");
            return {
                clicked: [],
                availableAreas: [],
                selected: false,
                locked: false,
            };
        }

        if (USE_SEAT_DETAIL_API_FLOW) {
            const directResult = await scanAreaDetailApis(entries, targetCodes);
            if (directResult && directResult.locked) {
                return {
                    clicked: [directResult.entry],
                    availableAreas: [directResult.entry],
                    locked: true,
                    selected: Boolean(directResult.selected),
                    detail: directResult.detail,
                };
            }

            return {
                clicked: [],
                availableAreas: entries.filter(entry => entry.count > 0),
                detailText: getSelectedAreaSnapshot(),
                selected: false,
                locked: false,
            };
        }

        const clicked = [];
        for (let index = 0; index < targetCodes.length; index++) {
            const code = targetCodes[index];
            if (!botRunning) {
                break;
            }

            const entry = entries.find(item => item.code === code) || {
                code,
                count: 0,
                element: null,
                source: "config",
            };

            if (await loadAreaInFrame(entry)) {
                clicked.push(entry);
                updateStatus(`Opened area ${code} from ${entry.source}.`);
                await delay(700);
                const rawLiveCandidates = findLiveSeatCandidates();
                const liveCandidates = filterSeatCandidatesByConfiguredRows(rawLiveCandidates);
                if (liveCandidates.length) {
                    updateStatus(`Area ${code}: found ${liveCandidates.length} live selectable seat(s)${describeSeatRowFilter(rawLiveCandidates, liveCandidates)}.`);
                    const selected = await selectSeatCandidates(entry, liveCandidates.slice(0, getDesiredTicketCount()));
                    if (selected) {
                        return {
                            clicked,
                            availableAreas: [entry],
                            detailText: getSelectedAreaSnapshot(),
                            selected: true,
                            locked: false,
                        };
                    }
                    await delayBeforeNextArea(index, targetCodes.length);
                } else {
                    updateStatus(`Area ${code}: no live selectable seats on page${describeSeatRowFilter(rawLiveCandidates, liveCandidates)}.`);
                    await delayBeforeNextArea(index, targetCodes.length);
                }
            } else {
                updateStatus(`Area ${code} could not be opened from current page.`);
                await delayBeforeNextArea(index, targetCodes.length);
            }
        }

        return {
            clicked,
            availableAreas: entries.filter(entry => entry.count > 0),
            detailText: getSelectedAreaSnapshot(),
            selected: false,
            locked: false,
        };
    }

    function getTotalAvailable(summary) {
        return summary.reduce((total, item) => total + item.count, 0);
    }

    function formatSummary(summary) {
        if (!summary.length) {
            return "No seat summary found";
        }

        return summary.map(item => `${item.grade}: ${item.count} seats`).join(" | ");
    }

    function ensureStatusPanel() {
        let panel = document.getElementById("ticket-bot-interpark-status");
        if (panel) {
            return panel;
        }

        panel = document.createElement("div");
        panel.id = "ticket-bot-interpark-status";
        panel.style.cssText = [
            "position:fixed",
            "right:12px",
            "bottom:12px",
            "z-index:2147483647",
            "max-width:320px",
            "padding:10px 12px",
            "background:#111827",
            "color:#fff",
            "font:12px/1.45 Arial,sans-serif",
            "border-radius:6px",
            "box-shadow:0 8px 24px rgba(0,0,0,.25)",
        ].join(";");
        document.documentElement.appendChild(panel);
        return panel;
    }

    function updateStatus(message) {
        const panel = ensureStatusPanel();
        panel.textContent = `[Interpark] ${message}`;
        console.log(`[Interpark] ${message}`);
    }

    async function refreshSeatList() {
        const seatWindow = getSeatWindow();
        if (!seatWindow) {
            updateStatus("Waiting for seat frame...");
            return {
                summary: [],
                areaResult: {
                    clicked: [],
                    availableAreas: [],
                    selected: false,
                },
            };
        }

        if (isCaptchaVisible()) {
            setBotState(BOT_STATE.CAPTCHA);
            if (await solveCaptchaWithLocalOcr()) {
                return {
                    summary: parseAvailableSeats(),
                    areaResult: {
                        clicked: [],
                        availableAreas: [],
                        selected: false,
                    },
                };
            }
            updateStatus("Waiting for manual captcha input...");
            return {
                summary: parseAvailableSeats(),
                areaResult: {
                    clicked: [],
                    availableAreas: [],
                    selected: false,
                },
            };
        }

        updateStatus(USE_SEAT_DETAIL_API_FLOW
            ? "Checking configured area detail API for seats and lock."
            : "Checking configured area on the live seat map without API lock.");
        setBotState(BOT_STATE.SCANNING);
        await delay(300);
        const summary = parseAvailableSeats();
        const areaResult = await scanAreas(summary);
        const summaryText = formatSummary(summary);
        if (summaryText !== lastSummaryText) {
            lastSummaryText = summaryText;
            const clickedText = areaResult.clicked.map(entry => entry.code).join(", ");
            updateStatus(`Checked: ${summaryText}${clickedText ? ` | areas: ${clickedText}` : ""}`);
        }
        return {
            summary,
            areaResult,
        };
    }

    async function runRefreshLoop() {
        while (botRunning) {
            if (!await syncRunStateConfig()) {
                return;
            }

            if (!isMatchingBooking(activeConfig)) {
                updateStatus("Current product does not match this card. Stopped.");
                stopBot();
                return;
            }

            if (await restartIfBookingSessionExpired()) {
                return;
            }

            setBotState(BOT_STATE.DATE_TIME);
            const dateTimeReady = await ensureDateTimeSelected();
            if (!dateTimeReady) {
                await delay(getRefreshDelayMs());
                continue;
            }

            const result = await refreshSeatList();
            const summary = result.summary || [];
            const available = getTotalAvailable(summary);
            const availableAreas = result.areaResult && result.areaResult.availableAreas || [];
            if (result.areaResult && result.areaResult.selected) {
                setBotState(BOT_STATE.SELECTED);
                const selectedArea = result.areaResult.clicked[0] && result.areaResult.clicked[0].code;
                notifySelectedSeats(`Interpark selected a seat in area ${selectedArea || "-"}; proceeding to next step`, lockedSeatContext && lockedSeatContext.selected);
                await markRunStateStopped();
                botRunning = false;
                return;
            }

            if (result.areaResult && result.areaResult.paused) {
                return;
            }

            if (result.areaResult && result.areaResult.locked) {
                setBotState(BOT_STATE.LOCKED);
                const firstSeat = lockedSeatContext && lockedSeatContext.firstSeat;
                updateStatus(`Seat locked${firstSeat ? ` (${firstSeat.block || ""} ${firstSeat.seatNo || ""})` : ""}; stopped refresh/lock loop.`);
                if (firstSeat) {
                    notifySelectedSeats("Interpark seat lock succeeded", lockedSeatContext && lockedSeatContext.selected || [firstSeat]);
                }
                await markRunStateStopped();
                botRunning = false;
                return;
            }

            if (available > 0) {
                const areaText = availableAreas.length
                    ? ` | areas: ${availableAreas.map(entry => `${entry.code}=${entry.count}`).join(", ")}`
                    : "";
                updateStatus(`Found ${available} available seat(s): ${formatSummary(summary)}${areaText}`);
            }

            await delay(getRefreshDelayMs());
        }
    }

    async function clickNolBuyButton() {
        const candidates = Array.from(document.querySelectorAll("button, a"))
            .filter(element => {
                const text = normalizeText([
                    element.innerText || element.textContent || "",
                    element.getAttribute("aria-label") || "",
                    element.getAttribute("title") || "",
                ].join(" "));
                return /立即购买|Buy|Book|예매/i.test(text);
            });
        const target = candidates.find(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return !element.disabled
                && rect.width > 0
                && rect.height > 0
                && style.display !== "none"
                && style.visibility !== "hidden";
        });
        if (target) {
            if (await clickVisibleElement(target)) {
                updateStatus("Clicked NOL buy button.");
                return true;
            }
            updateStatus("NOL buy button click failed; waiting before retry.");
            return false;
        }

        updateStatus("Buy button not found. Open the product page and click manually.");
        return false;
    }

    async function waitAndClickNolBuyButton(timeoutMs = 30000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            if (!botRunning) {
                return false;
            }

            if (await clickNolBuyButton()) {
                return true;
            }

            await delay(1000);
        }

        updateStatus("Buy button was not found after waiting.");
        return false;
    }

    function isNolProductPage() {
        return /world\.nol\.com/i.test(location.hostname)
            && /\/ticket\/(?:places\/\d+|genre\/[^/]+)\/products\/\d+/i.test(location.pathname);
    }

    function isInterparkBookPage() {
        return /gpoticket\.globalinterpark\.com/i.test(location.hostname) && /\/Global\/Play\/Book\/BookMain\.asp/i.test(location.pathname);
    }

    function isInterparkWaitingPage() {
        return /tickets\.interpark\.com/i.test(location.hostname) && /\/waiting/i.test(location.pathname);
    }

    function getQueueWaitingStatus(heartbeatCount) {
        const bodyText = normalizeText(document.body && document.body.innerText || "");
        const rankMatch = bodyText.match(/(?:我的)?等候順位\s*([\d,]+)/i);
        const waitingMatch = bodyText.match(/現在等候人數\s*([\d,.]+)/i);
        const progressMatch = bodyText.match(/訂購率\s*([\d.]+%)/i);
        const parts = [];
        const heartbeatText = `alive #${heartbeatCount} ${new Date().toLocaleTimeString()}`;

        if (rankMatch) {
            parts.push(`rank ${rankMatch[1]}`);
        }

        if (waitingMatch) {
            parts.push(`waiting ${waitingMatch[1]}`);
        }

        if (progressMatch) {
            parts.push(`progress ${progressMatch[1]}`);
        }

        return parts.length
            ? `Queue page detected; silently waiting (${parts.join(", ")}; ${heartbeatText}).`
            : `Queue page detected; silently waiting for automatic redirect (${heartbeatText}).`;
    }

    async function runQueueWaitLoop() {
        setBotState(BOT_STATE.QUEUE_WAITING);
        queueHeartbeatCount = 0;
        while (botRunning && isInterparkWaitingPage()) {
            if (!await syncRunStateConfig()) {
                return;
            }

            queueHeartbeatCount += 1;
            updateStatus(getQueueWaitingStatus(queueHeartbeatCount));
            await delay(10000);
        }
    }

    async function startBot(botConfig) {
        activeConfig = botConfig || activeConfig || {};
        if (botRunning) {
            return;
        }

        botRunning = true;
        setBotState(BOT_STATE.STARTING);
        updateStatus("Started.");

        if (isNolProductPage()) {
            setBotState(BOT_STATE.PRODUCT_PAGE);
            if (isMatchingBooking(activeConfig)) {
                await waitAndClickNolBuyButton();
            }
            return;
        }

        if (isInterparkWaitingPage()) {
            clearTimeout(refreshTimer);
            runQueueWaitLoop();
            return;
        }

        if (!isInterparkBookPage()) {
            updateStatus("Open the NOL product or Interpark booking page to run.");
            return;
        }

        setBotState(BOT_STATE.BOOKING_PAGE);
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(runRefreshLoop, 500);
    }

    async function markRunStateStopped() {
        await store_value(getRunStateKey(), {
            running: false,
            platform: PLATFORM,
            concertId: getCurrentProductId(),
        });
    }

    async function stopBot() {
        botRunning = false;
        clearTimeout(refreshTimer);
        await markRunStateStopped();
        setBotState(BOT_STATE.STOPPED);
        updateStatus("Stopped.");
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === actions.startBot && (!request.platform || request.platform === PLATFORM)) {
            startBot(request.config);
            sendResponse({ status: "started" });
            return true;
        }

        if (request.action === actions.stopBot && (!request.platform || request.platform === PLATFORM)) {
            stopBot();
            sendResponse({ status: "stopped" });
            return true;
        }
    });

    async function startFromRunState() {
        const runState = await get_stored_value(getRunStateKey());
        if (!runState || !runState.running || runState.platform !== PLATFORM) {
            return;
        }

        activeConfig = runState.config || {};
        if (!isMatchingBooking(activeConfig)) {
            return;
        }

        await startBot(activeConfig);
    }

    startFromRunState();
})();
