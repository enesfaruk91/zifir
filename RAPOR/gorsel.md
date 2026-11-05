# ZİFİR — Görsel üretim raporu

Tarih: 5 Kasım 2026. Görev: `CODEX_GORSEL.md`; tasarım kısıtları: `SOZLESME.md` §1.

## Ne yapıldı

İstenen 26 görsel, belirtilen adlarla `assets/` altına kaydedildi. `assets/LISTE.md` dahil klasör toplamı 7,123,959 bayt (7.12 MB); 40 MB sınırının altında. Kod dosyalarına yazılmadı. Projede yalnız `assets/` çıktıları ve açıkça istenen bu rapor oluşturuldu.

Yerleşik `image_gen` aracı kullanıldı. Her varlık ayrı çağrıda üretildi; gökyüzüne uzak hayalî şehir silueti için bir ek düzenleme yapıldı. Menü ve yükleme sahneleri üretilen Zifir referansını kullandı. Cephe ışık haritaları ilgili cephelerden, roughness haritası ıslak asfalt görselinden türetildi. API/CLI yedeği kullanılmadı.

Pillow/NumPy ile hedef çözünürlükler, JPEG kalite 88 ve alfa koruyan PNG dönüşümü uygulandı. Tekrarlanan dokularda offset + karşılıklı kenar harmanlaması yapıldı. Cephe emissive haritaları her hücrenin gerçek pencere camı maskesine hizalandı; duvar ve çerçeve alanları siyaha alındı. Neonlara filtreleme için saydam kenar boşluğu eklendi. Gökyüzünün yatay birleşimi harmanlandı, kutupları yumuşatıldı. Geçici işlem dosyaları `/tmp` altında tutuldu.

## Doğrulananlar

- Beklenen 26 dosyanın tamamı mevcut, açılıyor ve piksel boyutları görevle eşleşiyor. Robot referansı, ölçüsü belirtilmediği için 1024×1024 seçildi.
- 15 JPEG dosyasının nicemleme tabloları kalite 88 çıktısıyla karşılaştırıldı. 11 PNG dosyasının RGBA modu ve gerçekten saydam pikselleri doğrulandı.
- Dört cephede 64 pencere hücresi bulundu. Sırasıyla 34, 35, 34 ve 32 pencere ışıklandırıldı. JPEG öncesi pencere maskesi dışında aydınlık piksel sayısı sıfır.
- Asfalt roughness dosyası tek kanallı gri ton (L). Koyu su birikintileri ve açık pürüzlü asfalt bölgeleri görsel olarak kontrol edildi.
- Son 26 görsel açılıp kontrol edildi; saydam görseller koyu fon üzerinde incelendi. Türkçe tabela metinleri, logo, karakterler ve afiş kompozisyonları gözden geçirildi.
- Tekrarlanan dokular 2×2 döşeme görünümünde; dört cephe ve ışık haritası ayrıca üst üste birleştirilerek incelendi. Keskin birleşim çizgisi görülmedi.
- JPEG sonrası karşılıklı kenarların ortalama mutlak farkı 0–255 ölçeğinde en çok 0,060; dikey birleşimlerde 0,000. Gökyüzünün yatay birleşim farkı 0,016. Bunlar dosya sınırı ölçümleridir; JPEG kayıplı olduğundan her karşılıklı pikselin birebir aynı olduğu iddia edilmez.
- Zifir görsellerinde beyaz damla gözler, kara jöle yüzey, mor-turkuaz Yürek Taşı ve dört sırt dokunacı kontrol edildi. İstenen yasak karakter/marka/amblemler veya tanınan gerçek şehir silueti gözlenmedi.

## Ne doğrulanmadı

