import { sdk } from './src/lib/medusa.js'
async function run() {
  const { products } = await sdk.store.product.list({ limit: 1 })
  console.log(JSON.stringify(products[0], null, 2))
}
run()
