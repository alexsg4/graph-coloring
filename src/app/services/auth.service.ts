import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState$: Observable<firebase.User>;
  private user: any;

  constructor(private afAuth: AngularFireAuth) {
    this.authState$ = this.afAuth.authState;
  }

  async anonLogin() {
    return this.afAuth.signInAnonymously().catch((error) => {
      console.error(error.code);
      console.error(error.message);
    }).then((credential) => {
      this.user = credential ? credential.user : null;
      console.warn('User logged in annonymously:, ' + this.user.uid || '');
    });
  }

  async logOut() {
    await this.afAuth.signOut().then(() => {
      console.warn('User logged out!');
    });
  }

  get currentUserId(): string {
    return this.user ? this.user.uid : '';
  }
}
