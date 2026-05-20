/* ═══════ SUPPLIERS ═══════ */
function renderSuppliersTable() {
    document.getElementById('suppliersTable').innerHTML = state.suppliers.map(function (s) {
        var typeBadge = s.type === 'import' ? '<span class="badge badge-teal">Import</span>' : '<span class="badge badge-gray">Local</span>';
        var bankInfo = '-';
        if (s.type === 'import') {
            bankInfo = '<div style="font-size:10px;color:var(--muted)">' +
                (s.bankIban ? 'IBAN: ' + escH(s.bankIban) : (s.bankName ? escH(s.bankName) : '-')) +
                (s.bankSwift ? ' <br>SWIFT: ' + escH(s.bankSwift) : '') +
                '</div>';
        } else if (s.bankName) {
            bankInfo = '<div style="font-size:10px;color:var(--muted)">' + escH(s.bankName) + ' - ' + escH(s.bankAc) + '</div>';
        }

        return '<tr><td><b>' + escH(s.name) + '</b></td><td>' + typeBadge + '</td><td>' + escH(s.contact) + '</td><td class="mono">' + escH(s.phone) + '</td><td>' + escH(s.city) + '</td><td>' + bankInfo + '</td><td>' +
            '<div style="display:flex;gap:4px">' +
            '<button class="btn btn-primary btn-sm" onclick="editSupplier(' + s.id + ')">&#x270F;</button>' +
            '<button class="btn btn-gold btn-sm" onclick="openPartyStatementModal(\'suppliers\',' + s.id + ')">&#x1F4C4; Statement</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteItem(\'suppliers\',' + s.id + ')">&#x2715;</button>' +
            '</div></td></tr>';
    }).join('');
}

function toggleSupIntlFields() {
    var type = document.getElementById('sup-type').value;
    var intl = document.querySelectorAll('.sup-intl-fields');
    var local = document.getElementById('sup-ifsc-group');
    if (!local) return;
    if (type === 'import') {
        intl.forEach(function (el) { el.style.display = 'flex'; });
        local.style.display = 'none';
    } else {
        intl.forEach(function (el) { el.style.display = 'none'; });
        local.style.display = 'flex';
    }
}

