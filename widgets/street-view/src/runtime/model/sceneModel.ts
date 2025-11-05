import { Point } from "esri/geometry";
import { calculateBearing, CalculateDistance } from "../utils/MathUtil";

export class SceneModel {
  objectId: string;
  path?: string;
  bearing?: number;
  distance?: number;
  long?: number;
  lat?: number;
  pointLayer?: Point;
  connections?: SceneModel[];
  cameraDirection?: number;
  timeCapture?: Date;

  constructor(
    objectId: string,
    path?: string,
    bearing?: number,
    distance?: number,
    connections?: SceneModel[],
    long?: number,
    lat?: number,
    cameraDirection?: number,
    timeCapture?: Date,
    pointLayer?: Point,

  ) {
    this.objectId = objectId;
    this.path = path;
    this.bearing = bearing;
    this.distance = distance;
    this.connections = connections ?? [];
    this.long = long;
    this.lat = lat;
    this.cameraDirection = cameraDirection;
    this.timeCapture = new Date(timeCapture);
    this.pointLayer = pointLayer;
  }
}

export function CalculateDistanceScenes(scene1: SceneModel, scene2: SceneModel): number {
  if (!scene1 || !scene2) return 0;

  if (!scene1.lat || !scene1.long || !scene2.lat || !scene2.long) return 0;

  return CalculateDistance(scene1.lat, scene1.long, scene2.lat, scene2.long);
}

export function CalculateBearingScenes(scene1: SceneModel, scene2: SceneModel): number {
  if (!scene1 || !scene2) return 0;

  if (!scene1.lat || !scene1.long || !scene2.lat || !scene2.long) return 0;

  return calculateBearing(scene1.lat, scene1.long, scene2.lat, scene2.long);

}


export function CalculateAzimuthToFirstConnection(sceneModel: SceneModel): number {
  if (!sceneModel || !sceneModel.connections || sceneModel.connections.length === 0) {
    return 0;
  }

  const nextConnection = sceneModel.connections
    .filter(c => Number(c.objectId) > Number(sceneModel.objectId))
    .sort((a, b) => Number(a.objectId) - Number(b.objectId))
  [0];

  sceneModel.cameraDirection = CalculateBearingScenes(sceneModel, nextConnection);
}

