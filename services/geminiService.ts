
import { GoogleGenAI, Type } from "@google/genai";
import { BugReport, RetestReport } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BROWSER_MAP: Record<string, string> = {
  'chrome': 'Google Chrome',
  'edge': 'Microsoft Edge',
  'firefox': 'Mozilla Firefox',
  'safari': 'Apple Safari',
  'opera': 'Opera Browser',
  'brave': 'Brave Browser'
};

const normalizeBrowser = (browser: string): string => {
  const lower = browser.toLowerCase();
  for (const [key, value] of Object.entries(BROWSER_MAP)) {
    if (lower.includes(key)) return value;
  }
  return browser;
};

export const generateBugReport = async (data: BugReport) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this bug information into a professional, technical format for Azure DevOps. 
    Browser normalization: ${data.browser} should be mapped to common full names if applicable.
    
    Data:
    Version: ${data.version}
    Browser: ${data.browser}
    Environment: ${data.environment}
    Description: ${data.description}
    Expected: ${data.expectedResult}
    Obtained: ${data.obtainedResult}
    Database: ${data.database}
    Evidence: ${data.evidence}

    Return the result in this exact format (Spanish):
    Versión: [value]
    Navegador: [normalized value]
    Ambiente: [value]
    Descripción: [technical professional description]
    Resultado Esperado: [technical professional value]
    Resultado Obtenido: [technical professional value]
    Base de Datos: [value]
    Evidencia: [value]
    Nombre sugerido para el bug:
    1. [Brief name]
    2. [Brief name]
    3. [Brief name]`,
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text;
};

export const generateRetestReport = async (data: RetestReport) => {
  const normalizedBrowser = normalizeBrowser(data.browser);
  const status = data.solved.toLowerCase() === 'sí' 
    ? 'Solucionado' 
    : 'No solucionado – Se reabre defecto';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this retest information into a professional, technical format for Azure DevOps.
    
    Context:
    Original Code: ${data.bugCode}
    Version: ${data.version}
    Browser: ${normalizedBrowser}
    Environment: ${data.environment}
    Original Issue: ${data.description}
    Retest Findings: ${data.retestResults}
    DB: ${data.database}
    Evidence: ${data.evidence}
    Solved: ${data.solved}

    Specific Rule for "Descripción" field:
    Must start with: "El defecto original [bugCode]: [technical summary of original issue]."

    Return the result in this exact format (Spanish):
    Nombre del defecto original: [bugCode]
    Versión: [version]
    Navegador: [normalizedBrowser]
    Ambiente: [environment]
    Descripción: [as specified above]
    Resultados del Retest: [technical summary of retest results]
    Base de Datos: [database]
    Evidencia: [evidence]
    Resultado del retest: ${status}`,
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text;
};
