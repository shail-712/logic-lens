export interface LogicStep {
  number: string;
  description: string;
  valid: boolean;
}

export interface TestCase {
  input: string;
  output: string;
  status: 'PASS' | 'FAIL';
}

export interface EdgeCase {
  title: string;
  description: string;
}

export interface AnalysisResult {
  steps: LogicStep[];
  testCases: TestCase[];
  edgeCases: EdgeCase[];
  interviewerNote: string;
  logicScore: number;
  sessionTitle: string;
}

export interface Session {
  id: string;
  title: string;
  timestamp: number;
  logicScore: number;
  userInput: string;
  result: AnalysisResult;
}

export interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
}

export interface InterviewMessage {
  role: 'user' | 'model';
  content: string;
}
