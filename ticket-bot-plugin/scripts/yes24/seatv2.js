/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = [306, 307, 308, 316, 317, 318,302,312,302,312]; // 自定义选区
let SEAT_MAX_CLICK_COUNT = 30; // 单个座位最大点击次数
let WEBHOOK_URL = ''; // 飞书webhook url
let USERID = ''; // 用户id 抓包自己看
let MAX_SEAT_ID = 200; // 每个区刷到ID最大值，超过的票不锁  不需要筛ID请填9999
let REFRESH_INTERVAL = 600; // 刷新时间间隔 根据网络调整


/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let currentSeatLayer = null;
let blackList = [];
let concertcfg = {};// 存储当前页面的concertcfg
concertcfg.idCustomer = USERID // idCustomer
let successBlock = "";
let successId = "";

// region 队列
let seatQueue = [];// 可选座位队列
let secondSeatQueue = [];// 被锁过的座位队列 碰运气
function addSeatToQueue(seat) {
    seatQueue.push(seat);
}

function getSeatFromQueue() {
    return seatQueue[0];
}

function popSeatFromQueue() {
    return seatQueue.shift()
}
// endregion


//region 页面操作
function getConcertId() {
    let url = window.location.href;
    let concertId = url.split("=")[1];
    return concertId;
}

async function selectDate(data) {
    let date = data.date;
    let time = data.time;
    if (date) {
        document.getElementById(date).click();
        await sleep(500);
        if (time) {
            console.log("time", time);
            console.log(document.getElementsByTagName("li"));
            let lis = document.getElementsByTagName("li");
            for (let i = 0; i < lis.length; i++) {
                if (lis[i].innerText.includes(time)) {
                    lis[i].click();
                }
            }
        }
    }
    document.getElementById("btnSeatSelect").click();
}

function TampermonkeyClick() {
    localStorage.setItem("CLICK_NOW", "YES");
}


function theFrame() {
    return window.frames[0].document;
}

function theTopWindow() {
    return window.document;
}

// 获取cookie
function getCookie() {
    let frame = theTopWindow();
    return frame.cookie;
}

// 获取iframe中的idHall, idTime, idCustomer
function getUserInfo() {
    console.log('[DEBUG] 开始获取用户信息...');

    const iframe = document.querySelector('iframe');
    if (!iframe) {
        console.error('[DEBUG] 未找到iframe元素');
        return;
    }

    console.log('[DEBUG] 找到iframe:', iframe.src);

    let src = iframe.src;
    //https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=1366809&idHall=13219&block=0&stMax=10&pHCardAppOpt=0
    try {
        let idHall = src.split("idHall=")[1].split("&")[0];
        let idTime = src.split("idTime=")[1].split("&")[0];

        console.log('[DEBUG] 解析的参数:', { idHall, idTime });

        concertcfg.idHall = idHall;
        concertcfg.idTime = idTime;

        console.log('[DEBUG] 设置后的concertcfg:', concertcfg);
    } catch (error) {
        console.error('[DEBUG] 解析iframe URL失败:', error);
        console.error('[DEBUG] iframe src:', src);
    }
}

function clickStepCtrlBtn03() {
    let frame = theTopWindow();
    frame.getElementById("StepCtrlBtn03").children[1].click();
}
function clickStepCtrlBtn04() {
    let frame = theTopWindow();
    frame.getElementById("StepCtrlBtn04").children[1].click();
}

// 拉起信用卡支付
function openPayment() {
    let frame = theTopWindow();
    frame.getElementById("rdoPays2").click();
    frame.getElementById("cbxUserInfoAgree").click();
    frame.getElementById("cbxCancelFeeAgree").click();
    frame.getElementById("StepCtrlBtn05").children[1].click();
}

// 断言锁定成功
function assertLockSuccess() {
    let frame = theTopWindow();
    const el = frame.querySelector('#StepCtrlBtn03');
    if (el && el.style.display === 'block') {
        console.log('✅ class 正确：m03 on');
        isSuccess = true;
    } else {
        console.log('❌ class 不匹配');
    }
}

//选内场/看台 
function selectRange(idx) {
    if (isSuccess) {
        return;
    }
    let frame = theFrame();
    if (idx == 1) {
        // 看台页面
        if (frame.getElementById("grade_지정석")) {
            frame.getElementById("grade_지정석").click()
            currentSeatLayer = 1;
        }
    } else {
        // 内场页面
        if (frame.getElementById("grade_스탠딩")) {
            frame.getElementById("grade_스탠딩").click()
            currentSeatLayer = 2;
        }
    }
}

