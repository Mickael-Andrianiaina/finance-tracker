# 💰 Finance Tracker — Gestion Financière Personnelle (Ariary)

Application web de gestion des finances personnelles construite avec une **API REST PHP/MySQL** et un **frontend Vanilla JS**. Conçue pour le marché malgache, elle utilise l'**Ariary (Ar / MGA)** comme devise par défaut.

---

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| 🏦 **Comptes** | Créer, lister et supprimer des comptes (Cash, Courant, Épargne, Investissement) |
| 🏷 **Catégories** | Organiser les transactions par catégorie avec limite mensuelle optionnelle |
| 💸 **Transactions** | Enregistrer revenus et dépenses liés à un compte et une catégorie |
| 📊 **Résumé** | Vue mensuelle : revenus, dépenses, solde net et répartition par catégorie |
| 🌐 **Mode hors-ligne** | Fallback automatique sur `localStorage` si le backend PHP/MySQL est inaccessible |

---

## 🧱 Architecture

```
finance-tracker/
├── backend/
│   ├── config/
│   │   └── database.php          # Connexion PDO MySQL
│   ├── controllers/
│   │   ├── AccountController.php # CRUD comptes
│   │   ├── CategoryController.php# CRUD catégories
│   │   └── TransactionController.php # CRUD transactions
│   ├── services/
│   │   ├── AccountService.php    # Logique de mise à jour du solde
│   │   ├── TransactionService.php
│   │   └── SummaryService.php    # Agrégats mensuels
│   ├── models/
│   │   ├── Account.php
│   │   ├── Category.php
│   │   └── Transaction.php
│   ├── core/
│   │   ├── Validator.php
│   │   └── Response.php
│   ├── routes/
│   │   └── api.php
│   └── index.php                 # Point d'entrée — routeur principal
├── frontend/
│   ├── assets/
│   │   ├── css/styles.css        # Thème dark luxury, animations, responsive
│   │   ├── js/
│   │   │   ├── api.js            # Client HTTP + moteur mock localStorage
│   │   │   ├── accounts.js
│   │   │   ├── categories.js
│   │   │   ├── transactions.js
│   │   │   ├── summary.js
│   │   │   └── ui.js             # Toast, hamburger, compteur animé
│   │   ├── accounts.html
│   │   ├── categories.html
│   │   ├── transactions.html
│   │   └── summary.html
│   └── app.js                    # Dashboard principal
├── index.html                    # Point d'entrée frontend
├── database.sql                  # Schéma MySQL
└── README.md
```

### Backend
- **PHP** sans framework — architecture MVC simplifiée (Controllers / Services / Models)
- **MySQL** pour le stockage relationnel avec contraintes de clés étrangères
- Gestion des erreurs via try/catch avec codes HTTP appropriés (400, 500)

### Frontend
- **Vanilla HTML / CSS / JS** — aucune dépendance npm, chargement instantané
- **Thème dark luxury** : fond #080d14, accent vert émeraude `#3dffa0`, animations fluides
- **Double mode** : API REST si disponible, sinon bascule silencieuse sur `localStorage`

---

## ⚙️ Installation

### Option A — Frontend uniquement (aucun serveur requis)

1. Ouvrir `index.html` directement dans le navigateur (double-clic ou *Live Server*)
2. L'application détecte l'absence de backend et charge automatiquement une base de démonstration dans `localStorage` avec des comptes, catégories et transactions d'exemple

### Option B — Installation complète (PHP + MySQL)

**Prérequis :** XAMPP, WAMP, Laragon ou tout serveur Apache + PHP 7.4+ + MySQL 5.7+

```bash
# 1. Copier le projet dans le dossier web
cp -r finance-tracker/ /xampp/htdocs/

# 2. Créer la base de données
mysql -u root -p < database.sql

# 3. Configurer la connexion
nano backend/config/database.php
```

```php
// backend/config/database.php
$host   = 'localhost';
$dbname = 'finance_tracker';
$user   = 'root';
$pass   = '';          // ← votre mot de passe MySQL
```

```
# 4. Lancer Apache + MySQL, puis accéder à :
http://localhost/finance-tracker/
```

---

## 🗄️ Schéma de la base de données

