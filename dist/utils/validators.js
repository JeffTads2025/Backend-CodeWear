"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordLevel = exports.validateCPF = exports.validateEmail = void 0;
// Validação de E-mail via Regex (Rubrica)
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;
// Validação de CPF Real (Algoritmo oficial)
const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/))
        return false;
    let add = 0;
    for (let i = 0; i < 9; i++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
        rev = 0;
    if (rev !== parseInt(cpf.charAt(9)))
        return false;
    add = 0;
    for (let i = 0; i < 10; i++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
        rev = 0;
    if (rev !== parseInt(cpf.charAt(10)))
        return false;
    return true;
};
exports.validateCPF = validateCPF;
// Validação de Nível de Senha (Mínimo 8 caracteres, letra e número)
const validatePasswordLevel = (password) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};
exports.validatePasswordLevel = validatePasswordLevel;
