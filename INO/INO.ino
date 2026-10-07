#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <WiFiClient.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <ESP32Servo.h>

#define serverUrl "https://node-clavicular-system.onrender.com/"
#define localHostUrl "http://192.168.0.113:3333/home"

#define s0 18
#define s1 19
#define s2 21
#define s3 22
#define mux 34

// configs de rede
const char* inUseUrl = serverUrl;
const char* ssid = "IFSUL-Atendimento";
const char* password = "esmeralda2026";

int ldrs[10][4] = {
  { 0, 0, 0, 0 },
  { 1, 0, 0, 0 },
  { 0, 1, 0, 0 },
  { 1, 1, 0, 0 },
  { 0, 0, 1, 0 },
  { 1, 0, 1, 0 },
  { 0, 1, 1, 0 },
  { 1, 1, 1, 0 },
  { 0, 0, 0, 1 },
  { 1, 0, 0, 1 }
};

const byte LINHAS = 4;   // Linhas do teclado
const byte COLUNAS = 4;  // Colunas do teclado

const char TECLAS_MATRIZ[LINHAS][COLUNAS] = {
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};

byte PINOS_LINHAS[LINHAS] = { 32, 33, 25, 26 };
byte PINOS_COLUNAS[COLUNAS] = { 27, 14, 12, 13 };

Keypad keypad = Keypad(makeKeymap(TECLAS_MATRIZ), PINOS_LINHAS, PINOS_COLUNAS, LINHAS, COLUNAS);

Servo meuServo;

const char* root_ca =
  "-----BEGIN CERTIFICATE-----\n"
  "MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX\n"
  "MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE\n"
  "CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx\n"
  "NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT\n"
  "GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0\n"
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube\n"
  "Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e\n"
  "WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd\n"
  "BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd\n"
  "BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN\n"
  "l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw\n"
  "Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v\n"
  "Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG\n"
  "SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ\n"
  "odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY\n"
  "+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs\n"
  "kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep\n"
  "8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1\n"
  "vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl\n"
  "-----END CERTIFICATE-----\n";

WebServer server(80);
const int ledPin = 2;

unsigned long tempoUltimaLeitura = 0;
const int intervaloLeitura = 15000;
const int inativity = 40000;
int timeout = 0;
unsigned long startTimeout = millis();
unsigned long lastPress = millis();
unsigned long timeUpd = 0;

String senhaUser = "";
String sketchAdminPass = "";
bool acess = false;
bool auxSystem = false;
bool updatedLdr = false;

bool systemOn = false;
bool listaTrue[10] = { false };
int listaValores[10] = { 0 };
int ldrUpdateSys[10] = {0};

bool activity;

enum screens { HOME,ATIVE,STATS,SWITCHADMPASS,IP };

screens atualScreen;

class displayManag {
private:
  LiquidCrystal_I2C lcd;
  bool acess;
  bool editing;

  void depuratePass() {
    int passResult = receivePasses();
    if (passResult == 0 || passResult == 1) {
      acess = true;
      editing = false;
      atualScreen = ATIVE;
      updateLcd();
    } else {
      senhaUser = "";
      updateLcd();
    }
  }

