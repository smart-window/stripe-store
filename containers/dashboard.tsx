import { NextPage } from 'next'
import { Button } from 'react-bootstrap'

import Cart from '../components/Cart'
import CartSummary from '../components/CartSummary'
import Products from '../components/Products'

const DashboardPage: NextPage = () => {
  return (
    <div className="page-container">
      <h1>Welcome to Shopping </h1>
      <div className="btn-wrapper">
       <Button className="orders-btn admin-btn" variant="primary" onClick={() => window.location.href = '/orders'}>Enter as Admin</Button>
       <Button className="orders-btn customer-btn" variant="success" onClick={() => window.location.href = '/shopping-cart'}>Enter as Customer</Button>
      </div>

      <style jsx>{`

        .page-container {
          width: 650px;
          height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .btn-wrapper {
          width: 100%;
          flex-direction: row;
          display: flex;
          justify-content: space-around;
        }
        
      `}</style>
    </div>
  )
}

export default DashboardPage


