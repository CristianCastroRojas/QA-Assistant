
export type Project = 'GETNET' | 'BPAGOS';
export type Action = 'reportar' | 'retest' | 'salir';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export enum AppStep {
  SELECT_PROJECT = 'SELECT_PROJECT',
  SELECT_ACTION = 'SELECT_ACTION',
  GATHERING_DATA = 'GATHERING_DATA',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}

export interface BugReport {
  version: string;
  browser: string;
  environment: string;
  description: string;
  expectedResult: string;
  obtainedResult: string;
  database: string;
  evidence: string;
}

export interface RetestReport {
  bugCode: string;
  version: string;
  browser: string;
  environment: string;
  description: string;
  retestResults: string;
  database: string;
  evidence: string;
  solved: 'Sí' | 'No';
}