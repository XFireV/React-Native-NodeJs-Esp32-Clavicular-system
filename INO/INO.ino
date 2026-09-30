#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <WiFiClient.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

#define serverUrl "https://node-clavicular-system.onrender.com/"
#define localHostUrl "http://192.168.0.113:3333/home"

#define s0 18
#define s1 19
#define s2 5
#define s3 23
#define mux 34

//configs de rede
const char* inUseUrl = serverUrl;
const char* ssid = "Tati";
const char* password = "A28T10c24";

IPAddress ipLocal(192, 168, 0, 124);
IPAddress gateway(192,168,0,1);
IPAddress subnetMask(255,255,255,0);

IPAddress dns1(8,8,8,8);
IPAddress dns2(1,1,1,1);

LiquidCrystal_I2C lcd(0x27, 16, 2);

int ldrs[10][4] = {
  {0, 0, 0, 0}, 
  {1, 0, 0, 0},
  {0, 1, 0, 0}, 
  {1, 1, 0, 0}, 
  {0, 0, 1, 0}, 
  {1, 0, 1, 0}, 
  {0, 1, 1, 0},
  {1, 1, 1, 0}, 
  {0, 0, 0, 1},
  {1, 0, 0, 1} 
};

const byte LINHAS = 4;   // Linhas do teclado
const byte COLUNAS = 4;  // Colunas do teclado

const char TECLAS_MATRIZ[LINHAS][COLUNAS] = {  // Matriz de caracteres (mapeamento do teclado)
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};

const byte PINOS_LINHAS[LINHAS] = { 13, 12, 14, 27 };
const byte PINOS_COLUNAS[COLUNAS] = { 26, 25, 33, 32 };

Keypad keypad = Keypad(makeKeymap(TECLAS_MATRIZ), PINOS_LINHAS, PINOS_COLUNAS, LINHAS, COLUNAS);

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
const int intervaloLeitura = 3500;
const int inativity = 40000;
unsigned long lastPress = millis();

int senhaADM = 88881111;
String senhaUser = "";
String sketchAdminPass = "";
bool acess = false;

bool activity;

enum screens { HOME, ATIVE, STATUS, SWITCHADMPASS, IP };

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
      } else {
        senhaUser = "";
      }
    }

    void pushSystem() {
      if(WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client;
        client.setCACert(root_ca);

        JsonDocument doc;
        JsonDocument jsonPayload; 
        String payload;

        doc["pass"] = senhaUser;

        serializeJson(doc, payload); 

        HTTPClient http;
        http.begin(client, String(inUseUrl) + "push");
        http.setTimeout(5000);
        http.addHeader("Content-Type", "application/json");
    
        int responseCode = http.POST(payload);

        if(responseCode > 0) {
          Serial.println("Código HTTP: ");
          Serial.println(responseCode);

          String received = http.getString();
          DeserializationError error = deserializeJson(jsonPayload, received);

          if(!error) {
            Serial.print("confirmação: ");
            Serial.println(jsonPayload["confirm"].as<String>());
          } else {
            Serial.println(responseCode);
            http.end();
            return;
          }
          http.end();
        } else {Serial.println("Wifi desconectado, ou senha/ssid errados"); return;} 
      }
    }

    int receivePasses() {
      if(WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client;
        client.setCACert(root_ca);

        JsonDocument doc;
        JsonDocument jsonPayload; 
        String payload;

        doc["pass"] = senhaUser;

        serializeJson(doc, payload); 

        HTTPClient http;
        http.begin(client, String(inUseUrl) + "pass");
        http.setTimeout(5000);
        http.addHeader("Content-Type", "application/json");
    
        int responseCode = http.POST(payload);

        if(responseCode > 0) {
          Serial.println("Código HTTP: ");
          Serial.println(responseCode);

          String received = http.getString();
          DeserializationError error = deserializeJson(jsonPayload, received);

          if(!error) {
            if(jsonPayload.containsKey("senhaAdm") && jsonPayload.containsKey("senhaUser")){
              String acessAdm = jsonPayload["senhaAdm"];
              String acessUser = jsonPayload["senhaUser"];
              if(acessAdm == senhaUser) {return 0;} else if(acessUser == senhaUser) {return 1;} else {return 2;}
            }
          } else {
              Serial.println(error);
              http.end();
              return 2;
          }
          http.end();
        } else {
            Serial.println(responseCode);
            http.end();
            return 2;
          }
      } else {Serial.println("Wifi desconectado, ou senha/ssid errados"); return 2;} 
    }

    void updateAdminPass() {
      if(WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client;
        client.setCACert(root_ca);

        JsonDocument doc;
        JsonDocument response;
        String send;

        doc["pass"] = senhaUser;
        serializeJson(doc, send);

        HTTPClient http;
        http.begin(client, String(inUseUrl) + "update");
        http.setTimeout(10000);
        http.addHeader("Content-Type", "application/json");
        
        int httpResponseCode = http.POST(send);

        if(httpResponseCode > 0) {
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
            return ;
          }
        } else {
          Serial.print("Erro no POST: ");
          Serial.println(httpResponseCode);
          http.end();
          return ;
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
      String &sketchPass = tipo == true ? sketchAdminPass : senhaUser;
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
          }
          break;
        default:
          if (sketchPass.length() < 8) {
            sketchPass += car;
          break;
      }
    }
    
    void navigating(char car) {
      uint8_t indexScreen = (uint8_t)atualScreen;
      if(car == '5' && !editing) {
        if(atualScreen == ATIVE) {pushSystem();} else if(atualScreen == SWITCHADMPASS) { senhaUser = ""; editing = true;} 
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
    }

  public:
    displayManag(uint8_t adress, uint8_t colunas, uint8_t linhas) : lcd(adress, colunas, linhas) {
      acess = false;
      editing = true;
    }

    void startLcd() {
      lcd.init();
      lcd.backlight();
      lcd.clear();
    }

    void resetToHome() {
      atualScreen = HOME;
      editing = true;
      acess = false;
      senhaUser = "";
      updateLcd();
    }

    void starting(char caract) {       
      if (caract == NO_KEY) return; 
      
      if (!editing) {
        navigating(caract);
        return;
      }

      bool typePass = (atualScreen == SWITCHADMPASS); 
      digits(caract, typePass);
    }

    void updateLcd(bool list[] = NULL) {
      lcd.clear(); 

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
          lcd.print(clearSystem(16, senhaUser));
          break;

        case ATIVE:
          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "System boot"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, "press 5"));
          break;

        case STATUS:
          String showLdr = "";
          if (list != NULL) {
            for (int i = 0; i < 10; i++) {
              showLdr += list[i] ? "1" : "0"; 
            }
          }

          lcd.setCursor(0, 0);
          lcd.print(clearSystem(16, "Status LDRs:"));
          lcd.setCursor(0, 1);
          lcd.print(clearSystem(16, showLdr)); 
          break;
      }
    }
};

