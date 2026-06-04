// Format number as currency (Ariary)
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === "") return "Aucune";
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 2 }).format(amount);
}

async function createCategory() {
    const name = document.getElementById("name").value.trim();
    const limitInput = document.getElementById("limit").value.trim();
    const monthly_limit = limitInput !== "" ? parseFloat(limitInput) : null;

    if (!name) {
        alert("⚠️ Le nom de la catégorie est requis.");
        return;
    }

    const res = await request("categories/create", "POST", {
        name,
        monthly_limit
    });

    if (res.error) {
        alert("❌ Erreur: " + res.error);
    } else {
        alert("✔ " + res.message);
        // Clear input fields
        document.getElementById("name").value = "";
        document.getElementById("limit").value = "";
        loadCategories();
    }
}

async function loadCategories() {
    try {
        const data = await request("categories/all");
        const listContainer = document.getElementById("categoriesList");

        if (data.length === 0) {
            listContainer.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">
                    Aucune catégorie enregistrée pour le moment.
                </p>
            `;
            return;
        }

        let html = "";
        data.forEach(c => {
            const hasLimit = c.monthly_limit !== null;
            const limitText = hasLimit ? formatCurrency(c.monthly_limit) : "Aucune limite";
            const limitStyle = hasLimit ? "color: var(--accent); font-weight: 600;" : "color: var(--text-secondary); font-style: italic;";
            
            html += `
                <div class="item-row">
                    <div class="item-info">
                        <h4>${c.name}</h4>
                        <p>
                            Limite mensuelle: <span style="${limitStyle}">${limitText}</span>
                        </p>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

// Initial load
loadCategories();