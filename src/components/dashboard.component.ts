
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyStoreService } from '../services/study-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full overflow-y-auto custom-scrollbar bg-[#0B0F19]">
      <!-- Hero Section -->
      <div class="p-8 pb-4">
          <div class="flex justify-between items-start mb-6">
             <div>
                <h1 class="text-3xl font-bold text-white tracking-tight mb-2">欢迎回来, 学霸</h1>
                <p class="text-gray-400">今天是 {{todayDate}}，保持专注，继续前进。</p>
             </div>
             @if (store.dueReviews() > 0) {
                 <button (click)="store.setTab('review')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/40 font-bold flex items-center gap-2 transition-transform transform hover:scale-105">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>
                    开始今日复习 ({{store.dueReviews()}})
                 </button>
             } @else {
                 <div class="px-6 py-3 bg-green-900/20 text-green-400 rounded-xl border border-green-900/30 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    今日任务已完成
                 </div>
             }
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-[#18181b] border border-gray-700 p-4 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-blue-900/20 rounded-lg text-blue-400">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                   <div class="text-2xl font-bold text-white">{{store.totalMistakes()}}</div>
                   <div class="text-xs text-gray-500 uppercase font-bold">累计错题</div>
                </div>
            </div>
            <div class="bg-[#18181b] border border-gray-700 p-4 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-indigo-900/20 rounded-lg text-indigo-400">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                </div>
                <div>
                   <div class="text-2xl font-bold text-white">{{store.dueReviews()}}</div>
                   <div class="text-xs text-gray-500 uppercase font-bold">待复习</div>
                </div>
            </div>
            <div class="bg-[#18181b] border border-gray-700 p-4 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-green-900/20 rounded-lg text-green-400">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <div>
                   <div class="text-2xl font-bold text-white">{{store.notes().length}}</div>
                   <div class="text-xs text-gray-500 uppercase font-bold">学霸笔记</div>
                </div>
            </div>
            <!-- Quick Add Action -->
            <button (click)="store.setTab('collect')" class="bg-[#18181b] border border-dashed border-gray-600 hover:border-indigo-500 p-4 rounded-xl flex flex-col items-center justify-center gap-1 group transition-colors">
                <div class="bg-gray-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white p-2 rounded-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span class="text-sm font-bold text-gray-400 group-hover:text-white">录入新题</span>
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Heatmap / Activity -->
              <div class="lg:col-span-2 bg-[#18181b] border border-gray-700 rounded-xl p-6">
                 <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-500"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    近期活跃度 (Review Activity)
                 </h3>
                 <div class="flex gap-1 h-32 items-end justify-between px-2">
                    <!-- Generate fake activity bars based on timestamps for demo visual -->
                    @for (day of last30Days; track day.ts) {
                       <div class="flex-1 flex flex-col items-center gap-1 group relative">
                           <div 
                             class="w-full bg-indigo-900/50 hover:bg-indigo-500 transition-colors rounded-t-sm min-w-[4px]"
                             [style.height.%]="getActivityLevel(day.ts)"
                             [class.bg-indigo-500]="isToday(day.ts)"
                           ></div>
                           <!-- Tooltip -->
                           <div class="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-xs text-white p-2 rounded shadow-lg border border-gray-700 whitespace-nowrap z-10">
                              {{day.label}}: {{getActivityCount(day.ts)}} activity
                           </div>
                       </div>
                    }
                 </div>
                 <div class="flex justify-between mt-2 text-xs text-gray-500">
                    <span>30天前</span>
                    <span>今天</span>
                 </div>
              </div>

              <!-- Recent Mistakes List -->
              <div class="bg-[#18181b] border border-gray-700 rounded-xl overflow-hidden flex flex-col h-[400px]">
                <div class="p-4 border-b border-gray-700 bg-gray-800/30">
                   <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">最近收录</h3>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-700">
                   @for (mistake of store.mistakes().slice(0, 10); track mistake.id) {
                     <div class="p-4 hover:bg-gray-800/50 transition-colors flex items-start gap-3 group cursor-pointer" (click)="goToDetail(mistake)">
                        @if (mistake.questionImage) {
                            <img [src]="mistake.questionImage" class="w-10 h-10 object-cover rounded bg-black shrink-0 border border-gray-700">
                        } @else {
                            <div class="w-10 h-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 shrink-0 text-xs font-serif">Aa</div>
                        }
                        <div class="min-w-0 flex-1">
                            <div class="text-sm text-gray-200 line-clamp-2 mb-1">{{mistake.questionText}}</div>
                            <div class="flex gap-2 text-[10px] text-gray-500">
                               <span class="text-indigo-400 bg-indigo-900/10 px-1 rounded">{{mistake.subject}}</span>
                               <span>{{getTimeAgo(mistake.addedAt)}}</span>
                            </div>
                        </div>
                     </div>
                   }
                   @if (store.totalMistakes() === 0) {
                     <div class="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                        <p class="mb-4">暂无数据</p>
                        <button (click)="store.setTab('collect')" class="text-indigo-400 text-sm hover:underline">去录入第一题</button>
                     </div>
                   }
                </div>
              </div>
          </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  store = inject(StudyStoreService);
  
  todayDate = new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  last30Days = Array.from({length: 30}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return { ts: d.getTime(), label: d.toLocaleDateString() };
  });

  isToday(ts: number) {
      return new Date(ts).toDateString() === new Date().toDateString();
  }

  // Mock-ish activity level derived from data timestamps
  getActivityLevel(ts: number) {
     const dateStr = new Date(ts).toDateString();
     const count = this.store.mistakes().filter(m => new Date(m.addedAt).toDateString() === dateStr).length +
                   this.store.notes().filter(n => new Date(n.updatedAt).toDateString() === dateStr).length;
     return Math.min(100, Math.max(10, count * 20)); // Min 10% height for visual
  }

  getActivityCount(ts: number) {
     const dateStr = new Date(ts).toDateString();
     return this.store.mistakes().filter(m => new Date(m.addedAt).toDateString() === dateStr).length +
            this.store.notes().filter(n => new Date(n.updatedAt).toDateString() === dateStr).length;
  }

  getTimeAgo(ts: number) {
      const seconds = Math.floor((Date.now() - ts) / 1000);
      if (seconds < 60) return '刚刚';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}分钟前`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}小时前`;
      return `${Math.floor(hours / 24)}天前`;
  }

  goToDetail(mistake: any) {
      this.store.startEditing(mistake);
  }
}