  void pushSystem() {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setCACert(root_ca);

      JsonDocument doc;
      JsonDocument jsonPayload;
      String payload;

      doc["pass"] = senhaUser;
      doc["mac"] = WiFi.macAddress();

      serializeJson(doc, payload);

      HTTPClient http;
      http.begin(client, String(inUseUrl) + "push");
      http.setTimeout(5000);
      http.addHeader("Content-Type", "application/json");

      int responseCode = http.POST(payload);

      if (responseCode > 0) {
        Serial.println("Código HTTP: ");
        Serial.println(responseCode);

        String received = http.getString();
        DeserializationError error = deserializeJson(jsonPayload, received);

        if (!error) {
          Serial.print("confirmação: ");
          Serial.println(jsonPayload["confirm"].as<String>());

          timeout = jsonPayload["opentime"];
          systemOn = true;
          updatedLdr = true;
          startTimeout = millis();

          Serial.println(timeout);
          digitalWrite(15, 1);
        } else {
          Serial.println(responseCode);
          http.end();
          return;
        }
        http.end();
      } else {
        Serial.println("Wifi desconectado, ou senha/ssid errados");
        return;
      }
    }
  }

  int receivePasses() {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setCACert(root_ca);

      JsonDocument doc;
      JsonDocument jsonPayload;
      String payload;

      doc["pass"] = senhaUser;
      doc["mac"] = WiFi.macAddress();

      serializeJson(doc, payload);

      HTTPClient http;
      http.begin(client, String(inUseUrl) + "pass");
      http.setTimeout(5000);
      http.addHeader("Content-Type", "application/json");

      int responseCode = http.POST(payload);

      if (responseCode > 0) {
        Serial.println("Código HTTP: ");
        Serial.println(responseCode);

        String received = http.getString();
        DeserializationError error = deserializeJson(jsonPayload, received);

        if (!error) {
          if (jsonPayload.containsKey("senhaAdm") && jsonPayload.containsKey("senhaUser")) {
            String acessAdm = jsonPayload["senhaAdm"];
            String acessUser = jsonPayload["senhaUser"];
            if (acessAdm == senhaUser) {
              return 0;
            } else if (acessUser == senhaUser) {
              return 1;
            } else {
              return 2;
            }
          }
        } else {
          Serial.println(error.c_str());
          http.end();
          return 2;
        }
        http.end();
      } else {
        Serial.println(responseCode);
        http.end();
        return 2;
      }
    } else {
      Serial.println("Wifi desconectado, ou senha/ssid errados");
      return 2;
    }
  }

  void updateAdminPass() {
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setCACert(root_ca);

      JsonDocument doc;
      JsonDocument response;
      String send;

      doc["pass"] = senhaUser;
      doc["mac"] = WiFi.macAddress();
      serializeJson(doc, send);

      HTTPClient http;
      http.begin(client, String(inUseUrl) + "update");
      http.setTimeout(10000);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(send);

      if (httpResponseCode > 0) {
        Serial.print("Código HTTP: ");
        Serial.println(httpResponseCode);

        String payload = http.getString();
        DeserializationError error = deserializeJson(response, payload);

        if (!error) {
          Serial.print("Senha ADM nova: ");
          Serial.println(payload);
          Serial.println(response["confirm"].as<String>());
          Serial.println(response["pass"].as<String>());

          http.end();
          return;

        } else {
          Serial.print("Erro no JSON: ");
          Serial.println(error.c_str());
          http.end();
          return;
        }
      } else {
        Serial.print("Erro no POST: ");
        Serial.println(httpResponseCode);
        http.end();
        return;
      }
    }
    return;
  }

  String clearSystem(const int size, String text) {
    while (text.length() < size) {
      text += " ";
    }
    return text;
  }

  void digits(char car, bool tipo) {
    String& sketchPass = tipo == true ? sketchAdminPass : senhaUser;
    switch (car) {
      case '#':
        if (sketchPass.length() > 0) {
          sketchPass.remove(sketchPass.length() - 1);
        }
        break;
      case '*':
        if (sketchPass.length() == 8) {
          if (tipo) {
            updateAdminPass();
          } else {
            depuratePass();
          }
        } else {sketchPass = "";}
        break;
      default:
        if (sketchPass.length() < 8) {
          sketchPass += car;
        }
        break;
    }
  }

  void navigating(char car) {
    uint8_t indexScreen = (uint8_t)atualScreen;
    
    if (car == '5' && !editing) {
      if (atualScreen == ATIVE) {
        pushSystem();
      } else if (atualScreen == SWITCHADMPASS) {
        senhaUser = "";
        editing = true;
      }
      updateLcd();
      return;
    }

    const char type = (car == '4') ? 'L' : (car == '6') ? 'R' : 'N';
    if (type == 'N') return;

    uint8_t newIndex;
    if (type == 'R') {
      newIndex = (indexScreen == 4) ? 0 : indexScreen + 1;
    } else {
      newIndex = (indexScreen == 0) ? 4 : indexScreen - 1;
    }

    atualScreen = (screens)newIndex;
    updateLcd(); 
  }

public:
  displayManag(uint8_t adress, uint8_t colunas, uint8_t linhas)
    : lcd(adress, colunas, linhas) {
    acess = false;
    editing = true;
  }

  void startLcd() {
    Wire.begin(23, 5);
    lcd.init();
    lcd.begin(16,2);
    lcd.backlight();
    lcd.clear();
  }

  void liberarViaFacial() {
    editing = false;
    acess = true;
    senhaUser = "";
    atualScreen = ATIVE;
    updateLcd();
  }

  void resetToHome() {
    atualScreen = HOME;
    editing = true;
    acess = false;
    senhaUser = "";
    updateLcd();
  }

  void sysOn() {
    long tempoRestante = timeout - (millis() - startTimeout);
    if (tempoRestante < 0) tempoRestante = 0;

    lcd.setCursor(0, 0);
    lcd.print(clearSystem(16, "Sistema Ativo"));
    lcd.setCursor(0, 1);
    lcd.print(clearSystem(16, "Resta: " + String(tempoRestante / 1000) + "s"));
  }

  void starting(char caract) {
    if (caract == NO_KEY) return;

    if (!editing) {
      navigating(caract);
      return;
    }

    bool typePass = (atualScreen == SWITCHADMPASS);
    digits(caract, typePass);
    updateLcd(); 
  }

  void updateLcd(bool list[] = NULL) {
    lcd.clear();

    if(!systemOn){
      switch (atualScreen) {
        case HOME:
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "Ativar Sistema"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, "Senha: " + senhaUser));
          break;

        case IP:
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "IP do sistema:"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, WiFi.localIP().toString()));
          break;

        case SWITCHADMPASS:
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "Nova Senha ADM:"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, sketchAdminPass));
          break;

        case ATIVE:
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "System boot"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, "press 5"));
          break;

        case STATS:
          String showLdr = "";
          for (int i = 0; i < 10; i++) {
              showLdr += listaTrue[i] ? "1 " : "0 ";
          }
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "Status LDRs:"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, showLdr));
          break;
      }
    }
  }
};

