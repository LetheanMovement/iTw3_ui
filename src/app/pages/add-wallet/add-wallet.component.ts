import { Component, NgZone } from '@angular/core';
import { BackendService } from '@api/services/backend.service';
import { VariablesService } from '@parts/services/variables.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CREATE_NEW_WALLET_HELP_PAGE } from '@parts/data/constants';
import { GetUserSelectedFilePath } from '../../../assets/wailsjs/go/main/App';
import { paths } from '../paths';

@Component({
  selector: 'app-add-wallet',
  templateUrl: './add-wallet.component.html',
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
})
export class AddWalletComponent {
  constructor(
    public variablesService: VariablesService,
    private router: Router,
    private backendService: BackendService,
    private ngZone: NgZone,
    private translate: TranslateService
  ) {}

  openWallet(): void {
    GetUserSelectedFilePath().then((path) => {
      if (path) {
        this.variablesService.settings.default_path = path.substr(
          0,
          path.lastIndexOf('/')
        );
        this.ngZone.run(() => {
          this.router
            .navigate(['/' + paths.open], {
              queryParams: { path: path },
            })
            .then();
        });
      }
    });
  }

  openInBrowser(): void {
    this.backendService.openUrlInBrowser(CREATE_NEW_WALLET_HELP_PAGE);
  }
}
