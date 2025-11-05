import { AllWidgetProps } from "jimu-core";

export const getConfigWarnings = (props: AllWidgetProps<any>): string[] => {
    const { config, useMapWidgetIds } = props;
    const warnings: string[] = [];

    if (!config?.latitudeAtribute)
      warnings.push("Latitude não configurada.");
    if (!config?.longitudeAtribute)
      warnings.push("Longitude não configurada.");
    if (!config?.cameraDirectionAtribute)
      warnings.push("Direção da câmera não configurada.");
    if (config?.priority == "Time" && !config?.timeCaptureAtribute)
      warnings.push("Prioridade por tempo selecionada, mas o campo de tempo não está configurado.");

    if (!useMapWidgetIds || useMapWidgetIds.length === 0)
      warnings.push("Nenhum mapa selecionado.");

    return warnings;
  };