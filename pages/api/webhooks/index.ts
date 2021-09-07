import axios from 'axios'
import _ from 'lodash'
import { buffer } from 'micro'
import Cors from 'micro-cors'
import moment from 'moment'
import { NextApiRequest, NextApiResponse } from 'next'
import { stringify } from 'querystring'

import Stripe from 'stripe'
import CONFIG, { MailContent, OrderStatus, PaymentStatus } from '../../../config'
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
  // LOG Webhook invoked
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
    } catch (err) {
      // On error, log and return the error message.
      //LOG Error message: ${err.message}
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    // Successfully constructed event.
    // LOG event constructed Success

    // Cast event data to Stripe object.
    const connection = await getDatabaseConnection();
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedThePayment(connection, paymentIntent, paymentIntent.status);
      if (payment && payment.id) {
        await updateOrder(connection, payment.id, OrderStatus.ORDER_PLACED);
        sendPaymentStatusEmail(connection, paymentIntent, payment);
      }
      // LOG PaymentIntent status: ${paymentIntent.status}
    } else if (event.type === 'payment_intent.canceled') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedThePayment(connection, paymentIntent, paymentIntent.status);
      if (payment && payment.id) {
        sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      }
      // LOG PaymentIntent status: ${paymentIntent.status}
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const payment = await updatedThePayment(connection, paymentIntent, PaymentStatus.FAILED);
      sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      // LOG  Payment failed: ${paymentIntent.last_payment_error?.message}
    } else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      // LOG Charge id: ${charge.id}
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const payment = await updatedThePayment(connection, charge.payment_intent, "refund");
      if (payment) {
        await updateOrder(connection, payment.id, OrderStatus.REFUNDED);
        var paymentIntent = typeof charge.payment_intent == "string" ? await stripe.paymentIntents.retrieve(charge.payment_intent) : charge.payment_intent;
        sendStatusUpdateEmail(connection, paymentIntent, payment, event.type);
      }
    } else {
      // LOG Unhandled event type: ${event.type}
      console.log("event.type ", event.type)
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

const updatedThePayment = async (connection, paymentIntent: string | Stripe.PaymentIntent, status: string) => {
  try {
    const paymentId: any = typeof paymentIntent == "string" ? paymentIntent : paymentIntent?.id;
    const payment: Payments = await connection.manager.findOne(Payments, { where: { paymentSessionId: paymentId } });
    if (payment) {
      payment.updatedDate = moment().utc().toDate();
      if (status == 'succeeded') {
        payment.status = PaymentStatus.PAYMENT_COMPLETED;
        // clear cart items if payment done
        const cart = await connection.manager.findOne(Carts, { where: { userId: payment.userId } });
        await connection.manager.createQueryBuilder()
          .delete()
          .from(CartItems)
          .where('cartId = :cartId', { cartId: cart.id })
          .execute();

      } else if (status == 'canceled') {
        payment.status = PaymentStatus.CANCELED;
      } else if (status == 'refund') {
        const order: Orders = await connection.manager.findOne(Orders, { where: { paymentId: payment.id } });
        if (order.status === OrderStatus.REFUND_REQUESTED) {
          payment.status = PaymentStatus.CUSTOMER_CANCELED;
        } else {
          payment.status = PaymentStatus.VENDOR_REFUND;
        }

      } else {
        payment.status = status;
      }
      const savedPayment = await connection.manager.save(Payments, payment);
      return payment;
    } else {
      console.error('Payment not found');
    }
  } catch (error) {
    // log error
  }
}

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
    // LOG Order create failed
    // LOG error.message
    return { status: false, message: "Order create failed" }
  }
}

const sendPaymentStatusEmail = async (connection, paymentIntent: Stripe.PaymentIntent, payment: Payments) => {
  // LOG Payment status email init
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
    const response = await axios.post(CONFIG.LAMBDA_URL,
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
    //LOG Payment status email sent to 
  } catch (error) {
    // LOG error('Failed to sent payment success mail for payment id ')
    // LOG error.message
  }

}

const sendStatusUpdateEmail = async (connection, paymentIntent: Stripe.PaymentIntent, payment: Payments, emailType: string) => {
  // LOG Payment status email init
  const order = await connection.manager.createQueryBuilder(Orders, 'orders')
    .where('orders.paymentId = :paymentId', { paymentId: payment.id })
    .leftJoinAndSelect('orders.orderDetails', 'cartItems')
    .leftJoinAndSelect('cartItems.product', 'product')
    .getOne();
  // const products = [];
  // _.each(order.orderDetails, order => {
  //   products.push({
  //     "name": order.product.name,
  //     "quantity": order.quantity,
  //     "unit_price": Number.parseFloat(order.product.price) / order.quantity,
  //     "sub_total_amount": order.product.price
  //   })
  // });
  const mailContent = getMessageContent(emailType);
  const charge: any = paymentIntent?.charges?.data[0] || {};
  try {
    const response = await axios.post(CONFIG.LAMBDA_URL,
      {
        "order_id": order.id,
        "customer_name": charge.billing_details.name,
        "customer_email": charge.billing_details.email,
        "customer_mobile": charge.billing_details.phone,
        "user_name": charge.billing_details.name,
        "title": (await mailContent).title,
        "body": (await mailContent).body,
        "subject": (await mailContent).title
      }, {
      headers: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }
    })
    //LOG Payment status email sent to 
  } catch (error) {
    // LOG error('Failed to sent payment success mail for payment id ')
    // LOG error.message
  }

}
const getMessageContent = async (type) => {
  try {
    let mailContent = { title: null, body: null };
    switch (type) {
      case "charge.refunded":
        return MailContent.REFUNDED;
        break;
      case "payment_intent.canceled":
        return MailContent.FAILED;
        break;

      case "payment_intent.payment_failed":
        return MailContent.FAILED;
        break;
      default:
        return mailContent;
        break;
    }
  } catch (error) {
    // LOG error('Failed to sent payment success mail for payment id ')
    // LOG error.message
  }
};
export default cors(webhookHandler as any)
