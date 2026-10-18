# DermaSoul AI: Authentication, Login, Profiling & Admin Modules - Complete Documentation

## Table of Contents
1. [Authentication Module](#authentication-module)
2. [Login Module](#login-module)
3. [Profiling Module](#profiling-module)
4. [Admin Module](#admin-module)
5. [Security Architecture](#security-architecture)
6. [Flow Diagrams](#flow-diagrams)

---

## Authentication Module

### Overview
The Authentication Module is responsible for handling user registration, password management, account security, and token-based authentication. It uses JWT (JSON Web Tokens) for stateless authentication and bcrypt for secure password hashing.

### Key Components

#### 1. **User Model** (`app/models/user.py`)

The User model is the foundation of authentication, storing all user account information.

**Table Structure: `users`**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | String (UUID) | Primary Key, Auto-generated | Unique identifier for each user |
| `email` | String(255) | Unique, Indexed, NOT NULL | User's email address (used for login) |
| `hashed_password` | String(255) | NOT NULL | Bcrypt-hashed password (never stored plain) |
| `role` | String(50) | Default: "user", NOT NULL | User's role: "user" or "admin" |
| `is_active` | Boolean | Default: True, NOT NULL | Account status (True = active, False = disabled) |
| `created_at` | DateTime | Default: UTC now, NOT NULL | Account creation timestamp |
| `updated_at` | DateTime | Default: UTC now, Updated on changes, NOT NULL | Last modification timestamp |

**Relationships:**
- `profile` (1:1) - One-to-one relationship with Profile table, cascade delete
- `consultations` (1:N) - One-to-many relationship with Consultation table, cascade delete

**Key Features:**
- UUID as primary key for security (not sequential IDs)
- Email uniqueness ensures one account per email address
- Role-based access control (RBAC) for admin functionality
- Soft deletion through `is_active` flag (rather than hard delete in most cases)

#### 2. **Authentication Schema** (`app/schemas/auth_schema.py`)

Pydantic schemas validate incoming request data and format outgoing responses.

**UserRegisterRequest (Request)**
```python
{
  "email": "user@example.com",     # EmailStr - validated email format
  "password": "SecurePass123!"      # String: 8-100 characters minimum
}
```
- `email`: Must be a valid email format (enforced by Pydantic's EmailStr)
- `password`: Minimum 8 characters, maximum 100 characters
- Used for: `POST /api/auth/register`

**UserLoginRequest (Request)**
```python
{
  "email": "user@example.com",     # EmailStr - validated email format
  "password": "SecurePass123!"      # String: 1-100 characters
}
```
- `email`: Must be a valid email format
- `password`: Minimum 1 character (validation happens during verification)
- Used for: `POST /api/auth/login`

**TokenResponse (Response)**
```python
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```
- `access_token`: JWT token for authenticated requests
- `token_type`: Always "bearer" (HTTP Bearer token scheme)
- Used for: POST /api/auth/login response

**UserResponse (Response)**
```python
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "is_active": true
}
```
- `id`: User's UUID
- `email`: User's email address
- `role`: "user" or "admin"
- `is_active`: Account activation status
- Used for: GET /api/auth/me response, POST /api/auth/register response

**PasswordChangeRequest (Request)**
```python
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```
- `current_password`: User's existing password (1-100 chars)
- `new_password`: New password (8-100 chars minimum)
- Used for: POST /api/auth/change-password

**DeleteAccountConfirmRequest (Request)**
```python
{
  "password": "UserPassword123!"
}
```
- `password`: User's password for account deletion confirmation (1-100 chars)
- Used for: POST /api/auth/delete-account

#### 3. **Security Utilities** (`app/utils/security.py`)

Core cryptographic functions for password and token management.

**Password Hashing - `hash_password(password: str) -> str`**

```python
def hash_password(password: str) -> str:
    return password_context.hash(password)
```

**Purpose:** Converts plaintext password to a secure bcrypt hash

**Implementation Details:**
- Uses `passlib.context.CryptContext` with bcrypt scheme
- Bcrypt automatically generates a salt and includes it in the hash
- Non-deterministic: Same password hashes differently each time (by design)
- Example: `"MyPassword123"` → `"$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee3LWq3o6XKvLfqW"`

**Verification - `verify_password(plain_password: str, hashed_password: str) -> bool`**

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_context.verify(plain_password, hashed_password)
    except (ValueError, InvalidHashError, UnknownHashError):
        return False
```

**Purpose:** Verifies plaintext password against stored hash

**Implementation Details:**
- Extracts salt from stored hash and applies same hashing algorithm
- Compares result with stored hash
- Exception handling for corrupted/legacy hashes
- Returns `False` for invalid hashes (doesn't crash)

**JWT Token Creation - `create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str`**

```python
def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.now(timezone.utc) + expires_delta
    
    payload = {
        "sub": subject,      # User ID (subject)
        "exp": expire        # Expiration time
    }
    
    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt
```

**Purpose:** Creates a signed JWT token for user authentication

**Token Structure:**
- **Header:** `{"alg": "HS256", "typ": "JWT"}`
- **Payload:** `{"sub": "user-id", "exp": 1234567890}`
- **Signature:** HMAC-SHA256 hash of header + payload signed with JWT_SECRET_KEY

**Configuration from Settings:**
- `JWT_SECRET_KEY`: Secret key for signing (from .env, must be secure)
- `JWT_ALGORITHM`: "HS256" (HMAC with SHA-256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Default 60 minutes (configurable)

**Token Expiration:**
- Default: 60 minutes from creation
- Can be customized via `expires_delta` parameter
- Includes UTC timestamp in "exp" claim

**JWT Token Decoding - `decode_access_token(token: str) -> str | None`**

```python
def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = payload.get("sub")
        
        if user_id is None:
            return None
        
        return str(user_id)
    
    except JWTError:
        return None
```

**Purpose:** Verifies and extracts user ID from JWT token

**Validation Steps:**
1. Verifies signature using JWT_SECRET_KEY
2. Checks expiration time ("exp" claim)
3. Ensures "sub" (subject/user_id) exists
4. Returns None if token is invalid/expired

**Error Handling:**
- Invalid signature → Returns None
- Expired token → Returns None (JWT library checks automatically)
- Malformed token → Returns None (JWTError caught)
- Missing "sub" claim → Returns None

#### 4. **Authentication Service** (`app/services/auth_service.py`)

Business logic for authentication operations.

**User Registration - `register_user(db: Session, data: UserRegisterRequest) -> User`**

```python
def register_user(db: Session, data: UserRegisterRequest) -> User:
    # 1. Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    # 2. Hash the password securely
    hashed = hash_password(data.password)
    
    # 3. Create new user with default values
    user = User(
        email=data.email.lower(),           # Normalize to lowercase
        hashed_password=hashed,             # Store hash, not plaintext
        role="user",                        # Default role
        is_active=True                      # Active by default
    )
    
    # 4. Flush to database (but don't commit yet)
    db.add(user)
    db.flush()
    
    # 5. Automatically create corresponding profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    
    # 6. Commit both user and profile
    db.commit()
    db.refresh(user)
    
    return user
```

**Registration Flow:**
1. **Email Normalization:** Convert to lowercase to prevent duplicate accounts with different cases
2. **Uniqueness Check:** Query database for existing email
3. **Password Hashing:** Never store plaintext passwords
4. **User Creation:** Instantiate User object with default values
5. **Profile Creation:** Automatically create empty profile linked to user
6. **Database Commit:** Both user and profile saved atomically
7. **Refresh:** Retrieve user from database to get generated ID

**Error Handling:**
- Duplicate email: HTTP 400 Bad Request

**Post-Registration State:**
- User account created with role = "user"
- Account is active by default
- Empty profile linked to user for future data entry

**User Login - `login_user(db: Session, data: UserLoginRequest) -> str`**

```python
def login_user(db: Session, data: UserLoginRequest) -> str:
    # 1. Query user by email (lowercase)
    user = db.query(User).filter(User.email == data.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # 2. Verify password against hash
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # 3. Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled."
        )
    
    # 4. Create JWT access token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires
    )
    
    return token
```

**Login Flow:**
1. **Email Lookup:** Find user by normalized email
2. **Password Verification:** Compare provided password with stored hash
3. **Status Check:** Verify account is active (not disabled)
4. **Token Generation:** Create JWT token with user ID as subject
5. **Token Return:** Return token to client for subsequent requests

**Error Handling:**
- User not found: HTTP 401 Unauthorized (generic message for security)
- Password mismatch: HTTP 401 Unauthorized (generic message)
- Account disabled: HTTP 403 Forbidden (explicit message)

**Security Notes:**
- Generic error messages prevent email enumeration attacks
- Only active accounts can log in
- Token expiration enforced server-side through JWT "exp" claim

**Password Change - `change_user_password(db, user, current_password, new_password)`**

```python
def change_user_password(
    db: Session,
    user: User,
    *,
    current_password: str,
    new_password: str,
) -> None:
    # 1. Verify current password is correct
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )
    
    # 2. Hash new password
    user.hashed_password = hash_password(new_password)
    
    # 3. Update and commit
    db.add(user)
    db.commit()
```

**Password Change Flow:**
1. Verify current password before allowing change
2. Hash new password with bcrypt
3. Update user record
4. Commit to database

**Account Deletion - `delete_user_account(db, user, password)`**

```python
def delete_user_account(db: Session, user: User, password: str) -> None:
    # 1. Verify password for security confirmation
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect.",
        )
    
    # 2. Query all uploaded images for this user
    image_rows = (
        db.query(Consultation.image_filename)
        .filter(Consultation.user_id == user.id)
        .all()
    )
    
    # 3. Delete all uploaded images from filesystem
    for (filename,) in image_rows:
        delete_uploaded_image(filename)
    
    # 4. Delete user from database (cascades to profile, consultations)
    db.delete(user)
    db.commit()
```

**Account Deletion Flow:**
1. Password verification for security
2. Query all consultation records for user
3. Delete all uploaded medical images from filesystem
4. Delete user record (cascade deletes related profile and consultations)

**Data Cleanup:**
- Images: Deleted from `app/uploads/` directory
- Database: User, Profile, Consultations all deleted via CASCADE constraint

---

### Authentication API Endpoints

#### 1. **POST `/api/auth/register`**

Registers a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "role": "user",
  "is_active": true
}
```

**Error Responses:**
- `400 Bad Request`: Email already exists or validation failed
- `422 Unprocessable Entity`: Invalid email format or password too short

**Implementation:**
- Calls `register_user()` service
- Creates User and Profile records atomically
- Returns UserResponse with user details

---

#### 2. **POST `/api/auth/login`**

Authenticates user and returns JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJleHAiOjE2ODU2NDY2MDB9.7....",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email or password
- `403 Forbidden`: Account is disabled
- `422 Unprocessable Entity`: Validation error

**Implementation:**
- Calls `login_user()` service
- Returns JWT token valid for 60 minutes (configurable)
- Token used in Authorization header for subsequent requests

---

#### 3. **GET `/api/auth/me`**

Returns current authenticated user's information.

**Headers Required:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "is_active": true
}
```

**Error Responses:**
- `401 Unauthorized`: Token missing, invalid, or expired
- `403 Forbidden`: User account disabled

**Implementation:**
- Depends on `get_current_user()` middleware
- Token extracted from Authorization header
- Returns current user's details

---

#### 4. **POST `/api/auth/change-password`**

Changes user's password after verification of current password.

**Headers Required:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully."
}
```

**Error Responses:**
- `401 Unauthorized`: Token invalid/expired OR current password incorrect
- `422 Unprocessable Entity`: New password doesn't meet requirements

**Implementation:**
- Requires authenticated user
- Verifies current password before allowing change
- New password must be 8+ characters

---

#### 5. **POST `/api/auth/delete-account`**

Permanently deletes user account and all associated data.

**Headers Required:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "password": "UserPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Account deleted successfully."
}
```

**Error Responses:**
- `401 Unauthorized`: Token invalid/expired OR password incorrect
- `422 Unprocessable Entity`: Validation error

**Implementation:**
- Requires authenticated user
- Password verification for security confirmation
- Deletes all user data:
  - User record
  - Profile record
  - All consultations
  - All uploaded images

---

## Login Module

### Overview
The Login Module manages the authentication flow and session management through JWT tokens. It provides middleware/dependencies for protecting routes and extracting current user information.

### Key Components

#### 1. **Current User Dependency** (`app/routers/auth_router.py`)

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    # Extract token from Authorization header
    token = credentials.credentials
    
    # Decode token and get user ID
    user_id = decode_access_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )
    
    # Query user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled."
        )
    
    return user
```

**Purpose:** FastAPI dependency for protecting routes requiring authentication

**Authentication Flow:**
1. **Bearer Token Extraction:** Gets "Authorization: Bearer {token}" header
2. **Token Decoding:** Decodes JWT and validates signature/expiration
3. **User Lookup:** Queries database for user by ID from token
4. **Status Validation:** Ensures account is active

**Error Handling:**
- Invalid/expired token: HTTP 401 Unauthorized
- User not found: HTTP 401 Unauthorized (shouldn't happen if token valid)
- Disabled account: HTTP 403 Forbidden

**Usage in Protected Routes:**
```python
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

#### 2. **Admin User Dependency**

```python
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    
    return current_user
```

**Purpose:** Extends current_user dependency to require admin role

**Authorization Flow:**
1. First validates user is authenticated (via get_current_user)
2. Checks if user.role == "admin"
3. Returns user if authorized, raises 403 if not

**Usage in Admin Routes:**
```python
@router.get("/stats")
def get_admin_stats(_: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    # Only accessible to admin users
    pass
```

### Login Flow Diagram

```
Client Request with Token
         ↓
Authorization Header Extracted
         ↓
Bearer Token Parsed
         ↓
JWT Decoded & Signature Verified
         ↓
Token Expiration Checked
         ↓
User ID Extracted ("sub" claim)
         ↓
User Lookup in Database
         ↓
Account Active Status Verified
         ↓
User Object Returned to Route Handler
         ↓
Route Handler Processes with Authenticated User
```

### Token Lifecycle

**Token Creation (Login):**
```
1. User submits email + password
2. Credentials verified
3. JWT created with:
   - sub: user_id
   - exp: current_time + 60 minutes
   - iat: current_time
4. Token signed with JWT_SECRET_KEY
5. Token returned to client
```

**Token Usage (Protected Routes):**
```
1. Client sends Authorization: Bearer {token}
2. Server decodes token
3. Signature verified with JWT_SECRET_KEY
4. Expiration checked (exp > current_time)
5. User ID extracted and user looked up
6. Request processed with authenticated user
```

**Token Expiration:**
```
1. Token becomes invalid after 60 minutes
2. Client must login again to get new token
3. Expired tokens automatically rejected
4. No server-side token revocation needed (stateless)
```

---

## Profiling Module

### Overview
The Profiling Module extends user accounts with additional medical and personal information. Each user has one Profile containing health history, allergies, preferences, and other metadata.

### Key Components

#### 1. **Profile Model** (`app/models/profile.py`)

The Profile model stores extended user information related to their health and dermatological history.

**Table Structure: `profiles`**

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | String (UUID) | Primary Key, Auto-generated | Unique profile identifier |
| `user_id` | String | Foreign Key (users.id), Unique, NOT NULL | References parent User (one-to-one) |
| `full_name` | String(100) | Nullable | User's full name |
| `age` | Integer | Nullable | User's age in years |
| `gender` | String(30) | Nullable | Gender identity (male/female/other/prefer_not_to_say) |
| `phone` | String(30) | Nullable | Contact phone number |
| `known_allergies` | Text | Nullable | User's known allergies (medicine, ingredients, etc.) |
| `medical_history` | Text | Nullable | Relevant medical conditions and history |
| `skin_concerns` | Text | Nullable | Current skin concerns or problems |
| `current_products` | Text | Nullable | Currently used skincare/medical products |
| `created_at` | DateTime | Default: UTC now, NOT NULL | Profile creation timestamp |
| `updated_at` | DateTime | Default: UTC now, Updated on changes, NOT NULL | Last modification timestamp |

**Relationships:**
- `user` (1:1) - Reference back to User model

**Key Design Decisions:**
- All health fields are optional (nullable) to support gradual profile completion
- Text fields (not limited strings) for allergies, history, concerns to support detailed entries
- Cascade relationship: Deleting user automatically deletes profile
- Unique user_id ensures exactly one profile per user
- UUID primary key for consistency with User table

#### 2. **Profile Schema** (`app/schemas/profile_schema.py`)

Pydantic schemas for profile request/response validation.

**ProfileResponse (Response)**
```python
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "age": 35,
  "gender": "male",
  "phone": "+1-555-123-4567",
  "known_allergies": "Penicillin, Latex",
  "medical_history": "Type 2 Diabetes, Eczema",
  "skin_concerns": "Dry patches on elbows, occasional rashes",
  "current_products": "Cerave moisturizer, Sunscreen SPF 50"
}
```

**Field Validations:**
- `full_name`: Optional, 2-100 characters if provided
- `age`: Optional, 1-120 range if provided
- `gender`: Optional, max 30 characters if provided
- `phone`: Optional, max 30 characters if provided
- `known_allergies`: Optional, max 1000 characters if provided
- `medical_history`: Optional, max 2000 characters if provided
- `skin_concerns`: Optional, max 1000 characters if provided
- `current_products`: Optional, max 1000 characters if provided

**ProfileUpdateRequest (Request)**
```python
{
  "full_name": "Jane Doe",
  "age": 28,
  "gender": "female",
  "phone": "+1-555-987-6543",
  "known_allergies": "Shellfish, Nickel",
  "medical_history": "Asthma, Sensitive skin",
  "skin_concerns": "Acne on T-zone",
  "current_products": "Salicylic acid cleanser, Moisturizer"
}
```

**Update Behavior:**
- All fields are optional (can update individual fields)
- Only provided fields are updated (partial updates supported)
- Null values clear fields when explicitly set
- Text normalization removes leading/trailing whitespace

#### 3. **Profile Router** (`app/routers/profile_router.py`)

API endpoints for profile management.

**GET `/api/profile/me` - Retrieve Current User's Profile**

```python
@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Auto-create empty profile if doesn't exist
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": null,
  "age": null,
  "gender": null,
  "phone": null,
  "known_allergies": null,
  "medical_history": null,
  "skin_concerns": null,
  "current_products": null
}
```

**Behavior:**
- Requires authentication (Bearer token)
- Returns user's profile data
- Auto-creates empty profile if user exists but profile doesn't (safety mechanism)
- All fields may be null if not yet filled

**Error Responses:**
- `401 Unauthorized`: Token missing/invalid/expired

---

**PUT `/api/profile/me` - Update Current User's Profile**

```python
@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get or create profile
    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    
    # Extract update data (only provided fields)
    update_data = data.model_dump(exclude_unset=True)
    
    # Validate gender if provided
    if "gender" in update_data and update_data["gender"] is not None:
        gender = update_data["gender"].strip().lower()
        
        if gender not in ALLOWED_GENDERS:  # {"male", "female", "other", "prefer_not_to_say"}
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gender must be one of: male, female, other, prefer_not_to_say."
            )
        
        update_data["gender"] = gender
    
    # Normalize text fields (strip whitespace)
    for field, value in update_data.items():
        if isinstance(value, str):
            value = normalize_optional_text(value)  # Strips and returns None if empty
        
        setattr(profile, field, value)
    
    # Save to database
    db.commit()
    db.refresh(profile)
    
    return profile
```

**Request:**
```json
{
  "full_name": "John Doe",
  "age": 35,
  "known_allergies": "Penicillin"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "age": 35,
  "gender": null,
  "phone": null,
  "known_allergies": "Penicillin",
  "medical_history": null,
  "skin_concerns": null,
  "current_products": null
}
```

**Update Features:**

1. **Partial Updates:** Only provided fields are modified
   ```json
   { "full_name": "Jane" }  // Only updates full_name, others unchanged
   ```

2. **Gender Validation:**
   - Allowed values: "male", "female", "other", "prefer_not_to_say"
   - Case-insensitive (converts to lowercase)
   - Normalized on storage

3. **Text Normalization:**
   - Strips leading/trailing whitespace
   - Empty strings converted to None
   - Prevents storing whitespace-only data

4. **Field-Level Validation:**
   - Age: Must be 1-120
   - Text fields: Maximum character limits enforced by schema

**Error Responses:**
- `400 Bad Request`: Invalid gender value or validation failed
- `401 Unauthorized`: Token missing/invalid/expired
- `422 Unprocessable Entity`: Validation error (age out of range, text too long, etc.)

**Data Normalization:**

```python
def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    
    cleaned = value.strip()
    
    if cleaned == "":
        return None
    
    return cleaned
```

**ALLOWED_GENDERS Constant:**
```python
ALLOWED_GENDERS = {
    "male",
    "female",
    "other",
    "prefer_not_to_say"
}
```

### Profile API Endpoints Summary

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/profile/me` | GET | Retrieve current user's profile | Required | ProfileResponse |
| `/api/profile/me` | PUT | Update current user's profile | Required | ProfileResponse |

### Profile Features

1. **Auto-Creation:** Profile auto-created during registration
2. **Partial Updates:** Update individual fields without affecting others
3. **Data Validation:** Age range, gender options, text length limits
4. **Text Normalization:** Automatic whitespace trimming
5. **Lazy Loading:** Profile created on first access if missing
6. **Medical Data Storage:** Supports detailed health information

---

## Admin Module

### Overview
The Admin Module provides administrative functionality for managing users, monitoring consultations, viewing system statistics, and managing AI models. Only users with the "admin" role can access these endpoints.

### Key Components

#### 1. **Admin Authorization**

All admin endpoints use the `get_admin_user` dependency:

```python
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user
```

**Authorization Flow:**
1. Verify user is authenticated
2. Check user.role == "admin"
3. Return user if authorized
4. Return 403 Forbidden if not admin

**Admin Creation:**
- Users are created with role = "user" by default
- Admin role must be manually assigned in database or via admin script

#### 2. **Admin Statistics Endpoint**

**GET `/api/admin/stats`**

Returns system-wide statistics for admin dashboard.

```python
@router.get("/stats")
def get_admin_stats(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    total_consultations = db.query(func.count(Consultation.id)).scalar() or 0
    high_risk_consultations = db.query(func.count(Consultation.id)).filter(
        Consultation.risk_level.ilike("high")
    ).scalar() or 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "disabled_users": max(total_users - active_users, 0),
        "total_consultations": total_consultations,
        "high_risk_consultations": high_risk_consultations,
    }
```

**Response (200 OK):**
```json
{
  "total_users": 1250,
  "active_users": 1198,
  "disabled_users": 52,
  "total_consultations": 3847,
  "high_risk_consultations": 142
}
```

**Statistics Calculated:**
- `total_users`: COUNT of all User records
- `active_users`: COUNT of users where is_active = true
- `disabled_users`: total_users - active_users
- `total_consultations`: COUNT of all Consultation records
- `high_risk_consultations`: COUNT of consultations where risk_level = "High"

**Use Cases:**
- Dashboard summary statistics
- User engagement metrics
- System health monitoring
- Risk assessment overview

---

#### 3. **User Management Endpoints**

**GET `/api/admin/users` - List All Users**

Lists all users with search and pagination.

```python
@router.get("/users")
def list_users(
    search: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        query = query.filter(User.email.ilike(f"%{search.strip()}%"))
    
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]
```

**Query Parameters:**
- `search` (optional): Search users by email (case-insensitive substring match)
- `limit` (default: 30): Maximum results per page (1-200)
- `offset` (default: 0): Results to skip for pagination

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user1@example.com",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "user2@example.com",
    "role": "user",
    "is_active": false,
    "created_at": "2024-01-16T14:20:00"
  }
]
```

**Features:**
- Case-insensitive email search
- Newest users first (ordered by created_at DESC)
- Pagination for large datasets
- Returns basic user info (no passwords)

**Pagination Example:**
```
GET /api/admin/users?limit=10&offset=0     # Users 1-10
GET /api/admin/users?limit=10&offset=10    # Users 11-20
GET /api/admin/users?limit=10&offset=20    # Users 21-30
```

**Search Example:**
```
GET /api/admin/users?search=gmail.com      # All Gmail users
GET /api/admin/users?search=john@example   # Users with "john@example" in email
```

---

**GET `/api/admin/users/{user_id}/consultations` - List User's Consultations**

Lists all consultations for a specific user.

```python
@router.get("/users/{user_id}/consultations", response_model=ConsultationPaginatedListResponse)
def list_user_consultations(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    
    # Query consultations for user
    query = db.query(Consultation).filter(Consultation.user_id == user_id)
    total = query.count()
    rows = query.order_by(Consultation.created_at.desc()).offset(offset).limit(limit).all()
    
    items = [ConsultationListItemResponse.model_validate(row) for row in rows]
    
    return ConsultationPaginatedListResponse(
        items=items, 
        total=total, 
        limit=limit, 
        offset=offset
    )
```

**Path Parameters:**
- `user_id`: UUID of the user

**Query Parameters:**
- `limit` (default: 20): Results per page (1-200)
- `offset` (default: 0): Results to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "consultation-uuid-1",
      "predicted_disease": "Eczema",
      "risk_level": "Medium",
      "created_at": "2024-01-20T12:00:00"
    },
    {
      "id": "consultation-uuid-2",
      "predicted_disease": "Acne",
      "risk_level": "Low",
      "created_at": "2024-01-19T15:30:00"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

**Features:**
- User existence validation
- Returns paginated consultation list
- Most recent consultations first
- Summary data (not full details)

**Error Responses:**
- `404 Not Found`: User doesn't exist
- `403 Forbidden`: Not an admin

---

**PATCH `/api/admin/users/{user_id}/status` - Enable/Disable User Account**

Enables or disables a user account.

```python
@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    is_active: bool,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return {"message": "User not found."}
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }
```

**Path Parameters:**
- `user_id`: UUID of the user

**Query Parameters:**
- `is_active` (required): Boolean - true to activate, false to disable

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "is_active": false
}
```

