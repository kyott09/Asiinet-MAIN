# Frontend Application — React + Vite 🎨

Aplicación web moderna con React 19, Vite, TailwindCSS y gestión de estado con Zustand.

## 📦 Dependencias Principales

### Producción
- **react** (^19.2.6) - Librería UI
- **react-dom** (^19.2.6) - Renderizado en DOM
- **axios** (^1.17.0) - Cliente HTTP
- **react-router-dom** (^7.16.0) - Enrutamiento
- **zustand** (^5.0.14) - Estado global
- **yup** (^1.7.1) - Validación de formularios
- **tailwindcss** (^4.3.0) - Framework CSS

### Desarrollo
- **vite** (^8.0.12) - Bundler ultrarrápido
- **@vitejs/plugin-react** (^6.0.1) - Plugin React para Vite
- **eslint** (^10.3.0) - Linter
- **autoprefixer** (^10.5.0) - Prefijos CSS
- **postcss** (^8.5.15) - Procesador CSS

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
cd app-asiinet/asiinet
npm install
```

### 2. Crear archivo de configuración

Copiar `.env.example` a `.env.local` (si existe):

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Asiinet App
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

**URL**: `http://localhost:5173`

## 📂 Estructura Recomendada

```
src/
├── components/           # Componentes reutilizables
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Navigation.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Modal.jsx
│       └── Card.jsx
├── pages/               # Páginas/vistas
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
├── hooks/               # Custom hooks
│   ├── useAuth.js
│   ├── useApi.js
│   └── useForm.js
├── store/               # Estado global (Zustand)
│   ├── authStore.js
│   ├── userStore.js
│   └── appStore.js
├── services/            # Servicios API
│   ├── authService.js
│   ├── userService.js
│   └── apiClient.js
├── utils/               # Utilidades
│   ├── constants.js
│   ├── helpers.js
│   └── validators.js
├── styles/              # Estilos globales
│   ├── index.css
│   ├── tailwind.css
│   └── globals.css
├── App.jsx              # Componente raíz
├── main.jsx             # Punto de entrada
└── vite.config.js       # Configuración Vite
```

## 🎨 Convenciones de Código

### Naming Conventions

| Tipo | Ejemplo | Descripción |
|------|---------|-------------|
| Funciones | `getUserData()`, `handleSubmit()` | camelCase |
| Variables | `userName`, `isLoading`, `formData` | camelCase |
| Componentes | `UserCard`, `LoginForm`, `Modal` | PascalCase |
| Archivos componentes | `UserCard.jsx`, `LoginForm.jsx` | PascalCase.jsx |
| Hooks custom | `useAuth`, `useFetch`, `useForm` | useXxx (camelCase) |
| Clases CSS | `user-card`, `login-form`, `btn-primary` | kebab-case |
| Constantes | `MAX_ITEMS`, `API_BASE_URL` | UPPER_SNAKE_CASE |
| Booleanos | `isLoading`, `hasError`, `canSubmit` | isXxx / hasXxx / canXxx |

### Ejemplos Correctos

```jsx
// ✅ Componente
function UserCard({ user }) {
  const isActive = user.status === 'active';
  const handleClick = () => { };
  
  return (
    <div className="user-card">
      <p>{user.userName}</p>
    </div>
  );
}

// ✅ Hook Custom
function useUserData() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  return { userData, isLoading };
}

// ❌ Incorrecto
function user_card() { }  // snake_case en componentes
const User_Card = () => { };  // Mixed case
function useuser_data() { }  // snake_case en hooks
```

## 🔗 Integración con Backend

### Cliente HTTP (Axios)

```javascript
// src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Interceptor para token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Servicio de Autenticación

```javascript
// src/services/authService.js
import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};
```

## 📊 Estado Global con Zustand

```javascript
// src/store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('authToken', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
```

## 🎯 Rutas con React Router

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## ✅ Validación con Yup

```javascript
// src/utils/validators.js
import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('Contraseña requerida'),
});

export const registerSchema = yup.object().shape({
  name: yup.string().required('Nombre requerido'),
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('Contraseña requerida'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Las contraseñas deben coincidir'),
});
```

## 🎨 TailwindCSS

### Configuración

```javascript
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
      },
    },
  },
  plugins: [],
};
```

### Uso en Componentes

```jsx
function Button({ children, variant = 'primary' }) {
  const baseStyles = 'px-4 py-2 rounded font-semibold transition';
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </button>
  );
}
```

## 🧪 Testing

```bash
npm test
```

Estructura de tests sugerida:

```javascript
// src/__tests__/components/LoginForm.test.jsx
import { render, screen } from '@testing-library/react';
import LoginForm from '../../components/auth/LoginForm';

describe('LoginForm Component', () => {
  test('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor Vite
npm run build            # Build para producción
npm run preview          # Previsualiza el build

# Linting
npm run lint             # ESLint

# Testing
npm test                 # Ejecuta tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Cobertura de tests
```

## 🔒 Variables de Entorno Frontend

```env
# API
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000

# App
VITE_APP_NAME=Asiinet
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=false
VITE_DEBUG_MODE=false
```

## 🚀 Despliegue a Producción

### Build

```bash
npm run build
```

Crea carpeta `dist/` optimizada.

### Deploy en Vercel

```bash
npm install -g vercel
vercel
```

### Deploy en Netlify

```bash
npm run build
# Sube carpeta 'dist/' a Netlify
```

## 🚨 Troubleshooting

### Error: `Module not found`
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: `Cannot GET /`
```bash
# Problema con rutas, asegurar que vite.config.js tiene:
// Configurar historyApiFallback para SPA
```

### Error: `CORS error`
```bash
# Backend debe permitir localhost:5173
# En api-asiinet .env: ALLOWED_ORIGINS=http://localhost:5173
```

## 📚 Recursos Útiles

- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Axios Guide](https://axios-http.com/docs/intro)

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/nombre`
2. Commit: `git commit -m 'feat: descripción'`
3. Push: `git push origin feature/nombre`
4. Pull Request

---

**Última actualización**: 09 de Junio, 2026
