export {}
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	// Очищаем существующие вопросы
	await prisma.question.deleteMany({})
	
	// Сбрасываем автоинкремент для SQLite
	try {
		await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Question';`
	} catch (e) {
		// Игнорируем ошибку, если таблица sqlite_sequence не существует
	}
	
	// Создаем 4 вопроса квиза
	await prisma.question.createMany({
		data: [
			{
				text: 'Для чего вы рассматриваете недвижимость в Дубае?',
				options: ['Инвестиции', 'Сдача в аренду', 'Для себя', 'Другое']
			},
			{
				text: 'Какой у вас примерный бюджет?',
				options: ['До $200 000', '$200 000 – 400 000', '$400 000 – 800 000', 'Более $800 000', 'Ещё не определился']
			},
			{
				text: 'Что вы хотите рассмотреть?',
				options: ['Квартира / Апартаменты', 'Вилла / Таунхаус', 'Пентхаус', 'Коммерческая недвижимость']
			},
			{
				text: 'Когда планируете покупку?',
				options: ['В ближайшие 1 – 3 месяца', 'В течение полугода', 'До конца года', 'Просто интересуюсь']
			},
		],
	})
	
	console.log('✅ 4 вопроса квиза успешно добавлены в базу данных')
}

main()
	.finally(async () => {
		await prisma.$disconnect()
	})
