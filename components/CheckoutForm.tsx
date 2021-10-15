import React, { useEffect, useState } from 'react'

import CustomDonationInput from '../components/CustomDonationInput'

import getStripe from '../utils/get-stripejs'
import { fetchGetJSON, fetchPostJSON } from '../utils/api-helpers'
import { formatAmountForDisplay } from '../utils/stripe-helpers'
import config, {MAX_AMOUNT, AMOUNT_STEP, CURRENCY, MIN_AMOUNT} from '../config'
import _ from 'lodash'

const CheckoutForm = () => {
  const [loading, setLoading] = useState(false);
 
  const [input, setInput] = useState({
    customDonation: Math.round(MAX_AMOUNT / AMOUNT_STEP),
  })

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setInput({
      ...input,
      [e.currentTarget.name]: e.currentTarget.value,
    })
  
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Create a Checkout Session.
    const response = await fetchPostJSON('/api/checkout_sessions', {
      amount: input.customDonation,
    })

    if (response.statusCode === 500) {
      console.error(response.message)
      return
    }

    // Redirect to Checkout.
    const stripe = await getStripe()
    const { error } = await stripe!.redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: response.id,
    })
    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `error.message`.
    console.warn(error.message)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <CustomDonationInput
        className="checkout-style"
        name={'customDonation'}
        value={input.customDonation}
        min={MIN_AMOUNT}
        max={MAX_AMOUNT}
        step={AMOUNT_STEP}
        currency={CURRENCY}
        onChange={handleInputChange}
      />
      <button
        className="checkout-style-background"
        type="submit"
        disabled={loading}
      >
        Donate {formatAmountForDisplay(input.customDonation, CURRENCY)}
      </button>
    </form>
  )
}

export default CheckoutForm
