import { Component, OnInit } from '@angular/core';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

import { UploadSnackbarComponent } from './upload-snackbar/upload-snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';


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

  constructor(
    private storage: AngularFireStorage,
    private db: AngularFirestore,
    private auth: AuthService,
    private snack: MatSnackBar) {
  }

  ngOnInit(): void {
    console.log('Uploader: init!');
  }

  async updateDatabase(fileUrl: string) {
    console.warn('DB Update function:');
    console.log('URL: ', fileUrl);

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
      docRef.update({ fileLoc: fileUrl }).then(() => {
        console.log('Entry updated successfully.');
      }).catch(err => {
        console.log(err.message);
      });
    } else {
      // Add the graph entry to the database
      this.db.collection('graphs').add({
        desc: 'Uploaded graph',
        displayName: 'User graph',
        fileLoc: fileUrl,
        uid: userID
      }).catch(err => {
        console.log(err.message);
      }).then(() => {
        console.warn('Graph entry added to DB!');
      });
    }
  }

  async tryUpload(file: File) {
    // check file is valid
    if (!file) {
      console.warn('Invalid file for upload!');
      return;
    }

    const userID = this.auth.currentUserId;

    // The storage path
    const path = `graphs/u/${userID}/user-graph`;

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
          this.updateDatabase(val);
        });
      }),
    ).subscribe(
      val => {  },
      err => { this.snack.open(err.message, 'Dismiss'); },
      () => { this.snack.open('Upload complete.', 'Dismiss', {duration: 2000 }); },
    );
  }

  onFileSelected() {
    // get the selected file
    const inputNode: any = document.querySelector('#file');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const file = e.target.result;
      // console.log(file);

      // check it's ok and upload it
      this.tryUpload(file);
    };
    reader.onerror = (e: any) => {
      console.error(e);
    };
    reader.readAsArrayBuffer(inputNode.files[0]);
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
