// API Base URL - change this to your server URL when deployed
const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    const customerForm = document.getElementById('customer-form');
    const adsForm = document.getElementById('ads-form');
    const transactionsBody = document.getElementById('transactions-body');
    const adSpendList = document.getElementById('ad-spend-list');
    const dailyResumeBody = document.getElementById('daily-resume-body');

    // Stats display elements
    const totalRevenueEl = document.getElementById('total-revenue');
    const panelCostsEl = document.getElementById('panel-costs');
    const adSpendEl = document.getElementById('ad-spend');
    const netProfitEl = document.getElementById('net-profit');

    const CURRENCY = ' MAD';

    let transactions = [];
    let adSpends = [];
    let currentAgent = localStorage.getItem('iptv_current_agent') || null;

    // ==================== API FUNCTIONS ====================

    async function fetchTransactions() {
        try {
            const response = await fetch(`${API_URL}/api/transactions`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            transactions = await response.json();
            return transactions;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showNotification('Error loading transactions', 'error');
            return [];
        }
    }

    async function fetchAdSpends() {
        try {
            const response = await fetch(`${API_URL}/api/ad-spends`);
            if (!response.ok) throw new Error('Failed to fetch ad spends');
            adSpends = await response.json();
            return adSpends;
        } catch (error) {
            console.error('Error fetching ad spends:', error);
            showNotification('Error loading ad spends', 'error');
            return [];
        }
    }

    async function addTransaction(data) {
        try {
            const response = await fetch(`${API_URL}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to add transaction');
            showNotification('Transaction added successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Error adding transaction:', error);
            showNotification('Error adding transaction', 'error');
            throw error;
        }
    }

    async function updateTransaction(id, data) {
        try {
            const response = await fetch(`${API_URL}/api/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update transaction');
            showNotification('Transaction updated successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Error updating transaction:', error);
            showNotification('Error updating transaction', 'error');
            throw error;
        }
    }

    async function deleteTransactionAPI(id) {
        try {
            const response = await fetch(`${API_URL}/api/transactions/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            showNotification('Transaction deleted successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showNotification('Error deleting transaction', 'error');
            throw error;
        }
    }

    async function addAdSpend(data) {
        try {
            const response = await fetch(`${API_URL}/api/ad-spends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to add ad spend');
            showNotification('Ad spend logged successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Error adding ad spend:', error);
            showNotification('Error logging ad spend', 'error');
            throw error;
        }
    }

    // ==================== UI FUNCTIONS ====================

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function checkLogin() {
        if (currentAgent) {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('current-agent-name').textContent = currentAgent;
            loadAllData();
        } else {
            document.getElementById('login-overlay').style.display = 'flex';
            document.getElementById('app-content').style.display = 'none';
        }
    }

    window.login = function (name) {
        currentAgent = name;
        localStorage.setItem('iptv_current_agent', name);
        checkLogin();
    };

    window.logout = function () {
        currentAgent = null;
        localStorage.removeItem('iptv_current_agent');
        checkLogin();
    };

    async function loadAllData() {
        await Promise.all([fetchTransactions(), fetchAdSpends()]);
        renderAll();
    }

    function renderAll() {
        renderStats();
        renderDailyResume();
        renderTransactions();
        renderAdSpends();
    }

    function renderStats() {
        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.subPrice || 0), 0);
        const totalPanelCosts = transactions.reduce((sum, t) => sum + parseFloat(t.panelPrice || 0), 0);
        const totalAdSpends = adSpends.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

        const totalCosts = totalPanelCosts + totalAdSpends;
        const netProfit = totalRevenue - totalCosts;

        totalRevenueEl.textContent = `${totalRevenue.toFixed(2)}${CURRENCY}`;
        panelCostsEl.textContent = `${totalPanelCosts.toFixed(2)}${CURRENCY}`;
        adSpendEl.textContent = `${totalAdSpends.toFixed(2)}${CURRENCY}`;
        netProfitEl.textContent = `${netProfit.toFixed(2)}${CURRENCY}`;

        if (netProfit >= 0) {
            netProfitEl.className = 'stat-value profit';
        } else {
            netProfitEl.className = 'stat-value loss';
        }
    }

    function renderDailyResume() {
        dailyResumeBody.innerHTML = '';

        // Group data by date
        const dailyData = {};

        transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            if (!dailyData[date]) dailyData[date] = { revenue: 0, costs: 0, ads: 0 };
            dailyData[date].revenue += parseFloat(t.subPrice || 0);
            dailyData[date].costs += parseFloat(t.panelPrice || 0);
        });

        adSpends.forEach(s => {
            const date = new Date(s.date).toLocaleDateString();
            if (!dailyData[date]) dailyData[date] = { revenue: 0, costs: 0, ads: 0 };
            dailyData[date].ads += parseFloat(s.amount || 0);
        });

        // Sort dates descending
        const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            const entry = dailyData[date];
            const netProfit = entry.revenue - entry.costs - entry.ads;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${entry.revenue.toFixed(2)}${CURRENCY}</td>
                <td>${entry.costs.toFixed(2)}${CURRENCY}</td>
                <td>${entry.ads.toFixed(2)}${CURRENCY}</td>
                <td style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                    ${netProfit.toFixed(2)}${CURRENCY}
                </td>
            `;
            dailyResumeBody.appendChild(row);
        });
    }

    function renderTransactions() {
        transactionsBody.innerHTML = '';
        [...transactions].reverse().forEach(t => {
            const row = document.createElement('tr');
            const profit = parseFloat(t.subPrice || 0) - parseFloat(t.panelPrice || 0);

            // Format phone number for WhatsApp
            const cleanPhone = (t.customerId || '').replace(/\D/g, '');
            const isPhone = cleanPhone.length >= 8 && cleanPhone.length <= 15;

            row.innerHTML = `
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>${t.customerId}</td>
                <td><span class="badge badge-${(t.panel || '').toLowerCase()}">${t.panel}</span></td>
                <td><span class="badge badge-strong">${t.agent || 'Admin'}</span></td>
                <td>${parseFloat(t.subPrice || 0).toFixed(2)}${CURRENCY}</td>
                <td>${parseFloat(t.panelPrice || 0).toFixed(2)}${CURRENCY}</td>
                <td style="color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                    ${profit.toFixed(2)}${CURRENCY}
                </td>
                <td>
                    <button class="action-btn btn-edit" onclick="editTransaction(${t.id})">Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
                    ${isPhone ? `<a href="https://wa.me/${cleanPhone}" target="_blank" class="action-btn btn-whatsapp">WhatsApp</a>` : ''}
                </td>
            `;
            transactionsBody.appendChild(row);
        });
    }

    window.deleteTransaction = async function (id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await deleteTransactionAPI(id);
            await loadAllData();
        }
    };

    window.editTransaction = function (id) {
        const t = transactions.find(item => item.id === id);
        if (!t) return;

        document.getElementById('edit-id').value = t.id;
        document.getElementById('customer-id').value = t.customerId;
        document.getElementById('server-panel').value = t.panel;
        document.getElementById('sub-price').value = t.subPrice;
        document.getElementById('panel-price').value = t.panelPrice;

        document.getElementById('form-title').textContent = 'Edit Customer';
        document.getElementById('submit-btn').textContent = 'Update Transaction';
        document.getElementById('cancel-edit').style.display = 'block';

        window.scrollTo({ top: document.getElementById('customer-form').offsetTop - 100, behavior: 'smooth' });
    };

    document.getElementById('cancel-edit').addEventListener('click', () => {
        resetForm();
    });

    function resetForm() {
        customerForm.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('form-title').textContent = 'Add Customer';
        document.getElementById('submit-btn').textContent = 'Add Transaction';
        document.getElementById('cancel-edit').style.display = 'none';
    }

    function renderAdSpends() {
        adSpendList.innerHTML = '';
        [...adSpends].reverse().forEach((s) => {
            const div = document.createElement('div');
            div.style.padding = '0.5rem 0';
            div.style.borderBottom = '1px solid var(--border-color)';
            div.innerHTML = `
                ${new Date(s.date).toLocaleDateString()} - <strong>${s.platform}</strong>: ${parseFloat(s.amount || 0).toFixed(2)}${CURRENCY}
            `;
            adSpendList.appendChild(div);
        });
    }

    // ==================== FORM HANDLERS ====================

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const transactionData = {
            customerId: document.getElementById('customer-id').value,
            panel: document.getElementById('server-panel').value,
            subPrice: parseFloat(document.getElementById('sub-price').value),
            panelPrice: parseFloat(document.getElementById('panel-price').value),
            agent: currentAgent,
            date: new Date().toISOString()
        };

        try {
            if (editId) {
                await updateTransaction(editId, transactionData);
            } else {
                await addTransaction(transactionData);
            }
            resetForm();
            await loadAllData();
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    });

    adsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const adSpendData = {
            date: new Date().toISOString(),
            platform: document.getElementById('ad-platform').value,
            amount: parseFloat(document.getElementById('ad-amount').value)
        };

        try {
            await addAdSpend(adSpendData);
            adsForm.reset();
            await loadAllData();
        } catch (error) {
            console.error('Error submitting ad spend:', error);
        }
    });

    // Auto-refresh data every 30 seconds to keep all users in sync
    setInterval(async () => {
        await loadAllData();
    }, 30000);

    // Initial check
    checkLogin();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
