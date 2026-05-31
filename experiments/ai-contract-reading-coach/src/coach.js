const SIGNAL_RULES = [
  {
    signal: "permission_control",
    label: "Permission control",
    patterns: [/\bonly[A-Z]\w*\b/, /\brequire\s*\(/, /\bowner\b/i, /\brole\b/i],
    question: "Who is allowed to call this, and which modifier or require check enforces that boundary?",
  },
  {
    signal: "value_transfer",
    label: "Value transfer",
    patterns: [/\bpayable\b/, /\.call\s*\{\s*value\s*:/, /\.transfer\s*\(/, /\.send\s*\(/],
    question: "Can ETH or tokens move here, and what exact line changes custody?",
  },
  {
    signal: "state_lookup",
    label: "State lookup",
    patterns: [/\bmapping\b/, /\bbalances\s*\[/, /\[\s*msg\.sender\s*\]/, /\bstorage\b/],
    question: "Which state is read before the action, and could stale or missing state change the result?",
  },
  {
    signal: "supply_change",
    label: "Supply change",
    patterns: [/\bmint\b/i, /\bburn\b/i, /\b_totalSupply\b/, /\bsupply\b/i],
    question: "Does this create or destroy supply, and where is the supply invariant checked?",
  },
  {
    signal: "external_surface",
    label: "External surface",
    patterns: [/\bexternal\b/, /\bpublic\b/],
    question: "Is this callable from outside the contract, and what input can an attacker choose?",
  },
];

const DEFAULT_QUESTIONS = [
  "What is the caller trying to do in one sentence?",
  "Which assets, permissions, or state variables can change?",
  "What condition would make this function revert or behave unexpectedly?",
];

export function analyzeContractInput(input) {
  const normalizedInput = String(input ?? "").trim();
  if (!normalizedInput) {
    throw new Error("Input is required.");
  }

  const signals = SIGNAL_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(normalizedInput)))
    .map((rule) => rule.signal);

  const readingQuestions = [
    ...SIGNAL_RULES.filter((rule) => signals.includes(rule.signal)).map((rule) => rule.question),
    ...DEFAULT_QUESTIONS,
  ].slice(0, 6);

  return {
    signals,
    functionNames: extractFunctionNames(normalizedInput),
    readingQuestions,
    highlightedConcepts: SIGNAL_RULES
      .filter((rule) => signals.includes(rule.signal))
      .map((rule) => rule.label),
  };
}

export async function generateLearningCard({
  input,
  learnerQuestion = "Help me understand this Web3 snippet.",
  aiClient,
  useOpenAI = false,
} = {}) {
  const normalizedInput = String(input ?? "").trim();
  const analysis = analyzeContractInput(normalizedInput);
  const prompt = buildCoachPrompt({ input: normalizedInput, learnerQuestion, analysis });

  let explanation;
  let source;
  if (aiClient) {
    explanation = await aiClient(prompt);
    source = "injected-ai-client";
  } else if (useOpenAI) {
    explanation = await callOpenAI(prompt);
    source = "openai-responses-api";
  } else {
    explanation = draftLocalExplanation({ input: normalizedInput, learnerQuestion, analysis });
    source = "local-ai-assisted-template";
  }

  return {
    title: "AI Contract Reading Coach",
    source,
    inputSummary: summarizeInput(normalizedInput, analysis),
    learnerQuestion,
    concept: "smart contract reading as a repeatable AI-assisted workflow",
    detectedSignals: analysis.highlightedConcepts,
    aiAssistedOutput: {
      explanation,
      readingSteps: buildReadingSteps(analysis),
      flashcards: buildFlashcards(analysis),
      checklist: buildChecklist(analysis),
    },
    manualVerification: [
      "The analyzer uses lightweight text patterns, not a Solidity compiler.",
      "Manually verify every permission, value-transfer, and state-change conclusion in source code.",
      "Do not treat this as a security audit; use it as a learning scaffold before deeper review.",
    ],
    nextPracticeTask: "Rewrite the snippet as three comments: intent, boundary, and risk. Then compare your notes with the generated checklist.",
  };
}

export function formatLearningCard(card) {
  return [
    `# ${card.title}`,
    "",
    `Source: ${card.source}`,
    `Question: ${card.learnerQuestion}`,
    `Input summary: ${card.inputSummary}`,
    `Concept: ${card.concept}`,
    "",
    "## AI-assisted explanation",
    card.aiAssistedOutput.explanation,
    "",
    "## Reading steps",
    ...card.aiAssistedOutput.readingSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Flashcards",
    ...card.aiAssistedOutput.flashcards.map((cardItem) => `- Q: ${cardItem.q}\n  A: ${cardItem.a}`),
    "",
    "## Checklist",
    ...card.aiAssistedOutput.checklist.map((item) => `- [ ] ${item}`),
    "",
    "## Manual verification",
    ...card.manualVerification.map((item) => `- ${item}`),
    "",
    `Next practice: ${card.nextPracticeTask}`,
  ].join("\n");
}

function buildCoachPrompt({ input, learnerQuestion, analysis }) {
  return [
    "You are helping a beginner learn AI-assisted smart contract reading.",
    `Learner question: ${learnerQuestion}`,
    `Detected signals: ${analysis.signals.join(", ") || "none"}`,
    "Explain the snippet with: intent, boundaries, value/state movement, and one practice question.",
    "Snippet:",
    input,
  ].join("\n");
}

function draftLocalExplanation({ learnerQuestion, analysis }) {
  const names = analysis.functionNames.length > 0 ? analysis.functionNames.join(", ") : "this snippet";
  const signals = analysis.highlightedConcepts.length > 0
    ? analysis.highlightedConcepts.join(", ")
    : "general contract behavior";

  return [
    `For "${learnerQuestion}", start by naming the action: ${names}.`,
    `The main learning signal is ${signals}.`,
    "Read it like an execution trace: caller enters, checks run, state is read or changed, value may move, and the function either completes or reverts.",
    "The useful AI habit is not to trust the first explanation. Ask the model to point to exact lines, then manually verify those claims against the code.",
  ].join(" ");
}

function buildReadingSteps(analysis) {
  return [
    "Name the user intent in one sentence before judging safety.",
    ...analysis.readingQuestions.slice(0, 4),
    "Separate observed code facts from guesses that need compiler, tests, or docs.",
  ];
}

function buildFlashcards(analysis) {
  const primarySignal = analysis.highlightedConcepts[0] ?? "Contract behavior";
  return [
    {
      q: "What should AI help with during contract reading?",
      a: "Generate hypotheses, questions, and checklists; the learner still verifies line-by-line.",
    },
    {
      q: `Why does "${primarySignal}" matter?`,
      a: "It points to the boundary where user intent, permissions, assets, or state can change.",
    },
    {
      q: "What is the safest next step after an AI explanation?",
      a: "Trace exact code paths and mark unsupported claims before trusting the summary.",
    },
  ];
}

function buildChecklist(analysis) {
  const checklist = [
    "Identify caller and inputs.",
    "List every require, modifier, or implicit permission boundary.",
    "Trace state reads and writes.",
  ];

  if (analysis.signals.includes("value_transfer")) {
    checklist.push("Trace every ETH or token transfer and its failure behavior.");
  }

  if (analysis.signals.includes("supply_change")) {
    checklist.push("Check whether mint or burn paths preserve supply assumptions.");
  }

  checklist.push("Write one uncertainty to investigate with tests or documentation.");
  return checklist;
}

function extractFunctionNames(input) {
  return [...input.matchAll(/\bfunction\s+([A-Za-z_]\w*)\s*\(/g)].map((match) => match[1]);
}

function summarizeInput(input, analysis) {
  if (analysis.functionNames.length > 0) {
    return `Functions detected: ${analysis.functionNames.join(", ")}.`;
  }

  return input.length > 120 ? `${input.slice(0, 117)}...` : input;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when useOpenAI is true.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}.`);
  }

  const data = await response.json();
  return data.output_text ?? "No text output returned.";
}
