import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronUp,
  Crown,
  Gift,
  Info,
  Star,
} from 'lucide-react';
import { useTiers } from '../../hooks/useMember';
import './MemberBenefits.css';

const TIER_DATA = [
  {
    key: 'family',
    icon: '🐾',
    name: '家庭會員',
    rate: '3%',
    threshold: '加入即享有',
    perks: ['最新優惠資訊', '毛孩電報'],
  },
  {
    key: 'silver',
    icon: '⭐',
    name: '銀卡會員',
    rate: '5%',
    threshold: '年消費滿 NT$6,000',
    perks: ['含家庭會員全部福利', '不定時限定優惠券', '活動優先報名參加'],
  },
  {
    key: 'gold',
    icon: '🏆',
    name: '金卡會員',
    rate: '8%',
    threshold: '年消費滿 NT$30,000',
    perks: [
      '含銀卡會員全部福利',
      '訂購商品不定時附贈品',
      '限時專屬會員優惠',
      '專人產品關懷',
      '產品優先預購',
    ],
  },
  {
    key: 'black',
    icon: '👑',
    name: '黑卡會員',
    rate: '12%',
    threshold: '年消費滿 NT$60,000',
    perks: [
      '含金卡會員全部福利',
      'LINE 官方 24H AI 諮詢',
      '專屬優惠券',
      '新品優先體驗',
      '產品討論參與',
    ],
  },
];

const TOC_ITEMS = [
  { id: 'chapter-1', label: '您的等級，您的回饋' },
  { id: 'chapter-2', label: '消費怎麼計算' },
  { id: 'chapter-3', label: '升級與降級怎麼運作' },
  { id: 'chapter-4', label: '消費點數這樣算' },
  { id: 'chapter-5', label: '生日當天，多一份驚喜' },
  { id: 'chapter-6', label: '黑卡，有些事只為您準備' },
  { id: 'chapter-7', label: '我們會怎麼聯繫您' },
  { id: 'chapter-8', label: '幾個需要知道的規則' },
  { id: 'appendix-1', label: '附表一：等級總覽' },
  { id: 'appendix-2', label: '附表二：生日優惠' },
];

const TIER_TABLE_ROWS = [
  ['家庭會員', 'NT$0（加入即享）', '3%', '最新優惠資訊、毛孩電報'],
  ['銀卡會員', '累積滿 NT$6,000', '5%', '+ 限定優惠券、活動優先報名'],
  ['金卡會員', '累積滿 NT$30,000', '8%', '+ 訂購贈品、專屬優惠、專人關懷、優先預購'],
  ['黑卡會員', '累積滿 NT$60,000', '12%', '+ LINE 24H AI 諮詢、專屬券、新品體驗、產品討論'],
];

const UPGRADE_TABLE_ROWS = [
  ['家庭會員', '年消費滿 NT$6,000', '升為銀卡會員', '次日生效'],
  ['銀卡會員', '年消費滿 NT$30,000', '升為金卡會員', '次日生效'],
  ['金卡會員', '年消費滿 NT$60,000', '升為黑卡會員', '次日生效'],
  ['黑卡會員', '未達門檻', '年度結算後依消費重新認定', '次一會員年度起適用'],
];

const POINT_RATE_ROWS = [
  ['家庭會員', '3%', '以單筆訂單實付商品金額計算，不含運費與手續費'],
  ['銀卡會員', '5%', '以單筆訂單實付商品金額計算，不含運費與手續費'],
  ['金卡會員', '8%', '以單筆訂單實付商品金額計算，不含運費與手續費'],
  ['黑卡會員', '12%', '以單筆訂單實付商品金額計算，不含運費與手續費'],
];

const APPENDIX_BIRTHDAY_ROWS = [
  ['適用對象', '已完成會員資料設定並填寫生日之有效會員帳號'],
  ['優惠內容', '生日當日完成之訂單可享雙倍點數回饋'],
  ['點數上限', '單一會員於生日當日最高加碼 1,000 點'],
  ['不適用情形', '取消訂單、退貨退款、異常交易、未填生日或非生日當日訂單'],
];

const formatTierRate = (rate) => {
  const percent = Number(rate || 0) * 100;

  if (Number.isNaN(percent)) {
    return '0%';
  }

  if (Number.isInteger(percent)) {
    return `${percent}%`;
  }

  return `${percent.toFixed(2).replace(/\.?0+$/, '')}%`;
};

const formatTierThreshold = (value) => {
  const amount = Number(value || 0);
  if (!amount) {
    return '不限';
  }

  return `累積消費 NT$${amount.toLocaleString()}`;
};

