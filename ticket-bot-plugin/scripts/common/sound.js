/*
 * TicketBotSound —— 提示音组件（popup、content script、offscreen 页面通用）。
 *
 *   TicketBotSound.play("takeover");            // 需要人接管：急促重复的提示音
 *   TicketBotSound.play("success", { volume: 0.8, repeat: 1 });
 *
 * 声音类型：takeover（需要人工）/ alert（异常提示、卡住）/ success（成功）/ info（普通提醒）。
 * 播放路径：优先交给插件后台的 offscreen 页面播放（不受购票页“需要先点击才能出声”的限制），
 * 后台不可用时退回当前页面的 Web Audio。音频是代码合成的，不依赖音频文件。
 *
 * 平台脚本一般不直接调用，而是用 runtime 的 ctx.needHuman(原因) 或 ctx.sound(类型)，
 * 声音开关、音量、哪些事件出声都在 config.js 的 runtime 段和卡片里配置。
 */
(function(global) {
    if (global.TicketBotSound) {
        return;
    }

    // 每个音：[频率 Hz, 时长 ms, 之后的间隔 ms]
    const PATTERNS = {
        takeover: [[988, 160, 70], [988, 160, 70], [1319, 260, 380]],
        alert: [[880, 220, 90], [660, 320, 380]],
        success: [[659, 140, 40], [784, 140, 40], [1047, 360, 380]],
        info: [[880, 180, 380]],
    };
    const DEFAULT_REPEAT = { takeover: 3, alert: 2, success: 1, info: 1 };

    let audioContext = null;

    function clamp(value, min, max, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    }

    function normalize(kind, options = {}) {
        const name = PATTERNS[kind] ? kind : "info";
        return {
            kind: name,
            volume: clamp(options.volume, 0, 1, 0.6),
            repeat: Math.round(clamp(options.repeat, 1, 10, DEFAULT_REPEAT[name])),
        };
    }

    // 用 Web Audio 在当前页面播放，返回是否真的出声了。
    async function playLocal(kind, options = {}) {
        const AudioCtor = global.AudioContext || global.webkitAudioContext;
        if (!AudioCtor) return false;
        const { kind: name, volume, repeat } = normalize(kind, options);
        try {
            audioContext = audioContext || new AudioCtor();
            if (audioContext.state === "suspended") {
                await audioContext.resume().catch(() => {});
            }
            if (audioContext.state !== "running") {
                return false;
            }
            let at = audioContext.currentTime + 0.02;
            for (let round = 0; round < repeat; round++) {
                for (const [frequency, durationMs, gapMs] of PATTERNS[name]) {
                    const oscillator = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    const duration = durationMs / 1000;
                    oscillator.type = "sine";
                    oscillator.frequency.setValueAtTime(frequency, at);
                    gain.gain.setValueAtTime(0.0001, at);
                    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), at + 0.015);
                    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
                    oscillator.connect(gain).connect(audioContext.destination);
                    oscillator.start(at);
                    oscillator.stop(at + duration + 0.02);
                    at += duration + gapMs / 1000;
                }
            }
            return true;
        } catch (error) {
            console.warn("[TicketBotSound] local playback failed", error);
            return false;
        }
    }

    function playViaExtension(kind, options) {
        return new Promise(resolve => {
            try {
                if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
                    resolve(false);
                    return;
                }
                chrome.runtime.sendMessage({ action: "playSound", ...normalize(kind, options) }, response => {
                    resolve(!chrome.runtime.lastError && !!(response && response.success));
                });
            } catch (error) {
                resolve(false); // 插件被重新加载后上下文失效
            }
        });
    }

    async function play(kind, options = {}) {
        if (options.local) {
            return playLocal(kind, options);
        }
        if (await playViaExtension(kind, options)) {
            return true;
        }
        return playLocal(kind, options);
    }

    global.TicketBotSound = { play, playLocal, PATTERNS };
})(typeof window !== "undefined" ? window : globalThis);
