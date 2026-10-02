// Camada de acesso aos dados.
// - Sem DATABASE_URL: tudo fica no arquivo data/database.json (desenvolvimento local).
// - Com DATABASE_URL: tudo fica no Postgres (produção / Vercel).
// Os models (userModel, sessionModel, pedidoModel...) usam só as funções exportadas aqui,
// então funcionam igual nos dois casos.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { getPool } = require("../utils/db");

const ROOT_DIR = path.join(__dirname, "..");
const usePostgres = Boolean(process.env.DATABASE_URL);

/* ======================================================================
   Arquivo JSON
   ====================================================================== */
const isServerless = Boolean(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = process.env.DATA_DIR || (isServerless ? path.join(os.tmpdir(), "justdoeat-data") : path.join(ROOT_DIR, "data"));
const DB_FILE = path.join(DATA_DIR, "database.json");

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], contacts: [], sessions: [], orders: [] }, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  const database = JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "{}");
  database.users = Array.isArray(database.users) ? database.users : [];
  database.contacts = Array.isArray(database.contacts) ? database.contacts : [];
  database.sessions = Array.isArray(database.sessions) ? database.sessions : [];
  database.orders = Array.isArray(database.orders) ? database.orders : [];
  return database;
}

function writeDatabase(database) {
  ensureDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

const jsonDriver = {
  async findUserByEmail(email) {
    return readDatabase().users.find((user) => user.email === email) || null;
  },
  async findUserById(id) {
    return readDatabase().users.find((user) => String(user.id) === String(id)) || null;
  },
  async createUser(user) {
    const database = readDatabase();
    database.users.push(user);
    writeDatabase(database);
    return user;
  },
  async listUsers() {
    return readDatabase().users;
  },

  async createSession(session) {
    const database = readDatabase();
    const now = Date.now();
    database.sessions = database.sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
    database.sessions.push(session);
    writeDatabase(database);
  },
  async findSession(id) {
    const session = readDatabase().sessions.find((item) => item.id === id);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
  },
  async deleteSession(id) {
    const database = readDatabase();
    database.sessions = database.sessions.filter((item) => item.id !== id);
    writeDatabase(database);
  },

  async createOrder(order) {
    const database = readDatabase();
    database.orders.push(order);
    writeDatabase(database);
    return order;
  },
  async findOrderById(id) {
    return readDatabase().orders.find((order) => order.id === id) || null;
  },
  async listOrders(filter = {}) {
    return readDatabase().orders
      .filter((order) => !filter.clienteId || String(order.clienteId) === String(filter.clienteId))
      .filter((order) => !filter.restauranteSlug || order.restauranteSlug === filter.restauranteSlug)
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  },
  async updateOrder(id, changes) {
    const database = readDatabase();
    const order = database.orders.find((item) => item.id === id);
    if (!order) return null;
    Object.assign(order, changes);
    writeDatabase(database);
    return order;
  },

  async createContact(contact) {
    const database = readDatabase();
    database.contacts.push(contact);
    writeDatabase(database);
    return contact;
  }
};

/* ======================================================================
   Postgres
   As tabelas são criadas se ainda não existirem. Uma tabela "usuarios"
   que já exista (com menos colunas) continua funcionando como está.
   Para passar a guardar telefone, endereço etc. numa tabela antiga, rode:
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cep TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_abertura TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_fechamento TEXT;
     ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT now();
   ====================================================================== */
const USER_COLUMNS = {
  nome: "nome",
  email: "email",
  passwordHash: "senha_hash",
  perfil: "perfil",
  telefone: "telefone",
  cpfCnpj: "cpf_cnpj",
  cep: "cep",
  endereco: "endereco",
  numero: "numero",
  cidade: "cidade",
  horarioAbertura: "horario_abertura",
  horarioFechamento: "horario_fechamento",
  createdAt: "criado_em"
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'Cliente',
  telefone TEXT,
  cpf_cnpj TEXT,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  cidade TEXT,
  horario_abertura TEXT,
  horario_fechamento TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  cliente_nome TEXT,
  restaurante_slug TEXT NOT NULL,
  restaurante_nome TEXT,
  itens JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  taxa_entrega NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  parcela_amiga NUMERIC(10,2) NOT NULL DEFAULT 0,
  endereco JSONB,
  pagamento TEXT,
  status TEXT NOT NULL,
  historico JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedidos_cliente_idx ON pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS pedidos_restaurante_idx ON pedidos (restaurante_slug);

CREATE TABLE IF NOT EXISTS contatos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let readyPromise = null;
let existingUserColumns = new Set(Object.values(USER_COLUMNS));

function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await getPool().query(SCHEMA_SQL);
      const result = await getPool().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'");
      if (result.rows.length) existingUserColumns = new Set(result.rows.map((row) => row.column_name));
    })().catch((error) => {
      readyPromise = null; // tenta de novo na próxima requisição
      throw error;
    });
  }
  return readyPromise;
}

