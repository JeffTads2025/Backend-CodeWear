export function validarCPF(cpf: string): boolean {
    // Remove NÃO NUMERICOS
    cpf = cpf.replace(/\D/g, '');

    // SE TEM 11 NUMEROS
    if (cpf.length !== 11) {
        return false;
    }

    // VERIFICA SE TODOS OS NUMEROS SÃO IGUASI 
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // 1 VALIDA PRIMEIRO 
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) {
        return false;
    }

    // 2 VALIDAÇÃO 
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