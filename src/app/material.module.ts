import { NgModule } from '@angular/core';
import {
  MatTabsModule,
  MatToolbarModule,
  MatButtonModule,
  MatGridListModule,
  MatIconModule,
  MatListModule,
  MatDialogModule,
  MatInputModule
} from '@angular/material';

@NgModule({
  imports: [
    MatTabsModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatInputModule
  ],
  exports: [
    MatTabsModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatInputModule
  ],
})
export class CustomMaterialModule { }
