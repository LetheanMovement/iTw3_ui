import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseAssetsWhiteList } from '@api/models/assets.model';

@Injectable({
  providedIn: 'root',
})
export class AssetsService {
  constructor(private httpClient: HttpClient) {}

  assetsWhitelist(): Observable<ResponseAssetsWhiteList> {
    return this.httpClient.get<ResponseAssetsWhiteList>(
      'https://wallet.lt.hn/assets_whitelist.json'
    );
  }
}
