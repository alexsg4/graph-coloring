import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class GraphSelectService {
  private selectionSource = new BehaviorSubject<GraphSelection>(null);
  currentSelection$ = this.selectionSource.asObservable();

  constructor(
    private afs: AngularFireStorage,
    private db: AngularFirestore,
    private auth: AuthService ) { }

  // return an observable to the Graph DB Entries
  get availableGraphs(): Observable<any> {
    const collection = this.db.collection('graphs', ref =>
    ref.where('uid', 'in', [this.auth.currentUserId, '']));

    const availableDocs$ = collection.snapshotChanges().pipe(map(actions => actions.map(a => {
      return {
        id: a.payload.doc.id,
        data: a.payload.doc.data()
      };
    })));
    return availableDocs$;
  }

  async selectGraphFromDB(docId: string) {
    // get a reference to the graph's doc
    const graphInfo = await this.db.collection('graphs').doc(docId).get().toPromise()
      .catch(e => { console.error(e); }
    );

    if (graphInfo && graphInfo.data()) {
      this.selectionSource.next({
        url: graphInfo.data().fileLoc || '',
        ftype: graphInfo.data().fileType || ''
      });
    }
  }
}

export interface GraphSelection {
  url: string;
  ftype: string;
}
