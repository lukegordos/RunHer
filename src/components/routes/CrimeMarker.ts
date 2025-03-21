import L from 'leaflet';

// Define custom marker icons for different crime severities
export const createCrimeMarkerIcon = (severity: 'low' | 'medium' | 'high'): L.DivIcon => {
  // Define colors based on severity
  const colorMap = {
    low: '#FFC107', // Amber
    medium: '#FF9800', // Orange
    high: '#F44336'  // Red
  };

  const size = severity === 'high' ? 12 : severity === 'medium' ? 10 : 8;
  const color = colorMap[severity];
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
      "></div>
    `,
    className: 'crime-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Create a legend control for crime markers
export const createCrimeLegendControl = (): L.Control => {
  const LegendControl = L.Control.extend({
    onAdd: function() {
      const div = L.DomUtil.create('div', 'crime-legend');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 8px;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.2);
          font-size: 12px;
          line-height: 1.5;
        ">
          <div style="font-weight: bold; margin-bottom: 4px;">Crime Incidents</div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #FFC107;
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
              margin-right: 6px;
            "></div>
            <span>Low Severity</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: #FF9800;
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
              margin-right: 6px;
            "></div>
            <span>Medium Severity</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background-color: #F44336;
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
              margin-right: 6px;
            "></div>
            <span>High Severity</span>
          </div>
        </div>
      `;
      return div;
    }
  });
  
  return new LegendControl({ position: 'bottomright' });
};
