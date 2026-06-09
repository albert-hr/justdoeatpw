const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./utils/db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessões persistidas no PostgreSQL (Neon)
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
  }
}));

const { handleRequest } = require("./routes/router");

module.exports = handleRequest;
