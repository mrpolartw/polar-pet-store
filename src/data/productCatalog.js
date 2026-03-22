import banner2 from '../png/banner 2.png'
import banner3 from '../png/banner 3.png'
import banner4 from '../png/banner 4.png'
import brainGutAxis from '../png/Brain-gut-axis.svg'
import catDogPaste from '../png/Cat-Dog-paste.svg'
import jointCareProduct from '../png/joint-care-product.svg'
import jointIllustration from '../png/joint.svg'
import pickyEat from '../png/picky-eate.svg'

const REMOTE_PRODUCT_IMAGES = {
  dogGutBalance: [
    'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1400',
  ],
  catOceanSensitive: [
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&q=80&w=1400',
  ],
  activeLambDogFood: [
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1525253013412-55c1a69a5738?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1400',
  ],
  indoorDigestiveCatFood: [
    'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=1400',
  ],
  freezeDriedSalmonBites: [
    'https://images.unsplash.com/photo-1517451330947-7809dead78d5?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&q=80&w=1400',
  ],
  pickyEatMeatPaste: [
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1601758123927-1966001d858b?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1400',
  ],
  trainingCheeseBiscuits: [
    'https://images.unsplash.com/photo-1601758003122-58fefa4f3168?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1400',
  ],
  jointSoftChew: [
    'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1400',
  ],
  catGutProbiotic: [
    'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1400',
  ],
  deepSeaFishOil: [
    'https://images.unsplash.com/photo-1583512603784-a8e3ea835f47?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1525253013412-55c1a69a5738?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1400',
  ],
  ceramicWaterFountain: [
    'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=1400',
  ],
  slowFeederBowl: [
    'https://images.unsplash.com/photo-1601758064221-4a2b3c0b4c1e?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1583511655826-05700442b31b?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1400',
  ],
  travelStorageKit: [
    'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1400',
    'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=1400',
  ],
}

export const CATEGORIES = [
  { key: 'all', label: '全部商品' },
  { key: 'food', label: '主食糧' },
  { key: 'snacks', label: '零食點心' },
  { key: 'health', label: '機能保健' },
  { key: 'supplies', label: '用品器具' },
]

export const PET_TYPES = [
  { key: 'all', label: '全部毛孩' },
  { key: 'cat', label: '貓咪' },
  { key: 'dog', label: '狗狗' },
]

export const PRICE_RANGES = [
  { key: 'all', label: '全部價格', min: 0, max: Infinity },
  { key: 'under500', label: 'NT$500 以下', min: 0, max: 499 },
  { key: '500-1000', label: 'NT$500 - 1,000', min: 500, max: 1000 },
  { key: '1000-2000', label: 'NT$1,000 - 2,000', min: 1000, max: 2000 },
  { key: 'over2000', label: 'NT$2,000 以上', min: 2001, max: Infinity },
]

export const SORT_OPTIONS = [
  { key: 'default', label: '推薦排序' },
  { key: 'newest', label: '最新上架' },
  { key: 'popular', label: '最多評價' },
  { key: 'price-asc', label: '價格低到高' },
  { key: 'price-desc', label: '價格高到低' },
]

export const PRODUCT_FILTERS = [
  { key: 'all', label: '全部類型' },
  { key: 'bestseller', label: '熱銷推薦' },
  { key: 'discount', label: '限時優惠' },
  { key: 'bundle', label: '組合搭配' },
  { key: 'new', label: '新品上市' },
]

export const formatPrice = (price) => `NT$${Number(price).toLocaleString()}`

export const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
  .replace(/^-+|-+$/g, '')

const petLabelMap = {
  cat: '貓咪',
  dog: '狗狗',
}

