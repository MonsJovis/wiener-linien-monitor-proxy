import { SummarizedMonitorLineInfo } from './summarized-monitor-line-info.interface';

export interface SummarizedMonitorStop {
  name: string;
  diva: string;
  lines: (SummarizedMonitorLineInfo & SummarizedMonitorLineDepartures)[];
}

interface SummarizedMonitorLineDepartures {
  departures: SummarizedMonitorDeparture[];
}

interface SummarizedMonitorDeparture {
  time: string;
  countdown: number;
  isBarrierFree: boolean;
  isRealtime: boolean;
}
