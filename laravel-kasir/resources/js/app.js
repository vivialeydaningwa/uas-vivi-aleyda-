import './bootstrap';

const STORAGE_PRODUCTS = 'kasir_products';
const formElements = {
    productList: document.getElementById('productList'),
    cartList: document.getElementById('cartList'),
    salesHistory: document.getElementById('salesHistory'),
    searchInput: document.getElementById('searchInput'),
    showAddProductBtn: document.getElementById('showAddProductBtn'),
    productModal: document.getElementById('productModal'),
    receiptModal: document.getElementById('receiptModal'),
    modalTitle: document.getElementById('modalTitle'),
    productNameInput: document.getElementById('productNameInput'),
    productCategoryInput: document.getElementById('productCategoryInput'),
    productPriceInput: document.getElementById('productPriceInput'),
    productStockInput: document.getElementById('productStockInput'),
    saveProductBtn: document.getElementById('saveProductBtn'),
    cancelProductBtn: document.getElementById('cancelProductBtn'),
    paymentMethod: document.getElementById('paymentMethod'),
    discountInput: document.getElementById('discountInput'),
    taxInput: document.getElementById('taxInput'),
    cartTotal: document.getElementById('cartTotal'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartCount: document.getElementById('cartCount'),
    cashInput: document.getElementById('cashInput'),
    changeAmount: document.getElementById('changeAmount'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    receiptContent: document.getElementById('receiptContent'),
    printReceiptBtn: document.getElementById('printReceiptBtn'),
    closeReceiptBtn: document.getElementById('closeReceiptBtn'),
    todayDate: document.getElementById('todayDate'),
};

const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

let products = [];
let cart = [];
let editingProductId = null;

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
};

const apiFetch = async (url, method = 'GET', body = null) => {
    const headers = {
        Accept: 'application/json',
    };

    if (body !== null) {
        headers['Content-Type'] = 'application/json';
        headers['X-CSRF-TOKEN'] = csrfToken;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || 'Terjadi kesalahan. Coba lagi.';
        throw new Error(message);
    }

    return response.status === 204 ? null : response.json();
};

const loadProducts = async () => {
    products = await apiFetch('/api/products');
    renderProducts();
};

const loadHistory = async () => {
    const history = await apiFetch('/api/history');
    renderHistory(history);
};

const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.min(Math.max(Number(formElements.discountInput.value) || 0, 0), 100);
    const tax = Math.min(Math.max(Number(formElements.taxInput.value) || 0, 0), 100);
    const afterDiscount = subtotal - subtotal * (discount / 100);
    const afterTax = afterDiscount + afterDiscount * (tax / 100);
    const total = Math.max(Math.round(afterTax), 0);
    const cash = Number(formElements.cashInput.value) || 0;
    const change = Math.max(cash - total, 0);
    return { subtotal, discount, tax, total, cash, change, afterDiscount, afterTax };
};

const updateCartSummary = () => {
    const totals = getTotals();
    formElements.cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    formElements.cartSubtotal.textContent = formatCurrency(totals.subtotal);
    formElements.cartTotal.textContent = formatCurrency(totals.total);
    formElements.changeAmount.textContent = formatCurrency(totals.change);
};

