import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraphSelectService } from '../services/graph-select.service';

// loosely based on https://fireship.io/lessons/angular-firebase-storage-uploads-multi/

@Component({
  selector: 'app-graph-selector',
  templateUrl: './graph-selector.component.html',
  styleUrls: ['./graph-selector.component.scss']
})
export class GraphSelectorComponent implements OnInit {

  docs$: Observable<any[]>;
  graphsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private gserv: GraphSelectService) {

    this.graphsForm = this.fb.group({
      chosenGraphDoc: [null, Validators.required]
    });

    this.docs$ = this.gserv.availableGraphs;

    // DEBUG LOGS
    if (!environment.production) {
      this.docs$.subscribe(docInfos => {
        for (const docInfo of docInfos) {
          console.log('ID: ' + docInfo.id);
          console.log('name: ' + docInfo.data.displayName);
          console.log('desc: ' + docInfo.data.desc);
          console.log('file: ' + docInfo.data.fileLoc);
          console.log('user: ' + docInfo.data.uid);
          console.log('============');
        }
      });
    }
  }

  ngOnInit(): void {
    console.log('Graph selector: init!');
  }

  onSubmit() {
    const docID = this.graphsForm.value.chosenGraphDoc;
    if (!environment.production) {
      console.warn('Form submitted with value: ' + docID);
    }
    this.gserv.selectGraphFromDB(docID);
  }
}

@Component({
  selector: 'app-graph-selector-open',
  template: `
    <button mat-raised-button (click) = "openDialog()"
      color="accent"
      matTooltip="Choose or upload a graph to color"> Graphs
    </button>
  `
})
export class GraphSelectorDialogOpenerComponent {

  constructor(public dialog: MatDialog) { }

  openDialog() {
    this.dialog.open(GraphSelectorComponent);
  }
}
