# MrPolarStore 前台知識庫

> React 19 + WooCommerce API 前端開發參考手冊

---

## 專案架構

```
polar-pet-store/
├── src/
│   ├── lib/
│   │   ├── woocommerce.js          # WooCommerce / MrPolar API 客戶端（主要使用）
│   │   └── medusa.js               # 已廢棄 stub，保留避免未遷移 import 出錯
│   ├── context/
│   │   ├── AuthContext.jsx         # 全域登入狀態（user, login, logout, updateProfile...）
│   │   ├── CartContext.jsx         # 全域購物車（cartItems, addToCart, removeFromCart...）
│   │   ├── authUtils.js            # getMemberTier(points) — 純函式
│   │   ├── useAuth.js              # useContext(AuthContext) hook
│   │   └── useCart.js              # useContext(CartContext) hook
│   ├── api/                        # API 呼叫封裝（pages/components 禁止直接 import woocommerce）
│   │   ├── products.js             # listProducts() / retrieveProduct()
│   │   ├── orders.js               # listMyOrders() / retrieveOrder()
│   │   ├── cart.js
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
│   │       ├── Checkout.jsx        # 結帳
│   │       ├── OrderSuccess.jsx    # 訂單成功頁
│   │       ├── OrderQuery.jsx      # 訂單查詢（無需登入）
│   │       └── ProductRegister.jsx # 產品保固登錄
│   ├── components/
│   │   ├── HeroCarousel.jsx
│   │   ├── ExpandableCard.jsx
│   │   ├── CustomCursor.jsx
│   │   └── common/
│   ├── App.jsx                     # 路由定義
│   └── main.jsx                    # AuthProvider + CartProvider 最外層包裹
├── public/
├── cloudbuild.yaml                 # GCP Cloud Build 設定
├── Dockerfile
└── .env.example
```

---

## 核心設計原則

### 分層架構（重要）

```
pages/      → 路由頁面，只組合 components，不含業務邏輯
components/ → 純 UI，props in / events out
context/    → 全域狀態（含 API 呼叫）
hooks/      → 可複用邏輯（含 API 呼叫）
api/        → 所有 API 呼叫封裝在此
utils/      → 純函式，無副作用
```

**禁止：** `pages/` 與 `components/` 直接 `import { auth, mrpolar } from '../../lib/woocommerce'`
**正確：** 透過 `api/` 函式或 `context/` hook 使用

---

## WooCommerce API 使用方式

### 初始化（`src/lib/woocommerce.js`）

```javascript
const WC_URL = import.meta.env.VITE_WC_URL || 'http://localhost:8080'
```

### 常用 API 呼叫範例

```javascript
import { auth, mrpolar, store } from '../lib/woocommerce'

// ── 認證 ──
await auth.login(email, password)     // POST /wp-json/jwt-auth/v1/token
await auth.validate()                 // POST /wp-json/jwt-auth/v1/token/validate

// ── 會員 ──
await mrpolar.register(userData)      // POST /wp-json/mrpolar/v1/register
await mrpolar.getMe()                 // GET  /wp-json/mrpolar/v1/me
await mrpolar.updateMe(data)          // PATCH /wp-json/mrpolar/v1/me
await mrpolar.changePassword(old, new) // POST /wp-json/mrpolar/v1/change-password
await mrpolar.updatePets(pets)        // POST /wp-json/mrpolar/v1/customer/pets

// ── 地址 ──
await mrpolar.getAddresses()          // GET    /wp-json/mrpolar/v1/customer/addresses
await mrpolar.addAddress(addr)        // POST   /wp-json/mrpolar/v1/customer/addresses
await mrpolar.updateAddress(id, addr) // PUT    /wp-json/mrpolar/v1/customer/addresses/:id
await mrpolar.deleteAddress(id)       // DELETE /wp-json/mrpolar/v1/customer/addresses/:id

// ── 商品 ──
await store.products.list(params)     // GET /wp-json/wc/v3/products
await store.products.get(id)          // GET /wp-json/wc/v3/products/:id
```

---

## Context 使用方式

### AuthContext

```javascript
import { useAuth } from '../../context/useAuth'

const {
  user,           // { id, name, email, phone, points, pets, tier }
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
  cartItems,        // [{ id, productId, name, price, quantity, image }]
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
  []
)
```

---

## LocalStorage / SessionStorage 規範

| Key | Storage | 型別 | 說明 |
|---|---|---|---|
| `polar_logged_in` | localStorage | `"true"` / 不存在 | 登入狀態標記 |
| `polar_cart_id` | localStorage | string | 購物車 ID |
| `polar_wc_token` | sessionStorage | string | JWT token（關閉分頁即清除）|

**安全規則：** JWT token 存 sessionStorage，不存 localStorage。不在任何 storage 存放個人資料。

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
- `useAuth()` / `useCart()` 在 Provider 內呼叫時，只取需要的值

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
