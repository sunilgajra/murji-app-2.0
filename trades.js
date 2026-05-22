/* ═══════ TRADES TABLE ═══════ */
let currentMtyTradeId = null;
var currentTradeExpenses = [];
var currentShipDocs = [];
var currentTradeDocs = [];
var editingTradeId = null;
var currentExtractedTally = null;
var activeShipDocItem = null;
let lastCurrency = 'USD';

function renderTradesTable() {
    var searchEl = document.getElementById('tradeSearch');
    var q = searchEl ? searchEl.value.toLowerCase() : '';
    var typeFilterEl = document.getElementById('tradeTypeFilter');
    var typeFilter = typeFilterEl ? typeFilterEl.value : 'all';
    var modeFilterEl = document.getElementById('tradeModeFilter');
    var modeFilter = modeFilterEl ? modeFilterEl.value : 'all';

    document.getElementById('tradesTable').innerHTML = state.trades.slice().reverse()
        .filter(function (t) {
            if (typeFilter !== 'all' && t.type !== typeFilter) return false;
            if (modeFilter !== 'all' && t.mode !== modeFilter) return false;
            if (q) {
                var modeLabel = '';
                if (t.type === 'Buy') modeLabel = t.mode === 'import' ? 'Import' : 'Local';
                else modeLabel = t.mode === 'hs_sale' ? 'HS Sale' : 'Local';

                var product = t.product ? t.product.toLowerCase() : '';
                var party = t.party ? t.party.toLowerCase() : '';
                var date = t.date ? t.date.toLowerCase() : '';
                var blNo = t.bl_no ? t.bl_no.toLowerCase() : '';
                var boeNo = t.boe_no ? t.boe_no.toLowerCase() : '';
                var invNo = (t.inv_no || '').toLowerCase();
                var lrNo = (t.lr_no || '').toLowerCase();
                var veh = (t.veh || '').toLowerCase();
                var shipTo = (t.ship_to || '').toLowerCase();

                return product.indexOf(q) >= 0 ||
                       party.indexOf(q) >= 0 ||
                       date.indexOf(q) >= 0 ||
                       modeLabel.toLowerCase().indexOf(q) >= 0 ||
                       blNo.indexOf(q) >= 0 ||
                       invNo.indexOf(q) >= 0 ||
                       lrNo.indexOf(q) >= 0 ||
                       veh.indexOf(q) >= 0 ||
                       shipTo.indexOf(q) >= 0 ||
                       boeNo.indexOf(q) >= 0;
            }
            return true;
        })
        .map(function (t) {
            var modeLabel = '';
            if (t.type === 'Buy') modeLabel = t.mode === 'import' ? 'Import' : 'Local';
            else modeLabel = t.mode === 'hs_sale' ? 'HS Sale' : 'Local';

            var modeInfo = ' <small>(' + modeLabel + ')</small>';
            var displayQty = t.raw_qty !== undefined ? t.raw_qty : t.vol;
            var unitSuffix = t.unit ? ' ' + t.unit : ' L';
            var hasShipDocs = t.ship_docs ? (Array.isArray(t.ship_docs) ? t.ship_docs.length > 0 : Object.keys(t.ship_docs).length > 0) : false;
            var hasDocs = (t.docs && t.docs.length > 0) || hasShipDocs;
            var boeBadge = t.boe_no ? ' <span class="badge badge-blue" style="font-size:9px; padding:1px 4px;" title="BOE: ' + t.boe_no + '">BOE</span>' : '';
            var importBadge = t.import_no ? ' <span class="badge" style="font-size:9px; padding:1px 4px; background:#6366f1; color:#fff;" title="Import No: ' + t.import_no + '">' + t.import_no + '</span>' : '';
            var activeBlNo = t.bl_no || t.hss_bl_no;
            var blBadge = activeBlNo ? ' <span class="badge" style="font-size:9px; padding:1px 4px; background:var(--surface2); color:var(--text); border:1px solid var(--border);" title="BL No: ' + activeBlNo + '">BL: ' + activeBlNo + '</span>' : '';
            var docBadge = hasDocs ? ' <span title="Documents attached" style="color:var(--gold2)">&#x1F4CE;</span>' : '';

            var dealRateVal = (t.mode === 'local' && t.deal_rate) ? '₹ ' + fmt(t.deal_rate) + ' / KG' : '—';
            var yChargesVal = (t.mode === 'local' && t.y_charges !== undefined) ? '₹ ' + fmt(t.y_charges) : '—';

            var invNoDisplay = t.mode === 'local' ? (t.inv_no || '—') : (t.import_no || t.bl_no || '—');
            var vehLrDisplay = '<div style="font-size:11px;">' + escH(t.veh || '—') + '</div>' + 
                               (t.lr_no ? '<div style="font-size:10px; color:var(--muted)">LR: ' + escH(t.lr_no) + '</div>' : '');

            const moveBtn = t.mode === 'import' ? `<button class="btn btn-blue btn-sm" onclick="openMoveToYardModal(${t.id})" title="Move to Yard">&#x1F69A;</button>` : '';
            const invoiceBtn = t.type === 'Sell' ? `<button class="btn btn-ghost btn-sm" onclick="printTradeInvoice(${t.id})" title="Tax Invoice">&#x1F4C4;</button>` : '';

            return '<tr><td class="mono">' + t.date + '</td><td><span class="badge ' + (t.type === 'Buy' ? 'badge-blue' : 'badge-green') + '">' + t.type + '</span>' + modeInfo + importBadge + blBadge + boeBadge + docBadge + '</td><td>' + escH(t.product) + '</td><td>' + escH(t.party) + (t.ship_to ? '<div style="font-size:9px;color:var(--muted)">Ship to: ' + escH(t.ship_to) + '</div>' : '') + '</td><td class="mono">' + fmtN(displayQty) + unitSuffix + '</td><td class="mono">' + fmt(t.price) + '</td><td class="mono">' + fmt(displayQty * t.price) + '</td><td class="mono">' + dealRateVal + '</td><td class="mono">' + yChargesVal + '</td><td class="mono">' + escH(invNoDisplay) + '</td><td>' + vehLrDisplay + '</td><td><div style="display:flex;gap:4px"><button class="btn btn-primary btn-sm" onclick="editTrade(' + t.id + ')" title="Edit">&#x270F;</button><button class="btn btn-ghost btn-sm" onclick="printTradeReceipt(' + t.id + ')" title="Print">&#x1F5B6;</button>' + invoiceBtn + (t.mode === 'import' ? '<button class="btn btn-teal btn-sm" onclick="generateLandedCostReport(' + t.id + ')" title="Landed Cost Report">&#x1F4CA;</button>' : '') + moveBtn + '<button class="btn btn-danger btn-sm" onclick="deleteItem(\'trades\',' + t.id + ')" title="Delete">&#x2715;</button></div></td></tr>';
        }).join('');
}

