import { createSelector } from 'reselect';

export const selectOrderState = state => {
    return state.orders 
};

export const selectOrders = createSelector(
    selectOrderState,
    state => state.data,
  );

export const selectFilteredOrders = createSelector(
    selectOrderState,
    state => state.filteredOrders,
  );
