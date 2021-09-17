import { NextApiRequest, NextApiResponse } from 'next'

import CONFIG, { CURRENCY, MIN_AMOUNT, MAX_AMOUNT, PaymentStatus, OrderStatus, MailContent } from '../../../config'

import Stripe from 'stripe'
import { Payments } from '../../../src/entity/Payments'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { Orders } from '../../../src/entity/Orders'
import axios from 'axios'
import { Gunzip } from 'zlib'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // https://github.com/stripe/stripe-node#configuration
    apiVersion: '2020-08-27',
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        const { paymentId, paymentSessionId }: { paymentId: string; paymentSessionId: string; } = req.body
        try {
            const connection = await getDatabaseConnection();
           const response = await updateOrder(connection, paymentId, OrderStatus.REFUND_REQUESTED);
           var paymentIntent = typeof paymentSessionId == "string" ? await stripe.paymentIntents.retrieve(paymentSessionId) : paymentSessionId;
           sendStatusUpdateEmail(connection, paymentIntent, paymentId);
            if(!response.isSuccess) {
                return res.status(500).json({ isSuccess: false, message: "Failed to initiate refund request. please contact support team"});
            }
            res.status(200).json({ isSuccess: true, message: "Refund request initiated. Refund will be transferred once accepted by vendor"});
        } catch (err) {
            res.status(500).json({ statusCode: 500, message: err.message })
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end('Method Not Allowed');
    }
}

const updateOrder = async (connection, paymentId, status) => {
    try {
        const order: Orders = await connection.manager.findOne(Orders, { where: { paymentId } });
        if (order) {
            order.status = status;
            await connection.manager.save(Orders, order);
            return { isSuccess: true };
        }
    } catch (error) {
        // LOG Order create failed
        // LOG error.message
        return { isSuccess: false }
    }
}
const sendStatusUpdateEmail = async (connection, paymentIntent: Stripe.PaymentIntent, paymentId: string) => {
    // LOG Payment status email init
    const order = await connection.manager.createQueryBuilder(Orders, 'orders')
      .where('orders.paymentId = :paymentId', { paymentId: paymentId })
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
    const mailContent = MailContent.CANCELLED;
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