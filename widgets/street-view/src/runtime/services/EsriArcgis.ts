import { CalculateBearingScenes, SceneModel } from "../model/sceneModel";
import Graphic from "@arcgis/core/Graphic";
import { AllWidgetProps } from "jimu-core";
import PictureMarkerSymbol from "esri/symbols/PictureMarkerSymbol";
import { JimuLayerViews } from "jimu-arcgis";
import { parseDate } from "../utils/DateUtil";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";

async function buildScene(
  featureLayer: __esri.FeatureLayer,
  feature: __esri.Graphic,
  props: AllWidgetProps<any>
): Promise<SceneModel> {

  //Attributes
  const objectId = feature.attributes[featureLayer.objectIdField];
  const lat = feature.attributes[props.config.longitudeAtribute || "X"];
  const lon = feature.attributes[props.config.latitudeAtribute || "Y"];
  const direction = feature.attributes[props.config.cameraDirectionAtribute || "DIRECAO"];
  var time = null

  if(props.config.priority == "Time")
    time = feature.attributes[props.config.timeCaptureAtribute || "time"];
  else
    time = new Date();

  let path: string | undefined;

  //Atachments
  const attachmentResults = await featureLayer.queryAttachments({ objectIds: [objectId] });
  const attachments = attachmentResults[objectId];
  if (attachments?.length > 0) {
    path = attachments[0].url;
  }

  return new SceneModel(
    objectId,   // objectId
    path,       //path
    0,          //bearing
    0,          //distance 
    [],         //connections
    lon,        //long
    lat,        //lat
    direction,  //cameraDirection
    time       //timeofCapture
  );
}

export async function buildSceneToRadar(
  scene: SceneModel,
  jimuLayerViews: JimuLayerViews,
  props: AllWidgetProps<any>
): Promise<SceneModel> {
  const connectionsToRadar = await queryConnections(jimuLayerViews, scene, 20, "meters", props);

  return new SceneModel(
    scene.objectId,
    scene.path,
    scene.bearing,
    scene.distance,
    connectionsToRadar,
    scene.long,
    scene.lat,
    scene.cameraDirection,
    scene.timeCapture,
    scene.pointLayer
  );
}

function hasRequiredAttributes(feature: __esri.Graphic, props: AllWidgetProps<any>): boolean {

  const lat = feature.attributes[props.config.longitudeAtribute || "X"];
  const lon = feature.attributes[props.config.latitudeAtribute || "Y"];

  const direction = feature.attributes[props.config.cameraDirectionAtribute || "DIRECAO"];
  return lat != null && lon != null && direction != null;
}



export async function queryScene(
  jimuLayerViews: JimuLayerViews,
  mapPoint: __esri.Point,
  props: AllWidgetProps<any>
): Promise<SceneModel> {
  const results: SceneModel[] = [];



  for (const jimuLayerView in jimuLayerViews) {

    const jlv = jimuLayerViews[jimuLayerView]
    if (jlv.type !== "feature" && jlv.type !== "scene") continue;

    var distance = 10;
    if(jlv.layer.type=="scene")
      distance = 40;


    const result = await jlv.layer.queryFeatures({
      geometry: mapPoint,
      distance: distance,
      units: "meters",
      returnGeometry: true,
      outFields: ["*"]
    });

    if (!result || result.features.length === 0) continue;


    const orderedFeatures = result.features
      .map(f => ({
        feature: f,
        dist: geometryEngine.distance(mapPoint, f.geometry, "meters")
      }))
      .sort((a, b) => a.dist - b.dist);
    
    for (const {feature} of orderedFeatures) {

      if (!hasRequiredAttributes(feature, props)) continue;

      const scene = await buildScene(jlv.layer, feature, props);
      scene.pointLayer = feature.geometry as __esri.Point;
      results.push(scene);
    }

  }

  return results[0];
}


