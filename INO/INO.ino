#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> 
#define serverUrl "https://node-clavicular-system.onrender.com/home"
#define localHostUrl "http://192.168.0.114:3333/home"
#include <WiFiClientSecure.h>
#include <WiFiClient.h>

const char* inUseUrl = localHostUrl;
const char* ssid = "Tati";
const char* password = "A28T10c24";

const String supabaseUrlBase = "https://oddsgncwvthovgustruu.supabase.co";
const String supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHNnbmN3dnRob3ZndXN0cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzQyMjMsImV4cCI6MjA4OTk1MDIyM30.wXbWDM8JGq8JOcjQwFKRlbplCAcmEkX64PzFELgScJI";

WebServer server(80);
const int ledPin = 2; 

// Variáveis do LDR
const int pinoLDR = 34;
bool estadoAtualL1 = false; 
bool ultimoEstadoL1 = false; // Guarda o último estado para enviar só quando mudar
unsigned long tempoUltimaLeitura = 0;
const int intervaloLeitura = 500; // Lê a cada 500ms

void enviarPost(bool ldrState) {
  if (WiFi.status() == WL_CONNECTED) {
    //WiFiClientSecure client;
    //client.setInsecure();
    WiFiClient client;

    JsonDocument payloadDoc;
    JsonDocument doc;

    payloadDoc["LDRState"] = ldrState;
    payloadDoc["LEDState"] = digitalRead(2);
    String JsonPayload;
    serializeJson(payloadDoc, JsonPayload);

    HTTPClient http;
    http.begin(client, inUseUrl);
    http.setTimeout(60000);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(JsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("Código HTTP: ");
      Serial.println(httpResponseCode);

      String payload = http.getString();
      deserializeJson(doc, payload);

      Serial.print("Resposta do Servidor: ");
      Serial.println(payload);

      int pino = doc["ligar"];  
      int estado = doc["estado"];
      Serial.print("Pino ");
      Serial.println(pino);
      Serial.print("Estado ");
      Serial.println(estado);

      digitalWrite(pino, estado);

    } else {
      Serial.print("Erro no POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
}
void enviarIpProSupabase() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = supabaseUrlBase + "/rest/v1/IPs"; 
    
    http.begin(url);
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + supabaseKey);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "resolution=merge-duplicates"); 

    StaticJsonDocument<200> doc;
    doc["mac"] = WiFi.macAddress(); 
    doc["ip"] = WiFi.localIP().toString();

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    int httpResponseCode = http.POST(jsonPayload); 
    
    if (httpResponseCode >= 200 && httpResponseCode <= 299) {
      Serial.printf("Supabase Sync OK: Status %d\n", httpResponseCode);
    } else {
      Serial.printf("Erro no Supabase Sync: Status %d\n", httpResponseCode);
    }
    http.end();
  }
}

// NOVA FUNÇÃO: Atualiza apenas o LDR l1 no Supabase
void atualizarSupabaseL1(bool temLuz) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Na URL, filtramos para atualizar apenas a linha que tem o IP atual do ESP
    String url = supabaseUrlBase + "/rest/v1/IPs?ip=eq." + WiFi.localIP().toString(); 
    
    http.begin(url);
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + supabaseKey);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal"); 

    // Cria o JSON {"ldr": {"l1": true/false}}
    StaticJsonDocument<200> doc;
    JsonObject ldrObj = doc.createNestedObject("ldr");
    ldrObj["l1"] = temLuz;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Usa PATCH para atualizar dados em uma linha existente
    int httpResponseCode = http.PATCH(jsonPayload); 
    
    if (httpResponseCode >= 200 && httpResponseCode <= 299) {
      Serial.print("Supabase Atualizado! L1 = ");
      Serial.println(temLuz ? "true (Com Luz)" : "false (Escuro)");
    } else {
      Serial.printf("Erro ao atualizar LDR: Status %d\n", httpResponseCode);
    }
    http.end();
  }
}

void handleLed() {
  digitalWrite(ledPin, 1);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED ligado");
}

void offset() {
  digitalWrite(ledPin, 0);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED desligado");
}

void parearNovo() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", WiFi.macAddress());
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  pinMode(ledPin, OUTPUT);
  pinMode(pinoLDR, INPUT); // Inicia o pino do LDR
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  
  Serial.println("\nConectado! IP do ESP32:");
  Serial.println(WiFi.localIP());

  enviarIpProSupabase();

  server.on("/led", handleLed);
  server.on("/off", offset);
  server.on("/parear", parearNovo);
  server.begin();
}

void loop() {
  // Mantém o servidor web escutando requisições constantemente
  server.handleClient();

  // Verifica o LDR a cada 500ms sem travar o código (sem usar delay)
  if (millis() - tempoUltimaLeitura >= intervaloLeitura) {
    tempoUltimaLeitura = millis();
    
    int valorBruto = analogRead(pinoLDR);
    
    // Lógica para decidir se há luz (ajuste o 1500 conforme seus testes físicos)
    estadoAtualL1 = (valorBruto < 1500); 

    // Se o estado mudou desde a última checagem
    if (estadoAtualL1 != ultimoEstadoL1) {
      ultimoEstadoL1 = estadoAtualL1; // Salva o novo estado
      
      // Envia a mudança para o banco de dados
      atualizarSupabaseL1(estadoAtualL1);
      enviarPost(estadoAtualL1);
    }
  }
}