**Example Requests:**
```
PATCH /api/admin/users/550e8400-e29b-41d4-a716-446655440000/status?is_active=false
# Disables account

PATCH /api/admin/users/550e8400-e29b-41d4-a716-446655440000/status?is_active=true
# Enables account
```

**Effects:**
- When disabled: User cannot login (login_user checks is_active)
- When disabled: Existing tokens still technically valid until expiration
- When disabled: Requests with valid token get 403 Forbidden (get_current_user checks is_active)

**Use Cases:**
- Suspend suspicious accounts
- Temporarily disable inactive users
- Reactive previously suspended accounts

---

#### 4. **Consultation Management Endpoints**

**GET `/api/admin/consultations/flagged` - Get High-Risk Consultations**

Lists consultations with specific risk levels (for monitoring).

```python
@router.get("/consultations/flagged")
def get_flagged_consultations(
    risk_level: str | None = Query(default="High"),
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(Consultation)
    
    if risk_level:
        query = query.filter(Consultation.risk_level.ilike(risk_level.strip()))
    
    consultations = query.order_by(Consultation.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": consultation.id,
            "user_id": consultation.user_id,
            "predicted_disease": consultation.predicted_disease,
            "risk_level": consultation.risk_level,
            "doctor_warning": consultation.doctor_warning,
            "created_at": consultation.created_at,
        }
        for consultation in consultations
    ]
```

