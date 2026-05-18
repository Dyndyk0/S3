/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FilesPage } from './components/FilesPage';
import { TemplatesPage } from './components/TemplatesPage';
import { KeysPage } from './components/KeysPage';
import { ValuesPage } from './components/ValuesPage';
import { MinioPage } from './components/MinioPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<FilesPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="keys" element={<KeysPage />} />
          <Route path="values" element={<ValuesPage />} />
          <Route path="minio" element={<MinioPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