/* ═══════ UNLOADING TO YARD / QUALITY CONTROL ═══════ */
function openMoveToYardModal(tradeId) {
    const t = state.trades.find(x => x.id === tradeId);
    if (!t) return;
    currentMtyTradeId = tradeId;
    
    document.getElementById('mty-date').value = today();
    
    // Parse the containers list (comma-separated)
    const rawContainers = typeof t.containers === 'string' ? t.containers : '';
    const contList = rawContainers.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    
    const totalBlNet = parseFloat(t.net_weight) || parseFloat(t.raw_qty) || parseFloat(t.vol) || 0;
    const defaultNetPerContainer = (totalBlNet > 0 && contList.length > 0) ? (totalBlNet / contList.length) : 0;
    
    document.getElementById('mty-total-bl-net').value = totalBlNet || '';
    document.getElementById('mty-container-count-badge').textContent = contList.length;
    
    // Sync container tally in memory with normalized robust alphanumeric matching
    const oldTally = t.container_tally || [];
    t.container_tally = contList.map(num => {
        const normNum = num.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const existing = oldTally.find(x => (x.container_no || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === normNum);
        return {
            container_no: num,
            bl_gross: existing ? existing.bl_gross : defaultNetPerContainer,
            bl_net: existing ? (existing.bl_net || defaultNetPerContainer) : defaultNetPerContainer,
            cfs_wt: existing ? existing.cfs_wt : 0,
            yard_wt: existing ? (existing.yard_wt !== undefined ? existing.yard_wt : existing.cfs_wt) : 0,
            smell: existing ? (existing.smell || '') : '',
            colour: existing ? (existing.colour || '') : '',
            status: existing ? existing.status : 'Awaiting Yard Transfer',
            transfer_date: existing ? existing.transfer_date : '',
            transfer_dest: existing ? existing.transfer_dest : ''
        };
    });
    
    const tbody = document.getElementById('mty-container-tbody');
    
    if (t.container_tally.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="padding:15px; color:var(--red); text-align:center; font-size:12px;">No containers list found for this trade.<br>Please update the Trade with Container IDs (comma-separated) first.</td></tr>';
    } else {
        tbody.innerHTML = t.container_tally.map((c, i) => {
            const isTransferred = c.status === 'Transferred';
            const variance = c.cfs_wt && c.bl_net ? (parseFloat(c.cfs_wt) - parseFloat(c.bl_net)) : 0;
            const varStr = variance > 0 ? '+' + variance.toFixed(2) : variance.toFixed(2);
            const varColor = variance < -50 ? 'var(--red)' : (variance > 0 ? 'var(--green)' : 'var(--text)');
            
            return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05); background:${isTransferred ? 'rgba(255,255,255,0.02)' : 'transparent'}; opacity:${isTransferred ? 0.7 : 1};">
                    <td style="padding:10px;"><input type="checkbox" class="mty-cnt-check" value="${i}" ${isTransferred ? 'disabled' : 'checked'} style="width:16px; height:16px;"></td>
                    <td style="padding:10px; font-family:monospace; font-weight:bold; color:var(--text);">${c.container_no}</td>
                    <td style="padding:10px;"><input class="mty-bl-gross" type="number" step="0.01" value="${c.bl_gross || ''}" placeholder="0.00" style="width:110px; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} oninput="calcMtyRowVariance(this, ${i})"></td>
                    <td style="padding:10px;"><input class="mty-bl-net" type="number" step="0.01" value="${c.bl_net || ''}" placeholder="0.00" style="width:110px; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} oninput="calcMtyRowVariance(this, ${i})"></td>
                    <td style="padding:10px;"><input class="mty-cfs" type="number" step="0.01" value="${c.cfs_wt || ''}" placeholder="0.00" style="width:110px; border:1px solid var(--gold2); background:rgba(251, 191, 36, 0.05); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} oninput="calcMtyRowVariance(this, ${i})"></td>
                    <td style="padding:10px; font-family:monospace; font-weight:bold; color:${varColor};" class="mty-variance-cell">${c.cfs_wt && c.bl_net ? varStr : '-'}</td>
                    <td style="padding:10px;"><input class="mty-yard-wt" type="number" step="0.01" value="${c.yard_wt || ''}" placeholder="0.00" style="width:110px; border:1px solid var(--teal); background:rgba(20, 184, 166, 0.05); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} oninput="calcMtyRowVariance(this, ${i})"></td>
                    <td style="padding:10px;">
                        <select class="mty-smell" style="width:100px; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} onchange="updateMtyRowQuality(this, ${i}, 'smell')">
                            <option value="" ${!c.smell ? 'selected' : ''}>-- Select --</option>
                            <option value="Normal" ${c.smell === 'Normal' ? 'selected' : ''}>Normal</option>
                            <option value="Strong" ${c.smell === 'Strong' ? 'selected' : ''}>Strong</option>
                            <option value="Light" ${c.smell === 'Light' ? 'selected' : ''}>Light</option>
                            <option value="Acidic" ${c.smell === 'Acidic' ? 'selected' : ''}>Acidic</option>
                            <option value="Burnt" ${c.smell === 'Burnt' ? 'selected' : ''}>Burnt</option>
                            <option value="Chemical" ${c.smell === 'Chemical' ? 'selected' : ''}>Chemical</option>
                            <option value="Sweet" ${c.smell === 'Sweet' ? 'selected' : ''}>Sweet</option>
                        </select>
                    </td>
                    <td style="padding:10px;">
                        <select class="mty-colour" style="width:110px; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:5px; border-radius:4px;" ${isTransferred ? 'disabled' : ''} onchange="updateMtyRowQuality(this, ${i}, 'colour')">
                            <option value="" ${!c.colour ? 'selected' : ''}>-- Select --</option>
                            <option value="White" ${c.colour === 'White' ? 'selected' : ''}>White</option>
                            <option value="Golden" ${c.colour === 'Golden' ? 'selected' : ''}>Golden</option>
                            <option value="Light Yellow" ${c.colour === 'Light Yellow' ? 'selected' : ''}>Light Yellow</option>
                            <option value="Pale Amber" ${c.colour === 'Pale Amber' ? 'selected' : ''}>Pale Amber</option>
                            <option value="Light Brown" ${c.colour === 'Light Brown' ? 'selected' : ''}>Light Brown</option>
                            <option value="Dark Brown" ${c.colour === 'Dark Brown' ? 'selected' : ''}>Dark Brown</option>
                        </select>
                    </td>
                    <td style="padding:10px; font-size:11px; color:${isTransferred ? 'var(--teal)' : 'var(--muted)'}; font-weight:bold;">${isTransferred ? `Transferred` : 'Awaiting'}</td>
                </tr>
            `;
        }).join('');
    }
    
    // Populate Tanks
    if (typeof renderTankManager === 'function') renderTankManager();
    
    // Populate Yard Locations dropdown
    const yardLocEl = document.getElementById('mty-yard-loc');
    if (yardLocEl) {
        if (!state.yards) state.yards = ['Yard A', 'Yard B'];
        yardLocEl.innerHTML = state.yards.map(y => `<option value="${escH(y)}">${escH(y)}</option>`).join('');
        yardLocEl.value = state.activeYard || state.yards[0] || 'Yard A';
    }
    
    // Set initial destination display toggle
    const destTypeEl = document.getElementById('mty-dest-type');
    if (destTypeEl) {
        destTypeEl.value = 'tank'; // Reset default
        toggleMtyDest('tank');
    }
    
    document.getElementById('moveToYardModal').classList.add('show');
    updateMtyTotals();
}

function toggleMtySelectAll(cb) {
    const checks = document.querySelectorAll('.mty-cnt-check');
    checks.forEach(c => {
        if (!c.disabled) c.checked = cb.checked;
    });
}

function calcMtyRowVariance(inputEl, index) {
    const tr = inputEl.closest('tr');
    const blNet = parseFloat(tr.querySelector('.mty-bl-net').value) || 0;
    const cfs = parseFloat(tr.querySelector('.mty-cfs').value) || 0;
    const varianceCell = tr.querySelector('.mty-variance-cell');
    
    const cfsInput = tr.querySelector('.mty-cfs');
    const yardInput = tr.querySelector('.mty-yard-wt');
    if (inputEl === cfsInput && (!yardInput.value || parseFloat(yardInput.value) === 0)) {
        yardInput.value = cfsInput.value;
    }
    
    const yardWt = parseFloat(tr.querySelector('.mty-yard-wt').value) || 0;
    
    // Update in-memory array immediately
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (t && t.container_tally && t.container_tally[index]) {
        t.container_tally[index].bl_gross = parseFloat(tr.querySelector('.mty-bl-gross').value) || 0;
        t.container_tally[index].bl_net = blNet;
        t.container_tally[index].cfs_wt = cfs;
        t.container_tally[index].yard_wt = yardWt;
    }
    
    if (cfs > 0 && blNet > 0) {
        const variance = cfs - blNet;
        varianceCell.textContent = variance > 0 ? '+' + variance.toFixed(2) : variance.toFixed(2);
        varianceCell.style.color = variance < -50 ? 'var(--red)' : (variance > 0 ? 'var(--green)' : 'var(--text)');
    } else {
        varianceCell.textContent = '-';
        varianceCell.style.color = 'var(--text)';
    }
    updateMtyTotals();
}

function updateMtyTotals() {
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (!t || !t.container_tally) return;
    
    let totalGross = 0;
    let totalNet = 0;
    let totalCfs = 0;
    let totalYard = 0;
    
    t.container_tally.forEach(c => {
        totalGross += parseFloat(c.bl_gross) || 0;
        totalNet += parseFloat(c.bl_net) || 0;
        totalCfs += parseFloat(c.cfs_wt) || 0;
        totalYard += parseFloat(c.yard_wt) || parseFloat(c.cfs_wt) || 0;
    });
    
    const variance = totalCfs - totalNet;
    const varStr = variance > 0 ? '+' + variance.toFixed(2) : variance.toFixed(2);
    const varColor = variance < -50 ? 'var(--red)' : (variance > 0 ? 'var(--green)' : 'var(--text)');
    
    const tfoot = document.getElementById('mty-container-tfoot');
    if (tfoot) {
        tfoot.innerHTML = `
            <tr style="border-top: 2px solid var(--border); background: rgba(255,255,255,0.03);">
                <td colspan="2" style="padding:12px; font-weight:bold; color:var(--text);">GRAND TOTALS:</td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:var(--text);">${fmtKG(totalGross)}</td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:var(--teal);">${fmtKG(totalNet)}</td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:var(--gold2);">${fmtKG(totalCfs)}</td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:${varColor};">${varStr}</td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:var(--teal);">${fmtKG(totalYard)}</td>
                <td colspan="3"></td>
            </tr>
        `;
    }
}

function autoSplitBlNetWeight() {
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (!t || !t.container_tally || t.container_tally.length === 0) return;
    
    const newTotal = parseFloat(document.getElementById('mty-total-bl-net').value) || 0;
    const splitVal = newTotal > 0 ? (newTotal / t.container_tally.length) : 0;
    
    const rows = document.querySelectorAll('#mty-container-tbody tr');
    t.container_tally.forEach((c, i) => {
        c.bl_net = splitVal;
        
        // Update input field in DOM
        if (rows[i]) {
            const blNetInput = rows[i].querySelector('.mty-bl-net');
            if (blNetInput) {
                blNetInput.value = splitVal.toFixed(2);
                calcMtyRowVariance(blNetInput, i);
            }
        }
    });
    
    toast(`⚡ Distributed ${fmtKG(newTotal)} equally across all containers!`);
}

function updateMtyRowQuality(selectEl, index, field) {
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (t && t.container_tally && t.container_tally[index]) {
        t.container_tally[index][field] = selectEl.value;
    }
}

function saveMtyWeightTallyOnly() {
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (!t) return;
    
    t.container_tally_total_net = t.container_tally.reduce((sum, x) => sum + (parseFloat(x.bl_net) || 0), 0);
    
    saveState(true);
    closeMoveToYardModal();
    renderTradesTable();
    toast(`✨ Quality control weight tally saved successfully!`);
}

function toggleMtyDest(val) {
    document.getElementById('mty-tank-group').style.display = val === 'tank' ? 'block' : 'none';
    document.getElementById('mty-yard-group').style.display = val === 'iso' ? 'block' : 'none';
}

function closeMoveToYardModal() {
    document.getElementById('moveToYardModal').classList.remove('show');
}

async function confirmYardTransfer() {
    const t = state.trades.find(x => x.id === currentMtyTradeId);
    if (!t) return;
    
    const selectedIndices = Array.from(document.querySelectorAll('.mty-cnt-check:checked')).map(el => parseInt(el.value));
    if (selectedIndices.length === 0) return toast('Please select at least one container to transfer', true);
    
    const destType = document.getElementById('mty-dest-type').value;
    const tankId = document.getElementById('mty-tank-id').value;
    const date = document.getElementById('mty-date').value || today();
    
    let totalTransferred = 0;
    let missingCfsCount = 0;
    
    selectedIndices.forEach(idx => {
        const c = t.container_tally[idx];
        const cfsWeight = parseFloat(c.cfs_wt) || 0;
        const yardWeight = parseFloat(c.yard_wt) || cfsWeight;
        
        if (cfsWeight <= 0) {
            missingCfsCount++;
            return;
        }
        
        totalTransferred += yardWeight;
        c.status = 'Transferred';
        c.transfer_date = date;
        c.transfer_dest = destType === 'tank' ? tankId : 'ISO_' + c.container_no;
        c.yard_wt = yardWeight;
        
        // Add to Inventory
        if (!state.inventory) state.inventory = [];
        state.inventory.push({
            id: 'INV' + (state.nextInvId++),
            trade_id: t.id,
            container_no: c.container_no,
            product: t.product,
            vol: yardWeight / (t.density || 0.850),
            weight_kg: cfsWeight, // keep original BL Net weight or CFS weight as reference
            yard_weight_kg: yardWeight, // tested received yard weight
            smell: c.smell || '',
            colour: c.colour || '',
            density: t.density || 0.850,
            location: destType === 'tank' ? tankId : ('ISO_' + c.container_no),
            date: date,
            type: destType === 'tank' ? 'Unload to Tank' : 'Yard Receipt (ISO)',
            status: 'In Yard',
            cost: t.price || 0
        });
        
        // If it's a virtual ISO tank, register it as a temporary storage if not exists
        if (destType === 'iso') {
            const yardLoc = (document.getElementById('mty-yard-loc').value || '').trim() || 'Yard - On Wheels';
            const exists = (state.tanks || []).find(tk => tk.id === ('ISO_' + c.container_no));
            if (!exists) {
                if (!state.tanks) state.tanks = [];
                state.tanks.push({
                    id: 'ISO_' + c.container_no,
                    name: 'ISO: ' + c.container_no,
                    location: yardLoc,
                    capacity: 30000,
                    type: 'Mobile'
                });
            } else {
                exists.location = yardLoc;
            }
        }
    });
    
    if (missingCfsCount > 0 && totalTransferred === 0) {
        return toast('Please fill in CFS Weight (KG) for selected containers first', true);
    }
    
    t.container_tally_total_net = t.container_tally.reduce((sum, x) => sum + (parseFloat(x.bl_net) || 0), 0);
    
    // Check if ALL containers in this trade are transferred
    const allDone = t.container_tally.every(c => c.status === 'Transferred');
    if (allDone) {
        t.status = 'Completed';
    }
    
    saveState(true);
    closeMoveToYardModal();
    renderTradesTable();
    if (typeof renderYardDashboard === 'function') renderYardDashboard();
    if (typeof renderTankManager === 'function') renderTankManager();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
    toast(`✨ Successfully tested & received ${fmtN(totalTransferred)} KG in yard!`);
}

/* ═══════ TRADE ATTACHED DOCUMENTS ═══════ */
async function handleTradeDocUpload(input) {
    const files = input.files;
    if (!files || files.length === 0) return;

    toast("Processing Documents...");
    for (let f of files) {
        // 1. ADD TO LIST IMMEDIATELY (Placeholder)
        const newDoc = { name: f.name, data: '', size: f.size, date: today(), status: 'Uploading...' };
        currentTradeDocs.push(newDoc);
        renderTradeDocs();

        try {
            // 2. TRY CLOUD UPLOAD
            let url = null;
            if (window.supabaseClient) {
                const { data: auth } = await supabaseClient.auth.getSession();
                if (auth.session) url = await uploadFileToSupabase(f, 'trades');
            }

            if (url) {
                newDoc.url = url;
                newDoc.data = url;
                newDoc.status = 'Ready';
            } else {
                // LOCAL FALLBACK
                const reader = new FileReader();
                const fileData = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(f);
                });
                newDoc.data = fileData;
                newDoc.status = 'Ready (Local)';
            }
        } catch (e) {
            console.warn("Upload Error, using local fallback:", e);
            const reader = new FileReader();
            const fileData = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(f);
            });
            newDoc.data = fileData;
            newDoc.status = 'Ready (Local)';
        }
        renderTradeDocs(); // RE-RENDER AFTER EACH SUCCESS
        saveState(); // FORCE SAVE TO PREVENT DATA LOSS ON REFRESH
    }
    if (currentTradeDocs.length > 0) document.getElementById('btn-scan-ai').style.display = 'inline-block';
}

function renderTradeDocs() {
    var list = document.getElementById('tr-docs-list');
    if (!list) return;

    if (!currentTradeDocs || currentTradeDocs.length === 0) {
        list.innerHTML = '<div style="color:var(--muted); font-size:11px; padding:15px; border:1px dashed var(--border); border-radius:8px; text-align:center; background:rgba(0,0,0,0.1);">No documents attached for this trade.</div>';
        document.getElementById('btn-scan-ai').style.display = 'none';
        return;
    }

    list.innerHTML = currentTradeDocs.map(function (d, idx) {
        if (typeof d === 'string') {
            d = { name: 'Attached Document ' + (idx+1), data: d, url: d, size: 0, status: 'Ready', date: today() };
        }
        const docUrl = d.url || d.data;
        return `
            <div class="doc-item" style="display:flex; align-items:center; background:rgba(255,255,255,0.05); padding:10px 15px; border-radius:10px; margin-bottom:8px; border:1px solid var(--border); gap:12px; transition: all 0.2s;">
                <div style="font-size:20px; color:var(--gold2);">&#x1F4C4;</div>
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
                    <input class="doc-name-input" value="${escH(d.name)}" onchange="renameTradeDoc(${idx}, this.value)" 
                           style="width:100%; background:transparent; border:none; color:var(--text); font-size:13px; font-weight:600; outline:none; padding:0;" 
                           title="Click to rename">
                    <div style="font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px;">
                        ${d.size ? (d.size / 1024).toFixed(1) + ' KB' : 'CLOUD STORAGE'} • ${d.date || today()}
                    </div>
                </div>
                <div style="display:flex; gap:8px">
                    <button class="btn btn-sm btn-ghost" onclick="openDocPreview('${docUrl}', '${escH(d.name)}')" title="Preview" style="color:var(--teal); padding:5px; background:rgba(20,184,166,0.1);">&#x1F441;</button>
                    <button class="btn btn-sm btn-ghost" onclick="window.open('${docUrl}','_blank')" title="Download" style="color:var(--gold2); padding:5px; background:rgba(251,191,36,0.1);">&#x2913;</button>
                    <button class="btn btn-sm btn-ghost" onclick="removeTradeDoc(${idx})" title="Remove" style="color:var(--red); padding:5px; background:rgba(239,68,68,0.1);">&#x2715;</button>
                </div>
            </div>
        `;
    }).join('');

    if (currentTradeDocs.length > 0) document.getElementById('btn-scan-ai').style.display = 'inline-block';
}

function renameTradeDoc(idx, newName) {
    if (!newName.trim()) return;
    currentTradeDocs[idx].name = newName.trim();
    toast('Document renamed');
    saveState();
}

function previewDoc(idx) {
    var d = currentTradeDocs[idx];
    openDocPreview(d.data, 'Preview: ' + d.name);
}

function removeTradeDoc(idx) {
    currentTradeDocs.splice(idx, 1);
    renderTradeDocs();
    saveState();
    if (currentTradeDocs.length === 0) document.getElementById('btn-scan-ai').style.display = 'none';
}

function downloadDoc(idx) {
    var d = currentTradeDocs[idx];
    var link = document.createElement('a');
    link.href = d.data;
    link.download = d.name;
    link.click();
}

/* ═══════ AI VISION SCANNING / OCR ENGINE ═══════ */
async function scanDocument(doc, progressCallback) {
    if (!doc) return;
    document.getElementById('tr-mode').value = 'import';
    toggleTradeDetailFields();

    if (state.apiKey) {
        // AUTO-UPLOAD TO CLOUD IF LOGGED IN (Ensures persistence)
        try {
            if (window.supabaseClient) {
                const { data: auth } = await supabaseClient.auth.getSession();
                if (auth.session) {
                    if (!doc.url && doc.data && doc.data.startsWith('data:')) {
                        if (progressCallback) progressCallback('&#x2601; Uploading to Cloud...');
                        const cloudUrl = await uploadFileToSupabase(dataURLtoFile(doc.data, doc.name), 'trade_docs');
                        doc.url = cloudUrl;
                        doc.data = cloudUrl;
                        saveState();
                    }
                }
            }
        } catch (cloudErr) {
            console.warn("Cloud Upload Skip:", cloudErr.message);
        }

        // DIRECT AI SCAN
        if (progressCallback) progressCallback('&#x2601; AI Vision Scanning...');
        await refineWithCloudAI(doc);
    } else {
        // LOCAL OCR FALLBACK
        if (progressCallback) progressCallback('&#x2728; Local OCR Scanning...');
        var text = "";

        if (doc.type === 'application/pdf') {
            var pdf = await pdfjsLib.getDocument(doc.data).promise;
            for (var p = 1; p <= pdf.numPages; p++) {
                var page = await pdf.getPage(p);
                var viewport = page.getViewport({ scale: 2 });
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height; canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'eng');
                text += "\n" + result.data.text;
            }
        } else {
            const result = await Tesseract.recognize(doc.data, 'eng');
            text = result.data.text;
        }

        var cleanText = text.replace(/[\[\]\|]/g, ' ').replace(/\s+/g, ' ').trim();
        runLocalExtract(cleanText);
        syncCustomsDutyToExpenses();
        calcTradeTotals();

        toast('Local OCR Complete. Add API Key for 100% accuracy.');
    }
}

async function scanTradeDocWithAI() {
    if (currentTradeDocs.length === 0) return;
    var btn = document.getElementById('btn-scan-ai');
    var oldBtnHtml = btn.innerHTML;
    btn.disabled = true;

    try {
        var doc = currentTradeDocs[0];
        if (!doc) return toast("No document found to scan", true);

        await scanDocument(doc, function (msg) {
            btn.innerHTML = msg;
        });
    } catch (err) {
        console.error("Scan Error:", err);
        toast("Scan Error: " + err.message, true);
    } finally {
        btn.innerHTML = oldBtnHtml;
        btn.disabled = false;
    }
}

function runLocalExtract(cleanText) {
    // 1. BL Number - match "BILL OF LADING", "B/L", "BL" followed by "NO", "NUMBER", or just spaces/colons
    var blMatch = cleanText.match(/(?:BILL\s*OF\s*LADING|B\/L|BL)\s*(?:NO\.?|NUMBER)?[\s:]+([A-Z0-9.\/\-]+)/i) || 
                  cleanText.match(/TKU[\.\s][A-Z0-9\.\s]+/i);
    if (blMatch) {
        document.getElementById('tr-bl-no').value = (blMatch[1] || blMatch[0]).trim().replace(/\s+/g, '.');
    }

    // 2. Vessel Name
    var vMatch = cleanText.match(/VESSEL[:\s\n]+([A-Z0-9\s\[\]]+)/i);
    if (vMatch) document.getElementById('tr-vessel').value = vMatch[1].trim().split('\n')[0].replace(/[^A-Z0-9\s]/g, '');

    // 3. Gross & Net Weight
    var grossMatch = cleanText.match(/(?:GROSS\s*WEIGHT|GR\s*WT|GROSS\s*WT)[\s:]*([0-9\.\s,]+)/i);
    if (grossMatch) document.getElementById('tr-gross-weight').value = grossMatch[1].replace(/[\s,]/g, '');

    var netMatch = cleanText.match(/(?:NET\s*WEIGHT|NET\s*WT)[\s:]*([0-9\.\s,]+)/i);
    if (netMatch) document.getElementById('tr-net-weight').value = netMatch[1].replace(/[\s,]/g, '');

    // 4. Containers
    var containerMatches = cleanText.match(/[A-Z]{4}\s*[0-9]{7}/g) || cleanText.match(/[A-Z0-9]{10,12}/g);
    if (containerMatches) {
        var uniqueC = [...new Set(containerMatches)].map(c => c.replace(/\s+/g, '')).filter(c => /[A-Z]{3,4}/.test(c) && /[0-9]{6,7}/.test(c));
        document.getElementById('tr-containers').value = uniqueC.slice(0, 22).join(', ');
    }

    // Date formatting helper
    const formatDateToYYYYMMDD = (dateStr) => {
        if (!dateStr) return '';
        let match = dateStr.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
        if (match) {
            let day = match[1].padStart(2, '0');
            let month = match[2].padStart(2, '0');
            let year = match[3];
            return `${year}-${month}-${day}`;
        }
        match = dateStr.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
        if (match) {
            let year = match[1];
            let month = match[2].padStart(2, '0');
            let day = match[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        try {
            let d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return d.toISOString().split('T')[0];
            }
        } catch(e) {}
        return dateStr;
    };

    // 5. BOE Details
    var boeNoMatch = cleanText.match(/(?:B\.?E\.?\s*(?:NO\.?|NUMBER)?|BILL\s*OF\s*ENTRY\s*(?:NO\.?|NUMBER)?)[\/\-\s:]*([0-9]+)/i);
    if (boeNoMatch) document.getElementById('tr-boe-no').value = boeNoMatch[1].trim();

    var boeDateMatch = cleanText.match(/(?:B\.?E\.?\s*Date|Date|B\/E\s*Date)[\/\-\s:]*([0-9]{2}[/\-][0-9]{2}[/\-][0-9]{4})/i) || 
                       cleanText.match(/(?:B\.?E\.?\s*Date|Date|B\/E\s*Date)[\/\-\s:]*([0-9]{4}[/\-][0-9]{2}[/\-][0-9]{2})/i);
    if (boeDateMatch) {
        document.getElementById('tr-boe-date').value = formatDateToYYYYMMDD(boeDateMatch[1].trim());
    }

    // 6. Customs Duty, Fine, Penalty, Interest
    var dutyMatch = cleanText.match(/(?:CUSTOMS\s*DUTY|DUTY\s*AMOUNT|TOTAL\s*DUTY|BCD|DUTY|SWS|IGST)[\/\-\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (dutyMatch) document.getElementById('tr-duty-amt').value = dutyMatch[1].replace(/[\s,]/g, '');

    var fineMatch = cleanText.match(/(?:REDEMPTION\s*FINE|FINE\s*AMOUNT|FINE|R\.?\s*FINE)[\/\-\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (fineMatch) document.getElementById('tr-boe-fine').value = fineMatch[1].replace(/[\s,]/g, '');

    var penaltyMatch = cleanText.match(/PENALTY\s*(?:AMOUNT)?[\/\-\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (penaltyMatch) document.getElementById('tr-boe-penalty').value = penaltyMatch[1].replace(/[\s,]/g, '');

    var interestMatch = cleanText.match(/INTEREST\s*(?:AMOUNT)?[\/\-\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (interestMatch) document.getElementById('tr-boe-interest').value = interestMatch[1].replace(/[\s,]/g, '');
}

async function refineWithCloudAI(docOrText) {
    if (!state.apiKey) return;
    var btn = document.getElementById('btn-scan-ai');

    try {
        const model = state.apiModel || 'gemini-3.1-flash-lite';
        let payload;

        if (typeof docOrText === 'object') {
            // MULTIMODAL DIRECT SCAN (Image/PDF)
            let base64Data;
            if (docOrText.data && docOrText.data.startsWith('data:')) {
                base64Data = docOrText.data.split(',')[1];
            } else if (docOrText.url || (docOrText.data && docOrText.data.startsWith('http'))) {
                // Fetch from cloud URL and convert to base64 for Gemini
                const fetchUrl = docOrText.url || docOrText.data;
                const response = await fetch(fetchUrl);
                const blob = await response.blob();
                base64Data = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            }

            if (!base64Data) throw new Error("Document data not found for AI scan.");

            payload = {
                contents: [{
                    parts: [
                        {
                            text: `DOMAIN: International Oil Shipping and Customs Import. 
TASK: Extract Bill of Lading, Commercial Invoice, or Bill of Entry (BOE/BE) data from this document.
RULES: 
1. Fix all OCR errors. Reconstruct the full list of container numbers (4 letters + 7 digits).
2. Format weights as 0.00. Extract the overall Gross Weight of the shipment as "gross_weight" and overall Net Weight of the shipment as "net_weight".
3. Identify Vessel, Ports, Agent (only for Bill of Lading / Shipping documents; do NOT extract Vessel, Port of Loading, Port of Discharge, or Destination Agent if the document is a Bill of Entry / BOE / Custom document), and HS Code.
4. Extract "Invoice Number" if scanning an Invoice.
5. Extract "Number of Containers" (Total count).
6. If scanning a Bill of Entry (BOE/BE):
   - Extract the BOE/BE Number as "boe_no" (usually listed near top header as BE No or Bill of Entry No, e.g. 9045404).
   - Extract the BOE/BE Date as "boe_date" (formatted as YYYY-MM-DD).
   - Extract the basic Customs Duty Amount as "duty_amt".
   - Extract the Fine as "boe_fine" (if any, default to 0.00).
   - Extract the Penalty as "boe_penalty" (if any, default to 0.00).
   - Extract the Interest as "boe_interest" (if any, default to 0.00).
   - Do NOT scan, extract, or return vessel, port_load, port_dis, or dest_agent (leave them empty or omit them).
7. If the document has a container-level packing list or weight breakdown, extract the individual container weights.
Return ONLY JSON: { "bl_no": "", "inv_no": "", "vessel": "", "port_load": "", "port_dis": "", "dest_agent": "", "hs_code": "", "gross_weight": "", "net_weight": "", "container_count": 0, "boe_no": "", "boe_date": "", "duty_amt": 0.00, "boe_fine": 0.00, "boe_penalty": 0.00, "boe_interest": 0.00, "containers_tally": [{"container_no": "", "bl_gross": 0.00, "bl_net": 0.00}] }` },
                        { inlineData: { mimeType: docOrText.type || "application/pdf", data: base64Data } }
                    ]
                }]
            };
        } else {
            // TEXT-ONLY REFINEMENT
            payload = {
                contents: [{
                    parts: [{ text: `DOMAIN: Oil Shipping. Extract JSON from this OCR: ${docOrText}` }]
                }]
            };
        }

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent?key=' + state.apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.error ? errData.error.message : await response.text();
            throw new Error("Gemini API Error: " + msg);
        }

        const data = await response.json();

        if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            let rawJson = data.candidates[0].content.parts[0].text;
            rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
            const ai = JSON.parse(rawJson);

            const aiNorm = {};
            for (let k in ai) {
                if (ai[k] !== undefined && ai[k] !== null) {
                    aiNorm[k.toLowerCase().replace(/[^a-z0-9_]/g, '')] = ai[k];
                }
            }

            const getVal = (keys, defaultVal = '') => {
                for (let k of keys) {
                    const normK = k.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    if (aiNorm[normK] !== undefined && aiNorm[normK] !== null) {
                        return aiNorm[normK];
                    }
                }
                return defaultVal;
            };

            const boeNo = getVal(['boe_no', 'boe_number', 'be_no', 'be_number', 'bill_of_entry_no']);
            const hasBoe = boeNo && boeNo !== '0' && boeNo !== '';

            const fields = {
                'tr-bl-no': getVal(['bl_no', 'bl_number', 'blNo', 'bill_of_lading_no']),
                'tr-inv-no-intl': getVal(['inv_no', 'invoice_no', 'invoice_number']),
                'tr-vessel': hasBoe ? '' : getVal(['vessel', 'vessel_name', 'vesselName']),
                'tr-port-load': hasBoe ? '' : getVal(['port_load', 'loading_port']),
                'tr-port-dis': hasBoe ? '' : getVal(['port_dis', 'discharge_port']),
                'tr-agent': hasBoe ? '' : getVal(['dest_agent', 'agent', 'agent_dest']),
                'tr-hs-code': getVal(['hs_code', 'hscode']),
                'tr-gross-weight': getVal(['gross_weight', 'gross_wt', 'grossWeight']),
                'tr-net-weight': getVal(['net_weight', 'net_wt', 'netWeight']),
                'tr-container-count': getVal(['container_count', 'containers_count']),
                'tr-boe-no': boeNo,
                'tr-boe-date': getVal(['boe_date', 'be_date']),
                'tr-duty-amt': getVal(['duty_amt', 'duty_amount', 'customs_duty', 'duty']),
                'tr-boe-fine': getVal(['boe_fine', 'fine', 'redemption_fine', 'fine_amt']),
                'tr-boe-penalty': getVal(['boe_penalty', 'penalty', 'penalty_amt']),
                'tr-boe-interest': getVal(['boe_interest', 'interest', 'interest_amt'])
            };

            let containerList = '';
            if (ai.containers) {
                containerList = Array.isArray(ai.containers) ? ai.containers.join(', ') : ai.containers;
            } else if (ai.containers_tally && Array.isArray(ai.containers_tally)) {
                containerList = ai.containers_tally.map(x => x.container_no).join(', ');
            }
            if (containerList) {
                document.getElementById('tr-containers').value = containerList;
            }
            if (ai.containers_tally && Array.isArray(ai.containers_tally)) {
                currentExtractedTally = ai.containers_tally.map(c => ({
                    container_no: c.container_no.trim().toUpperCase(),
                    bl_gross: parseFloat(c.bl_gross) || 0,
                    bl_net: parseFloat(c.bl_net) || 0,
                    cfs_wt: parseFloat(c.cfs_wt) || null,
                    status: 'Awaiting Yard Transfer'
                }));
            }

            // Helper to compare values accurately
            const norm = (s) => {
                if (!s) return '';
                let raw = s.toString().trim().toUpperCase();
                let numericPart = raw.replace(/[^0-9.]/g, '');
                if (numericPart && !isNaN(numericPart) && !/[A-Z]/.test(raw.replace(/[.KGS|MT|LTR]/g, ''))) {
                    return parseFloat(numericPart).toString();
                }
                return raw.replace(/[^A-Z0-9]/g, '');
            };

            // Helper to format date strings for input[type="date"]
            const formatDateToYYYYMMDD = (dateStr) => {
                if (!dateStr) return '';
                let match = dateStr.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
                if (match) {
                    let day = match[1].padStart(2, '0');
                    let month = match[2].padStart(2, '0');
                    let year = match[3];
                    return `${year}-${month}-${day}`;
                }
                match = dateStr.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
                if (match) {
                    let year = match[1];
                    let month = match[2].padStart(2, '0');
                    let day = match[3].padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
                try {
                    let d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        return d.toISOString().split('T')[0];
                    }
                } catch(e) {}
                return dateStr;
            };

            let mismatches = [];
            for (let id in fields) {
                const el = document.getElementById(id);
                if (!el) continue;

                let newValue = (fields[id] || '').toString().trim();
                const oldValue = el.value.trim();

                if (el.type === 'date') {
                    newValue = formatDateToYYYYMMDD(newValue);
                }

                const isBoeNumeric = ['tr-duty-amt', 'tr-boe-fine', 'tr-boe-penalty', 'tr-boe-interest'].includes(id);
                if (!newValue || newValue.toLowerCase() === 'null' || newValue.toLowerCase() === 'na') {
                    continue;
                }
                if (newValue === '0' && !isBoeNumeric) {
                    continue;
                }

                if (oldValue && norm(oldValue) !== norm(newValue)) {
                    el.style.border = '2px solid #ef4444';
                    el.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
                    el.title = `Mismatch detected! Existing: "${oldValue}" | New Scan: "${newValue}"`;
                    mismatches.push(el.previousElementSibling ? el.previousElementSibling.textContent : id);
                    el.value = newValue;
                } else {
                    el.style.border = '';
                    el.style.boxShadow = '';
                    el.title = '';
                    el.value = newValue;
                }
            }

            if (mismatches.length > 0) {
                toast(`Warning: Mismatch detected in: ${mismatches.join(', ')}`, true);
            } else {
                toast('&#x2728; Documents Verified & Synced!');
            }

            if (ai.net_weight) {
                syncWeightToQty();
                const totalGridNet = document.getElementById('tr-total-bl-net');
                if (totalGridNet) {
                    totalGridNet.value = ai.net_weight;
                    calcContainerTotals();
                }
            }
            syncCustomsDutyToExpenses();
            calcTradeTotals();
        }
    } catch (e) {
        console.error("Cloud AI Error:", e);
        toast(e.message, true);
    } finally {
        btn.innerHTML = '&#x2728; Scan with AI';
    }
}

function saveApiKey() {
    state.apiKey = document.getElementById('api-key').value;
    state.apiModel = document.getElementById('api-model').value;
    state.tallyUrl = document.getElementById('tally-url').value;
    state.tallyCompany = document.getElementById('tally-company').value;
    state.tallyBankLedger = document.getElementById('tally-bank-ledger').value;
    state.tallyCashLedger = document.getElementById('tally-cash-ledger').value;
    saveState();
    toast('Configuration Saved');
}

function runDemoScan() {
    document.getElementById('tr-bl-no').value = 'TKU.BEN.MUN.0002';
    document.getElementById('tr-vessel').value = 'ZULFA 2';
    document.getElementById('tr-port-load').value = 'JEBEL ALI SEAPORT, DUBAI';
    document.getElementById('tr-port-dis').value = 'MUNDRA, INDIA';
    document.getElementById('tr-agent').value = 'EZ LINERS LLP';
    document.getElementById('tr-hs-code').value = '38190090';
    document.getElementById('tr-net-weight').value = '589830.00';
    var cList = ['HCKU5703110', 'HLXU1663342', 'HMCU4118744', 'HMCU4171531', 'HMCU4171535', 'SSMU2202785', 'TCUU4141473', 'TCUU4478150', 'TCUU4481117', 'TCUU4481318', 'TCUU4534341', 'TCUU5234348', 'TCUU5534222', 'TGHU0903345', 'TGHU0941313', 'TRHU0492223', 'TRHU1703717', 'TRHU1712260', 'TRHU4532265', 'TRHU4622233', 'TXGU5133612', 'TXGU5443724'];
    document.getElementById('tr-containers').value = cList.join(', ');
    toast('Demo Auto-Fill for known document');
}

function highlightField(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('extracted-pulse');
    setTimeout(function () { el.classList.remove('extracted-pulse'); }, 5000);
}

/* ═══════ TRADES CREATE / EDIT logic ═══════ */
function editTrade(id) {
    var t = state.trades.find(function (x) { return x.id === id; });
    if (!t) return;
    editingTradeId = id;

    // LOAD DOCUMENTS
    currentTradeDocs = t.docs || [];
    currentShipDocs = t.ship_docs || [];
    renderTradeDocs();
    renderShipDocs();

    document.getElementById('tr-type').value = t.type;
    toggleTradeModeField();
    document.getElementById('tr-mode').value = t.mode || 'local';
    toggleTradeDetailFields();
    document.getElementById('tr-product').value = t.product;
    if (t.type === 'Buy' || (t.type === 'Sell' && state.buyers && state.buyers.length > 0)) {
        document.getElementById('tr-party-select').value = t.party;
    } else {
        document.getElementById('tr-party').value = t.party;
    }
    if (document.getElementById('tr-ship-to-select')) {
        document.getElementById('tr-ship-to-select').value = t.ship_to || '';
    }
    document.getElementById('tr-vol').value = t.raw_qty !== undefined ? t.raw_qty : t.vol;
    document.getElementById('tr-unit').value = t.unit || 'LITRE';
    document.getElementById('tr-density').value = t.density;
    document.getElementById('tr-date').value = t.date;
    document.getElementById('tr-terms').value = t.terms || 'Immediate';
    if (t.source_location) {
        populateSourceLocations();
        document.getElementById('tr-source-loc').value = t.source_location;
        checkSourceStock();
    }
    if (document.getElementById('tr-delivery-mode')) {
        document.getElementById('tr-delivery-mode').value = t.delivery_mode || 'ex_yard';
    }
    if (document.getElementById('tr-delivery-dest')) {
        document.getElementById('tr-delivery-dest').value = t.delivery_dest || '';
    }
    toggleDeliveryDest();
    if (t.mode === 'import') {
        document.getElementById('tr-is-hs').checked = !!t.is_hs;
        document.getElementById('tr-inv-no-intl').value = t.inv_no_intl || '';
        document.getElementById('tr-bl-no').value = t.bl_no || '';
        document.getElementById('tr-vessel').value = t.vessel || '';
        document.getElementById('tr-port-load').value = t.port_load || '';
        document.getElementById('tr-port-dis').value = t.port_dis || '';
        document.getElementById('tr-ex-rate').value = t.ex_rate || '';
        document.getElementById('tr-imp-rate').value = t.imp_rate || '';
        document.getElementById('tr-imp-curr').value = t.currency || 'USD';
        lastCurrency = t.currency || 'USD';
        document.getElementById('tr-agent').value = t.dest_agent || '';
        document.getElementById('tr-import-no').value = t.import_no || '';
        document.getElementById('tr-gross-weight').value = t.gross_weight || '';
        document.getElementById('tr-net-weight').value = t.net_weight || '';
        document.getElementById('tr-hs-code').value = t.hs_code || '';
        document.getElementById('tr-boe-no').value = t.boe_no || '';
        document.getElementById('tr-boe-date').value = t.boe_date || '';
        document.getElementById('tr-duty-amt').value = t.duty_amt || '';
        document.getElementById('tr-boe-fine').value = t.boe_fine || '';
        document.getElementById('tr-boe-penalty').value = t.boe_penalty || '';
        document.getElementById('tr-boe-interest').value = t.boe_interest || '';
        document.getElementById('tr-container-count').value = t.container_count || '';
        document.getElementById('tr-tank-rate').value = t.tank_rate || '';
        document.getElementById('tr-containers').value = t.containers || '';
        
        calcImportTotal();
    } else if (t.mode === 'hs_sale') {
        document.getElementById('tr-link-purchase').value = t.link_purchase_id || '';
        document.getElementById('tr-imp-rate').value = t.price;
    } else if (t.mode === 'local') {
        document.getElementById('tr-price-local').value = t.price || '';
        document.getElementById('tr-inv-no').value = t.inv_no || '';
        document.getElementById('tr-gst').value = t.gst || '';
        document.getElementById('tr-veh').value = t.veh || '';
        if (document.getElementById('tr-lr-no')) {
            document.getElementById('tr-lr-no').value = t.lr_no || '';
        }
        document.getElementById('tr-deal-rate').value = t.deal_rate || '';
        document.getElementById('tr-tax-rate').value = t.tax_rate || '';
        document.getElementById('tr-tax-pct').value = t.tax_pct !== undefined ? t.tax_pct : 18;
        calcTradeBreakdown();
    }

    // Load Expenses
    clearExpenses();
    if (t.expenses && Array.isArray(t.expenses)) {
        t.expenses.forEach(function (exp) {
            addExpenseRow(exp);
        });
    }

    document.getElementById('tr-is-hs').checked = !!t.is_hs;
    document.getElementById('tr-hs-seller').value = t.hs_seller || '';

    if (currentTradeDocs.length > 0) document.getElementById('btn-scan-ai').style.display = 'inline-block';
    else document.getElementById('btn-scan-ai').style.display = 'none';

    calcTradeTotals();

    // Load Ship Docs
    clearSupplierData();
    if (t.ship_docs) {
        if (Array.isArray(t.ship_docs)) {
            currentShipDocs = JSON.parse(JSON.stringify(t.ship_docs));
        } else {
            currentShipDocs = Object.keys(t.ship_docs).map(type => ({
                type: type,
                url: t.ship_docs[type].data || t.ship_docs[type].url,
                name: type,
                date: today()
            }));
        }
        renderShipDocs();
    }

    // Load Payments
    if (t.payments) {
        t.payments.forEach(p => addPaymentRow(p));
    }

    // Load Buyer Payments
    clearBuyerData();
    if (t.sale_inv_amt) document.getElementById('tr-sale-inv-amt').value = t.sale_inv_amt;
    if (t.sale_deal_id) document.getElementById('tr-sale-deal').value = t.sale_deal_id;
    if (t.buyer_payments) {
        t.buyer_payments.forEach(p => addBuyerPaymentRow(p));
    }
    updateBuyerPaymentSummary();

    var btn = document.querySelector('button[onclick="addTrade()"]');
    if (btn) { btn.innerHTML = '&#x1F4BE; Update Trade'; btn.classList.add('btn-blue'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addTrade() {
    var type = document.getElementById('tr-type').value;
    var mode = document.getElementById('tr-mode').value;
    var product = document.getElementById('tr-product').value;
    var party = document.getElementById('tr-party-select-wrap').style.display !== 'none' ? document.getElementById('tr-party-select').value : document.getElementById('tr-party').value;
    var rawQty = parseFloat(document.getElementById('tr-vol').value);
    var den = parseFloat(document.getElementById('tr-density').value) || getDensity(product);
    var unit = document.getElementById('tr-unit').value;
    var storageLoc = document.getElementById('tr-storage-loc').value;

    var volInL = rawQty;
    if (unit === 'KG') volInL = rawQty / den;
    if (unit === 'MTON') volInL = (rawQty * 1000) / den;

    var price = 0;
    if (mode === 'import') {
        var rate = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
        var isHs = document.getElementById('tr-is-hs').checked;
        var ex = isHs ? 1 : (parseFloat(document.getElementById('tr-ex-rate').value) || 1);
        price = rate * ex;
    } else if (mode === 'hs_sale') {
        price = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
    } else {
        price = parseFloat(document.getElementById('tr-price-local').value) || 0;
    }

    if (!party || !rawQty || !price) return toast('Please fill all required fields', true);

    var termsVal = document.getElementById('tr-terms').value;
    if (termsVal === '__custom__') termsVal = document.getElementById('tr-custom-term-val').value || 'Custom';

    var existingTrade = editingTradeId ? state.trades.find(x => x.id === editingTradeId) : null;
    var finalContainerTally = existingTrade ? (existingTrade.container_tally || []) : [];
    if (currentExtractedTally && currentExtractedTally.length > 0) {
        finalContainerTally = currentExtractedTally;
        currentExtractedTally = null;
    }
    var finalTotalNet = existingTrade ? (existingTrade.container_tally_total_net || 0) : 0;

    var trade = {
        type: type, mode: mode, product: product, party: party,
        vol: volInL, price: price, raw_qty: rawQty, unit: unit,
        date: document.getElementById('tr-date').value || today(),
        terms: termsVal, density: den, 
        docs: JSON.parse(JSON.stringify(currentTradeDocs)),
        expenses: getTradeExpenses(),
        container_tally: finalContainerTally,
        container_tally_total_net: finalTotalNet,
        containers: document.getElementById('tr-containers').value,
        ship_docs: currentShipDocs,
        payments: getSupplierPayments(),
        buyer_payments: getBuyerPayments(),
        sale_inv_amt: parseFloat(document.getElementById('tr-sale-inv-amt').value) || 0,
        sale_deal_id: document.getElementById('tr-sale-deal').value || null,
        is_hs: document.getElementById('tr-is-hs').checked,
        hs_seller: document.getElementById('tr-hs-seller').value,
        location: storageLoc,
        source_location: document.getElementById('tr-source-loc') ? document.getElementById('tr-source-loc').value : null,
        delivery_mode: document.getElementById('tr-delivery-mode') ? document.getElementById('tr-delivery-mode').value : 'ex_yard',
        delivery_dest: document.getElementById('tr-delivery-dest') ? document.getElementById('tr-delivery-dest').value : '',
        deal_rate: parseFloat(document.getElementById('tr-deal-rate') ? document.getElementById('tr-deal-rate').value : 0) || 0,
        tax_rate: parseFloat(document.getElementById('tr-tax-rate') ? document.getElementById('tr-tax-rate').value : 0) || 0,
        tax_pct: parseFloat(document.getElementById('tr-tax-pct') ? document.getElementById('tr-tax-pct').value : 18) || 18,
        taxable_amt: getTradeQtyKG() * (parseFloat(document.getElementById('tr-tax-rate') ? document.getElementById('tr-tax-rate').value : 0) || 0),
        deal_amt: getTradeQtyKG() * (parseFloat(document.getElementById('tr-deal-rate') ? document.getElementById('tr-deal-rate').value : 0) || 0),
        y_charges: (getTradeQtyKG() * (parseFloat(document.getElementById('tr-deal-rate') ? document.getElementById('tr-deal-rate').value : 0) || 0)) -
                   (getTradeQtyKG() * (parseFloat(document.getElementById('tr-tax-rate') ? document.getElementById('tr-tax-rate').value : 0) || 0) *
                   (1 + (parseFloat(document.getElementById('tr-tax-pct') ? document.getElementById('tr-tax-pct').value : 18) || 18) / 100)),
        ship_to: document.getElementById('tr-ship-to-select') ? document.getElementById('tr-ship-to-select').value : ''
    };

    if (type === 'Sell' && mode === 'hs_sale') trade.link_purchase_id = document.getElementById('tr-link-purchase').value;

    if (mode === 'local') {
        trade.inv_no = document.getElementById('tr-inv-no').value;
        trade.gst = document.getElementById('tr-gst').value;
        trade.veh = document.getElementById('tr-veh').value;
        trade.lr_no = document.getElementById('tr-lr-no') ? document.getElementById('tr-lr-no').value : '';
    }

    if (type === 'Buy') {
        if (mode === 'import') {
            trade.is_hs = document.getElementById('tr-is-hs').checked;
            trade.inv_no_intl = document.getElementById('tr-inv-no-intl').value;
            trade.bl_no = document.getElementById('tr-bl-no').value;
            trade.vessel = document.getElementById('tr-vessel').value;
            trade.port_load = document.getElementById('tr-port-load').value;
            trade.port_dis = document.getElementById('tr-port-dis').value;
            trade.currency = document.getElementById('tr-imp-curr').value;
            trade.ex_rate = parseFloat(document.getElementById('tr-ex-rate').value) || 83.5;
            trade.imp_rate = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
            trade.dest_agent = document.getElementById('tr-agent').value;
            trade.import_no = document.getElementById('tr-import-no').value;
            trade.gross_weight = parseFloat(document.getElementById('tr-gross-weight').value) || 0;
            trade.net_weight = parseFloat(document.getElementById('tr-net-weight').value) || 0;
            trade.hs_code = document.getElementById('tr-hs-code').value;
            trade.boe_no = document.getElementById('tr-boe-no').value;
            trade.boe_date = document.getElementById('tr-boe-date').value;
            trade.duty_amt = parseFloat(document.getElementById('tr-duty-amt').value) || 0;
            trade.boe_fine = parseFloat(document.getElementById('tr-boe-fine').value) || 0;
            trade.boe_penalty = parseFloat(document.getElementById('tr-boe-penalty').value) || 0;
            trade.boe_interest = parseFloat(document.getElementById('tr-boe-interest').value) || 0;
            trade.container_count = parseInt(document.getElementById('tr-container-count').value) || 0;
            trade.tank_rate = parseFloat(document.getElementById('tr-tank-rate').value) || 0;
        }
    }

    if (editingTradeId) {
        var idx = state.trades.findIndex(function (x) { return x.id === editingTradeId; });
        if (idx >= 0) { 
            trade.id = editingTradeId; 
            state.trades[idx] = trade; 
        }
        toast('Changes Saved Successfully ✅');
        currentTradeDocs = JSON.parse(JSON.stringify(trade.docs || []));
        renderTradeDocs();
        renderShipDocs();
    } else {
        trade.id = state.nextTradeId++;
        state.trades.push(trade);
        toast('New Trade Recorded ✅');
        
        editingTradeId = null; 
        currentTradeDocs = []; 
        currentShipDocs = [];
        renderTradeDocs();
        renderShipDocs();
        document.getElementById('btn-scan-ai').style.display = 'none';
        var btn = document.querySelector('button[onclick="addTrade()"]');
        if (btn) { btn.innerHTML = '&#x1F4B1; Record Trade'; btn.classList.remove('btn-blue'); }
        ['tr-party', 'tr-vol', 'tr-price-local', 'tr-import-no', 'tr-bl-no', 'tr-vessel', 'tr-port-load', 'tr-port-dis', 'tr-ex-rate', 'tr-inv-no', 'tr-gst', 'tr-veh', 'tr-imp-rate', 'tr-total-for', 'tr-total-inr-shared', 'tr-agent', 'tr-gross-weight', 'tr-net-weight', 'tr-hs-code', 'tr-boe-no', 'tr-boe-date', 'tr-duty-amt', 'tr-boe-fine', 'tr-boe-penalty', 'tr-boe-interest', 'tr-containers', 'tr-storage-loc', 'tr-deal-rate', 'tr-tax-rate'].forEach(function (id) {
            var el = document.getElementById(id); if (el) el.value = '';
        });
        if (document.getElementById('tr-tax-pct')) document.getElementById('tr-tax-pct').value = '18';
        calcTradeBreakdown();
        document.getElementById('tr-party-select').value = '';
        document.getElementById('tr-is-hs').checked = false;
        document.getElementById('tr-sale-deal').value = '';
        document.getElementById('tr-sale-inv-amt').value = '';
        clearExpenses();
        clearContainerGrid();
        clearSupplierData();
        clearBuyerData();
        toggleTradeDetailFields();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    saveState(); 
    renderTradesTable(); 
    renderRecentTrades(); 
    renderDashboardKpis();
}

function resetTradeForm() {
    editingTradeId = null;
    currentTradeDocs = [];
    currentShipDocs = [];
    currentExtractedTally = null;
    
    document.getElementById('btn-scan-ai').style.display = 'none';
    var btn = document.querySelector('button[onclick="addTrade()"]');
    if (btn) { btn.innerHTML = '&#x1F4B1; Record Trade'; btn.classList.remove('btn-blue'); }
    ['tr-party', 'tr-vol', 'tr-price-local', 'tr-import-no', 'tr-bl-no', 'tr-vessel', 'tr-port-load', 'tr-port-dis', 'tr-ex-rate', 'tr-inv-no', 'tr-gst', 'tr-veh', 'tr-lr-no', 'tr-ship-to-select', 'tr-imp-rate', 'tr-total-for', 'tr-total-inr-shared', 'tr-agent', 'tr-gross-weight', 'tr-net-weight', 'tr-hs-code', 'tr-boe-no', 'tr-boe-date', 'tr-duty-amt', 'tr-boe-fine', 'tr-boe-penalty', 'tr-boe-interest', 'tr-containers', 'tr-storage-loc', 'tr-deal-rate', 'tr-tax-rate'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
    });
    if (document.getElementById('tr-tax-pct')) document.getElementById('tr-tax-pct').value = '18';
    calcTradeBreakdown();
    document.getElementById('tr-party-select').value = '';
    document.getElementById('tr-is-hs').checked = false;
    document.getElementById('tr-sale-deal').value = '';
    document.getElementById('tr-sale-inv-amt').value = '';
    clearExpenses();
    clearContainerGrid();
    clearSupplierData();
    clearBuyerData();
    toggleTradeDetailFields();
    toast('Form Reset Done');
}

/* ═══════ EXPENSES LOGISTICS SUBSYSTEM ═══════ */
function addExpenseRow(data) {
    const tbody = document.getElementById('tr-expenses-body');
    const rowId = 'exp_' + Date.now() + Math.random().toString(36).substr(2, 5);

    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'expense-row';
    row.style.borderBottom = '1px solid var(--border)';

    const mode = document.getElementById('tr-mode').value;
    let types = [];
    if (mode === 'local') {
        types = ['Transportation', 'Truck Hire', 'Loading Charges', 'Unloading Charges', 'Commission', 'Other'];
    } else {
        types = ['Line Charges', 'CFS Charges', 'LOLO Charges', 'Customs Duty', 'THC Fees', 'Agency Fees', 'Transportation', 'Truck Hire', 'Insurance', 'Survey', 'Other'];
    }

    const defaultType = data ? data.type : (mode === 'local' ? 'Truck Hire' : 'Line Charges');
    const isOther = !types.includes(defaultType) && defaultType !== 'Other';
    const finalType = isOther ? 'Other' : defaultType;

    const defaultAmount = data ? data.amount : 0;
    const defaultStatus = data ? data.status : 'Pending';
    const defaultRef = data ? data.ref : '';
    const defaultDoc = data ? data.doc : null;
    const defaultDate = data ? (data.date || today()) : today();

    row.innerHTML = `
        <td style="padding:8px;"><input type="date" class="exp-date" value="${defaultDate}" oninput="updateExpenseData('${rowId}')"></td>
        <td style="padding:8px;">
            <select onchange="handleExpenseTypeChange('${rowId}', this.value)" style="width:100%;">
                ${types.map(t => `<option ${finalType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
            <input type="text" class="exp-custom-type" value="${isOther ? defaultType : ''}" 
                   placeholder="Name..." style="display:${isOther ? 'block' : 'none'}; margin-top:5px; border-bottom:1px solid var(--border) !important;">
        </td>
        <td style="padding:8px;"><input type="number" class="exp-net" value="${data ? (data.net_amount || data.amount) : defaultAmount}" placeholder="0.00" oninput="calcExpTotal('${rowId}')"></td>
        <td style="padding:8px;"><input type="number" class="exp-tax" value="${data ? (data.tax_amount || 0) : 0}" placeholder="0.00" oninput="calcExpTotal('${rowId}')"></td>
        <td style="padding:8px;"><input type="number" class="exp-total" value="${data ? (data.total_amount || data.amount) : defaultAmount}" placeholder="0.00" readonly style="background:var(--surface2); color:var(--teal); font-weight:bold;"></td>
        <td style="padding:8px;">
            <select onchange="updateExpenseData('${rowId}')" style="width:auto;">
                <option ${defaultStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                <option ${defaultStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            </select>
        </td>
        <td style="padding:8px;">
            <div style="display:flex; gap:5px; align-items:center;">
                <input type="text" value="${defaultRef}" placeholder="Ref No" style="flex:1" oninput="updateExpenseData('${rowId}')">
                <button class="btn btn-sm btn-ghost ${defaultDoc ? 'btn-teal' : ''}" onclick="uploadExpenseDoc('${rowId}')" id="btn-upload-${rowId}" title="Upload Bill">
                    &#x1F4CE;
                </button>
                <button class="btn btn-sm btn-ghost" id="btn-view-${rowId}" style="display:${defaultDoc ? 'inline-block' : 'none'}" onclick="viewExpenseDoc('${rowId}')" title="View Bill">
                    &#x1F441;
                </button>
            </div>
            <input type="file" id="file-${rowId}" style="display:none" onchange="handleExpenseFileUpload('${rowId}', this)">
        </td>
        <td style="padding:8px; text-align:center; white-space:nowrap;">
            <button class="btn btn-sm btn-blue btn-edit-toggle" onclick="toggleExpenseLock('${rowId}')" title="Lock/Edit">
                <span class="lock-icon">&#x1F4BE;</span>
            </button>
            <button class="btn btn-sm btn-ghost btn-remove" onclick="removeExpenseRow('${rowId}')" style="color:var(--red)">&#x2715;</button>
        </td>
    `;

    tbody.appendChild(row);
    row.dataset.doc = defaultDoc || '';
    updateExpenseData(rowId);
}

function handleExpenseTypeChange(rowId, val) {
    const row = document.getElementById(rowId);
    const customInput = row.querySelector('.exp-custom-type');
    customInput.style.display = (val === 'Other') ? 'block' : 'none';
    updateExpenseData(rowId);
}

function calcExpTotal(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const net = parseFloat(row.querySelector('.exp-net').value) || 0;
    const tax = parseFloat(row.querySelector('.exp-tax').value) || 0;
    row.querySelector('.exp-total').value = (net + tax).toFixed(2);
    updateExpenseData(rowId);
}

function toggleExpenseLock(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const isLocked = row.classList.toggle('locked');
    const btn = row.querySelector('.btn-edit-toggle');
    const icon = btn.querySelector('.lock-icon');

    if (isLocked) {
        icon.innerHTML = '&#x270F;';
        btn.classList.remove('btn-blue');
        btn.classList.add('btn-ghost');
        toast('Record Locked');
    } else {
        icon.innerHTML = '&#x1F4BE;';
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-blue');
        toast('Editing Enabled');
    }
}

function uploadExpenseDoc(rowId) {
    document.getElementById('file-' + rowId).click();
}

async function handleExpenseFileUpload(rowId, input) {
    const file = input.files[0];
    if (!file) return;

    try {
        const uploadBtn = document.getElementById('btn-upload-' + rowId);
        uploadBtn.innerHTML = '...';

        const url = await uploadFileToSupabase(file, 'expenses');
        const row = document.getElementById(rowId);
        row.dataset.doc = url;

        uploadBtn.innerHTML = '&#x1F4CE;';
        uploadBtn.classList.add('btn-teal');

        const viewBtn = document.getElementById('btn-view-' + rowId);
        viewBtn.style.display = 'inline-block';

        toast('Bill uploaded to Cloud');
    } catch (e) {
        toast("Upload Failed: " + e.message, true);
    }
}

function viewExpenseDoc(rowId) {
    const row = document.getElementById(rowId);
    const data = row.dataset.doc;
    if (!data) return toast('No document found', true);

    openDocPreview(data, 'Expense Receipt Preview');
}

/*******************************************************************************
 * Added helper to convert DataURL to File object for Cloud uploads.
 ******************************************************************************/
function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

function getTradeExpenses() {
    const rows = document.querySelectorAll('#tr-expenses-body tr');
    const expenses = [];
    rows.forEach(row => {
        const selects = row.querySelectorAll('select');
        const customType = row.querySelector('.exp-custom-type');

        let type = selects[0].value;
        if (type === 'Other') type = customType.value || 'Other Expense';

        const net = parseFloat(row.querySelector('.exp-net').value) || 0;
        const tax = parseFloat(row.querySelector('.exp-tax').value) || 0;
        const total = parseFloat(row.querySelector('.exp-total').value) || 0;

        expenses.push({
            type: type,
            net_amount: net,
            tax_amount: tax,
            total_amount: total,
            amount: total,
            status: selects[1].value,
            ref: row.querySelector('input[placeholder="Ref No"]').value,
            doc: row.dataset.doc || null
        });
    });
    return expenses;
}

function removeExpenseRow(id) {
    const row = document.getElementById(id);
    if (row) row.remove();
    updateTotalExpenses();
}

// Fixed function name to match call updates
function updateExpenseData(rowId) {
    updateTotalExpenses();
}

function updateTotalExpenses() {
    const rows = document.querySelectorAll('#tr-expenses-body tr');
    let total = 0;
    rows.forEach(row => {
        const amtEl = row.querySelector('.exp-total');
        const amt = amtEl ? (parseFloat(amtEl.value) || 0) : 0;
        total += amt;
    });
    document.getElementById('tr-total-expenses').innerHTML = '&#x20B9; ' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    if (typeof calcTradeTotals === 'function') calcTradeTotals();
}

function clearExpenses() {
    const tbody = document.getElementById('tr-expenses-body');
    if (tbody) tbody.innerHTML = '';
    updateTotalExpenses();
}

/* ═══════ CONTAINER ALLOCATIONS GRID ═══════ */
function addContainerRow(data = {}) {
    const tbody = document.getElementById('tr-container-body');
    if (!tbody) return;
    
    const tr = document.createElement('tr');
    tr.style.background = 'rgba(255,255,255,0.02)';
    tr.innerHTML = `
        <td style="padding:8px;"><input class="cnt-no" value="${escH(data.container_no || '')}" placeholder="TCNU..." style="width:100%; text-transform:uppercase; background:transparent; border:1px solid var(--border); color:var(--text); padding:4px; border-radius:4px;"></td>
        <td style="padding:8px;"><input class="cnt-bl-gross" type="number" step="0.01" value="${data.bl_gross || ''}" placeholder="0.00" style="width:100%; background:transparent; border:1px solid var(--border); color:var(--text); padding:4px; border-radius:4px;" oninput="calcContainerTotals()"></td>
        <td style="padding:8px;"><input class="cnt-bl-net" type="number" step="0.01" value="${data.bl_net || ''}" placeholder="0.00" style="width:100%; background:transparent; border:1px solid var(--border); color:var(--text); padding:4px; border-radius:4px;" oninput="calcContainerTotals()"></td>
        <td style="padding:8px;"><input class="cnt-cfs" type="number" step="0.01" value="${data.cfs_wt || ''}" placeholder="0.00" style="width:100%; border:1px solid var(--gold2); background:rgba(251, 191, 36, 0.05); color:var(--text); padding:4px; border-radius:4px;" oninput="calcContainerTotals()"></td>
        <td style="padding:8px;" class="cnt-variance mono">-</td>
        <td style="padding:8px; text-align:center;"><button type="button" class="btn btn-sm btn-ghost" onclick="removeContainerRow(this)" style="color:var(--red); padding:2px 8px;">&#x2715;</button></td>
    `;
    tbody.appendChild(tr);
    calcContainerTotals();
}

function removeContainerRow(btn) {
    btn.closest('tr').remove();
    calcContainerTotals();
}

function calcContainerTotals() {
    const rows = document.querySelectorAll('#tr-container-body tr');
    let tGross = 0, tNet = 0, tCfs = 0;
    
    rows.forEach(row => {
        const gross = parseFloat(row.querySelector('.cnt-bl-gross').value) || 0;
        const net = parseFloat(row.querySelector('.cnt-bl-net').value) || 0;
        const cfs = parseFloat(row.querySelector('.cnt-cfs').value) || 0;
        
        tGross += gross; tNet += net; tCfs += cfs;
        
        const varianceEl = row.querySelector('.cnt-variance');
        if (cfs > 0 && net > 0) {
            const variance = cfs - net;
            varianceEl.textContent = variance > 0 ? '+' + variance.toFixed(2) : variance.toFixed(2);
            varianceEl.style.color = variance <= -50 ? 'var(--red)' : (variance > 0 ? 'var(--green)' : 'var(--text)');
        } else {
            varianceEl.textContent = '-';
            varianceEl.style.color = 'var(--text)';
        }
    });
    
    const grossEl = document.getElementById('tr-total-bl-gross');
    if (grossEl) grossEl.textContent = tGross.toFixed(2);
    
    const totalNetEl = document.getElementById('tr-total-bl-net');
    if (totalNetEl) {
        if (tNet > 0 && document.activeElement !== totalNetEl) {
            totalNetEl.value = tNet.toFixed(2);
        }
        const finalTotalNet = parseFloat(totalNetEl.value) || 0;
        
        const cfsEl = document.getElementById('tr-total-cfs-wt');
        if (cfsEl) cfsEl.textContent = tCfs.toFixed(2);
        
        const totalVar = tCfs > 0 ? (tCfs - finalTotalNet) : 0;
        const varEl = document.getElementById('tr-total-variance');
        if (varEl) {
            varEl.textContent = totalVar > 0 ? '+' + totalVar.toFixed(2) : totalVar.toFixed(2);
            varEl.style.color = totalVar <= -50 ? 'var(--red)' : (totalVar > 0 ? 'var(--green)' : 'var(--text)');
        }
    }
    
    if (rows.length > 0) {
        const firstRowNo = rows[0].querySelector('.cnt-no');
        if (firstRowNo) {
            const cntNos = Array.from(rows).map(r => r.querySelector('.cnt-no').value.trim()).filter(Boolean);
            document.getElementById('tr-containers').value = cntNos.join(', ');
        }
    }
}

function clearContainerGrid() {
    const tbody = document.getElementById('tr-container-body');
    if (tbody) tbody.innerHTML = '';
    calcContainerTotals();
}

function getContainerGridData() {
    const rows = document.querySelectorAll('#tr-container-body tr');
    return Array.from(rows).map(row => ({
        container_no: row.querySelector('.cnt-no').value.trim().toUpperCase(),
        bl_gross: parseFloat(row.querySelector('.cnt-bl-gross').value) || 0,
        bl_net: parseFloat(row.querySelector('.cnt-bl-net').value) || 0,
        cfs_wt: parseFloat(row.querySelector('.cnt-cfs').value) || null
    })).filter(c => c.container_no);
}

/* ═══════ CFS WEIGHING SLIP OCR SCANNER ═══════ */
async function scanCfsSlipWithAI(input, isModal = false) {
    const file = input.files[0];
    if (!file) return;

    if (!state.apiKey) return toast('Please configure AI API Key first', true);
    
    const btnId = isModal ? 'btn-modal-cfs-scan' : 'btn-cfs-scan';
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const oldBtnHtml = btn.innerHTML;
    btn.innerHTML = '&#x23F3; Scanning Slip...';
    btn.disabled = true;

    try {
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const model = state.apiModel || 'gemini-3.1-flash-lite';
        const payload = {
            contents: [{
                parts: [
                    { text: `DOMAIN: Logistics and Shipping - CFS Weighing Slip.
TASK: Extract the Container Number and the Actual Cargo Net Weight from this slip.
RULES:
1. Container number: Look for 'Container No.' (e.g., ABCD1234567). Ignore spaces/slashes.
2. Weight: Look specifically for 'Cargo Weight' or 'Net Weight'. If those aren't found, look for 'Gross Weight' but subtract any 'Tare Weight' if possible. We want the weight of the OIL inside.
3. Return the weight as a clean number (e.g., 17330.00).
Return ONLY JSON: { "container_no": "...", "cfs_weight": 0.00 }` },
                    { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }
                ]
            }]
        };

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent?key=' + state.apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("API Error " + response.status);
        const data = await response.json();
        
        if (!data || !data.candidates || !data.candidates[0]) throw new Error("Empty AI Response");
        
        let rawJson = data.candidates[0].content.parts[0].text;
        rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(rawJson);

        const results = Array.isArray(aiResponse) ? aiResponse : [aiResponse];
        let matchCount = 0;
        
        results.forEach(item => {
            if (!item.container_no) return;

            let parsedWeight = 0;
            if (item.cfs_weight !== undefined && item.cfs_weight !== null) {
                parsedWeight = parseFloat(item.cfs_weight.toString().replace(/,/g, ''));
            }

            if (isNaN(parsedWeight) || parsedWeight <= 0) return;

            const targetContainer = item.container_no.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            
            const mtyRows = document.querySelectorAll('#mty-container-tbody tr');
            if (mtyRows.length > 0) {
                mtyRows.forEach((row, rowIndex) => {
                    const rowCnt = row.cells[1].textContent.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                    if (rowCnt && targetContainer && (rowCnt === targetContainer || rowCnt.includes(targetContainer) || targetContainer.includes(rowCnt))) {
                        const cfsInput = row.querySelector('.mty-cfs');
                        if (cfsInput) {
                            cfsInput.value = parsedWeight;
                            
                            const origBg = cfsInput.style.background;
                            const origBorder = cfsInput.style.border;
                            cfsInput.style.background = 'rgba(45, 212, 191, 0.4)';
                            cfsInput.style.border = '2px solid var(--teal)';
                            setTimeout(() => {
                                cfsInput.style.background = origBg;
                                cfsInput.style.border = origBorder;
                            }, 4000);
                            
                            calcMtyRowVariance(cfsInput, rowIndex);
                            matchCount++;
                        }
                    }
                });
            } else {
                const rows = document.querySelectorAll('#tr-container-body tr');
                rows.forEach(row => {
                    const rowCnt = row.querySelector('.cnt-no').value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                    if (rowCnt && targetContainer && (rowCnt === targetContainer || (rowCnt.length >= 8 && targetContainer.includes(rowCnt)) || (targetContainer.length >= 8 && rowCnt.includes(targetContainer)))) {
                        const cfsInput = row.querySelector('.cnt-cfs');
                        cfsInput.value = parsedWeight;
                        
                        const origBg = cfsInput.style.background;
                        const origBorder = cfsInput.style.border;
                        cfsInput.style.background = 'rgba(45, 212, 191, 0.4)';
                        cfsInput.style.border = '2px solid var(--teal)';
                        setTimeout(() => {
                            cfsInput.style.background = origBg;
                            cfsInput.style.border = origBorder;
                        }, 4000);
                        
                        matchCount++;
                    }
                });
            }
        });

        if (matchCount > 0) {
            toast(`✨ Success: Matched and updated ${matchCount} container weights!`);
            const mtyRows = document.querySelectorAll('#mty-container-tbody tr');
            if (mtyRows.length === 0) calcContainerTotals();
        } else {
            toast(`Warning: Found data for ${results.length} containers but none matched your grid.`, true);
        }

    } catch (e) {
        console.error("CFS Scan Error:", e);
        toast("Scan Error: Check Console for details", true);
    } finally {
        btn.innerHTML = oldBtnHtml;
        btn.disabled = false;
        input.value = ''; 
    }
}

/* ═══════ IMPORT SHIPPING DOCUMENT CHECKLIST ═══════ */
function uploadShipDoc(btn) {
    activeShipDocItem = btn.closest('.ship-doc-item');
    document.getElementById('tr-ship-doc-upload').click();
}

async function handleShipDocUpload(input) {
    const files = input.files;
    if (!files || files.length === 0) return;

    toast("Processing Shipping Docs...");
    const type = activeShipDocItem ? activeShipDocItem.dataset.type : 'Other';

    for (let f of files) {
        try {
            const reader = new FileReader();
            const base64Data = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(f);
            });

            let url = null;
            try {
                url = await uploadFileToSupabase(f, 'shipping');
            } catch (uploadErr) {
                console.warn("Failed to upload shipping doc:", uploadErr);
            }

            const docObj = {
                name: f.name,
                data: base64Data,
                url: url,
                type: f.type
            };

            currentShipDocs.push({ name: f.name, url: url || base64Data, type: type, date: today() });
            renderShipDocs();

            if (['Bill of Lading', 'Commercial Invoice', 'Bill of Entry'].includes(type)) {
                toast(`✨ Auto-scanning ${type}...`);
                try {
                    await scanDocument(docObj, function (msg) {
                        console.log(msg);
                    });
                    toast(`✨ ${type} Scan Complete!`);
                } catch (scanErr) {
                    console.error("Auto Scan Error:", scanErr);
                    toast(`Scan failed for ${f.name}: ` + scanErr.message, true);
                }
            }
        } catch (e) {
            toast("Failed to handle " + f.name, true);
        }
    }
}

function updateShipDocType(select) {
    if (currentShipDocs['Bill of Lading']) {
        currentShipDocs['Bill of Lading'].subType = select.value;
    }
}

function renderShipDocs() {
    const list = document.getElementById('tr-ship-docs-list');
    if (!list) return;

    // Reset highlights
    document.querySelectorAll('.ship-doc-item').forEach(i => i.classList.remove('active'));

    list.innerHTML = currentShipDocs.map((doc, idx) => {
        const checklistItem = document.querySelector(`.ship-doc-item[data-type="${doc.type}"]`);
        if (checklistItem) checklistItem.classList.add('active');

        const docUrl = doc.data || doc.url;
        const icon = doc.type === 'Bill of Lading' ? '🚢' : doc.type === 'Bill of Entry' ? '📝' : '📄';

        return `
            <div class="ship-doc-badge">
                <div class="doc-info">
                    <div class="doc-icon">${icon}</div>
                    <div class="doc-text">
                        <span class="doc-type">${doc.type}</span>
                        <span class="doc-name">${doc.name}</span>
                    </div>
                </div>
                <div class="doc-actions">
                    <button class="doc-btn" onclick="openDocPreview('${docUrl}', '${doc.name} Preview')" title="View">&#x1F441;</button>
                    <button class="doc-btn" onclick="window.open('${docUrl}','_blank')" title="Download">&#x2913;</button>
                    <button class="doc-btn del" onclick="currentShipDocs.splice(${idx},1); renderShipDocs()" title="Delete">&#x2715;</button>
                </div>
            </div>
        `;
    }).join('');
}

function viewShipDoc(btn) {
    const item = btn.closest('.ship-doc-item');
    const type = item.dataset.type;
    const docObj = currentShipDocs.find(d => d.type === type);
    if (!docObj) return;
    openDocPreview(docObj.data || docObj.url, type + ' Preview');
}

function openDocPreview(data, title) {
    const modal = document.getElementById('docPreviewModal');
    const container = document.getElementById('docPreviewContainer');
    const titleEl = document.getElementById('previewDocTitle');

    if (!modal || !container) {
        window.open(data, "_blank");
        return;
    }

    titleEl.textContent = title || 'Document Preview';
    if (container.dataset.previewUrl) URL.revokeObjectURL(container.dataset.previewUrl);
    container.innerHTML = '';

    const isPdf = data.startsWith('data:application/pdf') || (typeof data === 'string' && data.toLowerCase().endsWith('.pdf'));

    if (isPdf) {
        let url = data;
        if (data.startsWith('data:')) {
            const blob = dataUriToBlob(data);
            url = URL.createObjectURL(blob);
            container.dataset.previewUrl = url;
        }
        container.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
        container.innerHTML = `<div style="width:100%; height:100%; overflow:auto; display:flex; justify-content:center; align-items:center; background:#111;">
            <img src="${data}" style="max-width:100%; max-height:100%; object-fit:contain;">
        </div>`;
    }
    modal.classList.add('show');
}

function dataUriToBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

function closeDocPreview() {
    const modal = document.getElementById('docPreviewModal');
    if (modal) modal.classList.remove('show');

    const container = document.getElementById('docPreviewContainer');
    setTimeout(() => {
        if (container.dataset.previewUrl) {
            URL.revokeObjectURL(container.dataset.previewUrl);
            delete container.dataset.previewUrl;
        }
        container.innerHTML = '';
    }, 300);
}

function deleteShipDoc(btn) {
    const item = btn.closest('.ship-doc-item');
    const type = item.dataset.type;
    delete currentShipDocs[type];
    item.classList.remove('active');
    toast(type + ' Removed');
}

/* ═══════ SUPPLIER OUTWARD PAYMENTS ═══════ */
function addPaymentRow(data) {
    const tbody = document.getElementById('tr-payments-body');
    if (!tbody) return;
    const rowId = 'pay_' + Date.now() + Math.random().toString(36).substr(2, 5);
    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'payment-row';
    row.style.borderBottom = '1px solid var(--border)';

    const dDate = data ? data.date : today();
    const dAmtInr = data ? data.amount_inr : 0;
    const dEx = data ? data.ex_rate : (parseFloat(document.getElementById('tr-ex-rate').value) || 83.5);
    const dBank = data ? data.bank_chg : 0;
    const dType = data ? data.type : 'Bank';
    const dRem = data ? data.remarks : '';

    row.innerHTML = `
        <td style="padding:8px;"><input type="date" value="${dDate}" oninput="updatePaymentSummary()"></td>
        <td style="padding:8px;"><input type="number" value="${dAmtInr}" placeholder="Amt INR" oninput="updatePaymentSummary()"></td>
        <td class="tr-pay-exrate-cell" style="padding:8px;"><input type="number" value="${dEx}" step="0.01" placeholder="Rate" oninput="updatePaymentSummary()"></td>
        <td style="padding:8px;"><input type="number" value="${dBank}" placeholder="Charges" oninput="calcTradeTotals()"></td>
        <td style="padding:8px;">
            <select onchange="updatePaymentSummary()">
                <option ${dType === 'Bank' ? 'selected' : ''}>Bank</option>
                <option ${dType === 'Yard' ? 'selected' : ''}>Yard</option>
            </select>
        </td>
        <td style="padding:8px;"><input type="text" value="${dRem}" placeholder="Ref/Remark" style="width:100%"></td>
        <td style="padding:8px; text-align:center; display:flex; gap:4px; justify-content:center;">
            <button class="btn btn-sm btn-ghost" onclick="syncSupplierPaymentToTally('${rowId}')" style="color:var(--gold2); padding:2px 6px;" title="Sync to Tally Prime">&#x21C4; Tally</button>
            <button class="btn btn-sm btn-ghost" onclick="removePaymentRow('${rowId}')" style="color:var(--red); padding:2px 6px;">&#x2715;</button>
        </td>
    `;
    tbody.appendChild(row);
    updatePaymentSummary();
}

function removePaymentRow(id) {
    const row = document.getElementById(id);
    if (row) row.remove();
    updatePaymentSummary();
    calcTradeTotals();
}

function updatePaymentSummary() {
    const rows = document.querySelectorAll('#tr-payments-body tr');
    const mainCurr = document.getElementById('tr-imp-curr') ? document.getElementById('tr-imp-curr').value : 'USD';
    const univRate = parseFloat(document.getElementById('tr-pay-univ-rate') ? document.getElementById('tr-pay-univ-rate').value : 3.6725) || 3.6725;

    const isLocalBuy = document.getElementById('tr-type').value === 'Buy' && document.getElementById('tr-mode').value === 'local';

    // Toggle Ex. Rate column visibility
    document.querySelectorAll('.tr-pay-exrate-cell').forEach(el => {
        el.style.display = isLocalBuy ? 'none' : 'table-cell';
    });
    const univRateCont = document.getElementById('tr-pay-univ-rate-container');
    if (univRateCont) {
        univRateCont.style.display = isLocalBuy ? 'none' : 'inline-block';
    }

    let totalInMainCurr = 0;
    let totalBankINR = 0;
    let totalBankPaidINR = 0;
    let totalYardPaidINR = 0;

    let totalINRForAvg = 0;
    let totalForeignForAvg = 0;
    let lastValidRate = 0;

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        const amtInr = parseFloat(inputs[1].value) || 0;
        const exRate = isLocalBuy ? 1 : (parseFloat(inputs[2].value) || 0);
        const bank = parseFloat(inputs[3].value) || 0;
        totalBankINR += bank;
        
        const type = select ? select.value : 'Bank';
        if (type === 'Bank') {
            totalBankPaidINR += amtInr;
        } else if (type === 'Yard') {
            totalYardPaidINR += amtInr;
        }
        
        if (exRate > 0) {
            totalInMainCurr += (amtInr / exRate);
            totalINRForAvg += amtInr;
            totalForeignForAvg += (amtInr / exRate);
            lastValidRate = exRate;
        }
    });

    if (!isLocalBuy) {
        const mainExField = document.getElementById('tr-ex-rate');
        if (mainExField && document.activeElement !== mainExField) {
            const avgEx = totalForeignForAvg > 0 ? (totalINRForAvg / totalForeignForAvg) : lastValidRate;
            if (avgEx > 0) {
                const currentVal = parseFloat(mainExField.value) || 0;
                if (Math.abs(currentVal - avgEx) > 0.001) {
                    mainExField.value = avgEx.toFixed(3);
                    if (typeof calcTradeTotals === 'function') calcTradeTotals();
                }
            }
        }
    }

    const totalPaidInr = totalBankPaidINR + totalYardPaidINR;
    const dualCont = document.getElementById('tr-pay-total-dual');
    if (dualCont) {
        if (isLocalBuy) {
            dualCont.innerHTML = `
                <span style="color:var(--text); font-weight:bold;">₹ ${totalPaidInr.toLocaleString('en-IN')}</span>
            `;
        } else {
            let totalUSD = 0, totalAED = 0;
            if (mainCurr === 'USD') {
                totalUSD = totalInMainCurr;
                totalAED = totalUSD * univRate;
            } else {
                totalAED = totalInMainCurr;
                totalUSD = totalAED / univRate;
            }

            dualCont.innerHTML = `
                <span style="color:var(--text)">USD ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span style="color:var(--muted)">AED ${totalAED.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            `;
        }
    }

    const tblBank = document.getElementById('tr-pay-total-bank');
    if (tblBank) tblBank.textContent = '₹ ' + totalBankINR.toLocaleString('en-IN');
    
    const tblBankPaid = document.getElementById('tr-pay-total-bank-paid');
    if (tblBankPaid) tblBankPaid.textContent = '₹ ' + totalBankPaidINR.toLocaleString('en-IN');
    
    const tblYardPaid = document.getElementById('tr-pay-total-yard-paid');
    if (tblYardPaid) tblYardPaid.textContent = '₹ ' + totalYardPaidINR.toLocaleString('en-IN');

    // Balance calculation
    let isFullyPaid = false;
    const balEl = document.getElementById('tr-pay-balance-dual');
    if (balEl) {
        if (isLocalBuy) {
            const totalDueINR = parseFloat(document.getElementById('tr-total-inr-shared').value) || 0;
            const balanceINR = totalDueINR - totalPaidInr;
            balEl.innerHTML = `
                <span style="color:${balanceINR > 0.05 ? 'var(--red)' : 'var(--green)'}">Bal: ₹ ${balanceINR > 0 ? balanceINR.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
            `;
            isFullyPaid = (balanceINR <= 0.05 && totalDueINR > 0);
        } else {
            const qty = parseFloat(document.getElementById('tr-vol').value) || 0;
            const rate = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
            const totalDueInMain = qty * rate;
            const balInMain = totalDueInMain - totalInMainCurr;

            let balUSD = 0, balAED = 0;
            if (mainCurr === 'USD') {
                balUSD = balInMain;
                balAED = balUSD * univRate;
            } else {
                balAED = balInMain;
                balUSD = balAED / univRate;
            }

            balEl.innerHTML = `
                <span style="color:${balUSD > 0.05 ? 'var(--red)' : 'var(--green)'}">Bal: USD ${balUSD > 0 ? balUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                <span style="color:var(--muted); font-size:9px;">Bal: AED ${balAED > 0 ? balAED.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
            `;
            isFullyPaid = (balInMain <= 0.05 && totalDueInMain > 0);
        }
    }

    const payStatusEl = document.getElementById('tr-payment-status');
    if (payStatusEl) {
        payStatusEl.style.display = isFullyPaid ? 'block' : 'none';
    }
}

function getSupplierPayments() {
    const rows = document.querySelectorAll('#tr-payments-body tr');
    const payments = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        payments.push({
            date: inputs[0].value,
            amount_inr: parseFloat(inputs[1].value) || 0,
            ex_rate: parseFloat(inputs[2].value) || 0,
            bank_chg: parseFloat(inputs[3].value) || 0,
            type: select.value,
            remarks: inputs[4].value
        });
    });
    return payments;
}

