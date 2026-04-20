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

  const exportCSV = () => {
    if (Object.keys(grades).length === 0) {
      alert("No hay calificaciones para exportar.")
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Grupo,Archivo Estudiante,Puntaje Total\n"

    Object.entries(grades).forEach(([key, fileGrades]) => {
      const [group, ...nameParts] = key.split('_')
      const name = nameParts.join('_')
      
      let total = 0
      Object.values(fileGrades).forEach(val => { total += val })
      
      csvContent += `"${group}","${name}",${total}\n`
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
    Object.values(fileGrades).forEach(s => total += s);
    return total;
  }

  const isFileFullyGraded = (file) => {
    if (activeRubric.length === 0) return false;
    const fileGrades = grades[`${selectedGroup}_${file}`]
    if (!fileGrades) return false;
    return Object.keys(fileGrades).length === activeRubric.length;
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
      return Object.keys(fileGrades).length === rubricLength;
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
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedGroup}</h2>
                  <p className="text-text-secondary text-sm">{groupFiles.length} imágenes para calificar en este equipo</p>
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
               
              <div className="flex-1 overflow-y-auto pr-2 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {currentImages.map((file) => {
                  const currentlyGraded = isFileFullyGraded(file);
                  const totalFileScore = getFileTotal(file);
                  
                  return (
                  <div key={file} className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10 flex flex-col shadow-2xl">
                    
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
                                   className={`p-1.5 border-r border-white/5 cursor-pointer align-top transition-colors ${isFull ? 'bg-success/20 text-success font-semibold ring-1 ring-inset ring-success' : 'text-text-secondary hover:bg-slate-800'}`}
                                 >
                                   {item["Completo (1 pto.)"]}
                                 </td>
                                 <td 
                                   onClick={() => handleScoreChange(file, idx, 0.5)}
                                   className={`p-1.5 border-r border-white/5 cursor-pointer align-top transition-colors ${isHalf ? 'bg-warning/20 text-warning font-semibold ring-1 ring-inset ring-warning' : 'text-text-secondary hover:bg-slate-800'}`}
                                 >
                                   {item["Faltan elementos (0.5 ptos.)"]}
                                 </td>
                                 <td 
                                   onClick={() => handleScoreChange(file, idx, 0)}
                                   className={`p-1.5 cursor-pointer align-top transition-colors ${isZero ? 'bg-error/20 text-error font-semibold ring-1 ring-inset ring-error' : 'text-text-secondary hover:bg-slate-800'}`}
                                 >
                                   {item["Incompleto (0 ptos.)"]}
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>

                      {/* Score Summary Footer */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                           {currentlyGraded ? (
                             <span className="flex items-center gap-1.5 text-success font-bold text-sm bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                               <Check size={16}/> Comprobado
                             </span>
                           ) : (
                             <span className="text-xs text-warning/80 italic">Aún faltan criterios...</span>
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
