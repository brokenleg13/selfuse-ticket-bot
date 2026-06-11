(function(global) {
    global.TicketBotConfig = {
        storageKeys: {
            autoBooking: 'autoBooking',
            thaiConfig: 'thaiConfig',
            botRunState: 'ticketBotRunState',
        },
        actions: {
            startBot: 'startTicketBot',
            stopBot: 'stopTicketBot',
            startThaiTicket: 'startThaiticket',
            stopThaiTicket: 'stopThaiticket',
        },
        platformStartUrls: {
            melon: 'https://tkglobal.melon.com/performance/index.htm?langCd=EN&prodId=',
            yes24: 'http://ticket.yes24.com/Pages/English/Perf/FnPerfDeail.aspx?IdPerf=',
            interpark: '',
            thaiticket: 'https://www.thaiticketmajor.com/',
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
            captchaOcr: {
                enabled: true,
                serviceUrl: 'http://127.0.0.1:17861/ocr',
                timeoutMs: 3000,
                retryIntervalMs: 8000,
                maxAttempts: 3,
                invalidRefreshDelayMs: 600,
                submitCheckDelayMs: 1200,
                codeLength: 6,
            },
        },
    };
})(window);
