export const CURRENCY = 'usd'
// Set your amount limits: Use float for decimal currencies and
// Integer for zero-decimal currencies: https://stripe.com/docs/currencies#zero-decimal.
export const MIN_AMOUNT = 10.0
export const MAX_AMOUNT = 5000.0
export const AMOUNT_STEP = 5.0

export const countOptions = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"
]


export const Country = [
    "Belgium", "Austria", "Germany", "Netherlands",
    "Poland", "Spain", "Italy", "Switzerland", "Russia", "Estonia"
] 

export enum PaymentStatus {
    PENDING = "Pending",
    PAYMENT_COMPLETED= "Payment Completed",
    FAILED= "Failed",
    CANCELED= "Canceled",
    VENDOR_REFUND= "Refunded from Vendor",
    CUSTOMER_CANCELED= "Customer Canceled",
}

export enum OrderStatus {
    ORDER_PLACED = "Order Placed",
    ORDER_DELIVERED = "Order Delivered",
    REFUND_REQUESTED = "Refund Requested",
    REFUNDED = "Refunded",
}

export const RefundReason = [
    { name: "Duplicate", type: 'duplicate'},
    { name: "Fraudulent", type: 'fraudulent'},
    { name: "Requested By Customer", type: 'requested_by_customer'}
]

export const PaymentStatusTypes = [
    "All", "Pending", "Payment Completed", "Failed", "Canceled", "Refunded from Vendor", 
    "Order Placed", "Order Delivered", "Refund Requested", "Refunded"
]

const config = {
    IP_CHECK_URL: "https://ipinfo.io/27.62.34.69/json?token=5da7f0e83e36e3",
    LAMBDA_URL: "https://8max636p6k.execute-api.ap-south-1.amazonaws.com/dev/pdf"
}

export default config;