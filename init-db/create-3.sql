CREATE TABLE Metadata (
    id SERIAL PRIMARY KEY,
    file_id INT NOT NULL,
    categoryMetadata_id INT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES File(id),
    FOREIGN KEY (categoryMetadata_id) REFERENCES CategoryMetadata(id)
);