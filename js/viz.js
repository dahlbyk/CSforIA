/* globals d3, crossfilter, dc, topojson */

var dims;
var groups;
var schoolData;
var districtShapes;

(function(d3, crossfilter, dc, topojson) {
  var charts = {
    gradeBands: dc.rowChart('#gradeBands'),
    csResponses: dc.pieChart('#csResponses'),
    map: dc.geoChoroplethChart('#map'),
    table: dc.dataTable('#districts')
  };

  d3.json('./data/districts.simple2.topo.json')
    .then(function (shapes) {
      districtShapes = shapes;
      if (schoolData) render(schoolData, districtShapes);
    });
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

    function normalizeDistrict(district){
      switch (district) {
        case 'A-H-S-T COMM SCHOOL DISTRICT':
        case 'WALNUT COMM SCHOOL DISTRICT':
          return 'AHSTW COMM SCHOOL DISTRICT';
        case 'COLO-NESCO SCHOOL COMM SCHOOL DISTRICT':
          return 'COLO-NESCO COMM SCHOOL DISTRICT';
        case 'EDDYVILLE-BLAKESBURG- FREMONT CSD':
          return 'EDDYVILLE-BLAKESBURG-FREMONT CSD';
        case 'ELK HORN-KIMBALLTON COMM SCHOOL DISTRICT':
        case 'EXIRA-ELK HORN-KIMBALLTON COMM SCHOOL DISTRICT':
          return 'EXIRA-ELK HORN-KIMBALLTON COMM SCH DIST';
        case 'GARNER-HAYFIELD COMM SCHOOL DISTRICT':
        case 'VENTURA COMM SCHOOL DISTRICT':
          return 'GARNER-HAYFIELD-VENTURA COMM SCHOOL DISTRICT';
        case 'SOUTH TAMA COUNTY COMM SCHOOL DISTRICT':
          return 'SOUTH TAMA COUNTY';
        default:
          return district;
      }
    }

    return {
      district: normalizeDistrict(school['School District Name']),
      school: school['School Name'],
      population: +school.Students,
      gradeBands: gradeBands,
      csResponse: school['Teaches CS?'] || 'Unknown',
    };
  }).then(function (schools) {
    schoolData = schools;
    if (districtShapes) render(schoolData, districtShapes);
  });

  var good = '#00aeef'; // NewBoCo Blue
  var bad = d3.hsl(good);
  bad.l *= 2;
  var color = d3.scaleLinear()
    .domain([0,1])
    .range([bad, good]);
  function districtColor(schoolCount, responseCount, csYesCount) {
    var res = d3.rgb(color(responseCount / schoolCount));
    res.opacity = csYesCount ? (
      csYesCount === schoolCount ? 1 : 0.5
    ) : 0;
    return res;
  }

  function render(schools, districts) {
    var ndx = crossfilter(schools);
    dims = {
      districtMap: ndx.dimension(dc.pluck('district')),
      district: ndx.dimension(dc.pluck('district')),
      school: ndx.dimension(dc.pluck('school')),
      gradeBands: ndx.dimension(dc.pluck('gradeBands'), true),
      csResponses: ndx.dimension(dc.pluck('csResponse'))
    };
    groups = {
      districtMap: dims.districtMap.group().reduce(
        function reduceAdd(p, v) {
          return v.population > 0 ? {
            count: p.count + 1,
            responses: p.responses + (v.csResponse === 'Unknown' ? 0 : 1),
            cs: p.cs + (v.csResponse === 'Yes' ? 1 : 0)
          } : p;
        },
        function reduceRemove(p, v) {
          return v.population > 0 ? {
            count: p.count - 1,
            responses: p.responses - (v.csResponse === 'Unknown' ? 0 : 1),
            cs: p.cs - (v.csResponse === 'Yes' ? 1 : 0)
          } : p;
        },
        function reduceInit() {
          return {
            count: 0,
            responses: 0,
            cs: 0,
          };
        }
      ),
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
      .height(300)
      .ordinalColors(['#000', '#333', '#666'])
      .elasticX(true)
      .dimension(dims.gradeBands)
      .group(groups.gradeBands)
      .ordering(function (d) { return gradeBandsOrder.indexOf(d.key); })
    ;

    var csResponsesOrder = ['Yes', 'No', 'Inconsistent', 'Unknown'];
    charts.csResponses
      .height(300)
      .ordinalColors(['#00aeef', '#ffffff', '#c0c0c0', '#808080'])
      .dimension(dims.csResponses)
      .group(groups.csResponses)
      .ordering(function (d) { return csResponsesOrder.indexOf(d.key); })
      .externalRadiusPadding(10)
    ;

    var geojson = topojson.feature(districts, districts.objects.IowaSchoolDistrictsFY18);
    var projection = d3.geoAlbersUsa()
      .fitSize([990,500], geojson);

    charts.map.width(990)
      .height(500)
      .dimension(dims.districtMap)
      .group(groups.districtMap)
      .colorCalculator(function (d) {
        return d ? districtColor(d.count, d.responses, d.cs) : '#ccc';
      })
      .overlayGeoJson(geojson.features, 'SchoolName', function (d) {
        return d.properties.SchoolName.replace(/([ -]) +/g, '$1').toUpperCase();
      })
      .projection(projection)
      .valueAccessor(function(kv) {
        return kv.value;
      })
      .title(function (d) {
        return d.key;
      })
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
        chart.selectAll('tr.dc-table-row')
          .style('background-color', function(g) { 
            if(!g.value.length)
              return null;

            var yes = g.value.filter(function (s) {
              return s.csResponse === 'Yes';
            });

            var responded = g.value.filter(function (s) {
              return s.csResponse !== 'Unknown';
            });

            return districtColor(g.value.length, responded.length, yes.length);
          });
      })
    ;

    dc.renderAll();
  }
})(d3, crossfilter, dc, topojson);