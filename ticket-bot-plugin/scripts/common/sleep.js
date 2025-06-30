async function sleep(t) {
    // 确保最小延迟为50ms，避免过于频繁的请求
    const minDelay = 50;
    const actualDelay = Math.max(t, minDelay);
    
    if (t < minDelay) {
        console.log(`[DEBUG] 请求延迟 ${t}ms 小于最小延迟 ${minDelay}ms，调整为 ${actualDelay}ms`);
    }
    
    // 使用更精确的延时控制
    const startTime = Date.now();
    return await new Promise(resolve => {
        setTimeout(() => {
            const actualTime = Date.now() - startTime;
            if (Math.abs(actualTime - actualDelay) > 10) {
                console.log(`[DEBUG] 延时偏差: 预期${actualDelay}ms，实际${actualTime}ms`);
            }
            resolve();
        }, actualDelay);
    });
}