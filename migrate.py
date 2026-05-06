import json
import re
import os

# Vos données de secours (Dernière version connue)
BACKUP_DATA = [
  { "compte": "CTO", "isin": "PPFB.SG", "libelle": "Physical Gold USD (Acc)", "parts": 281.34, "pru": 70.67, "liquidative": 81.54 },
  { "compte": "CTO", "isin": "GBSE.PA", "libelle": "Physical Gold Hedged EUR", "parts": 358.05, "pru": 21.6, "liquidative": 26.41 },
  { "compte": "CTO", "isin": "VIE.PA", "libelle": "Veolia Environnement", "parts": 135, "pru": 31.78, "liquidative": 34.06 },
  { "compte": "CTO", "isin": "GOOGL", "libelle": "Alphabet (C)", "parts": 15, "pru": 235.42, "liquidative": 257.94 },
  { "compte": "CTO", "isin": "SGO.PA", "libelle": "Compagnie de Saint-Gobain", "parts": 37, "pru": 85.64, "liquidative": 89.26 },
  { "compte": "CTO", "isin": "USSC.L", "libelle": "MSCI USA Small Cap Value", "parts": 41, "pru": 72.9, "liquidative": 72.30 },
  { "compte": "CTO", "isin": "AGX", "libelle": "Argan Inc.", "parts": 8, "pru": 304, "liquidative": 345.87 },
  { "compte": "CTO", "isin": "PERR.PA", "libelle": "Gerard Perrier", "parts": 20, "pru": 90.2, "liquidative": 87.40 },
  { "compte": "CTO", "isin": "RI.PA", "libelle": "Pernod Ricard", "parts": 20, "pru": 73.5, "liquidative": 84.94 },
  { "compte": "CTO", "isin": "PAAS", "libelle": "Pan American Silver", "parts": 20, "pru": 49.92, "liquidative": 48.90 },
  { "compte": "CTO", "isin": "DRO.AX", "libelle": "DroneShield", "parts": 500, "pru": 2.03, "liquidative": 1.87 },
  { "compte": "CTO", "isin": "BSD.PA", "libelle": "Bourse Direct", "parts": 50, "pru": 5.3, "liquidative": 4.97 },
  { "compte": "A. Vie", "isin": "XAD1.DE", "libelle": "DB X-TRACKERS ETC PHYS GOLD HDG", "parts": 152.1718, "pru": 252.25, "liquidative": 284.92 },
  { "compte": "A. Vie", "isin": "MI9S.F", "libelle": "BGF WORLD GOLD FUND A2 EUR", "parts": 161.6795, "pru": 82.15, "liquidative": 97.77 },
  { "compte": "A. Vie", "isin": "0P0000JNNL.F", "libelle": "SCHELCHER FLEX SHORT DURATION P", "parts": 32.7468, "pru": 185.54, "liquidative": 190.65 },
  { "compte": "A. Vie", "isin": "0P000018HU.F", "libelle": "CARMIGNAC INVEST LATITUDE", "parts": 20.8484, "pru": 417.83, "liquidative": 406.02 },
  { "compte": "A. Vie", "isin": "0P00000GD3.F", "libelle": "MANDARINE CREDIT OPPORTUNITIES", "parts": 10.0471, "pru": 794.53, "liquidative": 799.82 },
  { "compte": "A. Vie", "isin": "Y9U6.F", "libelle": "CARMIGNAC PATRIMOINE A", "parts": 9.4536, "pru": 792.64, "liquidative": 793.01 },
  { "compte": "A. Vie", "isin": "0P0000V5ZK.F", "libelle": "CARMIGNAC EMERGING PATRIMOINE A", "parts": 29.5281, "pru": 169.33, "liquidative": 169.89 },
  { "compte": "PEA", "isin": "WPEA.PA", "libelle": "ISHARES MSCI WORLD SWAP PEA ETF", "parts": 6432, "pru": 6.13, "liquidative": 6.14 },
  { "compte": "PEA", "isin": "PASI.PA", "libelle": "AMUNDI PEA CHINE MSCICHSCRUCITS ETF-ACC", "parts": 1053, "pru": 10.4, "liquidative": 10.52 },
  { "compte": "PEA", "isin": "OBLI.PA", "libelle": "AMUNDI PEA EURO COURT TERME UCITS ETF", "parts": 500, "pru": 9.7, "liquidative": 9.68 },
  { "compte": "PEA", "isin": "COFA.PA", "libelle": "COFACE", "parts": 300, "pru": 16.57, "liquidative": 15.87 },
  { "compte": "PEA", "isin": "AI.PA", "libelle": "AIR LIQUIDE", "parts": 18, "pru": 172.26, "liquidative": 169.26 },
  { "compte": "PEA", "isin": "CW8.PA", "libelle": "AMUNDI IS MSCI WORLD SWAP ETF EUR ACC", "parts": 4, "pru": 525.48, "liquidative": 610.52 },
  { "compte": "PEA", "isin": "RS2K.PA", "libelle": "AMUNDI IS RUSSELL 2000 ETF-C EUR", "parts": 7, "pru": 332.63, "liquidative": 333.31 },
  { "compte": "PEA", "isin": "AWAT.PA", "libelle": "AMUNDI PEA EAU (MSCI WATER) ETF CAPI", "parts": 65, "pru": 32.41, "liquidative": 33.21 }
]

def force_create_json():
    data_to_write = []
    source = "BACKUP"

    # Tentative de lecture du fichier HTML existant
    if os.path.exists('portfolio_master.html'):
        try:
            with open('portfolio_master.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Recherche plus souple : on cherche juste le bloc [...]
            start_idx = content.find('INITIAL_DATA = [')
            if start_idx != -1:
                # On cherche le début du tableau
                start_array = content.find('[', start_idx)
                # On cherche la fin approximative (la dernière accolade fermante + crochet)
                end_array = content.rfind(']')
                
                if start_array != -1 and end_array != -1:
                    json_str = content[start_array:end_array+1]
                    try:
                        data_to_write = json.loads(json_str)
                        source = "HTML (Extraction Réussie)"
                    except:
                        pass # Échec silencieux, on garde le backup
        except Exception as e:
            print(f"⚠️ Erreur lecture HTML: {e}")

    if not data_to_write:
        data_to_write = BACKUP_DATA
        source = "BACKUP (Extraction échouée)"

    # Écriture du fichier JSON
    with open('portfolio.json', 'w', encoding='utf-8') as f:
        json.dump(data_to_write, f, indent=2, ensure_ascii=False)
    
    print(f"✅ portfolio.json créé avec succès !")
    print(f"ℹ️ Source des données : {source}")

if __name__ == "__main__":
    force_create_json()