function clearSupplierData() {
    const body = document.getElementById('tr-payments-body');
    if (body) body.innerHTML = '';
    currentShipDocs = [];
    currentTradeDocs = [];
    document.querySelectorAll('.ship-doc-item').forEach(i => {
        i.classList.remove('active');
    });
    renderShipDocs();
    renderTradeDocs();
    updatePaymentSummary();
}

/* ═══════ BUYER INWARD RECEIVES ═══════ */
function addBuyerPaymentRow(data) {
    const tbody = document.getElementById('tr-buyer-payments-body');
    if (!tbody) return;
    const rowId = 'bpay_' + Date.now() + Math.random().toString(36).substr(2, 5);
    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'buyer-payment-row';
    row.style.borderBottom = '1px solid var(--border)';

    const dDate = data ? data.date : today();
    const dAmt = data ? data.amount : 0;
    const dType = data ? data.type : 'Bank';
    const dRem = data ? data.remarks : '';

    row.innerHTML = `
        <td style="padding:8px;"><input type="date" value="${dDate}" oninput="updateBuyerPaymentSummary()"></td>
        <td style="padding:8px;"><input type="number" value="${dAmt}" placeholder="Amount" oninput="updateBuyerPaymentSummary()"></td>
        <td style="padding:8px;">
            <select onchange="updateBuyerPaymentSummary()">
                <option ${dType === 'Bank' ? 'selected' : ''}>Bank</option>
                <option ${dType === 'Yard' ? 'selected' : ''}>Yard</option>
            </select>
        </td>
        <td style="padding:8px;"><input type="text" value="${dRem}" placeholder="Ref/Remark" style="width:100%"></td>
        <td style="padding:8px; text-align:center; display:flex; gap:4px; justify-content:center;">
            <button class="btn btn-sm btn-ghost" onclick="syncBuyerPaymentToTally('${rowId}')" style="color:var(--gold2); padding:2px 6px;" title="Sync to Tally Prime">&#x21C4; Tally</button>
            <button class="btn btn-sm btn-ghost" onclick="removeBuyerPaymentRow('${rowId}')" style="color:var(--red); padding:2px 6px;">&#x2715;</button>
        </td>
    `;
    tbody.appendChild(row);
    updateBuyerPaymentSummary();
}

