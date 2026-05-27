# Research Report Agent

## 1. Identity：它是谁

| 字段       | 内容                                 |
| -------- | ---------------------------------- |
| Agent 名称 | Research Report Agent              |
| Agent ID | `agent:demo:research-report-agent` |
| 类型       | 研究报告生成 agent                       |
| 维护方      | Demo Team                          |
| 版本       | `v0.1.0`                           |
| 使用场景     | 根据用户给定主题，搜索资料、总结信息、生成结构化研究报告       |
| 目标用户     | 学习者、研究者、产品经理、开发者                   |
| 责任边界     | 辅助资料整理和分析，不替代专家判断，不保证资料绝对完整        |
| 权限边界     | 只能搜索、读取、总结、生成报告；不能自动发布、付款、修改外部系统数据 |

**核心定义：**

> Research Report Agent 是一个学习 demo agent，用于根据用户输入的研究主题，调用搜索、阅读、总结和验证工具，生成带有证据链的结构化研究报告。

---

## 2. Capability：它能做什么

| Capability           | 说明                            | 风险等级 |
| -------------------- | ----------------------------- | ---- |
| Topic Understanding  | 理解用户研究主题，并拆解成子问题              | 低    |
| Source Search        | 搜索相关资料、文章、文档或论文               | 中    |
| Source Reading       | 读取网页、PDF、文档内容                 | 中    |
| Source Summarization | 总结每个资料源的核心观点                  | 中    |
| Claim Extraction     | 从资料中提取关键论点                    | 中    |
| Citation Mapping     | 把关键结论映射到对应来源                  | 高    |
| Report Generation    | 生成 Markdown / JSON / PDF 风格报告 | 中    |
| Gap Detection        | 标记缺失资料、冲突信息和未验证结论             | 高    |
| Human Review Support | 生成供人工审核的检查清单                  | 低    |

---

## 3. 输入与输出

## 输入

| 输入类型 | 示例                        |
| ---- | ------------------------- |
| 研究主题 | “比较 MCP 和 A2A 的区别”        |
| 研究目标 | “写一份适合初学者理解的学习笔记”         |
| 输出格式 | Markdown、表格、JSON、短报告      |
| 资料偏好 | 官方文档、GitHub、论文、EIP、技术博客   |
| 深度要求 | 入门、进阶、技术细节                |
| 限制条件 | 只用官方来源、不超过 3000 字、必须包含对比表 |
| 时间范围 | 最近一年、长期稳定资料、不限制时间         |
| 语言   | 中文、英文、双语                  |

示例输入：

```json
{
  "topic": "Compare MCP and A2A",
  "goal": "Explain which one is suitable for tool calling and which one is suitable for agent collaboration",
  "depth": "beginner",
  "source_preference": ["official_docs", "github"],
  "output_format": "markdown",
  "constraints": {
    "include_comparison_table": true,
    "include_failure_points": true,
    "max_words": 2000
  }
}
```

---

## 输出

| 输出类型   | 示例                           |
| ------ | ---------------------------- |
| 研究问题拆解 | 这个主题应该从哪些子问题入手               |
| 资料列表   | 找到哪些来源、来源可信度如何               |
| 来源摘要   | 每个资料源说了什么                    |
| 核心观点   | 主要结论和判断                      |
| 对比表格   | MCP vs A2A / ERC-8004 vs MPP |
| 证据映射   | 哪个结论来自哪个来源                   |
| 风险说明   | 哪些地方可能有误、需要人工确认              |
| 最终报告   | 一份结构化研究报告                    |

示例输出结构：

```json
{
  "task_id": "task_001",
  "status": "completed",
  "report": {
    "title": "MCP vs A2A: Interface Layer vs Collaboration Layer",
    "summary": "MCP is mainly used for connecting agents to tools and context, while A2A is mainly used for agent-to-agent communication.",
    "sections": [
      "Background",
      "Core Concepts",
      "Comparison Table",
      "Use Cases",
      "Risks",
      "Conclusion"
    ]
  },
  "verification": {
    "source_count": 5,
    "claims_with_sources": 12,
    "claims_without_sources": 1,
    "confidence": "medium"
  }
}
```

---

## 4. 协作对象

Research Report Agent 本身可以是一个主控 agent，也可以拆成多个子 agent 协作。

## 协作对象一：Search Agent

| 项目   | 内容                |
| ---- | ----------------- |
| 作用   | 搜索资料              |
| 输入   | 关键词、资料范围、时间范围     |
| 输出   | 候选来源列表            |
| 协作方式 | A2A / 内部任务调用      |
| 失败点  | 搜索结果不足、结果过时、来源质量低 |

---

## 协作对象二：Reader Agent

