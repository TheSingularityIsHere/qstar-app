import { Routes } from '@angular/router';
import { VoteComponent } from './vote/vote.component';
import { ResultsComponent } from './results/results.component';

export const routes: Routes = [
  // { path: '', redirectTo: 'vote', pathMatch: 'full' },
  // { path: 'vote', component: VoteComponent },
  { path: '', component: VoteComponent },
  { path: 'results', component: ResultsComponent },
];
