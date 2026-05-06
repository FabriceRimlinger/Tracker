window.SAMPLE_DATA = [
  { compte: "PEA", isin: "WPEA.PA", libelle: "ISHARES MSCI WORLD SWAP PEA ETF", parts: 7502, pru: 6.14, liquidative: 6.56, prev_close: 6.48 },
  { compte: "PEA", isin: "AI.PA", libelle: "AIR LIQUIDE", parts: 28, pru: 171.33, liquidative: 180.28, prev_close: 179.44 },
  { compte: "PEA", isin: "RS2K.PA", libelle: "AMUNDI IS RUSSELL 2000 ETF-C EUR", parts: 17, pru: 341.23, liquidative: 366.71, prev_close: 363.38 },
  { compte: "PEA", isin: "AWAT.PA", libelle: "AMUNDI PEA EAU (MSCI WATER) ETF", parts: 211, pru: 31.82, liquidative: 31.41, prev_close: 31.11 },
  { compte: "PEA", isin: "EXA1.AS", libelle: "EURO STOXX Banks", parts: 200, pru: 17.00, liquidative: 17.59, prev_close: 16.92 },
  { compte: "CTO", isin: "ABEC.SG", libelle: "Alphabet (C)", parts: 11.47, pru: 305.29, liquidative: 336.30, prev_close: 328.25 },
  { compte: "CTO", isin: "SGO.PA", libelle: "Saint-Gobain", parts: 102.99, pru: 72.83, liquidative: 80.24, prev_close: 75.92 },
  { compte: "CTO", isin: "DG.PA", libelle: "Vinci", parts: 19.15, pru: 130.50, liquidative: 133.50, prev_close: 129.05 },
  { compte: "CTO", isin: "SNW.SG", libelle: "Sanofi", parts: 12.06, pru: 83.03, liquidative: 74.92, prev_close: 74.86 },
  { compte: "CTO", isin: "CAP.PA", libelle: "Capgemini", parts: 32.91, pru: 106.38, liquidative: 104.95, prev_close: 105.45 },
  { compte: "A. Vie", isin: "Y9U6.F", libelle: "CARMIGNAC PATRIMOINE A", parts: 9.45, pru: 792.64, liquidative: 812.00, prev_close: 812.00 },
  { compte: "A. Vie", isin: "0P000018HU.F", libelle: "CARMIGNAC INVEST LATITUDE", parts: 20.84, pru: 417.83, liquidative: 425.84, prev_close: 420.29 },
  { compte: "AMZ RSU", isin: "AMZN", libelle: "AMAZON TRANSATLANTIQUE", parts: 1920, pru: 37.73, liquidative: 234.94, prev_close: 232.68 },
];

window.CATEGORIES = [
  { name: "CTO",     color: "#b97a00" },
  { name: "PEA",     color: "#1f9d55" },
  { name: "A. Vie",  color: "#2563a6" },
  { name: "AMZ RSU", color: "#8b5cf6" },
];

window.MARKETS = [
  { label: "EUR/USD",    value: 1.0892,  change:  0.0012, changePct:  0.11 },
  { label: "S&P 500",    value: 5612.4,  change: -12.30,  changePct: -0.22 },
  { label: "Nasdaq 100", value: 19842.1, change:  38.60,  changePct:  0.19 },
  { label: "CAC 40",     value: 7952.0,  change:  66.10,  changePct:  0.84 },
  { label: "Hang Seng",  value: 17420.5, change: -85.20,  changePct: -0.49 },
];

window.fmt  = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
window.fmt0 = (n) => Math.round(n || 0).toLocaleString('fr-FR');
window.absFmt  = (n) => Math.abs(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
window.absFmt0 = (n) => Math.abs(Math.round(n || 0)).toLocaleString('fr-FR');
window.signStr = (v) => v >= 0 ? '+' : '−';
