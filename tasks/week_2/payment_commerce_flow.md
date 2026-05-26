## 一、场景选择

**链上地址风险分析任务市场**

### 场景描述

用户希望在与某个钱包地址、合约地址或交易对手交互前，让自己的 Agent 下单购买一份风险分析报告。

例如：

> “帮我分析 0xABC... 这个地址是否存在钓鱼、黑客资金流入、混币器关联、恶意合约交互、异常资金流出风险。预算不超过 10 USDC，10 分钟内返回报告。”

---

## 二、角色拆解

| 角色             | 对应主体                         | 职责                          |
| -------------- | ---------------------------- | --------------------------- |
| 下单方 Client     | 用户的钱包 Agent                  | 提出任务、设定预算、授权资金、接收结果         |
| 执行方 Provider   | 风险分析 Agent                   | 报价、执行数据查询、生成报告、提交交付物        |
| 验收方 Evaluator  | 独立验证 Agent / 规则合约 / 用户 Agent | 检查报告是否满足任务标准                |
| 付款方 Payer      | 用户钱包 / CAW / 智能账户            | 按预算授权并在通过验收后付款              |
| 仲裁方 Arbitrator | 第三方仲裁 Agent / 多签委员会 / 人工仲裁服务 | 处理“报告质量不合格但执行方要求收款”的争议      |
| 记录方 Recorder   | 链上合约 + IPFS / Arweave / 数据库  | 保存任务状态、授权、交付哈希、验收结果、付款或退款记录 |

---

## 三、最小 Payment / Commerce Flow

### 0. 前置约束：用户授权预算

用户不会直接把钱包完全交给 Agent，而是创建一个**任务级授权**：

| 授权项   | 示例                       |
| ----- | ------------------------ |
| 最大预算  | 10 USDC                  |
| 可支付对象 | 通过注册的风险分析 Agent          |
| 可调用合约 | Agent commerce escrow 合约 |
| 有效期   | 30 分钟                    |
| 任务类型  | address-risk-report      |
| 单笔上限  | 10 USDC                  |
| 失败处理  | 超时自动退款                   |

这部分可以参考 Cobo CAW 这类 Agentic Wallet 的定位：钱包层更适合解决预算、权限边界、策略控制和审计记录问题；Cobo 官网也强调其钱包基础设施包含多类型钱包、风控策略和审计/合规能力。([Cobo][1])

---

## 四、完整流程图

```text
用户提出需求
  ↓
用户 Agent 发现服务方
  ↓
Provider Agent 返回报价
  ↓
用户 Agent 检查预算与条款
  ↓
用户通过钱包 / CAW 授权预算
  ↓
资金进入 escrow
  ↓
Provider Agent 执行任务
  ↓
Provider 提交交付物哈希 + 报告地址
  ↓
Evaluator 自动验收
  ↓
┌───────────────┬────────────────┬────────────────┐
│ 验收通过       │ 验收失败         │ 验收不确定       │
│ 付款给 Provider │ 退款给用户       │ 进入争议处理     │
└───────────────┴────────────────┴────────────────┘
  ↓
链上记录任务状态、交付证明、验收结果、付款/退款/争议结果
```

---

## 五、每一步的最小设计

### 1. 服务发现

用户 Agent 查询可用的风险分析 Agent。

最小字段：

```json
{
  "agent_id": "risk-agent-001",
  "service_type": "address-risk-report",
  "supported_chains": ["ethereum", "base", "bsc"],
  "price_model": "fixed_or_quote",
  "min_price": "3 USDC",
  "max_response_time": "10 minutes",
  "reputation_score": 4.7,
  "supported_verification": ["schema_check", "evaluator_attestation"]
}
```

这里如果接 ERC-8004，它更适合承担**Agent 身份、发现、声誉、验证方式声明**。ERC-8004 的目标是让 Agent 能被发现并通过 reputation / validation 建立信任，其标准包含 agent registration，并可用于 discovery；如果没有 supportedTrust 字段，它也可以只用于发现。([Ethereum Improvement Proposals][2])

---

### 2. 报价 Quote

Provider Agent 返回报价：

```json
{
  "quote_id": "quote_20260526_001",
  "task_type": "address-risk-report",
  "target": "0xABC...",
  "chain": "ethereum",
  "price": "8 USDC",
  "deadline": "10 minutes",
  "deliverable": {
    "format": ["json", "markdown"],
    "required_fields": [
      "risk_score",
      "risk_reasons",
      "evidence_tx_hashes",
      "data_sources",
      "summary",
      "recommendation"
    ]
  },
  "refund_rule": "full_refund_if_no_delivery_before_deadline",
  "dispute_window": "15 minutes"
}
```

