(async () => {
  const topology = await fetch(
    'https://code.highcharts.com/mapdata/custom/world-highres.topo.json'
  ).then(res => res.json());

  const circlesData = await fetch(
    'https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/world-circles.json'
  ).then(res => res.json());

  const data = circlesData.data
    .filter(item => item.circles > 0)
    .map(item => ({
      'hc-key': item.hc,
      color: '#2a2f4a',
      info: item.country
    }));

  Highcharts.mapChart('map', {
    chart: {
      height: 600,
      map: topology,
      backgroundColor: '#fcfcfc'
    },

    title: {
      text: '<span class="h2 py-2">Logos Circles по света</span>'
    },
    navigation: {
      buttonOptions: {
        align: 'left',
        theme: {
            stroke: '#e6e6e6'
        }
      }
    },
    mapNavigation: {
      enabled: true,
      enableDoubleClickZoomTo: true
    },

    legend: {
      enabled: false
    },
    tooltip: {
      useHTML: true,
      formatter: function () {
        return `
          <div style="color:#000;">
            ${this.point.name}
          </div>
        `;
      }
    },

    series: [{
      data,
      keys: ['hc-key', 'color'],
      states: {
        hover: {
          color: '#79A1E8',
          borderColor: '#ffff'
        }
      }
    }]
  });
})();