- Oyun motoruna entegrasyon, canlı materyal ayarları, bloom şiddeti, küresel gökyüzü görünümü, UV yönü ve oyun içi kamera kadrajları test edilmedi. Bu görev kod değiştirmeden görsel teslimi içindir.
- Radeon RX 550 üzerinde FPS, VRAM tüketimi ve yükleme süresi ölçülmedi. Diskte 7,12 MB olması, GPU belleğinde aynı miktarı kullanacağı anlamına gelmez.
- Üretim kaynakları 1254×1254, 1774×887 veya 1672×941 çıktı; son dosyalar istenen ölçülere dönüştürüldü. Gökyüzü ve menü hedef ölçüye büyütüldü; doğal kaynak çözünürlüğü hedef ölçü kadar değildir.
- Referans paftaları kavramsal modelleme rehberidir; mühendislik hassasiyetinde ortografik ölçüm veya tamamlanmış 3D model değildir. Roughness fiziksel ölçümle kalibre edilmedi.

## Sözleşme notu

`SOZLESME.md` §2 yalnız prosedürel görsel tarif ediyor; bu görev dosyası ise açıkça dosya görselleri istiyor. Bu teslimde özel görsel görevi uygulandı. Mevcut oyun koduna bağlama yapılmadı; başka modüllerin dosyalarına müdahale edilmedi.

## Tam üretim prompt seti

Aşağıdaki metinler yerleşik görsel üretim aracına gönderilen promptlardır. Teknik boyut/kenar/hizalama işlemleri sonradan yukarıdaki yöntemle yapıldı.

### zifir_ref.png

```text
Use case: stylized-concept. Asset type: original video game character reference, square 1024x1024 transparent PNG. Two orthographic full-body views side by side: front view left, side view right of the SAME original Zifir. A friendly cool athletic living glossy jet-black jelly creature, rounded pear-drop head, two large upright white teardrop eyes with rounded bottoms and short upward tips (not slanted superhero mask lenses), no visible mouth. Soft athletic proportions, liquid feet and hands, no clothing. Purple-turquoise glowing irregular heart stone in chest. Exactly four short curling black jelly tentacles emerge from the back, separated and readable. Full body and tentacles contained with padding. Clean high-quality 3D modeling reference, neutral lighting with specular highlights showing black gelatin volume. True transparent background, no ground plane, no checkerboard, no words, no existing characters or logos, no spider symbols, no tongue, teeth, drool, or red-blue costume. Wholly original child-friendly design.
```

### cephe_1.jpg

```text
Use case: stylized-concept. Asset type: seamless square 1024x1024 game texture, cephe_1. Perfect orthographic front view of weathered charcoal concrete apartment facade with dark recessed rectangular windows. EXACTLY EIGHT columns and EIGHT rows of windows in a mathematically regular grid, 64 windows total. Every cell has identical 128x128 proportions; window centered inside cell, all window apertures same size 64 pixels wide and 76 high. Window centers at 64,192,320,448,576,704,832,960 on both axes at 1024 resolution. Uniform dark nighttime albedo, subtle realistic surface grain, windows UNLIT dark neutral blue black. Texture fills canvas; infinite facade with no building silhouette, sky, roof, ground, ledges, text, signs, logos, perspective, cast shadows, gradients or vignette. Opposite edges seamless for repeated tiling horizontally and vertically. Original fictional architecture.
```

### cephe_2.jpg

```text
Use case: stylized-concept. Asset type: seamless square 1024x1024 game texture, cephe_2. Perfect orthographic front view of midnight blue glass curtain wall skyscraper facade, metallic mullions, dark reflective rectangular windows. EXACTLY EIGHT columns and EIGHT rows of windows in a mathematically regular grid, 64 windows total. Every cell has identical 128x128 proportions; window centered inside cell, all window apertures same size 64 pixels wide and 76 high. Window centers at 64,192,320,448,576,704,832,960 on both axes at 1024 resolution. Uniform dark nighttime albedo, subtle realistic surface grain, windows UNLIT dark neutral blue black. Texture fills canvas; infinite facade with no building silhouette, sky, roof, ground, ledges, text, signs, logos, perspective, cast shadows, gradients or vignette. Opposite edges seamless for repeated tiling horizontally and vertically. Original fictional architecture.
```

### cephe_3.jpg

