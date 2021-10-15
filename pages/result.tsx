import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { fetchGetJSON } from '../utils/api-helpers'
import useSWR from 'swr'
import { useShoppingCart } from 'use-shopping-cart'

const ResultPage: NextPage = () => {
  const { clearCart } = useShoppingCart()
  const router = useRouter()

  const { data, error } = useSWR(
    router.query.session_id
      ? `/api/checkout_sessions/${router.query.session_id}`
      : null,
    fetchGetJSON
  )

  if (error) return <div>failed to load</div>

  clearCart();
  
  return (
    <div className="page-container">
        <h1>Checkout Payment Result</h1>
        <h2>Status: {data?.payment_intent?.status ?? 'loading...'}</h2>
     </div>
  )
}

export default ResultPage
