<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />

        <title>{{ config('app.name', 'Laravel Kasir') }}</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="bg-slate-100 text-slate-900 min-h-screen">
        <div class="app-shell">
            <header class="app-header">
                <div>
                    <h1>Kasir Laravel</h1>
                    <p>Kelola produk, buat transaksi, dan lihat riwayat penjualan.</p>
                </div>
                <div class="status" id="todayDate"></div>
                <div class="user-panel">
                    <span>Halo, {{ auth()->user()->name }}</span>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="btn btn-secondary">Logout</button>
                    </form>
                </div>
            </header>

            <div class="app-grid">
                <section class="panel">
                    <div class="panel-header">
                        <div>
                            <h2>Daftar Produk</h2>
                            <p>Tambahkan, edit, atau hapus produk Anda.</p>
                        </div>
                        <button id="showAddProductBtn" class="btn btn-primary">Tambah Produk</button>
                    </div>

                    <div class="product-controls">
                        <label>
                            Cari Produk
                            <input id="searchInput" type="search" placeholder="Cari nama atau kategori" />
                        </label>
                    </div>

                    <div id="productList" class="product-list"></div>
                </section>

                <section class="panel">
                    <div class="panel-header">
                        <div>
                            <h2>Keranjang & Pembayaran</h2>
                            <p>Atur diskon, PPN, dan metode pembayaran.</p>
                        </div>
                    </div>

                    <div id="cartList" class="cart-list"></div>

                    <div class="cart-summary">
                        <div class="cart-info">
                            <span>Total Item: <strong id="cartCount">0</strong></span>
                            <span>Subtotal: <strong id="cartSubtotal">Rp0</strong></span>
                            <span>Total: <strong id="cartTotal">Rp0</strong></span>
                        </div>
                    </div>

                    <div class="payment-panel">
                        <div class="panel-header">
                            <h2>Detail Pembayaran</h2>
                        </div>
                        <label>
                            Diskon (%)
                            <input id="discountInput" type="number" min="0" max="100" value="0" />
                        </label>
                        <label>
                            PPN (%)
                            <input id="taxInput" type="number" min="0" max="100" value="0" />
                        </label>
                        <label>
                            Metode Pembayaran
                            <select id="paymentMethod">
                                <option value="cash">Tunai</option>
                                <option value="card">Kartu</option>
                            </select>
                        </label>
                        <label>
                            Bayar (Rp)
                            <input id="cashInput" type="number" min="0" value="0" />
                        </label>
                        <div class="cart-info">
                            <span>Kembalian: <strong id="changeAmount">Rp0</strong></span>
                        </div>
                        <button id="checkoutBtn" class="btn btn-success">Bayar Sekarang</button>
                    </div>
                </section>
            </div>

            <section class="panel panel-bottom">
                <div class="panel-header">
                    <div>
                        <h2>Riwayat Penjualan</h2>
                        <p>Transaksi terakhir akan muncul di bawah.</p>
                    </div>
                </div>
                <div id="salesHistory" class="history-list"></div>
            </section>
        </div>

        <div id="productModal" class="hidden modal-overlay" aria-hidden="true">
            <div class="panel">
                <div class="panel-header">
                    <h2 id="modalTitle">Tambah Produk</h2>
                </div>
                <label>
                    Nama Produk
                    <input id="productNameInput" type="text" />
                </label>
                <label>
                    Kategori
                    <input id="productCategoryInput" type="text" />
                </label>
                <label>
                    Harga (Rp)
                    <input id="productPriceInput" type="number" min="0" />
                </label>
                <label>
                    Stok
                    <input id="productStockInput" type="number" min="0" />
                </label>
                <div class="product-actions">
                    <button id="saveProductBtn" class="btn btn-primary">Simpan</button>
                    <button id="cancelProductBtn" class="btn btn-secondary">Batal</button>
                </div>
            </div>
        </div>

        <div id="receiptModal" class="hidden modal-overlay" aria-hidden="true">
            <div class="panel">
                <div class="panel-header">
                    <h2>Struk Transaksi</h2>
                </div>
                <div id="receiptContent"></div>
                <div class="product-actions">
                    <button id="printReceiptBtn" class="btn btn-primary">Cetak</button>
                    <button id="closeReceiptBtn" class="btn btn-secondary">Tutup</button>
                </div>
            </div>
        </div>
    </body>
</html>
