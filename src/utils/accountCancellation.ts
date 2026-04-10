import { Op } from 'sequelize';
import User from '../models/UserModel';

export const CANCELLED_EMAIL_DOMAIN = '@cancelled.codewear.local';

export function isCancelledEmail(email?: string | null) {
  return Boolean(email && email.endsWith(CANCELLED_EMAIL_DOMAIN));
}

export function getActiveClientWhereClause() {
  return {
    role: 'client',
    email: {
      [Op.notLike]: `%${CANCELLED_EMAIL_DOMAIN}`,
    },
  };
}

export function buildCancelledAccountData(user: User) {
  const timestamp = Date.now();
  const archivedEmail = `cancelled+${user.id}+${timestamp}${CANCELLED_EMAIL_DOMAIN}`;
  const archivedCpf = `${String(user.id).padStart(3, '0')}${String(timestamp).slice(-8)}`;
  const archivedPhone = `000000${String(user.id).padStart(5, '0')}`;
  const archivedPassword = `cancelled-${user.id}-${timestamp}`;

  return {
    email: archivedEmail,
    cpf: archivedCpf,
    phone: archivedPhone,
    address: 'Conta cancelada',
    password: archivedPassword,
  };
}