const renderProducts = () => {
    const query = formElements.searchInput.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
        return (
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
        );
    });

    formElements.productList.innerHTML = '';

    if (filtered.length === 0) {
        formElements.productList.innerHTML = '<p class="empty-state">Tidak ada produk sesuai pencarian.</p>';
        return;
    }

    filtered.forEach((product) => {
        const productCard = document.createElement('article');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <header>
                <div>
                    <h3>${product.name}</h3>
                    <small>${product.category}</small>
                </div>
                <span>${formatCurrency(product.price)}</span>
            </header>
            <div>
                <p>Stok: <strong>${product.stock}</strong></p>
            </div>
            <div class="product-actions">
                <button class="btn btn-primary" data-action="add" data-id="${product.id}">Tambah ke Keranjang</button>
                <button class="btn btn-secondary" data-action="edit" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${product.id}">Hapus</button>
            </div>
        `;

        formElements.productList.appendChild(productCard);
    });
};

const renderCart = () => {
    formElements.cartList.innerHTML = '';

    if (cart.length === 0) {
        formElements.cartList.innerHTML = '<p class="empty-state">Keranjang kosong. Tambahkan produk dari daftar.</p>';
        updateCartSummary();
        return;
    }

    cart.forEach((item) => {
        const cartCard = document.createElement('article');
        cartCard.className = 'cart-card';
        cartCard.innerHTML = `
            <header>
                <div>
                    <h3>${item.name}</h3>
                    <small>${item.category}</small>
                </div>
                <span>${formatCurrency(item.price)}</span>
            </header>
            <div>
                <p>Jumlah: <strong>${item.quantity}</strong></p>
                <p>Subtotal: <strong>${formatCurrency(item.price * item.quantity)}</strong></p>
            </div>
            <div class="cart-actions">
                <button class="btn btn-primary" data-action="increase" data-id="${item.id}">+</button>
                <button class="btn btn-secondary" data-action="decrease" data-id="${item.id}">-</button>
                <button class="btn btn-danger" data-action="remove" data-id="${item.id}">Hapus</button>
            </div>
        `;
        formElements.cartList.appendChild(cartCard);
    });

    updateCartSummary();
};

const renderHistory = (history) => {
    formElements.salesHistory.innerHTML = '';

    if (!history || history.length === 0) {
        formElements.salesHistory.innerHTML = '<p class="empty-state">Belum ada transaksi.</p>';
        return;
    }

    history.forEach((entry) => {
        const historyCard = document.createElement('article');
        historyCard.className = 'history-card';
        const itemsList = entry.items
            .map((item) => `<li>${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}</li>`)
            .join('');
        historyCard.innerHTML = `
            <header>
                <div>
                    <h3>${entry.invoice}</h3>
                    <small>${new Date(entry.created_at).toLocaleString('id-ID')}</small>
                </div>
                <span>${formatCurrency(entry.total)}</span>
            </header>
            <div>
                <p>Metode: <strong>${entry.payment_method}</strong></p>
                <p>Diskon: ${entry.discount}% | PPN: ${entry.tax}%</p>
                <ul>${itemsList}</ul>
            </div>
        `;

        formElements.salesHistory.appendChild(historyCard);
    });
};

const openModal = (modal) => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
};

const closeModal = (modal) => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
};

const openProductModal = (product = null) => {
    editingProductId = product ? product.id : null;
    formElements.modalTitle.textContent = product ? 'Edit Produk' : 'Tambah Produk';
    formElements.productNameInput.value = product ? product.name : '';
    formElements.productCategoryInput.value = product ? product.category : '';
    formElements.productPriceInput.value = product ? product.price : '';
    formElements.productStockInput.value = product ? product.stock : '';
    openModal(formElements.productModal);
};

const addOrUpdateProduct = async () => {
    const name = formElements.productNameInput.value.trim();
    const category = formElements.productCategoryInput.value.trim();
    const price = Number(formElements.productPriceInput.value) || 0;
    const stock = Number(formElements.productStockInput.value) || 0;

    if (!name || !category || price <= 0 || stock < 0) {
        alert('Mohon isi semua data produk dengan benar.');
        return;
    }

    try {
        if (editingProductId) {
            await apiFetch(`/api/products/${editingProductId}`, 'PUT', {
                name,
                category,
                price,
                stock,
            });
        } else {
            await apiFetch('/api/products', 'POST', {
                name,
                category,
                price,
                stock,
            });
        }

        await loadProducts();
        closeModal(formElements.productModal);
    } catch (error) {
        alert(error.message);
    }
};

const addToCart = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
        alert('Stok produk habis.');
        return;
    }

    const existing = cart.find((item) => item.id === productId);
    if (existing) {
        if (existing.quantity + 1 > product.stock) {
            alert('Jumlah melebihi stok tersedia.');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
};

const updateCartItem = (productId, action) => {
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;

    const product = products.find((entry) => entry.id === productId);
    if (!product) return;

    if (action === 'increase') {
        if (item.quantity + 1 > product.stock) {
            alert('Tidak cukup stok untuk menambah jumlah.');
            return;
        }
        item.quantity += 1;
    }

    if (action === 'decrease') {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter((entry) => entry.id !== productId);
        }
    }

    if (action === 'remove') {
        cart = cart.filter((entry) => entry.id !== productId);
    }

    renderCart();
};

const checkout = async () => {
    if (cart.length === 0) {
        alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');
        return;
    }

    const totals = getTotals();

    try {
        const sale = await apiFetch('/api/checkout', 'POST', {
            items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
            discount: totals.discount,
            tax: totals.tax,
            paymentMethod: formElements.paymentMethod.value,
            cash: totals.cash,
        });

        await loadProducts();
        await loadHistory();

        cart = [];
        formElements.cashInput.value = '0';
        renderCart();
        renderReceipt(sale);
    } catch (error) {
        alert(error.message);
    }
};

const renderReceipt = (sale) => {
    const itemsHtml = sale.items
        .map(
            (item) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>`
        )
        .join('');

    formElements.receiptContent.innerHTML = `
        <div class="receipt-header">
            <p><strong>Invoice:</strong> ${sale.invoice}</p>
            <p><strong>Tanggal:</strong> ${new Date(sale.created_at).toLocaleString('id-ID')}</p>
            <p><strong>Metode:</strong> ${sale.payment_method}</p>
        </div>
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Produk</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="receipt-totals">
            <p>Subtotal: ${formatCurrency(sale.subtotal)}</p>
            <p>Diskon: ${sale.discount}%</p>
            <p>PPN: ${sale.tax}%</p>
            <p><strong>Total: ${formatCurrency(sale.total)}</strong></p>
            <p>Dibayar: ${formatCurrency(sale.cash)}</p>
            <p>Kembalian: ${formatCurrency(sale.change)}</p>
        </div>
    `;

    openModal(formElements.receiptModal);
};

