import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
const formatDate = (datestr) => {
  const date = new Date(datestr);
  // condition d'arret pour eviter la recursition infini
  if (datestr instanceof Date) {
    return formatDate(date, "EEE", { locale: fr });
  }
  return formatDate(new Date(datestr));
};
function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
class App extends React.Component {
  state = {
    location: "",
    isLoading: false,
    weater: {},
    disPlayLoction: " ",
  };
  // constructor(props) {
  //   super(props);
  //   this.fetchWeater = this.fetchWeater.bind(this);
  // }

  // async fetchWeater() {
  fetchWeater = async () => {
    if (this.state.location.length < 2) return this.setState({ weater: {} });
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
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  setOnChange = (e) => this.setState({ location: e.target.value });
  // useEffect []
  componentDidMount() {
    // this.fetchWeater();

    this.setState({ location: localStorage.getItem("location") || "" });
  }
  //  useEffect [location]
  componentDidUpdate(prevProps, prevState) {
    if (this.state.location !== prevState.location) {
      this.fetchWeater();
      localStorage.setItem("location", this.state.location);
    }
  }

  render() {
    return (
      <div className="app">
        <h1> Une meteo classique {}</h1>
        <Input location={this.state.location} setOnChange={this.setOnChange} />
        {this.state.isLoading && <p className="loader">Chargement...</p>}
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

class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search from location..."
          value={this.props.location}
          onChange={this.props.setOnChange}
        />
      </div>
    );
  }
}
class Weather extends React.Component {
  componentWillUnmount() {
    console.log("weather will unmount");
  }
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
        <h2>Meteo {this.props.location} </h2>
        <ul className="weather">
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
        </ul>
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
        <p>{isToday ? "Aujourd'huit" : dates}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong> {Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    );
  }
}
