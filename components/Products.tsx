import products from '../data/products.json'
import { useShoppingCart, formatCurrencyString } from 'use-shopping-cart'
import { useState } from 'react';
import { countOptions } from '../config';

const Products = () => {
  const { addItem, removeItem } = useShoppingCart()
  const [productList, setProducts] = useState(products)

  const setSelectedOption = (value, productId) => {
    const product = products.find((product) => product.id == productId);
    product.count = value;
    setProducts(products => [...products]);
  }

  const handleAddItem = (product) => {
    const count = (product.count == '10+' ? 10 : Number.parseInt(product.count));
    const productInfo = {
      ...product,
      price: product.price * count
    }
    addItem(productInfo);
  }

  return (
    <section className="products">
      {productList.map((product) => (
        <div key={product.sku} className="product">
          <img src={product.image} alt={product.name} />
          <h2>{product.name}</h2>
          <p className="price">
            {formatCurrencyString({
              value: product.price,
              currency: product.currency,
            })}
            <select className="item-count-select" 
            onChange={(e) => setSelectedOption(e.target.value, product.id)} value={product.count} >
              {countOptions && countOptions.map((count) => (
                <option key={count} value={count} >{count}</option>
              ))
              }
            </select>
          </p>
          <button
            className="cart-style-background"
            onClick={() => handleAddItem(product)}
          >
            Add to cart
          </button>
          <button
            className="cart-style-background"
            onClick={() => removeItem(product.sku)}
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  )
}

export default Products
