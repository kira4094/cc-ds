#!/usr/bin/env node
/**
 * cc-ds register-statusline.
 * Setup hook: writes our statusline.cjs into settings.json's statusLine.command,
 * positioned before other plugins so cc-ds appears first after the aggregator prefix.
 *
 * cc-statusline's guard detects the change, chains this as a new source,
 * and restores itself. The identity field keeps dedup stable across upgrades.
 *
 * Zero npm dependencies. Never crashes, always exits 0.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const STATUSLINE_PATH = path.join(__dirname, "statusline.cjs");
const CMD = `node "${STATUSLINE_PATH}"`;

try {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  const current = settings.statusLine?.command || "";

  // Only write if ours isn't already there
  if (!current.includes("cc-ds") && !current.includes(STATUSLINE_PATH)) {
    settings.statusLine = { type: "command", command: CMD };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
  }
} catch {
  // settings.json missing or invalid — skip silently
}
