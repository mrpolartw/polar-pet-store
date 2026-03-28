# MrPolarStore 前台知識庫

> React 19 + Medusa SDK 前端開發參考手冊

---

## 專案架構

```
polar-pet-store/
├── src/
│   ├── lib/
│   │   └── medusa.js               # SDK 初始化（唯一的 sdk 實例出口）
│   ├── context/
│   │   ├── AuthContext.jsx         # 全域登入狀態（user, login, logout, updateProfile...）
│   │   ├── CartContext.jsx         # 全域購物車（cartItems, addToCart, removeFromCart...）
│   │   ├── authUtils.js            # getMemberTier(points) — 純函式
│   │   ├── useAuth.js              # useContext(AuthContext) hook
│   │   └── useCart.js              # useContext(CartContext) hook
│   ├── api/                        # 所有 Medusa SDK 呼叫封裝（pages/components 禁止直接 import sdk）
│   │   ├── products.js             # listProducts() / retrieveProduct()
│   │   ├── orders.js               # listMyOrders() / retrieveOrder()
│   │   ├── cart.js                 # （保留，CartContext 直接使用 sdk）
│   │   └── index.js                # re-export 全部 API 函式
│   ├── hooks/
│   │   ├── useApi.js               # 通用 data fetching hook
│   │   └── useScrollReveal.js      # 捲動進場動畫
│   ├── utils/
│   │   └── constants.js            # 業務常數（等級門檻、運送、付款、狀態標籤）
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Category.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx        # 多步驟（4 步）
│   │   │   └── ForgotPassword.jsx
│   │   ├── Account/
│   │   │   └── Account.jsx         # 6 個 Tab 的會員中心
│   │   └── Shop/
│   │       ├── Products.jsx        # 商品列表
│   │       ├── Cart.jsx            # 購物車
│   │       ├── Checkout.jsx        # 結帳（完整 Medusa checkout flow）
│   │       ├── OrderSuccess.jsx    # 訂單成功頁
│   │       ├── OrderQuery.jsx      # 訂單查詢（無需登入）
│   │       └── ProductRegister.jsx # 產品保固登錄
│   ├── components/
│   │   ├── HeroCarousel.jsx
│   │   ├── ExpandableCard.jsx
│   │   ├── CustomCursor.jsx
│   │   └── common/
│   │       ├── Counter.jsx
│   │       └── ImageWithFallback.jsx
│   ├── App.jsx                     # 路由定義
│   └── main.jsx                    # AuthProvider + CartProvider 最外層包裹
├── public/
├── cloudbuild.yaml                 # GCP Cloud Build 設定
├── Dockerfile
└── .env.template
```

---

## 核心設計原則

### 分層架構（重要）

```
pages/      → 路由頁面，只組合 components，不含業務邏輯
components/ → 純 UI，props in / events out
context/    → 全域狀態（含 API 呼叫）
hooks/      → 可複用邏輯（含 API 呼叫）
api/        → 所有 Medusa SDK 呼叫封裝在此
utils/      → 純函式，無副作用
```

**禁止：** `pages/` 與 `components/` 直接 `import { sdk } from '../../lib/medusa'`
**正確：** 透過 `api/` 函式或 `context/` hook 使用

---

## Medusa SDK 使用方式

### 初始化（`src/lib/medusa.js`）

```javascript
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_API_URL,
  publishableKey: import.meta.env.VITE_MEDUSA_API_KEY,
})
```

### 常用 API 呼叫範例

```javascript
// ── 認證 ──
await sdk.auth.login("customer", "emailpass", { email, password })
await sdk.auth.logout()
await sdk.auth.getToken("customer", "emailpass", { email, password })
await sdk.auth.updateProvider("customer", "emailpass", { email, password })

// ── 顧客 ──
await sdk.store.customer.retrieve()
await sdk.store.customer.update({ first_name, phone, metadata })

// ── 購物車 ──
await sdk.store.cart.create({})
await sdk.store.cart.retrieve(cartId)
await sdk.store.cart.update(cartId, { email, shipping_address, metadata })
await sdk.store.cart.createLineItem(cartId, { variant_id, quantity })
await sdk.store.cart.updateLineItem(cartId, lineItemId, { quantity })
await sdk.store.cart.deleteLineItem(cartId, lineItemId)
await sdk.store.cart.listShippingOptions(cartId)
await sdk.store.cart.addShippingMethod(cartId, { option_id })
await sdk.store.cart.complete(cartId)  // 回傳 { type: "order", order: {...} }

// ── 商品 ──
await sdk.store.product.list({ q, category_id, limit, offset })
await sdk.store.product.retrieve(id)

// ── 訂單 ──
await sdk.store.order.list({ limit, offset })
await sdk.store.order.retrieve(id)
```

---

## Context 使用方式

### AuthContext

