import { Component, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VariablesService } from '@parts/services/variables.service';
import { BackendService } from '@api/services/backend.service';
import { ModalService } from '@parts/services/modal.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Wallet } from '@api/models/wallet.model';
import { TranslateService } from '@ngx-translate/core';
import { IntToMoneyPipe } from '@parts/pipes/int-to-money-pipe/int-to-money.pipe';
import { Dialog, DialogConfig } from '@angular/cdk/dialog';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '@parts/modals/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WalletsService } from '@parts/services/wallets.service';
import { environment} from "../../../environments/environment";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [],
})
export class SidebarComponent implements OnDestroy {
  stateVisibleUiKit = !environment.production;

  private destroy$ = new Subject<void>();

  constructor(
    public variablesService: VariablesService,
    private walletsService: WalletsService,
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendService,
    private modal: ModalService,
    private translate: TranslateService,
    private intToMoneyPipe: IntToMoneyPipe,
    private ngZone: NgZone,
    private dialog: Dialog
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goMainPage(): void {
    if (
      this.route.snapshot.queryParams &&
      this.route.snapshot.queryParams.prevUrl === 'login'
    ) {
      this.ngZone.run(() => {
        this.router.navigate(['/'], { queryParams: { prevUrl: 'login' } });
      });
    } else {
      this.ngZone.run(() => {
        this.router.navigate(['/']);
      });
    }
  }

  selectWallet(id: number): void {
    this.ngZone.run(() => {
      this.variablesService.setCurrentWallet(id);
      this.router.navigate(['/wallet/history']);
    });
  }

  drop(event: CdkDragDrop<Wallet[]>): void {
    moveItemInArray(
      this.variablesService.wallets,
      event.previousIndex,
      event.currentIndex
    );
  }

  beforeClose(wallet_id): void {
    const dialogConfig: DialogConfig<ConfirmModalData> = {
      data: {
        title: 'WALLET.CONFIRM.MESSAGE',
        message: 'WALLET.CONFIRM.TITLE',
      },
    };

    this.dialog
      .open<boolean>(ConfirmModalComponent, dialogConfig)
      .closed.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: confirmed => confirmed && this.closeWallet(wallet_id),
      });
  }

  closeWallet(wallet_id): void {
    this.walletsService.closeWallet(wallet_id);
  }

  logOut(): void {
    this.variablesService.stopCountdown();
    this.variablesService.appLogin = false;
    this.variablesService.appPass = '';
    this.ngZone.run(() => {
      this.router.navigate(['/login'], { queryParams: { type: 'auth' } });
    });
  }
}
