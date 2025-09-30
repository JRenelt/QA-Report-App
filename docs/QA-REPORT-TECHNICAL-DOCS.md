# 🔧 QA-Report-App Technische Dokumentation

## 📋 Inhaltsverzeichnis

1. [System-Architektur](#system-architektur)
2. [Backend-API Spezifikation](#backend-api-spezifikation)
3. [Frontend-Architektur](#frontend-architektur)
4. [Datenbank-Schema](#datenbank-schema)
5. [Import/Export System](#importexport-system)
6. [Authentifizierung & Sicherheit](#authentifizierung--sicherheit)
7. [Deployment & DevOps](#deployment--devops)
8. [Performance & Skalierung](#performance--skalierung)

---

## 🏗️ System-Architektur

### Überblick
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│   FastAPI       │────│   SQLite/       │
│   (Port 3000)   │    │   Backend       │    │   PostgreSQL    │
│                 │    │   (Port 8002)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
    │ Tailwind│              │   JWT   │              │ Database│
    │   CSS   │              │  Auth   │              │ Tables  │
    │ Lucide  │              │ CORS    │              │         │
    └─────────┘              └─────────┘              └─────────┘
```

### Technologie-Stack

**Frontend:**
- **React 18+** mit TypeScript
- **Tailwind CSS 3.4** für Styling
- **Lucide Icons** für UI-Symbole
- **Vite/Create React App** als Build-Tool

**Backend:**
- **FastAPI 0.104+** mit Python 3.8+
- **SQLAlchemy** für ORM
- **Pydantic** für Data Validation
- **JWT** für Authentication
- **Uvicorn** als ASGI Server

**Datenbank:**
- **SQLite** (Entwicklung)
- **PostgreSQL 12+** (Produktion)
- **Databases** Library für Async Queries

### Ordner-Struktur
```
qa-report-app/
├── backend/
│   ├── routes/           # API Endpunkte
│   ├── models.py         # Pydantic Models
│   ├── database.py       # DB Konfiguration
│   ├── auth.py           # JWT Handling
│   └── main.py           # FastAPI App
├── frontend/
│   ├── src/
│   │   ├── components/   # React Komponenten
│   │   ├── hooks/        # Custom React Hooks
│   │   └── lib/          # Utility Functions
│   ├── tailwind.config.js
│   └── package.json
├── templates/            # Import/Export Templates
├── docs/                 # Dokumentation
└── tests/                # Test Files
```

---

## 🌐 Backend-API Spezifikation

### Base URL
- **Development:** `http://localhost:8002`
- **Production:** `https://yourdomain.com`

### Authentication
Alle API-Endpunkte (außer Login) erfordern JWT Token im Header:
```
Authorization: Bearer <jwt_token>
```

### API Endpunkte

#### Authentication (`/api/auth`)

**POST `/api/auth/login`**
```json
{
  "username": "string",
  "password": "string"
}
```
Response:
```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "language_preference": "DE"
  }
}
```

**POST `/api/auth/logout`**
Invalidiert den aktuellen JWT Token.

#### Companies (`/api/companies`)

**GET `/api/companies/`**
Gibt alle Firmen zurück, zu denen der Benutzer Zugriff hat.

**POST `/api/companies/`**
```json
{
  "name": "Firma GmbH",
  "description": "Beschreibung",
  "logo_url": "https://example.com/logo.png"
}
```

**GET `/api/companies/{company_id}`**
Gibt eine spezifische Firma zurück.

#### Projects (`/api/projects`)

**GET `/api/projects/`**
Gibt alle Projekte zurück.

**POST `/api/projects/`**
```json
{
  "name": "Projekt Name",
  "company_id": 1,
  "description": "Beschreibung",
  "template_type": "web_app_qa",
  "status": "active"
}
```

#### Test Suites (`/api/test-suites`)

**GET `/api/test-suites/`**
Gibt alle Test-Suiten zurück.

**GET `/api/test-suites/project/{project_id}`**
Test-Suiten für ein spezifisches Projekt.

**POST `/api/test-suites/`**
```json
{
  "name": "Test Suite Name",
  "project_id": 1,
  "description": "Beschreibung",
  "icon": "🎨",
  "sort_order": 1
}
```

#### Test Cases (`/api/test-cases`)

**GET `/api/test-cases/suite/{test_suite_id}`**
Testfälle für eine Test-Suite.

**POST `/api/test-cases/`**
```json
{
  "test_id": "AD0001",
  "name": "Test Name",
  "test_suite_id": 1,
  "description": "Beschreibung",
  "expected_result": "Erwartetes Ergebnis",
  "priority": 1,
  "sort_order": 1
}
```

#### Test Results (`/api/test-results`)

**POST `/api/test-results/`**
```json
{
  "test_case_id": 1,
  "status": "success",
  "notes": "Test erfolgreich durchgeführt",
  "session_id": "session_20241001_123456"
}
```

**GET `/api/test-results/session/{session_id}`**
Alle Ergebnisse einer Test-Session.

#### Import/Export (`/api/import-export`)

**POST `/api/import-export/template/generate`**
Query Parameters:
- `template_type`: "empty" | "current" | "favorg"
- `format_type`: "json" | "csv" | "excel"

**POST `/api/import-export/import`**
Multipart Form Data:
- `file`: Upload-Datei (.json/.csv)
- `overwrite_existing`: boolean
- `validate_only`: boolean

### Error Handling
```json
{
  "detail": "Error message",
  "status_code": 400,
  "error_type": "validation_error"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

---

## ⚛️ Frontend-Architektur

### Komponenten-Hierarchie
```
App.tsx
├── LoginForm.tsx
├── Dashboard.tsx
│   ├── SystemStatus.tsx
│   └── TestSuiteManager.tsx
│       ├── TestCaseList.tsx
│       └── TestExecution.tsx
└── ImportExportManager.tsx
```

### State Management
- **React useState** für lokalen Component State
- **localStorage** für Persistierung (Auth Token, User Preferences)
- **useEffect** für API Calls und Side Effects

### Routing
Aktuell Single-Page-Application ohne Router.
Zukünftig: React Router für Multi-Page Navigation.

### Styling System

**Tailwind CSS Klassen:**
```css
/* Custom Utility Classes */
.btn-primary {
  @apply bg-qa-primary-600 hover:bg-qa-primary-700 text-white 
         font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
}

.btn-secondary {
  @apply bg-qa-gray-200 hover:bg-qa-gray-300 text-qa-gray-800 
         font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
}

.card {
  @apply bg-white rounded-lg shadow-md border border-qa-gray-200;
}

.input-field {
  @apply border border-qa-gray-300 rounded-lg px-3 py-2 
         focus:outline-none focus:ring-2 focus:ring-qa-primary-500 
         focus:border-transparent;
}
```

**Farb-Schema:**
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'qa-primary': {
        50: '#f0f9ff',   // Hellstes Blau
        500: '#0ea5e9',  // Standard Blau
        600: '#0284c7',  // Primär Blau
        900: '#0c4a6e',  // Dunkelstes Blau
      },
      'qa-gray': {
        50: '#f9fafb',   // Hellstes Grau
        500: '#6b7280',  // Standard Grau  
        900: '#111827',  // Dunkelstes Grau
      }
    }
  }
}
```

### API Integration
```typescript
// API Call Pattern
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const response = await fetch(`${backendUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};
```

---

## 🗄️ Datenbank-Schema

### Entity Relationship Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    users    │    │ companies   │    │  projects   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ name        │    │ name        │
│ email       │    │ description │    │ company_id  │───┐
│ password    │    │ logo_url    │    │ template    │   │
│ role        │    │ created_by  │────│ status      │   │
│ ...         │    │ ...         │    │ created_by  │───│──┐
└─────────────┘    └─────────────┘    │ ...         │   │  │
                                      └─────────────┘   │  │
                                                        │  │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │  │
│test_results │    │ test_cases  │    │test_suites  │   │  │
├─────────────┤    ├─────────────┤    ├─────────────┤   │  │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │   │  │
│ status      │    │ test_id     │    │ name        │   │  │
│ notes       │    │ name        │    │ project_id  │───┘  │
│ test_case_id│────│ description │    │ description │      │
│ executed_by │────│ priority    │    │ icon        │      │
│ session_id  │    │ suite_id    │────│ sort_order  │      │
│ ...         │    │ ...         │    │ ...         │      │
└─────────────┘    └─────────────┘    └─────────────┘      │
                                                            │
┌─────────────┐                                            │
│project_users│                                            │
├─────────────┤                                            │
│ id (PK)     │                                            │
│ project_id  │────────────────────────────────────────────┘
│ user_id     │────┐
│ access_level│    │
│ granted_by  │────┘
│ ...         │
└─────────────┘
```

### Tabellen-Definitionen

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  hashed_password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'qa_tester',
  language_preference VARCHAR(5) NOT NULL DEFAULT 'DE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### companies
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  created_by INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_type VARCHAR(30) NOT NULL DEFAULT 'custom',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  created_by INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### test_suites
```sql
CREATE TABLE test_suites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL DEFAULT '📂',
  sort_order INTEGER NOT NULL DEFAULT 0,
  project_id INTEGER REFERENCES projects(id) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### test_cases
```sql
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  test_id VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 3,
  expected_result TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  test_suite_id INTEGER REFERENCES test_suites(id) NOT NULL,
  is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### test_results
```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  test_case_id INTEGER REFERENCES test_cases(id) NOT NULL,
  executed_by INTEGER REFERENCES users(id) NOT NULL,
  execution_date TIMESTAMP NOT NULL DEFAULT NOW(),
  session_id VARCHAR(100)
);
```

### Indices für Performance
```sql
-- Häufig verwendete Queries optimieren
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX idx_test_cases_suite_id ON test_cases(test_suite_id);
CREATE INDEX idx_test_results_case_id ON test_results(test_case_id);
CREATE INDEX idx_test_results_session ON test_results(session_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_test_cases_test_id ON test_cases(test_id);
```

---

## 📊 Import/Export System

### Template-Format Spezifikation

#### JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["meta"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["version", "template_type"],
      "properties": {
        "version": {"type": "string", "pattern": "^\\d+\\.\\d+$"},
        "template_type": {"enum": ["empty", "current", "favorg_migration"]},
        "created": {"type": "string", "format": "date-time"},
        "description": {"type": "string"}
      }
    },
    "companies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {"type": "string", "maxLength": 100},
          "description": {"type": "string"}
        }
      }
    },
    "test_cases": {
      "type": "array", 
      "items": {
        "type": "object",
        "required": ["test_id", "name", "suite_name"],
        "properties": {
          "test_id": {"type": "string", "maxLength": 20},
          "name": {"type": "string", "maxLength": 150},
          "suite_name": {"type": "string"},
          "description": {"type": "string"},
          "expected_result": {"type": "string"},
          "priority": {"type": "integer", "minimum": 1, "maximum": 3},
          "sort_order": {"type": "integer", "minimum": 1}
        }
      }
    }
  }
}
```

#### CSV Format
```csv
test_id,name,suite_name,description,expected_result,priority,sort_order
AD0001,Corporate Identity prüfen,Allgemeines Design,Überprüfung der Guidelines,Alle Farben entsprechen Design,1,1
```

### Import-Prozess

1. **File Upload & Validation**
   - Content-Type Prüfung
   - File Size Limit (10MB)
   - JSON/CSV Parsing

2. **Data Validation**
   - Schema Validation
   - Business Rules Check
   - Duplicate Detection

3. **Conflict Resolution**
   - Existing Entry Detection
   - User Choice: Skip/Overwrite
   - Backup Creation

4. **Database Transaction**
   - Atomic Import Operation
   - Rollback bei Fehlern
   - Progress Tracking

### Export-Optionen

**Template Types:**
- **empty**: Leere Struktur zum Ausfüllen
- **current**: Aktuelle Benutzer-Daten
- **favorg**: Vorgefüllte FavOrg Testpunkte

**Output Formats:**
- **JSON**: Vollständige Struktur mit Metadaten
- **CSV**: Flache Testfall-Liste
- **Excel**: Tabellenformat mit Sheets (geplant)

---

## 🔐 Authentifizierung & Sicherheit

### JWT Implementation

**Token Structure:**
```json
{
  "sub": "1",           // User ID
  "username": "admin",  // Username
  "role": "admin",      // User Role
  "exp": 1234567890,    // Expiration
  "iat": 1234567890     // Issued At
}
```

**Security Headers:**
```python
# FastAPI CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"]
)
```

### Passwort-Sicherheit

**Hashing (Development):**
```python
# Vereinfacht für Demo - Produktion sollte bcrypt verwenden
import hashlib
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()
```

**Produktion (empfohlen):**
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### Berechtigungs-System

**Role-Based Access Control:**
```python
# Decorator für Rollen-Überprüfung
def require_role(allowed_roles: List[str]):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if current_user.role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Verwendung
@require_role(["admin"])
async def create_company(...):
    pass
```

**Access Control Matrix:**

| Ressource | Admin | QA-Tester | Reviewer |
|-----------|-------|-----------|----------|
| Companies | CRUD  | Read      | Read     |
| Projects  | CRUD  | Read      | Read     |
| Test Cases| CRUD  | CRUD*     | Read     |
| Results   | CRUD  | CRUD*     | Read     |
| Users     | CRUD  | -         | -        |
| Settings  | CRUD  | Read      | Read     |

*Nur für zugewiesene Projekte

---

## 🚀 Deployment & DevOps

### Development Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python main.py

# Frontend  
cd frontend
npm install
npm start
```

### Production Deployment

#### Docker Setup
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8002
CMD ["python", "main.py"]
```

```dockerfile
# frontend/Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/qa_report
    depends_on:
      - db
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
      
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: qa_report
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name qa-report.yourdomain.com;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://backend:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket Support (falls benötigt)
    location /ws {
        proxy_pass http://backend:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### CI/CD Pipeline (GitHub Actions)
```yaml
name: QA Report App CI/CD
on:
  push:
    branches: [main]
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend  
          pytest
          
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t qa-report-backend ./backend
          docker build -t qa-report-frontend ./frontend
      - name: Deploy to production
        run: |
          # Deployment commands
          echo "Deploy to production server"
```

---

## ⚡ Performance & Skalierung

### Database Optimierung

**Query Optimierung:**
```python
# Efficient loading with joins
async def get_project_with_test_suites(project_id: int):
    query = """
        SELECT 
            p.id, p.name as project_name,
            ts.id as suite_id, ts.name as suite_name,
            tc.id as case_id, tc.name as case_name
        FROM projects p
        LEFT JOIN test_suites ts ON p.id = ts.project_id  
        LEFT JOIN test_cases tc ON ts.id = tc.test_suite_id
        WHERE p.id = :project_id
        ORDER BY ts.sort_order, tc.sort_order
    """
    return await database.fetch_all(query, {"project_id": project_id})
```

**Connection Pooling:**
```python
# database.py
from databases import Database
from sqlalchemy.pool import StaticPool

DATABASE_URL = "postgresql://user:pass@localhost/qa_report"
database = Database(
    DATABASE_URL,
    min_size=5,
    max_size=20,
    ssl=False
)
```

### Caching Strategy

**Redis Integration:**
```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expiry=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expiry, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(expiry=600)
async def get_user_projects(user_id: int):
    # Expensive query
    pass
```

### Frontend Performance

**Code Splitting:**
```typescript
// Lazy loading von Komponenten
import { lazy, Suspense } from 'react';

const TestSuiteManager = lazy(() => import('./TestSuiteManager'));
const ImportExportManager = lazy(() => import('./ImportExportManager'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {showTestSuite && <TestSuiteManager />}
      {showImportExport && <ImportExportManager />}
    </Suspense>
  );
}
```

**Virtualisierung für große Listen:**
```typescript
import { FixedSizeList as List } from 'react-window';

const TestCaseList = ({ testCases }: { testCases: TestCase[] }) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <TestCaseItem testCase={testCases[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={testCases.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Load Balancing

**Multiple Backend Instances:**
```yaml
# docker-compose.prod.yml
services:
  backend-1:
    build: ./backend
    environment:
      - INSTANCE_ID=1
  backend-2:
    build: ./backend  
    environment:
      - INSTANCE_ID=2
      
  nginx:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

**Nginx Load Balancer:**
```nginx
upstream backend_pool {
    server backend-1:8002 weight=1;
    server backend-2:8002 weight=1;
}

server {
    location /api {
        proxy_pass http://backend_pool;
    }
}
```

### Monitoring & Logging

**Application Metrics:**
```python
from prometheus_client import Counter, Histogram, generate_latest
import time

REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method, 
        endpoint=request.url.path
    ).inc()
    REQUEST_DURATION.observe(time.time() - start_time)
    
    return response

@app.get("/metrics")
async def get_metrics():
    return Response(generate_latest(), media_type="text/plain")
```

**Structured Logging:**
```python
import structlog
import logging

# Logging Configuration
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

logger = structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Usage
logger = structlog.get_logger()
logger.info("User login", user_id=123, ip="192.168.1.1")
```

---

**Dokumentation Version:** 1.0.0  
**Letzte Aktualisierung:** $(date)  
**Technologie-Stack:** FastAPI + React + PostgreSQL/SQLite