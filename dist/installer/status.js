import { getDb } from "../db.js";
export function getWorkflowStatus(query) {
    const db = getDb();
    // Try exact match first, then substring match, then prefix match
    let run = db.prepare("SELECT * FROM runs WHERE LOWER(task) = LOWER(?) ORDER BY created_at DESC LIMIT 1").get(query);
    if (!run) {
        run = db.prepare("SELECT * FROM runs WHERE LOWER(task) LIKE '%' || LOWER(?) || '%' ORDER BY created_at DESC LIMIT 1").get(query);
    }
    // Also try matching by run ID (prefix or full)
    if (!run) {
        run = db.prepare("SELECT * FROM runs WHERE id LIKE ? || '%' ORDER BY created_at DESC LIMIT 1").get(query);
    }
    if (!run) {
        const allRuns = db.prepare("SELECT id, task, status, created_at FROM runs ORDER BY created_at DESC LIMIT 20").all();
        const available = allRuns.map((r) => `  [${r.status}] ${r.id.slice(0, 8)} ${r.task.slice(0, 60)}`);
        return {
            status: "not_found",
            message: available.length
                ? `No run matching "${query}". Recent runs:\n${available.join("\n")}`
                : "No workflow runs found.",
        };
    }
    const steps = db.prepare("SELECT * FROM steps WHERE run_id = ? ORDER BY step_index ASC").all(run.id);
    return { status: "ok", run, steps };
}
export function listRuns() {
    const db = getDb();
    return db.prepare("SELECT * FROM runs ORDER BY created_at DESC").all();
}
