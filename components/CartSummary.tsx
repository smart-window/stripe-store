import { getAllInfoByISO, getISOByParam } from 'iso-country-currency'
import _ from 'lodash'
import React, { useState, useEffect } from 'react'

import { useShoppingCart } from 'use-shopping-cart'
import config, { Country } from '../config'
import { fetchGetJSON, fetchPostJSON } from '../utils/api-helpers'

const CartSummary = () => {
  const [loading, setLoading] = useState(false)
  const [cartEmpty, setCartEmpty] = useState(true)
  const [clientDetail, setClientDetails] = useState(null);
  const [selectedCountry, setCountry] = useState("");
  const [countries, setCountries] = useState(Country);

  const {
    formattedTotalPrice,
    cartCount,
    clearCart,
    cartDetails,
    addItem,
    redirectToCheckout,
  } = useShoppingCart()

  useEffect(() => setCartEmpty(!cartCount), [cartCount])

  useEffect(() => {
    if(!_.find(countries, (countryStr) => countryStr === config.defaultCountryName)) {
      setCountries((countries) => [...countries, config.defaultCountryName]);
    }
    setCountry(() => config.defaultCountryName);
  }, []);

  const handleCheckout: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault()
    setLoading(true)
    const countryIso = getISOByParam('countryName', selectedCountry)
    const countryInfo = getAllInfoByISO(countryIso);
    const response = await fetchPostJSON(
      '/api/checkout_sessions/cart',
      {
        cartDetails,
        userId: 1,
        countryName: countryInfo.countryName,
        countryISOString: countryInfo.iso,
        currency: countryInfo.currency
      }
    )

    if (response.statusCode === 500) {
      console.error(response.message)
      return
    }
    clearCart()
    redirectToCheckout({ sessionId: response.id });
  }

  const handleCountryChange = (value) => {
    setCountry(() => value);
  } 

  return (
    <form onSubmit={handleCheckout}>
      <h2>
        <span>Cart summary</span>
        <div className="country-select">
          <label htmlFor="country">Country</label>
        <select name="" id="country"
        onChange={(e) => handleCountryChange(e.target.value)} value={selectedCountry}>
          {
            countries.map(countryStr => (
              <option key={countryStr} value={countryStr}>{countryStr}</option>
            ))
          }
        </select>
        </div>
       
      </h2>
      {/* This is where we'll render our cart */}
      <p suppressHydrationWarning>
        <strong>Number of Items:</strong> {cartCount}
      </p>
      <p suppressHydrationWarning>
        <strong>Total:</strong> {formattedTotalPrice}
      </p>

      <button
        className="cart-style-background"
        type="submit"
        disabled={cartEmpty || loading}
      >
        Checkout
      </button>
      <button
        className="cart-style-background"
        type="button"
        onClick={clearCart}
      >
        Clear Cart
      </button>
      <style jsx>{`
        .country-select {
          font-size: 15px;
          float: right;
        }
        .country-select label {
          margin-right: 10px;
          color: black;
        }
        .country-select select {
          height: 35px;
        }
      `}</style>
    </form>
  )
}

export default CartSummary
