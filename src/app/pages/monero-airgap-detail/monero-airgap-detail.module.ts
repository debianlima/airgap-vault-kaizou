import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { MoneroAirgapDetailPage } from './monero-airgap-detail.page'

const routes: Routes = [{ path: '', component: MoneroAirgapDetailPage }]

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [MoneroAirgapDetailPage]
})
export class MoneroAirgapDetailPageModule {}
