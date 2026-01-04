
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar.component';
import { MistakeIngestComponent } from './components/mistake-ingest.component';
import { ReviewDeckComponent } from './components/review-deck.component';
import { DashboardComponent } from './components/dashboard.component';
import { NotebookComponent } from './components/notebook.component';
import { SettingsComponent } from './components/settings.component';
import { LibraryComponent } from './components/library.component';
import { StudyStoreService } from './services/study-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MistakeIngestComponent, ReviewDeckComponent, DashboardComponent, NotebookComponent, SettingsComponent, LibraryComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  store = inject(StudyStoreService);
}
