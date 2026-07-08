<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />

        <title>Login - Laravel Kasir</title>
        @vite(['resources/css/app.css'])
    </head>
    <body class="bg-slate-100 text-slate-900 min-h-screen flex items-center justify-center">
        <main class="panel w-full max-w-md">
            <h1 class="text-2xl font-semibold mb-4">Masuk ke Laravel Kasir</h1>

            @if ($errors->any())
                <div class="alert alert-danger mb-4">
                    <ul class="list-disc list-inside">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ route('login.perform') }}" class="space-y-4">
                @csrf

                <label class="block">
                    <span>Email</span>
                    <input type="email" name="email" value="{{ old('email') }}" required autofocus class="input-field" />
                </label>

                <label class="block">
                    <span>Password</span>
                    <input type="password" name="password" required class="input-field" />
                </label>

                <label class="inline-flex items-center gap-2">
                    <input type="checkbox" name="remember" class="checkbox-field" />
                    <span>Ingat saya</span>
                </label>

                <button type="submit" class="btn btn-primary w-full">Masuk</button>
            </form>

            <p class="mt-4 text-center text-sm text-slate-600">
                Belum punya akun? <a href="{{ route('register') }}" class="font-semibold text-slate-900">Daftar sekarang</a>
            </p>
        </main>
    </body>
</html>
