import { NextPage } from 'next'
import { useSelector, useDispatch } from 'react-redux'
import moment from 'moment';
import orders, { OrderState } from '../reducers/orders-reducer';
import { Card, Button, Modal } from 'react-bootstrap'
import { fetchGetJSON, fetchPostJSON } from '../utils/api-helpers'
import config, { OrderStatus, PaymentStatus, PaymentStatusTypes, RefundReason } from '../config'
import { fetchOrdersAction, filterOrdersAction, loadOrdersAction } from '../actions';
import { Form } from 'react-bootstrap';
import React, { useState, useEffect } from 'react'
import { selectFilteredOrders, selectOrders, selectOrderState } from '../selectors/orders-selectors';
import { toast } from 'react-toastify';

const OrdersPage: NextPage = () => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState('');
  const [activeOrder, setActiveOrder] = useState({});
  const { filterText } = useSelector(selectOrderState);
  const allOrders = useSelector(selectOrders);
  const filteredOrders = useSelector(selectFilteredOrders);


  const handleOrdersFetch = () => {
    fetchGetJSON(
      'http://localhost:3000/api/orders',
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
    handleOrdersFetch();
  }, [dispatch])

  const handleCancelOrder = (order, type) => {
    fetchPostJSON(
      "http://localhost:3000/api/orders",
      { paymentId: order.payment.paymentSessionId, type }
    ).then((response) => {
      if (response.statusCode === 500) {
        toast(response.message, { type: "error" });
        return;
      }
      handleOrdersFetch();
      toast(response.message, { type: "success" });
    })
  }

  const handleClose = () => setShow(false);

  const handleShow = () => setShow(true);

  const handleSave = () => {
    if(!reason) {
      toast("Please select a reason", { type: "warning" });
      return;
    }
    handleCancelOrder(activeOrder, reason);
    handleClose();
  };

  const handleReasonChange = (reason) => {
    setReason(reason);
  };

  const handleRefund = (order) => {
    setActiveOrder(order);
    handleShow();
  }

  const handleStatusChange = (event) => {
    dispatch(filterOrdersAction(event.target.value))
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
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Refund </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formReason">
                <Form.Label>Refund Reason</Form.Label>
                <Form.Control as="select" custom onChange={handleReasonChange}>
                  {RefundReason.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>)
                  )}
                </Form.Control>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>

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
                    {PaymentStatus.PAYMENT_COMPLETED == order.payment.status && [OrderStatus.REFUND_REQUESTED].includes(order.status)
                      ? <Button variant="primary" onClick={() => handleCancelOrder(order, PaymentStatus.CUSTOMER_CANCELED)}>Accept Cancellation</Button> : ""}

                    {PaymentStatus.PAYMENT_COMPLETED == order.payment.status && [OrderStatus.ORDER_DELIVERED, OrderStatus.ORDER_PLACED].includes(order.status)
                      ? <Button variant="warning" onClick={() => handleRefund(order)}>Refund</Button> : ""
                    }
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

export default OrdersPage


