const { ipcRenderer } = require("electron");
const Binance = require("node-binance-api");
const { Notification } = require('electron');

const binance = new Binance().options({
  APIKEY: "API_KEY",
  APISECRET: "API_SECRET",
  family: 4, // IPv4 DNS hatalarını önlemek için
});

let topCoins = [];
let coinDetails = {};
let userThresholds = {}; // Kullanıcı eşiklerini saklayan obje

// 🔹 Bildirim gönderme fonksiyonu
const sendNotification = (title, body) => {
  ipcRenderer.send("send-notification", { title, body });
};

// 🔹 En popüler 20 coini çekme
const fetchTopCoins = async () => {
  try {
    const tickers = await binance.prevDay(false);
    topCoins = tickers
      .filter((t) => t.symbol.endsWith("USDT"))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map((t) => t.symbol);

    console.log("Top 20 Coins:", topCoins);

    const exchangeInfo = await binance.exchangeInfo();
    exchangeInfo.symbols.forEach((symbol) => {
      if (topCoins.includes(symbol.symbol)) {
        coinDetails[symbol.symbol] = { name: symbol.baseAsset };
      }
    });
  } catch (error) {
    console.error("En popüler coinleri alırken hata oluştu:", error);
  }
};

// 🔹 Kullanıcının eşik değerini kaydetme
handleButtonClick = (coin) => {
  let inputElement = document.querySelector(`#input-${coin}`);
  const inputValue = parseFloat(inputElement.value);

  if (!isNaN(inputValue)) {
    userThresholds[coin] = inputValue;
    sendNotification(`Hedef Değer : $${inputValue}`,
      `${coinDetails[coin]?.name} için hedef değer kaydedildi`);
  } else {
    sendNotification(`Hatalı Giriş`,
       `Hedef değer boş bırakılamaz!`);
  }
};

// 🔹 Eşik değerini aşan coinler için bildirim gönderme
const checkPriceAlerts = (coinPrices) => {
  Object.keys(userThresholds).forEach((coin) => {
    const threshold = userThresholds[coin];
    const price = parseFloat(coinPrices[coin]);

    if (!isNaN(price) && price >= threshold) {
      sendNotification(`${coinDetails[coin]?.name} Alev Aldı`, `${coinDetails[coin]?.name} fiyatı hedefe ulaştı!`);
      delete userThresholds[coin];// Bildirim gönderildikten sonra eşik silinsin
      const inputElement = document.querySelector(`#input-${coin}`);
      if (inputElement) {
        inputElement.value = "";
      }
    }
  });
};

// 🔹 Kripto fiyatlarını çekme ve tabloyu güncelleme
const getCryptoData = async () => {
  try {
    const coinPrices = await binance.prices();
    const tableBody = document.querySelector("#coinTable tbody");

    topCoins.forEach((coin) => {
      const price = parseFloat(coinPrices[coin]);
      let ondalik = price > 100 ? 2 : price < 0.1 ? 7 : 4;

      let row = document.querySelector(`#row-${coin}`);
      if (!row) {
        row = document.createElement("tr");
        row.id = `row-${coin}`;
        row.innerHTML = `
          <td>${coinDetails[coin]?.name || coin}</td>
          <td id="price-${coin}">$${price.toFixed(ondalik)}</td>
          <td>
            <input type="text" id="input-${coin}" placeholder="Hedef Belirle">
            <button onclick="handleButtonClick('${coin}')">Kaydet</button>
          </td>
        `;
        tableBody.appendChild(row);
      } else {
        document.querySelector(`#price-${coin}`).innerText = `$${price.toFixed(ondalik)}`;
      }
    });

    checkPriceAlerts(coinPrices);
  } catch (error) {
    console.error("Veri çekme hatası:", error);
  }
};

// 🔹 Uygulamayı başlatma
const init = async () => {
  await fetchTopCoins();
  await getCryptoData();
  setInterval(getCryptoData, 2000);
};

init();
