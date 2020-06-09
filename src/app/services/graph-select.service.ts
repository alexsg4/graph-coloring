import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphSelectService {
  private urlSource = new BehaviorSubject('');
  chosenGraphUrl$ = this.urlSource.asObservable();

  constructor() { }

  changeUrl(url: string) {
    if (!url || !url.match('^(https|gs):\/\/.+(\.gexf)?$')) {
      console.warn('invalid graph url ', url);
      return;
    }

    this.urlSource.next(url);
  }
}
