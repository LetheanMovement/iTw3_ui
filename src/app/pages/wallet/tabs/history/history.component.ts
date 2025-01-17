import {
  AfterViewChecked,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { VariablesService } from '@parts/services/variables.service';
import { ActivatedRoute } from '@angular/router';
import { Transaction } from '@api/models/transaction.model';
import BigNumber from 'bignumber.js';
import { PaginationService } from '@store/pagination/pagination.service';
import { PaginationStore } from '@store/pagination/pagination.store';
import { Wallet } from '@api/models/wallet.model';
import { BackendService } from '@api/services/backend.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { hasOwnProperty } from '@parts/functions/hasOwnProperty';

@Component({
  selector: 'app-history',
  template: `
    <div class="history-wrap" fxFlexFill fxLayout="column">
      <div class="wrap-table scrolled-content mb-2" fxFlex="1 1 auto">
        <table class="history-table">
          <thead>
            <tr #head (window:resize)="calculateWidth()">
              <th>
                <div class="bg title">{{ 'HISTORY.STATUS' | translate }}</div>
              </th>
              <th>
                <div class="bg title">{{ 'HISTORY.AMOUNT' | translate }}</div>
              </th>
              <th>
                <div class="bg title">{{ 'HISTORY.FEE' | translate }}</div>
              </th>
              <th>
                <div class="bg title">{{ 'HISTORY.ADDRESS' | translate }}</div>
              </th>
              <th>
                <div class="bg title">{{ 'HISTORY.DATE' | translate }}</div>
              </th>
            </tr>
            <div class="row-divider"></div>
          </thead>
          <tbody>
            <ng-container
              *ngFor="let item of variablesService.currentWallet.history"
            >
              <tr
                (click)="openDetails(item.tx_hash)"
                [class.locked-transaction]="
                  !item.is_mining && item.unlock_time > 0
                "
              >
                <td>
                  <div
                    [ngClass]="item.is_income ? 'received' : 'send'"
                    class="status text-ellipsis"
                    fxLayout="row"
                    fxLayoutAlign=" center"
                  >
                    <ng-container *ngIf="getHeight(item) < 10">
                      <svg
                        [delay]="500"
                        class="confirmation mr-1"
                        placement="bottom-left"
                        style="transform: rotateZ(-90deg)"
                        tooltip="{{
                          'HISTORY.STATUS_TOOLTIP'
                            | translate
                              : { current: getHeight(item), total: 10 }
                        }}"
                        tooltipClass="table-tooltip"
                      >
                        <circle
                          cx="50%"
                          cy="50%"
                          fill="transparent"
                          r="0.7rem"
                          stroke="rgba(31, 143, 235, 0.33)"
                          stroke-dasharray="100"
                          stroke-dashoffset="0"
                          stroke-width="0.3rem"
                        ></circle>
                        <circle
                          [style.stroke-dashoffset]="strokeSize(item)"
                          [style.stroke]="
                            item.is_income ? '#16d1d6' : '#1f8feb'
                          "
                          class="progress-circle"
                          cx="50%"
                          cy="50%"
                          fill="transparent"
                          r="0.7rem"
                          stroke-dasharray="4.5rem"
                          stroke-dashoffset="4.5rem"
                          stroke-linecap="round"
                          stroke-width="0.3rem"
                        ></circle>
                      </svg>
                    </ng-container>
                    <ng-container *ngIf="getHeight(item) === 10">
                      <img
                        *ngIf="!item.is_income"
                        alt=""
                        class="status-transaction mr-1"
                        src="assets/icons/blue/send.svg"
                      />
                      <img
                        *ngIf="item.is_income"
                        alt=""
                        class="status-transaction mr-1"
                        src="assets/icons/aqua/receive.svg"
                      />
                    </ng-container>
                    <span class="status-transaction-text">{{
                      (item.is_income ? 'HISTORY.RECEIVED' : 'HISTORY.SEND')
                        | translate
                    }}</span>
                    <ng-container
                      *ngIf="item.unlock_time !== 0 && item.tx_type !== 6"
                    >
                      <ng-container *ngIf="isLocked(item); else unlock">
                        <ng-container *ngIf="item.unlock_time < 500000000">
                          <i
                            [class.position]="
                              variablesService.height_app - item.height < 10 ||
                              (item.height === 0 && item.timestamp > 0)
                            "
                            [delay]="500"
                            class="icon lock-transaction mr-1"
                            placement="bottom-left"
                            tooltip="{{
                              'HISTORY.LOCK_TOOLTIP'
                                | translate
                                  : { date: time(item) | date : 'MM.dd.yy' }
                            }}"
                            tooltipClass="table-tooltip"
                          ></i>
                        </ng-container>
                        <ng-container *ngIf="item.unlock_time > 500000000">
                          <i
                            [class.position]="
                              variablesService.height_app - item.height < 10 ||
                              (item.height === 0 && item.timestamp > 0)
                            "
                            [delay]="500"
                            class="icon lock-transaction mr-1"
                            placement="bottom-left"
                            tooltip="{{
                              'HISTORY.LOCK_TOOLTIP'
                                | translate
                                  : {
                                      date:
                                        item.unlock_time * 1000
                                        | date : 'MM.dd.yy'
                                    }
                            }}"
                            tooltipClass="table-tooltip"
                          ></i>
                        </ng-container>
                      </ng-container>
                      <ng-template #unlock>
                        <i
                          [class.position]="
                            variablesService.height_app - item.height < 10 ||
                            (item.height === 0 && item.timestamp > 0)
                          "
                          class="icon unlock-transaction mr-1"
                        ></i>
                      </ng-template>
                    </ng-container>
                  </div>
                </td>
                <td>
                  <div class="text-ellipsis">
                    <span
                      *ngIf="
                        item.sortAmount && item.sortAmount.toString() !== '0'
                      "
                    >
                      {{ item.sortAmount | intToMoney }}
                      {{ variablesService.defaultCurrency }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="text-ellipsis">
                    <span
                      *ngIf="item.sortFee && item.sortFee.toString() !== '0'"
                    >
                      {{ item.sortFee | intToMoney }}
                      {{ variablesService.defaultCurrency }}
                    </span>
                  </div>
                </td>
                <td class="remote-address">
                  <ng-container
                    *ngIf="!(item.tx_type === 0); else walletOrAliases"
                    class="text-ellipsis"
                  >
                    <span
                      *ngIf="
                        !(
                          item.tx_type === 0 &&
                          item.remote_addresses &&
                          item.remote_addresses[0]
                        )
                      "
                    >
                      {{ item | historyTypeMessages }}
                    </span>
                  </ng-container>
                  <ng-template #walletOrAliases>
                    <div
                      *ngIf="
                        item.tx_type === 0 &&
                        item.remote_addresses &&
                        item.remote_addresses[0] &&
                        !item.remote_aliases?.length
                      "
                      class="text-ellipsis"
                    >
                      <span
                        (contextmenu)="
                          variablesService.onContextMenuOnlyCopy(
                            $event,
                            item.remote_addresses[0]
                          )
                        "
                      >
                        {{ item.remote_addresses[0] | slice : 0 : 6 }}
                        ...{{ item.remote_addresses[0] | slice : -6 }}
                      </span>
                    </div>
                    <ng-container
                      *ngIf="item.remote_aliases && item.remote_aliases.length"
                    >
                      <div fxLayout="row wrap">
                        <ng-container *ngFor="let alias of item.remote_aliases">
                          <ng-container *ngIf="alias && alias.length">
                            <div
                              (contextmenu)="
                                variablesService.onContextMenuOnlyCopy(
                                  $event,
                                  '@' + alias
                                )
                              "
                              [class.available]="
                                alias.length >= 1 && alias.length <= 5
                              "
                              [class.mb-0_5]="item.remote_aliases.length >= 2"
                              [class.mr-0_5]="item.remote_aliases.length >= 2"
                              class="alias"
                              fxLayout="row inline"
                            >
                              {{ '@' + alias }}
                            </div>
                          </ng-container>
                        </ng-container>
                      </div>
                    </ng-container>
                  </ng-template>
                </td>
                <td>
                  <div class="text-ellipsis">
                    {{ item.timestamp * 1000 | date : 'dd-MM-yyyy HH:mm' }}
                  </div>
                </td>
              </tr>
              <div class="row-divider"></div>
              <tr [class.open]="item.tx_hash === openedDetails" class="details">
                <td colspan="5">
                  <app-transaction-details
                    *ngIf="item.tx_hash === openedDetails"
                    [sizes]="calculatedWidth"
                    [transaction]="item"
                  ></app-transaction-details>
                </td>
              </tr>
              <div
                [class.hide]="item.tx_hash !== openedDetails"
                class="row-divider"
              ></div>
            </ng-container>
          </tbody>
        </table>
      </div>
      <div class="pagination-wrapper">
        <div
          class="pagination"
          fxLayout="row"
          fxLayoutAlign="space-between center"
        >
          <div class="left" fxLayout="row" fxLayoutAlign=" center">
            <button
              (click)="setPage(variablesService.currentWallet.currentPage - 1)"
              [disabled]="
                variablesService.currentWallet.currentPage === 1 ||
                variablesService.sync_started ||
                wallet
              "
              class="btn-icon circle small mr-1"
            >
              <i class="icon arrow-left-stroke"></i>
            </button>

            <ng-container *ngIf="!mining">
              <button
                (click)="setPage(page)"
                *ngFor="let page of variablesService.currentWallet.pages"
                [class.color-primary]="
                  variablesService.currentWallet.currentPage === page
                "
                class="mr-0_5"
              >
                {{ page }}
              </button>
            </ng-container>

            <ng-container *ngIf="mining">
              <button
                (click)="setPage(variablesService.currentWallet.currentPage)"
                [disabled]="
                  stop_paginate || variablesService.sync_started || wallet
                "
                [ngClass]="{
                  'color-primary': variablesService.currentWallet.currentPage,
                  disabled: variablesService.sync_started || wallet
                }"
                class="mr-0_5"
              >
                {{ variablesService.currentWallet.currentPage }}
              </button>
            </ng-container>

            <button
              (click)="setPage(variablesService.currentWallet.currentPage + 1)"
              [disabled]="
                stop_paginate || variablesService.sync_started || wallet
              "
              class="btn-icon circle small ml-0_5"
            >
              <i class="icon arrow-right-stroke"></i>
            </button>
          </div>
          <div class="right" fxLayout="row" fxLayoutAlign=" center">
            <span class="switch-text mr-2">Hide mining transactions</span>
            <app-switch
              (emitChange)="toggleMiningTransactions()"
              [disabled]="variablesService.sync_started || !!wallet"
              [value]="mining"
            ></app-switch>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: auto;
      }
    `,
  ],
})
export class HistoryComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('head', { static: true }) head: ElementRef;

  openedDetails = '';

  calculatedWidth = [];

  stop_paginate = false;

  mining = false;

  wallet: Wallet;

  x = new BigNumber(3);

  y = new BigNumber(0.2);

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    public variablesService: VariablesService,
    private pagination: PaginationService,
    private backend: BackendService,
    private ngZone: NgZone,
    private paginationStore: PaginationStore
  ) {}

  ngOnInit(): void {
    this.route.parent.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.openedDetails = '';
      },
    });
    let restore = false;
    if (
      hasOwnProperty(
        this.variablesService.after_sync_request,
        String(this.variablesService.currentWallet.wallet_id)
      )
    ) {
      restore =
        this.variablesService.after_sync_request[
          this.variablesService.currentWallet.wallet_id
        ];
    }
    if (
      !this.variablesService.sync_started &&
      restore &&
      this.variablesService.currentWallet.wallet_id
    ) {
      this.wallet = this.variablesService.getNotLoadedWallet();
      if (this.wallet) {
        this.tick();
      }
      // if this is was restore wallet and it was selected on moment when sync completed
      this.getRecentTransfers();
      this.variablesService.after_sync_request[
        this.variablesService.currentWallet.wallet_id
      ] = false;
    }
    let after_sync_request = false;
    if (
      hasOwnProperty(
        this.variablesService.after_sync_request,
        String(this.variablesService.currentWallet.wallet_id)
      )
    ) {
      after_sync_request =
        this.variablesService.after_sync_request[
          this.variablesService.currentWallet.wallet_id
        ];
    }
    if (after_sync_request && !this.variablesService.sync_started) {
      // if user click on the wallet at the first time after restore.
      this.getRecentTransfers();
    }

    if (
      hasOwnProperty(
        this.variablesService.stop_paginate,
        String(this.variablesService.currentWallet.wallet_id)
      )
    ) {
      this.stop_paginate =
        this.variablesService.stop_paginate[
          this.variablesService.currentWallet.wallet_id
        ];
    } else {
      this.stop_paginate = false;
    }
    // this will hide pagination a bit earlier
    this.wallet = this.variablesService.getNotLoadedWallet();
    if (this.wallet) {
      this.tick();
    }

    this.variablesService.getWalletChangedEvent
      .pipe(
        filter(w => !!w),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (currentWallet: Wallet) => {
          this.mining = currentWallet.exclude_mining_txs;
        },
      });
  }

  ngAfterViewChecked(): void {
    setTimeout(() => {
      this.calculateWidth();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  strokeSize(item): number {
    const rem = 8
    if ((this.variablesService.height_app - item.height >= 10 && item.height !== 0) || (item.is_mining === true && item.height === 0)) {
      return 0;
    } else {
      if (item.height === 0 || this.variablesService.height_app - item.height < 0) {
        return (4.5 * rem);
      } else {
        return ((4.5 * rem) - (((4.5 * rem) / 100) * ((this.variablesService.height_app - item.height) * 10)));
      }
    }
  }

  resetPaginationValues(): void {
    this.ngZone.run(() => {
      const total_history_item =
        this.variablesService.currentWallet.total_history_item;
      const count = this.variablesService.count;
      this.variablesService.currentWallet.totalPages = Math.ceil(
        total_history_item / count
      );
      this.variablesService.currentWallet.exclude_mining_txs = this.mining;
      this.variablesService.currentWallet.currentPage = 1;

      if (!this.variablesService.currentWallet.totalPages) {
        this.variablesService.currentWallet.totalPages = 1;
      }
      this.variablesService.currentWallet.totalPages >
      this.variablesService.maxPages
        ? (this.variablesService.currentWallet.pages = new Array(5)
            .fill(1)
            .map((value, index) => value + index))
        : (this.variablesService.currentWallet.pages = new Array(
            this.variablesService.currentWallet.totalPages
          )
            .fill(1)
            .map((value, index) => value + index));
    });
  }

  setPage(pageNumber: number): void {
    // this is will allow pagination for wallets that was open from existed wallets'
    if (pageNumber === this.variablesService.currentWallet.currentPage) {
      return;
    }
    if (
      this.variablesService.currentWallet.open_from_exist &&
      !this.variablesService.currentWallet.updated
    ) {
      this.variablesService.get_recent_transfers = false;
      this.variablesService.currentWallet.updated = true;
    }
    // if not running get_recent_transfers callback
    if (!this.variablesService.get_recent_transfers) {
      this.variablesService.currentWallet.currentPage = pageNumber;
    }
    if (!this.variablesService.get_recent_transfers) {
      this.getRecentTransfers();
    }
  }

  toggleMiningTransactions(): void {
    if (!this.variablesService.sync_started && !this.wallet) {
      const value = this.paginationStore.value;
      if (!value) {
        this.paginationStore.setPage(
          1,
          0,
          this.variablesService.currentWallet.wallet_id
        ); // add back page for the first page
      } else {
        const pages = value.filter(
          item =>
            item.walletID === this.variablesService.currentWallet.wallet_id
        );
        if (pages.length === 0) {
          this.paginationStore.setPage(
            1,
            0,
            this.variablesService.currentWallet.wallet_id
          ); // add back page for the first page
        }
      }
      this.mining = !this.mining;
      this.resetPaginationValues();
      this.getRecentTransfers();
    }
  }

  getRecentTransfers(): void {
    const offset = this.pagination.getOffset(
      this.variablesService.currentWallet.wallet_id
    );
    const value = this.paginationStore.value;
    const pages = value
      ? value.filter(
          item =>
            item.walletID === this.variablesService.currentWallet.wallet_id
        )
      : [];

    this.backend.getRecentTransfers(
      this.variablesService.currentWallet.wallet_id,
      offset,
      this.variablesService.count,
      this.variablesService.currentWallet.exclude_mining_txs,
      (status, data) => {
        const isForward = this.paginationStore.isForward(
          pages,
          this.variablesService.currentWallet.currentPage
        );
        if (this.mining && isForward && pages && pages.length === 1) {
          this.variablesService.currentWallet.currentPage = 1; // set init page after navigation back
        }

        const history = data && data.history;
        this.variablesService.stop_paginate[
          this.variablesService.currentWallet.wallet_id
        ] =
          (history && history.length < this.variablesService.count) || !history;
        this.stop_paginate =
          this.variablesService.stop_paginate[
            this.variablesService.currentWallet.wallet_id
          ];
        if (
          !this.variablesService.stop_paginate[
            this.variablesService.currentWallet.wallet_id
          ]
        ) {
          const page = this.variablesService.currentWallet.currentPage + 1;
          if (
            isForward &&
            this.mining &&
            history &&
            history.length === this.variablesService.count
          ) {
            this.paginationStore.setPage(
              page,
              data.last_item_index,
              this.variablesService.currentWallet.wallet_id
            ); // add back page for current page
          }
        }

        this.pagination.calcPages(data);
        this.pagination.prepareHistory(data, status);

        this.ngZone.run(() => {
          this.variablesService.get_recent_transfers = false;
          if (
            hasOwnProperty(
              this.variablesService.after_sync_request,
              String(this.variablesService.currentWallet.wallet_id)
            )
          ) {
            // this is will complete get_recent_transfers request
            // this will switch of
            this.variablesService.after_sync_request[
              this.variablesService.currentWallet.wallet_id
            ] = false;
          }
        });
      }
    );
  }

  tick(): void {
    const walletInterval = setInterval(() => {
      this.wallet = this.variablesService.getNotLoadedWallet();
      if (!this.wallet) {
        clearInterval(walletInterval);
      }
    }, 1000);
  }

  getHeight(item): number {
    if (
      (this.variablesService.height_app - item.height >= 10 &&
        item.height !== 0) ||
      (item.is_mining === true && item.height === 0)
    ) {
      return 10;
    } else {
      if (
        item.height === 0 ||
        this.variablesService.height_app - item.height < 0
      ) {
        return 0;
      } else {
        return this.variablesService.height_app - item.height;
      }
    }
  }

  openDetails(tx_hash): void {
    if (tx_hash === this.openedDetails) {
      this.openedDetails = '';
    } else {
      this.openedDetails = tx_hash;
    }
  }

  calculateWidth(): void {
    this.calculatedWidth = [];
    this.calculatedWidth.push(
      this.head.nativeElement.childNodes[0].clientWidth
    );
    this.calculatedWidth.push(
      this.head.nativeElement.childNodes[1].clientWidth +
        this.head.nativeElement.childNodes[2].clientWidth
    );
    this.calculatedWidth.push(
      this.head.nativeElement.childNodes[3].clientWidth
    );
    this.calculatedWidth.push(
      this.head.nativeElement.childNodes[4].clientWidth
    );
  }

  time(item: Transaction): number {
    const now = new Date().getTime();
    const unlockTime =
      now + (item.unlock_time - this.variablesService.height_max) * 60 * 1000;
    return unlockTime;
  }

  isLocked(item: Transaction): boolean {
    if (
      item.unlock_time > 500000000 &&
      item.unlock_time > new Date().getTime() / 1000
    ) {
      return true;
    }
    return (
      item.unlock_time < 500000000 &&
      item.unlock_time > this.variablesService.height_max
    );
  }
}
