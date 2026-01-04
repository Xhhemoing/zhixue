
import { Injectable, signal, computed, effect } from '@angular/core';

export interface MistakeAnalysis {
  coreConcept: string;
  errorDiagnosis: string;
  correctMethod: string;
  tags: string[];
  difficultyRating: number;
}

export interface Mistake {
  id: string;
  subject: string;
  type: 'choice' | 'indeterminate_choice' | 'fill' | 'short';
  tags: string[];
  
  questionText: string;
  questionImage?: string; // Base64
  options?: string[]; // For MCQ choices [A, B, C, D]
  
  wrongAnswer: string;
  correctAnswer: string;
  explanation: string;
  aiDiagnosis: string;
  
  analysis: MistakeAnalysis;
  userNotes: string; // Reflection specific to this question
  
  addedAt: number;
  updatedAt?: number;
  nextReviewAt: number;
  reviewCount: number;
  difficultyRating: number;
}

export interface NoteVersion {
    id: string;
    timestamp: number;
    content: string;
    title: string;
    name?: string; // User defined name for the snapshot
}

export interface Note {
    id: string;
    folder: string;
    title: string;
    content: string; // Markdown
    tags: string[];
    createdAt: number;
    updatedAt: number;
    versions: NoteVersion[];
}

@Injectable({
  providedIn: 'root'
})
export class StudyStoreService {
  readonly mistakes = signal<Mistake[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly folders = signal<string[]>([]); // List of folder paths (e.g. "Math/Algebra")
  readonly activeTab = signal<string>('collect'); 
  
  // Edit State
  readonly editingMistake = signal<Mistake | null>(null);

  // Computed stats
  readonly totalMistakes = computed(() => this.mistakes().length);
  readonly dueReviews = computed(() => {
    const now = Date.now();
    return this.mistakes().filter(m => m.nextReviewAt <= now).length;
  });

  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
    this.isLoaded = true;
    
    // Save effects - Only run if loaded to prevent overwriting with initial empty state
    effect(() => {
      if (!this.isLoaded) return;
      localStorage.setItem('nexus_mistakes', JSON.stringify(this.mistakes()));
    });
    effect(() => {
      if (!this.isLoaded) return;
      localStorage.setItem('nexus_notes', JSON.stringify(this.notes()));
    });
    effect(() => {
      if (!this.isLoaded) return;
      localStorage.setItem('nexus_folders', JSON.stringify(this.folders()));
    });
  }

  private loadFromStorage() {
    const storedMistakes = localStorage.getItem('nexus_mistakes');
    const storedNotes = localStorage.getItem('nexus_notes');
    const storedFolders = localStorage.getItem('nexus_folders');
    
    let loadedMistakes: any[] = [];
    let loadedNotes: Note[] = [];
    let loadedFolders: string[] = [];

    if (storedMistakes) {
      try { loadedMistakes = JSON.parse(storedMistakes); } catch (e) { console.error(e); }
    }
    if (storedNotes) {
      try { loadedNotes = JSON.parse(storedNotes); } catch (e) { console.error(e); }
    }
    if (storedFolders) {
       try { loadedFolders = JSON.parse(storedFolders); } catch (e) { console.error(e); }
    }

    // MIGRATION: Check if mistakes contain old 'note' types and move them
    const notesToMigrate = loadedMistakes.filter(m => m.type === 'note');
    if (notesToMigrate.length > 0) {
        console.log(`Migrating ${notesToMigrate.length} notes to new storage structure...`);
        const migratedNotes: Note[] = notesToMigrate.map(m => ({
            id: m.id,
            folder: m.folder || '未分类',
            title: m.analysis?.coreConcept || '未命名笔记',
            content: m.userNotes || '',
            tags: m.tags || [],
            createdAt: m.addedAt,
            updatedAt: m.updatedAt || m.addedAt,
            versions: []
        }));
        loadedNotes = [...loadedNotes, ...migratedNotes];
        loadedMistakes = loadedMistakes.filter(m => m.type !== 'note');
    }

    this.mistakes.set(loadedMistakes);
    this.notes.set(loadedNotes);
    this.folders.set(loadedFolders);
  }

  // --- Mistake Operations ---

