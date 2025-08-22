async function sleep(t) {
    // 使用更精确的延时控制
    const startTime = Date.now();
    return await new Promise(resolve => {
        setTimeout(() => {
            const actualTime = Date.now() - startTime;
            if (Math.abs(actualTime - t) > 10) {
                // console.log(`[DEBUG] 延时偏差: 预期${t}ms，实际${actualTime}ms`);
            }
            resolve();
        }, t);
    });
}