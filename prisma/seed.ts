export {}
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const count = await prisma.question.count()
	if (count === 0) {
		await prisma.question.createMany({
			data: [
				{ text: 'Когда планируете покупку?', options: ['В ближайшее время','В течение месяца','До трех месяцев','В течение полугода','В течение года, не спешу'] },
				{ text: 'Какой бюджет рассматриваете?', options: ['200k - 350k $','350k - 550k $','550k - 700k $','700k - 1.3M $','Более 1.3M $'] },
				{ text: 'Как удобнее получить подборку?', options: ['WhatsApp','Telegram','Звонок консультанта'] },
			],
		})
	}
}

main()
	.finally(async () => {
		await prisma.$disconnect()
	})
