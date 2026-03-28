# ✅ Mr.Polar 上線前 QA 驗收清單

> 版本：v1.0 | 每次上線前必須全部勾選

---

## 🔴 P0 — 必過項目（任一未通過不可上線）

### 環境設定
- [ ] `VITE_USE_MOCK=false` 已設定
- [ ] `VITE_API_BASE_URL` 已指向正式 API 網址
- [ ] `VITE_GA_ID` 已設定正確的 GA4 追蹤 ID
- [ ] `npm run pre-launch` 全部通過，無 error

### 購物核心流程
- [ ] 首頁正常載入，商品列表顯示
- [ ] 商品詳情頁正常顯示，圖片不破圖
- [ ] 加入購物車成功，toast 通知顯示
- [ ] 購物車商品數量增減正確
- [ ] 重整頁面後購物車商品仍存在（localStorage 持久化）
- [ ] 結帳頁表單驗證正確（必填欄位、格式驗證）
- [ ] 同意條款 checkbox 預設未勾選
- [ ] 未勾選同意條款時，點送出有錯誤提示
- [ ] 完整填寫後送出訂單，跳轉訂單確認頁
- [ ] 訂單確認頁正確顯示訂單資訊

### 會員流程
- [ ] 登入功能正常
- [ ] 登出功能正常
- [ ] 未登入時進入 /account 自動跳轉 /login
- [ ] 登入後進入會員中心，6 個 tab 均可正常切換
- [ ] URL hash 與 tab 同步（重整後停留在正確 tab）

### SEO 基礎
- [ ] 每個頁面有正確的 `<title>`
- [ ] 首頁、商品頁有正確的 meta description
- [ ] 結帳、會員頁有 noindex meta tag
- [ ] 商品詳情頁有 JSON-LD Product schema

### 法務合規
- [ ] Cookie Consent banner 首次進入顯示
- [ ] 選擇「僅必要」後 banner 消失，GA 不啟動
- [ ] 選擇「接受全部」後 banner 消失，GA 正常啟動
- [ ] 隱私政策頁面可正常進入
- [ ] 服務條款頁面可正常進入

---

## 🟡 P1 — 重要項目（上線後 48 小時內修正）

### UI/UX
- [ ] 行動版（375px）所有頁面排版正確
- [ ] 平板版（768px）排版正確
- [ ] 所有圖片有 alt 文字（無障礙）
- [ ] 所有互動元素可用鍵盤操作（Tab 鍵）
- [ ] 載入狀態（loading spinner）正確顯示
- [ ] 錯誤狀態（error state）有友善提示
- [ ] 空狀態（empty state）有友善提示

### 效能
- [ ] Lighthouse Performance 分數 ≥ 70
- [ ] Lighthouse Accessibility 分數 ≥ 80
- [ ] Lighthouse SEO 分數 ≥ 90
- [ ] 首頁 LCP ≤ 2.5 秒（行動版）
- [ ] 所有圖片有設定寬高屬性（避免 CLS）

### 品牌內容
- [ ] /founder 頁面正常顯示
- [ ] /quality-assurance 頁面正常顯示，FAQ 可開合
- [ ] /about 頁面有完整品牌文案
- [ ] 404 頁面正確顯示

### 錯誤處理
- [ ] /500 頁面正確顯示
- [ ] ErrorBoundary 正確攔截 JS 錯誤
- [ ] 瀏覽器 console 無任何 error（紅字）
- [ ] 瀏覽器 console 無未處理的 Promise rejection

---

## 🟢 P2 — 建議項目（上線後 1 週內處理）

### 分析追蹤
- [ ] GA4 DebugView 確認 view_item 事件正確觸發
- [ ] GA4 DebugView 確認 add_to_cart 事件正確觸發
- [ ] GA4 DebugView 確認 begin_checkout 事件正確觸發
- [ ] GA4 DebugView 確認 purchase 事件正確觸發

### 進階功能
- [ ] /reset-password/:token 頁面三種狀態均正確
- [ ] 訂單查詢頁正常運作
- [ ] 商品登錄頁正常運作
- [ ] 部落格頁面（/blog）正常顯示

### 跨瀏覽器
- [ ] Chrome 最新版正常
- [ ] Safari 最新版正常（尤其是 iOS Safari）
- [ ] Edge 最新版正常

---

## 🚀 上線操作流程

```bash
# 1. 確認在 main branch
git checkout main
git pull origin main

# 2. 執行完整上線前檢查
npm run pre-launch

# 3. 手動逐項執行 P0 清單

# 4. 通過後執行部署
npm run build
# 將 dist/ 資料夾上傳至 GCP
```

---

## 📋 驗收簽核

| 項目 | 負責人 | 完成日期 | 備註 |
|------|--------|----------|------|
| P0 功能驗收 | | | |
| UI/UX 驗收 | | | |
| 法務合規確認 | | | |
| GA4 追蹤確認 | | | |
| 最終上線授權 | | | |
