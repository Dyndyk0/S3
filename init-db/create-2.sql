CREATE TABLE ValueMetadata (
    id SERIAL PRIMARY KEY,
    keyMetadata_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (keyMetadata_id) REFERENCES KeyMetadata(id)
);

CREATE TABLE MetadataTemplate (
    id SERIAL PRIMARY KEY,
    keyMetadata_id INT NOT NULL,
    template_id INT NOT NULL,
    FOREIGN KEY (keyMetadata_id) REFERENCES KeyMetadata(id),
    FOREIGN KEY (template_id) REFERENCES Template(id)
);