import { MailContent } from "../config"

export function formatAmountForDisplay(
  amount: number,
  currency: string
): string {
  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  return numberFormat.format(amount)
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {
  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency: boolean = true
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

export function getMessageContent(type) {
  let mailContent = { title: null, body: null };
  switch (type) {
    case "charge.refunded":
      mailContent = MailContent.REFUNDED;
      break;
    case "payment_intent.canceled":
      mailContent = MailContent.FAILED;
      break;
    case "payment_intent.payment_failed":
      mailContent = MailContent.FAILED;
      break;
    default:
      mailContent = mailContent;
      break;
  }
  return mailContent;
};