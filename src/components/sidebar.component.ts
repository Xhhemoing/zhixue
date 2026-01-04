
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyStoreService } from '../services/study-store.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="
      bg-[#18181b] border-gray-800
      md:w-16 md:flex md:flex-col md:items-center md:py-6 md:border-r md:h-full md:relative
      fixed bottom-0 w-full h-16 flex flex-row items-center justify-around border-t z-50
      shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none
    ">
      <!-- Logo Area (Desktop Only) -->
      <div class="hidden md:block mb-8 p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
      </div>

      <!-- Nav Items -->
      <div class="flex flex-row md:flex-col gap-1 md:gap-6 w-full justify-around md:justify-start">
        <button 
          (click)="store.setTab('collect')"
          [class.text-indigo-400]="store.activeTab() === 'collect'"
          [class.md:border-l-2]="store.activeTab() === 'collect'"
          [class.md:border-indigo-400]="store.activeTab() === 'collect'"
          [class.border-transparent]="store.activeTab() !== 'collect'"
          class="h-14 md:h-10 w-full flex flex-col md:flex-row items-center justify-center text-gray-400 hover:text-white transition-all relative group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          <span class="text-[10px] mt-1 md:hidden">录入</span>
          <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">错题录入</span>
        </button>

        <button 
          (click)="store.setTab('library')"
          [class.text-indigo-400]="store.activeTab() === 'library'"
          [class.md:border-l-2]="store.activeTab() === 'library'"
          [class.md:border-indigo-400]="store.activeTab() === 'library'"
          [class.border-transparent]="store.activeTab() !== 'library'"
          class="h-14 md:h-10 w-full flex flex-col md:flex-row items-center justify-center text-gray-400 hover:text-white transition-all relative group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span class="text-[10px] mt-1 md:hidden">分析库</span>
          <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">分析库</span>
        </button>

        <button 
          (click)="store.setTab('review')"
          [class.text-indigo-400]="store.activeTab() === 'review'"
          [class.md:border-l-2]="store.activeTab() === 'review'"
          [class.md:border-indigo-400]="store.activeTab() === 'review'"
          [class.border-transparent]="store.activeTab() !== 'review'"
          class="h-14 md:h-10 w-full flex flex-col md:flex-row items-center justify-center text-gray-400 hover:text-white transition-all relative group"
        >
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            @if (store.dueReviews() > 0) {
              <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{{store.dueReviews()}}</span>
            }
          </div>
          <span class="text-[10px] mt-1 md:hidden">复习</span>
          <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">复习计划</span>
        </button>

        <button 
          (click)="store.setTab('notebook')"
          [class.text-indigo-400]="store.activeTab() === 'notebook'"
          [class.md:border-l-2]="store.activeTab() === 'notebook'"
          [class.md:border-indigo-400]="store.activeTab() === 'notebook'"
          [class.border-transparent]="store.activeTab() !== 'notebook'"
          class="h-14 md:h-10 w-full flex flex-col md:flex-row items-center justify-center text-gray-400 hover:text-white transition-all relative group"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
           <span class="text-[10px] mt-1 md:hidden">笔记</span>
           <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">学霸笔记</span>
        </button>

        <button 
          (click)="store.setTab('dashboard')"
          [class.text-indigo-400]="store.activeTab() === 'dashboard'"
          [class.md:border-l-2]="store.activeTab() === 'dashboard'"
          [class.md:border-indigo-400]="store.activeTab() === 'dashboard'"
          [class.border-transparent]="store.activeTab() !== 'dashboard'"
          class="h-14 md:h-10 w-full flex flex-col md:flex-row items-center justify-center text-gray-400 hover:text-white transition-all relative group"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
           <span class="text-[10px] mt-1 md:hidden">概览</span>
           <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">概览</span>
        </button>
        
        <!-- Mobile Settings Button -->
        <button 
          (click)="store.setTab('settings')"
          [class.text-indigo-400]="store.activeTab() === 'settings'"
          [class.border-transparent]="store.activeTab() !== 'settings'"
          class="h-14 w-full flex flex-col items-center justify-center text-gray-400 hover:text-white transition-all relative group md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="text-[10px] mt-1">设置</span>
        </button>
      </div>
      
      <div class="hidden md:block mt-auto mb-4">
         <button (click)="store.setTab('settings')" 
             [class.text-indigo-400]="store.activeTab() === 'settings'" 
             class="h-10 w-full flex items-center justify-center text-gray-500 hover:text-white transition-all relative group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="hidden md:block absolute left-14 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-50">设置</span>
         </button>
      </div>
    </nav>
  `
})
export class SidebarComponent {
  store = inject(StudyStoreService);
}
