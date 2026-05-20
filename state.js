/* Supabase Config loaded from config.js */

/* ═══════ STATE & CONFIG ═══════ */
var DEF_P = [
    { name: 'Crude Oil', density: 0.850, hsn: '2709', other: '' },
    { name: 'Diesel', density: 0.832, hsn: '2710', other: 'HSD' },
    { name: 'Petrol', density: 0.740, hsn: '2710', other: 'MS' },
    { name: 'Kerosene', density: 0.810, hsn: '2710', other: 'SKO' },
    { name: 'LPG', density: 0.510, hsn: '2711', other: '' }
];
var DEF_S = {
    products: JSON.parse(JSON.stringify(DEF_P)),
    tanks: [
        { id: 'T1', name: 'Main Tank 1', capacity: 100000, type: 'Static', location: 'Yard A' },
        { id: 'T2', name: 'Main Tank 2', capacity: 100000, type: 'Static', location: 'Yard A' },
        { id: 'T3', name: 'Service Tank', capacity: 20000, type: 'Static', location: 'Yard B' }
    ],
    inventory: [], // Now stores "Batches" assigned to Tanks/Containers
    trades: [
        { id: 1, type: 'Buy', product: 'Diesel', party: 'IndianOil Corp', vol: 50000, price: 91.0, date: '2025-06-20', terms: 'Net 30', density: 0.832, location: 'T1' },
    ],
    orders: [],
    challans: [],
    suppliers: [],
    buyers: [],
    nextInvId: 1, nextTradeId: 2, nextOrderNum: 1, nextSupId: 1, nextBuyId: 1, nextChNum: 1
};

var state;
var currentTradeDocs = [];
var currentShipDocs = [];
var activeShipDocItem = null;

async function loadState() {
    // Initialize state with default or local first
    try {
        var s = localStorage.getItem('murji_oil_v12');
        var backup = localStorage.getItem('murji_oil_backup_mirror');

        state = s ? JSON.parse(s) : (backup ? JSON.parse(backup) : JSON.parse(JSON.stringify(DEF_S)));

        // If primary was empty but backup exists, recover automatically
        if (s && JSON.parse(s).trades.length === 0 && backup && JSON.parse(backup).trades.length > 0) {
            state = JSON.parse(backup);
            console.log("RECOVERY: Restored from Safety Mirror.");
        }
    } catch (e) {
        state = JSON.parse(JSON.stringify(DEF_S));
    }

    // Try Cloud Sync (Highest Priority)
    try {
        const { data: auth } = await supabaseClient.auth.getSession();
        if (auth && auth.session) {
            const { data, error } = await supabaseClient
                .from('murji_state')
                .select('state_data')
                .eq('user_id', auth.session.user.id)
                .maybeSingle();

            if (data && data.state_data) {
                // Accept cloud state if it has products OR trades (more inclusive)
                const hasData = (data.state_data.trades && data.state_data.trades.length > 0) ||
                    (data.state_data.products && data.state_data.products.length > 0);

                if (hasData) {
                    state = data.state_data;
                    console.log("Cloud Data Accepted: " + (state.trades ? state.trades.length : 0) + " trades found.");
                } else {
                    console.warn("Cloud record found but appears empty.");
                }
            }
        }
    } catch (e) {
        console.error("Cloud Load Error:", e);
    }

    // ALWAYS run migrations before showing UI
    runMigrations();
    initApp();
}

