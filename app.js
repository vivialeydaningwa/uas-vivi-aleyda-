const STORAGE_PRODUCTS = 'kasir_products';
const STORAGE_HISTORY = 'kasir_sales_history';

const elements = {
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

const loadState = () => {
  const storedProducts = localStorage.getItem(STORAGE_PRODUCTS);
  const storedHistory = localStorage.getItem(STORAGE_HISTORY);
  products = storedProducts ? JSON.parse(storedProducts) : [
    { id: crypto.randomUUID(), name: 'Susu UHT', category: 'Minuman', price: 15000, stock: 20 },
    { id: crypto.randomUUID(), name: 'Roti Tawar', category: 'Roti', price: 12000, stock: 15 },
    { id: crypto.randomUUID(), name: 'Air Mineral', category: 'Minuman', price: 7000, stock: 40 },
    { id: crypto.randomUUID(), name: 'Pasta Gigi', category: 'Kebutuhan Rumah', price: 20000, stock: 10 },
  ];
  if (!storedHistory) {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify([]));
  }
};

const saveProducts = () => {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
};

const getHistory = () => {
  const raw = localStorage.getItem(STORAGE_HISTORY);
  return raw ? JSON.parse(raw) : [];
};

const addHistoryEntry = (entry) => {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
};

const getTotals = () => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.min(Math.max(Number(elements.discountInput.value) || 0, 0), 100);
  const tax = Math.min(Math.max(Number(elements.taxInput.value) || 0, 0), 100);
  const afterDiscount = subtotal - subtotal * (discount / 100);
  const afterTax = afterDiscount + afterDiscount * (tax / 100);
  const total = Math.max(afterTax, 0);
  const cash = Number(elements.cashInput.value) || 0;
  const change = Math.max(cash - total, 0);
  return { subtotal, discount, tax, total, cash, change, afterDiscount, afterTax };
};

const updateCartSummary = () => {
  const totals = getTotals();
  elements.cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  elements.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  elements.cartTotal.textContent = formatCurrency(totals.total);
  elements.changeAmount.textContent = formatCurrency(totals.change);
};

const renderProducts = () => {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });
  elements.productList.innerHTML = '';

  if (filtered.length === 0) {
    elements.productList.innerHTML = '<p class="empty-state">Tidak ada produk sesuai pencarian.</p>';
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

    elements.productList.appendChild(productCard);
  });
};

const renderCart = () => {
  elements.cartList.innerHTML = '';
  if (cart.length === 0) {
    elements.cartList.innerHTML = '<p class="empty-state">Keranjang kosong. Tambahkan produk dari daftar.</p>';
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
    elements.cartList.appendChild(cartCard);
  });

  updateCartSummary();
};

