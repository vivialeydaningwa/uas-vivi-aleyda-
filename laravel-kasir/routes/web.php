<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashierController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.perform');
    Route::get('register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('register', [AuthController::class, 'register'])->name('register.perform');
});

Route::post('logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', [CashierController::class, 'index']);

    Route::prefix('api')->controller(CashierController::class)->group(function () {
        Route::get('products', 'products');
        Route::post('products', 'storeProduct');
        Route::put('products/{product}', 'updateProduct');
        Route::delete('products/{product}', 'destroyProduct');
        Route::get('history', 'history');
        Route::post('checkout', 'checkout');
    });
});
