import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { isConfigured } from './firebase'
import App from './App.jsx'

function Main() {
  if (!isConfigured) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0c10',
        color: '#eef0f4',
        fontFamily: 'sans-serif'
      }}>
        <h2>Firebase Setup Required</h2>
        <p style={{ color: '#9aa0aa' }}>Please add your Firebase keys to the <code>.env</code> file.</p>
        <p style={{ fontSize: '0.9em', opacity: 0.7 }}>See the terminal output or readme for required keys.</p>
      </div>
    )
  }
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
