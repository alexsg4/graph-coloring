import { Component, OnInit } from '@angular/core';
import { ConsoleWriterService } from './console-writer.service';
import * as utils from '../utils/misc';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

  maxMessages = 30;
  messageBuffer: string[];

  constructor(private writer: ConsoleWriterService) { }

  ngOnInit(): void {
    this.messageBuffer = new Array<string>();

    this.writer.currentMessage$.subscribe(msg => {
      this.tryWriteMessage(msg);
    });
  }

  private tryWriteMessage(msg: string) {
    if (this.messageBuffer.length === this.maxMessages) {
      console.warn('Message buffer full, will reset console');
      this.reset();
    } else if (msg.length) {
      if (!this.handleSpecialMessage(msg)) {
        this.messageBuffer.push(msg);
      }
    }
  }

  private handleSpecialMessage(msg: string): boolean {
    if (!msg || !msg.length || !msg.match('^\#[a-z]+$')) {
      return false;
    }

    // TODO handle special messages better, maybe store them in a file
    // handle special messages that start with '#' and must be lowercase
    switch (msg.slice(1)) {
      case 'reset':
        this.reset();

        return true;
    }
    return false;
  }

  private async reset() {
    console.warn('Resetting console!');

    // clear the buffer
    this.messageBuffer.length = 0;

    // display cleared message
    this.tryWriteMessage('Console was reset!');

    // remove it after a set time
    await utils.delay(1000);
    this.messageBuffer.splice(0, 1);
  }
}
