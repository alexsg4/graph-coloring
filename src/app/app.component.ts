import { Component, OnInit } from '@angular/core';
import sigma from 'sigma';

declare const sigma: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'graph-coloring';

  ngOnInit(): void {
    sigma.parsers.gexf(
      'assets/graphs/testGraph.gexf',
      { container: 'graph-container' }
    );
  }
}