| 项目   | 内容                |
| ---- | ----------------- |
| 作用   | 阅读网页、PDF、文档       |
| 输入   | 来源 URL、文档 ID、文件内容 |
| 输出   | 文档摘要、关键段落         |
| 协作方式 | MCP 工具调用 / A2A    |
| 失败点  | 无法访问文档、解析失败、上下文截断 |

---

## 协作对象三：Verifier Agent

| 项目   | 内容                           |
| ---- | ---------------------------- |
| 作用   | 检查结论是否有来源支持                  |
| 输入   | 报告草稿、claim 列表、来源列表           |
| 输出   | 已验证 claim、未验证 claim、冲突 claim |
| 协作方式 | A2A                          |
| 失败点  | 错误匹配来源、遗漏反例、把弱证据当强证据         |

---

## 协作对象四：Writer Agent

| 项目   | 内容                         |
| ---- | -------------------------- |
| 作用   | 生成最终报告                     |
| 输入   | 资料摘要、验证结果、输出格式             |
| 输出   | Markdown / JSON / PDF 风格报告 |
| 协作方式 | A2A / 内部函数调用               |
| 失败点  | 报告结构混乱、过度推断、没有标明不确定性       |

---

## 协作对象五：Human Reviewer

| 项目   | 内容              |
| ---- | --------------- |
| 作用   | 最终人工审核          |
| 输入   | 报告、引用、风险提示      |
| 输出   | 通过、修改、退回重写      |
| 协作方式 | UI 操作           |
| 失败点  | 人工审核粗略、没有检查原始来源 |

---

## 5. 如何被调用

## 调用方式一：自然语言调用

用户输入：

```text
帮我研究 ERC-8004 是什么，并比较它和 MPP 分别解决什么问题。
```

Agent 执行：

```text
1. 理解研究主题
2. 拆解问题
3. 调用 Search Agent 搜索资料
4. 调用 Reader Agent 阅读资料
5. 调用 Verifier Agent 检查结论
6. 调用 Writer Agent 生成报告
7. 返回带风险提示的最终结果
```

---

## 调用方式二：API 调用

```http
POST /agents/research-report-agent/tasks
Content-Type: application/json
```

```json
{
  "task_type": "research_report",
  "topic": "ERC-8004 vs MPP",
  "depth": "beginner",
  "source_preference": ["official_docs", "eip"],
  "output_format": "markdown",
  "requirements": {
    "include_comparison_table": true,
    "include_failure_points": true,
    "include_confidence_level": true
  }
}
```

---

## 调用方式三：Agent-to-Agent 调用

另一个 agent 可以调用它：

```json
{
  "from_agent": "agent:demo:course-assistant",
  "to_agent": "agent:demo:research-report-agent",
  "task": {
    "type": "generate_learning_note",
    "topic": "MCP, A2A, ERC-8004, MPP",
    "format": "structured_markdown"
  }
}
```

---

## 6. 如何收费

因为这是学习 demo，不建议一开始接真实支付。可以用**模拟 credit** 表示付费逻辑。

| 收费方式            | 设计                           | 是否真实收费 |
| --------------- | ---------------------------- | ------ |
| Free Demo       | 每个用户免费试用 10 次                | 否      |
| Demo Credits    | 每次任务消耗 credits               | 否      |
| Per Task        | 短报告 5 credits，长报告 15 credits | 否      |
| API Metering    | 按搜索次数、读取文档数、生成字数计费           | 模拟     |
| Machine Payment | 后续可用 MPP 模拟机器支付              | 可选     |

示例：

```json
{
  "pricing": {
    "model": "demo_credits",
    "real_payment_enabled": false,
    "free_credits": 100,
    "cost": {
      "short_report": 5,
      "long_report": 15,
      "source_verification": 10
    }
  }
}
```

---

## 7. 如何被验证

验证要分为三层：**格式验证、证据验证、结果验证**。

| 验证层级     | 验证内容         | 方法                           |
| -------- | ------------ | ---------------------------- |
| 格式验证     | 输出是否符合结构     | JSON Schema / Markdown 模板检查  |
| 来源验证     | 引用是否存在、是否可访问 | URL 检查、文档 ID 检查              |
| Claim 验证 | 每个关键结论是否有证据  | claim-source mapping         |
| 冲突验证     | 不同资料是否存在矛盾   | conflicting claims detection |
| 人工验证     | 用户是否认可报告质量   | rating / review              |
| 历史验证     | 过去任务表现如何     | reputation record            |

示例验证结果：

