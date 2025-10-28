'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Question, QuizState, QuestionsResponse } from '../../types/quiz'

export default function QuizPage() {
	const router = useRouter()
	const [quizState, setQuizState] = useState<QuizState>({ questions: [], selectedAnswers: {}, error: null })
	const [submitting, setSubmitting] = useState(false)
	const [phoneNumber, setPhoneNumber] = useState('')

	useEffect(() => {
		fetch('/api/quiz/questions')
			.then(async (r) => {
				if (!r.ok) {
					const errorText = await r.text()
					throw new Error(String(r.status))
				}
				const data = (await r.json()) as QuestionsResponse
				setQuizState((prev) => ({ ...prev, questions: data.questions }))
			})
			.catch((e) => {
				if (String(e.message) === '401' || String(e.message) === '403') {
					router.replace('/?error=session')
					return
				}
				setQuizState((prev) => ({ ...prev, error: 'Ошибка загрузки вопросов' }))
			})
	}, [router])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setQuizState((prev) => ({ ...prev, error: null }))
		
		if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
			setQuizState((prev) => ({ ...prev, error: 'Введите 10-значный номер телефона' }))
			return
		}
		
		if (Object.keys(quizState.selectedAnswers).length === 0) {
			setQuizState((prev) => ({ ...prev, error: 'Выберите хотя бы один ответ' }))
			return
		}
		
		setSubmitting(true)
		try {
			const res = await fetch('/api/quiz/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answers: quizState.selectedAnswers, phone: phoneNumber }),
			})
			if (!res.ok) {
				if (res.status === 403) throw new Error('session')
				throw new Error('submit')
			}
			router.replace('/finish')
		} catch (e: any) {
			if (e?.message === 'session') setQuizState((prev) => ({ ...prev, error: 'Сессия истекла' }))
			else if (e?.message === 'submit') setQuizState((prev) => ({ ...prev, error: 'Ошибка отправки данных' }))
			else setQuizState((prev) => ({ ...prev, error: 'Неизвестная ошибка' }))
		} finally {
			setSubmitting(false)
		}
	}

	if (!quizState.questions.length) return <div style={{ padding: 24 }}>Загрузка...</div>

	return (
		<form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
			<h2>Квиз по подбору недвижимости</h2>
			{quizState.questions.map((q) => (
				<div key={q.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
					<div style={{ marginBottom: 8 }}>{q.text}</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
						{q.options.map((opt: string) => (
							<button
								type="button"
								key={opt}
								onClick={() => setQuizState((prev) => ({ ...prev, selectedAnswers: { ...prev.selectedAnswers, [q.id]: opt } }))}
								style={{
									padding: '8px 12px',
									borderRadius: 6,
									border: quizState.selectedAnswers[q.id] === opt ? '2px solid #000' : '1px solid #ccc',
									background: quizState.selectedAnswers[q.id] === opt ? '#fafafa' : 'white',
								}}
							>
								{opt}
							</button>
						))}
					</div>
				</div>
			))}
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<label htmlFor="phone">Номер телефона (10 цифр):</label>
				<input 
					id="phone" 
					value={phoneNumber}
					onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
					placeholder="XXXXXXXXXX" 
				/>
			</div>
			{quizState.error && <div style={{ color: 'red' }}>{quizState.error}</div>}
			<button type="submit" disabled={submitting} style={{ padding: '12px 20px' }}>
				{submitting ? 'Отправка...' : 'Отправить результаты'}
			</button>
		</form>
	)
}
