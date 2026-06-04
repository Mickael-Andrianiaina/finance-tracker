function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('fr-MG', { style:'currency', currency:'MGA', minimumFractionDigits: 2 }).format(amount);
}

function setDefaultMonth() {
  const d = new Date();
  document.getElementById("month").value =
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

async function initSummary() {
  setDefaultMonth();
  try {
    const accounts = await request("accounts/all");
    const sel = document.getElementById("account_id");
    if (accounts.length === 0) {
      sel.innerHTML = '<option value="">— Aucun compte disponible —</option>';
      document.getElementById("categoryTable").innerHTML =
        `<tr><td colspan="2" style="text-align:center;color:var(--danger);padding:2rem;">Créez d'abord un compte.</td></tr>`;
      return;
    }
    sel.innerHTML = accounts.map(a =>
      `<option value="${a.id}">${a.name} (${formatCurrency(a.balance)})</option>`
    ).join("");
    loadSummary();
  } catch (e) { console.error("Init error:", e); }
}

async function loadSummary() {
  const accountId = document.getElementById("account_id").value;
  const month     = document.getElementById("month").value;
  if (!accountId || !month) return;

  try {
    const data = await request(`summary/monthly&account_id=${accountId}&month=${month}`);

    const incomeEl  = document.getElementById("income");
    const expenseEl = document.getElementById("expense");
    const netEl     = document.getElementById("net");

    if (window.animateValue) {
      animateValue(incomeEl,  parseFloat(data.income));
      animateValue(expenseEl, parseFloat(data.expense));
      animateValue(netEl,     parseFloat(data.net));
    } else {
      incomeEl.textContent  = formatCurrency(data.income);
      expenseEl.textContent = formatCurrency(data.expense);
      netEl.textContent     = formatCurrency(data.net);
    }

    const netVal = parseFloat(data.net);
    netEl.style.color = netVal < 0 ? "var(--danger)" : netVal > 0 ? "var(--success)" : "var(--info)";

    // Category table
    const tbody = document.getElementById("categoryTable");
    if (!data.byCategory || data.byCategory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:var(--text-secondary);padding:2rem;">Aucune dépense pour ce mois.</td></tr>`;
    } else {
      tbody.innerHTML = data.byCategory.map(c => `
        <tr>
          <td style="font-weight:500;color:var(--text-primary);">${c.name}</td>
          <td style="color:var(--danger);font-weight:600;font-family:'DM Mono',monospace;">${formatCurrency(c.total)}</td>
        </tr>`).join("");
    }

    // Progress bars
    const progressContainer = document.getElementById("progress");
    if (!data.progress || data.progress.length === 0) {
      progressContainer.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:1rem 0;">Aucune catégorie enregistrée.</p>`;
    } else {
      progressContainer.innerHTML = data.progress.map((p, i) => {
        const pct = Math.min(p.progress_percent, 100);
        const cls = p.progress_percent >= 100 ? "progress-danger" : p.progress_percent >= 80 ? "progress-warning" : "";
        const limitDisplay = p.monthly_limit !== null ? formatCurrency(p.monthly_limit) : "∞";
        const badgeColor   = p.progress_percent >= 100 ? "var(--danger)" : p.progress_percent >= 80 ? "var(--warn)" : "var(--text-secondary)";

        return `
          <div class="progress-container ${cls}" style="animation-delay:${i*0.07}s">
            <div class="progress-header">
              <span style="color:var(--text-primary);font-weight:500;">${p.name}</span>
              <span style="color:${badgeColor};font-family:'DM Mono',monospace;font-size:0.82rem;">
                ${formatCurrency(p.spent)} / ${limitDisplay} &nbsp;(${p.progress_percent}%)
              </span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" data-width="${pct}" style="width:0%;"></div>
            </div>
          </div>`;
      }).join("");

      // Animate progress bars after render
      requestAnimationFrame(() => {
        document.querySelectorAll('.progress-bar-fill[data-width]').forEach(el => {
          setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 100);
        });
      });
    }
  } catch (e) { console.error("Summary error:", e); }
}

document.addEventListener("DOMContentLoaded", initSummary);