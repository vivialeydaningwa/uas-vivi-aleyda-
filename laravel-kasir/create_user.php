<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

App\Models\User::updateOrCreate(
    ['email' => 'vivi@gmail.com'],
    ['name' => 'Vivi', 'password' => Illuminate\Support\Facades\Hash::make('sagecapoy')]
);
echo "USER_CREATED\n";