async function enterPage(block) {
    if (isSuccess) {
        return;
    }
    let frame = theFrame();
    let seatLayer = frame.getElementsByClassName("seat_layer");

    // 检查seatLayer是否存在且不为空
    if (!seatLayer || seatLayer.length === 0) {
        // 如果block为1开头为内场 打开内场page
        if (block.toString().startsWith("1")) {
            selectRange(2);
            await sleep(300);
        }
        else {
            selectRange(1);
            await sleep(300);
        }
    }

    // 遍历找到block
    frame = theFrame();
    let seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(300);
            return;
        }
    }
    // 如果遍历完没有找到block，说明在另一个page
    if (block.toString().startsWith("1")) {
        selectRange(2);
        await sleep(300);
    }
    else {
        selectRange(1);
        await sleep(300);
    }
    frame = theFrame();
    seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(300);
            return;
        }
    }
}

// 接口锁定后 选择座位 去支付
async function chooseSeatAndGotoPayment(block,seatId) {
    await enterPage(block);
    await sleep(400);
    let frame = theFrame();
    let seat = frame.getElementById("t" + seatId.toString());
    if (seat && !seat.className.includes("s13")) {
        // 如果seat的class不包含son，则点击 son说明已选中
        if (!seat.className.includes("son")) {
            seat.click();
        }
        await sleep(300);
        TampermonkeyClick();
        await sleep(1500);
        assertLockSuccess();
        if (isSuccess) {
            return true;
        }
    }
}
// endregion

//region 接口操作

async function sendSearchSeatRequest(block) {
    console.log(`[DEBUG] 开始发送请求，区块: ${block}`);

    // 检查必要参数
    if (!concertcfg.idHall || !concertcfg.idTime || !concertcfg.idCustomer) {
        console.error('[DEBUG] 缺少必要参数:', {
            idHall: concertcfg.idHall,
            idTime: concertcfg.idTime,
            idCustomer: concertcfg.idCustomer
        });
        return;
    }

    const url = 'https://ticket.yes24.com/OSIF/Book.asmx/GetBookWholeFN';
    let cookie = getCookie();

    console.log(`[DEBUG] Cookie长度: ${cookie ? cookie.length : 0}`);
    console.log(`[DEBUG] URL: ${url}`);

    const body = new URLSearchParams({
        idHall: concertcfg.idHall,
        idTime: concertcfg.idTime,
        block: block,
        channel: '1',
        idCustomer: concertcfg.idCustomer,
        idOrg: '1'
    });

    console.log(`[DEBUG] 请求体:`, body.toString());

    const headers = {
        'Host': 'ticket.yes24.com',
        'Connection': 'keep-alive',
        'Content-Length': '85',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': navigator.userAgent,
        'Accept': 'application/xml, text/xml, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://ticket.yes24.com',
        'Referer': `https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=${concertcfg.idTime}&idHall=${concertcfg.idHall}&block=${block}&stMax=10&pHCardAppOpt=0`,
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': cookie
    };

    console.log(`[DEBUG] 准备发送fetch请求...`);

    // 发送请求
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include',
    })
        .then(response => response.text())
        .then(data => {
            console.log(`[DEBUG] 响应数据长度:`, data.length);
            parseResponse(data);
            console.log(`[YES24 info] Block ${block} 请求成功`);
        })
        .catch(err => {
            console.error(`[YES24 Error] Block ${block} 请求失败:`, err.message);
            console.error(`[DEBUG] 错误详情:`, err);
            // 如果是超时或网络错误，可以考虑重试
            if (err.message.includes('超时') || err.message.includes('Failed to fetch')) {
                console.log(`[YES24 info] Block ${block} 将在下次循环中重试`);
            }
        });
}

