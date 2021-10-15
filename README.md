## Features

- Minimal but well structured
- No CSS, only TypeScript
- We can learn these stacks:
  - [next](https://npm.im/next)
  - [react](https://npm.im/react)
  - [redux](https://npm.im/redux) and [react-redux](https://npm.im/react-redux)
  - [redux-thunk](https://npm.im/redux-thunk)
  - [reselect](https://npm.im/reselect)
  - [recompose](https://npm.im/recompose)

## Usage

```bash
# installation
$ git clone https://gitlab.com/ProDev555/stripe-store.git
$ cd stripe-store
$ yarn (or `npm install`)

# development mode
$ yarn dev (or `npm run dev`)

# production mode
$ yarn build (or `npm run build`)
$ yarn start (or `npm start`)
```

# To test the payment flow in local

# 1. Place the .env file in the project root with strip keys, webhook key and lambda trigger keys
# 2. Use the stripe test cards for card payments
- 4242424242424242  for success flow test
# 3. To test webhook and lambda email trigger
  - install stripe cli from https://stripe.com/docs/stripe-cli also refer https://stripe.com/docs/webhooks/integration-builder
  - extract downloaded zip and open stripe cli in cmd for windows
  - cd path-to-stripe-extrated-folder and you will see a stripe.exe file from this directory execute following commands
  - login the strip cli. This will open the browser and your stripe account. Accept the verification by login into your stripe account.
   $ stripe login
  - listen to the webhook and redirect to localhost
   $ stripe listen --forward-to localhost:3000/api/webhooks
   