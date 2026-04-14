import { validateEmail, validatePasswordLevel } from '../../utils/validators';

describe('Função validateEmail', () => {
  it('deve validar e-mail válido', () => {
    expect(validateEmail('teste@codewear.com')).toBe(true);
  });
  it('deve invalidar e-mail sem @', () => {
    expect(validateEmail('testecodewear.com')).toBe(false);
  });
});

describe('Função validatePasswordLevel', () => {
  it('deve validar senha forte', () => {
    expect(validatePasswordLevel('Senha123')).toBe(true);
  });
  it('deve invalidar senha fraca', () => {
    expect(validatePasswordLevel('123')).toBe(false);
  });
});