```text
Use case: stylized-concept. Asset type: seamless square 1024x1024 game texture, cephe_3. Perfect orthographic front view of dark brown brick apartment facade with rectangular windows and subtle mortar courses. EXACTLY EIGHT columns and EIGHT rows of windows in a mathematically regular grid, 64 windows total. Every cell has identical 128x128 proportions; window centered inside cell, all window apertures same size 64 pixels wide and 76 high. Window centers at 64,192,320,448,576,704,832,960 on both axes at 1024 resolution. Uniform dark nighttime albedo, subtle realistic surface grain, windows UNLIT dark neutral blue black. Texture fills canvas; infinite facade with no building silhouette, sky, roof, ground, ledges, text, signs, logos, perspective, cast shadows, gradients or vignette. Opposite edges seamless for repeated tiling horizontally and vertically. Original fictional architecture.
```

### cephe_4.jpg

```text
Use case: stylized-concept. Asset type: seamless square 1024x1024 game texture, cephe_4. Perfect orthographic front view of original futuristic graphite panel tower facade with rectangular windows, fine inset panel seams. EXACTLY EIGHT columns and EIGHT rows of windows in a mathematically regular grid, 64 windows total. Every cell has identical 128x128 proportions; window centered inside cell, all window apertures same size 64 pixels wide and 76 high. Window centers at 64,192,320,448,576,704,832,960 on both axes at 1024 resolution. Uniform dark nighttime albedo, subtle realistic surface grain, windows UNLIT dark neutral blue black. Texture fills canvas; infinite facade with no building silhouette, sky, roof, ground, ledges, text, signs, logos, perspective, cast shadows, gradients or vignette. Opposite edges seamless for repeated tiling horizontally and vertically. Original fictional architecture.
```

### cati.jpg

```text
Use case: stylized-concept. Asset type: 1024x1024 seamless game surface texture. weathered charcoal tar and fine gravel rooftop floor with subtle rectangular stains left by old ventilation units, no actual raised equipment, no objects. Perfect orthographic directly overhead view, surface fills entire canvas. Realistic material grain, evenly distributed details, neutral flat nighttime lighting, no vignette, no perspective, no hard shadows, no text or logos. Perfectly tileable on both axes; opposite edge patterns connect continuously.
```

### asfalt_islak.jpg

```text
Use case: stylized-concept. Asset type: 1024x1024 seamless game surface texture. rain soaked dark asphalt, fine aggregate grain and irregular shallow smooth puddles, subtle cool violet night reflections, no road stripes, no lane markings, no road edges. Perfect orthographic directly overhead view, surface fills entire canvas. Realistic material grain, evenly distributed details, neutral flat nighttime lighting, no vignette, no perspective, no hard shadows, no text or logos. Perfectly tileable on both axes; opposite edge patterns connect continuously.
```

### kaldirim.jpg

```text
Use case: stylized-concept. Asset type: 1024x1024 seamless game surface texture. dark gray sidewalk concrete paving slabs in regular staggered layout with fine joint gaps and small weathering, no curb or road edges. Perfect orthographic directly overhead view, surface fills entire canvas. Realistic material grain, evenly distributed details, neutral flat nighttime lighting, no vignette, no perspective, no hard shadows, no text or logos. Perfectly tileable on both axes; opposite edge patterns connect continuously.
```

### gokyuzu.jpg

```text
Use case: stylized-concept. A 2048x1024 2:1 EQUIRECTANGULAR full 360-degree night sky environment texture. Upper half: purple and deep navy clouds, stars, one large luminous moon placed at longitude 80 degrees and altitude 25 degrees. Horizon exactly along horizontal centerline, only extremely distant faint imaginary neon-city glow and low invented silhouettes, no recognizable buildings. Lower hemisphere fades into dark violet mist. Full longitude wraps seamlessly left to right. Polar regions smooth, no text, logos or existing city. Suitable for inside of a sky sphere, not a normal perspective photograph.
```

Son düzenleme:

