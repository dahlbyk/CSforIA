/* globals Papa, loadGradeCSData*/





// Load data on window load
function loadGradeLevelData() {

  var csvUrl = 'data/2018/gradeLevelData.csv';
 
  Papa.parse(csvUrl, {

    // Download CSV data from csvUrl
    download: true,

    // Use CSV header row
    header: true,

    // When CSV data are available...
    complete: function(gradeResults) {
      console.log('CSV loaded:', gradeResults);

      // results.data is an array of objects
      // object keys are from CSV header row
      loadGradeCSData(gradeResults.data);
    }
  });

}

window.addEventListener('load', loadGradeLevelData);