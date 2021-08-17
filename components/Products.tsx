import products from '../data/products.json'
import { useShoppingCart, formatCurrencyString } from 'use-shopping-cart'
import { useEffect, useState } from 'react';
import { countOptions } from '../config';
import { fetchGetJSON, fetchPostJSON } from '../utils/api-helpers';
import _ from 'lodash';

const Products = () => {
  const { addItem, removeItem } = useShoppingCart()
  const [productList, setProducts] = useState(products)

  const setSelectedOption = (value, productId) => {
    const product = productList.find((product) => product.id == productId);
    product.count = value;
    setProducts(products => [...products]);
  }
  useEffect(() => {
    fetchGetJSON(
      '/api/products'
    ).then((response) => {
      if (response.statusCode === 500) {
        console.error(response.message)
        return;
      }
      _.each(response.data, product => {
        product.count = 1;
        product.sku = product.id.toString();
      })
      setProducts(() => response.data);
    })
  }, []);

  const handleAddItem = async (product) => {
    const count = (product.count == '10+' ? 10 : Number.parseInt(product.count));
    const productInfo = {
      ...product,
      price: product.price
    }
    addItem(productInfo, count);
  }

  return (
    <section className="products">
      {productList.map((product) => (
        <div key={product.id} className="product">
          <img src={product.image} alt={product.name} />
          <h2>{product.name}</h2>
          <p className="price">
            {formatCurrencyString({
              value: product.price,
              currency: 'USD',
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