function runMigrations() {
    if (!state) return;
    // 1. Convert string products to objects
    if (state.products && state.products.length > 0 && typeof state.products[0] === 'string') {
        state.products = state.products.map(function (p) {
            return { name: p, density: (state.densities && state.densities[p]) || 0.850, hsn: '', other: '' };
        });
    }

    // 2. Ensure buyers & orders array exists
    if (!state.buyers) state.buyers = [];
    if (!state.orders) state.orders = [];
    if (!state.nextBuyId) state.nextBuyId = 1;
    if (!state.apiKey) state.apiKey = '';
    if (!state.apiModel || state.apiModel.includes('1.5') || state.apiModel === 'gemini-pro') {
        state.apiModel = 'gemini-3.1-flash-lite';
    }
    if (!state.tallyUrl) state.tallyUrl = 'http://localhost:9000';
    if (!state.tallyCompany) state.tallyCompany = 'Murji Oil';
    if (!state.tallyBankLedger) state.tallyBankLedger = 'Bank Account';
    if (!state.tallyCashLedger) state.tallyCashLedger = 'Cash';

    if (document.getElementById('api-key')) document.getElementById('api-key').value = state.apiKey;
    if (document.getElementById('api-model')) document.getElementById('api-model').value = state.apiModel;
    if (document.getElementById('tally-url')) document.getElementById('tally-url').value = state.tallyUrl;
    if (document.getElementById('tally-company')) document.getElementById('tally-company').value = state.tallyCompany;
    if (document.getElementById('tally-bank-ledger')) document.getElementById('tally-bank-ledger').value = state.tallyBankLedger;
    if (document.getElementById('tally-cash-ledger')) document.getElementById('tally-cash-ledger').value = state.tallyCashLedger;

    // 3. Ensure suppliers have all required fields
    if (state.suppliers) {
        state.suppliers.forEach(function (s) {
            if (!s.type) s.type = 'local';
            if (s.bankName === undefined) s.bankName = '';
            if (s.bankAc === undefined) s.bankAc = '';
            if (s.bankIfsc === undefined) s.bankIfsc = '';
            if (s.bankIban === undefined) s.bankIban = '';
            if (s.bankSwift === undefined) s.bankSwift = '';
            if (s.bankCurr === undefined) s.bankCurr = '';
        });
    }

    // 4. Ensure Tank & Yard structures exist for legacy users
    if (!state.tanks) {
        state.tanks = [
            { id: 'T1', name: 'Main Tank 1', capacity: 100000, type: 'Static', location: 'Yard A' },
            { id: 'T2', name: 'Main Tank 2', capacity: 100000, type: 'Static', location: 'Yard A' },
            { id: 'T3', name: 'Service Tank', capacity: 20000, type: 'Static', location: 'Yard B' }
        ];
    }
    if (!state.inventory) state.inventory = [];

    // 5. Clean up legacy densities map if it exists
    delete state.densities;
    // 6. Fix numeric party IDs and ensure mode exists
    if (state.trades) {
        state.trades.forEach(function (t) {
            if (!t.mode) {
                if (t.import_no || t.bl_no || t.boe_no || t.vessel) {
                    t.mode = 'import';
                } else if (t.link_purchase_id || t.hss_bl_no) {
                    t.mode = 'hs_sale';
                } else {
                    t.mode = 'local';
                }
            }
            const isNumeric = typeof t.party === 'number' || (typeof t.party === 'string' && t.party.trim() !== "" && !isNaN(t.party));
            if (isNumeric) {
                const id = parseInt(t.party);
                let found = null;
                if (t.type === 'Buy') found = (state.suppliers || []).find(function (s) { return s.id == id; });
                else if (t.type === 'Sell') found = (state.buyers || []).find(function (b) { return b.id == id; });
                if (found) t.party = found.name;
            }
        });
    }

    // 7. Ensure yards & activeYard exist for Multi-Yard management
    if (!state.yards) {
        const uniqueLocs = [...new Set((state.tanks || []).map(t => t.location).filter(Boolean))];
        state.yards = uniqueLocs.length > 0 ? uniqueLocs : ['Yard A', 'Yard B'];
    }
    if (!state.activeYard || !state.yards.includes(state.activeYard)) {
        state.activeYard = state.yards[0] || 'Yard A';
    }
}

