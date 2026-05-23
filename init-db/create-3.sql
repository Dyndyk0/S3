CREATE TABLE Metadata (
    id SERIAL PRIMARY KEY,
    file_id INT NOT NULL,
    keyMetadata_id INT NOT NULL,

    value_string TEXT,                  -- для текста
    value_number DOUBLE PRECISION,      -- для чисел
    value_boolean BOOLEAN,              -- для да/нет
    value_date TIMESTAMP,               -- для дат
    valueMetadata_id INT,

    FOREIGN KEY (file_id) REFERENCES File(id),
    FOREIGN KEY (keyMetadata_id) REFERENCES KeyMetadata(id),
    FOREIGN KEY (valueMetadata_id) REFERENCES ValueMetadata(id)
);