### 关键点

**报价必须包含交付标准。**
否则付款只是转账，无法形成 commerce。

---

### 3. 预算授权 Budget Authorization

用户 Agent 检查报价是否满足预算：

| 检查项           | 规则                         |
| ------------- | -------------------------- |
| 报价是否小于预算      | price ≤ 10 USDC            |
| 服务类型是否匹配      | address-risk-report        |
| 执行时间是否可接受     | deadline ≤ 10 minutes      |
| Provider 是否可信 | reputation_score ≥ 4.5     |
| 是否有验收机制       | evaluator_attestation 必须存在 |

通过后，用户钱包创建授权：

```json
{
  "budget_authorization": {
    "max_amount": "10 USDC",
    "approved_amount": "8 USDC",
    "spender": "escrow_contract",
    "provider": "risk-agent-001",
    "expires_at": "2026-05-26T12:30:00+09:00",
    "task_hash": "0xTASK..."
  }
}
```

### 权限边界

Provider Agent 不能直接拿走钱，只能在 escrow 中等待验收结果。

---

### 4. Escrow 锁定资金

资金进入任务托管合约。

任务状态：

```json
{
  "job_id": "job_001",
  "client": "user-agent",
  "provider": "risk-agent-001",
  "evaluator": "risk-evaluator-001",
  "amount": "8 USDC",
  "status": "funded",
  "deadline": "2026-05-26T12:30:00+09:00"
}
```

这里可以参考 ERC-8183 的方向。ERC-8183 定义的是 Agentic Commerce，核心是 job-based escrow：client 资金托管，provider 提交工作，evaluator 对完成或拒绝进行证明，然后触发结算或退款。([Ethereum Improvement Proposals][3]) Ethereum Magicians 对该提案的描述也明确提到：client funds a job、provider submits work、single evaluator attests completion or rejection。([Fellowship of Ethereum Magicians][4])

---

### 5. 执行任务 Execution

Provider Agent 执行：

1. 查询目标地址历史交易；
2. 查询黑名单、钓鱼库、标签库；
3. 分析资金流；
4. 检查合约交互；
5. 生成风险评分；
6. 输出结构化报告。

最小交付物：

```json
{
  "job_id": "job_001",
  "target": "0xABC...",
  "chain": "ethereum",
  "risk_score": 82,
  "risk_level": "high",
  "risk_reasons": [
    "received funds from known phishing cluster",
    "interacted with suspicious approval contract"
  ],
  "evidence_tx_hashes": [
    "0xTX1...",
    "0xTX2..."
  ],
  "data_sources": [
    "onchain_transactions",
    "label_database",
    "contract_interaction_graph"
  ],
  "recommendation": "do_not_interact"
}
```

---

### 6. 交付 Delivery

Provider 不建议直接把完整报告写入链上。更合理的最小方案：

| 内容          | 存储位置                     |
| ----------- | ------------------------ |
| 完整报告        | IPFS / Arweave / 后端存储    |
| 报告哈希        | 链上                       |
| 交付时间        | 链上                       |
| Provider 签名 | 链上或元数据                   |
| 数据来源摘要      | 链上事件或 off-chain metadata |

提交记录：

```json
{
  "job_id": "job_001",
  "deliverable_uri": "ipfs://...",
  "deliverable_hash": "0xREPORT_HASH...",
  "provider_signature": "0xSIG...",
  "submitted_at": "2026-05-26T12:25:00+09:00"
}
```

---

### 7. 验收 Acceptance

Evaluator Agent 根据规则验收。

#### 自动验收标准

| 验收项         | 判断方式                         |
| ----------- | ---------------------------- |
| 是否按时交付      | submitted_at ≤ deadline      |
| 是否覆盖指定地址    | report.target == task.target |
| 是否覆盖指定链     | report.chain == task.chain   |
| 是否包含风险评分    | risk_score 存在，范围 0-100       |
| 是否包含证据交易    | evidence_tx_hashes 不为空       |
| 是否包含数据来源    | data_sources 不为空             |
| 是否通过 schema | JSON schema valid            |
| 是否存在明显伪造    | 抽样验证 tx_hash 是否真实存在          |

#### 验收结果

```json
{
  "job_id": "job_001",
  "evaluator": "risk-evaluator-001",
  "result": "accepted",
  "reason": "Report matches schema, includes verifiable evidence, and was delivered before deadline.",
  "attestation_hash": "0xATTEST..."
}
```

---

## 六、付款 / 退款 / 争议逻辑

### A. 验收通过：付款

```text
status: accepted
escrow → provider: 8 USDC
record: payment_settled
```

