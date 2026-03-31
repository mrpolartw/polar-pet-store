# MrPolarStore 前台開發進度

> 最後更新：2026-03-31（已修復 CORS、PayUni 付款流程、部署 URL 全面修正）

---

## 技術棧

- **Framework:** React 19 + Vite 7
- **Router:** React Router v7
- **動畫:** Framer Motion
- **API 整合:** `@medusajs/js-sdk`
- **部署:** GCP Cloud Run（`polar-pet-store`）

---

## ✅ 已完成功能

### 認證系統（Auth）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 登入 | `src/pages/Auth/Login.jsx` | Email + 密碼登入，連接 Medusa Auth API |
| 多步驟註冊 | `src/pages/Auth/Register.jsx` | 4 步驟：帳號→個人資料→毛孩→完成 |
| 忘記密碼 | `src/pages/Auth/ForgotPassword.jsx` | 傳送重設連結 |
| 全域登入狀態 | `src/context/AuthContext.jsx` | `AuthProvider`，管理 user / isLoggedIn / isLoading |
| 個人資料更新 | `AuthContext.jsx → updateProfile()` | 呼叫 `sdk.store.customer.update()` |
| 密碼變更 | `AuthContext.jsx → changePassword()` | 呼叫 `sdk.auth.updateProvider()` |
| 毛孩資料更新 | `AuthContext.jsx → updatePets()` | 透過 metadata 更新毛孩清單 |
| 會員等級換算 | `src/context/authUtils.js` | `getMemberTier(points)` 引用 constants.js 常數 |

### 購物車（Cart）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 全域購物車狀態 | `src/context/CartContext.jsx` | `CartProvider`，同步 Medusa guest cart |
| 加入購物車 | `addToCart()` | 有 variantId 則同步到 Medusa，無則降級本地 |
| 移除商品 | `removeFromCart()` | 樂觀更新 + Medusa 同步 |
| 更新數量 | `updateQuantity()` | 樂觀更新 + Medusa 同步 |
| 清空購物車 | `clearCart()` | 清除 state + localStorage |
| 購物車頁面 | `src/pages/Shop/Cart.jsx` | 顯示品項、數量調整、小計 |

### 商品（Products）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 商品列表 | `src/pages/Shop/Products.jsx` | 從 Medusa API 動態獲取商品，自動提取 variants 最低價格，與本地 productCatalog 合併增強資料 |
| API 封裝 | `src/api/products.js` | `listProducts({ q, category_id, limit, offset })` / `retrieveProduct(handle)` |
| 價格顯示修正 | 2026-03-29 | 修復商品價格顯示（原本新增商品顯示為 0），現動態從 Medusa API 獲取 |

### 結帳（Checkout）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 結帳頁面 | `src/pages/Shop/Checkout.jsx` | 完整 Medusa + PayUni checkout flow |
| 購買人資訊預填 | Checkout.jsx | 自動填入登入會員的姓名/電話/Email |
| 運送方式 | Checkout.jsx | 宅配到府 / 超商取貨 |
| 付款方式 | Checkout.jsx | 信用卡 / LINE Pay（透過 PayUni UPP 跳轉）|
| 發票選擇 | Checkout.jsx | 會員載具 / 手機條碼 / 統一編號 / 捐贈碼 |
| 訂單送出 | `useOrderSubmit.js` | `prepareCart → createOrder → clearCart → initiatePayuniPayment → 跳轉 PayUni` |
| 訂單成功頁 | `src/pages/Shop/OrderConfirm.jsx` | PayUni ReturnURL 導向此頁，顯示訂單資訊 |

### 金流串接（PayUni）

| 功能 | 檔案 | 說明 |
|---|---|---|
| PayUni payment API | `src/api/payment.js` | `initiatePayuniPayment()` 呼叫後端；`submitPayuniForm()` 動態提交隱藏表單 |
| 結帳 hook 整合 | `src/modules/checkout/hooks/useOrderSubmit.js` | 完整 PayUni 付款流程，修正 cartId 傳遞 |
| orderService 修正 | `src/services/orderService.js` | 新增 `prepareCart()`；`createOrder(cartId)` 修正接收明確 cartId |

### 訂單查詢（OrderQuery）

| 功能 | 檔案 | 說明 |
|---|---|---|
| 訂單查詢頁 | `src/pages/Shop/OrderQuery.jsx` | 不需登入，以訂單編號或電話查詢 |
| 真實 API 整合 | OrderQuery.jsx | 呼叫 `GET /store/orders/query`，替換 mock 資料 |
| 訂單進度時間軸 | OrderQuery.jsx | 4 階段進度顯示 |
| 姓名遮罩 | OrderQuery.jsx | 保護收件人隱私（王小明 → 王*明）|

### 會員中心（Account）

| Tab | 狀態 | 說明 |
|---|---|---|
| 個人資料 | ✅ 完成 | 顯示點數、等級進度條、編輯姓名/電話/性別，毛孩管理（新增/編輯/刪除）|
| 我的訂單 | ✅ 完成 | 呼叫 `sdk.store.order.list()`，顯示真實訂單 |
| 收藏清單 | ⚠️ Mock | UI 完整，資料為假 |
| 地址管理 | ✅ UI 完成 | 新增/編輯/刪除/設預設，本地 state（無後端持久化）|
| 信用卡管理 | ⚠️ Mock | UI 含卡號格式驗證，需金流廠商串接 |
| 帳號安全 | ✅ 完成 | 密碼變更串接 Medusa Auth API |

### 共用工具

