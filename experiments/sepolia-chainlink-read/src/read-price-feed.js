const DEFAULT_RPC_URL = "https://ethereum-sepolia.publicnode.com";
const FEED_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const EXPLORER_URL = `https://sepolia.etherscan.io/address/${FEED_ADDRESS}`;

const SELECTORS = {
  decimals: "0x313ce567",
  description: "0x7284e416",
  latestRoundData: "0xfeaf968c",
};

async function rpcCall(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC error ${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result;
}

async function ethCall(rpcUrl, data) {
  return rpcCall(rpcUrl, "eth_call", [{ to: FEED_ADDRESS, data }, "latest"]);
}

function decodeUint(hex) {
  return BigInt(hex);
}

function decodeInt256(word) {
  const value = BigInt(`0x${word}`);
  const signBit = 1n << 255n;
  return (value & signBit) === 0n ? value : value - (1n << 256n);
}

function splitWords(hex) {
  const clean = hex.replace(/^0x/, "");
  const words = [];
  for (let index = 0; index < clean.length; index += 64) {
    words.push(clean.slice(index, index + 64));
  }
  return words;
}

function decodeString(hex) {
  const words = splitWords(hex);
  if (words.length < 2) {
    return "";
  }

  const length = Number(decodeUint(`0x${words[1]}`));
  const stringHex = words.slice(2).join("").slice(0, length * 2);
  return Buffer.from(stringHex, "hex").toString("utf8");
}

function decodeLatestRoundData(hex) {
  const [roundId, answer, startedAt, updatedAt, answeredInRound] = splitWords(hex);
  return {
    roundId: decodeUint(`0x${roundId}`).toString(),
    answer: decodeInt256(answer).toString(),
    startedAt: Number(decodeUint(`0x${startedAt}`)),
    updatedAt: Number(decodeUint(`0x${updatedAt}`)),
    answeredInRound: decodeUint(`0x${answeredInRound}`).toString(),
  };
}

function formatAnswer(answer, decimals) {
  const negative = answer.startsWith("-");
  const digits = negative ? answer.slice(1) : answer;
  const padded = digits.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function toIsoTime(timestamp) {
  return new Date(timestamp * 1000).toISOString();
}

async function main() {
  const rpcUrl = process.env.RPC_URL || DEFAULT_RPC_URL;
  const [decimalsHex, descriptionHex, latestHex] = await Promise.all([
    ethCall(rpcUrl, SELECTORS.decimals),
    ethCall(rpcUrl, SELECTORS.description),
    ethCall(rpcUrl, SELECTORS.latestRoundData),
  ]);

  const decimals = Number(decodeUint(decimalsHex));
  const description = decodeString(descriptionHex);
  const latestRoundData = decodeLatestRoundData(latestHex);

  const result = {
    network: "Ethereum Sepolia testnet",
    contractAddress: FEED_ADDRESS,
    explorerUrl: EXPLORER_URL,
    rpcUrl,
    calls: {
      decimals,
      description,
      latestRoundData,
      formattedAnswer: formatAnswer(latestRoundData.answer, decimals),
      updatedAtIso: toIsoTime(latestRoundData.updatedAt),
    },
    manualConfirmation: "No wallet confirmation was needed because all calls used eth_call view reads.",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
