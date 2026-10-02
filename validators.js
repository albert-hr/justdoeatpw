function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function isValidPhone(phone) {
  return /^\(\d{2}\) \d{5}-\d{4}$/.test(String(phone || ''));
}

function isValidCpfOrCnpj(value) {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
}

function isValidCep(cep) {
  return /^\d{5}-\d{3}$/.test(String(cep || ''));
}

module.exports = { isValidCep, isValidCpfOrCnpj, isValidEmail, isValidPhone };
