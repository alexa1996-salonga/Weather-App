/**
 * Photographic Weather App Logic - Local Computer Assets Engine
 * Architecture Scope: Open-Meteo High-Availability API Implementation
 */

const appState = {
  rawPayload: null as any,
  isCelsiusSystem: true,
  queryLocation: 'Calgary'
};

const weatherBackground = {
  sunny: {
    imagePath: "./images/sunny.png",  
    icon: "ep:sunny",                    
    towerColorClass: "text-amber-950/40",
    textLabel: "Sunny"
  },
  rainy: {
    imagePath: "./images/rainy.png",
    icon: "famicons:rainy-outline",         
    towerColorClass: "text-indigo-950/50",
    textLabel: "Rain"
  },
  cloudy: {
    imagePath: "./images/cloudy.png",
    icon: "carbon:mostly-cloudy",                        
    towerColorClass: "text-slate-900/50",
    textLabel: "Cloudy"
  },
  snowy: {
    imagePath: "./images/snowy.png",
    icon: "material-symbols-light:weather-snowy-outline",                         
    towerColorClass: "text-blue-950/40",
    textLabel: "Snow"
  },
  default: {
    imagePath: "./images/tower.png",
    icon: "akar-icons:cloud",                    
    towerColorClass: "text-slate-950/40",
    textLabel: "Cloudy"
  }
};


/**
 * Open-Meteo WMO Weather Code Interpreter Dictionary
 * Utilizes JavaScript Switch statements to route numeric tracking codes cleanly
 */
function interpretWmoCode(code:any): string {
  switch (code) {
    case 0:
    case 1:
      return "Sunny";
    case 2:
      return "Partly Cloudy";
    case 3:
      return "Cloudy";
    case 45:
    case 48:
      return "Mist";
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return "Rain";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "Snow";
    case 95:
    case 96:
    case 97:
      return "Thunderstorm";
    default:
      return "Cloudy";
  }
}

function getThemeKey(conditionText: string): string {
  const normText = conditionText.toLowerCase();
  
  if (normText.includes('sunny') || normText.includes('clear')) return 'sunny';
  if (normText.includes('rain') || normText.includes('drizzle') || normText.includes('shower') || normText.includes('thunderstorm')) return 'rainy';
  if (normText.includes('cloudy') || normText.includes('overcast') || normText.includes('mist') || normText.includes('fog')) return 'cloudy';
  if (normText.includes('snow') || normText.includes('flurry') || normText.includes('ice') || normText.includes('sleet')) return 'snowy';
  
  return 'default';
}

function assignWeatherSymbol(conditionText: string) {
  const activeKey = getThemeKey(conditionText);
  return weatherBackground[activeKey].icon;
}

function applyThematicInterfaceStyles(conditionText: string) {
  const cardElement: any = document.getElementById('weather-card');
  const towerGraphics: any = document.getElementById('tower-element');
  
  const activeKey = getThemeKey(conditionText);
  const activeTheme = weatherBackground[activeKey];
  
  // Re-add optional chaining for safety
  if (cardElement) {
    cardElement.style.backgroundImage = `url('${activeTheme.imagePath}')`;
    cardElement.className = cardElement.className.replace(/bg-gradient\S+|from-\S+|to-\S+|bg-\[\S+\]/g, '').trim();
  }
  if (towerGraphics) {
    towerGraphics.className = `tower-bg ${activeTheme.towerColorClass}`;
  }
}

function executeDOMWidgetRender() {
  const dataEngine = appState.rawPayload;
  if (!dataEngine) return;

  // Added optional chaining protections safely back to direct element manipulation
  const locationHeadingElement = document.getElementById('location-heading');
  if (locationHeadingElement) locationHeadingElement.innerText = "Calgary, Alberta";

  const currentConditionText = interpretWmoCode(dataEngine.current.weather_code);
  applyThematicInterfaceStyles(currentConditionText);
  
  const currentConditionElement = document.getElementById('current-condition');
  if (currentConditionElement) currentConditionElement.innerText = currentConditionText;

  const currentTempElement = document.getElementById('current-temp');
  if (currentTempElement) currentTempElement.innerText = evaluateScaleMetric(dataEngine.current.temperature_2m);
  
  const iconTargetNodeContainer = document.getElementById('current-icon-container');
  if (iconTargetNodeContainer) {
    iconTargetNodeContainer.innerHTML = `
      <iconify-icon 
          icon="${assignWeatherSymbol(currentConditionText)}"
          class="text-[100px] text-white">
        </iconify-icon>
    `;
  }

  const mainTodayCardItem = document.getElementById('weather-card');
  mainTodayCardItem?.classList.remove('opacity-0', 'scale-95');

  const DOMGridRootContainer = document.getElementById('forecast-grid');
  if (!DOMGridRootContainer) return;
  DOMGridRootContainer.innerHTML = '';

  const dailyTimeline = dataEngine.daily.time; 
  const structuralThreeDaySegment = dailyTimeline.filter((_, calendarIndex) => calendarIndex < 3);

  const generatedDOMCardCollection = structuralThreeDaySegment.map((dateString, runtimeIndex) => {
    const dayWmoCode = dataEngine.daily.weather_code[runtimeIndex];
    const specificDayWeatherText = interpretWmoCode(dayWmoCode);
    const maxTempC = dataEngine.daily.temperature_2m_max[runtimeIndex];

    const dynamicHTMLCardNode = document.createElement('div');
    dynamicHTMLCardNode.className = "flex justify-between items-center text-sm font-semibold text-white/95 py-1.5 drop-shadow";
    dynamicHTMLCardNode.innerHTML = `
      <span class="w-1/3 text-left tracking-wide">${transformToDayName(dateString)}</span>
      <span class="w-1/3 text-center capitalize text-xs tracking-wider text-white/80 font-normal">${specificDayWeatherText}</span>
      <span class="w-1/3 text-right tracking-tighter">${evaluateScaleMetric(maxTempC)}</span>
    `;
    return dynamicHTMLCardNode;
  });

  generatedDOMCardCollection.forEach(compiledDOMNode => {
    DOMGridRootContainer.appendChild(compiledDOMNode);
  });
}

// Added an operational fallback check for the unit toggle listener activation
const unitToggleButton = document.getElementById('unit-toggle');
if (unitToggleButton) {
  unitToggleButton.addEventListener('click', () => {
    appState.isCelsiusSystem = !appState.isCelsiusSystem;
    unitToggleButton.innerHTML = `<span>Switch to &deg;${appState.isCelsiusSystem ? 'F' : 'C'}</span>`;
    executeDOMWidgetRender();
  });
}
