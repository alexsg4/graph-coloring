import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

import { UploadSnackbarComponent } from './upload-snackbar/upload-snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GraphSelection } from '../services/graph-select.service';


@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss']
})
export class UploaderComponent implements OnInit {

  task: AngularFireUploadTask;

  percentage$: Observable<number>;
  percentage: number;
  snapshot: Observable<any>;
  downloadURL: Observable<string>;

  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    private storage: AngularFireStorage,
    private db: AngularFirestore,
    private auth: AuthService,
    private snack: MatSnackBar) {
  }

  ngOnInit(): void {
    console.log('Uploader: init!');
  }

  async updateDatabase(graphInfo: GraphSelection) {
    console.warn('DB Update function:');
    console.log('URL: ', graphInfo.url);
    console.log('FileType: ', graphInfo.ftype);

    const userID = this.auth.currentUserId;
    // Check if previous user graph exists databse
    let docRef = null;
    await this.db.collection('graphs', ref => ref.where('uid', '==', userID))
      .get().toPromise().then(snapshot => {
          if (snapshot.size === 1) {
            docRef = snapshot.docs[0].ref;
          } else if (snapshot.size > 1) {
            docRef = snapshot.docs[0].ref;
            console.warn('More than one graph db entry per user. THIS SHOULD NOT HAPPEN!');
          }
      }).catch(err => {console.log(err); });

    // document exists so we update fpath
    if (docRef) {
      console.log('Graph entry exists. Will update file path.');
      docRef.update({ fileLoc: graphInfo.url, fileType: graphInfo.ftype }).then(() => {
        console.log('Entry updated successfully.');
      }).catch(err => {
        console.log(err.message);
      });
    } else {
      // Add the graph entry to the database
      this.db.collection('graphs').add({
        desc: 'Uploaded graph',
        displayName: 'User graph',
        fileLoc: graphInfo.url,
        fileType: graphInfo.ftype,
        uid: userID
      }).catch(err => {
        console.log(err.message);
      }).then(() => {
        console.warn('Graph entry added to DB!');
      });
    }
  }

  async tryUpload(file: File, fileType: string) {
    // check file is valid
    if (!file || !fileType || !fileType.match('^gexf|xml|json$')) {
      console.warn('Invalid file for upload!');
      return;
    }

    const userID = this.auth.currentUserId;
    const extension = fileType.split('/').pop();

    // The storage path
    const path = `graphs/u/${userID}/user-graph.${extension}`;

    // Reference to storage bucket
    const storageRef = this.storage.ref(path);

    // If the user had a graph, delete it
    await storageRef.delete().toPromise().then(() => {
      console.warn('Previous graph deleted.');
    }).catch((err) => {
      if (err.code === 'storage/object-not-found') {
        console.log(`Can't delete, file did not exist!`);
      } else {
        console.error(err.message);
      }
    });

    // The main task
    this.task = this.storage.upload(path, file);

    // Progress monitoring
    this.percentage$ = this.task.percentageChanges();


    this.task.snapshotChanges().pipe(
      // The file's download URL
      finalize(() => {
        this.downloadURL = storageRef.getDownloadURL();
        this.downloadURL.subscribe(val => {
          this.updateDatabase({url: val, ftype: extension});
        });
      }),
    ).subscribe(
      val => {  },
      err => { this.snack.open(err.message, 'Dismiss'); },
      () => { this.snack.open('Upload complete.', 'Dismiss', {duration: 2000 }); },
    );
  }

  onFileSelected() {
    const reader = new FileReader();
    let fileType = null;

    reader.onload = (e: any) => {
      const inputFile = e.target.result;
      // console.log(file);

      // check it's ok and upload it
      this.tryUpload(inputFile, fileType);
    };
    reader.onerror = (e: any) => {
      console.error(e);
    };
    const file = this.fileInput.nativeElement.files[0];
    fileType = file.type || file.name.split('.').pop();
    reader.readAsArrayBuffer(file);
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
