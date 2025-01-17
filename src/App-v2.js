import React from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: "LISBON",
      isLoading: false,
      weater: {},
      disPlayLoction: " ",
    };
    this.fetchWeater = this.fetchWeater.bind(this);
  }

  async fetchWeater() {
    try {
      this.setState({ isLoading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({
        disPlayLoction: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weater: weatherData.daily });
    } catch (err) {
      console.err(err);
    } finally {
      this.setState({ isLoading: false });
    }
  }
  componentDidMount() {
    this.fetchWeater();
  }

  render() {
    return (
      <div>
        <h1>Classy weater</h1>
        <div>
          <input
            type="text"
            placeholder="Search from location..."
            value={this.state.location}
            onChange={(e) =>
              this.setState({
                location: e.target.value,
              })
            }
          />
        </div>
        <button onClick={this.fetchWeater}>obtenir </button>
        {this.state.isLoading && <p className="loader">Loading...</p>}
        {this.state.weater.weathercode && (
          <Weather
            location={this.state.disPlayLoction}
            weater={this.state.weater}
          />
        )}
      </div>
    );
  }
}
export default App;

class Weather extends React.Component {
  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: dates,
      weathercode: codes,
    } = this.props.weater;
    console.log(this.props);
    return (
      <div>
        <h2>Weater {this.props.location} </h2>
        {dates.map((date, i) => (
          <Date
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            dates={dates.at(i)}
            codes={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </div>
    );
  }
}

class Date extends React.Component {
  render() {
    const { max, min, dates, codes, isToday } = this.props;
    return (
      <li className="day">
        <span>{getWeatherIcon(codes)}</span>
        <p>{isToday ? "To day" : dates}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong> {Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    );
  }
}