```text
Use case: precise-object-edit. Input: existing original 2:1 equirectangular night sky game panorama. Change ONLY the thin horizon band around the horizontal midpoint: add a very distant tiny invented skyline of varied geometric futuristic buildings, with a few faint purple and turquoise glowing windows and atmospheric neon light haze. This must read as a FARAWAY imaginary city rather than mountains. Keep buildings small, maximum height 4 percent of total image, spread across the whole horizon, never recognizable real landmarks. Keep the exact existing moon, stars, purple navy clouds, upper sky and lower mist hemisphere unchanged. Maintain full 360 equirectangular layout and seamlessly wrapping left/right edges, 2048x1024 target, no text, logos or characters.
```

### neon_1.png

```text
Use case: logo-brand. Asset type: Turkish neon shop sign game sprite on TRUE TRANSPARENT background, landscape 2:1 layout for 512x256 PNG. Exact sole text: "ÇAY 24". Preserve all Turkish diacritics and dotted capital İ correctly. Large centered readable uppercase original lettering made of bright luminous neon glass tubes, warm amber and turquoise, thin white hot cores, beautiful soft colored light halo with translucent alpha. Thin minimalist rounded tube border around lettering, generous transparent margin so glow is not cropped. Facing camera straight on, no perspective. No wall, no backing board, no wires, no ground shadow, no other text, no existing brand symbols, no checkerboard. Original fictional Turkish night-city storefront sign.
```

### neon_2.png

```text
Use case: logo-brand. Asset type: Turkish neon shop sign game sprite on TRUE TRANSPARENT background, landscape 2:1 layout for 512x256 PNG. Exact sole text: "ROBOTAMİR". Preserve all Turkish diacritics and dotted capital İ correctly. Large centered readable uppercase original lettering made of bright luminous neon glass tubes, turquoise and violet, thin white hot cores, beautiful soft colored light halo with translucent alpha. Thin minimalist rounded tube border around lettering, generous transparent margin so glow is not cropped. Facing camera straight on, no perspective. No wall, no backing board, no wires, no ground shadow, no other text, no existing brand symbols, no checkerboard. Original fictional Turkish night-city storefront sign.
```

### neon_3.png

```text
Use case: logo-brand. Asset type: Turkish neon shop sign game sprite on TRUE TRANSPARENT background, landscape 2:1 layout for 512x256 PNG. Exact sole text: "KUMRU". Preserve all Turkish diacritics and dotted capital İ correctly. Large centered readable uppercase original lettering made of bright luminous neon glass tubes, warm orange, thin white hot cores, beautiful soft colored light halo with translucent alpha. Thin minimalist rounded tube border around lettering, generous transparent margin so glow is not cropped. Facing camera straight on, no perspective. No wall, no backing board, no wires, no ground shadow, no other text, no existing brand symbols, no checkerboard. Original fictional Turkish night-city storefront sign.
```

### neon_4.png

```text
Use case: logo-brand. Asset type: Turkish neon shop sign game sprite on TRUE TRANSPARENT background, landscape 2:1 layout for 512x256 PNG. Exact sole text: "SİMİT". Preserve all Turkish diacritics and dotted capital İ correctly. Large centered readable uppercase original lettering made of bright luminous neon glass tubes, violet and amber, thin white hot cores, beautiful soft colored light halo with translucent alpha. Thin minimalist rounded tube border around lettering, generous transparent margin so glow is not cropped. Facing camera straight on, no perspective. No wall, no backing board, no wires, no ground shadow, no other text, no existing brand symbols, no checkerboard. Original fictional Turkish night-city storefront sign.
```

### neon_5.png

```text
Use case: logo-brand. Asset type: Turkish neon sign game sprite, TRUE TRANSPARENT background, wide 2:1 canvas for 512x256 PNG. Exact sole text: "GECE MARKET". Preserve Turkish dotted capital İ. Large readable uppercase original lettering made of luminous neon glass tubes, turquoise, white-hot cores and soft translucent halo. Thin minimalist neon tube border, generous clear margin so no glow is cropped.  Straight front view, no perspective. No wall, backing board, wires, ground, checkerboard, extra words or existing brands. Original fictional Turkish night-city signage.
```

### neon_6.png

