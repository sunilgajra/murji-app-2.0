/* ═══════ INVENTORY & YARD MANAGEMENT ═══════ */

function renderInventoryTable() {
    var searchEl = document.getElementById('invSearch');
    var q = searchEl ? searchEl.value.toLowerCase() : '';
    
    const invTable = document.getElementById('invTable');
    if (!invTable) return;

    invTable.innerHTML = (state.inventory || [])
        .filter(function (i) { 
            return !q || 
                   i.product.toLowerCase().indexOf(q) >= 0 || 
                   (i.container_no && i.container_no.toLowerCase().indexOf(q) >= 0) || 
                   (i.location && i.location.toLowerCase().indexOf(q) >= 0); 
        })
        .map(function (i) {
            var yardWt = i.yard_weight_kg ? fmtKG(i.yard_weight_kg) : '-';
            var smell = i.smell || '-';
            var colour = i.colour || '-';
            var container = i.container_no || '-';
            var blNet = i.weight_kg ? fmtKG(i.weight_kg) : fmtKG(i.vol * (i.density || 0.850));
            var cost = i.cost || 0;
            var dispLoc = i.location || i.tank || '';
            if (dispLoc.indexOf('ISO_') === 0) {
                var tk = (state.tanks || []).find(function(x) { return x.id === dispLoc; });
                if (tk) {
                    dispLoc = tk.name + ' (' + tk.location + ')';
                }
            }
            var locBadge = '<span class="badge badge-blue">' + escH(dispLoc) + '</span>';
            
            return '<tr>' +
                '<td style="font-weight:bold; color:var(--teal);">' + escH(i.product) + '</td>' +
                '<td class="mono">' + (i.date || '') + '</td>' +
                '<td class="mono" style="font-weight:bold;">' + escH(container) + '</td>' +
                '<td>' + locBadge + '</td>' +
                '<td class="mono">' + fmtN(i.vol) + ' L</td>' +
                '<td class="mono">' + blNet + '</td>' +
                '<td class="mono" style="font-weight:bold; color:var(--gold2);">' + yardWt + '</td>' +
                '<td style="font-size:12px;"><span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text);">' + escH(smell) + '</span></td>' +
                '<td style="font-size:12px;"><span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text);">' + escH(colour) + '</span></td>' +
                '<td class="mono">' + fmt(cost) + '</td>' +
                '<td class="mono">' + fmt(i.vol * cost) + '</td>' +
                '<td><div style="display:flex;gap:4px">' +
                '<button class="btn btn-primary btn-sm" onclick="editInventoryItem(\'' + i.id + '\')" title="Edit">&#x270F;</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteItem(\'inventory\',\'' + i.id + '\')" title="Delete">&#x2715;</button>' +
                '</div></td>' +
            '</tr>';
        }).join('');
}

function addInventory() {
    var product = document.getElementById('inv-product').value;
    var vol = parseFloat(document.getElementById('inv-vol').value);
    var cost = parseFloat(document.getElementById('inv-cost').value);

    if (!vol || !cost) {
        toast('Please fill quantity and price', true);
        return;
    }

    state.inventory.push({
        id: state.nextInvId++,
        product: product,
        grade: document.getElementById('inv-grade').value || '-',
        tank: document.getElementById('inv-tank').value || '-',
        vol: vol,
        cost: cost,
        threshold: parseFloat(document.getElementById('inv-thresh').value) || 1000,
        density: parseFloat(document.getElementById('inv-density').value) || getDensity(product),
        slip: document.getElementById('inv-slip').dataset.base64 || null
    });

    saveState();
    renderInventoryTable();
    renderDashboardKpis();
    renderInvLevels();
    clearInvForm();
    toast('Stock added successfully ✅');
}

function clearInvForm() {
    ['inv-grade', 'inv-vol', 'inv-kg', 'inv-cost', 'inv-cost-kg', 'inv-tank', 'inv-thresh'].forEach(function (id) { 
        const el = document.getElementById(id);
        if (el) el.value = ''; 
    });
    const previewEl = document.getElementById('inv-slip-preview');
    if (previewEl) previewEl.innerHTML = '<div class="photo-placeholder">&#x1F4F7;</div>';
}

