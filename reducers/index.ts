import { combineReducers } from 'redux';
import todo, { initialState as todoState } from './todo';
import orders, { initialState as orderState } from './orders-reducer';

export const initialState = {
  todo: todoState,
  orders: orderState
};

export default combineReducers({
  todo,
  orders
});