function removeBuyerPaymentRow(id) {
    const row = document.getElementById(id);
    if (row) row.remove();
    updateBuyerPaymentSummary();
}

function updateBuyerPaymentSummary() {
    const rows = document.querySelectorAll('#tr-buyer-payments-body tr');
    const invAmtEl = document.getElementById('tr-sale-inv-amt');
    if (!invAmtEl) return;
    const invAmt = parseFloat(invAmtEl.value) || 0;

    let totalRec = 0;
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        totalRec += parseFloat(inputs[1].value) || 0;
    });

    const recEl = document.getElementById('tr-buy-total-rec');
    if (recEl) recEl.textContent = '₹ ' + totalRec.toLocaleString('en-IN');

    const balEl = document.getElementById('tr-buy-balance');
    if (balEl) {
        const balance = invAmt - totalRec;
        balEl.textContent = '₹ ' + balance.toLocaleString('en-IN');
        balEl.style.color = balance > 0 ? 'var(--red)' : 'var(--green)';
    }
}

function getBuyerPayments() {
    const rows = document.querySelectorAll('#tr-buyer-payments-body tr');
    const payments = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        payments.push({
            date: inputs[0].value,
            amount: parseFloat(inputs[1].value) || 0,
            type: select.value,
            remarks: inputs[2].value
        });
    });
    return payments;
}

