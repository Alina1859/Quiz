const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.question.deleteMany({})

  try {
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Question';`
  } catch (error) {
    // ignore missing sqlite_sequence table for non-auto-increment databases
  }

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

  console.log('✅ 4 вопроса квиза успешно добавлены в базу данных')
}

main()
  .catch((error) => {
    console.error('❌ Ошибка при добавлении вопросов.', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

