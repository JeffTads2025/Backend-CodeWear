import { validateEmail, validatePasswordLevel } from '../utils/validators';

/**
 * Suite de Testes: Validações de Segurança CodeWear
 * * Clean Code aplicado:
 * 1. Describe blocks: Agrupam testes por funcionalidade.
 * 2. Nomenclatura semântica: O nome do teste descreve o comportamento esperado.
 * 3. AAA Pattern: Arrange (Prepara), Act (Age), Assert (Verifica).
 */
describe('Regras de Negócio: Validações de Entrada', () => {

    // Cenários para o campo de E-mail
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

    // Cenários para o Nível de Senha (Requisito da Rubrica)
    describe('Função validatePasswordLevel()', () => {

        test('Deve retornar FALSE para senhas curtas (menos de 8 caracteres)', () => {
            // Arrange & Act
            const senhaCurta = '1234567';
            const resultado = validatePasswordLevel(senhaCurta);
            
            // Assert
            expect(resultado).toBe(false);
        });

        test('Deve retornar TRUE para senhas que combinam letras e números com tamanho ideal', () => {
            const senhaForte = 'CodeWear2026';
            const resultado = validatePasswordLevel(senhaForte);
            expect(resultado).toBe(true);
        });
    });

});