**Query Parameters:**
- `risk_level` (default: "High"): Filter by risk level (case-insensitive)
- `limit` (default: 50): Maximum results (1-200)

**Response (200 OK):**
```json
[
  {
    "id": "consultation-uuid-1",
    "user_id": "user-uuid-1",
    "predicted_disease": "Melanoma",
    "risk_level": "High",
    "doctor_warning": "Urgent: Signs of potential melanoma detected. Immediate dermatologist consultation recommended.",
    "created_at": "2024-01-20T11:00:00"
  },
  {
    "id": "consultation-uuid-2",
    "user_id": "user-uuid-2",
    "predicted_disease": "Squamous Cell Carcinoma",
    "risk_level": "High",
    "doctor_warning": "High-risk features present. Recommend immediate dermatology referral.",
    "created_at": "2024-01-20T10:30:00"
  }
]
```

**Use Cases:**
- Monitor high-risk cases requiring urgent attention
- Clinical oversight and safety monitoring
- Identify patients needing referrals
- Regulatory compliance tracking

**Risk Levels in System:**
- "High": Serious conditions, immediate referral recommended
- "Medium": Moderate concerns, dermatology consultation advised
- "Low": Minor concerns, OTC management usually sufficient

---

**GET `/api/admin/consultations/{consultation_id}` - Get Consultation Details**

