import { Component, inject } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.css'
})
export class VoteComponent {

  activeAnswer$ = this.firebaseService.getVote(this.identityService.getId());
  data$ = combineLatest([
    this.firebaseService.question$,
    this.firebaseService.questionId$,
    this.firebaseService.state$,
    this.activeAnswer$,
  ]).pipe(map(([question, questionId, state, activeAnswer]) => (
    {question, questionId, state, activeAnswer}
  )));

  constructor(
    private firebaseService: FirebaseService,
    private identityService: IdentityService
  ) {}

  setActive(questionId: string | null, button: 'A' | 'B') {
    if (!questionId) return;
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
