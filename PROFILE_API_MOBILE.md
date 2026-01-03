# Profile API Documentation for Mobile App

## Base URL
```
https://your-domain.com/api
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Important Note for Mobile App
**Care workers can ONLY view and update their own profile.** They can only change their profile photo. All other profile fields are read-only for mobile app users.

---

## 1. Get My Profile

### Endpoint
```
GET /api/users/[id]
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Your user ID (obtained from login response or JWT token) |

### Request Example
```javascript
// Get my profile
GET /api/users/123
Authorization: Bearer <your_jwt_token>
```

### Response (200 OK)
```json
{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "phoneNo": "+44 123 456 7890",
  "profilePic": "https://example.com/photos/john.jpg",
  "employeeNumber": "EMP001",
  "startDate": "2024-01-15T00:00:00.000Z",
  "leaveDate": null,
  "postalCode": "SW1A 1AA",
  "emergencyName": "Jane Doe",
  "emergencyContact": "+44 987 654 3210",
  "contractedHours": 40,
  "status": "CURRENT",
  "niNumber": "AB123456C",
  "isEmailVerified": true,
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z",
  "roleId": 3,
  "regionId": 2,
  "role": {
    "id": 3,
    "name": "CAREWORKER",
    "displayName": "Care Worker"
  },
  "region": {
    "id": 2,
    "name": "London",
    "code": "LON"
  },
  "permissions": [
    {
      "id": 1,
      "userId": 123,
      "key": "dashboard.view"
    },
    {
      "id": 2,
      "userId": 123,
      "key": "profile.view"
    }
  ]
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "No token provided"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## 2. Update My Profile Photo

### Endpoint
```
PUT /api/users/[id]
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Your user ID (must match the authenticated user) |

### Request Body
**Important:** For mobile app, you can ONLY update the `profilePic` field. All other fields are read-only.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profilePic` | string | Yes | URL of the uploaded profile photo (obtained from `/api/upload`) |

### Request Example
```json
{
  "profilePic": "https://rizwancars.com/upload_docs/uploads/photo_123456.jpg"
}
```

### Response (200 OK)
```json
{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "phoneNo": "+44 123 456 7890",
  "profilePic": "https://rizwancars.com/upload_docs/uploads/photo_123456.jpg",
  "employeeNumber": "EMP001",
  "startDate": "2024-01-15T00:00:00.000Z",
  "leaveDate": null,
  "postalCode": "SW1A 1AA",
  "emergencyName": "Jane Doe",
  "emergencyContact": "+44 987 654 3210",
  "contractedHours": 40,
  "status": "CURRENT",
  "niNumber": "AB123456C",
  "isEmailVerified": true,
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:00.000Z",
  "roleId": 3,
  "regionId": 2,
  "role": {
    "id": 3,
    "name": "CAREWORKER",
    "displayName": "Care Worker"
  },
  "region": {
    "id": 2,
    "name": "London",
    "code": "LON"
  },
  "permissions": [
    {
      "id": 1,
      "userId": 123,
      "key": "dashboard.view"
    },
    {
      "id": 2,
      "userId": 123,
      "key": "profile.view"
    }
  ]
}
```

### Error Responses
```json
// 400 Bad Request
{
  "error": "User with this email already exists"
}

// 401 Unauthorized
{
  "error": "No token provided"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## 3. Upload Profile Photo

### Endpoint
```
POST /api/upload
```

### Description
Upload a photo file and get the URL to use for updating your profile photo.

### Request Body
The request should send base64-encoded image data in the following format:

```json
{
  "file": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

### Request Example
```javascript
// First, convert image file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Upload photo
const uploadPhoto = async (token, imageFile) => {
  const base64Data = await fileToBase64(imageFile);
  
  const response = await fetch('https://your-domain.com/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file: base64Data
    })
  });
  
  return response.json();
};
```

### Response (200 OK)
```json
{
  "success": true,
  "fileUrl": "https://rizwancars.com/upload_docs/uploads/photo_123456.jpg",
  "fileName": "photo_123456.jpg",
  "fileType": "image/jpeg"
}
```

### Error Responses
```json
// 400 Bad Request
{
  "success": false,
  "error": "Invalid base64 data URI format."
}

// 401 Unauthorized
{
  "error": "No token provided"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to upload file"
}
```

---

## Complete Workflow: Update Profile Photo

### Step 1: Upload Photo
```javascript
// Upload the photo file
const uploadResult = await uploadPhoto(token, imageFile);
if (uploadResult.success) {
  const photoUrl = uploadResult.fileUrl;
  // Proceed to step 2
}
```

### Step 2: Update Profile with Photo URL
```javascript
// Update profile with the uploaded photo URL
const updateResult = await updateProfilePhoto(token, userId, photoUrl);
```

---

## Mobile App Integration Examples

### React Native Example

```javascript
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

