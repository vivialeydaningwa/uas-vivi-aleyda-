<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashierController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        return view('welcome');
    }

    public function products()
    {
        return Product::orderBy('name')->get();
    }

    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    public function updateProduct(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $product->update($data);

        return response()->json($product);
    }

    public function destroyProduct(Product $product)
    {
        $product->delete();

        return response()->json(null, 204);
    }

    public function history()
    {
        return Sale::with('items')->latest()->take(15)->get();
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount' => 'required|numeric|min:0|max:100',
            'tax' => 'required|numeric|min:0|max:100',
            'paymentMethod' => 'required|string|in:cash,card',
            'cash' => 'required|numeric|min:0',
        ]);

        $items = collect($data['items']);

        $saleData = DB::transaction(function () use ($items, $data) {
            $subtotal = 0;
            $saleItems = [];

            foreach ($items as $item) {
                $product = Product::find($item['id']);

                if (! $product || $item['quantity'] > $product->stock) {
                    abort(422, 'Stok produk tidak mencukupi atau produk tidak ditemukan.');
                }

                $lineTotal = $product->price * $item['quantity'];
                $subtotal += $lineTotal;

                $saleItems[] = [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $item['quantity'],
                ];
            }

            $afterDiscount = $subtotal - ($subtotal * ($data['discount'] / 100));
            $afterTax = $afterDiscount + ($afterDiscount * ($data['tax'] / 100));
            $total = round(max($afterTax, 0));

            if ($data['paymentMethod'] === 'cash' && $data['cash'] < $total) {
                abort(422, 'Jumlah bayar tunai kurang dari total.');
            }

            $sale = Sale::create([
                'invoice' => 'INV-' . now()->format('YmdHis'),
                'subtotal' => $subtotal,
                'discount' => $data['discount'],
                'tax' => $data['tax'],
                'total' => $total,
                'payment_method' => $data['paymentMethod'] === 'cash' ? 'Tunai' : 'Kartu',
                'cash' => $data['cash'],
                'change' => max($data['cash'] - $total, 0),
            ]);

            foreach ($saleItems as $saleItem) {
                $sale->items()->create($saleItem);
                $product = Product::find($saleItem['product_id']);
                $product->decrement('stock', $saleItem['quantity']);
            }

            return $sale->load('items');
        });

        return response()->json($saleData, 201);
    }
}
