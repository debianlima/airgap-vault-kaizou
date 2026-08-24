import { TestBed } from '@angular/core/testing'

import { IACService } from './iac.service'

import { UnitHelper } from '../../../../test-config/unit-test-helper'
import { STATUS_BAR_PLUGIN, SPLASH_SCREEN_PLUGIN, APP_PLUGIN, CLIPBOARD_PLUGIN, ISOLATED_MODULES_PLUGIN, WebIsolatedModules, FILESYSTEM_PLUGIN, ZIP_PLUGIN } from '@airgap/angular-core'
import { ModalController, NavController, NavParams, Platform } from '@ionic/angular'
import {
  ClipboardMock,
  DeviceProviderMock,
  FilesystemMock,
  ModalControllerMock,
  NavControllerMock,
  NavParamsMock,
  PlatformMock,
  ZipMock
} from 'test-config/ionic-mocks'
import { StatusBarMock, SplashScreenMock, createAppSpy } from 'test-config/plugins-mocks'
import { StorageMock } from 'test-config/storage-mock'
import { DeviceService } from '../device/device.service'
import { SecretsService } from '../secrets/secrets.service'
import { SecureStorageServiceMock } from '../secure-storage/secure-storage.mock'
import { SecureStorageService } from '../secure-storage/secure-storage.service'
import { StartupChecksService } from '../startup-checks/startup-checks.service'
import { SOLFLARE_KEYSTONE_PROTOCOL } from '../solflare-keystone/solflare-keystone.service'

describe('IACService', () => {
  let service: IACService

  let unitHelper: UnitHelper

  beforeEach(() => {
    unitHelper = new UnitHelper()
    TestBed.configureTestingModule(
      unitHelper.testBed({
        providers: [
          StartupChecksService,
          SecretsService,
          { provide: DeviceService, useClass: DeviceProviderMock },
          { provide: ModalController, useClass: ModalControllerMock },
          { provide: SecureStorageService, useClass: SecureStorageServiceMock },
          { provide: Storage, useClass: StorageMock },
          { provide: NavController, useClass: NavControllerMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: APP_PLUGIN, useValue: createAppSpy() },
          { provide: STATUS_BAR_PLUGIN, useClass: StatusBarMock },
          { provide: SPLASH_SCREEN_PLUGIN, useClass: SplashScreenMock },
          { provide: CLIPBOARD_PLUGIN, useClass: ClipboardMock },
          { provide: Platform, useClass: PlatformMock },
          { provide: ISOLATED_MODULES_PLUGIN, useValue: new WebIsolatedModules() },
          { provide: FILESYSTEM_PLUGIN, useClass: FilesystemMock },
          { provide: ZIP_PLUGIN, useClass: ZipMock }
        ]
      })
    )
      .compileComponents()
      .catch(console.error)
  })

  beforeEach(async () => {
    service = TestBed.get(IACService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('routes Solflare sol-sign-request before the generic V3 and V2 handlers', () => {
    const handlerNames: string[] = (service as any).handlers.map((handler) => handler.name)
    expect(handlerNames[0]).toBe('SolflareSignRequestHandler')
    expect(handlerNames.slice(1, 3)).toEqual(['SerializerV3Handler', 'SerializerV2Handler'])
  })

  it('keeps an unmatched but valid Solflare request out of the incompatible-code error path', async () => {
    const secretsService: SecretsService = TestBed.get(SecretsService)
    spyOn(secretsService, 'findWalletByPublicKeyAndProtocolIdentifier').and.resolveTo(undefined)
    spyOn(secretsService, 'findByFingerprint').and.returnValue(undefined)
    spyOn(secretsService, 'findBaseWalletByPublicKeyAndProtocolIdentifier').and.resolveTo(undefined)
    const findByPublicKey = spyOn(secretsService, 'findByPublicKey').and.returnValue(undefined)

    const request: any = {
      id: 99,
      protocol: SOLFLARE_KEYSTONE_PROTOCOL,
      payload: {
        transaction: { transaction: 'AQID', encoding: 'base64' },
        publicKey: '',
        callbackURL: ''
      }
    }
    const metadata = { sourceFingerprint: 'deadbeef', derivationPath: "44'/501'/0'/0'", requestId: '00112233' }

    const result = await (service as any).findMatchingWallet(request, metadata)

    expect(result.wallet).toBeUndefined()
    expect(result.secret).toBeUndefined()
    expect(result.signTransactionRequest).toBe(request)
    expect(findByPublicKey).not.toHaveBeenCalled()
  })
})
