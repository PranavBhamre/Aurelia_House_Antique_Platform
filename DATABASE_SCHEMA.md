# Database schema

SQLite is initialized by `server/src/db.js`; `PRAGMA foreign_keys=ON` and WAL journaling are enabled.

| Table | Purpose | Important fields / relations |
|---|---|---|
| `users` | Accounts and access | Unique email, bcrypt hash, `role` (`buyer`, `seller`, `admin`), `seller_status` (`none`, `pending`, `approved`) |
| `categories` | Curated disciplines | Unique name, description |
| `auctions` | Auction lots and lifecycle | Seller/category foreign keys, description, image URL, condition/provenance, starting/current/reserve prices, increment, end time, status, winner |
| `bids` | Immutable bid history | Auction and bidder foreign keys, amount and timestamp |
| `notifications` | User-facing updates | User foreign key, message, read state, timestamp |
| `orders` | Winning-lot delivery and cash-on-delivery confirmation | Unique auction, buyer, winning amount, delivery contact/address, payment method, status (`awaiting_payment`, `confirmed_cod`) and confirmation timestamp |

Bid insertion and current-price update run in a single SQLite transaction. A closing auction picks the highest bid (earliest bid wins a tie), creates one order and notifies the winner. The buyer confirms delivery details and the exact winning amount for cash on delivery; the app does not collect online payment credentials. Password hashes are stored; plaintext passwords are not stored. Existing databases receive the new delivery columns automatically when the API starts.

