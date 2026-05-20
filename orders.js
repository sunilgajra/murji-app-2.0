/* ═══════ ORDERS MANAGER ═══════ */
var editingOrderId = null;

function toggleOrderPricingFields() {
    var type = document.getElementById('ord-type').value;
    var pricingDiv = document.getElementById('ord-sale-pricing');
    if (pricingDiv) pricingDiv.style.display = (type === 'SALE') ? 'block' : 'none';
}

function calcOrderBreakdown() {
    var qtyKG = parseFloat(document.getElementById('ord-kg').value) || 0;
    var dealRate = parseFloat(document.getElementById('ord-deal-rate') ? document.getElementById('ord-deal-rate').value : 0) || 0;
    var taxRate = parseFloat(document.getElementById('ord-tax-rate') ? document.getElementById('ord-tax-rate').value : 0) || 0;
    var taxPct = parseFloat(document.getElementById('ord-tax-pct') ? document.getElementById('ord-tax-pct').value : 18) || 0;

    var taxableAmt = qtyKG * taxRate;
    var taxAmt = taxableAmt * taxPct / 100;
    var tAmt = taxableAmt + taxAmt;
    var dealAmt = qtyKG * dealRate;
    var yChgs = dealAmt - tAmt;

    var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = '\u20B9 ' + fmt(v); };
    set('ord-calc-taxable', taxableAmt);
    set('ord-calc-tax', taxAmt);
    set('ord-calc-tamt', tAmt);
    set('ord-calc-deal', dealAmt);
    set('ord-calc-ychgs', yChgs);
}

function renderOrdersTable() {
    document.getElementById('ordersTable').innerHTML = (state.orders || []).slice().reverse().map(function (o) {
        const isKG = o.unit === 'KG';
        const den = o.density || 0.850;
        const otherQty = isKG ? (o.qty_kg / den) : (o.qty_kg || (o.qty * den));
        const otherUnit = isKG ? 'LTRS' : 'KG';
        const mainUnit = isKG ? 'KG' : 'LTRS';

        const displayQty = isKG ? (o.qty_kg || (o.qty * den)) : o.qty;
        const displayRate = isKG ? (o.price_kg || (o.price / den)) : o.price;
        const secondaryRate = isKG ? o.price : (o.price_kg || (o.price / den));

        const mainRateVal = parseFloat(displayRate) || 0;
        const otherRateVal = parseFloat(secondaryRate) || 0;

        const dealRateCell = o.deal_rate ? ('\u20B9 ' + parseFloat(o.deal_rate).toFixed(2) + '/KG') : '-';
        const yChgsCell = (o.y_charges !== undefined && o.y_charges !== null) ? fmt(o.y_charges) : '-';

        return '<tr>' +
            '<td class="mono">' + o.id + '</td>' +
            '<td><span class="badge ' + (o.type === 'PURCHASE' ? 'badge-blue' : 'badge-green') + '">' + (o.type || 'SALE') + '</span></td>' +
            '<td><b>' + escH(o.customer) + '</b></td>' +
            '<td>' + escH(o.product) + '</td>' +
            '<td class="mono"><div>' + fmtN(displayQty.toFixed(1)) + ' ' + mainUnit + '</div><small style="color:var(--muted)">' + fmtN(otherQty.toFixed(1)) + ' ' + otherUnit + '</small></td>' +
            '<td class="mono"><div>\u20B9 ' + mainRateVal.toFixed(2) + ' <small style="color:var(--muted)">/ ' + mainUnit + '</small></div><small style="color:var(--muted)">\u20B9 ' + otherRateVal.toFixed(2) + ' / ' + otherUnit + '</small></td>' +
            '<td class="mono"><b>' + fmt(displayQty * displayRate) + '</b></td>' +
            '<td class="mono" style="color:var(--green); font-weight:600;">' + dealRateCell + '</td>' +
            '<td class="mono" style="color:var(--gold2); font-weight:600;">' + yChgsCell + '</td>' +
            '<td>' + statusBadge(o.status) + '</td>' +
            '<td class="mono">' + o.due + '</td>' +
            '<td style="display:flex;gap:4px">' +
            '<select onchange="updateOrderStatus(\'' + o.id + '\',this.value)" style="font-size:10px;background:var(--bg);color:var(--text);border:1px solid var(--border)">' +
            '<option ' + (o.status === 'Pending' ? 'selected' : '') + '>Pending</option>' +
            '<option ' + (o.status === 'Dispatched' ? 'selected' : '') + '>Dispatched</option>' +
            '<option ' + (o.status === 'Delivered' ? 'selected' : '') + '>Delivered</option>' +
            '</select>' +
            '<button class="btn btn-sm btn-ghost" onclick="editOrder(\'' + o.id + '\')" style="color:var(--teal)">&#x270F;</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteOrder(\'' + o.id + '\')">&times;</button>' +
            '</td></tr>';
    }).join('');
}

