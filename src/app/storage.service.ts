import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';

import { DirectoryItemI } from './directory.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';

PouchDB.plugin(PouchFind);
PouchDB.debug.enable('*');

interface DbTableMethods {
  create?: Function;
  read?: Function;
  update?: Function;
  delete?: Function;
}

@Injectable()
export class StorageService {
    private _db;

    constructor() {
        this._db = new PouchDB('webphone');
    }

    /**
     * Get table object form local storage
     * @param name Name of the table
     */
    table(name: string): DbTableMethods {
        return {
            create: (data) =>
                Observable.fromPromise(
                    this._db
                        .post( Object.assign({}, data, { type: name} ) )
                )
                .map((result: any) => Object.assign({}, data, {_id: result.id}))
            ,
            read: () =>
                Observable.fromPromise(
                    this._db
                        .find({
                            selector: { type: name }
                        })
                )
                .map( (x: any) => x.docs )
            ,
            update: (data) =>
                Observable.fromPromise(
                    this._db
                        .get(data._id)
                        .then((doc) => {
                            const d = Object.assign({}, doc, data );
                            return this._db
                                .put( d )
                                .then((x: any) => Object.assign({}, d, {_id: x.id, _rev: x.rev}));
                        })
                )
            ,
            delete: (data) =>
                Observable.fromPromise(
                    this._db
                        .get(data._id)
                        .then((doc) =>
                            this._db
                                .remove(doc)
                        )
                )
        };
    }

}
