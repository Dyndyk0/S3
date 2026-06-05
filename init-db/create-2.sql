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

CREATE TABLE File (
    id SERIAL PRIMARY KEY,
    template_id INT,
    creator_id INT NOT NULL,
    last_editor_id INT,
    name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    date_upload TIMESTAMP,
    last_updated TIMESTAMP,
    is_uploaded BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (template_id) REFERENCES Template(id),
    FOREIGN KEY (creator_id) REFERENCES _User(id),
    FOREIGN KEY (last_editor_id) REFERENCES _User(id)
);

CREATE TABLE UserRole (
    id SERIAL PRIMARY KEY,
    user_id INT not null,
    role_id INT not null,
    FOREIGN KEY (user_id) REFERENCES _User(id),
    FOREIGN KEY (role_id) REFERENCES _Role(id),
    UNIQUE(user_id, role_id)
);

-- CREATE TABLE UserGroup (
--     id SERIAL PRIMARY KEY,
--     role VARCHAR(255),
--     user_id INT,
--     FOREIGN KEY (user_id) REFERENCES _User(id)
-- );