import { NextApiRequest, NextApiResponse } from 'next'

import getDatabaseConnection from '../../../lib/getDatabaseConnection';
import { CartItems } from '../../../src/entity/CartItems';
import { Carts } from '../../../src/entity/Carts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId: number = typeof req.query.userId == 'string' ? Number.parseInt(req.query.userId) : 0;
  try {
    const connection = await getDatabaseConnection();
    const cart = await connection.manager.createQueryBuilder(Carts, 'cart')
    .where('cart.userId = :userId', { userId })
    .leftJoinAndSelect('cart.cartItems', 'cartItems')
    .leftJoinAndSelect('cartItems.product', 'product')
    .getOne();

    res.status(200).json(cart)
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}
