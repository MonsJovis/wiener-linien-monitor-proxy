import {
  Controller,
  Get,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { SummarizedMonitorListResponse } from './interface/summarized-monitor-list-response.interface';
import { SummarizedMonitorStop } from './interface/summarized-monitor-stop.interface';
import { SummarizedMonitorLineInfo } from './interface/summarized-monitor-line-info.interface';
import { SummarizedMonitorFilter } from './interface/summarized-monitor-filter.interface';

@Controller('monitor')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('next-departures')
  async getNextDepartures(
    @Query('filter') filterParam: string, // filter={"diva": ["60201438", "60200956"], "lines":[{"name":"49","direction":"R"},{"name":"U4","direction":"H"}]}
  ): Promise<SummarizedMonitorListResponse<SummarizedMonitorStop>> {
    const filter = this.parseAndValidateFilter(filterParam);

    return {
      ...this.getTimestamps(),
      data: await this.appService.getNextDepartures(filter),
    };
  }

  @Get('lines')
  async getSummarizedLines(
    @Query('filter') filterParam: string, // filter={"diva": ["60201438", "60200956"], "lines":[{"name":"49","direction":"R"},{"name":"U4","direction":"H"}]}
  ): Promise<SummarizedMonitorListResponse<SummarizedMonitorLineInfo>> {
    const filter = this.parseAndValidateFilter(filterParam);

    return {
      ...this.getTimestamps(),
      data: await this.appService.getSummarizedLines(filter),
    };
  }

  private parseAndValidateFilter(
    filterParamValue: string,
  ): SummarizedMonitorFilter[] {
    let filterParam: SummarizedMonitorFilter | SummarizedMonitorFilter[];
    try {
      filterParam = JSON.parse(filterParamValue) as
        | SummarizedMonitorFilter
        | SummarizedMonitorFilter[];
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException('filter is not a valid JSON');
    }

    const filter: SummarizedMonitorFilter[] = Array.isArray(filterParam)
      ? filterParam
      : [filterParam];

    for (const f of filter) {
      if (!f.diva || f.diva.length === 0) {
        throw new UnprocessableEntityException('diva is required');
      }
    }

    return filter;
  }

  private getTimestamps(): { timestamp: string; localeTimestamp: string } {
    const now = new Date();

    return {
      timestamp: now.toISOString(),
      localeTimestamp: new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Europe/Vienna',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }).format(now),
    };
  }
}
