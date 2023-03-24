import { Injectable } from '@angular/core';
import {ToastrService} from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  public market: any = {};
  public apps: any ;

  constructor(
    private toastr: ToastrService
  ) {
    this.getAppConfig().catch(e => console.log(e))
  }

  /**
   * Install app from package manager
   * @param app
   */
  async installApp(app: any) {
    if(this.apps == undefined){
      this.apps = {}
    }
    if((app.pkg && app.code) && !this.apps[app.code] ) {
        const containers = await fetch('http://localhost:36911/apps/install', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({code: app.code, pkg: app.pkg})
        });
        const data = await containers.json();
        if (data && data.status == 500) {
          console.log(data)
          this.toastr.error(data.message, 'Major Error', {
            timeOut: 3000,
          });

        } else if (data && data.success == true) {
          this.toastr.success(`Installed ${app.code}`, 'Success', {
            timeOut: 3000,
          });
        }

    }

//		console.log(this.apps)
    return this.apps = await this.getAppConfig()
  }

  /**
   * Get installable apps list from package manager
   * @param dir
   */
  async getAppMarket(dir :string = '') {
    try{
      if(dir.length > 0){
        dir = `?dir=${dir}`
      }
      const containers = await fetch(`http://localhost:36911/apps/marketplace${dir}`, {
        cache: "no-cache",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
      return this.market = await containers.json()
    }catch (e) {
      return false
    }

  }

  /**
   * Remove app from local computer
   * @param app
   */
  async removeApp(app: any) {
    if(app && this.apps[app]) {
      const containers = await fetch('http://localhost:36911/apps/remove', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({code: app})
      })
      await containers.json()
    }
    return this.apps = await this.getAppConfig()
  }

  /**
   * Get installed apps list from package manager
   */
  async getAppConfig() {
    try{
      const containers = await fetch('http://localhost:36911/apps/installed', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
      return this.apps = await containers.json()
    }catch (e) {
      return false
    }
  }
}
