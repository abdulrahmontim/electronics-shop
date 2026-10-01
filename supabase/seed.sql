insert into public.products (slug, name, description, category, price_ngn, image_url, in_stock)
values
('arduino-uno-r3-compatible-board', 'Arduino Uno R3 compatible board', 'Versatile microcontroller board ideal for prototyping electronics projects.', 'Boards', 14500, null, true),
('esp32-devkit-v1', 'ESP32 DevKit V1', 'Wi-Fi and Bluetooth enabled development board for IoT applications.', 'Boards', 11000, null, true),
('breadboard-830-points', 'Breadboard 830 points', 'Reusable solderless breadboard for quick circuit prototyping.', 'Parts', 3800, null, true),
('jumper-wire-set-120-pieces', 'Jumper wire set 120 pieces', 'Assorted male-to-male, male-to-female and female-to-female jumper wires.', 'Parts', 3200, null, true),
('resistor-kit-600-pieces', 'Resistor kit 600 pieces', 'Comprehensive resistor kit with common values for electronics work.', 'Kits', 8500, null, true),
('capacitor-kit-300-pieces', 'Capacitor kit 300 pieces', 'Mixed ceramic and electrolytic capacitors for circuit designs.', 'Kits', 7500, null, true),
('led-kit-300-pieces', 'LED kit 300 pieces', 'Assorted 5 mm LEDs in multiple colours for lighting projects.', 'Kits', 4500, null, true),
('ne555-timer-ic-pack-of-10', 'NE555 timer IC pack of 10', 'Reliable timer ICs suitable for astable and monostable circuits.', 'Parts', 3500, null, true),
('soldering-iron-60-w-adjustable', 'Soldering iron 60 W adjustable', 'Adjustable temperature soldering iron for electronics repairs.', 'Tools', 12000, null, true),
('digital-multimeter', 'Digital multimeter', 'Accurate handheld multimeter for measuring voltage, current and resistance.', 'Tools', 9500, null, true),
('hc-sr04-ultrasonic-sensor', 'HC-SR04 ultrasonic sensor', 'Distance measuring sensor for robotics and automation projects.', 'Sensors', 2500, null, true),
('sg90-micro-servo', 'SG90 micro servo', 'Compact servo motor for precise angular control in projects.', 'Sensors', 2800, null, true)
on conflict (slug) do nothing;