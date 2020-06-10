import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ConsoleWriterService {
  private messageSource = new BehaviorSubject('');
  currentMessage$ = this.messageSource.asObservable();

  constructor() { }

  writeMessage(message: string, logToConsole = '') {
    if (!message || !message.length) {
      console.warn('invalid message ', message);
      return;
    }

    this.messageSource.next(message);
    if (logToConsole && logToConsole.length) {
      switch (logToConsole.toLowerCase()) {
        case 'log':
          console.log('Console writer message: ', message);
          break;
        case 'warn':
          console.warn('Console writer message: ', message);
          break;
      }
    }
  }
}
