import { NextPage } from 'next'

import Cart from '../components/Cart'
import CartSummary from '../components/CartSummary'
import Products from '../components/Products'

const DonatePage: NextPage = () => {
  return (
    <div className="page-container">
      <h1>Shopping Cart</h1>
      <Cart>
        <CartSummary />
        <Products />
      </Cart>
    </div>
  )
}

export default DonatePage


