import { Component, inject } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.css'
})
export class VoteComponent {
  private firebaseService = inject(FirebaseService);
  data$ = combineLatest([
    this.firebaseService.question$,
    this.firebaseService.questionId$,
    this.firebaseService.state$,
  ]).pipe(map(([question, questionId, state]) => (
    {question, questionId, state}
  )));

  lastQuestionId: string | null = null;
  activeButton: string | null = null;

  constructor() {
    this.firebaseService.questionId$.subscribe(questionId => {
      if (this.lastQuestionId != questionId) {
        this.activeButton = null;
      }
      this.lastQuestionId = questionId;
    })
  }

  setActive(questionId: string | null, button: 'A' | 'B') {
    if (!questionId) return;
    this.activeButton = button;
    this.firebaseService.vote(questionId, button);
  }

  private pingInterval: any;

  ngOnInit(): void {
    this.startPinging();
  }

  ngOnDestroy(): void {
    this.stopPinging();
  }

  startPinging(): void {
    this.pingInterval = setInterval(() => {
      this.firebaseService.ping();
    }, 1000);
  }

  stopPinging(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

}