Returns complete details of a specific consultation.

```python
@router.get("/consultations/{consultation_id}", response_model=AdminConsultationDetailResponse)
def admin_get_consultation_detail(
    consultation_id: str,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Consultation, User.email)
        .join(User, Consultation.user_id == User.id)
        .filter(Consultation.id == consultation_id)
        .first()
    )
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found.",
        )
    
    consultation, user_email = row
    detail = ConsultationDetailResponse.model_validate(consultation).model_dump()
    
    return AdminConsultationDetailResponse(user_email=user_email, **detail)
```

**Path Parameters:**
- `consultation_id`: UUID of the consultation

**Response (200 OK):**
```json
{
  "id": "consultation-uuid-1",
  "user_id": "user-uuid-1",
  "user_email": "patient@example.com",
  "predicted_disease": "Eczema",
  "risk_level": "Medium",
  "severity": "Moderate",
  "confidence_score": 0.87,
  "doctor_warning": "Recommend dermatology consultation for treatment plan.",
  "image_filename": "uploads/consultation-uuid-1-image.jpg",
  "symptom_text": "Itchy, red patches on arms and neck for 2 weeks",
  "created_at": "2024-01-20T14:30:00"
}
```

**Key Fields:**
- `user_email`: Included in AdminConsultationDetailResponse for reference
- `predicted_disease`: AI model's disease prediction
- `risk_level`: Clinical risk assessment
- `confidence_score`: ML model confidence (0-1)
- `doctor_warning`: Clinical guidance text

