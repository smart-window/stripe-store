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
import { PaymentStatus } from '../../../config'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
})

const countryTypePaymentMethodsMap = {
  Belgium: ['bancontact', 'sofort'],
  Austria: ['eps', 'sofort'],
  Germany: ['giropay', 'sofort'],
  Netherlands: ['ideal', 'sofort'],
  Poland: ['p24'],
  Spain: ['sofort'],
  Italy: ['sofort'],
  Switzerland: ['sofort'],
}

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
      const paymentResponse = await createPayment(connection, req.body.userId, totalPrice, paymentId);
      if (!paymentResponse.status) {
        return res.status(500).json(paymentResponse);
      }
      const orderResponse = await createOrderAndDetails(connection, req.body.userId, paymentResponse.paymentEntity.id, cartItems);
      if (!orderResponse.status) {
        return res.status(500).json(orderResponse);
      }
      res.status(200).json(checkoutSession)
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: err.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}


const validateCartItems = async (connection, cartDetails) => {
  const productIds = _.map(cartDetails, "id");
  const products = await connection.manager.findByIds(Products, productIds);
  const isValid = !_.some(products, product => {
    return !productIds.includes(product.id);
  });
  // Log isValid
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
      console.error("Cart creation failed ");
      console.error(error.message);
      reject("cart creation failed")
    }
  });

}

const createPayment = async (connection, userId, totalPrice, paymentId) => {
  try {
    const payment = new Payments();
    payment.userId = userId;
    payment.paymentMode = 'card';
    payment.status = PaymentStatus.PENDING;
    payment.amount = totalPrice.toString();
    payment.paymentSessionId = paymentId;
    const paymentEntity = await connection.manager.save(Payments, payment);
    // LOG Payment Created
    return { status: true, paymentEntity }
  } catch (error) {
    // LOG error Payment create failed
    // LOG error.message
    return { status: false, message: "Payment create failed" }
  }
}

const createOrderAndDetails = async (connection, userId, paymentId, cartItems) => {
  try {
    const orderItemList: OrderDetails[] = [];
    const order = new Orders();
    order.paymentId = paymentId;
    order.userId = userId;
    const orderEntity = await connection.manager.save(Orders, order);
    _.each(cartItems, product => {
      const orderDetail = new OrderDetails();
      orderDetail.productId = product.id;
      orderDetail.quantity = product.quantity;
      orderDetail.orderId = orderEntity.id;
      orderItemList.push(orderDetail);
    })
    await connection.manager.save(OrderDetails, orderItemList);
    return { status: true };
  } catch (error) {
    // LOG Order create failed
    // LOG error.message
    return { status: false, message: "Order create failed" }
  }
}