interface WienerLinienDepartureTime {
  timePlanned: string;
  timeReal: string;
  countdown: number;
}

interface WienerLinienVehicle {
  name: string;
  towards: string;
  direction: string;
  platform: string;
  richtungsId: string;
  barrierFree: boolean;
  foldingRamp: boolean;
  realtimeSupported: boolean;
  trafficjam: boolean;
  type: string;
  linienId: number;
}

interface WienerLinienDeparture {
  departureTime: WienerLinienDepartureTime;
  vehicle?: WienerLinienVehicle;
}

interface WienerLinienDepartures {
  departure: WienerLinienDeparture[];
}

interface WienerLinienLine {
  name: string;
  towards: string;
  direction: string;
  platform: string;
  richtungsId: string;
  barrierFree: boolean;
  realtimeSupported: boolean;
  trafficjam: boolean;
  departures: WienerLinienDepartures;
  type: string;
  lineId: number;
}

interface WienerLinienLocationStopProperties {
  name: string;
  title: string;
  municipality: string;
  municipalityId: number;
  type: string;
  coordName: string;
  attributes: {
    rbl: number;
  };
}

interface WienerLinienGeometry {
  type: string;
  coordinates: [number, number];
}

interface WienerLinienLocationStop {
  type: string;
  geometry: WienerLinienGeometry;
  properties: WienerLinienLocationStopProperties;
}

interface WienerLinienMonitor {
  locationStop: WienerLinienLocationStop;
  lines: WienerLinienLine[];
  attributes: {
    name: string;
    title: string;
  };
}

interface WienerLinienData {
  monitors: WienerLinienMonitor[];
}

interface WienerLinienMessage {
  value: string;
  messageCode: number;
  serverTime: string;
}

export interface WienerLinienApiResponse {
  data: WienerLinienData;
  message: WienerLinienMessage;
}
