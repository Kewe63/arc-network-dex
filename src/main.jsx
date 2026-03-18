import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import { PointsProvider } from './context/PointsContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <LangProvider>
                <PointsProvider>
                    <WalletProvider>
                        <App />
                    </WalletProvider>
                </PointsProvider>
            </LangProvider>
        </BrowserRouter>
    </React.StrictMode>
)
