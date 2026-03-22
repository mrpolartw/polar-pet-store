import React from 'react'

const ProductSuitability = ({ items }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">Suitability</div>
      <h2>你家毛孩適合嗎</h2>
      <p>用常見情境來幫助你更快判斷，這是不是符合目前需求的選擇。</p>
    </div>

    <div className="pdp-suitability-grid">
      {items.map((item) => (
        <article key={item.title} className="pdp-suitability-card">
          <h3>{item.title}</h3>
          <div>
            <strong>常見情況</strong>
            <p>{item.issue}</p>
          </div>
          <div>
            <strong>為何適合</strong>
            <p>{item.reason}</p>
          </div>
          <div>
            <strong>可期待改變</strong>
            <p>{item.change}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
)

export default ProductSuitability
