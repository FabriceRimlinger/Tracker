#!/bin/bash
# Script de lancement automatique du tracker de portefeuille

cd ~/Documents/TRACKER

# Vérifier que le virtual env existe
if [ ! -d "venv" ]; then
    echo "❌ Environnement virtuel introuvable. Installez d'abord les dépendances."
    exit 1
fi

# Vérifier que portfolio.json existe
if [ ! -f "portfolio.json" ]; then
    echo "⚠️ portfolio.json introuvable."
    exit 1
fi

echo "🚀 Lancement du serveur de portefeuille..."
echo "   URL : http://localhost:8000"
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""

# Lancer le serveur en arrière-plan
./venv/bin/python3 manager.py &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 2

# Ouvrir Brave (Flatpak) — mode app standalone sans barre d'onglets
flatpak run com.brave.Browser --app="http://localhost:8000/portfolio_master.html?v=$(date +%s)" &

# Attendre que le serveur se termine (Ctrl+C)
wait $SERVER_PID