| 項目 | 檔案 | 說明 |
|---|---|---|
| 業務常數 | `src/utils/constants.js` | 等級門檻、運送方式、付款方式、訂單狀態中文標籤 |
| API 層統一出口 | `src/api/index.js` | re-export products / orders / cart |
| 訂單 API 封裝 | `src/api/orders.js` | `listMyOrders()` / `retrieveOrder()` |
| 通用 Data Fetching Hook | `src/hooks/useApi.js` | `useApi(fn, deps)` → `{ data, isLoading, error, refetch }` |
| 捲動動畫 Hook | `src/hooks/useScrollReveal.js` | Intersection Observer 觸發進場動畫 |

---

## ⚠️ 部分完成

| 功能 | 現狀 | 說明 |
|---|---|---|
| 地址管理 | UI 完整，無後端 | 地址存在前端 state，重新整理會消失 |
| 信用卡管理 | UI 完整，Mock 資料 | 需金流廠商（PayUni 或其他）Token 機制 |
| 收藏清單 | UI 完整，Mock 資料 | 需後端 wishlist module |
| 商品詳情頁 | 無獨立路由 | 目前只有列表頁，無 `/products/:handle` 詳情頁 |

---

## ❌ 尚未開發

| 功能 | 說明 |
|---|---|
| ~~付款閘道前端流程~~ | ✅ 已完成（信用卡 + LINE Pay via PayUni，2026-03-29） |
| 點數折抵結帳 | Checkout 頁顯示可用點數，點擊兌換減少金額 |
| 會員等級優惠顯示 | 商品頁針對不同等級顯示折扣價 |
| 訂單取消申請 | 在「我的訂單」Tab 新增取消按鈕 |
| 商品詳情頁 | `/products/:handle` 路由，顯示圖片輪播、規格選擇、加入購物車 |
| 購物車優惠碼 | 目前結帳頁有 UI 但邏輯固定（僅 POLAR2026 生效），需串接 Medusa promotion |

---

## 部署資訊

| 項目 | 值 |
|---|---|
| GCP Project | `mrpolarstore` |
| Region | `us-central1` |
| Cloud Run 服務名稱 | `polar-pet-store` |
| 生產 URL | `https://polar-pet-store-976595412991.us-central1.run.app` |
| Artifact Registry Image | `us-central1-docker.pkg.dev/mrpolarstore/mrpolarstore-repo/polar-pet-store:latest` |
| 部署方式 | `gcloud builds submit --config cloudbuild.yaml` → `gcloud run deploy polar-pet-store --image <image>` |

---

## 快速指令

```bash
# 本地開發
cd polar-pet-store
cp .env.template .env   # 填入 VITE_MEDUSA_API_URL 與 VITE_MEDUSA_API_KEY
npm run dev             # http://localhost:5173

# 建置與 Lint
npm run lint
npm run build

# 部署到 GCP（在 polar-pet-store/ 目錄執行）
gcloud builds submit --config cloudbuild.yaml --project mrpolarstore
gcloud run deploy polar-pet-store \
  --image us-central1-docker.pkg.dev/mrpolarstore/mrpolarstore-repo/polar-pet-store:latest \
  --project mrpolarstore --region us-central1
```

## 最近改動（2026-03-31）

### 問題修復
- ✅ **部署 URL 修正**：`cloudbuild.yaml` 中 `VITE_MEDUSA_API_URL` build arg 從舊 URL（`boq3athofa-uc.a.run.app`）更正為正確 URL（`mrpolarstore-backend-976595412991.us-central1.run.app`）。
- ✅ **PayUni 付款流程 error handling 強化**：
  - `src/api/payment.js`：加入 URL / 參數驗證，區分網路錯誤與 API 錯誤，詳細 console.error 輸出。
  - `src/modules/checkout/hooks/useOrderSubmit.js`：PayUni 初始化步驟獨立 try/catch，錯誤訊息更明確。
- ✅ **前台架構確認**：所有 Medusa API 均透過 SDK；`payment.js` 使用 raw fetch 呼叫自訂 PayUni endpoint（正確做法）。

## 最近改動（2026-03-29）

### 新增功能
- ✅ PayUni 統一金流前端整合（信用卡 + LINE Pay）
- ✅ GCP Secret Manager 儲存 PayUni 金鑰（PAYUNI_MER_ID / PAYUNI_HASH_KEY / PAYUNI_HASH_IV）

### 問題修復
- ✅ 修復全白畫面：移除 React Router `basename="/polar-pet-store"` 以適配 Cloud Run 根目錄部署
- ✅ 修復商品價格顯示異常（金額為0）：修正前端 `products.js` 以自動獲取 Region ID 並帶入 API，成功喚出被隱藏的定價陣列
- ✅ 修復結帳流程異常：
  - 新增 `taiwanDistricts.js` 完整 22 縣市行政區資料。
  - 修正 `CartContext.jsx` 中 `ensureCart` 未帶 `region_id` 導致訂單無法建立的問題。
  - 修正 `useOrderSubmit.js` 中嚴格檢查 `cartId` 導致提早失敗的問題。
  - 補完 `orderService.js` 中的 `prepareCart` 流程：自動補齊 `shipping_address` 與 `shipping_method` 以符合 Medusa v2 `cart.complete()` 要求。

---

## 環境變數

```env
VITE_MEDUSA_API_URL=http://localhost:9000          # 後端 URL
VITE_MEDUSA_API_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Publishable API Key（非機密）
```

生產 Publishable Key：`pk_6456ed6824c064ffcbde9c303da0717d0edfc7684dffee5f6726912fa4eb4e72`
