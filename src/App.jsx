import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import ImageIdentification from './pages/ImageIdentification'
import ClinicalCases from './pages/ClinicalCases'
import TeacherDashboard from './pages/TeacherDashboard'

const ProtectedRoute = ({ children, role }) => {
  const { user, studentSession, isTeacher, role: userRole, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c10] text-white">
      <div className="animate-pulse">Cargando aplicación...</div>
    </div>
  )
  
  // Grant access if there is a Supabase user or a student session
  const hasSession = user || studentSession
  
  if (!hasSession) return <Navigate to="/login" />
  
  // Specific role check (e.g., for teacher dashboard)
  if (role && userRole !== role) return <Navigate to="/dashboard" />
  
  return children
}

const AppRoutes = () => {
  const { user, studentSession } = useAuth()
  const isAuthenticated = user || studentSession

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/quiz" element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        } />

        <Route path="/identificacion" element={
          <ProtectedRoute>
            <ImageIdentification />
          </ProtectedRoute>
        } />

        <Route path="/casos" element={
          <ProtectedRoute>
            <ClinicalCases />
          </ProtectedRoute>
        } />

        <Route path="/teacher" element={
          <ProtectedRoute role="docente">
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
