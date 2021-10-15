import { NextApiRequest, NextApiResponse } from 'next'
import getDatabaseConnection from '../../../lib/getDatabaseConnection';
import { Products } from '../../../src/entity/Products';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const connection = await getDatabaseConnection();
      const products = await connection.manager.find(Products, {});
      res.status(200).json({ data: products })
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: err.message })
    }
  } else {
    res.setHeader('Allow', 'GET')
    res.status(405).end('Method Not Allowed')
  }
}
