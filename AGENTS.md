# ShopLedger agent instructions

## Stack

- Node.js using CommonJS modules.
- Express 4 with `body-parser` for the HTTP application.
- Plain HTML, CSS, and browser JavaScript in `public/`.
- A tracked JSON file, `data/db.json`, used as the application database.
- Built-in `node:test` and `node:assert` for tests.

## Module map

- `server.js`: Express entry point, static UI, API router mounting, and invoice page.
- `routes/`: product, order, customer, pricing-preview, and reporting endpoints.
- `lib/store.js`: synchronous persistence for `data/db.json` and audit entries.
- `lib/pricing.js`, `lib/tax.js`, `lib/coupons.js`: checkout calculations.
- `lib/inventory.js`: sellable-stock checks and inventory mutations.
- `lib/orders.js`: order creation, lookup, cancellation, and filtering.
- `lib/ledger.js`: Khata charges, reversals, and settlements.
- `lib/invoice.js`: printable invoice calculations and HTML rendering.
- `lib/reports.js`: dashboard and GST reconciliation calculations.
- `lib/dates.js`: date formatting and normalization.
- `config.js`: shop, tax, inventory, coupon, and admin configuration.
- `public/`: browser UI.
- `data/db.json`: tracked mutable application data.

## Commands

- Install existing dependencies: `npm install`
- Start the application: `npm start`
- Run tests: `node --test`
- The current `npm test` script is a placeholder that exits with an error; use
  `node --test` instead.

## Change rules

1. Write characterization tests before changing existing behaviour.
2. Change only the module the active ticket is about.
3. Tests must use in-memory fixtures and must never read or write `data/db.json`.
4. Add no dependencies.
5. Keep fixes as small as possible and review the complete diff before proposing
   a pull request.
