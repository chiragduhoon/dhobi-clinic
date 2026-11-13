-- Admin: admin@dhobiclinic.com / Admin@1234  (bcrypt hash of 'Admin@1234')
INSERT INTO users (name, email, password_hash, role)
VALUES ('Super Admin', 'admin@dhobiclinic.com',
        '$2a$10$j/8RmRNR5LU/w7q8wt4iUuC2GbjNIj8rxxIvoxOJJzzm5YjTX/t02', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Item catalog (Bennett rules: large vs small)
INSERT INTO item_types (key, label, category) VALUES
  ('shirt',        'Shirt',         'large'),
  ('tshirt',       'T-Shirt',       'large'),
  ('trouser',      'Trouser',       'large'),
  ('jeans',        'Jeans',         'large'),
  ('kurta',        'Kurta',         'large'),
  ('kurta_pyjama', 'Kurta Pyjama',  'large'),
  ('bedsheet',     'Bedsheet',      'large'),
  ('pillowcase',   'Pillow Cover',  'large'),
  ('towel',        'Towel',         'large'),
  ('jacket',       'Jacket',        'large'),
  ('sweater',      'Sweater',       'large'),
  ('shorts',       'Shorts',        'large'),
  ('socks',        'Socks',         'small'),
  ('handkerchief', 'Handkerchief',  'small'),
  ('undergarment', 'Undergarment',  'small')
ON CONFLICT (key) DO NOTHING;
