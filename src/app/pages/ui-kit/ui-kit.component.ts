import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  BreadcrumbsComponent,
  ButtonsComponent,
  FormComponent,
  ProgressBarsComponent,
  WalletsComponent,
} from './components';

@Component({
  selector: 'app-ui-kit',
  template: `
    <div fxFlex="0 1 50rem" fxLayout="column" fxLayoutAlign="start stretch">
      <div class="mb-2">
        <h2 class="mb-1">Buttons</h2>
        <app-buttons></app-buttons>
      </div>

      <div class="mb-2">
        <h2 class="mb-1">Form</h2>
        <app-form></app-form>
      </div>

      <div class="mb-2">
        <h2 class="mb-1">Breadcrumbs</h2>
        <app-breadcrumbs></app-breadcrumbs>
      </div>

      <div class="mb-2">
        <h2 class="mb-1">Progress bars</h2>
        <app-progress-bars></app-progress-bars>
      </div>

      <div class="mb-2">
        <h2 class="mb-1">Wallets</h2>
        <app-wallets></app-wallets>
      </div>
      <div class="mb-2">
        <h2 class="mb-1">Tabs</h2>
        <div class="tabs">
          <div class="tabs-header">
              <button class="tab-header">
                <i class="icon mr-1"></i>
                <span>Title 1</span>
              </button>
            <button class="tab-header">
                <i class="icon mr-1"></i>
                <span>Title 2</span>
              </button>
          </div>
          <div class="tabs-content">
            Tab Content
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [
    FlexLayoutModule,
    ButtonsComponent,
    WalletsComponent,
    BreadcrumbsComponent,
    FormComponent,
    ProgressBarsComponent,
  ],
})
export class UiKitComponent {}
