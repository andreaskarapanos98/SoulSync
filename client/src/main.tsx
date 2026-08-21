import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { configureNativeStatusBar } from './nativeStatusBar.ts'

configureNativeStatusBar()

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in client/.env')
}

// Keeps Clerk's own sign-in/sign-up modal (and any other Clerk-rendered UI) matching
// the rest of the app instead of Clerk's generic default look — same brand palette,
// rounded shape, and font as everywhere else, defined in index.css's @theme block.
const clerkAppearance = {
  variables: {
    colorPrimary: '#f43f5e', // --color-brand-500
    colorBackground: '#ffffff',
    colorText: '#171717',
    colorTextSecondary: '#737373',
    colorInputBackground: '#ffffff',
    colorInputText: '#171717',
    borderRadius: '0.75rem',
    fontFamily: "'Segoe UI', system-ui, Roboto, sans-serif",
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
