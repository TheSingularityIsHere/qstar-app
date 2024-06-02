import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, set } from '@angular/fire/database';
import { Observable, combineLatest, from, map } from 'rxjs';
import { ActiveData, FirebaseData, QuestionData, StateEnum, VotesData } from './shared/types';
import { IdentityService } from './identity.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private identityService = inject(IdentityService);

  constructor(private db: Database) {}

  getData(): Observable<FirebaseData | null> {

    // TODO: would it be faster to only subscribe to relevant parts?
    return new Observable<FirebaseData | null>(subscriber => {
      const dbRef = ref(this.db, '/');
      const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          subscriber.next(snapshot.val() as FirebaseData);
        } else {
          console.log('No data available');
          subscriber.next(null);
        }
      });

      return { unsubscribe };
    });
  }

  // TODO: setters should also use schema
  ping(): Observable<void> {
    const id = this.identityService.getId();
    const dbRef = ref(this.db, `survey/active/${id}`);
    return from(set(dbRef, Date.now()));
  }

  vote(questionId: string, human: 'A' | 'B') {
    const id = this.identityService.getId();
    const dbRef = ref(this.db, `survey/votes/${id}-${questionId}`);
    return from(set(dbRef, human));
  }

  setState(questionId: string, state: StateEnum) {
    const dbRef = ref(this.db, 'survey/state');
    return from(set(dbRef, `${questionId}-${state}`));
  }

  /// derived data.

  data$ = this.getData();

  questionId$: Observable<string | null> = this.data$.pipe(
    map(data => (data?.survey.state || '-').split('-')[0] || null));

  questionIds$: Observable<string[]> = this.data$.pipe(
    map(data => {
      const questionIds = Object.keys(data?.survey.questions || {});
      questionIds.sort();
      return questionIds;
    }));

    state$: Observable<StateEnum | null> = this.data$.pipe(
    map(data => (data?.survey.state || '-').split('-')[1] as StateEnum || null));

  question$: Observable<QuestionData | null> = combineLatest([this.data$, this.questionId$]).pipe(
    map(([data, questionId]) => {
      if (data && questionId) {
        if (data.survey.questions.hasOwnProperty(questionId)) {
          return data.survey.questions[questionId];
        }
        console.warn('Missing', questionId, 'in', data.survey.questions);
      }
      return null;
    })
  );

  active$: Observable<ActiveData | null> = this.data$.pipe(
    map(data => data?.survey.active || null));

  votes$: Observable<VotesData | null> = this.data$.pipe(
    map(data => data?.survey.votes || null));

  getVote(id: string): Observable<string | null> {
    return combineLatest([
      this.questionId$,
      this.votes$,
    ]).pipe(map(([questionId, votes]) => {
      if (!questionId || !votes) return null;
      const key = `${id}-${questionId}`;
      return votes[key] || null;
    }))
  }
  
  }
