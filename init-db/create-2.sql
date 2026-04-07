CREATE TABLE CategoryMetadata (
    id SERIAL PRIMARY KEY,
    typeMetadata_id INT,
    name VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (typeMetadata_id) REFERENCES TypeMetadata(id)
);
