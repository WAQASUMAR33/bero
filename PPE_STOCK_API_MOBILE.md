# PPE Stock API Endpoints for Mobile App

## Base URL
```
/api/pp-stock
```

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Available Endpoints for Mobile Users

### 1. Get All Products (View Stock List)

**Endpoint:** `GET /api/pp-stock/products`

**Description:** Retrieve a list of all PPE products with their current stock levels.

**Request:**
```http
GET /api/pp-stock/products
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Surgical Gloves",
      "threshold": 50,
      "currentQuantity": 120,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:25:00.000Z"
    },
    {
      "id": 2,
      "name": "Face Masks",
      "threshold": 100,
      "currentQuantity": 45,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:25:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `id` (integer): Product ID
- `name` (string): Product name
- `threshold` (integer): Minimum quantity threshold (alert when below this)
- `currentQuantity` (integer): Current available stock quantity
- `createdAt` (datetime): Product creation timestamp
- `updatedAt` (datetime): Last update timestamp

**Note:** Products with `currentQuantity <= threshold` should be highlighted in red/low stock.

---

### 2. Get Single Product Details

**Endpoint:** `GET /api/pp-stock/products/{id}`

**Description:** Get detailed information about a specific product.

**Request:**
```http
GET /api/pp-stock/products/1
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (integer, required): Product ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Surgical Gloves",
    "threshold": 50,
    "currentQuantity": 120,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:25:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

### 3. Take Stock (Reduce Quantity)

**Endpoint:** `POST /api/pp-stock/products/{id}/take`

**Description:** Record that stock has been taken/used. This reduces the current quantity and creates a transaction record.

**Request:**
```http
POST /api/pp-stock/products/1/take
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 5
}
```

**Path Parameters:**
- `id` (integer, required): Product ID

**Request Body:**
```json
{
  "quantity": 5  // integer, required, must be > 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Surgical Gloves",
    "threshold": 50,
    "currentQuantity": 115,  // Reduced by 5
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z"  // Updated timestamp
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid quantity:**
```json
{
  "success": false,
  "error": "Valid quantity is required"
}
```

**400 Bad Request - Insufficient stock:**
```json
{
  "success": false,
  "error": "Insufficient stock available"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

---

### 4. Get Product Transaction History

**Endpoint:** `GET /api/pp-stock/products/{id}/transactions`

**Description:** Get the transaction history for a specific product (all stock movements: TAKEN, RESTOCK, PURCHASE).

**Request:**
```http
GET /api/pp-stock/products/1/transactions
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (integer, required): Product ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "productId": 1,
      "action": "TAKEN",
      "quantity": 5,
      "userId": 4,
      "createdAt": "2024-01-20T15:30:00.000Z",
      "user": {
        "id": 4,
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    {
      "id": 9,
      "productId": 1,
      "action": "RESTOCK",
      "quantity": 50,
      "userId": 2,
      "createdAt": "2024-01-18T10:00:00.000Z",
      "user": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith"
      }
    },
    {
      "id": 8,
      "productId": 1,
      "action": "TAKEN",
      "quantity": 10,
      "userId": 4,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "user": {
        "id": 4,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

**Response Fields:**
- `id` (integer): Transaction ID
- `productId` (integer): Product ID
- `action` (string): Transaction type - "TAKEN", "RESTOCK", or "PURCHASE"
- `quantity` (integer): Quantity involved in the transaction
- `userId` (integer): ID of the user who performed the action
- `createdAt` (datetime): Transaction timestamp
- `user` (object): User details who performed the action
  - `id` (integer): User ID
  - `firstName` (string): User first name
  - `lastName` (string): User last name

**Transaction Actions:**
- `TAKEN`: Stock was taken/used (quantity reduced)
- `RESTOCK`: Stock was restocked (quantity increased)
- `PURCHASE`: Initial stock purchase when product was created

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

## ❌ Endpoints NOT Available for Mobile Users

The following endpoints are **NOT accessible** to mobile users (admin/web only):

- ❌ `POST /api/pp-stock/products` - Create new product
- ❌ `PUT /api/pp-stock/products/{id}` - Update product
- ❌ `DELETE /api/pp-stock/products/{id}` - Delete product
- ❌ `POST /api/pp-stock/products/{id}/restock` - Restock product

---

## 📱 Mobile App Implementation Notes

### 1. Stock Status Display
- When `currentQuantity <= threshold`: Display in **RED** or show "Low Stock" warning
- When `currentQuantity > threshold`: Display normally

### 2. Take Stock Flow
1. User selects a product
2. User enters quantity to take
3. App calls `POST /api/pp-stock/products/{id}/take` with quantity
4. On success, refresh product list to show updated quantities
5. Handle error cases:
   - Insufficient stock: Show error message
   - Invalid quantity: Show validation error

### 3. Transaction History
- Display transactions in reverse chronological order (newest first)
- Show transaction type with appropriate icons:
  - TAKEN: Minus icon (red)
  - RESTOCK: Plus icon (green)
  - PURCHASE: Plus icon (blue)

### 4. Error Handling
Always check the response structure:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": "Error message" }`

### 5. Authentication
- Store JWT token securely
- Include token in every request header: `Authorization: Bearer <token>`
- Handle 401 Unauthorized responses (token expired/invalid)

---

## Example Mobile App API Calls

### JavaScript/TypeScript Example

```typescript
// Base URL
const API_BASE_URL = 'https://your-api-domain.com/api/pp-stock';
const TOKEN = 'your-jwt-token-here';

// Get all products
async function getAllProducts() {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Get single product
async function getProduct(productId: number) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Take stock
async function takeStock(productId: number, quantity: number) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/take`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ quantity })
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Get transaction history
async function getProductTransactions(productId: number) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

---

## Summary

**Available Endpoints:**
1. ✅ `GET /api/pp-stock/products` - List all products
2. ✅ `GET /api/pp-stock/products/{id}` - Get product details
3. ✅ `POST /api/pp-stock/products/{id}/take` - Take stock (reduce quantity)
4. ✅ `GET /api/pp-stock/products/{id}/transactions` - Get transaction history

**Not Available:**
- ❌ Create product
- ❌ Update product
- ❌ Delete product
- ❌ Restock product

All endpoints require JWT authentication token in the Authorization header.