function clearBuyerData() {
    const body = document.getElementById('tr-buyer-payments-body');
    if (body) body.innerHTML = '';
    const invAmtEl = document.getElementById('tr-sale-inv-amt');
    if (invAmtEl) invAmtEl.value = '';
    updateBuyerPaymentSummary();
}

/* ═══════ UTILITIES & FORM AUTOFILLS ═══════ */
function loadDealDetails() {
    var id = document.getElementById('tr-sale-deal').value;
    if (!id) return;
    var order = state.orders.find(function (o) { return o.id === id; });
    if (!order) return;

    document.getElementById('tr-product').value = order.product;
    document.getElementById('tr-density').value = order.density || 0.850;

    const unitEl = document.getElementById('tr-unit');
    const isKG = order.unit === 'KG';
    if (unitEl) unitEl.value = isKG ? 'KG' : 'LITRE';

    document.getElementById('tr-vol').value = isKG ? (order.qty_kg || (order.qty * (order.density || 0.850))) : order.qty;

    const rateEl = document.getElementById('tr-price-local');
    if (rateEl) {
        rateEl.value = isKG ? (order.price_kg || (order.price / (order.density || 0.850))) : order.price;
    }

    const partySel = document.getElementById('tr-party-select');
    if (partySel) {
        const options = Array.from(partySel.options);
        const target = options.find(function (o) { return o.text === order.customer; });
        if (target) {
            partySel.value = target.value;
        } else {
            const partyInput = document.getElementById('tr-party');
            if (partyInput) partyInput.value = order.customer;
        }
    }

    const invAmtEl = document.getElementById('tr-sale-inv-amt');
    if (invAmtEl) {
        const qty = isKG ? (order.qty_kg || (order.qty * (order.density || 0.850))) : order.qty;
        const rate = isKG ? (order.price_kg || (order.price / (order.density || 0.850))) : order.price;
        invAmtEl.value = (qty * rate).toFixed(2);
    }

    populateSourceLocations();
    calcTradeTotals();
    updateBuyerPaymentSummary();

    toast('Loaded Order: ' + id + ' (' + (isKG ? 'KG' : 'Litre') + ' basis)');
}

function populateSourceLocations() {
    const sel = document.getElementById('tr-source-loc');
    const product = document.getElementById('tr-product').value;
    if (!sel) return;

    // Build stock map: { tankId -> totalVolume } for the selected product
    const stockMap = {};
    (state.inventory || []).forEach(i => {
        if (!i.location) return;
        if (product && i.product !== product) return;
        stockMap[i.location] = (stockMap[i.location] || 0) + i.vol;
    });

    let html = '<option value="">-- Select Source --</option>';

    // Group tanks by yard (same as storage-loc dropdown)
    const yards = [...new Set((state.tanks || []).map(t => t.location).filter(Boolean))];
    yards.forEach(y => {
        html += '<optgroup label="' + escH(y) + '">';
        (state.tanks || []).filter(t => t.location === y).forEach(t => {
            const avail = stockMap[t.id] || 0;
            const availKg = avail * (parseFloat(document.getElementById('tr-density') ? document.getElementById('tr-density').value : 0) || 0.850);
            const stockInfo = avail > 0 ? fmtN(availKg.toFixed(0)) + ' KG avail' : 'EMPTY';
            html += '<option value="' + t.id + '">' + escH(t.name) + ' — ' + stockInfo + '</option>';
        });
        html += '</optgroup>';
    });

    sel.innerHTML = html;
}

function checkSourceStock() {
    const loc = document.getElementById('tr-source-loc').value;
    const product = document.getElementById('tr-product').value;
    const infoEl = document.getElementById('tr-avail-stock');

    if (!loc) {
        if (infoEl) infoEl.style.display = 'none';
        return;
    }

    const relevant = (state.inventory || []).filter(i =>
        i.location === loc && (!product || i.product === product)
    );
    const totalVol = relevant.reduce((sum, i) => sum + i.vol, 0);
    const den = parseFloat(document.getElementById('tr-density').value) || 0.850;
    const totalKg = totalVol * den;

    const tank = (state.tanks || []).find(t => t.id === loc);
    const tankLabel = tank ? (tank.name + ' @ ' + tank.location) : loc;

    if (infoEl) {
        infoEl.textContent = tankLabel + ' — ' + fmtN(totalKg.toFixed(0)) + ' KG / ' + fmtN(totalVol.toFixed(0)) + ' L available';
        infoEl.style.display = 'block';
        infoEl.style.color = totalVol <= 0 ? 'var(--red)' : 'var(--teal)';
    }
}

function syncWeightToQty() {
    var netWeight = parseFloat(document.getElementById('tr-net-weight').value) || 0;
    var density = parseFloat(document.getElementById('tr-density').value) || 0.850;
    var unit = document.getElementById('tr-unit').value;
    var qtyInput = document.getElementById('tr-vol');

    if (netWeight === 0) return;

    if (unit === 'KG') {
        qtyInput.value = netWeight.toFixed(2);
    } else if (unit === 'LITRE') {
        if (density > 0) {
            qtyInput.value = (netWeight / density).toFixed(0);
        }
    } else if (unit === 'MTON') {
        qtyInput.value = (netWeight / 1000).toFixed(3);
    }

    if (typeof calcTradeTotals === 'function') calcTradeTotals();
    if (typeof calcImportTotal === 'function') calcImportTotal();
}

