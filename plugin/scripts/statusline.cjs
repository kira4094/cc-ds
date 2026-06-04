#!/usr/bin/env node
/**
 * cc-ds statusline.
 * One-shot script: reads DeepSeek balance & cache hit rate from CC stdin,
 * outputs colored status line. Chainable via cc-statusline.
 *
 * Balance is fetched from DeepSeek API with 5-minute local cache.
 * Cache hit rate is calculated from CC's context_window.current_usage.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

const DS_DIR = path.join(os.homedir(), ".claude-ds");
const BALANCE_FILE = path.join(DS_DIR, "balance.json");
const BALANCE_TTL = 5 * 60 * 1000; // 5 minutes

// ANSI colors
const Y = "\x1b[38;2;255;185;15m"; // gold for ¥
const G = "\x1b[32m";               // green for hit rate
const N = "\x1b[0m";                // reset

function ensureDir(d) {
  try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch {}
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function writeJson(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

/** Fetch DeepSeek balance via API */
function fetchBalance(apiKey) {
  return new Promise((resolve) => {
    const req = https.get(
      "https://api.deepseek.com/user/balance",
      { headers: { "Authorization": "Bearer " + apiKey }, timeout: 5000 },
      (res) => {
        let d = "";
        res.on("data", (c) => d += c);
        res.on("end", () => {
          try {
            const j = JSON.parse(d);
            const balance = j.balance_infos?.[0]?.total_balance;
            if (balance !== undefined) {
              const entry = { balance: parseFloat(balance), fetchedAt: Date.now() };
              writeJson(BALANCE_FILE, entry);
              resolve(entry);
            } else {
              resolve(null);
            }
          } catch { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

/** Get cached balance or fetch new one */
function getBalance(apiKey) {
  const cached = readJson(BALANCE_FILE);
  if (cached && (Date.now() - cached.fetchedAt) < BALANCE_TTL) {
    return Promise.resolve(cached);
  }
  return fetchBalance(apiKey);
}

/** Read CC stdin JSON and extract cache stats */
function readStdin() {
  return new Promise((resolve) => {
    const c = [];
    process.stdin.on("data", (d) => c.push(d));
    process.stdin.on("end", () => resolve(Buffer.concat(c).toString()));
    setTimeout(() => resolve(""), 500);
  });
}

async function main() {
  const raw = await readStdin();
  let hitRate = null;
  let balanceStr = "";

  // Extract cache stats from CC stdin
  if (raw) {
    try {
      const j = JSON.parse(raw);
      const usage = j.context_window?.current_usage;
      if (usage) {
        const input = usage.input_tokens || 0;
        const cacheRead = usage.cache_read_input_tokens || 0;
        const total = input + cacheRead;
        if (total > 0) {
          hitRate = Math.round((cacheRead / total) * 100);
        }
      }
    } catch {}
  }

  // Get balance
  try {
    const settings = readJson(path.join(os.homedir(), ".claude", "settings.json"));
    const apiKey = settings?.env?.ANTHROPIC_AUTH_TOKEN;
    if (apiKey) {
      const b = await getBalance(apiKey);
      if (b) balanceStr = "¥" + b.balance.toFixed(2);
    }
  } catch {}

  // Build output
  const parts = [];
  if (balanceStr) parts.push(Y + balanceStr + N);
  if (hitRate !== null) parts.push(G + "hit " + hitRate + "%" + N);

  if (parts.length > 0) {
    process.stdout.write("[" + parts.join(" | ") + "]");
  } else {
    process.stdout.write("[" + Y + "ds" + N + "[" + G + "ON" + N + "]]");
  }
}

main();
