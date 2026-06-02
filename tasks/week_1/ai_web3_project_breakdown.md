# AI x Web3 项目拆解：Bittensor 与 Ritual / Infernet

这份笔记选择两个 AI x Web3 相关对象：

1. **Bittensor**：把 AI 任务拆成多个子网，用链上激励协调矿工、验证者和质押者。
2. **Ritual / Infernet**：让智能合约可以请求链下 AI 或异构计算，并把结果返回链上使用。

我的关注点不是代币价格，而是：AI 能力为什么需要 Web3 机制，Web3 机制到底解决了什么，以及哪些材料可以被外部验证。

## 1. Bittensor

### 它在解决什么问题

Bittensor 想解决的是“AI 能力如何以开放市场方式生产、评估和分配激励”的问题。

传统 AI 服务通常由中心化公司控制模型、算力、数据和评价标准。Bittensor 的思路是把网络拆成很多 **subnet**：每个 subnet 定义一种要生产的数字商品或 AI 相关服务，比如模型推理、数据处理、搜索、预测或其他专门任务。矿工提供结果，验证者评价结果，链上根据评价和质押流向分配激励。

### AI 部分是什么

Bittensor 的 AI 部分主要体现在 subnet 的任务本身：

- 矿工运行模型、数据服务或其他 AI/计算流程，响应验证者或应用的请求。
- 验证者按照 subnet 代码仓库里的规则，对矿工输出进行打分。
- 不同 subnet 可以面向不同 AI 商品，而不是让一个统一模型承担所有任务。

这里的关键不是“链上直接训练大模型”，而是把 AI 工作的生产和评价组织成可竞争的网络。

### Web3 部分是什么

Bittensor 的 Web3 部分包括：

- **Subtensor 链**：承载 Bittensor 的链上逻辑、共识、账户、TAO 转移和神经元信息。
- **TAO 与 subnet 激励**：矿工、验证者和 subnet 创建者根据表现获得 emissions。
- **质押与权重**：TAO 持有人和验证者的 stake 会影响 subnet 与验证者的权重。
- **链上共识与分配**：验证者提交评分，Yuma Consensus 等机制用于决定奖励分配。

简单说，Web3 在这里提供的是开放参与、价值分配、质押信号和可公开检查的经济协调层。

### 可验证材料

- 官方 subnet 文档：<https://docs.learnbittensor.org/subnets/understanding-subnets>
- 官方 Bittensor subnet 说明：<https://bittensor.com/content/subnets-dive>
- Subtensor 链代码仓库：<https://github.com/opentensor/subtensor>
- Bittensor SDK 代码仓库：<https://github.com/opentensor/bittensor>
- Bittensor 白皮书：<https://bittensor.org/wp-content/uploads/2024/02/bittensor.org-whitepaper.pdf>

### 我的判断、启发和疑问

我的判断是：Bittensor 最有价值的地方不是“把 AI 放上链”这个口号，而是把 AI 服务拆成可竞争、可激励、可持续迭代的市场结构。它让我意识到 AI x Web3 的一个方向是：Web3 不直接替代模型能力，而是解决谁来生产、谁来评价、谁来获得收益的问题。

我也有几个疑问：

- 验证者如何稳定判断“高质量 AI 输出”，尤其是开放式生成任务？
- subnet 的评价规则由创建者维护，是否会带来中心化或规则操纵风险？
- 代币激励是否真的长期鼓励有用 AI 服务，而不是短期套利和刷分？

## 2. Ritual / Infernet

### 它在解决什么问题

Ritual / Infernet 想解决的是“智能合约无法高效执行 AI 推理、机器学习、TEE、ZK 等复杂计算”的问题。

普通 EVM 智能合约适合确定性、低复杂度逻辑，但不适合直接跑 LLM、图像模型、ONNX 模型或复杂推理。Ritual 的方向是让链上应用可以请求链下或专门 sidecar 的计算，再把结果带回链上，让合约拥有更强的外部计算能力。

### AI 部分是什么

Ritual 的 AI 部分包括：

- AI inference sidecar，支持 LLM inference 和 classical ML inference。
- ONNX 模型推理，让合约相关应用可以调用标准机器学习模型。
- Infernet 节点处理链下 compute workload，例如模型推理、容器化任务或其他异构计算。
- 一些公开案例提到用 Stable Diffusion、LLM、classical ML 模型和 agent 连接链上应用。

这里的 AI 更像是“可被合约调用的计算服务”，重点在模型执行、请求编码、结果返回和未来的可验证计算。

### Web3 部分是什么

Ritual / Infernet 的 Web3 部分包括：

