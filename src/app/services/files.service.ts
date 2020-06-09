import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class FilesService {

  private files = [];
  private files$ = new Subject<any[]>();

  constructor(
    private afs: AngularFireStorage,
    private db: AngularFirestore,
    private auth: AuthService ) { }

  // use rxjs to update the file list dynamically
  get fileList(): Observable<any[]> {
    const collection = this.db.collection('graphs', ref =>
    ref.where('uid', 'in', [this.auth.currentUserId, '']));

    const files$ = collection.valueChanges();

    return files$;
  }
}
