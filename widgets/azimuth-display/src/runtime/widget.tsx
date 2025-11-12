/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'

interface State {
  jimuMapView: JimuMapView | null
  ready: boolean
}

export default class EmptyMapWidget extends React.PureComponent<AllWidgetProps<any>, State> {
  constructor(props) {
    super(props)
    this.state = {
      jimuMapView: null,
      ready: false
    }
  }

  /** Espera até que o require esteja definido */
  private async waitForRequire(): Promise<void> {
    return new Promise((resolve) => {
      const handle = setInterval(() => {
        if (typeof (window as any).require !== 'undefined') {
          clearInterval(handle)
          resolve()
        }
      }, 200)
    })
  }

  /** Executado uma vez, quando o widget é montado */
  async componentDidMount() {
    console.log('⏳ Aguardando require...')
    await this.waitForRequire()
    console.log('✅ require disponível, iniciando widget')
    this.setState({ ready: true })
  }

  onActiveViewChange = (jmv: JimuMapView) => {
    console.log('Active view changed:', jmv)
    this.setState({ jimuMapView: jmv })
  }

  render() {
    // Enquanto o require não estiver pronto, não renderiza nada
    if (!this.state.ready) {
      return <div>Carregando dependências...</div>
    }

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
