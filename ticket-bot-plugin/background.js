const RULE_ID = 1;
const REFERER_HEADER = 'Referer';
const XHR_RESOURCE_TYPES = ['xmlhttprequest'];

const ACTIONS = {
    ADD_REFERER_RULE: 'addRefererRule',
    REMOVE_REFERER_RULE: 'removeRefererRule',
    INTERPARK_MAIN_WORLD_ACTION: 'interparkMainWorldAction',
    CAPTURE_VISIBLE_TAB: 'captureVisibleTab',
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
        if (!tabId || (!request.clickId && request.mode !== 'applyLockedSeats')) {
            sendResponse({ success: false, error: 'Missing tabId or clickId.' });
            return false;
        }

        chrome.scripting.executeScript({
            target: {
                tabId,
                allFrames: true,
            },
            world: 'MAIN',
            args: [request.clickId || '', request.mode || 'click', request.seats || []],
            func: (clickId, mode, seats) => {
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
                    return {
                        success: true,
                        mode,
                        via: 'click',
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
