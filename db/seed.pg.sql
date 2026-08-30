-- db/seed.pg.sql — dihasilkan otomatis. Jalankan SETELAH db/schema.pg.sql.
-- Aman diulang (ON CONFLICT / hapus-lalu-isi untuk foto).

INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('blushing-blooms','Blushing Blooms','premium-wrapped','Premium Wrapped','Hydrangea, Lisianthus, Delphinium, Carnation, Cinerea','40–50 cm diameter',2350000,NULL,NULL,'Made to impress combination of premium imported roses beautifully tied in a wrapped gift bouquet — tinted hydrangeas settled in lisianthus, locally grown roses, peach novia carnations and glamorous delphiniums.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1jBRL11cqD8zanKZe0N7SyKwqzB6IbGsj',NULL,0,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('blush-amethyst-orchestra','Blush Amethyst Orchestra','premium-wrapped','Premium Wrapped','Roses, carnation, delphinium, peony mums, eucalyptus leaf','40–50 cm diameter',1750000,NULL,NULL,'Layering wrapped arrangement orchestrating tinted peony mums, locally grown roses and pink two-toned carnations touched with premium delphiniums, finished with eucalyptus foliage.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1ZXK5ikHWLXiUsewo79QjqcdF0rU_dcvl',NULL,1,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('love-symphony-no-2','Love Symphony No. 2','premium-wrapped','Premium Wrapped','Peony mum, Lisianthus, Perizii','35 cm',750000,NULL,NULL,'A charming bouquet celebrating sweetness and joy — vibrant peony chrysanthemums complemented by pink lisianthus and airy Limonium Perezii.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1hlTxEdUlGaWDP7tU7un0LGDXy4Jy9Q7H',NULL,2,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('velvet-bloom-orchestra','Velvet Bloom Orchestra','premium-wrapped','Premium Wrapped','Peony mum, Peach carnation, Pink lisianthus, Limonium Perezii, Eucalyptus','45 cm',1750000,NULL,NULL,'A graceful bouquet radiating warmth through coral and blush tones — lush peony chrysanthemums with soft peach carnations, pink lisianthus, Limonium Perezii and eucalyptus.',NULL,NULL,NULL,3,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('love-symphony','Love Symphony','premium-wrapped','Premium Wrapped','Roses, Peony Mum, Carnations','35 cm diameter',750000,NULL,3,'Symphony of tinted purple peony mums, locally grown roses and pink two-toned yukari cherry carnations — long-lasting vase life and harmonious colour.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1D_5Wqj4AyzNI5zXJPHpuTa9p8R_oRfNv',NULL,4,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('hello-sunshine','Hello Sunshine','premium-wrapped','Premium Wrapped','Sunflowers, Roses, Perizi, Eucalyptus Leaf','30 cm diameter',750000,NULL,NULL,'Inspired by sunflowers that follow the sun — lasting sunflowers and locally grown roses in a bed of fillers and foliage, tightly wrapped.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1YGyNTudybVPzV4POK29cvpCvCCFFE_ZB',NULL,5,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('catch-your-eyes','Catch Your Eyes','premium-wrapped','Premium Wrapped','Roses, Lisianthus, Perizi, Eucalyptus Leaf','45 cm',1350000,NULL,NULL,'A radiant bouquet — cheerful sunflowers with elegant white roses, white lisianthus, Limonium Perezii and fresh eucalyptus. Yellow and soft white, timeless.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1J6soNE1xxR_RGadzgW5kr9lCiSchAM19',NULL,6,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('love-symphony-in-white','Love Symphony in White','premium-wrapped','Premium Wrapped','Carnation, Matricaria','30 cm diameter',750000,NULL,NULL,'A timeless bouquet of purity and grace — elegant white carnations paired with delicate matricaria. Simple yet sophisticated.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1nDJ0MCFnMcH2_SsvdgaDW3pe-aCxnjUr',NULL,7,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('romantic-glow','Romantic Glow','premium-wrapped','Premium Wrapped','Roses (10 Sophia Loren)','30 cm diameter',750000,'Standard (Local) 750.000 · Extra Size (Local) 1.050.000 · Premium (Import) 950.000 · Extra Size (Premium) 1.450.000',NULL,'10 stems of Sophia Loren roses in soft pink, enhanced with warm LED fairy lights for a magical glow.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Mq1ENYu1Yd7ltgOltZ58eUJeyq3GeVGx',NULL,8,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('eternal-flame','Eternal Flame','premium-wrapped','Premium Wrapped','Roses (10 LC Sexy Red)','30 cm diameter',750000,'Standard (Local) 750.000 · Extra Size (Local) 1.050.000 · Premium (Import) 950.000 · Extra Size (Premium) 1.450.000',NULL,'10 stems of LC Sexy Red roses accented with warm LED fairy lights — a deep expression of love and admiration.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Mq1ENYu1Yd7ltgOltZ58eUJeyq3GeVGx',NULL,9,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('endless-romance','Endless Romance','premium-wrapped','Premium Wrapped','Roses (LC Sexy Red), Cinerea','35 cm diameter',950000,NULL,NULL,'Premium LC Sexy Red roses complemented by fragrant cinerea eucalyptus — rich crimson blooms with soft silvery-green foliage.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Tgs7P2sXYRxWA_QPLBTYa7LvfooXnUnN',NULL,10,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('charming-blossom','Charming Blossom','premium-wrapped','Premium Wrapped','Roses, Oxypetalum','35 cm diameter',1650000,NULL,NULL,'Caffè Latte garden roses and Mayra’s White garden roses with light pink roses and airy blue oxypetalum — soft blush, creamy white and pastel blue.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1ml6oypBEzOfBhftGeI8rB9XEoxlGChSs',NULL,11,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('bloome-pastel','Bloome Pastel','premium-wrapped','Premium Wrapped','Caspea, Gerbera, Loropetalum, Pittosporum, Carnation, Roses','40 cm diameter',700000,NULL,NULL,'Cool Water roses with green peony mums, boheme carnations and cinerea eucalyptus — pastel tones and natural textures.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1s4vIoveH84ZKPGzvosfndyHfuTe_qUdP',NULL,12,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('royal-scarlett','Royal Scarlett','premium-wrapped','Premium Wrapped','Double Miranda Tulip, Loropetalum, Roses (Red Naomi), Peony Mum','45 cm diameter',850000,NULL,NULL,'Double Miranda tulips paired with velvety Red Naomi roses, smoke denim peony mums and loropetalum marron foliage.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1N9gRZzpXz50AKn8YxXgW1w2FKrg9C54H',NULL,13,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('daiselle-bliss','Daiselle Bliss','premium-wrapped','Premium Wrapped','Gompie, Matricaria, Lepidium, Moleka','30 cm diameter',400000,NULL,NULL,'Cheerful white gomphrena with airy lepidium, dainty matricaria and graceful moleka — crisp white flowers with soft green accents.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/10iiKDI2K0R2VpYdFAIomyMCPRd78R-rD',NULL,14,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('ether-blanc','Ether Blanc','premium-wrapped','Premium Wrapped','Roses (Avalanche), Peony Mum, Carnation, Caspea, Cinerea','45 cm diameter',950000,NULL,NULL,'Avalanche roses with smoke denim peony mums, navy tinted carnations, Limonium caspea and cinerea eucalyptus — ivory, smoky blue and silvery green.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Gh7Iy2zPUsg5knIWLU5OHJmRaHV855wz',NULL,15,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('azure-bloom','Azure Bloom','premium-wrapped','Premium Wrapped','Oxypetalum, Caspea, Pingpong, Blue Phalaenopsis Orchid, Peony Mum, Statice','45 cm diameter',NULL,'By request',NULL,'Graduation bouquet in soft blue and white — blue phalaenopsis orchids, white pom-pom chrysanthemums, blue chrysanthemums and a graduation doll.','Graduation, Congratulations, Achievement Celebration, New Beginnings','https://drive.google.com/drive/folders/1UhDcIgvVkbu9BiVV2eiKOpaernEfIuYU',NULL,16,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('blush-meadow','Blush Meadow','premium-wrapped','Premium Wrapped','Carnation, Oxypetalum, Lepidium','30 cm diameter',NULL,'By request',NULL,'Soft blush carnations with delicate blue blooms and lush airy greenery, wrapped in refined white paper with pastel ribbons.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1za8ADg5rn-jxTvM21kQy6hK4zgk7mRBm',NULL,17,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('celestine','Celestine','premium-wrapped','Premium Wrapped','Carnation, Hydrangea, Peony Mum, Loropetalum','40–50 cm diameter',850000,NULL,NULL,'Lush blue chrysanthemums, fresh green hydrangeas and cream carnations accented with eucalyptus in soft burgundy and silvery tones.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/15Gd2cpX2H_wGtOJ7S-1FebWyKabw0vB5',NULL,18,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('flora-daylight','Flora Daylight','premium-wrapped','Premium Wrapped','Roses, Peony Mum, Matricaria, Thalaspi, Moleka','40 cm diameter',850000,NULL,NULL,'Vibrant yellow roses, soft peach blooms and sculptural white disbud chrysanthemums with petite white daisies — meadow-inspired.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Mg6BieuXLU8AJ6RdIEKonR95YGWyJ9fr',NULL,19,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('lumiere','Lumiere','premium-wrapped','Premium Wrapped','Ranunculus, Roses, Tulip, Caspea','40 cm diameter',850000,'Standard (Local) 850.000 · Extra (Import) 1.500.000',NULL,'Exquisite white blooms with delicate wild foliage and lush green accents, wrapped in champagne-toned cotton paper.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1LAwTa4Vf4FpXM2LCb4kT_TxVZxgBPpjs',NULL,20,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('petal-crown','Petal Crown','premium-wrapped','Premium Wrapped','Roses, Baby Breath','35 cm diameter',750000,NULL,NULL,'Peach garden roses with airy baby’s breath — lush layered petals, warm peach tones, effortlessly elegant.','Happy Birthday, I Love You, Happy Graduation','https://drive.google.com/drive/folders/171iskc_HoPM1Pe_I2cF4wflCdWgoA_Az',NULL,21,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('pink-muse','Pink Muse','premium-wrapped','Premium Wrapped','Gypso, Eucalyptus, Peony Mum, Roses, Tulip','40 cm diameter',750000,NULL,NULL,'Soft blush roses, pink peony mum and purple tulip with airy baby’s breath and fresh greenery — feminine and elegant.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/17dDXH41WCkEe-b4wKlIdstqM5XEzgAEj',NULL,22,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('roselle-verdant','Roselle Verdant','premium-wrapped','Premium Wrapped','Roses, Peony Mum, Cinerea, Carnation','40 cm diameter',700000,NULL,NULL,'Soft lavender and blush tones — delicate roses, ruffled carnations and lush chrysanthemums accented with fresh eucalyptus.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1WckA4E7APU1_n1hGKIMe-HjSASt4k0wD',NULL,23,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('sunflower-bliss','Sunflower Bliss','premium-wrapped','Premium Wrapped','Sunflower, Statice, Baby Blue','35 cm diameter',500000,NULL,NULL,'Vibrant sunflowers with delicate white filler flowers and eucalyptus, accented with gold-toned leaves and finished in white wrap.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/11clUo4xKVATdLr6xaia7akZpXR4xJxwU',NULL,24,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('a-natures-whisper','A Nature''s Whisper','bloom-box','Bloom Box','Roses, Gompie, Carnations, Lisianthus, Eucalyptus, Delphinium','Standard 30 stems / 15 cm · Extra 50 stems / 20 cm',1375000,'Standard 1.375.000 · Extra 1.950.000',NULL,'Graceful pink blush monochromatic blooms — Dutch and local roses, gompie chrysanthemums, double-toned carnations, lisianthus and eucalyptus with shooting delphiniums.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1h-zrpghFfBqxudcYoC1H4RCb6F3-2gxD','Large Arrangement',25,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('rose-allure','Rosé Allure','bloom-box','Bloom Box','Roses, Eucalyptus Leaf','Medium 30 stems / 15 cm · Large 50 stems / 20 cm',950000,'Medium 950.000 · Large 1.500.000',NULL,'Fresh locally grown Holland roses combined with eucalyptus foliage in a blooming box — timeless and fully fragranced.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1h-zrpghFfBqxudcYoC1H4RCb6F3-2gxD','Medium Arrangement',26,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('a-handful-flower-box','A Handful Flower Box','bloom-box','Bloom Box','Roses (12 stems, Pink Xpression Garden)','60 cm long rectangular box',950000,NULL,NULL,'12 stems of premium South American roses in a box — simplicity in quality roses with ANIA satin ribbon, lasting up to 10 days.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1gk6t_EHAeoKN7JIZOiy82h39DZUbTx_R','Large Arrangement',27,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('oh-my-cherie-amour','Oh My Chérie Amour','bloom-box','Bloom Box','Roses (12 stems, imported)','20 cm square box',950000,NULL,NULL,'Premium South American roses styled in modern design — 12 stems with fillers, perfect for a surprise reveal.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1Qsuvc93A28xZbh2KCqFIPFhowu9siRUe','Medium Arrangement',28,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('summer-in-a-basket','Summer in A Basket','bloom-box','Basket','Gerbera, Ranunculus, Lisianthus, Gompie, Pittosporum','20×15 cm, handle 20 cm',1550000,NULL,NULL,'Joy and happiness in a basket — gerbera spiders, dancing butterfly ranunculus, lisianthus and gompie mums with pittosporum foliage.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1yMw6pwSAaMjQ0QJNAVoAZpVKeZ3uKOsf','Medium Arrangement',29,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('papillon-lumera','Papillon Lumera','bloom-box','Bloom Box','Tulip, Hydrangea, Roses (Ivory Mondial, Be Sweet), Red Baby Rose','20 cm diameter box',1150000,NULL,NULL,'Pastel violet dyed tulips, blue vervain hydrangeas, ivory Mondial roses, Be Sweet roses and red baby roses in our signature hat box.','Happy Birthday, I Love You, Happy Graduation, Speedy Recovery','https://drive.google.com/drive/folders/1BnpTPRjoHYr0yC_KUQA7BYJaYhwvPjtY',NULL,30,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('heavenly-tribute','Heavenly Tribute','standing','Standing','Roses, lily, chrysanthemum spray, gypsophila, leather leaf',NULL,NULL,'By request',NULL,'Condolences cross flowers — a sincere floral tribute in loving memory.','Condolences',NULL,NULL,31,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('violet-whisper','Violet Whisper','standing','Standing','Gompie, chrysanthemum zembla, phalaenopsis, statice, peony chrysanthemum, song of india, philodendron',NULL,NULL,'By request',NULL,'A graceful standing tribute to honour a beautiful life.','Condolences',NULL,NULL,32,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('celestial-garden','Celestial Garden','standing','Standing','Gompie, chrysanthemum zembla, phalaenopsis, statice, lisianthus, song of india, philodendron',NULL,NULL,'By request',NULL,'Standing flowers arranged with respect and heartfelt sympathy.','Condolences',NULL,NULL,33,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('ivory-haven','Ivory Haven','standing','Standing','Hydrangea, lisianthus, phalaenopsis, leather leaf, lily, ivy, amaranthus',NULL,NULL,'By request',NULL,'With sympathy and respect, expressed through flowers.','Condolences',NULL,NULL,34,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('sacred-embrace','Sacred Embrace','standing','Standing','Roses, hydrangea, leather leaf, chrysanthemum spray, gypsophila, dracaena reflexa',NULL,NULL,'By request',NULL,'A refined display of white blooms and fresh greenery to express sympathy and heartfelt condolences.','Condolences',NULL,NULL,35,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('seraphic-peace','Seraphic Peace','standing','Standing','Roses, carnation, hydrangea, chrysanthemum zembla, song of india, leather leaf',NULL,NULL,'By request',NULL,'An all-white standing arrangement to offer comfort and honour a cherished life.','Condolences',NULL,NULL,36,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('nude-elegance','Nude Elegance','standing','Standing','Roses, carnation, eucalyptus, phalaenopsis, leather leaf, astrantia',NULL,NULL,'By request',NULL,'A breathtaking premium flower standing designed in a soft nude palette.','Congratulations, Grand Opening',NULL,NULL,37,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('emerald-symphony','Emerald Symphony','standing','Standing','Roses, hydrangea, lily, lisianthus, carnation, leather leaf, eucalyptus',NULL,NULL,'By request',NULL,'A charming standing bouquet of soft pink and white blooms with fresh hydrangeas.','Congratulations, Grand Opening',NULL,NULL,38,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('premium-congratulation-board','Premium Congratulation Flower Board','standing','Flower Board','—','1.5m × 2m · 1.8m × 2m',NULL,'By request',NULL,'Beautifully arranged flowers with a stylish congratulatory sign.','Congratulation, Grand Opening',NULL,NULL,39,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('sympathy-flower-board','Sympathy Flower Board','standing','Flower Board','—','1.5m × 2m · 1.8m × 2m',NULL,'By request',NULL,'Flowers and sympathy sign.','Condolences',NULL,NULL,40,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('golden-serenity','Golden Serenity','vase','Vase','Peony chrysanthemum, gompie, cymbidium, eucalyptus, pussy willow, roses, spray roses, carnation',NULL,NULL,'By request',NULL,'Where fresh blooms meet timeless elegance.',NULL,NULL,NULL,41,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('aurelia-bloom','Aurelia Bloom','vase','Vase','Hydrangea, roses, iris, achillea, peony, eucalyptus',NULL,NULL,'By request',NULL,'A bold arrangement of pink blossoms, purple flowers and fresh eucalyptus.',NULL,NULL,NULL,42,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('floral-odyssey','Floral Odyssey','vase','Vase','Brassica, roses, peony, pittosporum, pistacia leaves, forsythia',NULL,NULL,'By request',NULL,'An elegant arrangement of soft blooms and airy branches — a graceful, artistic floral statement.',NULL,NULL,NULL,43,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('amber-bloom','Amber Bloom','vase','Vase','Roses, peony, astrantia, scabiosa, ranunculus, pittosporum, pistacia leaves',NULL,NULL,'By request',NULL,'A vibrant blend of pink blooms and lush greenery, full of warmth and natural charm.',NULL,NULL,NULL,44,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('addon-plush-doll','Plush Doll','accessory','Add-on','—',NULL,50000,NULL,NULL,'A cuddly plush doll to pair with your bouquet.',NULL,NULL,NULL,45,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('addon-balloon','Balloon','accessory','Add-on','—',NULL,100000,NULL,NULL,'A helium balloon to make the surprise pop.',NULL,NULL,NULL,46,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('addon-cake','Cake','accessory','Add-on','—',NULL,300000,NULL,NULL,'A sweet cake to complete the celebration.',NULL,NULL,NULL,47,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES ('addon-chocolate','Chocolate','accessory','Add-on','—',NULL,125000,NULL,NULL,'A box of chocolates alongside your flowers.',NULL,NULL,NULL,48,'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();

DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE slug IN ('blushing-blooms','blush-amethyst-orchestra','love-symphony-no-2','love-symphony','hello-sunshine','catch-your-eyes','love-symphony-in-white','romantic-glow','eternal-flame','endless-romance','charming-blossom','bloome-pastel','royal-scarlett','daiselle-bliss','ether-blanc','azure-bloom','blush-meadow','celestine','flora-daylight','lumiere','petal-crown','pink-muse','roselle-verdant','sunflower-bliss','a-natures-whisper','rose-allure','a-handful-flower-box','oh-my-cherie-amour','summer-in-a-basket','papillon-lumera'));
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blushing-blooms-1.jpg', 0 FROM products WHERE slug = 'blushing-blooms';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blushing-blooms-2.jpg', 1 FROM products WHERE slug = 'blushing-blooms';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blushing-blooms-3.jpg', 2 FROM products WHERE slug = 'blushing-blooms';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-amethyst-orchestra-1.jpg', 0 FROM products WHERE slug = 'blush-amethyst-orchestra';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-amethyst-orchestra-2.jpg', 1 FROM products WHERE slug = 'blush-amethyst-orchestra';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-amethyst-orchestra-3.jpg', 2 FROM products WHERE slug = 'blush-amethyst-orchestra';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-no-2-1.jpg', 0 FROM products WHERE slug = 'love-symphony-no-2';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-no-2-2.jpg', 1 FROM products WHERE slug = 'love-symphony-no-2';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-no-2-3.jpg', 2 FROM products WHERE slug = 'love-symphony-no-2';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-1.jpg', 0 FROM products WHERE slug = 'love-symphony';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-2.jpg', 1 FROM products WHERE slug = 'love-symphony';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-3.jpg', 2 FROM products WHERE slug = 'love-symphony';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'hello-sunshine-1.jpg', 0 FROM products WHERE slug = 'hello-sunshine';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'hello-sunshine-2.jpg', 1 FROM products WHERE slug = 'hello-sunshine';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'catch-your-eyes-1.jpg', 0 FROM products WHERE slug = 'catch-your-eyes';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'catch-your-eyes-2.jpg', 1 FROM products WHERE slug = 'catch-your-eyes';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-in-white-1.jpg', 0 FROM products WHERE slug = 'love-symphony-in-white';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'love-symphony-in-white-2.jpg', 1 FROM products WHERE slug = 'love-symphony-in-white';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'romantic-glow-1.jpg', 0 FROM products WHERE slug = 'romantic-glow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'romantic-glow-2.jpg', 1 FROM products WHERE slug = 'romantic-glow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'romantic-glow-3.jpg', 2 FROM products WHERE slug = 'romantic-glow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'eternal-flame-1.jpg', 0 FROM products WHERE slug = 'eternal-flame';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'eternal-flame-2.jpg', 1 FROM products WHERE slug = 'eternal-flame';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'endless-romance-1.jpg', 0 FROM products WHERE slug = 'endless-romance';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'endless-romance-2.jpg', 1 FROM products WHERE slug = 'endless-romance';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'charming-blossom-1.jpg', 0 FROM products WHERE slug = 'charming-blossom';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'bloome-pastel-1.jpg', 0 FROM products WHERE slug = 'bloome-pastel';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'bloome-pastel-2.jpg', 1 FROM products WHERE slug = 'bloome-pastel';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'bloome-pastel-3.jpg', 2 FROM products WHERE slug = 'bloome-pastel';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'royal-scarlett-1.jpg', 0 FROM products WHERE slug = 'royal-scarlett';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'royal-scarlett-2.jpg', 1 FROM products WHERE slug = 'royal-scarlett';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'royal-scarlett-3.jpg', 2 FROM products WHERE slug = 'royal-scarlett';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'daiselle-bliss-1.jpg', 0 FROM products WHERE slug = 'daiselle-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'daiselle-bliss-2.jpg', 1 FROM products WHERE slug = 'daiselle-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'daiselle-bliss-3.jpg', 2 FROM products WHERE slug = 'daiselle-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'ether-blanc-1.jpg', 0 FROM products WHERE slug = 'ether-blanc';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'ether-blanc-2.jpg', 1 FROM products WHERE slug = 'ether-blanc';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'ether-blanc-3.jpg', 2 FROM products WHERE slug = 'ether-blanc';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'azure-bloom-1.jpg', 0 FROM products WHERE slug = 'azure-bloom';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'azure-bloom-2.jpg', 1 FROM products WHERE slug = 'azure-bloom';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-meadow-1.jpg', 0 FROM products WHERE slug = 'blush-meadow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-meadow-2.jpg', 1 FROM products WHERE slug = 'blush-meadow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'blush-meadow-3.jpg', 2 FROM products WHERE slug = 'blush-meadow';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'celestine-1.jpg', 0 FROM products WHERE slug = 'celestine';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'celestine-2.jpg', 1 FROM products WHERE slug = 'celestine';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'celestine-3.jpg', 2 FROM products WHERE slug = 'celestine';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'flora-daylight-1.jpg', 0 FROM products WHERE slug = 'flora-daylight';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'flora-daylight-2.jpg', 1 FROM products WHERE slug = 'flora-daylight';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'flora-daylight-3.jpg', 2 FROM products WHERE slug = 'flora-daylight';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'lumiere-1.jpg', 0 FROM products WHERE slug = 'lumiere';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'lumiere-2.jpg', 1 FROM products WHERE slug = 'lumiere';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'lumiere-3.jpg', 2 FROM products WHERE slug = 'lumiere';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'petal-crown-1.jpg', 0 FROM products WHERE slug = 'petal-crown';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'petal-crown-2.jpg', 1 FROM products WHERE slug = 'petal-crown';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'petal-crown-3.jpg', 2 FROM products WHERE slug = 'petal-crown';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'pink-muse-1.jpg', 0 FROM products WHERE slug = 'pink-muse';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'pink-muse-2.jpg', 1 FROM products WHERE slug = 'pink-muse';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'roselle-verdant-1.jpg', 0 FROM products WHERE slug = 'roselle-verdant';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'roselle-verdant-2.jpg', 1 FROM products WHERE slug = 'roselle-verdant';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'roselle-verdant-3.jpg', 2 FROM products WHERE slug = 'roselle-verdant';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'sunflower-bliss-1.jpg', 0 FROM products WHERE slug = 'sunflower-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'sunflower-bliss-2.jpg', 1 FROM products WHERE slug = 'sunflower-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'sunflower-bliss-3.jpg', 2 FROM products WHERE slug = 'sunflower-bliss';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-natures-whisper-1.jpg', 0 FROM products WHERE slug = 'a-natures-whisper';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-natures-whisper-2.jpg', 1 FROM products WHERE slug = 'a-natures-whisper';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-natures-whisper-3.jpg', 2 FROM products WHERE slug = 'a-natures-whisper';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'rose-allure-1.jpg', 0 FROM products WHERE slug = 'rose-allure';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'rose-allure-2.jpg', 1 FROM products WHERE slug = 'rose-allure';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'rose-allure-3.jpg', 2 FROM products WHERE slug = 'rose-allure';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-handful-flower-box-1.jpg', 0 FROM products WHERE slug = 'a-handful-flower-box';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-handful-flower-box-2.jpg', 1 FROM products WHERE slug = 'a-handful-flower-box';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'a-handful-flower-box-3.jpg', 2 FROM products WHERE slug = 'a-handful-flower-box';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'oh-my-cherie-amour-1.jpg', 0 FROM products WHERE slug = 'oh-my-cherie-amour';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'oh-my-cherie-amour-2.jpg', 1 FROM products WHERE slug = 'oh-my-cherie-amour';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'oh-my-cherie-amour-3.jpg', 2 FROM products WHERE slug = 'oh-my-cherie-amour';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'summer-in-a-basket-1.jpg', 0 FROM products WHERE slug = 'summer-in-a-basket';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'summer-in-a-basket-2.jpg', 1 FROM products WHERE slug = 'summer-in-a-basket';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'summer-in-a-basket-3.jpg', 2 FROM products WHERE slug = 'summer-in-a-basket';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'papillon-lumera-1.jpg', 0 FROM products WHERE slug = 'papillon-lumera';
INSERT INTO product_images (product_id, filename, position) SELECT id, 'papillon-lumera-2.jpg', 1 FROM products WHERE slug = 'papillon-lumera';

INSERT INTO users (username, pass_hash) VALUES ('admin', '$2a$10$YAnU07fiwYZSGx4JLVdqXe.sOCv1VKQ/f9RJBAh87ueMVjbCO0cFy')
ON CONFLICT (username) DO UPDATE SET pass_hash = EXCLUDED.pass_hash;
