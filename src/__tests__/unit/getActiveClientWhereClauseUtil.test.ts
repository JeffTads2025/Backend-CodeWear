import { getActiveClientWhereClause } from '../../utils/accountCancellation';

describe('Função getActiveClientWhereClause', () => {
  it('deve retornar um objeto para consulta ativa', () => {
    const clause = getActiveClientWhereClause();
    expect(typeof clause).toBe('object');
    expect(clause).toHaveProperty('email');
  });
});