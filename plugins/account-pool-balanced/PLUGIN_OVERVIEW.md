## Возможности

Пул выбирает аккаунт для запроса и показывает расход квот, дату и время сброса (МСК). Карточка аккаунта также показывает число успешных запросов через пул с момента установки версии 0.4.2; это не остаточная квота провайдера. Доступны последовательная и сбалансированная стратегии, основные и резервные аккаунты, индивидуальные потолки расхода. Поддерживаемые адаптеры: Claude, Codex, Kimi, Z.AI, OpenCode Go, Cursor, Devin Local CLI, а также OpenAI-совместимые провайдеры по API-ключу: NVIDIA NIM, OpenRouter, Groq, Mistral, ModelScope, Cloudflare Workers AI, LLM7, Kilo и OpenCode Zen (реестр: src/compatible-providers.ts). Для Devin пока нет числовой телеметрии квот, поэтому он не публикуется в общей панели Usage; один запуск CLI закреплён за одним PAT, переключение происходит при новом запуске после ограничения аккаунта.

## Локальная настройка

Аккаунты добавляются в установленном BB. Секреты, порядок аккаунтов, пороги и маршрутизация остаются на сервере пользователя и не передаются с marketplace. Новый пользователь начинает с пустого пула. Для отдельного треда можно обойти пул и использовать его собственную авторизацию.

## Требования

BB 0.43.1 или новее, Node/npm для установки из Git и аккаунты провайдеров, которые вы вправе использовать. Подписки и API оплачиваются отдельно; плагин не увеличивает лимиты аккаунтов. Доступность моделей определяется провайдером.

## Команды

Настройки доступны через интерфейс и `bb pool --help`. Ключи поддерживаемых OpenAI-совместимых провайдеров импортируются одной командой `bb pool account add-env` (переменные окружения или `--env-file <path>`: NVIDIA_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, MODELSCOPE_API_KEY, CLOUDFLARE_API_TOKEN, LLM7_API_KEY, KILO_API_KEY, OPENCODE_API_KEY). Базовые адреса переопределяются через `bb pool config set compatibleUpstream <provider> <url>`. У этих провайдеров нет телеметрии квот, поэтому ротация идёт по кодам ошибок провайдера. Инструкция для Devin CLI и других внешних клиентов — [External clients](docs/external-clients.md). Чтобы выбирать пул-провайдеры в меню агентов BB, зарегистрируйте ACP-агентов по [picker setup](docs/picker-setup.md). Проверка состояния — `bb pool status`, обновление — `bb plugin update account-pool-balanced`. Не включайте одновременно встроенный Account Pooler: оба используют команду `bb pool`.


## Защита без изменения BB / Plugin-only network protection

После обновления VPN Guard 0.1.2 и Pooler 0.4.14 включите `bb pool config set vpnGuardEnabled true` (галка «Подчиняться VPN Guard»). Выберите машину сервера пула в Guard. При ручном блоке или недоступном Guard защищённые вызовы самого пула получают локальный 403; уже удерживаемые им запросы/потоки отменяются при следующей проверке. Kimi/Z.ai остаются независимыми. Без связи ручной блок управляет только тредами BB.

Enable the persisted Pooler linkage after upgrading both plugins. Guard covers Cursor/Devin Pool aliases and supplies an uncached network decision for the pool server. Missing/malformed/timed-out Guard fails closed for protected owned traffic. No BB build or system firewall changes; direct/native Send-now and independent maintenance remain outside the strict guarantee. [Реализованные гарантии и ограничения / guarantees and limits](../../docs/vpn-plugin-protection-limits.md).

Devin quota collection is not implemented. Its accounts remain available for routing but are omitted from the shared Usage inventory; stale quota-resource requests fail explicitly without a provider call.

[Единая защита / Unified protection](../../docs/unified-protection.md): VPN evidence /2, optional automation controller, independent pause reasons and explicit recovery. Strict mode and controller integration default off.

Контроллер автоматизаций не требуется для работы Pooler или его связи с VPN Guard и не входит в комплект публичных плагинов. Он нужен только для дополнительного управления расписаниями.

An automation controller is not required for Pooler or its VPN Guard linkage and is not bundled with the public plugins. It is only needed for optional scheduler control.

[Ошибки пула / Pooler errors](../../docs/pool-errors.md): stable reason codes, provider-native responses and distinct quota threshold/exhaustion messages. Коды причин и сообщения отличают настроенный порог от исчерпания лимита провайдера.
