const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./utils/db');
const PgSession = require('connect-pg-simple')(session);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new PgSession({ pool, tableName: 'session' }),
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
  req.session.destroy(() => res.redirect('/login.html'));
});

app.get('/api/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  res.json({ user: req.session.usuario });
});

// Rota protegida do admin
app.get('/admin.html', (req, res) => {
  const perfil = req.session.usuario?.perfil?.toLowerCase();
  if (!perfil || perfil !== 'admin') {
    return res.redirect('/login.html?erro=acesso-negado');
  }
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Rota protegida de restaurante
app.get('/dashboardv2.html', (req, res) => {
  const perfil = req.session.usuario?.perfil?.toLowerCase();
  if (!perfil || perfil !== 'restaurante') {
    return res.redirect('/login.html?erro=acesso-negado');
  }
  res.sendFile(path.join(__dirname, 'views', 'dashboardv2.html'));
});

// Rota protegida de cliente
app.get('/meu-perfil.html', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login.html?erro=login-obrigatorio');
  }
  res.sendFile(path.join(__dirname, 'views', 'meu-perfil.html'));
});

// Servir demais HTMLs
app.get('/:page.html', (req, res) => {
  const file = path.join(__dirname, 'views', req.params.page + '.html');
  res.sendFile(file, (err) => {
    if (err) res.status(404).send('Página não encontrada');
  });
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

module.exports = (req, res) => app(req, res);