**Error Responses:**
- `404 Not Found`: Consultation doesn't exist
- `403 Forbidden`: Not an admin

**Use Cases:**
- Review specific patient consultations
- Clinical audit and compliance
- Investigate patient concerns
- Quality assurance monitoring

---

#### 5. **AI Model Management Endpoints**

**GET `/api/admin/ai/model-registry` - View Loaded AI Models**

Returns information about currently loaded AI models.

```python
@router.get("/ai/model-registry")
def get_ai_model_registry(
    _: User = Depends(get_admin_user),
):
    return [
        {
            "name": item.name,
            "version": item.version,
            "loaded": item.loaded,
        }
        for item in get_model_registry_snapshot()
    ]
```

**Response (200 OK):**
```json
[
  {
    "name": "EfficientNet-B3-Disease-Classifier",
    "version": "1.0.0",
    "loaded": true
  },
  {
    "name": "EfficientNet-B1-SkinType-Classifier",
    "version": "1.0.0",
    "loaded": true
  },
  {
    "name": "Biomedical-NER-Entity-Extractor",
    "version": "1.0.0",
    "loaded": true
  },
  {
    "name": "BGE-Base-Embedding-Model",
    "version": "1.0.0",
    "loaded": false
  }
]
```

**Model Information:**
- `name`: Model identifier
- `version`: Model version
- `loaded`: Whether model is currently in memory

