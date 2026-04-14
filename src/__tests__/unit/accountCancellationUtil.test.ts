import { isCancelledEmail, CANCELLED_EMAIL_DOMAIN } from '../../utils/accountCancellation';

describe('Função isCancelledEmail', () => {
  it('deve retornar true para email cancelado', () => {
    expect(isCancelledEmail('user' + CANCELLED_EMAIL_DOMAIN)).toBe(true);
  });

  it('deve retornar false para email normal', () => {
    expect(isCancelledEmail('user@email.com')).toBe(false);
  });
});