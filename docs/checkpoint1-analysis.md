# Checkpoint 1: Read-only repository analysis

## Scope and validation

This checkpoint was performed read-only. During the analysis:

- No application files or data were changed.
- No dependencies were installed.
- No server was started.
- The Git working tree remained clean.
- `node_modules`, `package-lock.json`, and `npm-shrinkwrap.json` were not created.
- Nothing was listening on port 3000.

## What the application does

ShopLedger is a legacy Node.js and Express point-of-sale application for a
wholesale and retail shop. It provides:

- A product catalog with physical, reserved, and sellable stock.
- GST calculation based on HSN slabs.
- Coupon validation and discounts.
- Cash, UPI, and Khata credit orders.
- Customer credit balances and settlement recording.
- Order history, filtering, cancellation, and printable invoices.
- Dashboard, inventory, and GST reconciliation reports.

The application stores products, orders, customers, settlements, and audit
entries in the tracked `data/db.json` file.

## Module map

```text
Browser UI
├── public/index.html
├── public/js/app.js
└── public/css/style.css
         │ HTTP
         ▼
server.js
├── routes/products.js
├── routes/orders.js
├── routes/customers.js
└── routes/reports.js
         │
         ▼
Business modules
├── pricing.js ── tax.js + coupons.js
├── inventory.js
├── orders.js
├── ledger.js
├── invoice.js
├── reports.js
├── dates.js
└── store.js ── data/db.json
```

### Entry point and UI

- `server.js` configures Express, serves the static UI, mounts the API routers,
  and provides the printable invoice route.
- `public/index.html` contains the POS, order-history, Khata, and audit views.
- `public/js/app.js` loads data, renders the views, and sends API requests.
- `public/css/style.css` contains the presentation layer.

### Routes

- `routes/products.js` lists products and active coupons.
- `routes/orders.js` lists, creates, retrieves, and cancels orders.
- `routes/customers.js` lists customer accounts and records settlements.
- `routes/reports.js` provides dashboard data, GST reconciliation, cart price
  previews, and the administrative data export.

### Business and persistence modules

- `lib/store.js` synchronously reads and rewrites `data/db.json` and appends
  audit records.
- `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js` calculate checkout totals.
- `lib/inventory.js` calculates sellable stock and changes inventory values.
- `lib/orders.js` creates, lists, retrieves, and cancels orders.
- `lib/ledger.js` manages Khata charges, reversals, and settlements.
- `lib/invoice.js` independently calculates and renders printable invoices.
- `lib/reports.js` builds dashboard and reconciliation results.
- `lib/dates.js` formats and normalizes dates.
- `config.js` contains shop, tax, inventory, coupon, and admin configuration.

## Order-placement flow

1. The browser gathers the selected product IDs and quantities.
2. It requests a live preview from `POST /api/pricing/preview`.
3. On confirmation, it sends the order to `POST /api/orders`.
4. The order route reads `data/db.json` and resolves each product server-side.
5. Inventory availability and coupon validity are checked.
6. Pricing calculates the subtotal, capped discount, per-HSN tax, and total.
7. A Khata order is checked against the customer's credit limit and debited.
8. Ordered quantities are deducted from physical stock.
9. The new order and an audit record are added.
10. The complete database is rewritten to `data/db.json`.
11. The created order is returned and the browser refreshes its views.

## I am sure

### Ticket 1: invoice totals and GST

Checkout and invoice calculations use different rules:

- Checkout pricing applies capped discounts to the subtotal and calculates GST
  on each line's post-discount taxable value using its HSN slab.
- Stored order lines contain an `hsn` but not a `gstRate` property.
- The invoice module checks only `gstRate`, so stored lines fall back to 18% GST.
- Invoice percentage discounts are calculated from subtotal plus tax.
- The invoice calculation does not apply the configured maximum discount cap.

These differences explain the invoice-versus-ledger mismatches.

### Ticket 2: inventory

- The stock check rejects a quantity when `qty >= sellable`; therefore buying
  exactly the last sellable unit is incorrectly rejected.
- Order lines store the product key as `id`, but cancellation release logic looks
  for `productId`.
- The release function decreases `reserved`; it does not restore the physical
  `stock` previously deducted when the order was created.

These conditions explain both reported inventory failures.

### Ticket 3: dates and settlements

- Dates are normalized into display-formatted `DD/MM/YYYY` strings and then
  compared lexicographically for filtering and sorting. That order is not
  chronological across days, months, or years.
- The settlement route passes the browser's string amount directly to the ledger.
- The ledger performs `c.totalSettled + amount`, so `1200 + "500"` becomes the
  string `"1200500"`. Later subtraction coerces it into a large number and
  creates the reported negative balance.

### Confirmed maintenance and security concerns

- There are no tests; the existing `npm test` script exits with an error.
- There is no README or `AGENTS.md`.
- Runtime data is tracked in Git.
- Every request synchronously reads the entire JSON database, and mutations
  rewrite the complete file.
- Order, cancellation, and settlement endpoints have no authentication.
- The administrative export uses a hard-coded key supplied through the URL.
- The dependency declarations are legacy versions and there is no lockfile.
- Several values that reach browser `innerHTML` are not escaped.

## I suspect

These risks follow from the design but were not reproduced during this read-only
checkpoint:

- Concurrent writes could overwrite newer data or leave a partial JSON file.
- Unescaped stored values could enable stored cross-site scripting.
- Invalid order states and excessive settlement amounts could be accepted because
  validation is limited.
- A write failure could leave an operation without a durable result because there
  is no transaction or atomic file replacement.

## Checkpoint result

Checkpoint 1 satisfies its acceptance criteria: the application is explained in
plain language, the module map and order flow are documented, confirmed findings
are separated from suspected risks, and the original read-only constraints were
verified.
