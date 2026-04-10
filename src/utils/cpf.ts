export function validarCPF(cpf: string): boolean {
    // Remove non-numeric characters
    cpf = cpf.replace(/\D/g, '');

    // Check if it has 11 digits
    if (cpf.length !== 11) {
        return false;
    }

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) {
        return false;
    }

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[10])) {
        return false;
    }

    return true;
}