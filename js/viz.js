/* globals d3, crossfilter, dc */

var dims;
var groups;

(function(d3, crossfilter, dc) {
  var charts = {
    gradeBands: dc.rowChart('#gradeBands'),
    csResponses: dc.pieChart('#csResponses'),
    table: dc.dataTable('#districts')
  };

  d3.csv('./data/gradeLevelData.csv', function (school) {
    var gradeBands = [];

    if (school['Stage El'] === '1')
      gradeBands.push('Elementary');
    if (school['Stage Mi'] === '1')
      gradeBands.push('Middle');
    if (school['Stage Hi'] === '1')
      gradeBands.push('High');

    if (!gradeBands.length || !+school.Students)
      return;

    return {
      district: school['School District Name'],
      school: school['School Name'],
      population: +school.Students,
      gradeBands: gradeBands,
      csResponse: school['Teaches CS?'] || 'Unknown',
    };
  }).then(render);

  function render(schools) {
    var ndx = crossfilter(schools);
    dims = {
      district: ndx.dimension(dc.pluck('district')),
      school: ndx.dimension(dc.pluck('school')),
      gradeBands: ndx.dimension(dc.pluck('gradeBands'), true),
      csResponses: ndx.dimension(dc.pluck('csResponse'))
    };
    groups = {
      gradeBands: dims.gradeBands.group().reduceCount(),
      schools: (function() {
        var group = dims.district.group().reduce(
          function reduceAdd(p, v) {
            return v.population > 0 ? p.concat([v]) : p;
          },
          function reduceRemove(p, v) {
            return p.filter(function (s) { return s !== v; });
          },
          function reduceInit() {
            return [];
          }
        );
        var nonEmpty = function (s) { return s.value.length; };
        return {
          all: function() {
            return group.all().filter(nonEmpty);
          },
          top: function (n) {
            return group.top(Infinity).filter(nonEmpty).slice(0, n);
          }
        };
      })(),
      population: dims.district.group().reduceSum(dc.pluck('population')),
      csResponses: dims.csResponses.group().reduceCount()
    };

    var gradeBandsOrder = ['High','Middle','Elementary'];
    charts.gradeBands
      .ordinalColors(['#000', '#333', '#666'])
      .elasticX(true)
      .dimension(dims.gradeBands)
      .group(groups.gradeBands)
      .ordering(function (d) { return gradeBandsOrder.indexOf(d.key); })
    ;

    var csResponsesOrder = ['Yes', 'No', 'Inconsistent', 'Unknown'];
    charts.csResponses
      .ordinalColors(['#f6921e', '#56000a', '#fdc998', '#bb555c'])
      .dimension(dims.csResponses)
      .group(groups.csResponses)
      .ordering(function (d) { return csResponsesOrder.indexOf(d.key); })
    ;

    charts.table
      .size(Infinity)
      .dimension(groups.schools)
      .group(function (g) { return g.key; })
      .showGroups(false)
      .columns([
        {
          label: 'District',
          format: dc.pluck('key')
        },
        {
          label: 'School Responses',
          format: function (g) {
            var responses = g.value.filter(function (s) {
              return s.csResponse !== 'Unknown';
            });
            return '' + responses.length + ' of ' + g.value.length;
          }
        },
        {
          label: '% Teaching Computer Science',
          format: function (g) {
            var yes = g.value.filter(function (s) {
              return s.csResponse === 'Yes';
            });
            return g.value.length ? d3.format('.0%')(yes.length / g.value.length) : null;
          }
        }
      ])
      .order(d3.ascending.bind(null))
      .renderlet(function(chart){
        var good = "#04ad88";
        var bad = d3.hsl(good);
        bad.l /= 2;
        var color = d3.scaleLinear()
          .domain([0,1])
          .range(['#999', good]);
        chart.selectAll('tr.dc-table-row')
          .style('background-color', function(g) { 
            if(!g.value.length)
              return null;
            console.log(g);
            var yes = g.value.filter(function (s) {
              return s.csResponse === 'Yes';
            });

            var responded = g.value.filter(function (s) {
              return s.csResponse !== 'Unknown';
            });

            var yesColor = d3.rgb(color(yes.length / g.value.length));
            yesColor.opacity = responded.length ? (
              responded.length === g.value.length ? 1 : 0.5
              ) : 0;
            return yesColor;
         })
      })
    ;

    dc.renderAll();
  }
})(d3, crossfilter, dc);