var editingSupId = null;
function editSupplier(id) {
    var s = state.suppliers.find(function (x) { return x.id === id; });
    if (!s) return;
    editingSupId = id;
    document.getElementById('sup-name').value = s.name;
    document.getElementById('sup-type').value = s.type;
    document.getElementById('sup-contact').value = s.contact;
    document.getElementById('sup-phone').value = s.phone;
    document.getElementById('sup-city').value = s.city;
    document.getElementById('sup-bank-name').value = s.bankName || '';
    document.getElementById('sup-bank-ac').value = s.bankAc || '';
    document.getElementById('sup-bank-ifsc').value = s.bankIfsc || '';
    document.getElementById('sup-bank-iban').value = s.bankIban || '';
    document.getElementById('sup-bank-swift').value = s.bankSwift || '';
    document.getElementById('sup-bank-curr').value = s.bankCurr || 'USD';

    toggleSupIntlFields();

    var btn = document.getElementById('btn-add-supplier');
    if (btn) {
        btn.innerHTML = '&#x1F4BE; Update Supplier';
        btn.classList.add('btn-blue');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearSupForm() {
    editingSupId = null;
    ['sup-name', 'sup-contact', 'sup-phone', 'sup-city', 'sup-bank-name', 'sup-bank-ac', 'sup-bank-ifsc', 'sup-bank-iban', 'sup-bank-swift'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
    });
    toggleSupIntlFields();
    var btn = document.getElementById('btn-add-supplier');
    if (btn) {
        btn.innerHTML = '&#x1F3ED; Add Supplier';
        btn.classList.remove('btn-blue');
    }
}

function addSupplier() {
    var n = document.getElementById('sup-name').value;
    var t = document.getElementById('sup-type').value;
    if (!n) return toast('Enter company name', true);

    var supData = {
        name: n, type: t,
        contact: document.getElementById('sup-contact').value,
        phone: document.getElementById('sup-phone').value,
        city: document.getElementById('sup-city').value,
        bankName: document.getElementById('sup-bank-name').value,
        bankAc: document.getElementById('sup-bank-ac').value,
        bankIfsc: document.getElementById('sup-bank-ifsc').value,
        bankIban: document.getElementById('sup-bank-iban').value,
        bankSwift: document.getElementById('sup-bank-swift').value,
        bankCurr: document.getElementById('sup-bank-curr').value
    };

    if (editingSupId) {
        var idx = state.suppliers.findIndex(function (x) { return x.id === editingSupId; });
        if (idx >= 0) state.suppliers[idx] = Object.assign(state.suppliers[idx], supData);
        toast('Supplier updated');
    } else {
        supData.id = state.nextSupId++;
        state.suppliers.push(supData);
        toast('Supplier added');
    }
    saveState(); renderSuppliersTable(); clearSupForm();
}

/* ═══════ BUYERS ═══════ */
function renderBuyersTable() {
    document.getElementById('buyersTable').innerHTML = state.buyers.map(function (b) {
        var bankInfo = b.bankName ? '<div style="font-size:10px;color:var(--muted)">' + escH(b.bankName) + ' - ' + escH(b.bankAc) + '</div>' : '-';
        return '<tr><td><b>' + escH(b.name) + '</b></td><td>' + escH(b.contact) + '</td><td class="mono">' + escH(b.phone) + '</td><td>' + escH(b.city) + '</td><td>' + bankInfo + '</td><td>' +
            '<div style="display:flex;gap:4px">' +
            '<button class="btn btn-primary btn-sm" onclick="editBuyer(' + b.id + ')">&#x270F;</button>' +
            '<button class="btn btn-gold btn-sm" onclick="openPartyStatementModal(\'buyers\',' + b.id + ')">&#x1F4C4; Statement</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteItem(\'buyers\',' + b.id + ')">&#x2715;</button>' +
            '</div></td></tr>';
    }).join('');
}

var editingBuyId = null;
function editBuyer(id) {
    var b = state.buyers.find(function (x) { return x.id === id; });
    if (!b) return;
    editingBuyId = id;
    document.getElementById('buy-name').value = b.name;
    document.getElementById('buy-contact').value = b.contact;
    document.getElementById('buy-phone').value = b.phone;
    document.getElementById('buy-city').value = b.city;
    document.getElementById('buy-bank-name').value = b.bankName || '';
    document.getElementById('buy-bank-ac').value = b.bankAc || '';
    document.getElementById('buy-bank-ifsc').value = b.bankIfsc || '';

    var btn = document.getElementById('btn-add-buyer');
    if (btn) {
        btn.innerHTML = '&#x1F4BE; Update Buyer';
        btn.classList.add('btn-blue');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearBuyForm() {
    editingBuyId = null;
    ['buy-name', 'buy-contact', 'buy-phone', 'buy-city', 'buy-bank-name', 'buy-bank-ac', 'buy-bank-ifsc'].forEach(function (id) { 
        var el = document.getElementById(id);
        if (el) el.value = ''; 
    });
    var btn = document.getElementById('btn-add-buyer');
    if (btn) {
        btn.innerHTML = '&#x1F464; Add Buyer';
        btn.classList.remove('btn-blue');
    }
}

function addBuyer() {
    var n = document.getElementById('buy-name').value;
    if (!n) return toast('Enter company name', true);

    var buyData = {
        name: n,
        contact: document.getElementById('buy-contact').value,
        phone: document.getElementById('buy-phone').value,
        city: document.getElementById('buy-city').value,
        bankName: document.getElementById('buy-bank-name').value,
        bankAc: document.getElementById('buy-bank-ac').value,
        bankIfsc: document.getElementById('buy-bank-ifsc').value
    };

    if (editingBuyId) {
        var idx = state.buyers.findIndex(function (x) { return x.id === editingBuyId; });
        if (idx >= 0) state.buyers[idx] = Object.assign(state.buyers[idx], buyData);
        toast('Buyer updated');
    } else {
        buyData.id = state.nextBuyId++;
        state.buyers.push(buyData);
        toast('Buyer added');
    }
    saveState(); renderBuyersTable(); clearBuyForm();
}

/* ═══════ DELETE UTILITIES ═══════ */
var _confirmResolve = null;
function customConfirm(msg) {
    document.getElementById('confirmMsg').textContent = msg;
    document.getElementById('confirmModal').classList.add('show');
    return new Promise(function (r) { _confirmResolve = r; });
}

// Bind confirmation buttons
document.addEventListener('DOMContentLoaded', function() {
    var yesBtn = document.getElementById('confirmYes');
    var noBtn = document.getElementById('confirmNo');
    if (yesBtn) {
        yesBtn.onclick = function () {
            document.getElementById('confirmModal').classList.remove('remove');
            document.getElementById('confirmModal').classList.remove('show');
            if (_confirmResolve) _confirmResolve(true);
        };
    }
    if (noBtn) {
        noBtn.onclick = function () {
            document.getElementById('confirmModal').classList.remove('show');
            if (_confirmResolve) _confirmResolve(false);
        };
    }
});

function deleteItem(arr, id) {
    customConfirm('Remove this item?').then(function (ok) {
        if (!ok) return;
        state[arr] = state[arr].filter(function (x) { return String(x.id) !== String(id); });
        saveState();
        if (arr === 'inventory') { 
            if (typeof renderInventoryTable === 'function') renderInventoryTable(); 
            if (typeof renderDashboardKpis === 'function') renderDashboardKpis(); 
            if (typeof renderInvLevels === 'function') renderInvLevels(); 
        }
        if (arr === 'trades') { 
            if (typeof renderTradesTable === 'function') renderTradesTable(); 
            if (typeof renderRecentTrades === 'function') renderRecentTrades(); 
            if (typeof renderDashboardKpis === 'function') renderDashboardKpis(); 
        }
        if (arr === 'suppliers') renderSuppliersTable();
        if (arr === 'buyers') renderBuyersTable();
        toast('Removed');
    });
}

/* ═══════ PARTY STATEMENTS ═══════ */
var currentStatementPartyName = "";
var currentStatementPartyType = "";

function openPartyStatementModal(partyType, partyId) {
    var party = null;
    if (partyType === 'suppliers') {
        party = state.suppliers.find(function (x) { return x.id === partyId; });
    } else {
        party = state.buyers.find(function (x) { return x.id === partyId; });
    }
    if (!party) return toast('Party not found', true);

    currentStatementPartyName = party.name;
    currentStatementPartyType = partyType;

    document.getElementById('psm-title').innerHTML = '<i class="fas fa-file-invoice"></i> Statement Center — ' + escH(party.name);
    
    // Find all trades for this party
    var partyTrades = state.trades.filter(function (t) {
        return t.party && t.party.toLowerCase().trim() === party.name.toLowerCase().trim();
    });

    // Sort by date descending
    partyTrades.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var tbody = document.getElementById('psm-tbody');
    if (partyTrades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--muted);">No trades found for this party.</td></tr>';
        document.getElementById('psm-select-all').checked = false;
        document.getElementById('psm-select-all').disabled = true;
    } else {
        document.getElementById('psm-select-all').checked = true;
        document.getElementById('psm-select-all').disabled = false;
        
        var formatReceiptDate = function(dStr) {
            if (!dStr) return '';
            var parts = dStr.split('-');
            if (parts.length === 3) {
                return parts[2] + '.' + parts[1] + '.' + parts[0];
            }
            return dStr;
        };

        var fNum = function(val) {
            return Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
        };

        tbody.innerHTML = partyTrades.map(function (t) {
            var rawQty = parseFloat(t.raw_qty) || parseFloat(t.vol) || 0;
            var totalVal = rawQty * (parseFloat(t.price) || 0);
            if (t.mode === 'local') {
                var den = parseFloat(t.density) || 0.85;
                var unit = t.unit || 'L';
                var qtyKG = (unit === 'KG') ? rawQty : (unit === 'MTON' ? rawQty * 1000 : rawQty * den);
                totalVal = qtyKG * (parseFloat(t.deal_rate) || 0);
            }
            return '<tr>' +
                '<td style="padding:10px;"><input type="checkbox" class="psm-row-chk" data-trade-id="' + t.id + '" checked onclick="updatePsmSelectAllState()"></td>' +
                '<td style="padding:10px;">' + formatReceiptDate(t.date) + '</td>' +
                '<td style="padding:10px;"><span class="badge ' + (t.type === 'Buy' ? 'badge-blue' : 'badge-green') + '">' + t.type + '</span></td>' +
                '<td style="padding:10px; font-weight:bold;">' + escH(t.product) + '</td>' +
                '<td style="padding:10px; text-align:right;" class="mono">' + fNum(rawQty) + ' ' + (t.unit || 'L') + '</td>' +
                '<td style="padding:10px; text-align:right;" class="mono">₹ ' + fNum(t.price) + '</td>' +
                '<td style="padding:10px; text-align:right;" class="mono">₹ ' + fNum(totalVal) + '</td>' +
                '<td style="padding:10px; text-align:left;"><span class="badge badge-gray">' + t.mode.toUpperCase() + '</span></td>' +
                '<td style="padding:10px; text-align:center; display:flex; gap:6px; justify-content:center;"><button class="btn btn-sm btn-ghost" onclick="printTradeReceipt(' + t.id + ')">&#x1F5B6; Print Deal</button><button class="btn btn-sm btn-ghost" onclick="printTradeInvoice(' + t.id + ')">&#x1F4C4; Invoice</button></td>' +
                '</tr>';
        }).join('');
    }

    document.getElementById('partyStatementModal').classList.add('show');
}

function closePartyStatementModal() {
    document.getElementById('partyStatementModal').classList.remove('show');
}

function togglePsmSelectAll(master) {
    var chks = document.querySelectorAll('.psm-row-chk');
    chks.forEach(function (chk) {
        chk.checked = master.checked;
    });
}

function updatePsmSelectAllState() {
    var chks = document.querySelectorAll('.psm-row-chk');
    var allChecked = true;
    chks.forEach(function (chk) {
        if (!chk.checked) allChecked = false;
    });
    var master = document.getElementById('psm-select-all');
    if (master) {
        master.checked = allChecked && chks.length > 0;
    }
}

function generateMasterStatement() {
    var chks = document.querySelectorAll('.psm-row-chk:checked');
    if (chks.length === 0) return toast('Please select at least one trade', true);

    var selectedIds = Array.from(chks).map(function (chk) {
        return parseInt(chk.getAttribute('data-trade-id'));
    });

    var selectedTrades = state.trades.filter(function (t) {
        return selectedIds.includes(t.id);
    });

    selectedTrades.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
    });

    var formatReceiptDate = function(dStr) {
        if (!dStr) return '';
        var parts = dStr.split('-');
        if (parts.length === 3) {
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        }
        return dStr;
    };

    var fNum = function(val) {
        return Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    var totalAmt = 0;
    var totalQtyKG = 0;
    var totalQtyL = 0;

    var rowsHtml = selectedTrades.map(function (t) {
        var rawQty = parseFloat(t.raw_qty) || parseFloat(t.vol) || 0;
        var unit = t.unit || 'L';
        var price = parseFloat(t.price) || 0;
        var mode = t.mode || 'local';
        var dateStr = formatReceiptDate(t.date);
        var invNo = t.inv_no || '—';
        var vehNo = t.veh || '—';
        var oil = t.product || '—';

        var displayQty = rawQty;
        var displayRate = price;
        var displayAmt = rawQty * price;

        if (mode === 'local') {
            var den = parseFloat(t.density) || 0.85;
            var qtyKG = (unit === 'KG') ? rawQty : (unit === 'MTON' ? rawQty * 1000 : rawQty * den);
            var dealRate = parseFloat(t.deal_rate) || 0;
            displayQty = qtyKG;
            displayRate = dealRate;
            displayAmt = qtyKG * dealRate;
            totalQtyKG += qtyKG;
        } else {
            if (unit === 'KG') {
                totalQtyKG += rawQty;
            } else if (unit === 'MTON') {
                totalQtyKG += rawQty * 1000;
            } else {
                totalQtyL += rawQty;
            }
        }

        totalAmt += displayAmt;

        return `
            <tr>
                <td style="text-align: left;">${dateStr}</td>
                <td style="text-align: left;">${escH(invNo)}</td>
                <td style="text-align: left;"><span style="font-weight: bold;">${t.type.toUpperCase()}</span> (${mode.toUpperCase()})</td>
                <td style="text-align: left; font-weight: bold;">${escH(oil)}</td>
                <td class="mono" style="text-align: right;">${fNum(displayQty)} ${mode === 'local' ? 'KG' : unit}</td>
                <td class="mono" style="text-align: right;">${fNum(displayRate)}</td>
                <td class="mono" style="text-align: right; font-weight: bold;">${fNum(displayAmt)}</td>
                <td style="text-align: left;">${escH(vehNo)}</td>
            </tr>
        `;
    }).join('');

    var qtySummary = [];
    if (totalQtyKG > 0) qtySummary.push(fNum(totalQtyKG) + ' KG');
    if (totalQtyL > 0) qtySummary.push(fNum(totalQtyL) + ' L');
    var qtySummaryStr = qtySummary.join(' / ') || '0';

    var html = `
        <html>
        <head>
            <title>Master_Statement_${currentStatementPartyName.replace(/\s+/g, '_')}</title>
            <style>
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    color: #000;
                    padding: 10px;
                    margin: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: auto;
                    font-size: 10px;
                    margin-top: 15px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 6px 4px;
                    vertical-align: middle;
                    white-space: nowrap;
                }
                th {
                    background: #f2f2f2;
                    font-weight: bold;
                }
                .mono {
                    font-family: monospace;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
                <div style="font-size: 16px; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">
                    ${escH(currentStatementPartyName)}
                </div>
                <div style="font-size: 11px; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase;">
                    CONSOLIDATED MASTER STATEMENT
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">DATE</th>
                        <th style="text-align: left;">INV NO</th>
                        <th style="text-align: left;">TYPE</th>
                        <th style="text-align: left;">OIL / PRODUCT</th>
                        <th style="text-align: right;">QUANTITY</th>
                        <th style="text-align: right;">RATE</th>
                        <th style="text-align: right;">TOTAL AMOUNT (₹)</th>
                        <th style="text-align: left;">VEHICLE</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <!-- Total Row -->
                    <tr style="font-weight: bold; background: #fafafa;">
                        <td colspan="4" style="text-align: left; text-transform: uppercase;">Total</td>
                        <td class="mono" style="text-align: right;">${qtySummaryStr}</td>
                        <td style="text-align: right;">—</td>
                        <td class="mono" style="text-align: right; color: #16a34a;">${fNum(totalAmt)}</td>
                        <td style="text-align: left;">—</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `;

    openPrintWindow(html, `Statement_${currentStatementPartyName.replace(/\s+/g, '_')}`);
}

// Window Bridge
(function (w) {
    const exports = {
        renderSuppliersTable, toggleSupIntlFields, editSupplier, clearSupForm, addSupplier,
        renderBuyersTable, editBuyer, clearBuyForm, addBuyer,
        customConfirm, deleteItem,
        openPartyStatementModal, closePartyStatementModal, togglePsmSelectAll, updatePsmSelectAllState, generateMasterStatement
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
