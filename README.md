# Polar Pet Store — 前端專案

## 專案簡介
Polar Pet Store 為品牌電商前端專案，使用 React + Vite 建置。

本專案聚焦於：
- 品牌形象展示
- 會員登入 / 註冊流程
- 購物車與結帳流程
- 訂單查詢與會員中心

後端為 WordPress + WooCommerce（LocalWP），透過 JWT Authentication 插件與 MrPolar 自訂 API 提供服務。

## 技術棧
- React 19 + Vite 7
- React Router v7
- Framer Motion
- WooCommerce REST API + MrPolar 自訂 API

## 專案結構
```text
src/
├─ lib/           API 客戶端（woocommerce.js）
├─ api/           API 呼叫封裝
├─ assets/        靜態素材
├─ components/    可重用 UI 元件
├─ constants/     路由與 API endpoint 常數
├─ context/       Auth / Cart Context 與對應 hooks
├─ data/          前端展示用靜態資料
├─ guards/        ProtectedRoute / PublicRoute 路由守衛
├─ hooks/         共用 hooks
├─ mocks/         開發用 mock 資料
├─ pages/         頁面元件（Auth / Shop / Account 等）
├─ services/      Service Layer
└─ utils/         格式化、驗證等工具函式
```

## 快速開始

### 安裝
```bash
npm install
```

### 環境變數設定
```bash
cp .env.example .env
```

編輯 `.env`：
```dotenv
VITE_WC_URL=http://mrpolar.local
VITE_USE_MOCK=false
```

### 開發模式
```bash
npm run dev
```

### 生產 Build
```bash
npm run build
```

## 測試帳號（LocalWP）
| 帳號 | 密碼 | 角色 |
|---|---|---|
| test@mrpolar.tw | Test1234! | customer |
| admin（WordPress 後台）| LocalWP 建站時設定 | administrator |

## 環境變數說明
| 變數 | 說明 | 預設值 |
|---|---|---|
| `VITE_WC_URL` | 後端 WordPress URL | `http://localhost:8080` |
| `VITE_USE_MOCK` | 啟用 Mock 模式 | `false` |
| `VITE_GA_ID` | Google Analytics 4 ID | — |
| `VITE_SENTRY_DSN` | Sentry 錯誤監控 DSN | — |
