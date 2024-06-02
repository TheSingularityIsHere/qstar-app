import { Component, inject } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { combineLatest, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StateEnum } from '../shared/types';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {

  private firebaseService = inject(FirebaseService);
  data$ = combineLatest([
    this.firebaseService.state$,
    this.firebaseService.questionId$,
    this.firebaseService.question$,
  ]).pipe(map(([state, questionId, question]) => (
    {state, questionId, question}
  )));

  numOnline = 0;
  activeIds = new Set<string>();
  // key1: questionId, key2: answer
  votes = new Map<string, Map<string, number>>();

  getNumAnswered(questionId: string | null) {
    if (!questionId) return 0;
    const d = this.votes.get(questionId);
    if (!d) return 0;
    return [...d.values()].reduce((pv, cv) => pv + cv, 0);
  }

  getFraction(questionId: string | null, answer: string) {
    if (!questionId) return undefined;
    const d = this.votes.get(questionId);
    if (!d) return undefined;
    const numerator = [...d.entries()].filter(
      ([k, v]) => k === answer
    ).map(([k, v]) => v).reduce((pv, cv) => pv + cv, 0);
    const denumerator = [...d.values()].reduce((pv, cv) => pv + cv, 0);
    return numerator / denumerator;
  }

  constructor() {
    this.firebaseService.active$.subscribe(active => {
      if (!active) return;
      const now = Date.now();
      const activeIds = new Set<string>();
      for (const [id, ts] of Object.entries(active)) {
        if (now - ts < 5 * 1000) {
          activeIds.add(id);
        }
      }
      this.numOnline = activeIds.size;
    });
    this.firebaseService.votes$.subscribe(votesMap => {
      if (!votesMap) return;
      const votes = new Map<string, Map<string, number>>();
      for (const [idQuestionId, answer] of Object.entries(votesMap)) {
        const [id, questionId] = idQuestionId.split('-', 2);
        if (!votes.has(questionId)) {
          votes.set(questionId, new Map<string, number>);
        }
        const d = votes.get(questionId)!;
        if (!d.has(answer)) {
          d.set(answer, 0);
        }
        d.set(answer, d.get(answer)! + 1);
      }
      this.votes.clear();
      for (const [k, v] of votes.entries()) {
        this.votes.set(k, v);
      }
    });
    this.firebaseService.questionIds$.subscribe(questionIds => {
      this.questionIds = questionIds;
    })
  }

  questionIds : string[] | null = null;

  prev(questionId: string | null, state: StateEnum | null) {
    if (!questionId || !state || !this.questionIds) return;
    if (state === 'id') {
      state = 'stats';
    } else if (state === 'stats') {
      state = 'voting';
    } else {
      const idx = this.questionIds.indexOf(questionId);
      if (idx === 0) {
        questionId = this.questionIds[this.questionIds.length - 1];
      } else {
        questionId = this.questionIds[idx - 1];
      }
      state = 'id'
    }
    this.firebaseService.setState(questionId, state);
  }

  next(questionId: string | null, state: StateEnum | null) {
    if (!questionId || !state || !this.questionIds) return;
    if (state === 'voting') {
      state = 'stats';
    } else if (state === 'stats') {
      state = 'id';
    } else {
      const idx = this.questionIds.indexOf(questionId);
      questionId = this.questionIds[(idx + 1) % this.questionIds.length];
      state = 'voting';
    }
    this.firebaseService.setState(questionId, state);
  }

}
