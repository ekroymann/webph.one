import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { catchError, map, concatMap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { GuiNotificationsService } from './gui-notifications.service';
import { environment } from '../environments/environment';
import { settings } from './jssip.config';

import { StorageService } from './storage.service';

export interface AuthKeysI {
  auth: string;
  p256dh: string;
}

export interface PushDataI {
  endpoint: string;
  expirationTime?: string;
  keys: AuthKeysI;
  p256dh: string;
}

export interface UserI {
  email?: string;
  user?: string;
  password?: string;
  _id?: string;
  _rev?: string;
  id?: string;
  push?: PushDataI;
}

interface KamailioUserI {
  pwd: string;
  user: string;
  status: string;
  msg: string;
  email_address: string;
}

@Injectable()
export class UserService {
  private _user = new BehaviorSubject<UserI>({});
  private _kamailioUrl = environment.kamailioNewNumber;
  private _pushNotificationServer = environment.endpoint;
  private _genericEmail = settings.custom.fakeEmail;

  private _prefix = settings.custom.virtualNumberPrefix;
  private _ready = new BehaviorSubject(false);
  private _busy = false;
  private subscription: PushSubscription;

  constructor(
    private _storageService: StorageService,
    private _http: Http,
    private _swPush: SwPush,
    private _guiNotification: GuiNotificationsService
    ) {
    this.getOrCreateUser()
      .subscribe( (user: UserI) => {
          this._user.next(user);
          this._ready.next(true);
      });
  }

  userData() {
    return this._user;
  }

  getOrCreateUser() {
    return this._storageService.table('user').read().pipe(
      concatMap((items: any[]) => {
        if (items.length > 0) {
          return Observable.of(items[0]);
        }
        return this.getNumber()
          .map(res => res.json())
          .map(result => {
            return {user: result.user, password: result.pwd, email: result.email_address}
        });
      }),
      concatMap((user: any) => {
        if (user._id !== undefined) {
          return this._storageService
            .table('user')
            .update(Object.assign({}, user))
        } else {
          return this._storageService
            .table('user')
            .create(user)
        }
      }),
      concatMap((user)=> {
        return this.subscribeToPush(user)
      }),
      catchError((error) => {
        this._guiNotification.send({text: 'We could not assign your new phone number. Reload the app later.'});
        throw error;
      })
    );
  }

  getNumber() {
    return this._http.get(this._kamailioUrl, { params: {
      prefix: this._prefix,
      email_address: Date.now() + this._genericEmail
    }});
  }

  register(user: UserI) {
    this._storageService
      .table('user')
      .create(user);
    this.subscribeToPush(user);
  }

  isUser() {
    return new Promise((res, rej) => {
      this._ready.subscribe((status) => {
        if (status === true) {
          res(typeof this._user.getValue().user !== 'undefined');
        }
      });
    });
  }

  subscribeToPush(user: UserI) {
    return this._http.get(this._pushNotificationServer + 'publicKey')
      .pipe(
        map(x => x.json()),
        concatMap((result) => {
          return this._swPush.requestSubscription({
            serverPublicKey: result.key
          })
        }),
        concatMap((subscription) => {
          return this.sendRegistration(subscription, user);
        }),
        catchError((error) => {
          console.log('[PUSH NOTIFICATIONS] - Error on registration', error);
          this._guiNotification.send({
            text:'You have denied permission to show notifications. This permission is used to let you know when there is an incoming call when you have the application closed or in the background.',
            timeout: 10000
          });
          throw error;
        })
      );
  }

  sendRegistration(sub: PushSubscription, user: UserI) {
    const rJson: any = sub.toJSON();
    return this._http.post(this._pushNotificationServer + 'save', {
      user: user.user,
      endpoint: rJson.endpoint,
      auth: rJson.keys.auth,
      p256dh: rJson.keys.p256dh
    }).pipe(concatMap(() => {
      const u = Object.assign({}, user, { push: rJson });
      return this._storageService
        .table('user')
        .update(u)
        .map(() => u);
    }));
  }
}
