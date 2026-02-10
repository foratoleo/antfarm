import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  console.log("Test: blue dark theme tokens are present in the dashboard markup...");
  const htmlPath = path.resolve("src/server/index.html");
  const html = await fs.readFile(htmlPath, "utf-8");
  const missing = [];

  if (!html.includes('[data-theme="dark-blue"]')) {
    missing.push("Missing blue dark theme token in CSS");
  }

  if (!html.includes("const THEMES = ['light', 'dark', 'dark-blue'];")) {
    missing.push("Theme cycle definition is missing the blue variant");
  }

  if (!html.includes("const ICONS = { light: '☀️', dark: '🌙', 'dark-blue': '🌊' };")) {
    missing.push("Theme icons map does not include the blue emoji");
  }

  if (missing.length) {
    throw new Error(`Blue dark theme validation failed:\n- ${missing.join('\n- ')}`);
  }

  console.log("PASS: Blue dark theme is wired into the dashboard");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
