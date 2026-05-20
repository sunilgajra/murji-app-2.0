/* ═══════ FORMATTING & MATHEMATICAL HELPERS ═══════ */
var fmt = function (n) { return '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); };
var fmtN = function (n) { return Number(n).toLocaleString('en-IN'); };
var fmtKG = function (n) { return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 }); };
var today = function () { return new Date().toISOString().split('T')[0]; };

var getDensity = function (pName) {
    if (!state.products) return 0.850;
    var found = state.products.find(function (x) { return x.name === pName; });
    return found ? found.density : 0.850;
};

var toKG = function (v, d) { return v * (d || 0.85); };
var escH = function (s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

function dualCalc(prefix, type) {
    const volEl = document.getElementById(prefix + '-qty') || document.getElementById(prefix + '-vol');
    const kgEl = document.getElementById(prefix + '-kg');
    const denEl = document.getElementById(prefix + '-density');
    if (!volEl || !kgEl || !denEl) return;
    const density = parseFloat(denEl.value) || 0.850;

    if (type === 'vol') {
        const vol = parseFloat(volEl.value) || 0;
        kgEl.value = (vol * density).toFixed(1);
    } else {
        const kg = parseFloat(kgEl.value) || 0;
        volEl.value = (kg / density).toFixed(0);
    }
}

function priceCalc(prefix, type) {
    const pL = document.getElementById(prefix + '-price');
    const pKG = document.getElementById(prefix + '-price-kg');
    const denEl = document.getElementById(prefix + '-density');
    if (!pL || !pKG || !denEl) return;
    const density = parseFloat(denEl.value) || 0.850;

    if (type === 'perL') {
        const val = parseFloat(pL.value) || 0;
        pKG.value = (val / density).toFixed(2);
    } else {
        const val = parseFloat(pKG.value) || 0;
        pL.value = (val * density).toFixed(2);
    }
}

function onDensityChangeForPrice(prefix) {
    dualCalc(prefix, 'vol');
    priceCalc(prefix, 'perL');
}

function toggleCustomTerm(px) {
    var sel = document.getElementById(px + '-terms');
    var cust = document.getElementById(px + '-custom-term');
    if (sel && cust) {
        if (sel.value === '__custom__') cust.classList.add('show');
        else cust.classList.remove('show');
    }
}

/* ═══════ TOAST NOTIFICATIONS ═══════ */
var _toastTimer = null;
function toast(msg, isErr) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 4000);
}

/* ═══════ PAGE TAB NAVIGATION ═══════ */
function switchPage(name) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
    if (window.event && window.event.target) window.event.target.classList.add('active');
    
    const pageEl = document.getElementById('page-' + name);
    if (pageEl) pageEl.classList.add('active');
    
    if (name === 'reports' && typeof renderReports === 'function') renderReports();
    if (name === 'trades' && typeof populateSelects === 'function') populateSelects();
}

/* ═══════ TICKER ELEMENT RENDERER ═══════ */
function renderTicker() {
    var prices = { 'Crude Oil': 6250, 'Diesel': 92.5, 'Petrol': 104.2, 'Kerosene': 78.3, 'LPG': 58.1 };
    var changes = { 'Crude Oil': '+1.2%', 'Diesel': '-0.3%', 'Petrol': '+0.5%', 'Kerosene': '-0.1%', 'LPG': '+0.8%' };
    const tickerEl = document.getElementById('tickerEl');
    if (!tickerEl) return;
    tickerEl.innerHTML = Object.keys(prices).map(function (p) {
        var ch = changes[p];
        var cls = ch.indexOf('+') >= 0 ? 'up' : 'down';
        return '<div class="ticker-item"><div class="ticker-name">' + p + '</div><div class="ticker-price">' + (p === 'Crude Oil' ? '$' + fmtN(prices[p]) : fmt(prices[p])) + '</div><div class="ticker-chg ' + cls + '">' + ch + '</div></div>';
    }).join('');
}

