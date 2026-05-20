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

// Window Bridge
(function (w) {
    const exports = {
        renderSuppliersTable, toggleSupIntlFields, editSupplier, clearSupForm, addSupplier,
        renderBuyersTable, editBuyer, clearBuyForm, addBuyer,
        customConfirm, deleteItem
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
