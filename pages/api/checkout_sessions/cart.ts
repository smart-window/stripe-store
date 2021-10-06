import { NextApiRequest, NextApiResponse } from 'next'

/*
 * Product data can be loaded from anywhere. In this case, we’re loading it from
 * a local JSON file, but this could also come from an async call to your
 * inventory management service, a database query, or some other API call.
 *
 * The important thing is that the product info is loaded from somewhere trusted
 * so you know the pricing information is accurate.
 */

import Stripe from 'stripe'
import { Carts } from '../../../src/entity/Carts'
import getDatabaseConnection from '../../../lib/getDatabaseConnection'
import { CartItems } from '../../../src/entity/CartItems'
import _ from 'lodash'
import { Products } from '../../../src/entity/Products'
import { Payments } from '../../../src/entity/Payments'
import { OrderDetails } from '../../../src/entity/OrdersDetails'
import { Orders } from '../../../src/entity/Orders'
import { countryTypePaymentMethodsMap, PaymentStatus } from '../../../config'
import moment from 'moment'

const logger = require('pino')();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2020-08-27',
})

/**
 * On cart checkout, create
 * 1. cart and cart details
 * 2. create payment with status "pending"
 * 3. create order and order details
 * @param req 
 * @param res 
 * @returns 
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      // Validate the cart details that were sent from the client.
      const cartItems = req.body.cartDetails
      const connection = await getDatabaseConnection();
      if (!validateCartItems(connection, cartItems)) {
        throw new Error(`Product not found!`)
      }
      logger.info("Cart items valid");
      const line_items = [];
      let totalPrice = 0;
      _.each(cartItems, productInfo => {
        totalPrice += Number.parseFloat(productInfo.price);
        const item: any = {
          name: productInfo.name,
          amount: productInfo.price,
          currency: req.body.currency,
          quantity: productInfo.quantity
        }
        if (productInfo.description) item.description = productInfo.description
        if (productInfo.image) item.images = [productInfo.image]
        line_items.push(item)
      });

      await createCartAndDetails(connection, req.body.userId, cartItems);

      const countryBasedPaymentTypes = countryTypePaymentMethodsMap[req.body.countryName];
      const payment_method_types: any = ['card'];
      if(countryBasedPaymentTypes) {
        payment_method_types.push(...countryBasedPaymentTypes);
      }
      // Create Checkout Sessions from body params.
      const params: Stripe.Checkout.SessionCreateParams = {
        submit_type: 'pay',
        payment_method_types,
        billing_address_collection: 'auto',
        line_items,
        success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/`,
      }
      const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(
        params
      )
      const paymentId = typeof checkoutSession.payment_intent == "string" ? checkoutSession.payment_intent : checkoutSession.payment_intent.id;
      const paymentResponse = await createPayment(req.body.userId, totalPrice, paymentId);
      if (!paymentResponse.status) {
        return res.status(500).json(paymentResponse);
      }
      const orderResponse = await createOrderAndDetails(req.body.userId, paymentResponse.paymentEntity.id, cartItems);
      if (!orderResponse.status) {
        return res.status(500).json(orderResponse);
      }
      res.status(200).json(checkoutSession)
    } catch (err) {
      logger.error(`Error on pre checkout ${err.message}`);
      res.status(500).json({ statusCode: 500, message: err.message })
    }
  } else {
    logger.error(`Method Not Allowed`);
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}


const validateCartItems = async (connection, cartDetails) => {
  const productIds = _.map(cartDetails, "id");
  const products = await connection.manager.findByIds(Products, productIds);
  const isValid = !_.some(products, product => {
    return !productIds.includes(product.id);
  });
  return isValid
}

const createCartAndDetails = async (connection, userId, cartItems) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingCart = await connection.manager.findOne(Carts, { where: { userId: userId } });
      let cartId = existingCart ? existingCart.id : null;
      if (!existingCart) {
        const cart = new Carts();
        cart.userId = userId;
        const cartEntity = await connection.manager.save(cart);
        cartId = cartEntity.id;
      }

      // remove all items and create freshly
      await connection.manager.createQueryBuilder()
        .delete()
        .from(CartItems)
        .where('cartId = :cartId', { cartId })
        .execute();
      const cartItemList: CartItems[] = [];
      _.each(cartItems, product => {
        const cartItem = new CartItems();
        cartItem.quantity = product.quantity;
        cartItem.cartId = cartId;
        cartItem.productId = product.id;
        cartItemList.push(cartItem);
      })

      if (cartItemList.length) {
        await connection.manager.save(cartItemList);
      }

      // LOG Cart created
      resolve("success");
    } catch (error) {
      logger.error("Cart creation failed ");
      logger.error(error.message);
      reject("cart creation failed")
    }
  });

}

const createPayment = async (userId, totalPrice, paymentId) => {
  try {
    const connection = await getDatabaseConnection();
    const payment = new Payments();
    payment.userId = userId;
    payment.paymentMode = 'card';
    payment.status = PaymentStatus.PENDING;
    payment.amount = totalPrice.toString();
    payment.paymentSessionId = paymentId;
    const paymentEntity = await connection.manager.save(Payments, payment);
    logger.info("Payment create");
    return { status: true, paymentEntity }
  } catch (error) {
    logger.error("Payment create failed");
    return { status: false, message: "Payment create failed" }
  }
}

const createOrderAndDetails = async (userId, paymentId, cartItems) => {
  try {
    const connection = await getDatabaseConnection();
    const orderItemList: OrderDetails[] = [];
    const order = new Orders();
    order.paymentId = paymentId;
    order.userId = userId;
    order.createdDate =  moment().utc().toDate();
    order.updatedDate =  moment().utc().toDate();
    const orderEntity = await connection.manager.save(Orders, order);
    _.each(cartItems, product => {
      const orderDetail = new OrderDetails();
      let amount = product.quantity * Number.parseFloat(product.price);
      orderDetail.productId = product.id;
      orderDetail.amount = amount.toString();
      orderDetail.quantity = product.quantity;
      orderDetail.orderId = orderEntity.id;
      orderDetail.createdDate =  moment().utc().toDate();
      orderDetail.updatedDate =  moment().utc().toDate();
      orderItemList.push(orderDetail);
    })
    await connection.manager.save(OrderDetails, orderItemList);
    return { status: true };
  } catch (error) {
    logger.error("Order and OrderDetails create failed");
    logger.error(error.message);
    return { status: false, message: "Order create failed" }
  }
}