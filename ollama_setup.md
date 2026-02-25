[Instructions for Installing Ollama]

1. Visit [ollama.com](https://ollama.com) and click "Download".
2. Run the installer for Windows.
3. Once installed, open a NEW terminal window (PowerShell or CMD).
4. Pull the model we are using (Llama 3) by running: ollama pull llama3

[Verify Installation] Run this command in your terminal to chat with the model:
ollama run llama3 "Hello, are you ready?"

[Running the App]

1. Ensure the Ollama app is running in the background (check your system tray).
2. Run the ingestion (only once): python ingest.py
3. Run the app: streamlit run app.py
