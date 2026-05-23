CREATE TABLE KeyMetadata (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'text',
    CONSTRAINT chk_metadata_type CHECK (data_type IN ('text', 'number', 'boolean', 'date', 'select'))
);

CREATE TABLE File (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    date_upload TIMESTAMP,
    last_updated TIMESTAMP,
    is_uploaded BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE Template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
