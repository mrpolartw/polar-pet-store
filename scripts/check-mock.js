#!/usr/bin/env node
/**
 * 上線前檢查：確認 production 環境未殘留 mock 模式
 */

const fs   = require('fs')
const path = require('path')

const args    = process.argv.slice(2)
const isProd  = args.includes('--env') && args[args.indexOf('--env') + 1] === 'production'
const ENV_FILE = path.resolve(
  __dirname,
  isProd ? '../.env.production' : '../.env'
)
const ERRORS   = []
const WARNINGS = []

console.log('\n🔍 [check-mock] 檢查 Mock 設定...\n')

// 1. 檢查 .env 是否存在
if (!fs.existsSync(ENV_FILE)) {
  WARNINGS.push('⚠️  .env 檔案不存在，請確認已設定環境變數')
} else {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8')

  // 2. 檢查 VITE_USE_MOCK
  if (envContent.includes('VITE_USE_MOCK=true')) {
    ERRORS.push('❌ .env 中 VITE_USE_MOCK=true，上線前必須改為 false')
  } else {
    console.log('  ✅ VITE_USE_MOCK 設定正確')
  }

  // 3. 檢查 GA_ID
  if (
    !envContent.includes('VITE_GA_ID=') ||
    envContent.includes('VITE_GA_ID=G-XXXXXXXXXX') ||
    envContent.includes('VITE_GA_ID=')
  ) {
    WARNINGS.push('⚠️  VITE_GA_ID 未設定或為預設值，GA4 追蹤將不會啟用')
  } else {
    console.log('  ✅ VITE_GA_ID 已設定')
  }

  // 4. 檢查 API URL
  if (envContent.includes('VITE_API_BASE_URL=http://localhost')) {
    ERRORS.push('❌ VITE_API_BASE_URL 仍指向 localhost，上線前必須改為正式 API 網址')
  } else {
    console.log('  ✅ VITE_API_BASE_URL 設定正確')
  }
}

// 5. 掃描 src 目錄是否有殘留的 TODO BACKEND 註解
const srcDir  = path.resolve(__dirname, '../src')
const todoItems = []

function scanDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    if (file.isDirectory()) {
      scanDir(fullPath)
    } else if (file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      const lines   = content.split('\n')
      lines.forEach((line, i) => {
        if (line.includes('TODO BACKEND')) {
          todoItems.push(`  ${path.relative(srcDir, fullPath)}:${i + 1} → ${line.trim()}`)
        }
      })
    }
  }
}

scanDir(srcDir)

if (todoItems.length > 0) {
  WARNINGS.push(
    `⚠️  發現 ${todoItems.length} 個 TODO BACKEND 待處理：\n${todoItems.join('\n')}`
  )
}

// 輸出結果
if (WARNINGS.length > 0) {
  console.log('\n📋 警告項目（不阻擋 build，但上線前建議處理）：')
  WARNINGS.forEach((w) => console.log(`  ${w}`))
}

if (ERRORS.length > 0) {
  console.log('\n🚨 錯誤項目（必須修正才可上線）：')
  ERRORS.forEach((e) => console.log(`  ${e}`))
  console.log('\n❌ [check-mock] 檢查失敗\n')
  process.exit(1)
}

console.log('\n✅ [check-mock] 全部通過\n')
