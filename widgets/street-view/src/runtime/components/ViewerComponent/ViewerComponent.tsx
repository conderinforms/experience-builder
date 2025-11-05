import React, { useState, useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import './ViewerComponent.css';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { SceneModel } from '../../model/sceneModel';
import { buildSceneToRadar, queryConnections, queryConnectionsPerTime } from '../../services/EsriArcgis';
import 'animate.css';
import { selectScenePointWithMarker } from '../../services/EsriArcgis';
import RadarComponent from '../RadarComponent/RadarComponent';
import { ConvertYawToBearing, toBearing, toRadians } from '../../utils/MathUtil';
import { JimuLayerViews } from 'jimu-arcgis';
import { UpOutlined } from 'jimu-icons/outlined/directional/up'
import ReactDOM from 'react-dom';
import { AllWidgetProps } from 'jimu-core';


interface PhotoSphereViewerProps {
  sceneCurrent?: SceneModel;
  jimuLayerViews?: JimuLayerViews;
  props?: AllWidgetProps<any>;
}

const ViewerComponent: React.FC<PhotoSphereViewerProps> = ({
  sceneCurrent = null,
  jimuLayerViews = null,
  props = null
}) => {
  const [viewer, setViewer] = useState(null);
  const compassArrowsRef = useRef([]);
  const viewerInstance = useRef(null);
  const viewerRef = useRef(null);
  const compassContainerRef = useRef(null);
  const [sceneToRadarState, setSceneToRadarState] = useState<SceneModel | null>(null);


  const setupCompass = () => {
    if (!compassContainerRef.current || !sceneCurrent) return;

    compassContainerRef.current.innerHTML = '<div class="compass-center"></div>';
    const newCompassArrows: { element: HTMLDivElement; bearing: number; connection: SceneModel }[] = [];

    if (!sceneCurrent.connections || sceneCurrent.connections.length === 0) return;

    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    sceneCurrent.connections.forEach((conn) => {
      const arrowDiv = document.createElement('div');
      arrowDiv.classList.add('compass-arrow');

      arrowDiv.style.left = `${centerX - 10}px`;
      arrowDiv.style.top = `${centerY - radius}px`;

      arrowDiv.innerHTML = `<i class="bi bi-arrow-up"></i>`;
      ReactDOM.render(<UpOutlined />, arrowDiv);
      arrowDiv.addEventListener('click', () => {
        changeScene(conn);
      });

      compassContainerRef.current!.appendChild(arrowDiv);

      newCompassArrows.push({
        element: arrowDiv,
        bearing: conn.bearing ?? 0,
        connection: conn,
      });
    });

    compassArrowsRef.current = newCompassArrows;
    updateCompassRotation();
  };



  const updateCompassRotation = () => {
    if (!compassArrowsRef.current.length || !viewerInstance.current || !sceneCurrent) return;

    // o x é setado como -1 no css para corrigir a inversão do Y
    // o -90 é para alinhar a seta com o norte (0 graus)
    // o + direção da câmera é para alinhar com a direção da câmera

    const currentPosition = viewerInstance.current.getPosition();
    let convertedBearing = ConvertYawToBearing(currentPosition.yaw);
    let currentBearing = toBearing(convertedBearing);

    const camDir = toBearing(sceneCurrent.cameraDirection);

    const radius = 60;
    const centerX = 100;
    const centerY = 100;

    compassArrowsRef.current.forEach((arrow, idx) => {

      // diferença de ângulo
      let adjustedBearing = arrow.bearing + camDir;

      let rawDiff = adjustedBearing + currentBearing - 90;
      let angleDifference = toBearing(rawDiff);


      // radianos
      const angleRad = toRadians(angleDifference - 90);

      // posição
      const CorrectAngule = 20;
      const x = ((centerX + radius * Math.cos(angleRad)) - CorrectAngule);
      const y = ((centerY + radius * Math.sin(angleRad)) - CorrectAngule);

      // aplicar posição e rotação
      arrow.element.style.left = `${x}px`;
      arrow.element.style.top = `${y}px`;
      arrow.element.style.transform = `rotate(${angleDifference}deg)`;

      // opacidade
      const opacity = 0.3 + 0.7 * Math.abs(Math.cos(angleDifference * Math.PI / 180));
      arrow.element.style.opacity = opacity;
    });

  };




  const ClearCompass = () => {
    if (!compassContainerRef.current) return;

    compassContainerRef.current.innerHTML = '';
    compassArrowsRef.current = [];
  }

  const changeScene = async (newScene: SceneModel) => {
    ClearCompass();

    var view = (window as any).activeMapView?.view
    view.graphics.removeAll();

    if (!viewerInstance.current || !newScene) return;

    var connections = new Array<SceneModel>();
    if (props.config.priority == "Position") {
      var bufferDistance = parseFloat(props.config.bufferDistance);

      if (isNaN(bufferDistance))
        bufferDistance = 10;

      connections = await queryConnections(jimuLayerViews, newScene, bufferDistance, "meters", props);
    }
    else
      connections = await queryConnectionsPerTime(jimuLayerViews, newScene, 100, "meters", props);


    if (connections.length > 0)
      newScene.connections = connections;

    sceneCurrent = newScene;
    selectScenePointWithMarker(jimuLayerViews, sceneCurrent.pointLayer, (window as any).activeMapView?.view, props);


    viewerInstance.current.setPanorama(newScene.path, {
      caption: "Scene-" + newScene.objectId,
      transition: 700,
      showLoader: true,
      defaultZoomLvl: -100,
    }).then(() => {
      setupCompass()
    }).catch(err => console.error('Erro ao trocar panorama:', err));

    setSceneToRadarState(await buildSceneToRadar(sceneCurrent, jimuLayerViews, props));



  };


  useEffect(() => {
    const fullscreenBtn = document.getElementById('fullscreen');

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const container = document.querySelector('.app-container') as HTMLElement;
        if (!container) return;

        container.classList.toggle('fullscreen-mode');

        setTimeout(() => {
          if (viewerInstance.current) {
            viewerInstance.current.resize();
          }
        }, 300);
      });
    }

    return () => {
      fullscreenBtn?.removeEventListener('click', () => { });
    };
  }, []);




  useEffect(() => {
    if (!viewerInstance.current || !sceneCurrent) return;

    viewerInstance.current.setPanorama(sceneCurrent.path, {
      caption: "Scene-" + sceneCurrent.objectId,
      transition: 0,
      showLoader: false,
    }).then(() => {
    }).catch(err => console.error('Erro ao trocar panorama:', err));
  }, [sceneCurrent]);

  useEffect(() => {

    if (!sceneCurrent?.path) return;

    const initViewer = async () => {
      try {

        var view = (window as any).activeMapView?.view
        view.graphics.removeAll();

        const imageUrls = new Array<string>();
        imageUrls.push(sceneCurrent.path);


        var connections = new Array<SceneModel>();
        if (props.config.priority == "Position") {
          var bufferDistance = parseFloat(props.config.bufferDistance);

          if (isNaN(bufferDistance))
            bufferDistance = 10;

          connections = await queryConnections(jimuLayerViews, sceneCurrent, bufferDistance, "meters", props);
        }
        else
          connections = await queryConnectionsPerTime(jimuLayerViews, sceneCurrent, 100, "meters", props);

        if ((await connections).length > 0)
          sceneCurrent.connections = await connections;

        const newViewer = new Viewer({
          container: viewerRef.current,
          panorama: sceneCurrent.path,
          caption: "Scene-" + sceneCurrent.objectId,
          plugins: [[MarkersPlugin, {}]],
          defaultZoomLvl: -100,
        });


        newViewer.addEventListener('ready', () => {
          setupCompass();
        });

        newViewer.addEventListener('position-updated', () => {
          updateCompassRotation();
        });

        viewerInstance.current = newViewer;
        setViewer(newViewer);

        selectScenePointWithMarker(jimuLayerViews, sceneCurrent.pointLayer, (window as any).activeMapView?.view, props);
        setSceneToRadarState(await buildSceneToRadar(sceneCurrent, jimuLayerViews, props));


      } catch (error) {
        console.error('Detailed error:', error);
      }
    };

    initViewer();

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };

  }, [sceneCurrent]);

  return (
    <div className="app-container" style={{ width: '100%', height: '100%' }}>


      <div
        id="viewer"
        ref={viewerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div className="navigation-controls">
        <button className="nav-button" id="fullscreen" title="Tela cheia (F)">
          <span className="material-icons">fullscreen</span>
        </button>
      </div>
      <div className="compass-container" id="compass-container" ref={compassContainerRef}>
        <div className="compass-center"></div>
      </div>
      <div className="radar-div">
        {sceneToRadarState && (
          <RadarComponent key={sceneToRadarState.objectId + sceneToRadarState.lat + sceneToRadarState.long} sceneCurrent={sceneToRadarState} azimuth={sceneCurrent.cameraDirection} onSceneClick={changeScene} size={80} viewer={viewer} />
        )}
      </div>
    </div>
  );

};

export default ViewerComponent;