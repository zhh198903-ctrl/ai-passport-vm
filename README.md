# AI Passport 虚拟机

在电脑上跑 AI Passport 手表的**真固件**：内置几个固件（默认开机跑 Claude Control 演示），
也能加载任何别的固件。
Windows 下载一个 exe，双击就能用。

本项目 fork 自 [VOID001/FoloToy-Passport-Simulator](https://github.com/VOID001/FoloToy-Passport-Simulator)，
模拟器内核与页面来自原作者，感谢。原项目说明见 [docs/UPSTREAM-README.md](docs/UPSTREAM-README.md)。

## 下载（Windows）

到 [Releases](https://github.com/zhh198903-ctrl/ai-passport-vm/releases) 下载
`AI-Passport-VM.exe`，双击运行，不用装 Node.js。

- 用 Chrome 打开（没装 Chrome 就用系统自带的 Edge）；关掉模拟器窗口即退出。
- 程序没有签名，第一次运行 Windows 可能提示「已保护你的电脑」：点「更多信息 → 仍要运行」。
- 出问题时看日志：`%LOCALAPPDATA%\AIPassportVM\launcher.log`

## 能做什么

- **Claude Control 演示（默认）**：手表里模拟了一台开着 5 个 Claude Code 窗口的电脑 ——
  会话列表在变、审批会冒出来、「做完了」的提醒会弹、按住 OK 说话会给出识别结果。
  不联网，不用装别的东西。演示版不采集麦克风，识别结果是预设的句子。
- **Claude Control（连接我的电脑）**：配合 Claude Control 桌面端，用模拟器里的手表查看、
  继续、审批你电脑上真的 Claude Code 窗口。配对方法见下。桌面端还没上架，上架后在这里更新。
- **其它固件**：FoloToy 官方 Demo、音乐钥匙扣、答案之书、飞书日程助手；也可以上传本地 `.bin`，
  或粘贴 [FoloToy 社区](https://ai-passport.folotoy.cn/plays/) 的玩法链接。

## 手表怎么操作

点页面上的实体键，或用键盘：`↑` = UP，`↓` = DOWN，`Enter` = OK。按住不放就是长按。

| 页面 | 操作 |
| --- | --- |
| 总览 | ↑↓ 选会话，OK 进入，长按 OK 进设置 |
| 会话 | ↑↓ 选动作（继续 / 说话 / 预设 / 中断 / 前置窗口 / 静音），OK 执行，长按 UP 返回 |
| 审批 | OK 批准，DOWN 拒绝，长按 UP 先不答 |
| 说话 | 按住 OK 说话、松手结束；识别出来后 OK 发送 / UP 重说 / DOWN 取消 |

## 连接我的电脑（配对）

1. 在电脑上打开 Claude Control 桌面端，设备页勾选「启用局域网服务」，点「复制模拟器配对命令」。
2. 模拟器左侧选「Claude Control · 连接我的电脑」，打开右上角检查器的 **UART** 页，
   把命令粘进输入框回车。手表保存后重启，连上电脑。
3. 在 UART 里输入 `status` 看配对状态，`unpair` 清除配对。

配对信息只存在模拟器的这台虚拟手表里，固件本身不带任何配对信息。
exe 里模拟器的虚拟 Wi-Fi 允许连本机局域网地址（网页公开部署默认不允许）。

## 已知限制

- 模拟器里一开麦克风录音，整机会明显变慢（模拟器内核的问题）；演示版不开麦克风，不受影响。
- 没有 BLE、NFC、电量计；低功耗、射频、时序与真机不同。
- 发布固件前请在真手表上复测。

## 从源码运行 / 打包

需要 Node.js 20 以上。

```bash
npm install
npm test                 # 上游测试 + 内置固件校验
npm start                # 浏览器打开 http://127.0.0.1:4190
npm run desktop          # 同 exe 的启动方式（本机浏览器应用窗口）
npm run build:exe        # 打包 dist-exe/AI-Passport-VM.exe
```

打包、更换内置固件的细节见 [desktop/README.md](desktop/README.md)。

URL 的 `id` 参数可以指定开机固件：

| `id` | 固件 |
| --- | --- |
| `1` | 音乐钥匙扣 |
| `2` | 答案之书 |
| `3` | FoloToy 官方 Demo |
| `4` | 飞书日程助手 |
| `5` | Claude Control 演示（默认） |
| `6` | Claude Control（连接我的电脑） |

## 许可

- 模拟器代码：MIT，与上游相同，见 [LICENSE](LICENSE)。
- ESP-EMU WASM 内核：Apache-2.0，见 [public/wasm/pkg/LICENSE](public/wasm/pkg/LICENSE)。
- 内置固件包含的第三方组件：见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## English

**AI Passport VM** runs real AI Passport watch firmware on your computer. It boots the
Claude Control demo by default (a scripted computer inside the watch, no network needed) and can
load any other firmware: the bundled FoloToy demos, a local `.bin`, or a FoloToy community link.
Download `AI-Passport-VM.exe` from Releases and double-click it (Windows; opens in Chrome,
or Edge when Chrome is not installed). Forked from
[VOID001/FoloToy-Passport-Simulator](https://github.com/VOID001/FoloToy-Passport-Simulator).
Build from source with `npm install && npm run build:exe`; see [desktop/README.md](desktop/README.md).
