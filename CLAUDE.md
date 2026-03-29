# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

MrPolarStore 是一個寵物電商平台，由兩個子專案組成：

| 子專案 | 路徑 | Git 倉庫 | GCP Cloud Run |
|---|---|---|---|
| 後端 | `my-medusa-store/` | `mrpolartw/mrpolarstore-backend` | `mrpolarstore-backend` |
| 前台 | `polar-pet-store/` | `mrpolartw/polar-pet-store` | `polar-pet-store` |

> `my-medusa-store-storefront/`（Medusa 預設 Next.js 前台）**暫時不使用，忽略。**

---

## Backend: `my-medusa-store/`

**Tech:** Medusa.js v2, TypeScript, Node.js ≥ 20, PostgreSQL, Redis

### Commands

```bash
cd my-medusa-store

npm run dev          # 開發模式（含 hot reload）
npm run build        # 編譯
npm run start        # 生產模式

npm run seed         # 執行 src/scripts/seed.ts 填入 demo 資料

# 測試
npm run test:unit                    # src/**/__tests__/**/*.unit.spec.ts
npm run test:integration:http        # integration-tests/http/*.spec.ts
npm run test:integration:modules     # src/modules/*/__tests__/**/*.ts
```

### Environment Setup

複製 `.env.template` 為 `.env`，至少需設定：
```
DATABASE_URL=postgres://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
COOKIE_SECRET=...
STORE_CORS=http://localhost:5173
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000
```

預設 Admin URL: `http://localhost:9000/app`

### Architecture

```
src/
├── admin/widgets/          # Medusa Admin 自訂 React widget
│   └── customer-profile-widget.tsx  # 顧客毛孩資料 & 點數管理
├── api/
│   ├── admin/custom/route.ts   # 後台自訂 API
│   └── store/custom/route.ts   # 前台自訂 API
├── jobs/                   # Cron 排程任務
├── links/                  # 跨模組資料關聯
├── modules/                # 自訂業務模組（含 models/ + service.ts）
├── scripts/seed.ts         # 資料庫初始化腳本
├── subscribers/            # 事件監聽（order.placed 等）
└── workflows/              # 多步驟交易流程
```

**Medusa v2 自訂重點：**
- Widget 掛載點由 `defineWidgetConfig` 設定（`zone: "customer.details.before"`）
- 自訂 API route 透過 `req.scope.resolve()` 取得服務
- 顧客擴充資料（毛孩、點數）存放於 `customer.metadata`

---

## Frontend: `polar-pet-store/`

**Tech:** React 19, Vite 7, React Router v7, Framer Motion, `@medusajs/js-sdk`

### Commands

```bash
cd polar-pet-store

npm run dev      # 開發伺服器（預設 http://localhost:5173）
npm run build    # 編譯到 dist/
npm run lint     # ESLint 檢查
npm run preview  # 預覽 build 結果
```

### Environment Setup

`.env` 需設定：
```
VITE_MEDUSA_API_URL=http://localhost:9000
VITE_MEDUSA_API_KEY=<publishable_api_key>
```

Production key: `pk_6456ed6824c064ffcbde9c303da0717d0edfc7684dffee5f6726912fa4eb4e72`

### Architecture

```
src/
├── lib/medusa.js           # Medusa SDK 初始化（匯出 sdk 實例）
├── context/
│   ├── AuthContext.jsx     # 全域登入狀態，session 以 polar_logged_in 存入 localStorage
│   ├── CartContext.jsx     # 購物車，guest cart id 存入 polar_cart_id localStorage
│   └── authUtils.js        # getMemberTier() 會員等級換算
├── api/                    # Medusa API 呼叫封裝
├── hooks/
│   ├── useScrollReveal.js  # Intersection Observer 捲動動畫
│   └── useApi.js
├── pages/
│   ├── Home.jsx
│   ├── Auth/               # Login, Register (多步驟), ForgotPassword
│   ├── Account/            # Account.jsx（6個 tab：個人資料/訂單/收藏/地址/信用卡/安全）
│   └── Shop/               # Products, Cart, Checkout, OrderQuery, ProductRegister
└── components/
    ├── HeroCarousel.jsx
    ├── ExpandableCard.jsx
    ├── CustomCursor.jsx
    └── common/             # Counter, ImageWithFallback
```

**狀態管理：**
- `AuthProvider` + `CartProvider` 包在 `main.jsx` 最外層
- 所有 Medusa API 呼叫透過 `src/lib/medusa.js` 的 `sdk` 實例
- 顧客資料格式轉換由 `mapMedusaCustomer()` 統一處理（`AuthContext.jsx`）

**會員等級（`authUtils.js`）：**
- Polar Diamond：累積消費 ≥ 8000
- Polar Gold：≥ 3000
- Polar Silver：≥ 1000
- Polar Member：預設

---

## 開發規範

### 一、命名規範

#### 後端（TypeScript / Medusa）
| 類型 | 規則 | 範例 |
|---|---|---|
| 檔案/目錄 | kebab-case | `customer-points.service.ts` |
| Class | PascalCase | `CustomerPointsService` |
| 函式/變數 | camelCase | `getUserPoints()` |
| 常數 | UPPER_SNAKE_CASE | `MAX_POINTS_PER_ORDER` |
| Medusa module 目錄 | 動詞+名詞 | `modules/polar-points/` |

#### 前端（React / JSX）
| 類型 | 規則 | 範例 |
|---|---|---|
| 元件檔 | PascalCase | `CheckoutForm.jsx` |
| Hook | use 開頭 camelCase | `useCartTotal.js` |
| 工具函式檔 | camelCase | `formatPrice.js` |
| CSS 類別 | kebab-case | `.cart-item-wrapper` |

