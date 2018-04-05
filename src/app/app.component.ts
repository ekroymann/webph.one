import { Component } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JsSipService } from './jssip.service';
import { DirectoryService, DirectoryItemI } from './directory.service';
import { UserService, UserI } from './user.service';
import { CallSurveyService } from './call-survey.service';
import { GuiNotificationsService } from './gui-notifications.service';
import { versions } from '../environments/versions';

import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material';

//translate
import {TranslateService} from '@ngx-translate/core';

// Until it is decided to remove the support
// to the versions prior to the release.
import * as LocalForage from 'localforage';
import { StorageService } from './storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  call:Object = this.translate.get('call').subscribe((res) => {res.calling; console.log(res)});
  /** This object manages the top navigation bar. */
  public links: any[] = [
    { label: "call", link: '/call' },
    { label: 'Directory', link: '/directory' },
    { label: 'Share', link: '/share' }
  ];

  constructor(
    public iconRegistry: MatIconRegistry,
    public sanitizer: DomSanitizer,
    public directoryService: DirectoryService,
    private userService: UserService,
    public jsSip: JsSipService,
    public storageService: StorageService,
    public callSurveyService: CallSurveyService,
    public notificationsGui: GuiNotificationsService,
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    private translate: TranslateService) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('es');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('es');

    translate.get('call').subscribe((res) => {
    this.call = res.calling; console.log(this.call)});
    // Apply migration from the old database.
    this.checkVersion();
    this.checkDB().then( () => {
      this.loadUser();
      this.loadDirectory();
      this.loadPush();
    });
    this.loadIcons([
      'call-end',
      'call',
      'contact-add',
      'arrow-down',
      'person',
      'star-full',
      'star-border',
      'close',
      'sms'
    ]);

    // Listen for autoanswer and autoreject messages
    navigator.serviceWorker.addEventListener('message', x => {
      if ( typeof x.data.autoanswer !== 'undefined' && x.data.autoanswer === true) {
        setTimeout(() => this.jsSip.handleAnswerIncoming(), 2000);
      }
      if ( typeof x.data.autoreject !== 'undefined' && x.data.autoreject === true) {
        this.jsSip.handleRejectIncoming();
      }
    });
  }


  /**
   * Load svg files into material-icons
   * @param icons  Array of svg file names to load, without the extension
   */
  loadIcons (icons: string[]) {
    icons.forEach( icon =>
      this.iconRegistry
        .addSvgIcon(
          icon,
          this.sanitizer.bypassSecurityTrustResourceUrl('assets/' + icon + '.svg')
        )
    );
  }

  /**
   * Initialize the user system.
   * Load the local database and try to recover the user's data.
   * If they do not exist try to create one automatically.
   */
  loadUser () {
    let connected = false;
    /** subscribe to de user data service */
    this.userService.userData().subscribe(
      () => {
        /** If the database is fully loaded and there is no user data */
        this.userService.isUser().then( status => {
          if (status === false) {
            /** Register user and whait for new user data*/
            this.firstTimeMessage();
            this.userService.createUser()
              .catch(console.log);
          /** If the database is fully loaded and there is user data */
          } else if (status === true) {
            /** Start the jsSip connection */
            if (connected === false) {
              this.jsSip.connect(this.userService.userData().getValue());
            }
            connected = true;
          }
        });
      }
    );
  }

  /**
   * Initialize the directory system.
   * Load directory and contacts from localstorage
   */
  loadDirectory () {
    this.directoryService.get().subscribe();
  }

  loadPush() {
    this.userService.isUser().then((status) => {
        if ( status ===  true  ) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration()
            .then( (registration) => {
              if (registration) {
                console.log('[SW] - Registration');
                registration.pushManager.getSubscription()
                .then( subs => {
                  if (subs !== null) {
                    console.log('[SW] - Alredy registerd', subs);
                  } else {
                    console.log('[SW] - User not registred', subs);
                    console.log('[SW] - Send registration', subs);
                    this.userService.subscribeToPush(this.userService.userData().getValue());
                  }
                })
                .catch( err => console.log('[SW] - Error on subscription', err));
              } else {
                console.log('[SW] - Error Registration not found', registration);
              }
            })
            .catch( x => console.log('[SW] - Error', x));
          }
        }
    });
  }

  /**
   * This checks if a LocalForage db exists and
   * migrates all the contents to PouchDB, this
   * function will be removed in the future.
   */
  checkDB () {
    return new Promise ((res, rej ) => {
      // Get user and contacts data
      LocalForage.config({
        driver: LocalForage.INDEXEDDB,
        name: 'webphoneDB'
      });
      const user: Promise<UserI[]> = LocalForage.getItem('user');
      const contacts: Promise<DirectoryItemI[]> = LocalForage.getItem('contacts');

      // Check save and delete
      Promise.all([user, contacts])
        .then((data) => {
          // User
          const userMigration = new Promise((resUser, rejUser) => {
            if ( data[0] !== null ) {
              this.userService.isUser().then((status) => {
                  if ( status ===  false && typeof data[0][1] !== 'undefined') {
                    console.log('DB MIGRATION - User migrated to new db');
                    delete data[0][1].id;
                    this.storageService.table('user').create(data[0][1]).then(resUser);
                    LocalForage.removeItem('user');
                  } else {
                    console.log('DB MIGRATION - User found in new and old db');
                    resUser();
                  }
                });
            } else {
              console.log('DB MIGRATION - Old user not found');
              resUser();
            }
          });

          // Contacts
          const contactsMigrations = new Promise((resContacts, rejContacts) => {
            if ( data[1] !== null ) {
              data[1].map(contact => this.storageService.table('contacts').create(contact));
              console.log('DB MIGRATION - Contacts migrated to new db');
              LocalForage.removeItem('contacts');
              Promise.all(data[1]).then(resContacts).catch(rejContacts);
            } else {
              console.log('DB MIGRATION - Old Contacts not found');
              resContacts();
            }
          });

          Promise.all([userMigration, contactsMigrations]).then(res).catch(rej);
        })
        .catch(rej);
    });
  }

  firstTimeMessage() {
    if (navigator.userAgent.match(/Android/i) && navigator.userAgent.match(/Mobile/i)) {
      setTimeout(() => this.notificationsGui.send({text: `Your browser may not automatically
      offer you the option to add a shortcut to this application. You can do it manually by
      selecting the options in the upper right corner, and then in the "Add to home screen"`,
      timeout: 10000}), 12000);
    }
  }

  checkVersion() {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json; charset=utf-8');
    headers.append('Cache-Control', 'no-cache');
    headers.append('Cache-Control', 'no-store');
    headers.append('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT');

    const requestOptions = new RequestOptions({
      headers: headers,
      method: 'GET'
    });
    this.http.request('version.json', requestOptions).toPromise()
      .then(x => x.json())
      .then(version => {
        console.log('[APP UPDATE] - Check version' , version);
        if (versions.revision !== version.revision ) {
          navigator.serviceWorker.getRegistration()
            .then(registration => registration.update())
            .then(result => console.log('[APP UPDATE] - Updated' , version));
        } else {
          console.log('[APP UPDATE] - You have the current version', version.revision);
        }
    }).catch(
    err => console.log('[APP UPDATE] - Fail to get actual version'));
  }

}
