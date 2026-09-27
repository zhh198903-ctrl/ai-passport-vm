---
name: ai-passport-vm
description: 帮用户用好「AI Passport 虚拟机」—— 在 Windows 上跑 AI Passport 手表真固件的模拟器（AI-Passport-VM.exe）。打不开 / 白屏 / 没反应时去读启动日志、加载或上传别的固件、手表按键怎么操作、Claude Control 演示怎么玩、「连接我的电脑」固件怎么在 UART 里配对、已知限制。触发词：AI Passport 虚拟机, AI-Passport-VM, ai-passport-vm, 手表模拟器, 模拟器打不开, 加载固件, 上传固件, UART 配对, pair 命令, launcher.log, Claude Control 演示。
---

# AI Passport 虚拟机

在电脑上跑 AI Passport 手表的**真固件**（WebAssembly + QEMU 模拟 ESP32-C3），Windows 单个 exe，
不用装 Node.js。基于 VOID001/FoloToy-Passport-Simulator。源码：
https://github.com/zhh198903-ctrl/ai-passport-vm

**先看日志再下结论。** 启动器每一步都写日志；「双击没反应」十有八九日志里一行就说清了。

## 东西在哪

| | |
|---|---|
| 程序 | `AI-Passport-VM.exe`，单文件，放哪都行 |
| 启动日志 | `%LOCALAPPDATA%\AIPassportVM\launcher.log` |
| 浏览器配置 | `%LOCALAPPDATA%\AIPassportVM\browser\`（独立配置，不碰用户自己的浏览器数据） |
| 地址 | `http://127.0.0.1:4190/`；4190 被别的程序占了就换一个空闲端口，实际地址写在日志里 |

```bash
tail -20 "$LOCALAPPDATA/AIPassportVM/launcher.log"
```

## 它怎么启动

1. 在本机 `127.0.0.1` 起一个小服务（网页、模拟器内核、固件都打包在 exe 里）。
2. 用 **Chrome** 打开一个应用窗口；没装 Chrome 就用系统自带的 **Edge**。
   想指定浏览器：设环境变量 `SIMULATOR_BROWSER=<chrome.exe 或 msedge.exe 的完整路径>`。
   两个都没有：用默认浏览器打开，这时关网页不会退出，要从任务管理器结束 `AI-Passport-VM.exe`。
3. **关掉模拟器窗口 = 退出程序。** 已经开着一个再双击，只会再开一个窗口连到正在跑的那个。

日志里正常的样子：

```
… AI Passport VM is running at http://127.0.0.1:4190/
… window: C:\Program Files\Google\Chrome\Application\chrome.exe
… window closed; quitting
```

## 常见问题

| 现象 | 看什么 / 怎么办 |
|---|---|
| Windows 提示「已保护你的电脑」 | 程序没有签名。点「更多信息 → 仍要运行」 |
| 双击后什么都没出现 | 看日志最后几行：有 `fatal:` 就把那一行给作者；有 `already running` 说明已经开着一个，找那个窗口 |
| 窗口开了但一片黑 / 转圈 | 等几秒（第一次要编译模拟器内核）；还不行就关掉重开，再看日志里有没有 `[` 开头的错误行 |
| 按键没反应 | 先点一下模拟器画面让窗口拿到焦点；快速按两下会被合成一次「双击」（300 ms 窗口），想按两下就放慢一点 |
| 没声音 | 页面右上角先点「声音」；麦克风要点「授权 MIC」 |
| 录音时整个模拟器变得很慢 | 已知限制（模拟器内核开了麦克风就慢），真手表不会；Claude Control 演示不开麦克风，不受影响 |

## 固件

左侧「尝试一下」里是内置固件，点一下就刷写并运行：

| 序号 | 固件 | 说明 |
|---|---|---|
| 05 | **Claude Control 演示（默认）** | 手表里模拟一台开着几个 Claude Code 窗口的电脑：会话在变、审批会冒出来、提醒会弹、说话给预设的识别结果。不联网 |
| 06 | Claude Control · 连接我的电脑 | 配合 Claude Control 桌面端遥控真的 Claude Code 窗口，要先配对（见下） |
| 01–04 | 音乐钥匙扣、答案之书、FoloToy 官方 Demo、飞书日程助手 | FoloToy 的官方固件 |

- **上传自己的固件**：「上传固件」选本地 `.bin`。要求：ESP32-C3 **完整 Flash 合并镜像**、从地址 `0x0`
  写入、不超过 8 MiB、包含 bootloader / 分区表 / 应用。只存在当前页面里，刷新就回到默认固件。
- **社区玩法**：粘贴 `https://ai-passport.folotoy.cn/plays/<编号>/` 链接，或在地址后加 `?play=<编号>`。
- **指定开机固件**：地址加 `?id=1` … `?id=6`（对应上表序号）。

## 手表按键（Claude Control 固件）

页面上的实体键，或键盘 `↑` `↓` `Enter`；按住不放 = 长按。

| 页面 | 操作 |
|---|---|
| 总览 | ↑↓ 选会话，OK 进入，长按 OK 进设置 |
| 会话 | ↑↓ 选动作（继续 / 说话 / 预设 / 中断 / 前置窗口 / 静音），OK 执行，长按 UP 返回 |
| 审批 | OK 批准，DOWN 拒绝，长按 UP 先不答 |
| 说话 | 按住 OK 说、松手结束；识别出来后 OK 发送 / UP 重说 / DOWN 取消 |

## 「连接我的电脑」配对

这个固件本身**不带任何配对信息**，要在模拟器的 UART 里配一次：

1. 电脑上打开 Claude Control 桌面端，设备页勾「启用局域网服务」，点「复制模拟器配对命令」。
2. 模拟器侧栏选 06，打开右上角检查器的 **UART** 页，把命令粘进输入框回车：
   ```
   pair <配对码> <令牌> [ws://<电脑IP>:47832/dev]
   ```
   手表保存后重启并连电脑。带局域网地址就先走局域网直连，连不上再走云中继。
3. `status` 看配对状态（不会显示令牌），`unpair` 清除，`help` 看命令。

手表总览底部写「未配对：在 UART 输入 pair 配对码 令牌」就是还没配；
写「电脑还没连上」就是配了但电脑那边没在线（桌面端没开、没勾局域网服务或云中继）。

Claude Control 桌面端**还没上架**；用户问在哪下载，如实说还没上架。

## 已知限制

- 没有 BLE、NFC、电量计；功耗、射频、时序与真机不同。发布固件前在真手表上复测。
- 开麦克风录音时模拟器明显变慢。
- 模拟器的虚拟 Wi-Fi 叫 `Emulator Host Bridge`；exe 里允许连本机局域网地址。

## 说话的分寸

- 模拟器代码是 MIT 开源的；**内置的 Claude Control 固件是专有软件、不开源**，不要把「开源 / MIT」说到它身上。
- Claude Control 的价格、授权、收费规则：不在这里回答，引导用户去下载站咨询作者。
