/* State and Supabase config migrated to js/state.js */

loadState();

/* Helpers migrated to js/helpers.js */

/* PDF and Excel reporting helper functions migrated to js/helpers.js */

/* ═══════ CORE UI LOGIC ═══════ */
function updateClock() {
    document.getElementById('clockEl').textContent = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
updateClock();
setInterval(updateClock, 30000);

var VOL_MAP = {
    inv: { volId: 'inv-vol', kgId: 'inv-kg', denId: 'inv-density' },
    tr: { volId: 'tr-vol', kgId: 'tr-kg', denId: 'tr-density' },
    ord: { volId: 'ord-qty', kgId: 'ord-kg', denId: 'ord-density' },
    ch: { volId: 'ch-vol', kgId: 'ch-kg', denId: 'ch-density' }
};
var PRICE_MAP = {
    inv: { perLId: 'inv-cost', perKGId: 'inv-cost-kg' },
    tr: { perLId: 'tr-price', perKGId: 'tr-price-kg' },
    ord: { perLId: 'ord-price', perKGId: 'ord-price-kg' }
};
var _lk = {};
/* dualCalc, priceCalc, onDensityChangeForPrice, toggleCustomTerm, populateTradeParties, syncCustomsDutyToExpenses, calcTradeTotals, toggleTradeModeField, toggleTradeDetailFields, populatePurchaseLinks, loadPurchaseDetails, handleCurrencyChange, calcImportTotal migrated to js/helpers.js & js/trades.js */

/* ═══════ RENDER FUNCTIONS ═══════ */
function kpiC(label, val, sub) {
    return '<div class="kpi"><div class="kpi-label">' + label + '</div><div class="kpi-value">' + val + '</div><div class="kpi-change">' + sub + '</div></div>';
}
function statusBadge(s) {
    var m = { 'Pending': 'badge-gold', 'Dispatched': 'badge-blue', 'Delivered': 'badge-green' };
    return '<span class="badge ' + (m[s] || 'badge-gray') + '">' + s + '</span>';
}

function renderDashboardKpis() {
    var ts = 0, twKg = 0;
    for (var i = 0; i < state.inventory.length; i++) {
        var inv = state.inventory[i];
        ts += inv.vol * inv.cost;
        twKg += inv.vol * (inv.density || 0.850);
    }
    var sl = 0;
    for (var i = 0; i < state.trades.length; i++) {
        var t = state.trades[i];
        var displayQty = t.raw_qty !== undefined ? t.raw_qty : t.vol;
        if (t.type === 'Sell') sl += displayQty * t.price;
    }
    document.getElementById('kpiGrid').innerHTML =
        kpiC('Inventory Value', fmt(ts), 'Total Stock') +
        kpiC('Volume', fmtN(twKg.toFixed(0)) + ' KG', fmtN((twKg / 1000).toFixed(1)) + ' MTON') +
        kpiC('Sales', fmt(sl), 'Revenue');
}
function renderInvLevels() {
    document.getElementById('invLevels').innerHTML = state.inventory.map(function (i) {
        var p = Math.min(100, Math.round(i.vol / (i.threshold * 10) * 100));
        var c = p > 50 ? 'green' : p > 25 ? '' : 'red';
        var wKg = i.vol * (i.density || 0.850);
        var wMton = wKg / 1000;
        return '<div class="progress-wrap"><div class="progress-label"><span>' + i.product + '</span><span class="mono">' + fmtN(wKg.toFixed(0)) + ' KG (' + fmtN(wMton.toFixed(1)) + ' MTON)</span></div><div class="progress"><div class="progress-fill ' + c + '" style="width:' + p + '%"></div></div></div>';
    }).join('');
}
function renderRecentTrades() {
    document.getElementById('recentTradesTbl').innerHTML = state.trades.slice(-5).reverse().map(function (t) {
        var displayQty = t.raw_qty !== undefined ? t.raw_qty : t.vol;
        var unitSuffix = t.unit ? ' ' + t.unit : ' L';
        return '<tr><td>' + t.product + '</td><td><span class="badge ' + (t.type === 'Buy' ? 'badge-blue' : 'badge-green') + '">' + t.type + '</span></td><td class="mono">' + fmtN(displayQty) + unitSuffix + '</td><td class="mono">' + fmtKG(toKG(t.vol, t.density)) + '</td><td class="mono">' + fmt(t.price) + '</td><td class="mono">' + fmt(displayQty * t.price) + '</td></tr>';
    }).join('');
}
function renderActiveOrders() {
    document.getElementById('activeOrdersTbl').innerHTML = state.orders.filter(function (o) { return o.status !== 'Delivered'; }).map(function (o) {
        const isKG = o.unit === 'KG';
        const displayQty = isKG ? (o.qty_kg || o.qty || 0) : (o.qty || 0);
        const displayUnit = isKG ? 'KG' : 'LTRS';
        const displayPrice = isKG ? (o.price_kg || o.price || 0) : (o.price || 0);
        const displayTotal = displayQty * displayPrice;
        return '<tr><td class="mono">' + o.id + '</td><td>' + o.customer + '</td><td>' + o.product + '</td><td class="mono">' + fmtN(displayQty) + ' ' + displayUnit + '</td><td class="mono">' + fmt(displayTotal) + '</td><td>' + statusBadge(o.status) + '</td><td class="mono">' + o.due + '</td></tr>';
    }).join('');
}

/* populateOrderParties migrated to js/orders.js */

/* populateOrderParties migrated to js/orders.js */

function populateSelects() {
    if (!state || !state.products) return;
    populateOrderParties();
    ['inv-product', 'tr-product', 'ord-product', 'ch-product', 'new-iso-product'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var html = '';
        if (id === 'new-iso-product') {
            html += '<option value="">-- Empty / No Stock --</option>';
        }
        html += state.products.map(function (p) {
            var label = p.name + (p.other ? ' (' + p.other + ')' : '');
            return '<option value="' + escH(p.name) + '">' + escH(label) + '</option>';
        }).join('');
        el.innerHTML = html;
    });

    // Populate Sale Deal Dropdown
    var dealSel = document.getElementById('tr-sale-deal');
    if (dealSel) {
        var activeOrders = state.orders.filter(function (o) { return o.status !== 'Delivered'; });
        dealSel.innerHTML = '<option value="">-- Select Order / Deal --</option>' +
            activeOrders.map(function (o) {
                return '<option value="' + o.id + '">' + escH(o.id + ' | ' + o.customer + ' | ' + o.product) + '</option>';
            }).join('');
    }

    populateChallanLinks();
}

