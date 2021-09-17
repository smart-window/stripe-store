import { NextApiRequest, NextApiResponse } from 'next'
import getDatabaseConnection from '../../../lib/getDatabaseConnection';
import { Carts } from '../../../src/entity/Carts';
const logger = require('pino')()

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
    res.status(200).json(cart);
  } catch (err) {
    logger.console.error(`Error on cart fetch by id ${err.message}`);
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}