  addMistake(mistake: Omit<Mistake, 'id' | 'addedAt' | 'nextReviewAt' | 'reviewCount' | 'updatedAt'>) {
    const newMistake: Mistake = {
      ...mistake,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
      updatedAt: Date.now(),
      nextReviewAt: Date.now(),
      reviewCount: 0
    };
    this.mistakes.update(current => [newMistake, ...current]);
  }

  updateMistake(id: string, updates: Partial<Mistake>) {
    this.mistakes.update(current => current.map(m => {
      if (m.id === id) {
        return { ...m, ...updates, updatedAt: Date.now() };
      }
      return m;
    }));
  }

  deleteMistake(id: string) {
    this.mistakes.update(current => current.filter(m => m.id !== id));
  }

  scheduleNextReview(id: string, performance: 'good' | 'bad') {
    this.mistakes.update(current => current.map(m => {
      if (m.id !== id) return m;
      const baseDelay = 1000 * 60 * 60 * 24; // 1 day
      let multiplier = m.reviewCount + 1;
      if (performance === 'bad') multiplier = 0.5;
      return {
        ...m,
        reviewCount: m.reviewCount + 1,
        nextReviewAt: Date.now() + (baseDelay * multiplier)
      };
    }));
  }

  // --- Editing Flow ---
  startEditing(mistake: Mistake) {
    this.editingMistake.set(mistake);
    this.setTab('collect');
  }

  clearEditing() {
    this.editingMistake.set(null);
  }

  // --- Folder Operations ---
  
  ensureFolderExists(path: string) {
     if (!path || path === '未分类') return;
     this.folders.update(current => {
         // Add the path and all parent paths
         const newFolders = new Set(current);
         const parts = path.split('/');
         let accumulator = '';
         parts.forEach((part, i) => {
             accumulator += (i > 0 ? '/' : '') + part;
             newFolders.add(accumulator);
         });
         return Array.from(newFolders);
     });
  }
  
  setFolders(folders: string[]) {
      this.folders.set(folders);
  }

  // --- Note Operations ---

  addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) {
      const newNote: Note = {
          ...note,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          versions: []
      };
      
      if (note.folder) {
          this.ensureFolderExists(note.folder);
      }
      
      this.notes.update(curr => [newNote, ...curr]);
      return newNote.id; // Return ID for selection
  }

  updateNote(id: string, updates: Partial<Note>, saveVersion = false, versionName?: string) {
      this.notes.update(curr => curr.map(n => {
          if (n.id === id) {
              const updatedNote = { ...n, ...updates, updatedAt: Date.now() };
              
              if (updates.folder) {
                  this.ensureFolderExists(updates.folder);
              }

              if (saveVersion) {
                  const version: NoteVersion = {
                      id: crypto.randomUUID(),
                      timestamp: Date.now(),
                      content: n.content,
                      title: n.title,
                      name: versionName || `快照 ${new Date().toLocaleTimeString()}`
                  };
                  updatedNote.versions = [version, ...(n.versions || []).slice(0, 9)]; // Keep last 10 versions
              }
              return updatedNote;
          }
          return n;
      }));
  }
  
  deleteNoteVersion(noteId: string, versionId: string) {
      this.notes.update(curr => curr.map(n => {
          if (n.id === noteId) {
              return {
                  ...n,
                  versions: n.versions.filter(v => v.id !== versionId)
              };
          }
          return n;
      }));
  }

  deleteNote(id: string) {
      this.notes.update(curr => curr.filter(n => n.id !== id));
  }

  // --- System ---

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  importData(data: any[], strategy: 'replace' | 'merge' | 'keep_both', type: 'mistake' | 'note') {
    const targetSignal = type === 'mistake' ? this.mistakes : this.notes;
    
    if (strategy === 'replace') {
      targetSignal.set(data);
    } else if (strategy === 'merge') {
      // @ts-ignore
      const currentMap = new Map(targetSignal().map(m => [m.id, m]));
      data.forEach(m => currentMap.set(m.id, m));
      // @ts-ignore
      targetSignal.set(Array.from(currentMap.values()));
    } else {
      const newItems = data.map(m => ({...m, id: crypto.randomUUID()}));
      // @ts-ignore
      targetSignal.update(curr => [...curr, ...newItems]);
    }
  }
}
