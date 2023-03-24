import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.scss']
})
export class AppsComponent implements OnInit {
  tabActive: string = 'list';

  constructor() { }

  async ngOnInit() {}



  // async firstLoad() {
  //   if(!await this.fs.isFile('data/objects/conf/installed-apps.json')){
  //
  //     await this.installApp({code: 'server', pkg: 'https://raw.githubusercontent.com/dAppServer/server/main/.itw3.json'})
  //     await this.installApp({code: 'blockchain-lthn', pkg: 'https://raw.githubusercontent.com/letheanVPN/blockchain-iz/main/.itw3.json'})
  //     this.apps = await this.getAppConfig()
  //   }
  // }

  clickTab(tab: string) {
    this.tabActive = tab;
  }
}
