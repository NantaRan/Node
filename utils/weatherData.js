
const request = require('request') //this is the package in order to connect to the third party API which is OPRNweatherAPI
// this an object for the API openWeatherapp and then use it with function
const openWeatherMap = {
    BASE_URL:"https://api.openweathermap.org/data/2.5/",
    SECRET_KEY:"d58de4aafd408692e58cb71de0b35938",
}

const weatherData = (address, callback) =>{
    //const url = openWeatherMap.BASE_URL + // url endpoint anlay API
    //encodeURIComponent(address)+ "&APPID=" + 
    //openWeatherMap.SECRET_KEY; //ity maka ny addresse sy ny key anlay API miankina am addreese ny data mivoaka

    const currentWeatherUrl = `${openWeatherMap.BASE_URL}weather?q=${encodeURIComponent(address)}&APPID=${openWeatherMap.SECRET_KEY}`;
    const forecastWeatherUrl = `${openWeatherMap.BASE_URL}forecast?q=${encodeURIComponent(address)}&APPID=${openWeatherMap.SECRET_KEY}`;

    console.log(currentWeatherUrl);
    console.log(forecastWeatherUrl);



    //console.log(url); // this is just to verify if i get the right url above
    // manao request any am API, raha misy error dia miverina indray. rha tsy misy avoaka ilay json anlay weather
    // maka ny weather amzao:
    request({ url:currentWeatherUrl, json: true }, (error, response) => {
        if (error) {
            console.error("Error fetching current weather:", error);
            callback(true, "Unable to fetch data, please try again: " + error);
            return;
        }

        const currentWeather = response.body;

    // maka ny weather ho avy:
        request({url:forecastWeatherUrl, json: true}, (error, response) =>  { 
            if (error) {
                console.error("Error fetching forecast weather:", error);
                callback(true, "Unable to fetch data, please try again: " + error);
                return;
            }

            const forecastWeather = response.body;
        

    // and here we need to combine the  two URL mba ahafany maka url tokana
            const weatherData = {
                  city: currentWeather.name,
                       current: {
                       temp: Math.round(currentWeather.main.temp - 273.15),
                       description: currentWeather.weather[0].description,
                       humidity: currentWeather.main.humidity,
                       wind: currentWeather.wind.speed,
                       precipitation: currentWeather.rain ? currentWeather.rain['1h'] : 0
                },
                  forecast: forecastWeather.list.slice(0, 7).map(item => ({
                  date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'numeric' }),
                  temp: Math.round(item.main.temp - 273.15),
                  description: item.weather[0].description
                }))
            };
            callback(false, weatherData);
        });

    });

 };

module.exports = weatherData; //module.exports is a special object which is used to expose functions, objects, or values from a module so they can be used in other files within your project. 