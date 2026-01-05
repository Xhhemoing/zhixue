
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { GeminiService } from '../services/gemini.service';
import { StudyStoreService } from '../services/study-store.service';
import { SettingsService } from '../services/settings.service';

declare const marked: any;
declare const katex: any;

@Component({
  selector: 'app-mistake-ingest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="h-full flex flex-col bg-gray-950 overflow-hidden" 
      (dragover)="onDragOver($event)" 
      (drop)="onDrop($event)"
      (paste)="onPaste($event)"
    >
      <!-- Header -->
      <header class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 md:px-8 pt-4 pb-0 z-20">
         <div class="flex items-center justify-between mb-2">
            <h1 class="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {{ store.editingMistake() ? '编辑错题' : '错题录入' }}
                @if(store.editingMistake()) {
                    <span class="text-xs bg-amber-900/40 text-amber-400 border border-amber-900/50 px-2 py-0.5 rounded">修改模式</span>
                }
            </h1>
            <div class="text-[10px] md:text-xs text-gray-500 hidden md:block">支持拖拽图片或直接 Ctrl+V 粘贴</div>
            <div class="flex gap-2">
                <button (click)="toggleMobilePreview()" class="md:hidden text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded border border-gray-700">
                    {{ showMobilePreview() ? '返回编辑' : '查看预览' }}
                </button>
                <button (click)="reset()" class="text-xs text-gray-500 hover:text-white transition-colors">
                    {{ store.editingMistake() ? '取消' : '清空' }}
                </button>
            </div>
         </div>
         <div class="flex gap-4 md:gap-8 overflow-x-auto">
            <button (click)="step.set(1)" class="pb-3 px-2 border-b-2 transition-colors relative group outline-none shrink-0"
               [class.border-indigo-500]="step() === 1" [class.text-indigo-400]="step() === 1"
               [class.border-transparent]="step() !== 1" [class.text-gray-400]="step() !== 1">
               <span class="font-bold text-sm">1. 录入</span>
            </button>
            <button (click)="step.set(2)" class="pb-3 px-2 border-b-2 transition-colors relative group outline-none shrink-0"
               [class.border-indigo-500]="step() === 2" [class.text-indigo-400]="step() === 2"
               [class.border-transparent]="step() !== 2" [class.text-gray-400]="step() !== 2">
               <span class="font-bold text-sm">2. 分析</span>
            </button>
            <button (click)="step.set(3)" class="pb-3 px-2 border-b-2 transition-colors relative group outline-none shrink-0"
               [class.border-indigo-500]="step() === 3" [class.text-indigo-400]="step() === 3"
               [class.border-transparent]="step() !== 3" [class.text-gray-400]="step() !== 3">
               <span class="font-bold text-sm">3. 心得</span>
            </button>
         </div>
      </header>

      <!-- Main Content Split Pane -->
      <div class="flex-1 flex overflow-hidden relative" (mouseup)="stopResize()" (mouseleave)="stopResize()">
        
        <!-- LEFT: Input Area (Hidden on mobile if preview is active) -->
        <div class="overflow-y-auto p-4 md:p-8 bg-gray-950 custom-scrollbar w-full md:w-auto" 
             [class.hidden]="showMobilePreview()"
             [style.width.%]="isDesktop ? leftWidth : 100">
            
            <!-- STEP 1: INPUT -->
            @if (step() === 1) {
               <div class="space-y-6 max-w-2xl mx-auto animate-fade-in pb-20 md:pb-0">
                  
                  <!-- File Upload Box -->
                  <div class="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition-colors cursor-pointer relative group bg-gray-900/30" (click)="fileInput.click()">
                       <input #fileInput type="file" accept="image/*" class="hidden" (change)="handleImageUpload($event)">
                       @if (questionImage()) {
                          <img [src]="questionImage()" class="max-h-48 mx-auto rounded shadow-lg object-contain">
                          <button class="mt-2 text-xs text-indigo-400 underline hover:text-indigo-300" (click)="$event.stopPropagation(); fileInput.click()">更换图片</button>
                       } @else {
                          <div class="text-gray-500 group-hover:text-indigo-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" class="mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                             点击上传 / 拖拽 / 粘贴图片
                          </div>
                       }
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">科目</label>
                      <div class="relative">
                        <select [(ngModel)]="subject" class="appearance-none w-full bg-[#18181b] hover:bg-[#202025] border border-gray-700 rounded p-2 text-white outline-none focus:border-indigo-500 transition-colors text-sm">
                           <option value="" selected>AI 自动识别</option>
                           @for(sub of settings.settings().subjects; track sub) { <option [value]="sub">{{sub}}</option> }
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">题型</label>
                      <div class="relative">
                        <select [(ngModel)]="questionType" class="appearance-none w-full bg-[#18181b] hover:bg-[#202025] border border-gray-700 rounded p-2 text-white outline-none focus:border-indigo-500 transition-colors text-sm">
                          <option value="" selected>AI 自动识别</option>
                          <option value="choice">单选题</option>
                          <option value="indeterminate_choice">不定项选择</option>
                          <option value="fill">填空题</option>
                          <option value="short">简答题</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">题目内容</label>
                     <textarea [(ngModel)]="questionText" rows="5" class="w-full bg-[#18181b] hover:bg-[#202025] border border-gray-700 rounded p-3 text-gray-200 outline-none focus:border-indigo-500 transition-colors font-mono text-sm leading-relaxed" placeholder="支持 Markdown 和 LaTeX 公式..."></textarea>
                  </div>

                  <!-- MCQ Options -->
                  @if (questionType() === 'choice' || questionType() === 'indeterminate_choice') {
                    <div class="space-y-2 p-4 bg-[#18181b] rounded-lg border border-gray-700">
                       <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">选项内容</label>
                       @for (opt of ['A','B','C','D']; track $index) {
                          <div class="flex items-center gap-2">
                             <span class="text-xs font-mono text-gray-500 w-4 font-bold">{{opt}}.</span>
                             <input [(ngModel)]="mcqOptions[$index]" placeholder="选项 {{opt}}..." class="flex-1 bg-gray-950 border border-gray-700 rounded p-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors">
                          </div>
                       }
                    </div>
                  }
                  
                  <div>
                      <label class="block text-xs font-bold text-red-400 mb-1 uppercase tracking-wide">我的错解</label>
                      <input [(ngModel)]="wrongAnswer" placeholder="例如: A, 或具体的数值" class="w-full bg-[#18181b] hover:bg-[#202025] border border-red-900/30 focus:border-red-500/50 rounded p-3 text-gray-200 outline-none font-mono text-sm transition-colors">
                  </div>

                  <div class="flex justify-end pt-4">
                    <button (click)="analyze()" [disabled]="isProcessing() || !questionText()" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20">
                       @if (isProcessing()) { <span class="animate-spin">⟳</span> } 
                       {{ isProcessing() ? '分析中...' : '开始智能分析' }}
                    </button>
                  </div>
               </div>
            }

            <!-- STEP 2: ANALYSIS -->
            @if (step() === 2) {
               <div class="space-y-6 max-w-2xl mx-auto animate-fade-in pb-20 md:pb-0">
                  <div>
                    <label class="block text-xs font-bold text-green-500 mb-1 uppercase tracking-wide">正确答案</label>
                    <input [(ngModel)]="analysisData.correctAnswer" class="w-full bg-[#18181b] border border-gray-700 rounded p-2 text-white font-mono outline-none focus:border-green-500 transition-colors">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">详细解析</label>
                    <textarea [(ngModel)]="analysisData.explanation" rows="8" class="w-full bg-[#18181b] border border-gray-700 rounded p-3 text-gray-200 outline-none focus:border-indigo-500 leading-relaxed text-sm transition-colors"></textarea>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-red-400 mb-1 uppercase tracking-wide">错误诊断</label>
                    <textarea [(ngModel)]="analysisData.errorDiagnosis" rows="3" class="w-full bg-[#18181b] border border-red-900/30 rounded p-3 text-gray-200 outline-none focus:border-red-500/50 text-sm transition-colors"></textarea>
                  </div>
                  <div class="flex justify-end pt-4">
                     <button (click)="step.set(3)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">下一步</button>
                  </div>
               </div>
            }

            <!-- STEP 3: REFLECTIONS -->
            @if (step() === 3) {
               <div class="space-y-6 max-w-2xl mx-auto animate-fade-in pb-20 md:pb-0">
                  <div class="flex justify-between items-center">
                     <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wide">解题心得 / 启发 (非笔记)</h3>
                     <button (click)="polishNotes()" [disabled]="isPolishing()" class="text-xs text-indigo-400 hover:text-white transition-colors disabled:opacity-50">{{ isPolishing() ? '生成中...' : 'AI 润色' }}</button>
                  </div>
                  <textarea [(ngModel)]="userNotes" rows="12" class="w-full bg-[#18181b] border border-gray-700 rounded p-4 text-gray-200 outline-none focus:border-indigo-500 text-sm leading-relaxed transition-colors" placeholder="记录这道题的陷阱或者关键点..."></textarea>
                  <div class="flex justify-end pt-4">
                     <button (click)="save()" class="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all transform hover:scale-105">
                        {{ store.editingMistake() ? '确认修改' : '保存错题' }}
                     </button>
                  </div>
               </div>
            }
        </div>

        <!-- DIVIDER (Desktop Only) -->
        <div class="hidden md:flex w-1 bg-gray-800 hover:bg-indigo-500 cursor-col-resize items-center justify-center transition-colors z-10" (mousedown)="startResize($event)">
           <div class="w-0.5 h-8 bg-gray-600 rounded"></div>
        </div>

        <!-- RIGHT: Preview Area -->
        <div class="flex-1 bg-gray-900 border-l border-gray-800 flex flex-col md:block" 
             [class.hidden]="!showMobilePreview() && !isDesktop"
             [style.width.%]="isDesktop ? (100 - leftWidth) : 100">
             
           <div class="h-10 border-b border-gray-800 flex items-center px-4 bg-[#18181b] shrink-0">
              <span class="text-xs font-bold text-gray-500 uppercase">实时预览</span>
              <button (click)="toggleMobilePreview()" class="ml-auto md:hidden text-gray-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
           </div>
           
           <div class="flex-1 overflow-y-auto p-4 md:p-8 prose prose-invert prose-sm max-w-none custom-scrollbar bg-gray-900 h-full">
              @if (step() === 1) {
                 <div class="text-xs text-gray-500 mb-2 font-bold uppercase">题目</div>
                 <div [innerHTML]="renderMarkdown(questionText())"></div>
                 @if (hasMcqOptions) {
                    <ul class="list-none pl-0 space-y-1 mt-4">
                       @for(opt of mcqOptions; track $index) {
                          @if(opt) { <li class="text-gray-400 flex items-start gap-2"><strong class="text-gray-500 shrink-0">{{['A','B','C','D'][$index]}}.</strong> <span [innerHTML]="renderMarkdown(opt)"></span></li> }
                       }
                    </ul>
                 }
              }
              @if (step() === 2) {
                 <div class="mb-6 opacity-50">
                    <div [innerHTML]="renderMarkdown(questionText())"></div>
                 </div>
                 <div class="p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
                    <div class="text-xs text-green-400 font-bold mb-2 uppercase">解析</div>
                    <div class="font-bold mb-2 text-white">Ans: {{analysisData.correctAnswer}}</div>
                    <div [innerHTML]="renderMarkdown(analysisData.explanation)"></div>
                 </div>
              }
              @if (step() === 3) {
                 <div class="text-xs text-indigo-400 font-bold mb-2 uppercase">心得预览</div>
                 <div [innerHTML]="renderMarkdown(userNotes())"></div>
              }
           </div>
        </div>

      </div>
    </div>
  `
})
export class MistakeIngestComponent {
  gemini = inject(GeminiService);
  store = inject(StudyStoreService);
  settings = inject(SettingsService);
  sanitizer: DomSanitizer = inject(DomSanitizer);

  step = signal<1 | 2 | 3>(1);
  isProcessing = signal(false);
  isPolishing = signal(false);
  
  // Mobile State
  showMobilePreview = signal(false);
  isDesktop = window.innerWidth >= 768;

  // Layout
  leftWidth = 50;
  private isResizing = false;

  // Data
  questionImage = signal<string | null>(null);
  subject = signal('');
  questionType = signal<'choice' | 'indeterminate_choice' | 'fill' | 'short' | ''>(''); // Allow empty for AI detection
  questionText = signal('');
  mcqOptions = ['', '', '', '']; // A, B, C, D
  wrongAnswer = signal('');
  
  analysisData = {
      correctAnswer: '',
      explanation: '',
      errorDiagnosis: '',
      coreConcept: '',
      tags: [] as string[],
      difficultyRating: 3
  };
  
  tagsString = signal('');
  userNotes = signal('');

  constructor() {
    // Global mouse move for resizing
    window.addEventListener('mousemove', (e) => {
      if (this.isResizing) {
        const percent = (e.clientX / window.innerWidth) * 100;
        if (percent > 20 && percent < 80) this.leftWidth = percent;
      }
    });
    window.addEventListener('resize', () => {
        this.isDesktop = window.innerWidth >= 768;
    });

    // Listen for Edit Mode
    effect(() => {
        const editing = this.store.editingMistake();
        if (editing) {
            this.step.set(1); 
            this.questionImage.set(editing.questionImage || null);
            this.subject.set(editing.subject);
            this.questionType.set(editing.type);
            this.questionText.set(editing.questionText);
            
            // Populate options
            this.mcqOptions = ['', '', '', ''];
            if (editing.options) {
                editing.options.forEach((opt, i) => { if(i<4) this.mcqOptions[i] = opt; });
            }

            this.wrongAnswer.set(editing.wrongAnswer);
            this.userNotes.set(editing.userNotes);
            
            this.analysisData = {
                correctAnswer: editing.correctAnswer,
                explanation: editing.explanation,
                errorDiagnosis: editing.aiDiagnosis,
                coreConcept: editing.analysis.coreConcept,
                tags: editing.tags,
                difficultyRating: editing.difficultyRating
            };
            this.tagsString.set(editing.tags.join(', '));
        }
    });
  }

  toggleMobilePreview() {
      this.showMobilePreview.update(v => !v);
  }

  // Getter to fix template error
  get hasMcqOptions() {
    return this.mcqOptions.some(o => !!o);
  }

  // Drag & Drop / Paste Logic
  onDragOver(e: DragEvent) { e.preventDefault(); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.processFile(file);
  }
  onPaste(e: ClipboardEvent) {
    const file = e.clipboardData?.files[0];
    if (file && file.type.startsWith('image/')) this.processFile(file);
  }
  processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => this.processImageBase64(e.target?.result as string);
    reader.readAsDataURL(file);
  }
  handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }
  
  async processImageBase64(base64: string) {
    this.questionImage.set(base64);
    this.isProcessing.set(true);
    try {
        const result = await this.gemini.recognizeQuestionFromImage(base64.split(',')[1]);
        this.questionText.set(result.questionText);
        // Auto-fill logic
        if (!this.subject() && result.subject) this.subject.set(result.subject);
        if (!this.questionType() && result.type) this.questionType.set(result.type as any);
        
        // Fill options if detected
        if (result.options && Array.isArray(result.options)) {
             // Reset options first
             this.mcqOptions = ['', '', '', ''];
             result.options.forEach((opt: string, i: number) => {
                 if (i < 4) this.mcqOptions[i] = opt;
             });
        }
    } catch(e) {
        console.error(e);
        alert('Could not recognize image.');
    } finally { this.isProcessing.set(false); }
  }

  // Resizable Logic
  startResize(e: MouseEvent) { this.isResizing = true; }
  stopResize() { this.isResizing = false; }
  
  updateTags(val: string) {
      this.tagsString.set(val);
      this.analysisData.tags = val.split(/[,，、]/).map(t => t.trim()).filter(t => t);
  }

  renderMarkdown(text: string) {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('<span class="text-gray-600 italic">...</span>');
    
    const mathBlocks: {tex: string, display: boolean}[] = [];
    
    // Protect $$...$$ blocks first
    let protectedText = String(text).replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
        mathBlocks.push({ tex: content, display: true });
        return `@@MATH_${mathBlocks.length - 1}@@`;
    });

    // Protect $...$ inline blocks
    protectedText = protectedText.replace(/\$([^$]+?)\$/g, (match, content) => {
        mathBlocks.push({ tex: content, display: false });
        return `@@MATH_${mathBlocks.length - 1}@@`;
    });

    let html = '';
    try {
        html = marked.parse(protectedText);

        // Restore and render KaTeX
        html = html.replace(/<p>@@MATH_(\d+)@@<\/p>/g, (match, indexStr) => {
            const index = parseInt(indexStr, 10);
            const block = mathBlocks[index];
            if (block && block.display) {
                try {
                    return katex.renderToString(block.tex, { throwOnError: false, displayMode: true });
                } catch (e) { console.error('KaTeX block rendering error:', e); return match; }
            }
            return `@@MATH_${index}@@`;
        });

        html = html.replace(/@@MATH_(\d+)@@/g, (match, indexStr) => {
            const index = parseInt(indexStr, 10);
            const block = mathBlocks[index];
            if (block) {
                try {
                    return katex.renderToString(block.tex, { throwOnError: false, displayMode: block.display });
                } catch (e) { console.error('KaTeX inline rendering error:', e); return match; }
            }
            return match;
        });
    } catch (e) {
        console.warn('Markdown parsing error:', e);
        return this.sanitizer.bypassSecurityTrustHtml(String(text).replace(/</g, '&lt;'));
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  async analyze() {
    this.isProcessing.set(true);
    try {
      const result = await this.gemini.solveAndAnalyze(
        this.questionText(),
        this.wrongAnswer() || "No answer provided",
        this.subject() || "General",
        this.questionImage() ? this.questionImage()!.split(',')[1] : undefined
      );
      this.analysisData = result;
      this.tagsString.set(result.tags.join(', '));
      this.step.set(2);
    } catch (e) { alert('API Error'); } finally { this.isProcessing.set(false); }
  }

  async polishNotes() {
    this.isPolishing.set(true);
    try {
      const polished = await this.gemini.polishNotes(this.userNotes(), this.subject());
      this.userNotes.set(polished);
    } finally { this.isPolishing.set(false); }
  }

  save() {
    const dataToSave = {
      subject: this.subject() || 'General',
      type: (this.questionType() as any) || 'short',
      tags: this.analysisData.tags,
      questionText: this.questionText(),
      questionImage: this.questionImage() || undefined,
      options: this.mcqOptions.filter(o => o), // Store clean options
      wrongAnswer: this.wrongAnswer(),
      correctAnswer: this.analysisData.correctAnswer,
      explanation: this.analysisData.explanation,
      aiDiagnosis: this.analysisData.errorDiagnosis,
      userNotes: this.userNotes(),
      difficultyRating: this.analysisData.difficultyRating,
      analysis: {
        coreConcept: this.analysisData.coreConcept,
        errorDiagnosis: this.analysisData.errorDiagnosis,
        correctMethod: this.analysisData.explanation,
        tags: this.analysisData.tags,
        difficultyRating: this.analysisData.difficultyRating
      }
    };

    if (this.store.editingMistake()) {
        // Update existing
        this.store.updateMistake(this.store.editingMistake()!.id, dataToSave);
    } else {
        // Create new
        this.store.addMistake(dataToSave);
    }

    this.reset();
    this.store.setTab('library');
  }

  reset() {
    this.step.set(1);
    this.questionText.set('');
    this.questionImage.set(null);
    this.wrongAnswer.set('');
    this.userNotes.set('');
    this.mcqOptions = ['', '', '', ''];
    this.tagsString.set('');
    this.analysisData = { correctAnswer: '', explanation: '', errorDiagnosis: '', coreConcept: '', tags: [], difficultyRating: 3 };
    this.store.clearEditing();
  }
}
