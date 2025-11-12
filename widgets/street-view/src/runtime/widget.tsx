import { React, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView, JimuLayerViews } from 'jimu-arcgis';
import ViewerComponent from './components/ViewerComponent/ViewerComponent';
import { useEffect, useState } from 'react';
import { loadArcGISJSAPIModules } from 'jimu-arcgis';
import { queryScene } from './services/EsriArcgis';
import { SceneModel } from './model/sceneModel';
import { getConfigWarnings } from './utils/ValidatorUtil';
import { IMConfig } from './../../config';

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [selectedSceneModel, setSceneModel] = useState<SceneModel | null>(null);
  const [jimuLayerViews, setJimuLayerViews] = useState<JimuLayerViews>(null);
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
  const [apiReady, setApiReady] = useState(false);
  console.log("Teste");

  useEffect(() => {
    const loadAPI = async () => {
      try {
        await loadArcGISJSAPIModules([]); 
        setApiReady(true);
      } catch (err) {
        console.error('Falha ao carregar API ArcGIS:', err);
      }
    };
    loadAPI();
  }, []);

  const handleMapClick = async (view: JimuMapView, event: __esri.ViewClickEvent) => {
    const warnings = getConfigWarnings(props);
    if (warnings.length > 0) return;

    const { mapPoint } = event;
    const layerViews = await view.jimuLayerViews;
    if (!layerViews) return;

    setJimuLayerViews(layerViews);

    try {
      const sceneModel = await queryScene(layerViews, mapPoint, props);
      setSceneModel(sceneModel);
    } catch (error) {
      console.error('Erro ao consultar a camada:', error);
    }
  };

  const onActiveViewChange = (view: JimuMapView) => {
    if (!apiReady || !view) {
      console.warn('API ArcGIS ainda não está pronta. Aguardando...');
      return;
    }

    console.log('View ativa definida:', view);
    setJimuMapView(view);

    view.view.on('click', (event) => handleMapClick(view, event));
  };

  const warnings = getConfigWarnings(props);

  return (
    <>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <div
          className="widget-my-map-widget"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {jimuMapView && warnings.length > 0 && (
            <div
              style={{
                backgroundColor: '#fcff4dff',
                color: '#080808ff',
                padding: '10px',
                textAlign: 'center',
                fontWeight: 600,
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
                jimuMapView={jimuMapView}
                jimuLayerViews={jimuLayerViews}
                props={props}/>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Widget;
