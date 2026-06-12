const RULE_ID = 1;
const REFERER_HEADER = 'Referer';
const XHR_RESOURCE_TYPES = ['xmlhttprequest'];

const ACTIONS = {
    ADD_REFERER_RULE: 'addRefererRule',
    REMOVE_REFERER_RULE: 'removeRefererRule',
    INTERPARK_MAIN_WORLD_ACTION: 'interparkMainWorldAction',
    CAPTURE_VISIBLE_TAB: 'captureVisibleTab',
    SAVE_DEBUG_IMAGE: 'saveDebugImage',
};

function sendRuleUpdateResponse(actionName, sendResponse) {
    const lastError = chrome.runtime.lastError;
    if (lastError) {
        console.error(`Error ${actionName}:`, lastError);
        sendResponse({ success: false, error: lastError.message });
        return;
    }

    console.log(`Referer rule ${actionName} successfully.`);
    sendResponse({ success: true });
}

function buildRefererRule(targetUrl, refererUrl) {
    return {
        id: RULE_ID,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [{
                header: REFERER_HEADER,
                operation: 'set',
                value: refererUrl,
            }],
        },
        condition: {
            urlFilter: targetUrl,
            resourceTypes: XHR_RESOURCE_TYPES,
        },
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === ACTIONS.SAVE_DEBUG_IMAGE) {
        const dataUrl = request.dataUrl || '';
        const filename = request.filename || `ticket-bot-plugin/debug-${Date.now()}.png`;
        if (!/^data:image\/png;base64,/i.test(dataUrl)) {
            sendResponse({ success: false, error: 'Missing png dataUrl.' });
            return false;
        }

        chrome.downloads.download({
            url: dataUrl,
            filename,
            saveAs: false,
            conflictAction: 'uniquify',
        }, downloadId => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                sendResponse({ success: false, error: lastError.message });
                return;
            }

            sendResponse({
                success: true,
                downloadId,
                filename,
            });
        });
        return true;
    }

    if (request.action === ACTIONS.CAPTURE_VISIBLE_TAB) {
        const windowId = sender.tab && sender.tab.windowId;
        if (typeof windowId !== 'number') {
            sendResponse({ success: false, error: 'Missing sender window.' });
            return false;
        }

        chrome.tabs.captureVisibleTab(windowId, {
            format: 'png',
        }, dataUrl => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                sendResponse({ success: false, error: lastError.message });
                return;
            }

            sendResponse({
                success: true,
                dataUrl,
            });
        });
        return true;
    }

    if (request.action === ACTIONS.INTERPARK_MAIN_WORLD_ACTION) {
        const tabId = sender.tab && sender.tab.id;
        const actionMode = request.mode || 'click';
        if (!tabId || (!request.clickId && !['applyLockedSeats', 'solveSliderCaptcha'].includes(actionMode))) {
            sendResponse({ success: false, error: 'Missing tabId or clickId.' });
            return false;
        }

        chrome.scripting.executeScript({
            target: {
                tabId,
                allFrames: true,
            },
            world: 'MAIN',
            args: [request.clickId || '', actionMode, request.seats || [], request.targetBlockLeft ?? null],
            func: (clickId, mode, seats, targetBlockLeft) => {
                if (mode === 'applyLockedSeats') {
                    if (typeof fnAddSeat !== 'function' || typeof fnSetSeat !== 'function') {
                        return {
                            success: false,
                            reason: 'BookSeat frame functions not found',
                        };
                    }

                    let added = 0;
                    const failures = [];
                    (seats || []).forEach(seat => {
                        try {
                            const ok = fnAddSeat(
                                seat.seatGrade || '',
                                seat.floor || '',
                                seat.rowNo || '',
                                seat.seatNo || '',
                                seat.block || '',
                            );
                            if (ok) {
                                added += 1;
                            } else {
                                failures.push(seat.seatNo || '');
                            }
                        } catch (error) {
                            failures.push(`${seat.seatNo || ''}:${error && error.message || error}`);
                        }
                    });

                    if (!added) {
                        return {
                            success: false,
                            reason: failures.length ? `fnAddSeat failed: ${failures.join(', ')}` : 'No seats added',
                        };
                    }

                    if (typeof fnSetSelectAble === 'function') {
                        fnSetSelectAble(true);
                    }
                    fnSetSeat();
                    return {
                        success: true,
                        mode,
                        via: 'fnAddSeat+fnSetSeat',
                        added,
                    };
                }

                if (mode === 'solveSliderCaptcha') {
                    return (async () => {
                        const root = document.getElementById('captchSlider');
                        if (!root) {
                            return {
                                success: false,
                                reason: 'captchSlider not found',
                            };
                        }

                        const block = root.querySelector('canvas.block, .block');
                        const slider = root.querySelector('.slider');
                        if (!block || !slider) {
                            return {
                                success: false,
                                reason: 'slider block or handle not found',
                            };
                        }

                        const target = Number(targetBlockLeft);
                        if (!Number.isFinite(target)) {
                            return {
                                success: false,
                                reason: 'invalid targetBlockLeft',
                            };
                        }

                        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
                        const readLeft = element => {
                            const view = element.ownerDocument && element.ownerDocument.defaultView || window;
                            const style = view.getComputedStyle(element);
                            return Number.parseFloat(element.style.left || style.left || '0') || 0;
                        };
                        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
                        const rand = (min, max) => min + Math.random() * (max - min);
                        const dispatchMouse = (targetElement, type, clientX, clientY) => {
                            const event = new MouseEvent(type, {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                clientX,
                                clientY,
                                screenX: window.screenX + clientX,
                                screenY: window.screenY + clientY,
                                button: 0,
                                buttons: type === 'mouseup' ? 0 : 1,
                            });
                            targetElement.dispatchEvent(event);
                        };
                        const dispatchPointer = (targetElement, type, clientX, clientY) => {
                            if (typeof PointerEvent !== 'function') {
                                return;
                            }
                            const event = new PointerEvent(type, {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                pointerId: 1,
                                pointerType: 'mouse',
                                isPrimary: true,
                                clientX,
                                clientY,
                                screenX: window.screenX + clientX,
                                screenY: window.screenY + clientY,
                                button: 0,
                                buttons: type === 'pointerup' ? 0 : 1,
                            });
                            targetElement.dispatchEvent(event);
                        };
                        const dispatchDragEvent = (targetElement, pointerType, mouseType, clientX, clientY) => {
                            dispatchPointer(targetElement, pointerType, clientX, clientY);
                            dispatchMouse(targetElement, mouseType, clientX, clientY);
                        };
                        const moveTo = async (nextX, nextY, waitMs) => {
                            clientX = nextX;
                            clientY = nextY;
                            dispatchDragEvent(moveTarget, 'pointermove', 'mousemove', clientX, clientY);
                            await sleep(waitMs);
                        };

                        const sliderRect = slider.getBoundingClientRect();
                        let clientX = sliderRect.left + sliderRect.width / 2;
                        let clientY = sliderRect.top + sliderRect.height / 2;
                        const baseClientY = clientY;
                        const moveTarget = document;
                        const initialBlockLeft = readLeft(block);
                        let finalBlockLeft = initialBlockLeft;
                        let previousBlockLeft = initialBlockLeft;
                        let stalledSteps = 0;

                        dispatchMouse(slider, 'mousemove', clientX - rand(2, 5), clientY + rand(-1, 1));
                        await sleep(rand(80, 180));
                        dispatchDragEvent(slider, 'pointerdown', 'mousedown', clientX, clientY);
                        await sleep(rand(120, 260));

                        for (let stepIndex = 0; stepIndex < 140; stepIndex += 1) {
                            finalBlockLeft = readLeft(block);
                            const diff = target - finalBlockLeft;
                            if (Math.abs(diff) <= 8) {
                                break;
                            }

                            const progress = Math.min(1, Math.max(0, (finalBlockLeft - initialBlockLeft) / Math.max(1, target - initialBlockLeft)));
                            const maxStep = progress < 0.35 ? rand(7, 13) : progress < 0.75 ? rand(4, 9) : rand(2, 5);
                            const step = clamp(diff * rand(0.55, 0.9), -maxStep, maxStep);
                            await moveTo(
                                clientX + step,
                                baseClientY + rand(-2.2, 2.2),
                                rand(18, 46),
                            );

                            const nextBlockLeft = readLeft(block);
                            if (Math.abs(nextBlockLeft - previousBlockLeft) < 0.05) {
                                stalledSteps += 1;
                            } else {
                                stalledSteps = 0;
                            }
                            previousBlockLeft = nextBlockLeft;
                            if (stalledSteps >= 18) {
                                break;
                            }
                        }

                        finalBlockLeft = readLeft(block);
                        const overshoot = target >= finalBlockLeft ? rand(3, 6) : -rand(3, 6);
                        await moveTo(clientX + overshoot, baseClientY + rand(-2, 2), rand(70, 140));
                        await moveTo(clientX - overshoot * rand(0.45, 0.75), baseClientY + rand(-1.5, 1.5), rand(70, 160));

                        for (let settleIndex = 0; settleIndex < 40; settleIndex += 1) {
                            finalBlockLeft = readLeft(block);
                            const diff = target - finalBlockLeft;
                            if (Math.abs(diff) <= 1.2) {
                                break;
                            }
                            const step = clamp(diff * rand(0.45, 0.75), -2.8, 2.8);
                            await moveTo(
                                clientX + step,
                                baseClientY + rand(-1, 1),
                                rand(24, 58),
                            );
                        }

                        await sleep(rand(180, 420));
                        finalBlockLeft = readLeft(block);
                        dispatchDragEvent(moveTarget, 'pointerup', 'mouseup', clientX, clientY);
                        await sleep(500);

                        return {
                            success: Math.abs(finalBlockLeft - target) <= 4,
                            mode,
                            initialBlockLeft: Number(initialBlockLeft.toFixed(2)),
                            finalBlockLeft: Number(finalBlockLeft.toFixed(2)),
                            targetBlockLeft: Number(target.toFixed(2)),
                        };
                    })();
                }

                const attribute = mode === 'seat'
                    ? 'data-ticket-bot-seat-id'
                    : 'data-ticket-bot-page-click-id';
                const nodes = document.querySelectorAll(`[${attribute}]`);
                let target = null;
                for (let i = 0; i < nodes.length; i += 1) {
                    if (nodes[i].getAttribute(attribute) === clickId) {
                        target = nodes[i];
                        break;
                    }
                }

                if (!target) {
                    return {
                        success: false,
                        reason: 'target not found',
                    };
                }

                if (mode === 'seat') {
                    const onclick = target.getAttribute('onclick') || '';
                    const args = [];
                    onclick.replace(/'((?:\\'|[^'])*)'/g, (_, value) => {
                        args.push(value);
                        return '';
                    });

                    if (/SelectSeat\s*\(/i.test(onclick) && typeof SelectSeat === 'function' && args.length >= 5) {
                        SelectSeat(target, args[0], args[1], args[2], args[3], args[4]);
                        return {
                            success: true,
                            mode,
                            via: 'SelectSeat',
                            title: target.title || '',
                        };
                    }
                }

                function getClickableElement(element) {
                    let current = element;
                    for (let depth = 0; current && depth < 5; depth += 1) {
                        const tagName = current.tagName;
                        if (tagName === 'A' || tagName === 'BUTTON' || current.onclick || current.getAttribute('onclick') || current.getAttribute('href')) {
                            return current;
                        }
                        current = current.parentElement;
                    }
                    return element;
                }

                const clickable = getClickableElement(target);
                if (typeof clickable.click === 'function') {
                    clickable.click();
                    const rect = clickable.getBoundingClientRect();
                    const clientX = Math.floor(rect.left + rect.width / 2);
                    const clientY = Math.floor(rect.top + rect.height / 2);
                    ['mousedown', 'mouseup', 'click'].forEach(type => {
                        clickable.dispatchEvent(new MouseEvent(type, {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX,
                            clientY,
                            screenX: window.screenX + clientX,
                            screenY: window.screenY + clientY,
                            button: 0,
                            buttons: type === 'mousedown' ? 1 : 0,
                        }));
                    });
                    return {
                        success: true,
                        mode,
                        via: 'click+mouseevent',
                        title: clickable.title || '',
                        text: (clickable.innerText || clickable.textContent || clickable.value || '').trim().slice(0, 120),
                    };
                }

                const rect = clickable.getBoundingClientRect();
                const clientX = Math.floor(rect.left + rect.width / 2);
                const clientY = Math.floor(rect.top + rect.height / 2);
                clickable.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX,
                    clientY,
                    screenX: window.screenX + clientX,
                    screenY: window.screenY + clientY,
                    button: 0,
                }));

                return {
                    success: true,
                    mode,
                    via: 'mouseevent',
                    title: clickable.title || '',
                    text: (clickable.innerText || clickable.textContent || clickable.value || '').trim().slice(0, 120),
                };
            },
        }, results => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                sendResponse({ success: false, error: lastError.message });
                return;
            }

            const hit = (results || []).find(result => result.result && result.result.success);
            if (hit) {
                sendResponse(hit.result);
                return;
            }

            sendResponse({
                success: false,
                error: 'Target was not found in any frame.',
                results: (results || []).map(result => result.result).filter(Boolean),
            });
        });
        return true;
    }

    if (request.action === ACTIONS.ADD_REFERER_RULE) {
        const { targetUrl, refererUrl } = request.data;
        const newRule = buildRefererRule(targetUrl, refererUrl);

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [RULE_ID],
            addRules: [newRule],
        }, () => {
            sendRuleUpdateResponse('added', sendResponse);
        });
        return true; // Indicates that the response is sent asynchronously
    }

    if (request.action === ACTIONS.REMOVE_REFERER_RULE) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [RULE_ID],
        }, () => {
            sendRuleUpdateResponse('removed', sendResponse);
        });
        return true; // Indicates that the response is sent asynchronously
    }
});
