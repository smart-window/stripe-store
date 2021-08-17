import _ from 'lodash';
import {
  TODO_ONCHANGE,
  FETCH_CART,
  PRODUCT_ADD,
  PRODUCT_SUCCESS
} from '../constants/actionTypes';
import { fetchGetJSON } from '../utils/api-helpers';

export const productInitialState = {
  cartItems: [],
};

const productReducer = async (state = productInitialState, action) => {
  const {
    type,
    item,
  } = action;

  switch (type) {
    case TODO_ONCHANGE: {
      return Object.assign({}, state, {
        item,
      });
    }
    case FETCH_CART: {
      const userId = 1;
      const response = await fetchGetJSON(
        '/api/cart/' + userId
      );
      if (response.statusCode === 500) {
        console.error(response.message)
        return;
      }
      return Object.assign({}, state, {
        cartItems: response.cartItems
      });
    }

    default: {
      return state;
    }
  }
};


export default productReducer;