const categoryCopy = {
  food: {
    trustBadges: ['無穀', '低敏', '高吸收蛋白', '無人工添加'],
    ingredientsTitle: '成分透明',
    ingredientsIntro: '每一份主食都從原料邏輯出發，讓成分與功能可以被看懂。',
    exclusions: ['無人工香料', '無人工色素', '無化學防腐劑', '無低價填充穀物'],
    sourceNote: '關鍵蛋白、油脂與機能原料皆以穩定批次與追溯來源為前提設計。',
    nutritionSectionTitle: '營養與功能證據',
    nutritionSectionIntro: '從主要營養數值到機能亮點，讓感性喜歡變成理性可下單的理由。',
    guideTitle: '餵食指南',
    guideIntro: '先從日常好執行的份量與換糧節奏開始，降低下單後的不確定感。',
    rowsTitle: '體重 / 建議每日餵食量',
  },
  snacks: {
    trustBadges: ['高適口', '低溫製程', '訓練友善', '無多餘添加'],
    ingredientsTitle: '原料與製程',
    ingredientsIntro: '點心不是只有好吃，原料來源與製程同樣影響日常安心感。',
    exclusions: ['無人工甜味', '無人工色素', '無低品質肉粉', '無過度調味'],
    sourceNote: '以單純肉源與低負擔配方為原則，讓日常獎勵更容易持續。',
    nutritionSectionTitle: '功能與規格資訊',
    nutritionSectionIntro: '從適口性、訓練應用到成分邏輯，建立零食選購的明確理由。',
    guideTitle: '食用建議',
    guideIntro: '搭配主食與訓練節奏使用，能更自然地把零食變成日常互動工具。',
    rowsTitle: '體重 / 建議每日點心量',
  },
  health: {
    trustBadges: ['精準機能', '日常保養', '成分清楚', '好入口'],
    ingredientsTitle: '關鍵配方',
    ingredientsIntro: '把毛孩真正需要的保養邏輯拆成清楚可理解的配方模組。',
    exclusions: ['無多餘增量糖粉', '無刺激性香料', '無來路不明複方', '無誇張宣稱'],
    sourceNote: '機能原料與輔助配方皆以穩定補充與日常使用便利性為優先。',
    nutritionSectionTitle: '機能亮點與規格',
    nutritionSectionIntro: '讓保健需求從抽象概念，轉成看得懂、可持續的照護方式。',
    guideTitle: '使用指南',
    guideIntro: '建立每天都做得到的保養節奏，效果通常比一次補很多更重要。',
    rowsTitle: '體重 / 建議每日用量',
  },
  supplies: {
    trustBadges: ['日常好清潔', '低負擔材質', '耐用設計', '融入居家'],
    ingredientsTitle: '材質與細節',
    ingredientsIntro: '用品器具也需要透明細節，材質、結構與清潔方式都該先說清楚。',
    exclusions: ['無刺鼻異味', '無易脆裂薄料', '無難清洗死角', '無過度裝飾零件'],
    sourceNote: '從材質選擇、結構穩定到日常收納與清潔便利性一起考量。',
    nutritionSectionTitle: '規格與使用價值',
    nutritionSectionIntro: '用品不是只有外觀，實際使用的穩定性與便利性才是長期差異。',
    guideTitle: '使用與保養',
    guideIntro: '把組裝、清洗與日常使用方式先說清楚，降低購買後的適應成本。',
    rowsTitle: '情境 / 建議使用方式',
  },
}

const nutritionFactsByCategory = {
  food: [
    { label: '粗蛋白', value: '28% 以上' },
    { label: '粗脂肪', value: '16% 以上' },
    { label: '粗纖維', value: '4% 以下' },
    { label: '水分', value: '10% 以下' },
  ],
  snacks: [
    { label: '主要肉源', value: '單一動物蛋白' },
    { label: '製程', value: '低溫慢烘 / 凍乾' },
    { label: '適口性', value: '高接受度' },
    { label: '包裝設計', value: '易保存夾鏈' },
  ],
  health: [
    { label: '主要配方', value: '機能複方' },
    { label: '使用頻率', value: '每日保養' },
    { label: '入口方式', value: '可直接食用 / 混食' },
    { label: '保存建議', value: '陰涼乾燥處' },
  ],
  supplies: [
    { label: '材質', value: '耐用安全材質' },
    { label: '清潔方式', value: '易拆洗設計' },
    { label: '適用場景', value: '日常居家使用' },
    { label: '搭配建議', value: '可與主食 / 保健一起規劃' },
  ],
}

const guideRowsByCategory = {
  food: [
    { weight: '2 - 5kg', amount: '55 - 110g' },
    { weight: '5 - 10kg', amount: '110 - 180g' },
    { weight: '10 - 20kg', amount: '180 - 310g' },
    { weight: '20kg 以上', amount: '310g 以上，依活動量調整' },
  ],
  snacks: [
    { weight: '2 - 5kg', amount: '每日 3 - 6 小塊' },
    { weight: '5 - 10kg', amount: '每日 6 - 10 小塊' },
    { weight: '10 - 20kg', amount: '每日 10 - 16 小塊' },
    { weight: '20kg 以上', amount: '視訓練量與主食比例調整' },
  ],
  health: [
    { weight: '5kg 以下', amount: '每日 1 份' },
    { weight: '5 - 15kg', amount: '每日 1 - 2 份' },
    { weight: '15 - 25kg', amount: '每日 2 份' },
    { weight: '25kg 以上', amount: '每日 2 - 3 份，依需求調整' },
  ],
  supplies: [
    { weight: '日常使用', amount: '首次使用前先清洗並擦乾' },
    { weight: '清潔頻率', amount: '每週完整清潔 1 - 2 次' },
    { weight: '耗材替換', amount: '濾芯或配件依說明定期更換' },
    { weight: '保存', amount: '保持乾燥通風，避免潮濕曝曬' },
  ],
}

