import {
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BackendService } from '@api/services/backend.service';
import { VariablesService } from '@parts/services/variables.service';
import { ModalService } from '@parts/services/modal.service';
import { BigNumber } from 'bignumber.js';
import { MIXIN } from '@parts/data/constants';
import { HttpClient } from '@angular/common/http';
import { MoneyToIntPipe } from '@parts/pipes/money-to-int-pipe/money-to-int.pipe';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styles: [
    `
      :host {
        width: 100%;
        height: auto;
        display: flex;
      }
    `,
  ],
})
export class SendComponent implements OnInit, OnDestroy {
  job_id: number;

  isOpen = false;

  localAliases = [];

  isModalDialogVisible = false;

  isModalDetailsDialogVisible = false;

  hideWalletAddress = false;

  mixin: number;

  currentAliasAddress: string;

  lenghtOfAdress: number;

  additionalOptions = false;

  actionData;

  sendForm = new UntypedFormGroup({
    address: new UntypedFormControl('', [
      Validators.required,
      (g: UntypedFormControl): ValidationErrors | null => {
        this.localAliases = [];
        if (g.value) {
          this.currentAliasAddress = '';
          if (g.value.indexOf('@') !== 0) {
            this.isOpen = false;
            this.backend.validateAddress(g.value, (valid_status, data) => {
              this.ngZone.run(() => {
                this.sendForm
                  .get('amount')
                  .setValue(this.sendForm.get('amount').value);
                if (valid_status === false) {
                  g.setErrors(
                    Object.assign({ address_not_valid: true }, g.errors)
                  );
                } else {
                  if (g.hasError('address_not_valid')) {
                    delete g.errors['address_not_valid'];
                    if (Object.keys(g.errors).length === 0) {
                      g.setErrors(null);
                    }
                  }
                }
              });
            });
            return g.hasError('address_not_valid')
              ? { address_not_valid: true }
              : null;
          } else {
            this.isOpen = true;
            this.localAliases = this.variablesService.aliases.filter(item => {
              return item.name.indexOf(g.value) > -1;
            });
            // eslint-disable-next-line
            if (!/^@?[a-z\d\-]{0,25}$/.test(g.value)) {
              g.setErrors(Object.assign({ alias_not_valid: true }, g.errors));
            } else {
              this.backend.getAliasByName(
                g.value.replace('@', ''),
                (alias_status, alias_data) => {
                  this.ngZone.run(() => {
                    this.currentAliasAddress = alias_data.address;
                    this.lenghtOfAdress = g.value.length;
                    if (alias_status) {
                      if (g.hasError('alias_not_valid')) {
                        delete g.errors['alias_not_valid'];
                        if (Object.keys(g.errors).length === 0) {
                          g.setErrors(null);
                        }
                      }
                    } else {
                      g.setErrors(
                        Object.assign({ alias_not_valid: true }, g.errors)
                      );
                    }
                  });
                }
              );
            }
            return g.hasError('alias_not_valid')
              ? { alias_not_valid: true }
              : null;
          }
        }
        return null;
      },
    ]),
    amount: new UntypedFormControl(undefined, [
      Validators.required,
      (g: UntypedFormControl): ValidationErrors | null => {
        if (!g.value) {
          return null;
        }

        if (g.value === 0) {
          return { zero: true };
        }
        const bigAmount = this.moneyToInt.transform(g.value) as BigNumber;
        return null;
      },
    ]),
    comment: new UntypedFormControl(''),
    mixin: new UntypedFormControl(MIXIN, Validators.required),
    fee: new UntypedFormControl(this.variablesService.default_fee, [
      Validators.required,
      (g: UntypedFormControl): ValidationErrors | null => {
        if (
          new BigNumber(g.value).isLessThan(this.variablesService.default_fee)
        ) {
          return { less_min: true };
        }
        return null;
      },
    ]),
    hide: new UntypedFormControl(false),
  });

  private destroy$ = new Subject<void>();

