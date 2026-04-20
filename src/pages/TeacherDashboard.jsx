import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ClipboardCheck, ShieldAlert, Activity } from 'lucide-react'

const TeacherDashboard = () => {
  const { isTeacher, loading } = useAuth()

  if (loading) return <div className="p-20 text-center">Cargando dashboard...</div>
  
  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert size={64} className="text-error mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-text-secondary">Este panel está reservado para el personal docente autorizado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Activity className="text-accent-primary" size={40} />
          Panel <span className="text-accent-primary">Docente</span>
        </h1>
        <p className="text-text-secondary mt-3 text-lg">Módulos de evaluación y calificación de estudiantes.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <Link 
          to="/grading-via-aerea" 
          className="glass-panel p-10 text-center hover:bg-white/5 transition-all duration-300 group flex flex-col items-center justify-center border border-white/10 hover:border-accent-primary hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)] rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <ClipboardCheck size={32} className="text-accent-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Vía Aérea Superior</h2>
          <p className="text-text-secondary">
            Evaluar imágenes y PDFs de estudiantes basados en rúbricas por grupo.
          </p>
        </Link>
        
        {/* Espacio para futuros módulos */}
        <div className="glass-panel p-10 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl opacity-50">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
             <span className="text-text-secondary font-bold text-xl">?</span>
           </div>
           <h2 className="text-xl font-bold text-text-secondary mb-3">Próximo Módulo</h2>
           <p className="text-text-secondary text-sm">
             Más herramientas de calificación próximamente.
           </p>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
