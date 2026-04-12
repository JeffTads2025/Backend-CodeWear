import { Response } from 'express';
import Product from '../models/ProductModel';
import AuditLog from '../models/AuditLogModel';
import { AuthRequest } from '../types';

interface ProductPayload {
    name?: string;
    price?: number;
    stock?: number;
    image_url?: string;
}

interface ProductSnapshot {
    name: string;
    price: number;
    stock: number;
    image_url?: string;
}

interface ValidProductPayload extends ProductPayload {
    name: string;
    price: number;
    stock: number;
}

function hasRequiredProductFields(payload: ProductPayload): payload is ValidProductPayload {
    return Boolean(payload.name) && payload.price !== undefined && payload.stock !== undefined;
}

function buildCreateProductAuditDetails(name: string, price: number, stock: number): string {
    return `Criou produto "${name}" com preço R$ ${price} e estoque ${stock}`;
}

function getProductSnapshot(product: Product): ProductSnapshot {
    return {
        name: product.name,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url ?? undefined
    };
}

function getNextProductData(product: Product, payload: ProductPayload): ProductPayload {
    return {
        name: payload.name !== undefined ? payload.name : product.name,
        price: payload.price !== undefined ? payload.price : product.price,
        stock: payload.stock !== undefined ? payload.stock : product.stock,
        image_url: payload.image_url !== undefined ? payload.image_url : product.image_url
    };
}

function buildUpdateProductAuditDetails(previousData: ProductSnapshot, nextData: ProductPayload): string {
    let details = `Atualizou produto "${previousData.name}"`;

    if (nextData.name !== undefined && previousData.name !== nextData.name) details += ` - Nome: ${previousData.name} → ${nextData.name}`;
    if (nextData.price !== undefined && previousData.price !== nextData.price) details += ` - Preço: R$ ${previousData.price} → R$ ${nextData.price}`;
    if (nextData.stock !== undefined && previousData.stock !== nextData.stock) details += ` - Estoque: ${previousData.stock} → ${nextData.stock}`;
    if (nextData.image_url !== undefined && previousData.image_url !== nextData.image_url) details += ' - Imagem alterada';

    return details;
}

async function createProductAuditLog(req: AuthRequest, action: string, details: string): Promise<void> {
    await AuditLog.create({
        adminId: req.user!.id,
        adminName: req.user!.name,
        action,
        details
    });
}

function isProductDeleteBlockedError(error: Error): boolean {
    return error.name === 'SequelizeForeignKeyConstraintError'
        || error.message.includes('foreign key constraint fails')
        || error.message.includes('Cannot delete or update a parent row');
}

// LISTAGEM DE PRODUTOS
export const listProducts = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ products: rows, totalPages: Math.ceil(count / limit), total: count });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};

// CRIAR PRODUTO
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const payload = req.body as ProductPayload;

        if (!hasRequiredProductFields(payload)) {
            return res.status(400).json({ message: "Nome, preço e estoque são obrigatórios" });
        }

        const { name, price, stock, image_url } = payload;

        const product = await Product.create({
            name,
            price,
            stock,
            image_url: image_url ?? undefined
        });

        await createProductAuditLog(req, 'CREATE_PRODUCT', buildCreateProductAuditDetails(name, price, stock));

        return res.status(201).json({ message: "Produto criado com sucesso", product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao criar produto";
        return res.status(500).json({ message });
    }
};

// ATUALIZAR PRODUTO
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, price, stock, image_url } = req.body as ProductPayload;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        const oldData = getProductSnapshot(product);
        const nextData = getNextProductData(product, { name, price, stock, image_url });

        await product.update({
            name: nextData.name,
            price: nextData.price,
            stock: nextData.stock,
            image_url: nextData.image_url
        });

        await createProductAuditLog(req, 'UPDATE_PRODUCT', buildUpdateProductAuditDetails(oldData, nextData));

        return res.status(200).json({ message: "Produto atualizado com sucesso", product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar produto";
        return res.status(500).json({ message });
    }
};

// DELETAR PRODUTO
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        await product.destroy();
        await createProductAuditLog(req, 'DELETE_PRODUCT', `Produto: "${product.name}"`);

        return res.status(200).json({ message: "Produto deletado com sucesso" });
    } catch (error) {
        const isForeignKeyConstraint = error instanceof Error && isProductDeleteBlockedError(error);

        if (isForeignKeyConstraint) {
            return res.status(400).json({
                message: 'Não é possível excluir este produto porque ele está vinculado a registros existentes, como itens no carrinho ou pedidos.'
            });
        }

        const message = error instanceof Error ? error.message : "Erro ao deletar produto";
        return res.status(500).json({ message });
    }
};