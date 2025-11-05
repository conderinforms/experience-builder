import { React, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView, JimuLayerViews } from 'jimu-arcgis';
import ViewerComponent from './components/ViewerComponent/ViewerComponent';
import { useState } from 'react';
import { queryScene } from './services/EsriArcgis';
import { SceneModel } from './model/sceneModel';
import { getConfigWarnings } from './utils/ValidatorUtil';

export default function StreetViewWidget(props: AllWidgetProps<any>) {
  const [selectedSceneModel, setSceneModel] = useState<SceneModel | null>(null);
  const [jimuLayerViews, setJimuLayerViews] = useState<JimuLayerViews>(null);


  const handleMapClick = async (jimuMapView: JimuMapView, event: __esri.ViewClickEvent) => {
    const warnings = getConfigWarnings(props);
    if (warnings.length > 0) return; 

    const x = event.mapPoint;
    const { mapPoint } = event;

    const layerViews = await jimuMapView.jimuLayerViews;
    if (!layerViews) return;

    setJimuLayerViews(layerViews);

    try {
      const view = (window as any).activeMapView?.view;
      view?.graphics.removeAll();

      const sceneModel = await queryScene(layerViews, mapPoint, props);
      setSceneModel(sceneModel);
    } catch (error) {
      console.error("Erro ao consultar a camada:", error);
    }
  };

  const onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (jimuMapView) {
      (window as any).activeMapView = jimuMapView;
      jimuMapView.view.on('click', (event) => handleMapClick(jimuMapView, event));
    }
  };

  const warnings = getConfigWarnings(props);

  return (
    <div
      className="widget-my-map-widget"
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {warnings.length > 0 && (
        <div
          style={{
            backgroundColor: '#fcff4dff',
            color: '#080808ff',
            padding: '10px',
            textAlign: 'center',
            fontWeight: 600
          }}
        >
          {warnings.map((w, i) => (
            <div key={i}>{w} Por favor, configure nas propriedades do widget.</div>
          ))}
        </div>
      )}

      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />

      {selectedSceneModel && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ViewerComponent
            key={selectedSceneModel.objectId}
            sceneCurrent={selectedSceneModel}
            jimuLayerViews={jimuLayerViews}
            props={props}
          />
        </div>
      )}
    </div>
  );
}
