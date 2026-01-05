
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { StudyStoreService, Mistake } from '../services/study-store.service';
import { SettingsService } from '../services/settings.service';

declare const marked: any;
declare const katex: any;

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#0B0F19] p-4 md:p-6 relative">
      <!-- Header / Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
         <div>
            <h1 class="text-2xl font-bold text-white tracking-tight">错题分析库</h1>
            <p class="text-gray-400 text-xs mt-1">已收录 {{store.totalMistakes()}} 题</p>
         </div>
         <div class="flex flex-wrap items-center gap-4 bg-[#18181b] p-2 rounded-xl border border-gray-700 w-full md:w-auto">
            <!-- View Toggle & Slider -->
            <div class="flex items-center gap-2 bg-[#111827] rounded-lg p-1 border border-gray-700">
               <button (click)="viewMode.set('list')" [class.bg-gray-700]="viewMode() === 'list'" class="p-1.5 rounded text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
               </button>
               <button (click)="viewMode.set('grid')" [class.bg-gray-700]="viewMode() === 'grid'" class="p-1.5 rounded text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
               </button>
               
               <!-- Size Slider (Visible in Grid Mode) -->
               @if (viewMode() === 'grid') {
                   <div class="w-px h-4 bg-gray-700 mx-1"></div>
                   <div class="flex items-center gap-2 px-1">
                      <span class="text-[10px] text-gray-500">A-</span>
                      <input type="range" min="150" max="400" step="10" 
                            [ngModel]="cardSize()" (input)="updateCardSize($event)"
                            class="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                      <span class="text-[10px] text-gray-500">A+</span>
                   </div>
               }
            </div>

            <select [(ngModel)]="filterSubject" class="bg-transparent text-xs text-white outline-none">
               <option value="">全科目</option>
               @for(sub of settings.settings().subjects; track sub) { <option [value]="sub">{{sub}}</option> }
            </select>
            <input [(ngModel)]="searchQuery" placeholder="搜索..." class="bg-[#111827] border border-gray-700 rounded px-3 py-1 text-xs text-white outline-none flex-1 md:w-40">
         </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-[#111827] p-1 custom-scrollbar pb-16 md:pb-1">
         
         <!-- LIST VIEW -->
         @if (viewMode() === 'list') {
            <table class="w-full text-left text-sm text-gray-400">
               <thead class="bg-[#18181b] text-xs uppercase text-gray-500 sticky top-0 z-10 shadow-sm hidden md:table-header-group">
                  <tr>
                     <th class="px-6 py-3 font-medium">题目</th>
                     <th class="px-6 py-3 font-medium">科目</th>
                     <th class="px-6 py-3 font-medium">标签</th>
                     <th class="px-6 py-3 font-medium">时间</th>
                     <th class="px-6 py-3 font-medium text-right">操作</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-800">
                  @for (mistake of filteredMistakes(); track mistake.id) {
                     <tr class="hover:bg-[#1f2937] transition-colors cursor-pointer flex flex-col md:table-row p-4 border-b border-gray-800 md:border-none" (click)="openDetail(mistake)">
                        <td class="md:px-6 md:py-3 mb-2 md:mb-0 block md:table-cell">
                           <div class="flex items-center gap-3">
                              @if (mistake.questionImage) { <img [src]="mistake.questionImage" class="w-12 h-12 md:w-8 md:h-8 object-cover rounded bg-black shrink-0"> }
                              <div class="max-w-xs text-gray-200 text-sm font-medium markdown-inline" [innerHTML]="renderMarkdown(mistake.questionText)"></div>
                           </div>
                        </td>
                        <td class="md:px-6 md:py-3 block md:table-cell text-xs mb-1 md:mb-0"><span class="px-2 py-0.5 rounded bg-indigo-900/20 text-indigo-400 border border-indigo-900/30">{{mistake.subject}}</span></td>
                        <td class="md:px-6 md:py-3 block md:table-cell mb-1 md:mb-0">
                           <div class="flex flex-wrap gap-1">
                              @for(tag of mistake.tags.slice(0,3); track tag) { <span class="text-[10px] bg-gray-800 px-1 rounded">{{tag}}</span> }
                           </div>
                        </td>
                        <td class="md:px-6 md:py-3 text-xs block md:table-cell text-gray-500">{{formatDate(mistake.addedAt)}}</td>
                        <td class="md:px-6 md:py-3 md:text-right block md:table-cell mt-2 md:mt-0">
                           <button (click)="$event.stopPropagation(); delete(mistake.id)" class="text-gray-600 hover:text-red-400 px-3 py-1 md:p-0 border md:border-none rounded"><span class="md:hidden text-xs mr-1">删除</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </td>
                     </tr>
                  }
               </tbody>
            </table>
         }

         <!-- GRID VIEW -->
         @if (viewMode() === 'grid') {
            <!-- Use responsive-grid class instead of md:grid-cols-auto-fill to allow custom CSS to work -->
            <div class="grid p-4 gap-4 grid-cols-2 responsive-grid" [style.--card-size]="cardSize() + 'px'">
               @for (mistake of filteredMistakes(); track mistake.id) {
                  <div (click)="openDetail(mistake)" class="aspect-[3/4] bg-[#18181b] border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-all cursor-pointer flex flex-col group relative">
                     <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <button (click)="$event.stopPropagation(); delete(mistake.id)" class="p-1 bg-red-900/80 rounded text-white hover:bg-red-800"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                     </div>
                     <div class="h-1/2 bg-gray-950 relative overflow-hidden flex items-center justify-center">
                        @if (mistake.questionImage) {
                           <img [src]="mistake.questionImage" class="w-full h-full object-contain">
                        } @else {
                           <div class="w-full h-full flex items-center justify-center text-gray-700 font-serif text-4xl">?</div>
                        }
                        
                        @if(mistake.diagramSVG) {
                           <div class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-indigo-600/80 text-[9px] text-white rounded shadow-sm border border-indigo-400/30 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                                SVG
                           </div>
                        }

                        <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[10px] text-white rounded backdrop-blur-sm shadow-sm">{{mistake.subject}}</div>
                     </div>
                     <div class="flex-1 p-3 flex flex-col">
                        <!-- Use innerHTML for markdown rendering in card summary -->
                        <div class="text-xs text-gray-300 font-medium line-clamp-3 mb-2 leading-relaxed markdown-inline" [innerHTML]="renderMarkdown(mistake.questionText)"></div>
                        <div class="mt-auto flex flex-wrap gap-1">
                           @for(tag of mistake.tags.slice(0,2); track tag) { <span class="text-[9px] text-gray-400 bg-gray-800 px-1 rounded border border-gray-700">{{tag}}</span> }
                        </div>
                     </div>
                  </div>
               }
            </div>
         }
      </div>

      <!-- DETAIL MODAL -->
      @if (selectedMistake()) {
         <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-200">
            <div class="bg-[#18181b] w-full max-w-5xl h-full md:h-[90vh] md:rounded-2xl border border-gray-700 flex flex-col shadow-2xl overflow-hidden">
               <!-- Modal Header -->
               <div class="h-14 border-b border-gray-700 flex items-center justify-between px-4 md:px-6 bg-[#111827] shrink-0">
                  <div class="flex items-center gap-4">
                     <h2 class="text-white font-bold text-lg">详情</h2>
                     <button (click)="triggerEdit()" class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition-colors flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span class="hidden md:inline">完整编辑</span>
                        <span class="md:hidden">编辑</span>
                     </button>
                  </div>
                  <button (click)="closeDetail()" class="text-gray-400 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
               </div>
               
               <!-- Modal Body -->
               <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
                  <!-- VIEW MODE -->
                  <div class="w-full flex flex-col md:flex-row h-full">
                      <!-- Left: Question -->
                      <div class="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-800 bg-[#0B0F19] overflow-y-auto">
                          <div class="mb-4">
                              <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">题目 ({{selectedMistake()?.subject}})</span>
                          </div>
                          
                          <!-- Render Restored SVG Diagram if available -->
                          @if(selectedMistake()?.diagramSVG && selectedMistake()?.showRestoredImage) {
                             <div class="mb-6 rounded-lg overflow-hidden border border-indigo-500/30 bg-[#fff]/95 p-6 flex justify-center shadow-xl shadow-indigo-900/10">
                                <div class="max-h-64 w-full flex items-center justify-center [&>svg]:max-h-64 [&>svg]:w-auto text-black" [innerHTML]="renderSafeHtml(selectedMistake()?.diagramSVG!)"></div>
                             </div>
                             <div class="text-xs text-indigo-400 mb-6 text-center italic">↑ AI 复刻矢量图</div>
                          } 
                          
                          @if (selectedMistake()?.questionImage && selectedMistake()?.showOriginalImage) {
                              <div class="mb-6 rounded-lg overflow-hidden border border-gray-700 bg-black flex justify-center">
                                  <img [src]="selectedMistake()?.questionImage" class="max-h-80 w-auto object-contain">
                              </div>
                          }
                          
                          <div class="text-lg text-gray-200 font-serif leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none" [innerHTML]="renderMarkdown(selectedMistake()?.questionText)"></div>
                          
                          @if (selectedMistake()?.options && selectedMistake()?.options!.length > 0) {
                              <div class="mt-6 space-y-2">
                                  @for(opt of selectedMistake()?.options; track $index) {
                                      <div class="p-3 border rounded-lg text-sm text-gray-300 flex"
                                          [class.border-green-800]="isCorrectAnswer(['A','B','C','D'][$index])"
                                          [class.bg-green-900_20]="isCorrectAnswer(['A','B','C','D'][$index])"
                                          [class.border-gray-700]="!isCorrectAnswer(['A','B','C','D'][$index])">
                                          <span class="font-bold mr-2 shrink-0" 
                                               [class.text-green-400]="isCorrectAnswer(['A','B','C','D'][$index])"
                                               [class.text-gray-500]="!isCorrectAnswer(['A','B','C','D'][$index])">{{['A','B','C','D'][$index]}}.</span> 
                                          <!-- Render Markdown for options -->
                                          <div class="markdown-inline" [innerHTML]="renderMarkdown(opt)"></div>
                                      </div>
                                  }
                              </div>
                          }
                      </div>
                      <!-- Right: Answer & Analysis -->
                      <div class="flex-1 p-6 md:p-8 bg-[#111827] overflow-y-auto">
                          <div class="space-y-8">
                              <div>
                                  <span class="text-xs font-bold text-red-400 uppercase tracking-wide block mb-2">错解</span>
                                  @if (selectedMistake()?.wrongAnswer) {
                                     <div class="p-3 bg-red-900/10 border border-red-900/30 rounded text-gray-300 text-sm font-mono">{{selectedMistake()?.wrongAnswer}}</div>
                                  } @else {
                                     <div class="text-gray-500 text-sm italic">无错解记录</div>
                                  }
                              </div>
                              <div>
                                  <span class="text-xs font-bold text-green-400 uppercase tracking-wide block mb-2">正解 & 解析</span>
                                  <div class="mb-2 text-white font-bold text-lg">{{selectedMistake()?.correctAnswer}}</div>
                                  <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none" [innerHTML]="renderMarkdown(selectedMistake()?.explanation)"></div>
                              </div>
                              @if (selectedMistake()?.userNotes) {
                                  <div class="pt-6 border-t border-gray-800">
                                      <span class="text-xs font-bold text-indigo-400 uppercase tracking-wide block mb-2">心得</span>
                                      <div class="text-gray-400 text-sm italic prose prose-invert max-w-none" [innerHTML]="renderMarkdown(selectedMistake()?.userNotes)"></div>
                                  </div>
                              }
                          </div>
                      </div>
                  </div>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
     /* Force compact markdown in summaries */
     ::ng-deep .markdown-inline p { margin: 0 !important; display: inline; }
     
     @media (min-width: 768px) {
        /* Override tailwind default grid to allow dynamic sizing */
        .responsive-grid {
           grid-template-columns: repeat(auto-fill, minmax(var(--card-size), 1fr)) !important;
        }
     }
  `]
})
export class LibraryComponent {
  store = inject(StudyStoreService);
  settings = inject(SettingsService);
  sanitizer: DomSanitizer = inject(DomSanitizer);
  
  viewMode = signal<'list' | 'grid'>('grid');
  cardSize = signal(220);
  filterSubject = signal('');
  searchQuery = signal('');
  
  // Detail Modal State
  selectedMistake = signal<Mistake | null>(null);

  updateCardSize(e: Event) {
      const val = parseInt((e.target as HTMLInputElement).value);
      this.cardSize.set(val);
  }

  filteredMistakes = computed(() => {
     const sub = this.filterSubject();
     const q = this.searchQuery().toLowerCase();
     
     return this.store.mistakes().filter(m => {
        const matchesSub = sub ? m.subject === sub : true;
        const matchesQ = !q || m.questionText.toLowerCase().includes(q) || m.analysis.coreConcept.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
        return matchesSub && matchesQ;
     }).sort((a,b) => b.addedAt - a.addedAt);
  });

  isCorrectAnswer(opt: string) {
      if(!this.selectedMistake()) return false;
      return this.selectedMistake()!.correctAnswer.toUpperCase().includes(opt);
  }

  formatDate(ts: number) {
     return new Date(ts).toLocaleDateString();
  }

  delete(id: string) {
     if(confirm('Are you sure you want to delete this mistake?')) {
        this.store.deleteMistake(id);
        this.closeDetail();
     }
  }

  openDetail(mistake: Mistake) {
    this.selectedMistake.set(mistake);
  }

  closeDetail() {
    this.selectedMistake.set(null);
  }

  triggerEdit() {
    if (this.selectedMistake()) {
        this.store.startEditing(this.selectedMistake()!);
        this.closeDetail();
    }
  }

  renderSafeHtml(html: string) {
      return this.sanitizer.bypassSecurityTrustHtml(html);
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