const faqByCategory = {
  food: [
    ['適合幼犬或幼貓嗎？', '可依配方與體型選擇對應規格，若處於快速成長期，建議先從少量混糧開始。'],
    ['腸胃敏感可以直接換嗎？', '建議依照 7 日換糧節奏漸進替換，觀察便便與食慾狀態會更穩定。'],
    ['可以和濕食一起搭配嗎？', '可以，建議先確認總熱量與每日飲水量，再調整主食與濕食比例。'],
    ['開封後能保存多久？', '建議於 4 到 6 週內食用完畢，並密封保存於陰涼乾燥處。'],
  ],
  snacks: [
    ['可以天天吃嗎？', '可以作為日常獎勵與互動點心，但仍建議控制在總熱量的一小部分。'],
    ['適合訓練使用嗎？', '多數產品都適合切小塊分次餵食，能讓回饋更即時也更容易建立習慣。'],
    ['挑食毛孩會接受嗎？', '點心通常是建立第一口接受度的好起點，建議先從熟悉氣味與小份量開始。'],
    ['開封後保存方式？', '請密封並放在陰涼處，若環境潮濕可搭配乾燥劑或冷藏短期保存。'],
  ],
  health: [
    ['多久會有感？', '保健類通常需要穩定連續補充一段時間，建議至少觀察 2 到 4 週。'],
    ['可以和主食一起吃嗎？', '可以，混入主食能提升使用穩定度，也更容易形成固定照護流程。'],
    ['和其他保健品會衝突嗎？', '若同時使用多種保健品，建議先確認成分重疊度與每日總量。'],
    ['停用後會有影響嗎？', '多數產品屬於日常保養型，停用後只是少了持續支持，不會造成依賴。'],
  ],
  supplies: [
    ['適合多大體型的毛孩？', '可依商品規格與尺寸建議挑選，若介於兩種尺寸之間通常建議選大一階。'],
    ['清洗會麻煩嗎？', '這系列以拆洗方便與日常可維護性為前提，能降低長期使用負擔。'],
    ['材質安全嗎？', '選用日常接觸友善材質，並避免過多異味或難以判斷來源的零件。'],
    ['耗材多久需要更換？', '依使用頻率與水質 / 清潔頻率不同，建議定期檢查並依狀況更換。'],
  ],
}

const reviewTemplates = {
  food: [
    { author: '米粒媽', meta: '3 歲米克斯 / 腸胃敏感', title: '換糧後食慾跟便便都穩很多', content: '原本每次換糧都會軟便，這次照著 7 日換糧表走，整體適應得很順，也更願意自己去找飯吃。', rating: 5 },
    { author: '奶茶爸', meta: '5 歲柴犬 / 挑食型', title: '終於不是聞兩口就走開', content: '適口性比預期好，早晚餐都吃得更乾淨，對我們這種挑食犬家庭真的有差。', rating: 5 },
    { author: '阿福家', meta: '2 歲英短 / 日常保養', title: '配方資訊清楚，買得比較放心', content: '成分和不含什麼都寫得很清楚，整體感覺比一般只講功效的商品更安心。', rating: 4 },
  ],
  snacks: [
    { author: '小柚媽', meta: '4 歲橘貓 / 訓練互動', title: '很好做日常獎勵', content: '大小剛好，外出或在家做簡單訓練都很方便，接受度也很高。', rating: 5 },
    { author: '球球爸', meta: '6 歲貴賓 / 挑食', title: '拿來當混糧引子很有用', content: '主食偶爾挑嘴時，搭一點點一起拌，吃飯速度明顯快很多。', rating: 4 },
    { author: 'Pony', meta: '1 歲曼赤肯 / 日常點心', title: '味道自然，沒有過重香味', content: '聞起來不會太刺激，給起來比較沒有負擔。', rating: 5 },
  ],
  health: [
    { author: '妮妮媽', meta: '8 歲比熊 / 關節保養', title: '每天補充比較有節奏', content: '比起之前想到才吃，這款好入口很多，現在每天固定補也比較容易。', rating: 5 },
    { author: 'Leo 爸', meta: '7 歲米克斯 / 腸道保養', title: '混在主食裡接受度高', content: '原本擔心會排斥，實際上混食很順，日常保養比較做得起來。', rating: 4 },
    { author: 'Miso 家', meta: '5 歲英短 / 皮毛保養', title: '搭配主食後更容易持續', content: '最有感的是使用方式簡單，讓保養不會變成壓力。', rating: 5 },
  ],
  supplies: [
    { author: '阿丸媽', meta: '雙貓家庭 / 居家用品', title: '清洗方便真的差很多', content: '組裝和拆洗都比想像中簡單，日常維護不會拖延。', rating: 5 },
    { author: '小虎爸', meta: '中型犬 / 餵食用品', title: '材質與外型都很有質感', content: '放在家裡不突兀，使用體驗和視覺都顧到了。', rating: 4 },
    { author: 'Coco 家', meta: '貓咪日常使用', title: '細節設計比一般用品完整', content: '從邊角到穩定度都看得出來有想過實際使用情境。', rating: 5 },
  ],
}

