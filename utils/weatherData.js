const axios = require('axios'); //this is the package in order to connect to the third party API which is OPRNweatherAPI
// this an object for the API openWeatherapp and then use it with function
const openWeatherMap = {
    BASE_URL:"https://api.openweathermap.org/data/2.5/",
    SECRET_KEY:"d58de4aafd408692e58cb71de0b35938",
}

// function to get the weather forecast for specific time 
function getWeatherByperiod(forecastList){
    const periods ={
        morning: {start:0, end:12, data: []},
        afternoon: {start:12, end: 18, data: []},
        evening: {start:18, end:24, data:[]},
    };
    forecastList.forEach(item => {
        const hour = new Date(item.dt * 1000).getHours(); // convert mba ho readable by human
        // miverifier raha ao anatin  morning period (06:00 - 11:59)
        if (hour >= periods.morning.start && hour < periods.morning.end) {
            periods.morning.data.push(item);
        } // miverifier raha ao anatin afternoon
        else if (hour >= periods.afternoon.start && hour < periods.afternoon.end) {
            periods.afternoon.data.push(item);
        } // miverify if it is within the evening as described above
        else if (hour >= periods.evening.start && hour < periods.evening.end) {
            periods.evening.data.push(item);
        }
    });


    // ny function getAVERAGE dia maka ny tombany ilay weather data na temp na description, manao arrondissement
    const getAverageData = (data) => {
        if (data.length === 0) return null;
         // ity manao ny arrondissement ny temperature no mamadika ho celsius
         // ilay reduce method eto manambatra ny temp azo dia ny item.main.temp mahazo azy en kelvin dia aadika celsius
        const avgTemp = Math.round(data.reduce((sum, item) => sum + item.main.temp - 273.15, 0) / data.length);
        
        // micalcul frequence an description 
        //The reduce method creates an object (acc) where the keys are weather descriptions and the values are their frequencies.
        const descriptions = data.reduce((acc, item) => {
            const desc = item.weather[0].description;
            acc[desc] = (acc[desc] || 0) + 1;
            return acc;
        }, {});
        // mijery ny most frequent description
        const description = Object.keys(descriptions).reduce((a, b) => descriptions[a] > descriptions[b] ? a : b);

        return {
            temp: avgTemp,
            description
        };
    };
     return {
        morning: getAverageData(periods.morning.data),
        afternoon: getAverageData(periods.afternoon.data),
        evening: getAverageData(periods.evening.data),
    };
}



// Helper function to aggregate forecast data into daily summaries: ilay weather data be dia be avy any am API ataony en resumee
function aggregateDailyForecast(forecastList) {
    const dailyData = {};
     // manao parcours ny prevision metorologique
    forecastList.forEach(item => {
        //// Obtenir la date à partir du timestamp de l'élément et la formater en format court (jour, mois, année)
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'numeric' });
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                descriptions: {},
            };
        }

        // Collect temperature data
        dailyData[date].temps.push(item.main.temp - 273.15);

        // Collect description frequency data
        const description = item.weather[0].description;
        if (!dailyData[date].descriptions[description]) {
            dailyData[date].descriptions[description] = 0;
        }
        dailyData[date].descriptions[description]++;
    });
    // Create an array for the daily forecast
    const dailyForecast = Object.keys(dailyData).map(date => {
        const temps = dailyData[date].temps;
        const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);

        const descriptions = dailyData[date].descriptions;
        const mostFrequentDescription = Object.keys(descriptions).reduce((a, b) => descriptions[a] > descriptions[b] ? a : b);

        return {
            date, // date du resume 
            temp: avgTemp, // temperature moyenne de la journee
            description: mostFrequentDescription // description meteorologique plus frequente
        };
    });

    return dailyForecast;
}


const weatherData = async (address, callback) =>{
    //const url = openWeatherMap.BASE_URL + // url endpoint anlay API
    //encodeURIComponent(address)+ "&APPID=" + 
    //openWeatherMap.SECRET_KEY; //ity maka ny addresse sy ny key anlay API miankina am addreese ny data mivoaka

    const currentWeatherUrl = `${openWeatherMap.BASE_URL}weather?q=${encodeURIComponent(address)}&APPID=${openWeatherMap.SECRET_KEY}`;
    const forecastWeatherUrl = `${openWeatherMap.BASE_URL}forecast?q=${encodeURIComponent(address)}&APPID=${openWeatherMap.SECRET_KEY}`;

    console.log(currentWeatherUrl);
    console.log(forecastWeatherUrl);



    //console.log(url); // this is just to verify if i get the right url above
    // manao request any am API, raha misy error dia miverina indray. rha tsy misy avoaka ilay json anlay weather
    
   
    try {
        const currentWeatherResponse = await axios.get(currentWeatherUrl);
        const forecastWeatherResponse = await axios.get(forecastWeatherUrl);

        const currentWeather = currentWeatherResponse.data;
        const forecastWeather = forecastWeatherResponse.data;

        const periodsForecast = getWeatherByperiod(forecastWeather.list);
        const dailyForecast = aggregateDailyForecast(forecastWeather.list);

        const weatherData = {
            city: currentWeather.name,
            current: { // ity weather amzao
                temp: Math.round(currentWeather.main.temp - 273.15), // temperature
                description: currentWeather.weather[0].description, // description anlay weather amzao
                humidity: currentWeather.main.humidity, // humidity
                wind: currentWeather.wind.speed,// wind
                precipitation: currentWeather.rain ? currentWeather.rain['1h'] : 0 //precipitation
            },
            nextPeriods: periodsForecast,  // Prévisions par périodes (matin, après-midi, soir)
            next5Days: dailyForecast.slice(0, 5) // prevision du 5 jours 
        };
        callback(false, weatherData);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        callback(true, "Unable to fetch data, please try again: " + error.message);
    }
};

module.exports = weatherData; //module.exports is a special object which is used to expose functions, objects, or values from a module so they can be used in other files within your project. 