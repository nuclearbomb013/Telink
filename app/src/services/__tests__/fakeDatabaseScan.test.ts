/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(process.cwd(), 'src');

const formalRuntimeFiles = [
  'services/user.service.ts',
  'services/message.service.ts',
  'services/moment.service.ts',
  'services/follow.service.ts',
  'services/articles.service.ts',
  'services/notification.service.ts',
  'context/AuthContext.tsx',
  'components/Message/ChatWindow.tsx',
  'hooks/useFollow.ts',
  'hooks/useMessages.ts',
  'hooks/useMoments.ts',
];

describe('formal frontend business services do not use fake database stores', () => {
  it('does not reference legacy localStorage business database keys or mock datasets', () => {
    const forbiddenPatterns = [
      'techink_users_data',
      'techink_messages',
      'MOCK_',
      'INITIAL_',
      'DEFAULT_CURRENT_USER',
    ];

    for (const relativePath of formalRuntimeFiles) {
      const content = fs.readFileSync(path.join(root, relativePath), 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(content, `${relativePath} should not contain ${pattern}`).not.toContain(pattern);
      }
    }
  });
});
