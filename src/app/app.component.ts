import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet, NavigationStart, Router } from '@angular/router';

import { ResultsComponent } from './results/results.component';
import { VoteComponent } from './vote/vote.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ResultsComponent, RouterModule, VoteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  title = 'qstar-app';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const url = new URL(event.url, window.location.origin);
        // So we can manually navigate to routes:
        const goto = url.searchParams.get('goto');
        if (goto) {
          this.router.navigate([`/${goto}`]);
        }
      }
    });
  }
}
