# Antique Auction — Aurelia House

A local, full-stack antique auction marketplace built as a BCA final-year project. It uses React + Vite, Express, SQLite, JWT/bcrypt authentication and Socket.IO for live bidding.

## Run locally

1. Install Node.js 20 or newer.
2. From the project root run `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
3. Copy `server/.env.example` to `server/.env`; set a private `JWT_SECRET`. Copy `client/.env.example` to `client/.env` if you need a non-default API URL.
4. Run `npm run dev` from the root. Open <http://localhost:5173>; the API listens at <http://localhost:4000>.

SQLite creates `server/data/auction.db` and the starter categories, lots, and demo accounts on first API start. To print the seed confirmation again use `npm --prefix server run seed`.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@aurelia.test | demo1234 |
| Approved seller | seller@aurelia.test | demo1234 |
| Collector | buyer@aurelia.test | demo1234 |

Use these local demo accounts only. New visitors can register. A collector can request seller access; administrators can approve requests from the administration dashboard. A seller can then create auction listings. Bid increments and minimums are checked inside a SQLite transaction. Socket.IO publishes updated bid amounts to connected lot pages. Winners confirm their delivery address and exact winning amount from My Wins; the checkout records cash on delivery and displays a 4–5 day delivery estimate. No online payment provider or payment credentials are used.

## Project layout

- `client/` — React screens, routing, responsive styling and API client calls.
- `server/src/index.js` — Express routes, auth middleware, auction workflows and sockets.
- `server/src/db.js` — SQLite schema and repeatable starter seed.
- `server/src/db.test.js` — database seed and uniqueness checks.
- `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md` — schema and route reference.

## Checks

Run `npm test` for the server database checks and `npm run build` for the production client bundle.

## Notes

Auction prices are denominated in INR for demonstration. Seed listing images use Unsplash URLs; listings accept an image URL. For an offline demonstration, replace them with local image assets. The built-in admin can review seller requests. Timed auctions are displayed with their close time and can be closed by an administrator; closing creates an order for the highest bidder and sends a notification.

