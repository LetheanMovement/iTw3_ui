import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppsComponent } from './apps.component';
import {RouterLinkActive} from "@angular/router";
import {TranslateModule} from "@ngx-translate/core";
import {MatCardModule} from "@angular/material/card";
import {FlexModule} from "@angular/flex-layout";
import { InstallableComponent } from './installable/installable.component';
import { InstalledComponent } from './installed/installed.component';



@NgModule({
  declarations: [
    AppsComponent,
    InstallableComponent,
    InstalledComponent
  ],
  imports: [
    CommonModule,
    RouterLinkActive,
    TranslateModule,
    MatCardModule,
    FlexModule
  ]
})
export class AppsModule { }
