import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  dataSource: string;
  tourPath: string;
  defaultZoom: number;
  showCompass: boolean;
  showNavigation: boolean;
  layerUrl: string;
  latitudeAtribute: string;
  longitudeAtribute: string;
  cameraDirectionAtribute: string;
  timeCaptureAtribute: string;
  priority?: string;
}

export type IMConfig = ImmutableObject<Config>;

