
import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, 
  AppStep, 
  Action, 
  BugReport, 
  RetestReport,
  ChatMessage 
} from './types';
import { THEMES, BROWSERS, ENVIRONMENTS } from './constants';
import { generateBugReport, generateRetestReport } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_PROJECT);
  const [project, setProject] = useState<Project | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Form States
  const [bugForm, setBugForm] = useState<BugReport>({
    version: '', browser: '', environment: '', description: '',
    expectedResult: '', obtainedResult: '', database: '', evidence: ''
  });
  const [retestForm, setRetestForm] = useState<RetestReport>({
    bugCode: '', version: '', browser: '', environment: '',
    description: '', retestResults: '', database: '', evidence: '', solved: 'No'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = project ? THEMES[project] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, isProcessing]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role, content, timestamp: new Date() }
    ]);
  };

  const handleActionSelect = (selectedAction: Action) => {
    if (selectedAction === 'salir') {
      setProject(null);
      setAction(null);
      setMessages([]);
      setShowErrors(false);
      setStep(AppStep.SELECT_PROJECT);
      return;
    }

    setAction(selectedAction);
    setStep(AppStep.GATHERING_DATA);
    setMessages([]);
    setShowErrors(false);
    
    // Reset forms
    setBugForm({
      version: '', browser: '', environment: '', description: '',
      expectedResult: '', obtainedResult: '', database: '', evidence: ''
    });
    setRetestForm({
      bugCode: '', version: '', browser: '', environment: '',
      description: '', retestResults: '', database: '', evidence: '', solved: 'No'
    });
  };

  const handleCancel = () => {
    setStep(AppStep.SELECT_ACTION);
    setAction(null);
    setShowErrors(false);
  };

  const handleProjectSelect = (proj: Project) => {
    setProject(proj);
    setStep(AppStep.SELECT_ACTION);
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom Validation
    let isFormValid = true;
    if (action === 'reportar') {
      isFormValid = Object.values(bugForm).every(v => String(v).trim() !== '');
    } else if (action === 'retest') {
      isFormValid = Object.values(retestForm).every(v => String(v).trim() !== '');
    }

    if (!isFormValid) {
      setShowErrors(true);
      return;
    }

    setIsProcessing(true);
    setStep(AppStep.PROCESSING);

    try {
      let resultText = '';
      if (action === 'reportar') {
        resultText = await generateBugReport(bugForm) || 'Error al generar el reporte.';
      } else if (action === 'retest') {
        resultText = await generateRetestReport(retestForm) || 'Error al generar el reporte.';
      }
      
      addMessage('assistant', resultText);
      setStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      addMessage('assistant', "Lo siento, ocurrió un error crítico al procesar tu solicitud.");
      setStep(AppStep.RESULT);
    } finally {
      setIsProcessing(false);
    }
  };

  const inputClass = (value: string) => `
    w-full p-5 rounded-2xl bg-slate-50 border transition-all placeholder:text-slate-300 font-medium outline-none
    ${showErrors && value.trim() === '' 
      ? 'border-red-500 bg-red-50 focus:ring-red-100' 
      : 'border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100'
    }
  `;

  const renderSelectionCards = () => {
    if (step === AppStep.SELECT_PROJECT) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-12 px-6 animate-tech-fade-in">
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-4 pulse-soft border border-white/20">
              Technical Documentation Engine v2.5
            </div>
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-2">
              QA <span className="text-indigo-600">Assistant</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg font-medium leading-relaxed">
              Bienvenido al centro de estandarización técnica. <br className="hidden sm:block" />
              Selecciona tu proyecto para generar reportes profesionales para Azure DevOps.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl">
            <button 
              onClick={() => handleProjectSelect('GETNET')}
              className="group relative flex-1 p-1 py-1 bg-red-600 rounded-[2.5rem] shadow-xl hover:shadow-red-200 transition-all duration-500 overflow-hidden"
            >
              <div className="bg-white p-10 rounded-[2.4rem] h-full flex flex-col items-center group-hover:bg-red-50 transition-colors duration-500">
                <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">🏦</div>
                <h3 className="text-3xl font-black text-red-600 uppercase tracking-tighter">GETNET</h3>
                <p className="text-slate-400 text-sm mt-3 font-bold uppercase tracking-widest">Adquirencia</p>
                <div className="mt-8 flex items-center gap-2 text-red-600 font-bold text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Seleccionar <span className="text-lg">→</span>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleProjectSelect('BPAGOS')}
              className="group relative flex-1 p-1 py-1 bg-blue-600 rounded-[2.5rem] shadow-xl hover:shadow-blue-200 transition-all duration-500 overflow-hidden"
            >
              <div className="bg-white p-10 rounded-[2.4rem] h-full flex flex-col items-center group-hover:bg-blue-50 transition-colors duration-500">
                <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">💳</div>
                <h3 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">BPAGOS</h3>
                <p className="text-slate-400 text-sm mt-3 font-bold uppercase tracking-widest">Adquirencia</p>
                <div className="mt-8 flex items-center gap-2 text-red-600 font-bold text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Seleccionar <span className="text-lg">→</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (step === AppStep.SELECT_ACTION) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-12 px-6 animate-tech-fade-in">
          <div className="text-center">
            <div className="mb-2 text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Panel de Control Técnico</div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">¿Qué deseas hacer hoy?</h2>
            <p className="text-slate-500 mt-2 text-lg">
              Ecosistema Activo: <span className={`font-black uppercase ${theme?.textPrimary}`}>{project}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl">
            <button 
              onClick={() => handleActionSelect('reportar')}
              className="group relative bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-20 h-20 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-4xl mb-6 group-hover:rotate-6 transition-transform shadow-inner">🐞</div>
              <h4 className="text-2xl font-bold text-slate-800">Reportar Bug</h4>
              <p className="text-sm text-slate-400 mt-3 font-medium">Documentación técnica de nuevos incidentes.</p>
            </button>
            <button 
              onClick={() => handleActionSelect('retest')}
              className="group relative bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-inner">🔄</div>
              <h4 className="text-2xl font-bold text-slate-800">Retest Bug</h4>
              <p className="text-sm text-slate-400 mt-3 font-medium">Verificación de correcciones aplicadas.</p>
            </button>
            <button 
              onClick={() => handleActionSelect('salir')}
              className="group relative bg-slate-100 p-10 rounded-[2rem] border border-slate-200 hover:bg-white transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-4xl mb-6 shadow-inner">🏠</div>
              <h4 className="text-2xl font-bold text-slate-700">Cambiar</h4>
              <p className="text-sm text-slate-400 mt-3 font-medium">Volver a la selección de proyecto.</p>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderForm = () => {
    if (step !== AppStep.GATHERING_DATA) return null;

    const currentTitle = action === 'reportar' ? 'Nuevo Reporte de Bug' : 'Retest de Defecto';
    const currentIcon = action === 'reportar' ? '🐞' : '🔄';
    const currentEnvList = project ? ENVIRONMENTS[project] : [];

    return (
      <div className="max-w-4xl mx-auto w-full p-8 animate-tech-fade-in">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-slate-200">
          <div className={`${theme?.primary} p-12 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <div className="text-[120px] font-black leading-none uppercase tracking-tighter opacity-10">QA_FLOW</div>
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black tracking-widest uppercase backdrop-blur-md">Azure DevOps Standards</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                </div>
                <h3 className="text-4xl font-black tracking-tight flex items-center gap-4">
                  <span className="bg-white/10 p-3 rounded-2xl backdrop-blur-md shadow-inner">{currentIcon}</span>
                  {currentTitle}
                </h3>
                <p className="opacity-70 text-lg mt-2 font-medium">Ingresa los parámetros técnicos. <span className="font-black text-white/90 underline decoration-white/30 decoration-2">Todos los campos con (*) son obligatorios.</span></p>
            </div>
          </div>

          <form onSubmit={onFormSubmit} className="p-12 space-y-10" noValidate>
            {showErrors && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-4 animate-tech-fade-in">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shadow-sm">⚠️</div>
                <p className="text-red-700 font-bold text-sm uppercase tracking-wider">Error: Todos los campos marcados con (*) son obligatorios para generar el reporte.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {action === 'reportar' ? (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Versión: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(bugForm.version)} value={bugForm.version} onChange={e => setBugForm({...bugForm, version: e.target.value})} placeholder="Ej: 2.14.0" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Navegador: <span className="text-red-500 font-bold">*</span></label>
                    <select className={inputClass(bugForm.browser)} value={bugForm.browser} onChange={e => setBugForm({...bugForm, browser: e.target.value})} required>
                      <option value="">Selecciona navegador...</option>
                      {BROWSERS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ambiente: <span className="text-red-500 font-bold">*</span></label>
                    <select className={inputClass(bugForm.environment)} value={bugForm.environment} onChange={e => setBugForm({...bugForm, environment: e.target.value})} required>
                      <option value="">Selecciona ambiente...</option>
                      {currentEnvList.map(env => (
                        <option key={env} value={env}>{env}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Base de Datos: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(bugForm.database)} value={bugForm.database} onChange={e => setBugForm({...bugForm, database: e.target.value})} placeholder="Relacional / No-SQL" required />
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Descripción: <span className="text-red-500 font-bold">*</span></label>
                    <textarea className={inputClass(bugForm.description) + ' min-h-[140px]'} value={bugForm.description} onChange={e => setBugForm({...bugForm, description: e.target.value})} placeholder="Describe paso a paso el fallo detectado..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Resultado Esperado: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(bugForm.expectedResult)} value={bugForm.expectedResult} onChange={e => setBugForm({...bugForm, expectedResult: e.target.value})} placeholder="Comportamiento deseado" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Resultado Obtenido: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(bugForm.obtainedResult)} value={bugForm.obtainedResult} onChange={e => setBugForm({...bugForm, obtainedResult: e.target.value})} placeholder="Comportamiento real" required />
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Evidencia: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(bugForm.evidence)} value={bugForm.evidence} onChange={e => setBugForm({...bugForm, evidence: e.target.value})} placeholder="URLs, nombres de logs, capturas..." required />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del defecto original: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(retestForm.bugCode)} value={retestForm.bugCode} onChange={e => setRetestForm({...retestForm, bugCode: e.target.value})} placeholder="Ej: BUG-8822" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Versión: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(retestForm.version)} value={retestForm.version} onChange={e => setRetestForm({...retestForm, version: e.target.value})} placeholder="Versión corregida" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Navegador: <span className="text-red-500 font-bold">*</span></label>
                    <select className={inputClass(retestForm.browser)} value={retestForm.browser} onChange={e => setRetestForm({...retestForm, browser: e.target.value})} required>
                      <option value="">Selecciona navegador...</option>
                      {BROWSERS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ambiente: <span className="text-red-500 font-bold">*</span></label>
                    <select className={inputClass(retestForm.environment)} value={retestForm.environment} onChange={e => setRetestForm({...retestForm, environment: e.target.value})} required>
                      <option value="">Selecciona ambiente...</option>
                      {currentEnvList.map(env => (
                        <option key={env} value={env}>{env}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Descripción: <span className="text-red-500 font-bold">*</span></label>
                    <textarea className={inputClass(retestForm.description) + ' min-h-[100px]'} value={retestForm.description} onChange={e => setRetestForm({...retestForm, description: e.target.value})} placeholder="¿Qué fallaba originalmente?" required />
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Resultados del Retest: <span className="text-red-500 font-bold">*</span></label>
                    <textarea className={inputClass(retestForm.retestResults) + ' min-h-[100px]'} value={retestForm.retestResults} onChange={e => setRetestForm({...retestForm, retestResults: e.target.value})} placeholder="Resultados tras la ejecución del retest..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Base de Datos: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(retestForm.database)} value={retestForm.database} onChange={e => setRetestForm({...retestForm, database: e.target.value})} placeholder="Base de datos activa" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Resultado del retest: <span className="text-red-500 font-bold">*</span></label>
                    <select className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-bold text-slate-700" value={retestForm.solved} onChange={e => setRetestForm({...retestForm, solved: e.target.value as 'Sí' | 'No'})} required>
                      <option value="Sí" className="text-emerald-600 font-bold">✅ SOLUCIONADO</option>
                      <option value="No" className="text-red-600 font-bold">❌ NO SOLUCIONADO - REABRIR</option>
                    </select>
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Evidencia: <span className="text-red-500 font-bold">*</span></label>
                    <input className={inputClass(retestForm.evidence)} value={retestForm.evidence} onChange={e => setRetestForm({...retestForm, evidence: e.target.value})} placeholder="Capturas o logs del retest..." required />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleCancel}
                className="flex-1 p-5 rounded-[1.8rem] font-black text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 uppercase tracking-[0.2em] text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={`flex-[2] p-5 rounded-[1.8rem] font-black text-white shadow-xl hover:shadow-2xl transition-all duration-300 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 ${theme?.primary} ${theme?.primaryHover} active:scale-95`}
              >
                Generar Reporte Técnico
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* High-Tech Dynamic Header */}
      <header className={`h-16 flex items-center justify-between px-8 shadow-sm sticky top-0 z-50 transition-all duration-1000 backdrop-blur-xl border-b ${theme ? `${theme.primary} border-white/10` : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg group">
            <span className={`font-black text-lg transition-colors ${theme ? theme.textPrimary : 'text-slate-900'}`}>QA</span>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-white font-black tracking-tighter text-lg uppercase">Assistant</span>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] pulse-soft">Technical Documentation</span>
          </div>
        </div>
        
        {project && (
          <div className="flex items-center gap-4 group">
            <div className="bg-white/10 text-white px-5 py-1.5 rounded-full text-[10px] font-black ring-1 ring-white/30 backdrop-blur-md shadow-lg border border-white/5 flex items-center gap-3 transition-all group-hover:bg-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              {project}
            </div>
          </div>
        )}
      </header>

      {/* Main Experience Layer */}
      <main className="flex-1 relative pb-20">
        {step === AppStep.SELECT_PROJECT || step === AppStep.SELECT_ACTION ? (
           renderSelectionCards()
        ) : step === AppStep.GATHERING_DATA ? (
           renderForm()
        ) : (
          <div className="max-w-5xl mx-auto w-full p-8 space-y-8 animate-tech-fade-in">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[95%] p-8 rounded-[2.5rem] shadow-2xl whitespace-pre-wrap transition-all relative overflow-hidden ${
                    m.role === 'user' 
                    ? `${theme?.primary || 'bg-slate-800'} text-white rounded-tr-none border border-white/10` 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none ring-1 ring-slate-100'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="mb-4 flex items-center gap-2 opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        IA Generated Report
                    </div>
                  )}
                  <div className={`${m.role === 'assistant' ? 'font-mono text-sm leading-relaxed text-slate-700' : 'font-semibold'}`}>
                    {m.content}
                  </div>
                  
                  {m.role === 'assistant' && (m.content.includes('Versión:') || m.content.includes('Nombre del defecto')) && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      className="mt-8 flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white text-[10px] font-black rounded-2xl border border-white/10 transition-all uppercase tracking-[0.3em] hover:bg-slate-800 hover:scale-[1.02] active:scale-95 shadow-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copiar para Azure DevOps
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center gap-6 shadow-2xl ring-1 ring-slate-100 w-full max-w-sm animate-pulse">
                  <div className="flex space-x-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${theme?.primary || 'bg-slate-400'} animate-bounce`}></div>
                    <div className={`w-3.5 h-3.5 rounded-full ${theme?.primary || 'bg-slate-400'} animate-bounce [animation-delay:-.3s]`}></div>
                    <div className={`w-3.5 h-3.5 rounded-full ${theme?.primary || 'bg-slate-400'} animate-bounce [animation-delay:-.5s]`}></div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-1">Processing Neural Engine</span>
                    <span className="text-xs font-bold text-slate-300 italic">Estandarizando parámetros técnicos...</span>
                  </div>
                </div>
              </div>
            )}

            {step === AppStep.RESULT && (
              <div className="w-full max-w-3xl mx-auto mt-12 mb-8 animate-tech-fade-in relative z-40">
                <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.2rem] border border-white shadow-2xl flex flex-col sm:flex-row gap-6 items-center justify-between ring-1 ring-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner">✨</div>
                    <div className="flex flex-col">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">¿Siguiente acción?</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Elige para continuar</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => handleActionSelect('reportar')} className="flex-1 sm:flex-none px-6 py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black hover:bg-orange-600 transition-all uppercase tracking-widest shadow-lg active:scale-95">Nuevo Bug</button>
                    <button onClick={() => handleActionSelect('retest')} className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black hover:bg-emerald-600 transition-all uppercase tracking-widest shadow-lg active:scale-95">Nuevo Retest</button>
                    <button onClick={() => handleActionSelect('salir')} className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black hover:bg-black transition-all uppercase tracking-widest shadow-lg active:scale-95">Salir</button>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-16" />
          </div>
        )}
      </main>

      {/* Futuristic System Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 h-12 px-8 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] sticky bottom-0 z-40">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Azure Board Sync Ready</span>
          <span className="hidden md:inline flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Gemini 3 Pro Enabled</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             System Online
          </div>
          <span className="opacity-50">v2.5.7-stable</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
