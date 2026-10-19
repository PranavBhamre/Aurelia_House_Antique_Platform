# API documentation

Base URL: `http://localhost:4000/api`. JSON request/response bodies. Authenticated routes accept `Authorization: Bearer <JWT>`. Errors use `{ "error": "..." }`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API health |
| POST | `/auth/register` | Public | Create buyer account (`name,email,password`; password = 8 chars) |
| POST | `/auth/login` | Public | Authenticate; returns `{token,user}` |
| GET | `/auth/me` | Signed in | Current account |
| GET | `/categories` | Public | Auction disciplines |
| GET | `/auctions?q=&category=&status=live` | Public | Search and filter lots (`status=all` includes ended) |
| GET | `/auctions/:id` | Public | Lot with recent bid history |
| POST | `/auctions` | Seller/admin | Create lot (`title,description,image,category_id,starting_price,ends_at`; optional increment, condition, provenance) |
| POST | `/auctions/:id/bids` | Signed in | Place bid (`amount`); checks live state, ownership and increment transactionally |
| POST | `/seller/request` | Signed in buyer | Request seller role |
| GET | `/seller/auctions` | Seller/admin | Current seller's lots |
| GET | `/notifications` | Signed in | Current user's latest notifications |
| PATCH | `/notifications/read` | Signed in | Mark notifications read |
| GET | `/orders` | Signed in | Current user's wins; admin sees all |
| POST | `/orders/:id/confirm-cod` | Winning buyer | Confirms the exact winning amount, delivery address and cash-on-delivery method; returns `confirmed_cod` and a `4–5 days` delivery estimate |
| GET | `/admin/overview` | Admin | Counts, pending seller applications, recent bids |
| GET | `/admin/reports` | Admin | Lot totals by category and monthly bid totals |
| POST | `/admin/sellers/:id/approve` | Admin | Approve seller request |
| POST | `/admin/sellers/:id/reject` | Admin | Reject seller request |
| POST | `/admin/auctions/:id/close` | Admin | Close lot and create winning order |

Socket.IO client events: emit `auction:join` with a lot ID. Server emits `bid:update` to that lot room with the refreshed lot; `auction:update` broadcasts summary changes; `auction:closed` notifies viewers of closure.

