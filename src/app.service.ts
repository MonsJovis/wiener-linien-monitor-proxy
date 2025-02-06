import { HttpException, Injectable } from '@nestjs/common';
import { WienerLinienApiResponse } from './interface/wiener-linien-api-response.interface';
import { SummarizedMonitorStop } from './interface/summarized-monitor-stop.interface';
import { SummarizedMonitorLineInfo } from './interface/summarized-monitor-line-info.interface';
import { SummarizedMonitorFilter } from './interface/summarized-monitor-filter.interface';

@Injectable()
export class AppService {
  readonly baseUrl = 'https://www.wienerlinien.at/ogd_realtime/monitor';

  async getNextDepartures(
    filter: SummarizedMonitorFilter[],
  ): Promise<SummarizedMonitorStop[]> {
    const divaIds = filter.flatMap((f) => f.diva);

    const data = await this.execFetch(divaIds);
    return this.summarizeDepartureTimes(data, filter);
  }

  async getSummarizedLines(
    filter: SummarizedMonitorFilter[],
  ): Promise<SummarizedMonitorLineInfo[]> {
    const divaIds = filter.flatMap((f) => f.diva);

    const data = await this.execFetch(divaIds);
    return this.summarizeLines(data, filter);
  }

  private summarizeDepartureTimes(
    data: WienerLinienApiResponse,
    filter: SummarizedMonitorFilter[],
  ): SummarizedMonitorStop[] {
    const stops: SummarizedMonitorStop[] = [];

    for (const monitor of data.data.monitors) {
      const diva = monitor.locationStop.properties.name;
      const stop: SummarizedMonitorStop = {
        name: monitor.locationStop.properties.title,
        diva,
        lines: monitor.lines
          .filter((line) => this.isLineIncludedByFilter(line, diva, filter))
          .map((line) => {
            return {
              name: line.name,
              direction: line.direction,
              towards: line.towards,
              departures: line.departures.departure.map((departure) => {
                let isRealtime = !!departure.vehicle?.realtimeSupported;
                if (!isRealtime && !departure.departureTime.timeReal) {
                  isRealtime = false;
                }

                return {
                  time:
                    departure.departureTime.timeReal ||
                    departure.departureTime.timePlanned,
                  countdown: departure.departureTime.countdown,
                  isBarrierFree: departure.vehicle?.barrierFree || false,
                  isRealtime,
                };
              }),
            };
          }),
      };

      if (stops.some((s) => s.name === stop.name)) {
        const existingStop = stops.find((s) => s.name === stop.name);
        if (existingStop) {
          existingStop.lines.push(...stop.lines);
        }
      } else if (stop.lines.length) {
        stops.push(stop);
      }
    }

    return stops;
  }

  private summarizeLines(
    data: WienerLinienApiResponse,
    filter: SummarizedMonitorFilter[],
  ): SummarizedMonitorLineInfo[] {
    const lines: SummarizedMonitorLineInfo[] = data.data.monitors
      .flatMap((monitor) => {
        return monitor.lines.map((line) => {
          return {
            name: line.name,
            diva: monitor.locationStop.properties.name,
            direction: line.direction,
            towards: line.towards,
          };
        });
      })
      .filter((line, index, self) => {
        return (
          this.isLineIncludedByFilter(line, line.diva, filter) &&
          index ===
            self.findIndex(
              (l) =>
                l.name === line.name &&
                l.direction === line.direction &&
                l.towards === line.towards,
            )
        );
      })
      .map((line) => {
        const summarizedLine: SummarizedMonitorLineInfo = {
          name: line.name,
          direction: line.direction,
          towards: line.towards,
        };
        return summarizedLine;
      });

    return lines;
  }

  private isLineIncludedByFilter(
    line: SummarizedMonitorLineInfo,
    diva: string,
    filter: SummarizedMonitorFilter[],
  ): boolean {
    if (!filter.length) {
      return true;
    }

    const divaFilter = filter.find((f) => f?.diva.includes(diva));
    if (!divaFilter) {
      return false;
    }

    return !!divaFilter.lines?.some((filterLine) => {
      return (
        ((filterLine.name !== undefined && filterLine.name === line.name) ||
          filterLine.name === undefined) &&
        ((filterLine.direction !== undefined &&
          filterLine.direction === line.direction) ||
          filterLine.direction === undefined) &&
        ((filterLine.towards !== undefined &&
          filterLine.towards === line.towards) ||
          filterLine.towards === undefined)
      );
    });
  }

  private async execFetch(divaIds: string[]): Promise<WienerLinienApiResponse> {
    const url = new URL(this.baseUrl);

    for (const divaId of divaIds) {
      url.searchParams.append('diva', divaId);
    }

    const res = await fetch(url.href);
    if (!res.ok) {
      let msg = '';

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        msg = (await res.json())?.message?.value;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // ignore
      }

      if (!msg) {
        try {
          msg = await res.text();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // ignore
        }
      }

      if (!msg) {
        msg = 'Unknown error';
      }

      throw new HttpException(
        {
          error: 'Wiener Linien API Error',
          message: msg,
          statusCode: res.status,
        },
        res.status,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.json();
  }
}
