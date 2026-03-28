import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronUp,
  Clock,
  FileText,
  Info,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import './PrivacyPolicy.css';

const TOC_ITEMS = [
  { id: 'chapter-1', label: '這份政策說的是什麼' },
  { id: 'chapter-2', label: '我們收集哪些資料' },
  { id: 'chapter-3', label: '我們怎麼使用您的資料' },
  { id: 'chapter-4', label: '哪些夥伴會接觸您的資料' },
  { id: 'chapter-5', label: '關於 Cookie' },
  { id: 'chapter-6', label: '您的資料保留多久' },
  { id: 'chapter-7', label: '您對資料有哪些權利' },
  { id: 'chapter-8', label: '我們怎麼保護您的資料' },
  { id: 'chapter-9', label: '關於 18 歲以下的使用者' },
  { id: 'chapter-10', label: '我們用的安全技術' },
  { id: 'chapter-11', label: '本網站以外的連結' },
  { id: 'chapter-12', label: '政策若有更新' },
  { id: 'chapter-13', label: '如果發生爭議' },
];

const chapterFourTables = [
  {
    title: '物流配送',
    headers: ['合作夥伴', '可能提供的資料'],
    rows: [
      ['黑貓宅急便', '收件人姓名、手機號碼、地址、訂單編號'],
      ['統一超商（7-ELEVEN）物流', '收件人姓名、手機號碼、取件門市、訂單編號'],
    ],
  },
  {
    title: '金流付款',
    headers: ['合作夥伴', '可能提供的資料'],
    rows: [
      ['Payuni 統一金流', '訂單金額、訂單編號'],
      ['LINE Pay', '訂單金額、訂單編號'],
    ],
  },
  {
    title: '網站分析與廣告服務',
    headers: ['合作夥伴', '用途'],
    rows: [
      ['Google Analytics 4', '網站流量分析與使用情況統計'],
      ['Google Ads', '廣告投放與成效追蹤'],
      ['Meta（Facebook Pixel）', '廣告再行銷與受眾分析'],
    ],
  },
  {
    title: '登入與通知服務',
    headers: ['合作夥伴', '用途'],
    rows: [
      ['Google、Facebook', '第三方社群登入'],
      ['LINE Login / LINE Notify', 'LINE 帳號登入與訊息推播'],
    ],
  },
];

const chapterFiveTable = {
  title: '我們使用的 Cookie 類型',
  headers: ['類型', '用途', '是否可關閉'],
  rows: [
    ['必要性 Cookie', '維持網站基本功能，例如登入與購物車', '否'],
    ['功能性 Cookie', '記住語言、偏好設定與使用習慣', '是'],
    ['分析性 Cookie', '分析流量與使用行為，優化網站體驗', '是'],
    ['行銷性 Cookie', '提供個人化廣告與再行銷', '是'],
  ],
};

const chapterSixTable = {
  headers: ['資料類別', '保存期限', '說明'],
  rows: [
    ['會員帳號資料', '帳號存續期間；刪除申請後 30 天內完成銷毀或去識別化處理', '提供會員服務所需'],
    ['訂單與交易紀錄', '交易完成後 7 年', '依法保存之會計與交易資料'],
    ['付款紀錄', '交易完成後 7 年', '稅務與帳務申報需要'],
    ['客服往來紀錄', '最後一次聯繫後 3 年', '爭議處理與服務追蹤'],
    ['行銷同意紀錄', '撤回同意後 3 年', '合規舉證需要'],
    ['活動報名資料', '活動結束後 1 年', '獎項發送與爭議處理'],
    ['網站瀏覽日誌', '180 天內滾動更新', '資安監控與系統維運'],
  ],
};

function TocLink({ item, activeSection, onClick }) {
  return (
    <a
      href={`#${item.id}`}
      className={`pp-toc-link ${activeSection === item.id ? 'active' : ''}`}
      onClick={(event) => onClick(event, item.id)}
    >
      {item.label}
    </a>
  );
}

