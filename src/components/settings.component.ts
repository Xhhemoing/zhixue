
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, AIProvider } from '../services/settings.service';
import { StudyStoreService } from '../services/study-store.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#0B0F19]">
      <!-- Header -->
      <header class="h-16 border-b border-gray-800 flex items-center px-8 bg-[#111827] shrink-0">
        <h1 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
           系统设置
        </h1>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-xs text-green-500 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30 flex items-center gap-1">
             <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             自动保存
          </span>
        </div>
      </header>

      <!-- Main Layout -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Sidebar Tabs -->
        <nav class="w-48 bg-[#18181b] border-r border-gray-800 p-4 flex flex-col gap-2">
           <button (click)="activeTab.set('providers')" 
             [class.bg-indigo-600]="activeTab() === 'providers'" 
             [class.text-white]="activeTab() === 'providers'"
             [class.text-gray-400]="activeTab() !== 'providers'"
             class="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
             服务商管理
           </button>
           <button (click)="activeTab.set('models')" 
             [class.bg-indigo-600]="activeTab() === 'models'" 
             [class.text-white]="activeTab() === 'models'"
             [class.text-gray-400]="activeTab() !== 'models'"
             class="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
             模型分配
           </button>
           <button (click)="activeTab.set('subjects')" 
             [class.bg-indigo-600]="activeTab() === 'subjects'" 
             [class.text-white]="activeTab() === 'subjects'"
             [class.text-gray-400]="activeTab() !== 'subjects'"
             class="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
             科目管理
           </button>
           <button (click)="activeTab.set('prompts')" 
             [class.bg-indigo-600]="activeTab() === 'prompts'" 
             [class.text-white]="activeTab() === 'prompts'"
             [class.text-gray-400]="activeTab() !== 'prompts'"
             class="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
             提示词微调
           </button>
           <button (click)="activeTab.set('data')" 
             [class.bg-indigo-600]="activeTab() === 'data'" 
             [class.text-white]="activeTab() === 'data'"
             [class.text-gray-400]="activeTab() !== 'data'"
             class="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             数据管理
           </button>
        </nav>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-8">
           
           <!-- TAB: PROVIDERS -->
           @if (activeTab() === 'providers') {
             <div class="max-w-4xl space-y-8 animate-fade-in">
                <div>
                    <h2 class="text-xl font-semibold text-white mb-2">服务商管理</h2>
                    <p class="text-sm text-gray-500 mb-6">配置 API 服务商。您可以添加 Google 官方服务或兼容的第三方转发服务。</p>
                </div>

                <div class="space-y-4">
                    @for (provider of settings.settings().providers; track provider.id) {
                        <div class="bg-[#18181b] border border-gray-700 rounded-xl p-6 relative group">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-xs font-bold text-gray-400 mb-1">显示名称</label>
                                    <input [ngModel]="provider.name" (ngModelChange)="updateProvider(provider.id, 'name', $event)" 
                                           class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-400 mb-1">API Key</label>
                                    <input [ngModel]="provider.apiKey" (ngModelChange)="updateProvider(provider.id, 'apiKey', $event)" 
                                           type="password" placeholder="sk-..." 
                                           class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                                </div>
                            </div>
                            <div class="mb-2">
                                <label class="block text-xs font-bold text-gray-400 mb-1">Base URL (可选代理地址)</label>
                                <input [ngModel]="provider.baseUrl" (ngModelChange)="updateProvider(provider.id, 'baseUrl', $event)" 
                                       placeholder="https://generativelanguage.googleapis.com" 
                                       class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono">
                            </div>
                            
                            @if (provider.id !== 'google-official') {
                                <button (click)="settings.removeProvider(provider.id)" class="absolute top-4 right-4 text-gray-600 hover:text-red-400">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            }
                        </div>
                    }
                </div>

                <button (click)="addNewProvider()" class="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors font-bold text-sm">
                    + 添加新服务商
                </button>
             </div>
           }

           <!-- TAB: MODELS -->
           @if (activeTab() === 'models') {
             <div class="max-w-5xl animate-fade-in">
               <h2 class="text-xl font-semibold text-white mb-2">功能分配</h2>
               <p class="text-xs text-gray-500 mb-6">为不同任务指定使用的服务商和模型ID。</p>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- OCR Model -->
                  <div class="bg-[#18181b] border border-gray-700 rounded-xl p-6 shadow-lg shadow-black/20">
                     <div class="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                        <span class="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></span>
                        <h3 class="font-bold text-white text-sm">图片识别 (OCR)</h3>
                     </div>
                     
                     <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">服务商</label>
                            <select [ngModel]="settings.settings().assignments.ocr.providerId" (ngModelChange)="updateAssignment('ocr', 'providerId', $event)" 
                                    class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                                @for(p of settings.settings().providers; track p.id) { <option [value]="p.id">{{p.name}}</option> }
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">模型ID</label>
                            <div class="relative">
                                <input [ngModel]="settings.settings().assignments.ocr.modelId" (ngModelChange)="updateAssignment('ocr', 'modelId', $event)" 
                                    list="models_list"
                                    class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono">
                            </div>
                        </div>
                     </div>
                  </div>

                  <!-- Reasoning Model -->
                  <div class="bg-[#18181b] border border-gray-700 rounded-xl p-6 shadow-lg shadow-black/20">
                     <div class="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                        <span class="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
                        <h3 class="font-bold text-white text-sm">深度推理 & 解析</h3>
                     </div>
                     
                     <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">服务商</label>
                            <select [ngModel]="settings.settings().assignments.reasoning.providerId" (ngModelChange)="updateAssignment('reasoning', 'providerId', $event)" 
                                    class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                                @for(p of settings.settings().providers; track p.id) { <option [value]="p.id">{{p.name}}</option> }
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">模型ID</label>
                            <input [ngModel]="settings.settings().assignments.reasoning.modelId" (ngModelChange)="updateAssignment('reasoning', 'modelId', $event)" 
                                   list="models_list"
                                   class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono">
                        </div>
                     </div>
                  </div>

                  <!-- Notes Model -->
                  <div class="bg-[#18181b] border border-gray-700 rounded-xl p-6 shadow-lg shadow-black/20">
                     <div class="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                        <span class="p-1.5 bg-green-500/10 text-green-400 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></span>
                        <h3 class="font-bold text-white text-sm">笔记润色</h3>
                     </div>
                     
                     <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">服务商</label>
                            <select [ngModel]="settings.settings().assignments.notes.providerId" (ngModelChange)="updateAssignment('notes', 'providerId', $event)" 
                                    class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                                @for(p of settings.settings().providers; track p.id) { <option [value]="p.id">{{p.name}}</option> }
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">模型ID</label>
                            <input [ngModel]="settings.settings().assignments.notes.modelId" (ngModelChange)="updateAssignment('notes', 'modelId', $event)" 
                                   list="models_list"
                                   class="w-full bg-[#0B0F19] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono">
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Datalist for autocomplete -->
               <datalist id="models_list">
                  @for(m of settings.builtInModels; track m) { <option [value]="m"></option> }
               </datalist>
             </div>
           }

           <!-- TAB: SUBJECTS -->
           @if (activeTab() === 'subjects') {
             <div class="max-w-2xl space-y-6 animate-fade-in">
                <h2 class="text-xl font-semibold text-white mb-2">科目管理</h2>
                <div class="flex gap-2">
                    <input #subInput type="text" placeholder="输入新科目..." class="flex-1 bg-[#18181b] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none" (keyup.enter)="addSubject(subInput.value); subInput.value=''">
                    <button (click)="addSubject(subInput.value); subInput.value=''" class="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium">添加</button>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    @for (sub of settings.settings().subjects; track sub) {
                        <div class="flex items-center justify-between bg-[#18181b] border border-gray-700 rounded-lg px-4 py-3 group">
                            <span class="text-gray-200 text-sm">{{sub}}</span>
                            <button (click)="settings.removeSubject(sub)" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    }
                </div>
             </div>
           }

           <!-- TAB: PROMPTS -->
           @if (activeTab() === 'prompts') {
             <div class="max-w-4xl space-y-8 animate-fade-in">
                <h2 class="text-xl font-semibold text-white mb-2">提示词工程</h2>
                <div class="bg-indigo-900/10 border border-indigo-900/30 p-4 rounded-lg mb-4 text-xs text-indigo-300">
                    提示：这里设置的是 System Instructions（系统级指令）。修改后将影响新生成的分析结果。
                </div>
                
                <div class="space-y-4">
                    <label class="block text-sm font-bold text-gray-400">OCR 图片识别指令</label>
                    <textarea [ngModel]="settings.settings().prompts.ocr" (ngModelChange)="settings.updatePrompt('ocr', $event)" rows="5" class="w-full bg-[#18181b] border border-gray-700 rounded p-3 text-sm text-gray-300 outline-none font-mono"></textarea>
                </div>

                <div class="space-y-4">
                    <label class="block text-sm font-bold text-gray-400">题目解析指令</label>
                    <textarea [ngModel]="settings.settings().prompts.analysis" (ngModelChange)="settings.updatePrompt('analysis', $event)" rows="6" class="w-full bg-[#18181b] border border-gray-700 rounded p-3 text-sm text-gray-300 outline-none font-mono"></textarea>
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-bold text-gray-400">笔记润色指令</label>
                    <textarea [ngModel]="settings.settings().prompts.notes" (ngModelChange)="settings.updatePrompt('notes', $event)" rows="5" class="w-full bg-[#18181b] border border-gray-700 rounded p-3 text-sm text-gray-300 outline-none font-mono"></textarea>
                </div>
             </div>
           }

           <!-- TAB: DATA -->
           @if (activeTab() === 'data') {
             <div class="max-w-3xl space-y-6 animate-fade-in">
                <h2 class="text-xl font-semibold text-white mb-2">数据管理</h2>
                <div class="flex gap-4">
                     <button (click)="settings.exportData()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium">导出数据备份</button>
                     <button (click)="fileInput.click()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium">恢复数据...</button>
                     <input #fileInput type="file" accept=".json" class="hidden" (change)="handleImportFile($event)">
                </div>
             </div>
           }
        </div>
      </div>

      <!-- Import Conflict Modal (Same as before) -->
      @if (importDataBuffer()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
           <div class="bg-[#18181b] rounded-2xl border border-gray-700 p-8 max-w-lg w-full shadow-2xl">
              <h3 class="text-xl font-bold text-white mb-4">导入数据冲突检测</h3>
              <p class="text-gray-400 text-sm mb-6">
                 检测到导入文件包含 <strong>{{importDataBuffer()?.mistakes?.length}}</strong> 条数据。
                 其中 <strong>{{duplicateCount()}}</strong> 条数据ID可能与现有数据重复。
              </p>
              
              <div class="flex flex-col gap-3">
                 <button (click)="confirmImport('replace')" class="p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 text-left transition-colors group">
                    <div class="font-bold text-red-400 group-hover:text-red-300">覆盖现有数据 (Replace)</div>
                    <div class="text-xs text-gray-500">清空当前所有数据，完全使用导入文件。</div>
                 </button>

                 <button (click)="confirmImport('merge')" class="p-4 rounded-xl border border-yellow-900/50 bg-yellow-900/10 hover:bg-yellow-900/20 text-left transition-colors group">
                    <div class="font-bold text-yellow-400 group-hover:text-yellow-300">合并并覆盖旧ID (Merge)</div>
                    <div class="text-xs text-gray-500">保留新数据，如果ID相同则使用导入文件覆盖。</div>
                 </button>

                 <button (click)="confirmImport('keep_both')" class="p-4 rounded-xl border border-indigo-900/50 bg-indigo-900/10 hover:bg-indigo-900/20 text-left transition-colors group">
                    <div class="font-bold text-indigo-400 group-hover:text-indigo-300">保留两者 (Keep Both)</div>
                    <div class="text-xs text-gray-500">导入所有数据并生成新ID，不覆盖任何现有数据。</div>
                 </button>
                 
                 <button (click)="cancelImport()" class="mt-4 text-sm text-gray-500 hover:text-white">取消导入</button>
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent {
  activeTab = signal<'providers' | 'models' | 'subjects' | 'prompts' | 'data'>('providers');
  settings = inject(SettingsService);
  store = inject(StudyStoreService);

  // Import Staging
  importDataBuffer = signal<any>(null);
  duplicateCount = signal(0);
  
  // Provider Actions
  addNewProvider() {
      this.settings.addProvider({
          name: 'New Provider',
          apiKey: '',
          baseUrl: ''
      });
  }

  updateProvider(id: string, field: keyof AIProvider, value: string) {
      this.settings.updateProvider(id, { [field]: value });
  }

  // Assignments
  updateAssignment(task: 'ocr'|'reasoning'|'notes', field: 'providerId'|'modelId', value: string) {
      this.settings.updateAssignment(task, { [field]: value });
  }

  addSubject(name: string) {
    if(name.trim()) this.settings.addSubject(name.trim());
  }

  handleImportFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Basic validation
        if (!json.mistakes && !json.settings) throw new Error("Invalid format");
        
        let dupes = 0;
        if (json.mistakes) {
            const currentIds = new Set(this.store.mistakes().map(m => m.id));
            dupes = json.mistakes.filter((m: any) => currentIds.has(m.id)).length;
        }
        
        this.duplicateCount.set(dupes);
        this.importDataBuffer.set(json);
        (event.target as HTMLInputElement).value = '';
      } catch (err) {
        alert("Parse Error: " + err);
      }
    };
    reader.readAsText(file);
  }

  confirmImport(strategy: 'replace' | 'merge' | 'keep_both') {
    const data = this.importDataBuffer();
    if (data) {
      if (data.settings) this.settings.settings.set(data.settings);
      
      if (data.mistakes) this.store.importData(data.mistakes, strategy, 'mistake');
      if (data.notes) this.store.importData(data.notes, strategy, 'note');
      if (data.folders) this.store.setFolders(data.folders);

      alert("导入成功！");
      this.cancelImport();
    }
  }

  cancelImport() {
    this.importDataBuffer.set(null);
  }
}