```json
{
  "task_id": "task_001",
  "verification_result": {
    "format_valid": true,
    "source_links_valid": true,
    "total_claims": 15,
    "claims_with_sources": 13,
    "claims_without_sources": 2,
    "conflicting_claims": 1,
    "human_review_required": true,
    "confidence": "medium"
  },
  "warnings": [
    "Two claims do not have strong primary sources.",
    "One section contains conflicting information and needs human review."
  ]
}
```

---

## 8. Reputation：信誉如何积累

这个 demo 的 reputation 不需要一开始上链，可以先用本地数据库记录。

| Reputation 信号          | 说明      |
| ---------------------- | ------- |
| completed_tasks        | 完成任务数   |
| failed_tasks           | 失败任务数   |
| average_rating         | 用户平均评分  |
| citation_accuracy      | 引用准确率   |
| unsupported_claim_rate | 无来源结论比例 |
| retry_rate             | 需要重跑的比例 |
| human_acceptance_rate  | 人工审核通过率 |

示例：

```json
{
  "agent_id": "agent:demo:research-report-agent",
  "reputation": {
    "completed_tasks": 128,
    "failed_tasks": 9,
    "average_rating": 4.4,
    "citation_accuracy": "medium",
    "unsupported_claim_rate": "low",
    "human_acceptance_rate": "high"
  }
}
```

---

## 9. 失败点与处理方式

| 失败点    | 示例                 | 处理方式                       |
| ------ | ------------------ | -------------------------- |
| 输入不清晰  | 用户只说“研究一下 AI”      | 返回 `INPUT_REQUIRED`，要求补充范围 |
| 搜索结果不足 | 找不到可靠资料            | 返回部分结果，并标记资料不足             |
| 来源质量低  | 搜到大量营销文            | 降低可信度，提示用户                 |
| 文档无法访问 | 链接失效、PDF 无法读取      | 标记为 `SOURCE_UNAVAILABLE`   |
| 摘要失真   | 总结偏离原文             | 进入 Verifier Agent 检查       |
| 引用错误   | claim 和 source 不匹配 | 标记为 unsupported claim      |
| 信息冲突   | 两个来源说法不同           | 并列展示冲突，不强行下结论              |
| 报告跑题   | 输出偏离研究目标           | 允许重跑                       |
| 格式错误   | JSON 无法解析          | 自动重新生成                     |
| 过度推断   | 把弱证据写成强结论          | 降低置信度，要求人工审核               |

失败响应示例：

```json
{
  "task_id": "task_002",
  "status": "failed",
  "failure_type": "INSUFFICIENT_SOURCES",
  "reason": "Not enough reliable sources were found for the requested topic.",
  "recoverable": true,
  "next_action": "Broaden the source range or allow secondary sources.",
  "charge_policy": "No credits charged before report generation."
}
```

---

## 10. 完整 Agent Profile JSON 草图

