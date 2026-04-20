import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Download, FileImage, CheckCircle, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

// Mapeo dinámico para extraer la rúbrica correcta ignorando espacios extras
const getRubricForGroup = (groupName, rubrics) => {
  if (!groupName || Object.keys(rubrics).length === 0) return [];
  if (groupName.includes("1")) return rubrics["GRUPO 1 "] || rubrics["GRUPO 1"] || Object.values(rubrics)[0] || [];
  if (groupName.includes("2")) return rubrics["GRUPO 2"] || rubrics["GRUPO 2 "] || Object.values(rubrics)[1] || [];
  if (groupName.includes("3")) return rubrics["GRUPO 3 "] || rubrics["GRUPO 3"] || Object.values(rubrics)[2] || [];
  return [];
}

const GradingViaAerea = () => {
  const [indexData, setIndexData] = useState({})
  const [rubrics, setRubrics] = useState({})
  const [grades, setGrades] = useState({})
  
  const [selectedGroup, setSelectedGroup] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  
  // Guardar puntuaciones locales temporalmente antes de "Guardar" global
  const [currentGrades, setCurrentGrades] = useState({})

  useEffect(() => {
    // Eliminado el timestamp (?t=xxx) para evitar errores de red o CORS en servidores estáticos locales
    Promise.all([
      fetch('/eval_index.json').then(res => res.json()).catch(() => ({})),
      fetch('/rubrics.json').then(res => res.json()).catch(() => ({}))
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
      setCurrentPage(0) // Reiniciar paginación al cambiar de grupo
    } else {
      setCurrentGrades({})
      setCurrentPage(0)
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

  const activeRubric = getRubricForGroup(selectedGroup, rubrics)
  let currentTotalScore = 0
  Object.values(currentGrades).forEach(s => currentTotalScore += s)

  // Lógica de Paginación (2 imágenes por página)
  const groupFiles = indexData[selectedGroup] || []
  const itemsPerPage = 2
  const totalPages = Math.ceil(groupFiles.length / itemsPerPage)
  
  const currentImages = groupFiles.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1)
  }

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1)
  }

  return (
    <div className="max-w-[1600px] mx-auto py-6 px-4 h-screen flex flex-col">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/teacher" className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/10">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-3">
              Calificación de <span className="text-accent-primary">Vía Aérea</span>
            </h1>
          </div>
        </div>
        
        <button onClick={exportCSV} className="btn-outline flex items-center gap-2 hover:bg-white/10 transition-colors py-2">
          <Download size={18} /> Exportar Notas
        </button>
      </header>

      <div className="flex gap-4 flex-1 min-h-0">
        
        {/* Left Sidebar: Groups */}
        <div className="w-64 glass-panel p-4 flex flex-col gap-3 overflow-y-auto border border-white/10 flex-shrink-0">
          <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
            Equipos
          </h3>
          <div className="flex flex-col gap-2">
            {Object.keys(indexData).map(group => {
              const isGraded = grades[group] !== undefined
              return (
                <button 
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between group ${
                    selectedGroup === group 
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]' 
                    : 'border-white/5 bg-slate-800/50 text-text-secondary hover:bg-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-sm tracking-tight">{group}</span>
                  {isGraded && <CheckCircle size={16} className="text-success shadow-lg rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Area: Split Top (Images) and Bottom (Rubric) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Top: Image Viewer Pagination (2 items max) */}
          <div className="glass-panel p-4 flex flex-col bg-slate-900 border-white/10 flex-[1.2] shadow-2xl min-h-[400px]">
            {selectedGroup && groupFiles.length > 0 ? (
              <div className="flex flex-col h-full">
                 <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-4">
                    <div>
                      <h2 className="text-xl font-black text-white">{selectedGroup}</h2>
                      <p className="text-text-secondary text-xs">{groupFiles.length} imágenes enviadas</p>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                        <button 
                          onClick={prevPage} 
                          disabled={currentPage === 0}
                          className="text-white hover:text-accent-primary disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1"
                        >
                          <ChevronLeft size={28} />
                        </button>
                        <span className="font-mono text-sm font-bold w-20 text-center">
                          Pág {currentPage + 1} / {totalPages}
                        </span>
                        <button 
                          onClick={nextPage} 
                          disabled={currentPage === totalPages - 1}
                          className="text-white hover:text-accent-primary disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1"
                        >
                          <ChevronRight size={28} />
                        </button>
                      </div>
                    )}
                 </div>
                 
                 <div className="flex-1 min-h-0 flex items-stretch gap-4 justify-center">
                   {currentImages.map((file) => (
                     <div key={file} className={`bg-[#050505] rounded-xl overflow-hidden border border-white/10 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex-1 max-w-[50%]`}>
                       <div className="p-2 bg-slate-800/90 text-xs text-text-secondary flex justify-between items-center z-10 border-b border-white/5 flex-shrink-0">
                         <span className="font-mono truncate mr-2 text-slate-300 overflow-hidden" title={file}>{file}</span>
                         <a 
                           href={`/evaluaciones/${selectedGroup}/${file}`} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-accent-primary hover:bg-accent-primary/10 px-2 py-1 rounded flex items-center gap-1 transition-colors flex-shrink-0 bg-black/40 border border-white/5"
                           title="Abrir en tamaño completo"
                         >
                           Expandir
                         </a>
                       </div>
                       <div className="flex-1 overflow-hidden relative flex items-center justify-center p-2">
                         {file.toLowerCase().endsWith('.pdf') ? (
                            <iframe 
                              src={`/evaluaciones/${selectedGroup}/${file}`} 
                              className="w-full h-full bg-white rounded-md"
                              title={file}
                            />
                         ) : (
                            <img 
                              src={`/evaluaciones/${selectedGroup}/${file}`} 
                              alt={file}
                              className="w-full h-full object-contain drop-shadow-xl"
                            />
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <FileImage size={48} className="mb-4 opacity-30 text-accent-primary" />
                <p>Selecciona un equipo para ver su trabajo.</p>
              </div>
            )}
          </div>

          {/* Bottom: Horizontal Rubric */}
          <div className="glass-panel flex flex-col bg-slate-900 overflow-hidden border-white/10 flex-[0.8] shadow-2xl">
            {activeRubric.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-white/10 bg-slate-800/50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-black text-white px-2">Rúbrica de Evaluación</h2>
                  
                  <div className="flex items-center gap-4">
                    {Object.keys(currentGrades).length < activeRubric.length && (
                      <p className="text-xs text-warning flex items-center gap-1 font-medium bg-warning/10 px-3 py-1.5 rounded-lg border border-warning/20">
                        <AlertCircle size={14}/> Faltan {activeRubric.length - Object.keys(currentGrades).length} criterios
                      </p>
                    )}
                    <div className="flex items-center gap-3 pr-2">
                      <div className="text-right">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Nota Total</div>
                        <div className="text-2xl font-mono font-black text-accent-primary leading-none mt-0.5">
                          {currentTotalScore.toFixed(1)} <span className="text-xs text-text-secondary font-sans font-normal">/ 5.0</span>
                        </div>
                      </div>
                      <button 
                        onClick={saveGrades}
                        disabled={Object.keys(currentGrades).length < activeRubric.length}
                        className="btn-primary py-2 px-6 rounded-lg font-black text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                      >
                        <Save size={18} />
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRubric.map((item, idx) => {
                      const currentVal = currentGrades[idx]
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/60 transition-colors flex flex-col shadow-sm">
                          <h4 className="font-bold text-accent-secondary mb-3 text-sm leading-tight border-b border-white/5 pb-2">{item["Criterio de Evaluación"]}</h4>
                          
                          <div className="space-y-2 flex-1 flex flex-col justify-end">
                            <label className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${currentVal === 1 ? 'bg-success/10 border-success/50 shadow-[0_0_10px_-2px_rgba(34,197,94,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <input 
                                type="radio" 
                                name={`crit-${idx}`} 
                                checked={currentVal === 1}
                                onChange={() => handleScoreChange(idx, 1)}
                                className="mt-0.5 flex-shrink-0 appearance-none w-4 h-4 border border-white/20 rounded-full checked:bg-success checked:border-transparent checked:ring-1 checked:ring-success/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                              />
                              <div className="flex-1 leading-none pt-0.5">
                                <div className="font-bold text-white mb-1 flex justify-between items-center text-xs">
                                  <span className={currentVal === 1 ? 'text-success' : ''}>Completo</span>
                                  <span className="font-mono font-black text-white/50">1.0</span>
                                </div>
                                <p className={`text-[10px] leading-snug line-clamp-2 ${currentVal === 1 ? 'text-success/80' : 'text-text-secondary'}`} title={item["Completo (1 pto.)"]}>{item["Completo (1 pto.)"]}</p>
                              </div>
                            </label>

                            <label className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${currentVal === 0.5 ? 'bg-warning/10 border-warning/50 shadow-[0_0_10px_-2px_rgba(234,179,8,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <input 
                                type="radio" 
                                name={`crit-${idx}`} 
                                checked={currentVal === 0.5}
                                onChange={() => handleScoreChange(idx, 0.5)}
                                className="mt-0.5 flex-shrink-0 appearance-none w-4 h-4 border border-white/20 rounded-full checked:bg-warning checked:border-transparent checked:ring-1 checked:ring-warning/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                              />
                              <div className="flex-1 leading-none pt-0.5">
                                <div className="font-bold text-white mb-1 flex justify-between items-center text-xs">
                                  <span className={currentVal === 0.5 ? 'text-warning' : ''}>Incompleto</span>
                                  <span className="font-mono font-black text-white/50">0.5</span>
                                </div>
                                <p className={`text-[10px] leading-snug line-clamp-2 ${currentVal === 0.5 ? 'text-warning/80' : 'text-text-secondary'}`} title={item["Faltan elementos (0.5 ptos.)"]}>{item["Faltan elementos (0.5 ptos.)"]}</p>
                              </div>
                            </label>

                            <label className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${currentVal === 0 ? 'bg-error/10 border-error/50 shadow-[0_0_10px_-2px_rgba(239,68,68,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <input 
                                type="radio" 
                                name={`crit-${idx}`} 
                                checked={currentVal === 0}
                                onChange={() => handleScoreChange(idx, 0)}
                                className="mt-0.5 flex-shrink-0 appearance-none w-4 h-4 border border-white/20 rounded-full checked:bg-error checked:border-transparent checked:ring-1 checked:ring-error/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:opacity-0 checked:after:opacity-100"
                              />
                              <div className="flex-1 leading-none pt-0.5">
                                <div className="font-bold text-white mb-1 flex justify-between items-center text-xs">
                                  <span className={currentVal === 0 ? 'text-error' : ''}>No cumple</span>
                                  <span className="font-mono font-black text-white/50">0.0</span>
                                </div>
                                <p className={`text-[10px] leading-snug line-clamp-2 ${currentVal === 0 ? 'text-error/80' : 'text-text-secondary'}`} title={item["Incompleto (0 ptos.)"]}>{item["Incompleto (0 ptos.)"]}</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary p-8 bg-black/20">
                <AlertCircle className="mx-auto text-text-secondary mb-3 opacity-30" size={40}/>
                <p className="text-sm">Selecciona un equipo para cargar su rúbrica.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default GradingViaAerea
