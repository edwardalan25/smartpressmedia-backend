<?php


use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthorsController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\DeviceController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect(url('https://smartpressmedia.com/'));
});

Route::get('/testings', function () {
    return ['message' => 'API is working!'];
});