/* ═══════ PDF PREVIEW & PRINT STYLING ═══════ */
function commonStyle() {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">
    <style>
    @page { size: A4; margin: 0mm !important; }
    body { background: white; color: black; font-family: 'DM Sans', sans-serif; margin: 0; padding: 0; }
    .doc { padding: 15mm; max-width: 210mm; margin: 0 auto; box-sizing: border-box; }
    .print-header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #1a5c2e; padding-bottom: 16px; }
    .print-header h1 { font-size: 24px; color: #1a5c2e; margin: 0; }
    .print-header p { font-size: 12px; color: #666; margin: 4px 0 0 0; }
    .print-title { text-align: center; font-size: 18px; font-weight: 700; color: #333; margin: 20px 0; padding: 10px; background: #f0f7f0; border-radius: 4px; }
    .print-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .print-table td, .print-table th { padding: 8px 12px; border: 1px solid #ccc; font-size: 13px; }
    .print-table th { background: #e8f0e8; font-weight: 600; color: #1a5c2e; text-align: left; width: 40%; }
    .print-footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .sig-block { text-align: center; width: 180px; }
    .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 12px; }
    .print-note { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    
    .previewActions {
        display: flex; gap: 10px; justify-content: center; padding: 20px;
        background: #f8f9fa; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 100;
    }
    .previewActions button {
        padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none;
        color: white; font-family: sans-serif;
    }
    @media print {
        .previewActions { display: none !important; }
        body { margin: 0 !important; }
        .doc { padding: 15mm !important; width: 210mm !important; }
    }
    </style>
    `;
}

function previewScript() {
    return `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
      function triggerPrint() {
        const oldTitle = document.title;
        document.title = " ";
        window.print();
        setTimeout(() => { document.title = oldTitle; }, 1000);
      }

      async function downloadCleanPDF(event) {
        const btn = event.target;
        const oldText = btn.innerText;
        btn.innerText = "Generating...";
        btn.disabled = true;

        const element = document.querySelector(".doc");
        const opt = {
          margin: 0,
          filename: (document.title || "Challan") + ".pdf",
          image: { type: "jpeg", quality: 1.0 },
          html2canvas: { scale: 4, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        try {
          await html2pdf().from(element).set(opt).save();
        } catch (err) {
          console.error(err);
          alert("Download failed. Please use Browser Print instead.");
        } finally {
          btn.innerText = oldText;
          btn.disabled = false;
        }
      }
    </script>
    `;
}

function openPrintWindow(html, filename) {
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>\${filename}</title>
        \${commonStyle()}
        \${previewScript()}
    </head>
    <body>
        <div class="previewActions">
            <button onclick="downloadCleanPDF(event)" style="background:#14b8a6">Download Clean PDF</button>
            <button onclick="triggerPrint()" style="background:#555">Browser Print</button>
            <button onclick="window.close()" style="background:#888">Back</button>
        </div>
        <div class="doc">
            \${html}
        </div>
    </body>
    </html>`;

    try {
        const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank");
        if (!w) alert("Please allow pop-ups for document preview.");
    } catch (e) {
        console.error("Blob Print Error:", e);
        const w = window.open("about:blank", "_blank");
        if (w) {
            w.document.open();
            w.document.write(fullHtml);
            w.document.close();
        }
    }
}

function downloadChallanPDF(id) {
    var c = null;
    for (var i = 0; i < state.challans.length; i++) {
        if (state.challans[i].id === id) { c = state.challans[i]; break; }
    }
    if (!c) return toast('Challan not found', true);

    var typeLabel = c.type === 'in' ? 'INWARD DELIVERY CHALLAN' : 'OUTWARD DELIVERY CHALLAN';

    var html = '' +
        '<div class="print-header">' +
        '<h1>MURJI RAVJI & CO.</h1>' +
        '<p>OIL TRADING & LOGISTICS</p>' +
        '</div>' +
        '<div class="print-title">' + escH(typeLabel) + '</div>' +
        '<table class="print-table">' +
        '<tr><th>Challan No.</th><td>' + escH(c.id) + '</td></tr>' +
        '<tr><th>Date</th><td>' + escH(c.date) + '</td></tr>' +
        '</table>' +
        '<table class="print-table">' +
        '<tr><th>Product</th><td>' + escH(c.product) + '</td></tr>' +
        '<tr><th>Volume</th><td>' + fmtN(c.vol) + ' Litres</td></tr>' +
        '<tr><th>Weight</th><td>' + fmtKG(c.weight) + ' KG</td></tr>' +
        '<tr><th>Density</th><td>' + c.density + ' kg/L</td></tr>' +
        '</table>' +
        '<table class="print-table">' +
        '<tr><th>' + (c.type === 'in' ? 'Received From' : 'Dispatched From') + '</th><td>' + escH(c.from) + '</td></tr>' +
        '<tr><th>' + (c.type === 'in' ? 'Stored At' : 'Delivered To') + '</th><td>' + escH(c.to) + '</td></tr>' +
        '</table>' +
        '<table class="print-table">' +
        '<tr><th>Vehicle No.</th><td>' + escH(c.vehicle) + '</td></tr>' +
        '<tr><th>Driver Name</th><td>' + escH(c.driver) + '</td></tr>' +
        '<tr><th>Driver Phone</th><td>' + escH(c.driverPh) + '</td></tr>' +
        '</table>' +
        '<div class="print-footer">' +
        '<div class="sig-block"><div class="sig-line">Authorized Signatory</div></div>' +
        '<div class="sig-block"><div class="sig-line">Receiver Signature</div></div>' +
        '</div>' +
        '<div class="print-note">This is a computer-generated document from Murji Ravji & Co. \u2014 ' + new Date().toLocaleString('en-IN') + '</div>';

    openPrintWindow(html, c.id + '_' + c.product);
}

function exportInventoryExcel() {
    try {
        var rows = state.inventory.map(function (i) {
            return [
                i.product,
                i.grade || '-',
                i.density,
                i.tank || '-',
                i.vol,
                toKG(i.vol, i.density),
                i.cost,
                i.vol * i.cost,
                i.threshold
            ];
        });

        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
        html += '<style>td,th{padding:6px 10px;border:1px solid #999;font-size:12px;font-family:Calibri,sans-serif;}th{background:#d4e6b5;font-weight:bold;color:#1a5c2e;}.num{text-align:right;}</style></head><body>';
        html += '<table>';
        html += '<tr><th>Product</th><th>Grade</th><th>Density (kg/L)</th><th>Tank</th><th>Volume (L)</th><th>Weight (KG)</th><th>Cost/L (&#x20B9;)</th><th>Total Value (&#x20B9;)</th><th>Threshold (L)</th></tr>';
        for (var r = 0; r < rows.length; r++) {
            html += '<tr>';
            html += '<td>' + escH(rows[r][0]) + '</td>';
            html += '<td>' + escH(rows[r][1]) + '</td>';
            html += '<td class="num">' + rows[r][2] + '</td>';
            html += '<td>' + escH(rows[r][3]) + '</td>';
            html += '<td class="num">' + fmtN(rows[r][4]) + '</td>';
            html += '<td class="num">' + fmtKG(rows[r][5]) + '</td>';
            html += '<td class="num">' + rows[r][6].toFixed(2) + '</td>';
            html += '<td class="num">' + fmt(rows[r][7]) + '</td>';
            html += '<td class="num">' + fmtN(rows[r][8]) + '</td>';
            html += '</tr>';
        }
        var totalVol = 0, totalVal = 0;
        for (var r = 0; r < rows.length; r++) { totalVol += rows[r][4]; totalVal += rows[r][7]; }
        html += '<tr style="font-weight:bold;background:#eee"><td>TOTAL</td><td></td><td></td><td></td><td class="num">' + fmtN(totalVol) + '</td><td></td><td></td><td class="num">' + fmt(totalVal) + '</td><td></td></tr>';
        html += '</table></body></html>';

        var blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'MurjiRavji_Inventory_' + today() + '.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Excel file downloaded');
    } catch (err) {
        console.error('Excel Error:', err);
        toast('Export failed: ' + err.message, true);
    }
}

function shareWhatsApp(id) {
    var c = null;
    for (var i = 0; i < state.challans.length; i++) {
        if (state.challans[i].id === id) { c = state.challans[i]; break; }
    }
    if (!c) return toast('Challan not found', true);
    var text = '*MURJI RAVJI & CO.*\nChallan: ' + c.id + '\nDate: ' + c.date +
        '\nProduct: ' + c.product + '\nVol: ' + fmtN(c.vol) + ' L\nWeight: ' + fmtKG(c.weight) + ' KG' +
        '\nFrom: ' + (c.from || '-') + '\nTo: ' + (c.to || '-') + '\nVehicle: ' + c.vehicle;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
}

// Window Bridge
(function (w) {
    const exports = {
        fmt, fmtN, fmtKG, today, getDensity, toKG, escH,
        dualCalc, priceCalc, onDensityChangeForPrice, toggleCustomTerm,
        toast, switchPage, renderTicker,
        commonStyle, previewScript, openPrintWindow, downloadChallanPDF, exportInventoryExcel, shareWhatsApp
    };
    for (const key in exports) {
        if (typeof exports[key] === 'function') {
            w[key] = exports[key];
        }
    }
})(window);
