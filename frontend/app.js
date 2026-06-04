// Dashboard initialization and update logic

function setDefaultMonth() {
  const d = new Date();
  document.getElementById("month").value =
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 2 }).format(amount);
}

async function initDashboard() {
  setDefaultMonth();
  try {
    const accounts = await request("accounts/all");
    const sel = document.getElementById("account_id");
    if (accounts.length === 0) {
      sel.innerHTML = '<option value="">— Aucun compte disponible —</option>';
      document.getElementById("byCategory").innerHTML =
        `<tr><td colspan="2" style="text-align:center;color:var(--danger);padding:2rem;">
          Veuillez d'abord créer un compte.
         </td></tr>`;
      return;
    }
    sel.innerHTML = accounts.map(a =>
      `<option value="${a.id}">${a.name} (${formatCurrency(a.balance)})</option>`
    ).join("");
    updateDashboard();
  } catch (e) { console.error("Init error:", e); }
}

async function updateDashboard() {
  const accountId = document.getElementById("account_id").value;
  const month     = document.getElementById("month").value;
  if (!accountId || !month) return;

  try {
    const data = await request(`summary/monthly&account_id=${accountId}&month=${month}`);

    const incomeEl  = document.getElementById("income");
    const expenseEl = document.getElementById("expense");
    const netEl     = document.getElementById("net");

    // Animated counters
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

    const tbody = document.getElementById("byCategory");
    if (!data.byCategory || data.byCategory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:var(--text-secondary);padding:2rem;">Aucune dépense enregistrée.</td></tr>`;
    } else {
      tbody.innerHTML = data.byCategory.map(c => `
        <tr>
          <td style="font-weight:500;color:var(--text-primary);">${c.name}</td>
          <td style="color:var(--danger);font-weight:600;font-family:'DM Mono',monospace;">${formatCurrency(c.total)}</td>
        </tr>`).join("");
    }
  } catch (e) { console.error("Dashboard error:", e); }
}

document.addEventListener("DOMContentLoaded", initDashboard);