import React from 'react';
import { Project } from './types';

export const THEMES = {
  GETNET: {
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    textPrimary: 'text-red-600',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    accent: 'ring-red-500'
  },
  BPAGOS: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    textPrimary: 'text-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'ring-blue-500'
  }
};

export const BROWSERS = [
  'Google Chrome',
  'Microsoft Edge',
  'Mozilla Firefox',
  'Apple Safari',
  'Opera Browser',
  'Brave Browser'
];

export const ENVIRONMENTS = {
  GETNET: [
    "Autorizador - GETNET EVO", "PayStudio - GETNET EVO", "Portal de Comercio - GETNET EVO",
    "Autorizador - GETNET FUTURE", "PayStudio - GETNET FUTURE", "Portal de Comercio - GETNET FUTURE",
    "Autorizador - GETNET RELEASE", "PayStudio - GETNET RELEASE", "Portal de Comercio - GETNET RELEASE",
    "Autorizador - GETNET HOTFIX", "PayStudio - GETNET HOTFIX", "Portal de Comercio - GETNET HOTFIX",
    "Autorizador - GETNET CERT", "PayStudio - GETNET CERT", "Portal de Comercio - GETNET CERT",
    "Autorizador - GETNET PREPROD", "PayStudio - GETNET PREPROD", "Portal de Comercio - GETNET PREPROD",
    "Autorizador - GETNET UAT", "PayStudio - GETNET UAT", "Portal de Comercio - GETNET UAT"
  ],
  BPAGOS: [
    "Autorizador - BPAGOS EVO", "PayStudio - BPAGOS EVO", "Portal de Comercio - BPAGOS EVO",
    "Autorizador - BPAGOS FUTURE", "PayStudio - BPAGOS FUTURE", "Portal de Comercio - BPAGOS FUTURE",
    "Autorizador - BPAGOS RELEASE", "PayStudio - BPAGOS RELEASE", "Portal de Comercio - BPAGOS RELEASE",
    "Autorizador - BPAGOS HOTFIX", "PayStudio - BPAGOS HOTFIX", "Portal de Comercio - BPAGOS HOTFIX",
    "Autorizador - BPAGOS CERT", "PayStudio - BPAGOS CERT", "Portal de Comercio - BPAGOS CERT",
    "Autorizador - BPAGOS UAT", "PayStudio - BPAGOS UAT", "Portal de Comercio - BPAGOS UAT"
  ]
};

export const QUESTIONS_REPORT = [
  "¿Cuál es la versión de la aplicación?",
  "¿Qué navegador estás utilizando?",
  "¿En qué ambiente estás probando? (ej: QA, staging, producción)",
  "Describe el problema que encontraste.",
  "¿Qué resultado esperabas?",
  "¿Qué resultado obtuviste?",
  "¿Qué base de datos se está utilizando?",
  "Adjunta o describe la evidencia (captura, video, logs, etc.)"
];

export const QUESTIONS_RETEST = [
  "¿Cuál es el nombre o código del bug original?",
  "¿Cuál es la versión de la aplicación en la que hiciste el retest?",
  "¿Qué navegador estás utilizando?",
  "¿En qué ambiente estás probando?",
  "Describe brevemente el problema original.",
  "¿Qué resultados obtuviste al hacer el retest?",
  "¿Qué base de datos estás usando?",
  "Adjunta o describe la evidencia del retest.",
  "¿El bug fue solucionado? (Responde: Sí o No)"
];
