-- Dhobi Clinic V2 — full schema (fresh rebuild)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop V1 objects if present (fresh rebuild)
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS scan_logs         CASCADE;
DROP TABLE IF EXISTS stage_logs        CASCADE;
DROP TABLE IF EXISTS status_logs       CASCADE;
DROP TABLE IF EXISTS order_items       CASCADE;
DROP TABLE IF EXISTS orders            CASCADE;
DROP TABLE IF EXISTS bags              CASCADE;
DROP TABLE IF EXISTS fcm_tokens        CASCADE;
DROP TABLE IF EXISTS item_types        CASCADE;
DROP TABLE IF EXISTS students          CASCADE;
DROP TABLE IF EXISTS staff             CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ============ USERS / PROFILES ============
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  role              VARCHAR(10) NOT NULL CHECK (role IN ('student','worker','admin')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  notification_prefs JSONB NOT NULL DEFAULT '{"accepted":true,"ready_for_collection":true,"delivered":true,"exception":true}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enrollment_no VARCHAR(30) UNIQUE,
  hostel        VARCHAR(50),
  room_number   VARCHAR(20),
  phone         VARCHAR(20)
);

CREATE TABLE staff (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  staff_code     VARCHAR(30) UNIQUE,
  specialty_role VARCHAR(30),         -- optional, display/filter only (not enforced)
  phone          VARCHAR(20)
);

-- ============ ITEM CATALOG ============
CREATE TABLE item_types (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key       VARCHAR(40) NOT NULL UNIQUE,
  label     VARCHAR(60) NOT NULL,
  category  VARCHAR(10) NOT NULL CHECK (category IN ('large','small')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============ BAGS ============
CREATE TABLE bags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_number  VARCHAR(20) NOT NULL UNIQUE,          -- DHB-####
  qr_token    VARCHAR(64) NOT NULL UNIQUE,          -- opaque, permanent
  student_id  UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable until assigned
  issue_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ ORDERS ============
CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id                  UUID NOT NULL REFERENCES bags(id),
  student_id              UUID NOT NULL REFERENCES users(id),
  current_stage           VARCHAR(25) NOT NULL DEFAULT 'requested'
                          CHECK (current_stage IN ('requested','submitted','accepted','sorting',
                            'washing','drying','ironing','quality_check','ready_for_collection','delivered')),
  current_stage_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_handler_id      UUID REFERENCES users(id),
  exception_state         VARCHAR(20) CHECK (exception_state IN ('on_hold','damaged','reported_missing','investigation')),
  expected_completion_time TIMESTAMPTZ,
  actual_completion_time  TIMESTAMPTZ,
  collection_otp          VARCHAR(6),
  otp_generated_at        TIMESTAMPTZ,
  delivery_verified_by    UUID REFERENCES users(id),
  delivery_verified_at    TIMESTAMPTZ,
  delivery_method         VARCHAR(20),
  rework_count            INT NOT NULL DEFAULT 0,
  ack_color_bleed         BOOLEAN NOT NULL DEFAULT FALSE,
  ack_pockets_emptied     BOOLEAN NOT NULL DEFAULT FALSE,
  remarks                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at            TIMESTAMPTZ,
  ready_at                TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ
);

CREATE TABLE order_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(40) NOT NULL,
  category  VARCHAR(10) NOT NULL CHECK (category IN ('large','small')),
  quantity  INT NOT NULL CHECK (quantity > 0)
);

-- ============ LOGS (attribution + audit) ============
CREATE TABLE stage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bag_id          UUID NOT NULL REFERENCES bags(id),
  stage           VARCHAR(25) NOT NULL,
  worker_id       UUID REFERENCES users(id),
  kind            VARCHAR(12) NOT NULL DEFAULT 'advance' CHECK (kind IN ('advance','rework','exception')),
  notes           TEXT,
  duration_seconds INT,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scan_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id      UUID NOT NULL REFERENCES bags(id),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  worker_id   UUID REFERENCES users(id),
  stage       VARCHAR(25),
  device      VARCHAR(20),
  remarks     TEXT,
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id  UUID REFERENCES orders(id) ON DELETE SET NULL,
  bag_id    UUID REFERENCES bags(id) ON DELETE SET NULL,
  category  VARCHAR(25) NOT NULL,
  title     VARCHAR(200) NOT NULL,
  body      TEXT NOT NULL,
  is_read   BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fcm_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  device     VARCHAR(10) CHECK (device IN ('android','ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ INDEXES (scale ~8,000 bags) ============
CREATE INDEX idx_stage_logs_bag      ON stage_logs(bag_id);
CREATE INDEX idx_stage_logs_order    ON stage_logs(order_id);
CREATE INDEX idx_stage_logs_worker   ON stage_logs(worker_id);
CREATE INDEX idx_stage_logs_time     ON stage_logs(completed_at);
CREATE INDEX idx_scan_logs_bag       ON scan_logs(bag_id);
CREATE INDEX idx_scan_logs_order     ON scan_logs(order_id);
CREATE INDEX idx_scan_logs_worker    ON scan_logs(worker_id);
CREATE INDEX idx_scan_logs_time      ON scan_logs(scanned_at);
CREATE INDEX idx_orders_stage        ON orders(current_stage);
CREATE INDEX idx_orders_handler      ON orders(current_handler_id);
CREATE INDEX idx_orders_exception    ON orders(exception_state);
CREATE INDEX idx_orders_expected     ON orders(expected_completion_time);
CREATE INDEX idx_orders_student      ON orders(student_id);
CREATE INDEX idx_orders_bag          ON orders(bag_id);
CREATE INDEX idx_bags_student        ON bags(student_id);
CREATE INDEX idx_notifications_user  ON notifications(user_id);