---

### 二、分層架構

#### 後端分層
```
API Route  →  接收請求、驗證參數、呼叫 Workflow/Service，不直接操作 DB
Workflow   →  跨模組多步驟業務邏輯（支援補償回滾）
Service    →  單一模組的業務邏輯
Model      →  資料結構定義，不含業務邏輯
Subscriber →  事件副作用（寄信、LINE 通知），不直接修改資料、不回傳值
```
跨模組操作一律走 Workflow（例：下單 → 扣庫存 → 加點數）。

#### 前端分層
```
pages/      →  路由頁面，只組合 components，不含業務邏輯
components/ →  純 UI，props in / events out
context/    →  全域狀態，含 API 呼叫
hooks/      →  可複用邏輯（含 API 呼叫）
api/        →  所有 Medusa SDK 呼叫封裝在此
utils/      →  純函式，無副作用
```
`pages/` 與 `components/` **禁止直接 `import { sdk }`**，必須透過 `api/` 或 `hooks/`。

---

### 三、常數管理

業務常數集中定義，禁止 magic number 散落在程式碼中。

**後端：** `src/utils/constants.ts`
```typescript
export const POLAR_POINTS = {
  TIER_SILVER: 1000,
  TIER_GOLD: 3000,
  TIER_DIAMOND: 8000,
} as const

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const
```

**前端：** `src/utils/constants.js`
```javascript
export const MEMBER_TIER_THRESHOLD = { SILVER: 1000, GOLD: 3000, DIAMOND: 8000 }
export const SHIPPING_METHODS = { HOME_DELIVERY: 'home_delivery', CVS: 'cvs' }
```

---

### 四、環境變數與設定檔

```
.env                  — 本地開發（不進 git）
.env.template         — 範本（進 git，不含真實值）
.env.test             — 測試環境
GCP Secret Manager    — 生產環境機密，不使用 .env 檔案
```

- 後端變數：全大寫底線（`DATABASE_URL`、`JWT_SECRET`）
- 前端變數：`VITE_` 開頭，**只放非機密的公開設定**（Publishable Key 可以，Admin Token 絕對不行）
- 發現有人 commit 真實 `.env` → 立即 revoke 相關 key

---

### 五、資安規範

- Admin API 路由必須驗證 session/JWT，不信任 client 傳來的 `customer_id`
- 前台 API 使用 Publishable Key（store scope），Admin API 使用 Session Token
- 顧客只能讀寫自己的資料，後端必須比對 session 與資料擁有者
- 不在 `localStorage` 存放 JWT 或個資（`polar_logged_in` 只存布林值，正確做法）
- 付款相關一律交由第三方金流處理，不自行處理卡號
- 定期執行 `npm audit`，critical 等級漏洞立即修復

---

### 六、TypeScript 規範（後端）

- 禁止使用 `any`，改用 `unknown` + type guard 或定義 interface
- Medusa 型別從 `@medusajs/framework/types` 引入，不重複定義
- 新增自訂模組時，Service 的方法參數與回傳值必須有明確型別

---

### 七、測試規範

#### 後端三層測試
```
單元測試        src/modules/xxx/__tests__/xxx.unit.spec.ts
               → 不連 DB，mock 所有 IO，測試 Service 純邏輯

模組整合測試    src/modules/xxx/__tests__/xxx.spec.ts
               → 連測試 DB，每個 describe 前後清資料

HTTP 整合測試   integration-tests/http/xxx.spec.ts
               → 完整 API 端到端，驗證 response schema
```

#### 前端測試優先順序
1. `utils/` 工具函式（`getMemberTier`、`formatPrice`）
2. 關鍵表單邏輯（Register、Checkout）
3. `api/` 層（mock sdk，測試參數與 error handling）

#### 測試命名規則
```typescript
describe('CustomerPointsService', () => {
  describe('addPoints', () => {
    it('should add points to customer metadata', ...)
    it('should throw if customer not found', ...)
  })
})
```

---

### 八、Git 工作流程

#### Branch 命名
```
main          — 生產，push 直接觸發 Cloud Build 部署
develop       — 開發整合
feature/xxx   — 新功能（feature/checkout-points-deduction）
fix/xxx       — Bug 修復（fix/cart-shipping-fee）
hotfix/xxx    — 緊急修復，從 main 切出
```

#### Commit 規範（Conventional Commits）
```
feat: 新增點數折抵結帳功能
fix: 修正購物車運費顯示問題
refactor: 重構 AuthContext mapMedusaCustomer
chore: 更新 medusa 至 2.14.0
```

#### PR 規則
- 任何變更不直接 push `main`，一律開 PR
- 影響 API 介面的變更，前後端需同步討論後再 merge
- PR 描述需說明：改了什麼、如何測試

---

## Deployment

### 部署流程
Push 到 `main` 分支 → 觸發 GCP Cloud Build → 自動 build Docker image → 部署到 Cloud Run

### 前台手動觸發 Cloud Build
`cloudbuild.yaml` 位於 `polar-pet-store/`，build arg 包含 `VITE_MEDUSA_API_URL` 與 `VITE_MEDUSA_API_KEY`

### GCP 資訊
- **Project ID:** `mrpolarstore`
- **Region:** `us-central1`
- **Artifact Registry:** `us-central1-docker.pkg.dev/mrpolarstore/mrpolarstore-repo/`
- **後端 URL:** `https://mrpolarstore-backend-boq3athofa-uc.a.run.app`
- **前台 URL:** `https://polar-pet-store-boq3athofa-uc.a.run.app`
