# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

MrPolarStore 是一個寵物電商平台，由兩個子專案組成：

| 子專案 | 路徑 | 技術 |
|---|---|---|
| 後端 | `backend/mrpolarstore-backend/` | WordPress + WooCommerce（LocalWP）|
| 前台 | `frontend/polar-pet-store/` | React 19 + Vite 7 |

---

## Backend: `backend/mrpolarstore-backend/`

**Tech:** WordPress + WooCommerce，本地使用 LocalWP

### 本地環境

| 項目 | 值 |
|---|---|
| 站台 URL | `http://mrpolar.local` |
| WordPress 後台 | `http://mrpolar.local/wp-admin` |
| REST API | `http://mrpolar.local/wp-json/` |

### 已啟用插件

- `jwt-authentication-for-wp-rest-api` — JWT 認證
- `woocommerce` — 購物核心
- `mrpolar-api` — 自訂會員 / 地址 / 點數 / 寵物 API

### 自訂 API 端點（`/wp-json/mrpolar/v1/`）

```
POST   /register                   公開會員註冊
GET    /me                         取得當前會員
PATCH  /me                         更新個人資料
POST   /change-password            修改密碼
GET    /customer/addresses         取得地址列表
POST   /customer/addresses         新增地址
PUT    /customer/addresses/{id}    更新地址
DELETE /customer/addresses/{id}    刪除地址
GET    /customer/points            取得點數
POST   /customer/pets              更新寵物資料
```

### JWT 認證流程

```
POST /wp-json/jwt-auth/v1/token
  Body: { "username": "email@example.com", "password": "..." }
  Response: { "token": "...", "user_email": "..." }
```

---

## Frontend: `frontend/polar-pet-store/`

**Tech:** React 19, Vite 7, React Router v7, Framer Motion

### Commands

```bash
cd frontend/polar-pet-store

npm run dev      # 開發伺服器（預設 http://localhost:5173）
npm run build    # 編譯到 dist/
npm run lint     # ESLint 檢查
npm run preview  # 預覽 build 結果
```

### Environment Setup

`.env` 需設定：
```
VITE_WC_URL=http://mrpolar.local
VITE_USE_MOCK=false
```

### Architecture

```
src/
├── lib/
│   ├── woocommerce.js      # WooCommerce / MrPolar API 客戶端（JWT 管理 + fetch wrapper）
│   └── medusa.js           # 已廢棄 stub，保留避免未遷移 import 出錯
├── context/
│   ├── AuthContext.jsx     # 全域登入狀態
│   ├── CartContext.jsx     # 購物車狀態
│   ├── authUtils.js        # getMemberTier() 會員等級換算
│   ├── useAuth.js          # useContext(AuthContext) hook
│   └── useCart.js          # useContext(CartContext) hook
├── api/                    # API 呼叫封裝
├── hooks/
│   ├── useScrollReveal.js  # 捲動進場動畫
│   └── useApi.js           # 通用 data fetching hook
├── pages/
│   ├── Home.jsx
│   ├── Auth/               # Login, Register（多步驟）, ForgotPassword
│   ├── Account/            # Account.jsx（6 個 tab）
│   └── Shop/               # Products, Cart, Checkout, OrderQuery, ProductRegister
└── components/
    ├── HeroCarousel.jsx
    ├── ExpandableCard.jsx
    ├── CustomCursor.jsx
    └── common/
```

**狀態管理：**
- `AuthProvider` + `CartProvider` 包在 `main.jsx` 最外層
- 所有 API 呼叫透過 `src/lib/woocommerce.js` 的 `auth` / `mrpolar` / `store` 物件
- JWT token 存放於 sessionStorage（`polar_wc_token`），不存 localStorage

**會員等級（`authUtils.js`）：**
- Polar Diamond：累積消費 ≥ 8000
- Polar Gold：≥ 3000
- Polar Silver：≥ 1000
- Polar Member：預設

---

## 開發規範

### 一、命名規範

#### 前端（React / JSX）
| 類型 | 規則 | 範例 |
|---|---|---|
| 元件檔 | PascalCase | `CheckoutForm.jsx` |
| Hook | use 開頭 camelCase | `useCartTotal.js` |
| 工具函式檔 | camelCase | `formatPrice.js` |
| CSS 類別 | kebab-case | `.cart-item-wrapper` |

#### 後端（WordPress / PHP）
| 類型 | 規則 | 範例 |
|---|---|---|
| 檔案/目錄 | kebab-case | `class-customer.php` |
| Class | PascalCase + 前綴 | `MrPolar_Customer` |
| 函式 | snake_case | `get_customer_points()` |

---

### 二、分層架構（前端）

```
pages/      → 路由頁面，只組合 components，不含業務邏輯
components/ → 純 UI，props in / events out
context/    → 全域狀態（含 API 呼叫）
hooks/      → 可複用邏輯（含 API 呼叫）
api/        → API 呼叫封裝
utils/      → 純函式，無副作用
```

`pages/` 與 `components/` **禁止直接 `import { auth, mrpolar }` from `lib/woocommerce`**，必須透過 `context/` 或 `api/`。

---

### 三、環境變數

```
.env              — 本地開發（不進 git）
.env.example      — 範本（進 git，不含真實值）
```

- 前端變數：`VITE_` 開頭，**只放非機密設定**
- 機密設定（金流 API Key 等）存放於後端 wp-config.php 或 GCP Secret Manager

---

### 四、資安規範

- JWT token 只存 sessionStorage，不存 localStorage
- 不在前端處理卡號；付款一律跳轉第三方金流
- WordPress 後端驗證 JWT，所有需認證的 API 必須比對 token 的 user 與資源擁有者
- 定期執行 `npm audit`，critical 等級漏洞立即修復

---

### 五、Git 工作流程

#### Branch 命名
```
main          — 生產
develop       — 開發整合
feature/xxx   — 新功能
fix/xxx       — Bug 修復
hotfix/xxx    — 緊急修復，從 main 切出
```

#### Commit 規範（Conventional Commits）
```
feat: 新增點數折抵結帳功能
fix: 修正購物車運費顯示問題
refactor: 重構 AuthContext
chore: 更新 woocommerce 至 10.x
```

---

## Deployment

### 部署流程
Push 到 `main` 分支 → 觸發 GCP Cloud Build → 自動 build Docker image → 部署到 Cloud Run

### GCP 資訊
- **Project ID:** `mrpolarstore`
- **Region:** `us-central1`
- **Artifact Registry:** `us-central1-docker.pkg.dev/mrpolarstore/mrpolarstore-repo/`
- **前台 URL:** `https://polar-pet-store-976595412991.us-central1.run.app`
