import axios from 'axios'
import _ from 'lodash'
import { buffer } from 'micro'
import Cors from 'micro-cors'
import { NextApiRequest, NextApiResponse } from 'next'

import Stripe from 'stripe'
import { PaymentStatus } from '../../../config'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { CartItems } from '../../../src/entity/CartItems'
import { Carts } from '../../../src/entity/Carts'
import { Orders } from '../../../src/entity/Orders'
import { Payments } from '../../../src/entity/Payments'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
})

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
}

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
})

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Webhook invoked')
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
    } catch (err) {
      // On error, log and return the error message.
      console.log(`❌ Error message: ${err.message}`)
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    // Successfully constructed event.
    console.log('✅ event constructed Success:', event.id)

    // Cast event data to Stripe object.
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const connection = await getDatabaseConnection();
      const payment = await updatedThePayment(connection, paymentIntent);
      sendPaymentStatusEmail(connection, paymentIntent, payment);
      console.log(`💰 PaymentIntent status: ${paymentIntent.status}`)
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(
        `❌ Payment failed: ${paymentIntent.last_payment_error?.message}`
      )
    } else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge
      console.log(`💵 Charge id: ${charge.id}`)
    } else {
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`)
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

const updatedThePayment = async (connection, paymentIntent: Stripe.PaymentIntent) => {

  const payment: Payments = await connection.manager.findOne(Payments, { where: { paymentSessionId: paymentIntent.id } });
  if (payment) {
    if (paymentIntent.status == 'succeeded') {
      payment.status = PaymentStatus.DONE;
      payment.updatedDate = new Date();
      // clear cart items if payment done
      const cart = await connection.manager.findOne(Carts, { where: { userId: payment.userId } });
      await connection.manager.createQueryBuilder()
        .delete()
        .from(CartItems)
        .where('cartId = :cartId', { cartId: cart.id })
        .execute();

    } else if (paymentIntent.status == 'canceled') {
      payment.status = PaymentStatus.CANCELED;
    } else {
      payment.status = PaymentStatus.FAILED;
    }
    return await connection.manager.save(Payments, payment);
  } else {
    console.error('Payment not found');
  }
}

const sendPaymentStatusEmail = async (connection, paymentIntent: Stripe.PaymentIntent, payment: Payments) => {
  console.log("Payment status email init");
  const order = await connection.manager.createQueryBuilder(Orders, 'orders')
  .where('orders.paymentId = :paymentId', { paymentId: payment.id })
  .leftJoinAndSelect('orders.orderDetails', 'cartItems')
  .leftJoinAndSelect('cartItems.product', 'product')
  .getOne();
  const products = [];
  _.each(order.orderDetails, order => {
    products.push({
      "name": order.product.name,
      "quantity": order.quantity,
      "unit_price": Number.parseFloat(order.product.price) / order.quantity,
      "sub_total_amount": order.product.price
    })
  });
  const charge: any = paymentIntent?.charges?.data[0] || {};
  console.log(JSON.stringify(charge));
  try {
    const response = await axios.post("https://0h7un0j137.execute-api.ap-south-1.amazonaws.com/triggeremail",
      {
        "order_id": order.id,
        "customer_name": charge.billing_details.name,
        "customer_email": charge.billing_details.email,
        "customer_mobile": charge.billing_details.phone,
        "total_amount": charge.amount,
        "tax_details": "0",
        "bill_amount": charge.amount,
        "products": products
      })
      console.log("Payment status email sent to ", charge.billing_details.email);
   } catch (error) {
    console.error('Failed to sent payment success mail for payment id ', payment.id);
    console.error(error.message);
  }

}

export default cors(webhookHandler as any)
