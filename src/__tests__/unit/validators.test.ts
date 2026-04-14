import { validateEmail, validatePasswordLevel } from '../../utils/validators';

describe('Regras de Negócio: Validações de Entrada', () => {
    describe('Função validateEmail()', () => {
        test('Deve retornar FALSE se o e-mail não possuir o caractere "@"', () => {
            const emailInvalido = 'usuariosemArroba.com';
            const resultado = validateEmail(emailInvalido);
            expect(resultado).toBe(false);
        });
        test('Deve retornar TRUE se o e-mail estiver no formato padrão (nome@dominio.com)', () => {
            const emailValido = 'cliente@codewear.com.br';
            const resultado = validateEmail(emailValido);
            expect(resultado).toBe(true);
        });
    });
    describe('Função validatePasswordLevel()', () => {
        test('Deve retornar FALSE para senhas curtas (menos de 8 caracteres)', () => {
            const senhaCurta = '1234567';
            const resultado = validatePasswordLevel(senhaCurta);
            expect(resultado).toBe(false);
        });
        test('Deve retornar TRUE para senhas que combinam letras e números com tamanho ideal', () => {
            const senhaForte = 'CodeWear2026';
            const resultado = validatePasswordLevel(senhaForte);
            expect(resultado).toBe(true);
        });
    });
}
);