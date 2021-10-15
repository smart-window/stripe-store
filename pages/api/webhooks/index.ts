import axios from 'axios'
import _ from 'lodash'
import { buffer } from 'micro'
import Cors from 'micro-cors'
import moment from 'moment'
import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import CONFIG, { OrderStatus, PaymentStateType, PaymentStatus } from '../../../config'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { CartItems } from '../../../src/entity/CartItems'
import { Carts } from '../../../src/entity/Carts'
import { Orders } from '../../../src/entity/Orders'
import { Payments } from '../../../src/entity/Payments'
import { getMessageContent } from '../../../utils/stripe-helpers'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2020-08-27',
})
const logger = require('pino')()
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

/**
 * Webhooks to handle all stripe related events
 * @param req 
 * @param res 
 * @returns 
 */
const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  logger.info(`Webhook triggered`);
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']!
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    // Successfully constructed event.
    logger.info(`Webhook constructed successfully`);

    // db connection
    const connection = await getDatabaseConnection();

    // payment success event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedPayment(connection, paymentIntent, paymentIntent.status);
      if (payment && payment.id) {
        await updateOrder(connection, payment.id, OrderStatus.ORDER_PLACED);
        sendPaymentStatusEmail(connection, paymentIntent, payment);
      }
      logger.info(`PaymentIntent status: ${paymentIntent.status}`);
    } else if (event.type === 'payment_intent.canceled') {
      // payment canceled by vendor in the stripe 
      // or due to invalid or insufficient information provided during checkout
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedPayment(connection, paymentIntent, paymentIntent.status);
      if (payment && payment.id) {
        sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      }
      logger.info(`PaymentIntent status: ${paymentIntent.status}`);
    } else if (event.type === 'payment_intent.payment_failed') {
      // payment failed event
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedPayment(connection, paymentIntent, PaymentStatus.FAILED);
      sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      logger.info(`Payment failed: ${paymentIntent.last_payment_error?.message}`);
    } else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      logger.info(`Charge success : ${charge.id}`);
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const payment = await updatedPayment(connection, charge.payment_intent, "refund");
      if (payment) {
        await updateOrder(connection, payment.id, OrderStatus.REFUNDED);
        var paymentIntent = typeof charge.payment_intent == "string" ? await stripe.paymentIntents.retrieve(charge.payment_intent) : charge.payment_intent;
        sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      }
    } else {
      logger.info("event Type " + event.type);
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

// update payment status
const updatedPayment = async (connection, paymentIntent: string | Stripe.PaymentIntent, status: string) => {
  const paymentId: any = typeof paymentIntent == "string" ? paymentIntent : paymentIntent?.id;
  try {
    const payment: Payments = await connection.manager.findOne(Payments, { where: { paymentSessionId: paymentId } });
    if (payment) {
      payment.updatedDate = moment().utc().toDate();
      if (status == PaymentStateType.SUCCEEDED) {
        payment.status = PaymentStatus.PAYMENT_COMPLETED;
        // clear cart items if payment done
        const cart = await connection.manager.findOne(Carts, { where: { userId: payment.userId } });
        await connection.manager.createQueryBuilder()
          .delete()
          .from(CartItems)
          .where('cartId = :cartId', { cartId: cart.id })
          .execute();

      } else if (status == PaymentStateType.CANCELLED) {
        payment.status = PaymentStatus.CANCELED;
      } else if (status == PaymentStateType.REFUND) {
        const order: Orders = await connection.manager.findOne(Orders, { where: { paymentId: payment.id } });
        if (order.status === OrderStatus.REFUND_REQUESTED) {
          payment.status = PaymentStatus.CUSTOMER_CANCELED;
        } else {
          payment.status = PaymentStatus.VENDOR_REFUND;
        }
      } else {
        payment.status = status;
      }
      await connection.manager.save(Payments, payment);
      return payment;
    } else {
      logger.error('Payment not found');
    }
  } catch (error) {
    logger.error("Failed to update the payment " + paymentId);
  }
}

// update order status
const updateOrder = async (connection, paymentId, status) => {
  try {
    const order: Orders = await connection.manager.findOne(Orders, { where: { paymentId } });
    if (order) {
      order.status = status;
      order.updatedDate = moment().utc().toDate();
      await connection.manager.save(Orders, order);
      return { status: true };
    }
  } catch (error) {
    logger.error("Failed to update order for payment " + paymentId);
    return { status: false, message: "Order create failed" }
  }
}

// trigger payment status email to the customer and vendor
// this method also triggers pdf invoice 
const sendPaymentStatusEmail = async (connection, paymentIntent: Stripe.PaymentIntent, payment: Payments) => {
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
  try {
    await axios.post(CONFIG.LAMBDA_URL,
      {
        "order_id": order.id,
        "customer_name": charge.billing_details.name,
        "customer_email": charge.billing_details.email,
        "customer_mobile": charge.billing_details.phone,
        "total_amount": charge.amount,
        "tax_details": "0",
        "bill_amount": charge.amount,
        "products": products,
        "title": "ORDER DETAILS",
        "order_date": Date.now(),
        "currencySymbol": "$",
      }, {
      headers: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }
    })
    logger.info("Payment status mail for order " + order.id + " sent successfully");
  } catch (error) {
    logger.error("Failed to sent payment status mail for order " + order.id);
  }

}

// trigger payment status email
const sendStatusUpdateEmail = async (connection, paymentIntent: Stripe.PaymentIntent, payment: Payments, emailType: string) => {
  const order = await connection.manager.createQueryBuilder(Orders, 'orders')
    .where('orders.paymentId = :paymentId', { paymentId: payment.id })
    .leftJoinAndSelect('orders.orderDetails', 'cartItems')
    .leftJoinAndSelect('cartItems.product', 'product')
    .getOne();
  const mailContent = getMessageContent(emailType);
  const charge: any = paymentIntent?.charges?.data[0] || {};
  try {
    await axios.post(CONFIG.LAMBDA_URL,
      {
        "order_id": order.id,
        "customer_name": charge.billing_details.name,
        "customer_email": charge.billing_details.email,
        "customer_mobile": charge.billing_details.phone,
        "user_name": charge.billing_details.name,
        "title": mailContent.title,
        "body": mailContent.body.replace("{orderId}", order.id),
        "subject": mailContent.title
      }, {
      headers: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }
    })
    logger.debug("payment status mail for order " + order.id + " sent successfully");
  } catch (error) {
    logger.error("Failed to sent payment status mail for order " + order.id);
  }

}

export default cors(webhookHandler as any)
