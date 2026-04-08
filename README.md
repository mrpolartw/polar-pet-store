# Polar Pet Store — 前端專案

## 專案簡介
Polar Pet Store 為品牌電商前端專案，使用 React + Vite 建置。

本專案聚焦於：
- 品牌形象展示
- 會員登入 / 註冊流程
- 購物車與結帳流程
- 訂單查詢與會員中心

所有業務規則、資料驗證、價格計算、權限控管與付款處理，最終都必須由後端 API 負責。前端目前提供完整 UI、Service Layer、Mock 開發模式與基礎流程整合。

## 技術棧
- React 18 + Vite
- React Router v6
- lucide-react
- Native Fetch

## 專案結構
```text
src/
├─ api/           API Client 與 fetch 封裝
├─ assets/        靜態素材
├─ components/    可重用 UI 元件與共用元件
├─ constants/     路由與 API endpoint 常數
├─ context/       Auth / Cart Context 與對應 hooks 來源
├─ data/          前端展示用靜態資料
├─ guards/        ProtectedRoute / PublicRoute 路由守衛
├─ hooks/         共用 hooks 與 context wrapper hooks
├─ mocks/         開發用 mock 資料與 mock handlers
├─ pages/         頁面元件（Auth / Shop / Account 等）
├─ png/           專案使用圖片與插圖
├─ services/      Service Layer，負責與 API 或 mock 對接
├─ styles/        額外樣式資源
└─ utils/         格式化、驗證等工具函式
```

## 快速開始

### 安裝
```bash
npm install
```

### 環境變數設定
```bash
cp .env.example .env.local
```

編輯 `.env.local`：
```dotenv
VITE_API_BASE_URL=http://localhost:9000
VITE_USE_MOCK=true
```

### 開發模式
```bash
npm run dev
```

### 生產 Build
```bash
npm run build
```

## Mock 測試帳號（VITE_USE_MOCK=true）
| 帳號 | 密碼 | 說明 |
|---|---|---|
| test@polar.com | Test1234 | 一般測試帳號 |
| vip@polar.com | Vip12345 | VIP 鑽石會員 |

## 可測試的優惠碼
| 優惠碼 | 折扣 |
|---|---|
| POLAR2026 | -NT$200 |
| NEWMEMBER | -NT$100 |

## 後端交接說明

### API Base URL
所有 API 請求由 `VITE_API_BASE_URL` 讀取。

Service Layer 位於 `src/services/`，目前所有尚未正式串接的函式都保留 `// TODO: [BACKEND]` 標記，方便後端接手對照。

### 需後端實作的 API 清單

#### Auth Service
| 函式 | 建議 API |
|---|---|
| `login(email, password)` | `POST /store/auth` |
| `register(userData)` | `POST /store/auth/register` |
| `logout()` | `POST /store/auth/logout` |
| `getMe()` | `GET /store/auth/me` |
| `updateProfile(data)` | `PUT /store/customers/me` |
| `changePassword(oldPwd, newPwd)` | `POST /store/auth/change-password` |
| `requestPasswordReset(email)` | `POST /store/auth/password-reset` |

#### Cart Service
| 函式 | 建議 API |
|---|---|
| `getCart()` | `GET /store/carts` |
| `addItem(variantId, quantity)` | `POST /store/carts/items` |
| `removeItem(lineItemId)` | `DELETE /store/carts/items/:lineItemId` |
| `updateItem(lineItemId, quantity)` | `PUT /store/carts/items/:lineItemId` |
| `applyPromoCode(code)` | `POST /store/carts/promo-codes` |
| `removePromoCode()` | `DELETE /store/carts/promo-codes` |

#### Order Service
| 函式 | 建議 API |
|---|---|
| `createOrder(payload)` | `POST /store/orders` 或 `POST /store/carts/:id/complete` |
| `getOrder(orderId)` | `GET /store/orders/:orderId` |
| `getOrders()` | `GET /store/orders` |
| `validatePromoCode(code)` | `POST /store/promo-codes/validate` |

#### Product Service
| 函式 | 建議 API |
|---|---|
| `getProducts(filters)` | `GET /store/products` |
| `getProduct(slug)` | `GET /store/products/:slug` |
| `getCategories()` | `GET /store/product-categories` |

#### Customer Service
| 函式 | 建議 API |
|---|---|
| `getCustomerProfile()` | `GET /store/customers/me` |
| `updateCustomerProfile(data)` | `PUT /store/customers/me` |
| `getAddresses()` | `GET /store/customers/me/addresses` |
| `createAddress(payload)` | `POST /store/customers/me/addresses` |
| `updateAddress(addressId, payload)` | `PUT /store/customers/me/addresses/:addressId` |
| `deleteAddress(addressId)` | `DELETE /store/customers/me/addresses/:addressId` |

### 金流串接注意事項
`src/pages/Shop/Checkout.jsx` 的信用卡欄位目前僅為 UI 佔位，檔案內已保留 `// TODO: [PAYMENT]` 標記。

正式上線前必須改為金流商 Hosted Fields / Elements，例如：
- 藍新金流
- ECPay
- TapPay
- Stripe Elements

絕對不可讓卡號、有效期限、CVV 經過自身伺服器，避免違反 PCI-DSS。

### 錯誤監控
`src/components/common/ErrorBoundary.jsx` 中已保留 `// TODO: [MONITORING]` 標記。

建議於 production 接入：
- Sentry
- Bugsnag
- Datadog RUM

## 環境變數說明
| 變數 | 說明 | 預設值 |
|---|---|---|
| `VITE_API_BASE_URL` | 後端 API 位址 | `http://localhost:9000` |
| `VITE_USE_MOCK` | 啟用 Mock 模式 | `false` |

## 上線前必做
- [ ] 移除 `src/mocks/` 或確認 `VITE_USE_MOCK=false`
- [ ] 確認 `VITE_API_BASE_URL` 指向正式後端
- [ ] 替換信用卡欄位為金流商 Hosted Fields
- [ ] 接入錯誤監控系統（Sentry 等）
- [ ] 壓縮 SVG 圖檔（目前部分 SVG 超過 2MB）
