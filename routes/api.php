<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthorsController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TransactionController;

/*
|--------------------------------------------------------------------------
| BASIC CHECK
|--------------------------------------------------------------------------
*/
Route::get('/testings', function () {
    return response()->json(['message' => 'API is working!']);
});

/*
|--------------------------------------------------------------------------
| STRIPE WEBHOOK
|--------------------------------------------------------------------------
*/
Route::post('/stripe/webhook', [CartController::class, 'stripeWebhook']);

/*
|--------------------------------------------------------------------------
| AUTH (PUBLIC)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

/*
|--------------------------------------------------------------------------
| CONTACT FORM
|--------------------------------------------------------------------------
*/
Route::post('/contact', [ContactController::class, 'store']);

/*
|--------------------------------------------------------------------------
| WEBSITE (PUBLIC APIs FOR REACT)
|--------------------------------------------------------------------------
*/

Route::middleware('device')->group(function () {

    // Device sync
    Route::post('/device/web-sync', [DeviceController::class, 'syncDeviceWeb']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{slug}', [CategoryController::class, 'show']);

    // Authors
    Route::get('/authors', [AuthorsController::class, 'index']);
    Route::get('/authors/{id}', [AuthorsController::class, 'show']);

    // Blogs
    Route::get('/blogs', [BlogController::class, 'index']);
    Route::get('/blogs/{slug}', [BlogController::class, 'show']);

    // Questions (Quiz)
    Route::get('/questions', [QuestionController::class, 'index']);
    Route::get('/questions/{question}', [QuestionController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | CART (PUBLIC)
    |--------------------------------------------------------------------------
    */
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'viewCart']);
        Route::post('/add', [CartController::class, 'addToCart']);
        Route::post('/checkout/stripe', [CartController::class, 'checkoutStripe']);
        Route::put('/item/{id}', [CartController::class, 'updateQuantity']);
        Route::delete('/item/{id}', [CartController::class, 'removeItem']);
    });
});

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD (PROTECTED)
|--------------------------------------------------------------------------
| URL: /api/admin/...
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {

    // User
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::delete('/delete-account', [AuthController::class, 'deleteAccount']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Products CRUD
    Route::apiResource('products', ProductController::class);

    // Categories CRUD
    Route::apiResource('categories', CategoryController::class);

    // Authors CRUD
    Route::apiResource('authors', AuthorsController::class);

    // Blogs CRUD
    Route::apiResource('blogs', BlogController::class);

    // Questions CRUD
    Route::get('/questions', [QuestionController::class, 'index']);
    Route::post('/questions', [QuestionController::class, 'store']);
    Route::get('/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

    // Orders (Admin)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);

    // Transactions (Admin)
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
});
