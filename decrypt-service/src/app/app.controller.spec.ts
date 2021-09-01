import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '../config/config.service'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, ConfigService],
    }).compile()
    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return status', async () => {
      const { status } = await appController.getStatus()
      expect(status).toBe('OK')
    })
  })
})
