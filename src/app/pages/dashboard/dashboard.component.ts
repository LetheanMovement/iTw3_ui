import { Component, OnInit } from '@angular/core';
import {VariablesService} from "@parts/services/variables.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    public variablesService: VariablesService
  ) { }

  ngOnInit(): void {
  }

  installLegacy() {

  }
}
