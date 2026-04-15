import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Activity, ShieldCheck, GraduationCap, ChevronRight, AlertCircle, Sparkles, User } from 'lucide-react'

const Login = () => {
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentGroup, setStudentGroup] = useState('')
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { loginAsStudent, loginTeacher } = useAuth()
  const navigate = useNavigate()

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    if (!studentGroup) {
      setError('Por favor ingresa tu grupo.')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const nameToUse = studentName || `Estudiante-${Math.random().toString(36).substring(7)}`
      await loginAsStudent(studentGroup, nameToUse)
      navigate('/dashboard')
    } catch (err) {
      console.error("Error en login estudiante:", err)
      setError('Error al iniciar sesión. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPrueba = async () => {
    setLoading(true)
    setError(null)
    try {
      await loginAsStudent('Prueba', 'Invitado-Prueba')
      navigate('/dashboard')
    } catch (err) {
      setError('Error al iniciar modo prueba.')
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (loginError) throw loginError
      navigate('/teacher')
    } catch (err) {
      setError('Credenciales de docente inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-accent-primary to-blue-600 mb-4 shadow-lg shadow-accent-primary/20">
            <Activity className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Médica<span className="text-accent-primary">Base</span>
          </h1>
          <p className="text-text-secondary font-medium italic">Radiología de Tórax / Mediastino</p>
        </div>

        {/* Mode Toggler */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl mb-8 border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => { setIsTeacherMode(false); setError(null); }}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${!isTeacherMode ? 'bg-accent-primary text-slate-900 font-bold shadow-lg' : 'text-text-secondary hover:bg-white/5'}`}
          >
            <GraduationCap size={18} /> Estudiante
          </button>
          <button 
            onClick={() => { setIsTeacherMode(true); setError(null); }}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${isTeacherMode ? 'bg-slate-700 text-white font-bold' : 'text-text-secondary hover:bg-white/5'}`}
          >
            <ShieldCheck size={18} /> Docente
          </button>
        </div>

        <div className="glass-panel p-8 shadow-2xl relative overflow-hidden border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isTeacherMode ? (
            <form onSubmit={handleStudentLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tu Nombre (Opcional)"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Grupo (Ej: A1, B2...)"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-lg font-bold uppercase focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all placeholder:font-normal placeholder:text-sm"
                    value={studentGroup}
                    onChange={(e) => setStudentGroup(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group"
                >
                  {loading ? 'Iniciando...' : 'EMPEZAR EVALUACIÓN'}
                  {!loading && <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                </button>
              </div>

              <p className="text-center text-xs text-text-secondary mt-6">
                Acceso por grupo. Los resultados se guardarán automáticamente.
              </p>
            </form>
          ) : (
            <form onSubmit={handleTeacherLogin} className="space-y-6">
              <div className="space-y-4">
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo institucional"
                />
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                disabled={loading}
              >
                {loading ? 'Accediendo...' : 'Ingresar al Panel'}
                {!loading && <ShieldCheck size={20} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
