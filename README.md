# ALGI Coffee

Production-oriented интернет-магазин дрип-кофе: Next.js-витрина, NestJS API, PostgreSQL, админка, лиды с Telegram-outbox, заказы, резерв, доставка, ЮKassa/чеки и compliance-механизмы для РФ.

## Локальный запуск

Требуется Node.js 22 и Docker.

```sh
cp .env.example .env
docker compose up -d postgres redis
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev:api
npm run dev:web
```

Витрина: `http://localhost:3000`, API: `http://localhost:4000`, Swagger: `http://localhost:4000/api/docs`, админка: `http://localhost:3000/admin`.

Первый администратор создаётся из `ADMIN_BOOTSTRAP_*`, только если такого email нет. После первого production-входа удалите bootstrap-пароль из окружения.

## Проверка

```sh
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## Production

Скопируйте `.env.production.example` в закрытый `.env.production`, заполните реальные значения и выполните инструкции [production runbook](docs/RUNBOOK.md). API намеренно блокирует production-запуск без реквизитов, ключей маркировки и подтверждённых compliance-gates.

Legal-страницы остаются помеченными как черновики, пока владелец не заполнит реквизиты и не утвердит их с профильным российским юристом. Технический код не может сам подать уведомление Роскомнадзору, заключить договор с обработчиком или подтвердить декларацию на пищевую продукцию.
