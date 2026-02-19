
import { GoogleGenAI, Type } from "@google/genai";
import { BugReport, RetestReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDataFromImage = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
      { text: "Analiza esta captura de pantalla de un error de software. Extrae de forma técnica: mensaje de error, IDs y descripción. Responde exclusivamente en JSON: {description, obtainedResult}." }
    ],
    config: { responseMimeType: "application/json", temperature: 0.1 }
  });
  try { return JSON.parse(response.text || '{}'); } catch (e) { return null; }
};

export const generateBugReport = async (data: BugReport) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Actúa como un Senior QA Engineer. Tu objetivo es organizar la información del usuario para que tenga un sentido profesional y coherente. 

INSTRUCCIONES CLAVE:
1. RESPETO AL LENGUAJE: No cambies drásticamente las palabras del usuario. Si el usuario reporta algo, mantén su esencia pero ordénala profesionalmente.
2. SENTIDO TÉCNICO: Dale coherencia a la redacción (ej: si el usuario dice "el botón no hace nada", puedes poner "El botón de envío no ejecuta ninguna acción al ser presionado").
3. SIN EXAGERAR: No inventes tecnicismos complejos si la descripción es sencilla. Mantén la fidelidad absoluta a lo reportado.

Estructura obligatoria (utiliza este formato exacto de texto plano):

Versión: ${data.version}
Navegador: ${data.browser}
Ambiente: ${data.environment}
Severidad: [Indica únicamente el nivel: Critical, High, Medium o Low. No incluyas ninguna explicación ni contexto del porqué.]
Descripción Técnica: [Dale coherencia profesional a la descripción original: "${data.description}", respetando las palabras del usuario pero organizando la idea.]
Resultado Esperado: [Refina el resultado esperado para que sea claro y profesional: "${data.expectedResult}".]
Resultado Obtenido: [Refina el resultado obtenido para que sea preciso basado en lo que el usuario reportó: "${data.obtainedResult}".]
Base de Datos: ${data.database}
Evidencia: ${data.evidence}
Nombre sugerido para el bug:
1. [Nombre breve y descriptivo 1]
2. [Nombre breve y descriptivo 2]
3. [Nombre breve y descriptivo 3]

No utilices Markdown (# o **), solo texto plano siguiendo exactamente este formato.`,
    config: { temperature: 0.2 }
  });
  return response.text;
};

export const generateRetestReport = async (data: RetestReport) => {
  const status = data.solved.toLowerCase() === 'sí' ? 'Solucionado' : 'No solucionado – Se reabre defecto';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Actúa como un Senior QA Engineer validando un fix. Tu tarea es dar coherencia técnica a las notas del retest sin perder el lenguaje original del analista.

CRITERIOS:
- Dale un orden lógico y profesional a los resultados del retest.
- No añadas información que no esté en el reporte original.
- Mantén la brevedad y la precisión.

Estructura obligatoria (utiliza este formato exacto de texto plano):

Nombre del defecto original: ${data.bugCode}
Versión: ${data.version}
Navegador: ${data.browser}
Ambiente: ${data.environment}
Descripción Técnica Original: [Organiza profesionalmente el problema original: "${data.originalDescription}".]
Resultados del Retest: [Redacta con sentido profesional los hallazgos del retest proporcionados: "${data.retestResults}".]
Base de Datos: ${data.database}
Evidencia: ${data.evidence}
Resultado del retest: ${status}

No utilices Markdown (# o **), solo texto plano siguiendo exactamente este formato.`,
    config: { temperature: 0.2 }
  });
  return response.text;
};

export const generateRegressionTestCase = async (data: BugReport) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Actúa como un Senior QA Engineer experto en diseño de pruebas. Basado en el reporte de bug adjunto, genera un Caso de Prueba formal para futuras regresiones.

REGLAS:
1. Paso a paso claro y profesional.
2. Basado estrictamente en la descripción y resultados esperados/obtenidos.
3. Formato de texto plano.

Estructura obligatoria:

Nombre del Caso: [Título técnico basado en el bug]
Precondiciones:
- [Precondición 1]
- [Precondición 2]

Pasos de Ejecución:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3...]

Resultado Esperado: [Basado en "${data.expectedResult}"]

No utilices Markdown ni caracteres especiales, solo texto plano estructurado.`,
    config: { temperature: 0.2 }
  });
  return response.text;
};
