import _ from 'lodash';
import moment from 'moment';
import { PaymentStatus } from '../config';
import {
  TODO_ONCHANGE,
  TODO_ADD,
  TODO_DELETE,
  LOAD_ORDERS,
  FILTER_ORDERS,
} from '../constants/actionTypes';

export interface OrderState {
  filterText: PaymentStatus;
  data: any[];
  filteredOrders: any[];
};

export const initialState: any = {
  filterText: PaymentStatus.PAYMENT_COMPLETED,
  data: [],
  filteredOrders: []
};

 const myOrderReducer = (state = initialState, action) => {
  const {
    type,
    data,
    filterText
  } = action;

  switch (type) {
    case LOAD_ORDERS: {
      const newState = {...state };
      newState.data = data;
      newState.filteredOrders = _.sortBy(state.data.filter(order => {
        return order.payment.status === state.filterText || order.status === state.filterText || state.filterText === "All";
      }), "createdDate").reverse();
      _.each(newState.filteredOrders, (order) => {
        const local = moment(order.createdDate).local();
        order.formattedDate = local.format("YYYY-MM-DD hh:mm:ss A");
      });
     return newState
    } 
    case FILTER_ORDERS: {
      const newState = {...state, filterText };
      newState.filteredOrders = _.sortBy(state.data.filter(order => {
        return order.payment.status === filterText || order.status === filterText || filterText === "All";
      }), "createdDate").reverse();
      _.each(newState.filteredOrders, (order) => {
        const local = moment(order.createdDate).local();
        order.formattedDate = local.format("YYYY-MM-DD hh:mm:ss A");
      });
     return newState
    }

    default: {
      return state;
    }
  }
};


export default myOrderReducer;