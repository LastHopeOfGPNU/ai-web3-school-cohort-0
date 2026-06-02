# Week 1 Proof-of-Work Pack

本周主题是从 AI、Agent / workflow、Web3 基础概念和链上验证四个方向建立边界感：AI 可以辅助理解、生成检查清单和调用只读工具，但涉及钱包签名、授权、转账或合约写入时，必须回到人工确认和链上证据。

## 1. 本周完成了什么

| 类别 | 产物 | 证明链接 / 路径 | 说明 |
| --- | --- | --- | --- |
| AI 概念卡片 | `ai_concepts.md` | [tasks/week_1/ai_concepts.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/ai_concepts.md) | 整理 LLM、Prompt、Context Window、Workflow、Agent、Tool Use，并记录常见误区。 |
| Web3 概念卡片 | `web3_concepts.md` | [tasks/week_1/web3_concepts.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/web3_concepts.md) | 整理账户、地址、钱包、助记词、私钥、签名、交易、Gas，以及为什么私钥和签名必须谨慎处理。 |
| 账户权限对比 | `account_permission_comparison.md` | [tasks/week_1/account_permission_comparison.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/account_permission_comparison.md) | 对比 EOA、智能账户、多签账户，重点回答谁能发起、谁能批准、谁承担风险。 |
| AI x Web3 流程图 | `minimal_ai_web3_workflow.md` | [tasks/week_1/minimal_ai_web3_workflow.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/minimal_ai_web3_workflow.md) | 用 Mermaid 流程图说明合约交互前，AI 辅助和人工确认的边界。 |
| 受限 Agent workflow | `restricted_web3_assistant_workflow.md` | [tasks/week_1/restricted_web3_assistant_workflow.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/restricted_web3_assistant_workflow.md) | 设计“代币授权前检查助手”，明确 AI 只能检查和解释，不能替用户签名或授权。 |
| AI x Web3 项目拆解 | `ai_web3_project_breakdown.md` | [tasks/week_1/ai_web3_project_breakdown.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/ai_web3_project_breakdown.md) | 拆解 Bittensor 与 Ritual / Infernet，关注 AI 能力与 Web3 机制分别解决什么问题。 |
| 本周总结 | `week1_learning_summary.md` | [tasks/week_1/week1_learning_summary.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/week1_learning_summary.md) | 总结 AI x Web3 的阶段性理解、已完成 proof、还没解决的问题和下一步计划。 |

## 2. AI 学习记录

本周对 AI 的核心理解从“会回答问题的模型”扩展到“可被 workflow 约束、可调用工具、但必须被验证的系统”。

关键学习点：

- LLM 生成的是基于上下文的合理文本，不等于事实本身。
- Prompt 的质量影响输出，但复杂任务更依赖拆步骤、给上下文和中间检查。
- Agent 不只是聊天机器人，而是可以围绕目标规划、调用工具、观察结果并继续行动的系统。
- Tool use 是能力增强，也是权限设计问题。工具越接近真实执行，越需要限制范围、记录日志和设置人工确认节点。

对应 proof：

- AI 概念卡片：[ai_concepts.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/ai_concepts.md)
- AI 辅助合约阅读 CLI：[experiments/ai-contract-reading-coach](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/tree/master/experiments/ai-contract-reading-coach)

## 3. Learning Agent / AI 工具实践记录

本周完成了一个最小 Learning Agent / AI 工具实验：`ai-contract-reading-coach`。它接收 Solidity 片段或 Web3 操作意图，输出“合约阅读卡”，包括输入摘要、阅读信号、AI 辅助解释、flashcards、检查清单和人工验证提醒。

运行方式：

```bash
cd experiments/ai-contract-reading-coach
npm test
npm run demo
node src/cli.js
```

这个实验的边界：

- AI 可以识别权限控制、资金转移、状态读取、外部调用等阅读线索。
- AI 输出只作为学习假设，不能作为审计结论。
- 学习者必须人工回到代码逐行确认权限、资金流和状态变化。
- 默认模式不联网；只有显式传入 `--openai` 并配置 `OPENAI_API_KEY` 时才调用真实模型。

对应 proof：

- 实验目录：[experiments/ai-contract-reading-coach](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/tree/master/experiments/ai-contract-reading-coach)
- README：[experiments/ai-contract-reading-coach/README.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/experiments/ai-contract-reading-coach/README.md)

## 4. Web3 概念和链上验证记录

本周 Web3 学习重点是把“钱包交互”拆成账户、地址、私钥、签名、交易、Gas 和链上证据。

最重要的理解：

- 钱包不是资产存放处，而是账户控制权和签名确认工具。
- 私钥 / 助记词泄露通常意味着账户控制权丢失。
- 签名不一定只是登录，也可能代表授权、挂单、Permit 或合约操作。
- 交易不是普通请求，而是带身份授权、Gas 成本和不可逆后果的状态变更。
- 交易完成后不能只看 DApp 提示，应该用 tx hash、区块浏览器、事件日志、授权记录和余额变化验证。

