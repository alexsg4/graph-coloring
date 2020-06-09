import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-upload-snackbar',
  templateUrl: './upload-snackbar.component.html',
  styleUrls: ['./upload-snackbar.component.scss']
})
export class UploadSnackbarComponent implements OnInit {

  @Input() percentage;
  constructor() { }

  ngOnInit(): void {
  }

}