```sql
accounts
  id            INT  PK AUTO_INCREMENT
  name          VARCHAR(100)          -- Nom unique du compte
  type          VARCHAR(50)           -- cash | checking | savings | investment
  balance       DECIMAL(10,2)         -- Solde courant (toujours > 0 à la création)

categories
  id            INT  PK AUTO_INCREMENT
  name          VARCHAR(100)
  monthly_limit DECIMAL(10,2) NULL    -- Budget mensuel optionnel

transactions
  id               INT  PK AUTO_INCREMENT
  account_id       INT  FK → accounts(id)
  category_id      INT  FK → categories(id)
  type             ENUM('income','expense')
  amount           DECIMAL(10,2)
  note             TEXT
  date_transaction DATE
```

---

## 🔌 API REST

**Base URL :** `http://localhost/finance-tracker/backend/index.php?route=`

### Comptes

| Méthode | Route | Description |
|---|---|---|
| `GET` | `accounts/all` | Lister tous les comptes |
| `POST` | `accounts/create` | Créer un compte |
| `POST` | `accounts/delete` | Supprimer un compte |

**POST** `accounts/create`
```json
{
  "name":    "Mon Épargne",
  "type":    "savings",
  "balance": 150000
}
```

### Catégories

| Méthode | Route | Description |
|---|---|---|
| `GET` | `categories/all` | Lister toutes les catégories |
| `POST` | `categories/create` | Créer une catégorie |

### Transactions

| Méthode | Route | Description |
|---|---|---|
| `POST` | `transactions/create` | Enregistrer une transaction |

**POST** `transactions/create`
```json
{
  "account_id":       1,
  "category_id":      2,
  "type":             "expense",
  "amount":           12000,
  "note":             "Taxi",
  "date_transaction": "2026-06-04"
}
```

### Résumé mensuel

| Méthode | Route | Description |
|---|---|---|
| `GET` | `summary/monthly&account_id=1&month=2026-06` | Résumé revenus/dépenses d'un mois |

---

## 🛡️ Règles métier

| Règle | Niveau | Détail |
|---|---|---|
| ❌ Solde initial ≤ 0 interdit | Backend + Frontend | Un compte ne peut être créé qu'avec un solde **strictement supérieur à 0** |
| ❌ Nom de compte dupliqué interdit | Backend + Frontend | Deux comptes ne peuvent pas porter le **même nom** (insensible à la casse) |
| ❌ Suppression bloquée si transactions | Backend | Un compte lié à des transactions ne peut pas être supprimé |
| ❌ Dépense bloquée si solde insuffisant | Backend (`AccountService`) | Aucune dépense ne peut rendre le solde négatif |
| ⚠️ Dépassement de budget | Frontend (toast) | Si une dépense dépasse la limite mensuelle de la catégorie, la transaction est enregistrée mais un avertissement est affiché |
| 🔄 Mise à jour automatique du solde | Backend | Le solde du compte est recalculé après chaque transaction |

---

## 🎨 Design System

Le thème CSS repose sur des variables globales définies dans `styles.css` :

```css
--bg-primary:   #080d14   /* Fond principal — noir profond */
--accent:       #3dffa0   /* Vert émeraude — couleur d'action */
--danger:       #ff5e7e   /* Rouge — erreurs et suppressions */
--warn:         #ffba3d   /* Ambre — avertissements budget */
--info:         #5eb8ff   /* Bleu — informations */
```

**Polices :** `Space Grotesk` (interface) + `DM Mono` (montants)

---

## ⚖️ Choix techniques

**Vanilla JS plutôt que React/Vue** — chargement quasi-instantané, aucune étape de build, déploiement par simple copie de fichiers.

**Double mode API/localStorage** — l'application est entièrement fonctionnelle sans serveur, ce qui facilite les démonstrations et les tests. Le basculement est transparent pour l'utilisateur.

**PHP sans framework** — architecture MVC suffisante pour la complexité du projet, sans surcharge de dépendances.

**Devise MGA (Ariary)** — formatage via `Intl.NumberFormat('fr-MG', { currency: 'MGA' })` pour des montants lisibles (ex: `150 000 Ar`).

**Pas d'authentification** — hors scope du projet, centré sur la logique de gestion budgétaire.

---

## 📄 Licence

Projet open-source à usage personnel et éducatif.