void enviarPost(bool listaT[], int listaV[]) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setCACert(root_ca);

    JsonDocument payloadDoc;
    JsonDocument response; 

    for (int data = 0; data < 10; data++) {
      payloadDoc["LDRState"].add(listaT[data]);
      payloadDoc["LDRValue"].add(listaV[data]);
    }
    payloadDoc["LEDState"] = digitalRead(ledPin);
    payloadDoc["mac"] = WiFi.macAddress();
    payloadDoc["ip"] = WiFi.localIP().toString();

    String JsonPayload;
    serializeJson(payloadDoc, JsonPayload);

    HTTPClient http;
    http.begin(client, inUseUrl);
    http.setTimeout(10000);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(JsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("Código HTTP: ");
      Serial.println(httpResponseCode);

      String payload = http.getString();
      DeserializationError error = deserializeJson(response, payload);
      
      if (!error) {
        Serial.print("Resposta do Servidor: ");
        Serial.println(payload);

        if (!response["ligar"].isNull() && !response["estado"].isNull()) {
          int pino = response["ligar"];
          int estado = response["estado"];
          Serial.print("Pino: ");
          Serial.println(pino);
          Serial.print("Estado: ");
          Serial.println(estado);

          pinMode(pino, OUTPUT);
          digitalWrite(pino, estado);
        }
      }
    } else {
      Serial.print("Erro no POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void updateMultiplex(int bits[]) {
  digitalWrite(s0, bits[0]);
  digitalWrite(s1, bits[1]);
  digitalWrite(s2, bits[2]);
  digitalWrite(s3, bits[3]);
}

void handleLed() {
  if (server.hasArg("plain")) {
    String payload = server.arg("plain");
    Serial.print("Payload: ");
    Serial.println(payload);
    digitalWrite(ledPin, 1);
  }

  JsonDocument doc;
  doc["status"] = "ok";
  String resposta;
  serializeJson(doc, resposta);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", resposta);
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

displayManag display(0x27, 16, 2);

void setup() {
  display.startLcd();
  if(!WiFi.config(ipLocal, gateway, subnetMask, dns1, dns2)) {Serial.println("Erro ao configurar IP estático");}

  Serial.begin(115200);
  delay(2000);
  
  pinMode(2, OUTPUT);

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

  server.on("/led", HTTP_POST, handleLed);
  server.on("/off", offset);
  server.on("/parear", parearNovo);
  server.begin();
}

void loop() {
  delay(20);
  server.handleClient();

  char caract = keypad.getKey();
  display.starting(caract);

  if (caract != NO_KEY) {
    display.updateLcd();
    lastPress = millis();
  }

  if(millis() - lastPress >= inativity && atualScreen != HOME) display.resetToHome();

  if (millis() - tempoUltimaLeitura >= intervaloLeitura) {
    tempoUltimaLeitura = millis();

    bool listaTrue[10] = { false };
    int listaValores[10] = { 0 };
    int ldrBits[4] = {0,0,0,0};
    int atualValue = 0;

    for (int i = 0; i < 10; i++) {
      for (int y = 0; y < 4; y++) {
        ldrBits[y] = ldrs[i][y];
      }
      updateMultiplex(ldrBits);
      delay(20);

      int leitura = analogRead(mux);
      listaValores[i] = leitura;
      listaTrue[i] = (leitura > 1200);
      atualValue++;
  }

    for (int i = 0; i < 10; i++) {
      Serial.println(" -Sensor " + String(i) + ": " + String(listaValores[i]));
    }

    enviarPost(listaTrue, listaValores);
    display.updateLcd(listaTrue);
  }
}