```text
Use case: logo-brand. Asset type: Turkish neon sign game sprite, TRUE TRANSPARENT background, wide 2:1 canvas for 512x256 PNG. Exact sole text: "LUNAPARK". Preserve Turkish dotted capital İ. Large readable uppercase original lettering made of luminous neon glass tubes, violet and amber, white-hot cores and soft translucent halo. Thin minimalist neon tube border, generous clear margin so no glow is cropped.  Straight front view, no perspective. No wall, backing board, wires, ground, checkerboard, extra words or existing brands. Original fictional Turkish night-city signage.
```

### neon_7.png

```text
Use case: logo-brand. Asset type: Turkish neon sign game sprite, TRUE TRANSPARENT background, wide 2:1 canvas for 512x256 PNG. Exact sole text: "PAS YOK!". Preserve Turkish dotted capital İ. Large readable uppercase original lettering made of luminous neon glass tubes, orange and turquoise, white-hot cores and soft translucent halo. Thin minimalist neon tube border, generous clear margin so no glow is cropped.  Straight front view, no perspective. No wall, backing board, wires, ground, checkerboard, extra words or existing brands. Original fictional Turkish night-city signage.
```

### neon_8.png

```text
Use case: logo-brand. Asset type: Turkish neon sign game sprite, TRUE TRANSPARENT background, wide 2:1 canvas for 512x256 PNG. Exact sole text: "ZİFİR". Preserve Turkish dotted capital İ. Large readable uppercase original lettering made of luminous neon glass tubes, purple and turquoise, white-hot cores and soft translucent halo. Thin minimalist neon tube border, generous clear margin so no glow is cropped. Beside text include an original compact purple-turquoise jelly-drop emblem with two upright white teardrop eyes; friendly, not a mask or spider. Straight front view, no perspective. No wall, backing board, wires, ground, checkerboard, extra words or existing brands. Original fictional Turkish night-city signage.
```

### menu_arka.jpg

```text
Use case: stylized-concept. Asset type: cinematic original game main menu background, landscape 16:9 1920x1080. Input image is character identity reference only: use exactly the same friendly jet-black glossy living-jelly Zifir with upright white droplet eyes, droplet head, athletic cute body, glowing purple-turquoise heart stone and four black back tentacles. ONE Zifir dynamically swinging from one fictional neon city tower toward another, suspended by a long taut black jelly tendril attached to a tower at top right; four back tentacles curve through the air, two arms and two legs anatomically clear. Character in RIGHT two-thirds, clear silhouette, motion, cinematic dramatic height. LEFT THIRD is quiet deep navy-purple mist with low contrast, usable empty space for a logo, no text. Purple and turquoise city light, wet reflections, stylized premium 3D game illustration. No real landmarks, existing characters, spider emblems, red-blue clothing, tongue, teeth, drool, logos or words.
```

### yukleniyor.jpg

```text
Use case: stylized-concept. Asset type: original game loading background, 1280x720 16:9 landscape. Use input solely as character identity reference. ONE same friendly glossy black living-jelly Zifir crouched on a rooftop ledge, looking across a wholly fictional distant neon night city. Three-quarter side view so one white upright droplet eye and purple-turquoise chest heart stone are visible, four distinct short black tentacles curl behind him. Large moon behind, purple navy clouds, turquoise and warm amber windows, quiet cinematic mood, detailed wet roof and atmospheric depth. Rounded drop head and soft athletic jelly body as reference. No text, no known characters or city landmarks, no spider emblems, red-blue outfit, tongue, teeth, drool.
```

### robot_ref.png

```text
Use case: stylized-concept. Asset type: original child-friendly game robot modeling reference, square 1024x1024 PNG, TRUE TRANSPARENT background. Two full body orthographic views front and side of the SAME lovable clumsy Pas Robot. Compact rusty orange sheet-metal body, one and ONLY ONE oversized turquoise camera eye on round asymmetrical head, little blunt antenna, stubby mechanical arms with rounded pincers, spring joints, oversized rounded feet, rivets and worn orange paint. No weapons. Warm humorous personality, stylized premium 3D render with clear surfaces and proportions. Original invention unrelated to any existing robot franchise or logo. No labels, letters, ground plane, checkerboard or background. All parts contained with padding.
```

