
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyStoreService } from '../services/study-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 h-full overflow-y-auto custom-scrollbar">
      <h1 class="text-3xl font-bold text-white mb-8">学习概览</h1>

      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="bg-[#18181b] border border-gray-700 p-6 rounded-xl">
           <div class="text-gray-500 text-sm font-medium uppercase mb-2">错题总数</div>
           <div class="text-4xl font-bold text-white">{{store.totalMistakes()}}</div>
        </div>
        <div class="bg-[#18181b] border border-gray-700 p-6 rounded-xl">
           <div class="text-gray-500 text-sm font-medium uppercase mb-2">待复习</div>
           <div class="text-4xl font-bold text-indigo-400">{{store.dueReviews()}}</div>
        </div>
        <div class="bg-[#18181b] border border-gray-700 p-6 rounded-xl">
           <div class="text-gray-500 text-sm font-medium uppercase mb-2">笔记数量</div>
           <div class="text-4xl font-bold text-green-400">{{store.notes().length}}</div>
        </div>
      </div>

      <div class="bg-[#18181b] border border-gray-700 rounded-xl p-6 mb-8">
         <h3 class="text-lg font-semibold text-white mb-4">学习热力图</h3>
         <div class="flex gap-1 h-32 items-end">
            <!-- Mock bars for visual effect -->
            @for (bar of [40,60,30,80,20,50,90,30,40,70,50,20,10,60,80,40,30,20,50,70,80,90,40,30]; track $index) {
               <div 
                 class="flex-1 bg-indigo-900 hover:bg-indigo-500 transition-colors rounded-t-sm"
                 [style.height.%]="bar"
               ></div>
            }
         </div>
      </div>

      <div class="bg-[#18181b] border border-gray-700 rounded-xl overflow-hidden">
        <div class="p-4 border-b border-gray-700 bg-gray-800/30 flex justify-between items-center">
           <h3 class="text-sm font-semibold text-gray-300 uppercase">最近收录</h3>
        </div>
        <div class="divide-y divide-gray-700">
           @for (mistake of store.mistakes().slice(0, 5); track mistake.id) {
             <div class="p-4 hover:bg-gray-800/50 transition-colors flex justify-between items-center group">
                <div class="flex items-center gap-4 truncate pr-4">
                  @if (mistake.questionImage) {
                    <div class="h-10 w-10 rounded bg-gray-950 border border-gray-600 flex-shrink-0 overflow-hidden relative">
                       <img [src]="mistake.questionImage" class="w-full h-full object-contain">
                    </div>
                  } @else {
                    <div class="h-10 w-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 flex-shrink-0 font-serif">
                       题
                    </div>
                  }
                  <div class="truncate">
                    <div class="text-white font-medium truncate">{{mistake.questionText}}</div>
                    <div class="text-xs text-gray-500 mt-1 flex gap-2">
                       <span class="text-indigo-400">{{mistake.subject}}</span>
                       <span>•</span>
                       <span>{{mistake.analysis.coreConcept}}</span>
                    </div>
                  </div>
                </div>
                <button (click)="store.deleteMistake(mistake.id)" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
             </div>
           }
           @if (store.totalMistakes() === 0) {
             <div class="p-8 text-center text-gray-600">暂无错题记录</div>
           }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  store = inject(StudyStoreService);
}
