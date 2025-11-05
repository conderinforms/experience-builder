import React, { useEffect, useState } from "react";
import "./RadarComponent.css";
import {
  CalculateBearingScenes,
  CalculateDistanceScenes,
  SceneModel,
} from "../../model/sceneModel";

interface RadarComponentProps {
  size?: number;
  className?: string;
  sceneCurrent?: SceneModel | null;
  viewer?: any;
  azimuth?: number;
  onSceneClick?: (scene: SceneModel) => void;
}

const RadarComponent: React.FC<RadarComponentProps> = ({
  size = 500,
  className = "",
  sceneCurrent = null,
  viewer,
  azimuth = 0,
  onSceneClick,
}) => {
  const [direction, setDirection] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // 👈 chave de atualização


  useEffect(() => {
    if (!viewer) return;

    const updateDirection = () => {
      const currentPosition = viewer.getPosition();
      if (!currentPosition) return;

      const yawDeg = (currentPosition.yaw * 180) / Math.PI;
      setDirection(((yawDeg + 360) % 360));
    };

    viewer.addEventListener("ready", updateDirection);
    viewer.addEventListener("position-updated", updateDirection);

    return () => {
      viewer.removeEventListener("position-updated", updateDirection);
      viewer.removeEventListener("ready", updateDirection);
    };
  }, [viewer]);

  // Calcula posição de cada ponto no radar
  const getPointPosition = (main: SceneModel, target: SceneModel) => {
    const distance = CalculateDistanceScenes(main, target);
    let bearing = CalculateBearingScenes(main, target) - 180;

    // Aplica correção pelo azimute e direção do viewer
    bearing = (bearing - direction + azimuth + 360) % 360;

    const maxDistance = 20;
    const normalized = Math.min(distance / maxDistance, 1);

    const maxRadius = size * 0.45;
    const angle = bearing * (Math.PI / 180);

    return {
      x: Math.cos(angle) * maxRadius * normalized,
      y: Math.sin(angle) * maxRadius * normalized,
    };
  };

  const renderCircles = () => (
    <div className="circle circle-huge">
      <div className="circle circle-big">
        <div className="circle circle-medium">
          <div className="circle circle-small">
            <div className="circle circle-tiny">
              <div className="circle circle-center">
                <div className="radar-sweep" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConnections = () =>
    sceneCurrent?.connections?.map((conn, idx) => {
      const { x, y } = getPointPosition(sceneCurrent, conn);
      return (
        <div
          key={`${idx}-${refreshKey}`} // 👈 inclui refreshKey
          className="target-point"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
          }}
          onClick={() => {
            onSceneClick?.(conn);
            setRefreshKey(k => k + 1); // 👈 força re-render
          }}
        />
      );
    });

  return (
    <div
      className={`radar-container ${className} fixed`}
      style={
        {
          width: size,
          height: size,
          "--radar-size": `${size}px`,
          "--sweep-angle": "60deg",
        } as React.CSSProperties
      }
    >
      {renderCircles()}

      <div className="main-point" style={{ left: "50%", top: "50%" }} />

      {renderConnections()}

      <div className="grid-lines">
        <div className="grid-line horizontal" />
        <div className="grid-line vertical" />
      </div>
    </div>
  );
};

export default RadarComponent;
