import { Injectable } from '@nestjs/common'
import { ConfigService } from '../config/config.service'

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  async getStatus(): Promise<{ status: string }> {
    return { status: 'OK', ...this.configService.getVersionInfo() }
  }
}
