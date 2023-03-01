import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BackendService, Commands } from '@api/services/backend.service';
import { VariablesService } from '@parts/services/variables.service';
import { ModalService } from '@parts/services/modal.service';
import { Wallet } from '@api/models/wallet.model';
import { TranslateService } from '@ngx-translate/core';
import { pairwise, startWith, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { hasOwnProperty } from '@parts/functions/hasOwnProperty';
import { LetheanValidators, regExpPassword } from '@parts/utils/lthn-validators';
import { WalletsService } from '@parts/services/wallets.service';
import { GetUserSelectedSaveFilePath } from '../../../../assets/wailsjs/go/main/App';

@Component({
  selector: 'app-restore-wallet',
  templateUrl: './restore-wallet.component.html',
  styles: [
    `:host {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }`,
  ],
})
export class RestoreWalletComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);

  restoreForm = this.fb.group(
    {
      name: this.fb.nonNullable.control('', [
        Validators.required,
        LetheanValidators.duplicate(
          this.variablesService.walletNamesForComparisons,
        ),
      ]),
      key: this.fb.nonNullable.control('', Validators.required),
      password: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword),
      ),
      confirm: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword),
      ),
      seedPassword: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword),
      ),
    },
    {
      validators: [LetheanValidators.formMatch('password', 'confirm')],
    },
  );

  wallet = {
    id: '',
  };

  walletSaved = false;

  walletSavedName = '';

  progressWidth = '9rem';

  seedPhraseInfo = null;

  private destroy$ = new Subject<void>();

  constructor(
    public walletsService: WalletsService,
    public variablesService: VariablesService,
    private router: Router,
    private backend: BackendService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private translate: TranslateService,
  ) {
  }

  ngOnInit(): void {
    this.checkValidSeedPhrasePassword();
    this.changeDetectionSeedPhrasePassword();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeDetectionSeedPhrasePassword(): void {
    this.restoreForm.controls.seedPassword.valueChanges
      .pipe(startWith(null), pairwise(), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkValidSeedPhrasePassword();
        },
      });
    this.restoreForm.controls.key.valueChanges
      .pipe(startWith(null), pairwise(), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkValidSeedPhrasePassword();
        },
      });
  }

  checkValidSeedPhrasePassword(): void {
    const seed_password = this.restoreForm.controls.seedPassword.value;
    const seed_phrase = this.restoreForm.controls.key.value;
    this.backend.getSeedPhraseInfo(
      { seed_phrase, seed_password },
      (status, data) => {
        this.ngZone.run(() => {
          this.seedPhraseInfo = data;
        });
      },
    );
  }

  createWallet(): void {
    this.ngZone.run(() => {
      this.progressWidth = '100%';
      this.runWallet();
    });
  }

  saveWallet(): void {
    if (
      this.restoreForm.valid &&
      this.restoreForm.get('name').value.length <=
      this.variablesService.maxWalletNameLength
    ) {
      this.isValidRestoreWalletText(
        {
          seed_phrase: this.restoreForm.get('key').value,
          seed_password: this.restoreForm.get('seedPassword').value,
        },
        (valid_status, valid_data) => {
          if (valid_data !== 'TRUE') {
            this.ngZone.run(() => {
              this.restoreForm.get('key').setErrors({ key_not_valid: true });
            });
          } else {
            GetUserSelectedSaveFilePath(this.variablesService.settings.default_path).then((save_path) => {

              this.variablesService.settings.default_path =
                save_path.substr(0, save_path.lastIndexOf('/'));
              this.walletSavedName = save_path.substr(
                save_path.lastIndexOf('/') + 1,
                save_path.length - 1,
              );

              this.backend.restoreWallet(
                save_path,
                this.restoreForm.get('password').value,
                this.restoreForm.get('key').value,
                this.restoreForm.get('seedPassword').value,
                (restore_status, restore_data) => {
                  if (restore_status) {
                    this.wallet.id = restore_data.wallet_id;
                    this.variablesService.opening_wallet = new Wallet(
                      restore_data.wallet_id,
                      this.restoreForm.get('name').value,
                      this.restoreForm.get('password').value,
                      restore_data['wi'].path,
                      restore_data['wi'].address,
                      restore_data['wi'].balance,
                      restore_data['wi'].unlocked_balance,
                      restore_data['wi'].mined_total,
                      restore_data['wi'].tracking_hey,
                    );
                    this.variablesService.opening_wallet.is_auditable =
                      restore_data['wi'].is_auditable;
                    this.variablesService.opening_wallet.is_watch_only =
                      restore_data['wi'].is_watch_only;
                    this.variablesService.opening_wallet.currentPage = 1;
                    this.variablesService.opening_wallet.alias =
                      this.backend.getWalletAlias(
                        this.variablesService.opening_wallet.address,
                      );
                    this.variablesService.opening_wallet.pages = new Array(
                      1,
                    ).fill(1);
                    this.variablesService.opening_wallet.totalPages = 1;
                    this.variablesService.opening_wallet.currentPage = 1;
                    this.variablesService.opening_wallet.total_history_item = 0;
                    this.variablesService.opening_wallet.restore = true;
                    if (
                      restore_data.recent_history &&
                      restore_data.recent_history.history
                    ) {
                      this.variablesService.opening_wallet.totalPages =
                        Math.ceil(
                          restore_data.recent_history.total_history_items /
                          this.variablesService.count,
                        );
                      this.variablesService.opening_wallet.totalPages >
                      this.variablesService.maxPages
                        ? (this.variablesService.opening_wallet.pages =
                          new Array(5)
                            .fill(1)
                            .map((value, index) => value + index))
                        : (this.variablesService.opening_wallet.pages =
                          new Array(
                            this.variablesService.opening_wallet.totalPages,
                          )
                            .fill(1)
                            .map((value, index) => value + index));
                      this.variablesService.opening_wallet.prepareHistory(
                        restore_data.recent_history.history,
                      );
                    }
                    this.backend.getContracts(
                      this.variablesService.opening_wallet.wallet_id,
                      (contracts_status, contracts_data) => {
                        if (
                          contracts_status &&
                          hasOwnProperty(contracts_data, 'contracts')
                        ) {
                          this.ngZone.run(() => {
                            this.variablesService.opening_wallet.prepareContractsAfterOpen(
                              contracts_data.contracts,
                              this.variablesService.exp_med_ts,
                              this.variablesService.height_app,
                              this.variablesService.settings
                                .viewedContracts,
                              this.variablesService.settings
                                .notViewedContracts,
                            );
                          });
                        }
                      },
                    );
                    this.ngZone.run(() => {
                      this.walletSaved = true;
                      this.progressWidth = '50%';
                    });
                  } else {
                    this.modalService.prepareModal(
                      'error',
                      'RESTORE_WALLET.NOT_CORRECT_FILE_OR_PASSWORD',
                    );
                  }
                },
              );

            });
          }
        });
    }
  }

  runWallet(): void {
    // add flag when wallet was restored form seed
    this.variablesService.after_sync_request[this.wallet.id] = true;
    let exists = false;
    this.variablesService.wallets.forEach(wallet => {
      if (wallet.address === this.variablesService.opening_wallet.address) {
        exists = true;
      }
    });
    if (!exists) {
      this.backend.runWallet(this.wallet.id, (run_status, run_data) => {
        if (run_status) {
          this.walletsService.addWallet(this.variablesService.opening_wallet);
          if (this.variablesService.appPass) {
            this.backend.storeSecureAppData();
          }
          this.ngZone.run(() => {
            this.variablesService.setCurrentWallet(this.wallet.id);
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
        'OPEN_WALLET.WITH_ADDRESS_ALREADY_OPEN',
      );
      this.backend.closeWallet(this.wallet.id, () => {
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        });
      });
    }
  }

  /**
   * Check if restore wallet text is valid
   */
  isValidRestoreWalletText(param, callback): void {
    this.backend.runCommand(Commands.is_valid_restore_wallet_text, param, callback);
  }
}
