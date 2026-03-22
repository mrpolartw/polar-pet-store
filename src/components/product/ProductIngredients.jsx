import React from 'react'

const ProductIngredients = ({ product }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">Ingredient Transparency</div>
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
          <h3>不含什麼</h3>
          <ul>
            {product.exclusions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="pdp-side-card">
          <h3>來源與安心說明</h3>
          <p>{product.sourceNote}</p>
        </div>
      </div>
    </div>
  </section>
)

export default ProductIngredients