// Get my profile
const getMyProfile = async (token, userId) => {
  const response = await fetch(
    `https://your-domain.com/api/users/${userId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const profile = await response.json();
    return profile;
  } else {
    throw new Error('Failed to fetch profile');
  }
};

// Convert image to base64
const imageToBase64 = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Upload photo
const uploadPhoto = async (token, imageUri) => {
  const base64Data = await imageToBase64(imageUri);
  
  const response = await fetch(
    'https://your-domain.com/api/upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data
      })
    }
  );
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload photo');
  }
};

// Update profile photo
const updateProfilePhoto = async (token, userId, photoUrl) => {
  const response = await fetch(
    `https://your-domain.com/api/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profilePic: photoUrl
      })
    }
  );
  
  if (response.ok) {
    const updatedProfile = await response.json();
    return updatedProfile;
  } else {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile photo');
  }
};

// Complete flow: Pick image, upload, and update profile
const changeProfilePhoto = async (token, userId) => {
  try {
    // Request permission to access camera/photo library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }
    
    // Pick an image
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (pickerResult.canceled) {
      return { cancelled: true };
    }
    
    // Upload the photo
    const uploadResult = await uploadPhoto(token, pickerResult.assets[0].uri);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload photo');
    }
    
    // Update profile with new photo URL
    const updatedProfile = await updateProfilePhoto(
      token,
      userId,
      uploadResult.fileUrl
    );
    
    return {
      success: true,
      profile: updatedProfile,
      photoUrl: uploadResult.fileUrl
    };
  } catch (error) {
    console.error('Error changing profile photo:', error);
    throw error;
  }
};
```

### Flutter Example

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

// Get my profile
Future<Map<String, dynamic>> getMyProfile(String token, int userId) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/users/$userId'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch profile');
  }
}

// Convert image file to base64
Future<String> imageToBase64(File imageFile) async {
  final bytes = await imageFile.readAsBytes();
  final base64String = base64Encode(bytes);
  final mimeType = imageFile.path.split('.').last;
  return 'data:image/$mimeType;base64,$base64String';
}

// Upload photo
Future<Map<String, dynamic>> uploadPhoto(String token, File imageFile) async {
  final base64Data = await imageToBase64(imageFile);
  
  final response = await http.post(
    Uri.parse('https://your-domain.com/api/upload'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'file': base64Data,
    }),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    final error = json.decode(response.body);
    throw Exception(error['error'] ?? 'Failed to upload photo');
  }
}

// Update profile photo
Future<Map<String, dynamic>> updateProfilePhoto(
  String token,
  int userId,
  String photoUrl,
) async {
  final response = await http.put(
    Uri.parse('https://your-domain.com/api/users/$userId'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'profilePic': photoUrl,
    }),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    final error = json.decode(response.body);
    throw Exception(error['error'] ?? 'Failed to update profile photo');
  }
}

// Complete flow: Pick image, upload, and update profile
Future<Map<String, dynamic>> changeProfilePhoto(
  String token,
  int userId,
) async {
  try {
    final picker = ImagePicker();
    
    // Pick an image
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    
    if (pickedFile == null) {
      return {'cancelled': true};
    }
    
    final imageFile = File(pickedFile.path);
    
    // Upload the photo
    final uploadResult = await uploadPhoto(token, imageFile);
    
    if (uploadResult['success'] != true) {
      throw Exception(uploadResult['error'] ?? 'Failed to upload photo');
    }
    
    // Update profile with new photo URL
    final updatedProfile = await updateProfilePhoto(
      token,
      userId,
      uploadResult['fileUrl'],
    );
    
    return {
      'success': true,
      'profile': updatedProfile,
      'photoUrl': uploadResult['fileUrl'],
    };
  } catch (e) {
    print('Error changing profile photo: $e');
    rethrow;
  }
}
```

---

## Notes

1. **User ID**: You can get your user ID from:
   - The login response (`/api/auth/login`)
   - Decoding the JWT token
   - Storing it in your app after successful login

2. **Photo Upload**: 
   - Maximum file size: 10MB
   - Supported formats: JPEG, PNG, GIF, WebP
   - Photos are uploaded to an external service and a URL is returned
   - Use this URL to update your profile photo

3. **Read-Only Fields**: For mobile app users (care workers), the following fields are read-only and cannot be updated:
   - `firstName`
   - `lastName`
   - `email`
   - `username`
   - `phoneNo`
   - `employeeNumber`
   - `startDate`
   - `leaveDate`
   - `regionId`
   - `postalCode`
   - `emergencyName`
   - `emergencyContact`
   - `contractedHours`
   - `status`
   - `niNumber`
   - `roleId`
   - `permissions`

4. **Only Updatable Field**: Mobile app users can ONLY update:
   - `profilePic` (profile photo)

5. **Security**: The API will verify that you can only view and update your own profile. Attempting to access another user's profile will result in an error.

6. **Photo URL Format**: The uploaded photo URL will be in the format:
   ```
   https://rizwancars.com/upload_docs/uploads/[filename]
   ```

---

## Error Handling

### Common Errors

1. **401 Unauthorized**: Token is missing or invalid
   - Solution: Re-authenticate and get a new token

2. **404 Not Found**: User ID doesn't exist or doesn't match authenticated user
   - Solution: Verify you're using the correct user ID from your login response

3. **400 Bad Request**: Invalid request data
   - Solution: Ensure you're only sending `profilePic` field for updates

4. **500 Internal Server Error**: Server-side error
   - Solution: Retry the request after a few moments

---

## Support

For issues or questions, contact the development team.