/* ═══════ HIGH SEAS DEAL PREVIEWS ═══════ */
function openHssModal() {
    const buyId = document.getElementById('tr-party').value;
    const buyer = state.buyers.find(b => b.id === buyId);
    if (buyer) {
        document.getElementById('hss-p-iec').value = buyer.iec || '';
    }
    
    // Check if it is a Sell deal being opened
    var type = document.getElementById('tr-type').value;
    var product = document.getElementById('tr-product').value;
    var party = document.getElementById('tr-party-select-wrap').style.display !== 'none' ? document.getElementById('tr-party-select').value : document.getElementById('tr-party').value;
    var rawQty = parseFloat(document.getElementById('tr-vol').value);
    var den = parseFloat(document.getElementById('tr-density').value) || getDensity(product);
    var unit = document.getElementById('tr-unit').value;
    var date = document.getElementById('tr-date').value || today();
    var isHss = document.getElementById('tr-mode').value === 'hs_sale';

    var vol = rawQty;
    if (unit === 'KG') vol = rawQty / den;
    if (unit === 'MTON') vol = (rawQty * 1000) / den;

    var price = parseFloat(document.getElementById('tr-imp-rate').value) || 0;

    var trade = {
        id: state.nextTradeId++,
        type: type,
        product: product,
        party: party,
        vol: vol,
        price: price,
        date: date,
        density: den,
        raw_qty: rawQty,
        unit: unit,
        hss: isHss,
        ship_docs: Object.assign({}, currentShipDocs),
        expenses: JSON.parse(JSON.stringify(currentTradeExpenses)),
        location: document.getElementById('tr-storage-loc').value
    };

    if (type === 'Buy' && !isHss) {
        var weightKg = toKG(vol, den);
        state.inventory.push({
            id: state.nextInvId++,
            trade_id: trade.id,
            product: product,
            vol: vol,
            density: den,
            weight_kg: weightKg,
            location: trade.location,
            date: date
        });
    }

    if (isHss) {
        trade.hss_purchase_rate = parseFloat(document.getElementById('hss-purchase-rate') ? document.getElementById('hss-purchase-rate').value : 0) || 0;
        trade.hss_currency = document.getElementById('hss-currency') ? document.getElementById('hss-currency').value : 'USD';
        trade.hss_ex_rate = parseFloat(document.getElementById('hss-ex-rate') ? document.getElementById('hss-ex-rate').value : 1) || 1;
        trade.hss_bl_no = document.getElementById('hss-bl-no') ? document.getElementById('hss-bl-no').value : '';
        trade.hss_vessel = document.getElementById('hss-vessel') ? document.getElementById('hss-vessel').value : '';
        trade.hss_port_loading = document.getElementById('hss-port-loading') ? document.getElementById('hss-port-loading').value : '';
        trade.hss_port_discharge = document.getElementById('hss-port-discharge') ? document.getElementById('hss-port-discharge').value : '';
        trade.hss_agent = document.getElementById('hss-agent') ? document.getElementById('hss-agent').value : '';
        trade.hss_containers = document.getElementById('hss-containers') ? document.getElementById('hss-containers').value : '';
        trade.hss_hs_code = document.getElementById('hss-hs-code') ? document.getElementById('hss-hs-code').value : '';
        trade.hss_net_weight = parseFloat(document.getElementById('hss-net-weight') ? document.getElementById('hss-net-weight').value : 0) || 0;
    }
    document.getElementById('hssModal').classList.add('show');
    renderHssPreviews();
}

function closeHssModal() {
    document.getElementById('hssModal').classList.remove('show');
}

function renderHssPreviews() {
    const qty = parseFloat(document.getElementById('tr-vol').value) || 0;
    const rate = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
    const ex = parseFloat(document.getElementById('tr-ex-rate').value) || 1;
    const profitPct = parseFloat(document.getElementById('hss-profit') ? document.getElementById('hss-profit').value : 2.0) || 2.0;
    const product = document.getElementById('tr-product').value;
    const seller = document.getElementById('tr-hs-seller').value;
    const buyerId = document.getElementById('tr-party-select').value || document.getElementById('tr-party').value;
    const buyerObj = state.buyers.find(b => b.name === buyerId) || { name: buyerId, city: '' };
    const vessel = document.getElementById('tr-vessel').value;
    const blNo = document.getElementById('tr-bl-no').value;
    const curr = document.getElementById('tr-imp-curr').value;
    const invNo = document.getElementById('hss-inv-no') ? document.getElementById('hss-inv-no').value : 'HSS-' + Date.now().toString().substr(-4);
    const pIec = document.getElementById('hss-p-iec') ? document.getElementById('hss-p-iec').value : '';

    const co = (state && state.company) ? state.company : {};
    const myName = co.name || 'MURJI RAVJI AND COMPANY';
    const myAddr = co.addr || 'Shop No. 410, Plot No. DHH, Sector 12, Prime Mall, Kutch, Gandhidham, Gujarat 370201';
    const myGstin = co.gstin || '27ABRFM5531F1ZJ';

    const cifValFor = qty * rate;
    const cifValInr = cifValFor * ex;
    const profitAmt = (cifValInr * profitPct) / 100;
    const saleConsideration = cifValInr + profitAmt;

    const previews = document.getElementById('hss-previews');
    if (!previews) return;
    
    previews.innerHTML = `
        <div class="hss-print-page" id="hss-p1">
            <h1>HIGH SEAS SALE AGREEMENT</h1>
            <table class="no-border">
                <tr><td>1. NAME & ADDRESS OF IMPORTER</td><td>: ${escH(myName)}</td></tr>
                <tr><td>2. IMPORT EXPORT CODE NUMBER</td><td>: ABRFM5531E</td></tr>
                <tr><td>3. NAME & ADDRESS OF PURCHASER</td><td>: ${escH(buyerObj.name)}</td></tr>
                <tr><td>4. IMPORT EXPORT CODE NUMBER</td><td>: ${escH(pIec)}</td></tr>
                <tr><td>5. DESCRIPTION OF GOODS SOLD</td><td>: ${escH(product)}</td></tr>
                <tr><td>6. QUANTITY</td><td>: ${(qty / 1000).toFixed(2)} MT</td></tr>
                <tr><td>7. NAME & ADDRESS OF SUPPLIER</td><td>: ${escH(seller)}</td></tr>
                <tr><td>8. INVOICE NO & DATE</td><td>: ${escH(invNo)} DT: ${today()}</td></tr>
                <tr><td>9. NAME OF THE VESSEL</td><td>: ${escH(vessel)}</td></tr>
                <tr><td>10. BILL OF LANDING NO. & DATE</td><td>: ${escH(blNo)}</td></tr>
                <tr><td>11. VALUE OF CONSIGNMENT</td><td>: ${curr} ${cifValFor.toLocaleString()}</td></tr>
                <tr><td>12. SALE CONSIDERATION</td><td>: INR ${saleConsideration.toLocaleString()} (CIF VALUE + ${profitPct}% PROFIT)</td></tr>
            </table>
            <p style="margin-top:20px; font-size:11px;">13. PAYMENT: Payment should be made to the seller as per high seas sale debit note...</p>
            <p style="font-size:11px;">14. DELIVERY: All the right and the title of the goods will be transferred from sellers to the buyer...</p>
            <div class="signature-row">
                <div>For, ${escH(myName)}<br><br><br>Authorized Signatory</div>
                <div>For, ${escH(buyerObj.name)}<br><br><br>Authorized Signatory</div>
            </div>
        </div>

        <div class="hss-print-page" id="hss-p2">
            <div class="letterhead">
                <h3>${escH(myName)}</h3>
                <p>${escH(myAddr)}</p>
                <p>GSTIN: ${escH(myGstin)} | IEC: ABRFM5531E</p>
            </div>
            <h2 style="text-decoration:none;">HIGH SEAS INVOICE</h2>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:12px;">
                <div><strong>Bill To:</strong><br>${escH(buyerObj.name)}<br>${escH(buyerObj.city || '')}</div>
                <div>Invoice No: ${escH(invNo)}<br>Date: ${today()}</div>
            </div>
            <table>
                <thead><tr style="background:#f4f4f4;"><th>Description of Goods</th><th>Quantity</th><th>Rate</th><th>Amount (INR)</th></tr></thead>
                <tbody>
                    <tr><td>${escH(product)}<br><small>FOR INDUSTRIAL USE ONLY</small></td><td>${qty.toLocaleString()} KG</td><td>${(saleConsideration / qty).toFixed(2)}</td><td>${saleConsideration.toLocaleString()}</td></tr>
                    <tr style="font-weight:bold;"><td colspan="3" style="text-align:right;">High Seas Commission (Round Off)</td><td>INC.</td></tr>
                    <tr style="font-weight:bold; background:#f4f4f4;"><td colspan="3" style="text-align:right;">Total Value</td><td>INR ${saleConsideration.toLocaleString()}</td></tr>
                </tbody>
            </table>
            <p style="font-size:11px; margin-top:10px;">Amount in words: INR ${saleConsideration.toFixed(0)} Only</p>
            <div class="signature-row" style="margin-top:40px;">
                <div style="border:1px solid #ccc; padding:10px; width:200px; height:80px; font-size:10px;">Receiver's Signature</div>
                <div style="text-align:right;">For, ${escH(myName)}<br><br><br>Authorized Signatory</div>
            </div>
        </div>

        <div class="hss-print-page" id="hss-p3">
            <div class="letterhead">
                <h3>${escH(myName)}</h3>
                <p>Oil Trading & Logistics | Gandhidham, India</p>
            </div>
            <div style="text-align:right; margin-bottom:20px;">DATE: ${today()}</div>
            <p>TO,<br>The Asstt. / Dy. Commissioner of Customs<br>Import Section<br>Mundra Port Mundra, India.</p>
            <p style="margin-top:20px;">Sub: <strong>HIGH SEAS PURCHASE LETTER</strong></p>
            <p>Ref: Cargo Description: ${escH(product)}<br>NET WEIGHT: ${qty.toLocaleString()} KG<br>B/L NO: ${escH(blNo)}</p>
            <p style="margin-top:20px;">Dear Sir,<br>With reference to the above subject, we wish to inform that we have purchased ${escH(product)} on high seas sales as per the High Seas Purchase Agreement enclosed.</p>
            <p>The subject consignment is covered under Bill of Lading No: ${escH(blNo)}</p>
            <p>Kindly do the need full and oblige. Thanking you.</p>
            <div class="signature-row" style="margin-top:80px;">
                <div>Yours faithfully,<br>For, ${escH(myName)}<br><br><br>(Authorized Signatory)</div>
            </div>
        </div>
    `;
}

async function downloadAllHssDocs() {
    const container = document.getElementById('hss-print-container');
    if (!container) return;
    container.innerHTML = document.getElementById('hss-previews').innerHTML;

    const opt = {
        margin: [10, 5],
        filename: 'High_Seas_Docs_' + Date.now() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    toast('Generating PDFs... Please wait.');
    setTimeout(() => {
        html2pdf().set(opt).from(container).save().then(() => {
            toast('High Seas Set Downloaded');
        });
    }, 100);
}

/* ═══════ FIELD VISIBILITY AND CALCULATIONS ═══════ */
function populateTradeParties() {
    var type = document.getElementById('tr-type').value;
    var selectWrap = document.getElementById('tr-party-select-wrap');
    var inputWrap = document.getElementById('tr-party-input-wrap');
    var sel = document.getElementById('tr-party-select');
    if (!sel || !selectWrap || !inputWrap) return;

    if (type === 'Buy') {
        selectWrap.style.display = 'block';
        inputWrap.style.display = 'none';
        sel.innerHTML = '<option value="">-- Select Supplier --</option>' +
            (state.suppliers || []).map(function (s) { return '<option value="' + escH(s.name) + '">' + escH(s.name) + '</option>'; }).join('');
    } else if (type === 'Sell') {
        selectWrap.style.display = 'block';
        inputWrap.style.display = 'none';
        sel.innerHTML = '<option value="">-- Select Buyer --</option>' +
            (state.buyers || []).map(function (b) { return '<option value="' + escH(b.name) + '">' + escH(b.name) + '</option>'; }).join('');
    } else {
        selectWrap.style.display = 'none';
        inputWrap.style.display = 'block';
    }

    var shipToSel = document.getElementById('tr-ship-to-select');
    if (shipToSel) {
        shipToSel.innerHTML = '<option value="">-- Same as Party --</option>' +
            (state.buyers || []).map(function (b) { return '<option value="' + escH(b.name) + '">' + escH(b.name) + '</option>'; }).join('');
    }
}

function syncCustomsDutyToExpenses() {
    const dutyVal = parseFloat(document.getElementById('tr-duty-amt').value) || 0;
    const fineVal = parseFloat(document.getElementById('tr-boe-fine').value) || 0;
    const penaltyVal = parseFloat(document.getElementById('tr-boe-penalty').value) || 0;
    const interestVal = parseFloat(document.getElementById('tr-boe-interest').value) || 0;
    
    const totalCustoms = dutyVal + fineVal + penaltyVal + interestVal;
    const boeNo = (document.getElementById('tr-boe-no').value || '').trim();
    
    const tbody = document.getElementById('tr-expenses-body');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('.expense-row');
    let customsRow = null;
    
    for (let row of rows) {
        const select = row.querySelector('select');
        if (select && select.value === 'Customs Duty') {
            customsRow = row;
            break;
        }
    }
    
    if (customsRow) {
        if (totalCustoms > 0) {
            customsRow.querySelector('.exp-net').value = totalCustoms.toFixed(2);
            customsRow.querySelector('.exp-tax').value = '0.00';
            customsRow.querySelector('.exp-total').value = totalCustoms.toFixed(2);
            const refInput = customsRow.querySelector('td:nth-child(7) input');
            if (refInput && boeNo && !refInput.value) {
                refInput.value = 'BOE: ' + boeNo;
            }
        } else {
            customsRow.remove();
        }
    } else if (totalCustoms > 0) {
        addExpenseRow({
            type: 'Customs Duty',
            net_amount: totalCustoms,
            tax_amount: 0,
            amount: totalCustoms,
            status: 'Pending',
            ref: boeNo ? 'BOE: ' + boeNo : '',
            date: document.getElementById('tr-boe-date').value || today()
        });
    }
}

function calcTradeTotals() {
    var rawQty = parseFloat(document.getElementById('tr-vol').value) || 0;
    var den = parseFloat(document.getElementById('tr-density').value) || 0.85;
    var unit = document.getElementById('tr-unit').value;
    var mode = document.getElementById('tr-mode').value;

    var price = 0;
    if (mode === 'import' || mode === 'hs_sale') {
        price = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
        if (mode === 'import') {
            var ex = parseFloat(document.getElementById('tr-ex-rate').value) || 1;
            price = price * ex;
        }
    } else {
        price = parseFloat(document.getElementById('tr-price-local').value) || 0;
    }

    var basicInr = rawQty * price;

    // Add Logistics Expenses
    var logRows = document.querySelectorAll('#tr-expenses-body tr');
    var logTotal = 0;
    logRows.forEach(row => {
        const amtEl = row.querySelector('.exp-total');
        const amt = amtEl ? (parseFloat(amtEl.value) || 0) : 0;
        logTotal += amt;
    });

    // Add Bank Charges from Payments
    var payRows = document.querySelectorAll('#tr-payments-body tr');
    var bankTotal = 0;
    payRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs && inputs.length > 3) bankTotal += parseFloat(inputs[3].value) || 0;
    });

    // Add Tank/Extra Cost if import
    var tankCost = 0;
    if (mode === 'import') {
        var contCount = parseFloat(document.getElementById('tr-container-count').value) || 0;
        var tankRateUSD = parseFloat(document.getElementById('tr-tank-rate').value) || 0;
        var ex = parseFloat(document.getElementById('tr-ex-rate').value) || 1;
        tankCost = contCount * tankRateUSD * ex;
        const tankCostEl = document.getElementById('tr-tank-cost');
        if (tankCostEl) tankCostEl.value = fmtN(tankCost);
    }

    var totalInr = basicInr + logTotal + bankTotal + tankCost;
    const totalInrEl = document.getElementById('tr-total-inr-shared');
    if (totalInrEl) totalInrEl.value = fmt(totalInr);

    // Update Foreign Total
    if (mode === 'import' || mode === 'hs_sale') {
        var qtyFor = parseFloat(document.getElementById('tr-vol').value) || 0;
        var rateFor = parseFloat(document.getElementById('tr-imp-rate').value) || 0;
        const totalForEl = document.getElementById('tr-total-for');
        if (totalForEl) totalForEl.value = (qtyFor * rateFor).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }

    // Toggle High Seas Purchase fields
    var isHS = document.getElementById('tr-is-hs') ? document.getElementById('tr-is-hs').checked : false;
    var hsFields = document.getElementById('tr-hs-purchase-fields');
    if (hsFields) hsFields.style.display = isHS ? 'grid' : 'none';

    updatePaymentSummary();

    // Dual Landed Cost calculation
    if (totalInr > 0) {
        var volL = 0;
        if (unit === 'LITRE') volL = rawQty;
        else if (unit === 'KG') volL = rawQty / den;
        else if (unit === 'MTON') volL = (rawQty * 1000) / den;

        var volKG = volL * den;

        const landedLEl = document.getElementById('tr-landed-l');
        const landedKgEl = document.getElementById('tr-landed-kg');
        if (landedLEl) landedLEl.value = '₹ ' + (totalInr / volL).toFixed(2);
        if (landedKgEl) landedKgEl.value = '₹ ' + (totalInr / volKG).toFixed(2);
    } else {
        const landedLEl = document.getElementById('tr-landed-l');
        const landedKgEl = document.getElementById('tr-landed-kg');
        if (landedLEl) landedLEl.value = '';
        if (landedKgEl) landedKgEl.value = '';
    }
    calcTradeBreakdown();
}

function getTradeQtyKG() {
    var rawQty = parseFloat(document.getElementById('tr-vol').value) || 0;
    var den = parseFloat(document.getElementById('tr-density').value) || 0.85;
    var unit = document.getElementById('tr-unit').value;

    if (unit === 'KG') return rawQty;
    if (unit === 'MTON') return rawQty * 1000;
    return rawQty * den;
}

function calcTradeBreakdown() {
    var qtyKG = getTradeQtyKG();
    var dealRate = parseFloat(document.getElementById('tr-deal-rate') ? document.getElementById('tr-deal-rate').value : 0) || 0;
    var taxRate = parseFloat(document.getElementById('tr-tax-rate') ? document.getElementById('tr-tax-rate').value : 0) || 0;
    var taxPct = parseFloat(document.getElementById('tr-tax-pct') ? document.getElementById('tr-tax-pct').value : 18) || 0;

    var taxableAmt = qtyKG * taxRate;
    var taxAmt = taxableAmt * taxPct / 100;
    var tAmt = taxableAmt + taxAmt;
    var dealAmt = qtyKG * dealRate;
    var yChgs = dealAmt - tAmt;

    var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = '₹ ' + fmt(v); };
    set('tr-calc-taxable', taxableAmt);
    set('tr-calc-tax', taxAmt);
    set('tr-calc-tamt', tAmt);
    set('tr-calc-deal', dealAmt);
    set('tr-calc-ychgs', yChgs);
}

function syncTaxRateToPriceLocal() {
    const taxRateVal = document.getElementById('tr-tax-rate').value;
    document.getElementById('tr-price-local').value = taxRateVal;
}

function syncPriceLocalToTaxRate() {
    const priceVal = document.getElementById('tr-price-local').value;
    document.getElementById('tr-tax-rate').value = priceVal;
}

function toggleTradeModeField() {
    var type = document.getElementById('tr-type').value;
    var modeGrp = document.getElementById('tr-mode-group');
    var modeSel = document.getElementById('tr-mode');

    populateTradeParties();

    var oldVal = modeSel.value;
    if (type === 'Buy') {
        modeSel.innerHTML = '<option value="local">Local Purchase</option><option value="import">Import Purchase</option>';
    } else {
        modeSel.innerHTML = '<option value="local">Local Sale</option><option value="hs_sale">High Seas Sale</option>';
    }
    if (modeSel.querySelector('option[value="' + oldVal + '"]')) modeSel.value = oldVal;

    modeGrp.style.display = 'flex';
    toggleTradeDetailFields();
}

function toggleDeliveryDest() {
    var mode = document.getElementById('tr-delivery-mode') ? document.getElementById('tr-delivery-mode').value : '';
    var destGrp = document.getElementById('tr-delivery-dest-group');
    if (destGrp) destGrp.style.display = (mode === 'door') ? 'block' : 'none';
}

function toggleTradeDetailFields() {
    var type = document.getElementById('tr-type').value;
    var mode = document.getElementById('tr-mode').value;
    var imp = document.querySelector('.tr-import-fields');
    var locs = document.querySelectorAll('.tr-local-fields');
    var linkGrp = document.getElementById('tr-link-group');
    var srcGrp = document.getElementById('tr-source-loc-group');
    var destGrp = document.getElementById('tr-dest-loc-group');
    var delivModeGrp = document.getElementById('tr-delivery-mode-group');

    // Source (FROM) only visible for Sell-Local and Move
    if (srcGrp) srcGrp.style.display = (type === 'Move' || (type === 'Sell' && mode === 'local')) ? 'block' : 'none';
    if (srcGrp && srcGrp.style.display === 'block') populateSourceLocations();

    // Delivery Mode (Ex-Yard / Door) — only for Sell-Local
    if (delivModeGrp) delivModeGrp.style.display = (type === 'Sell' && mode === 'local') ? 'block' : 'none';
    toggleDeliveryDest();

    // Destination (TO / Storage) only visible for Buy and Move — NOT for Sell
    if (destGrp) destGrp.style.display = (type === 'Buy' || type === 'Move') ? 'block' : 'none';

    if (type === 'Move') {
        if (imp) imp.style.display = 'none';
        locs.forEach(function (el) { el.style.display = 'grid'; });
        if (linkGrp) linkGrp.style.display = 'none';
        document.getElementById('tr-payments-section').style.display = 'none';
        return;
    }

    if (type === 'Buy') {
        if (linkGrp) linkGrp.style.display = 'none';
        if (mode === 'import') {
            if (imp) imp.style.display = 'grid';
            locs.forEach(function (el) { el.style.display = 'none'; });
            document.getElementById('tr-payments-section').style.display = 'block';
            document.getElementById('tr-buyer-payments-section').style.display = 'none';
            calcImportTotal();
        } else {
            if (imp) imp.style.display = 'none';
            locs.forEach(function (el) { el.style.display = 'grid'; });
            document.getElementById('tr-payments-section').style.display = 'block';
            document.getElementById('tr-buyer-payments-section').style.display = 'none';
        }
    } else {
        // Sell
        if (imp) imp.style.display = 'none';
        locs.forEach(function (el) { el.style.display = (mode === 'local') ? 'grid' : 'none'; });
        document.getElementById('tr-payments-section').style.display = 'none';
        document.getElementById('tr-buyer-payments-section').style.display = (mode === 'local') ? 'block' : 'none';
        document.getElementById('tr-deal-group').style.display = 'flex';
        if (mode === 'hs_sale') {
            if (linkGrp) linkGrp.style.display = 'flex';
            populatePurchaseLinks();
        } else {
            if (linkGrp) linkGrp.style.display = 'none';
        }
    }
    updatePaymentSummary();
}