本周已完成的链上 proof 是一个只读 Sepolia 合约读取实验：

| 字段 | 内容 |
| --- | --- |
| 网络 | Ethereum Sepolia testnet |
| 合约 | Chainlink ETH/USD Price Feed |
| 合约地址 | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| 区块浏览器 | <https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306> |
| 实验目录 | [experiments/sepolia-chainlink-read](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/tree/master/experiments/sepolia-chainlink-read) |
| 调用方式 | JSON-RPC `eth_call` |
| 调用内容 | `decimals()`、`description()`、`latestRoundData()` |
| 交易哈希 | 无。该实验是只读调用，不提交交易、不消耗测试网 ETH、不需要钱包签名。 |

运行方式：

```bash
cd experiments/sepolia-chainlink-read
npm run read
```

这次 proof 帮我区分了两类链上交互：

- 只读查询：例如 `eth_call`，适合工具或 Agent 自动执行，但要核对网络、合约地址和数据解释。
- 写入交易：例如转账、授权、合约状态变更，必须由钱包持有人人工确认，并在完成后保存 tx hash 和浏览器链接。

## 5. AI x Web3 最小交叉实验 / 流程图

本周完成了两个交叉材料。

第一个是合约交互前的人机边界流程图：

- 文档：[minimal_ai_web3_workflow.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/minimal_ai_web3_workflow.md)
- 核心结论：AI 可以读取 ABI、解释函数、生成风险提示和检查清单；用户必须人工检查网络、地址、函数、参数、金额，并在钱包中确认或拒绝签名。

第二个是受限 Web3 助手 workflow：

- 文档：[restricted_web3_assistant_workflow.md](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/blob/master/tasks/week_1/restricted_web3_assistant_workflow.md)
- 场景：代币授权前检查助手。
- 核心结论：AI 可以解释 `approve`、`permit`、spender、allowance 等字段，但不能读取私钥、不能自动连接钱包、不能绕过钱包弹窗、不能替用户点击确认。

本周还完成了一个更偏 Agent commerce 的本地闭环实验：

- 实验：[experiments/x402-caw-agent-loop](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/tree/master/experiments/x402-caw-agent-loop)
- 场景：Agent 请求付费 API，收到 `402 Payment Required`，在 Pact / CAW 风格策略允许后完成本地模拟付款并记录 settlement / audit。
- 边界：这是本地模拟，不是真实链上 USDC 转账，也没有真实钱包签名。它证明的是“自动付款必须受预算、链、合约、时间窗口和审计约束”。

## 6. 问题、卡点和人工修正记录

本周遇到的一个关键卡点是：一开始容易把“链上交互 proof”理解成必须有 tx hash，但实际做 Sepolia Chainlink 读取实验时，选择的是只读 `eth_call`。

问题：

- `eth_call` 可以读取真实测试网上已部署合约的数据，但不会提交交易。
- 因为没有交易提交，所以不会有 tx hash，也不会有 Gas 消耗或钱包确认。
- 如果把它写成“完成了一笔测试网交易”，会误导审核者，也混淆只读查询和写入交易的风险边界。

人工修正：

- 在 `week1_learning_summary.md` 中明确记录：该 proof 是只读调用，没有 tx hash。
- 在本 README 中把链上 proof 拆成“合约地址 / 区块浏览器链接 / 调用方式 / 是否有 tx hash”。
- 把下一步计划改成：后续再做一次低风险 Sepolia 写入交易，由 AI 生成检查清单，但最终由人工在钱包里确认，并记录 tx hash。

另一个人工边界修正是 `ai-contract-reading-coach`：

- AI 辅助生成学习卡，但人工限定它不是审计器。
- 检测规则只输出阅读线索，不输出“安全 / 不安全”的最终结论。
- 输出中加入 `manualVerification`，提醒逐行验证权限、资金流和状态变化。

## 7. 本周关键 commit

这些 commit 可以作为本周 proof 的仓库证据：

- [4901aff](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/4901aff)：新增 Sepolia Chainlink 只读合约实验。
- [e8313ec](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/e8313ec)：新增 EOA、智能账户、多签账户权限对比。
- [53a6a59](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/53a6a59)：新增最小 AI x Web3 工作流。
- [1af0e94](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/1af0e94)：新增受限 Web3 助手 workflow。
- [9af62e6](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/9af62e6)：新增 Bittensor 与 Ritual / Infernet 项目拆解。
- [c690701](https://github.com/LastHopeOfGPNU/ai-web3-school-cohort-0/commit/c690701)：新增 Week 1 学习总结。

## 8. 下周继续验证

下一步最适合补上的 proof 是一次真实测试网写入交易：

1. 选择一个低风险 Sepolia 合约或自己部署最小合约。
2. 让 AI 生成交互说明、风险提示和钱包确认前检查清单。
3. 人工检查网络、合约地址、函数、参数、金额和 Gas。
4. 人工在钱包中确认交易。
5. 保存 tx hash、Etherscan 链接、交易状态、事件日志或合约状态变化。
6. 对比 AI 预期和链上实际结果，记录差异和修正。

