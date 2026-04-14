import { describe, it, expect } from '@jest/globals';

type CartItem = { name: string; price: number; quantity: number };
const calculateTotal = (items: CartItem[]): number => items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

describe('Função calculateTotal', () => {
  it('deve somar corretamente o total do carrinho', () => {
    const items = [
      { name: 'A', price: 10, quantity: 2 },
      { name: 'B', price: 5, quantity: 1 }
    ];
    expect(calculateTotal(items)).toBe(25);
  });

  it('deve retornar 0 para carrinho vazio', () => {
    expect(calculateTotal([])).toBe(0);
  });
});