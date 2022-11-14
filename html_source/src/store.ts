import { distinctUntilChanged, map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { Wallet } from './app/_helpers/models/wallet.model';
import { Injectable } from '@angular/core';
import { AssetsInfo } from './app/_helpers/models/assets';

export interface Sync {
  sync: boolean;
  wallet_id: number;
}

export enum StateKeys {
  wallets = 'wallets',
  sync = 'sync',
  assetsInfo = 'assetsInfo',
}

export interface State {
  [StateKeys.wallets]: Wallet[] | null | undefined;
  [StateKeys.sync]: Sync[]| null | undefined;
  [StateKeys.assetsInfo]: AssetsInfo | null | undefined;
}

const initialState: State = {
  wallets: undefined,
  sync: undefined,
  assetsInfo: undefined,
};

@Injectable()
export class Store {
  private subject = new BehaviorSubject<State>(initialState);
  private store = this.subject.asObservable().pipe(distinctUntilChanged());

  get state() {
    return this.subject.value;
  }

  select<T>(name: StateKeys): Observable<T> {
    return this.store.pipe(map((state) => state[name])) as unknown as Observable<T>;
  }

  set(name: StateKeys, value: any) {
    this.subject.next({ ...this.state, [name]: value });
  }
}
