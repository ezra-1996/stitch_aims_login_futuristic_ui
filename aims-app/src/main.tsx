import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <ToastProvider>
                <UserProvider>
                    <App />
                </UserProvider>
            </ToastProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
