import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { PromptsProvider } from './features/prompts/PromptsContext'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PromptsProvider>
      <App />
    </PromptsProvider>
  </StrictMode>,
)
