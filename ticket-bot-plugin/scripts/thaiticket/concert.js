let cookie = "";

function getCookie(){
    let frame = theTopWindow();
    cookie = frame.cookie;
}

function searchConcertUrl(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 使用 querySelector 直接定位到目标 <a> 标签
    const linkElement = doc.querySelector(".btn-item a");
    
    // 确保元素存在并且有 href 属性
    if (linkElement && linkElement.hasAttribute('href')) {
        const href = linkElement.getAttribute('href');
        // 检查 href 是否为有效的链接，而不是 "javascript:..."
        if (href && !href.toLowerCase().startsWith('javascript:')) {
            return href;
        }
    }
    
    // 如果没有找到符合条件的链接，则返回 null
    return null;
}

async function getConcertPage(ticketUrl){
    const headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "sec-ch-ua": `"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"Windows"`,
        // 注意: Cookie 是硬编码的，可能会过期或失效。在实际应用中，您可能需要动态获取。
        "Cookie": cookie,
        "sec-gpc": "1"
    };

    try {
        const response = await fetch(ticketUrl, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        const htmlString = await response.text();
        let url = searchConcertUrl(htmlString);
        console.log("[Thaiticket] 获取到开票链接:", url);
        if (url) {
            return url;
        } else {
            return null;
        }
    } catch (error) {
        console.error('fetch 操作出现问题:', error);
    }
}

async function searchConcert(ticketUrl, ticketTime){
    const ticketTimeObj = new Date(ticketTime);
    if (isNaN(ticketTimeObj.getTime())) {
        console.error("[Thaiticket] 无效的 ticketTime 格式:", ticketTime);
        return null;
    }

    let pollingTimeout = null;
    //如果开票时间小于当前时间，超时时间设置为当前时间+10秒
    if (ticketTimeObj < new Date()) {
        pollingTimeout = new Date(new Date().getTime() + 10000);
    } else {
        // 轮询将在开票时间后1分钟超时
        pollingTimeout = new Date(ticketTimeObj.getTime() + 60000);
    }

    const pollForUrl = async () => {
        console.log("[Thaiticket] 开始轮询获取开票链接...");
        while (new Date() < pollingTimeout) {
            const url = await getConcertPage(ticketUrl);
            if (url) {
                console.log("[Thaiticket] 成功获取到开票链接:", url);
                return url;
            }
            // 等待一小段时间再重试
            await sleep(2000);
        }
        console.log("[Thaiticket] 轮询超时，未能获取到开票链接。");
        return null;
    };

    const currentTime = new Date();

    if (currentTime >= ticketTimeObj) {
        console.log("[Thaiticket] 当前时间已过开票时间，立即开始获取链接。");
        return await pollForUrl();
    } else {
        const pollingStartTime = new Date(ticketTimeObj.getTime() - 10000); // 提前10秒
        console.log("[Thaiticket] 当前时间:", currentTime);
        console.log("[Thaiticket] 轮询开始时间:", pollingStartTime);
        if(pollingStartTime > currentTime){
            let waitTime = pollingStartTime.getTime() - currentTime.getTime();
            console.log(`[Thaiticket] 距离轮询开始还有 ${waitTime / 1000} 秒, 等待中...`);
            await sleep(waitTime);
        }
        console.log("[Thaiticket] 轮询开始时间已到，开始获取链接。");
        return await pollForUrl();
    }
}

