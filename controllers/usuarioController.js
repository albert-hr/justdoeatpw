const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

async function registrar(req, res) {
  const { nome, email, senha, perfil } = req.body;
  try {
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1', [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
      [nome, email, senhaHash, perfil || 'Cliente']
    );

    req.session.usuario = resultado.rows[0];

    const redirectTo = perfil === 'Restaurante' ? '/dashboardv2.html' : '/meu-perfil.html';
    return res.status(201).json({ redirectTo, user: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
}

async function login(req, res) {
  const { email, senha } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    };

    const redirectTo = usuario.perfil === 'Restaurante'
      ? '/dashboardv2.html'
      : usuario.perfil === 'admin'
      ? '/admin.html'
      : '/meu-perfil.html';

    return res.status(200).json({ redirectTo, user: req.session.usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

module.exports = { registrar, login };
