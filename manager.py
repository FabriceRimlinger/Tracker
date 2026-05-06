#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import json
import os
import urllib.request
from datetime import datetime, date, timedelta
from urllib.parse import urlparse


# ---------------------------------------------------------------------------
# Chemins robustes : toujours relatifs au script
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = 8000
JSON_FILE = os.path.join(BASE_DIR, "portfolio.json")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")
VERSEMENTS_FILE = os.path.join(BASE_DIR, "versements.json")


# ---------------------------------------------------------------------------
# Logique de mise à jour des prix (Yahoo Finance)
# ---------------------------------------------------------------------------
def update_prices_logic():
    """
    Met à jour les prix depuis Yahoo Finance.

    - liquidative = clôture du dernier jour disponible (J)
    - prev_close  = clôture du jour précédent (J-1) → baseline intraday
    """
    try:
        import yfinance as yf
    except ImportError:
        return {
            "status": "error",
            "message": "Module yfinance manquant. pip install yfinance",
        }

    if not os.path.exists(JSON_FILE):
        return {
            "status": "error",
            "message": f"{os.path.basename(JSON_FILE)} introuvable",
        }

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        portfolio = json.load(f)

    # Taux de change (fallbacks)
    usd_rate = 1.05
    gbp_rate = 0.85
    aud_rate = 1.60
    chf_rate = 0.95

    try:
        usd_rate = yf.Ticker("EURUSD=X").fast_info.last_price
        print(f"📈 Taux EUR/USD : {usd_rate:.4f}")
    except Exception:
        print(f"⚠️ Taux EUR/USD par défaut : {usd_rate}")

    updated_count = 0
    errors_count = 0
    logs = []
    today = datetime.now().strftime("%d/%m/%Y")

    print(f"\n📊 Mise à jour de {len(portfolio)} positions...\n")

    for pos in portfolio:
        symbol = (pos.get("isin") or "").strip()
        if not symbol:
            logs.append(f"⚠️ Sans ticker : {pos.get('libelle', 'N/A')} — ignoré")
            continue

        price = None  # clôture J (liquidative)
        prev_close = None  # clôture J-1
        currency = None
        method_used = None

        try:
            ticker = yf.Ticker(symbol)

            # Prix rapide (optionnel)
            try:
                price = ticker.fast_info.last_price
                currency = ticker.fast_info.currency
                method_used = "fast_info"
            except Exception:
                pass

            # Historique pour J et J-1
            history = None
            for period in ("10d", "1mo"):
                try:
                    h = ticker.history(period=period)
                    if h is not None and len(h) >= 2:
                        history = h
                        break
                    elif h is not None and len(h) == 1:
                        history = h
                except Exception:
                    pass

            if history is None or history.empty:
                try:
                    end_d = date.today()
                    start_d = end_d - timedelta(days=14)
                    h = ticker.history(start=start_d, end=end_d)
                    if h is not None and not h.empty:
                        history = h
                except Exception:
                    pass

            if history is None or history.empty:
                logs.append(f"⚠️ {symbol}: aucune donnée historique disponible")
                errors_count += 1
                continue

            if len(history) >= 2:
                price = float(history["Close"].iloc[-1])
                prev_close = float(history["Close"].iloc[-2])
                method_used = method_used or "history(≥2j)"
            else:
                price = float(history["Close"].iloc[-1])
                prev_close = price
                method_used = method_used or "history(1j)"

            # Devise
            if currency is None:
                try:
                    info = ticker.info
                    currency = (info or {}).get("currency", "EUR")
                except Exception:
                    sfx = symbol.upper()
                    if any(
                        sfx.endswith(s)
                        for s in (".PA", ".F", ".DE", ".SG", ".MU", ".BE")
                    ):
                        currency = "EUR"
                    elif sfx.endswith(".L"):
                        currency = "GBP"
                    elif sfx.endswith(".AX"):
                        currency = "AUD"
                    elif sfx.endswith((".SW", ".VX")):
                        currency = "CHF"
                    elif sfx.endswith(".SI"):
                        currency = "SGD"
                    else:
                        currency = "USD"

            def to_eur(val: float) -> float:
                if currency == "USD":
                    return val / usd_rate
                if currency == "GBX":
                    return (val / 100) / gbp_rate
                if currency == "GBP":
                    return val / gbp_rate
                if currency == "AUD":
                    return val / aud_rate
                if currency == "CHF":
                    return val / chf_rate
                if currency == "SGD":
                    return val / 1.45
                return val  # EUR ou inconnu

            price_eur = to_eur(price)
            prev_close_eur = to_eur(prev_close)

            parts = float(pos.get("parts", 0) or 0.0)
            pos["liquidative"] = round(price_eur, 2)
            pos["prev_close"] = round(prev_close_eur, 2)
            pos["montant"] = round(parts * price_eur, 2)
            pos["date_vl"] = today

            # Nettoyage ancien champ
            pos.pop("open", None)

            intraday_pct = (
                ((price_eur - prev_close_eur) / prev_close_eur * 100)
                if prev_close_eur
                else 0
            )
            logs.append(
                f"✅ {symbol}: {price_eur:.2f} € "
                f"(J-1: {prev_close_eur:.2f} €, Δ {intraday_pct:+.2f}%) "
                f"[{currency}, {method_used}]"
            )
            updated_count += 1

        except Exception as e:
            msg = str(e)
            if len(msg) > 200:
                msg = msg[:200] + "..."
            logs.append(f"❌ {symbol}: {msg}")
            errors_count += 1

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(portfolio, f, indent=2, ensure_ascii=False)

    # --- Snapshot historique journalier ---
    try:
        today_key = date.today().isoformat()
        history = {}
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)

        by_cat = {}
        total = 0.0
        for pos in portfolio:
            c = pos.get("compte", "?")
            v = float(pos.get("montant", 0) or 0)
            by_cat[c] = by_cat.get(c, 0) + v
            total += v

        versements_data = {}
        if os.path.exists(VERSEMENTS_FILE):
            with open(VERSEMENTS_FILE, "r", encoding="utf-8") as f:
                versements_data = json.load(f)

        history[today_key] = {
            "total": round(total, 2),
            "by_category": {k: round(v, 2) for k, v in by_cat.items()},
            "versements": versements_data,
        }
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        print(f"📅 Snapshot : {today_key} — total {total:,.0f} €")
    except Exception as e:
        print(f"⚠️ Snapshot historique échoué : {e}")

    for log in logs:
        print(log)

    print(f"\n{'='*60}")
    print(f"✅ {updated_count} succès | ❌ {errors_count} erreurs")
    print(f"{'='*60}\n")

    return {
        "status": "success",
        "count": updated_count,
        "errors": errors_count,
        "logs": logs,
    }