  constructor(
    private backend: BackendService,
    public variablesService: VariablesService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private http: HttpClient,
    private moneyToInt: MoneyToIntPipe
  ) {}

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement): void {
    if (targetElement.id !== 'send-address' && this.isOpen) {
      this.isOpen = false;
    }
  }

  ngOnInit(): void {
    this.mixin =
      this.variablesService.currentWallet.send_data['mixin'] || MIXIN;
    if (this.variablesService.currentWallet.is_auditable) {
      this.mixin = 0;
      this.sendForm.controls['mixin'].disable();
    }
    this.hideWalletAddress =
      this.variablesService.currentWallet.is_auditable &&
      !this.variablesService.currentWallet.is_watch_only;
    if (this.hideWalletAddress) {
      this.sendForm.controls['hide'].disable();
    }
    this.sendForm.reset({
      address: this.variablesService.currentWallet.send_data['address'],
      amount: this.variablesService.currentWallet.send_data['amount'],
      comment: this.variablesService.currentWallet.send_data['comment'],
      mixin: this.mixin,
      fee:
        this.variablesService.currentWallet.send_data['fee'] ||
        this.variablesService.default_fee,
      hide: this.variablesService.currentWallet.send_data['hide'] || false,
    });

    this.variablesService.sendActionData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.action === 'send') {
            this.actionData = res;
            setTimeout(() => {
              this.fillDeepLinkData();
            }, 100);
            this.variablesService.sendActionData$.next({});
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.variablesService.currentWallet.send_data = {
      address: this.sendForm.get('address').value,
      amount: this.sendForm.get('amount').value,
      comment: this.sendForm.get('comment').value,
      mixin: this.sendForm.get('mixin').value,
      fee: this.sendForm.get('fee').value,
      hide: this.sendForm.get('hide').value,
    };
    this.actionData = {};
  }

  addressMouseDown(e): void {
    if (
      e['button'] === 0 &&
      this.sendForm.get('address').value &&
      this.sendForm.get('address').value.indexOf('@') === 0
    ) {
      this.isOpen = true;
    }
  }

  setAlias(alias): void {
    this.sendForm.get('address').setValue(alias);
  }

  showDialog(): void {
    this.isModalDialogVisible = true;
  }

  confirmed(confirmed: boolean): void {
    this.isModalDialogVisible = false;
    if (confirmed) {
      this.onSend();
    }
  }

  fillDeepLinkData(): void {
    this.additionalOptions = true;
    this.sendForm.reset({
      address: this.actionData.address,
      amount: null,
      comment: this.actionData.comment || this.actionData.comments || '',
      mixin: this.actionData.mixins || this.mixin,
      fee: this.actionData.fee || this.variablesService.default_fee,
      hide: this.actionData.hide_sender === 'true',
    });
  }

  addressToLowerCase(): void | null {
    const control = this.sendForm.get('address');
    const value = control.value;
    const condition = value.indexOf('@') === 0;
    return condition ? control.patchValue(value.toLowerCase()) : null;
  }

  onSend(): void {
    if (this.sendForm.valid) {
      const { wallet_id } = this.variablesService.currentWallet;

      if (this.sendForm.get('address').value.indexOf('@') !== 0) {
        this.backend.validateAddress(
          this.sendForm.get('address').value,
          (valid_status, data) => {
            if (valid_status === false && !(data.error_code === 'WRAP')) {
              this.ngZone.run(() => {
                this.sendForm
                  .get('address')
                  .setErrors({ address_not_valid: true });
              });
            } else {
              this.backend.sendMoney(
                wallet_id,
                this.sendForm.get('address').value,
                this.sendForm.get('amount').value,
                this.sendForm.get('fee').value,
                this.sendForm.get('mixin').value,
                this.sendForm.get('comment').value,
                this.sendForm.get('hide').value,
                job_id => {
                  this.ngZone.run(() => {
                    this.job_id = job_id;
                    this.isModalDetailsDialogVisible = true;
                    this.variablesService.currentWallet.send_data = {
                      address: null,
                      amount: null,
                      comment: null,
                      mixin: null,
                      fee: null,
                      hide: null,
                    };
                    this.sendForm.reset({
                      address: null,
                      amount: null,
                      comment: null,
                      mixin: this.mixin,
                      fee: this.variablesService.default_fee,
                      hide: false,
                    });
                    this.sendForm.markAsUntouched();
                  });
                }
              );
            }
          }
        );
      } else {
        this.backend.getAliasByName(
          this.sendForm.get('address').value.replace('@', ''),
          (alias_status, alias_data) => {
            this.ngZone.run(() => {
              if (alias_status === false) {
                this.ngZone.run(() => {
                  this.sendForm
                    .get('address')
                    .setErrors({ alias_not_valid: true });
                });
              } else {
                this.backend.sendMoney(
                  wallet_id,
                  alias_data.address, // this.sendForm.get('address').value,
                  this.sendForm.get('amount').value,
                  this.sendForm.get('fee').value,
                  this.sendForm.get('mixin').value,
                  this.sendForm.get('comment').value,
                  this.sendForm.get('hide').value,
                  job_id => {
                    this.ngZone.run(() => {
                      this.job_id = job_id;
                      this.isModalDetailsDialogVisible = true;
                      this.variablesService.currentWallet.send_data = {
                        address: null,
                        amount: null,
                        comment: null,
                        mixin: null,
                        fee: null,
                        hide: null,
                      };
                      this.sendForm.reset({
                        address: null,
                        amount: null,
                        comment: null,
                        mixin: this.mixin,
                        fee: this.variablesService.default_fee,
                        hide: false,
                      });
                      this.sendForm.markAsUntouched();
                    });
                  }
                );
              }
            });
          }
        );
      }
    }
  }

  toggleOptions(): void {
    this.additionalOptions = !this.additionalOptions;
  }

  handeCloseDetailsModal(): void {
    this.isModalDetailsDialogVisible = false;
    this.job_id = null;
  }

}
