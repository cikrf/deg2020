import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'
import { StatusDto, ProbeDto } from './dto'

@Controller()
@ApiTags('Probes')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  @ApiResponse({
    status: 200,
    description: 'Status endpoint',
    type: StatusDto,
  })
  getStatus() {
    return this.appService.getStatus()
  }

  @Get('livenessProbe')
  @ApiResponse({
    status: 200,
    description: 'Liveness probe endpoint',
    type: ProbeDto,
  })
  livenessProbe() {
    return { time: Date.now() }
  }

  @Get('readinessProbe')
  @ApiResponse({
    status: 200,
    description: 'Readiness probe endpoint',
    type: ProbeDto,
  })
  readinessProbe() {
    return { time: Date.now() }
  }
}