displayManag display(0x27, 16, 2);

void enviarPost(bool listaT[], int listaV[], listaUse[]) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setCACert(root_ca);

  JsonDocument payloadDoc;
  JsonDocument response;

  for (int data = 0; data < 10; data++) {
    payloadDoc["LDRState"].add(listaT[data]);
    payloadDoc["LDRValue"].add(listaV[data]);
    payloadDoc["LDRSUse"].add(listaUse[data]);
  }
  payloadDoc["LEDState"] = digitalRead(ledPin);
  payloadDoc["mac"] = WiFi.macAddress();
  payloadDoc["ip"] = WiFi.localIP().toString();

  String JsonPayload;
  serializeJson(payloadDoc, JsonPayload);

  String targetUrl = String(inUseUrl);
  if (!targetUrl.endsWith("/")) targetUrl += "/";
  targetUrl += "home";

  HTTPClient http;
  http.begin(client, targetUrl);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(JsonPayload);

  if (httpResponseCode > 0) {
    Serial.print("[Core 0] Código HTTP: ");
    Serial.println(httpResponseCode);

    String payload = http.getString();
    DeserializationError error = deserializeJson(response, payload);

    if (!error) {
      Serial.print("[Core 0] Resposta do Servidor: ");
      Serial.println(payload);

      if (response["ligar"].is<int>() && response["estado"].is<int>()) {
        int pino = response["ligar"].as<int>();
        int estado = response["estado"].as<int>();

        Serial.printf("[Core 0] Acionando Pino: %d -> Estado: %d\n", pino, estado);

        pinMode(pino, OUTPUT);
        digitalWrite(pino, estado);
      }
    } else {
      Serial.print("[Core 0] Erro ao parsear JSON de resposta: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("[Core 0] Erro no POST HTTP: ");
    Serial.println(httpResponseCode);
  }

  http.end();
  client.stop();
}

void updateMultiplex(int bits[]) {
  digitalWrite(s0, bits[0]);
  digitalWrite(s1, bits[1]);
  digitalWrite(s2, bits[2]);
  digitalWrite(s3, bits[3]);
}

int systemLdr() {
  int ldrBits[4] = { 0, 0, 0, 0 };
  int values[10] = {0};

  for (int i = 0; i < 10; i++) {
    for (int y = 0; y < 4; y++) {
      ldrBits[y] = ldrs[i][y];
    }
    updateMultiplex(ldrBits);
    delay(20);

    int leitura = analogRead(mux);
    values[i] = leitura;
  }
  return values;
}

void handleLed() {
  if (server.hasArg("plain")) {
    String payload = server.arg("plain");
    Serial.print("Payload recebido: ");
    Serial.println(payload);

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool ative = doc["ative"] | true;
      unsigned long tempoAcionamento = doc["time"] | 10000;

      if (ative) {
        digitalWrite(ledPin, HIGH);

        Serial.print("LED ligado por (ms): ");
        Serial.println(tempoAcionamento);

        startTimeout = millis();
        timeout = tempoAcionamento;
        systemOn = true;
        updatedLdr = true;
        digitalWrite(15, 1);
      }
    } else {
      Serial.println("Erro ao parsear JSON do /led");
      digitalWrite(ledPin, 1);
    }
  }

  JsonDocument docResp;
  docResp["status"] = "ok";
  String resposta;
  serializeJson(docResp, resposta);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", resposta);
}

void parearNovo() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", WiFi.macAddress());
}