const bindEvents = () => {
    formElements.showAddProductBtn.addEventListener('click', () => openProductModal());
    formElements.cancelProductBtn.addEventListener('click', () => closeModal(formElements.productModal));
    formElements.saveProductBtn.addEventListener('click', addOrUpdateProduct);
    formElements.searchInput.addEventListener('input', renderProducts);
    formElements.discountInput.addEventListener('input', updateCartSummary);
    formElements.taxInput.addEventListener('input', updateCartSummary);
    formElements.cashInput.addEventListener('input', updateCartSummary);
    formElements.checkoutBtn.addEventListener('click', checkout);
    formElements.printReceiptBtn.addEventListener('click', () => window.print());
    formElements.closeReceiptBtn.addEventListener('click', () => closeModal(formElements.receiptModal));

    formElements.productList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const productId = Number(button.dataset.id);
        if (action === 'add') addToCart(productId);
        if (action === 'edit') {
            const product = products.find((item) => item.id === productId);
            if (product) openProductModal(product);
        }
        if (action === 'delete') {
            if (confirm('Hapus produk ini?')) {
                apiFetch(`/api/products/${productId}`, 'DELETE')
                    .then(() => loadProducts())
                    .catch((error) => alert(error.message));
            }
        }
    });

    formElements.cartList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const productId = Number(button.dataset.id);
        updateCartItem(productId, action);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal(formElements.productModal);
            closeModal(formElements.receiptModal);
        }
    });
};

const setTodayDate = () => {
    const now = new Date();
    formElements.todayDate.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
};

const init = async () => {
    bindEvents();
    setTodayDate();
    await loadProducts();
    await loadHistory();
    renderCart();
};

init();
