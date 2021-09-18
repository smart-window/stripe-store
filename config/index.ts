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

export enum PaymentStateType {
    SUCCEEDED = "succeeded",
    CANCELLED = "canceled",
    REFUND = "refund",
}

export const countryTypePaymentMethodsMap = {
    Belgium: ['bancontact', 'sofort'],
    Austria: ['eps', 'sofort'],
    Germany: ['giropay', 'sofort'],
    Netherlands: ['ideal', 'sofort'],
    Poland: ['p24'],
    Spain: ['sofort'],
    Italy: ['sofort'],
    Switzerland: ['sofort'],
  }

const config = {
    API_URL: "http://localhost:3000/api",
    CUSTOMER_REQUESTED_REASON: "requested_by_customer",
    IP_CHECK_URL: "https://ipinfo.io/json?token=5da7f0e83e36e3",
    LAMBDA_URL: "https://8max636p6k.execute-api.ap-south-1.amazonaws.com/dev/pdf"
}

export default config;

export const MailContent = {
    REFUNDED : {title: "Refund Initiated",body : "Payment refund initiated for one of your order {orderId}. Payment will be credited to your account 3 to 7 days." },
    CANCELLED : {title: "Cancellation Requested",body : "A product order cancellation requested from the customer for order {orderId}. please go visit ({ORDER_URL}) to accept it." },
    FAILED : {title: "Payment Failed",body : "Your payment has been failed for order {orderId}. please retry the payment later." },
   
}