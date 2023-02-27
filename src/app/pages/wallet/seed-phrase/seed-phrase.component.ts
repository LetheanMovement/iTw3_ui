import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BackendService } from '@api/services/backend.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VariablesService } from '@parts/services/variables.service';
import { ModalService } from '@parts/services/modal.service';
import { FormBuilder, Validators } from '@angular/forms';
import { hasOwnProperty } from '@parts/functions/hasOwnProperty';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LetheanValidators, regExpPassword } from '@parts/utils/lthn-validators';
import { WalletsService } from '@parts/services/wallets.service';

@Component({
  selector: 'app-seed-phrase',
  templateUrl: './seed-phrase.component.html',
  styleUrls: ['./seed-phrase.component.scss'],
})
export class SeedPhraseComponent implements OnInit, OnDestroy {
  seedPhrase = '';

  showSeed = false;

  wallet_id: number;

  seedPhraseCopied = false;

  progressWidth = '66%';

  fb = inject(FormBuilder);

  detailsForm = this.fb.group({
    name: this.fb.nonNullable.control('', [
      LetheanValidators.duplicate(this.variablesService.walletNamesForComparisons),
    ]),
    path: this.fb.nonNullable.control(''),
  });

  seedPhraseForm = this.fb.group(
    {
      password: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword)
      ),
      confirmPassword: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword)
      ),
    },
    {
      validators: [LetheanValidators.formMatch('password', 'confirmPassword')],
    }
  );

  private destroy$ = new Subject<void>();

  constructor(
    public walletsService: WalletsService,
    public variablesService: VariablesService,
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendService,
    private modalService: ModalService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.showSeed = false;
    this.getWalletId();
    this.setWalletInfoNamePath();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  runWallet(): void {
    let exists = false;
    this.variablesService.wallets.forEach(wallet => {
      if (wallet.address === this.variablesService.opening_wallet.address) {
        exists = true;
      }
    });
    if (!exists) {
      this.backend.runWallet(this.wallet_id, (run_status, run_data) => {
        if (run_status) {
          this.walletsService.addWallet(this.variablesService.opening_wallet);
          if (this.variablesService.appPass) {
            this.backend.storeSecureAppData();
          }
          this.ngZone.run(() => {
            this.variablesService.setCurrentWallet(this.wallet_id);
            this.router.navigate(['/wallet/']);
          });
        } else {
          console.log(run_data['error_code']);
        }
      });
    } else {
      this.variablesService.opening_wallet = null;
      this.modalService.prepareModal(
        'error',
        'OPEN_WALLET.WITH_ADDRESS_ALREADY_OPEN'
      );
      this.backend.closeWallet(this.wallet_id, () => {
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        });
      });
    }
  }

  copySeedPhrase(): void {
    this.backend.setClipboard(this.seedPhrase, () => {
      this.ngZone.run(() => {
        setTimeout(() => {
          this.seedPhraseCopied = false;
        }, 4000);
        this.seedPhraseCopied = true;
      });
    });
  }

  showSeedPhrase(): void {
    this.showSeed = true;
    this.progressWidth = '100%';
  }

  onSubmitSeed(): void {
    if (this.seedPhraseForm.valid) {
      this.showSeedPhrase();
      const wallet_id = this.wallet_id;
      const seed_password = this.seedPhraseForm.controls.password.value;
      this.backend.getSmartWalletInfo(
        { wallet_id, seed_password },
        (status, data) => {
          if (hasOwnProperty(data, 'seed_phrase')) {
            this.ngZone.run(() => {
              this.seedPhrase = data['seed_phrase'].trim();
            });
          }
        }
      );
    }
  }

  private setWalletInfoNamePath(): void {
    this.detailsForm
      .get('name')
      .setValue(this.variablesService.opening_wallet.name);
    this.detailsForm
      .get('path')
      .setValue(this.variablesService.opening_wallet.path);
  }

  private getWalletId(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
      next: params => {
        if (params.wallet_id) {
          this.wallet_id = params.wallet_id;
        }
      },
    });
  }
}
