import React from 'react'

const ProductFeedingGuide = ({ guide }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">怎麼餵</div>
      <h2>{guide.title}</h2>
      <p>{guide.intro}</p>
    </div>

    <div className="pdp-guide-layout">
      <div className="pdp-guide-table">
        <div className="pdp-guide-table-head">{guide.rowsTitle}</div>
        {guide.rows.map((row) => (
          <div key={row.weight} className="pdp-guide-row">
            <span>{row.weight}</span>
            <strong>{row.amount}</strong>
          </div>
        ))}
      </div>

      <div className="pdp-guide-side">
        <div className="pdp-side-card">
          <h3>7 日換糧建議</h3>
          <ul>
            {guide.transition.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="pdp-side-card">
          <h3>怎麼保存，記得補充水分</h3>
          <p>{guide.storage}</p>
          <p>{guide.water}</p>
        </div>
      </div>
    </div>
  </section>
)

export default ProductFeedingGuide