const createStoryBlocks = (product) => {
  const petLabel = petLabelMap[product.petType]

  if (product.category === 'snacks') {
    return [
      {
        eyebrow: '第一口就願意靠近',
        title: '讓互動與獎勵變得更自然',
        description: `${product.name} 以高適口與輕負擔配方為核心，讓挑嘴的 ${petLabel} 也更願意接受日常互動獎勵。`,
        image: pickyEat,
      },
      {
        eyebrow: '不只是好吃',
        title: '把原料與製程也說清楚',
        description: '點心如果會天天吃，就更需要把肉源、製程與保存方式交代完整，讓獎勵不只是短暫滿足。',
        image: catDogPaste,
      },
      {
        eyebrow: '訓練友善',
        title: '從召回到日常安撫都更好用',
        description: '份量、口感與氣味設計更適合分次給予，讓訓練與正向回饋更容易持續。',
        image: banner3,
      },
      {
        eyebrow: '日常加分',
        title: '和主食、濕食搭配也更靈活',
        description: '不論是單獨獎勵或少量混搭，都能把接受度與儀式感一起拉起來。',
        image: banner4,
      },
    ]
  }

  if (product.category === 'health') {
    return [
      {
        eyebrow: '精準保養',
        title: '讓照護重點更聚焦，而不是什麼都補一點',
        description: `${product.name} 將核心需求整理成每日可執行的保養節奏，讓 ${petLabel} 的日常支持更具方向感。`,
        image: jointCareProduct,
      },
      {
        eyebrow: '每天做得到',
        title: '入口方式簡單，才有機會真正持續',
        description: '保健效果的前提不是一次吃很多，而是能長期穩定地補充。',
        image: catDogPaste,
      },
      {
        eyebrow: '配方透明',
        title: '每種成分都知道在幫什麼',
        description: '從機能原料到輔助配方，建立成分與實際目的之間的清楚連結。',
        image: brainGutAxis,
      },
      {
        eyebrow: '長期支持',
        title: '從今天開始，讓身體維持更有餘裕',
        description: '好的保養品不是追求立刻誇張，而是讓每天的累積更有秩序。',
        image: jointIllustration,
      },
    ]
  }

  if (product.category === 'supplies') {
    return [
      {
        eyebrow: '從日常情境出發',
        title: '好用的用品，第一步是先融入生活',
        description: `${product.name} 以每天都會用到的實際情境為出發點，讓 ${petLabel} 與飼主都更容易建立穩定習慣。`,
        image: banner4,
      },
      {
        eyebrow: '材質與結構',
        title: '不是看起來漂亮，而是用起來穩定',
        description: '材質觸感、結構穩定與拆洗邏輯，會直接影響長期使用滿意度。',
        image: jointCareProduct,
      },
      {
        eyebrow: '清潔負擔更低',
        title: '好清洗，才真的會天天用',
        description: '把清潔成本降下來，用品才不會在使用一陣子後變成被閒置的物件。',
        image: catDogPaste,
      },
      {
        eyebrow: '居家一致性',
        title: '把機能感與品牌感一起留在家裡',
        description: '用品同時兼顧家中視覺語言與毛孩實際需求，讓使用體驗更完整。',
        image: banner2,
      },
    ]
  }

  return [
    {
      eyebrow: '吃得下去',
      title: '從第一口開始，建立更穩定的接受度',
      description: `${product.name} 針對 ${petLabel} 常見的挑食、換糧猶豫與敏感狀態，先把「願意吃」這件事做對。`,
      image: pickyEat,
    },
    {
      eyebrow: '消化更穩定',
      title: '把日常便便、食慾與精神狀態一起照顧',
      description: '結合益生菌、膳食纖維與機能油脂，協助日常消化節奏更平衡，也讓換糧過程更容易過渡。',
      image: brainGutAxis,
    },
    {
      eyebrow: '真正成分透明',
      title: '不是只講功效，而是把原料邏輯完整說清楚',
      description: '從核心蛋白到輔助配方，都讓你知道每項原料是為了什麼而存在。',
      image: banner3,
    },
    {
      eyebrow: '從日常到長期健康',
      title: '每天都能持續，才是配方真正的價值',
      description: '把毛孩今天願意吃、明天吃得穩、長期吃得安心三件事放在同一套邏輯裡完成。',
      image: jointIllustration,
    },
  ]
}

const createIngredients = (product) => {
  if (product.category === 'snacks') {
    return [
      { name: '單一肉源', benefit: '降低多種肉源混合帶來的不確定性', detail: '讓日常獎勵更好觀察接受度與狀態變化。' },
      { name: '低溫製程', benefit: '保留氣味與口感層次', detail: '在適口性與保存需求之間找到更平衡的做法。' },
      { name: '簡單配方', benefit: '不讓點心成為額外負擔', detail: '把多餘添加降到更低，日常使用也比較安心。' },
      { name: '夾鏈包裝', benefit: '維持新鮮度與外出便利性', detail: '讓獎勵可以更容易被放進日常訓練流程。' },
    ]
  }

  if (product.category === 'health') {
    return [
      { name: '機能主成分', benefit: '對應特定保養需求', detail: '把日常照護拆成清楚可持續的方向。' },
      { name: '輔助複方', benefit: '提升整體補充邏輯', detail: '讓主要成分與日常使用情境更容易接上。' },
      { name: '好入口形式', benefit: '降低排斥與執行門檻', detail: '願意吃，才有機會把保養變成習慣。' },
      { name: '穩定批次', benefit: '建立長期使用信心', detail: '讓每一次補充都更接近可預期的照護節奏。' },
    ]
  }

  if (product.category === 'supplies') {
    return [
      { name: '主要材質', benefit: '接觸感與耐用性更穩定', detail: '長期使用時更能看出材質選擇的差異。' },
      { name: '結構細節', benefit: '減少翻倒、卡垢或難拆洗問題', detail: '把真正會每天遇到的問題優先解決。' },
      { name: '居家友善外觀', benefit: '在家裡放得住也看得順', detail: '讓用品自然融入現有空間，而不是突兀存在。' },
      { name: '可維護設計', benefit: '清潔與保養流程更簡單', detail: '降低後續使用成本，才會真的一直用下去。' },
    ]
  }

  return [
    { name: '高吸收蛋白', benefit: '幫助肌肉維持與日常活力', detail: '優先把第一層的營養基礎打穩。' },
    { name: '魚油與機能油脂', benefit: '支持皮毛與日常保養', detail: '讓外在狀態與內在機能一起兼顧。' },
    { name: '益生菌與膳食纖維', benefit: '維持腸道菌相平衡', detail: '把敏感與換糧期常見的不適風險降得更低。' },
    { name: '低敏無穀邏輯', benefit: '減少常見敏感來源負擔', detail: '從原料源頭開始做出更清楚的選擇。' },
  ]
}

