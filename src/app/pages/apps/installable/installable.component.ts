import {Component, OnInit} from '@angular/core';
import {AppsService} from "../apps.service";

@Component({
  selector: 'app-market-installable',
  templateUrl: './installable.component.html',
  styleUrls: ['./installable.component.scss']
})
export class InstallableComponent implements OnInit {

  public market: any = {};
  public apps: any = {};
  private dir: string = '';

  constructor(private appsService: AppsService) {
  }

  async ngOnInit() {
    this.market = await this.appsService.getAppMarket()
    this.apps = await this.appsService.getAppConfig()
  }

  async installApp(app: any) {
     this.apps = await this.appsService.installApp(app);
     return this.getAppMarket(this.dir);
  }

  async getAppMarket(dir: string = '') {
    this.dir = dir
    this.market = await this.appsService.getAppMarket(dir)
  }
}
