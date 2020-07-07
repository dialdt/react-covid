import React, { useState, Component } from 'react';
import './App.css';
import Async from 'react-async';
import Chart from "react-apexcharts"
import 'bootstrap/dist/css/bootstrap.min.css';
import {Container, Row, Col, ButtonGroup, ToggleButton, Button, InputGroup, FormControl, DropdownButton, Dropdown} from 'react-bootstrap';
const axios = require('axios').default;


const casesApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-cases_latest.json';
const deathsApiUrl = 'https://c19downloads.azureedge.net/downloads/json/coronavirus-deaths_latest.json';
let chartData = [];
let chartAxis = [];
let countryData= [];
let options = {};

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
                    variant="primary"
                    name="dropDownItem"
                    id={radio.id}
                    onClick={(e) => setLevel(e.currentTarget.id)}
                  >
                    {radio.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </InputGroup.Prepend>
            <FormControl
              placeholder={level==='countries' ? 'Enter a UK country (e.g. England)' : 
                          level==='regions' ? 'Enter a region (e.g. South West)' : 
                          level==='utlas' ? 'Enter an upper tier local authority (e.g. East Sussex)' : 
                          'Enter a lower tier local authority (e.g. Lewes)'}
              aria-label="Recipient's username"
              aria-describedby="basic-addon2"
            />
            <InputGroup.Append>
              <Button id="basic-addon2" variant="primary" onClick={(e) => setPlace(e.currentTarget.parentElement.previousElementSibling.value)}>Get data</Button>
            </InputGroup.Append>
          </InputGroup>
          </Row>
      <Async promiseFn = {covidData} place={plc} lvl={level} watch={plc}>
        {({ data, err, isLoading }) => {
          if (isLoading) return "Loading..."
          if (err) return `Something went wrong: ${err.message}`
          if (data)
            if(typeof data[0] === 'undefined') {
              return 'No data...'
            } else {
            chartData = [];
            chartAxis = [];
            console.log(data);
            data.map(item => {
              chartData.unshift(item.dailyLabConfirmedCases);
              chartAxis.unshift(item.specimenDate);
            });
            data.map(item => {
              countryData.unshift(item.dailyLabConfirmedCases);
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
                  type: 'area',
                  data: chartData
                },
              ],
            };
            return (
              <Row>
              <div id="main">
                <h1>Data for {data[0].areaName}</h1>
                <Chart 
                  options={options.options}
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
