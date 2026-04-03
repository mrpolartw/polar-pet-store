# MrPolarStore 前台開發進度

> 最後更新：2026-04-03（本地開發環境切換至 LocalWP，前台 dev server 啟動完成）

---

## 技術棧

- **Framework:** React 19 + Vite 7
- **Router:** React Router v7
- **動畫:** Framer Motion
- **API 整合:** WooCommerce REST API + MrPolar 自訂 API（`src/lib/woocommerce.js`）
- **部署:** GCP Cloud Run（`polar-pet-store`）

---

## ✅ 已完成功能

### 認證系統（Auth）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 登入 | `src/pages/Auth/Login.jsx` | Email + 密碼登入，呼叫 JWT 認證 API |
| 多步驟註冊 | `src/pages/Auth/Register.jsx` | 4 步驟：帳號→個人資料→毛孩→完成 |
| 忘記密碼 | `src/pages/Auth/ForgotPassword.jsx` | 傳送重設連結 |
| 全域登入狀態 | `src/context/AuthContext.jsx` | `AuthProvider`，管理 user / isLoggedIn / isLoading |
| 個人資料更新 | `AuthContext.jsx → updateProfile()` | 呼叫 `PATCH /wp-json/mrpolar/v1/me` |
| 密碼變更 | `AuthContext.jsx → changePassword()` | 呼叫 `POST /wp-json/mrpolar/v1/change-password` |
| 毛孩資料更新 | `AuthContext.jsx → updatePets()` | 呼叫 `POST /wp-json/mrpolar/v1/customer/pets` |
| 會員等級換算 | `src/context/authUtils.js` | `getMemberTier(points)` 引用 constants.js 常數 |

### 購物車（Cart）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 全域購物車狀態 | `src/context/CartContext.jsx` | `CartProvider`，管理本地購物車狀態 |
| 加入購物車 | `addToCart()` | 加入商品並同步 localStorage |
| 移除商品 | `removeFromCart()` | 樂觀更新 |
| 更新數量 | `updateQuantity()` | 樂觀更新 |
| 清空購物車 | `clearCart()` | 清除 state + localStorage |
| 購物車頁面 | `src/pages/Shop/Cart.jsx` | 顯示品項、數量調整、小計 |

### 商品（Products）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 商品列表 | `src/pages/Shop/Products.jsx` | 從 WooCommerce API 獲取商品 |
| API 封裝 | `src/api/products.js` | `listProducts()` / `retrieveProduct()` |

### 結帳（Checkout）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 結帳頁面 | `src/pages/Shop/Checkout.jsx` | 購買人資訊、運送方式、付款方式、發票 |
| 購買人資訊預填 | Checkout.jsx | 自動填入登入會員的姓名/電話/Email |
| 運送方式 | Checkout.jsx | 宅配到府 / 超商取貨 |
| 付款方式 | Checkout.jsx | 信用卡 / LINE Pay（透過 PayUni UPP 跳轉）|
| 發票選擇 | Checkout.jsx | 會員載具 / 手機條碼 / 統一編號 / 捐贈碼 |
| 訂單成功頁 | `src/pages/Shop/OrderConfirm.jsx` | 顯示訂單資訊 |

### 訂單查詢（OrderQuery）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 訂單查詢頁 | `src/pages/Shop/OrderQuery.jsx` | 不需登入，以訂單編號或電話查詢 |
| 訂單進度時間軸 | OrderQuery.jsx | 4 階段進度顯示 |
| 姓名遮罩 | OrderQuery.jsx | 保護收件人隱私（王小明 → 王*明）|

### 會員中心（Account）

| Tab | 狀態 | 說明 |
|---|---|---|
| 個人資料 | ✅ 完成 | 顯示點數、等級進度條、編輯姓名/電話/性別，毛孩管理（新增/編輯/刪除）|
| 我的訂單 | ✅ 完成 | 顯示訂單列表 |
| 收藏清單 | ⚠️ Mock | UI 完整，資料為假 |
| 地址管理 | ✅ UI 完成 | 新增/編輯/刪除/設預設，串接 MrPolar 地址 API |
| 信用卡管理 | ⚠️ Mock | UI 含卡號格式驗證，需金流廠商串接 |
| 帳號安全 | ✅ 完成 | 密碼變更串接 WordPress 認證 API |

### 共用工具

| 項目 | 檔案 | 說明 |
|---|---|---|
| 業務常數 | `src/utils/constants.js` | 等級門檻、運送方式、付款方式、訂單狀態中文標籤 |
| WooCommerce API 客戶端 | `src/lib/woocommerce.js` | JWT 管理、auth、mrpolar 自訂 API、store API |
| 通用 Data Fetching Hook | `src/hooks/useApi.js` | `useApi(fn, deps)` → `{ data, isLoading, error, refetch }` |
| 捲動動畫 Hook | `src/hooks/useScrollReveal.js` | Intersection Observer 觸發進場動畫 |

---

## ⚠️ 部分完成

| 功能 | 現狀 | 說明 |
|---|---|---|
| 信用卡管理 | UI 完整，Mock 資料 | 需金流廠商（PayUni 或其他）Token 機制 |
| 收藏清單 | UI 完整，Mock 資料 | 需後端 wishlist 支援 |
| 商品詳情頁 | 無獨立路由 | 目前只有列表頁，無 `/products/:handle` 詳情頁 |

---

## ❌ 尚未開發

| 功能 | 說明 |
|---|---|
| 點數折抵結帳 | Checkout 頁顯示可用點數，點擊兌換減少金額 |
| 會員等級優惠顯示 | 商品頁針對不同等級顯示折扣價 |
| 訂單取消申請 | 在「我的訂單」Tab 新增取消按鈕 |
| 商品詳情頁 | `/products/:handle` 路由，顯示圖片輪播、規格選擇、加入購物車 |
| 購物車優惠碼 | 結帳頁優惠碼邏輯，需串接後端 |

---

## 部署資訊

| 項目 | 值 |
|---|---|
| GCP Project | `mrpolarstore` |
| Region | `us-central1` |
| Cloud Run 服務名稱 | `polar-pet-store` |
| 生產 URL | `https://polar-pet-store-976595412991.us-central1.run.app` |
| 部署方式 | `gcloud builds submit --config cloudbuild.yaml` |

---

## 快速指令

```bash
# 本地開發
cd polar-pet-store
cp .env.example .env   # 填入 VITE_WC_URL
npm run dev             # http://localhost:5173

# 建置與 Lint
npm run lint
npm run build
```

---

## 環境變數

```env
VITE_WC_URL=http://mrpolar.local    # 本地 LocalWP 後端
VITE_USE_MOCK=false
```

---

## 最近改動（2026-04-03）

### 本地開發環境建置

- ✅ **後端改用 LocalWP**：站台 `mrpolar`，URL `http://mrpolar.local`
- ✅ **插件部署**：mrpolar-api 自訂插件複製至 LocalWP 插件目錄並啟用
- ✅ **WooCommerce 啟用**：v10.6.2，設定台幣（TWD）+ 台灣地區（TW）
- ✅ **JWT 認證設定**：wp-config.php 加入 `JWT_AUTH_SECRET_KEY` 與 CORS 設定
- ✅ **前台 dev server 啟動**：`npm run dev` → `http://localhost:5173`
- ✅ **API 連線驗證**：JWT 端點、MrPolar 自訂 API 均正常回應
- ✅ **測試帳號建立**：`test@mrpolar.tw` / `Test1234!`（role: customer）

### 目前狀態
- 前台與後端 API 已連通，正在進行會員系統登入測試
