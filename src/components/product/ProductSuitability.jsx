import React from 'react'

const ProductSuitability = ({ items }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">適合哪些毛孩</div>
      <h2>適合哪些毛孩</h2>
      <p>以下是這款最適合、以及需要特別注意的狀況。</p>
    </div>

    <div className="pdp-suitability-grid">
      {items.map((item) => (
        <article key={item.title} className="pdp-suitability-card">
          <h3>{item.title}</h3>
          <div>
            <strong>遇到的狀況</strong>
            <p>{item.issue}</p>
          </div>
          <div>
            <strong>為什麼推薦</strong>
            <p>{item.reason}</p>
          </div>
          <div>
            <strong>你可能注意到</strong>
            <p>{item.change}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
)

export default ProductSuitability
