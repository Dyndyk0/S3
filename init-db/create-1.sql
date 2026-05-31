CREATE TABLE KeyMetadata (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'text',
    CONSTRAINT chk_metadata_type CHECK (data_type IN ('text', 'number', 'boolean', 'date', 'select'))
);

CREATE TABLE Template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE _User (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE _Role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- CREATE TABLE Group (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL
-- );
