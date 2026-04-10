"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANCELLED_EMAIL_DOMAIN = void 0;
exports.isCancelledEmail = isCancelledEmail;
exports.getActiveClientWhereClause = getActiveClientWhereClause;
exports.buildCancelledAccountData = buildCancelledAccountData;
const sequelize_1 = require("sequelize");
exports.CANCELLED_EMAIL_DOMAIN = '@cancelled.codewear.local';
function isCancelledEmail(email) {
    return Boolean(email && email.endsWith(exports.CANCELLED_EMAIL_DOMAIN));
}
function getActiveClientWhereClause() {
    return {
        role: 'client',
        email: {
            [sequelize_1.Op.notLike]: `%${exports.CANCELLED_EMAIL_DOMAIN}`,
        },
    };
}
function buildCancelledAccountData(user) {
    const timestamp = Date.now();
    const archivedEmail = `cancelled+${user.id}+${timestamp}${exports.CANCELLED_EMAIL_DOMAIN}`;
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
