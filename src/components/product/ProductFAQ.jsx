import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const ProductFAQ = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="pdp-section-card">
      <div className="pdp-section-head">
        <div className="pdp-section-kicker">FAQ</div>
        <h2>常見問題</h2>
        <p>把最容易阻礙下單的疑問提前拆解，讓資訊掃讀更輕鬆。</p>
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
