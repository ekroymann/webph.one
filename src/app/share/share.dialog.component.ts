import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-share-dialog',
  templateUrl: 'share.dialog.component.html',
  styleUrls: ['./share.dialog.component.scss']
})
export class ShareDialogComponent {
  constructor(public dialogRef: MatDialogRef<ShareDialogComponent>) {}
}