export async function queryConnections(
  jimuLayerViews: JimuLayerViews,
  mainScene: SceneModel,
  distance: number = 8,
  unit = "meters",
  props: AllWidgetProps<any>
): Promise<SceneModel[]> {
  const results: SceneModel[] = [];

  for (const jimuLayerView in jimuLayerViews) {

    const jlv = jimuLayerViews[jimuLayerView]

    if (jlv.type !== "feature" && jlv.type !== "scene") continue;

    const result = await jlv.layer.queryFeatures({
      geometry: mainScene.pointLayer,
      distance: distance,
      units: unit,
      returnGeometry: true,
      outFields: ["*"]
    });


    for (const feature of result.features) {
      if (featureIsEqual(feature, mainScene)) continue;

      if (!hasRequiredAttributes(feature, props)) continue;

      const conn = await buildScene(jlv.layer, feature, props);
      conn.pointLayer = feature.geometry as __esri.Point;
      conn.bearing = CalculateBearingScenes(mainScene, conn);
      results.push(conn);
    }
  }

  return results;
}


function featureIsEqual(feature: __esri.Graphic, mainScene: SceneModel): boolean {
    return feature.attributes.OBJECTID === mainScene.objectId;

}

export async function queryConnectionsPerTime(
  jimuLayerViews: JimuLayerViews,
  mainScene: SceneModel,
  distance: number = 8,
  unit = "meters",
  props: AllWidgetProps<any>
): Promise<SceneModel[]> {
  const results: SceneModel[] = [];

  for (const jimuLayerView in jimuLayerViews) {
    const jlv = jimuLayerViews[jimuLayerView];
    if (jlv.type !== "feature" && jlv.type !== "scene") continue;

    const queryResult = await jlv.layer.queryFeatures({
      geometry: mainScene.pointLayer,
      distance: distance,
      units: unit,
      returnGeometry: true,
      outFields: ["*"]
    });

    const candidateFeatures = queryResult.features.filter(f => {
      const isSame = featureIsEqual(f, mainScene);
      const hasAttrs = hasRequiredAttributes(f, props);
      return !isSame && hasAttrs;
    });

    const after = candidateFeatures
      .filter(f => parseDate(f.attributes[props.config.timeCaptureAtribute]) > parseDate(mainScene.timeCapture))
      .sort((a, b) =>
        parseDate(a.attributes[props.config.timeCaptureAtribute]).getTime() -
        parseDate(b.attributes[props.config.timeCaptureAtribute]).getTime()
    )[0];

    const before = candidateFeatures
      .filter(f => parseDate(f.attributes[props.config.timeCaptureAtribute]) < parseDate(mainScene.timeCapture))
      .sort((a, b) =>
        parseDate(b.attributes[props.config.timeCaptureAtribute]).getTime() -
        parseDate(a.attributes[props.config.timeCaptureAtribute]).getTime()
    )[0];
    const selectedFeatures: any[] = [];
    if (after) selectedFeatures.push(after);
    if (before) selectedFeatures.push(before);

    for (const feature of selectedFeatures) {
      const conn = await buildScene(jlv.layer, feature, props);
      conn.pointLayer = feature.geometry as __esri.Point;
      conn.bearing = CalculateBearingScenes(mainScene, conn);
      results.push(conn);
    }
  }

  return results;
}



export function addDefaultMarker(view: __esri.MapView, point: __esri.Point) {
  const markerSymbol = new PictureMarkerSymbol({
    url: "https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png", 
    width: "48px",
    height: "48px"
  });


  const graphic = new Graphic({
    geometry: point,
    symbol: markerSymbol as PictureMarkerSymbol,
  });

  view.graphics.add(graphic);
}


export async function selectScenePointWithMarker(
  jimuLayerViews: JimuLayerViews,
  mapPoint,
  view,
  props: AllWidgetProps<any>
) {
  const mainScene = await queryScene(jimuLayerViews, mapPoint, props);


  if (!mainScene) return null;

  mainScene.pointLayer = mapPoint;
  addDefaultMarker(view, mapPoint);

  view.goTo({
    target: mapPoint
  });

  return mainScene;
}


