# React + Vite Application 🚀

Aplicación web moderna basada en React 19 y Vite, optimizada para desarrollo rápido y construcción eficiente.

## 📋 Descripción

Esta es la interfaz de usuario del proyecto Asiinet. Utiliza:
- **React 19** para componentes interactivos
- **Vite** para un desarrollo ultrarrápido con HMR (Hot Module Replacement)
- **ESLint** para mantener código limpio y consistente
- **TailwindCSS** para estilos modernos
- **React Router** para navegación entre páginas

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### Build Producción

```bash
npm run build
npm run preview  # Ver build localmente
```

## 📦 Dependencias

### Runtime
- **react** - Librería UI
- **react-dom** - Renderizado React en navegador

### Dev Tools
- **vite** - Build tool y dev server
- **@vitejs/plugin-react** - Soporte React en Vite
- **eslint** - Linter de código
- **autoprefixer** - Prefijos CSS automáticos
- **postcss** - Procesador CSS
- **tailwindcss** - Framework CSS utilitario

## 🏗️ Estructura

```
src/
├── assets/          # Imágenes, iconos, fuentes
├── components/      # Componentes reutilizables
├── pages/          # Páginas/vistas principales
├── styles/         # Estilos globales
├── App.jsx         # Componente raíz
├── main.jsx        # Punto de entrada
└── index.css       # Estilos globales
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo con HMR
npm run dev

# Build optimizado
npm run build

# Previsualizar build localmente
npm run preview

# Ejecutar ESLint
npm run lint
```

## 🎨 HMR (Hot Module Replacement)

Los cambios en el código se reflejan automáticamente en el navegador sin necesidad de recargar.

```javascript
// Edita este archivo y guarda para ver los cambios al instante
// src/App.jsx
```

## 🔗 Conectar con Backend

Ver instrucciones en [../README.md](../README.md) para integración con API.

### Configuración de Proxy

Puedes configurar en `vite.config.js` para proxear requests:

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
}
```

## 📝 Configuración ESLint

Revisa `eslint.config.js` para personalizar reglas de linting.

Para modo TypeScript con type-aware rules, consulta [TypeScript ESLint](https://typescript-eslint.io).

## 🚀 Performance

- **Vite** proporciona builds ultrarrápidos
- **React 19** incluye optimizaciones automáticas
- Los assets son optimizados automáticamente en el build

## 🎯 React 19 Features

Esta aplicación aprovecha las características de React 19:
- `use()` hook para trabajar con Promises
- Actions mejoradas
- Componentes Server (en el futuro)

## 🔌 Plugins Disponibles

Vite ofrece dos plugins React populares:

1. **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)** - Usa Oxc (más rápido)
2. **[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc)** - Usa SWC (alternativa)

Actualmente se usa **@vitejs/plugin-react** por defecto.

## 📚 Recursos

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Vite Config Reference](https://vitejs.dev/config/)
- [Creating a Vite App](https://vitejs.dev/guide/)

## 📄 Licencia

ISC

---

**Última actualización**: 09 de Junio, 2026
