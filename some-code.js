google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawBasic);


document.getElementById('input-file').addEventListener('change', getFile)


var fullTavgData = [];

function parseCsv(csv) {
  return csv
    .split(/\r\n|\n/)
    .map(line => line.split(/\s+/).map(v => v.replace(/\"/g, '')));
}

function getFile(event) {
	const input = event.target
  if ('files' in input && input.files.length > 0) {
    readFileContent(input.files[0])

      .then(csv => fillFullTavgData(parseCsv(csv)))
      .then(() => {

        const startYear = +$('#start-year').val() || 1956;
        const endYear = +$('#end-year').val() || 2018;

        console.log(startYear, endYear)

        const arrayForChart = [];
        const arrayForChartAvgTbyYear = [];

        var y2007_0 = getAVGbyMonth(getYearData(startYear, 0));

        for (let yy = startYear + 1; yy < endYear; yy++) {

          let minOffset = -30;
          let minValue = 10000;

          for (let i = -30; i < 30; i++) {
            y200n = getAVGbyMonth(getYearData(yy, i));

            const d = distanceBeetweenShiftedYears(y2007_0, y200n);
            if (d < minValue) {
              minValue = d;
              minOffset = i;
            }
          }

          arrayForChart.push([yy, minOffset]);

          const yearTForAvg = getYearData(yy, 0).map(r => r.t);
          arrayForChartAvgTbyYear.push([yy, _.sum(yearTForAvg) / yearTForAvg.length])

          console.log(startYear, '-', yy, ':', minOffset);
        }
        drawBasic(arrayForChart, 'chart_div', 'Offset days', '#9575cd');
        drawBasic(arrayForChartAvgTbyYear, 'chart_div_svg_year_t', 'TAVG by Year', '#33ac71');

      })
      .catch(error => console.log(error));
  }
}

function getAVGbyMonth(yearArr) {
  const res = [];

  for (let i = 1; i < 13; i++) {
    const temperatures = yearArr.filter(row => row.m === i).map(row => row.t);

    // console.log('*', i, temperatures, _.sum(temperatures)/temperatures.length);

    res.push(_.sum(temperatures)/temperatures.length);
  }

  return res;
}

function fillFullTavgData(sourceArr) {
  // sourceArr.shift(); // remove header

  fullTavgData = sourceArr.map(row => {
    // const splittedYear = row[2].split('-');
    return {
      y: +row[1],
      m: +row[2],
      d: +row[3],
      t: +row[4]
    };
  });

  fullTavgData = _.sortBy(fullTavgData, ['y', 'm', 'd']);

}

function readFileContent(file) {
	const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  })
}

function getYearData(year, offset) {
  offset = offset || 0;

  const slice = [];

  fullTavgData.forEach((row, index) => {
    if (row.y === year) {

      slice.push({
        y: row.y,
        m: row.m,
        d: row.d,
        t: fullTavgData[index + offset].t
      });
    }
  });

  return slice;

}

function distanceBeetweenShiftedYears(arr1, arr2) {
  const resArray = arr1.map((v, i) => (v - arr2[i]) * (v - arr2[i]));
  return Math.sqrt(_.sum(resArray));
}


function drawBasic(arrayForChart, divId, yName, color) {

  var data = new google.visualization.DataTable();
  data.addColumn('number', 'X');
  data.addColumn('number', 'Days');

  data.addRows(arrayForChart);

  var options = {
    hAxis: {
      title: 'Years'
    },
    vAxis: {
      title: yName
    },
    colors: [color],
    legend: 'none',
    trendlines: {
      0: {
        type: 'polynomial',
        degree: 3,
        visibleInLegend: true,
      }
    }

  };

  var chart = new google.visualization.LineChart(document.getElementById(divId));

  chart.draw(data, options);
}