import React, { useState, Component } from 'react';
import './App.css';
import Async from 'react-async';
import Chart from "react-apexcharts"
const axios = require('axios').default;


const casesApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-cases_latest.json';
const deathsApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-deaths_latest.json';
let chartData = [];
let chartAxis = [];
let chartAvg = [];
let options = {};

const covidData = ({place}) => 
  axios.get(casesApiUrl)
    .then(function(response) {
      //return filtered data
      return response.data.utlas.filter(function(la) {
        return la.areaName === place;
      });
    }).catch(function(error) {
      console.log(error);
    })



function App() {
  const [plc, setPlace] = useState('East Sussex')

  const getPlace = (e) => {
    const newPlace = e.target.previousElementSibling.value;
    setPlace(newPlace);
  }

  return (
    <div className="App">
      <input type="text" id="place-input" /><button id="submit-btn" onClick={getPlace}>Get data</button>
      <Async promiseFn = {covidData} place={plc} watch={plc}>
        {({ data, err, isLoading }) => {
          if (isLoading) return "Loading..."
          if (err) return `Something went wrong: ${err.message}`
          if (data)
            if(typeof data[0] === 'undefined') {
              return 'No data...'
            } else {
            chartData = [];
            chartAxis = [];
            data.map(item => {
              chartData.unshift(item.dailyLabConfirmedCases);
              chartAxis.unshift(item.specimenDate);
            })
            options = {
              options: {
                chart: {
                  id: "basic-bar"
                },
                xaxis: {
                  categories: chartAxis
                },
                stroke: {
                  curve: 'smooth'
                },
                dataLabels: {
                  enabled: false
                }
              },
              series: [
                {
                  name: data[0].areaName,
                  data: chartData
                }
              ]
            };
            return (
              <div id="main">
                <h1>Data for {data[0].areaName}</h1>
                <Chart 
                  options={options.options}
                  series={options.series}
                  type='area'
                  width='90%'
                  height='90%'
                >
                </Chart>
              </div>
            )
            }
        }}
      </Async>
    </div>
  );
}

export default App;
