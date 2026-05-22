/* ═══════ ORDERS MANAGER ═══════ */
var editingOrderId = null;

function toggleOrderPricingFields() {
    var type = document.getElementById('ord-type').value;
    var pricingDiv = document.getElementById('ord-sale-pricing');
    var titleDiv = document.getElementById('ord-pricing-title');
    if (pricingDiv) pricingDiv.style.display = 'block';
    if (titleDiv) {
        titleDiv.innerHTML = (type === 'PURCHASE') ? '&#x1F4CA; Purchase Pricing Breakdown' : '&#x1F4CA; Sale Pricing Breakdown';
    }
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
            '<button class="btn btn-sm btn-ghost" onclick="printOrder(\'' + o.id + '\')" style="color:var(--blue)">&#128424;</button>' +
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
    if (document.getElementById('ord-dest')) document.getElementById('ord-dest').value = o.dest || '';

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
        dest: document.getElementById('ord-dest') ? document.getElementById('ord-dest').value : '',
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
     'ord-deal-rate', 'ord-tax-rate', 'ord-dest'].forEach(id => {
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

function printOrder(orderId) {
    const o = state.orders.find(x => x.id === orderId);
    if (!o) return toast('Order not found', true);

    const co = (state && state.company) ? state.company : {};
    const myName = co.name || 'MURJI RAVJI & COMPANY';
    const myAddr = co.address || 'SHOP NO 418 PLOT NO D/88 SECTOR 12 PRIME MALL KHARGHAR, NAVI MUMBAI';
    const myGstin = co.gstin || '27AAAHM6511F1Z2';
    const myState = co.state || 'Maharashtra';
    const myStateCode = co.stateCode || '27';

    var isPurchase = o.type === 'PURCHASE';
    var docTitle = isPurchase ? 'PURCHASE ORDER' : 'SALES ORDER';
    var hsn = '27101950';

    var dateParts = (o.date || '').split('-');
    var formattedDate = o.date;
    if (dateParts.length === 3) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var monthIndex = parseInt(dateParts[1]) - 1;
        formattedDate = dateParts[2] + '-' + (months[monthIndex] || dateParts[1]) + '-' + dateParts[0].substring(2);
    }

    var dueFormatted = o.due || '';
    if (dueFormatted) {
        var dP = dueFormatted.split('-');
        if (dP.length === 3) dueFormatted = dP[2] + '-' + (months[parseInt(dP[1])-1] || dP[1]) + '-' + dP[0].substring(2);
    }

    var partyAddr = 'Vadodara, India';
    var partyGstin = '24AAYFD6112G1ZE';
    var partyState = 'Gujarat';
    var partyStateCode = '24';
    
    var partyList = isPurchase ? (state.suppliers || []) : (state.buyers || []);
    var pObj = partyList.find(p => p.name === o.customer);
    if (pObj) {
        if (pObj.city) partyAddr = pObj.city + ', India';
        if (pObj.phone && pObj.phone.length > 5) partyGstin = pObj.phone;
        var pCityL = (pObj.city || '').toLowerCase();
        if (pCityL.includes('maharashtra') || pCityL.includes('mumbai') || pCityL.includes('vashi') || pCityL.includes('pune')) {
            partyState = 'Maharashtra';
            partyStateCode = '27';
        }
    }

    var sellerName = isPurchase ? o.customer : myName;
    var sellerAddr = isPurchase ? partyAddr : myAddr;
    var sellerGstin = isPurchase ? partyGstin : myGstin;
    var sellerState = isPurchase ? partyState : myState;
    var sellerStateCode = isPurchase ? partyStateCode : myStateCode;

    var buyerName = isPurchase ? myName : o.customer;
    var buyerAddr = isPurchase ? myAddr : partyAddr;
    var buyerGstin = isPurchase ? myGstin : partyGstin;
    var buyerState = isPurchase ? myState : partyState;
    var buyerStateCode = isPurchase ? myStateCode : partyStateCode;

    var destText = o.dest || (isPurchase ? 'ACCL TERMINAL KANDLA' : '—');
    var consigneeName = buyerName;
    var consigneeAddr = destText === '—' ? buyerAddr : destText;
    var consigneeGstin = buyerGstin;
    var consigneeState = buyerState;
    var consigneeStateCode = buyerStateCode;

    var isLocalTax = (sellerStateCode === buyerStateCode);

    var isKG = o.unit === 'KG';
    var den = parseFloat(o.density) || 0.850;
    var qtyKG = isKG ? parseFloat(o.qty_kg || (o.qty * den)) : parseFloat(o.qty * den);
    var dealRate = parseFloat(o.deal_rate) || 0;
    var dealAmt = parseFloat(o.deal_amt) || (qtyKG * dealRate) || 0;
    var taxRate = parseFloat(o.tax_rate) || 0;
    var taxPct = parseFloat(o.tax_pct) || 18;
    
    var taxableAmt = parseFloat(o.taxable_amt) || (qtyKG * taxRate) || 0;
    var taxAmt = (taxableAmt * taxPct) / 100;
    var totalAmt = taxableAmt + taxAmt;

    function fNum(n) {
        if (n === null || n === undefined) return '';
        return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function numToWords(num) {
        if (num === 0) return 'Zero';
        var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        function g(n) {
            if (n < 20) return a[n];
            var digit = n % 10;
            return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : '');
        }
        function h(n) {
            if (n < 100) return g(n);
            return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + g(n % 100) : '');
        }
        var integerPart = Math.floor(num);
        var word = '';
        var temp = integerPart;
        var crores = Math.floor(temp / 10000000); temp %= 10000000;
        var lakhs = Math.floor(temp / 100000); temp %= 100000;
        var thousands = Math.floor(temp / 1000); temp %= 1000;
        var hundreds = Math.floor(temp / 100);
        var remaining = temp % 100;
        if (crores > 0) word += h(crores) + ' Crore ';
        if (lakhs > 0) word += h(lakhs) + ' Lakh ';
        if (thousands > 0) word += h(thousands) + ' Thousand ';
        if (hundreds > 0) word += a[hundreds] + ' Hundred ';
        if (remaining > 0) { if (word !== '') word += 'and '; word += g(remaining) + ' '; }
        return word.trim() + ' Only';
    }

    var totalInvoiceVal = Math.round(totalAmt);
    var invoiceWords = numToWords(totalInvoiceVal);

    var html = `
        <html>
        <head>
            <title>${docTitle}_${o.id}</title>
            <style>
                @media print {
                    @page { size: portrait; margin: 6mm; }
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: Arial, sans-serif; color: #000; font-size: 8px; line-height: 1.25; }
                .invoice-container { border: 1.5px solid #000; width: 100%; max-width: 750px; margin: 0 auto; }
                .header-title { text-align: center; font-weight: bold; font-size: 11px; border-bottom: 1.5px solid #000; padding: 4px 0; letter-spacing: 0.5px; }
                .flex-row { display: flex; border-bottom: 1px solid #000; }
                .col-left { width: 50%; border-right: 1.5px solid #000; padding: 6px; box-sizing: border-box; }
                .col-right { width: 50%; padding: 0; box-sizing: border-box; }
                .company-name { font-weight: bold; font-size: 9.5px; text-transform: uppercase; margin-bottom: 4px; }
                .info-table { width: 100%; border-collapse: collapse; }
                .info-table td { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 6px; vertical-align: top; height: 38px; box-sizing: border-box; }
                .info-table td:last-child { border-right: none; }
                .info-table tr:last-child td { border-bottom: none; }
                table.items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #000; }
                table.items-table th, table.items-table td { border-right: 1px solid #000; padding: 5px; font-size: 8.5px; box-sizing: border-box; }
                table.items-table th { border-bottom: 1.5px solid #000; background: #fff; font-weight: bold; text-align: left; font-size: 8.5px; }
                table.items-table td { height: 180px; vertical-align: top; }
                .totals-row td { font-weight: bold; height: auto !important; vertical-align: middle; border-top: 1.5px solid #000; }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header-title">${docTitle}</div>
                <div class="flex-row">
                    <div class="col-left">
                        <div style="font-size:7.5px; color:#555; text-transform:uppercase; margin-bottom:2px;">Invoice To</div>
                        <div class="company-name">${escH(buyerName)}</div>
                        <div style="font-size: 8.5px;">${escH(buyerAddr)}</div>
                        <div style="margin-top: 6px; font-weight: bold; font-size: 8.5px;">GSTIN/UIN: ${buyerGstin}</div>
                        <div style="font-size: 8.5px;">State Name: ${buyerState}, Code: ${buyerStateCode}</div>
                    </div>
                    <div class="col-right">
                        <table class="info-table">
                            <tr>
                                <td style="width: 50%;">
                                    <div style="font-size: 7px; color: #555;">Voucher No.</div>
                                    <div style="font-weight: bold; font-size: 9px; margin-top: 1px;">${o.id}</div>
                                </td>
                                <td style="width: 50%;">
                                    <div style="font-size: 7px; color: #555;">Dated</div>
                                    <div style="font-weight: bold; font-size: 9px; margin-top: 1px;">${formattedDate}</div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Mode/Terms of Payment</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${escH(o.terms || 'AGAINST LOADING')}</div>
                                </td>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Reference No. & Date.</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${o.id}</div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Dispatched through</div>
                                    <div style="font-weight: bold; margin-top: 1px;"></div>
                                </td>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Destination</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${escH(destText)}</div>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <div style="font-size: 7px; color: #555;">Terms of Delivery</div>
                                    <div style="font-weight: bold; margin-top: 1px;"></div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="flex-row">
                    <div class="col-left">
                        <div style="font-size:7.5px; color:#555; text-transform:uppercase; margin-bottom:2px;">Consignee (Ship to)</div>
                        <div class="company-name">${escH(consigneeName)}</div>
                        <div style="font-size: 8.5px;">${escH(consigneeAddr)}</div>
                        <div style="margin-top: 6px; font-weight: bold; font-size: 8.5px;">GSTIN/UIN: ${consigneeGstin}</div>
                        <div style="font-size: 8.5px;">State Name: ${consigneeState}, Code: ${consigneeStateCode}</div>
                    </div>
                    <div class="col-left" style="border-right: none;">
                        <div style="font-size:7.5px; color:#555; text-transform:uppercase; margin-bottom:2px;">Supplier (Bill from)</div>
                        <div class="company-name">${escH(sellerName)}</div>
                        <div style="font-size: 8.5px;">${escH(sellerAddr)}</div>
                        <div style="margin-top: 6px; font-weight: bold; font-size: 8.5px;">GSTIN/UIN: ${sellerGstin}</div>
                        <div style="font-size: 8.5px;">State Name: ${sellerState}, Code: ${sellerStateCode}</div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%; text-align: center;">Sl<br>No.</th>
                            <th style="width: 40%; text-align: center;">Description of Goods</th>
                            <th style="width: 12%; text-align: center;">HSN/SAC</th>
                            <th style="width: 10%; text-align: center;">Due on</th>
                            <th style="width: 12%; text-align: right;">Quantity</th>
                            <th style="width: 8%; text-align: right;">Rate</th>
                            <th style="width: 5%; text-align: center;">per</th>
                            <th style="width: 12%; text-align: right; border-right: none;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">1</td>
                            <td style="border-right: 1px solid #000; padding-top: 8px;">
                                <div style="font-weight: bold; font-size: 9px; text-transform: uppercase;">${escH(o.product)} - ${hsn}</div>
                                ${isLocalTax ? `
                                    <div style="margin-top: 25px; font-style: italic; font-weight: bold; text-align: right;">Output CGST ${taxPct/2}%</div>
                                    <div style="margin-top: 4px; font-style: italic; font-weight: bold; text-align: right;">Output SGST ${taxPct/2}%</div>
                                ` : `
                                    <div style="margin-top: 25px; font-style: italic; font-weight: bold; text-align: right;">IGST ${taxPct}%</div>
                                `}
                            </td>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">
                                <div>${hsn}</div>
                            </td>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">
                                <div>${dueFormatted}</div>
                            </td>
                            <td style="text-align: right; font-weight: bold; border-right: 1px solid #000; padding-top: 8px;">
                                <div>${fNum(qtyKG)} KG</div>
                            </td>
                            <td style="text-align: right; border-right: 1px solid #000; padding-top: 8px;">
                                <div>${fNum(taxRate)}</div>
                            </td>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">
                                <div>KG</div>
                            </td>
                            <td style="text-align: right; border-right: none; font-weight: bold; padding-top: 8px;">
                                <div>${fNum(taxableAmt)}</div>
                                ${isLocalTax ? `
                                    <div style="margin-top: 25px;">${fNum(taxAmt / 2)}</div>
                                    <div style="margin-top: 4px;">${fNum(taxAmt / 2)}</div>
                                ` : `
                                    <div style="margin-top: 25px;">${fNum(taxAmt)}</div>
                                `}
                            </td>
                        </tr>
                        <tr class="totals-row">
                            <td colspan="4" style="text-align: right; font-weight: bold;">Total</td>
                            <td style="text-align: right; font-weight: bold;">${fNum(qtyKG)} KG</td>
                            <td></td>
                            <td></td>
                            <td style="text-align: right; border-right: none; font-weight: bold;">₹ ${fNum(totalInvoiceVal)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="padding: 6px; border-bottom: 1.5px solid #000; display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-size: 7.5px; color: #555; text-transform: uppercase;">Amount Chargeable (in words)</div>
                        <div style="font-weight: bold; font-size: 9px; margin-top: 2px;">INR ${invoiceWords}</div>
                    </div>
                    <div style="text-align: right; font-style: italic; font-weight: bold;">E. & O.E</div>
                </div>
                <div style="height: 100px; position: relative;">
                    <div style="position: absolute; bottom: 6px; right: 6px; text-align: right;">
                        <div style="font-size: 9px; font-weight: bold; margin-bottom: 40px;">for ${escH(myName)}</div>
                        <div style="font-weight: bold; font-size: 9px;">Authorised Signatory</div>
                    </div>
                </div>
            </div>
            <div style="text-align:center; margin-top:10px; font-size:9px; color:#000;">This is a Computer Generated Document</div>
        </body>
        </html>
    `;

    openPrintWindow(html, 'Order_' + o.id);
}

// Window Bridge
(function (w) {
    const exports = {
        renderOrdersTable, editOrder, addOrder, updateOrderStatus, populateOrderParties, deleteOrder,
        toggleChallanFields, renderChallansTable, addChallan, deleteChallan, populateChallanLinks, handleChallanLinkChange,
        calcOrderBreakdown, toggleOrderPricingFields, printOrder
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
