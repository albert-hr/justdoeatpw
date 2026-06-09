const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./utils/db');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Sessão persistida no Neon
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Rotas de autenticação
const { registrar, login } = require('./controllers/usuarioController');
app.post('/api/register', registrar);
app.post('/api/login', login);

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  res.json({ user: req.session.usuario });
});

// Servir HTMLs da pasta views
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', req.params.page + '.html'));
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const http = require('http');
const server = http.createServer(app);
module.exports = (req, res) => app(req, res);
