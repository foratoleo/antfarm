import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const LOG_DIR = path.join(os.homedir(), ".openclaw", "antfarm", "logs");
const LOG_FILE = path.join(LOG_DIR, "workflow.log");
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
async function ensureLogDir() {
    await fs.mkdir(LOG_DIR, { recursive: true });
}
async function rotateIfNeeded() {
    try {
        const stats = await fs.stat(LOG_FILE);
        if (stats.size > MAX_LOG_SIZE) {
            const rotatedPath = `${LOG_FILE}.1`;
            await fs.rename(LOG_FILE, rotatedPath);
        }
    }
    catch {
        // File doesn't exist yet, no rotation needed
    }
}
function formatEntry(entry) {
    const parts = [entry.timestamp, `[${entry.level.toUpperCase()}]`];
    if (entry.workflowId) {
        parts.push(`[${entry.workflowId}]`);
    }
    if (entry.runId) {
        parts.push(`[${entry.runId.slice(0, 8)}]`);
    }
    if (entry.stepId) {
        parts.push(`[${entry.stepId}]`);
    }
    parts.push(entry.message);
    return parts.join(" ");
}
export async function log(level, message, context) {
    await ensureLogDir();
    await rotateIfNeeded();
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    };
    const line = formatEntry(entry) + "\n";
    await fs.appendFile(LOG_FILE, line, "utf-8");
}
export const logger = {
    info: (msg, ctx) => log("info", msg, ctx),
    warn: (msg, ctx) => log("warn", msg, ctx),
    error: (msg, ctx) => log("error", msg, ctx),
    debug: (msg, ctx) => log("debug", msg, ctx),
};
export async function readRecentLogs(lines = 50) {
    try {
        const content = await fs.readFile(LOG_FILE, "utf-8");
        const allLines = content.trim().split("\n");
        return allLines.slice(-lines);
    }
    catch {
        return [];
    }
}