const createNutritionHighlights = (product) => {
  if (product.category === 'snacks') {
    return [
      { title: '適口提升', description: '挑嘴毛孩也更容易接受', value: '高接受度' },
      { title: '訓練友善', description: '切小塊或分次使用都方便', value: '好操作' },
      { title: '成分簡潔', description: '日常獎勵也能更安心', value: '低負擔' },
      { title: '混搭加分', description: '可做主食加碼或誘食用途', value: '用途彈性' },
    ]
  }

  if (product.category === 'health') {
    return [
      { title: '精準保養', description: '把需求聚焦在真正需要的地方', value: '對症保養' },
      { title: '每日可持續', description: '吃得進去才有機會看見改變', value: '好入口' },
      { title: '配方透明', description: '每項成分都能對回實際目的', value: '清楚可懂' },
      { title: '長期支持', description: '陪毛孩把日常狀態穩穩維持住', value: '穩定累積' },
    ]
  }

  if (product.category === 'supplies') {
    return [
      { title: '清潔方便', description: '降低日常保養與拆洗成本', value: '易維護' },
      { title: '使用穩定', description: '細節設計減少翻倒與卡垢', value: '更耐用' },
      { title: '材質安心', description: '從接觸面到整體結構都更放心', value: '低負擔' },
      { title: '融入居家', description: '視覺與功能都更符合日常空間', value: '高質感' },
    ]
  }

  return [
    { title: '腸胃穩定', description: '幫助便便型態與消化節奏更規律', value: '益生菌 + 纖維' },
    { title: '低敏溫和', description: '降低常見敏感來源帶來的負擔', value: '無穀配方' },
    { title: '適口提升', description: '從第一口開始建立穩定接受度', value: '高吸收蛋白' },
    { title: '皮毛保健', description: '讓日常外在狀態更有光澤', value: '魚油支持' },
  ]
}

const createSuitability = (product) => {
  if (product.category === 'snacks') {
    return [
      { title: '挑食型毛孩', issue: '主食意願不高', reason: '可作為提高接受度的第一步', change: '讓進食儀式感更好建立。' },
      { title: '訓練期毛孩', issue: '需要即時回饋', reason: '份量與口感更適合分次獎勵', change: '互動與召回的成功率更穩。' },
      { title: '高互動家庭', issue: '想增加陪伴品質', reason: '點心能自然帶出正向互動', change: '把日常照顧變成更有連結的時刻。' },
      { title: '混食需求', issue: '想幫主食加一點變化', reason: '少量搭配就能提升誘食效果', change: '不必一下大改，也能先觀察接受度。' },
    ]
  }

  if (product.category === 'health') {
    return [
      { title: '熟齡毛孩', issue: '開始需要更細緻的日常保養', reason: '可作為規律保養的起點', change: '讓照護不再只靠想到才補。' },
      { title: '活動量下降', issue: '希望日常狀態維持更穩', reason: '把保養融入固定作息中', change: '更容易長期持續執行。' },
      { title: '敏感體質', issue: '需要更溫和的補充方式', reason: '好入口形式能降低抗拒', change: '照護門檻更低，也更願意配合。' },
      { title: '多項照護需求', issue: '想建立有方向的日常照護', reason: '可和主食、其他用品一起規劃', change: '把照顧節奏整理得更有條理。' },
    ]
  }

  if (product.category === 'supplies') {
    return [
      { title: '忙碌上班族', issue: '希望用品好用又好整理', reason: '降低清潔與維護負擔', change: '日常使用更容易維持穩定。' },
      { title: '多寵家庭', issue: '需要更耐用的使用體驗', reason: '材質與結構更能承受高頻率使用', change: '更不容易頻繁替換。' },
      { title: '空間講究家庭', issue: '不想讓用品破壞整體風格', reason: '外觀與質感更容易融入家中', change: '功能與美感能一起成立。' },
      { title: '新手飼主', issue: '擔心買了卻不好維護', reason: '使用方式與保養邏輯更直覺', change: '降低購買後的不確定感。' },
    ]
  }

  return [
    { title: '挑食毛孩', issue: '吃飯意願忽高忽低', reason: '高適口蛋白讓第一口更容易被接受', change: '進食穩定度通常會先回來。' },
    { title: '腸胃敏感', issue: '換糧容易軟便或不舒服', reason: '益生菌與纖維支持更溫和的過渡', change: '便便與胃口更容易回到日常節奏。' },
    { title: '換糧期', issue: '想換更好的主食但怕不適應', reason: '配方設計更適合用漸進方式導入', change: '讓換糧不再需要一次承擔太多風險。' },
    { title: '皮毛保養需求', issue: '想同時兼顧外在與體內狀態', reason: '蛋白與油脂結構更完整', change: '把日常保養放回主食這個基礎上。' },
  ]
}

