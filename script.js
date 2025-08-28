const API_KEY = "5059e5cf65004d6f06c40d002e7f0229"; 

const weatherContainer = document.getElementById("weatherContainer");
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const loadingDiv = document.getElementById("loading");
const favoritesDiv = document.getElementById("favorites");
const favEmpty = document.getElementById("favEmpty");
const resEmpty = document.getElementById("resEmpty");
const darkModeToggle = document.getElementById("darkModeToggle");
const cardTemplate = document.getElementById("cardTemplate");
const toastContainer = document.getElementById("toastContainer");
const myLocationContainer = document.getElementById("myLocationContainer");
const myLocationEmpty = document.getElementById("myLocationEmpty");

function showToast(message, type = "error") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}-toast`;
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let dark = localStorage.getItem("darkMode") === "true";

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function setEmptyStates() {
  myLocationEmpty.style.display = myLocationContainer.children.length ? "none" : "grid";
  favEmpty.style.display = favoritesDiv.children.length ? "none" : "grid";
  resEmpty.style.display = weatherContainer.children.length ? "none" : "grid";
}

function toTitle(s = "") {
  return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

function pickThreeDays(forecastList) {
  const byDate = forecastList.reduce((acc, item) => {
    const d = item.dt_txt.split(" ")[0]; 
    (acc[d] ||= []).push(item);
    return acc;
  }, {});
  const today = new Date().toISOString().slice(0,10);
  const days = Object.keys(byDate).filter(d => d >= today).slice(0, 4); 

  const result = [];
  for (const d of days) {
    const targetHour = 12;
    const best = byDate[d].reduce((best, cur) => {
      const hour = new Date(cur.dt_txt).getHours();
      const diff = Math.abs(hour - targetHour);
      return !best || diff < best.diff ? { item: cur, diff } : best;
    }, null);
    if (best) result.push(best.item);
    if (result.length === 3) break;
  }
  return result;
}

function kelvinToC(k) { return Math.round((k - 273.15) * 10) / 10; }

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getCurrentByCity(city) {
  return fetchJSON(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
}
async function getForecastByCity(city) {
  return fetchJSON(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
}
async function getCurrentByCoords(lat, lon) {
  return fetchJSON(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
}
async function getForecastByCoords(lat, lon) {
  return fetchJSON(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
}

function renderCard({ current, forecast, isFavorite }) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);

  const city = current.name || "Your Location";
  const country = current.sys?.country || "";
  const temp = Math.round(current.main?.temp);
  const feels = Math.round(current.main?.feels_like);
  const hum = current.main?.humidity;
  const wind = current.wind?.speed;
  const icon = current.weather?.[0]?.icon;
  const desc = toTitle(current.weather?.[0]?.description || "");

  node.querySelector(".city-name").textContent = city;
  node.querySelector(".country-code").textContent = country;
  node.querySelector(".temp-now").textContent = `${temp}°C`;
  node.querySelector(".desc-text").textContent = desc;
  node.querySelector(".icon-now").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  node.querySelector(".icon-now").alt = desc || "weather icon";
  node.querySelector(".feels-like").textContent = `Feels like ${feels}°C`;
  node.querySelector(".humidity").textContent = `Humidity ${hum}%`;
  node.querySelector(".wind").textContent = `Wind ${wind} m/s`;


function showToast(message, type = "error") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}-toast`;
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

  const forecastWrap = node.querySelector(".forecast");
  forecastWrap.innerHTML = "";
  const days = pickThreeDays(forecast.list || []);
  days.forEach(d => {
    const dEl = document.createElement("div");
    dEl.className = "day";
    const date = new Date(d.dt_txt);
    const label = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    dEl.innerHTML = `
      <div class="date">${label}</div>
      <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" alt="${d.weather[0].description}">
      <div class="t">${Math.round(d.main.temp)}°C</div>
    `;
    forecastWrap.appendChild(dEl);
  });

  const addBtn = node.querySelector(".favorite-btn");
  const removeBtn = node.querySelector(".remove-fav-btn");

  if (isFavorite) {
    addBtn.classList.add("hidden");
    removeBtn.classList.remove("hidden");
  }

  addBtn.addEventListener("click", () => addFavorite(city));
  removeBtn.addEventListener("click", () => removeFavorite(city));

  return node;
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}
function addFavorite(city) {
  if (!favorites.includes(city)) {
    favorites.push(city);
    saveFavorites();
    loadFavorites();
    showToast(`✅ Added ${toTitle(city)} to favorites!`, "success");
  }
}
function removeFavorite(city) {
  favorites = favorites.filter(c => c !== city);
  saveFavorites();
  loadFavorites();
  showToast(`🗑️ Removed ${toTitle(city)} from favorites.`, "success");
}

async function loadFavorites() {
  favoritesDiv.innerHTML = "";
  if (!favorites.length) setEmptyStates();

  for (const city of favorites) {
    try {
      const [current, forecast] = await Promise.all([
        getCurrentByCity(city),
        getForecastByCity(city)
      ]);
      const card = renderCard({ current, forecast, isFavorite: true });
      favoritesDiv.appendChild(card);
    } catch {
     
    }
  }
  setEmptyStates();
}

async function searchCity(city) {
  show(loadingDiv);
  try {
    const [current, forecast] = await Promise.all([
      getCurrentByCity(city),
      getForecastByCity(city)
    ]);
    resEmpty.style.display = "none";

    const card = renderCard({ current, forecast, isFavorite: false });
    weatherContainer.prepend(card);
  } catch (e) {
    showToast("❌ City not found.");
  } finally {
    hide(loadingDiv);
    setEmptyStates();
  }
}

async function loadMyLocation() {
  if (!navigator.geolocation) return;

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      show(loadingDiv);
      try {
        const [current, forecast] = await Promise.all([
          getCurrentByCoords(latitude, longitude),
          getForecastByCoords(latitude, longitude)
        ]);
        myLocationEmpty.style.display = "none";
        const card = renderCard({ current, forecast, isFavorite: false });
        myLocationContainer.prepend(card);
      } catch {
      } finally {
        hide(loadingDiv);
        setEmptyStates();
        resolve();
      }
    }, () => resolve());
  });
}

function applyDarkMode() {
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("darkMode", dark ? "true" : "false");
}
darkModeToggle.addEventListener("click", () => {
  dark = !dark;
  applyDarkMode();
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) { searchCity(city); cityInput.value = ""; cityInput.focus(); }
});
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) { searchCity(city); cityInput.value = ""; }
  }
});

(async function init() {

  applyDarkMode();

  await loadFavorites();

  await loadMyLocation();

  setEmptyStates();
})();