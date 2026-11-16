# 新手本地适配与调试指南

本文写给第一次接触本项目的人，也写给帮你干活的 AI Agent。照着做可以完成三件事：

1. 在本地把插件跑起来；
2. 出问题时让 Agent 自己连上购票页调试，并交付修好的脚本；
3. 把一个新的购票页面/流程适配进来。

> 先读一遍仓库根目录的 [`AGENTS.md`](../AGENTS.md)。里面是 Agent 必须遵守的规则（不许点付款、只改哪些文件、怎么交付）。

---

## 1. 推荐的 AI 工具

| 工具 | 推荐度 | 说明 |
|---|---|---|
| [WorkBuddy](https://www.workbuddy.ai/) | ⭐ 首选（便宜） | 按官网说明下载安装，在模型设置里接入 DeepSeek，然后把本仓库目录作为工作区打开。 |
| [DeepSeek Harness（dsh）](https://github.com/deepseek-ai/deepseek-harness) | ⭐ 备选（便宜） | DeepSeek 官方开源 Agent，带 Web 界面，能读写工作区文件。目前是开发者预览版，后续可能有不兼容更新。安装见 1.1。 |
| Codex / Claude Code | 可用（成本高） | 能力强，预算充足时可以用。 |

**模型推荐：DeepSeek V4.1 Flash。** 速度快、价格低，处理本项目这种“看页面结构 → 改选择器/步骤 → 跑测试”的工作足够了。

### 1.1 （备选）安装 dsh

需要先安装 [Node.js](https://nodejs.org/)（建议 LTS 版本）。

```powershell
cd 你的目录\selfuse-ticket-bot
npx @deepseek-ai/dsh web
```

- 会在 `http://127.0.0.1:3080` 打开 Web 界面（加 `--no-open` 不自动打开浏览器）。
- 进入 **Settings → Models**，在 DeepSeek 卡片里填 [DeepSeek 开放平台](https://platform.deepseek.com/) 的 API Key 并保存；也可以提前设置环境变量 `DEEPSEEK_API_KEY`。
- 在模型列表里选择 **V4.1 Flash**。列表以你的 API Key 实际能用的模型为准；如果没看到这个名字，选 Flash 系列里最新的一个。
- 点 **Choose workspace**，添加并选中本仓库目录，选好后输入框才能用。

### 1.2 一句话让 Agent 帮你部署

把下面这段话原样发给 Agent（WorkBuddy / dsh / Codex / Claude Code 都可以），和 README 的 Quick Start 是同一段：

```text
请帮我在本机部署并配置抢票插件 EasyConcertKorea：先把 https://github.com/brokenleg13/selfuse-ticket-bot 克隆到当前目录（已存在就 git pull），阅读仓库根目录的 AGENTS.md、docs/debug-guide.md 和 docs/platforms.md 后按文档完成部署——检查 Node.js 并运行 npm ci --prefix ticket-bot-plugin 和 npm test --prefix ticket-bot-plugin；问我要抢哪个平台（Interpark / YES24 / Melon）、演出链接、日期时间、区域、张数，按 docs/platforms.md 帮我整理好卡片每个字段该填什么；问我是否需要验证码识别，需要的话按 docs/captcha-service.md 第 5 节部署本地服务并用 /health 验证；你能自己完成的步骤直接做，必须由我操作的步骤（例如在 Chrome 加载插件、登录购票网站、在插件里填写飞书 Webhook / YES24 用户 ID 等敏感信息、保存卡片、点开始）整理成一份按顺序编号的清单给我，并告诉我每一步做完怎么确认成功；全程不要点击付款或提交订单。
```

Agent 收到后应该做到：

- 能自动完成的直接做：克隆或更新代码、安装依赖、跑测试、部署并检查验证码服务、整理卡片字段。
- 必须由用户操作的整理成编号清单，每一步都说明怎么确认成功。包括：
  - 在 Chrome 加载插件；
  - 登录购票网站；
  - 在插件里填写敏感信息（飞书 Webhook、YES24 用户 ID、联系人）；
  - 保存卡片，点开始。
- 敏感信息只让用户自己在插件里填写，不写进文件，也不要在对话里收集。

---

## 2. 本地部署（手动版）

1. **获取代码**：`git clone https://github.com/brokenleg13/selfuse-ticket-bot.git`
2. **跑测试**（确认代码没问题）：
   ```powershell
   npm ci --prefix ticket-bot-plugin
   npm test --prefix ticket-bot-plugin
   ```
3. **加载插件**：打开 `chrome://extensions/` → 打开右上角“开发者模式” → “加载已解压的扩展程序” → 选择 `ticket-bot-plugin` 目录。
   - 以后改了代码，要在这个页面点插件的 **刷新** 按钮，再刷新购票页。
   - 一直用同一个目录加载，否则插件 ID 变化后之前保存的卡片看起来会“丢失”。
4. **配置卡片**：点插件图标 → 选平台 → 填演出、日期、区域、飞书 Webhook → 保存。
5. **（可选）Interpark 验证码识别**：按 [captcha-service.md](captcha-service.md) 第 5 节部署。Melon、YES24 或新页面需要识别时，按该文档第 4 节让 Agent 自行接入。

### 2.1 卡片上的按钮

| 按钮 | 作用 |
|---|---|
| 开始 | 在当前标签页开始；之后打开的匹配页面（例如 Melon 选座弹窗、Interpark 订购页）会自动接着运行。 |
| 接管 | 暂停脚本，你可以手动操作页面。 |
| 继续 | 从当前页面重新开始脚本流程。 |
| 停止 | 停止所有页面上这个平台的脚本。 |
| 编辑 | 修改卡片；留空的高级参数会保留原来的值。 |

购票页右下角的 **状态小框** 显示这个页面的状态机：每一步用 ✓（已完成）/ ▶（当前）/ ○（未到）标出，下面是当前信息和最近几次状态切换。需要人操作时小框会高亮。小框也有 **接管 / 继续 / 停止** 按钮，点 ▾ 可以折叠。Melon 选座弹窗没有插件图标时，就用这里的按钮。

### 2.2 提示音

需要人接管时会响提示音，不用一直盯着页面。插件首页右上角的 **🔔 测试提示音** 可以先试听一下。

| 声音 | 什么时候响 |
|---|---|
| 急促三连音（takeover） | 需要人工操作（例如手动输入验证码、找不到按钮）、暂停/接管、脚本自动停止 |
| 两声高低音（alert） | 卡住、页面异常提示、脚本出错 |
| 上扬音（success） | 抢到/锁到座位 |

卡片高级设置里可以改“提示音事件”（逗号分隔，填 `none` 关闭）和“提示音音量”。默认值在 `config.js` 的 `runtime.soundEvents` / `runtime.soundVolume`。声音由插件后台播放，购票页不需要先点一下才能出声。

### 2.3 飞书通知

卡片里填好飞书机器人 Webhook 后，默认只推送关键事件（过程信息只显示在状态小框）。消息格式统一为：

```
【Interpark】成功
锁座成功，请尽快完成后续步骤：区域 004，视觉排 2，座位 12
步骤：刷座位（004） | 时间：2026/11/16 20:00:00
```

| 事件 | 何时推送 |
|---|---|
| human | 需要人工操作，例如手动输入验证码 |
| stalled | 某个步骤长时间没有进展（默认 3 分钟，卡片里的“卡住提醒阈值”可改） |
| alert | 页面出现异常提示，例如 Melon 的 “try again” |
| error | 脚本自己出错 |
| pause | 脚本暂停，等你接管 |
| success | 抢到/锁到座位 |
| stop | 脚本主动停止，例如流程结束、被封禁、配置缺失 |

卡片里的“飞书推送事件”可以填逗号分隔的事件名，只推送你关心的事件，例如 `stalled,alert,success`。还有两个默认关闭的事件：`start`（开始运行）、`detail`（平台脚本主动推送的过程细节），需要时加上。

---

## 3. Agent 自助调试流程（出问题时用这个）

### 3.1 你要发给 Agent 的内容

复制下面的模板，把尖括号部分换成实际内容：

```text
购票页出问题了，请按 AGENTS.md 和 docs/debug-guide.md 第 3 节自助调试并交付修好的脚本。
- 平台：<melon / yes24 / interpark>
- 出问题的页面 URL：<粘贴地址栏完整地址>
- 现象：<例如：点开始后停在选日期 / 一直刷但不锁座 / 出现 try again 后没反应>
- 状态小框显示：<复制右下角小框的文字>
- 卡片配置：<演出 ID、日期、时间、区域（敏感信息不要发）>
- 我的 Chrome 已经用调试端口 9222 启动并打开了这个页面。
要求：用 CDP 连接我的 Chrome 复现问题；只改对应平台的脚本和 config.js；补测试并让 npm test 全部通过；最后告诉我改了什么、要怎么重新加载插件验证。绝对不要点击付款或提交订单。
```

### 3.2 用调试端口启动 Chrome（你来做）

让 Agent 能看到、操作网页，推荐用 **CDP（Chrome DevTools Protocol）**。先完全关闭 Chrome，然后用单独的用户目录启动（新版 Chrome 不允许对默认用户目录开调试端口）：

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:USERPROFILE\chrome-ticket-debug"
```

macOS：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-ticket-debug"
```

在这个 Chrome 窗口里：加载插件（见第 2 节第 3 步）、登录购票网站、打开出问题的页面。浏览器访问 `http://127.0.0.1:9222/json/version` 能看到 JSON 就说明端口可用。

> 调试端口能完全控制这个浏览器。只在本机调试时开启，用完关掉，不要在这个用户目录里登录无关的重要账号。

### 3.3 Agent 连接浏览器的方式（任选其一）

| 方案 | 适合 | 用法 |
|---|---|---|
| Chrome DevTools MCP | Agent 支持 MCP（Claude Code、Codex 等） | 添加 MCP 服务器：`npx chrome-devtools-mcp@latest --browserUrl http://127.0.0.1:9222`，然后可以直接读 DOM、执行脚本、截图、看控制台和网络请求。 |
| Playwright 连接 CDP | 任何能运行 Node 脚本的 Agent（包括 WorkBuddy、dsh） | 在临时目录 `npm i playwright-core`，脚本里用 `chromium.connectOverCDP('http://127.0.0.1:9222')` 连上，找到目标页面后读取 DOM、执行 JS。 |
| Claude in Chrome / 浏览器扩展类 Agent | 想直接在自己的 Chrome 里操作 | 按对应工具说明安装。 |

Playwright 最小示例（Agent 可以照着写）：

```js
// debug-page.cjs —— 放在临时目录运行：node debug-page.cjs
const { chromium } = require('playwright-core');
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts().flatMap(context => context.pages());
    const page = pages.find(p => p.url().includes('melon.com')) || pages[0];
    console.log('URL:', page.url());
    // 读状态小框
    console.log(await page.evaluate(() => {
        const host = document.getElementById('ticket-bot-status');
        return host && host.shadowRoot ? host.shadowRoot.textContent : '(no status panel)';
    }));
    // 抓需要的 DOM 片段（不要整页 dump，太大）
    console.log(await page.evaluate(() => document.querySelector('#list_date')?.outerHTML?.slice(0, 2000)));
    // 内容脚本的 console 日志：监听后在页面上重现一次操作
    page.on('console', msg => console.log('[page]', msg.text()));
    await page.waitForTimeout(10000);
    await browser.close(); // 只是断开连接，不会关闭你的 Chrome
})();
```

注意：内容脚本运行在隔离环境里，`page.evaluate` 读不到脚本内部变量，但可以读 DOM、状态小框和 `[平台名]` 开头的控制台日志。

### 3.4 Agent 的调试步骤

0. **先看运行记录**：让用户导出运行记录（插件首页“📄 导出运行记录”），找 `unhandled` 和 `error` 条目，处理方式见 [incidents.md](incidents.md)。
1. **定位当前步骤**：看状态小框和控制台日志里的 `state -> xxx`，确认卡在哪个步骤。每个平台的步骤列表在脚本顶部的 `STATE` / `BOT_STATE` 常量里。
2. **对照页面结构**：抓取该步骤用到的元素（选择器写在对应函数里），确认是不是网站改版导致选择器失效、文字变了、元素被移进了 iframe 等。
3. **最小修改**：
   - 选择器、文字、等待时间：改对应平台脚本里的元素操作函数，可调的数字放进 `config.js`。
   - 新的卡点（弹窗文字、页面提示、接口返回）：按 [incidents.md](incidents.md) 在 `config.js` 的 `platforms.<平台>.rules` 加规则，并在 `docs/incidents/<平台>.md` 记录。
   - 新的步骤：按第 4 节加一个状态和一个函数。
   - 不要改 `scripts/common/runtime.js` 的行为，除非确认是框架本身的问题。
4. **补测试**：在 `ticket-bot-plugin/tests/` 里参照现有测试，用 jsdom 和**脱敏后**的页面片段复现这个问题，修改后测试要能通过。
5. **跑全部测试**：`npm test --prefix ticket-bot-plugin` 必须全部通过。
6. **实页验证**：让用户在 `chrome://extensions/` 刷新插件、刷新购票页，再观察一次；Agent 可以继续通过 CDP 观察，但**不能点击付款、提交订单、确认支付**。
7. **记录卡点**：在 `docs/incidents/<平台>.md` 按模板记一条。
8. **交付**：列出改动的文件、改了什么、为什么，以及用户需要做的验证步骤。

---

## 4. 适配新的购票页面/流程

所有平台都基于 `ticket-bot-plugin/scripts/common/runtime.js` 运行。适配新页面的模板：

### 4.1 先把流程画出来

用 CDP 手动走一遍流程，记录每一步：页面 URL、要等哪个元素出现、点哪个元素、成功后页面怎么变化、可能出现哪些提示。整理成状态列表，例如：

```
wait_open → select_date → select_time → reserve →（新页面）wait_certification → scanning → next_step → success
```

`docs/interpark-onestop-flow.md` 是一份完整的范例。

### 4.2 写平台脚本

```js
(function() {
    const STATE = { WAIT_OPEN: "wait_open", SCANNING: "scanning" };

    const bot = TicketBotRuntime.createBot({
        platform: "myplatform",                    // 与 config.js 的 platforms key 一致
        states: [                                  // 状态机：按流程顺序，自动显示在状态小框
            { key: STATE.WAIT_OPEN, label: "等待开售" },
            { key: STATE.SCANNING, label: "刷座位" },
        ],
        getConcertId: () => document.querySelector("#prodId")?.value || "",
        matchesConfig: config => true,             // 卡片是否属于当前页面
        stallTimeouts: { [STATE.WAIT_OPEN]: 0 },   // 开售前不做卡住检测
        onStart: runFlow,
    });

    async function runFlow(ctx, gen) {
        ctx.setState(STATE.WAIT_OPEN);
        while (!isOpen()) {
            if (!ctx.isActive(gen)) return;          // 停止/暂停后立刻退出
            await ctx.sleep(ctx.num("openRetryMs", 200));
        }
        ctx.setState(STATE.SCANNING);
        // ... 找到座位后：
        await ctx.success("已选座，请完成后续步骤");
    }

    bot.autoStart();
})();
```

要点：

- 每个循环都检查 `ctx.isActive(gen)`，这样停止、接管、继续才能立即生效。
- 数字参数用 `ctx.num("key", 默认值)` 读取，并在 `config.js` 里写默认值和表单字段。
- 需要人工处理时用 `ctx.pause(原因)`，流程结束用 `ctx.success()` / `ctx.stop()`，本页做完、交给下一个页面时用 `ctx.handoff()`。
- 流程停下来等人操作的位置（例如等用户手动输入验证码）调用 `ctx.needHuman("原因")`：会响提示音、推送飞书、高亮状态小框，同一状态只提醒一次，不会打断流程。
- `states` 里只提供中文名、不想显示在步骤条里的状态，加 `step: false`。
- 过程信息用 `ctx.status()` 显示在状态小框，需要推送的用 `ctx.notify("detail", 文本)`。

### 4.3 注册

1. `config/config.js`：在平台默认值里加参数默认值；在 `platforms` 里加 `label/logo/form/urls/rules/fields`。
2. `manifest.json`：在 `content_scripts` 里加页面匹配规则，脚本顺序为 `config/config.js` → `scripts/common/*.js`（最后是 `runtime.js`）→ 平台脚本；需要的话在 `host_permissions` 里加域名。
3. `popup/`：复制一个平台表单 HTML（例如 `yes24Form/yes24.html`），把提交按钮的 `id` 改成平台名，再在 `mainPage/index.html` 加入口。字段会根据 `config.js` 自动生成。
4. `tests/`：加测试，至少覆盖“正常走完流程”和“卡片与页面不匹配时不启动”。

---

## 5. 常见问题排查

| 现象 | 先看哪里 |
|---|---|
| 点开始没反应 | 页面是否刷新过（插件更新后要刷新页面）；卡片演出 ID 是否与页面一致；控制台是否有 `[平台]` 日志。 |
| 状态小框不出现 | 当前 URL 是否在 `manifest.json` 的匹配规则里；插件是否已刷新。 |
| 停在某个状态不动 | 看状态小框的状态名，对照脚本里该状态的函数和选择器。 |
| 收不到飞书通知 | Webhook 是否正确；卡片“飞书推送事件”里是否包含这个事件；插件 Service Worker 控制台（扩展管理页 → 服务工作进程）里有无报错。 |
| 页面出现提示但没推送 / 推送了但处理不对 | 导出运行记录找 `unhandled` 条目，按 [incidents.md](incidents.md) 加卡点规则。 |
| Interpark 验证码不识别 | `http://127.0.0.1:17861/health` 是否正常，见 [captcha-service.md](captcha-service.md)。 |
