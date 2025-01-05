import { Component, inject } from '@angular/core';
import { CountsData, FirebaseService } from '../firebase.service';
import { combineLatest, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { QuestionData, StateEnum } from '../shared/types';

function isHuman(name: string) {
  return name.toLowerCase().startsWith('human');
}

interface ResultsRow {
  questionId: string | null;
  agent: string;
  human: string;
  count: number;
  total: number;
}

function getTable(counts: CountsData) {
  const table: Array<ResultsRow> = [];
  for (const [questionId, questionCounts] of counts.entries()) {
    let agents = new Set<string>();
    let humans = new Set<string>();
    let count = 0;
    let total = 0;
    for (const [identity, votes] of questionCounts.entries()) {
      total += votes;
      if (isHuman(identity)) {
        humans.add(identity);
      } else {
        agents.add(identity);
        count += votes;
      }
    }
    table.push({
      questionId,
      agent: [...agents].join('-'),
      human: [...humans].join('-'),
      count, total
    });
  }
  return table;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {

  private firebaseService = inject(FirebaseService);

  results$ = this.firebaseService.counts$.pipe(
    map(counts => {
      if (!counts) return null;
      return getTable(counts);
    })
  );

  totals$ = this.firebaseService.counts$.pipe(
    map(counts => {
      if (!counts) return null;
      const table = getTable(counts);
      const byIdentity = new Map<string, ResultsRow>();
      const emptyRow = {
        questionId: null, agent: '?', human: '', count: 0, total: 0,
      };
      for (const row of table) {
        const current = byIdentity.get(row.agent) || {...emptyRow, agent: row.agent};
        byIdentity.set(row.agent, {
          ...current,
          count: current.count + row.count,
          total: current.total + row.total,
        });
      }
      const agents = [...new Set(byIdentity.keys())];
      agents.sort();
      return agents.map(agent => byIdentity.get(agent) || emptyRow);
    })
  );

  currentResultRow$ = combineLatest([
    this.firebaseService.questionId$,
    this.results$,
  ]).pipe(map(([questionId, results]) => {
    if (!questionId || !results) return null;
    for (const row of results) {
      if (row.questionId === questionId) {
        return row;
      }
    }
    return null;
  })) 

  data$ = combineLatest([
    this.firebaseService.state$,
    this.firebaseService.questionId$,
    this.firebaseService.questionIds$,
    this.firebaseService.question$,
    this.firebaseService.onlineIds$,
    this.results$,
    this.totals$,
    this.currentResultRow$,
  ]).pipe(map(([state, questionId, questionIds, question, onlineIds, results, totals, currentResultRow]) => (
    {
      state,
      questionId,
      question,
      questionIndex: questionIds?.indexOf(questionId || ''),
      questionNum: questionIds.length,
      onlineIds,
      results,
      totals,
      currentResultRow
    }
  )));

  getFraction(question: QuestionData | null, result: ResultsRow | null, answer: 'A' | 'B') {
    if (!question || !result) return 0;
    const identity = {'A': question.identityA, 'B': question.identityB}[answer];
    if (isHuman(identity)) {
      return (result.total - result.count) / result.total;
    } else {
      return result.count / result.total;
    }
  }

  getNumAnswered(questionId: string | null) {
    return 0;
  }

  getOnline() {
    return 0;
  }

  constructor() {
    this.firebaseService.questionIds$.subscribe(questionIds => {
      this.questionIds = questionIds;
    })
  }

  formatState(state: StateEnum | null) {
    if (!state) return '';
    return {
      'voting': 'Voting (1/3)',
      'stats': 'Show Results (2/3)',
      'id': 'Reveal Identities (3/3)',
    }[state]
  }

  formatIdentity(identity: string | null | undefined) {
    if (!identity) return null;
    // Hide if it's Human1, Human2, ...
    if (isHuman(identity)) return 'Human';
    return identity;
  }

  questionIds : string[] | null = null;

  questionIdsStates() {
    const ret = ['-voting'];
    for (const questionId of (this.questionIds || [])) {
      ret.push(`${questionId}-voting`);
      ret.push(`${questionId}-stats`);
      ret.push(`${questionId}-id`);
    }
    ret.push('-id');
    return ret;
  }

  isLocal() {
    return true &&  location.href.startsWith('http://localhost');
  }

  prevNext(questionId: string | null, state: StateEnum | null, delta: number) {
    const idsStates = this.questionIdsStates();
    let idx = idsStates.indexOf(`${questionId || ''}-${state}`);
    // console.log('idx', idx, questionId, state, idsStates);
    if (idx === -1) {
      idx = 0;
    } else {
      idx = (idx + delta)
    }
    const nextIdState = idsStates[(idsStates.length + idx) % idsStates.length];
    // console.log('nextIdState', nextIdState);
    const [nextId, nextState] = nextIdState.split('-');
    this.firebaseService.setState(nextId, nextState as StateEnum);
  }
  prev(questionId: string | null, state: StateEnum | null) {
    this.prevNext(questionId, state, -1);
  }
  next(questionId: string | null, state: StateEnum | null) {
    this.prevNext(questionId, state, 1);
  }
}