async function sendSeatLockRequest(block,seatId,sendmsg=false) {
    if (isSuccess) {
        return;
    }
    
    console.log(`[DEBUG] 开始发送Lock请求，区块: ${block} 座位ID: ${seatId}`);

    const url = 'https://ticket.yes24.com/OSIF/Book.asmx/Lock';
    let cookie = getCookie();

    console.log(`[DEBUG] Cookie长度: ${cookie ? cookie.length : 0}`);
    console.log(`[DEBUG] URL: ${url}`);

    const body = new URLSearchParams({
        name: concertcfg.idCustomer,
        idTime: concertcfg.idTime,
        token:seatId,
        block: block,
        channel: '1024',
        organizationID: '1'
    });

    console.log(`[DEBUG] 请求体:`, body.toString());

    const headers = {
        'Host': 'ticket.yes24.com',
        'Connection': 'keep-alive',
        'Content-Length': '85',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': navigator.userAgent,
        'Accept': 'application/xml, text/xml, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://ticket.yes24.com',
        'Referer': `https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=${concertcfg.idTime}&idHall=${concertcfg.idHall}&block=${block}&stMax=10&pHCardAppOpt=0`,
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': cookie
    };

    console.log(`[DEBUG] 准备发送fetch请求...`);

    // 发送请求
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include',
    })
        .then(response => response.text())
        .then(data => {
            console.log(`[DEBUG] Lock响应数据:`, data);
            
            // 解析XML响应
            const codeMatch = data.match(/<Code>(.*?)<\/Code>/);
            const messageMatch = data.match(/<Message>(.*?)<\/Message>/);
            
            if (codeMatch) {
                const code = codeMatch[1];
                const message = messageMatch ? messageMatch[1] : '';
                
                console.log(`[DEBUG] 响应Code: ${code}, Message: ${message}`);
                
                if (code === 'None') {
                    isSuccess = true; // 设置成功标志
                    successBlock = block;
                    successId = seatId;
                    console.log(`[YES24 Success] 座位锁定成功: ${seatId}`);
                    sendFeiShuMsg(WEBHOOK_URL, `座位接口锁定成功: block:${block} seat:${seatId}`);
                } else if (code === 'block') {
                    console.error(`[YES24 Error] 被block 需要验证码`);
                    sendFeiShuMsg(WEBHOOK_URL, `被block: block:${block} seat:${seatId}`);
                } else {
                    console.error(`[YES24 Error] 锁定失败: Code=${code}, Message=${message}`);
                    if (sendmsg) {
                        sendFeiShuMsg(WEBHOOK_URL, `锁定失败: block:${block} seat:${seatId} Code=${code} Message=${message}`);
                    }
                }
            } else {
                console.error(`[YES24 Error] 无法解析响应:`, data);
            }
        })
        .catch(err => {
            console.error(`[YES24 Error] Lock请求失败:`, err.message);
            sendFeiShuMsg(WEBHOOK_URL, `Lock请求失败: block:${block} seat:${seatId} Error=${err.message}`);
        })
}

function parseLayoutData(xmlString) {
    // 解析Layout数据，提取座位信息
    console.log(`[DEBUG] 开始解析Layout数据...`);
    
    // 获取Layout内容
    const layoutMatch = xmlString.match(/<Layout>(.*?)<\/Layout>/s);
    const layoutData = layoutMatch ? layoutMatch[1] : "";
    
    let layoutSortById = {}; // 存储座位ID和递增序号的对应关系
    
    if (layoutData) {
        
        // 使用正则表达式匹配所有DIV元素
        const divRegex = /&lt;DIV[^&]*?&gt;&lt;\/DIV&gt;/g;
        const divMatches = layoutData.match(divRegex);
        
        if (divMatches) {
            let sortIndex = 1; // 递增序号从1开始
            
            divMatches.forEach(divHtml => {
                // 解析每个DIV的属性
                const idMatch = divHtml.match(/id=([^&\s]+)/);
                const styleMatch = divHtml.match(/style="([^"]+)"/);
                const valueMatch = divHtml.match(/value="([^"]+)"/);
                
                if (idMatch && valueMatch) {
                    const seatId = valueMatch[1];
                    const seatElement = {
                        id: idMatch[1],
                        seatId: seatId,
                        sortIndex: sortIndex
                    };
                    
                    // 解析style中的位置信息
                    if (styleMatch) {
                        const style = styleMatch[1];
                        const leftMatch = style.match(/LEFT:\s*(\d+)px/);
                        const topMatch = style.match(/TOP:\s*(\d+)px/);
                        
                        if (leftMatch) seatElement.left = parseInt(leftMatch[1]);
                        if (topMatch) seatElement.top = parseInt(topMatch[1]);
                    }
                    
                    // 存储到layoutSortById对象中，key为座位ID，value为递增序号
                    layoutSortById[seatId] = sortIndex;
                    
                    sortIndex++; // 递增序号
                }
            });
            
            // console.log(`[DEBUG] layoutSortById对象:`, layoutSortById);
        }
    }
}

