# Yayın kontrolü

Hedef: https://enesfaruk91.github.io/zifir/

HTTP 200. Canlı URL, başsız Chrome/CDP ve 740×360 yatay dokunmatik emülasyonla kontrol edildi.

```json
{
  "modules": [
    "girdi",
    "sehir",
    "kahraman",
    "oyuncu",
    "dusman",
    "gorev",
    "ses",
    "arayuz"
  ],
  "glb": true,
  "errors": [],
  "state": "menu",
  "viewport": [
    740,
    360
  ],
  "after": {
    "state": "oyun",
    "touchVisible": true,
    "buttons": [
      "Zıpla",
      "Ağ",
      "Saldır",
      "Çekil",
      "Süzül",
      "Dalış",
      "Dev",
      "Kamçı",
      "Ⅱ"
    ],
    "sticks": 2,
    "errors": []
  }
}
```

Görseller: /tmp/zifir-live-menu.png ve /tmp/zifir-live-touch.png. 8 modül ve gerçek GLB hazır, hata listesi boş. OYNA sonrasında iki çubuk ve dokunmatik eylem düğmeleri görünür. Fiziksel telefon testi yapılmadı.
