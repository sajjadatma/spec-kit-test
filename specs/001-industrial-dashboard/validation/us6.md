# US6 validation evidence

Date: 2026-09-19

- Applied migrations `009_visualization_sessions` through `017_attempt_room_snapshot` to the development Postgres database.
- Contract, integration, concurrency, and visualization service tests passed: 5 files, 7 tests.
- Backend, API, worker, and web TypeScript checks passed; ESLint passed with zero warnings.
- Browser validation passed on the local Google Chrome executable using Playwright's Chromium project: 2 tests passed. The protected visualization route redirects unauthenticated visitors to login.
- The implementation stores room and product-reference snapshots, creates a fenced image job, records consent, rejects expired attempts, saves private generated output, and prevents duplicate submission when a session idempotency key is provided.

The phase implementation and its available automated validation are complete. Broader browser matrices remain part of release validation.

## Provider capability verification

- Date: 2026-09-19
- Candidate model: `gpt-image-1` via `/v1/images/edits`; the official API reference documents image-edit completion output and PNG output fields.
- Input/output decision: submit one room image followed by one product reference per selected surface; accept one final PNG output only. Streaming partial output is not used.
- Retention decision: automated tests use only `FakeImageGenerationAdapter`. Before production enablement, an operator must confirm the project retention setting; OpenAI documents `gpt-image-1` image generation as Zero Data Retention compatible, subject to the account configuration and the documented CSAM review exception.
- Sources: https://platform.openai.com/docs/api-reference/images-streaming/image_generation/partial_image and https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

## Final phase gate

- Applied migrations through `020_attempt_product_snapshots`, including a database-enforced partial unique active-attempt index.
- Verified job heartbeat lease renewal, a maximum of three dispatch calls (one initial call plus two retries), immutable room/product snapshots, and idempotent submission behavior.
- US6 task checklist T073–T089 is complete.
