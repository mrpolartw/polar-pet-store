import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const ProductFAQ = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="pdp-section-card">
      <div className="pdp-section-head">
        <div className="pdp-section-kicker">你可能想問的</div>
        <h2>你可能想問的</h2>
        <p>先把常見問題放在這裡，讓你不用來回找答案。</p>
      </div>

      <div className="pdp-faq-list">
        {faqs.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <article key={item.question} className={`pdp-faq-item ${isOpen ? 'open' : ''}`}>
              <button type="button" className="pdp-faq-trigger" onClick={() => setOpenIndex(isOpen ? -1 : index)}>
                <span>{item.question}</span>
                <ChevronDown size={18} />
              </button>
              {isOpen && <div className="pdp-faq-answer">{item.answer}</div>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ProductFAQ