# ---------------------------------------------------------------------------
# Marchés (proxy Stooq côté serveur, évite CORS)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Marchés (proxy Stooq côté serveur, évite CORS)
# ---------------------------------------------------------------------------

def _to_float(s: str):
    s = (s or "").strip()
    if s in ("N/D", "ND", "n/d", "-", ""):
        return None
    try:
        return float(s)
    except Exception:
        return None


def _stooq_quote(sym: str):
    # CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
    url = f"https://stooq.com/q/l/?s={sym}&f=sd2t2ohlcv&h&e=csv"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        txt = r.read().decode("utf-8", errors="replace").strip().replace("\r", "")

    lines = txt.split("\n")
    if len(lines) < 2:
        raise ValueError(f"No data for {sym}")

    cols = lines[1].split(",")
    o = _to_float(cols[3])
    c = _to_float(cols[6])
    d = cols[1]
    t = cols[2]

    if o is None or c is None:
        raise ValueError(f"{sym}: N/D")

    ch = c - o
    chpct = (ch / o * 100.0) if o else None

    return {"close": c, "change": ch, "changePct": chpct, "date": d, "time": t}


def _yahoo_chart_quote(sym: str):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=5d"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        txt = r.read().decode("utf-8", errors="replace")

    data = json.loads(txt)
    result = data.get("chart", {}).get("result")
    if not result:
        err = data.get("chart", {}).get("error")
        raise ValueError(f"Yahoo no result for {sym}: {err}")

    meta = result[0].get("meta", {})
    close = meta.get("regularMarketPrice")
    prev_close = meta.get("chartPreviousClose")
    ts = meta.get("regularMarketTime")
    if close is None or prev_close is None:
        raise ValueError(f"Yahoo no price for {sym}")

    ch = close - prev_close
    chpct = (ch / prev_close * 100.0) if prev_close else None
    dt = datetime.fromtimestamp(ts) if ts else datetime.now()
    return {
        "close": close,
        "change": ch,
        "changePct": chpct,
        "date": dt.strftime("%Y-%m-%d"),
        "time": dt.strftime("%H:%M")
    }


