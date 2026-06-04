const pathParts = window.location.pathname.split('/');
const frontendIndex = pathParts.indexOf("frontend");
const basePath = frontendIndex !== -1 ? pathParts.slice(0, frontendIndex).join('/') + '/' : '/';
const API = window.location.origin + basePath + "backend/index.php?route=";

// State to track if we should fall back to localStorage mock
let useLocalMock = localStorage.getItem('use_local_mock') === 'true' || window.location.protocol === 'file:';

// Run check to verify if backend API is reachable
if (window.location.protocol !== 'file:') {
    fetch(API + "accounts/all", { method: 'GET' })
        .then(res => {
            if (res.ok) {
                if (useLocalMock) {
                    useLocalMock = false;
                    localStorage.setItem('use_local_mock', 'false');
                    console.log("✔ REST API backend connected successfully.");
                }
            } else {
                throw new Error("Backend responded with error status");
            }
        })
        .catch(err => {
            if (!useLocalMock) {
                useLocalMock = true;
                localStorage.setItem('use_local_mock', 'true');
                console.warn("⚠ REST API backend is unreachable. Running in client-side Mock Storage mode.", err);
            }
        });
}

// Initialize mock DB in localStorage if it is empty
function initMockDb() {
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!localStorage.getItem("db_accounts")) {
        const initialAccounts = [
            { id: 1, name: "Compte Courant", type: "checking", balance: 1250.50 },
            { id: 2, name: "Épargne Solidaire", type: "savings", balance: 5000.00 }
        ];
        localStorage.setItem("db_accounts", JSON.stringify(initialAccounts));
    }
    if (!localStorage.getItem("db_categories")) {
        const initialCategories = [
            { id: 1, name: "Alimentation", monthly_limit: 300.00 },
            { id: 2, name: "Transports", monthly_limit: 100.00 },
            { id: 3, name: "Loisirs & Sorties", monthly_limit: 150.00 }
        ];
        localStorage.setItem("db_categories", JSON.stringify(initialCategories));
    }
    if (!localStorage.getItem("db_transactions")) {
        const initialTransactions = [
            { id: 1, account_id: 1, category_id: 1, type: "expense", amount: 45.20, note: "Courses Leclerc", date_transaction: `${currentMonth}-01` },
            { id: 2, account_id: 1, category_id: 2, type: "expense", amount: 30.00, note: "Navigo", date_transaction: `${currentMonth}-02` },
            { id: 3, account_id: 1, category_id: null, type: "income", amount: 1500.00, note: "Salaire", date_transaction: `${currentMonth}-01` }
        ];
        localStorage.setItem("db_transactions", JSON.stringify(initialTransactions));
    }
}

