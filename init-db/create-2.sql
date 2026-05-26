CREATE TABLE ValueMetadata (
    id SERIAL PRIMARY KEY,
    keyMetadata_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (keyMetadata_id) REFERENCES KeyMetadata(id)
);

CREATE TABLE MetadataTemplate (
    id SERIAL PRIMARY KEY,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_multiple BOOLEAN NOT NULL DEFAULT false,
    keyMetadata_id INT NOT NULL,
    template_id INT NOT NULL,
    FOREIGN KEY (keyMetadata_id) REFERENCES KeyMetadata(id),
    FOREIGN KEY (template_id) REFERENCES Template(id),
    UNIQUE(keyMetadata_id, template_id)
);

-- CREATE TABLE FileGroup (
--     id SERIAL PRIMARY KEY,
--     group_id INT,
--     file_id INT,
--     FOREIGN KEY (group_id) REFERENCES Group(id),
--     FOREIGN KEY (file_id) REFERENCES File(id)
-- );

-- CREATE TABLE UserGroup (
--     id SERIAL PRIMARY KEY,
--     role VARCHAR(255),
--     user_id INT
--     --FOREIGN KEY (user_id) REFERENCES USER(id),
-- );

-- CREATE TABLE UserFile (
--     id SERIAL PRIMARY KEY,
--     role VARCHAR(255),
--     file_id INT,
--     user_id INT,
--     FOREIGN KEY (file_id) REFERENCES File(id)
--     --FOREIGN KEY (user_id) REFERENCES USER(id),
-- );