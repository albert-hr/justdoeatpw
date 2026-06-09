const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

async function registrar(req, res) {
  const { nome, email, senha } = req.body;
  try {
    // Verifica se email já existe
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1', [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Hash da senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senhaHash]
    );

    req.session.usuario = resultado.rows[0];
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar usuário' });
  }
}

async function login(req, res) {
  const { email, senha } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const usuario = resultado.rows[0];

    // Compara a senha com o hash salvo
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    // Salva na sessão (sem expor a senha_hash)
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
}

module.exports = { registrar, login };

module.exports = { registrar };