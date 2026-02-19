
import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, 
  AppStep, 
  Action, 
  BugReport, 
  RetestReport,
  ChatMessage,
  LocalDraft
} from './types';
import { THEMES, BROWSERS, ENVIRONMENTS, DATABASE_MAPPING } from './constants';
import { generateBugReport, generateRetestReport, extractDataFromImage, generateRegressionTestCase } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_PROJECT);
  const [project, setProject] = useState<Project | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [regressionCase, setRegressionCase] = useState<string | null>(null);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [openCopyMenuId, setOpenCopyMenuId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localDrafts, setLocalDrafts] = useState<LocalDraft[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [bugForm, setBugForm] = useState<BugReport>({
    version: '', browser: '', environment: '', description: '',
    expectedResult: '', obtainedResult: '', database: '', evidence: ''
  });
  const [retestForm, setRetestForm] = useState<RetestReport>({
    bugCode: '', version: '', browser: '', environment: '',
    originalDescription: '', retestResults: '', database: '', evidence: '', solved: 'No'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const theme = project ? THEMES[project] : null;

  // Persistence management
  useEffect(() => {
    const savedMessages = localStorage.getItem('qa_messages_v3');
    const savedDrafts = localStorage.getItem('qa_drafts_v3');
    if (savedMessages) setMessages(JSON.parse(savedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    if (savedDrafts) setLocalDrafts(JSON.parse(savedDrafts));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('qa_messages_v3', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('qa_drafts_v3', JSON.stringify(localDrafts));
  }, [localDrafts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, isProcessing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenCopyMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role, content, timestamp: new Date() }
    ]);
  };

  const saveDraft = () => {
    const currentData = action === 'reportar' ? bugForm : retestForm;
    const newDraft: LocalDraft = {
      id: Date.now().toString(),
      project: project!,
      action: action!,
      data: { ...currentData },
      timestamp: Date.now()
    };
    setLocalDrafts(prev => [newDraft, ...prev]);
    alert("Información guardada localmente como borrador.");
    handleActionSelect('salir');
  };

  const loadDraft = (draft: LocalDraft) => {
    setProject(draft.project);
    setAction(draft.action);
    if (draft.action === 'reportar') setBugForm(draft.data as BugReport);
    else setRetestForm(draft.data as RetestReport);
    setStep(AppStep.GATHERING_DATA);
    setLocalDrafts(prev => prev.filter(d => d.id !== draft.id));
    setShowHistory(false);
  };

  const handleActionSelect = (selectedAction: Action) => {
    if (selectedAction === 'salir') {
      setProject(null);
      setAction(null);
      setMessages([]);
      setShowErrors(false);
      setStep(AppStep.SELECT_PROJECT);
      setRegressionCase(null);
      return;
    }
    setAction(selectedAction);
    setStep(AppStep.GATHERING_DATA);
    setMessages([]);
    setShowErrors(false);
    setRegressionCase(null);
    resetForms();
  };

  const resetForms = () => {
    setBugForm({ version: '', browser: '', environment: '', description: '', expectedResult: '', obtainedResult: '', database: '', evidence: '' });
    setRetestForm({ bugCode: '', version: '', browser: '', environment: '', originalDescription: '', retestResults: '', database: '', evidence: '', solved: 'No' });
  };

  const handleClearForm = () => {
    resetForms();
    setShowErrors(false);
  };

  const handleProjectSelect = (proj: Project) => {
    setProject(proj);
    setStep(AppStep.SELECT_ACTION);
  };

  const handleEnvChange = (env: string) => {
    const db = DATABASE_MAPPING[env] || '';
    if (action === 'reportar') {
      setBugForm(prev => ({ ...prev, environment: env, database: db }));
    } else if (action === 'retest') {
      setRetestForm(prev => ({ ...prev, environment: env, database: db }));
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!isOnline) {
      alert("El análisis de imágenes requiere conexión a internet.");
      return;
    }
    setIsAnalyzingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const data = await extractDataFromImage(base64);
      if (data) {
        if (action === 'reportar') {
          setBugForm(prev => ({
            ...prev,
            description: prev.description + (prev.description ? '\n' : '') + (data.description || ''),
            obtainedResult: data.obtainedResult || prev.obtainedResult,
            evidence: prev.evidence + (prev.evidence ? ', ' : '') + 'Análisis de captura IA'
          }));
        } else {
          setRetestForm(prev => ({
            ...prev,
            originalDescription: prev.originalDescription + (prev.originalDescription ? '\n' : '') + (data.description || ''),
            evidence: prev.evidence + (prev.evidence ? ', ' : '') + 'Análisis de captura IA'
          }));
        }
      }
      setIsAnalyzingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentForm = action === 'reportar' ? bugForm : retestForm;
    let isFormValid = Object.values(currentForm).every(v => String(v).trim() !== '');

    if (!isFormValid) {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isOnline) {
      saveDraft();
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
      addMessage('assistant', "Ocurrió un error al procesar la solicitud.");
      setStep(AppStep.RESULT);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTestCase = async () => {
    if (action !== 'reportar') return;
    if (!isOnline) {
      alert("La generación de casos de prueba requiere conexión a internet.");
      return;
    }
    setIsGeneratingCase(true);
    try {
      const tc = await generateRegressionTestCase(bugForm);
      setRegressionCase(tc || 'No se pudo generar el caso de prueba.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCase(false);
    }
  };

  const handleCopyReport = (content: string, format: 'text' | 'markdown' | 'json') => {
    let textToCopy = content;

    if (format === 'markdown') {
      textToCopy = content
        .split('\n')
        .map(line => {
          if (line.includes(':')) {
            const [key, ...rest] = line.split(':');
            return `**${key.trim()}:** ${rest.join(':').trim()}`;
          }
          if (/^\d+\./.test(line)) return `  ${line}`; 
          return line;
        })
        .join('\n');
    } else if (format === 'json') {
      const json: Record<string, any> = {};
      const lines = content.split('\n');
      let currentKey = '';
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, ...rest] = line.split(':');
          currentKey = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
          const value = rest.join(':').trim();
          if (value) json[currentKey] = value;
          else json[currentKey] = [];
        } else if (currentKey && /^\d+\./.test(line)) {
          if (Array.isArray(json[currentKey])) {
            json[currentKey].push(line.replace(/^\d+\.\s*/, '').trim());
          }
        }
      });
      textToCopy = JSON.stringify(json, null, 2);
    }

    navigator.clipboard.writeText(textToCopy);
    setOpenCopyMenuId(null);
  };

  const inputClass = (value: string) => `
    w-full p-4 rounded-xl bg-white border text-sm transition-all outline-none
    ${showErrors && String(value).trim() === '' 
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100' 
      : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50'
    }
  `;

  const renderHero = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12 animate-tech-fade-in text-center">
      <div className="max-w-4xl space-y-8">
        <div className="space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-slate-200">
            Professional QA Tool v1.0
          </span>
          <h1 className="hero-title text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
            Documentación <span className="text-indigo-600">Técnica</span> Estándar
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Optimiza tus reportes de bugs y retests con inteligencia artificial. Profesionalismo instantáneo para tus tableros de gestión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-8">
          <button 
            onClick={() => handleProjectSelect('GETNET')}
            className="group relative p-1 rounded-3xl bg-red-600 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-red-200"
          >
            <div className="bg-white p-10 rounded-[1.4rem] flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-4xl mb-6 shadow-inner">🏦</div>
              <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">GETNET</h3>
              <p className="text-sm text-slate-400 mt-2 font-semibold">Banco Santander</p>
              <div className="mt-8 px-6 py-2 rounded-full border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Seleccionar</div>
            </div>
          </button>

          <button 
            onClick={() => handleProjectSelect('BPAGOS')}
            className="group relative p-1 rounded-3xl bg-blue-600 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-blue-200"
          >
            <div className="bg-white p-10 rounded-[1.4rem] flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl mb-6 shadow-inner">💳</div>
              <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">BPAGOS</h3>
              <p className="text-sm text-slate-400 mt-2 font-semibold">Banco de Chile</p>
              <div className="mt-8 px-6 py-2 rounded-full border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Seleccionar</div>
            </div>
          </button>
        </div>

        {(localDrafts.length > 0 || messages.length > 0) && (
          <button 
            onClick={() => setShowHistory(true)}
            className="mt-8 px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:shadow-lg transition-all"
          >
            Ver Historial y Borradores ({localDrafts.length + messages.filter(m => m.role === 'assistant').length})
          </button>
        )}
      </div>
    </div>
  );

  const renderActionSelection = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12 animate-tech-fade-in">
      <div className="text-center mb-12">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Proyecto Activo</p>
        <h2 className={`text-4xl font-black uppercase tracking-tight ${theme?.textPrimary}`}>{project}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <button onClick={() => handleActionSelect('reportar')} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-3xl mb-4 group-hover:rotate-12 transition-transform">🐞</div>
          <h4 className="text-xl font-bold text-slate-800">Reportar Bug</h4>
          <p className="text-xs text-slate-400 mt-2">Nuevo incidente detectado.</p>
        </button>
        <button onClick={() => handleActionSelect('retest')} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🔄</div>
          <h4 className="text-xl font-bold text-slate-800">Realizar Retest</h4>
          <p className="text-xs text-slate-400 mt-2">Validar corrección existente.</p>
        </button>
        <button onClick={() => handleActionSelect('salir')} className="bg-slate-50 p-10 rounded-3xl border border-slate-200 shadow-sm hover:bg-white hover:shadow-xl transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-3xl mb-4">🏠</div>
          <h4 className="text-xl font-bold text-slate-700">Cambiar</h4>
          <p className="text-xs text-slate-400 mt-2">Volver al inicio.</p>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 animate-tech-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className={`${theme?.primary} p-10 text-white relative`}>
          {!isOnline && (
            <div className="absolute top-4 right-10 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span> Offline - Autoguardado
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-black/10 px-3 py-1 rounded-full mb-3 inline-block">Módulo de Documentación AI+</span>
              <h3 className="text-3xl font-extrabold tracking-tight">{action === 'reportar' ? 'Nuevo Reporte de Bug' : 'Retest de Defecto'}</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-2xl border border-white/20 self-start md:self-center">
              {action === 'reportar' ? '🐞' : '🔄'}
            </div>
          </div>
        </div>

        <form onSubmit={onFormSubmit} className="p-8 md:p-12 space-y-8" noValidate>
          <div 
            className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center ${isAnalyzingImage ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white'} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              if (!isOnline) return;
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) handleImageUpload(file);
            }}
          >
            <input 
              type="file" 
              className={`absolute inset-0 opacity-0 ${!isOnline ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
              accept="image/*"
              disabled={!isOnline}
              onChange={e => e.target.files && handleImageUpload(e.target.files[0])}
            />
            {isAnalyzingImage ? (
              <div className="space-y-3">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-indigo-600 animate-pulse">IA Analizando captura...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{isOnline ? 'Suelta una captura para auto-completar' : 'IA Desactivada (Offline)'}</p>
                <p className="text-[10px] text-slate-400 mt-1">{isOnline ? 'La IA extraerá mensajes de error automáticamente' : 'Conéctate para analizar imágenes'}</p>
              </>
            )}
          </div>

          {showErrors && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-start gap-4 animate-bounce-short">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">⚠️</div>
              <div className="space-y-1">
                <p className="text-red-800 font-black text-xs uppercase tracking-widest">Información Incompleta</p>
                <p className="text-red-600 text-sm font-medium">Por favor completa todos los campos marcados con (*) para continuar.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {action === 'reportar' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Versión <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(bugForm.version)} value={bugForm.version} onChange={e => setBugForm({...bugForm, version: e.target.value})} placeholder="Ej: 1.0.4 o 3.12.5" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Navegador <span className="text-red-500 font-black">*</span></label>
                  <select className={inputClass(bugForm.browser)} value={bugForm.browser} onChange={e => setBugForm({...bugForm, browser: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {BROWSERS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Ambiente <span className="text-red-500 font-black">*</span></label>
                  <select className={inputClass(bugForm.environment)} value={bugForm.environment} onChange={e => handleEnvChange(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {ENVIRONMENTS[project!].map(env => <option key={env} value={env}>{env}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Base de Datos <span className="text-red-500 font-black">*</span></label>
                  <input 
                    className={inputClass(bugForm.database) + ' bg-slate-50 cursor-not-allowed select-none font-medium text-slate-500'} 
                    value={bugForm.database} 
                    readOnly 
                    placeholder="Se asigna según ambiente" 
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Descripción del Problema <span className="text-red-500 font-black">*</span></label>
                  <textarea className={inputClass(bugForm.description) + ' min-h-[120px] resize-none'} value={bugForm.description} onChange={e => setBugForm({...bugForm, description: e.target.value})} placeholder="Describe el fallo detectado detalladamente..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Resultado Esperado <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(bugForm.expectedResult)} value={bugForm.expectedResult} onChange={e => setBugForm({...bugForm, expectedResult: e.target.value})} placeholder="Comportamiento correcto esperado..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Resultado Obtenido <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(bugForm.obtainedResult)} value={bugForm.obtainedResult} onChange={e => setBugForm({...bugForm, obtainedResult: e.target.value})} placeholder="Comportamiento erróneo actual..." />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Evidencia <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(bugForm.evidence)} value={bugForm.evidence} onChange={e => setBugForm({...bugForm, evidence: e.target.value})} placeholder="URLs de capturas, logs o IDs de transacciones..." />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Código del Defecto <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(retestForm.bugCode)} value={retestForm.bugCode} onChange={e => setRetestForm({...retestForm, bugCode: e.target.value})} placeholder="Ej: BUG-441 o ID de Azure" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Versión <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(retestForm.version)} value={retestForm.version} onChange={e => setRetestForm({...retestForm, version: e.target.value})} placeholder="Versión donde se validó el fix" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Ambiente <span className="text-red-500 font-black">*</span></label>
                  <select className={inputClass(retestForm.environment)} value={retestForm.environment} onChange={e => handleEnvChange(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {ENVIRONMENTS[project!].map(env => <option key={env} value={env}>{env}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Base de Datos <span className="text-red-500 font-black">*</span></label>
                  <input 
                    className={inputClass(retestForm.database) + ' bg-slate-50 cursor-not-allowed select-none font-medium text-slate-500'} 
                    value={retestForm.database} 
                    readOnly 
                    placeholder="Se asigna según ambiente" 
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Descripción del Bug Original <span className="text-red-500 font-black">*</span></label>
                  <textarea className={inputClass(retestForm.originalDescription) + ' min-h-[80px] resize-none'} value={retestForm.originalDescription} onChange={e => setRetestForm({...retestForm, originalDescription: e.target.value})} placeholder="Breve descripción del problema reportado inicialmente..." />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Resultados del Retest <span className="text-red-500 font-black">*</span></label>
                  <textarea className={inputClass(retestForm.retestResults) + ' min-h-[100px] resize-none'} value={retestForm.retestResults} onChange={e => setRetestForm({...retestForm, retestResults: e.target.value})} placeholder="Detalla los pasos realizados y el resultado final de la validación..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">¿Fue Solucionado? <span className="text-red-500 font-black">*</span></label>
                  <select className={inputClass(retestForm.solved) + ' font-bold'} value={retestForm.solved} onChange={e => setRetestForm({...retestForm, solved: e.target.value as 'Sí' | 'No'})}>
                    <option value="Sí">SÍ - SOLUCIONADO</option>
                    <option value="No">NO - REABRIR</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Navegador <span className="text-red-500 font-black">*</span></label>
                  <select className={inputClass(retestForm.browser)} value={retestForm.browser} onChange={e => setRetestForm({...retestForm, browser: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {BROWSERS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Evidencia del Retest <span className="text-red-500 font-black">*</span></label>
                  <input className={inputClass(retestForm.evidence)} value={retestForm.evidence} onChange={e => setRetestForm({...retestForm, evidence: e.target.value})} placeholder="Capturas, logs o enlaces que validan la solución..." />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button type="button" onClick={() => setStep(AppStep.SELECT_ACTION)} className="flex-1 p-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
            <button type="button" onClick={handleClearForm} className="flex-1 p-4 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-200 border border-slate-200 transition-all uppercase tracking-widest text-[10px] hover:text-slate-700">Limpiar Formulario</button>
            <button type="submit" className={`flex-[2] p-4 rounded-xl font-bold text-white shadow-xl transition-all uppercase tracking-widest text-[10px] ${theme?.primary} ${theme?.primaryHover} active:scale-95`}>
              {isOnline ? 'Generar Documentación con IA' : 'Guardar Borrador Offline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`h-16 sticky top-0 z-50 glass border-b flex items-center justify-between px-6 transition-all duration-500 ${project ? theme?.bgLight : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-lg ${project ? theme?.primary : 'bg-slate-900'}`}>QA</div>
          <span className="font-extrabold text-sm uppercase tracking-tighter">Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-[9px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          {project && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${theme?.primary} animate-pulse`}></span>
              <span className="text-[10px] font-black text-slate-700 uppercase">{project}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 bg-slate-50/50">
        {step === AppStep.SELECT_PROJECT ? renderHero() :
         step === AppStep.SELECT_ACTION ? renderActionSelection() :
         step === AppStep.GATHERING_DATA ? renderForm() : (
          <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-8 animate-tech-fade-in">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`w-full max-w-full p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden ${m.role === 'user' ? `${theme?.primary} text-white` : 'bg-white border border-slate-200'}`}>
                  {m.role === 'assistant' && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Resultado Técnico Generado</div>}
                  <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  {m.role === 'assistant' && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 relative">
                      <div className="flex-1 relative" ref={dropdownRef}>
                        <button 
                          onClick={() => setOpenCopyMenuId(openCopyMenuId === m.id ? null : m.id)} 
                          className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-[0.2em] hover:bg-black active:scale-[0.98] shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          Copiar Reporte
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${openCopyMenuId === m.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        
                        {openCopyMenuId === m.id && (
                          <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-tech-fade-in">
                            <button 
                              onClick={() => handleCopyReport(m.content, 'text')}
                              className="w-full p-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 border-b border-slate-50 transition-all flex items-center gap-3"
                            >
                              <span className="text-lg">📄</span> Texto Plano
                            </button>
                            <button 
                              onClick={() => handleCopyReport(m.content, 'markdown')}
                              className="w-full p-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 border-b border-slate-50 transition-all flex items-center gap-3"
                            >
                              <span className="text-lg">Ⓜ️</span> Markdown
                            </button>
                            <button 
                              onClick={() => handleCopyReport(m.content, 'json')}
                              className="w-full p-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                            >
                              <span className="text-lg">📦</span> JSON Técnico
                            </button>
                          </div>
                        )}
                      </div>

                      {action === 'reportar' && (
                        <button 
                          onClick={handleGenerateTestCase} 
                          disabled={isGeneratingCase || !isOnline}
                          className={`flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-[0.98] shadow-lg ${isGeneratingCase || !isOnline ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isGeneratingCase ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                          generar caso de prueba para retest
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Analizando Impacto del Incidente...</p>
              </div>
            )}

            {step === AppStep.RESULT && (
              <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => handleActionSelect('reportar')} className="px-8 py-4 bg-orange-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">Nuevo Bug</button>
                <button onClick={() => handleActionSelect('retest')} className="px-8 py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">Nuevo Retest</button>
                <button onClick={() => handleActionSelect('salir')} className="px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all">Salir</button>
              </div>
            )}
            <div ref={messagesEndRef} className="h-20" />
          </div>
        )}
      </main>

      {/* Regression Case Modal */}
      {regressionCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-tech-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">QA Automation Assets</p>
                <h3 className="text-xl font-extrabold text-slate-900">Caso de Prueba de Regresión</h3>
              </div>
              <button onClick={() => setRegressionCase(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center">✕</button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                {regressionCase}
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t flex gap-4">
              <button 
                onClick={() => navigator.clipboard.writeText(regressionCase)} 
                className="flex-1 py-4 bg-indigo-600 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copiar Caso de Prueba
              </button>
              <button onClick={() => setRegressionCase(null)} className="flex-1 py-4 bg-white text-slate-500 border border-slate-200 text-[10px] font-bold rounded-xl transition-all uppercase tracking-[0.2em] hover:bg-slate-100 active:scale-[0.98]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History and Drafts Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-tech-fade-in">
          <div className="bg-slate-50 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-white border-b flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Local Storage Management</p>
                <h3 className="text-2xl font-black text-slate-900">Historial y Borradores</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Drafts Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Borradores Guardados Offline</h4>
                </div>
                {localDrafts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-white p-6 rounded-2xl border border-slate-200">No hay borradores locales.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localDrafts.map(draft => (
                      <div key={draft.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${THEMES[draft.project].primary} text-white`}>{draft.project}</span>
                          <span className="text-[9px] text-slate-300 font-mono">{new Date(draft.timestamp).toLocaleString()}</span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm truncate">{draft.action === 'reportar' ? 'Bug Report Draft' : 'Retest Report Draft'}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{(draft.data as any).description || (draft.data as any).originalDescription}</p>
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => loadDraft(draft)}
                            disabled={!isOnline && draft.action === 'reportar'}
                            className="flex-1 py-2 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
                          >
                            Cargar {(!isOnline && draft.action === 'reportar') ? '(IA Req Connection)' : ''}
                          </button>
                          <button 
                            onClick={() => setLocalDrafts(prev => prev.filter(d => d.id !== draft.id))}
                            className="p-2 text-red-300 hover:text-red-500 transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Generated History Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Historial de Reportes Generados</h4>
                </div>
                {messages.filter(m => m.role === 'assistant').length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-white p-6 rounded-2xl border border-slate-200">No hay reportes previos.</p>
                ) : (
                  <div className="space-y-4">
                    {messages.filter(m => m.role === 'assistant').slice().reverse().map(m => (
                      <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[9px] text-slate-400 font-mono">{m.timestamp.toLocaleString()}</span>
                          <button 
                            onClick={() => handleCopyReport(m.content, 'text')}
                            className="px-3 py-1 bg-slate-100 text-slate-600 text-[8px] font-black rounded uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                          >
                            Copiar Texto
                          </button>
                        </div>
                        <div className="font-mono text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap line-clamp-4">
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            
            <div className="p-8 bg-white border-t flex justify-between items-center">
              <p className="text-[9px] text-slate-400 font-medium">Los datos se almacenan de forma segura en tu navegador local.</p>
              <button 
                onClick={() => {
                  if (confirm("¿Estás seguro de borrar todo el historial y borradores?")) {
                    setLocalDrafts([]);
                    setMessages([]);
                    localStorage.removeItem('qa_messages_v3');
                    localStorage.removeItem('qa_drafts_v3');
                  }
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
              >
                Limpiar todo el almacenamiento local
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
        <span>© 2026 QA ASSISTANT · Desarrollador por Cristian Andres Castro</span>
      </footer>
    </div>
  );
};

export default App;
