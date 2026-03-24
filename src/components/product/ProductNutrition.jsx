import React from 'react'

const ProductNutrition = ({ product }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">吃進去的是什麼</div>
      <h2>{product.nutritionSectionTitle}</h2>
      <p>{product.nutritionSectionIntro}</p>
    </div>

    <div className="pdp-highlight-grid">
      {product.nutritionHighlights.map((item) => (
        <article key={item.title} className="pdp-highlight-card">
          <strong>{item.value}</strong>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </div>

    <div className="pdp-facts-table">
      {product.nutritionFacts.map((fact) => (
        <div key={fact.label} className="pdp-fact-row">
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
        </div>
      ))}
    </div>
  </section>
)

export default ProductNutrition
