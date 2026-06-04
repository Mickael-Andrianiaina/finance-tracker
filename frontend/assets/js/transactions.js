// Format number as currency (Ariary)
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 2 }).format(amount);
}

// Set default date to today
function setDefaultDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    document.getElementById("date").value = `${year}-${month}-${day}`;
}

async function loadSelects() {
    try {
        const accounts = await request("accounts/all");
        const categories = await request("categories/all");

        const accountSelect = document.getElementById("account_id");
        if (accounts.length === 0) {
            accountSelect.innerHTML = '<option value="">-- Veuillez d\'abord créer un compte --</option>';
        } else {
            accountSelect.innerHTML = accounts.map(a =>
                `<option value="${a.id}">${a.name} (Solde: ${formatCurrency(a.balance)})</option>`
            ).join("");
        }

        const categorySelect = document.getElementById("category_id");
        if (categories.length === 0) {
            categorySelect.innerHTML = '<option value="">-- Veuillez d\'abord créer une catégorie --</option>';
        } else {
            categorySelect.innerHTML = `
                <option value="">-- Sélectionnez une catégorie --</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
            `;
        }
    } catch (e) {
        console.error("Error loading selectors:", e);
    }
}

// Handle toggling of category selector when transaction type changes
function toggleCategoryRequired() {
    const type = document.getElementById("type").value;
    const categorySelect = document.getElementById("category_id");
    
    if (type === "income") {
        categorySelect.disabled = true;
        categorySelect.value = "";
    } else {
        categorySelect.disabled = false;
    }
}

async function createTransaction() {
    const account_id = document.getElementById("account_id").value;
    const category_id = document.getElementById("category_id").value;
    const type = document.getElementById("type").value;
    const amountInput = document.getElementById("amount").value.trim();
    const note = document.getElementById("note").value.trim();
    const date = document.getElementById("date").value;

    if (!account_id) {
        alert("⚠️ Veuillez sélectionner un compte.");
        return;
    }
    
    if (type === "expense" && !category_id) {
        alert("⚠️ Veuillez sélectionner une catégorie pour une dépense.");
        return;
    }

    if (amountInput === "" || parseFloat(amountInput) <= 0) {
        alert("⚠️ Veuillez saisir un montant supérieur à 0.");
        return;
    }

    const data = {
        account_id: parseInt(account_id),
        category_id: category_id ? parseInt(category_id) : null,
        type,
        amount: parseFloat(amountInput),
        note,
        date
    };

    try {
        const res = await request("transactions/create", "POST", data);

        if (res.error) {
            alert("❌ Erreur: " + res.error);
        } else {
            if (res.warning) {
                alert("⚠️ Attention: " + res.warning + "\n\nLa transaction a été créée mais a dépassé le budget.");
            } else {
                alert("✔ " + res.message);
            }
            
            // Reset input values
            document.getElementById("amount").value = "";
            document.getElementById("note").value = "";
            setDefaultDate();
            
            // Reload selects to update account balance display
            loadSelects();
        }
    } catch (e) {
        alert("❌ Erreur de communication avec le serveur.");
    }
}

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
    setDefaultDate();
    loadSelects();
});