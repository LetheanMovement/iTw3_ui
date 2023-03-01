import {
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  Output,
} from '@angular/core';
import { Wallet } from '@api/models/wallet.model';
import { VariablesService } from '@parts/services/variables.service';
import { Asset, Assets } from '@api/models/assets.model';
import { BigNumber } from 'bignumber.js';
import { LOCKED_BALANCE_HELP_PAGE } from '@parts/data/constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IntToMoneyPipe, IntToMoneyPipeModule } from '@parts/pipes';
import { BackendService } from '@api/services/backend.service';
import { CommonModule } from '@angular/common';
import { DisablePriceFetchModule, TooltipModule } from '@parts/directives';
import { StakingSwitchComponent } from '@parts/components/staking-switch.component';

@Component({
  selector: 'app-wallet-card',
  template: `
    <div class="content">
      <div class="header">
        <div class="left">
          <div class="name text-ellipsis">
            <span *ngIf="wallet.new_contracts" class="indicator">
              {{ wallet.new_contracts }}
            </span>

            <span
              [delay]="500"
              [showWhenNoOverflow]="false"
              class="name"
              placement="top-left"
              tooltip="{{ wallet.name }}"
              tooltipClass="table-tooltip account-tooltip"
            >
              {{ !wallet.alias['name'] ? wallet.name : wallet.alias['name'] }}
            </span>
          </div>
        </div>
        <div class="right">
          <button
            (click)="eventClose.emit(wallet.wallet_id)"
            [delay]="500"
            [timeDelay]="500"
            placement="top"
            tooltip="{{ 'WALLET.TOOLTIPS.CLOSE' | translate }}"
            tooltipClass="table-tooltip account-tooltip"
            type="button"
          >
            <i class="icon close"></i>
          </button>
        </div>
      </div>

      <h4
        *appDisablePriceFetch
        class="price"
      >
        {{ wallet.balance | intToMoney | currency: 'LTHN ' }}
        {{

          wallet.getMoneyEquivalent(variablesService.moneyEquivalent)
            | intToMoney
            | currency : 'USD' || '---'
        }}
        <span
          [class.red]="variablesService.moneyEquivalentPercent < 0"
          class="percent"
        >
          {{ variablesService.moneyEquivalentPercent | number : '1.2-2' }}%
        </span>
      </h4>

      <ng-container
        *ngIf="
          (!wallet.is_auditable && !wallet.is_watch_only) ||
          (wallet.is_auditable && !wallet.is_watch_only)
        "
      >
        <div
          *ngIf="!(!wallet.loaded && variablesService.daemon_state === 2)"
          class="staking"
        >
          <span class="text">{{ 'SIDEBAR.ACCOUNT.STAKING' | translate }}</span>
          <app-staking-switch
            [(staking)]="wallet.staking"
            [wallet_id]="wallet.wallet_id"
          ></app-staking-switch>
        </div>
      </ng-container>

      <div
        *ngIf="!wallet.loaded && variablesService.daemon_state === 2"
        class="account-synchronization"
      >
        <div class="progress-bar">
          <div [style.width]="wallet.progress + '%'" class="fill"></div>
        </div>
        <div class="progress-percent">{{ wallet.progress }}%</div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
    IntToMoneyPipeModule,
    StakingSwitchComponent,
    DisablePriceFetchModule,
  ],
})
export class WalletCardComponent {
  @HostBinding('class') classAttr = 'wallet';

  @Input() wallet: Wallet;

  @Output() eventClose = new EventEmitter<number>();

  constructor(
    public variablesService: VariablesService,
    private intToMoneyPipe: IntToMoneyPipe,
    private translate: TranslateService,
    private backend: BackendService
  ) {}

}
