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
    "Poland", "Spain", "Italy", "Switzerland"
] 

export enum OrderStatus {
    PENDING = "pending",
    PAYMENT_DONE= "payment done",
}
export enum PaymentStatus {
    PENDING = "pending",
    DONE= "done",
    FAILED= "failed",
    CANCELED= "canceled",
}

const config = {
    IP_CHECK_URL: "https://ipinfo.io/27.62.34.69/json?token=5da7f0e83e36e3",
    LAMBDA_URL: "https://0h7un0j137.execute-api.ap-south-1.amazonaws.com/triggeremail"
}

export default config;