var isTableMissing = false;
async function saveState(force = false) {
    if (force) isTableMissing = false;
    try {
        // 1. Save to Primary Local (Immediate Cache)
        localStorage.setItem('murji_oil_v12', JSON.stringify(state));

        // 2. SAFETY MIRROR: Save to a secondary key as a hard backup
        // Only mirror if we actually have data to protect
        if (state.trades && state.trades.length > 5) {
            localStorage.setItem('murji_oil_backup_mirror', JSON.stringify(state));
        }
    } catch (e) {
        const { data: auth } = await supabaseClient.auth.getSession();
        if (!auth.session && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            alert('CRITICAL: Storage Limit Exceeded!\n\nYour uploaded documents are too large for the browser to save (Max 5MB).\n\nPlease LOGIN to Cloud to use unlimited storage.');
        }
    }

    if (isTableMissing) return;
    const syncBadge = document.getElementById('sync-status-badge');
    if (syncBadge) {
        syncBadge.textContent = 'SYNCING...';
        syncBadge.style.color = 'var(--gold2)';
    }

    // Save to Cloud (Background Sync)
    try {
        const { data: auth } = await supabaseClient.auth.getSession();
        if (auth && auth.session) {
            // SYNC GUARD: Check data size (Supabase limit is ~6MB per row)
            const stateSize = JSON.stringify(state).length;
            if (stateSize > 5000000) { // 5MB Warning
                console.error("DATA TOO LARGE: " + (stateSize / 1024 / 1024).toFixed(2) + "MB. Cloud sync might fail.");
                toast("⚠️ DATA TOO LARGE! Remove old document photos to ensure cloud safety.", true);
            }

            const { error } = await supabaseClient
                .from('murji_state')
                .upsert({
                    user_id: auth.session.user.id,
                    state_data: state,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });

            if (error) {
                if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.status === 404) {
                    console.warn("Table 'murji_state' missing. Cloud sync disabled.");
                    isTableMissing = true;
                    if (syncBadge) {
                        syncBadge.textContent = 'DB SETUP REQUIRED';
                        syncBadge.parentElement.style.borderColor = 'var(--red)';
                        syncBadge.style.color = 'var(--red)';
                    }
                } else {
                    toast('Cloud Sync Failed: ' + error.message, true);
                    if (syncBadge) syncBadge.textContent = 'SYNC ERROR';
                    throw error;
                }
            } else {
                console.log("Synced to Cloud");
                isTableMissing = false;
                if (syncBadge) {
                    syncBadge.textContent = 'CLOUD SYNCED';
                    syncBadge.style.color = 'var(--teal)';
                    syncBadge.parentElement.style.borderColor = 'var(--teal)';
                }
            }
        } else {
            if (syncBadge) syncBadge.textContent = 'LOCAL ONLY';
        }
    } catch (e) {
        console.error('Cloud Sync Error:', e);
        if (syncBadge) syncBadge.textContent = 'SYNC ERROR';
    }
}

/* ═══════ CLOUD RECOVERY & MANUAL SYNC ═══════ */
async function forceCloudResync() {
    if (!confirm('This will clear your local cache and reload ALL data from the Cloud. Any unsaved local changes will be lost. Proceed?')) return;

    toast('Clearing cache and re-syncing...');
    localStorage.removeItem('murji_oil_v12');

    // Force reload
    window.location.reload();
}

async function inspectCloudData() {
    try {
        const { data: auth } = await supabaseClient.auth.getSession();
        if (!auth.session) return alert("Please Login first to inspect cloud data.");

        toast("Checking cloud database...");
        const { data, error } = await supabaseClient
            .from('murji_state')
            .select('state_data')
            .eq('user_id', auth.session.user.id)
            .maybeSingle();

        if (error) throw error;
        if (!data || !data.state_data) return alert("No cloud data found for this user account.");

        const tradeCount = data.state_data.trades ? data.state_data.trades.length : 0;
        const tankCount = data.state_data.tanks ? data.state_data.tanks.length : 0;

        alert(`CLOUD DATABASE CHECK:\n\n` +
              `✅ Data Found!\n` +
              `- Total Trades: ${tradeCount}\n` +
              `- Storage Tanks: ${tankCount}\n` +
              `- Products: ${data.state_data.products.length}\n\n` +
              `If you see your trades here, your data is SAFE. Click 'FORCE CLOUD RESYNC' to restore them to your screen.`);
    } catch (e) {
        console.error(e);
        alert("Error connecting to cloud: " + e.message);
    }
}

async function deepRecoveryScan() {
    toast("Starting Deep Recovery Scan...");
    const keys = Object.keys(localStorage);
    let foundData = null;
    let foundKey = null;

    // Search for any key that looks like our data
    for (let key of keys) {
        try {
            const val = localStorage.getItem(key);
            if (val && (val.includes('"trades"') || val.includes('"products"'))) {
                const parsed = JSON.parse(val);
                if (parsed.trades && parsed.trades.length > 0) {
                    if (!foundData || parsed.trades.length > foundData.trades.length) {
                        foundData = parsed;
                        foundKey = key;
                    }
                }
            }
        } catch (e) { }
    }

    if (foundData) {
        if (confirm(`SUCCESS! Found ${foundData.trades.length} trades in backup key: [${foundKey}].\n\nWould you like to RESTORE this data now?`)) {
            state = foundData;
            saveState(true);
            initApp();
            toast("Data Restored Successfully!");
        }
    } else {
        alert("Deep Scan Complete: No additional backups found in this browser. Please ensure you are logged into the correct Cloud account.");
    }
}

