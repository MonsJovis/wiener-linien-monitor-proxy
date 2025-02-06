export interface SummarizedMonitorFilter {
  diva: string;
  lines?: {
    name?: string;
    direction?: string;
    towards?: string;
  }[];
}