### logo.png

```text
Use case: logo-brand. Asset type: original Turkish game logo, TRUE TRANSPARENT background, 2:1 landscape composition 1024x512. Sole exact word "ZİFİR", spelled Z, dotted uppercase İ, F, dotted uppercase İ, R. Large bold custom readable 3D letters made of fluid shiny jet-black jelly, soft liquid rounded edges and a few graceful jelly drips hanging from letters. Luminous purple and turquoise edge glow and glossy specular highlights make black letters readable on dark backgrounds. Centered, all drips and glow fully inside frame with generous transparent margin. No extra words, characters, known brands, symbols, backdrop, shadow plane or checkerboard.
```

### cephe_1_isik.jpg

```text
Use case: precise-object-edit. Asset type: emissive companion map for the supplied facade game texture, same square aspect. Keep camera, crop and EXACT eight by eight window positions and window sizes pixel-aligned with input. Replace every wall, border, sill and mullion with PURE BLACK #000000. Within roughly half the 64 window interiors only, add illuminated flat warm pale yellow or cool pale blue window glass, randomly distributed. Other window interiors pure black. Window mullions stay black. No glow spilling onto walls, no bloom, no gradients across canvas, no new windows, no text. This is a technical emissive texture, only lit window panes on absolute black, not a lit building illustration. Same 8 columns by 8 rows as input.
```

### cephe_2_isik.jpg

```text
Use case: precise-object-edit. Asset type: emissive companion map for the supplied facade game texture, same square aspect. Keep camera, crop and EXACT eight by eight window positions and window sizes pixel-aligned with input. Replace every wall, border, sill and mullion with PURE BLACK #000000. Within roughly half the 64 window interiors only, add illuminated flat warm pale yellow or cool pale blue window glass, randomly distributed. Other window interiors pure black. Window mullions stay black. No glow spilling onto walls, no bloom, no gradients across canvas, no new windows, no text. This is a technical emissive texture, only lit window panes on absolute black, not a lit building illustration. Same 8 columns by 8 rows as input.
```

### cephe_3_isik.jpg

```text
Use case: precise-object-edit. Asset type: emissive companion map for the supplied facade game texture, same square aspect. Keep camera, crop and EXACT eight by eight window positions and window sizes pixel-aligned with input. Replace every wall, border, sill and mullion with PURE BLACK #000000. Within roughly half the 64 window interiors only, add illuminated flat warm pale yellow or cool pale blue window glass, randomly distributed. Other window interiors pure black. Window mullions stay black. No glow spilling onto walls, no bloom, no gradients across canvas, no new windows, no text. This is a technical emissive texture, only lit window panes on absolute black, not a lit building illustration. Same 8 columns by 8 rows as input.
```

### cephe_4_isik.jpg

```text
Use case: precise-object-edit. Asset type: emissive companion map for the supplied facade game texture, same square aspect. Keep camera, crop and EXACT eight by eight window positions and window sizes pixel-aligned with input. Replace every wall, border, sill and mullion with PURE BLACK #000000. Within roughly half the 64 window interiors only, add illuminated flat warm pale yellow or cool pale blue window glass, randomly distributed. Other window interiors pure black. Window mullions stay black. No glow spilling onto walls, no bloom, no gradients across canvas, no new windows, no text. This is a technical emissive texture, only lit window panes on absolute black, not a lit building illustration. Same 8 columns by 8 rows as input.
```

### asfalt_islak_parlak.jpg

```text
Use case: precise-object-edit. Asset type: grayscale PBR roughness map, square 1024x1024, directly corresponding to supplied wet asphalt texture. Preserve exact original puddle shapes and locations, same crop, scale and alignment. Convert smooth water puddles to DARK gray values about 25/255 (smooth glossy). Rough exposed aggregate asphalt must be LIGHT gray about 175/255, with fine grayscale grain variations. No colored pixels, no shadows or baked lighting, no added shapes, no lane markings. All pixels encode roughness only, dark means polished water, light means rough asphalt. Seamless tileable on both axes.
```
