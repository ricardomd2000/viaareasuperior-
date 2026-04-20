import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Download, FileImage, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

// Mapeo seguro en caso de diferencias de espacio en el JSON extraido
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
  
  // Guardar puntuaciones locales temporalmente antes de "Guardar" global
  const [currentGrades, setCurrentGrades] = useState({})

  useEffect(() => {
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

    const savedGrades = localStorage.getItem('grades_via_aerea')
    if (savedGrades) {
      try {
        setGrades(JSON.parse(savedGrades))
      } catch(e) {}
    }
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      setCurrentGrades(grades[selectedGroup] || {})
    } else {
      setCurrentGrades({})
    }
  }, [selectedGroup, grades])

  const handleScoreChange = (criteriaIndex, score) => {
    setCurrentGrades(prev => ({
      ...prev,
      [criteriaIndex]: score
    }))
  }

  const saveGrades = () => {
    if (!selectedGroup) return
    const newGrades = { ...grades, [selectedGroup]: currentGrades }
    setGrades(newGrades)
    localStorage.setItem('grades_via_aerea', JSON.stringify(newGrades))
  }

  const exportCSV = () => {
    if (Object.keys(grades).length === 0) {
      alert("No hay calificaciones para exportar.")
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Grupo,Puntaje Total\n"

    Object.entries(grades).forEach(([group, groupGrades]) => {
      let total = 0
      Object.values(groupGrades).forEach(val => { total += val })
      csvContent += `"${group}",${total}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "calificaciones_via_aerea_grupos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeRubric = rubrics[RUBRIC_KEY_MAP[selectedGroup]] || []
  let currentTotalScore = 0
  Object.values(currentGrades).forEach(s => currentTotalScore += s)

  return (
    <div className="max-w-[1500px] mx-auto py-8 px-4 h-screen flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/teacher" className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/10">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              Calificación de <span className="text-accent-primary">Vía Aérea</span>
            </h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Evaluación global por equipo de trabajo</p>
          </div>
        </div>
        
        <button onClick={exportCSV} className="btn-outline flex items-center gap-2 hover:bg-white/10 transition-colors">
          <Download size={18} /> Exportar CSV
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Groups */}
        <div className="w-72 glass-panel p-5 flex flex-col gap-4 overflow-y-auto border border-white/10">
          <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
            Equipos a Evaluar
          </h3>
          <div className="flex flex-col gap-3">
            {Object.keys(indexData).map(group => {
              const isGraded = grades[group] !== undefined
              return (
                <button 
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between group ${
                    selectedGroup === group 
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)]' 
                    : 'border-white/5 bg-slate-800/50 text-text-secondary hover:bg-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="font-bold">{group}</span>
                  {isGraded && <CheckCircle size={18} className="text-success shadow-lg rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Image Gallery (Multiple images per page) */}
        <div className="flex-1 glass-panel p-6 flex flex-col bg-slate-900 border-white/10 overflow-y-auto relative">
          {selectedGroup && indexData[selectedGroup] ? (
            <div className="animate-fade-in space-y-6">
               <div className="flex justify-between items-end pb-4 border-b border-white/10 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedGroup}</h2>
                    <p className="text-text-secondary text-sm">Mostrando todas las imágenes del equipo ({indexData[selectedGroup].length} archivos)</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
                 {indexData[selectedGroup].map((file) => (
                   <div key={file} className="bg-black rounded-xl overflow-hidden border border-white/10 flex flex-col h-[500px] shadow-2xl hover:border-white/30 transition-colors group">
                     <div className="p-3 bg-slate-800/80 text-xs text-text-secondary flex justify-between items-center backdrop-blur-sm border-b border-white/5">
                       <span className="font-mono truncate mr-4 text-slate-300">{file}</span>
                       <a 
                         href={`/evaluaciones/${selectedGroup}/${file}`} 
                         target="_blank" 
                         rel="noreferrer"
                         className="text-accent-primary hover:bg-accent-primary/10 p-1.5 rounded-md flex items-center gap-1 transition-colors flex-shrink-0"
                         title="Abrir en pestaña nueva"
                       >
                         Ver Grande <ExternalLink size={14}/>
                       </a>
                     </div>
                     <div className="flex-1 overflow-hidden p-2 flex items-center justify-center bg-[#0a0c10]">
                       {file.toLowerCase().endsWith('.pdf') ? (
                          <iframe 
                            src={`/evaluaciones/${selectedGroup}/${file}`} 
                            className="w-full h-full bg-white rounded-lg border border-white/5"
                            title={file}
                          />
                       ) : (
                          <img 
                            src={`/evaluaciones/${selectedGroup}/${file}`} 
                            alt={file}
                            className="w-full h-full object-contain drop-shadow-2xl"
                          />
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary">
              <FileImage size={64} className="mb-4 opacity-30 text-accent-primary" />
              <p className="text-lg">Selecciona un equipo para ver su trabajo.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Improved Rubric Form */}
        <div className="w-[450px] glass-panel flex flex-col bg-slate-900 overflow-hidden border-white/10 relative shadow-2xl">
          <div className="p-6 pb-4 border-b border-white/10 bg-slate-800/50">
            <h2 className="text-lg font-black text-white flex items-center justify-between mb-2">
              <span>Evaluación del Equipo</span>
            </h2>
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
               <span className="text-text-secondary font-medium">Calificación Total</span>
               <span className="text-3xl font-mono font-black text-accent-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                 {currentTotalScore.toFixed(1)} <span className="text-sm text-text-secondary font-sans font-normal">/ 5.0</span>
               </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {activeRubric.map((item, idx) => {
              const currentVal = currentGrades[idx]
              return (
                <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/60 transition-colors shadow-lg">
                  <h4 className="font-bold text-accent-secondary mb-4 text-base leading-tight">{item["Criterio de Evaluación"]}</h4>
                  
                  <div className="space-y-3">
                    <label className={`flex items-stretch gap-4 p-4 rounded-xl cursor-pointer border transition-all ${currentVal === 1 ? 'bg-success/10 border-success shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 1}
                        onChange={() => handleScoreChange(idx, 1)}
                        className="mt-1 flex-shrink-0 appearance-none w-5 h-5 border-2 border-white/20 rounded-full checked:bg-success checked:border-transparent checked:ring-2 checked:ring-success/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                      />
                      <div className="flex-1 -mt-0.5">
                        <div className="font-bold text-white mb-1 flex justify-between items-center">
                          <span className={currentVal === 1 ? 'text-success' : ''}>Completo</span>
                          <span className={`font-mono px-2 py-0.5 rounded text-xs ${currentVal === 1 ? 'bg-success/20 text-success' : 'bg-white/10 text-text-secondary'}`}>1.0 pts</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${currentVal === 1 ? 'text-success/80' : 'text-text-secondary'}`}>{item["Completo (1 pto.)"]}</p>
                      </div>
                    </label>

                    <label className={`flex items-stretch gap-4 p-4 rounded-xl cursor-pointer border transition-all ${currentVal === 0.5 ? 'bg-warning/10 border-warning shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 0.5}
                        onChange={() => handleScoreChange(idx, 0.5)}
                        className="mt-1 flex-shrink-0 appearance-none w-5 h-5 border-2 border-white/20 rounded-full checked:bg-warning checked:border-transparent checked:ring-2 checked:ring-warning/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                      />
                      <div className="flex-1 -mt-0.5">
                        <div className="font-bold text-white mb-1 flex justify-between items-center">
                          <span className={currentVal === 0.5 ? 'text-warning' : ''}>Incompleto</span>
                          <span className={`font-mono px-2 py-0.5 rounded text-xs ${currentVal === 0.5 ? 'bg-warning/20 text-warning' : 'bg-white/10 text-text-secondary'}`}>0.5 pts</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${currentVal === 0.5 ? 'text-warning/80' : 'text-text-secondary'}`}>{item["Faltan elementos (0.5 ptos.)"]}</p>
                      </div>
                    </label>

                    <label className={`flex items-stretch gap-4 p-4 rounded-xl cursor-pointer border transition-all ${currentVal === 0 ? 'bg-error/10 border-error shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                      <input 
                        type="radio" 
                        name={`crit-${idx}`} 
                        checked={currentVal === 0}
                        onChange={() => handleScoreChange(idx, 0)}
                        className="mt-1 flex-shrink-0 appearance-none w-5 h-5 border-2 border-white/20 rounded-full checked:bg-error checked:border-transparent checked:ring-2 checked:ring-error/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                      />
                      <div className="flex-1 -mt-0.5">
                        <div className="font-bold text-white mb-1 flex justify-between items-center">
                          <span className={currentVal === 0 ? 'text-error' : ''}>No cumple</span>
                          <span className={`font-mono px-2 py-0.5 rounded text-xs ${currentVal === 0 ? 'bg-error/20 text-error' : 'bg-white/10 text-text-secondary'}`}>0.0 pts</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${currentVal === 0 ? 'text-error/80' : 'text-text-secondary'}`}>{item["Incompleto (0 ptos.)"]}</p>
                      </div>
                    </label>
                  </div>
                </div>
              )
            })}

            {activeRubric.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-2xl mt-4 bg-black/20">
                <AlertCircle className="mx-auto text-text-secondary mb-3 opacity-50" size={48}/>
                <h3 className="text-white font-bold mb-1">Sin Rúbrica</h3>
                <p className="text-text-secondary text-sm">Asegúrate de tener un equipo seleccionado válido.</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-900 border-t border-white/10 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <button 
              onClick={saveGrades}
              disabled={Object.keys(currentGrades).length < activeRubric.length || activeRubric.length === 0}
              className="w-full btn-primary py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.02] transition-transform shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
            >
              <Save size={24} />
              Guardar Nota del Equipo
            </button>
            {Object.keys(currentGrades).length < activeRubric.length && activeRubric.length > 0 && (
              <p className="text-center text-xs text-warning mt-3 flex items-center justify-center gap-1 font-medium bg-warning/10 py-2 rounded-lg">
                <AlertCircle size={14}/> Faltan {activeRubric.length - Object.keys(currentGrades).length} criterios por evaluar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradingViaAerea
