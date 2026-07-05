let cookie = "";

function getCookie(){
    let frame = theTopWindow();
    cookie = frame.cookie;
}

function searchConcertUrl(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Use querySelector to locate the target <a> tag directly
    const linkElement = doc.querySelector(".btn-item a");

    // Make sure the element exists and has an href attribute
    if (linkElement && linkElement.hasAttribute('href')) {
        const href = linkElement.getAttribute('href');
        // Check that href is a valid link, not "javascript:..."
        if (href && !href.toLowerCase().startsWith('javascript:')) {
            return href;
        }
    }

    // If no matching link is found, return null
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
        // Note: Cookie is hardcoded and may expire or become invalid. In a real application, you may need to fetch it dynamically.
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
        console.log("[Thaiticket] Retrieved ticket link:", url);
        if (url) {
            return url;
        } else {
            return null;
        }
    } catch (error) {
        console.error('fetch operation encountered an issue:', error);
    }
}

async function searchConcert(ticketUrl, ticketTime){
    const ticketTimeObj = new Date(ticketTime);
    if (isNaN(ticketTimeObj.getTime())) {
        console.error("[Thaiticket] Invalid ticketTime format:", ticketTime);
        return null;
    }

    let pollingTimeout = null;
    // If the ticket time is earlier than the current time, set the timeout to current time + 10 seconds
    if (ticketTimeObj < new Date()) {
        pollingTimeout = new Date(new Date().getTime() + 10000);
    } else {
        // Polling will time out 10 seconds after the ticket time
        pollingTimeout = new Date(ticketTimeObj.getTime() + 10000);
    }

    const pollForUrl = async () => {
        console.log("[Thaiticket] Starting to poll for the ticket link...");
        while (new Date() < pollingTimeout) {
            const url = await getConcertPage(ticketUrl);
            if (url) {
                console.log("[Thaiticket] Successfully retrieved the ticket link:", url);
                return url;
            }
            // Wait a short while before retrying
            await sleep(1500+Math.random()*500);
        }
        console.log("[Thaiticket] Polling timed out, failed to retrieve the ticket link.");
        return null;
    };

    const currentTime = new Date();

    if (currentTime >= ticketTimeObj) {
        console.log("[Thaiticket] Current time has passed the ticket time, starting to fetch the link immediately.");
        return await pollForUrl();
    } else {
        const pollingStartTime = new Date(ticketTimeObj.getTime() - 2000); // 2 seconds early
        console.log("[Thaiticket] Current time:", currentTime);
        console.log("[Thaiticket] Polling start time:", pollingStartTime);
        if(pollingStartTime > currentTime){
            let waitTime = pollingStartTime.getTime() - currentTime.getTime();
            console.log(`[Thaiticket] ${waitTime / 1000} seconds until polling starts, waiting...`);
            await sleep(waitTime);
        }
        console.log("[Thaiticket] Polling start time reached, beginning to fetch the link.");
        return await pollForUrl();
    }
}

