import { NextPage } from 'next'
import { useSelector, useDispatch } from 'react-redux'
import moment from 'moment';
import { Card, Button } from 'react-bootstrap'
import { fetchGetJSON, fetchPostJSON } from '../utils/api-helpers'
import config, { OrderStatus, PaymentStatus, PaymentStatusTypes } from '../config'
import { filterOrdersAction, loadOrdersAction, fetchOrdersAction } from '../actions';
import { Form } from 'react-bootstrap';
import React, { useState, useEffect } from 'react'
import { selectFilteredOrders, selectOrders, selectOrderState } from '../selectors/orders-selectors';
import { toast } from 'react-toastify';

const MyOrdersPage: NextPage = () => {
  const dispatch = useDispatch();
  const [isOrderFetched, setIsOrderFetched] = useState(false);
  const { filterText } = useSelector(selectOrderState);
  const allOrders = useSelector(selectOrders);
  const filteredOrders = useSelector(selectFilteredOrders);

  const handleFetchOrder = () => {
    fetchGetJSON(
      'http://localhost:3000/api/orders/my-orders',
    ).then((response) => {
      if (response.statusCode === 500) {
        toast(response.message, { type: "error" });
        return;
      }
      dispatch(loadOrdersAction(response));
      toast(response.message, { type: "success" });
    });
  }

  useEffect(() => {

    handleFetchOrder()

  }, [])

  const handleStatusChange = (event) => {
    dispatch(filterOrdersAction(event.target.value))
  }

  const handleCancelOrder = (order) => {
    if (order.status === OrderStatus.REFUND_REQUESTED || order.status === OrderStatus.REFUNDED) {
      toast("Already a is Refund initiated or Refund done", { type: "success" });
      return;
    }
    fetchPostJSON(
      "http://localhost:3000/api/orders/request-cancel",
      { paymentId: order.payment.id }
    ).then((response) => {
      if (response.statusCode === 500) {
        toast(response.message, { type: "error" });
        return;
      }
      handleFetchOrder();
      toast(response.message, { type: "success" });
    })
  }

  return (
    <div className="page-container">
      <h1>
        My Orders

        <Form className="status-select">
          <Form.Group controlId="exampleForm.SelectCustom">
            <Form.Label className="label">Status Filter</Form.Label>
            <Form.Control as="select" custom onChange={handleStatusChange} value={filterText}>
              {PaymentStatusTypes.map((stats, index) => (
                <option key={index} value={stats}>{stats}</option>)
              )}
            </Form.Control>
          </Form.Group>
        </Form>
      </h1>

      <div>
        <a href="/"> Back to Products</a>
        <span className="count-span">Showing {filteredOrders?.length} of Total Orders {allOrders?.length} </span>
      </div>
      {
        !filteredOrders.length
          ?
          <Card>
            <Card.Body>
              <p className="text-center">No Orders Found !</p>
            </Card.Body>
          </Card>
          :
          filteredOrders?.map((order, index) => (
            <Card key={index}>
              <Card.Body>
                <div className="row order-section" key={index}>
                  <div className="col-lg-5">
                    <div className="order-label"> <span><b> Total Amount : </b> {order.payment.amount}</span></div>
                  </div>
                  <div className="col-lg-5">
                    <div className="order-label"> <span><b> Order Date : </b> {order?.formattedDate}</span></div>
                  </div>
                  <div className="col-lg-2">
                    {PaymentStatus.PAYMENT_COMPLETED == order.payment.status && [OrderStatus.ORDER_PLACED, OrderStatus.ORDER_DELIVERED].includes(order.status)
                      ? <Button variant="warning" onClick={() => handleCancelOrder(order)}>Cancel Order</Button> : ""}
                  </div>
                  <div className="col-lg-5">
                    <div className="order-label"> <span><b> Order Status : </b> {order.status}</span></div>
                  </div>
                  <div className="col-lg-5">
                    <div className="order-label"> <span><b> Payment Status : </b> {order.payment.status}</span></div>
                  </div>
                </div>

                {order.orderDetails?.map((orderDetail, index) => (
                  <div className="row" key={index}>
                    <div className="col-lg-5">
                      <div className="product-name-wrapper">
                        <div className="order-label"> <span><b> Product Name : </b></span></div>
                        <div>{orderDetail?.product?.name}</div>
                      </div>
                      {/* <div>
                      <div className="order-label"> <span><b> Product Price : </b></span></div>
                      <div>{orderDetail?.product?.price}</div>
                    </div> */}
                    </div>
                    <div className="col-lg-5">
                      <div>
                        <div className="order-label"> <span><b> Product Category : </b></span></div>
                        <div>{orderDetail?.product?.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          ))

      }
      <style jsx>{`
        .page-container {
          min-width: 70%;
        }

        .order-section {
          margin-bottom: 15px;
          border-bottom: 1px solid lightgray;
        }

        .h1 {
          margin-bottom: 25px;
        }


      `}</style>
    </div>
  )
}

export default MyOrdersPage


