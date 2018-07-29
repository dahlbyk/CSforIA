/**Authors: Craig Barkley , Ben Van Meter*/
/* globals Chart, loadGradeCSData*/
'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
//pieChart for index page//
/////////////////////////////////////////////////////////////////////////////////////////
var csGradeLevel;

function loadGradeCSData(data){
  csGradeLevel = data;
  filterGradeCSData();
}
//This function takes in csv data checking for parameter grade to be one of the form inputs.
////////////////////////////////////////////////////////////////////////////////////////////
function filterGradeCSData(grade){
  var notResponded = 0;
  var inconsistentResponse = 0;
  var teachesYes = 0;
  var teachesNo = 0;
  //This for loop checks filters to see if elementary, middle, or high school is selected as a radio button.
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  for(var i = 0; i < csGradeLevel.length; i++){
    //if form value elementary column has 1 continue to show elementary
    if(grade === 'e' && csGradeLevel[i]['Stage El'] !== '1'){
      continue;
    }
    //if form value middle school column has 1 continue to show middle school chart
    if(grade === 'm' && csGradeLevel[i]['Stage Mi'] !== '1'){
      continue;
    }
    //if form value high school column has 1 continue to show elementary school chart
    if(grade === 'h' && csGradeLevel[i]['Stage Hi'] !== '1'){
      continue;
    }
    //Takes the responses column teaches cs? and checks filters if no filter for schools selected show all schools.
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var responseToSurvey = csGradeLevel[i]['Teaches CS?'];
    if (!responseToSurvey || responseToSurvey === 'Unknown'){
      notResponded++;
    }else if (responseToSurvey === 'Inconsistent'){
      inconsistentResponse++;
    }else if (responseToSurvey === 'Yes'){
      teachesYes++;
    }else if (responseToSurvey === 'No'){
      teachesNo++;
    }
  }

  //console.log({ notResponded, inconsistentResponse, teachesYes, teachesNo });
  //Passes parameters to render the pie charts.
  renderPieChartsThree(notResponded, inconsistentResponse, teachesYes, teachesNo);
  saveAll();
}

var pieChart;
//variable piechart to aid in updating pie chart radio button selection
function renderPieChartsThree(NoRes, inconRes, teachY, teachN){
  //sets arguments to variable pie chart.
  var pieData = [NoRes, inconRes, teachY, teachN];
  //Checks to see if a pie chart is present, if so update(piechart) then return to drawing pie chart
  if (pieChart) {
    pieChart.data.datasets[0].data = pieData;
    pieChart.update();
    return;
  }

  pieChart = new Chart(document.getElementById('doughnut-chartIndex'), {
    type: 'doughnut',
    data: {
      labels: ['No Response from Schools', 'Inconsistent Reporting', 'Schools That Teach CS', 'Schools that don\'t Teach'],
      datasets: [
        {
          label: 'Schools Survey Responses and CS programs in Iowa.',
          backgroundColor: ['#fda2a3','#ca1ce9','#6392bc','#c0c6ca'],
          data: pieData
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Grade level CS programs throughout Iowa'
      }
    }
  });
}

// function handleSubmit(event){
//   event.preventDefault();
//   var grade = event.target.grade.value;
//   console.log(grade);
//   filterGradeCSData(grade);
// }

var form = document.querySelector('form');
// form.addEventListener('submit', handleSubmit);

function handleInput(event){
  var grade = event.target.value;
  console.log(grade);
  filterGradeCSData(grade);
}
form.addEventListener('input', handleInput);


function saveAll(){

  var allSchoolsRadio = document.getElementById('allSchools').checked;
  var elementarySchoolsRadio = document.getElementById('elementary').checked;
  var middleSchoolsRadio = document.getElementById('middleSchools').checked;
  var highSchoolsRadio = document.getElementById('highSchools').checked;
  console.log(allSchoolsRadio);
  localStorage['allSchoolsRadio'] = JSON.stringify(allSchoolsRadio);
  localStorage['elementarySchoolsRadio'] = JSON.stringify(elementarySchoolsRadio);
  localStorage['middleSchoolsRadio'] = JSON.stringify(middleSchoolsRadio);
  localStorage['highSchoolsRadio'] = JSON.stringify(highSchoolsRadio);
  console.log(middleSchoolsRadio);
  console.log(highSchoolsRadio);
}
function loadFromStorage(){
  var jsonallSchoolsRadioString = localStorage['allSchoolsRadio'];
  var jsonelementarySchoolsRadioString = localStorage['elementarySchoolsRadio'];
  var jsonmiddleSchoolsRadioString = localStorage['middleSchoolsRadio'];
  var jsonhighSchoolsRadioString = localStorage['highSchoolsRadio'];
  if(jsonallSchoolsRadioString){
    console.log(allSchoolChecked);
    var allSchoolChecked = JSON.parse(jsonallSchoolsRadioString);
    document.getElementById('allSchools').checked = allSchoolChecked;
  }

  if(jsonelementarySchoolsRadioString){
    var elementarySchoolChecked = JSON.parse(jsonelementarySchoolsRadioString);
    document.getElementById('elementary').checked = elementarySchoolChecked;
  }

  if(jsonmiddleSchoolsRadioString){
    var middleSchoolChecked = JSON.parse(jsonmiddleSchoolsRadioString);
    document.getElementById('middleSchools').checked = middleSchoolChecked;
  }

  if(jsonhighSchoolsRadioString){
    var highSchoolChecked = JSON.parse(jsonhighSchoolsRadioString);
    document.getElementById('highSchools').checked = highSchoolChecked;
  }

}
window.addEventListener('load', function onLoad(){
  loadGradeLevelData();
  loadFromStorage();
});





