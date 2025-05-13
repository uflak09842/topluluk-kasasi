# Topluluk Kasası
Oyuncu topluluğu için geliştirdiğim çözüm.
# Sorunlar
1. Oyunun api servisi olmaması ve güvenlik endişelerinden dolayı veri gönderilecek port açılamaması kaynaklı topluluğa ait banka sistemi oyun dışında kullanılamıyordu. 
2. Oyun içinde herhangi bir özel arayüz sistemi yoktu, sadece topluluk kasasına giren/çıkan paranın işlemi yapan kişi bilgisi ile loglandığı statik bir sayfada liste şeklinde tutuluyordu.
# Çözüm
Belirtilen sorunlara çözüm olması için, topluluğun halihazırda kullandığı yöntem olan oyun içi alınan ekran görüntülerinden "chrome-lens-ocr" paketini kullanarak parasal değerleri çektim,
ardından bu değeri kullanıcının bilgileri ile beraber veritabanıma admin onayı için ekledim. Kasaya eklenen paralar güvenlik katmanı olan admin onayından geçtikten sonra asıl veritabanına kaydedildi. 
<br/>
<br/>
### Kurulan yapı sayesinde:
1. sorunun çözümü olarak topluluk kasa verileri discord ortamında kullanılabilir oldu.
2. sorunun çözümü olarak
   - SlashCommandBuilder, EmbedBuilder gibi sınıflar aracılığıyla görsel arayüz zenginleştirildi.
   - /kasa ve /param komutları ile topluluk kasası hakkında detaylı bilgi sahibi olunması sağlandı.
   - /onay, /paraCek komutları ile doğru veri bütünlüğü sağlandı.
   - Log sistemi geliştirildi, kaotik bir yapıya düzen hakim oldu.
