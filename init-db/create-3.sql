CREATE TABLE Metadata (
    id SERIAL PRIMARY KEY,
    file_id INT NOT NULL,
    typeMetadata_id INT NOT NULL,
    categoryMetadata_id INT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES File(id),
    FOREIGN KEY (typeMetadata_id) REFERENCES TypeMetadata(id),
    FOREIGN KEY (categoryMetadata_id) REFERENCES CategoryMetadata(id)
);

INSERT INTO TypeMetadata (name) VALUES ('Тип документа'), ('Тип файла');