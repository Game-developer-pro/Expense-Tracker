import { auth, db, onAuthStateChanged, signOut, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from './auth.js';

const listEl = document.getElementById('list');
const textEl = document.getElementById('text');
const amountEl = document.getElementById('amount');
const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
let dateEl = document.getElementById('date')
let dateBadgeEl = document.getElementById('date-badge');
const filterIncomeEl = document.getElementById('filter-income');
const filterExpenseEl = document.getElementById('filter-expense');
const currencyEl = document.getElementById('currency-select');
const currencyIcon = document.getElementById('currencyIcon');
const logoutBtn = document.getElementById('logoutBtn');

// Currency Symbol Map
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹'
};

let currency = localStorage.getItem('currency') || 'USD';
let transactions = [];
let currentUser = null;

function updateCurrencyUI() {
    if (currencyEl) {
        currencyEl.value = currency;
    }
    if (currencyIcon) {
        currencyIcon.textContent = currencySymbols[currency] || '$';
    }
}

updateCurrencyUI();

const currentDate = new Date().toLocaleDateString();
if (dateBadgeEl) {
    dateBadgeEl.textContent = currentDate;
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        localStorage.setItem('userId', user.uid);
        await loadTransactions();
        updateBalance();
    } else {
        currentUser = null;
        transactions = [];
        // Redirect to login if not on login/signup page
        const currentPage = window.location.pathname;
        if (!currentPage.includes('login.html') && !currentPage.includes('signup.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Load transactions from Firestore
async function loadTransactions() {
    if (!currentUser) return;

    try {
        const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
        const querySnapshot = await getDocs(transactionsRef);

        transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date (newest first) by default
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        init();
        updateBalance();
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

// Add transaction to Firestore
window.addTransaction = async function () {
    const addBtn = document.getElementById('addTransactionBtn');

    // Hide any previous errors
    if (typeof hideButtonError === 'function') {
        hideButtonError('addTransactionBtn');
    }
    clearErrors();

    if (!currentUser) {
        if (typeof showButtonError === 'function') {
            showButtonError('addTransactionBtn', 'Please login first to add transactions');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    let hasError = false;

    if (!textEl || textEl.value.trim() === '') {
        showError('text-error', 'Please add a description');
        hasError = true;
    }
    if (!amountEl || amountEl.value.trim() === '' || +amountEl.value <= 0) {
        showError('amount-error', 'Please add a valid amount');
        hasError = true;
    }

    const typeInput = document.querySelector('input[name="type"]:checked');
    if (!typeInput) {
        if (typeof showButtonError === 'function') {
            showButtonError('addTransactionBtn', 'Please select income or expense');
        }
        return;
    }

    if (hasError) {
        if (typeof showButtonError === 'function') {
            showButtonError('addTransactionBtn', 'Please fix the errors above');
        }
        return;
    }

    // Show loading state
    if (addBtn) {
        addBtn.classList.add('loading');
        addBtn.disabled = true;
    }

    const transaction = {
        description: textEl.value,
        amount: +amountEl.value,
        type: typeInput.value,
        date: dateEl.value || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    try {
        const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
        await addDoc(transactionsRef, transaction);

        window.location.href = 'history.html';
    } catch (error) {
        console.error("Error adding transaction:", error);
        if (typeof showButtonError === 'function') {
            showButtonError('addTransactionBtn', 'Failed to add transaction. Please try again.');
        }

        // Remove loading state on error
        if (addBtn) {
            addBtn.classList.remove('loading');
            addBtn.disabled = false;
        }
    }
}

function init(items = transactions) {
    if (!listEl) return;

    listEl.innerHTML = '';

    // Dashboard check: currency selector is only on the dashboard
    const isDashboard = document.getElementById('currency-select') !== null;

    let displayItems = [...items];
    if (isDashboard) {
        // Show only the last 3 transactions (most recent)
        displayItems = displayItems.slice(0, 3);
    }

    if (displayItems.length === 0) {
        listEl.innerHTML = '<li class="list-item" style="text-align: center; color: #6B7280;">No transactions yet</li>';
        return;
    }

    displayItems.forEach(transaction => {
        const sign = transaction.type === 'expense' ? '-' : '+';
        const typeClass = transaction.type === 'expense' ? 'minus' : 'plus';

        const li = document.createElement('li');
        li.className = `list-item ${typeClass}`;

        li.innerHTML = `
        <div class="item-left">
            <div class="item-info">
                <h4>${transaction.description}</h4>
                <p>${transaction.date}</p>
            </div>
        </div>
        <div class="item-right">
             <p class="item-amount ${typeClass}">${sign}${formatCurrency(transaction.amount)}</p>
             <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">Delete</button>
        </div>
        `;

        listEl.appendChild(li);
    });
}

function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
}

function clearErrors() {
    const textErr = document.getElementById('text-error');
    const amtErr = document.getElementById('amount-error');
    if (textErr) textErr.textContent = '';
    if (amtErr) amtErr.textContent = '';
}

// Delete transaction from Firestore
window.deleteTransaction = async function (id) {
    if (!currentUser) return;

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "transactions", id));
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateBalance();
        filterTransactions();
    } catch (error) {
        console.error("Error deleting transaction:", error);
        alert('Failed to delete transaction. Please try again.');
    }
}

function updateBalance() {
    let income = 0;
    let expense = 0;

    if (!moneyPlusEl || !moneyMinusEl || !balanceEl) return;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            income += Number(transaction.amount);
        } else if (transaction.type === 'expense') {
            expense += Number(transaction.amount);
        }
    });

    moneyPlusEl.innerHTML = formatCurrency(income);
    moneyMinusEl.innerHTML = formatCurrency(-expense);

    balanceEl.textContent = formatCurrency(income - expense);

    if (income - expense < 0) {
        balanceEl.style.color = '#EF4444';
    } else {
        balanceEl.style.color = '#10B981';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

// Filter Event Listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterTransactions();
    });
});

if (currencyEl) {
    currencyEl.addEventListener('change', (e) => {
        currency = e.target.value;
        localStorage.setItem('currency', currency);
        updateCurrencyUI();
        updateBalance();
        init();
    });
}

function filterTransactions() {
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn ? activeBtn.dataset.filter : 'all';

    // Create copy to filter/sort to avoid mutating original data
    let displayTransactions = [...transactions];

    if (filter !== 'all') {
        displayTransactions = displayTransactions.filter(transaction => transaction.type === filter);
    }

    const sort = document.getElementById('sort');
    if (sort) {
        displayTransactions.sort((a, b) => {
            if (sort.value == 'newest') {
                return new Date(b.date) - new Date(a.date);
            } else if (sort.value == 'oldest') {
                return new Date(a.date) - new Date(b.date);
            } else if (sort.value == 'highest') {
                return b.amount - a.amount;
            } else if (sort.value == 'lowest') {
                return a.amount - b.amount;
            }
        });
    }

    init(displayTransactions);
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Error signing out:", error);
        }
    });
}

// Make filterTransactions available globally for the sort dropdown
window.filterTransactions = filterTransactions;
