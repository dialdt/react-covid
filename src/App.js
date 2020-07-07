import React, { useState, Component } from 'react';
import './App.css';
import Async from 'react-async';
import Chart from "react-apexcharts"
import 'bootstrap/dist/css/bootstrap.min.css';
import {Container, Row, Col, ButtonGroup, ToggleButton, Button, InputGroup, FormControl, DropdownButton, Dropdown} from 'react-bootstrap';
const axios = require('axios').default;


const casesApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-cases_latest.json';
const deathsApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-deaths_latest.json';
let countryData= [];

const covidData = ({place, lvl}) => 
  axios.get(casesApiUrl)
    .then(function(response) {
      //return filtered data
      const ltlas = response.data[lvl].filter(function(la) {
        return la.areaName === place;
      })
      return ltlas
    }).catch(function(error) {
      console.log(error);
    })



function App() {
  const [plc, setPlace] = useState('Lewes');
  const [level, setLevel] = useState('ltlas');

  const radios = [
    { name: 'Country', id: 'countries' },
    { name: 'Region', id: 'regions' },
    { name: 'Upper Tier', id: 'utlas' },
    { name: 'Lower Tier', id: 'ltlas' },
  ];

  return (
    <div className="App">
      <Container fliud>
        <Row>
          <Col md={{span: 6, offset: 3}}>
          <h1 class="title">Covid-19 UK Statistics</h1>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <DropdownButton title={
                          level==='countries' ? 'Country' : 
                          level==='regions' ? 'Region' : 
                          level==='utlas' ? 'Regional Local Authority' : 
                          'Local Authority'
                        }
              >
                {radios.map((radio, idx) => (
                    <Dropdown.Item
                    key={idx}
                    name="dropDownItem"
                    id={radio.id}
                    onClick={(e) => setLevel(e.currentTarget.id)}
                    onMouseOut={(e) => {e.currentTarget.parentElement.parentElement.parentElement.nextElementSibling.value=''}}
                  >
                    {radio.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </InputGroup.Prepend>
            <FormControl
              placeholder={
                          level==='countries' ? 'e.g. England, Wales, ...' : 
                          level==='regions' ? 'e.g. South West, North East, ...' : 
                          level==='utlas' ? 'e.g. East Sussex, Hampshire, ...' : 
                          'e.g. Lewes, Eastbourne, ...'
                          }
              aria-label="Recipient's username"
              aria-describedby="basic-addon2"
              className="text-input"
            />
            <InputGroup.Append>
              <Button id="basic-addon2" onClick={(e) => setPlace(e.currentTarget.parentElement.previousElementSibling.value)}>Get data</Button>
            </InputGroup.Append>
          </InputGroup>
          </Col>
          </Row>
      <Async promiseFn = {covidData} place={plc} lvl={level} watch={plc}>
        {({ data, err, isLoading }) => {
          if (isLoading) return (
            <div class="loading">
              <p>Loading...</p>
            </div>
          )
          if (err) return `Something went wrong: ${err.message}`
          if (data)
            if(typeof data[0] === 'undefined') {
              return 'No data...'
            } else {
            let chartData = [];
            let chartRateData = [];
            let chartAxis = [];
            let dailyCases = data[0].dailyLabConfirmedCases + data[0].changeInTotalCases;
            console.log(data);
            data.map(item => {
              chartData.unshift(item.dailyLabConfirmedCases + item.changeInTotalCases);
              chartRateData.unshift(item.dailyTotalLabConfirmedCasesRate);
              chartAxis.unshift(item.specimenDate);
            });
            data.map(item => {
              countryData.unshift(item.dailyLabConfirmedCases);
            })
            let options = {
              series: [{
                name: 'Cases',
                type: 'area',
                data: chartData
              }, {
                name: 'Rate',
                type: 'area',
                data: chartRateData
              }
              ],
                chart: {
                height: 400,
                type: 'line',
                stacked: false
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                width: [2, 2, 6],
                curve: 'smooth'
              },
              fill: {
                type: 'solid',
                opacity: [0.35, 0.35]
              },
              xaxis: {
                categories: chartAxis,
                labels: {
                  show: false
                }
              },
              yaxis: [
                {
                  axisTicks: {
                    show: true,
                  },
                  axisBorder: {
                    show: true,
                    color: '#008FFB'
                  },
                  labels: {
                    style: {
                      colors: '#008FFB',
                    }
                  },
                  title: {
                    text: "Daily Cases",
                    style: {
                      color: '#008FFB',
                    }
                  },
                  tooltip: {
                    enabled: true
                  }
                },
                {
                  seriesName: 'Rate',
                  opposite: true,
                  axisTicks: {
                    show: true,
                  },
                  axisBorder: {
                    show: true,
                    color: '#00E396'
                  },
                  labels: {
                    style: {
                      colors: '#00E396',
                    }
                  },
                  title: {
                    text: "Daily Rate",
                    style: {
                      color: '#00E396',
                    }
                  },
                },
              ],
              tooltip: {
                fixed: {
                  enabled: true,
                  position: 'topLeft', // topRight, topLeft, bottomRight, bottomLeft
                  offsetY: 30,
                  offsetX: 60
                },
                style: {
                  colors: ['#000']
                }
              },
              legend: {
                horizontalAlign: 'left',
                offsetX: 40,
                labels: {
                  colors: ['#fff']
                }
              }
              };
      
            return (
              <Row>
                <div id="main">
                  <Col md={{span: 6, offset: 3}}>
                  <div class="headline">
                    <p>
                      <strong>{
                        dailyCases === 0 ? 'No new cases' : 
                        dailyCases === 1 ? '1 new case' : 
                        dailyCases + ' new cases'
                      }</strong> reported on {data[0].specimenDate} in {data[0].areaName} and the infection rate is <strong>{data[0].dailyTotalLabConfirmedCasesRate}</strong> per 100,000 residents
                    </p>
                    <small>Data presented for the period {data[data.length -1].specimenDate} to {data[0].specimenDate} from <a href="https://coronavirus.data.gov.uk/" target="_blank">source</a></small>
                  </div>
                  </Col>
                  <Chart 
                    options={options}
                    series={options.series}
                    width='90%'
                    height='400px'
                  >
                  </Chart>
                </div>
              </Row>
            )
            }
        }}
      </Async>
      </Container>
    </div>
  );
}

export default App;