const getTierPerks = (tier) => {
  if (!tier?.description) {
    return [];
  }

  return String(tier.description)
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildTierCards = (tiers) => tiers.map((tier, index) => ({
  key: tier.tier_key || `tier-${tier.id}`,
  icon: TIER_DATA[index]?.icon || '⭐',
  name: tier.tier_name,
  rate: formatTierRate(tier.cashback_rate),
  threshold: formatTierThreshold(tier.upgrade_min_spending),
  perks: getTierPerks(tier),
}));

const buildTierTableRows = (tiers) => tiers.map((tier) => ([
  tier.tier_name,
  formatTierThreshold(tier.upgrade_min_spending),
  formatTierRate(tier.cashback_rate),
  tier.description || '—',
]));

const buildUpgradeRows = (tiers) => tiers.map((tier, index) => {
  const nextTier = tiers[index + 1];

  return [
    tier.tier_name,
    formatTierThreshold(tier.upgrade_min_spending),
    nextTier ? `升等至${nextTier.tier_name}` : '維持最高等級',
    '依年度消費計算',
  ];
});

const buildPointRateRows = (tiers) => tiers.map((tier) => ([
  tier.tier_name,
  formatTierRate(tier.cashback_rate),
  tier.description || '依會員等級回饋點數',
]));

function TocLink({ item, activeSection, onClick }) {
  return (
    <a
      href={`#${item.id}`}
      className={`mb-toc-link ${activeSection === item.id ? 'active' : ''}`}
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
      className="mb-chapter"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="mb-chapter-header">
        {number ? <span className="mb-chapter-num">{`第 ${number} 章`}</span> : null}
        <h2 className="mb-chapter-title">{title}</h2>
      </div>
      <div className="mb-chapter-body">{children}</div>
    </motion.section>
  );
}

export default function MemberBenefits() {
  const { tiers, loading } = useTiers();
  const [activeSection, setActiveSection] = useState('chapter-1');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const sortedTiers = !loading && tiers.length > 0
    ? [...tiers].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [];

  const tierData = sortedTiers.length > 0 ? buildTierCards(sortedTiers) : TIER_DATA;
  const tierTableRows = sortedTiers.length > 0 ? buildTierTableRows(sortedTiers) : TIER_TABLE_ROWS;
  const upgradeTableRows = sortedTiers.length > 0 ? buildUpgradeRows(sortedTiers) : UPGRADE_TABLE_ROWS;
  const pointRateRows = sortedTiers.length > 0 ? buildPointRateRows(sortedTiers) : POINT_RATE_ROWS;

  useEffect(() => {
    const sections = document.querySelectorAll('.mb-chapter');
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
  };

  return (
    <main className="mb-page">
      <motion.section
        className="mb-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-hero-inner">
          <span className="mb-hero-kicker">會員權益</span>
          <h1 className="headline-pro">會員權益，清楚說給您聽</h1>
          <p className="subhead-pro">
            北極先生國際股份有限公司 · 最後更新：2026 年 3 月 23 日
          </p>
          <div className="mb-hero-meta">
            <span><Crown size={14} /> 四個會員等級</span>
            <span><Gift size={14} /> 生日雙倍點數</span>
            <span><Star size={14} /> 黑卡專屬禮遇</span>
          </div>
        </div>
      </motion.section>

      <section className="mb-tier-section">
        <div className="mb-tier-grid">
          {tierData.map((tier) => (
            <div key={tier.key} className={`mb-tier-card mb-tier-card--${tier.key}`}>
              <div className="mb-tier-badge">{tier.icon}</div>
              <h3 className="mb-tier-name">{tier.name}</h3>
              <div className="mb-tier-rate">{tier.rate}</div>
              <p className="mb-tier-rate-label">點數回饋率</p>
              <div className="mb-tier-threshold">{tier.threshold}</div>
              {tier.perks ? (
                <ul className="mb-tier-perks">
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="mb-layout">
        <aside className="mb-toc-sidebar" aria-label="會員權益快速導覽">
          <div className="mb-toc-title">快速導覽</div>
          <div className="mb-toc-list">
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

        <div className="mb-content">
          <Chapter id="chapter-1" number="1" title="您的等級，您的回饋">
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">1.1 會員等級說明</h3>
              <p className="mb-body-text">
                北極先生會員制度依會員於指定期間內之實際累計消費金額區分為家庭會員、銀卡會員、金卡會員與黑卡會員。各等級之點數回饋率、升等門檻、保級標準、黑卡專屬禮遇與其他權益，以本頁及會員中心公告內容為準。本公司得因營運、活動規劃、法令遵循或系統調整需要，對會員制度進行必要更新。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">1.2 等級總覽表</h3>
              <div className="mb-table-wrap">
                <table className="mb-table">
                  <thead>
                    <tr>
                      <th>會員等級</th>
                      <th>年度消費門檻</th>
                      <th>點數回饋率</th>
                      <th>專屬優惠</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierTableRows.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-2" number="2" title="消費怎麼計算" delay={0.03}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">2.1 年度消費累計方式</h3>
              <p className="mb-body-text">
                會員等級之認定，以您於會員年度內完成之有效訂單實付商品金額計算，不含運費、手續費、未實際支付之折扣、優惠券折抵、退款金額、取消訂單、退貨訂單及其他本公司公告不納入計算之金額。會員年度之起算、結算與重置時間，依會員中心實際顯示或本公司另行公告內容為準。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">2.2 訂單有效性與排除項目</h3>
              <p className="mb-body-text">
                僅於訂單狀態完成、未發生退貨退款、未經判定為異常交易且符合活動條件時，該筆消費方得納入年度累計。若您使用點數折抵、優惠券、滿額折扣、贈品活動或其他促銷方案，本公司將以實際支付後且符合制度規則之金額作為計算基礎。
              </p>
              <div className="mb-callout mb-callout--info">
                <Info size={18} />
                <div>
                  <strong>計算範例</strong>
                  <p>
                    若單筆商品總額為 NT$2,200，使用優惠券折抵 NT$200，另使用點數折抵 NT$300，則會員年度消費累計原則上以實付 NT$1,700 計算；實際仍以當期活動與會員制度說明為準。
                  </p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-3" number="3" title="升級與降級怎麼運作" delay={0.06}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">3.1 升級條件與生效時間</h3>
              <p className="mb-body-text">
                當您的會員年度累計消費達到更高等級門檻時，系統將於條件成立後依程序自動升級，並自會員中心顯示之生效日起套用新等級回饋率。升級後，後續符合條件之訂單將依新等級計算點數與可適用之會員權益；先前已完成之訂單不追溯重算。
              </p>
              <div className="mb-callout mb-callout--info">
                <Info size={18} />
                <div>
                  <strong>升級範例</strong>
                  <p>
                    若您原為家庭會員，於 2026 年 6 月 10 日完成一筆有效訂單後，會員年度累計消費達 NT$6,000，則系統可於次一作業時間將您升級為銀卡會員；升級後的新訂單將適用 5% 回饋率。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">3.2 降級與年度重審</h3>
              <p className="mb-body-text">
                本公司得於每一會員年度結束時，依您該年度內之有效累計消費重新計算會員等級。若年度消費未達原等級保留門檻，系統得於次一會員年度起將您的等級調整為對應之級別。降級僅影響未來訂單之回饋與權益，不影響您已取得且仍有效之點數，但如點數本身另有有效期限，仍依原規則計算。
              </p>
              <div className="mb-callout mb-callout--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>降級說明</strong>
                  <p>
                    黑卡與高階會員權益不保證永久有效。若年度結算後未達當期門檻，系統將依實際消費金額調整等級，黑卡專屬禮遇亦可能一併失效。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">3.3 升降級對應表</h3>
              <div className="mb-table-wrap">
                <table className="mb-table">
                  <thead>
                    <tr>
                      <th>目前等級</th>
                      <th>觸發條件</th>
                      <th>結果</th>
                      <th>生效時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgradeTableRows.map((row) => (
                      <tr key={`${row[0]}-${row[1]}`}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-4" number="4" title="消費點數這樣算" delay={0.09}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">4.1 點數回饋計算方式</h3>
              <p className="mb-body-text">
                點數以訂單完成後之實付商品金額，乘以對應會員等級之點數回饋率計算。除另有公告外，點數以整數發放，小數點以下採無條件捨去。本公司得因活動、檔期、節慶或特定商品企劃提供額外加碼，但如活動頁面另有說明，應優先適用其規則。
              </p>
              <div className="mb-callout mb-callout--info">
                <Info size={18} />
                <div>
                  <strong>點數計算範例</strong>
                  <p>
                    若您為金卡會員，單筆有效訂單實付商品金額為 NT$2,500，則可獲得 200 點；若同一日另有生日雙倍活動且符合條件，則可依活動規則加碼，但最高仍受生日加碼上限限制。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">4.2 回饋率一覽</h3>
              <div className="mb-table-wrap">
                <table className="mb-table">
                  <thead>
                    <tr>
                      <th>會員等級</th>
                      <th>回饋率</th>
                      <th>說明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointRateRows.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-5" number="5" title="生日當天，多一份驚喜" delay={0.12}>
            <div className="mb-birthday-banner">
              <div className="mb-birthday-icon">🎂</div>
              <div className="mb-birthday-copy">
                <strong>生日當天訂單，點數雙倍加碼</strong>
                <span>上限 1,000 點 · 限生日當日有效</span>
              </div>
            </div>

            <div className="mb-subsection">
              <h3 className="mb-subsection-title">5.1 生日雙倍點數內容</h3>
              <p className="mb-body-text">
                若您已完成會員資料設定並填寫正確生日，系統得於您生日當日提供符合條件訂單之雙倍點數加碼。雙倍點數係以該會員等級原本應得之點數為基礎進行加成，且加碼部分合計最高以 1,000 點為上限。若同一筆訂單另有其他加點活動，實際計算方式以活動公告為準。
              </p>
              <div className="mb-callout mb-callout--info">
                <Info size={18} />
                <div>
                  <strong>計算說明</strong>
                  <p>
                    若您為銀卡會員，生日當天完成一筆實付 NT$4,000 的有效訂單，原應得 200 點，生日加碼後最高可獲得 400 點；若依活動計算超過 1,000 點，則以 1,000 點為加碼上限。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">5.2 限制與不適用情形</h3>
              <p className="mb-body-text">
                生日雙倍點數僅限會員本人於生日當日完成之有效訂單使用，且每一會員帳號每年限享一次。如生日資料未完成設定、生日已過、訂單於生日當日未完成付款、交易後續發生取消、退貨、退款、異常交易、濫用活動或其他不符規則之情況，本公司得不發放、扣回或取消生日加碼點數。
              </p>
              <div className="mb-callout mb-callout--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>限制規範</strong>
                  <p>
                    生日資訊一經提交後，系統可能限制修改次數或需人工審核。若經判定有重複修改生日、冒用他人身分或刻意規避制度之情形，本公司得取消生日優惠資格。
                  </p>
                </div>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-6" number="6" title="黑卡，有些事只為您準備" delay={0.15}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">6.1 黑卡專屬禮遇</h3>
              <ol className="mb-ordered-list">
                <li>
                  <strong>LINE 官方 24H AI 諮詢</strong>
                  <br />透過本公司 LINE 官方帳號，黑卡會員可使用 24 小時 AI 寵物諮詢服務，
                  隨時提問，即時回應。
                </li>
                <li>
                  <strong>專屬優惠券</strong>
                  <br />不定期發送黑卡會員專屬折扣優惠券，優惠內容以發送通知為準。
                </li>
                <li>
                  <strong>新品優先體驗</strong>
                  <br />新品正式上市前，黑卡會員將獲邀優先試用、體驗或試吃，
                  參與資格以系統通知為準。
                </li>
                <li>
                  <strong>產品討論參與</strong>
                  <br />黑卡會員將獲邀參與本公司不定期舉辦之產品討論活動，
                  提供消費回饋與建議，協助本公司優化商品，
                  活動邀請以電子郵件或 LINE 通知發送。
                </li>
              </ol>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">6.2 專屬權益之變更與限制</h3>
              <p className="mb-body-text">
                黑卡專屬活動可能因產品排程、產量、合作資源、法規要求或其他營運安排而調整、延期、取消或變更內容。本公司保留審核參與資格之權利；如有違反會員制度、濫用試用、轉售贈品、外流未公開資訊或其他不當行為，本公司得取消黑卡資格及其相關專屬權益。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">6.3 其他等級專屬福利說明</h3>
              <p className="mb-body-text">
                各等級專屬福利內容如下，本公司保留依營運狀況不定期調整之權利：
              </p>
              <div className="mb-subsection">
                <h3 className="mb-subsection-title">家庭會員</h3>
                <ol className="mb-ordered-list">
                  <li><strong>最新優惠資訊：</strong>第一時間收到促銷活動、折扣及限時特賣通知。</li>
                  <li><strong>毛孩電報：</strong>定期收到寵物照護知識、新品介紹與品牌最新消息。</li>
                </ol>
              </div>
              <div className="mb-subsection">
                <h3 className="mb-subsection-title">銀卡會員</h3>
                <p className="mb-body-text">含家庭會員全部福利，另享有：</p>
                <ol className="mb-ordered-list">
                  <li><strong>不定時限定優惠券：</strong>不定期發送銀卡以上限定之折扣優惠券。</li>
                  <li><strong>活動優先報名參加：</strong>各項品牌活動享有優先報名資格。</li>
                </ol>
              </div>
              <div className="mb-subsection">
                <h3 className="mb-subsection-title">金卡會員</h3>
                <p className="mb-body-text">含銀卡會員全部福利，另享有：</p>
                <ol className="mb-ordered-list">
                  <li><strong>訂購商品不定時附贈品：</strong>訂購商品時，不定期隨機附贈精選贈品。</li>
                  <li><strong>限時專屬會員優惠：</strong>金卡以上限定之限時折扣與特賣活動。</li>
                  <li><strong>專人產品關懷：</strong>客服團隊主動追蹤訂購體驗，提供個人化建議。</li>
                  <li><strong>產品優先預購：</strong>新品或限量商品開放時享有優先預購名額。</li>
                </ol>
              </div>
            </div>
          </Chapter>

          <Chapter id="chapter-7" number="7" title="我們會怎麼聯繫您" delay={0.18}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">7.1 通知管道</h3>
              <p className="mb-body-text">
                有關會員等級變更、點數入帳、生日優惠、黑卡專屬活動、制度更新與重要權益通知，本公司可能透過會員中心、電子郵件、簡訊、LINE 官方帳號、網站公告或其他適當方式通知您。您應確保聯絡資訊為最新且可接收通知。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">7.2 通知送達與偏好設定</h3>
              <p className="mb-body-text">
                會員權益相關通知屬於服務必要資訊時，即使您停止接收行銷訊息，本公司仍得為履行契約、通知權益變更或處理客服事項而持續發送。若您欲調整行銷偏好，可依隱私權政策與會員中心設定辦理；惟部分系統通知無法關閉。
              </p>
            </div>
          </Chapter>

          <Chapter id="chapter-8" number="8" title="幾個需要知道的規則" delay={0.21}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">8.1 會員權益不得轉讓或兌現</h3>
              <p className="mb-body-text">
                會員等級、點數、生日加碼、黑卡禮遇、專屬邀請及任何會員制度下之權益，均限原會員本人依本制度規則使用，不得轉讓、出售、交換、出租、移轉至其他帳號或要求折抵為現金。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">8.2 異常交易與權益回收</h3>
              <p className="mb-body-text">
                若本公司合理懷疑有大量重複下單、虛假交易、洗點、套利、轉售贈品、系統漏洞利用、冒用帳號、惡意退貨退款或其他違反制度目的之行為，本公司得暫停或終止會員資格、取消等級、回收點數、撤銷生日或黑卡權益，並保留依法求償之權利。
              </p>
            </div>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">8.3 制度更新與解釋權</h3>
              <p className="mb-body-text">
                本公司得因法令變動、營運需求、促銷活動、系統優化或會員制度調整而更新本頁內容。更新後之版本將公布於網站，並自公告時或指定生效日起適用。若您於更新後繼續使用本服務，即視為同意更新後之會員權益規範。
              </p>
            </div>
          </Chapter>

          <Chapter id="appendix-1" title="附表一：會員等級總覽" delay={0.24}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">附表一.1 會員等級總表</h3>
              <div className="mb-table-wrap">
                <table className="mb-table">
                  <thead>
                    <tr>
                      <th>等級</th>
                      <th>年度消費門檻</th>
                      <th>點數回饋率</th>
                      <th>黑卡專屬</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierTableRows.map((row) => (
                      <tr key={`appendix-${row[0]}`}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Chapter>

          <Chapter id="appendix-2" title="附表二：生日優惠說明" delay={0.27}>
            <div className="mb-subsection">
              <h3 className="mb-subsection-title">附表二.1 生日優惠總表</h3>
              <div className="mb-table-wrap">
                <table className="mb-table">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th>說明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {APPENDIX_BIRTHDAY_ROWS.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Chapter>

          <div className="mb-contact-card">
            <h3>對會員權益有疑問？</h3>
            <p>我們會在 1–3 個工作天內回覆您。</p>
            <div className="mb-contact-actions">
              <Link to="/contact" className="btn-blue mb-contact-btn">
                填寫聯繫表單
              </Link>
              <a
                href="https://lin.ee/THZqvZ5r"
                target="_blank"
                rel="noreferrer"
                className="mb-line-btn"
              >
                LINE 官方帳號
              </a>
            </div>
            <div className="mb-company-info">
              <p>北極先生國際股份有限公司</p>
              <p>統一編號：95448000</p>
              <p>mrpolar.com.tw</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            className="mb-back-to-top"
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