```json
{
  "agent_id": "agent:demo:research-report-agent",
  "name": "Research Report Agent",
  "version": "0.1.0",
  "maintainer": "Demo Team",
  "description": "A demo agent that searches, summarizes, verifies, and writes structured research reports.",
  "identity": {
    "type": "research_agent",
    "owner": "Demo Team",
    "responsibility_boundary": [
      "Assist with research and report generation",
      "Do not replace expert judgment",
      "Do not guarantee complete coverage of all sources"
    ],
    "permission_boundary": [
      "Can search public sources",
      "Can read uploaded documents",
      "Can generate reports",
      "Cannot publish content automatically",
      "Cannot make payments automatically"
    ]
  },
  "capabilities": [
    {
      "id": "topic_understanding",
      "description": "Parse user research goals and decompose them into sub-questions.",
      "input": ["topic", "goal", "constraints"],
      "output": ["research_scope", "sub_questions"],
      "risk_level": "low"
    },
    {
      "id": "source_search",
      "description": "Find relevant documents, articles, papers, or official references.",
      "input": ["keywords", "source_preference", "time_range"],
      "output": ["source_list"],
      "risk_level": "medium"
    },
    {
      "id": "source_reading",
      "description": "Read and extract content from webpages, PDFs, or documents.",
      "input": ["source_list"],
      "output": ["source_content", "source_metadata"],
      "risk_level": "medium"
    },
    {
      "id": "source_summarization",
      "description": "Summarize each source and extract key points.",
      "input": ["source_content"],
      "output": ["source_summaries"],
      "risk_level": "medium"
    },
    {
      "id": "claim_verification",
      "description": "Check whether important claims are supported by sources.",
      "input": ["claims", "sources"],
      "output": ["verified_claims", "unsupported_claims", "conflicting_claims"],
      "risk_level": "high"
    },
    {
      "id": "report_generation",
      "description": "Generate a structured research report.",
      "input": ["research_scope", "source_summaries", "verified_claims"],
      "output": ["report"],
      "risk_level": "medium"
    }
  ],
  "input_schema": {
    "topic": "string",
    "goal": "string",
    "depth": "beginner | intermediate | advanced",
    "source_preference": ["official_docs", "github", "paper", "blog"],
    "output_format": "markdown | json | pdf_style",
    "constraints": {
      "max_words": "number",
      "include_citations": "boolean",
      "include_comparison_table": "boolean"
    }
  },
  "output_schema": {
    "task_id": "string",
    "status": "completed | failed | partial",
    "report": "string",
    "sources": "array",
    "claim_source_mapping": "array",
    "warnings": "array",
    "confidence": "high | medium | low"
  },
  "interfaces": {
    "natural_language": true,
    "api_endpoint": "/agents/research-report-agent/tasks",
    "mcp_tools": [
      "web_search",
      "document_reader",
      "citation_checker",
      "markdown_exporter"
    ],
    "a2a_collaborators": [
      "search_agent",
      "reader_agent",
      "verifier_agent",
      "writer_agent"
    ]
  },
  "pricing": {
    "model": "demo_credits",
    "real_payment_enabled": false,
    "free_credits": 100,
    "cost_per_short_report": 5,
    "cost_per_long_report": 15,
    "cost_per_verification": 10
  },
  "verification": {
    "format_schema_check": true,
    "source_link_check": true,
    "claim_source_mapping": true,
    "conflict_detection": true,
    "human_rating": true
  },
  "reputation": {
    "metrics": [
      "completed_tasks",
      "failed_tasks",
      "average_rating",
      "citation_accuracy",
      "unsupported_claim_rate",
      "human_acceptance_rate"
    ]
  },
  "failure_policy": {
    "unclear_input": "ask_for_clarification",
    "insufficient_sources": "return_partial_result_with_warning",
    "source_unavailable": "mark_source_as_unavailable",
    "conflicting_sources": "show_conflict_and_confidence_level",
    "invalid_citation": "mark_claim_as_unverified",
    "format_error": "retry_generation",
    "over_inference": "downgrade_confidence_and_request_human_review"
  }
}
```

---

## 11. MCP vs A2A

## MCP 适合解决什么

MCP 更适合解决：

> **Agent 如何连接工具、数据源和外部系统。**

在这个 demo 里，MCP 可以连接：

| MCP Tool              | 用途         |
| --------------------- | ---------- |
| Web Search Tool       | 搜索资料       |
| Document Reader Tool  | 读取网页 / PDF |
| Citation Checker Tool | 检查引用       |
| Markdown Export Tool  | 导出报告       |
| Storage Tool          | 保存任务记录     |

例子：

```text
Research Report Agent 需要读取一份 PDF。
它不是自己实现 PDF 解析，而是通过 MCP 调用 Document Reader Tool。
```

**MCP 的核心价值：让 agent 获得工具能力。**

---

## A2A 适合解决什么

A2A 更适合解决：

> **Agent 与 Agent 之间如何交换任务、状态和结果。**

在这个 demo 里，A2A 可以这样工作：

```text
Research Report Agent
  → Search Agent：搜索资料
  → Reader Agent：阅读资料
  → Verifier Agent：验证 claim
  → Writer Agent：生成报告
```

每个 agent 可以有自己的 profile、capability 和失败处理。

例子：

```json
{
  "from": "research_report_agent",
  "to": "verifier_agent",
  "task": {
    "type": "verify_claims",
    "claims": [
      "MCP is mainly used for tool and context integration.",
      "A2A is mainly used for agent-to-agent collaboration."
    ],
    "sources": ["source_001", "source_002"]
  }
}
```

**A2A 的核心价值：让多个 agent 组成协作网络。**

---

## 12. MCP vs A2A 对比

| 维度        | MCP                       | A2A                                     |
| --------- | ------------------------- | --------------------------------------- |
| 核心问题      | Agent 如何调用工具              | Agent 如何与另一个 agent 协作                   |
| 连接对象      | 工具、数据源、API、文件系统           | 其他 agent                                |
| 典型动作      | search、read、write、execute | assign task、return status、send artifact |
| 本 demo 用途 | 搜索资料、读取文档、检查引用            | Search / Reader / Verifier / Writer 分工  |
| 风险        | 工具权限过大、数据泄露、工具输出不可信       | 任务边界不清、责任归属不清、状态同步失败                    |
| 适合阶段      | MVP 早期就可以接入               | 单 agent 跑通后再引入                          |

**判断规则：**

* 如果问题是“agent 怎么使用某个工具”，选 MCP。
* 如果问题是“agent 怎么和另一个 agent 分工协作”，选 A2A。
