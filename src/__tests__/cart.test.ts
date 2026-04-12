
interface CartItem {
    name: string;
    price: number;
    quantity: number;
}

const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};

describe('Regras de Negócio: Sistema de Carrinho', () => {
    test('Deve somar o total de camisetas unissex no carrinho', () => {
        const items: CartItem[] = [
            { name: 'T-shirt Black', price: 80, quantity: 2 },
            { name: 'T-shirt White', price: 80, quantity: 1 }
        ];
        expect(calculateTotal(items)).toBe(240);
    });
});