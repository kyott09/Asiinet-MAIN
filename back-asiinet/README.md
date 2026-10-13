# Backend API — Node.js + Express 🚀

Servidor REST robusto con autenticación JWT, validación de esquemas y ORM integrado.

## 📦 Dependencias Principales

### Producción
- **express** (^5.2.1) - Framework web
- **@prisma/client** (^7.8.0) - ORM para base de datos
- **jsonwebtoken** (^9.0.3) - Manejo de autenticación JWT
- **cors** (^2.8.6) - Control de CORS
- **zod** (^4.4.3) - Validación de esquemas
- **dotenv** (^17.4.2) - Variables de entorno

### Desarrollo
- **nodemon** (^3.1.14) - Recarga automática
- **prisma** (^7.8.0) - CLI de Prisma

## 🚀 Instalación Rápida

### 1. Configurar variables de entorno

```bash
cp .env_example .env
```

Editar `.env` con tus valores:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/asiinet_db
DB_NAME=asiinet_db

# Servidor
PORT=5000
NODE_ENV=development

# Autenticación
JWT_SECRET=tu_secreto_ultra_seguro_minimo_32_caracteres_xyzabc
JWT_EXPIRES_IN=24h

# CORS
CLIENT_URL=http://localhost:5173
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos con Prisma

```bash
# Crear migraciones
npx prisma migrate dev --name init

# Ver datos en Prisma Studio
npx prisma studio
```

### 4. Iniciar servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

**El servidor estará disponible en**: `http://localhost:5000`

## 📂 Estructura del Proyecto

```
api-asiinet/
├── src/
│   ├── routes/              # Rutas/endpoints
│   ├── controllers/         # Lógica de negocio
│   ├── middleware/          # Middleware (auth, validation)
│   ├── models/              # Modelos de datos
│   ├── services/            # Servicios reutilizables
│   ├── utils/               # Utilidades
│   ├── config/              # Configuración
│   └── index.js             # Punto de entrada
├── prisma/
│   └── schema.prisma        # Esquema de BD
├── .env_example             # Variables de ejemplo
├── package.json
└── README.md
```

## 🔌 Endpoints de Ejemplo

### Autenticación

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contrasena123",
  "name": "Juan Pérez"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contrasena123"
}
```

### Rutas Protegidas

```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🛡️ Convenciones de Código

### Naming Conventions

| Tipo | Ejemplo | Descripción |
|------|---------|-------------|
| Variables | `userId`, `userName` | camelCase |
| Funciones | `getUserById()`, `createUser()` | camelCase |
| Clases/Modelos | `UserModel`, `AuthService` | PascalCase |
| Constantes | `MAX_RETRIES`, `API_TIMEOUT` | UPPER_SNAKE_CASE |
| Rutas | `/api/getUser`, `/api/createPost` | camelCase |
| Env Variables | `JWT_SECRET`, `DATABASE_URL` | UPPER_SNAKE_CASE |

### Ejemplos de Estructura

```javascript
// ✅ Correcto
const userId = 123;
function getUserById(id) { }
class UserModel { }
const JWT_SECRET = process.env.JWT_SECRET;
router.get('/api/getUser/:id');

// ❌ Incorrecto
const user_id = 123;  // snake_case en variables
function get_user_by_id() { }  // snake_case en funciones
class userModel { }  // minúsculas en clases
```

## 🔐 Seguridad

### Autenticación JWT

```javascript
// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Validación con Zod

```javascript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

// En ruta
router.post('/api/users', (req, res) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten() });
  }
  // Procesar datos validados
});
```

## 📊 Prisma ORM

### Definir Modelos

```prisma
// prisma/schema.prisma
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id      Int     @id @default(autoincrement())
  title   String
  content String
  author  User    @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### Operaciones CRUD

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear
await prisma.user.create({
  data: { email: 'user@example.com', name: 'Juan', password: 'hash' }
});

// Leer
await prisma.user.findUnique({ where: { email: 'user@example.com' } });
await prisma.user.findMany({ include: { posts: true } });

// Actualizar
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Nuevo Nombre' }
});

// Eliminar
await prisma.user.delete({ where: { id: 1 } });
```

## 🧪 Testing

```bash
npm test
```

Estructura sugerida de tests:

```javascript
// src/__tests__/auth.test.js
describe('Auth Controller', () => {
  test('should register a new user', async () => {
    // Test code
  });
  
  test('should login with valid credentials', async () => {
    // Test code
  });
});
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia con nodemon

# Producción
npm start                # Inicia servidor

# Prisma
npx prisma migrate dev   # Crear migración
npx prisma studio       # Ver BD en UI
npx prisma seed         # Ejecutar seed

# Lint
npm run lint             # ESLint
```

## 🔗 Variables de Entorno Completas

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de Datos PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/asiinet_db
DB_NAME=asiinet_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password

# Autenticación JWT
JWT_SECRET=tu_secreto_super_seguro_con_minimo_32_caracteres
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=tu_secreto_para_refresh_tokens
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://tudominio.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_app

# Otras
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
```

## 🚨 Troubleshooting

### Error: `EADDRINUSE: address already in use`
```bash
# Puerto ya está en uso, cambiar en .env o liberar puerto
lsof -i :5000  # Ver qué proceso usa el puerto
kill -9 <PID>  # Matar el proceso
```

### Error: `Database connection failed`
```bash
# Verificar DATABASE_URL en .env
# Asegurar que PostgreSQL está corriendo
# Verificar credenciales
```

### Error: `Invalid token` (JWT)
```bash
# Verificar que JWT_SECRET es igual en .env
# Verificar que el token no ha expirado
# Verificar formato del header: Authorization: Bearer <token>
```

## 📚 Recursos Útiles

- [Express Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [Zod Validation](https://zod.dev/)

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/nombre`
2. Commit: `git commit -m 'feat: descripción'`
3. Push: `git push origin feature/nombre`
4. Pull Request

---

**Última actualización**: 09 de Junio, 2026
