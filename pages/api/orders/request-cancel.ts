import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { Orders } from '../../../src/entity/Orders'
import axios from 'axios'
import CONFIG, { MailContent, OrderStatus } from '../../../config'

const logger = require('pino')();
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
            if (!response.isSuccess) {
                logger.error("Failed to initiate refund request.")
                return res.status(500).json({ isSuccess: false, message: "Failed to initiate refund request. please contact support team" });
            }
            res.status(200).json({ isSuccess: true, message: "Refund request initiated. Refund will be transferred once accepted by vendor" });
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
        logger.error("Failed to update order")
        return { isSuccess: false }
    }
}
const sendStatusUpdateEmail = async (connection, paymentIntent: Stripe.PaymentIntent, paymentId: string) => {
    const order = await connection.manager.createQueryBuilder(Orders, 'orders')
        .where('orders.paymentId = :paymentId', { paymentId: paymentId })
        .leftJoinAndSelect('orders.orderDetails', 'cartItems')
        .leftJoinAndSelect('cartItems.product', 'product')
        .getOne();
    const mailContent = MailContent.CANCELLED;
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
                "body": mailContent.body.replace("{orderId}", order.id).replace("{ORDER_URL}", process.env.HOST+"/orders"),
                "subject": mailContent.title
            }, {
            headers: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
            }
        })
        logger.info("payment cancellation request mail successfully sent");
    } catch (error) {
        logger.error("Failed to sent cancellation request mail for payment id", paymentId)
        logger.error(error.message);
    }

}