<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice')->unique();
            $table->unsignedInteger('subtotal');
            $table->unsignedTinyInteger('discount');
            $table->unsignedTinyInteger('tax');
            $table->unsignedInteger('total');
            $table->string('payment_method');
            $table->unsignedInteger('cash');
            $table->unsignedInteger('change');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
