// Classe em Inglês (Product)
class Product {
    constructor(public name: string, public price: number) {}

    calculateDiscount(percentage: number): number {
        if (percentage < 0 || percentage > 100) {
            throw new Error("Percentual de desconto deve estar entre 0 e 100.");
        }
        return this.price - (this.price * (percentage / 100));
    }
}

describe('Regras de Negócio: Product Management', () => {
    test('Deve calcular o desconto corretamente', () => {
        const tshirt = new Product('CodeWear Classic', 100);
        expect(tshirt.calculateDiscount(10)).toBe(90);
    });

    test('Deve lançar erro para desconto inválido', () => {
        const tshirt = new Product('CodeWear Classic', 100);
        expect(() => tshirt.calculateDiscount(-5)).toThrow("Percentual de desconto deve estar entre 0 e 100.");
    });
});