import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FilesService } from '../services/files.service';
import { GraphSelectService } from '../services/graph-select.service';

// loosely based on https://fireship.io/lessons/angular-firebase-storage-uploads-multi/

@Component({
  selector: 'app-graph-selector',
  templateUrl: './graph-selector.component.html',
  styleUrls: ['./graph-selector.component.scss']
})
export class GraphSelectorComponent implements OnInit {

  files: File[];
  files$: Observable<any[]>;
  graphsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public fserv: FilesService,
    private gserv: GraphSelectService) {

    this.graphsForm = this.fb.group({
      chosenGraphFile: ['', Validators.required]
    });

    this.files$ = this.fserv.fileList;

    // DEBUG LOGS
    if (!environment.production) {
      this.files$.subscribe(docs => {
        for (const doc of docs) {
          console.log('name: ' + doc.displayName);
          console.log('desc: ' + doc.desc);
          console.log('file: ' + doc.fileLoc);
          console.log('user: ' + doc.uid);
          console.log('============');
        }
      });
    }
  }

  ngOnInit(): void {
    console.log('Graph selector: init!');
  }

  onSubmit() {
    const chosenGraphUrl = this.graphsForm.value.chosenGraphFile;
    console.warn('Form submitted with value: ' + chosenGraphUrl);
    this.gserv.changeUrl(chosenGraphUrl);
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
