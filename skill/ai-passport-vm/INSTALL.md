# 安装这个 skill

把 `ai-passport-vm` 这个文件夹整个放进 Claude Code 的技能目录：

（如果你下的是 AI Passport 虚拟机主程序包，里面那个文件夹叫 `skill`，
复制过去时改名成 `ai-passport-vm` 即可。）

```
%USERPROFILE%\.claude\skills\ai-passport-vm\SKILL.md
```

也就是说复制完长这样：

```
C:\Users\<你>\.claude\skills\ai-passport-vm\
    SKILL.md
    INSTALL.md
```

新开一个 Claude Code 会话即可生效。装好之后可以直接问它：

- 「AI Passport 虚拟机双击没反应，帮我看看」
- 「怎么把我自己编的固件放进模拟器跑？」
- 「连接我的电脑那个固件怎么配对？」
- 「Claude Control 演示里审批页怎么操作？」

它会去读本机的启动日志再回答，而不是凭印象猜。

装不装都不影响 AI Passport 虚拟机本身运行——这只是让 Claude Code 懂得怎么帮你用它。

---

# Installing this skill

Copy the `ai-passport-vm` folder (named `skill` inside the main program package) to
`%USERPROFILE%\.claude\skills\ai-passport-vm\`, then start a new Claude Code session. It teaches
Claude Code to read the AI Passport VM launcher log and help you load firmware and pair the watch.
The simulator runs fine without it.
