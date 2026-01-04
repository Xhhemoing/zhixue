
import { Injectable, signal, effect, inject } from '@angular/core';
import { StudyStoreService } from './study-store.service';

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string; // Optional, empty for default Google
  apiKey: string;
  models: string[];
}

export interface ModelAssignment {
  providerId: string;
  modelId: string;
}

export interface AppSettings {
  providers: AIProvider[];
  assignments: {
    ocr: ModelAssignment;
    reasoning: ModelAssignment;
    notes: ModelAssignment;
  };
  prompts: {
    ocr: string;
    analysis: string;
    notes: string;
  };
  subjects: string[];
  system: {
    language: string;
    theme: 'dark' | 'light';
  };
}

export const BUILTIN_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.0-flash-preview',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

const DEFAULT_PROVIDER_ID = 'google-official';

const DEFAULT_SETTINGS: AppSettings = {
  providers: [
    {
      id: DEFAULT_PROVIDER_ID,
      name: 'Google Official',
      baseUrl: '',
      apiKey: '', // Will fallback to env if empty in service
      models: BUILTIN_MODELS
    }
  ],
  assignments: {
    ocr: { providerId: DEFAULT_PROVIDER_ID, modelId: 'gemini-2.5-flash' },
    reasoning: { providerId: DEFAULT_PROVIDER_ID, modelId: 'gemini-2.5-flash' },
    notes: { providerId: DEFAULT_PROVIDER_ID, modelId: 'gemini-2.5-flash' }
  },
  prompts: {
    ocr: "Identify the subject (in Chinese). Determine question type (choice, indeterminate_choice, fill, short). Extract the question text exactly. Return JSON. Using LaTeX for ALL math (e.g. $x^2$). If it is a choice question, output each option separately.",
    analysis: "You are an expert tutor. 1. Provide the correct answer. 2. Explain the solution step-by-step using LaTeX for ALL math (e.g. $x^2$). 3. Analyze why the student might have made a mistake. 4. Output must be in Simplified Chinese.",
    notes: "Rewrite the following study notes to be concise, academic, and easy to review. Use LaTeX for math. Output in Simplified Chinese."
  },
  subjects: ['数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '语文'],
  system: {
    language: 'zh-CN',
    theme: 'dark'
  }
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settings = signal<AppSettings>(DEFAULT_SETTINGS);
  readonly builtInModels = BUILTIN_MODELS;
  
  private studyStore = inject(StudyStoreService);

  constructor() {
    this.loadSettings();
    
    effect(() => {
      localStorage.setItem('nexus_settings_v2', JSON.stringify(this.settings()));
    });
  }

  private loadSettings() {
    const stored = localStorage.getItem('nexus_settings_v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Merge to ensure new fields (like new prompts) exist if loading old data
        const merged = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            providers: parsed.providers?.map((p: any) => ({ ...{models: BUILTIN_MODELS}, ...p })) || DEFAULT_SETTINGS.providers,
            prompts: { ...DEFAULT_SETTINGS.prompts, ...parsed.prompts },
            assignments: { ...DEFAULT_SETTINGS.assignments, ...parsed.assignments }
        };
        
        this.settings.set(merged);
      } catch (e) {
        console.error("Failed to load settings", e);
        this.settings.set(DEFAULT_SETTINGS);
      }
    } else {
        // Migration from V1 settings if V2 doesn't exist
        const oldStored = localStorage.getItem('nexus_settings');
        if (oldStored) {
            try {
                const old = JSON.parse(oldStored);
                const migrated = { ...DEFAULT_SETTINGS };
                if (old.api?.key) {
                    migrated.providers[0].apiKey = old.api.key;
                    migrated.providers[0].baseUrl = old.api.baseUrl || '';
                }
                if (old.subjects) migrated.subjects = old.subjects;
                this.settings.set(migrated);
            } catch(e) {
                this.settings.set(DEFAULT_SETTINGS);
            }
        } else {
             this.settings.set(DEFAULT_SETTINGS);
        }
    }
  }

  // Provider Management
  addProvider(provider: Omit<AIProvider, 'id' | 'models'>) {
    this.settings.update(s => ({
        ...s,
        providers: [...s.providers, { ...provider, id: crypto.randomUUID(), models: [] }]
    }));
  }

  updateProvider(id: string, updates: Partial<AIProvider>) {
    this.settings.update(s => ({
        ...s,
        providers: s.providers.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }

  removeProvider(id: string) {
    if (id === DEFAULT_PROVIDER_ID) return; // Prevent deleting default
    this.settings.update(s => ({
        ...s,
        providers: s.providers.filter(p => p.id !== id)
    }));
  }

  getProvider(id: string): AIProvider | undefined {
      return this.settings().providers.find(p => p.id === id);
  }

  // Assignment Management
  updateAssignment(task: keyof AppSettings['assignments'], update: Partial<ModelAssignment>) {
      this.settings.update(s => ({
          ...s,
          assignments: {
              ...s.assignments,
              [task]: { ...s.assignments[task], ...update }
          }
      }));
  }

  // Prompt Management
  updatePrompt(key: keyof AppSettings['prompts'], value: string) {
    this.settings.update(s => ({
      ...s,
      prompts: { ...s.prompts, [key]: value }
    }));
  }
  
  // Subject Management
  addSubject(subject: string) {
    if (!subject) return;
    this.settings.update(s => ({
        ...s,
        subjects: [...new Set([...s.subjects, subject])]
    }));
  }
  
  removeSubject(subject: string) {
    this.settings.update(s => ({
        ...s,
        subjects: s.subjects.filter(sub => sub !== subject)
    }));
  }

  // Data Management
  exportData() {
    const data = {
      version: 3, 
      timestamp: Date.now(),
      mistakes: this.studyStore.mistakes(),
      notes: this.studyStore.notes(),
      folders: this.studyStore.folders(),
      settings: this.settings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
