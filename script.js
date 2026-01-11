// מכריח את הפונקציות להיות זמינות ל-HTML
window.syncWeatherReport = syncWeatherReport;
window.handleAddPlant = handleAddPlant;
window.deletePlant = deletePlant;

window.outdoorTemp = 20;
window.indoorTemp = 20;
let plantList = JSON.parse(localStorage.getItem("myPlants")) || [];

// הפעלה בטעינת דף
window.addEventListener("DOMContentLoaded", () => {
  const savedCity = localStorage.getItem("selectedCity");
  if (savedCity) {
    document.getElementById("city-select").value = savedCity;
    syncWeatherReport();
  }
  renderTable();
});

async function syncWeatherReport() {
  const citySelect = document.getElementById("city-select");
  const coords = citySelect.value;
  const display = document.getElementById("weather-report-display");

  if (!coords) return;

  localStorage.setItem("selectedCity", coords);
  display.innerHTML = "📡 Syncing with weather satellites...";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?${coords}&past_days=3&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API Connection Failed");
    const data = await response.json();

    // חישוב ממוצע של 3 ימים אחרונים
    const maxTemps = data.daily.temperature_2m_max.slice(0, 3);
    const minTemps = data.daily.temperature_2m_min.slice(0, 3);
    const avgMax = maxTemps.reduce((a, b) => a + b, 0) / 3;
    const avgMin = minTemps.reduce((a, b) => a + b, 0) / 3;

    window.outdoorTemp = (avgMax + avgMin) / 2;

    // לוגיקה לטמפרטורת פנים (אינדור)
    if (window.outdoorTemp > 25) {
      window.indoorTemp = window.outdoorTemp - 10; // מזגן
    } else {
      window.indoorTemp = window.outdoorTemp + 10; // חימום
    }

    display.innerHTML = `
            <div style="color: #2d5a27; background: #eef9ee; padding: 12px; border-radius: 8px; border: 1px solid #4CAF50;">
                ✅ <b>Sync Complete</b><br>
                Outdoor Avg: ${window.outdoorTemp.toFixed(
                  1
                )}°C | Estimated Indoor: ${window.indoorTemp.toFixed(1)}°C
            </div>
        `;

    document.getElementById("main-app").style.display = "block";
    renderTable();
  } catch (error) {
    console.error("Sync Error:", error);
    display.innerHTML =
      "<div style='color:orange;'>⚠️ Weather service busy. Using seasonal defaults (22°C).</div>";
    window.outdoorTemp = 22;
    window.indoorTemp = 22;
    document.getElementById("main-app").style.display = "block";
    renderTable();
  }
}

function getAIAdvice(name) {
  const n = name.toLowerCase();
  if (
    n.includes("cactus") ||
    n.includes("succulent") ||
    n.includes("snake") ||
    n.includes("aloe")
  )
    return { freq: 14, tip: "Full sun, let soil dry completely." };
  if (
    n.includes("fern") ||
    n.includes("monstera") ||
    n.includes("pothos") ||
    n.includes("lily")
  )
    return { freq: 5, tip: "Indirect light, loves humidity." };
  return { freq: 8, tip: "Standard care, water when top soil is dry." };
}

function handleAddPlant() {
  const name = document.getElementById("plant-name").value;
  const location = document.getElementById("plant-location").value;
  const pot = document.getElementById("pot-size").value;
  const lastDate = document.getElementById("last-watered").value;

  if (!name || !lastDate) {
    alert("Please fill in all fields!");
    return;
  }

  plantList.push({ id: Date.now(), name, location, pot, lastDate });
  localStorage.setItem("myPlants", JSON.stringify(plantList));
  renderTable();
  document.getElementById("plant-name").value = "";
}

function renderTable() {
  const tableBody = document.getElementById("table-body");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  plantList.forEach((plant) => {
    const ai = getAIAdvice(plant.name);
    const activeTemp =
      plant.location === "indoor" ? window.indoorTemp : window.outdoorTemp;

    let finalFreq = ai.freq;
    if (plant.pot === "small") finalFreq -= 2;
    if (plant.pot === "large") finalFreq += 4;

    // השפעת טמפרטורה
    if (activeTemp > 28) finalFreq -= 1;
    if (activeTemp < 15) finalFreq += 2;

    finalFreq = Math.max(1, finalFreq);

    const nextDate = new Date(plant.lastDate);
    nextDate.setDate(nextDate.getDate() + finalFreq);

    const row = tableBody.insertRow();
    row.innerHTML = `
            <td><b>${plant.name}</b><br><small>${plant.location}</small></td>
            <td><small>${ai.tip}</small></td>
            <td>Every ${finalFreq} days<br><small>(at ${activeTemp.toFixed(
      1
    )}°C)</small></td>
            <td style="color:#2d5a27; font-weight:bold;">${nextDate.toLocaleDateString(
              "en-GB"
            )}</td>
            <td><button style="background:#ff4d4d;" onclick="deletePlant(${
              plant.id
            })">Delete</button></td>
        `;
  });
}

function deletePlant(id) {
  plantList = plantList.filter((p) => p.id !== id);
  localStorage.setItem("myPlants", JSON.stringify(plantList));
  renderTable();
}