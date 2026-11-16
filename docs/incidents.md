# 卡点记录与迭代修复

购票页上哪些地方会被拦、接口返回什么算卡住、该怎么处理，只有真实碰到才知道。本文规定这类经验怎么**记录**下来，让 Agent 每次碰到新卡点都能自己补上处理方式，后面的人和 Agent 可以直接复用。

总体是三层：

| 层 | 在哪 | 作用 |
|---|---|---|
| 运行记录（自动） | 插件首页“📄 导出运行记录” → JSON | 运行时发生了什么：状态切换、弹窗、命中的规则、**没有规则处理的异常（unhandled）**、脚本错误 |
| 卡点规则（配置） | `ticket-bot-plugin/config/config.js` → `platforms.<平台>.rules` | 碰到某个信号时自动怎么处理：通知、叫人、暂停、停止、忽略 |
| 卡点日志（文档） | `docs/incidents/<平台>.md` | 每个卡点的现象、信号、处理方式、验证情况，给人和 Agent 看 |

---

## 1. 运行记录（journal）

由 `scripts/common/journal.js` 自动写入 `chrome.storage.local`，默认保留最近 500 条（`config.runtime.journalSize`）。每条记录：

```json
{ "t": "2026-11-16T12:00:00.000Z", "platform": "melon", "page": "/reservation/popup/onestop.htm",
  "state": "scanning", "type": "unhandled", "kind": "dialog", "text": "Some brand new message" }
```

| type | 含义 |
|---|---|
| `state` | 状态切换（`to` 是新状态，`text` 是详情） |
| `status` | 状态小框文字变化 |
| `dialog` | 浏览器弹窗（alert/confirm/prompt）被自动关闭，`dialog` 是类型 |
| `rule` | 命中了卡点规则，`rule` 是规则 id，`action` 是处理方式 |
| `unhandled` | **出现了异常信号但没有规则处理**，这是要补规则的地方 |
| `human` | 脚本请求人工操作 |
| `error` | 脚本异常（带堆栈） |

### 信号从哪里来

| kind | 来源 |
|---|---|
| `dialog` | 网站弹出的浏览器对话框。`scripts/common/beforeunload-blocker.js` 在页面环境里自动关闭它，并把内容转给 runtime。**弹窗不会再无声无息地被吞掉**：命中规则按规则处理；没命中也会推送“浏览器弹窗（已自动关闭）”并记成 unhandled。 |
| `page-text` | runtime 定期扫描页面（含同源 iframe）可见文字，只检查规则里写到的关键字。 |
| `api` | 平台脚本调用 `ctx.observe("api", "HTTP 429 ...")` 上报的接口结果。目前已上报：YES24 的 `Block=-1/deny` 和锁座失败码 `Lock <code> <message>`、Interpark 新版查询失败 `HTTP <status> <error>`。没有规则的会记成 unhandled，但**不推送**（避免刷屏）。 |
| 其他 | 平台脚本可以自定义，比如 `ctx.observe("captcha", "slider-not-found")`。 |

---

## 2. 卡点规则（rules）

写在 `config.js` 的 `platforms.<平台>.rules`，按顺序匹配，第一条命中的生效：

```js
{
    id: 'melon-try-again',          // 唯一 id，运行记录和卡点日志都用它
    on: 'any',                      // dialog / page-text / api / any / 自定义 kind
    match: 'try again|잠시 후 다시', // 正则（不区分大小写）
    state: 'scanning',              // 可选：只在某个状态生效
    action: 'human',                // 见下表
    message: 'Melon 提示稍后再试（可能被限流），请检查页面',  // 给人看的说明，会出现在推送和状态小框
    ref: 'issue #28',               // 来源：issue、日期、卡点日志条目
}
```

| action | 效果 |
|---|---|
| `alert` | 推送 alert、响 alert 提示音，脚本继续 |
| `human` | 需要人工：响 takeover 提示音、推送、小框高亮，脚本继续 |
| `pause` | 暂停脚本，等人接管后点“继续” |
| `stop` | 停止脚本并推送原因 |
| `ignore` | 只记运行记录，不打扰人（用于“已知且代码已处理”的信号） |

同一条规则 + 同一段文字，60 秒内只处理一次（`config.runtime.pageAlertRepeatMs`）。

**规则解决不了的**（例如需要点某个按钮、重试某个接口、换一种等待方式）就改平台脚本，可以在 `createBot({ onRule(ctx, rule, text) { ... } })` 里按 `rule.id` 做专门处理，也可以直接在流程代码里处理。

---

## 3. Agent 迭代修复流程

用户报告“卡住了 / 停了 / 没通知”时：

1. **拿运行记录**：让用户在插件首页点“📄 导出运行记录”，把 JSON 发过来。复现前可以先点“🧹 清空”，这样记录更干净。
2. **找卡点**：
   - 先看 `type: "unhandled"` 和 `type: "error"`；
   - 再看出事前后的 `state` / `status` / `dialog`，确认卡在哪个状态、页面当时提示了什么；
   - 需要看页面结构时，按 [debug-guide.md](debug-guide.md) 第 3 节用 CDP 连上浏览器。
3. **决定处理方式**：

   | 情况 | 处理 |
   |---|---|
   | 只需要让人知道 | 加规则，`action: alert` 或 `human` |
   | 继续跑会出问题（被封、会话失效） | 加规则，`action: pause` 或 `stop` |
   | 已知且代码已经处理 | 加规则，`action: ignore`，让它不再显示成 unhandled |
   | 需要自动恢复（重试、点按钮、等待） | 改平台脚本，必要时用 `onRule` |
   | 信号还没上报（接口失败只在代码里 catch 了） | 在平台脚本里加 `ctx.observe("api", ...)` |

4. **补测试**：参考 `tests/runtime.test.cjs` 里的“blocked browser dialogs”和“observe()”测试，用脱敏的文字或接口返回复现，`npm test --prefix ticket-bot-plugin` 全部通过。
5. **写卡点日志**：在 `docs/incidents/<平台>.md` 加一条（模板见下），写清现象、信号、处理、验证情况。
6. **交付**：改了哪些文件、新增/修改了哪些规则 id、用户怎么验证。

### 卡点日志模板

```markdown
### <规则 id 或简短标题>
- 日期 / 来源：2026-11-16，issue #28 / 用户反馈 / 自测
- 现象：用户看到了什么（例如“刷票中弹出 try again，然后不再刷新”）
- 信号：dialog / page-text / api / 其他，原文是什么（脱敏）
- 出现时的状态：scanning
- 处理：规则 `melon-try-again`（action: human）/ 代码改动 `scripts/...`
- 验证：自动化测试名 / 实页验证情况（未验证要写明）
- 备注：还不确定的地方、后续可以改进的点
```

---

## 4. 不要做的事

- 不要把 Webhook、Cookie、账号、手机号等写进规则、日志或测试。
- 不要用很宽的正则（例如 `error`）直接 `stop`，先用 `alert` 观察一段时间。
- 不要删别人写的卡点日志；处理方式变了就在原条目下追加更新。
