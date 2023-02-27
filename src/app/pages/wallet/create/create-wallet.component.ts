import {Component, inject, NgZone} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {BackendService} from '@api/services/backend.service';
import {VariablesService} from '@parts/services/variables.service';
import {ModalService} from '@parts/services/modal.service';
import {Router} from '@angular/router';
import {Wallet} from '@api/models/wallet.model';
import {LetheanValidators, regExpPassword} from '@parts/utils/lthn-validators';
import {GetUserSelectedSaveFilePath} from '../../../../assets/wailsjs/go/main/App';

@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styles: [
    `:host {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }`,
  ],
})
export class CreateWalletComponent {
  fb = inject(FormBuilder);

  createForm = this.fb.group(
    {
      name: this.fb.nonNullable.control('', [
        Validators.required,
        LetheanValidators.duplicate(
          this.variablesService.walletNamesForComparisons
        ),
      ]),
      password: this.fb.nonNullable.control(
        '',
        Validators.pattern(regExpPassword)
      ),
      confirm: this.fb.nonNullable.control(''),
    },
    {
      validators: [LetheanValidators.formMatch('password', 'confirm')],
    }
  );

  wallet = {
    id: '',
  };

  walletSaved = false;

  walletSavedName = '';

  progressWidth = '9rem';

  constructor(
    public variablesService: VariablesService,
    private router: Router,
    private backend: BackendService,
    private modalService: ModalService,
    private ngZone: NgZone
  ) {
  }

  async createWallet(): Promise<void> {
    return await this.ngZone.run(async () => {
      this.progressWidth = '100%';
      await this.router.navigate(['/seed-phrase'], {
        queryParams: {wallet_id: this.wallet.id},
      });
    });
  }

  saveWallet(): void {
    if (
      this.createForm.valid &&
      this.createForm.get('name').value.length <=
      this.variablesService.maxWalletNameLength
    ) {
      GetUserSelectedSaveFilePath(this.variablesService.settings.default_path).then((path) => {

          this.variablesService.settings.default_path = path.substr(
            0,
            path.lastIndexOf('/')
          );
          this.walletSavedName = path.substr(
            path.lastIndexOf('/') + 1,
            path.length - 1
          );
          this.backend.generateWallet(
            path,
            this.createForm.get('password').value,
            (generate_status, generate_data, errorCode) => {
              if (generate_status) {
                this.wallet.id = generate_data.wallet_id;
                this.variablesService.opening_wallet = new Wallet(
                  generate_data.wallet_id,
                  this.createForm.get('name').value,
                  this.createForm.get('password').value,
                  generate_data['wi'].path,
                  generate_data['wi'].address,
                  generate_data['wi'].balance,
                  generate_data['wi'].unlocked_balance,
                  generate_data['wi'].mined_total,
                  generate_data['wi'].tracking_hey
                );
                this.variablesService.opening_wallet.alias =
                  this.backend.getWalletAlias(generate_data['wi'].address);
                this.variablesService.opening_wallet.total_history_item = 0;
                this.variablesService.opening_wallet.pages = new Array(
                  1
                ).fill(1);
                this.variablesService.opening_wallet.totalPages = 1;
                this.variablesService.opening_wallet.currentPage = 1;
                this.ngZone.run(() => {
                  this.walletSaved = true;
                  this.progressWidth = '33%';
                });
              } else {
                if (errorCode && errorCode === 'ALREADY_EXISTS') {
                  this.modalService.prepareModal(
                    'error',
                    'CREATE_WALLET.ERROR_CANNOT_SAVE_TOP'
                  );
                } else {
                  this.modalService.prepareModal(
                    'error',
                    'CREATE_WALLET.ERROR_CANNOT_SAVE_SYSTEM'
                  );
                }
              }
            }
          );
        }
      );
    }
  }
}
