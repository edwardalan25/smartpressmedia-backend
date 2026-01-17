# SmartPressMedia Backend API

Base URL:
- `https://your-domain.com/api`

Common headers:
- `Accept: application/json`
- `Accept-Language: en` (optional)
- Device (required for website routes): `X-Device-Id` or `X-Fingerprint`
- Auth (admin): `Authorization: Bearer <token>`

Notes:
- Image uploads use `multipart/form-data`.
- Public "website" routes are under `/api` and are wrapped with device middleware.
- Web-only test route (non-API): `GET /testings`

## Basic
- `GET /api/testings`
  - Response: `{ "message": "API is working!" }`

## Stripe Webhook
- `POST /api/stripe/webhook`
  - Headers: `Stripe-Signature: <signature>`
  - Body: Stripe webhook payload (raw JSON)

## Auth (Public)
- `POST /api/login`
  - Payload:
    ```json
    { "email": "user@example.com", "password": "secret" }
    ```
- `POST /api/register`
  - Payload:
    ```json
    {
      "name": "User",
      "email": "user@example.com",
      "password": "secret123",
      "password_confirmation": "secret123",
      "country_id": 1,
      "phone": "123456789"
    }
    ```

## Contact (Public)
- `POST /api/contact`
  - Payload:
    ```json
    { "name": "User", "email": "user@example.com", "message": "Hello" }
    ```

## Website APIs (Public, Device Middleware)
Device headers required:
- `X-Device-Id: <device-id>` (preferred) or `X-Fingerprint: <browser-fingerprint>`

### Device Sync
- `POST /api/device/web-sync`
  - Payload:
    ```json
    {
      "device_id": "optional",
      "device_token": "optional",
      "device_os": "Windows",
      "device_os_version": "11",
      "device_type": "web",
      "device_name": "Chrome",
      "device_width": 1920,
      "device_height": 1080,
      "device_manufacturer": "optional"
    }
    ```

### Products
- `GET /api/products`
- `GET /api/products/{slug}`

### Categories
- `GET /api/categories`
- `GET /api/categories/{slug}`

### Authors
- `GET /api/authors`
- `GET /api/authors/{id}`

### Blogs
- `GET /api/blogs`
- `GET /api/blogs/{slug}`

### Questions (Quiz)
- `GET /api/questions`
- `GET /api/questions/{question}`

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
  - Payload:
    ```json
    {
      "product_id": 1,
      "product_variant_id": 2,
      "quantity": 1
    }
    ```
- `PUT /api/cart/item/{id}`
  - Payload:
    ```json
    { "quantity": 2 }
    ```
- `DELETE /api/cart/item/{id}`
- `POST /api/cart/checkout/stripe`
  - Payload: empty
  - Response:
    ```json
    { "session_id": "cs_test_...", "checkout_url": "https://checkout.stripe.com/..." }
    ```

## Admin APIs (Auth Required)
Auth header required:
- `Authorization: Bearer <token>`

### Auth
- `GET /api/admin/user`
- `POST /api/admin/update-profile`
  - Payload:
    ```json
    {
      "name": "Admin",
      "email": "admin@example.com",
      "phone": "123456789",
      "country_id": 1,
      "gender": "male",
      "date_of_birth": "1990-01-01",
      "address": "Address"
    }
    ```
- `DELETE /api/admin/delete-account`
- `POST /api/admin/logout`

### Products (CRUD)
- `GET /api/admin/products`
- `POST /api/admin/products`
  - Payload (multipart/form-data):
    - `name` (string, required)
    - `category_id` (nullable)
    - `author_id` (nullable)
    - `price` (number, required)
    - `discount_price` (nullable)
    - `description` (nullable)
    - `is_active` (boolean)
    - `image` (file)
    - `variants` (array)
    - `variants[0][name]` (string)
    - `variants[0][price]` (number)
    - `variants[0][is_active]` (boolean)
- `GET /api/admin/products/{id}`
- `PUT /api/admin/products/{id}` (same fields as create)
- `DELETE /api/admin/products/{id}`

### Categories (CRUD)
- `GET /api/admin/categories`
- `POST /api/admin/categories`
  - Payload (multipart/form-data or JSON):
    ```json
    { "name": "Category", "is_active": true }
    ```
  - `image` (file) if using multipart
- `GET /api/admin/categories/{id}`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`

### Authors (CRUD)
- `GET /api/admin/authors`
- `POST /api/admin/authors`
  - Payload:
    ```json
    {
      "name": "Author",
      "email": "author@example.com",
      "phone": "123456789",
      "country_id": 1,
      "password": "secret123"
    }
    ```
- `GET /api/admin/authors/{id}`
- `PUT /api/admin/authors/{id}`
  - Payload:
    ```json
    {
      "name": "Author",
      "email": "author@example.com",
      "phone": "123456789",
      "country_id": 1,
      "password": "optional"
    }
    ```
- `DELETE /api/admin/authors/{id}`

### Blogs (CRUD)
- `GET /api/admin/blogs`
- `POST /api/admin/blogs`
  - Payload (multipart/form-data):
    - `title` (string, required)
    - `description` (string, required)
    - `is_active` (boolean)
    - `image` (file)
- `GET /api/admin/blogs/{id}`
- `PUT /api/admin/blogs/{id}` (same fields as create)
- `DELETE /api/admin/blogs/{id}`

### Questions (CRUD)
- `GET /api/admin/questions`
- `POST /api/admin/questions`
  - Payload:
    ```json
    {
      "question_text": "Question?",
      "is_active": true,
      "authors": [1,2],
      "options": [
        { "name": "A", "text": "Option A", "is_correct": false, "is_active": true },
        { "name": "B", "text": "Option B", "is_correct": true, "is_active": true }
      ]
    }
    ```
- `GET /api/admin/questions/{question}`
- `PUT /api/admin/questions/{question}`
  - Payload: same as create (with optional `options[].id`)
- `DELETE /api/admin/questions/{question}`

### Orders (Admin)
- `GET /api/admin/orders`
- `GET /api/admin/orders/{id}`
- `PUT /api/admin/orders/{id}`
  - Payload:
    ```json
    { "status": "processing", "payment_status": "paid" }
    ```
  - Allowed `status`: `pending`, `processing`, `completed`, `cancelled`
  - Allowed `payment_status`: `unpaid`, `paid`, `failed`, `refunded`

### Transactions (Admin)
- `GET /api/admin/transactions`
- `GET /api/admin/transactions/{id}`