function populatePurchaseLinks() {
    var sel = document.getElementById('tr-link-purchase');
    if (!sel) return;
    var buys = state.trades.filter(function (t) { return t.type === 'Buy' && t.mode === 'import'; });

    sel.innerHTML = '<option value="">-- Link to Import Purchase --</option>' +
        buys.map(function (t) {
            return '<option value="' + t.id + '">' + escH(t.id + ' | ' + t.party + ' | ' + t.product + ' (' + t.vol + 'L)') + '</option>';
        }).join('');
}

function loadPurchaseDetails() {
    var id = parseInt(document.getElementById('tr-link-purchase').value);
    if (!id) return;
    var p = state.trades.find(function (t) { return t.id === id; });
    if (!p) return;

    document.getElementById('tr-product').value = p.product;
    document.getElementById('tr-vol').value = p.vol;
    document.getElementById('tr-density').value = p.density;
    calcTradeTotals();
    toast('Loaded details from Purchase ' + id);
}

function handleCurrencyChange() {
    const currEl = document.getElementById('tr-imp-curr');
    const exEl = document.getElementById('tr-ex-rate');
    if (!currEl || !exEl) return;

    const newCurr = currEl.value;
    const currentRate = parseFloat(exEl.value) || 0;
    const univRate = 3.6725;

    if (newCurr !== lastCurrency && currentRate > 0) {
        if (lastCurrency === 'USD' && newCurr === 'AED') {
            exEl.value = (currentRate / univRate).toFixed(4);
        } else if (lastCurrency === 'AED' && newCurr === 'USD') {
            exEl.value = (currentRate * univRate).toFixed(4);
        }
    }
    lastCurrency = newCurr;
}

function calcImportTotal() {
    var isHs = document.getElementById('tr-is-hs') ? document.getElementById('tr-is-hs').checked : false;
    var rawQty = parseFloat(document.getElementById('tr-vol').value) || 0;
    var rate = parseFloat(document.getElementById('tr-imp-rate').value) || 0;

    var currEl = document.getElementById('tr-imp-curr');
    var exEl = document.getElementById('tr-ex-rate');
    var exGrp = document.getElementById('tr-ex-rate-group');
    var currGrp = document.getElementById('tr-imp-curr-group');

    if (isHs) {
        currEl.value = 'INR';
        exEl.value = '1';
        exGrp.style.display = 'none';
        currGrp.style.display = 'none';
    } else {
        exGrp.style.display = 'flex';
        currGrp.style.display = 'flex';
        if (currEl.value === 'INR') currEl.value = 'USD';
    }

    var totalFor = rawQty * rate;
    var curr = currEl.value;

    const totalForEl = document.getElementById('tr-total-for');
    if (totalForEl) totalForEl.value = curr + ' ' + totalFor.toLocaleString('en-US', { minimumFractionDigits: 2 });

    if (rawQty > 0) {
        calcTradeTotals();
    }
}

/* ═══════ PRINT TRADE RECEIPT ═══════ */
function printTradeReceipt(tradeId) {
    const t = state.trades.find(x => x.id === tradeId);
    if (!t) return toast('Trade not found', true);

    var rawQty = parseFloat(t.raw_qty) || parseFloat(t.vol) || 0;
    var den = parseFloat(t.density) || 0.85;
    var unit = t.unit || 'L';
    var qtyKG = (unit === 'KG') ? rawQty : (unit === 'MTON' ? rawQty * 1000 : rawQty * den);

    var dealRate = parseFloat(t.deal_rate) || 0;
    var taxRate = parseFloat(t.tax_rate) || parseFloat(t.price) || 0;
    var taxPct = parseFloat(t.tax_pct) || 18;

    var taxableAmt = qtyKG * taxRate;
    var taxAmt = taxableAmt * taxPct / 100;
    var tAmt = taxableAmt + taxAmt;
    var dealAmt = qtyKG * dealRate;
    var yChgs = dealAmt - tAmt;

    // Calculate Payment and Balance split by Bank (T AMT) and Yard (Y CHGS)
    var bankPaid = 0;
    var yardPaid = 0;
    if (t.type === 'Buy') {
        (t.payments || []).forEach(function(p) {
            var amt = parseFloat(p.amount_inr) || 0;
            var pType = (p.type || '').trim().toLowerCase();
            if (pType === 'yard') {
                yardPaid += amt;
            } else {
                bankPaid += amt;
            }
        });
    } else {
        (t.buyer_payments || []).forEach(function(p) {
            var amt = parseFloat(p.amount) || 0;
            var pType = (p.type || '').trim().toLowerCase();
            if (pType === 'yard') {
                yardPaid += amt;
            } else {
                bankPaid += amt;
            }
        });
    }
    var totalPaid = bankPaid + yardPaid;
    var bankBal = tAmt - bankPaid;
    var yardBal = yChgs - yardPaid;
    var balance = dealAmt - totalPaid;
    var highlightLabel = t.type === 'Buy' ? 'Payable' : 'Receivable';

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

    var html = '';

    if (t.mode === 'local') {
        var formattedDate = formatReceiptDate(t.date);
        html = `
            <html>
            <head>
                <title>Trade_Receipt_${t.id}</title>
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
                        margin-top: 10px;
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
                <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; font-family: Arial, sans-serif;">
                    ${escH(t.party)}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">DATE</th>
                            <th style="text-align: left;">INV NO</th>
                            <th style="text-align: left;">OIL</th>
                            <th style="text-align: right;">BIL WT KG</th>
                            <th style="text-align: right;">KG/ltr RA</th>
                            <th style="text-align: right;">TAXABLE AMT</th>
                            <th style="text-align: right;">TAX (${taxPct}%)</th>
                            <th style="text-align: right;">T AMT</th>
                            <th style="text-align: right;">DEAL RT</th>
                            <th style="text-align: right;">Y CHGS</th>
                            <th style="text-align: right;">DEAL AMT</th>
                            <th style="text-align: left;">VEHICLE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: left;">${formattedDate}</td>
                            <td style="text-align: left;">${escH(t.inv_no || '—')}</td>
                            <td style="text-align: left; font-weight: bold;">${escH(t.product)}</td>
                            <td class="mono" style="text-align: right;">${fNum(qtyKG)}</td>
                            <td class="mono" style="text-align: right;">${fNum(taxRate)}</td>
                            <td class="mono" style="text-align: right;">${fNum(taxableAmt)}</td>
                            <td class="mono" style="text-align: right;">${fNum(taxAmt)}</td>
                            <td class="mono" style="text-align: right; font-weight: bold;">${fNum(tAmt)}</td>
                            <td class="mono" style="text-align: right;">${fNum(dealRate)}</td>
                            <td class="mono" style="text-align: right; font-weight: bold; color: #b45309;">${fNum(yChgs)}</td>
                            <td class="mono" style="text-align: right; font-weight: bold; color: #16a34a;">${fNum(dealAmt)}</td>
                            <td style="text-align: left;">${escH(t.veh || '—')}</td>
                        </tr>
                        <!-- Total Row -->
                        <tr style="font-weight: bold; background: #fafafa;">
                            <td colspan="3" style="text-align: left; text-transform: uppercase;">Total</td>
                            <td class="mono" style="text-align: right;">${fNum(qtyKG)}</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right;">${fNum(taxableAmt)}</td>
                            <td class="mono" style="text-align: right;">${fNum(taxAmt)}</td>
                            <td class="mono" style="text-align: right; color: #0d9488;">${fNum(tAmt)}</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right; color: #b45309;">${fNum(yChgs)}</td>
                            <td class="mono" style="text-align: right; color: #16a34a;">${fNum(dealAmt)}</td>
                            <td style="text-align: left;">—</td>
                        </tr>
                        <!-- Payable / Receivable Highlight Row -->
                        <tr style="font-weight: bold; background: #fef9c3;">
                            <td colspan="3" style="text-align: left; color: #b45309; text-transform: uppercase;">${highlightLabel}</td>
                            <td style="text-align: right;">—</td>
                            <td style="text-align: right;">—</td>
                            <td style="text-align: right;">—</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right; color: #0d9488;">${fNum(tAmt)}</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right; color: #b45309;">${fNum(yChgs)}</td>
                            <td class="mono" style="text-align: right; color: #16a34a;">${fNum(dealAmt)}</td>
                            <td style="text-align: left;">—</td>
                        </tr>
                        <!-- Payment Done Row -->
                        <tr style="font-weight: bold; background: #e0f2fe;">
                            <td colspan="7" style="text-align: left; color: #0369a1; text-transform: uppercase;">Payment Done</td>
                            <td class="mono" style="text-align: right; color: #0369a1;">${fNum(bankPaid)}</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right; color: #0369a1;">${fNum(yardPaid)}</td>
                            <td class="mono" style="text-align: right; color: #0369a1;">${fNum(totalPaid)}</td>
                            <td style="text-align: left;">—</td>
                        </tr>
                        <!-- Pending Balance Row -->
                        <tr style="font-weight: bold; background: ${balance > 0 ? '#fee2e2' : '#dcfce7'};">
                            <td colspan="7" style="text-align: left; color: ${balance > 0 ? '#b91c1c' : '#15803d'}; text-transform: uppercase;">Pending Balance</td>
                            <td class="mono" style="text-align: right; color: ${balance > 0 ? '#b91c1c' : '#15803d'};">${fNum(bankBal)}</td>
                            <td style="text-align: right;">—</td>
                            <td class="mono" style="text-align: right; color: ${balance > 0 ? '#b91c1c' : '#15803d'};">${fNum(yardBal)}</td>
                            <td class="mono" style="text-align: right; color: ${balance > 0 ? '#b91c1c' : '#15803d'};">${fNum(balance)}</td>
                            <td style="text-align: left;">—</td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;
    } else {
        html = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; color: #2563eb; font-size: 20px; font-weight: 700; text-transform: uppercase;">${escH(t.party)}</h1>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; font-weight: 500;">TRADE STATEMENT / RECEIPT</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 14px; font-weight: bold;">Date: ${t.date}</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Ref: TR-${t.id}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 25%;">TRADE TYPE</td>
                        <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${t.type} (${t.mode.toUpperCase()})</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 25%;">PARTY / PARTNER</td>
                        <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${escH(t.party)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">PRODUCT</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escH(t.product)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">QUANTITY</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${fNum(rawQty)} ${t.unit || 'L'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">RATE / PRICE</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">₹ ${fNum(t.price)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">TOTAL AMOUNT</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #16a34a;">₹ ${fNum(rawQty * t.price)}</td>
                    </tr>
                </table>
            </div>
        `;
    }

    openPrintWindow(html, `Trade_Receipt_${t.id}`);
}

