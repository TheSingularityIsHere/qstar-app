import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet, NavigationStart, Router } from '@angular/router';

import { ResultsComponent } from './results/results.component';
import { VoteComponent } from './vote/vote.component';
import { version } from '../../package.json';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ResultsComponent, RouterModule, VoteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  title = `QSTAR Research App v${version}`;

  constructor(private router: Router, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(this.title);
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