async function query(sql, params) {
  await ready();
  return getPool().query(sql, params);
}

function rowToUser(row) {
  if (!row) return null;
  const user = { id: row.id };
  Object.entries(USER_COLUMNS).forEach(([field, column]) => {
    if (row[column] !== undefined && row[column] !== null) user[field] = row[column];
  });
  return user;
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    codigo: row.codigo,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    restauranteSlug: row.restaurante_slug,
    restauranteNome: row.restaurante_nome,
    itens: row.itens || [],
    subtotal: Number(row.subtotal),
    taxaEntrega: Number(row.taxa_entrega),
    total: Number(row.total),
    parcelaAmiga: Number(row.parcela_amiga),
    endereco: row.endereco || {},
    pagamento: row.pagamento,
    status: row.status,
    historico: row.historico || [],
    criadoEm: new Date(row.criado_em).toISOString(),
    atualizadoEm: new Date(row.atualizado_em).toISOString()
  };
}

const postgresDriver = {
  async findUserByEmail(email) {
    const result = await query("SELECT * FROM usuarios WHERE lower(email) = lower($1) LIMIT 1", [email]);
    return rowToUser(result.rows[0]);
  },
  async findUserById(id) {
    const result = await query("SELECT * FROM usuarios WHERE id::text = $1 LIMIT 1", [String(id)]);
    return rowToUser(result.rows[0]);
  },
  async createUser(user) {
    await ready();
    // Grava só as colunas que existem de verdade na tabela (compatível com a tabela antiga).
    const entries = Object.entries(USER_COLUMNS).filter(([field, column]) => user[field] !== undefined && existingUserColumns.has(column));
    const columns = entries.map(([, column]) => column);
    const values = entries.map(([field]) => user[field]);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const result = await getPool().query(
      `INSERT INTO usuarios (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      values
    );
    return rowToUser(result.rows[0]);
  },
  async listUsers() {
    const result = await query("SELECT * FROM usuarios ORDER BY id");
    return result.rows.map(rowToUser);
  },

  async createSession(session) {
    await query("DELETE FROM sessoes WHERE expira_em < now()");
    await query(
      "INSERT INTO sessoes (id, usuario_id, criado_em, expira_em) VALUES ($1, $2, $3, $4)",
      [session.id, String(session.userId), session.createdAt, session.expiresAt]
    );
  },
  async findSession(id) {
    const result = await query("SELECT * FROM sessoes WHERE id = $1 AND expira_em > now()", [id]);
    const row = result.rows[0];
    return row ? { id: row.id, userId: row.usuario_id } : null;
  },
  async deleteSession(id) {
    await query("DELETE FROM sessoes WHERE id = $1", [id]);
  },

  async createOrder(order) {
    await query(
      `INSERT INTO pedidos (id, codigo, cliente_id, cliente_nome, restaurante_slug, restaurante_nome, itens,
        subtotal, taxa_entrega, total, parcela_amiga, endereco, pagamento, status, historico, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        order.id, order.codigo, String(order.clienteId), order.clienteNome, order.restauranteSlug, order.restauranteNome,
        JSON.stringify(order.itens), order.subtotal, order.taxaEntrega, order.total, order.parcelaAmiga,
        JSON.stringify(order.endereco), order.pagamento, order.status, JSON.stringify(order.historico),
        order.criadoEm, order.atualizadoEm
      ]
    );
    return order;
  },
  async findOrderById(id) {
    const result = await query("SELECT * FROM pedidos WHERE id = $1", [id]);
    return rowToOrder(result.rows[0]);
  },
  async listOrders(filter = {}) {
    const where = [];
    const params = [];
    if (filter.clienteId) {
      params.push(String(filter.clienteId));
      where.push(`cliente_id = $${params.length}`);
    }
    if (filter.restauranteSlug) {
      params.push(filter.restauranteSlug);
      where.push(`restaurante_slug = $${params.length}`);
    }
    const result = await query(`SELECT * FROM pedidos ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY criado_em DESC`, params);
    return result.rows.map(rowToOrder);
  },
  async updateOrder(id, changes) {
    const result = await query(
      "UPDATE pedidos SET status = $2, historico = $3, atualizado_em = $4 WHERE id = $1 RETURNING *",
      [id, changes.status, JSON.stringify(changes.historico), changes.atualizadoEm]
    );
    return rowToOrder(result.rows[0]);
  },

  async createContact(contact) {
    await query(
      "INSERT INTO contatos (id, nome, email, mensagem, criado_em) VALUES ($1, $2, $3, $4, $5)",
      [contact.id, contact.nome, contact.email, contact.mensagem, contact.createdAt]
    );
    return contact;
  }
};

module.exports = {
  ...(usePostgres ? postgresDriver : jsonDriver),
  DB_FILE,
  ROOT_DIR,
  storageName: usePostgres ? "Postgres (DATABASE_URL)" : DB_FILE,
  usePostgres
};
