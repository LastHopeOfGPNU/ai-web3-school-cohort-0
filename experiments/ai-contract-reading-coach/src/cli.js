#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { formatLearningCard, generateLearningCard } from "./coach.js";

const SAMPLE = `
function withdraw(uint256 amount) external onlyOwner {
  require(amount <= balances[msg.sender], "too much");
  payable(msg.sender).call{value: amount}("");
}
`;

async function main() {
  const args = process.argv.slice(2);
  const useOpenAI = args.includes("--openai");
  const sampleMode = args.includes("--sample");
  const fileFlagIndex = args.indexOf("--file");
  const questionFlagIndex = args.indexOf("--question");

  let snippet;
  if (sampleMode) {
    snippet = SAMPLE;
  } else if (fileFlagIndex >= 0 && args[fileFlagIndex + 1]) {
    snippet = readFileSync(args[fileFlagIndex + 1], "utf8");
  } else {
    snippet = await promptForSnippet();
  }

  const learnerQuestion = questionFlagIndex >= 0 && args[questionFlagIndex + 1]
    ? args[questionFlagIndex + 1]
    : "How should I read this contract snippet?";

  const card = await generateLearningCard({
    input: snippet,
    learnerQuestion,
    useOpenAI,
  });

  console.log(formatLearningCard(card));
}

async function promptForSnippet() {
  const rl = createInterface({ input, output });
  try {
    console.log("Paste a Solidity snippet or Web3 action. Submit an empty line to generate the card.");
    const lines = [];
    while (true) {
      const line = await rl.question("> ");
      if (!line.trim()) {
        break;
      }
      lines.push(line);
    }

    const snippet = lines.join("\n").trim();
    if (!snippet) {
      throw new Error("No input provided.");
    }
    return snippet;
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
