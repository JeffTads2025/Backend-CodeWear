import { validarCPF } from '../../utils/cpf';

describe('Função validarCPF', () => {
  it('deve retornar true para CPF válido', () => {
    expect(validarCPF('52998224725')).toBe(true);
  });

  it('deve retornar false para CPF inválido', () => {
    expect(validarCPF('12345678900')).toBe(false);
  });

  it('deve retornar false para CPF com todos dígitos iguais', () => {
    expect(validarCPF('11111111111')).toBe(false);
  });
});