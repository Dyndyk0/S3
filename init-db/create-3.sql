CREATE TABLE Metadata (
    id SERIAL PRIMARY KEY,
    file_id INT NOT NULL,
    valueMetadata_id INT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES File(id),
    FOREIGN KEY (valueMetadata_id) REFERENCES ValueMetadata(id)
);