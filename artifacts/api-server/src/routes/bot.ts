import { Router } from "express";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_DIR = path.resolve(__dirname, "../../../../bot");

interface BotInfo {
  pid: number | null;
  username: string | null;
  id: string | null;
  guilds: number | null;
  commands: number | null;
  version: string | null;
  startedAt: number | null;
}

let botProcess: ChildProcess | null = null;
let botInfo: BotInfo = {
  pid: null,
  username: null,
  id: null,
  guilds: null,
  commands: null,
  version: null,
  startedAt: null,
};
const logBuffer: string[] = [];
const MAX_LOGS = 200;

function addLog(line: string) {
  logBuffer.push(line);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}

function parseReadyLog(line: string) {
  const nomMatch = line.match(/Nom\s*:\s*(.+)/);
  const idMatch = line.match(/ID\s*:\s*(.+)/);
  const verMatch = line.match(/Version\s*:\s*(.+)/);
  const cmdsMatch = line.match(/Cmds\s*:\s*(\d+)/);
  if (nomMatch) botInfo.username = nomMatch[1].trim();
  if (idMatch) botInfo.id = idMatch[1].trim();
  if (verMatch) botInfo.version = verMatch[1].trim();
  if (cmdsMatch) botInfo.commands = parseInt(cmdsMatch[1]);
}

function stopCurrentBot(): Promise<void> {
  return new Promise((resolve) => {
    if (!botProcess) return resolve();
    const proc = botProcess;
    botProcess = null;
    botInfo = { pid: null, username: null, id: null, guilds: null, commands: null, version: null, startedAt: null };
    proc.removeAllListeners();
    try {
      proc.kill("SIGTERM");
      setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch {}
        resolve();
      }, 2000);
      proc.on("exit", () => resolve());
    } catch {
      resolve();
    }
  });
}

router.get("/status", (_req, res) => {
  const running = botProcess !== null && botProcess.exitCode === null;
  res.json({
    running,
    username: botInfo.username,
    id: botInfo.id,
    guilds: botInfo.guilds,
    commands: botInfo.commands,
    version: botInfo.version,
    uptime: botInfo.startedAt ? Math.floor((Date.now() - botInfo.startedAt) / 1000) : null,
    pid: botInfo.pid,
  });
});

router.post("/start", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string" || token.trim().length < 10) {
    res.status(400).json({ error: "Token invalide" });
    return;
  }

  await stopCurrentBot();
  addLog("⏳ Démarrage du bot...");

  const proc = spawn("node", ["index.js"], {
    cwd: BOT_DIR,
    env: { ...process.env, DISCORD_TOKEN: token.trim() },
  });

  botProcess = proc;
  botInfo = { pid: proc.pid ?? null, username: null, id: null, guilds: null, commands: null, version: null, startedAt: Date.now() };

  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      addLog(line);
      parseReadyLog(line);
    }
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      addLog("[ERR] " + line);
    }
  });

  proc.on("exit", (code) => {
    addLog(`⚠️ Bot arrêté (code: ${code})`);
    if (botProcess === proc) {
      botProcess = null;
      botInfo = { pid: null, username: null, id: null, guilds: null, commands: null, version: null, startedAt: null };
    }
  });

  await new Promise((r) => setTimeout(r, 1500));

  const running = botProcess !== null && botProcess.exitCode === null;
  res.json({
    running,
    username: botInfo.username,
    id: botInfo.id,
    guilds: botInfo.guilds,
    commands: botInfo.commands,
    version: botInfo.version,
    uptime: botInfo.startedAt ? Math.floor((Date.now() - botInfo.startedAt) / 1000) : null,
    pid: botInfo.pid,
  });
});

router.post("/stop", async (_req, res) => {
  addLog("🛑 Arrêt du bot demandé...");
  await stopCurrentBot();
  res.json({
    running: false,
    username: null,
    id: null,
    guilds: null,
    commands: null,
    version: null,
    uptime: null,
    pid: null,
  });
});

router.get("/logs", (_req, res) => {
  res.json({ lines: [...logBuffer] });
});

export default router;