const renderHistory = () => {
  const history = getHistory();
  elements.salesHistory.innerHTML = '';
  if (history.length === 0) {
    elements.salesHistory.innerHTML = '<p class="empty-state">Belum ada transaksi.</p>';
    return;
  }

  history.slice(0, 10).forEach((entry) => {
    const historyCard = document.createElement('article');
    historyCard.className = 'history-card';
    const itemsList = entry.items
      .map((item) => `<li>${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}</li>`)
      .join('');
    historyCard.innerHTML = `
      <header>
        <div>
          <h3>${entry.invoice}</h3>
          <small>${new Date(entry.date).toLocaleString('id-ID')}</small>
        </div>
        <span>${formatCurrency(entry.total)}</span>
      </header>
      <div>
        <p>Metode: <strong>${entry.paymentMethod}</strong></p>
        <p>Diskon: ${entry.discount}% | PPN: ${entry.tax}%</p>
        <ul>${itemsList}</ul>
      </div>
    `;
    elements.salesHistory.appendChild(historyCard);
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
  elements.modalTitle.textContent = product ? 'Edit Produk' : 'Tambah Produk';
  elements.productNameInput.value = product ? product.name : '';
  elements.productCategoryInput.value = product ? product.category : '';
  elements.productPriceInput.value = product ? product.price : '';
  elements.productStockInput.value = product ? product.stock : '';
  openModal(elements.productModal);
};

const addOrUpdateProduct = () => {
  const name = elements.productNameInput.value.trim();
  const category = elements.productCategoryInput.value.trim();
  const price = Number(elements.productPriceInput.value) || 0;
  const stock = Number(elements.productStockInput.value) || 0;

  if (!name || !category || price <= 0 || stock < 0) {
    alert('Mohon isi semua data produk dengan benar.');
    return;
  }

  if (editingProductId) {
    const index = products.findIndex((item) => item.id === editingProductId);
    if (index >= 0) {
      products[index] = { ...products[index], name, category, price, stock };
    }
  } else {
    products.push({ id: crypto.randomUUID(), name, category, price, stock });
  }

  saveProducts();
  renderProducts();
  closeModal(elements.productModal);
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

const checkout = () => {
  if (cart.length === 0) {
    alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');
    return;
  }

  const totals = getTotals();
  if (totals.cash < totals.total && elements.paymentMethod.value === 'cash') {
    alert('Jumlah bayar tunai kurang dari total.');
    return;
  }

  const invoice = `INV-${Date.now()}`;
  const timestamp = new Date().toISOString();

  cart.forEach((item) => {
    const target = products.find((product) => product.id === item.id);
    if (target) {
      target.stock = Math.max(target.stock - item.quantity, 0);
    }
  });

  const saleEntry = {
    invoice,
    date: timestamp,
    items: cart.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    paymentMethod: elements.paymentMethod.value === 'cash' ? 'Tunai' : 'Kartu',
    cash: totals.cash,
    change: totals.change,
  };

  addHistoryEntry(saleEntry);
  saveProducts();
  renderHistory();
  renderProducts();
  renderReceipt(saleEntry);
  cart = [];
  elements.cashInput.value = '0';
  renderCart();
};

const renderReceipt = (saleEntry) => {
  const itemsHtml = saleEntry.items
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

  elements.receiptContent.innerHTML = `
    <div class="receipt-header">
      <p><strong>Invoice:</strong> ${saleEntry.invoice}</p>
      <p><strong>Tanggal:</strong> ${new Date(saleEntry.date).toLocaleString('id-ID')}</p>
      <p><strong>Metode:</strong> ${saleEntry.paymentMethod}</p>
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
      <p>Subtotal: ${formatCurrency(saleEntry.subtotal)}</p>
      <p>Diskon: ${saleEntry.discount}%</p>
      <p>PPN: ${saleEntry.tax}%</p>
      <p><strong>Total: ${formatCurrency(saleEntry.total)}</strong></p>
      <p>Dibayar: ${formatCurrency(saleEntry.cash)}</p>
      <p>Kembalian: ${formatCurrency(saleEntry.change)}</p>
    </div>
  `;

  openModal(elements.receiptModal);
};

const bindEvents = () => {
  elements.showAddProductBtn.addEventListener('click', () => openProductModal());
  elements.cancelProductBtn.addEventListener('click', () => closeModal(elements.productModal));
  elements.saveProductBtn.addEventListener('click', addOrUpdateProduct);
  elements.searchInput.addEventListener('input', renderProducts);
  elements.discountInput.addEventListener('input', updateCartSummary);
  elements.taxInput.addEventListener('input', updateCartSummary);
  elements.cashInput.addEventListener('input', updateCartSummary);
  elements.checkoutBtn.addEventListener('click', checkout);
  elements.printReceiptBtn.addEventListener('click', () => window.print());
  elements.closeReceiptBtn.addEventListener('click', () => closeModal(elements.receiptModal));

  elements.productList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const productId = button.dataset.id;
    if (action === 'add') addToCart(productId);
    if (action === 'edit') {
      const product = products.find((item) => item.id === productId);
      if (product) openProductModal(product);
    }
    if (action === 'delete') {
      if (confirm('Hapus produk ini?')) {
        products = products.filter((item) => item.id !== productId);
        saveProducts();
        renderProducts();
      }
    }
  });

  elements.cartList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const productId = button.dataset.id;
    updateCartItem(productId, action);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal(elements.productModal);
      closeModal(elements.receiptModal);
    }
  });
};

const setTodayDate = () => {
  const now = new Date();
  elements.todayDate.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const init = () => {
  loadState();
  bindEvents();
  setTodayDate();
  renderProducts();
  renderCart();
  renderHistory();
};

init();