/* populateChallanLinks and handleChallanLinkChange migrated to js/orders.js */
function renderProductsList() {
    document.getElementById('productsList').innerHTML = state.products.map(function (p) {
        var info = p.hsn ? ' [HSN: ' + p.hsn + ']' : '';
        return '<div class="product-tag">' +
            '<span><b>' + escH(p.name) + '</b>' + escH(info) + '</span>' +
            '<div style="display:flex;gap:5px;margin-left:10px;">' +
            '<span class="edit-prod" title="Edit" onclick="editProduct(\'' + p.name.replace(/'/g, "\\'") + '\')">&#x270F;</span>' +
            '<span class="remove-prod" title="Delete" onclick="deleteProduct(\'' + p.name.replace(/'/g, "\\'") + '\')">&#x2715;</span>' +
            '</div>' +
            '</div>';
    }).join('');
}

/* Inventory functions migrated to js/inventory.js */


/* renderTradesTable migrated to js/trades.js */


/* openMoveToYardModal migrated to js/trades.js */

/* toggleMtySelectAll and calcMtyRowVariance migrated to js/trades.js */


/* Move to Yard sub-functions migrated to js/trades.js */

/* closeMoveToYardModal and confirmYardTransfer migrated to js/trades.js */

/* Document handling functions migrated to js/trades.js */

/* scanDocument migrated to js/trades.js */


/* scanTradeDocWithAI and runLocalExtract migrated to js/trades.js */


/* refineWithCloudAI, saveApiKey, runDemoScan, and highlightField migrated to js/trades.js */

/* editTrade and addTrade migrated to js/trades.js */


/* Orders and Challans functions migrated to js/orders.js */

/* Supplier and Buyer management functions migrated to js/partners.js */

function renderReports() {
    var sales = 0, buys = 0;
    for (var i = 0; i < state.trades.length; i++) {
        var t = state.trades[i];
        var displayQty = t.raw_qty !== undefined ? t.raw_qty : t.vol;
        if (t.type === 'Sell') sales += displayQty * t.price;
        else buys += displayQty * t.price;
    }
    var profit = sales - buys;
    document.getElementById('reportKpis').innerHTML =
        kpiC('Sales', fmt(sales), '') +
        kpiC('Purchases', fmt(buys), '') +
        kpiC('Profit', fmt(profit), '');
    document.getElementById('plSummary').innerHTML =
        '<div class="form-group"><label>Order Type</label><select id="ord-type" onchange="populateOrderParties()"><option value="SALE">Sale Order</option><option value="PURCHASE">Purchase Order</option></select></div><div class="form-group"><label>Party / Customer</label><select id="ord-customer"></select></div>' +
        '<div class="stat-row"><span>Total Revenue</span><span class="stat-val up">' + fmt(sales) + '</span></div>' +
        '<div class="stat-row"><span>Total Expenses</span><span class="stat-val down">' + fmt(buys) + '</span></div>' +
        '<div class="stat-row"><span>Net Profit</span><span class="stat-val ' + (profit >= 0 ? 'up' : 'down') + '">' + fmt(profit) + '</span></div>';
    var cust = {};
    for (var i = 0; i < state.trades.length; i++) {
        var t = state.trades[i];
        var displayQty = t.raw_qty !== undefined ? t.raw_qty : t.vol;
        if (t.type === 'Sell') cust[t.party] = (cust[t.party] || 0) + (displayQty * t.price);
    }
    var top = Object.keys(cust).map(function (k) { return [k, cust[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    document.getElementById('topCustomers').innerHTML = top.map(function (c) {
        return '<div class="stat-row"><span>' + c[0] + '</span><span class="stat-val">' + fmt(c[1]) + '</span></div>';
    }).join('') || '<div class="empty">No sales data yet</div>';
}

/* Delete and confirmation actions migrated to js/partners.js and js/orders.js */
function deleteProduct(n) {
    customConfirm('Delete product "' + n + '"?').then(function (ok) {
        if (!ok) return;
        state.products = state.products.filter(function (p) { return p.name !== n; });
        saveState(); populateSelects(); renderProductsList(); toast('Product removed');
    });
}
var editingProductName = null;

function editProduct(n) {
    var p = state.products.find(function (x) { return x.name === n; });
    if (!p) return;

    editingProductName = n;
    document.getElementById('pm-name').value = p.name;
    document.getElementById('pm-other').value = p.other || '';
    document.getElementById('pm-hsn').value = p.hsn || '';
    document.getElementById('pm-density').value = p.density;

    var btn = document.querySelector('.page.active button[onclick="addProductMaster()"]');
    if (btn) {
        btn.innerHTML = '&#x1F4BE; Update Product';
        btn.classList.add('btn-blue');
    }
    toast('Editing: ' + n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addProductMaster() {
    var n = document.getElementById('pm-name').value.trim();
    var other = document.getElementById('pm-other').value.trim();
    var hsn = document.getElementById('pm-hsn').value.trim();
    var density = parseFloat(document.getElementById('pm-density').value) || 0.85;

    if (!n) return toast('Enter product name', true);

    if (editingProductName) {
        // Update existing
        var idx = state.products.findIndex(function (p) { return p.name === editingProductName; });
        if (idx >= 0) {
            state.products[idx] = { name: n, other: other, hsn: hsn, density: density };
            toast('Updated: ' + n);
        }
        editingProductName = null;
        var btn = document.querySelector('.page.active button[onclick="addProductMaster()"]');
        if (btn) {
            btn.innerHTML = '&#x2795; Add Product';
            btn.classList.remove('btn-blue');
        }
    } else {
        // Add new
        var exists = state.products.some(function (p) { return p.name.toLowerCase() === n.toLowerCase(); });
        if (exists) return toast('Product already exists', true);

        state.products.push({
            name: n,
            other: other,
            hsn: hsn,
            density: density
        });
        toast('Added: ' + n);
    }

    saveState(); populateSelects(); renderProductsList();

    document.getElementById('pm-name').value = '';
    document.getElementById('pm-other').value = '';
    document.getElementById('pm-hsn').value = '';
    document.getElementById('pm-density').value = '';
}

/* UI Helpers migrated to js/helpers.js */

/* ═══════ INIT ═══════ */
document.getElementById('tr-date').value = today();
document.getElementById('ord-date').value = today();
document.getElementById('ch-date').value = today();
function initApp() {
    if (!state) return;
    populateSelects();
    renderProductsList();
    if (typeof renderTicker === 'function') renderTicker();
    renderDashboardKpis();
    renderInvLevels();
    renderRecentTrades();
    renderActiveOrders();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
    if (typeof renderTradesTable === 'function') renderTradesTable();
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
    if (typeof renderChallansTable === 'function') renderChallansTable();
    if (typeof renderSuppliersTable === 'function') renderSuppliersTable();
    if (typeof renderBuyersTable === 'function') renderBuyersTable();

    // Yard features with error safety
    try {
        if (typeof renderYardDashboard === 'function') renderYardDashboard();
        if (typeof renderTankManager === 'function') renderTankManager();
    } catch (e) {
        console.warn("Yard Render Error:", e);
    }
}

// --- LOGISTICS, EXPENSES & CONTAINER TALLY LOGIC ---
// Migrated to js/trades.js

/* Yard and Tank management logic migrated to js/inventory.js */


// State Management and Cloud/Auth functions migrated to js/state.js

/* generateLandedCostReport migrated to js/trades.js */

// Global listener to clear mismatch warnings
document.addEventListener('input', function (e) {
    if (e.target && e.target.style && (e.target.style.border.includes('239') || e.target.style.border.includes('ef4444'))) {
        e.target.style.border = '';
        e.target.style.boxShadow = '';
        e.target.title = '';
    }
});

/* Inventory editing functions migrated to js/inventory.js */


/* resetTradeForm migrated to js/trades.js */

// Tally Prime Integration Functions (Extracted to tally.js)

(function (w) {
    const exports = {
        // Products Master
        addProductMaster,
        renderProductsList,
        deleteProduct,
        editProduct,
        
        // Rendering
        initApp,
        renderDashboardKpis,
        renderInvLevels,
        renderRecentTrades,
        renderActiveOrders,
        populateSelects,
        renderReports
    };
    
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
    console.log("✨ Secure Global Window Export Bridge initialized successfully!");
})(window);