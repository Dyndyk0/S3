CREATE TABLE CategoryMetadata (
    id SERIAL PRIMARY KEY,
    typeMetadata_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (typeMetadata_id) REFERENCES TypeMetadata(id)
);
