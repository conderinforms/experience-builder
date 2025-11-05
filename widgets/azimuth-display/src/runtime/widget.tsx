/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'

interface State {
  jimuMapView: JimuMapView | null
}

export default class EmptyMapWidget extends React.PureComponent<AllWidgetProps<any>, State> {
  constructor(props) {
    super(props)
    this.state = {
      jimuMapView: null
    }
  }

  onActiveViewChange = (jmv: JimuMapView) => {
    console.log('Active view changed:', jmv)
    this.setState({ jimuMapView: jmv })
  }

  render() {
    return (
      <div className="widget-empty-map">
        <h3>Meu Widget Vazio</h3>
        <JimuMapViewComponent
          useMapWidgetId={this.props.useMapWidgetIds?.[0]}
          onActiveViewChange={this.onActiveViewChange}
        />
      </div>
    )
  }
}
