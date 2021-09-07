import { NextPage } from 'next'
import { Button } from 'react-bootstrap'

import Cart from '../components/Cart'
import CartSummary from '../components/CartSummary'
import Products from '../components/Products'

const DonatePage: NextPage = () => {
  return (
    <div className="page-container">
      <h1>Shopping Cart  <Button className="orders-btn" variant="primary" onClick={() => window.location.href = '/my-orders'}>My Orders</Button></h1>
      <Cart>
        <CartSummary />
        <Products />
      </Cart>
    </div>
  )
}

export default DonatePage


