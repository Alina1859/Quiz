export {}

# Quiz App (Next.js + Prisma + SQLite)

## Setup

1. Create `.env` in project root:

```
DATABASE_URL="file:./dev.db"
```

2. Install deps:

```
npm install
```

3. Generate client, push schema, seed:

```
npm run prisma:generate
npm run prisma:push
npx ts-node prisma/seed.ts
```

4. Run dev server:

```
npm run dev
```

## API
- POST `/api/quiz/start`: creates 10-min session cookie
- GET `/api/quiz/questions`: requires active session
- POST `/api/quiz/submit`: body `{ answers: Record<string,string>, phone: string(10) }`, ends session

## Notes
- Sessions are stored in SQLite with `expiresAt` and `isActive`
- Cookies are httpOnly, sameSite=lax, secure
- Phone validation: 10 digits
