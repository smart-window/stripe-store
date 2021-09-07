import { NextApiRequest, NextApiResponse } from 'next'

import { CURRENCY, MIN_AMOUNT, MAX_AMOUNT, PaymentStatus, OrderStatus } from '../../../config'

import Stripe from 'stripe'
import { Payments } from '../../../src/entity/Payments'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { Orders } from '../../../src/entity/Orders'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const connection = await getDatabaseConnection();
    if (req.method === 'POST') {
      const { paymentId, type, reason }: { paymentId: string; type: string; reason: Stripe.RefundCreateParams.Reason; } = req.body;

      const paymentResponse = await stripe.refunds.create({
        payment_intent: paymentId,
        reason
      });
      // sendPaymentStatusEmail(connection, paymentIntent, payment);
      res.status(200).json({})
    } else if (req.method === 'GET') {
      const orders = await connection.manager.createQueryBuilder(Orders, 'order')
        .innerJoinAndSelect('order.orderDetails', 'orderDetails')
        .innerJoinAndSelect('order.payment', 'payment')
        .innerJoinAndSelect('orderDetails.product', 'product')
        .getMany();
      res.status(200).json(orders)
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).end('Method Not Allowed');
    }
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}