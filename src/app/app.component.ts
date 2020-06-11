import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Graph Coloring';

  constructor(
    private auth: AuthService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer) {

      iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('assets/icon/ico-github.svg'));
    }

  ngOnInit(): void {
    console.log('AppComponent: OnInit!');

    this.auth.anonLogin();
  }
}