const createFeedingGuide = (product) => ({
  title: categoryCopy[product.category].guideTitle,
  intro: categoryCopy[product.category].guideIntro,
  rowsTitle: categoryCopy[product.category].rowsTitle,
  rows: guideRowsByCategory[product.category],
  transition: [
    '第 1 - 2 天：新糧 25%，舊糧 75%',
    '第 3 - 4 天：新糧 50%，舊糧 50%',
    '第 5 - 6 天：新糧 75%，舊糧 25%',
    '第 7 天起：可逐步完全轉換為新糧',
  ],
  storage: product.category === 'supplies'
    ? '請依材質說明進行清洗與保存，避免長時間曝曬或潮濕堆放。'
    : '開封後請密封保存於陰涼乾燥處，並優先於建議時間內食用完畢。',
  water: product.category === 'supplies'
    ? '若為飲水或餵食用品，建議定期清洗並保持使用環境乾淨。'
    : '搭配足量飲水能幫助日常消化與代謝，尤其在換糧或保健期更重要。',
})

const createReviews = (category) => reviewTemplates[category]

const createProduct = (product) => {
  const defaults = categoryCopy[product.category]
  const gallery = product.gallery?.length ? product.gallery : [product.image, banner2, banner3, brainGutAxis]
  const variants = product.variants?.length
    ? product.variants
    : [{ id: 'default', label: product.specs, price: product.price, description: '標準規格' }]
  const slug = product.slug || slugify(product.name)

  return {
    ...product,
    slug,
    gallery,
    variants,
    shortDescription: product.shortDescription || '把品牌敘事、成分透明與日常實用性，整理成一頁就能完成決策的商品資訊。',
    trustBadges: product.trustBadges || defaults.trustBadges,
    storyBlocks: product.storyBlocks || createStoryBlocks(product),
    ingredientsTitle: product.ingredientsTitle || defaults.ingredientsTitle,
    ingredientsIntro: product.ingredientsIntro || defaults.ingredientsIntro,
    ingredients: product.ingredients || createIngredients(product),
    exclusions: product.exclusions || defaults.exclusions,
    sourceNote: product.sourceNote || defaults.sourceNote,
    nutritionSectionTitle: product.nutritionSectionTitle || defaults.nutritionSectionTitle,
    nutritionSectionIntro: product.nutritionSectionIntro || defaults.nutritionSectionIntro,
    nutritionHighlights: product.nutritionHighlights || createNutritionHighlights(product),
    nutritionFacts: product.nutritionFacts || nutritionFactsByCategory[product.category],
    suitability: product.suitability || createSuitability(product),
    reviews: product.reviews || createReviews(product.category),
    reviewKeywords: product.reviewKeywords || ['適口性高', '願意回購', '資訊透明'],
    guide: product.guide || createFeedingGuide(product),
    faqs: product.faqs || faqByCategory[product.category].map(([question, answer]) => ({ question, answer })),
  }
}

