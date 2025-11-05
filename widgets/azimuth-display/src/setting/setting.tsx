import { DataSourceTypes, Immutable, React, UseDataSource } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector';

export default function Setting(props: AllWidgetSettingProps<{ useMapWidgetIds: string[]; priority?: string }>) {
  const supportedTypes = Immutable([DataSourceTypes.FeatureLayer]);
  


  const onDataSourceSelected = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    });
  }


  console.log(props)

  return (
    <div className="widget-setting p-3" style={{ color: '#fff', fontSize: '14px' }}>

      <div className="mb-3">
        <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Selecione a Fonte de Dados:</label>
        <DataSourceSelector
          types={supportedTypes}
          mustUseDataSource ={true}
          useDataSources={props.useDataSources}
          onChange={onDataSourceSelected}
          widgetId={props.id}/>
      </div>

    </div>

    
  );
}
