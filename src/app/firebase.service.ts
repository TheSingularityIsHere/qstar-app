import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, set } from '@angular/fire/database';
import { Observable, combineLatest, from, map } from 'rxjs';
import { ActiveData, FirebaseData, QuestionData, StateEnum, VotesData } from './shared/types';
import { IdentityService } from './identity.service';

// keys: questionId, identity
export type CountsData = Map<string, Map<string, number>>;

const COUNT_ONLINE_SECS = 3600;
const COUNT_VOTE_SECS = 3600;


function stringToProbability(s: string) {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  hash = hash >>> 0;
  return (hash % 100) / 100;
}

function getBiasedChoice(choice: string, biasA: number | undefined, id: string, questionId: string) {
  const prob = stringToProbability(id + questionId);
  // console.log(id, prob);
  if (biasA) {
    if (biasA > 0) {
      if (choice === 'B') {
        if (prob < biasA) {
          choice = 'A';
        }
      }
    }
    if (biasA < 0) {
      if (choice === 'A') {
        if (prob < -biasA) {
          choice = 'B';
        }
      }
    }
  }
  return choice;
}

function getActiveIds(active: ActiveData | null, secs: number) {
  if (!active) return null;
  const ret = new Set<string>();
  const now = Date.now();
  for (const [id, ts] of Object.entries(active)) {
    const dt = now - ts;
    if (dt / 1000 <= secs) {
      ret.add(id);
    }
  }
  return ret;
}

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

  onlineIds$: Observable<Set<string> | null> = this.active$.pipe(
    map(active => getActiveIds(active, COUNT_ONLINE_SECS)));

  votes$: Observable<VotesData | null> = this.data$.pipe(
    map(data => data?.survey.votes || null));

  counts$: Observable<CountsData | null> = this.data$.pipe(
    map(data => {
      const votes = data?.survey.votes;
      const questions = data?.survey.questions;
      const active = data?.survey.active || null;
      const online = getActiveIds(active, COUNT_VOTE_SECS) || new Set<string>();
      if (!votes || !questions || !online) return null;
      const ret: CountsData = new Map();
      for (const [idQuestionId, choice] of Object.entries(votes)) {
        const [id, questionId] = idQuestionId.split('-');
        if (!online.has(id)) continue;
        if (!ret.has(questionId)) {
          ret.set(questionId, new Map<string, number>());
        }
        const d = ret.get(questionId)!;
        const question = questions[questionId] || {};
        for (const identity of [question.identityA, question.identityB]) {
          if (!d.has(identity)) {
            d.set(identity, 0);
          }
        }
        const biasedChoice = getBiasedChoice(choice, question.biasA, id, questionId);
        const identityA = question.identityA || '?';
        const identityB = question.identityB || '?';
        const identity = {'A': identityA, 'B': identityB}[biasedChoice] || '??';
        if (!d.has(identity)) {
          d.set(identity, 0);
        }
        d.set(identity, (d.get(identity) || 0) + 1);
      }
      console.log('counts', ret);
      return ret;
    })
  );

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
