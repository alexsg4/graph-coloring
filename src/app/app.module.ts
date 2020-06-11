import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Firebase
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import * as cfg from './firebase-config';

// Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

// App
import { GraphModule } from './graph/graph.module';

import {
  GraphSelectorComponent,
  GraphSelectorDialogOpenerComponent
} from './graph-selector/graph-selector.component';
import { UploaderComponent } from './uploader/uploader.component';
import { UploadSnackbarComponent } from './uploader/upload-snackbar/upload-snackbar.component';
import { ConsoleComponent } from './console/console.component';


@NgModule({
  declarations: [
    AppComponent,
    GraphSelectorComponent,
    GraphSelectorDialogOpenerComponent,
    UploaderComponent,
    UploadSnackbarComponent,
    ConsoleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Firebase
    AngularFireModule.initializeApp(cfg.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,

    // Material
    MatToolbarModule,
    MatGridListModule,
    MatButtonModule,
    MatTooltipModule,
    MatRadioModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,

    // App
    GraphModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
