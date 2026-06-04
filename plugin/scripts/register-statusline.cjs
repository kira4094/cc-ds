#!/usr/bin/env node
/**
 * cc-ds register-statusline.
 * Setup hook: writes our statusline.cjs into settings.json's statusLine.command.
 * Also writes our chain entry with priority: 0 into cc-statusline's sources.json
 * so cc-ds appears first after the aggregator prefix.
 *
 * cc-statusline's guard detects the change, chains this as a new source,
 * and restores itself. The identity field keeps dedup stable across upgrades.
 * Priority is preserved across guard updates (guard only touches path/command).
 *
 * Zero npm dependencies. Never crashes, always exits 0.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const SOURCES_PATH = path.join(os.homedir(), ".claude-statusline", "sources.json");
const STATUSLINE_PATH = path.join(__dirname, "statusline.cjs");
const CMD = `node "${STATUSLINE_PATH}"`;

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function deriveIdentity(cmd) {
  const m = cmd.match(/plugins[/\\]cache[/\\]([^/\\]+)[/\\]([^/\\]+)[/\\]/);
  if (m) return `plugin:${m[1]}/${m[2]}`;
  return null;
}

try {
  const settings = readJson(SETTINGS_PATH);
  if (!settings) process.exit(0);
  const current = settings.statusLine?.command || "";

  // Register as statusLine if not already
  if (!current.includes("cc-ds") && !current.includes(STATUSLINE_PATH)) {
    settings.statusLine = { type: "command", command: CMD };
    writeJson(SETTINGS_PATH, settings);
  }

  // Write/update our chain entry in cc-statusline sources.json with priority: 0
  if (fs.existsSync(SOURCES_PATH)) {
    const sources = readJson(SOURCES_PATH);
    if (sources && sources.chains) {
      const identity = deriveIdentity(CMD) || "plugin:cc-ds/cc-ds";
      const idx = sources.chains.findIndex(c => c.identity === identity);
      const entry = {
        label: "cc-ds",
        path: CMD,
        command: CMD,
        identity,
        priority: 0,
        detected: new Date().toISOString()
      };
      if (idx >= 0) {
        // Update existing — preserve priority
        Object.assign(sources.chains[idx], entry);
      } else {
        // Insert at beginning
        sources.chains.unshift(entry);
      }
      writeJson(SOURCES_PATH, sources);
    }
  }
} catch {
  // Silent exit on any error
}