Provider 获得收入，用户获得报告，Evaluator 可获得一小笔验证费。

---

### B. 验收失败：退款

失败条件：

| 失败类型    | 处理          |
| ------- | ----------- |
| 超时未交付   | 全额退款        |
| 报告格式错误  | 全额退款或允许一次重交 |
| 目标地址错误  | 全额退款        |
| 缺少证据    | 全额退款或部分退款   |
| 风险结论有争议 | 进入争议        |

```text
status: rejected
escrow → client: 8 USDC
record: refunded
```

---

### C. 验收不确定：争议

争议触发条件：

1. Provider 认为报告合格，但 Evaluator 拒绝；
2. 用户认为报告质量差，但 Evaluator 放行；
3. 报告存在事实争议；
4. 数据源不可访问；
5. Provider 交付的是“看似完整但低质量”的报告。

争议处理可以分三档：

| 档位         |      适用任务金额 | 仲裁方式                |
| ---------- | ----------: | ------------------- |
| 自动二次评估     |   ≤ 10 USDC | 换一个 Evaluator 复验    |
| 多 Agent 投票 | 10-100 USDC | 3 个 Evaluator 多数决   |
| 人工仲裁       |  > 100 USDC | 人工仲裁员 / DAO / 多签委员会 |

最小实现建议：**先做自动二次评估 + 多数决，不要一开始做复杂 DAO 仲裁。**

---

## 七、记录证明 Record / Proof

每个任务至少记录以下信息：

| 记录项                       | 作用            |
| ------------------------- | ------------- |
| task_hash                 | 证明任务要求没有被事后篡改 |
| quote_hash                | 证明报价和交付标准     |
| budget_authorization_hash | 证明用户授权边界      |
| escrow_tx_hash            | 证明资金已托管       |
| deliverable_hash          | 证明交付物存在且未篡改   |
| evaluator_attestation     | 证明验收结论        |
| settlement_tx_hash        | 证明付款或退款       |
| dispute_result_hash       | 证明争议处理结果      |

最小链上事件：

```solidity
event JobCreated(bytes32 jobId, address client, address provider, uint256 amount);
event JobFunded(bytes32 jobId, uint256 amount);
event WorkSubmitted(bytes32 jobId, bytes32 deliverableHash, string deliverableURI);
event WorkEvaluated(bytes32 jobId, bool accepted, bytes32 attestationHash);
event PaymentReleased(bytes32 jobId, address provider, uint256 amount);
event PaymentRefunded(bytes32 jobId, address client, uint256 amount);
event DisputeOpened(bytes32 jobId, string reason);
event DisputeResolved(bytes32 jobId, address winner, uint256 clientAmount, uint256 providerAmount);
```

---

## 八、最小系统架构

```text
User
 ↓
User Agent
 ↓
Agent Wallet / CAW / Smart Account
 ↓
Commerce Orchestrator
 ↓
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Service Registry     │ Escrow Contract      │ Evaluator Service    │
│ Agent identity       │ fund / release       │ schema + evidence    │
│ reputation           │ refund / dispute     │ attestation          │
└─────────────────────┴─────────────────────┴─────────────────────┘
 ↓
Provider Agent
 ↓
Report Storage: IPFS / Arweave / Backend
```

---

## 九、协议对比：x402、MPP、ERC-8004、ERC-8183

### 1. 简表

| 协议       | 主要解决哪一段                               | 适合什么                             | 不适合什么            |
| -------- | ------------------------------------- | -------------------------------- | ---------------- |
| x402     | HTTP 级即时支付                            | API、内容、数据查询的 pay-before-response | 复杂任务验收、争议、仲裁     |
| MPP      | 机器间支付协调、会话支付、微支付                      | Agent 高频调用 API、数据、计算服务           | 复杂交付质量判断         |
| ERC-8004 | Agent 身份、发现、声誉、验证注册                   | 找可信 Agent、声明验证方式、积累 reputation   | 本身不直接定义完整支付结算    |
| ERC-8183 | Job + escrow + evaluator + settlement | 任务型 commerce，尤其“先托管、后验收、再结算”     | 低价值即时 API 调用可能过重 |

---

### 2. x402：偏支付入口

x402 基于 HTTP 402 Payment Required，让服务端可以在 HTTP 响应中声明付款要求，客户端或 Agent 支付后再获取 API 或内容；Coinbase 文档称它用于直接通过 HTTP 进行即时、自动的 stablecoin 支付。([Coinbase Developer Docs][5]) x402 官网也把典型流程描述为：Agent 发起请求，收到 402 Payment Required，然后用稳定币支付，无需账号注册。([x402][6])

