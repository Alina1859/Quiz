import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.question.deleteMany({})

  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Question';`

  await prisma.question.createMany({
    data: [
      {
        text: 'Для чего вы рассматриваете недвижимость в Дубае?',
        options: ['Инвестиции', 'Сдача в аренду', 'Для себя', 'Другое'],
      },
      {
        text: 'Какой у вас примерный бюджет?',
        options: [
          'До $200 000',
          '$200 000 – 400 000',
          '$400 000 – 800 000',
          'Более $800 000',
          'Ещё не определился',
        ],
      },
      {
        text: 'Что вы хотите рассмотреть?',
        options: [
          'Квартира / Апартаменты',
          'Вилла / Таунхаус',
          'Пентхаус',
          'Коммерческая недвижимость',
        ],
      },
      {
        text: 'Когда планируете покупку?',
        options: [
          'В ближайшие 1 – 3 месяца',
          'В течение полугода',
          'До конца года',
          'Просто интересуюсь',
        ],
      },
    ],
  })

  console.log('✅ Вопросы пересозданы с ID начиная с 1')
  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } })
  console.log(
    'Текущие вопросы:',
    questions.map((q) => ({ id: q.id, text: q.text }))
  )
}

main().finally(async () => {
  await prisma.$disconnect()
})