/* ═══════ YARD & TANK MANAGEMENT ═══════ */

function selectYard(yardName) {
    state.activeYard = yardName;
    saveState(true);
    renderYardDashboard();
    renderTankManager();
}

function addYard() {
    const input = document.getElementById('new-yard-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return toast('Please enter a yard name', true);
    
    if (!state.yards) state.yards = [];
    if (state.yards.includes(name)) return toast('Yard already exists!', true);
    
    state.yards.push(name);
    state.activeYard = name;
    input.value = '';
    
    saveState(true);
    renderYardDashboard();
    renderTankManager();
    toast('New Yard Created: ' + name);
}

function renderYardTabs() {
    const tabsEl = document.getElementById('yard-tabs');
    if (!tabsEl || !state.yards) return;
    
    tabsEl.innerHTML = state.yards.map(y => {
        const isActive = state.activeYard === y;
        const style = isActive 
            ? 'background:var(--gold); color:#000; border-color:var(--gold); font-weight:bold; cursor:pointer; padding:6px 14px;' 
            : 'background:var(--surface2); color:var(--muted); border-color:var(--border); cursor:pointer; padding:6px 14px;';
        
        const unitsCount = (state.tanks || []).filter(t => t.location === y).length;
        const badgeText = unitsCount > 0 ? ` (${unitsCount})` : '';

        return `
            <span class="badge" style="${style}" onclick="selectYard('${escH(y)}')">
                ${escH(y)}${badgeText}
            </span>
        `;
    }).join('');
}

function toggleStorageFormFields(type) {
    const staticFields = document.getElementById('form-static-tank-fields');
    const mobileFields = document.getElementById('form-mobile-iso-fields');
    if (!staticFields || !mobileFields) return;
    if (type === 'Static') {
        staticFields.style.display = 'block';
        mobileFields.style.display = 'none';
    } else {
        staticFields.style.display = 'none';
        mobileFields.style.display = 'block';
    }
}

function syncTankCapacities(unit) {
    const capEl = document.getElementById('yard-new-tank-cap');
    const capKgEl = document.getElementById('yard-new-tank-cap-kg');
    const capMtEl = document.getElementById('yard-new-tank-cap-mt');
    if (!capEl || !capKgEl || !capMtEl) return;
    const den = 0.850;
    
    if (unit === 'L') {
        const val = parseFloat(capEl.value) || 0;
        capKgEl.value = val > 0 ? (val * den).toFixed(0) : '';
        capMtEl.value = val > 0 ? (val * den / 1000).toFixed(1) : '';
    } else if (unit === 'KG') {
        const val = parseFloat(capKgEl.value) || 0;
        capEl.value = val > 0 ? (val / den).toFixed(0) : '';
        capMtEl.value = val > 0 ? (val / 1000).toFixed(1) : '';
    } else if (unit === 'MT') {
        const val = parseFloat(capMtEl.value) || 0;
        capEl.value = val > 0 ? (val * 1000 / den).toFixed(0) : '';
        capKgEl.value = val > 0 ? (val * 1000).toFixed(0) : '';
    }
}

function onIsoProductChange() {
    const pName = document.getElementById('new-iso-product').value;
    const densityEl = document.getElementById('new-iso-density');
    const volEl = document.getElementById('new-iso-vol');
    const wtEl = document.getElementById('new-iso-weight');
    if (!densityEl || !volEl || !wtEl) return;
    
    if (!pName) {
        densityEl.value = '';
        volEl.value = '';
        wtEl.value = '';
        volEl.disabled = true;
        wtEl.disabled = true;
        return;
    }
    
    volEl.disabled = false;
    wtEl.disabled = false;
    const den = getDensity(pName);
    densityEl.value = den.toFixed(3);
    
    syncIsoVolWeight('L');
}

function syncIsoVolWeight(unit) {
    const pName = document.getElementById('new-iso-product').value;
    if (!pName) return;
    
    const den = parseFloat(document.getElementById('new-iso-density').value) || 0.850;
    const volEl = document.getElementById('new-iso-vol');
    const wtEl = document.getElementById('new-iso-weight');
    if (!volEl || !wtEl) return;
    
    if (unit === 'L') {
        const vol = parseFloat(volEl.value) || 0;
        wtEl.value = vol > 0 ? (vol * den).toFixed(1) : '';
    } else {
        const wt = parseFloat(wtEl.value) || 0;
        volEl.value = wt > 0 ? (wt / den).toFixed(0) : '';
    }
}

function registerNewTank() {
    if (!state.tanks) state.tanks = [];
    const name = (document.getElementById('yard-new-tank-name').value || '').trim().toUpperCase();
    let cap = parseFloat(document.getElementById('yard-new-tank-cap').value);
    const capKG = parseFloat(document.getElementById('yard-new-tank-cap-kg').value);
    const capMT = parseFloat(document.getElementById('yard-new-tank-cap-mt').value);
    const loc = state.activeYard || 'Yard A';

    if (capKG && !cap) cap = capKG / 0.850;
    if (capMT && !cap) cap = (capMT * 1000) / 0.850;

    if (!name || !cap) return toast('Enter name and capacity', true);

    const id = 'T' + (state.tanks.length + 1);
    state.tanks.push({ id, name, capacity: cap, location: loc, type: 'Static' });

    document.getElementById('yard-new-tank-name').value = '';
    document.getElementById('yard-new-tank-cap').value = '';
    document.getElementById('yard-new-tank-cap-kg').value = '';
    document.getElementById('yard-new-tank-cap-mt').value = '';

    saveState(true);
    renderTankManager();
    renderYardDashboard();
    toast('New Tank Registered in ' + loc);
}

function parkNewIsoContainer() {
    if (!state.tanks) state.tanks = [];
    const containerNo = (document.getElementById('new-iso-no').value || '').trim().toUpperCase();
    const cap = parseFloat(document.getElementById('new-iso-cap').value) || 30000;
    const product = document.getElementById('new-iso-product').value;
    const loc = state.activeYard || 'Yard A';

    if (!containerNo) return toast('Please enter a container number', true);

    const id = 'ISO_' + containerNo;
    const exists = state.tanks.find(t => t.id === id);
    if (exists) return toast('Container already registered!', true);

    state.tanks.push({
        id: id,
        name: 'ISO: ' + containerNo,
        location: loc,
        capacity: cap,
        type: 'Mobile'
    });

    if (product) {
        const vol = parseFloat(document.getElementById('new-iso-vol').value) || 0;
        const weight = parseFloat(document.getElementById('new-iso-weight').value) || 0;
        const density = parseFloat(document.getElementById('new-iso-density').value) || 0.850;

        if (vol > 0) {
            if (!state.inventory) state.inventory = [];
            state.inventory.push({
                id: 'INV' + (state.nextInvId++),
                trade_id: null,
                container_no: containerNo,
                product: product,
                vol: vol,
                weight_kg: weight || (vol * density),
                yard_weight_kg: weight || (vol * density),
                smell: '',
                colour: '',
                density: density,
                location: id,
                date: today(),
                type: 'Yard Receipt (ISO)',
                status: 'In Yard',
                cost: 0
            });
        }
    }

    document.getElementById('new-iso-no').value = '';
    document.getElementById('new-iso-product').value = '';
    const volEl = document.getElementById('new-iso-vol');
    const wtEl = document.getElementById('new-iso-weight');
    const densityEl = document.getElementById('new-iso-density');
    if (volEl) { volEl.value = ''; volEl.disabled = true; }
    if (wtEl) { wtEl.value = ''; wtEl.disabled = true; }
    if (densityEl) densityEl.value = '';

    saveState(true);
    renderTankManager();
    renderYardDashboard();
    toast('ISO Container ' + containerNo + ' parked in ' + loc);
}

function addTank() {
    registerNewTank();
}

function deleteTank(id) {
    if (!confirm('Remove this storage unit? This will not delete inventory batches associated with it.')) return;
    state.tanks = state.tanks.filter(t => t.id !== id);
    saveState(true);
    renderTankManager();
    renderYardDashboard();
    toast('Storage unit removed');
}

function renderYardDashboard() {
    const staticGrid = document.getElementById('yard-static-grid');
    const mobileGrid = document.getElementById('yard-mobile-grid');
    if (!state) return;
    
    if (!state.yards) state.yards = ['Yard A', 'Yard B'];
    if (!state.activeYard || !state.yards.includes(state.activeYard)) {
        state.activeYard = state.yards[0] || 'Yard A';
    }
    
    const activeYard = state.activeYard;
    ['active-yard-title-tanks', 'active-yard-title-mobile', 'active-yard-title-table'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = activeYard;
    });
    
    renderYardTabs();
    
    const yardTanks = (state.tanks || []).filter(t => t.location === activeYard);
    
    // Render Static Tanks
    if (staticGrid) {
        const staticTanks = yardTanks.filter(t => t.type === 'Static');
        if (staticTanks.length === 0) {
            staticGrid.innerHTML = '<div class="empty" style="grid-column: 1/-1;">No storage tanks registered in this yard.</div>';
        } else {
            staticGrid.innerHTML = staticTanks.map(tank => {
                const relevant = (state.inventory || []).filter(i => i.location === tank.id);
                const currentL = relevant.reduce((sum, i) => sum + i.vol, 0);
                const products = [...new Set(relevant.filter(i => i.vol > 0).map(i => i.product))];
                const mainProd = products.length > 0 ? products[0] : 'EMPTY';
                const pct = Math.min(100, Math.max(0, (currentL / tank.capacity) * 100));
                const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#14b8a6';
                
                return `
                    <div class="panel" style="border-top: 4px solid ${color}; margin-bottom: 0;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <b>${escH(tank.name)}</b>
                            <span style="color:${color}; font-weight:bold;">${pct.toFixed(1)}%</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); height:80px; position:relative; border-radius:4px; overflow:hidden; border:1px solid var(--border);">
                            <div style="position:absolute; bottom:0; width:100%; height:${pct}%; background:${color}44;"></div>
                            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:2px;">
                                <div style="font-size:16px; font-weight:bold; color:var(--text);">${fmtN((currentL * 0.850).toFixed(0))} KG</div>
                                <div style="font-size:12px; font-weight:bold; color:var(--teal);">${fmtN((currentL * 0.850 / 1000).toFixed(2))} MTON</div>
                            </div>
                        </div>
                        <div style="font-size:10px; margin-top:8px; color:var(--muted); display:flex; justify-content:space-between; align-items:center;">
                            <span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-weight:bold; color:var(--gold2);">${mainProd}</span>
                            <span>Max: ${fmtN((tank.capacity * 0.85).toFixed(0))} KG | ${fmtN((tank.capacity * 0.85 / 1000).toFixed(1))} MTON</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Render Mobile/ISO Tanks
    if (mobileGrid) {
        const mobileTanks = yardTanks.filter(t => t.type === 'Mobile');
        if (mobileTanks.length === 0) {
            mobileGrid.innerHTML = '<div class="empty" style="grid-column: 1/-1;">No parked ISO containers in this yard.</div>';
        } else {
            mobileGrid.innerHTML = mobileTanks.map(tank => {
                const relevant = (state.inventory || []).filter(i => i.location === tank.id);
                const currentL = relevant.reduce((sum, i) => sum + i.vol, 0);
                const products = [...new Set(relevant.filter(i => i.vol > 0).map(i => i.product))];
                const mainProd = products.length > 0 ? products[0] : 'EMPTY';
                const pct = Math.min(100, Math.max(0, (currentL / tank.capacity) * 100));
                
                return `
                    <div class="panel" style="border-top: 4px solid var(--teal); margin-bottom: 0; background:rgba(20, 184, 166, 0.02);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <b style="color:var(--teal);"><i class="fas fa-truck"></i> ${escH(tank.name)}</b>
                            <span style="color:var(--teal); font-weight:bold;">${pct.toFixed(1)}%</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); height:80px; position:relative; border-radius:4px; overflow:hidden; border:1px solid var(--border);">
                            <div style="position:absolute; bottom:0; width:100%; height:${pct}%; background:rgba(20, 184, 166, 0.15);"></div>
                            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:2px;">
                                <div style="font-size:16px; font-weight:bold; color:var(--text);">${fmtN((currentL * 0.850).toFixed(0))} KG</div>
                                <div style="font-size:12px; font-weight:bold; color:var(--teal);">${fmtN((currentL * 0.850 / 1000).toFixed(2))} MTON</div>
                            </div>
                        </div>
                        <div style="font-size:10px; margin-top:8px; color:var(--muted); display:flex; justify-content:space-between; align-items:center;">
                            <span style="background:rgba(20, 184, 166, 0.1); padding:2px 6px; border-radius:4px; font-weight:bold; color:var(--teal);">${mainProd}</span>
                            <span>Max: ${fmtN((tank.capacity * 0.85).toFixed(0))} KG | ${fmtN((tank.capacity * 0.85 / 1000).toFixed(1))} MTON</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

function renderTankManager() {
    const tbody = document.getElementById('tankManagerTable');
    if (!tbody || !state) return;

    const activeYard = state.activeYard || 'Yard A';
    const yardTanks = (state.tanks || []).filter(t => t.location === activeYard);

    if (yardTanks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No storage units registered in this yard yet.</td></tr>';
    } else {
        tbody.innerHTML = yardTanks.map(t => {
            const relevant = (state.inventory || []).filter(i => i.location === t.id);
            const currentL = relevant.reduce((sum, i) => sum + i.vol, 0);
            const products = [...new Set(relevant.filter(i => i.vol > 0).map(i => i.product))];
            const mainProd = products.length > 0 ? products[0] : 'EMPTY';
            const typeLabel = t.type === 'Mobile' ? '<span class="badge badge-teal">Mobile / ISO</span>' : '<span class="badge badge-gold">Static Tank</span>';
            const capKg = t.capacity * 0.85;
            const capMton = capKg / 1000;
            const currentKg = currentL * 0.85;
            const currentMton = currentKg / 1000;
            const stockText = currentL > 0 ? `${mainProd}: ${fmtN(currentKg.toFixed(0))} KG (${fmtN(currentMton.toFixed(1))} MTON)` : '<span style="color:var(--muted)">Empty</span>';

            return `
                <tr>
                    <td class="mono">${t.id}</td>
                    <td style="font-weight:bold;">${escH(t.name)}</td>
                    <td>${typeLabel}</td>
                    <td class="mono">${fmtN(capKg.toFixed(0))} KG | ${fmtN(capMton.toFixed(1))} MTON</td>
                    <td>${stockText}</td>
                    <td><button class="btn btn-sm btn-ghost" onclick="deleteTank('${t.id}')" style="color:var(--red)">&#x2715;</button></td>
                </tr>
            `;
        }).join('');
    }

    const locSelect = document.getElementById('tr-storage-loc');
    const srcSelect = document.getElementById('tr-source-loc');
    if (locSelect) {
        let density = 0.850;
        const trDensityEl = document.getElementById('tr-density');
        if (trDensityEl && trDensityEl.value) {
            density = parseFloat(trDensityEl.value) || 0.850;
        }
        let html = '<option value="">-- Direct Sale / Other --</option>';
        const yards = [...new Set((state.tanks || []).map(t => t.location).filter(Boolean))];
        yards.forEach(y => {
            html += `<optgroup label="${escH(y)}">`;
            (state.tanks || []).filter(t => t.location === y).forEach(t => {
                const cKg = t.capacity * density;
                const cMton = cKg / 1000;
                html += `<option value="${t.id}">${escH(t.name)} (${fmtN(cKg.toFixed(0))} KG | ${fmtN(cMton.toFixed(1))} MTON)</option>`;
            });
            html += `</optgroup>`;
        });
        locSelect.innerHTML = html;
        if (srcSelect) srcSelect.innerHTML = html.replace('-- Direct Sale / Other --', '-- Select Source --');
    }

    const transferSelect = document.getElementById('mty-tank-id');
    if (transferSelect) {
        let density = 0.850;
        if (typeof currentMtyTradeId !== 'undefined' && currentMtyTradeId) {
            const mtyTrade = (state.trades || []).find(x => x.id === currentMtyTradeId);
            if (mtyTrade) {
                density = parseFloat(mtyTrade.density) || 0.850;
            }
        }
        let html = '';
        const yards = [...new Set((state.tanks || []).filter(t => t.type === 'Static').map(t => t.location).filter(Boolean))];
        yards.forEach(y => {
            html += `<optgroup label="${escH(y)}">`;
            (state.tanks || []).filter(t => t.type === 'Static' && t.location === y).forEach(t => {
                const cKg = t.capacity * density;
                const cMton = cKg / 1000;
                html += `<option value="${t.id}">${escH(t.name)} (${fmtN(cKg.toFixed(0))} KG | ${fmtN(cMton.toFixed(1))} MTON)</option>`;
            });
            html += `</optgroup>`;
        });
        transferSelect.innerHTML = html;
    }
}

/* ═══════ EDIT INVENTORY MODAL ROUTINES ═══════ */

function editInventoryItem(id) {
    if (!state.inventory) state.inventory = [];
    const item = state.inventory.find(x => String(x.id) === String(id));
    if (!item) return toast('Inventory item not found', true);

    document.getElementById('edit-inv-id').value = item.id;
    document.getElementById('edit-inv-product').value = item.product || '';
    document.getElementById('edit-inv-container').value = item.container_no || '';
    document.getElementById('edit-inv-date').value = item.date || today();
    document.getElementById('edit-inv-location').value = item.location || '';
    document.getElementById('edit-inv-vol').value = item.vol || 0;
    document.getElementById('edit-inv-density').value = item.density || 0.850;
    document.getElementById('edit-inv-weight').value = item.weight_kg ? item.weight_kg.toFixed(2) : (item.vol * (item.density || 0.850)).toFixed(2);
    document.getElementById('edit-inv-yard-weight').value = item.yard_weight_kg || 0;
    document.getElementById('edit-inv-smell').value = item.smell || '';
    document.getElementById('edit-inv-colour').value = item.colour || '';
    document.getElementById('edit-inv-cost').value = item.cost || 0;

    const modal = document.getElementById('editInventoryModal');
    if (modal) modal.classList.add('show');
}

function closeEditInventoryModal() {
    const modal = document.getElementById('editInventoryModal');
    if (modal) modal.classList.remove('show');
}

function syncEditInvVolToWeight() {
    const vol = parseFloat(document.getElementById('edit-inv-vol').value) || 0;
    const density = parseFloat(document.getElementById('edit-inv-density').value) || 0.850;
    document.getElementById('edit-inv-weight').value = (vol * density).toFixed(2);
}

function saveEditInventoryItem() {
    const id = document.getElementById('edit-inv-id').value;
    if (!state.inventory) state.inventory = [];
    const item = state.inventory.find(x => String(x.id) === String(id));
    if (!item) return toast('Inventory item not found', true);

    const vol = parseFloat(document.getElementById('edit-inv-vol').value) || 0;
    const density = parseFloat(document.getElementById('edit-inv-density').value) || 0.850;

    item.date = document.getElementById('edit-inv-date').value || today();
    item.location = document.getElementById('edit-inv-location').value;
    item.vol = vol;
    item.density = density;
    item.weight_kg = vol * density;
    item.yard_weight_kg = parseFloat(document.getElementById('edit-inv-yard-weight').value) || 0;
    item.smell = document.getElementById('edit-inv-smell').value;
    item.colour = document.getElementById('edit-inv-colour').value;
    item.cost = parseFloat(document.getElementById('edit-inv-cost').value) || 0;

    saveState();
    renderInventoryTable();
    renderDashboardKpis();
    renderInvLevels();
    closeEditInventoryModal();
    toast('Stock Batch Updated successfully ✅');
}

// Window Bridge
(function (w) {
    const exports = {
        renderInventoryTable, addInventory, clearInvForm,
        selectYard, addYard, renderYardTabs, toggleStorageFormFields,
        syncTankCapacities, onIsoProductChange, syncIsoVolWeight,
        registerNewTank, parkNewIsoContainer, addTank, deleteTank,
        renderYardDashboard, renderTankManager,
        editInventoryItem, closeEditInventoryModal, syncEditInvVolToWeight, saveEditInventoryItem
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