**适合本场景中的哪一段：**

* 购买单次地址查询 API；
* 购买某个数据源访问；
* Provider Agent 内部调用外部付费服务。

**不够的地方：**

* 它主要解决“访问前付款”；
* 不天然处理复杂任务的验收；
* 不天然处理 escrow、争议、仲裁；
* 对“报告质量是否合格”帮助有限。

**判断：x402 适合作为 Provider 调用数据源的 payment primitive，不适合作为整个任务市场的完整 commerce layer。**

---

### 3. MPP：偏机器间支付会话

Stripe 和 Tempo 在 2026 年 3 月发布 MPP，定位为开放的 machine-to-machine payments 标准，用于让 Agent 和服务以程序化方式协调支付，支持微交易、订阅/ recurring payments 等场景。([Stripe][7]) MultiversX 对 MPP 的介绍称，它被提交给 IETF，目标是让 Agent 在 HTTP 请求中为服务付款，并提到发布时已有多个服务采用。([MultiversX][8])

**适合本场景中的哪一段：**

* Provider Agent 调用链上数据 API；
* Evaluator Agent 按次收取验证费；
* 用户 Agent 对多个服务进行低额连续调用；
* 多次查询形成一个 session budget。

**不够的地方：**

* MPP 更偏 payment coordination；
* 它可以改善“Agent 怎样付钱”，但不直接解决“谁判断任务合格”；
* 对 escrow / dispute 的表达能力要依赖上层协议或业务系统。

**判断：MPP 适合做高频服务调用和 session-based budget，不是完整任务托管协议。**

---

### 4. ERC-8004：偏身份、发现、信任

ERC-8004 的标题是 Trustless Agents，目标是让 Agent 被发现，并通过 reputation 和 validation 建立信任。官方 EIP 页面说明它用于 “Discover agents and establish trust through reputation and validation”。([Ethereum Improvement Proposals][2])

**适合本场景中的哪一段：**

* 注册 Provider Agent；
* 注册 Evaluator Agent；
* 查询 Agent 历史声誉；
* 声明支持哪些验证方式；
* 防止用户 Agent 随机调用无身份、无历史记录的服务方。

**不够的地方：**

* 它不是完整的任务托管结算协议；
* 声誉可以被刷；
* 验证能力声明不等于真实能力；
* 高价值任务仍需要押金、slashing、evaluator 或仲裁机制。

**判断：ERC-8004 适合作为 Agent commerce 的“信任入口层”。**

---

### 5. ERC-8183：偏任务交易闭环

ERC-8183 的官方 EIP 页面将其定义为 Agentic Commerce，并建议需要链上 reputation / trust 时与 ERC-8004 集成。([Ethereum Improvement Proposals][3]) Ethereum Magicians 的讨论页把它描述为 job-based escrow：client 出资，provider 提交工作，evaluator 证明完成或拒绝。([Fellowship of Ethereum Magicians][4])

**适合本场景中的哪一段：**

* 创建任务；
* 托管资金；
* Provider 提交交付；
* Evaluator 验收；
* 通过则付款；
* 拒绝则退款；
* 和 ERC-8004 组合形成声誉记录。

**不够的地方：**

* 对低价值即时 API 调用可能太重；
* Evaluator 本身如何可信仍需额外机制；
* 仲裁复杂度没有凭空消失，只是被协议化、模块化；
* 真实世界服务质量判断仍可能需要人工介入。

**判断：ERC-8183 最适合作为这个案例的 commerce kernel。**


[1]: https://www.cobo.com/?utm_source=chatgpt.com "Cobo | Your trusted partner for custody and wallet ..."
[2]: https://eips.ethereum.org/EIPS/eip-8004?utm_source=chatgpt.com "ERC-8004: Trustless Agents"
[3]: https://eips.ethereum.org/EIPS/eip-8183?utm_source=chatgpt.com "ERC-8183: Agentic Commerce"
[4]: https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902?utm_source=chatgpt.com "ERC-8183: Agentic Commerce - ERCs"
[5]: https://docs.cdp.coinbase.com/x402/welcome?utm_source=chatgpt.com "Welcome to x402 - Coinbase Developer Documentation"
[6]: https://www.x402.org/?utm_source=chatgpt.com "x402 - Payment Required | Internet-Native Payments Standard"
[7]: https://stripe.com/blog/machine-payments-protocol?utm_source=chatgpt.com "Introducing the Machine Payments Protocol"
[8]: https://multiversx.com/blog/stripes-machine-payments-protocol-on-multiversx?utm_source=chatgpt.com "Stripe's Machine Payments Protocol on MultiversX"
