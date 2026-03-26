#!/usr/bin/env node
/**
 * 上線前檢查：掃描 src 目錄殘留的 console.log
 */

const fs   = require('fs')
const path = require('path')

const srcDir  = path.resolve(__dirname, '../src')
const ALLOWED = ['console.error', 'console.warn']
const found   = []

console.log('\n🔍 [check-console] 掃描 console.log 殘留...\n')

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
        const trimmed = line.trim()
        // 跳過 console.error 和 console.warn（允許保留）
        if (
          trimmed.includes('console.log') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('*')
        ) {
          found.push(
            `  ${path.relative(srcDir, fullPath)}:${i + 1} → ${trimmed.slice(0, 80)}`
          )
        }
      })
    }
  }
}

scanDir(srcDir)

if (found.length > 0) {
  console.log(`⚠️  發現 ${found.length} 個 console.log（建議移除）：\n`)
  found.forEach((f) => console.log(f))
  console.log(`\n⚠️  [check-console] 發現 ${found.length} 個 console.log`)
  console.log('    上線前建議移除，或改用 console.error / console.warn\n')
  // 警告但不阻擋 build
  process.exit(0)
}

console.log('✅ [check-console] 無殘留 console.log\n')
