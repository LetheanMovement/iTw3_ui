import { Component, NgZone } from '@angular/core';
import { CREATE_NEW_WALLET_HELP_PAGE } from '@parts/data/constants';
import { Router } from '@angular/router';
import { BackendService } from '@api/services/backend.service';
import { VariablesService } from '@parts/services/variables.service';
import { TranslateService } from '@ngx-translate/core';
import { paths } from '../../paths';
import {GetUserSelectedFilePath} from "../../../../assets/wailsjs/go/main/App";

@Component({
  selector: 'app-no-wallet',
  templateUrl: './no-wallet.component.html',
  styleUrls: ['./no-wallet.component.scss']
})
export class NoWalletComponent {
  paths = paths;

  constructor(
    public variablesService: VariablesService,
    private router: Router,
    private backend: BackendService,
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
    this.backend.openUrlInBrowser(CREATE_NEW_WALLET_HELP_PAGE);
  }
}

