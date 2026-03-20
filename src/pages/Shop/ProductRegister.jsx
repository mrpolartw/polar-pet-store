import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode, Hash, CheckCircle2, Package2, Factory,
  Truck, Store, ShoppingBag, UserCheck, AlertCircle,
  Camera, X, Shield, Leaf, Warehouse, MapPin,
  LogIn, UserPlus, RefreshCw, Eye, Clock
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { registerSerial } from '../../api/customer';
import './ProductRegister.css';

/* ─────────────────────────────────────────────
   Mock 產品資料庫
───────────────────────────────────────────── */
const MOCK_DB = {
  'PL2026CAT001': {
    id: 'PL2026CAT001',
    name: 'Polar 頂級鮭魚主食糧',
    specs: '成貓配方 / 1.5kg',
    batchNo: 'BATCH-20251211-A01',
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=400',
    channel: 'offline',
    queryCount: 24,
    registeredBy: null,
    registeredDate: null,
    timeline: [
      { date: '2025/12/11', event: '原物料進貨',    detail: '負責人：張小姐',           type: 'raw' },
      { date: '2025/12/12', event: '台中大里廠製造', detail: '品管：許先生',             type: 'factory' },
      { date: '2025/12/13', event: '台中大里廠包裝', detail: '品質檢驗合格',             type: 'package' },
      { date: '2025/12/14', event: '台中西屯倉儲',   detail: '入庫完成',                type: 'warehouse' },
      { date: '2025/12/31', event: '通路販售',       detail: '寵物好事多',              type: 'store' },
    ],
  },
  'PL2026DOG001': {
    id: 'PL2026DOG001',
    name: 'Polar 草飼牛肉主食糧',
    specs: '大型犬配方 / 3.0kg',
    batchNo: 'BATCH-20251212-B02',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400',
    channel: 'online',
    queryCount: 9,
    registeredBy: null,
    registeredDate: null,
    timeline: [
      { date: '2025/12/11', event: '原物料進貨',       detail: '負責人：張小姐',                    type: 'raw' },
      { date: '2025/12/12', event: '台中大里廠製造',    detail: '品管：許先生',                      type: 'factory' },
      { date: '2025/12/13', event: '台中大里廠包裝',    detail: '品質檢驗合格',                      type: 'package' },
      { date: '2025/12/14', event: '台中西屯倉儲',      detail: '入庫完成',                         type: 'warehouse' },
      { date: '2025/12/31', event: '線上訂單',          detail: '官網訂單 #PO-20251231-88821',       type: 'order' },
      { date: '2026/01/01', event: '黑貓宅急便出貨',    detail: '運單號：12345678901',               type: 'shipping' },
      { date: '2026/01/05', event: '商品配送中',        detail: '黑貓宅急便',                        type: 'transit' },
      { date: '2026/01/06', event: '商品送達',          detail: '配送完成',                         type: 'delivered' },
    ],
  },
  'PL2026JNT001': {
    id: 'PL2026JNT001',
    name: 'Polar Joint 關節保健',
    specs: '大型犬 / 60顆',
    batchNo: 'BATCH-20251210-C03',
    image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=400',
    channel: 'offline',
    queryCount: 6,
    registeredBy: '許*言',
    registeredDate: '2026/01/05',
    timeline: [
      { date: '2025/12/10', event: '原物料進貨',    detail: '負責人：張小姐', type: 'raw' },
      { date: '2025/12/11', event: '台中大里廠製造', detail: '品管：許先生',   type: 'factory' },
      { date: '2025/12/12', event: '台中大里廠包裝', detail: '品質檢驗合格',   type: 'package' },
      { date: '2025/12/13', event: '台中西屯倉儲',   detail: '入庫完成',      type: 'warehouse' },
      { date: '2025/12/31', event: '通路販售',       detail: '寵物好事多',    type: 'store' },
    ],
  },
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const ICON_MAP = {
  raw:       Leaf,
  factory:   Factory,
  package:   Package2,
  warehouse: Warehouse,
  store:     Store,
  order:     ShoppingBag,
  shipping:  Truck,
  transit:   Truck,
  delivered: MapPin,
  register:  UserCheck,
};

const maskName = (name) => {
  if (!name || name.length <= 1) return name || '';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

const formatSerial = (val) =>
  val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

/* ─────────────────────────────────────────────
   Auth Prompt（未登入畫面）
───────────────────────────────────────────── */
function AuthPrompt() {
  return (
    <main className="pr-page">
      <section className="pr-hero">
        <h1 className="headline-pro">產品安心登記</h1>
        <p className="subhead-pro" style={{ marginTop: 12 }}>
          登入您購買的Mr.Polar商品，即可查看商品完整安心履歷
        </p>
      </section>
      <div className="pr-container">
        <div className="pr-auth-gate">
          <div className="pr-auth-gate-icon"><Shield size={48} strokeWidth={1.5} /></div>
          <h2>需要登入才能使用此功能</h2>
          <p>產品序號登入需要會員身份，以確保每個序號的唯一性與安全性。</p>
          <div className="pr-auth-gate-btns">
            <Link to="/login" className="btn-blue pr-auth-btn">
              <LogIn size={18} /> 登入帳號
            </Link>
            <Link to="/register" className="pr-auth-btn-outline">
              <UserPlus size={18} /> 加入會員
            </Link>
          </div>
          <p className="pr-auth-hint">
            <Shield size={12} style={{ marginRight: 5 }} />
            您的資料受到 256-bit SSL 加密保護
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function ProductRegister() {
  const { user, isLoggedIn } = useAuth();

  const [step,       setStep]       = useState('input');
  // 'input' | 'verifying' | 'result' | 'success' | 'claimed'
  const [serial,     setSerial]     = useState('');
  const [product,    setProduct]    = useState(null);
  const [error,      setError]      = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraErr,  setCameraErr]  = useState('');
  const [scanStatus, setScanStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 'idle' | 'scanning' | 'found'

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const scanTimer   = useRef(null);

  // 離開頁面時關閉相機
  useEffect(() => () => {
    clearTimeout(scanTimer.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setScanStatus('idle');
  }, []);

  /* ── Camera ── */
  const openCamera = async () => {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setScanStatus('scanning');
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);

      // ── 模擬 QR 偵測（正式環境請安裝 npm install jsqr）──
      scanTimer.current = setTimeout(() => {
        setScanStatus('found');
        setTimeout(() => {
          closeCamera();
          const mockSerial = 'PL2026DOG001';
          setSerial(mockSerial);
          doSearch(mockSerial);
        }, 900);
      }, 2600);
    } catch (err) {
      if (err.name === 'NotAllowedError')  setCameraErr('請允許相機權限後再試一次');
      else if (err.name === 'NotFoundError') setCameraErr('未偵測到相機模組');
      else setCameraErr('無法開啟相機，請改用手動輸入序號');
    }
  };

  function closeCamera() {
    clearTimeout(scanTimer.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setScanStatus('idle');
  }

  /* ── Search ── */
  const doSearch = (inputSerial) => {
    const s = (inputSerial ?? serial).trim().toUpperCase();
    if (!s) { setError('請輸入產品序號'); return; }
    setError('');
    setStep('verifying');

    setTimeout(() => {
      const found = MOCK_DB[s];
      const updated = found
        ? { ...found, queryCount: found.queryCount + 1 }
        : {
            id: s,
            name: s,
            specs: '',
            batchNo: s,
            image: '/placeholder.jpg',
            channel: 'online',
            queryCount: 1,
            registeredBy: null,
            registeredDate: null,
            timeline: [],
          };
      setProduct(updated);
      setStep(found?.registeredBy ? 'claimed' : 'result');
      return;
      /*
      if (!found) {
        setError(`找不到序號「${s}」的產品，請確認後再試`);
        setStep('input');
        return;
      }
      const updated = { ...found, queryCount: found.queryCount + 1 };
      setProduct(updated);
      setStep(found.registeredBy ? 'claimed' : 'result');
      */
    }, 1500);
  };

  /* ── Register ── */
  const handleRegister = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await registerSerial(serial);
      const masked = maskName(user?.name || '會員');
      const now = todayStr();
      setProduct(prev => ({ ...prev, registeredBy: masked, registeredDate: now }));
      setStep('success');
      return;
    } catch (err) {
      setError(err?.message || '序號登錄失敗，請確認序號是否正確');
      return;
    } finally {
      setIsSubmitting(false);
    }
    /*
    const masked = maskName(user?.name || '使用者');
    const now    = todayStr();
    setProduct(prev => ({ ...prev, registeredBy: masked, registeredDate: now }));
    setStep('success');
    */
  };

  /* ── Reset ── */
  const handleReset = () => {
    setStep('input');
    setSerial('');
    setProduct(null);
    setError('');
  };

  /* ── Build timeline ── */
  const buildTimeline = () => {
    if (!product) return [];
    const regStep = {
      date:   product.registeredDate ?? todayStr(),
      event:  '商品登記',
      detail: `登記人：${product.registeredBy ?? maskName(user?.name)}`,
      type:   'register',
    };
    if (step === 'success' || step === 'claimed') {
      return [...product.timeline, regStep];
    }
    return [...product.timeline, { ...regStep, pending: true }];
  };

  /* ────────────────────────────────────────
     不同 step 的 render 函式
  ──────────────────────────────────────── */
  const renderInput = () => (
    <div className="pr-card">
      <div className="pr-card-header">
        <div className="pr-card-icon"><Hash size={22} /></div>
        <div>
          <h2 className="pr-card-title">輸入產品序號</h2>
          <p className="pr-card-subtitle">序號印於產品包裝背面或底部標籤</p>
        </div>
      </div>

      <div className="pr-input-group">
        <input
          type="text"
          className="apple-input pr-serial-input"
          placeholder="例：PL2026CAT001"
          value={serial}
          onChange={e => { setSerial(formatSerial(e.target.value)); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          maxLength={16}
          autoFocus
        />
        <button
          className="btn-blue pr-search-btn"
          onClick={() => doSearch()}
          disabled={!serial.trim()}
        >
          查詢
        </button>
      </div>

      {error && (
        <div className="pr-error">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="pr-divider"><span>或</span></div>

      <button className="pr-qr-btn" onClick={openCamera}>
        <QrCode size={20} />
        <span>開啟相機掃描 QR Code</span>
      </button>

      {cameraErr && (
        <div className="pr-error" style={{ marginTop: 12 }}>
          <AlertCircle size={15} /> {cameraErr}
        </div>
      )}

      <div className="pr-demo-hint">
        <Eye size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          測試序號：
          <strong>PL2026CAT001</strong>（通路未登記）、
          <strong>PL2026DOG001</strong>（線上未登記）、
          <strong>PL2026JNT001</strong>（已登記）
        </span>
      </div>
    </div>
  );

  const renderVerifying = () => (
    <div className="pr-card pr-verifying">
      <div className="pr-spinner" />
      <p className="pr-verifying-text">正在驗證產品序號...</p>
    </div>
  );

  const renderResult = () => {
    if (!product) return null;
    const tl        = buildTimeline();
    const isClaimed = step === 'claimed';
    const isSuccess = step === 'success';

    return (
      <div className="pr-result-wrap">

        {/* ── 商品資訊 ── */}
        <div className="pr-product-card">
          <img src={product.image} alt={product.name} className="pr-product-img" />
          <div className="pr-product-info">
            <div className="pr-product-badges">
              <span className="pr-badge verified"><CheckCircle2 size={11} /> 正品驗證</span>
              <span className="pr-badge channel">
                {product.channel === 'online' ? '線上購買' : '通路購買'}
              </span>
            </div>
            <h2 className="pr-product-name">{product.name}</h2>
            <p className="pr-product-specs">{product.specs}</p>
            <p className="pr-product-batch">批次號：{product.batchNo}</p>
            <div className="pr-query-count">
              <Eye size={13} />
              此序號已被查詢 <strong>{product.queryCount}</strong> 次
            </div>
          </div>
        </div>

        {/* ── 狀態橫幅 ── */}
        {isClaimed && (
          <div className="pr-status-banner claimed">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              此序號已於 <strong>{product.registeredDate}</strong> 由
              <strong> {product.registeredBy}</strong> 完成登記，無法重複登記。
            </span>
          </div>
        )}
        {isSuccess && (
          <div className="pr-status-banner success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>
              登記成功！登記人：<strong>{product.registeredBy}</strong>，
              時間：<strong>{product.registeredDate}</strong>
            </span>
          </div>
        )}

        {/* ── 產銷履歷時間軸 ── */}
        <div className="pr-timeline-card">
          <h3 className="pr-timeline-title">
            <Package2 size={18} />
            產銷履歷
          </h3>
          <div className="pr-timeline">
            {tl.map((s, i) => {
              const IconComp = ICON_MAP[s.type] || Clock;
              const isLast   = i === tl.length - 1;
              const isActive = !s.pending;
              const isReg    = s.type === 'register';

              return (
                <div key={i} className={`pr-tl-step${isReg ? ' reg-step' : ''}`}>
                  <div className="pr-tl-left">
                    <div className={`pr-tl-dot${isActive ? ' active' : ' pending'}${isReg && isActive ? ' reg' : ''}`}>
                      <IconComp size={13} />
                    </div>
                    {!isLast && (
                      <div className={`pr-tl-line${isActive ? ' active' : ' pending'}`} />
                    )}
                  </div>
                  <div className="pr-tl-body">
                    <span className="pr-tl-date">{s.date}</span>
                    <span className={`pr-tl-event${s.pending ? ' pending-txt' : ''}`}>{s.event}</span>
                    {s.detail && <span className="pr-tl-detail">{s.detail}</span>}
                    {s.pending && <span className="pr-tl-pending-badge">待登記</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 操作按鈕 ── */}
        <div className="pr-actions">
          {step === 'result' && (
            <button className="btn-blue pr-register-btn" onClick={handleRegister} disabled={isSubmitting}>
              <UserCheck size={18} /> 立即登記此產品
            </button>
          )}
          <button className="pr-back-btn" onClick={handleReset}>
            <RefreshCw size={15} /> 查詢其他序號
          </button>
        </div>
      </div>
    );
  };

  /* ────────────────────────────────────────
     未登入 → 顯示 AuthPrompt
  ──────────────────────────────────────── */
  if (!isLoggedIn) return <AuthPrompt />;

  /* ────────────────────────────────────────
     主要渲染
  ──────────────────────────────────────── */
  return (
    <main className="pr-page">

      {/* ── Hero ── */}
      <section className="pr-hero">
        <h1 className="headline-pro" >商品安心登記</h1>
        <p className="subhead-pro" >
          登入您購買的Mr.Polar商品，即可查看商品完整安心履歷
        </p>
        {user && (
          <span className="pr-hero-user">
            <UserCheck size={13} /> 目前登入：{user.name}
          </span>
        )}
      </section>

      {/* ── Content ── */}
      <div className="pr-container">
        {step === 'input'     && renderInput()}
        {step === 'verifying' && renderVerifying()}
        {['result', 'success', 'claimed'].includes(step) && renderResult()}
      </div>

      {/* ── 相機 Modal ── */}
      {cameraOpen && (
        <div className="pr-camera-overlay" onClick={closeCamera}>
          <div className="pr-camera-modal" onClick={e => e.stopPropagation()}>
            <div className="pr-camera-header">
              <span>掃描 QR Code</span>
              <button onClick={closeCamera}><X size={20} /></button>
            </div>
            <div className="pr-camera-body">
              <video ref={videoRef} autoPlay playsInline muted className="pr-camera-video" />
              <div className={`pr-scan-frame${scanStatus === 'found' ? ' found' : ''}`}>
                <div className="pr-scan-corner tl" />
                <div className="pr-scan-corner tr" />
                <div className="pr-scan-corner bl" />
                <div className="pr-scan-corner br" />
                {scanStatus === 'scanning' && <div className="pr-scan-line" />}
                {scanStatus === 'found' && (
                  <div className="pr-scan-success"><CheckCircle2 size={52} /></div>
                )}
              </div>
            </div>
            <p className="pr-camera-hint">
              {scanStatus === 'found'
                ? 'QR Code 偵測成功！'
                : '將 QR Code 對準框內，系統自動掃描'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