function Chapter({ id, number, title, delay = 0, children }) {
  return (
    <motion.section
      id={id}
      className="pp-chapter"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="pp-chapter-header">
        <span className="pp-chapter-num">{`第 ${number} 章`}</span>
        <h2 className="pp-chapter-title">{title}</h2>
      </div>
      <div className="pp-chapter-body">{children}</div>
    </motion.section>
  );
}

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('chapter-1');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll('.pp-chapter');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: 0.3 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 360);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTocClick = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <main className="pp-page">
      <motion.section
        className="pp-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="pp-hero-inner">
          <span className="pp-hero-kicker">隱私權政策</span>
          <h1 className="headline-pro">您的資料，我們認真對待</h1>
          <p className="subhead-pro">
            北極先生國際股份有限公司 · 最後更新：2026 年 3 月 23 日
          </p>
          <div className="pp-hero-meta">
            <span><ShieldCheck size={14} /> 符合個人資料保護法</span>
            <span><FileText size={14} /> 13 個章節</span>
            <span><Clock size={14} /> 閱讀約 8 分鐘</span>
          </div>
        </div>
      </motion.section>

      <div className="pp-layout">
        <aside className="pp-toc-sidebar" aria-label="隱私權政策快速導覽">
          <div className="pp-toc-title">快速導覽</div>
          <div className="pp-toc-list">
            {TOC_ITEMS.map((item) => (
              <TocLink
                key={item.id}
                item={item}
                activeSection={activeSection}
                onClick={handleTocClick}
              />
            ))}
          </div>
        </aside>

        <div className="pp-content">
          <Chapter id="chapter-1" number="1" title="這份政策說的是什麼">
            <div className="pp-subsection">
              <p className="pp-body-text">
                這份文件說明北極先生（北極先生國際股份有限公司，統編 95448000，地址：臺中市西屯區何安里臺灣大道二段 910 號 13 樓之 2）如何收集、使用和保護您的個人資料。我們的官網是 mrpolar.com.tw，如有任何疑問，歡迎透過聯絡我們頁面告訴我們，我們會在 1–3 個工作天內回覆。
              </p>
              <p className="pp-body-text">
                本政策適用於您透過 mrpolar.com.tw 使用的服務，包括會員註冊、線上購物、月訂方案、電子報，以及各項寵物個人化服務。本政策依據中華民國《個人資料保護法》及相關法令訂定。當您使用本網站服務時，我們將依本政策處理您的個人資料；如依法需要取得您的同意，我們會另行向您說明並取得同意。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-2" number="2" title="我們收集哪些資料" delay={0.03}>
            <div className="pp-subsection">
              <h3 className="pp-subsection-title">1. 您主動提供的資料</h3>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">建立帳號時</h3>
              <ol className="pp-ordered-list">
                <li>姓名</li>
                <li>電子郵件地址</li>
                <li>手機號碼</li>
                <li>生日</li>
                <li>性別</li>
                <li>收件地址</li>
              </ol>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">購物與訂閱時</h3>
              <ol className="pp-ordered-list">
                <li>訂單內容（商品、數量、金額）</li>
                <li>配送資訊</li>
                <li>訂閱週期與配送設定</li>
                <li>付款方式紀錄（例如信用卡末四碼，僅供對帳識別）</li>
              </ol>
              <p className="pp-body-text">
                完整信用卡資訊將由金流服務提供者加密處理，本公司不會儲存您的完整卡號。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">您的毛孩資料（由您自願提供）</h3>
              <ol className="pp-ordered-list">
                <li>寵物姓名</li>
                <li>性別</li>
                <li>種類與品種</li>
                <li>年齡</li>
                <li>體重</li>
                <li>生日</li>
              </ol>
              <p className="pp-body-text">
                這些資料僅用於提供相關服務與體驗優化，不會對外出售，也不會任意提供給第三方作為與您無關的商業用途。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">活動參與時</h3>
              <p className="pp-body-text">
                當您參加抽獎、集點或其他活動時，我們會依活動內容另外說明蒐集項目、使用目的與必要條件，並在需要時取得您的同意。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">2. 我們自動蒐集的技術資料</h3>
              <ol className="pp-ordered-list">
                <li>IP 位址</li>
                <li>瀏覽器類型</li>
                <li>裝置型號</li>
                <li>作業系統版本</li>
                <li>瀏覽頁面</li>
                <li>停留時間</li>
                <li>點擊路徑</li>
                <li>購物車狀態</li>
                <li>Cookie 與類似技術資料</li>
              </ol>
            </div>
          </Chapter>

          <Chapter id="chapter-3" number="3" title="我們怎麼使用您的資料" delay={0.06}>
            <div className="pp-subsection">
              <ol className="pp-ordered-list">
                <li><strong>訂單與服務履行：</strong>用於處理訂單、付款確認、月訂配送、物流追蹤、退換貨與售後服務。</li>
                <li><strong>帳號與會員管理：</strong>用於建立與維護會員帳號、身分驗證、登入管理，以及客服支援。</li>
                <li><strong>個人化服務：</strong>在您提供毛孩資料的情況下，用於推薦較適合的飼料、營養方案或相關商品與內容。</li>
                <li><strong>行銷與通知：</strong>在您同意的前提下，我們可能向您寄送電子報、優惠通知或行銷簡訊。您可隨時取消訂閱或撤回同意。</li>
                <li><strong>網站優化與成效分析：</strong>用於了解網站使用情況、改善內容與功能、提升使用體驗。</li>
                <li><strong>廣告投放與再行銷：</strong>我們可能透過第三方廣告工具，在其他平台上向您展示您可能感興趣的商品或內容。您可依本政策第五章管理相關偏好。</li>
                <li><strong>法律義務與爭議處理：</strong>用於配合法令要求、稅務申報、帳務處理、權利主張與爭議解決。</li>
              </ol>
            </div>
          </Chapter>

          <Chapter id="chapter-4" number="4" title="哪些夥伴會接觸您的資料" delay={0.09}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                我們不會出售或出租您的個人資料。在提供服務所必要的範圍內，我們可能與以下合作夥伴共享部分資訊，且僅提供完成該項服務所需的最小必要資料。
              </p>
            </div>

            {chapterFourTables.map((table) => (
              <div key={table.title} className="pp-subsection">
                <h3 className="pp-subsection-title">{table.title}</h3>
                <div className="pp-table-wrap">
                  <table className="pp-table" aria-label={table.title}>
                    <thead>
                      <tr>
                        {table.headers.map((header) => (
                          <th key={header} scope="col">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr key={`${table.title}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${table.title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">雲端與系統基礎設施</h3>
              <p className="pp-body-text">
                本網站可能使用 Google Cloud Platform 或其他雲端服務提供者協助網站架設、資料儲存與系統維運。在此情況下，資料可能儲存在台灣境外的伺服器或節點（例如美國、日本、新加坡等地）。我們將依適用法令要求，採取必要的合約、管理與安全措施，以確保跨境傳輸受到適當保護。我們也會要求合作廠商依契約義務與適用法令妥善保護您的資料。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-5" number="5" title="關於 Cookie" delay={0.12}>
            <div className="pp-subsection">
              <h3 className="pp-subsection-title">什麼是 Cookie</h3>
              <p className="pp-body-text">
                Cookie 是網站儲存在您瀏覽器中的小型文字檔案，用來讓網站記住您的狀態與偏好，例如保持登入狀態、保存購物車內容，或分析網站使用情況。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">{chapterFiveTable.title}</h3>
              <div className="pp-table-wrap">
                <table className="pp-table" aria-label={chapterFiveTable.title}>
                  <thead>
                    <tr>
                      {chapterFiveTable.headers.map((header) => (
                        <th key={header} scope="col">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chapterFiveTable.rows.map((row, rowIndex) => (
                      <tr key={`${chapterFiveTable.title}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${chapterFiveTable.title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">如何管理 Cookie</h3>
              <ol className="pp-ordered-list">
                <li>調整瀏覽器設定（如 Chrome、Safari、Firefox）</li>
                <li>使用 Google 廣告設定管理個人化廣告</li>
                <li>透過 Your Online Choices 等第三方工具管理廣告偏好</li>
              </ol>
              <div className="pp-callout pp-callout--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>提醒您</strong>
                  <p>若停用部分 Cookie，某些網站功能可能無法正常運作，像是登入狀態、購物車內容或偏好設定可能不會被保留。</p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-6" number="6" title="您的資料保留多久" delay={0.15}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                我們只會在達成蒐集目的所需期間內，或依法律要求的期間內保存您的資料。
              </p>
            </div>

            <div className="pp-subsection">
              <div className="pp-table-wrap">
                <table className="pp-table" aria-label="資料保存期限">
                  <thead>
                    <tr>
                      {chapterSixTable.headers.map((header) => (
                        <th key={header} scope="col">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chapterSixTable.rows.map((row, rowIndex) => (
                      <tr key={`retention-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`retention-${rowIndex}-${cellIndex}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pp-subsection">
              <p className="pp-body-text">
                即使您刪除帳號，若法律要求我們保留部分資料（例如交易、稅務或會計紀錄），我們仍會在法定期間內保存該等資料，並限制其使用範圍，不作為一般行銷用途。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-7" number="7" title="您對資料有哪些權利" delay={0.18}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                依據《個人資料保護法》第 3 條，在符合法律規定的前提下，您可以就您的個人資料行使以下權利：
              </p>
              <ol className="pp-ordered-list">
                <li>查詢或請求閱覽</li>
                <li>請求製給複製本</li>
                <li>請求補充或更正</li>
                <li>請求停止蒐集、處理或利用</li>
                <li>請求刪除</li>
              </ol>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">如何提出申請</h3>
              <p className="pp-body-text">
                請透過本網站「聯絡我們」表單提出申請，並提供：
              </p>
              <ol className="pp-ordered-list">
                <li>您的姓名</li>
                <li>會員電子郵件地址</li>
                <li>欲行使的權利項目</li>
                <li>具體請求內容</li>
              </ol>
              <div className="pp-callout pp-callout--info">
                <Info size={18} />
                <div>
                  <strong>處理時間說明</strong>
                  <p>為保障您的帳戶與資料安全，我們在處理申請前，可能會請您配合必要的身分驗證。我們會在 1–3 個工作天內回覆您的申請結果或處理進度。</p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-8" number="8" title="我們怎麼保護您的資料" delay={0.21}>
            <div className="pp-subsection">
              <h3 className="pp-subsection-title">行銷偏好設定</h3>
              <p className="pp-body-text">
                我們僅在您同意的前提下向您發送行銷資訊。您可以隨時調整偏好或停止接收。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">退訂電子報</h3>
              <p className="pp-body-text">
                請點擊每封電子報底部的「取消訂閱」連結，系統將盡快更新設定。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">退訂行銷簡訊</h3>
              <p className="pp-body-text">
                您可依簡訊內容指示回覆「退訂」或其他指定關鍵字辦理取消。
              </p>
            </div>

            <div className="pp-subsection">
              <h3 className="pp-subsection-title">全面停止行銷通知</h3>
              <p className="pp-body-text">
                您也可以透過官網「聯絡我們」表單申請停止所有行銷通知，我們將於 5 個工作日內完成處理。
              </p>
              <p className="pp-body-text">
                停止接收行銷訊息後，您的帳號與訂單相關通知仍可能持續發送，例如購物確認、配送通知或客服回覆，因為這些屬於提供服務所必要的資訊。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-9" number="9" title="關於 18 歲以下的使用者" delay={0.24}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                Mr.Polar 北極先生的商品與服務以 18 歲以上成年人為主要對象。我們不會明知而主動蒐集未成年人的個人資料，也不以未成年人為行銷對象。
              </p>
              <div className="pp-callout pp-callout--info">
                <Info size={18} />
                <div>
                  <strong>如果您有疑慮</strong>
                  <p>如您認為未成年子女曾在未經適當同意的情況下提供個人資料，請盡快透過官網「聯絡我們」表單通知我們。我們會在確認後採取適當處理措施。</p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-10" number="10" title="我們用的安全技術" delay={0.27}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                我們採取合理且適當的技術與管理措施，保護您的個人資料免於未經授權的存取、竄改、洩漏或毀損。
              </p>
              <ol className="pp-ordered-list">
                <li>全站 SSL/TLS 加密傳輸</li>
                <li>資料庫加密儲存</li>
                <li>存取權限分級控管</li>
                <li>員工個資保護教育訓練</li>
                <li>定期弱點掃描與安全檢測</li>
                <li>建立個人資料安全維護機制</li>
              </ol>
              <div className="pp-callout pp-callout--info">
                <Lock size={18} />
                <div>
                  <strong>我們怎麼做</strong>
                  <p>我們會從傳輸、儲存、權限與內部流程多個層面一起做保護，盡量把風險降到最低。</p>
                </div>
              </div>
              <p className="pp-body-text">
                若發生可能影響您權益的資料安全事件，我們將依適用法令採取必要的應變、調查、通報與通知措施。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-11" number="11" title="本網站以外的連結" delay={0.3}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                本網站可能包含連結至社群平台、合作品牌或其他第三方網站。這些網站有各自獨立的隱私權政策與資料處理方式，並不受本政策約束。建議您在使用第三方網站前，先閱讀其隱私權政策。
              </p>
              <div className="pp-callout pp-callout--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>離開本站前，先看一下</strong>
                  <p>當您前往第三方網站後，資料如何被收集與使用，會依對方的規則處理，不再適用本政策。</p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-12" number="12" title="政策若有更新" delay={0.33}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                本隱私權政策可能因法令變動、服務調整或營運需求而更新。更新後的版本將公布於本頁面，並自公告或指定生效日起適用。如屬重大變更，我們將依變更內容的性質，透過網站公告、電子郵件或其他適當方式通知您，並提供合理審閱期間。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-13" number="13" title="如果發生爭議" delay={0.36}>
            <div className="pp-subsection">
              <p className="pp-body-text">
                本政策之解釋與適用，依中華民國法律為準據法。如因本政策或個人資料處理事項發生爭議，雙方應先本於誠信原則協商處理；如仍有爭議，除法律另有強制規定外，以臺灣臺中地方法院為第一審管轄法院。
              </p>
            </div>
          </Chapter>

          <div className="pp-contact-card">
            <h3>對隱私政策有疑問？</h3>
            <p>我們會在 1–3 個工作天內回覆您。</p>
            <div className="pp-contact-actions">
              <Link to="/contact" className="btn-blue pp-contact-btn">
                填寫聯繫表單
              </Link>
              <a
                href="https://lin.ee/THZqvZ5r"
                target="_blank"
                rel="noreferrer"
                className="pp-line-btn"
              >
                LINE 官方帳號
              </a>
            </div>
            <div className="pp-company-info">
              <p>北極先生國際股份有限公司</p>
              <p>統一編號：95448000</p>
              <p>臺中市西屯區何安里臺灣大道二段910號13樓之2</p>
              <p>mrpolar.com.tw</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            className="pp-back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            aria-label="回到頂部"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
