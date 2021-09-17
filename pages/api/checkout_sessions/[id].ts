import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const logger = require('pino')();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2020-08-27',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id: string = req.query.id as string
  try {
    if (!id.startsWith('cs_')) {
      logger.console.error(`Checkout session id not valid ${id}`);
      throw Error('Incorrect CheckoutSession ID.')
    }
    const checkout_session: Stripe.Checkout.Session = await stripe.checkout.sessions.retrieve(
      id,
      { expand: ['payment_intent'] }
    )

    res.status(200).json(checkout_session)
  } catch (err) {
    logger.console.error(`Error on checkout session ${err.message}`);
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}
