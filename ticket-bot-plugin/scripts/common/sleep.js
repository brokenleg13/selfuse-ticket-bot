async function sleep(t) {
    // Use more precise delay control
    const startTime = Date.now();
    return await new Promise(resolve => {
        setTimeout(() => {
            const actualTime = Date.now() - startTime;
            if (Math.abs(actualTime - t) > 10) {
                // console.log(`[DEBUG] Delay deviation: expected ${t}ms, actual ${actualTime}ms`);
            }
            resolve();
        }, t);
    });
}