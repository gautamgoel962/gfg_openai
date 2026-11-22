'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');

function order1002() {
  return {
    id: 1002,
    date: '05/01/2022',
    customer: 'Anil Kulkarni',
    paymentMode: 'upi',
    status: 'completed',
    items: [
      {
        id: 1,
        sku: 'GRN-001',
        name: 'Indrayani Basmati Rice 5kg',
        hsn: '1006',
        price: 640,
        qty: 1
      },
      {
        id: 4,
        sku: 'OIL-001',
        name: 'Cold-Pressed Sunflower Oil 1L',
        hsn: '1512',
        price: 190,
        qty: 2
      }
    ],
    coupon: 'SAVE10',
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  };
}

function order1004() {
  return {
    id: 1004,
    date: '30/01/2022',
    customer: 'Kalyani Foods (Wholesale)',
    customerId: 5,
    paymentMode: 'khata',
    status: 'completed',
    items: [
      {
        id: 5,
        sku: 'OIL-002',
        name: 'Cold-Pressed Groundnut Oil 5L',
        hsn: '1508',
        price: 1120,
        qty: 2
      }
    ],
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5
  };
}

function order1008() {
  return {
    id: 1008,
    date: '15/03/2022',
    customer: 'Walk-in',
    customerId: null,
    paymentMode: 'cash',
    status: 'completed',
    items: [
      {
        id: 8,
        sku: 'BEV-001',
        name: 'Assam CTC Masala Chai 250g',
        hsn: '0902',
        price: 140,
        qty: 1
      },
      {
        id: 12,
        sku: 'BEV-003',
        name: 'Kokum Sherbet Concentrate 750ml',
        hsn: '2106',
        price: 180,
        qty: 2
      }
    ],
    coupon: '',
    subtotal: 500,
    discount: 0,
    tax: 90,
    total: 590
  };
}

test('printed invoice uses checkout GST and coupon rules for Order #1002', function () {
  const figures = invoice.computeInvoiceFigures(order1002());

  assert.equal(figures.subtotal, 1020);
  assert.equal(figures.discount, 102);
  assert.equal(figures.tax, 45.9);
  assert.equal(figures.cgst, 22.95);
  assert.equal(figures.sgst, 22.95);
  assert.equal(figures.total, 963.9);
  assert.deepEqual(
    figures.rows.map(function (row) { return row.gstPercent; }),
    [5, 5]
  );
  assert.deepEqual(
    figures.rows.map(function (row) { return row.lineTax; }),
    [28.8, 17.1]
  );
});

test('an HSN-only line uses its configured GST slab', function () {
  const order = {
    items: [
      {
        id: 1,
        sku: 'GRN-001',
        name: 'Indrayani Basmati Rice 5kg',
        hsn: '1006',
        price: 100,
        qty: 1
      }
    ],
    coupon: '',
    total: 105
  };

  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.cgst, 2.5);
  assert.equal(figures.sgst, 2.5);
  assert.equal(figures.total, 105);
});

test('SAVE10 is apportioned before applying each line HSN rate', function () {
  const figures = invoice.computeInvoiceFigures(order1002());

  assert.equal(figures.subtotal, 1020);
  assert.equal(figures.tax, 45.9);
  assert.equal(figures.cgst, 22.95);
  assert.equal(figures.sgst, 22.95);
  assert.equal(figures.discount, 102);
  assert.equal(figures.total, 963.9);
  assert.deepEqual(
    figures.rows.map(function (row) { return row.gstPercent; }),
    [5, 5]
  );
  assert.deepEqual(
    figures.rows.map(function (row) { return row.lineTax; }),
    [28.8, 17.1]
  );
});

test('SAVE10 invoice discount respects its maximum cap', function () {
  const figures = invoice.computeInvoiceFigures(order1004());

  assert.equal(figures.subtotal, 2240);
  assert.equal(figures.tax, 104.5);
  assert.equal(figures.discount, 150);
  assert.equal(figures.total, 2194.5);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 104.5);
});

test('an all-18%-GST order without a coupon matches its stored ledger total', function () {
  const order = order1008();
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, order.subtotal);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.total, order.total);
  assert.equal(figures.cgst, 45);
  assert.equal(figures.sgst, 45);
});

test('rendered invoice matches the ledger without a reconciliation warning', function () {
  const html = invoice.render(order1002());

  assert.doesNotMatch(html, /class="warn-box"/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.doesNotMatch(html, /1083\.24/);
  assert.match(html, /₹45\.90/);
  assert.match(html, /₹963\.90/);
});
