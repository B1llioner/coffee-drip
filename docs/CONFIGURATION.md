# Конфигурация реквизитов

Реквизиты продавца не хранятся в исходном коде и не редактируются в статических HTML-макетах. Источник истины — переменные окружения из `.env` (локально) или секреты окружения на сервере.

Поля сгруппированы так:

- `COMPANY_DISPLAY_NAME` — короткое название бренда;
- `COMPANY_LEGAL_NAME`, `COMPANY_INN`, `COMPANY_KPP`, `COMPANY_OGRN`, `COMPANY_LEGAL_ADDRESS` — сведения продавца;
- `COMPANY_POSTAL_ADDRESS`, `COMPANY_WAREHOUSE_ADDRESS` — адрес для корреспонденции и самовывоза/возврата;
- `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_TELEGRAM_URL`, `COMPANY_WHATSAPP_URL` — контакты;
- `COMPANY_BANK_*`, `COMPANY_TAX_SYSTEM`, `COMPANY_VAT_LABEL` — серверные данные для счетов, кассы и документов;
- `PRIVACY_CONTACT_EMAIL` — адрес обращений по персональным данным, с fallback на `COMPANY_EMAIL`.

Публичный endpoint `GET /api/v1/storefront/company` намеренно не возвращает банковские счета. Серверные сервисы счетов и чеков получают полный набор через `CompanyService.getInvoiceDetails()`.

В production API не запускается без наименования, ИНН, ОГРН, юридического адреса, email и телефона. Также проверяется длина ИНН, КПП, ОГРН, БИК и банковских счетов. Контрольные цифры и актуальность данных перед релизом дополнительно сверяются с выпиской ЕГРЮЛ/ЕГРИП и банком.

Файл `.env` исключён из Git. Для деплоя значения нужно задавать в секретах платформы, не коммитить их в репозиторий и ограничить доступ сотрудников.

## Блокировка преждевременного production-запуска

API требует явные подтверждения `LEGAL_DOCUMENTS_APPROVED`, `RKN_NOTIFICATION_CONFIRMED`, `DATA_LOCALIZATION_CONFIRMED` и `MARKING_READINESS_CONFIRMED`. Они означают выполненное действие и наличие внутреннего доказательства, а не просто техническую настройку. Для маркировки также обязателен отдельный 32-байтовый `MARKING_ENCRYPTION_KEY`.

Ручная оплата в production по умолчанию запрещена. Предпочтительный режим — `PAYMENT_PROVIDER=yookassa` с ключами, кодом НДС, тестовым webhook и проверенным чеком. Исключение возможно только осознанным `ALLOW_MANUAL_PAYMENT_IN_PRODUCTION=true`.
