import {
  TODO_ONCHANGE,
  TODO_ADD,
  TODO_DELETE,
  FETCH_CART,
  LOAD_ORDERS,
  FETCH_ORDERS,
  FILTER_ORDERS
} from '../constants/actionTypes';

export const onChangeTodo = (item) => ({ type: TODO_ONCHANGE, item });

export const addTodo = (item) => ({ type: TODO_ADD, item });

export const deleteTodo = (item) => ({ type: TODO_DELETE, item });

export const fetchCartAction = () => ({ type: FETCH_CART });

export const addItemToCartAction = () => ({ type: FETCH_CART });

export const fetchOrdersAction = () => ({ type: FETCH_ORDERS });

export const loadOrdersAction = (data) => ({ type: LOAD_ORDERS, data });

export const filterOrdersAction = (filterText) => ({ type: FILTER_ORDERS, filterText });