function parseResponse(xmlString) {
    // 使用正则表达式解析XML，避免使用DOMParser
    let layoutSortById = {};
    // 先尝试解析Layout数据
    if (xmlString.includes('<Layout>')) {
        layoutSortById = parseLayoutData(xmlString);
    }

    // 获取 Block 值
    const blockMatch = xmlString.match(/<Block>(.*?)<\/Block>/);
    const block = blockMatch ? blockMatch[1] : null;


    // 获取 BlockSeat 内容
    const blockSeatMatch = xmlString.match(/<BlockSeat>(.*?)<\/BlockSeat>/);
    const blockSeatData = blockSeatMatch ? blockSeatMatch[1] : "";

    if (blockSeatData) {
        // 使用 ^ 分割每个座位数据
        const seats = blockSeatData.split('^');

        seats.forEach(seatData => {
            if (seatData.trim()) {
                // 使用 @ 分割座位信息，第一个是座位ID
                const seatInfo = seatData.split('@');
                if (seatInfo.length > 0) {
                    const seatId = seatInfo[0];
                    let chooseable = seatInfo[2];
                    let seat = {};
                    seat.id = seatId;
                    seat.block = block;
                    
                    let seatElement = layoutSortById[seatId];
                    // 检查是否站票超过ID最大值
                    if (seatElement && seatElement.sortIndex > MAX_SEAT_ID && block.toString().startsWith("1")) {
                        sendFeiShuMsg(WEBHOOK_URL, `站票超过ID最大值，不锁票 block:${block} seat:${seatId} index:${seatElement.sortIndex}`)
                        return;
                    }
                    
                    if (!isSuccess) {
                        if (chooseable == "0") {
                            console.log(`[YES24 info] chooseable==0 发现空座，直接接口锁定: block:${block} seat:${seatId}`);
                            addSeatToQueue(seat);
                            sendFeiShuMsg(WEBHOOK_URL,`刷到空座，直接接口锁定 block:${block} seat:${seatId} seatInfo:${seatInfo}`)
                        }else{
                            console.log(`[YES24 info] chooseable!=0 发现可能可用座位，加入列表尝试: block:${block} seat:${seatId}`);
                            secondSeatQueue.push(seat);
                        }
                    }
                }
            }
        });
    }
}
// endregion


//region 主流程
// producer：搜索可用座位添加到列表
async function searchSeat() {
    getUserInfo();
    await sleep(1000);
    let i = 0;
    let requestCount = 0;
    await sleep(1000);
    while (!isSuccess) {
        if (seatQueue.length > 0) {
            await sleep(10);
            continue;
        }
        if (isSuccess) {
            break;
        }
        // 一直循环遍历blockSelect
        sendSearchSeatRequest(blockSelect[i]);
        i = (i + 1) % blockSelect.length;
        requestCount++;
        await sleep(50);
        if (requestCount % 8 === 0) {
            requestCount = 0;
            await sleep(REFRESH_INTERVAL);
        }
    }
}

async function trySecondSeat(){
    if (seatQueue.length == 0 && secondSeatQueue.length > 0 && !isSuccess) {
        let seat = secondSeatQueue.shift();
        if (seat) {
            sendSeatLockRequest(seat.block,seat.id,false)
            await sleep(2000);
        }
    }
}

// consumer：从列表中获取座位并尝试锁定
async function lockSeat() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(3000);
    selectDate(data);
    await sleep(2000);
    searchSeat(); // 启动爬虫
    selectRange(1);
    while (!isSuccess) {
        if (seatQueue.length > 0) {
            let seat = getSeatFromQueue();
            if (seat) {
                await sendSeatLockRequest(seat.block,seat.id,true)
            }
            popSeatFromQueue();
            await sleep(300)
        }else{
            await sleep(10);
        }
    }
    // 接口锁成功的处理一下选座
    sendFeiShuMsg(WEBHOOK_URL, `抢票成功`);
    await chooseSeatAndGotoPayment(successBlock,successId);
    await sleep(1000);
    clickStepCtrlBtn03();
    await sleep(2000);
    clickStepCtrlBtn04();
    await sleep(1000);
    // openPayment();
}

lockSeat();

// endregion


// region 测试
function testAddSeatToQueue(block,seatId){
    let seat = {};
    seat.id = seatId;
    seat.block = block;
    addSeatToQueue(seat);   
}

// endregion   