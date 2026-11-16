/*
 * 插件唯一的非敏感配置来源（popup 和 content script 都会加载）。
 *
 * 规则（以 Interpark 为准对齐）：
 *   1. 每个平台的默认值写在 TicketBotConfig.<platform> 里。
 *   2. 卡片里填了同名字段就覆盖默认值；留空则用默认值。读取统一走
 *      TicketBotRuntime 的 ctx.num()/ctx.value() 或 TicketBotConfig.getValue()。
 *   3. 卡片表单的高级字段由 platforms.<platform>.fields 生成，新增参数只需：
 *      在默认值里加 key + 在 fields 里加一行，脚本里用 ctx.num("key") 读取。
 *   4. 站点地址、接口地址放在 platforms.<platform>.urls，脚本不要硬编码。
 *   5. 敏感信息（飞书 Webhook、YES24 idCustomer、联系人）只存在卡片里。
 */
(function(global) {
    const config = {
        storageKeys: {
            autoBooking: 'autoBooking',
            botRunState: 'ticketBotRunState',
        },
        actions: {
            startBot: 'startTicketBot',
            stopBot: 'stopTicketBot',
            pauseBot: 'pauseTicketBot',
            resumeBot: 'resumeTicketBot',
            notifyFeishu: 'notifyFeishu',
        },

        // 通用运行框架 scripts/common/runtime.js 的默认值，卡片可覆盖同名字段。
        runtime: {
            // 同一状态超过该时长没有任何进展（状态切换/状态文字更新）就推送“卡住”提醒；0 关闭。
            stallTimeoutMs: 180000,
            // 页面提示文字（如 Melon 的 try again）检查间隔。
            pageAlertCheckMs: 3000,
            // 同一条页面提示重复推送的最小间隔。
            pageAlertRepeatMs: 60000,
            // 默认推送的飞书事件，卡片 notifyEvents 可覆盖（逗号分隔）。
            // start 开始 / detail 过程细节 / human 需要人工操作 / stalled 卡住 / alert 页面异常提示 /
            // error 脚本异常 / pause 暂停接管 / success 成功 / stop 自动停止
            // 默认只推送关键事件；需要过程细节时在卡片里加上 detail / start。
            notifyEvents: 'human,stalled,alert,error,pause,success,stop',
            // 运行记录（scripts/common/journal.js）最多保留多少条，插件首页可导出给 Agent 分析。
            journalSize: 500,
            // 是否在购票页右下角显示状态小框（含 接管/继续/停止 按钮）。
            statusPanel: true,
            // 提示音（scripts/common/sound.js）。需要人接管的位置都会响：暂停/接管、等待人工输入验证码、
            // 脚本自动停止、卡住、页面异常提示、出错、成功。卡片可覆盖 soundEvents / soundVolume。
            soundEnabled: true,
            soundEvents: 'human,pause,stop,stalled,alert,error,success',
            soundVolume: 0.6,
        },

        // 可扩展的公共服务。页面是否使用、怎么用由各平台脚本自己决定。
        services: {
            // 验证码识别服务，客户端见 scripts/common/captcha-client.js，
            // API 约定见 docs/captcha-service.md。换成其他 OCR 只需改 baseUrl/endpoints/headers，
            // 或在脚本里 TicketBotCaptcha.registerProvider() 后把 provider 改成对应名字。
            captcha: {
                provider: 'http',
                baseUrl: 'http://127.0.0.1:17861',
                endpoints: {
                    health: '/health',
                    ocr: '/ocr',
                    slider: '/slider',
                    sliderOffset: '/slider/offset',
                },
                headers: {},
                timeoutMs: 3000,
            },
        },

        interpark: {
            defaultPlaceId: '',
            useSeatDetailApiFlow: true,
            refreshIntervalMs: 2000,
            refreshJitterMs: 600,
            areaScanIntervalMs: 800,
            maxAreaClicksPerRefresh: 12,
            maxSeatRow: 0,
            bookingSessionTimeoutMinutes: 9.5,
            delivery: '24000',
            // Interpark 自己的验证码接入参数；识别服务地址在 services.captcha。
            captchaOcr: {
                enabled: true,
                timeoutMs: 3000,
                retryIntervalMs: 8000,
                maxAttempts: 3,
                sliderConfidence: 0.7,
                invalidRefreshDelayMs: 600,
                submitCheckDelayMs: 1200,
                codeLength: 6,
            },
        },
        melon: {
            elementWaitTimeoutMs: 3000,
            concertOpenRetryMs: 200,
            concertActionDelayMs: 500,
            reservationClickDelayMs: 5000,
            initialSeatDelayMs: 5000,
            sectionOpenDelayMs: 1000,
            seatRenderDelayMs: 750,
            areaRetryIntervalMs: 750,
            areaRetryJitterMs: 500,
            captchaPollIntervalMs: 1000,
            seatRetryDelayMs: 1000,
            // 座位图里表示“不可选”的填充色。
            unavailableSeatFills: '#DDDDDD,none',
        },
        yes24: {
            singleRequestIntervalMs: 100,
            requestJitterMinMs: 50,
            requestJitterMs: 300,
            longRestMinMs: 1000,
            longRestJitterMs: 2000,
            antiBanMinMs: 2000,
            antiBanJitterMs: 4000,
            banDurationMinutes: 5,
            maxFailures: 3,
            maxSeatQueueSize: 3,
        },

        // 平台元信息：名称、图标、表单、URL、页面异常提示、卡片高级字段。
        platforms: {
            melon: {
                label: 'Melon',
                logo: 'assets/melonticket_logo.png',
                form: 'melonticketForm/melonticket.html',
                idParam: 'prodId',
                concertIdPlaceholder: 'Prod ID 或完整 Melon 链接',
                sectionPlaceholder: '可填多个区域，逗号分隔，如 A,B',
                urls: {
                    start: 'https://tkglobal.melon.com/performance/index.htm?langCd=EN&prodId={id}',
                },
                // 卡点规则：遇到新卡点就在这里加一条，并在 docs/incidents/melon.md 记一笔（格式见 docs/incidents.md）。
                rules: [
                    { id: 'melon-try-again', on: 'any', match: 'try again|잠시 후 다시', action: 'human',
                        message: 'Melon 提示稍后再试（可能被限流），脚本可能已停止刷新，请检查页面', ref: 'issue #28' },
                    { id: 'melon-error-occurred', on: 'page-text', match: 'error occurred', action: 'alert',
                        message: 'Melon 页面报错' },
                ],
                fields: [
                    { section: 'Melon 页面等待设置' },
                    { key: 'elementWaitTimeoutMs', label: '元素等待超时（毫秒）', step: 100 },
                    { key: 'concertOpenRetryMs', label: '开售检查间隔（毫秒）', step: 50 },
                    { key: 'concertActionDelayMs', label: '日期/时间点击间隔（毫秒）', step: 100 },
                    { key: 'reservationClickDelayMs', label: '预约按钮点击前等待（毫秒）', step: 500 },
                    { section: 'Melon 选座轮询设置' },
                    { key: 'initialSeatDelayMs', label: '进入选座页等待（毫秒）', step: 500 },
                    { key: 'sectionOpenDelayMs', label: '展开区域后等待（毫秒）', step: 100 },
                    { key: 'seatRenderDelayMs', label: '座位渲染等待（毫秒）', step: 50 },
                    { key: 'areaRetryIntervalMs', label: '区域间隔（毫秒）', step: 50 },
                    { key: 'areaRetryJitterMs', label: '区域随机抖动（毫秒）', step: 50 },
                    { key: 'captchaPollIntervalMs', label: '验证码检查间隔（毫秒）', step: 100 },
                    { key: 'seatRetryDelayMs', label: '选座失败重试等待（毫秒）', step: 100 },
                ],
            },
            yes24: {
                label: 'YES24',
                logo: 'assets/yes24_logo.png',
                form: 'yes24Form/yes24.html',
                concertIdPlaceholder: 'YES24 IdPerf',
                sectionPlaceholder: '区域 block，逗号分隔',
                urls: {
                    start: 'http://ticket.yes24.com/Pages/English/Perf/FnPerfDeail.aspx?IdPerf={id}',
                    seatPage: 'https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime={idTime}&idHall={idHall}&block={block}&stMax=10&pHCardAppOpt=0',
                    bookWhole: 'https://ticket.yes24.com/OSIF/Book.asmx/GetBookWholeFN',
                    lock: 'https://ticket.yes24.com/OSIF/Book.asmx/Lock',
                    origin: 'https://ticket.yes24.com',
                },
                // 页面元素选择器（网站改版时只改这里）
                selectors: {
                    // 选座页 iframe（window.frames[0]）里的“预订”按钮，需要在页面环境里点击
                    bookingButton: 'img.booking[src*="btn_booking2.gif"]',
                },
                // 卡点规则，见 docs/incidents/yes24.md
                rules: [
                    { id: 'yes24-block-deny', on: 'api', match: '^Block=deny$', action: 'ignore',
                        message: '已被封禁，脚本会自动停止并推送原因' },
                    { id: 'yes24-block-throttle', on: 'api', match: '^Block=-1$', action: 'ignore',
                        message: '请求过快，脚本会自动休息' },
                ],
                fields: [
                    { key: 'customer-id', label: 'YES24 用户 ID', type: 'text', placeholder: 'YES24 idCustomer（必填）', before: 'ticket' },
                    { section: 'YES24 接口轮询设置' },
                    { key: 'singleRequestIntervalMs', label: '单区域请求间隔（毫秒）', step: 50 },
                    { key: 'requestJitterMinMs', label: '请求随机抖动最小值（毫秒）', step: 50 },
                    { key: 'requestJitterMs', label: '请求随机抖动范围（毫秒）', step: 50 },
                    { key: 'longRestMinMs', label: '长休息最小值（毫秒）', step: 100 },
                    { key: 'longRestJitterMs', label: '长休息随机范围（毫秒）', step: 100 },
                    { section: 'YES24 锁票失败处理' },
                    { key: 'banDurationMinutes', label: '失败黑名单时间（分钟）', step: 0.5 },
                    { key: 'maxFailures', label: '加入黑名单失败次数', min: 1, step: 1 },
                    { key: 'maxSeatQueueSize', label: '最大待锁队列数', min: 1, step: 1 },
                    { section: 'YES24 随机行为设置' },
                    { key: 'antiBanMinMs', label: '随机行为间隔最小值（毫秒）', step: 500 },
                    { key: 'antiBanJitterMs', label: '随机行为间隔范围（毫秒）', step: 500 },
                ],
            },
            interpark: {
                label: 'Interpark',
                logo: 'assets/interpark_logo.png',
                form: 'interparkForm/interpark.html',
                concertIdPlaceholder: 'Product ID、place/product 或完整 NOL 链接',
                sectionPlaceholder: '可填多个区域，逗号分隔，如 004,005',
                urls: {
                    productByQuery: 'https://world.nol.com/zh-CN/ticket/genre/CONCERT/products/{productId}?placeCode={placeId}',
                    productByPlace: 'https://world.nol.com/zh-CN/ticket/places/{placeId}/products/{productId}',
                },
                // 卡点规则，见 docs/incidents/interpark.md（403/401/429 已在代码里处理，这里只做记录）
                rules: [
                    { id: 'interpark-http-403', on: 'api', match: '^HTTP 403', action: 'ignore', message: '区域接口受阻，代码会做一次前台检查' },
                    { id: 'interpark-http-401', on: 'api', match: '^HTTP 401', action: 'ignore', message: '登录失效，代码会停止' },
                    { id: 'interpark-http-429', on: 'api', match: '^HTTP 429', action: 'ignore', message: '请求过快，代码按服务器要求退避' },
                ],
                fields: [
                    { section: 'Interpark 轮询设置' },
                    { key: 'refreshIntervalMs', label: '每轮间隔（毫秒）', step: 100, summary: '每轮间隔' },
                    { key: 'refreshJitterMs', label: '每轮随机抖动（毫秒）', step: 100 },
                    { key: 'areaScanIntervalMs', label: '区域间隔（毫秒）', step: 100 },
                    { key: 'maxAreaClicksPerRefresh', label: '无指定区域时每轮最多扫描区域数', min: 1, step: 1 },
                    { key: 'maxSeatRow', label: '只刷前几排座位（0 不过滤）', step: 1, summary: '前几排' },
                    { key: 'bookingSessionTimeoutMinutes', label: '订购页超时重开（分钟，0 禁用）', step: 0.5, summary: '订购页重开(分钟)' },
                    { section: '取票确认信息' },
                    { key: 'delivery', label: '取票方式值', type: 'text' },
                    { key: 'phoneNo', label: '联系电话', type: 'text', placeholder: '请输入联系电话' },
                    { key: 'mobileNo', label: '手机号', type: 'text', placeholder: '请输入手机号' },
                    { key: 'snsChannel', label: 'Messenger 类型', type: 'select', options: [['SN004', 'Wechat'], ['', '不填写']] },
                    { key: 'snsId', label: 'Messenger ID', type: 'text', placeholder: '请输入 Messenger ID' },
                    { key: 'autoNext', label: '填写确认信息后自动下一步', type: 'select', options: [['true', '是'], ['false', '否']] },
                ],
            },
        },

        // 所有平台卡片都有的通用高级字段（追加在平台字段之后）。
        commonFields: [
            { section: '通知与监控' },
            { key: 'notifyEvents', label: '飞书推送事件（逗号分隔）', type: 'text', defaultFrom: 'runtime' },
            { key: 'stallTimeoutMs', label: '卡住提醒阈值（毫秒，0 关闭）', step: 10000, defaultFrom: 'runtime' },
            { key: 'soundEvents', label: '提示音事件（逗号分隔，留空用默认，填 none 关闭）', type: 'text', defaultFrom: 'runtime' },
            { key: 'soundVolume', label: '提示音音量（0~1）', step: 0.1, defaultFrom: 'runtime' },
        ],
    };

    // 卡片值优先，其次平台默认值，其次 runtime 默认值，最后 fallback。
    config.getValue = function(platform, card, key, fallback) {
        const isEmpty = value => value === undefined || value === null || value === '';
        if (card && !isEmpty(card[key])) return card[key];
        const platformDefaults = config[platform] || {};
        if (!isEmpty(platformDefaults[key])) return platformDefaults[key];
        if (!isEmpty(config.runtime[key])) return config.runtime[key];
        return fallback;
    };

    config.getNumber = function(platform, card, key, fallback) {
        const number = Number(config.getValue(platform, card, key, fallback));
        return Number.isFinite(number) ? number : fallback;
    };

    // 所有平台字段 + 通用字段的 key，编辑卡片时这些字段留空不会覆盖旧值。
    config.getAllFieldKeys = function() {
        const keys = new Set();
        Object.values(config.platforms).forEach(platform => {
            (platform.fields || []).forEach(field => field.key && keys.add(field.key));
        });
        config.commonFields.forEach(field => field.key && keys.add(field.key));
        return keys;
    };

    config.formatUrl = function(template, values) {
        return String(template || '').replace(/\{(\w+)\}/g, (match, name) =>
            values && values[name] !== undefined ? encodeURIComponent(values[name]) : match);
    };

    global.TicketBotConfig = config;
})(typeof window !== 'undefined' ? window : globalThis);
