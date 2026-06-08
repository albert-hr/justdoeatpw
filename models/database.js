const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const isServerless = Boolean(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = process.env.DATA_DIR || (isServerless ? path.join(os.tmpdir(), "justdoeat-data") : path.join(ROOT_DIR, "data"));
const DB_FILE = path.join(DATA_DIR, "database.json");

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], contacts: [] }, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDatabase(database) {
  ensureDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

module.exports = {
  DB_FILE,
  ensureDatabase,
  readDatabase,
  ROOT_DIR,
  writeDatabase
};
