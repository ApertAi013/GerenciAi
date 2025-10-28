import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('main.tsx executado!');
console.log('root element:', document.getElementById('root'));

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Elemento root não encontrado!');
} else {
  console.log('Criando React root...');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('React renderizado!');
}
