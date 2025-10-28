'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	async function startQuiz() {
		try {
			setLoading(true)
			const res = await fetch('/api/quiz/start', { method: 'POST' })
			if (!res.ok) {
				const errorText = await res.text()
				throw new Error('Failed to start')
			}
			router.push('/quiz')
		} catch (error) {
		} finally {
			setLoading(false)
		}
	}
	return (
		<div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
			<h1>Элитная недвижимость Дубая</h1>
			<button onClick={startQuiz} disabled={loading} style={{ padding: '12px 20px', fontSize: 16 }}>
				{loading ? 'Запуск...' : 'Начать квиз'}
			</button>
		</div>
	)
}
