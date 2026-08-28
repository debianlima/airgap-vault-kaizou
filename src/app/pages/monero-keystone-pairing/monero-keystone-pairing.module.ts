import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { ZXingScannerModule } from '@zxing/ngx-scanner'

import { MoneroKeystonePairingPage } from './monero-keystone-pairing.page'

const routes: Routes = [{ path: '', component: MoneroKeystonePairingPage }]

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes), ZXingScannerModule],
  declarations: [MoneroKeystonePairingPage]
})
export class MoneroKeystonePairingPageModule {}