- EVM 智能合约可以发起计算请求。
- Infernet 节点作为链下计算执行方，把结果返回给链上合约。
- Ritual Chain / EVM++ 方向尝试用 precompile interface 和 sidecar 让异构计算成为链原生能力。
- 节点运行者可以专门服务 AI inference、ZK proving、TEE execution 等不同计算类型。

简单说，Web3 在这里提供的是合约入口、节点网络、结果回传、激励和可组合的链上应用接口。

### 可验证材料

- Ritual node runner 文档：<https://www.ritualfoundation.org/docs/using-ritual/ritual-for-node-runners>
- EVM++ Sidecars 概览：<https://www.ritualfoundation.org/docs/whats-new/evm%2B%2B-sidecars/overview>
- Classical ML / ONNX inference 文档：<https://www.ritualfoundation.org/docs/whats-new/evm%2B%2B-sidecars/ai-inference/classical-ml-inference>
- Ritual 时间线与 Infernet 说明：<https://www.ritualfoundation.org/docs/overview/early-to-everything>
- Ritual GitHub 组织：<https://github.com/ritual-net>
- Infernet Node 仓库：<https://github.com/ritual-net/infernet-node>

### 我的判断、启发和疑问

我的判断是：Ritual / Infernet 的价值在于把“AI 作为链外服务”推进到“AI 可以被链上合约按标准接口调用”。这比单纯做一个 AI bot 更接近 Web3 原生场景，因为最终消费者可能是合约、DeFi 协议、NFT mint 逻辑、链上 agent 或自动化策略。

它给我的启发是：AI x Web3 不一定要把模型、数据和计算全部放到链上。更现实的架构可能是：

1. 链上负责请求、结算、权限和状态。
2. 链下或 sidecar 负责高成本 AI 计算。
3. 通过证明、TEE、审计、节点信誉或多节点验证来降低信任成本。

我仍然关心几个问题：

- AI 推理结果如果影响资金流，用户如何确认结果不是错误、被操纵或过期？
- 如果计算发生在链下，验证成本、延迟和隐私之间如何取舍？
- 开发者是否真的需要“合约直接调用 AI”，还是很多场景用普通后端 + 签名确认已经足够？

## 横向对比

| 对象 | 更像在做什么 | AI 部分 | Web3 部分 | 最关键的验证点 |
| --- | --- | --- | --- | --- |
| Bittensor | AI 服务与评价的激励市场 | subnet 中的模型、数据服务、推理或其他 AI 商品 | Subtensor 链、TAO、质押、矿工/验证者、奖励分配 | subnet 规则、矿工输出质量、验证者评分是否可靠 |
| Ritual / Infernet | 合约可调用的 AI/异构计算层 | LLM、ONNX、classical ML、agent、sidecar 计算 | EVM 请求、节点网络、sidecar、结果回传、未来链原生计算 | 链下计算结果如何被验证和信任 |

## 总结

这两个对象代表了 AI x Web3 的两种不同路径：

- **Bittensor** 更偏市场机制：用 Web3 激励组织 AI 服务供给和评价。
- **Ritual / Infernet** 更偏基础设施：让链上应用能调用 AI 与复杂计算。

我从中学到的是，AI x Web3 的核心问题不是“有没有 AI 名字”或“有没有 token”，而是 Web3 是否解决了 AI 系统中的真实协调问题：开放参与、激励分配、权限边界、结果验证、抗审查、可组合性。如果只是把 AI 服务接进钱包或发一个 token，并不一定构成有意义的 AI x Web3。

## 来源链接

- Bittensor Understanding Subnets：<https://docs.learnbittensor.org/subnets/understanding-subnets>
- Bittensor Subnets Dive：<https://bittensor.com/content/subnets-dive>
- Opentensor Subtensor：<https://github.com/opentensor/subtensor>
- Opentensor Bittensor SDK：<https://github.com/opentensor/bittensor>
- Bittensor whitepaper：<https://bittensor.org/wp-content/uploads/2024/02/bittensor.org-whitepaper.pdf>
- Ritual for Node Runners：<https://www.ritualfoundation.org/docs/using-ritual/ritual-for-node-runners>
- Ritual EVM++ Sidecars Overview：<https://www.ritualfoundation.org/docs/whats-new/evm%2B%2B-sidecars/overview>
- Ritual Classical ML Inference：<https://www.ritualfoundation.org/docs/whats-new/evm%2B%2B-sidecars/ai-inference/classical-ml-inference>
- Ritual Early to Everything：<https://www.ritualfoundation.org/docs/overview/early-to-everything>
- Ritual GitHub：<https://github.com/ritual-net>
- Infernet Node：<https://github.com/ritual-net/infernet-node>