def markets_snapshot():
    items = [
        ("EUR/USD", "EURUSD=X"),
        ("S&P 500", "^GSPC"),
        ("Nasdaq 100", "^NDX"),
        ("CAC 40", "^FCHI"),
        ("Hang Seng", "^HSI"),
        ("South Africa", "EZA"),
    ]

    out = []
    updated = ""

    for (label, sym) in items:
        try:
            q = _yahoo_chart_quote(sym)
            if not updated:
                updated = f"{q['date']} {q['time']}".strip()
            out.append({"label": label, "value": q["close"], "change": q["change"], "changePct": q["changePct"]})
        except Exception as e:
            out.append({"label": label, "value": None, "change": None, "changePct": None, "error": str(e)})

    return {"updated": updated, "items": out}



# ---------------------------------------------------------------------------
# Serveur HTTP
# ---------------------------------------------------------------------------
class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        msg = format % args
        if "POST /update_prices" in msg:
            print("\n🔄 Demande de mise à jour des prix...")
        elif "POST /save" in msg:
            print("💾 Sauvegarde des données...")

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path  # ignore ?query=...

        if path == "/":
            self.path = "/portfolio_master.html"
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

        if path == "/data":
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            try:
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            except FileNotFoundError:
                self.send_error(404, f"{os.path.basename(JSON_FILE)} introuvable")
            return

        if path == "/markets":
            try:
                data = markets_snapshot()
                payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:
                self._json_response(
                    500,
                    {
                        "status": "error",
                        "message": str(e),
                        "type": e.__class__.__name__,
                    },
                )
            return

        if path == "/history":
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.end_headers()
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            except FileNotFoundError:
                self.wfile.write(b"{}")
            return

        if path == "/versements":
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.end_headers()
            try:
                with open(VERSEMENTS_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            except FileNotFoundError:
                self.wfile.write(b"{}")
            return

        # Fichiers statiques (html/css/js/…)
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8")

        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/save":
            try:
                data = json.loads(body)
                if not isinstance(data, list):
                    self.send_error(400, "Format invalide (tableau JSON attendu)")
                    return
                with open(JSON_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self._json_response(200, {"status": "saved", "count": len(data)})
                print(f" → {len(data)} positions sauvegardées\n")
            except json.JSONDecodeError as e:
                self.send_error(400, f"JSON invalide : {e}")
            except Exception as e:
                self.send_error(500, str(e))
            return

        if path == "/update_prices":
            try:
                result = update_prices_logic()
                self._json_response(200, result)
            except Exception as e:
                self._json_response(500, {"status": "error", "message": str(e)})
            return

        if path == "/versements":
            try:
                data = json.loads(body)
                if not isinstance(data, dict):
                    self.send_error(400, "Format invalide (objet JSON attendu)")
                    return
                with open(VERSEMENTS_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self._json_response(200, {"status": "saved"})
            except json.JSONDecodeError as e:
                self.send_error(400, f"JSON invalide : {e}")
            except Exception as e:
                self.send_error(500, str(e))
            return

        self.send_error(404, "Endpoint inconnu")

    def _json_response(self, code, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(payload)


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 SERVEUR DE GESTION DE PORTEFEUILLE")
    print("=" * 60)
    print(f"📂 Base     : {BASE_DIR}")
    print(f"📂 Source   : {JSON_FILE}")
    print(f"🌐 Interface: http://localhost:{PORT}")
    print("⚡ Ctrl+C pour arrêter")
    print("=" * 60 + "\n")

    if not os.path.exists(JSON_FILE):
        print(f"⚠️ {os.path.basename(JSON_FILE)} introuvable !\n")

    try:
        with socketserver.TCPServer(("", PORT), PortfolioHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Arrêt du serveur.")
    except OSError as e:
        if getattr(e, "errno", None) == 98:
            print(f"\n❌ Port {PORT} déjà utilisé.\n")
        else:
            raise
