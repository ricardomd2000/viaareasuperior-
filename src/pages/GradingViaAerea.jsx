import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Download, FileImage, CheckCircle, ChevronRight, Check, X, AlertCircle } from 'lucide-react'

// Mapeo seguro en caso de diferencias de espacio en el JSON extraido (ej: "GRUPO 1 ")
const RUBRIC_KEY_MAP = {
  "GRUPO 1 ANATOMIA": "GRUPO 1 ",
  "GRUPO 2 ANATOMIA": "GRUPO 2",
  "GRUPO 3 ANATOMIA": "GRUPO 3 "
}

const GradingViaAerea = () => {
  const [indexData, setIndexData] = useState({})
  const [rubrics, setRubrics] = useState({})
  const [grades, setGrades] = useState({})
  
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedStudentName, setSelectedStudentName] = useState('')
  
  // Guardar puntuaciones locales temporalmente antes de "Guardar" global
  const [currentGrades, setCurrentGrades] = useState({})

  useEffect(() => {
    // Load from public folder with cache busting
    const ts = new Date().getTime();
    Promise.all([
      fetch(`/eval_index.json?t=${ts}`).then(res => res.json()).catch(() => ({})),
      fetch(`/rubrics.json?t=${ts}`).then(res => res.json()).catch(() => ({}))
    ]).then(([index, rubricsData]) => {
      setIndexData(index)
      setRubrics(rubricsData)
      if (Object.keys(index).length > 0) {
        setSelectedGroup(Object.keys(index)[0])
      }
    })

    // Load saved grades
    const savedGrades = localStorage.getItem('grades_via_aerea')
    if (savedGrades) {
      try {
        setGrades(JSON.parse(savedGrades))
      } catch(e) {}
    }
  }, [])

  // Auto-select first student when group changes
  useEffect(() => {
    if (selectedGroup && indexData[selectedGroup]?.length > 0) {
      setSelectedStudentName(indexData[selectedGroup][0])
      setCurrentGrades(grades[`${selectedGroup}_${indexData[selectedGroup][0]}`] || {})
    } else {
      setSelectedStudentName('')
      setCurrentGrades({})
    }
  }, [selectedGroup, indexData])

  useEffect(() => {
    if (selectedGroup && selectedStudentName) {
      setCurrentGrades(grades[`${selectedGroup}_${selectedStudentName}`] || {})
    }
  }, [selectedStudentName])

  const handleScoreChange = (criteriaIndex, score) => {
    setCurrentGrades(prev => ({
      ...prev,
      [criteriaIndex]: score
    }))
  }

  const saveGrades = () => {
    const key = `${selectedGroup}_${selectedStudentName}`
    const newGrades = { ...grades, [key]: currentGrades }
    setGrades(newGrades)
    localStorage.setItem('grades_via_aerea', JSON.stringify(newGrades))
  }

  const exportCSV = () => {
    if (Object.keys(grades).length === 0) {
      alert("No hay calificaciones para exportar.")
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Grupo,Archivo Estudiante,Puntaje Total\n"

    Object.entries(grades).forEach(([key, studentGrades]) => {
      const [group, ...nameParts] = key.split('_')
      const name = nameParts.join('_')
      
      let total = 0
      Object.values(studentGrades).forEach(val => { total += val })
      
      csvContent += `"${group}","${name}",${total}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "calificaciones_via_aerea.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeRubric = rubrics[RUBRIC_KEY_MAP[selectedGroup]] || []
  let currentTotalScore = 0
  Object.values(currentGrades).forEach(s => currentTotalScore += s)

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 h-screen flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/teacher" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Calificación de <span className="text-accent-primary">Vía Aérea Superior</span>
            </h1>
          </div>
        </div>
        
        <button onClick={exportCSV} className="btn-outline flex items-center gap-2">
          <Download size={18} /> Exportar CSV
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Groups & Students */}
        <div className="w-72 glass-panel p-4 flex flex-col gap-4 overflow-y-auto">
          <h3 className="font-bold text-sm text-text-secondary uppercase tracking-wider mb-2">Grupos</h3>
          <div className="flex flex-col gap-2">
            {Object.keys(indexData).map(group => (
              <button 
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedGroup === group 
                  ? 'border-accent-primary bg-accent-primary/20 text-accent-primary font-medium' 
                  : 'border-white/5 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          {selectedGroup && (
            <>
              <h3 className="font-bold text-sm text-text-secondary uppercase tracking-wider mt-4">Archivos ({indexData[selectedGroup]?.length || 0})</h3>
              <div className="flex flex-col gap-1 overflow-y-auto pr-2">
                {indexData[selectedGroup]?.map(file => {
                  const key = `${selectedGroup}_${file}`
                  const isGraded = grades[key] !== undefined
                  const isSelected = selectedStudentName === file
                  
                  return (
                    <button
                      key={file}
                      onClick={() => setSelectedStudentName(file)}
                      className={`text-left px-3 py-2 rounded-md text-sm truncate flex items-center justify-between transition-colors ${
                        isSelected 
                        ? 'bg-accent-primary/20 text-accent-primary' 
                        : 'hover:bg-white/5 text-slate-300'
                      }`}
                      title={file}
                    >
                      <span className="truncate">{file}</span>
                      {isGraded && <CheckCircle size={14} className="text-success flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Center: Image Viewer */}
        <div className="flex-1 glass-panel p-4 flex flex-col bg-slate-900 border-white/5">
          {selectedGroup && selectedStudentName ? (
            <>
               <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                  <h2 className="font-semibold">{selectedStudentName}</h2>
                  <a 
                    href={`/evaluaciones/${selectedGroup}/${selectedStudentName}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                  >
                    Abrir en pestaña nueva <ExternalLink size={12}/>
                  </a>
               </div>
               <div className="flex-1 overflow-hidden rounded-lg bg-black flex items-center justify-center border border-white/10 p-2">
                 {selectedStudentName.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={`/evaluaciones/${selectedGroup}/${selectedStudentName}`} 
                      className="w-full h-full rounded bg-white"
                      title={selectedStudentName}
                    />
                 ) : (
                    <img 
                      src={`/evaluaciones/${selectedGroup}/${selectedStudentName}`} 
                      alt={selectedStudentName}
                      className="w-full h-full object-contain"
                    />
                 )}
               </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary">
              <FileImage size={48} className="mb-4 opacity-50" />
              <p>Selecciona un archivo del lado izquierdo para visualizar.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Rubric Form */}
        <div className="w-[450px] glass-panel p-5 flex flex-col bg-[#0f1420] overflow-y-auto">
          <h2 className="text-xl font-bold mb-1 flex items-center justify-between">
            <span>Rúbrica de Evaluación</span>
            <span className="text-2xl font-mono text-accent-primary bg-accent-primary/10 px-3 py-1 rounded-lg">
              {currentTotalScore.toFixed(1)} <span className="text-sm text-text-secondary">/ 5</span>
            </span>
          </h2>
          <p className="text-sm text-text-secondary mb-6">{selectedGroup}</p>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {activeRubric.map((item, idx) => {
              const currentVal = currentGrades[idx]
              return (
                <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-800/40">
                  <h4 className="font-semibold text-accent-secondary mb-3">{item["Criterio de Evaluación"]}</h4>
                  
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${currentVal === 1 ? 'bg-success/20 border-success/50' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 1}
                        onChange={() => handleScoreChange(idx, 1)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-white mb-1 flex justify-between">
                          <span>Completo</span>
                          <span className="font-mono text-success">1.0</span>
                        </div>
                        <p className="text-xs text-text-secondary">{item["Completo (1 pto.)"]}</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${currentVal === 0.5 ? 'bg-warning/20 border-warning/50' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 0.5}
                        onChange={() => handleScoreChange(idx, 0.5)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-white mb-1 flex justify-between">
                          <span>Faltan elementos</span>
                          <span className="font-mono text-warning">0.5</span>
                        </div>
                        <p className="text-xs text-text-secondary">{item["Faltan elementos (0.5 ptos.)"]}</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${currentVal === 0 ? 'bg-error/20 border-error/50' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 0}
                        onChange={() => handleScoreChange(idx, 0)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-white mb-1 flex justify-between">
                          <span>Incompleto</span>
                          <span className="font-mono text-error">0.0</span>
                        </div>
                        <p className="text-xs text-text-secondary">{item["Incompleto (0 ptos.)"]}</p>
                      </div>
                    </label>
                  </div>
                </div>
              )
            })}

            {activeRubric.length === 0 && (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-xl mt-4">
                <AlertCircle className="mx-auto text-text-secondary mb-2" size={32}/>
                <p className="text-text-secondary text-sm">Selecciona un grupo válido para ver su rúbrica.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button 
              onClick={saveGrades}
              disabled={Object.keys(currentGrades).length < activeRubric.length}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              Guardar Calificación
            </button>
            {Object.keys(currentGrades).length < activeRubric.length && (
              <p className="text-center text-[10px] text-text-secondary mt-2">
                Debes calificar todos los criterios para guardar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Since ExternalLink isn't imported from lucide-react initially, define a functional mock directly
const ExternalLink = ({size}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;

export default GradingViaAerea
