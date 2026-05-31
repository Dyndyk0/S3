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

INSERT INTO _Role (name) VALUES
('admin'),
('user');

-- CREATE TABLE UserFile (
--     id SERIAL PRIMARY KEY,
--     --rights VARCHAR(255),
--     file_id INT,
--     user_id INT,
--     FOREIGN KEY (file_id) REFERENCES File(id),
--     FOREIGN KEY (user_id) REFERENCES _User(id)
-- );

-- CREATE TABLE FileGroup (
--     id SERIAL PRIMARY KEY,
--     group_id INT,
--     file_id INT,
--     FOREIGN KEY (group_id) REFERENCES Group(id),
--     FOREIGN KEY (file_id) REFERENCES File(id)
-- );