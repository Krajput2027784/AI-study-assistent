export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  material_type: string;
  file_name: string;
  mime_type: string | null;
  file_size: number;
  created_at: string;
}

export interface MediaResource {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  kind: 'video' | 'audio';
  file_path: string | null;
  source_url: string | null;
  duration: number | null;
  created_at: string;
}

export interface QuizSummary {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  options: string[];
}

export interface Quiz extends QuizSummary {
  questions: QuizQuestion[];
}