/* ═══════ LANDED COST REPORT (EXCEL STYLE) ═══════ */
function generateLandedCostReport(tradeId) {
    const t = state.trades.find(x => x.id === tradeId);
    if (!t) return toast('Trade not found', true);

    const q = parseFloat(t.raw_qty) || (t.vol / (t.density || 0.85)); 
    const unit = t.unit || 'L';
    const usdRate = parseFloat(t.imp_rate) || 0;
    const exRate = parseFloat(t.ex_rate) || 1;
    const foreignLabel = t.currency || 'USD';

    // DUAL SETTLEMENT CALCULATION (Bank vs Yard)
    const payments = t.payments || [];
    let bankForeign = 0, bankInr = 0;
    let yardForeign = 0, yardInr = 0;
    let yardRateOverride = null;

    payments.forEach(p => {
        const foreign = (p.ex_rate > 0) ? (p.amount_inr / p.ex_rate) : 0;
        if (p.type === 'Bank') {
            bankForeign += foreign;
            bankInr += p.amount_inr;
        } else {
            yardForeign += foreign;
            yardInr += p.amount_inr;
            if (p.ex_rate > 0) yardRateOverride = p.ex_rate;
        }
    });

    const totalForeignVal = q * usdRate;
    
    // If not fully paid, assign remaining balance to Yard by default (per user workflow)
    const totalPaidForeign = bankForeign + yardForeign;
    if (totalForeignVal > totalPaidForeign) {
        const balance = totalForeignVal - totalPaidForeign;
        const balRate = yardRateOverride || exRate; // Priority to the rate typed in the Yard row
        yardForeign += balance;
        yardInr += (balance * balRate); 
    }

    const basicInr = bankInr + yardInr;
    const avgBankEx = bankForeign > 0 ? (bankInr / bankForeign) : exRate;
    const avgYardEx = yardForeign > 0 ? (yardInr / yardForeign) : (yardRateOverride || exRate);

    const expenses = t.expenses || [];
    const expNetTotal = expenses.reduce((s, e) => s + (parseFloat(e.net_amount) || 0), 0);
    const expTaxTotal = expenses.reduce((s, e) => s + (parseFloat(e.tax_amount) || 0), 0);
    const expGrandTotal = expenses.reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0);

    // Also include Bank Charges from payments if any
    const bankCharges = (t.payments || []).reduce((s, p) => s + (parseFloat(p.bank_chg) || 0), 0);
    const tankCost = parseFloat(t.tank_cost) || 0;

    // Total INR should be the exact sum of all components (Customs Duty is already inside logistics/expGrandTotal)
    const totalPurchaseCost = basicInr + expGrandTotal + bankCharges + tankCost;

    // Total KG for Landed Rate calculation
    const totalKG = (unit === 'KG') ? q : (unit === 'MTON' ? q * 1000 : q * (t.density || 0.85));

    const basicRateKG = totalKG > 0 ? (basicInr / totalKG) : 0;
    const expRateKG = totalKG > 0 ? ((expGrandTotal + bankCharges + tankCost) / totalKG) : 0;
    const finalLandedKG = basicRateKG + expRateKG;

    const co = (state && state.company) ? state.company : {};
    const myName = co.name || 'MURJI RAVJI & COMPANY';

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 10px;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #14b8a6; font-size: 24px;">${escH(myName)}</h1>
                    <p style="margin: 2px 0; font-size: 12px; color: #666;">IMPORT SETTLEMENT & LANDED COST STATEMENT</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold;">Date: ${t.date}</p>
                    <p style="margin: 2px 0; font-size: 11px;">Ref: TR-${t.id}${t.import_no ? ` | Import No: ${t.import_no}` : ''}</p>
                </div>
            </div>

            <!-- Top Details Grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 15%;">EXPORTER</td>
                    <td style="padding: 8px; border: 1px solid #ddd; width: 35%;">${escH(t.party) || 'NA'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 15%;">INVOICE NO</td>
                    <td style="padding: 8px; border: 1px solid #ddd; width: 35%;">${escH(t.inv_no_intl) || 'NA'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">B/L NO</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${escH(t.bl_no) || 'NA'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">MATERIAL</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${escH(t.product)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">BOE NO</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${escH(t.boe_no) || 'NA'} ${t.boe_date ? `(Dt: ${t.boe_date})` : ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">QUANTITY</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${q.toLocaleString(undefined, {minimumFractionDigits:3})} ${escH(t.unit || 'MTON')}</td>
                </tr>
            </table>

            <!-- Purchase Calculation (Split between Bank and Yard) -->
            <h3 style="font-size: 13px; color: #14b8a6; margin-bottom: 10px;">PURCHASE SETTLEMENT BREAKDOWN</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; text-align: right;">
                <thead>
                    <tr style="background: #333; color: #fff;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #333;">PORTION</th>
                        <th style="padding: 10px; border: 1px solid #333;">${foreignLabel} VALUE</th>
                        <th style="padding: 10px; border: 1px solid #333;">AVG EX RT</th>
                        <th style="padding: 10px; border: 1px solid #333;">INR AMT</th>
                    </tr>
                </thead>
                <tbody>
                    ${bankForeign > 0 ? `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight:bold;">Bank Settlement</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${bankForeign.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${avgBankEx.toFixed(4)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${fmt(bankInr)}</td>
                    </tr>` : ''}
                    ${yardForeign > 0 ? `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight:bold;">Yard / Other Settlement</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${yardForeign.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${avgYardEx.toFixed(4)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${fmt(yardInr)}</td>
                    </tr>` : ''}
                    <tr style="background:#f0fdfa; font-weight:bold; color:#14b8a6;">
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">BASIC PURCHASE TOTAL</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${totalForeignVal.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${(basicInr / totalForeignVal).toFixed(4)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${fmt(basicInr)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Expenses Section -->
            <h3 style="font-size: 14px; color: #14b8a6; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px;">IMPORT EXPENSES BREAKDOWN</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px;">
                <thead>
                    <tr style="background: #f4f4f4; text-align: right; font-weight: bold;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left; width: 45%;">PARTICULARS</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">NET AMOUNT</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">PLUS GST/TAX</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">TOTAL INR</th>
                    </tr>
                </thead>
                <tbody>
                    ${expenses.map(e => `
                        <tr style="text-align: right;">
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 500;">${escH(e.type)} ${e.ref ? `<br><small style="color:#888;">Ref: ${escH(e.ref)}</small>` : ''}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${fmtN(e.net_amount || e.amount)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${fmtN(e.tax_amount || 0)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${fmtN(e.total_amount || e.amount)}</td>
                        </tr>
                    `).join('')}
                    ${tankCost > 0 ? `
                        <tr style="text-align: right;">
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 500;">Flexi / ISO Tank Cost (${t.container_count || 0} Tanks @ $${fmtN(t.tank_rate || 0)} x ${t.ex_rate || exRate})</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${fmtN(tankCost)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">0.00</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${fmtN(tankCost)}</td>
                        </tr>
                    ` : ''}
                    ${bankCharges > 0 ? `
                        <tr style="text-align: right;">
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 500;">Bank Charges (Payments)</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${fmtN(bankCharges)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">0.00</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${fmtN(bankCharges)}</td>
                        </tr>
                    ` : ''}
                    ${(expenses.length === 0 && tankCost === 0 && bankCharges === 0) ? '<tr><td colspan="4" style="padding: 30px; text-align: center; color: #999; font-style: italic;">No logistics expenses recorded for this trade.</td></tr>' : ''}
                </tbody>
                <tfoot>
                    <tr style="background: #f9f9f9; font-weight: bold; text-align: right; font-size: 12px; color: #14b8a6;">
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">EXPENSES GRAND TOTAL</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${fmtN(expNetTotal + tankCost + bankCharges)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${fmtN(expTaxTotal)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; border-left: 2px solid #14b8a6;">${fmt(expGrandTotal + tankCost + bankCharges)}</td>
                    </tr>
                </tfoot>
            </table>

            <!-- Final Summary Card -->
            <div style="background: #1e293b; color: #fff; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <span style="font-size: 16px; font-weight: bold; letter-spacing: 1px; color: #94a3b8;">TOTAL PURCHASE COST (INR)</span>
                <span style="font-size: 24px; font-weight: bold; color: #fbbf24;">${fmt(totalPurchaseCost)}</span>
            </div>

            <!-- Landed Rate Per KG Footer -->
            <div style="border: 2px solid #ddd; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: center;">
                    <tr style="font-weight: bold; text-transform: uppercase; color: #64748b; font-size: 11px; background: #f8fafc;">
                        <td style="padding: 12px; border-right: 1px solid #ddd; width: 33.3%;">BASIC RATE / KG</td>
                        <td style="padding: 12px; border-right: 1px solid #ddd; width: 33.3%;">EXPENSE RATE / KG</td>
                        <td style="padding: 12px; width: 33.3%; background: #fffbeb; color: #b45309;">FINAL LANDED RATE / KG</td>
                    </tr>
                    <tr style="font-size: 20px; font-weight: bold;">
                        <td style="padding: 15px; border-right: 1px solid #ddd; color: #1e293b;">\u20B9 ${basicRateKG.toFixed(2)}</td>
                        <td style="padding: 15px; border-right: 1px solid #ddd; color: #1e293b;">\u20B9 ${expRateKG.toFixed(2)}</td>
                        <td style="padding: 15px; background: #fbbf24; color: #000; border-top: 2px solid #b45309;">\u20B9 ${finalLandedKG.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; font-style: italic;">
                Landed Cost Analysis Report • Generated by Murji Oil Dashboard • ${new Date().toLocaleString()}
            </div>
        </div>
    `;

    openPrintWindow(html, `Landed_Cost_${t.import_no || t.bl_no || t.id}`);
}

/* ═══════ TALLY-STYLE GST TAX INVOICE GENERATOR ═══════ */
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
    var decimalPart = Math.round((num - integerPart) * 100);
    
    if (integerPart.toString().length > 9) return 'Amount Too Large';
    
    var word = '';
    var temp = integerPart;
    var crores = Math.floor(temp / 10000000);
    temp %= 10000000;
    var lakhs = Math.floor(temp / 100000);
    temp %= 100000;
    var thousands = Math.floor(temp / 1000);
    temp %= 1000;
    var hundreds = Math.floor(temp / 100);
    var remaining = temp % 100;
    
    if (crores > 0) {
        word += h(crores) + ' Crore ';
    }
    if (lakhs > 0) {
        word += h(lakhs) + ' Lakh ';
    }
    if (thousands > 0) {
        word += h(thousands) + ' Thousand ';
    }
    if (hundreds > 0) {
        word += a[hundreds] + ' Hundred ';
    }
    if (remaining > 0) {
        if (word !== '') {
            word += 'and ';
        }
        word += g(remaining) + ' ';
    }
    
    var paiseWord = '';
    if (decimalPart > 0) {
        paiseWord = ' and ' + g(decimalPart) + ' Paise';
    }
    
    return word.trim() + paiseWord + ' Only';
}

function printTradeInvoice(tradeId) {
    const t = state.trades.find(x => x.id === tradeId);
    if (!t) return toast('Trade not found', true);

    var rawQty = parseFloat(t.raw_qty) || parseFloat(t.vol) || 0;
    var den = parseFloat(t.density) || 0.85;
    var unit = t.unit || 'L';
    var qtyKG = (unit === 'KG') ? rawQty : (unit === 'MTON' ? rawQty * 1000 : rawQty * den);

    var dealRate = parseFloat(t.deal_rate) || 0;
    var taxRate = parseFloat(t.tax_rate) || parseFloat(t.price) || 0;
    var taxPct = parseFloat(t.tax_pct) || 18;

    var taxableAmt = qtyKG * taxRate;
    var taxAmt = taxableAmt * taxPct / 100;
    var tAmt = taxableAmt + taxAmt;
    var dealAmt = qtyKG * dealRate;

    var fNum = function(val) {
        return Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    var partyObj = null;
    if (t.type === 'Sell') {
        partyObj = (state.buyers || []).find(function(b) { return b.name === t.party; });
    } else {
        partyObj = (state.suppliers || []).find(function(s) { return s.name === t.party; });
    }
    
    var partyCity = partyObj && partyObj.city ? partyObj.city : 'Ahmedabad';
    var partyPhone = partyObj && partyObj.phone ? partyObj.phone : '';
    
    var partyState = 'Gujarat';
    var partyStateCode = '24';
    if (partyObj) {
        var cityLower = (partyObj.city || '').toLowerCase();
        if (cityLower.includes('maharashtra') || cityLower.includes('mumbai') || cityLower.includes('navi mumbai') || cityLower.includes('vashi') || cityLower.includes('pune') || cityLower.includes('nagpur')) {
            partyState = 'Maharashtra';
            partyStateCode = '27';
            partyCity = partyObj.city;
        } else if (cityLower) {
            partyCity = partyObj.city;
            if (cityLower.includes('gujarat') || cityLower.includes('ahmedabad') || cityLower.includes('gandhidham') || cityLower.includes('kandla') || cityLower.includes('mundra')) {
                partyState = 'Gujarat';
                partyStateCode = '24';
            } else if (cityLower.includes('rajasthan') || cityLower.includes('jaipur')) {
                partyState = 'Rajasthan';
                partyStateCode = '08';
            } else if (cityLower.includes('delhi')) {
                partyState = 'Delhi';
                partyStateCode = '07';
            }
        }
    }

    var co = (state && state.company) ? state.company : {};
    var myName      = co.name      || 'MURJI RAVJI AND COMPANY';
    var myAddr      = co.addr      || 'SHOP NO 418 PLOT NO D380, SECTOR 12 FRUIT MARKET, KALAMBOLI, NAVI MUMBAI';
    var myGstin     = co.gstin     || '27AARRM6631F1Z3';
    var myState     = co.state     || 'Maharashtra';
    var myStateCode = co.stateCode || '27';

    var buyerGST = partyPhone.length >= 15 ? partyPhone : '24CIVPS3974C1ZP';

    var sellerName      = t.type === 'Sell' ? myName      : t.party;
    var sellerAddr      = t.type === 'Sell' ? myAddr      : (partyCity + ', India');
    var sellerGstin     = t.type === 'Sell' ? myGstin     : buyerGST;
    var sellerState     = t.type === 'Sell' ? myState     : partyState;
    var sellerStateCode = t.type === 'Sell' ? myStateCode : partyStateCode;

    var buyerName      = t.type === 'Sell' ? t.party : myName;
    var buyerAddr      = t.type === 'Sell' ? (partyCity + ', India') : myAddr;
    var buyerGstin     = t.type === 'Sell' ? buyerGST : myGstin;
    var buyerState     = t.type === 'Sell' ? partyState : myState;
    var buyerStateCode = t.type === 'Sell' ? partyStateCode : myStateCode;

    var consigneeName = buyerName;
    var consigneeAddr = buyerAddr;
    var consigneeGstin = buyerGstin;
    var consigneeState = buyerState;
    var consigneeStateCode = buyerStateCode;

    if (t.ship_to) {
        var cObj = (state.buyers || []).find(function(b) { return b.name === t.ship_to; });
        if (cObj) {
            consigneeName = cObj.name;
            var cCity = cObj.city || 'Ahmedabad';
            var cPhone = cObj.phone || '';
            consigneeAddr = cCity + ', India';
            consigneeGstin = cPhone.length >= 15 ? cPhone : '24CIVPS3974C1ZP';
            
            consigneeState = 'Gujarat';
            consigneeStateCode = '24';
            var cCityLower = cCity.toLowerCase();
            if (cCityLower.includes('maharashtra') || cCityLower.includes('mumbai') || cCityLower.includes('navi mumbai') || cCityLower.includes('vashi') || cCityLower.includes('pune') || cCityLower.includes('nagpur')) {
                consigneeState = 'Maharashtra';
                consigneeStateCode = '27';
            } else if (cCityLower.includes('rajasthan') || cCityLower.includes('jaipur')) {
                consigneeState = 'Rajasthan';
                consigneeStateCode = '08';
            } else if (cCityLower.includes('delhi')) {
                consigneeState = 'Delhi';
                consigneeStateCode = '07';
            }
        }
    }

    var isLocalTax = (sellerStateCode === buyerStateCode);
    var hsn = '27101971';
    var invoiceNo = t.inv_no || ('MRC/' + String(t.id).padStart(3, '0') + '/26-27');
    
    var dateParts = (t.date || '').split('-');
    var formattedDate = t.date;
    if (dateParts.length === 3) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var monthIndex = parseInt(dateParts[1]) - 1;
        formattedDate = dateParts[2] + '-' + (months[monthIndex] || dateParts[1]) + '-' + dateParts[0].substring(2);
    }

    var roundOffVal = Math.round(tAmt) - tAmt;
    var totalInvoiceVal = Math.round(tAmt);

    var invoiceWords = numToWords(totalInvoiceVal);
    var taxWords = numToWords(taxAmt);

    var html = `
        <html>
        <head>
            <title>Tax_Invoice_${t.id}</title>
            <style>
                @media print {
                    @page {
                        size: portrait;
                        margin: 6mm;
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
                    font-size: 8px;
                    line-height: 1.25;
                }
                .invoice-container {
                    border: 1.5px solid #000;
                    width: 100%;
                    max-width: 750px;
                    margin: 0 auto;
                }
                .header-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 11px;
                    border-bottom: 1.5px solid #000;
                    padding: 4px 0;
                    letter-spacing: 0.5px;
                }
                .flex-row {
                    display: flex;
                    border-bottom: 1px solid #000;
                }
                .col-left {
                    width: 50%;
                    border-right: 1.5px solid #000;
                    padding: 6px;
                    box-sizing: border-box;
                }
                .col-right {
                    width: 50%;
                    padding: 0;
                    box-sizing: border-box;
                }
                .company-name {
                    font-weight: bold;
                    font-size: 9.5px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .info-table td {
                    border-bottom: 1px solid #000;
                    border-right: 1px solid #000;
                    padding: 5px 6px;
                    vertical-align: top;
                    height: 38px;
                    box-sizing: border-box;
                }
                .info-table td:last-child {
                    border-right: none;
                }
                .info-table tr:last-child td {
                    border-bottom: none;
                }
                table.items-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-bottom: 1.5px solid #000;
                }
                table.items-table th, table.items-table td {
                    border-right: 1px solid #000;
                    padding: 5px;
                    font-size: 8.5px;
                    box-sizing: border-box;
                }
                table.items-table th {
                    border-bottom: 1.5px solid #000;
                    background: #f5f5f5;
                    font-weight: bold;
                    text-align: left;
                    font-size: 8.5px;
                }
                table.items-table td {
                    height: 180px;
                    vertical-align: top;
                }
                .totals-row td {
                    font-weight: bold;
                    background: #f5f5f5;
                    height: auto !important;
                    vertical-align: middle;
                    border-top: 1.5px solid #000;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 5px;
                }
                .summary-table th, .summary-table td {
                    border: 1px solid #000;
                    padding: 4px;
                    font-size: 8px;
                    text-align: right;
                }
                .summary-table th {
                    background: #f5f5f5;
                    text-align: center;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header-title">Tax Invoice</div>
                <div class="flex-row">
                    <div class="col-left">
                        <div style="font-size:7.5px; color:#555; text-transform:uppercase; margin-bottom:2px;">Exporter/Seller</div>
                        <div class="company-name">${escH(sellerName)}</div>
                        <div style="font-size: 8.5px;">${escH(sellerAddr)}</div>
                        <div style="margin-top: 6px; font-weight: bold; font-size: 8.5px;">GSTIN/UIN: ${sellerGstin}</div>
                        <div style="font-size: 8.5px;">State Name: ${sellerState}, Code: ${sellerStateCode}</div>
                    </div>
                    <div class="col-right">
                        <table class="info-table">
                            <tr>
                                <td style="width: 50%;">
                                    <div style="font-size: 7px; color: #555;">Invoice No.</div>
                                    <div style="font-weight: bold; font-size: 9px; margin-top: 1px;">${invoiceNo}</div>
                                </td>
                                <td style="width: 50%;">
                                    <div style="font-size: 7px; color: #555;">Dated</div>
                                    <div style="font-weight: bold; font-size: 9px; margin-top: 1px;">${formattedDate}</div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Dispatched through</div>
                                    <div style="font-weight: bold; margin-top: 1px;">Rahi Roadways</div>
                                </td>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Destination</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${escH(t.delivery_dest || consigneeAddr.split(',')[0] || '—')}</div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-size: 7px; color: #555;">Motor Vehicle No.</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${escH(t.veh || '—')}</div>
                                </td>
                                <td>
                                    <div style="font-size: 7px; color: #555;">LR No. / Date</div>
                                    <div style="font-weight: bold; margin-top: 1px;">${escH(t.lr_no || '—')}</div>
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
                        <div style="font-size:7.5px; color:#555; text-transform:uppercase; margin-bottom:2px;">Buyer (Bill to)</div>
                        <div class="company-name">${escH(buyerName)}</div>
                        <div style="font-size: 8.5px;">${escH(buyerAddr)}</div>
                        <div style="margin-top: 6px; font-weight: bold; font-size: 8.5px;">GSTIN/UIN: ${buyerGstin}</div>
                        <div style="font-size: 8.5px;">State Name: ${buyerState}, Code: ${buyerStateCode}</div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%; text-align: center;">Sl No.</th>
                            <th style="width: 45%;">Description of Goods</th>
                            <th style="width: 12%; text-align: center;">HSN/SAC</th>
                            <th style="width: 13%; text-align: right;">Quantity</th>
                            <th style="width: 10%; text-align: right;">Rate</th>
                            <th style="width: 5%; text-align: center;">per</th>
                            <th style="width: 10%; text-align: right; border-right: none;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">1</td>
                            <td style="border-right: 1px solid #000; padding-top: 8px;">
                                <div style="font-weight: bold; font-size: 9px; text-transform: uppercase;">${escH(t.product)}</div>
                                <div style="color: #555; font-size: 7.5px; margin-top: 3px;">For Industrial Use Only</div>
                                ${isLocalTax ? `
                                    <div style="margin-top: 25px; font-style: italic; font-weight: bold;">Output CGST @ 9%</div>
                                    <div style="margin-top: 4px; font-style: italic; font-weight: bold;">Output SGST @ 9%</div>
                                ` : `
                                    <div style="margin-top: 25px; font-style: italic; font-weight: bold;">Output IGST @ 18%</div>
                                `}
                                <div style="margin-top: 4px; font-style: italic;">Round Off</div>
                            </td>
                            <td style="text-align: center; border-right: 1px solid #000; padding-top: 8px;">
                                <div>${hsn}</div>
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
                                <div style="margin-top: 4px;">${fNum(roundOffVal)}</div>
                            </td>
                        </tr>
                        <tr class="totals-row">
                            <td colspan="3" style="text-align: right; font-weight: bold;">Total</td>
                            <td style="text-align: right; font-weight: bold;">${fNum(qtyKG)} KG</td>
                            <td>—</td>
                            <td>—</td>
                            <td style="text-align: right; border-right: none; font-weight: bold;">₹ ${fNum(totalInvoiceVal)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="padding: 6px; border-bottom: 1px solid #000;">
                    <div style="font-size: 7.5px; color: #555; text-transform: uppercase;">Amount Chargeable (in words)</div>
                    <div style="font-weight: bold; font-size: 9px; margin-top: 2px;">INR ${invoiceWords}</div>
                </div>

                <div style="padding: 6px; border-bottom: 1px solid #000;">
                    <div style="font-size: 7.5px; color: #555; text-transform: uppercase; margin-bottom: 2px;">HSN/SAC Tax Summary</div>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th rowspan="2" style="text-align: left; vertical-align: middle;">HSN/SAC</th>
                                <th rowspan="2" style="text-align: right; vertical-align: middle;">Taxable Value</th>
                                ${isLocalTax ? `
                                    <th colspan="2">Central Tax</th>
                                    <th colspan="2">State Tax</th>
                                ` : `
                                    <th colspan="2">Integrated Tax</th>
                                `}
                                <th rowspan="2" style="text-align: right; vertical-align: middle;">Total Tax Amount</th>
                            </tr>
                            <tr>
                                ${isLocalTax ? `
                                    <th style="width: 8%;">Rate</th>
                                    <th style="width: 15%; text-align: right;">Amount</th>
                                    <th style="width: 8%;">Rate</th>
                                    <th style="width: 15%; text-align: right;">Amount</th>
                                ` : `
                                    <th style="width: 10%;">Rate</th>
                                    <th style="width: 40%; text-align: right;">Amount</th>
                                `}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="text-align: left; font-weight: bold;">${hsn}</td>
                                <td style="text-align: right;">${fNum(taxableAmt)}</td>
                                ${isLocalTax ? `
                                    <td style="text-align: center;">9%</td>
                                    <td style="text-align: right;">${fNum(taxAmt / 2)}</td>
                                    <td style="text-align: center;">9%</td>
                                    <td style="text-align: right;">${fNum(taxAmt / 2)}</td>
                                ` : `
                                    <td style="text-align: center;">18%</td>
                                    <td style="text-align: right;">${fNum(taxAmt)}</td>
                                `}
                                <td style="text-align: right; font-weight: bold;">${fNum(taxAmt)}</td>
                            </tr>
                            <tr style="font-weight: bold;">
                                <td style="text-align: left;">Total</td>
                                <td style="text-align: right;">${fNum(taxableAmt)}</td>
                                ${isLocalTax ? `
                                    <td></td>
                                    <td style="text-align: right;">${fNum(taxAmt / 2)}</td>
                                    <td></td>
                                    <td style="text-align: right;">${fNum(taxAmt / 2)}</td>
                                ` : `
                                    <td></td>
                                    <td style="text-align: right;">${fNum(taxAmt)}</td>
                                `}
                                <td style="text-align: right;">${fNum(taxAmt)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="padding: 6px; border-bottom: 1px solid #000;">
                    <div style="font-size: 7.5px; color: #555; text-transform: uppercase;">Tax Amount (in words)</div>
                    <div style="font-weight: bold; font-size: 9px; margin-top: 2px;">INR ${taxWords}</div>
                </div>

                <div class="flex-row" style="border-bottom: none;">
                    <div class="col-left" style="font-size: 8px; line-height: 1.4;">
                        <div style="font-weight: bold; font-size: 8.5px; margin-bottom: 4px; text-transform: uppercase;">Company's Bank Details</div>
                        <div>Bank Name: <span style="font-weight: bold;">${co.bankName ? escH(co.bankName) : 'HDFC BANK OD A/C'}</span></div>
                        <div>A/c No.: <span style="font-weight: bold;">${co.bankAc ? escH(co.bankAc) : '50200115504705'}</span></div>
                        <div>Branch & IFSC Code: <span style="font-weight: bold;">${(co.bankBranch || co.bankIfsc) ? escH((co.bankBranch||'') + (co.bankBranch && co.bankIfsc ? ' & ' : '') + (co.bankIfsc||'')) : 'VASHI & HDFC0000041'}</span></div>
                        <div style="margin-top: 6px; font-style: italic; color: #555; font-size: 7.5px; line-height: 1.2;">
                            Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                        </div>
                    </div>
                    <div class="col-right" style="text-align: right; padding: 6px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="font-size: 8px;">For <span style="font-weight: bold; text-transform: uppercase;">${escH(myName)}</span></div>
                        <div style="font-weight: bold; font-size: 8.5px; margin-top: 45px;">Authorized Signatory</div>
                    </div>
                </div>
            </div>
            <div style="text-align: center; font-size: 7.5px; color: #777; margin-top: 6px; font-style: italic;">
                SUBJECT TO NAVI MUMBAI JURISDICTION<br>
                This is a Computer Generated Invoice
            </div>
        </body>
        </html>
    `;

    openPrintWindow(html, `Tax_Invoice_${t.id}`);
}

// Direct window assignments — ensures SES lockdown from Supabase SDK cannot block these
window.printTradeReceipt = printTradeReceipt;
window.printTradeInvoice = printTradeInvoice;
window.generateLandedCostReport = generateLandedCostReport;
window.editTrade = editTrade;
window.addTrade = addTrade;
window.resetTradeForm = resetTradeForm;

// Window Bridge
(function (w) {
    const exports = {
        renderTradesTable, openMoveToYardModal, toggleMtySelectAll, calcMtyRowVariance, updateMtyTotals,
        autoSplitBlNetWeight, updateMtyRowQuality, saveMtyWeightTallyOnly, toggleMtyDest, closeMoveToYardModal, confirmYardTransfer,
        handleTradeDocUpload, renderTradeDocs, renameTradeDoc, previewDoc, removeTradeDoc, downloadDoc,
        scanDocument, scanTradeDocWithAI, runLocalExtract, refineWithCloudAI, saveApiKey, runDemoScan, highlightField,
        editTrade, addTrade, resetTradeForm, generateLandedCostReport, printTradeReceipt, printTradeInvoice,
        addExpenseRow, handleExpenseTypeChange, calcExpTotal, toggleExpenseLock, uploadExpenseDoc, handleExpenseFileUpload,
        viewExpenseDoc, getTradeExpenses, removeExpenseRow, updateExpenseData, updateTotalExpenses, clearExpenses,
        addContainerRow, removeContainerRow, calcContainerTotals, clearContainerGrid, getContainerGridData,
        scanCfsSlipWithAI, uploadShipDoc, handleShipDocUpload, updateShipDocType, renderShipDocs, viewShipDoc, openDocPreview,
        dataUriToBlob, closeDocPreview, deleteShipDoc,
        addPaymentRow, removePaymentRow, updatePaymentSummary, getSupplierPayments, clearSupplierData,
        addBuyerPaymentRow, removeBuyerPaymentRow, updateBuyerPaymentSummary, getBuyerPayments, clearBuyerData,
        loadDealDetails, populateSourceLocations, checkSourceStock, syncWeightToQty,
        openHssModal, closeHssModal, renderHssPreviews, downloadAllHssDocs,
        populateTradeParties, syncCustomsDutyToExpenses, calcTradeTotals, toggleTradeModeField, toggleTradeDetailFields, toggleDeliveryDest,
        populatePurchaseLinks, loadPurchaseDetails, handleCurrencyChange, calcImportTotal,
        getTradeQtyKG, calcTradeBreakdown, syncTaxRateToPriceLocal, syncPriceLocalToTaxRate
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
