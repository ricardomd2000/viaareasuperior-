import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileImage, CheckCircle, ExternalLink, ChevronLeft, ChevronRight, Check } from 'lucide-react'

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

  useEffect(() => {
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
    setCurrentPage(0) // Reiniciar paginación al cambiar de grupo
  }, [selectedGroup])

  const handleScoreChange = (file, criteriaIndex, score) => {
    const key = `${selectedGroup}_${file}`
    setGrades(prev => {
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [criteriaIndex]: score
        }
      }
      localStorage.setItem('grades_via_aerea', JSON.stringify(updated))
      return updated
    })
  }

  const toggleConfirm = (file) => {
    const key = `${selectedGroup}_${file}`
    setGrades(prev => {
      const current = prev[key] || {}
      const updated = {
        ...prev,
        [key]: {
          ...current,
          confirmed: !current.confirmed
        }
      }
      localStorage.setItem('grades_via_aerea', JSON.stringify(updated))
      return updated
    })
  }

  const exportCSV = () => {
    if (Object.keys(grades).length === 0) {
      alert("No hay calificaciones para exportar.")
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Grupo,Archivo Estudiante,Puntaje Total,Estado\n"

    Object.entries(grades).forEach(([key, fileGrades]) => {
      const [group, ...nameParts] = key.split('_')
      const name = nameParts.join('_')
      
      let total = 0
      Object.entries(fileGrades).forEach(([k, val]) => {
        if (typeof val === 'number') total += val
      })
      
      const estado = fileGrades.confirmed ? "Confirmado" : "Pendiente"
      csvContent += `"${group}","${name}",${total},"${estado}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "calificaciones_via_aerea_estudiantes.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeRubric = getRubricForGroup(selectedGroup, rubrics)

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

  const getFileTotal = (file) => {
    const fileGrades = grades[`${selectedGroup}_${file}`]
    if (!fileGrades) return 0;
    let total = 0;
    Object.entries(fileGrades).forEach(([k, val]) => {
      if (typeof val === 'number') total += val
    })
    return total;
  }

  const isFileFullyGraded = (file) => {
    if (activeRubric.length === 0) return false;
    const fileGrades = grades[`${selectedGroup}_${file}`]
    if (!fileGrades) return false;
    
    // Contar cuántos de los criterios numéricos están llenos
    const gradedCount = Object.keys(fileGrades).filter(k => !isNaN(k)).length;
    return gradedCount === activeRubric.length;
  }

  const isFileConfirmed = (file) => {
    return grades[`${selectedGroup}_${file}`]?.confirmed || false;
  }

  // Calcular progreso del grupo (de 0 a 100)
  const getGroupProgress = () => {
    if (groupFiles.length === 0) return 0;
    const confirmedCount = groupFiles.filter(file => isFileConfirmed(file)).length;
    return Math.round((confirmedCount / groupFiles.length) * 100);
  }

  // Verificar si un grupo tiene todos sus archivos completamente calificados
  const isGroupFullyGraded = (group) => {
    const files = indexData[group] || [];
    if (files.length === 0) return false;
    
    const rubricLength = getRubricForGroup(group, rubrics).length;
    if (rubricLength === 0) return false;

    return files.every(file => {
      const fileGrades = grades[`${group}_${file}`];
      if (!fileGrades) return false;
      const gradedCount = Object.keys(fileGrades).filter(k => !isNaN(k)).length;
      return gradedCount === rubricLength && fileGrades.confirmed;
    });
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
            <p className="text-text-secondary text-sm font-medium mt-1">Evaluación independiente por imagen</p>
          </div>
        </div>
        
        <button onClick={exportCSV} className="btn-outline flex items-center gap-2 hover:bg-white/10 transition-colors py-2">
          <Download size={18} /> Exportar Notas Desglosadas
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Groups */}
        <div className="w-72 glass-panel p-4 flex flex-col gap-3 overflow-y-auto border border-white/10 flex-shrink-0">
          <h3 className="font-bold text-xs text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
            Equipos a Evaluar
          </h3>
          <div className="flex flex-col gap-2">
            {Object.keys(indexData).map(group => {
              const fullyGraded = isGroupFullyGraded(group);
              return (
                <button 
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                    selectedGroup === group 
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]' 
                    : 'border-white/5 bg-slate-800/50 text-text-secondary hover:bg-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-sm tracking-tight">{group}</span>
                  {fullyGraded && <CheckCircle size={16} className="text-success shadow-lg rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Center Area: Paginator with Cards (Image + Dropdowns) */}
        <div className="flex-1 flex flex-col bg-transparent min-w-0">
          
          {selectedGroup && groupFiles.length > 0 ? (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="pb-4 mb-4 border-b border-white/10">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedGroup}</h2>
                    <p className="text-text-secondary text-sm">{groupFiles.length} imágenes enviadas por este equipo</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Progreso del Grupo</span>
                    <div className="text-xl font-mono font-black text-white">{getGroupProgress()}%</div>
                  </div>
                </div>
                {/* Progress Bar Container */}
                <div style={{ backgroundColor: '#1e293b', height: '22px', borderRadius: '11px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                   <div 
                     style={{ 
                       width: `${getGroupProgress()}%`, 
                       height: '100%', 
                       background: 'linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)',
                       boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
                       transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                       borderRadius: '11px'
                     }}
                   />
                   <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      AVANCE TOTAL DEL EQUIPO: {getGroupProgress()}%
                   </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                   <div className="text-xs text-text-secondary flex gap-4">
                     <span className="flex items-center gap-1"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div> Confirmadas</span>
                     <span className="flex items-center gap-1"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#334155' }}></div> Pendientes</span>
                   </div>
                   {totalPages > 1 && (
                    <div className="flex items-center gap-4 bg-slate-900 px-5 py-2 rounded-2xl border border-white/10 shadow-xl">
                      <button 
                        onClick={prevPage} 
                        disabled={currentPage === 0}
                        className="text-white hover:text-accent-primary disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1"
                      >
                        <ChevronLeft size={28} />
                      </button>
                      <span className="font-mono text-base font-bold text-center">
                         Pág {currentPage + 1} de {totalPages}
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
              </div>
               
              <div className="flex-1 overflow-y-auto pr-2 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {currentImages.map((file) => {
                  const confirmed = isFileConfirmed(file);
                  const currentlyGraded = isFileFullyGraded(file);
                  const totalFileScore = getFileTotal(file);
                  
                  return (
                  <div key={file} 
                    style={{ 
                      borderColor: confirmed ? '#22c55e' : 'rgba(255,255,255,0.1)',
                      borderStyle: 'solid',
                      borderWidth: confirmed ? '3px' : '1px',
                      boxShadow: confirmed ? '0 0 30px rgba(34,197,94,0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    className="bg-slate-900 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-2xl"
                  >
                    
                    {/* Header Image */}
                    <div className="p-3 bg-slate-800 text-xs text-text-secondary flex justify-between items-center border-b border-white/5">
                      <span className="font-mono font-bold truncate text-white">{file}</span>
                      <a 
                        href={`/evaluaciones/${selectedGroup}/${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-accent-primary hover:bg-accent-primary/10 px-2 py-1 rounded flex items-center gap-1 transition-colors bg-black/40 border border-white/5"
                        title="Ver en pantalla completa"
                      >
                        Expandir <ExternalLink size={14}/>
                      </a>
                    </div>
                    
                    {/* Display Image (Min size) */}
                    <div className="h-[450px] bg-[#050505] relative p-1 flex items-center justify-center border-b border-white/5">
                      {file.toLowerCase().endsWith('.pdf') ? (
                         <iframe 
                           src={`/evaluaciones/${selectedGroup}/${file}#toolbar=0`} 
                           className="w-full h-full bg-white rounded-lg border border-white/5"
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
                            {/* Interactive Table Rubric for the specific image */}
                    <div className="p-3">
                      <table className="w-full text-left border-collapse border border-white/5 bg-slate-900 shadow-lg">
                        <thead className="bg-slate-800 text-[10px] text-text-secondary uppercase">
                          <tr>
                            <th className="p-2 border border-white/10 w-[20%]">Criterio</th>
                            <th className="p-2 border border-white/10 w-[26%] text-center leading-tight">Completo<br/>(1.0)</th>
                            <th className="p-2 border border-white/10 w-[26%] text-center leading-tight">Faltan<br/>(0.5)</th>
                            <th className="p-2 border border-white/10 w-[26%] text-center leading-tight">Incompleto<br/>(0.0)</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {activeRubric.map((item, idx) => {
                             const currentVal = grades[`${selectedGroup}_${file}`]?.[idx];
                             
                             const isFull = currentVal === 1;
                             const isHalf = currentVal === 0.5;
                             const isZero = currentVal === 0;

                             return (
                               <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-1.5 border-r border-white/5 font-bold text-slate-300 align-top">
                                   {item["Criterio de Evaluación"]}
                                 </td>
                                 <td 
                                   onClick={() => handleScoreChange(file, idx, 1)}
                                   style={{
                                     backgroundColor: isFull ? '#22c55e' : 'transparent',
                                     color: isFull ? 'white' : '#94a3b8',
                                     cursor: 'pointer',
                                     fontWeight: isFull ? 'bold' : 'normal',
                                     border: isFull ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                                     padding: '12px 8px'
                                   }}
                                   className="align-top transition-all"
                                 >
                                   <div className="flex flex-col gap-1">
                                     {isFull && <div style={{backgroundColor: 'rgba(255,255,255,0.3)', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', width: 'fit-content', marginBottom: '4px'}}>✓ SELECCIONADO</div>}
                                     {item["Completo (1 pto.)"]}
                                   </div>
                                 </td>
                                 <td 
                                   onClick={() => handleScoreChange(file, idx, 0.5)}
                                   style={{
                                     backgroundColor: isHalf ? '#f59e0b' : 'transparent',
                                     color: isHalf ? 'white' : '#94a3b8',
                                     cursor: 'pointer',
                                     fontWeight: isHalf ? 'bold' : 'normal',
                                     border: isHalf ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                                     padding: '12px 8px'
                                   }}
                                   className="align-top transition-all"
                                 >
                                   <div className="flex flex-col gap-1">
                                     {isHalf && <div style={{backgroundColor: 'rgba(255,255,255,0.3)', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', width: 'fit-content', marginBottom: '4px'}}>✓ SELECCIONADO</div>}
                                     {item["Faltan elementos (0.5 ptos.)"]}
                                   </div>
                                 </td>
                                 <td 
                                   onClick={() => handleScoreChange(file, idx, 0)}
                                   style={{
                                     backgroundColor: isZero ? '#ef4444' : 'transparent',
                                     color: isZero ? 'white' : '#94a3b8',
                                     cursor: 'pointer',
                                     fontWeight: isZero ? 'bold' : 'normal',
                                     border: isZero ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                                     padding: '12px 8px'
                                   }}
                                   className="align-top transition-all"
                                 >
                                   <div className="flex flex-col gap-1">
                                     {isZero && <div style={{backgroundColor: 'rgba(255,255,255,0.3)', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', width: 'fit-content', marginBottom: '4px'}}>✓ SELECCIONADO</div>}
                                     {item["Incompleto (0 ptos.)"]}
                                   </div>
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>

                      {/* Score Summary Footer */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleConfirm(file)}
                              disabled={!currentlyGraded}
                              style={{
                                backgroundColor: confirmed ? '#22c55e' : (currentlyGraded ? '#0ea5e9' : '#1e293b'),
                                color: confirmed || currentlyGraded ? 'white' : '#64748b',
                                border: confirmed ? '2px solid white' : 'none',
                                boxShadow: confirmed ? '0 0 20px rgba(34,197,94,0.5)' : (currentlyGraded ? '0 4px 12px rgba(14,165,233,0.3)' : 'none'),
                                cursor: currentlyGraded ? 'pointer' : 'not-allowed',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: confirmed ? 'scale(1.02)' : 'scale(1)',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {confirmed ? <CheckCircle size={18}/> : <Check size={18}/>}
                              {confirmed ? 'NOTA CONFIRMADA' : 'CONFIRMAR EVALUACIÓN'}
                            </button>
                            {!currentlyGraded && (
                               <div style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
                                 Faltan criterios<br/>por evaluar
                               </div>
                            )}
                         </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Puntaje</span>
                          <span className="text-2xl font-mono font-black text-accent-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            {totalFileScore.toFixed(1)} <span className="text-sm text-text-secondary font-sans font-normal">/ 5.0</span>
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )})}
              </div>
            </div>
          ) : (
            <div className="h-full glass-panel flex flex-col items-center justify-center text-text-secondary">
              <FileImage size={64} className="mb-4 opacity-30 text-accent-primary" />
              <p className="text-lg">Selecciona un equipo a la izquierda para empezar.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default GradingViaAerea
