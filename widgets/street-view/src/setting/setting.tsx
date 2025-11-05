import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import { useState } from 'react';
import { Select, Option, Input } from 'jimu-ui';  // <-- aqui

export default function Setting(
  props: AllWidgetSettingProps<{
    useMapWidgetIds: string[];
    latitudeAtribute?: string;
    longitudeAtribute?: string;
    cameraDirectionAtribute?: string;
    priority?: string;
    timeCaptureAtribute?: string;
    bufferDistance?: string;
  }>
) {
  const [fields, setFields] = useState<string[]>([]);

  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    });
  };

  const onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!jimuMapView) return;

    const layerViews = jimuMapView.jimuLayerViews;
    const allFields: string[] = [];

    Object.values(layerViews).forEach((lv) => {
      const layer: any = lv?.layer;
      if (layer?.fields) {
        allFields.push(...layer.fields.map((f: any) => f.name));
      }
    });

    setFields([...new Set(allFields)]);
  };

  const onChangeConfig = (key: string, value: string) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        [key]: value
      }
    });
  };

  return (
    <div className="widget-setting p-3" style={{ color: '#fff', fontSize: '14px' }}>
      <div className="mb-3">
        <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Selecione o Mapa:
        </label>
        <MapWidgetSelector
          useMapWidgetIds={props.useMapWidgetIds}
          onSelect={onMapWidgetSelected}
        />
      </div>

      {props.useMapWidgetIds?.length > 0 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={onActiveViewChange}
        />
      )}

      {fields.length > 0 && (
        <>

          <hr style={{ borderColor: '#555', margin: '1.5rem 0' }} />

          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Selecione os atributos na camada:
          </label>

          <div className="mb-3">
            <label>Longitude:</label>
            <Select
              value={props.config.longitudeAtribute || ''}
              onChange={(e) => onChangeConfig('longitudeAtribute', e.target.value)}
            >
              <Option value="">Nenhum</Option>
              {fields.map((field) => (
                <Option key={field} value={field}>
                  {field}
                </Option>
              ))}
            </Select>
          </div>

          <div className="mb-3">
            <label>Latitude:</label>
            <Select
              value={props.config.latitudeAtribute || ''}
              onChange={(e) => onChangeConfig('latitudeAtribute', e.target.value)}
            >
              <Option value="">Nenhum</Option>
              {fields.map((field) => (
                <Option key={field} value={field}>
                  {field}
                </Option>
              ))}
            </Select>
          </div>




          <div className="mb-3">
            <label>Tempo de captura:</label>
            <Select
              value={props.config.timeCaptureAtribute || ''}
              onChange={(e) => onChangeConfig('timeCaptureAtribute', e.target.value)}
            >
              <Option value="">Nenhum</Option>
              {fields.map((field) => (
                <Option key={field} value={field}>
                  {field}
                </Option>
              ))}
            </Select>
          </div>

          <div className="mb-3">
            <label>Azimute da câmera:</label>
            <Select
              value={props.config.cameraDirectionAtribute || ''}
              onChange={(e) => onChangeConfig('cameraDirectionAtribute', e.target.value)}
            >
              <Option value="">Nenhum</Option>
              {fields.map((field) => (
                <Option key={field} value={field}>
                  {field}
                </Option>
              ))}
            </Select>
          </div>

          <hr style={{ borderColor: '#555', margin: '1.5rem 0' }} />

          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Selecione a prioridade de navegação:
          </label>
          <div className="mb-3">
            <Select
              value={props.config.priority || ''}
              onChange={(e) => onChangeConfig('priority', e.target.value)}
            >
              <Option value="">Nenhum</Option>
              <Option value="Position">Distancia</Option>
              <Option value="Time">Tempo</Option>

            </Select>
          </div>
          
        {props.config.priority === "Position" && (
          <>
            <label>Buffer (Em metro):</label>
            <div className="mb-3">
              <Input type="text" value={props.config.bufferDistance} onChange={(e) => onChangeConfig('bufferDistance', e.target.value)}></Input>
            </div>
          </>
        )}
        </>
      )}
    </div>
  );
}
