import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

//translation
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';  

import { CustomMaterialModule } from './material.module';

import { AppComponent } from './app.component';

import { CallModule } from './call/call.module';
import { DirectoryModule } from './directory/directory.module';
import { ShareModule } from './share/share.module';
import { ChatModule } from './chat/chat.module';

import { ToneService } from './tone.service';
import { JsSipService } from './jssip.service';
import { DirectoryService } from './directory.service';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { CallStatusComponent } from './call-status/call-status.component';
import { CallSurveyComponent } from './call-survey/call-survey.component';
import { CallSurveyService } from './call-survey.service';
import { MessageBoxComponent } from './message-box/message-box.component';
import { GuiNotificationsService } from './gui-notifications.service';
import { SmsService } from './sms.service';

import {MATERIAL_COMPATIBILITY_MODE} from '@angular/material';
import {MatTabsModule} from '@angular/material/tabs';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
export const appRoutes: Routes  = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'call'
  },
  {
    path: 'call',
    loadChildren: './call/call.module#CallModule'
  },
  {
    path: 'directory',
    loadChildren: './directory/directory.module#DirectoryModule'
  },
  {
    path: 'share',
    loadChildren: './share/share.module#ShareModule'
  },
  {
    path: 'chat',
    loadChildren: './chat/chat.module#ChatModule'
  },
  {
    path: '**',
    redirectTo: '/call',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    CallStatusComponent,
    CallSurveyComponent,
    MessageBoxComponent
  ],
  exports: [TranslateModule],
  imports: [
    HttpClientModule,
    CommonModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
  }),
    RouterModule.forRoot(
      appRoutes,
      {
        preloadingStrategy: PreloadAllModules,
        useHash: true
      }
    ),
    ServiceWorkerModule.register('/ngsw-worker.js'),
    CustomMaterialModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpModule,
    CallModule,
    ShareModule,
    DirectoryModule,
    ChatModule,
    CommonModule
  ],
  providers: [
    ToneService,
    JsSipService,
    DirectoryService,
    StorageService,
    UserService,
    CallSurveyService,
    GuiNotificationsService,
    SmsService,
    {provide: MATERIAL_COMPATIBILITY_MODE, useValue: true},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
