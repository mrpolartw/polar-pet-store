import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ShoppingBag, Package } from 'lucide-react'

export default function OrderSuccess() {
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get('id')

    return (
        <div style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: 480,
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#e2f5ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <CheckCircle2 size={36} color="#2e7d32" />
                </div>

                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--color-text-dark)',
                    marginBottom: 12,
                    letterSpacing: '-0.02em',
                }}>
                    訂單已成立！
                </h1>

                <p style={{
                    fontSize: 15,
                    color: 'var(--color-gray-dark)',
                    lineHeight: 1.6,
                    marginBottom: 8,
                }}>
                    感謝您的購買，我們已收到您的訂單。
                </p>

                {orderId && (
                    <p style={{
                        fontSize: 13,
                        color: 'var(--color-gray-dark)',
                        background: 'var(--color-bg-light)',
                        border: '1px solid var(--color-gray-light)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        display: 'inline-block',
                        marginBottom: 32,
                    }}>
                        訂單編號：<strong style={{ color: 'var(--color-text-dark)' }}>{orderId}</strong>
                    </p>
                )}

                <div style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginTop: 32,
                }}>
                    <Link
                        to="/orders"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            borderRadius: 980,
                            background: 'var(--color-brand-blue)',
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        <Package size={16} />
                        查看訂單
                    </Link>
                    <Link
                        to="/products"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            borderRadius: 980,
                            border: '1.5px solid var(--color-brand-blue)',
                            color: 'var(--color-brand-blue)',
                            textDecoration: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        <ShoppingBag size={16} />
                        繼續購物
                    </Link>
                </div>
            </div>
        </div>
    )
}