// Client-side mock backend handler
function mockRequest(route, method, data) {
    initMockDb();

    const getTable = (name) => JSON.parse(localStorage.getItem("db_" + name) || "[]");
    const setTable = (name, val) => localStorage.setItem("db_" + name, JSON.stringify(val));

    // Parse route and query parameters (e.g. summary/monthly&account_id=1&month=2026-06)
    let routePath = route;
    let queryParams = {};
    if (route.includes('&') || route.includes('?')) {
        const parts = route.split(/[&?]/);
        routePath = parts[0];
        for (let i = 1; i < parts.length; i++) {
            const pair = parts[i].split('=');
            if (pair.length === 2) {
                queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
        }
    }

    if (routePath === "accounts/all" && (method === "GET" || method === "POST")) {
        return getTable("accounts");
    }

    if (routePath === "accounts/create" && method === "POST") {
        if (!data || !data.name || data.balance === undefined || data.balance === "") {
            return { error: "Données invalides" };
        }
        const accounts = getTable("accounts");
        const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
        const newAccount = {
            id: newId,
            name: data.name,
            type: data.type || "checking",
            balance: parseFloat(data.balance)
        };
        accounts.push(newAccount);
        setTable("accounts", accounts);
        return { message: "Compte créé avec succès" };
    }

    if (routePath === "accounts/delete" && method === "POST") {
        if (!data || !data.id) {
            return { error: "ID requis" };
        }
        const accountId = parseInt(data.id);
        const transactions = getTable("transactions");
        const hasTransactions = transactions.some(t => parseInt(t.account_id) === accountId);
        if (hasTransactions) {
            return { error: "Impossible de supprimer un compte avec des transactions" };
        }
        const accounts = getTable("accounts");
        const filtered = accounts.filter(a => a.id !== accountId);
        setTable("accounts", filtered);
        return { message: "Compte supprimé avec succès" };
    }

    if (routePath === "categories/all" && (method === "GET" || method === "POST")) {
        return getTable("categories");
    }

    if (routePath === "categories/create" && method === "POST") {
        if (!data || !data.name) {
            return { error: "Le nom de la catégorie est requis" };
        }
        const categories = getTable("categories");
        const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
        const newCategory = {
            id: newId,
            name: data.name,
            monthly_limit: data.monthly_limit !== null && data.monthly_limit !== undefined && data.monthly_limit !== "" ? parseFloat(data.monthly_limit) : null
        };
        categories.push(newCategory);
        setTable("categories", categories);
        return { message: "Catégorie créée avec succès" };
    }

    if (routePath === "transactions/create" && method === "POST") {
        if (!data || !data.account_id || !data.type || data.amount === undefined || data.amount === "") {
            return { error: "Données invalides" };
        }
        const accountId = parseInt(data.account_id);
        const categoryId = data.category_id ? parseInt(data.category_id) : null;
        const type = data.type;
        const amount = parseFloat(data.amount);
        const note = data.note || "";
        const date = data.date || new Date().toISOString().split('T')[0];

        if (amount <= 0 || (type !== 'income' && type !== 'expense')) {
            return { error: "Montant ou type de transaction invalide" };
        }

        const accounts = getTable("accounts");
        const accountIdx = accounts.findIndex(a => a.id === accountId);
        if (accountIdx === -1) {
            return { error: "Compte introuvable" };
        }

        let balance = parseFloat(accounts[accountIdx].balance);
        if (type === 'income') {
            balance += amount;
        } else {
            balance -= amount;
        }

        if (balance < 0) {
            return { error: "Solde insuffisant" };
        }

        // Check category monthly limit if expense
        let warning = null;
        if (type === 'expense' && categoryId !== null) {
            const categories = getTable("categories");
            const cat = categories.find(c => c.id === categoryId);
            if (cat && cat.monthly_limit) {
                const limit = parseFloat(cat.monthly_limit);
                // Sum expenses for this category in the transaction's month
                const txMonth = date.substring(0, 7); // YYYY-MM
                const transactions = getTable("transactions");
                const currentMonthSpent = transactions
                    .filter(t => t.category_id === categoryId && t.type === 'expense' && t.date_transaction.substring(0, 7) === txMonth)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
                if (currentMonthSpent + amount > limit) {
                    warning = "Limite mensuelle dépassée";
                }
            }
        }

        // Save updated balance
        accounts[accountIdx].balance = balance;
        setTable("accounts", accounts);

        // Save transaction
        const transactions = getTable("transactions");
        const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
        const newTx = {
            id: newId,
            account_id: accountId,
            category_id: categoryId,
            type,
            amount,
            note,
            date_transaction: date
        };
        transactions.push(newTx);
        setTable("transactions", transactions);

        const res = { message: "Transaction créée avec succès" };
        if (warning) {
            res.warning = warning;
        }
        return res;
    }

    if (routePath === "summary/monthly" && (method === "GET" || method === "POST")) {
        const accountId = parseInt(queryParams.account_id);
        const month = queryParams.month; // YYYY-MM

        if (!accountId || !month) {
            return { error: "Compte et mois requis" };
        }

        const transactions = getTable("transactions");
        const categories = getTable("categories");

        // filter by account and month
        const accountTx = transactions.filter(t => t.account_id === accountId && t.date_transaction.substring(0, 7) === month);

        const income = accountTx.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = accountTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Group by category
        const byCategoryMap = {};
        accountTx.filter(t => t.type === 'expense' && t.category_id !== null).forEach(t => {
            const cat = categories.find(c => c.id === t.category_id);
            const catName = cat ? cat.name : "Inconnue";
            byCategoryMap[catName] = (byCategoryMap[catName] || 0) + parseFloat(t.amount);
        });
        const byCategory = Object.keys(byCategoryMap).map(name => ({
            name,
            total: byCategoryMap[name]
        }));

        // Budget progress (check all transactions in the month for each category, regardless of account)
        const progress = categories.map(c => {
            const limit = c.monthly_limit !== null ? parseFloat(c.monthly_limit) : null;
            const spent = transactions
                .filter(t => t.category_id === c.id && t.type === 'expense' && t.date_transaction.substring(0, 7) === month)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            return {
                id: c.id,
                name: c.name,
                monthly_limit: c.monthly_limit,
                spent,
                progress_percent: limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(2)) : 0
            };
        });

        return {
            income,
            expense,
            net: income - expense,
            byCategory,
            progress
        };
    }

    return { error: "Route introuvable" };
}

// Primary API request handler
async function request(route, method = "GET", data = null) {
    if (useLocalMock) {
        // Run with mock database delay to simulate network feel (200ms)
        await new Promise(resolve => setTimeout(resolve, 200));
        return mockRequest(route, method, data);
    }

    try {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const res = await fetch(API + route, options);
        if (!res.ok) {
            throw new Error(`HTTP error status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.warn(`REST API failed. Switching to LocalStorage mock mode.`, error);
        useLocalMock = true;
        localStorage.setItem('use_local_mock', 'true');
        return mockRequest(route, method, data);
    }
}