**Use Cases:**
- Monitor AI model availability
- Troubleshoot inference failures
- System health checks
- Performance monitoring

**Key Models:**
1. **Disease Classifier**: EfficientNet-B3 for dermatological disease prediction
2. **Skin Type Classifier**: EfficientNet-B1 for skin type detection (dry/normal/oily)
3. **NER Entity Extractor**: Biomedical NER for symptom extraction
4. **Embedding Model**: BGE for RAG semantic search

---

**POST `/api/admin/ai/reindex-rag` - Reindex RAG Knowledge Base**

Triggers reindexing of the RAG (Retrieval-Augmented Generation) knowledge base.

```python
@router.post("/ai/reindex-rag")
def trigger_rag_reindex(
    _: User = Depends(get_admin_user),
):
    return run_rag_reindex_job()
```

**Response (200 OK):**
```json
{
  "status": "started",
  "job_id": "rag-reindex-job-12345",
  "message": "RAG reindexing job started in background"
}
```

**Purpose:**
- Regenerates embeddings for all knowledge base chunks
- Updates semantic search indices
- Refreshes condition knowledge and recommendations

**Use Cases:**
- After updating knowledge base content
- Periodic maintenance
- Fixing corrupted embeddings
- Deploying updated embedding models

---

### Admin API Endpoints Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/admin/stats` | GET | System-wide statistics | Dashboard stats |
| `/api/admin/users` | GET | List all users with search/pagination | User list |
| `/api/admin/users/{user_id}/consultations` | GET | List user's consultations | Paginated consultations |
| `/api/admin/users/{user_id}/status` | PATCH | Enable/disable user account | Updated user |
| `/api/admin/consultations/flagged` | GET | Get high-risk consultations | Consultation list |
| `/api/admin/consultations/{consultation_id}` | GET | Get consultation details | Full consultation |
| `/api/admin/ai/model-registry` | GET | View loaded AI models | Model list |
| `/api/admin/ai/reindex-rag` | POST | Reindex RAG knowledge base | Job status |

