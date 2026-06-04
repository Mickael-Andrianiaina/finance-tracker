// Format number as currency (Ariary)
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 2 }).format(amount);
}

async function createAccount() {
    const name    = document.getElementById("name").value.trim();
    const type    = document.getElementById("type").value;
    const balance = document.getElementById("balance").value.trim();

    // ── Validation côté client ───────────────────────────────
    if (!name || balance === "") {
        alert("⚠️ Veuillez remplir tous les champs obligatoires.");
        return;
    }

    const balanceNum = parseFloat(balance);

    // ❌ RÈGLE 1 : Solde initial doit être > 0
    if (isNaN(balanceNum) || balanceNum <= 0) {
        alert("❌ Le solde initial doit être supérieur à 0.");
        // Highlight the field
        const balanceInput = document.getElementById("balance");
        balanceInput.style.borderColor = "var(--danger)";
        balanceInput.style.boxShadow   = "0 0 0 3px var(--danger-glow), 0 0 20px rgba(255,94,126,0.1)";
        setTimeout(() => {
            balanceInput.style.borderColor = "";
            balanceInput.style.boxShadow   = "";
        }, 2500);
        return;
    }

    const res = await request("accounts/create", "POST", {
        name, type, balance: balanceNum
    });

    if (res.error) {
        alert("❌ " + res.error);
        // Si erreur de nom dupliqué, highlight le champ nom
        if (res.error.toLowerCase().includes("nom")) {
            const nameInput = document.getElementById("name");
            nameInput.style.borderColor = "var(--danger)";
            nameInput.style.boxShadow   = "0 0 0 3px var(--danger-glow), 0 0 20px rgba(255,94,126,0.1)";
            setTimeout(() => {
                nameInput.style.borderColor = "";
                nameInput.style.boxShadow   = "";
            }, 2500);
        }
    } else {
        alert("✔ " + res.message);
        // Clear input fields
        document.getElementById("name").value    = "";
        document.getElementById("balance").value = "";
        loadAccounts();
    }
}

async function deleteAccount(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce compte ?")) return;

    const res = await request("accounts/delete", "POST", { id });

    if (res.error) {
        alert("❌ Impossible de supprimer: " + res.error);
    } else {
        alert("✔ " + res.message);
        loadAccounts();
    }
}

// Badge config per account type
const TYPE_CONFIG = {
    cash:       { label: "💵 Cash",        cls: "badge-cash"       },
    checking:   { label: "🏦 Courant",     cls: "badge-checking"   },
    savings:    { label: "🐖 Épargne",     cls: "badge-savings"    },
    investment: { label: "📈 Invest.",     cls: "badge-investment" },
};

async function loadAccounts() {
    try {
        const data = await request("accounts/all");
        const listContainer  = document.getElementById("accountsList");
        const countBadge     = document.getElementById("accounts-count");

        if (countBadge) countBadge.textContent = data.length;

        if (!data || data.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏦</div>
                    <strong>Aucun compte pour le moment</strong>
                    <p>Créez votre premier compte pour commencer à suivre vos finances.</p>
                </div>
            `;
            return;
        }

        let html = "";
        data.forEach((a, i) => {
            const cfg   = TYPE_CONFIG[a.type] || { label: a.type, cls: "" };
            const style = i < 5 ? `style="animation-delay:${0.05 * (i+1)}s"` : "";
            html += `
                <div class="item-row" ${style}>
                    <div class="item-info">
                        <h4>${escapeHtml(a.name)}</h4>
                        <div class="item-meta">
                            <span class="account-type-badge ${cfg.cls}">${cfg.label}</span>
                            <span class="account-balance">${formatCurrency(a.balance)}</span>
                        </div>
                    </div>
                    <button class="btn-danger" onclick="deleteAccount(${a.id})">
                        🗑 Supprimer
                    </button>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    } catch (e) {
        console.error("Error loading accounts:", e);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ── Live validation hints ───────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const balanceInput = document.getElementById("balance");
    const hintBalance  = document.getElementById("hint-balance");

    if (balanceInput && hintBalance) {
        balanceInput.addEventListener("input", () => {
            const val = parseFloat(balanceInput.value);
            if (balanceInput.value === "") {
                hintBalance.className = "field-hint";
                hintBalance.innerHTML = "<span>⚠ Le solde doit être strictement supérieur à 0.</span>";
                balanceInput.classList.remove("field-valid", "field-error");
            } else if (isNaN(val) || val <= 0) {
                hintBalance.className = "field-hint hint-error";
                hintBalance.innerHTML = "<span>❌ Solde invalide — doit être > 0.</span>";
                balanceInput.classList.add("field-error");
                balanceInput.classList.remove("field-valid");
            } else {
                hintBalance.className = "field-hint hint-success";
                hintBalance.innerHTML = `<span>✓ Solde valide : ${formatCurrency(val)}</span>`;
                balanceInput.classList.add("field-valid");
                balanceInput.classList.remove("field-error");
            }
        });
    }

    const nameInput = document.getElementById("name");
    const hintName  = document.getElementById("hint-name");
    if (nameInput && hintName) {
        nameInput.addEventListener("input", () => {
            if (nameInput.value.trim() === "") {
                hintName.className = "field-hint hint-info";
                hintName.innerHTML = "Choisissez un nom unique pour ce compte.";
                nameInput.classList.remove("field-valid", "field-error");
            } else {
                hintName.className = "field-hint hint-success";
                hintName.innerHTML = "✓ Nom saisi.";
                nameInput.classList.add("field-valid");
                nameInput.classList.remove("field-error");
            }
        });
    }
});

// Initial load
loadAccounts();