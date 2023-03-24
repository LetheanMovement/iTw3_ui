import { Component, OnInit } from '@angular/core';
import {AppsService} from "../apps.service";

@Component({
  selector: 'app-market-installed',
  templateUrl: './installed.component.html',
  styleUrls: ['./installed.component.scss']
})
export class InstalledComponent implements OnInit {

  public apps: any ;

  constructor(private appsService: AppsService) { }

  async ngOnInit() {
    this.apps = await this.appsService.apps
  }

  async removeApp(app: any) {
    return this.apps = await this.appsService.removeApp(app)
  }

}