function statusBadge(s) {
    if (s === 'Pending') return '<span class="badge badge-gold">Pending</span>';
    if (s === 'Dispatched') return '<span class="badge badge-blue">Dispatched</span>';
    return '<span class="badge badge-teal">Delivered</span>';
}

function editOrder(id) {
    const o = state.orders.find(x => x.id === id);
    if (!o) return;
    editingOrderId = id;

    document.getElementById('ord-type').value = o.type || 'SALE';
    toggleOrderPricingFields();
    populateOrderParties();
    document.getElementById('ord-customer').value = o.customer;
    document.getElementById('ord-product').value = o.product;
    document.getElementById('ord-density').value = o.density || 0.850;
    document.getElementById('ord-unit').value = o.unit || 'LITRE';

    document.getElementById('ord-qty').value = o.qty;
    document.getElementById('ord-price').value = o.price;
    document.getElementById('ord-date').value = o.date || today();
    document.getElementById('ord-due').value = o.due || '';
    document.getElementById('ord-priority').value = o.priority || 'Normal';

    if (document.getElementById('ord-deal-rate')) document.getElementById('ord-deal-rate').value = o.deal_rate || '';
    if (document.getElementById('ord-tax-rate')) document.getElementById('ord-tax-rate').value = o.tax_rate || '';
    if (document.getElementById('ord-tax-pct')) document.getElementById('ord-tax-pct').value = o.tax_pct || 18;

    dualCalc('ord', 'vol');
    priceCalc('ord', 'perL');
    calcOrderBreakdown();

    const btn = document.querySelector('button[onclick="addOrder()"]');
    if (btn) {
        btn.innerHTML = '&#x1F4BE; Update Order';
        btn.classList.add('btn-blue');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addOrder() {
    var type = document.getElementById('ord-type').value;
    var customer = document.getElementById('ord-customer').value;
    var product = document.getElementById('ord-product').value;
    var unit = document.getElementById('ord-unit').value;
    var density = parseFloat(document.getElementById('ord-density').value) || 0.850;

    var qtyL = parseFloat(document.getElementById('ord-qty').value) || 0;
    var qtyKG = parseFloat(document.getElementById('ord-kg').value) || 0;
    var priceL = parseFloat(document.getElementById('ord-price').value) || 0;
    var priceKG = parseFloat(document.getElementById('ord-price-kg').value) || 0;

    if (!customer || (unit === 'LITRE' ? !qtyL || !priceL : !qtyKG || !priceKG)) {
        return toast('Please fill all required fields', true);
    }

    var orderData = {
        id: editingOrderId || ('ORD-' + String(state.nextOrderNum++).padStart(3, '0')),
        type: type,
        customer: customer,
        product: product,
        unit: unit,
        density: density,
        qty: qtyL,
        qty_kg: qtyKG,
        price: priceL,
        price_kg: priceKG,
        date: document.getElementById('ord-date').value || today(),
        due: document.getElementById('ord-due').value,
        priority: document.getElementById('ord-priority').value,
        status: 'Pending',
        terms: 'Immediate',
        deal_rate: parseFloat(document.getElementById('ord-deal-rate') ? document.getElementById('ord-deal-rate').value : 0) || 0,
        tax_rate: parseFloat(document.getElementById('ord-tax-rate') ? document.getElementById('ord-tax-rate').value : 0) || 0,
        tax_pct: parseFloat(document.getElementById('ord-tax-pct') ? document.getElementById('ord-tax-pct').value : 18) || 18,
        taxable_amt: qtyKG * (parseFloat(document.getElementById('ord-tax-rate') ? document.getElementById('ord-tax-rate').value : 0) || 0),
        deal_amt: qtyKG * (parseFloat(document.getElementById('ord-deal-rate') ? document.getElementById('ord-deal-rate').value : 0) || 0),
        y_charges: (qtyKG * (parseFloat(document.getElementById('ord-deal-rate') ? document.getElementById('ord-deal-rate').value : 0) || 0)) -
                   (qtyKG * (parseFloat(document.getElementById('ord-tax-rate') ? document.getElementById('ord-tax-rate').value : 0) || 0) *
                   (1 + (parseFloat(document.getElementById('ord-tax-pct') ? document.getElementById('ord-tax-pct').value : 18) || 18) / 100))
    };

    if (editingOrderId) {
        const idx = state.orders.findIndex(o => o.id === editingOrderId);
        if (idx >= 0) {
            orderData.id = editingOrderId;
            orderData.status = state.orders[idx].status;
            state.orders[idx] = orderData;
            toast('Order updated');
        }
        editingOrderId = null;
        const btn = document.querySelector('button[onclick="addOrder()"]');
        if (btn) {
            btn.innerHTML = '&#x1F4CB; Create Order';
            btn.classList.remove('btn-blue');
        }
    } else {
        orderData.id = 'ORD-' + String(state.nextOrderNum++).padStart(3, '0');
        state.orders.push(orderData);
        toast('Created ' + orderData.id);
    }

    saveState(); renderOrdersTable(); renderActiveOrders(); populateSelects();

    // Clear form
    ['ord-customer', 'ord-qty', 'ord-kg', 'ord-price', 'ord-price-kg', 'ord-due',
     'ord-deal-rate', 'ord-tax-rate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (document.getElementById('ord-tax-pct')) document.getElementById('ord-tax-pct').value = '18';
    calcOrderBreakdown();
}

function updateOrderStatus(id, s) {
    for (var i = 0; i < state.orders.length; i++) {
        if (state.orders[i].id === id) { state.orders[i].status = s; break; }
    }
    saveState(); renderOrdersTable(); renderActiveOrders(); populateSelects(); toast('Status updated');
}

function populateOrderParties() {
    const type = document.getElementById('ord-type').value;
    const sel = document.getElementById('ord-customer');
    if (!sel) return;

    if (type === 'PURCHASE') {
        sel.innerHTML = '<option value="">-- Select Supplier --</option>' +
            (state.suppliers || []).map(s => `<option value="${escH(s.name)}">${escH(s.name)}</option>`).join('');
    } else {
        sel.innerHTML = '<option value="">-- Select Buyer --</option>' +
            (state.buyers || []).map(b => `<option value="${escH(b.name)}">${escH(b.name)}</option>`).join('');
    }
}

function deleteOrder(id) {
    customConfirm('Delete order ' + id + '?').then(function (ok) {
        if (!ok) return;
        state.orders = state.orders.filter(function (o) { return o.id !== id; });
        saveState(); renderOrdersTable(); renderActiveOrders(); populateSelects(); toast('Order removed');
    });
}

/* ═══════ DELIVERY CHALLANS ═══════ */
function toggleChallanFields() {
    var t = document.getElementById('ch-type').value;
    document.getElementById('ch-from-group').querySelector('label').textContent = t === 'in' ? 'Received From' : 'Dispatched From';
    document.getElementById('ch-to-group').querySelector('label').textContent = t === 'in' ? 'Stored At' : 'Delivered To';
    populateChallanLinks();
}

function renderChallansTable() {
    document.getElementById('challansTable').innerHTML = state.challans.slice().reverse().map(function (c) {
        return '<tr><td class="mono"><b>' + c.id + '</b></td><td>' + (c.type === 'in' ? '<span class="badge badge-teal">In</span>' : '<span class="badge badge-green">Out</span>') + '</td><td class="mono">' + c.date + '</td><td>' + c.product + '</td><td class="mono">' + fmtN(c.vol) + '</td><td>' + (c.from || '-') + '</td><td>' + (c.to || '-') + '</td><td class="mono">' + c.vehicle + '</td><td style="display:flex;gap:4px"><button class="btn btn-primary btn-sm" onclick="downloadChallanPDF(\'' + c.id + '\')">PDF</button><button class="btn btn-green btn-sm" onclick="shareWhatsApp(\'' + c.id + '\')">WA</button><button class="btn btn-danger btn-sm" onclick="deleteChallan(\'' + c.id + '\')">&#x2715;</button></td></tr>';
    }).join('');
}

function addChallan() {
    var type = document.getElementById('ch-type').value;
    var no = document.getElementById('ch-no').value.trim();
    if (!no) no = 'CH-' + String(state.nextChNum).padStart(3, '0');
    var product = document.getElementById('ch-product').value;
    var density = parseFloat(document.getElementById('ch-density').value) || getDensity(product);
    var vol = parseFloat(document.getElementById('ch-vol').value);
    if (!vol) return toast('Enter quantity', true);
    state.challans.push({
        id: no, type: type,
        date: document.getElementById('ch-date').value || today(),
        product: product, vol: vol, density: density,
        weight: toKG(vol, density),
        from: document.getElementById('ch-from').value,
        to: document.getElementById('ch-to').value,
        vehicle: document.getElementById('ch-vehicle').value,
        driver: document.getElementById('ch-driver').value,
        driverPh: document.getElementById('ch-driver-ph').value,
        link: document.getElementById('ch-link').value || ''
    });
    if (!document.getElementById('ch-no').value.trim()) state.nextChNum++;
    
    // Clear form fields
    ['ch-no', 'ch-vol', 'ch-kg', 'ch-from', 'ch-to', 'ch-vehicle', 'ch-driver', 'ch-driver-ph', 'ch-link'].forEach(id => {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    saveState(); 
    renderChallansTable(); 
    populateChallanLinks();
    toast('Created ' + no);
}

function deleteChallan(id) {
    customConfirm('Delete delivery challan ' + id + '?').then(function (ok) {
        if (!ok) return;
        state.challans = state.challans.filter(function (c) { return c.id !== id; });
        saveState(); renderChallansTable(); toast('Challan removed');
    });
}

function populateChallanLinks() {
    var type = document.getElementById('ch-type') ? document.getElementById('ch-type').value : 'out';
    var sel = document.getElementById('ch-link');
    if (!sel) return;

    var html = '<option value="">-- Select Order or Trade to Link --</option>';

    if (type === 'out') {
        // Outward Dispatch -> Link to Sale Orders or Sell Trades
        var saleOrders = (state.orders || []).filter(o => o.type === 'SALE' && o.status !== 'Delivered');
        if (saleOrders.length > 0) {
            html += '<optgroup label="Sale Orders">';
            saleOrders.forEach(o => {
                html += `<option value="order:${o.id}">Order: ${escH(o.id)} | ${escH(o.customer)} | ${escH(o.product)}</option>`;
            });
            html += '</optgroup>';
        }

        var sellTrades = (state.trades || []).filter(t => t.type === 'Sell');
        if (sellTrades.length > 0) {
            html += '<optgroup label="Sell Deals (Trades)">';
            sellTrades.forEach(t => {
                var party = t.party || 'No Customer';
                var prod = t.product || 'No Product';
                html += `<option value="trade:${t.id}">Trade: TR-${t.id} | ${escH(party)} | ${escH(prod)}</option>`;
            });
            html += '</optgroup>';
        }
    } else {
        // Inward Receive -> Link to Purchase Orders or Buy Trades
        var purchaseOrders = (state.orders || []).filter(o => o.type === 'PURCHASE' && o.status !== 'Delivered');
        if (purchaseOrders.length > 0) {
            html += '<optgroup label="Purchase Orders">';
            purchaseOrders.forEach(o => {
                html += `<option value="order:${o.id}">Order: ${escH(o.id)} | ${escH(o.customer)} | ${escH(o.product)}</option>`;
            });
            html += '</optgroup>';
        }

        var buyTrades = (state.trades || []).filter(t => t.type === 'Buy');
        if (buyTrades.length > 0) {
            html += '<optgroup label="Buy Deals (Trades)">';
            buyTrades.forEach(t => {
                var party = t.party || 'No Supplier';
                var prod = t.product || 'No Product';
                html += `<option value="trade:${t.id}">Trade: TR-${t.id} | ${escH(party)} | ${escH(prod)}</option>`;
            });
            html += '</optgroup>';
        }
    }

    sel.innerHTML = html;
}

function handleChallanLinkChange() {
    var linkVal = document.getElementById('ch-link').value;
    if (!linkVal) return;

    var parts = linkVal.split(':');
    var prefix = parts[0];
    var id = parts[1];
    var chType = document.getElementById('ch-type').value;

    var product = '';
    var vol = 0;
    var weight = 0;
    var party = '';
    var density = 0.850;

    if (prefix === 'order') {
        var o = (state.orders || []).find(x => x.id === id);
        if (o) {
            product = o.product || '';
            density = parseFloat(o.density) || 0.850;
            if (o.unit === 'KG') {
                weight = parseFloat(o.qty_kg) || (parseFloat(o.qty) * density) || 0;
                vol = weight / density;
            } else {
                vol = parseFloat(o.qty) || 0;
                weight = vol * density;
            }
            party = o.customer || '';
        }
    } else if (prefix === 'trade') {
        var t = (state.trades || []).find(x => x.id == id);
        if (t) {
            product = t.product || '';
            density = parseFloat(t.density) || 0.850;
            vol = parseFloat(t.vol) || 0;
            weight = parseFloat(t.net_weight) || (vol * density) || 0;
            party = t.party || '';
        }
    }

    // Autofill fields
    if (product) document.getElementById('ch-product').value = product;
    document.getElementById('ch-density').value = density;
    document.getElementById('ch-vol').value = vol > 0 ? vol.toFixed(0) : '';
    document.getElementById('ch-kg').value = weight > 0 ? weight.toFixed(0) : '';

    if (chType === 'out') {
        document.getElementById('ch-to').value = party;
    } else {
        document.getElementById('ch-from').value = party;
    }
}

// Window Bridge
(function (w) {
    const exports = {
        renderOrdersTable, editOrder, addOrder, updateOrderStatus, populateOrderParties, deleteOrder,
        toggleChallanFields, renderChallansTable, addChallan, deleteChallan, populateChallanLinks, handleChallanLinkChange,
        calcOrderBreakdown, toggleOrderPricingFields
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