const rawProducts = [
  {
    id: 101,
    slug: 'polar-dog-gut-balance',
    name: 'Polar 低敏腸胃保健犬糧',
    category: 'food',
    petType: 'dog',
    price: 1380,
    originalPrice: 1680,
    specs: '成犬配方 / 2.5kg',
    rating: 4.9,
    reviewCount: 241,
    isBestseller: true,
    isNew: false,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.dogGutBalance[0],
    usp: '為挑食、敏感與容易軟便的毛孩設計',
    shortDescription: '高吸收蛋白搭配腸道機能配方，幫助消化穩定、食慾提升與日常活力維持。',
    gallery: REMOTE_PRODUCT_IMAGES.dogGutBalance,
    variants: [
      { id: 'dog-gut-balance-2-5kg', label: '2.5kg', price: 1380, description: '日常家庭最熱門規格' },
      { id: 'dog-gut-balance-6kg', label: '6kg', price: 2980, description: '多犬家庭與長期補貨更划算' },
    ],
    reviewKeywords: ['便便穩定', '適口性高', '回購率高'],
    recommendedSlugs: ['polar-joint-soft-chew', 'polar-picky-eat-meat-paste', 'polar-ceramic-water-fountain'],
  },
  {
    id: 102,
    slug: 'polar-cat-ocean-sensitive',
    name: 'Polar 深海魚低敏貓糧',
    category: 'food',
    petType: 'cat',
    price: 1280,
    originalPrice: 1490,
    specs: '成貓配方 / 1.8kg',
    rating: 4.8,
    reviewCount: 198,
    isBestseller: true,
    isNew: false,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.catOceanSensitive[0],
    usp: '為敏感體質與室內成貓設計的穩定主食',
    shortDescription: '以魚肉蛋白、纖維結構與低敏邏輯組成，幫助日常消化與毛球管理更平衡。',
    gallery: REMOTE_PRODUCT_IMAGES.catOceanSensitive,
    variants: [
      { id: 'cat-ocean-sensitive-1-8kg', label: '1.8kg', price: 1280, description: '適合單貓日常補貨' },
      { id: 'cat-ocean-sensitive-4kg', label: '4kg', price: 2590, description: '多貓家庭更適合' },
    ],
    recommendedSlugs: ['polar-cat-gut-probiotic', 'polar-freeze-dried-salmon-bites', 'polar-ceramic-water-fountain'],
  },
  {
    id: 103,
    slug: 'polar-active-lamb-dog-food',
    name: 'Polar 草飼羊活力犬糧',
    category: 'food',
    petType: 'dog',
    price: 1520,
    originalPrice: null,
    specs: '全齡犬配方 / 3kg',
    rating: 4.7,
    reviewCount: 126,
    isBestseller: false,
    isNew: true,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.activeLambDogFood[0],
    usp: '給活動量高、需要穩定耐力支撐的毛孩',
    gallery: REMOTE_PRODUCT_IMAGES.activeLambDogFood,
    variants: [
      { id: 'active-lamb-3kg', label: '3kg', price: 1520, description: '活動量高的日常主食' },
      { id: 'active-lamb-6kg', label: '6kg', price: 2860, description: '大體型犬更划算' },
    ],
  },
  {
    id: 104,
    slug: 'polar-indoor-digestive-cat-food',
    name: 'Polar 室內消化平衡貓糧',
    category: 'food',
    petType: 'cat',
    price: 990,
    originalPrice: null,
    specs: '室內成貓 / 1.5kg',
    rating: 4.6,
    reviewCount: 88,
    isBestseller: false,
    isNew: true,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.indoorDigestiveCatFood[0],
    usp: '針對室內生活節奏與毛球管理需求打造',
    gallery: REMOTE_PRODUCT_IMAGES.indoorDigestiveCatFood,
    variants: [
      { id: 'indoor-digestive-1-5kg', label: '1.5kg', price: 990, description: '小包裝試吃更輕鬆' },
      { id: 'indoor-digestive-3kg', label: '3kg', price: 1880, description: '穩定補貨更方便' },
    ],
  },
  {
    id: 201,
    slug: 'polar-freeze-dried-salmon-bites',
    name: 'Polar 凍乾鮭魚零食',
    category: 'snacks',
    petType: 'cat',
    price: 360,
    originalPrice: null,
    specs: '貓咪專用 / 50g',
    rating: 4.9,
    reviewCount: 312,
    isBestseller: true,
    isNew: false,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.freezeDriedSalmonBites[0],
    usp: '為挑食貓與高互動家庭準備的高適口獎勵',
    gallery: REMOTE_PRODUCT_IMAGES.freezeDriedSalmonBites,
    recommendedSlugs: ['polar-cat-ocean-sensitive', 'polar-cat-gut-probiotic', 'polar-ceramic-water-fountain'],
  },
  {
    id: 202,
    slug: 'polar-picky-eat-meat-paste',
    name: 'Polar 挑食救星肉泥條',
    category: 'snacks',
    petType: 'dog',
    price: 320,
    originalPrice: 390,
    specs: '犬用 / 12 入',
    rating: 4.8,
    reviewCount: 174,
    isBestseller: true,
    isNew: false,
    isBundle: true,
    image: REMOTE_PRODUCT_IMAGES.pickyEatMeatPaste[0],
    usp: '當作誘食、訓練或補餵都順手的高接受度點心',
    gallery: REMOTE_PRODUCT_IMAGES.pickyEatMeatPaste,
    recommendedSlugs: ['polar-dog-gut-balance', 'polar-joint-soft-chew', 'polar-slow-feeder-bowl'],
  },
  {
    id: 203,
    slug: 'polar-training-cheese-biscuits',
    name: 'Polar 犬用起司訓練餅乾',
    category: 'snacks',
    petType: 'dog',
    price: 280,
    originalPrice: null,
    specs: '全齡犬 / 180g',
    rating: 4.6,
    reviewCount: 95,
    isBestseller: false,
    isNew: true,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.trainingCheeseBiscuits[0],
    usp: '一口大小的訓練獎勵，更適合重複回饋與外出攜帶',
    gallery: REMOTE_PRODUCT_IMAGES.trainingCheeseBiscuits,
  },
  {
    id: 301,
    slug: 'polar-joint-soft-chew',
    name: 'Polar Joint 關節保健軟嚼錠',
    category: 'health',
    petType: 'dog',
    price: 1290,
    originalPrice: null,
    specs: '中大型犬 / 60 顆',
    rating: 4.9,
    reviewCount: 198,
    isBestseller: true,
    isNew: false,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.jointSoftChew[0],
    usp: '從日常上下樓到活動後修復，陪毛孩把關節照顧得更長期',
    gallery: REMOTE_PRODUCT_IMAGES.jointSoftChew,
    reviewKeywords: ['活動順暢', '好入口', '持續補充'],
    recommendedSlugs: ['polar-dog-gut-balance', 'polar-picky-eat-meat-paste', 'polar-slow-feeder-bowl'],
  },
  {
    id: 302,
    slug: 'polar-cat-gut-probiotic',
    name: 'Polar 貓咪腸道益生菌',
    category: 'health',
    petType: 'cat',
    price: 990,
    originalPrice: 1180,
    specs: '成貓配方 / 30 包',
    rating: 4.7,
    reviewCount: 104,
    isBestseller: false,
    isNew: false,
    isBundle: true,
    image: REMOTE_PRODUCT_IMAGES.catGutProbiotic[0],
    usp: '把挑食、換糧與腸胃不穩的日常壓力降得更低',
    gallery: REMOTE_PRODUCT_IMAGES.catGutProbiotic,
    reviewKeywords: ['混食方便', '腸道保養', '日常穩定'],
    recommendedSlugs: ['polar-cat-ocean-sensitive', 'polar-freeze-dried-salmon-bites', 'polar-ceramic-water-fountain'],
  },
  {
    id: 303,
    slug: 'polar-deep-sea-fish-oil',
    name: 'Polar 深海魚油膠囊',
    category: 'health',
    petType: 'dog',
    price: 520,
    originalPrice: null,
    specs: '全齡犬 / 90 顆',
    rating: 4.6,
    reviewCount: 73,
    isBestseller: false,
    isNew: true,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.deepSeaFishOil[0],
    usp: '從皮毛光澤到日常活力，建立更穩定的補充節奏',
    gallery: REMOTE_PRODUCT_IMAGES.deepSeaFishOil,
  },
  {
    id: 401,
    slug: 'polar-ceramic-water-fountain',
    name: 'Polar 陶瓷自動飲水機',
    category: 'supplies',
    petType: 'cat',
    price: 1680,
    originalPrice: null,
    specs: '2.5L / 靜音設計',
    rating: 4.9,
    reviewCount: 224,
    isBestseller: true,
    isNew: false,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.ceramicWaterFountain[0],
    usp: '把喝水這件事變得更自然，讓居家照護也能有質感',
    gallery: REMOTE_PRODUCT_IMAGES.ceramicWaterFountain,
    reviewKeywords: ['安靜好洗', '喝水量提升', '居家質感'],
    recommendedSlugs: ['polar-cat-ocean-sensitive', 'polar-cat-gut-probiotic', 'polar-freeze-dried-salmon-bites'],
  },
  {
    id: 402,
    slug: 'polar-slow-feeder-bowl',
    name: 'Polar 慢食陶瓷食碗',
    category: 'supplies',
    petType: 'dog',
    price: 780,
    originalPrice: null,
    specs: '中小型犬 / 陶瓷底座',
    rating: 4.7,
    reviewCount: 67,
    isBestseller: false,
    isNew: true,
    isBundle: false,
    image: REMOTE_PRODUCT_IMAGES.slowFeederBowl[0],
    usp: '讓進食速度慢下來，也把清潔與質感一起照顧到',
    gallery: REMOTE_PRODUCT_IMAGES.slowFeederBowl,
    recommendedSlugs: ['polar-dog-gut-balance', 'polar-joint-soft-chew', 'polar-picky-eat-meat-paste'],
  },
  {
    id: 403,
    slug: 'polar-travel-food-storage-kit',
    name: 'Polar 外出儲糧收納組',
    category: 'supplies',
    petType: 'cat',
    price: 920,
    originalPrice: 1090,
    specs: '旅用收納 / 3 件組',
    rating: 4.5,
    reviewCount: 41,
    isBestseller: false,
    isNew: false,
    isBundle: true,
    image: REMOTE_PRODUCT_IMAGES.travelStorageKit[0],
    usp: '把外出補糧、零食與餵食用品整理成一套更俐落的解法',
    gallery: REMOTE_PRODUCT_IMAGES.travelStorageKit,
  },
]

export const PRODUCT_CATALOG = rawProducts.map(createProduct)

export const getProductBySlug = (slug) => PRODUCT_CATALOG.find((product) => product.slug === slug)

export const getRelatedProducts = (currentProduct, limit = 4) => {
  if (!currentProduct) return []

  const explicitRelated = (currentProduct.recommendedSlugs || [])
    .map((slug) => getProductBySlug(slug))
    .filter(Boolean)

  const fallbackRelated = PRODUCT_CATALOG.filter((product) => (
    product.slug !== currentProduct.slug
    && (product.category === currentProduct.category || product.petType === currentProduct.petType)
  ))

  const merged = [...explicitRelated]

  fallbackRelated.forEach((product) => {
    if (!merged.some((item) => item.slug === product.slug)) merged.push(product)
  })

  return merged.slice(0, limit)
}

export const createCartPayload = (product, variant, quantity = 1) => {
  const selectedVariant = variant || product.variants[0]

  return {
    id: `${product.id}-${selectedVariant.id}`,
    productId: product.id,
    name: product.name,
    image: product.image,
    specs: selectedVariant.label,
    price: selectedVariant.price,
    quantity,
    shippingMethods: ['宅配到府', '7-ELEVEN 取貨'],
  }
}