```javascript
import { useAuth } from '../../context/useAuth'

const {
  user,           // { id, name, email, phone, points, pets, tier, metadata }
  isLoggedIn,     // boolean
  isLoading,      // boolean
  authError,      // string | null
  login,          // async (email, password) => void
  logout,         // () => void
  register,       // async (data) => void
  updateProfile,  // async ({ name, phone, gender, birthday }) => void
  updatePets,     // async (newPetsArray) => void
  changePassword, // async (oldPassword, newPassword) => void
} = useAuth()
```

### CartContext

```javascript
import { useCart } from '../../context/useCart'

const {
  cartItems,        // [{ id, variantId, productId, name, specs, price, quantity, image }]
  medusaCart,       // Medusa 原始購物車物件（含 id）
  cartId,           // string | null
  isCartLoading,    // boolean
  addToCart,        // async (item) => void
  removeFromCart,   // async (id) => void
  updateQuantity,   // async (id, quantity) => void
  clearCart,        // () => void
  subtotal,         // number（NT$）
  itemCount,        // number
} = useCart()
```

---

## useApi Hook

```javascript
import { useApi } from '../../hooks/useApi'
import { listMyOrders } from '../../api'

const { data, isLoading, error, refetch } = useApi(
  () => listMyOrders({ limit: 10 }),
  []   // deps array，同 useEffect
)
```

---

## LocalStorage 規範

| Key | 型別 | 說明 |
|---|---|---|
| `polar_logged_in` | `"true"` / 不存在 | 登入狀態標記（非 JWT，只是 boolean） |
| `polar_cart_id` | string | Guest 購物車 ID |

**安全規則：** 不在 localStorage 存放 JWT、Token 或個人資料。

---

## 常數管理（`src/utils/constants.js`）

```javascript
export const MEMBER_TIER_THRESHOLD = { SILVER: 1000, GOLD: 3000, DIAMOND: 8000 }

export const SHIPPING_METHODS = {
  HOME_DELIVERY: 'home_delivery',
  CVS:           'cvs',
}

export const PAYMENT_METHODS = {
  CREDIT:    'credit',
  LINEPAY:   'linepay',
  APPLEPAY:  'applepay',
  TRANSFER:  'transfer',
}

export const ORDER_STATUS_LABELS = {
  pending:          '待處理',
  processing:       '處理中',
  completed:        '已完成',
  cancelled:        '已取消',
  requires_action:  '需確認',
}
```

---

## Checkout 完整流程

```
1. cart.update(cartId, { email, shipping_address, metadata: { buyer_phone, payment_method } })
          ↓
2. cart.addShippingMethod(cartId, { option_id: selectedShippingOptionId })
          ↓
3. cart.complete(cartId)
          ↓
4. result.type === "order" → clearCart() → navigate("/order-success?id=<orderId>")
```

---

## 訂單查詢 API（公開端點）

```javascript
// 無需 SDK，直接 fetch（不需 auth）
const res = await fetch(
  `${VITE_MEDUSA_API_URL}/store/orders/query?order_id=PL-1`,
  { headers: { 'x-publishable-api-key': VITE_MEDUSA_API_KEY } }
)
const { orders } = await res.json()
// orders[0].id = "PL-1"
// orders[0].status = "ordered" | "processing" | "shipped" | "delivered" | "cancelled"
// orders[0].timeline = [{ label, time, done }]
// orders[0].items = [{ id, name, specs, quantity, price, image }]
```

---

## 顧客物件格式（前台）

`AuthContext` 的 `mapMedusaCustomer()` 將後端資料轉換為：

```javascript
{
  id:        "cus_xxx",
  name:      "王小明",          // first_name + last_name
  email:     "xxx@example.com",
  phone:     "0912345678",
  gender:    "male",           // 存在 metadata.gender
  birthday:  "1990-01-01",     // 存在 metadata.birthday
  points:    1500,             // metadata.points
  tier:      "Polar Silver",   // getMemberTier(points) 換算
  pets:      [...],            // metadata.pets
  metadata:  { ... },         // 原始 metadata
}
```

---

## 命名規範

| 類型 | 規則 | 範例 |
|---|---|---|
| 元件檔 | PascalCase | `CheckoutForm.jsx` |
| Hook | `use` 開頭 camelCase | `useCartTotal.js` |
| 工具函式檔 | camelCase | `formatPrice.js` |
| 常數 | UPPER_SNAKE_CASE | `MEMBER_TIER_THRESHOLD` |
| CSS class | kebab-case | `.cart-item-wrapper` |

---

## ESLint 規則注意事項

- 未使用的變數若需保留（僅供 side-effect），以底線前綴：`_unusedVar`
- `useAuth()` / `useCart()` 在 Provider 內呼叫時，只取需要的值（避免 `isLoggedIn assigned but never used`）

---

## 路由結構（`src/App.jsx`）

```
/                   → Home
/about              → About
/category           → Category
/shop               → Products
/cart               → Cart
/checkout           → Checkout（需有購物車）
/order-success      → OrderSuccess
/order-query        → OrderQuery（不需登入）
/product-register   → ProductRegister
/login              → Login
/register           → Register
/forgot-password    → ForgotPassword
/account            → Account（需登入）
/orders             → Account（訂單 Tab）
/favorites          → Account（收藏 Tab）
```
