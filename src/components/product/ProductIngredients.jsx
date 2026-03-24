import React from 'react'

const ProductIngredients = ({ product }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">放了什麼，說清楚</div>
      <h2>{product.ingredientsTitle}</h2>
      <p>{product.ingredientsIntro}</p>
    </div>

    <div className="pdp-ingredient-layout">
      <div className="pdp-ingredient-grid">
        {product.ingredients.map((ingredient) => (
          <article key={ingredient.name} className="pdp-ingredient-card">
            <h3>{ingredient.name}</h3>
            <strong>{ingredient.benefit}</strong>
            <p>{ingredient.detail}</p>
          </article>
        ))}
      </div>

      <div className="pdp-ingredient-side">
        <div className="pdp-side-card">
          <h3>我們不放的</h3>
          <ul>
            {product.exclusions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="pdp-side-card">
          <h3>食材從哪裡來</h3>
          <p>{product.sourceNote}</p>
        </div>
      </div>
    </div>
  </section>
)

export default ProductIngredients
