CREATE TABLE KeyMetadata (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE File (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    last_updated TIMESTAMP,
    is_uploaded BOOLEAN NOT NULL,
    is_deleted BOOLEAN NOT NULL
);

CREATE TABLE Template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
