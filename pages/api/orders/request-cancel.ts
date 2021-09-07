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
    if (req.method === 'POST') {
        const { paymentId }: { paymentId: string } = req.body
        try {
            const connection = await getDatabaseConnection();
           const response = await updateOrder(connection, paymentId, OrderStatus.REFUND_REQUESTED);
            // sendPaymentStatusEmail(connection, paymentIntent, payment);
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