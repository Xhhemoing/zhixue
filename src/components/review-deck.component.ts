
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { StudyStoreService, Mistake } from '../services/study-store.service';

declare const marked: any;
declare const katex: any;

@Component({
  selector: 'app-review-deck',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col p-4 md:p-8 overflow-hidden">
      <header class="mb-4 md:mb-8 flex justify-between items-end shrink-0">
        <div>
          <h1 class="text-2xl font-semibold text-white tracking-tight">今日复习计划</h1>
          <p class="text-gray-400 text-sm mt-1">待复习: {{dueCount()}} 张卡片</p>
        </div>
        <div class="text-indigo-400 text-sm font-mono hidden md:block">
           SESSION: {{sessionId}}
        </div>
      </header>

      @if (currentCard()) {
        <!-- Main Card Area - Flex container to manage height -->
        <div class="flex-1 flex flex-col min-h-0 pb-16 md:pb-0">
           
           <!-- Card Body -->
           <div class="flex-1 bg-[#18181b] border border-gray-700 rounded-2xl p-4 md:p-8 shadow-2xl overflow-y-auto custom-scrollbar relative flex flex-col">
                
                <!-- Front (Question) -->
                <div class="mb-8 pb-8 flex-1">
                  <div class="flex justify-between mb-4">
                     <span class="text-xs font-bold text-gray-500 uppercase">题目</span>
                     <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{{currentCard()!.subject}}</span>
                  </div>
                  
                  @if (currentCard()!.questionImage) {
                    <div class="mb-6 rounded-lg overflow-hidden border border-gray-700 max-h-48 md:max-h-60 flex justify-center bg-gray-900">
                      <img [src]="currentCard()!.questionImage" class="h-full object-contain">
                    </div>
                  }
                  
                  <div class="text-lg text-gray-200 font-medium leading-relaxed font-serif whitespace-pre-wrap prose prose-invert max-w-none" [innerHTML]="renderMarkdown(currentCard()!.questionText)"></div>

                  <!-- MCQ Options Rendering -->
                  @if (currentCard()!.options && currentCard()!.options!.length > 0) {
                     <div class="mt-8 grid grid-cols-1 gap-3">
                        @for (opt of currentCard()!.options; track $index) {
                           <div class="p-3 border rounded-lg flex items-center gap-3 transition-colors"
                                [class.border-green-500]="isRevealed() && isCorrectOption(['A','B','C','D'][$index])"
                                [class.bg-green-900_20]="isRevealed() && isCorrectOption(['A','B','C','D'][$index])"
                                [class.border-gray-700]="!isRevealed() || !isCorrectOption(['A','B','C','D'][$index])">
                                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                      [class.bg-green-500]="isRevealed() && isCorrectOption(['A','B','C','D'][$index])"
                                      [class.text-white]="isRevealed() && isCorrectOption(['A','B','C','D'][$index])"
                                      [class.bg-gray-700]="!isRevealed() || !isCorrectOption(['A','B','C','D'][$index])"
                                      [class.text-gray-300]="!isRevealed() || !isCorrectOption(['A','B','C','D'][$index])">
                                   {{['A','B','C','D'][$index]}}
                                </span>
                                <span class="text-gray-300">{{opt}}</span>
                           </div>
                        }
                     </div>
                  }
                </div>

                <!-- Back (Answer) -->
                @if (isRevealed()) {
                  <div class="animate-slide-up pt-6 border-t border-gray-800">
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <span class="text-xs font-bold text-red-400 uppercase mb-2 block">你的错解</span>
                          <p class="text-gray-400 text-sm mb-4 font-mono bg-gray-900/50 p-2 rounded">{{currentCard()!.wrongAnswer}}</p>
                          <p class="text-gray-300 text-sm italic border-l-2 border-red-500/30 pl-3">
                             "{{currentCard()!.aiDiagnosis}}"
                          </p>
                        </div>
                        <div>
                          <span class="text-xs font-bold text-green-400 uppercase mb-2 block">正确答案</span>
                          <p class="text-white text-sm font-bold bg-green-900/20 p-2 rounded border border-green-900/50 mb-4">
                            {{currentCard()!.correctAnswer}}
                          </p>
                          <span class="text-xs font-bold text-gray-500 uppercase mb-1 block">详细解析</span>
                          <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none" [innerHTML]="renderMarkdown(currentCard()!.explanation)"></div>
                        </div>
                     </div>
                     
                     @if (currentCard()!.userNotes) {
                       <div class="mt-6 pt-4 border-t border-dashed border-gray-700">
                          <span class="text-xs font-bold text-indigo-400 uppercase mb-2 block">心得心得</span>
                          <div class="text-sm text-gray-400 prose prose-invert max-w-none" [innerHTML]="renderMarkdown(currentCard()!.userNotes)"></div>
                       </div>
                     }
                  </div>
                }
           </div>

           <!-- Action Area -->
           <div class="h-20 shrink-0 mt-6">
              @if (!isRevealed()) {
                <div class="flex items-center justify-center h-full">
                  <button (click)="reveal()" class="w-full md:w-auto px-12 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-105">
                    显示答案
                  </button>
                </div>
              } @else {
                <div class="grid grid-cols-3 gap-4 h-full animate-fade-in-up">
                  <button (click)="rate('bad')" class="bg-[#18181b] border border-gray-700 hover:border-red-500/50 hover:bg-red-900/10 rounded-xl flex flex-col items-center justify-center transition-all">
                    <span class="text-red-400 font-bold">忘记</span>
                  </button>
                  <button (click)="rate('good')" class="bg-[#18181b] border border-gray-700 hover:border-blue-500/50 hover:bg-blue-900/10 rounded-xl flex flex-col items-center justify-center transition-all">
                     <span class="text-blue-400 font-bold">模糊</span>
                  </button>
                  <button (click)="rate('good')" class="bg-[#18181b] border border-gray-700 hover:border-green-500/50 hover:bg-green-900/10 rounded-xl flex flex-col items-center justify-center transition-all">
                     <span class="text-green-400 font-bold">简单</span>
                  </button>
                </div>
              }
           </div>
        </div>
      } @else {
        <div class="flex-1 flex flex-col items-center justify-center text-center opacity-60">
           <h2 class="text-2xl font-bold text-gray-300">今日任务完成!</h2>
           <button (click)="store.setTab('collect')" class="mt-8 text-indigo-400 underline">去录入新题</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-slide-up { animation: slideUp 0.3s ease-out; }
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ReviewDeckComponent {
  store = inject(StudyStoreService);
  sanitizer: DomSanitizer = inject(DomSanitizer);
  sessionId = Math.random().toString(36).substring(7).toUpperCase();
  isRevealed = signal(false);
  
  dueCards = computed(() => {
    const now = Date.now();
    return this.store.mistakes().filter(m => m.nextReviewAt <= now).sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  });
  
  dueCount = computed(() => this.dueCards().length);
  currentCard = computed(() => this.dueCards().length > 0 ? this.dueCards()[0] : null);

  reveal() { this.isRevealed.set(true); }

  rate(rating: 'good' | 'bad') {
    if (this.currentCard()) {
      this.store.scheduleNextReview(this.currentCard()!.id, rating);
      this.isRevealed.set(false);
    }
  }

  isCorrectOption(opt: string): boolean {
    const correct = this.currentCard()?.correctAnswer?.toUpperCase() || '';
    return correct.includes(opt);
  }

  renderMarkdown(text: string | undefined) {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    
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
}