/* ═══════ CLOUD AUTH ═══════ */
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.add('show');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('show');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) return toast('Enter email and password', true);

    toast('Logging into Cloud...');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message, true);

    closeLoginModal();
    toast('Cloud Access Granted');
    initApp();
}

async function handleSignUp() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) return toast('Enter email and password', true);

    toast('Creating Cloud Account...');
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return toast(error.message, true);

    toast('Sign up successful! Please check your email for confirmation.', false);
}

async function handleLogout() {
    if (!confirm('Logout from Cloud?')) return;
    await supabaseClient.auth.signOut();
    toast('Logged out from Cloud');
    initApp();
}

function updateAuthState(session) {
    const emailEl = document.getElementById('user-email');
    const authBtn = document.getElementById('btn-login');
    const syncStatus = document.getElementById('user-info');
    const apiFields = document.getElementById('api-config-fields');
    const dbInspectBtn = document.getElementById('btn-db-inspect');

    if (session && session.user) {
        if (emailEl) {
            emailEl.textContent = session.user.email;
            emailEl.style.display = 'inline';
        }
        if (authBtn) {
            authBtn.style.display = 'none';
        }
        if (syncStatus) syncStatus.style.display = 'flex';
        if (apiFields) apiFields.style.display = 'block';
        if (dbInspectBtn) dbInspectBtn.style.display = 'inline-block';
    } else {
        if (emailEl) {
            emailEl.textContent = '';
            emailEl.style.display = 'none';
        }
        if (authBtn) {
            authBtn.style.display = 'inline-block';
        }
        if (syncStatus) syncStatus.style.display = 'none';
        if (apiFields) apiFields.style.display = 'none';
        if (dbInspectBtn) dbInspectBtn.style.display = 'none';
    }
}

// Global Auth State Change Listener
supabaseClient.auth.onAuthStateChange(function (event, session) {
    console.log("Auth Event Triggered: ", event);
    updateAuthState(session);
    if (event === 'SIGNED_IN') {
        loadState();
    } else if (event === 'SIGNED_OUT') {
        state = JSON.parse(JSON.stringify(DEF_S));
        initApp();
    }
});

/* ═══════ STORAGE & BACKUP ═══════ */
async function initializeStorage(isManual = false) {
    try {
        if (isManual) toast("Initializing Cloud Storage...");
        const { data, error } = await supabaseClient.storage.createBucket('murji_docs', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
        });

        if (error) {
            console.warn("Storage Init Note:", error.message);
            if (isManual && !error.message.includes('already exists')) {
                toast("Note: Storage bucket must be created in Supabase Dashboard if auto-init fails.", true);
            } else if (isManual && error.message.includes('already exists')) {
                toast("Storage Already Active");
            }
            return;
        }
        if (isManual) toast("Cloud Storage Ready!");
    } catch (e) {
        console.error("Storage Init Error:", e.message);
        if (isManual) toast("Note: Storage bucket must be created in Supabase Dashboard if auto-init fails.", true);
    }
}

async function uploadFileToSupabase(file, path) {
    const { data: auth } = await supabaseClient.auth.getSession();
    if (!auth.session) throw new Error("Please Login to upload documents.");

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fullPath = `${auth.session.user.id}/${path}/${fileName}`;

    const { data, error } = await supabaseClient.storage
        .from('murji_docs')
        .upload(fullPath, file);

    if (error) throw error;

    const { data: urlData } = supabaseClient.storage
        .from('murji_docs')
        .getPublicUrl(fullPath);

    return urlData.publicUrl;
}

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
}

function exportStateToFile() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Murji_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Database Exported to Downloads");
}

function importStateFromFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.trades) throw new Error("Invalid backup file format.");
            if (confirm(`Restore ${imported.trades.length} trades from backup? This will overwrite current data.`)) {
                state = imported;
                saveState(true);
                initApp();
                toast("Database Restored Successfully!");
            }
        } catch (err) {
            alert("Error importing file: " + err.message);
        }
    };
    reader.readAsText(file);
}

// Window Bridge
(function (w) {
    const exports = {
        loadState,
        saveState,
        forceCloudResync,
        inspectCloudData,
        deepRecoveryScan,
        openLoginModal,
        closeLoginModal,
        handleLogin,
        handleSignUp,
        handleLogout,
        initializeStorage,
        exportStateToFile,
        importStateFromFile
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
