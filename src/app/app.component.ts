import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Graph Coloring';

  ngOnInit(): void {
    console.log('AppComponent: OnInit!');
  }

}