void putFace() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Payload ausente\"}");
    return;
  }

  String payload = server.arg("plain");
  Serial.print("Payload recebido da Câmera: ");
  Serial.println(payload);

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"JSON invalido\"}");
    return;
  }

  String nome = doc["user"];
  bool confirm = doc["confirm"];

  if (confirm && nome.length() > 0) {
    Serial.printf("[FACIAL] Validando usuario '%s' no servidor...\n", nome.c_str());

    bool aprovadoPeloServidor = pushSystemFacial(nome);

    if (aprovadoPeloServidor) {
      digitalWrite(ledPin, HIGH);
      digitalWrite(15, HIGH);
      meuServo.write(180);

      startTimeout = millis();
      systemOn = true;
      updatedLdr = true;

      display.liberarViaFacial();

      Serial.println("acesso aprovado");

      JsonDocument docResp;
      docResp["status"] = "ok";
      docResp["granted"] = true;
      String resposta;
      serializeJson(docResp, resposta);

      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", resposta);
      return;
    }
  }

  Serial.println("Acesso negado");
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(401, "application/json", "{\"status\":\"denied\",\"granted\":false}");
  Serial.println("confirm: " + confirm);
  Serial.println("nome: " + nome);

}

bool pushSystemFacial(String nome) {
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setCACert(root_ca);

  JsonDocument doc;
  JsonDocument jsonPayload;
  String payload;

  doc["user"] = nome;
  doc["mac"] = WiFi.macAddress();
  doc["from"] = "Facial";

  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(client, String(inUseUrl) + "push");
  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(payload);
  bool autorizado = false;

  if (responseCode == 200) {
    String received = http.getString();
    DeserializationError error = deserializeJson(jsonPayload, received);

    if (!error && jsonPayload.containsKey("confirm")) {
      autorizado = true;
      if (jsonPayload.containsKey("opentime")) {
        timeout = jsonPayload["opentime"].as<int>();
      }
    }
  } else {
    Serial.printf("[FACIAL] Servidor recusou a validação. Código HTTP: %d\n", responseCode);
  }

  http.end();
  client.stop();
  return autorizado;
}

void registrarIPInicial() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setCACert(root_ca);

    JsonDocument doc;
    doc["mac"] = WiFi.macAddress();
    doc["ip"] = WiFi.localIP().toString();

    String payload;
    serializeJson(doc, payload);

    HTTPClient http;
    http.begin(client, String(inUseUrl) + "register-ip");
    http.setTimeout(7000);
    http.addHeader("Content-Type", "application/json");

    int responseCode = http.POST(payload);

    if (responseCode > 0) {
      Serial.print("Registro de IP retornou código: ");
      Serial.println(responseCode);
      String resposta = http.getString();
      Serial.println("Resposta: " + resposta);
    } else {
      Serial.print("Erro ao registrar IP: ");
      Serial.println(responseCode);
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  display.startLcd();
  display.updateLcd();
  
  meuServo.setPeriodHertz(50);
  meuServo.attach(4, 500, 2400);

  delay(2000);
  meuServo.write(0);
  pinMode(2, OUTPUT);
  pinMode(15, OUTPUT);

  pinMode(s0, OUTPUT);
  pinMode(s1, OUTPUT);
  pinMode(s2, OUTPUT);
  pinMode(s3, OUTPUT);
  pinMode(mux, INPUT);

  pinMode(ledPin, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado! IP do ESP32:");
  Serial.println(WiFi.localIP());

  registrarIPInicial();

  server.on("/led", HTTP_POST, handleLed);
  server.on("/face", HTTP_POST, putFace);
  server.on("/parear", parearNovo);
  server.begin();
}

void loop() {
  delay(20);
  server.handleClient();

  char caract = keypad.getKey();
  
  if (caract != NO_KEY) {
    display.starting(caract); 
    lastPress = millis();
  }

  if (systemOn) {
    meuServo.write(180);
    if (millis() - timeUpd >= 200) {
      timeUpd = millis();
      display.sysOn();
    }
    if (millis() - startTimeout >= timeout) {
      systemOn = false;
      meuServo.write(0);
      digitalWrite(15, 0);
      Serial.println("[SERVO DESLIGADO]");
      display.updateLcd();
    }
  } 

  if (millis() - lastPress >= inativity && atualScreen != HOME) {
    display.resetToHome();
  }

  if(systemOn && updatedLdr) {
    systemLdr(ldrUpdateSys);
    for(int i; i < 10; i++) {
      listaTrue[i] = (ldrUpdateSys[i] > 10);
      listaValores[i] = ldrUpdateSys[i];
    }

    updateLdr = false;

  } else {
      if(auxSystem) {
        bool newTrue[10] = {0};
        String ldrsUse[10] = {""};

        systemLdr(ldrUpdateSys);
        for(int i; i < 10; i++) {
          newTrue[i] = (ldrUpdateSys[i] > 10);
          if(newTrue[i] != listaTrue[i]) {
            if(listaTrue[i] = true) {
              ldrsUse[i] = "Retirou";
            } else { ldrsUse[i] = "Devolveu"; }
          }
        }

        enviarPost(listaTrue, listaValores, ldrsUse);
        display.updateLcd(); 
        auxSystem = false;
      }
    }
  }