### Admin Features

1. **User Management:**
   - Search and filter users
   - Enable/disable accounts
   - View user consultations

2. **Consultation Monitoring:**
   - View high-risk cases
   - Review consultation details
   - Track clinical outcomes

3. **System Monitoring:**
   - Dashboard statistics
   - AI model status
   - System health checks

4. **Data Management:**
   - RAG knowledge base reindexing
   - Model registry management

5. **Security:**
   - Role-based access control
   - Admin-only endpoints protected
   - Audit trail through timestamps

---

## Security Architecture

### Password Security

**Bcrypt Hashing:**
- Uses bcrypt with 12-round salt (default security level)
- Non-deterministic: Same password produces different hashes each time
- Includes salt in hash: `$2b$12$[salt]$[hash]`
- Verification compares hashes without storing plaintext

**Password Requirements:**
- Registration: Minimum 8 characters
- Password Change: Minimum 8 characters
- Stored: Only hashes stored, never plaintext

### JWT Token Security

**Token Specification:**
- Algorithm: HS256 (HMAC-SHA256)
- Secret Key: Loaded from environment (.env file)
- Expiration: 60 minutes default (configurable)
- Subject: User ID encoded in "sub" claim

**Token Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VyLWlkIiwiZXhwIjoxMjM0NTY3ODkwfQ.
signature
```

**Security Features:**
- Signature verification prevents tampering
- Expiration enforced server-side
- Stateless: No token revocation needed
- Bearer token scheme in Authorization header

**Token Validation:**
1. Signature verified with JWT_SECRET_KEY
2. Expiration checked (exp > current_time)
3. Subject (user_id) validated against database
4. User account status verified (is_active = true)

### Authorization

**Role-Based Access Control (RBAC):**
- Users: Default role, can access user endpoints
- Admins: role = "admin", can access admin endpoints

**Dependency Injection Pattern:**
```python
get_current_user()      # Returns authenticated user
get_admin_user()        # Returns user IF role = admin, else 403
```

**Account Status:**
- `is_active = true`: Can login and use API
- `is_active = false`: Cannot login, existing tokens get 403

### Data Protection

**Sensitive Data:**
- Passwords: Never logged, only hashes stored
- User IDs: UUIDs instead of sequential IDs
- Medical data: Stored in encrypted PostgreSQL (if configured)

**Account Deletion:**
- Deletes user, profile, consultations
- Removes uploaded images from filesystem
- Cannot be undone (permanent deletion)

**Email Privacy:**
- Unique constraint ensures one account per email
- Case-insensitive matching to prevent duplicates
- Generic error messages prevent email enumeration

---

## Flow Diagrams

### User Registration Flow

```
┌─────────────────────┐
│  Client: Register   │
│  POST /api/auth/    │
│    register         │
└──────────┬──────────┘
           │
           │ email + password
           ▼
┌──────────────────────────────┐
│ Check email uniqueness       │
│ (case-insensitive)           │
└──────┬───────────────┬────────┘
       │ exists        │ doesn't exist
       │               │
       ▼               ▼
    400 Error    ┌──────────────────┐
             │ Hash password     │
             │ (bcrypt)          │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────────┐
             │ Create User record   │
             │ role = "user"        │
             │ is_active = true     │
             └────────┬─────────────┘
                      │
                      ▼
             ┌──────────────────────┐
             │ Create empty Profile │
             │ linked to User       │
             └────────┬─────────────┘
                      │
                      ▼
             ┌──────────────────────┐
             │ Commit to Database   │
             └────────┬─────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Return UserResponse    │
         │ (201 Created)          │
         └────────────────────────┘
```

### User Login Flow

```
┌────────────────────┐
│  Client: Login     │
│  POST /api/auth/   │
│    login           │
└──────────┬─────────┘
           │
           │ email + password
           ▼
┌────────────────────────────┐
│ Query User by email        │
│ (case-insensitive)         │
└──────┬──────────────┬───────┘
       │ not found    │ found
       │              │
       ▼              ▼
    401 Error   ┌──────────────────┐
             │ Verify password  │
             │ (bcrypt compare) │
             └──────┬───┬───────┘
                    │   │
           mismatch │   │ match
                    ▼   ▼
                 401   Check
                       is_active
                        │ └──┬──┐
                        │    │  │
                        │ false  │ true
                        │    │  │
                        ▼    ▼  ▼
                      403   ┌──────────────┐
                            │ Create JWT   │
                            │ Token        │
                            │ exp = now    │
                            │   + 60 min   │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌─────────────────┐
                            │ Return Token    │
                            │ (200 OK)        │
                            │ token_type:     │
                            │ "bearer"        │
                            └─────────────────┘
