import assert from "node:assert/strict";
import test from "node:test";

import { analyzeContractInput, generateLearningCard } from "../src/coach.js";

const sampleSnippet = `
function withdraw(uint256 amount) external onlyOwner {
  require(amount <= balances[msg.sender], "too much");
  payable(msg.sender).call{value: amount}("");
}
`;

test("analyzes a Solidity-like input into concept signals", () => {
  const analysis = analyzeContractInput(sampleSnippet);

  assert.equal(analysis.signals.includes("permission_control"), true);
  assert.equal(analysis.signals.includes("value_transfer"), true);
  assert.equal(analysis.signals.includes("state_lookup"), true);
  assert.equal(analysis.readingQuestions.length >= 3, true);
});

test("generates an AI-assisted learning card from user input", async () => {
  const card = await generateLearningCard({
    input: sampleSnippet,
    learnerQuestion: "How do I read this withdraw function?",
  });

  assert.equal(card.inputSummary.includes("withdraw"), true);
  assert.equal(card.concept.includes("smart contract reading"), true);
  assert.equal(card.aiAssistedOutput.flashcards.length, 3);
  assert.equal(card.manualVerification.length >= 3, true);
  assert.equal(card.nextPracticeTask.includes("Rewrite"), true);
});

test("can delegate explanation drafting to an injected AI client", async () => {
  const calls = [];
  const card = await generateLearningCard({
    input: "function mint(address to, uint256 amount) external onlyOwner {}",
    learnerQuestion: "What should I notice?",
    aiClient: async (prompt) => {
      calls.push(prompt);
      return "AI draft: check who can mint, why the amount is bounded, and where supply is recorded.";
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].includes("What should I notice?"), true);
  assert.equal(card.aiAssistedOutput.explanation.includes("AI draft"), true);
  assert.equal(card.source, "injected-ai-client");
});
