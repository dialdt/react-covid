import React, { useState } from 'react';
import './App.css';
import Async from 'react-async';
import Chart from "react-apexcharts"
import 'bootstrap/dist/css/bootstrap.min.css';
import styled from 'styled-components';
import {Container, Row, Col, Button, InputGroup, FormControl, DropdownButton, Dropdown} from 'react-bootstrap';
const axios = require('axios').default;


const casesApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-cases_latest.json';
//const deathsApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-deaths_latest.json';

const covidData = ({place, lvl}) => 
  axios.get(casesApiUrl)
    .then(function(response) {
      //return filtered data
      const ltlas = response.data[lvl].filter(function(la) {
        return la.areaName === place;
      })
      const today = response.data.ltlas.filter(function(dt) {
        return dt.specimenDate === '2020-07-10';
      })
      const yesterday = response.data.ltlas.filter(function(dt) {
        return dt.specimenDate === '2020-07-09';
      })
      return [
        ltlas,
        today,
        yesterday
      ]
    }).catch(function(error) {
      return '<div class="loading">Error retrieving data :-((</div>'
    })

const Main = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
`

function App() {
  const [plc, setPlace] = useState('Lewes');
  const [level, setLevel] = useState('ltlas');

  const getHighestRates = (arr, n) => {
    let sortedArr = arr.sort((a, b) => a.dailyTotalLabConfirmedCasesRate === b.dailyTotalLabConfirmedCasesRate ? 0 : a.dailyTotalLabConfirmedCasesRate < b.dailyTotalLabConfirmedCasesRate ? -1 : 1)
    return sortedArr.slice(0, n)
  }

  const getHighestCases = (arr, n) => {
    let sortedArr = arr.sort((a, b) => a.dailyLabConfirmedCases === b.dailyLabConfirmedCases ? 0 : a.dailyLabConfirmedCases < b.dailyLabConfirmedCases ? 1 : -1)
    return sortedArr.slice(0, n)
  }

  const getRollingAvg = (arr, n) => {
    let averages = [];
    let start = 0;
    let end = start + n;
  
    for (let i = 0; i <  arr.length; i++) {
      let newArr = arr.slice(start, end);
      let average = Math.round(newArr.reduce((a, b) => a + b / newArr.length))
      if(newArr.length === n) {
        averages.push(average);
      } else {
        return averages;
      }
      start++
      end = start + n;
    }
  }

  // Get the weekly rate of infection for an area - takes an array and a number representing the number of days to aggregate
  // Returns an array of aggregated data
  const getWeeklyRate = (arr, n) => {
    let rates = [];
    // Start at end of array and work back (end - 7)
    let start = arr.length - 7;
    let end = start + n;
  
    for (let i = 0; i <  arr.length; i++) {
      let newArr = arr.slice(start, end);
      if(newArr.length > 0) {
        rates.unshift(newArr.reduce((a, b) => a + b));
      } else {
        return rates;
      }
      start -= n
      end = start + n;
    }
  }

  // Estimate the population of an area by reverse engineering
  // Takes the current rate per 100000 residents and the total number of cases.  Returns a number
  const getPopulation = (rate, cases)  => {
    let a = rate / 100000;
    return cases / a;
  }

  // Get the daily infection rates per 100000 residents.
  // Takes number of cases and estimated population and returns a float  
  const getDailyRates = (cases, population) => {
    return Math.round((cases / population) * 100000);
  }

  // Compare the infection rate per 100000 residents for this week vs last week
  // Takes an array and returns an integer
  const getChange = (arr) => {
    //
    let a = 1;
    let b = 2;
    let newArr = [0, 0];
    for (let i = 0; i < arr.length; i++) {
      if(b < arr.length) {
        let change = Math.round((arr[a] === 0 && arr[b] === 0 ? 0 : arr[a] === 0 && arr[b] > 0 ? 1 : (arr[b] - arr[a]) / arr[a]) * 100)
        newArr.push(change)
        a++
        b++
      } else {
        return newArr
      }
    }
  }

  const radios = [
    { name: 'Country', id: 'countries' },
    { name: 'Region', id: 'regions' },
    { name: 'Regional Authority', id: 'utlas' },
    { name: 'Local Authority', id: 'ltlas' },
  ];

  return (
    <Main>
    <div className="App">
      <Container fliud>
        <Row>
          <Col md={{span: 6, offset: 3}}>
          <h1 class="title">Covid-19 England Statistics</h1>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <DropdownButton title={
                          level==='countries' ? 'Country' : 
                          level==='regions' ? 'Region' : 
                          level==='utlas' ? 'Regional Authority': 
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
                          level==='countries' ? 'e.g. England' : 
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
              <img src={"https://raw.githubusercontent.com/SamHerbert/SVG-Loaders/5deed925369e57e9c58ba576ce303466984db501/svg-loaders/bars.svg"} alt=""/>
            </div>
          )
          if (err) return (
            <div class="loading">
              :-(( Something went wrong...
           </div>
          )
          if (data)
            if(typeof data[0][0] === 'undefined') {
              return (
                <div class="loading">
                  :-( No data to display...
                </div>
              )
            } else {
            const topTenRates = getHighestRates(data[1], 15);
            const topTenCases = getHighestCases(data[1], 15);
            const topTenRatesData = [];
            const topTenRatesX = [];
            const topTenCasesData = [];
            const topTenCasesX = [];
            const estimatedPopulation = getPopulation(data[0][0].dailyTotalLabConfirmedCasesRate, 
                                                    data[0][0].totalLabConfirmedCases)


            for(let item in topTenCases) {
              topTenCasesData.unshift(topTenCases[item].dailyLabConfirmedCases);
              topTenCasesX.unshift(topTenCases[item].areaName);
            }

            for(let item in topTenRates) {
              topTenRatesData.unshift(topTenCases[item].dailyTotalLabConfirmedCasesRate);
              topTenRatesX.unshift(topTenCases[item].areaName);
            }
              
            //Graph options
            let casesOptions = {
              chart: {
                type: 'column'
              },
              title: {
                text: 'Regions with the highest cases (England)',
                style: {
                  color: '#fff'
                }
              },
              series: [{
                name: 'Cases',
                data: topTenCasesData
              }],
              xaxis: {
                categories: topTenCasesX,
                labels: {
                  show: true,
                  style: {
                    colors: '#fff'
                  }
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
                }
              ],
              dataLabels: {
                enabled: false
              },
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
            }

            let ratesOptions = {
              chart: {
                type: 'column'
              },
              title: {
                text: 'Regions with the highest number of cases per 100,0000 residents (England)',
                style: {
                  color: '#fff'
                }
              },
              series: [{
                name: 'rate',
                data: topTenRatesData
              }],
              xaxis: {
                categories: topTenRatesX,
                labels: {
                  show: true,
                  style: {
                    colors: '#fff'
                  }
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
                    text: "Daily Rate",
                    style: {
                      color: '#008FFB',
                    }
                  },
                  tooltip: {
                    enabled: true
                  }
                }
              ],
              dataLabels: {
                enabled: false
              },
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
            }
            
            let chartData = [];
            let chartRateData = [];
            let chartAxis = [];
            data[0].map(item => {
              chartData.unshift(item.dailyLabConfirmedCases);
              chartRateData.unshift(item.dailyTotalLabConfirmedCasesRate);
              chartAxis.unshift(item.specimenDate);
              return 0;
            });
            let rollingAvg = getRollingAvg(chartData, 7);
            let dailyRate = []
            chartData.map(item => 
              dailyRate.push(getDailyRates(item, estimatedPopulation))
            );
            let weeklyRate = getWeeklyRate(dailyRate, 7);
            let weeklyRateChange = getChange(weeklyRate);
            let options = {
              series: [{
                name: 'Daily cases',
                type: 'bar',
                data: chartData,
                fill: {
                  type: 'solid',
                  opacity: [1, 1]
                }
              }, {
                name: '7-day rolling average',
                type: 'area',
                data: rollingAvg,
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
                width: [0, 2, 2],
                curve: 'smooth'
              },
              fill: {
                type: 'solid',
                opacity: [1, 0.35]
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
                    text: "7-Day Rolling Average",
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

              let ratesChangeOptions = {
                series: [{
                  name: 'Weekly Rate',
                  type: 'bar',
                  data: weeklyRate,
                  fill: {
                    type: 'solid',
                    opacity: [1, 1]
                  }
                }, {
                  name: 'Weekly Rate Change (%)',
                  type: 'area',
                  data: weeklyRateChange,
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
                  width: [0, 2],
                  curve: 'smooth'
                },
                fill: {
                  type: 'solid',
                  opacity: [0.5, 0.8]
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
                      text: "Weekly Rate",
                      style: {
                        color: '#008FFB',
                      }
                    },
                    tooltip: {
                      enabled: true
                    }
                  },
                  {
                    seriesName: 'Weekly Rate Change (%)',
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
                      text: "Weekly Rate Change (%)",
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
              <>
              <Row>
                <div id="main">
                  <Col md={{span: 6, offset: 3}}>
                  <div class="headline">
                    <p>The current infection rate for {data[0][0].areaName} is <strong>{data[0][0].dailyTotalLabConfirmedCasesRate} per 100,000 residents</strong>
                    <p>There are {data[0][0].totalLabConfirmedCases} cases reported for {data[0][0].areaName} out of an estimated population of {Math.round(estimatedPopulation/100) * 100}</p>
                    </p>
                    <small>Data presented for the period {data[0][data.length -1].specimenDate} to {data[0][0].specimenDate} from <a href="https://coronavirus.data.gov.uk/" target="_blank" rel="noopener noreferrer">source</a></small>
                  </div>
                  </Col>
                  <Chart 
                    options={options}
                    series={options.series}
                    width='90%'
                    height='400px'
                  >
                  </Chart>
                  <Chart 
                    options={ratesChangeOptions}
                    series={ratesChangeOptions.series}
                    type='area'
                    width='90%'
                    height='400px'
                  >
                  </Chart>
                </div>
              </Row>
              <Row>
                <Col md={6}>
                  <div class="top-ten">
                      <Chart 
                        options={casesOptions}
                        series={casesOptions.series}
                        type='bar'
                        width='100%'
                        height='400px'
                      >
                      </Chart>
                  </div>
                </Col>
                <Col md={6}>
                  <div class="top-ten">
                  <Chart 
                        options={ratesOptions}
                        series={ratesOptions.series}
                        type='bar'
                        width='100%'
                        height='400px'
                      >
                      </Chart>
                  </div>
                </Col>
              </Row>
              </>
            )
            }
        }}
      </Async>
      </Container>
    </div>
    </Main>
  );
  
}

export default App;
