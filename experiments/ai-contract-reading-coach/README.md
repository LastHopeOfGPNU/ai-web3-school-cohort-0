# AI Contract Reading Coach

一个最小可交互 AI / Web3 学习产物：输入一段 Solidity 片段或 Web3 操作意图，生成一张“AI 辅助合约阅读卡”，帮助学习如何用 AI 辅助阅读智能合约。

它重点演示的概念是：**AI 不直接替你判断合约安全，而是先生成阅读问题、风险线索、flashcards 和检查清单，再由学习者人工逐行验证。**

## 运行方式

```bash
npm test
npm run demo
```

交互输入：

```bash
node src/cli.js
```

从文件读取：

```bash
node src/cli.js --file ./sample.sol --question "这个 withdraw 函数应该怎么看？"
```

可选：如果设置了 `OPENAI_API_KEY`，可以让解释段落走真实模型生成：

```bash
node src/cli.js --sample --openai
```

不传 `--openai` 时，工具不会联网，会使用本地的 AI 辅助模板和规则生成学习卡。

## 示例输入

```solidity
function withdraw(uint256 amount) external onlyOwner {
  require(amount <= balances[msg.sender], "too much");
  payable(msg.sender).call{value: amount}("");
}
```

## 输出内容

工具会输出：

- 输入摘要；
- 检测到的阅读信号，例如权限控制、资金转移、状态读取；
- AI 辅助解释；
- 合约阅读步骤；
- 3 张 flashcards；
- 检查清单；
- 人工验证提醒；
- 下一步练习任务。

## AI 辅助与人工修改边界

AI 辅助部分：

- 本实验的主题选择、代码结构和默认输出文案由 AI 辅助生成；
- `generateLearningCard` 会把用户输入转成学习卡；
- 默认模式使用本地规则和模板模拟“AI 辅助学习卡生成”；
- `--openai` 模式会把 prompt 发送到 OpenAI Responses API，由模型生成解释段落；
- 测试中也支持注入 `aiClient`，用于验证真实 AI 调用之外的生成流程。

人工修改 / 验证部分：

- 人工限定了实验范围：这是学习工具，不是合约审计器；
- 人工确认检测规则只作为阅读线索，不作为安全结论；
- 人工补充了 `manualVerification`，提醒逐行验证权限、资金流和状态变化；
- 通过 `node --test` 验证核心行为和可注入 AI 生成路径。

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `src/coach.js` | 合约输入分析、学习卡生成、可选 OpenAI 调用 |
| `src/cli.js` | 命令行交互入口 |
| `test/coach.test.js` | 核心行为测试 |
| `package.json` | 运行脚本 |

## 学习价值

这个实验把“AI 辅助合约阅读”拆成一个可重复流程：

1. 用户输入代码或操作意图；
2. 工具识别权限、资金、状态、外部调用等信号；
3. 工具生成解释、问题和检查清单；
4. 学习者把 AI 输出当作假设，回到代码中验证。

这能帮助初学者形成一个更稳的习惯：让 AI 加速理解，但不要把 AI 的解释直接当成结论。
