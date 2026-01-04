
import { Component, inject, signal, computed, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyStoreService, Note, NoteVersion, Mistake } from '../services/study-store.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const marked: any;
declare const katex: any;

interface FileNode {
  id: string; 
  name: string;
  path: string;
  type: 'folder' | 'note';
  children: FileNode[];
  data?: Note;
  level: number;
  expanded: boolean;
  hasMatch?: boolean;
}

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex bg-[#0B0F19] overflow-hidden select-none" (mouseup)="stopResize()" (mousemove)="onResize($event)">
      
      <!-- LEFT SIDEBAR: File Tree -->
      <div [class.hidden]="!leftSidebarOpen()" 
           class="bg-[#111827] border-r border-gray-800 flex flex-col shrink-0 relative flex-nowrap transition-all duration-300"
           [style.width.px]="sidebarWidth()">
         
         <!-- Sidebar Header -->
         <div class="p-3 border-b border-gray-800 space-y-2 shrink-0">
            <div class="flex justify-between items-center">
               <h2 class="text-gray-200 font-bold text-sm tracking-wide">学霸笔记</h2>
               <div class="flex gap-1">
                 <button (click)="createNewFolder()" class="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded transition-colors" title="新建文件夹">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                 </button>
                 <button (click)="createNote()" class="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded transition-colors" title="新建笔记">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                 </button>
                 <button (click)="isDetailedView.set(!isDetailedView())" [class.text-indigo-400]="isDetailedView()" class="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded transition-colors" title="详细视图">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                 </button>
                 <button (click)="toggleLeftSidebar()" class="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded transition-colors" title="收起侧边栏">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
               </div>
            </div>
            <div class="flex gap-1">
               <div class="relative flex-1">
                  <input [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="搜索笔记..." class="w-full bg-[#18181b] border border-gray-700 rounded px-2 py-1 pl-6 text-xs text-white outline-none focus:border-indigo-500 transition-colors">
                  <svg class="absolute left-1.5 top-1.5 text-gray-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               </div>
               <button (click)="cycleSort()" class="px-2 bg-[#18181b] border border-gray-700 rounded text-[10px] text-gray-400 hover:text-white uppercase font-bold w-12" title="排序">
                  {{sortLabel()}}
               </button>
            </div>
         </div>

         <!-- Recursive Tree View -->
         <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: fileTree() }"></ng-container>
         </div>
      </div>

      <!-- Resizer: Sidebar <-> Main -->
      <div class="w-1 relative hover:bg-indigo-500 bg-gray-900 cursor-col-resize z-20 flex flex-col justify-center transition-colors group" (mousedown)="startResize('sidebar', $event)">
         <button (click)="toggleLeftSidebar()" class="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-gray-800 text-gray-400 p-0.5 rounded-r hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Toggle Sidebar">
            <svg *ngIf="leftSidebarOpen()" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <svg *ngIf="!leftSidebarOpen()" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
         </button>
         <div class="w-0.5 h-4 bg-gray-600 rounded mx-auto" [class.hidden]="!leftSidebarOpen()"></div>
      </div>

      <!-- CENTER: Main Editor -->
      <div class="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0B0F19] min-w-0">
         
         @if (selectedNote()) {
             <!-- Toolbar -->
             <div class="flex items-center gap-1 p-2 bg-[#111827] border-b border-gray-800 shrink-0 relative z-40">
                 
                 <!-- Formatting Tools -->
                 <div class="flex gap-1 pr-2 border-r border-gray-700">
                    <button (click)="insertText('**', '**')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="加粗"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg></button>
                    <button (click)="insertText('*', '*')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="斜体"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg></button>
                    <button (click)="insertText('~~', '~~')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="删除线"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.3 19c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8L4.1 4.2c-.8-.8-2-.8-2.8 0-.8.8-.8 2 0 2.8L17.3 19zM4 12h16"/></svg></button>
                 </div>
                 
                 <!-- Structure Tools -->
                 <div class="flex gap-1 px-2 border-r border-gray-700">
                    <button (click)="insertText('# ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-xs">H1</button>
                    <button (click)="insertText('## ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-xs">H2</button>
                    <button (click)="insertText('### ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-xs">H3</button>
                 </div>

                 <!-- Block Tools -->
                 <div class="flex gap-1 px-2 border-r border-gray-700">
                    <button (click)="insertText('- [ ] ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="待办"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                    <button (click)="insertText('- ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="列表"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
                    <button (click)="insertText('> ')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="引用"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg></button>
                    <button (click)="insertText(codeBlockStart, codeBlockEnd)" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="代码块"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button>
                    <button (click)="insertText('$ ', ' $')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-serif italic text-xs">fx</button>
                    
                    <button (click)="showReferenceModal.set(true)" class="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-900 rounded transition-colors flex items-center gap-1" title="引用题库">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        <span class="text-[10px] font-bold">引用</span>
                    </button>
                 </div>

                 <!-- View Mode Switcher -->
                 <div class="flex bg-gray-800 rounded p-0.5 border border-gray-700 ml-4">
                    <button (click)="viewMode.set('edit')" [class.bg-gray-600]="viewMode() === 'edit'" [class.text-white]="viewMode() === 'edit'" class="px-2 py-0.5 rounded text-[10px] text-gray-400 transition-colors">编辑</button>
                    <button (click)="viewMode.set('split')" [class.bg-gray-600]="viewMode() === 'split'" [class.text-white]="viewMode() === 'split'" class="px-2 py-0.5 rounded text-[10px] text-gray-400 transition-colors">分屏</button>
                    <button (click)="viewMode.set('read')" [class.bg-gray-600]="viewMode() === 'read'" [class.text-white]="viewMode() === 'read'" class="px-2 py-0.5 rounded text-[10px] text-gray-400 transition-colors">预览</button>
                 </div>

                 <!-- History / Version Control -->
                 <div class="ml-4 relative group/history z-50">
                     <button class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="历史版本">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-9-9 9 9 0 0 1 9 9z"></path></svg>
                     </button>
                     <div class="hidden group-hover/history:block absolute right-0 top-full mt-1 w-64 bg-[#18181b] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div class="p-2 border-b border-gray-700 text-[10px] text-gray-500 font-bold uppercase flex justify-between bg-gray-900">
                            <span>保存历史</span>
                            <button (click)="saveVersion()" class="text-indigo-400 hover:text-white">创建快照</button>
                        </div>
                        <div class="max-h-56 overflow-y-auto custom-scrollbar">
                            @for(v of selectedNote()?.versions; track v.id) {
                                <div class="px-3 py-2 hover:bg-gray-800 text-xs border-b border-gray-800 last:border-0 flex justify-between items-start group">
                                    <div class="cursor-pointer flex-1" (click)="restoreVersion(v)">
                                        <div class="flex justify-between items-center mb-0.5">
                                            <span class="text-white font-bold truncate max-w-[120px]" title="{{v.name}}">{{v.name || '未命名快照'}}</span>
                                            <span class="text-gray-600 scale-90">{{formatDateShort(v.timestamp)}}</span>
                                        </div>
                                        <div class="text-gray-500 truncate">{{v.title || '无标题'}}</div>
                                    </div>
                                    <button (click)="deleteVersion(v.id)" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 ml-2 p-1">
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            }
                            @if(!selectedNote()?.versions?.length) {
                                <div class="p-4 text-xs text-gray-600 text-center italic">无历史版本</div>
                            }
                        </div>
                     </div>
                 </div>

                 <!-- Export Tools -->
                 <div class="flex gap-1 px-2 ml-2 border-l border-gray-700">
                     <button (click)="exportMarkdown()" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="导出 Markdown">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                     </button>
                     <button (click)="exportPDF()" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="导出 PDF">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                     </button>
                 </div>
             </div>

             <div class="flex-1 flex overflow-hidden relative">
                <!-- Editor -->
                <div class="flex flex-col h-full bg-[#0B0F19]" 
                     [class.hidden]="viewMode() === 'read'"
                     [style.width.%]="viewMode() === 'edit' ? 100 : editorWidthPercent()">
                    <input 
                       [ngModel]="currentTitle()" 
                       (ngModelChange)="updateTitle($event)" 
                       class="text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-700 w-full px-8 pt-8 pb-4 tracking-tight shrink-0" 
                       placeholder="未命名笔记"
                    >
                    <textarea 
                        #editor
                        [ngModel]="currentContent()"
                        (ngModelChange)="updateContent($event)"
                        (keydown.tab)="handleTab($event)"
                        (paste)="handlePaste($event)"
                        (scroll)="onEditorScroll($event)"
                        class="flex-1 w-full bg-transparent resize-none outline-none text-gray-300 leading-relaxed font-mono text-sm px-8 pb-20 custom-scrollbar selection:bg-indigo-900/60"
                        placeholder="在此处输入内容... (支持 Markdown, 表格, 粘贴图片)"
                    ></textarea>
                </div>

                <!-- Resizer: Editor <-> Preview -->
                @if (viewMode() === 'split') {
                    <div class="w-1 hover:bg-indigo-500 bg-gray-800 cursor-col-resize z-20 transition-colors flex flex-col justify-center" (mousedown)="startResize('editor', $event)">
                       <div class="w-0.5 h-4 bg-gray-500 rounded mx-auto"></div>
                    </div>
                }

                <!-- Preview -->
                <div class="flex-1 bg-[#0B0F19] h-full overflow-y-auto custom-scrollbar px-8 py-8 select-text" 
                     id="preview-container"
                     (scroll)="onPreviewScroll($event)"
                     [class.hidden]="viewMode() === 'edit'"
                     [style.width.%]="viewMode() === 'read' ? 100 : (100 - editorWidthPercent())">
                    <h1 *ngIf="viewMode() === 'read'" class="text-3xl font-bold text-white mb-8">{{currentTitle()}}</h1>
                    <div class="prose prose-invert prose-sm max-w-none" [innerHTML]="renderedContent()"></div>
                </div>
             </div>
         } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#0B0F19]">
                <div class="w-20 h-20 bg-[#111827] rounded-2xl flex items-center justify-center mb-6">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h3 class="text-gray-400 font-bold text-lg mb-2">无笔记选中</h3>
                <p class="text-sm opacity-60">选择左侧笔记或新建笔记开始记录</p>
            </div>
         }
      </div>

      <!-- RIGHT SIDEBAR: Outline & Meta (Resizable) -->
      @if (selectedNote()) {
          <div class="w-1 relative hover:bg-indigo-500 bg-gray-900 cursor-col-resize z-20 transition-colors flex flex-col justify-center group" (mousedown)="startResize('outline', $event)">
              <button (click)="toggleRightSidebar()" class="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-gray-800 text-gray-400 p-0.5 rounded-l hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg *ngIf="rightSidebarOpen()" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 <svg *ngIf="!rightSidebarOpen()" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
             <div class="w-0.5 h-4 bg-gray-600 rounded mx-auto" [class.hidden]="!rightSidebarOpen()"></div>
          </div>

          <div [class.hidden]="!rightSidebarOpen()" class="bg-[#111827] flex flex-col shrink-0" [style.width.px]="outlineWidth()">
             <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                <!-- Time Info (Moved here) -->
                <div class="mb-6 p-3 bg-gray-800/30 rounded-lg text-[10px] text-gray-500 font-mono space-y-1 border border-gray-800">
                    <div class="flex justify-between"><span>Created:</span> <span class="text-gray-400">{{formatDate(selectedNote()!.createdAt)}}</span></div>
                    <div class="flex justify-between"><span>Updated:</span> <span class="text-gray-400">{{formatTime(selectedNote()!.updatedAt)}}</span></div>
                </div>

                <!-- Outline Section -->
                <div class="mb-8">
                   <div class="text-xs font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                       文章大纲
                   </div>
                   <div class="space-y-0.5 border-l border-gray-800 ml-1.5">
                      @if (outlineItems().length > 0) {
                          @for(item of outlineItems(); track $index) {
                              <button 
                                  class="block w-full text-left text-xs text-gray-400 hover:text-indigo-400 hover:bg-gray-800/50 py-1.5 pr-2 truncate transition-all relative group"
                                  [style.padding-left.px]="(item.level - 1) * 12 + 12"
                                  [class.font-bold]="item.level === 1"
                                  [class.text-gray-300]="item.level === 1"
                                  (click)="scrollToHeading(item.id)">
                                  <span class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[1px] w-1 h-1 rounded-full bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                  {{item.text}}
                              </button>
                          }
                      } @else {
                          <div class="text-xs text-gray-600 italic pl-4 py-2">添加标题以生成大纲</div>
                      }
                   </div>
                </div>

                <!-- Meta Section -->
                <div class="pt-4 border-t border-gray-800 space-y-6">
                    <div>
                        <div class="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            归档位置
                        </div>
                        <div class="relative group">
                            <input [ngModel]="currentFolder()" (change)="updateFolder($any($event.target).value)" 
                                class="w-full bg-[#18181b] border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
                                placeholder="例如: 数学/代数 (回车确认)">
                            <div class="hidden group-hover:block absolute right-2 top-1.5 text-[10px] text-gray-500 pointer-events-none">Enter 保存</div>
                        </div>
                    </div>

                    <div>
                        <div class="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                            标签
                        </div>
                        <div class="flex flex-wrap gap-2">
                            @for(tag of selectedNote()!.tags; track tag) {
                                <span class="px-2 py-0.5 rounded bg-indigo-900/20 text-[10px] text-indigo-300 border border-indigo-900/30 flex items-center gap-1 group/tag">
                                    {{tag}}
                                    <button (click)="removeTag(tag)" class="hover:text-red-400 ml-1"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                </span>
                            }
                            <input #tagInput (keyup.enter)="addTag(tagInput.value); tagInput.value=''" placeholder="+ Tag" class="bg-transparent border border-dashed border-gray-700 rounded px-2 py-0.5 text-[10px] text-gray-400 outline-none w-16 hover:border-gray-500 focus:border-indigo-500 focus:w-24 transition-all">
                        </div>
                    </div>
                </div>
             </div>
          </div>
      }
    </div>

    <!-- Reference Picker Modal -->
    @if (showReferenceModal()) {
       <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <div class="bg-[#18181b] w-full max-w-3xl h-[600px] rounded-2xl border border-gray-700 flex flex-col shadow-2xl">
             <div class="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-[#111827]">
                <h2 class="text-white font-bold">引用题库</h2>
                <div class="flex items-center gap-2">
                    <input [(ngModel)]="refSearch" placeholder="搜索题目..." class="bg-[#0B0F19] border border-gray-700 rounded px-3 py-1 text-xs text-white outline-none w-48">
                    <button (click)="showReferenceModal.set(false)" class="text-gray-400 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
             </div>
             <div class="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                @for(mistake of refMistakes(); track mistake.id) {
                    <div class="p-3 border border-gray-700 rounded-lg bg-[#0B0F19] hover:border-indigo-500 transition-colors group cursor-default">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs text-indigo-400 bg-indigo-900/20 px-1.5 py-0.5 rounded">{{mistake.subject}}</span>
                            
                            <!-- Selection Action -->
                            <div class="flex gap-2">
                                <button (click)="insertReference('link', mistake)" class="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">插入链接卡片</button>
                                <button (click)="toggleRefConfig(mistake.id)" class="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {{ activeRefId() === mistake.id ? '取消选择' : '引用文本...' }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Content Preview -->
                        <div class="text-sm text-gray-300 line-clamp-2 mb-1 font-serif">{{mistake.questionText}}</div>
                        <div class="text-xs text-gray-600 truncate">{{mistake.analysis.coreConcept}}</div>

                        <!-- Configuration Panel (Visible if active) -->
                        @if (activeRefId() === mistake.id) {
                            <div class="mt-3 p-3 bg-gray-800 rounded border border-gray-700 animate-fade-in-down">
                                <div class="text-xs font-bold text-gray-400 mb-2">选择引用内容:</div>
                                <div class="grid grid-cols-3 gap-2 mb-3">
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().question" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 题目
                                    </label>
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().options" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 选项
                                    </label>
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().wrong" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 错解
                                    </label>
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().answer" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 正解
                                    </label>
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().analysis" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 解析
                                    </label>
                                    <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="refConfig().notes" class="rounded bg-gray-700 border-gray-600 text-indigo-500"> 心得
                                    </label>
                                </div>
                                <button (click)="confirmInsertText(mistake)" class="w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-bold transition-colors">确认插入</button>
                            </div>
                        }
                    </div>
                }
             </div>
          </div>
       </div>
    }
    
    <ng-template #nodeTemplate let-nodes>
        @for(node of nodes; track node.id) {
            <div [class.hidden]="node.type === 'note' && searchQuery() && !node.hasMatch">
                <!-- Node Row -->
                <div class="flex items-center group/node text-xs cursor-pointer select-none transition-colors"
                     [class.bg-indigo-900_30]="selectedNoteId() === node.id"
                     [class.text-indigo-400]="selectedNoteId() === node.id"
                     [class.text-gray-400]="selectedNoteId() !== node.id"
                     [class.hover:bg-gray-800]="selectedNoteId() !== node.id"
                     [style.padding-left.px]="node.level * 12 + 8">
                    
                     <!-- Arrow / Icon -->
                     <span class="p-1 -ml-1 hover:text-white" 
                           (click)="$event.stopPropagation(); node.type === 'folder' && toggleExpand(node)"
                           [class.invisible]="node.type === 'note'">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform" [class.rotate-90]="node.expanded">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                     </span>

                     <!-- Icon Type -->
                     <span class="mr-2" (click)="node.type === 'note' && selectNote(node.data); node.type === 'folder' && toggleExpand(node)">
                        @if(node.type === 'folder') {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        } @else {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        }
                     </span>
                     
                     <!-- Name & Details -->
                     <div class="flex-1 py-1.5 min-w-0" 
                           [draggable]="node.type === 'note'" 
                           (dragstart)="onDragStart($event, node)"
                           (dragover)="node.type === 'folder' && onDragOver($event)"
                           (drop)="node.type === 'folder' && onDrop($event, node)"
                           (click)="node.type === 'note' && selectNote(node.data); node.type === 'folder' && toggleExpand(node)">
                         <div class="truncate">{{node.name}}</div>
                         @if (node.type === 'note' && isDetailedView()) {
                             <div class="text-[10px] text-gray-500 flex gap-2 mt-0.5">
                                <span>{{formatDateShort(node.data!.createdAt)}}</span>
                                @if (node.data!.tags.length) {
                                    <span class="text-indigo-400">#{{node.data!.tags[0]}}</span>
                                }
                             </div>
                         }
                     </div>
                </div>

                <!-- Children -->
                @if (node.type === 'folder' && node.expanded) {
                    <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node.children }"></ng-container>
                }
            </div>
        }
    </ng-template>
  `,
  styles: [`
    .animate-fade-in-down { animation: fadeInDown 0.2s ease-out; }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NotebookComponent {
  @ViewChild('editor') editorRef!: ElementRef<HTMLTextAreaElement>;
  
  store = inject(StudyStoreService);
  renderer = inject(Renderer2);
  sanitizer: DomSanitizer = inject(DomSanitizer);

  searchQuery = signal('');
  sortOrder = signal<'updated' | 'title'>('updated');
  selectedNoteId = signal<string | null>(null);
  
  // Resizable State (Updated defaults)
  leftSidebarOpen = signal(true);
  rightSidebarOpen = signal(true);
  isDetailedView = signal(false);
  
  sidebarWidth = signal(200); 
  outlineWidth = signal(200);
  editorWidthPercent = signal(60);
  
  viewMode = signal<'edit' | 'split' | 'read'>('split');
  
  resizingState: { type: 'sidebar' | 'editor' | 'outline' | null, startX: number, startWidth: number } = { type: null, startX: 0, startWidth: 0 };

  // Local Edit State
  currentContent = signal(''); 
  currentFolder = signal('');
  currentTitle = signal('');

  // Reference Feature
  showReferenceModal = signal(false);
  refSearch = signal('');
  activeRefId = signal<string | null>(null);
  refConfig = signal({
      question: true,
      options: true,
      wrong: true,
      answer: true,
      analysis: true,
      notes: true
  });

  // Sync Scroll State
  isSyncingEditor = false;
  isSyncingPreview = false;

  readonly codeBlockStart = '```\n';
  readonly codeBlockEnd = '\n```';

  // Computed Properties
  selectedNote = computed(() => this.store.notes().find(n => n.id === this.selectedNoteId()));

  // Ref Mistakes
  refMistakes = computed(() => {
      const q = this.refSearch().toLowerCase();
      return this.store.mistakes()
          .filter(m => !q || m.questionText.toLowerCase().includes(q) || m.analysis.coreConcept.toLowerCase().includes(q))
          .slice(0, 50);
  });

  sortLabel = computed(() => this.sortOrder() === 'updated' ? '时间' : '名称');

  cycleSort() {
      this.sortOrder.set(this.sortOrder() === 'updated' ? 'title' : 'updated');
  }

  // Transform flat notes to tree
  fileTree = computed(() => {
    // 1. Get raw notes and folders
    const notes = this.store.notes();
    const explicitFolders = this.store.folders();
    const query = this.searchQuery().toLowerCase();
    
    // 2. Build the full tree
    const root = this.buildTree(notes, explicitFolders);

    // 3. If searching, prune the tree
    if (query) {
       return this.filterTree(root, query);
    }

    return root;
  });

  // Custom Outline Renderer
  outlineItems = computed(() => {
    const content = this.currentContent();
    if (!content) return [];
    
    // Safe parse
    let tokens: any[] = [];
    try {
        tokens = marked.lexer(String(content));
    } catch (e) {
        return [];
    }

    const items: { level: number, text: string, id: string }[] = [];
    const slugCounts: Record<string, number> = {};

    tokens.forEach((token: any) => {
        if (token.type === 'heading') {
            const rawText = token.text.replace(/<[^>]*>/g, ''); 
            let slug = 'heading-' + rawText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
            
            if (slugCounts[slug]) {
                slugCounts[slug]++;
                slug = `${slug}-${slugCounts[slug]}`;
            } else {
                slugCounts[slug] = 1;
            }

            items.push({
                level: token.depth,
                text: rawText,
                id: slug
            });
        }
    });
    return items;
  });

  // Private helper to safely render markdown+latex for any text snippet
  private renderMarkdownToHtmlString(text: string): string {
      if (!text) return '';
      
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
          return String(text).replace(/</g, '&lt;'); // Basic escaping on error
      }
      return html;
  }

  renderedContent = computed(() => {
     const raw = this.currentContent();
     if (!raw) return '';
     
     const refMap = new Map<string, string>();
     
     // 1. Identify Refs and Generate Card HTML (with internal rendering)
     let processed = String(raw).replace(/::ref\[([a-zA-Z0-9-]+)\]::/g, (match, id) => {
         const token = `__REF_START_${id}_REF_END__`;
         const mistake = this.store.mistakes().find(m => m.id === id);
         let html = '';
         if (!mistake) {
             html = `<div class="my-4 p-4 border border-red-900/50 bg-red-900/10 rounded-lg text-xs text-red-400">[引用丢失: ${id}]</div>`;
         } else {
             // Render the internal content of the card!
             const qHtml = this.renderMarkdownToHtmlString(mistake.questionText);
             const ansHtml = this.renderMarkdownToHtmlString(mistake.correctAnswer);
             
             html = `
            <div class="my-4 p-4 border border-indigo-500/30 bg-indigo-900/10 rounded-lg not-prose hover:bg-indigo-900/20 transition-colors">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold">引用题目</span>
                    <span class="text-xs text-indigo-300">${this.escapeHtml(mistake.subject)}</span>
                </div>
                <!-- Use Rendered HTML here -->
                <div class="text-sm text-gray-200 font-serif mb-3 whitespace-normal prose prose-invert prose-sm max-w-none">${qHtml}</div>
                <div class="text-xs text-green-400 font-bold bg-green-900/20 p-2 rounded border border-green-900/30">Ans: ${ansHtml}</div>
            </div>`;
         }
         refMap.set(token, html);
         return token;
     });

     // 2. Render Main Content using robust pipeline
     let finalHtml = this.renderMarkdownToHtmlString(processed);

     // 3. Restore Ref Cards
     refMap.forEach((value, key) => {
        // marked might wrap the token in <p> if it was on its own line.
        // We replace both the wrapped and unwrapped versions.
        finalHtml = finalHtml.replace(new RegExp(`<p>\\s*${key}\\s*</p>`, 'g'), value);
        finalHtml = finalHtml.replace(key, value);
     });
     
     return this.sanitizer.bypassSecurityTrustHtml(finalHtml);
  });

  // --- Sync Scroll ---
  onEditorScroll(event: Event) {
      if (this.viewMode() !== 'split' || this.isSyncingPreview) return;
      const editor = event.target as HTMLElement;
      const preview = document.getElementById('preview-container');
      if (preview && editor.scrollHeight > editor.clientHeight) {
          this.isSyncingEditor = true;
          const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
          if (preview.scrollHeight > preview.clientHeight) {
            preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
          }
          setTimeout(() => this.isSyncingEditor = false, 50);
      }
  }

  onPreviewScroll(event: Event) {
      if (this.viewMode() !== 'split' || this.isSyncingEditor) return;
      const preview = event.target as HTMLElement;
      const editor = this.editorRef?.nativeElement;
      if (editor && preview.scrollHeight > preview.clientHeight) {
          this.isSyncingPreview = true;
          const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
          if (editor.scrollHeight > editor.clientHeight) {
            editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
          }
          setTimeout(() => this.isSyncingPreview = false, 50);
      }
  }

  // --- Tree Logic ---
  
  expandedPaths = new Set<string>();

  buildTree(notes: Note[], explicitFolders: string[]): FileNode[] {
    const root: FileNode[] = [];
    const map = new Map<string, FileNode>();

    // Helper to get or create folder node
    const getOrCreateFolder = (pathParts: string[]): FileNode[] => {
        if (pathParts.length === 0) return root;
        
        const currentPath = pathParts.join('/');
        
        if (map.has(currentPath)) return map.get(currentPath)!.children;

        const parentChildren = getOrCreateFolder(pathParts.slice(0, -1));
        const newNode: FileNode = {
            id: 'folder-' + currentPath,
            name: pathParts[pathParts.length - 1],
            path: currentPath,
            type: 'folder',
            children: [],
            level: pathParts.length - 1,
            expanded: this.expandedPaths.has(currentPath)
        };
        
        map.set(currentPath, newNode);
        parentChildren.push(newNode);
        
        // Sort folders by name
        parentChildren.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return newNode.children;
    };

    // 1. Create structure from explicit folders
    explicitFolders.forEach(path => {
        if(path) getOrCreateFolder(path.split('/').filter(p => p));
    });

    // 2. Add notes (and create implicit folders if missing)
    notes.forEach(note => {
        const folder = note.folder || '未分类';
        const parts = folder.split('/').filter(p => p);
        const children = getOrCreateFolder(parts);
        
        children.push({
            id: note.id,
            name: note.title || '未命名',
            path: folder,
            type: 'note',
            children: [],
            data: note,
            level: parts.length,
            expanded: false
        });
        
        // Sort notes
        children.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            if (this.sortOrder() === 'title') {
                return (a.name || '').localeCompare(b.name || '');
            }
            return (b.data?.updatedAt || 0) - (a.data?.updatedAt || 0);
        });
    });

    return root;
  }

  // Recursive Filter for Search
  filterTree(nodes: FileNode[], query: string): FileNode[] {
      return nodes.map(node => {
          if (node.type === 'note') {
              const tags = (node.data?.tags || []).join(' ').toLowerCase();
              const match = (node.name || '').toLowerCase().includes(query) || 
                            (node.data?.content || '').toLowerCase().includes(query) ||
                            tags.includes(query);
              return match ? { ...node, hasMatch: true } : null;
          } else {
              // Folder
              const children = this.filterTree(node.children, query);
              const match = (node.name || '').toLowerCase().includes(query);
              
              if (children.length > 0 || match) {
                  return { 
                      ...node, 
                      children, 
                      expanded: true, // Auto expand on match
                      hasMatch: match || children.some(c => c!.hasMatch) 
                  };
              }
              return null;
          }
      }).filter(Boolean) as FileNode[];
  }

  toggleExpand(node: FileNode) {
     node.expanded = !node.expanded;
     if (node.expanded) this.expandedPaths.add(node.path);
     else this.expandedPaths.delete(node.path);
  }

  toggleLeftSidebar() { this.leftSidebarOpen.update(v => !v); }
  toggleRightSidebar() { this.rightSidebarOpen.update(v => !v); }

  // --- Drag and Drop ---
  
  onDragStart(e: DragEvent, node: FileNode) {
     if (e.dataTransfer) {
        e.dataTransfer.setData('application/json', JSON.stringify({ noteId: node.id }));
        e.dataTransfer.effectAllowed = 'move';
     }
  }

  onDragOver(e: DragEvent) {
     e.preventDefault(); // Allow dropping
     e.dataTransfer!.dropEffect = 'move';
  }

  onDrop(e: DragEvent, targetNode: FileNode) {
     e.preventDefault();
     const data = e.dataTransfer?.getData('application/json');
     if (!data || targetNode.type !== 'folder') return;
     
     const { noteId } = JSON.parse(data);
     if (noteId) {
         this.store.updateNote(noteId, { folder: targetNode.path });
     }
  }

  // --- Operations ---

  selectNote(note: any) {
    this.selectedNoteId.set(note.id);
    this.currentContent.set(String(note.content || ''));
    this.currentFolder.set(note.folder || '未分类');
    this.currentTitle.set(note.title || '');
  }

  createNote(folderPath?: string, title?: string, content: string = '') {
    const targetFolder = folderPath || this.currentFolder() || '未分类';
    const id = this.store.addNote({
      folder: targetFolder,
      title: title || '新笔记',
      content: content,
      tags: []
    });
    
    // Auto select
    setTimeout(() => {
        this.selectNote(this.store.notes().find(n => n.id === id));
    }, 50);
  }

  createNewFolder() {
      const parent = this.currentFolder() || '';
      const suggestion = parent ? `${parent}/新建文件夹` : '新建文件夹';
      
      const folderName = prompt("请输入文件夹路径:", suggestion);
      
      if (folderName) {
          this.store.ensureFolderExists(folderName);
          // Just force a refresh or wait for signal reaction, no note creation needed
      }
  }

  updateContent(val: string) { this.currentContent.set(val); this.saveCurrent(); }
  updateFolder(val: string) { this.currentFolder.set(val); this.saveCurrent(); }
  updateTitle(val: string) { this.currentTitle.set(val); this.saveCurrent(); }

  addTag(tag: string) {
    if(!tag.trim() || !this.selectedNote()) return;
    const currentTags = this.selectedNote()!.tags;
    if(!currentTags.includes(tag)) {
        this.store.updateNote(this.selectedNoteId()!, { tags: [...currentTags, tag] });
    }
  }

  removeTag(tag: string) {
      if(!this.selectedNote()) return;
      this.store.updateNote(this.selectedNoteId()!, { 
          tags: this.selectedNote()!.tags.filter(t => t !== tag) 
      });
  }

  saveCurrent() {
     const id = this.selectedNoteId();
     if(id) {
        this.store.updateNote(id, {
           content: this.currentContent(),
           folder: this.currentFolder(),
           title: this.currentTitle(),
        });
     }
  }

  saveVersion() {
      if(this.selectedNoteId()) {
          const name = prompt("为快照命名 (可选):");
          this.store.updateNote(this.selectedNoteId()!, {}, true, name || undefined);
      }
  }

  restoreVersion(v: NoteVersion) {
      if(confirm(`恢复到版本 "${v.name || '未命名'}" (${this.formatDateShort(v.timestamp)})? 当前未保存的内容将丢失。`)) {
          this.currentContent.set(v.content);
          this.currentTitle.set(v.title);
          this.saveCurrent();
      }
  }

  deleteVersion(vid: string) {
      if(confirm('删除此快照?')) {
          this.store.deleteNoteVersion(this.selectedNoteId()!, vid);
      }
  }

  // --- Export ---
  
  exportMarkdown() {
      if (!this.selectedNote()) return;
      const note = this.selectedNote()!;
      const blob = new Blob([note.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'Note'}.md`;
      a.click();
      URL.revokeObjectURL(url);
  }

  exportPDF() {
      if (!this.selectedNote()) return;
      const contentHtml = document.getElementById('preview-container')?.innerHTML || '';
      const title = this.currentTitle();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <style>
                    body { padding: 40px; }
                    .prose { max-width: none; }
                </style>
            </head>
            <body>
                <h1 class="text-3xl font-bold mb-8">${title}</h1>
                <div class="prose prose-lg">
                    ${contentHtml}
                </div>
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 1000);
                </script>
            </body>
            </html>
          `);
          printWindow.document.close();
      }
  }

  // --- Toolbar & Editor Logic ---

  insertText(prefix: string, suffix: string = '') {
      const textarea = this.editorRef.nativeElement;
      if (!textarea) return; 

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      const selection = text.substring(start, end);
      const replacement = prefix + selection + suffix;
      
      this.currentContent.set(text.substring(0, start) + replacement + text.substring(end));
      this.saveCurrent();
      
      setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + prefix.length + selection.length + (selection ? suffix.length : 0);
          const finalPos = selection ? newCursorPos : start + prefix.length;
          textarea.setSelectionRange(finalPos, finalPos);
      }, 0);
  }

  handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault();
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                this.insertText(`\n![image](${base64})\n`);
            };
            if (blob) reader.readAsDataURL(blob);
            return;
        }
    }
  }

  insertReference(type: 'text' | 'link', mistake: any) {
      // If adding link, just do it. If text, showing config handled by template now.
      if (type === 'link') {
          this.insertText(`\n::ref[${mistake.id}]::\n`);
          this.showReferenceModal.set(false);
          this.activeRefId.set(null);
      }
  }

  toggleRefConfig(id: string) {
      if (this.activeRefId() === id) {
          this.activeRefId.set(null);
      } else {
          this.activeRefId.set(id);
      }
  }

  confirmInsertText(mistake: Mistake) {
      let text = `> **引用题目 (${mistake.subject})**\n`;
      const c = this.refConfig();
      
      if (c.question) text += `> ${mistake.questionText}\n`;
      if (c.options && mistake.options?.length) {
          mistake.options.forEach((o, i) => text += `> ${['A','B','C','D'][i]}. ${o}\n`);
      }
      text += `> \n`;
      if (c.wrong) text += `> *错解:* ${mistake.wrongAnswer}\n`;
      if (c.answer) text += `> *正解:* ${mistake.correctAnswer}\n`;
      if (c.analysis) text += `> *解析:* ${mistake.explanation}\n`;
      if (c.notes && mistake.userNotes) text += `> *心得:* ${mistake.userNotes}\n`;
      
      this.insertText(text + '\n');
      this.showReferenceModal.set(false);
      this.activeRefId.set(null);
  }

  handleTab(e: KeyboardEvent) {
      e.preventDefault();
      this.insertText('  '); 
  }

  scrollToHeading(id: string) {
      const el = document.getElementById(id);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }

  // --- Resizing Logic ---

  startResize(type: 'sidebar' | 'editor' | 'outline', e: MouseEvent) {
      e.preventDefault();
      this.resizingState = {
          type,
          startX: e.clientX,
          startWidth: type === 'sidebar' ? this.sidebarWidth() : (type === 'outline' ? this.outlineWidth() : this.editorWidthPercent())
      };
      document.body.style.cursor = 'col-resize';
  }

  onResize(e: MouseEvent) {
      if (!this.resizingState.type) return;
      
      const delta = e.clientX - this.resizingState.startX;
      
      if (this.resizingState.type === 'sidebar') {
          const newWidth = Math.max(150, Math.min(600, this.resizingState.startWidth + delta));
          this.sidebarWidth.set(newWidth);
      } else if (this.resizingState.type === 'outline') {
          const newWidth = Math.max(150, Math.min(500, this.resizingState.startWidth - delta));
          this.outlineWidth.set(newWidth);
      } else if (this.resizingState.type === 'editor') {
          const containerWidth = window.innerWidth - (this.leftSidebarOpen() ? this.sidebarWidth() : 0) - (this.rightSidebarOpen() ? this.outlineWidth() : 0);
          if (containerWidth > 0) {
             const deltaPercent = (delta / containerWidth) * 100;
             const newPercent = Math.max(20, Math.min(80, this.resizingState.startWidth + deltaPercent));
             this.editorWidthPercent.set(newPercent);
          }
      }
  }

  stopResize() {
      this.resizingState.type = null;
      document.body.style.cursor = '';
  }

  formatDate(ts: number) { return new Date(ts).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}); }
  formatDateShort(ts: number) { return new Date(ts).toLocaleDateString([], {month: 'numeric', day: 'numeric'}); }
  formatTime(ts: number) { return new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }
  
  escapeHtml(text: string): string {
      if (!text) return '';
      return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
  }
}
