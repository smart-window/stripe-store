import { NextApiRequest, NextApiResponse } from 'next'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { Orders } from '../../../src/entity/Orders'

const logger = require('pino')();

// fetches customers all orders
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const connection = await getDatabaseConnection();
   if (req.method === 'GET') {
      const userId = 1; // get this userId from token
      const orders = await connection.manager.createQueryBuilder(Orders, 'order')
        .innerJoinAndSelect('order.orderDetails', 'orderDetails')
        .innerJoinAndSelect('order.payment', 'payment')
        .innerJoinAndSelect('orderDetails.product', 'product')
        .where('order.userId = :userId', { userId })
        .getMany();
      res.status(200).json(orders)
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).end('Method Not Allowed');
    }
  } catch (err) {
    logger.error(`Failed to fetch my orders, ${err.message}`)
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}