```

### Protected Request Flow

```
┌───────────────────────────────┐
│  Client: Protected Request    │
│  GET /api/profile/me          │
│  Authorization: Bearer {token}│
└───────────────┬───────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Extract token from       │
     │ Authorization header     │
     │ (HTTPBearer scheme)      │
     └──────────┬───────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Decode JWT token         │
     │ - Verify signature       │
     │ - Check expiration       │
     │ - Extract user_id        │
     └──────┬──────────────┬─────┘
            │              │
        invalid/        valid
        expired          │
            │            ▼
            │    ┌──────────────────┐
            │    │ Query User from  │
            │    │ database by ID   │
            │    └─────┬────────┬───┘
            │          │        │
            │      not found   found
            │          │        │
            │          ▼        ▼
            │       401 Err  Check
            │                  active
            │                    │
            │              ┌─────┴─────┐
            │          false│        │true
            │              │    │    │
            │              ▼    ▼    ▼
            ▼           403   ┌────────────────┐
         401 Error            │ Pass user to   │
                              │ route handler  │
                              └────┬───────────┘
                                   │
                                   ▼
                              ┌─────────────────┐
                              │ Route Handler   │
                              │ Processes       │
                              │ Request         │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Return Response │
                              │ (200 OK)        │
                              └─────────────────┘
```

### Profile Update Flow

```
┌──────────────────────────────┐
│  Client: Update Profile      │
│  PUT /api/profile/me         │
│  { fields to update }        │
└───────────────┬──────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Authenticate Request     │
     │ (get_current_user dep)   │
     └──────────┬───────────────┘
                │
                ├─► 401/403 if invalid
                │
                ▼
     ┌──────────────────────────┐
     │ Query Profile by         │
     │ user_id                  │
     └──────┬──────────────┬─────┘
            │              │
        not found       found
            │              │
            ▼              ▼
        Create      ┌──────────────────┐
        empty       │ Validate request │
        profile     │ data (schema)    │
            │       └──────┬───────────┘
            │              │
            │      ┌───────┴────────┐
            │      │ error          │ valid
            │      │                │
            │      ▼                ▼
            │   422 Error    ┌──────────────────┐
            │                │ Gender check     │
            │                │ (if provided)    │
            │                └─────┬────────┬───┘
            │                      │        │
            │              invalid │        │ valid
            │                      │        │
            │                      ▼        ▼
            │                   400 Err ┌──────────────────┐
            │                          │ Normalize text   │
            │                          │ fields (strip)   │
            │                          └────────┬─────────┘
            │                                   │
            └───────────────┬───────────────────┘
                            │
                            ▼
                    ┌──────────────────────┐
                    │ Update profile       │
                    │ setattr() for each   │
                    │ provided field       │
                    └─────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Commit to DB         │
                    └─────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Return updated       │
                    │ ProfileResponse      │
                    │ (200 OK)             │
                    └──────────────────────┘
```

### Admin User Status Update Flow

```
┌─────────────────────────────┐
│ Admin: Update User Status   │
│ PATCH /api/admin/users/     │
│   {user_id}/status          │
│ ?is_active={bool}           │
└──────────────┬──────────────┘
               │
               ▼
     ┌────────────────────────┐
     │ Authenticate request   │
     │ (get_current_user dep) │
     └──────────┬─────────────┘
                │
         ├─► 401/403 if not auth
         │
         ▼
    ┌──────────────────────┐
    │ Check role = "admin" │
    │ (get_admin_user dep) │
    └──────┬───────────┬───┘
           │           │
      not admin    admin
           │           │
           ▼           ▼
        403 Err   ┌───────────────────┐
                  │ Query User by ID  │
                  └────┬───────────┬──┘
                       │           │
                   not found    found
                       │           │
                       ▼           ▼
                  {"message":  ┌──────────────┐
                   "User not   │ Update       │
                    found"}    │ is_active =  │
                               │ request value│
                               └────┬────────┘
                                    │
                                    ▼
                               ┌──────────────┐
                               │ Commit to DB │
                               └────┬────────┘
                                    │
                                    ▼
                               ┌──────────────────┐
                               │ Return updated   │
                               │ user info        │
                               │ (200 OK)         │
                               └──────────────────┘
```

---

## Summary Table

### Key Concepts

| Concept | Details |
|---------|---------|
| **Authentication** | JWT-based, 60-minute expiration, Bearer token scheme |
| **Password Storage** | Bcrypt hashing with 12-round salt |
| **User Roles** | "user" (default) and "admin" (privileged access) |
| **Account Status** | Active (can login) / Disabled (cannot login) |
| **Profile** | Extended user info (health, allergies, preferences) |
| **Admin Functions** | User management, consultation monitoring, system stats |

### Authentication Flow Summary

1. **Registration:** Email → Hash Password → Create User + Profile → Store
2. **Login:** Email → Verify Password → Check Active → Create Token → Return
3. **Protected Request:** Extract Token → Decode → Verify Signature/Expiry → Lookup User → Process
4. **Admin Action:** Authenticate → Check Admin Role → Process Admin Request

### Security Layers

1. **Transport:** HTTPS (recommended in production)
2. **Authentication:** JWT tokens with expiration
3. **Authorization:** Role-based access control (RBAC)
4. **Password:** Bcrypt hashing with salt
5. **Account:** Status flag for enabling/disabling
6. **Data:** Cascade deletion for data integrity

---

This documentation covers the complete authentication, login, profiling, and admin modules in DermaSoul AI, including all endpoints, data models, business logic, security considerations, and operational flows.
