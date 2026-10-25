/**
 * Elegant Photographic Mountain Weather App Logic - Local Computer Assets Engine
 */

const appState = {
  rawPayload: null,
  isCelsiusSystem: true,
  queryLocation: 'Calgary'
};

/**
 * 🏠 LOCAL IMAGE THEME CONFIGURATION DICTIONARY MAP
 * Points directly to the images folder sitting inside your project directory.
 */
const weatherThemesConfig = {
  sunny: {
    imagePath: "./images/sunny.jpg",
    mountainColorClass: "text-amber-950/40",
    icon: "fa6-solid:circle"
  },
  rainy: {
    imagePath: "./images/rainy.jpg",
    mountainColorClass: "text-indigo-950/50",
    icon: "fa6-solid:cloud-showers-heavy"
  },
  cloudy: {
    imagePath: "./images/cloudy.jpg",
    mountainColorClass: "text-slate-900/50",
    icon: "fa6-solid:cloud"
  },
  snowy: {
    imagePath: "./images/snowy.jpg",
    mountainColorClass: "text-blue-950/40",
    icon: "fa6-solid:snowflake"
  },
  default: {
    imagePath: "./images/default.jpg",
    mountainColorClass: "text-slate-950/40",
    icon: "fa6-solid:circle"
  }
};

function getThemeKey(conditionText) {
  const normText = conditionText.toLowerCase();
  
  if (normText.includes('sunny') || normText.includes('clear')) return 'sunny';
  if (normText.includes('rain') || normText.includes('drizzle') || normText.includes('shower') || normText.includes('thunderstorm')) return 'rainy';
  if (normText.includes('cloudy') || normText.includes('overcast') || normText.includes('mist') || normText.includes('fog')) return 'cloudy';
  if (normText.includes('snow') || normText.includes('flurry') || normText.includes('ice') || normText.includes('sleet')) return 'snowy';
  
  return 'default';
}

function applyThematicInterfaceStyles(conditionText) {
  const cardElement = document.getElementById('weather-card');
  const mountainGraphics = document.getElementById('mountain-element');
  
  const activeKey = getThemeKey(conditionText);
  const activeTheme = weatherThemesConfig[activeKey];
  
  // Inject local custom paths cleanly into standard inline style rules
  cardElement.style.backgroundImage = `url('${activeTheme.imagePath}')`;
  mountainGraphics.className = `mountain-bg ${activeTheme.mountainColorClass}`;
}

function assignWeatherSymbol(conditionText) {
  const activeKey = getThemeKey(conditionText);
  return weatherThemesConfig[activeKey].icon;
}

function evaluateScaleMetric(celsiusRawVal, appendUnitSymbol = true) {
  const cleanInteger = parseInt(celsiusRawVal, 10);
  const processedValue = appState.isCelsiusSystem ? cleanInteger : Math.round((cleanInteger * 9) / 5 + 32);
  return appendUnitSymbol ? `${processedValue}°` : processedValue;
}

function transformToDayName(dateString) {
  const formatReference = new Date(dateString + 'T00:00:00');
  return formatReference.toLocaleDateString('en-CA', { 
    weekday: 'long', 
    timeZone: 'America/Edmonton' 
  });
}

async function triggerWeatherSyncFetch(locationTarget) {
  const apiEndpointUrl = `https://wttr.in{encodeURIComponent(locationTarget)}?format=j1`;
  const DOMErrorBox = document.getElementById('error-message');
  
  try {
    DOMErrorBox.classList.add('hidden');
    const responseStream = await fetch(apiEndpointUrl);
    if (!responseStream.ok) throw new Error(`Handshake failure: ${responseStream.status}`);
    
    appState.rawPayload = await responseStream.json();
    executeDOMWidgetRender();
  } catch (err) {
    console.error(err);
    DOMErrorBox.classList.remove('hidden');
    document.getElementById('location-heading').innerText = 'Data Offline';
  }
}

function executeDOMWidgetRender() {
  const dataEngine = appState.rawPayload;
  if (!dataEngine) return;

  const areaInformationNode = dataEngine.nearest_area;
  document.getElementById('location-heading').innerText = `${areaInformationNode.areaName.value}, ${areaInformationNode.region.value}`;

  const activeMetricsNow = dataEngine.current_condition;
  const currentAtmosphereText = activeMetricsNow.weatherDesc.value;
  
  applyThematicInterfaceStyles(currentAtmosphereText);
  
  document.getElementById('current-condition').innerText = currentAtmosphereText;
  document.getElementById('current-temp').innerText = evaluateScaleMetric(activeMetricsNow.temp_C);
  
  const iconTargetNodeContainer = document.getElementById('current-icon-container');
  iconTargetNodeContainer.innerHTML = `<iconify-icon icon="${assignWeatherSymbol(currentAtmosphereText)}"></iconify-icon>`;
  
  const mainTodayCardItem = document.getElementById('weather-card');
  mainTodayCardItem.classList.remove('opacity-0', 'scale-95');

  const DOMGridRootContainer = document.getElementById('forecast-grid');
  DOMGridRootContainer.innerHTML = '';

  const structuralThreeDaySegment = dataEngine.weather.filter((_, calendarIndex) => calendarIndex < 3);

  const generatedDOMCardCollection = structuralThreeDaySegment.map((dayItemInstance) => {
    const specificDayWeatherText = dayItemInstance.hourly.weatherDesc.value; 
    const dynamicHTMLCardNode = document.createElement('div');
    
    dynamicHTMLCardNode.className = "flex justify-between items-center text-sm font-semibold text-white/95 py-1.5 drop-shadow";
    dynamicHTMLCardNode.innerHTML = `
      <span class="w-1/3 text-left tracking-wide">${transformToDayName(dayItemInstance.date)}</span>
      <span class="w-1/3 text-center capitalize text-xs tracking-wider text-white/80 font-normal">${specificDayWeatherText}</span>
      <span class="w-1/3 text-right tracking-tighter">${evaluateScaleMetric(dayItemInstance.maxtempC)}</span>
    `;

    return dynamicHTMLCardNode;
  });

  generatedDOMCardCollection.forEach(compiledDOMNode => {
    DOMGridRootContainer.appendChild(compiledDOMNode);
  });
}

document.getElementById('unit-toggle').addEventListener('click', () => {
  appState.isCelsiusSystem = !appState.isCelsiusSystem;
  document.getElementById('unit-toggle').innerHTML = `<span>Switch to &deg;${appState.isCelsiusSystem ? 'F' : 'C'}</span>`;
  executeDOMWidgetRender();
});

document.addEventListener('DOMContentLoaded', () => {
  triggerWeatherSyncFetch(appState.queryLocation);
});
