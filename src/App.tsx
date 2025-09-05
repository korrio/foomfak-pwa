import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DemoProvider } from './contexts/DemoContext'
import HomePage from './pages/HomePage'
import DemoPage from './pages/DemoPage'
import PublicJournalPage from './pages/PublicJournalPage'
import './App.css'

function App() {
  return (
    <DemoProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/journal/:userId" element={<PublicJournalPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </DemoProvider>
  )
}

export default App