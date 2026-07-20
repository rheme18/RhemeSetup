# 🚀 RhemeSetup — Format Sonrası Otomatik Kurulum ve Sistem Optimizasyon Aracı

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg)
![Architecture](https://img.shields.io/badge/architecture-HTA%20%7C%20ActiveX%20%7C%20WScript-orange.svg)
![Backend](https://img.shields.io/badge/backend-winget%20%7C%20PowerShell-blueviolet.svg)

**RhemeSetup**, Windows'u sıfırdan kurduktan sonra ihtiyaç duyulan uygulama indirme, sistemde yüklü gereksiz yazılımları kaldırma ve performans optimizasyonu işlemlerini tek bir modern, koyu temalı arayüzde birleştiren **tamamen .HTA (HTML Application) tabanlı, kurulum gerektirmeyen (portable)** bir sistem yöneticisi aracıdır.

Arka planda Windows'un yerleşik **`winget` (Windows Package Manager)** paket yöneticisini, `PowerShell` ve `WScript.Shell` (ActiveX) bileşenlerini kullanarak işlemleri yüksek hız ve güvenilirlikle tamamlar.

---

## 🛠️ Mimari ve Çalışma Mantığı

* **Ön Yüz (Frontend):** HTML5, CSS3 (Custom Properties & Flexbox) ve Vanilla JavaScript (`Trident/MSHTML` motoru ile uyumlu ES5/ES6 polyfill mimarisi).
* **Arka Yüz (Backend):** `ActiveXObject("WScript.Shell")` ve `ActiveXObject("Scripting.FileSystemObject")` üzerinden sistem seviyesinde PowerShell/CMD komut yürütme.
* **Paket Yönetimi:** Real-time `winget search`, `winget install` ve `winget uninstall` süreçleri.
* **Terminal Akışı:** Standart komut satırı çıktılarını (`StdOut` / `StdErr`) asenkron olarak okuyup HTA içerisindeki canlı terminal paneline aktaran ara katman.

---

## ✨ Öne Çıkan Özellikler

### 📥 1. Uygulama İndir & Toplu Kurulum
* **Kategorize Edilmiş Kataloğu:** Tarayıcılar 🌐, İletişim 💬, Oyun 🎮, Medya 🎵, Geliştirici Araçları 💻, Ofis 📄 ve Sistem Araçları 🧰 başlıklarında 30+ popüler ön tanımlı yazılım.
* **Canlı Arama (Real-time Winget Search):** Arama kutusundan `winget` veritabanında anlık sorgu atarak katalog dışındaki uygulamaları bulma ve ekleme.
* **Toplu Yükleme:** Birden fazla uygulamayı seçerek arka planda tek tıkla sessiz (silent) modda kurma.

### 🗑️ 2. Uygulama Kaldır (Uninstaller)
* **Yüklü Yazılım Taraması:** Registry (`HKLM` / `HKCU` Uninstaller dizinleri) ve `winget list` üzerinden sistemdeki tüm üçüncü taraf ve UWP uygulamaları listeleme.
* **Esnek Silme Opsiyonları:** 
  * Tekli hızlı silme (Her satırda onay mekanizmalı 🗑️ butonu, işlem sonrası "❌ Kaldırıldı" durum etiketi).
  * Çoklu seçim ile toplu kaldırma desteği.

### ⚡ 3. Roket Hızlandırma (Performance Tweaks)
* **Önbellek & Çöp Temizliği:** `%TEMP%`, `Prefetch`, `SoftwareDistribution\Download` temizliği.
* **Ağ Optimizasyonu:** `ipconfig /flushdns` ve Winsock sıfırlama.
* **Güç & Performans:** "Yüksek Performans" / "Nihai Performans" (Ultimate Performance) güç planını aktifleştirme.
* **Görsel Optimizasyon:** Gereksiz sistem animasyonlarını ve saydamlık efektlerini kapatarak gecikmeyi (input lag) düşürme.

### ⚙️ 4. Detaylı Sistem Ayarları (Privacy & Tweaks)
* **Gizlilik & Telemetri:** Windows Telemetri ve veri toplama servislerini ($DiagTrack$) devre dışı bırakma.
* **Kaynak Tasarrufu:** Xbox Game DVR, Cortana ve Hazırda Bekletme (`hiberfil.sys`) kapatma.
* **RAM Temizliği:** Kapanışta ve boşta duran bellek sayfasını otomatik boşaltma stratejileri.

### 🎨 5. Modern Arayüz ve Dayanıklılık
* **Koyu (Dark) Tema:** Neon mavi/camgöbeği vurgular, akıcı UI geçişleri.
* **Çevrimdışı / Çökmeye Dayanıklı İkon Sistem:** İkonlar varsayılan olarak CDN üzerinden çekilir. Bağlantı kesilirse veya CDN yanıt vermezse otomatik olarak **gömülü SVG/Base64 yedek ikonlara** düşer (Fallback mechanism).

---

## 🔒 Güvenlik ve Yetki Kontrolü

* **Yönetici Hakkı Kontrolü (UAC):** Program açılışta `WScript.Shell` üzerinden yönetici yetkilerini denetler. Yetki yetersizse kullanıcıya tek tıkla **"Yönetici Olarak Yeniden Başlat"** seçeneği sunar.
* **Winget Kontrolü:** Sistemde `winget` ortam değişkeni tanımlı değilse kullanıcıyı uyarır ve *Microsoft Store (App Installer)* yükleme bağlantısına yönlendirir.

---

## 🚀 Kullanım

1. [Releases](../../releases) sayfasından `RhemeSetup.exe` dosyasını indirin.
2. Dosyaya sağ tıklayıp **"Yönetici olarak çalıştır"** seçeneğini seçin (veya arayüzdeki yükseltme butonunu kullanın).
3. Sol menüden yapmak istediğiniz işlemi seçin:
   * **📥 Uygulama İndir:** İstediğiniz yazılımları işaretleyin ve **"Seçilenleri Kur"** butonuna basın.
   * **🗑️ Uygulama Kaldır:** Kaldırmak istediğiniz uygulamaları seçip silme işlemini başlatın.
   * **⚡ Roket Hızlandırma / ⚙️ Detaylı Ayarlar:** Uygulamak istediğiniz tweak'leri işaretleyip onaylayın.
4. Sol alt köşedeki **Canlı Terminal** panelinden arka planda çalışan komutların çıktılarını anlık izleyin. 🟢

---

## 📋 Gereksinimler

* **İşletim Sistemi:** Windows 10 (Build 1809 ve üzeri) / Windows 11
* **Paket Yöneticisi:** `winget` (Windows App Installer - Güncel Windows 10/11 sürümlerinde gömülü gelir).
* **Yetki:** Kayıt defteri (Registry) ve servis müdahaleleri için **Yönetici (Administrator)** hakları.

---

## ⚠️ Önemli Uyarılar ve Sorumluluk Reddi

> **Warning**
> * **Registry & Sistem Müdahalesi:** Bu araç doğrudan komut satırı ve Kayıt Defteri (`reg.exe`) üzerinde değişiklik yapar. Ne yaptığınızdan emin olmadığınız tweak'leri uygulamadan önce **Sistem Geri Yükleme Noktası** oluşturmanız önerilir.
> * **False-Positive Tespiti:** `.hta` dosyaları doğası gereği `ActiveXObject` kullandığından, bazı antivirüs veya Windows SmartScreen yazılımları hatalı alarm (False-Positive) verebilir. Kod tamamen açık kaynaktır; çalıştırmadan önce `.hta` dosyasını bir metin editörüyle inceleyebilirsiniz.
> * **Geri Alınamaz İşlemler:** Temizlik ve bazı kayıt defteri optimizasyonları geri alınamayabilir.
> * **Bağımsızlık:** Bu proje resmi bir Microsoft veya Winget ürünü değildir; topluluk tarafından geliştirilmiş açık kaynaklı bir araçtır.

---

## 🤝 Katkıda Bulunma (Contributing)

Pull Request'ler ve Issue bildirimleri memnuniyetle karşılanır! 
* Yeni uygulama kategorisi / `winget ID` önerileri
* Yeni sistem tweak / performans optimize fikirleri
* Arayüz ve performans iyileştirmeleri

için lütfen önce bir **Issue** açarak tartışma başlatın. 💡

---

## 📜 Lisans

Bu proje **[MIT Lisansı](LICENSE)** ile lisanslanmıştır. Dilediğiniz gibi kullanabilir, değiştirebilir ve dağıtabilirsiniz. 🎉
